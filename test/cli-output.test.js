import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readFile, rm, utimes, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import WebSocket from "ws";

import { AxiError } from "axi-sdk-js";

process.env.TEXTCAST_CHAT_AXI_HOST = "127.0.0.1";
process.env.TEXTCAST_CHAT_AXI_LINK_HOST = "127.0.0.1";

import {
  collapseHomeDirectory,
  createHomeOutput,
  createOpenOutput,
  createPollOutput,
  createServerSpawnOptions,
  createUserEndedOpenOutput,
  isLocalSourceEntry,
  localSourceChangedSince,
  detectInvokingAgent,
  fetchJson,
  getCommandHelp,
  herdrPollChimeEnabled,
  normalizeArgv,
  notifyHerdrPollReady,
  pollInterruptedText,
  pollWaitBannerText,
  pollWaitTickText,
  serverReplacementReason,
  shutdownServerOnPort,
  shouldForceRestartForLocalBuild,
  shouldKillProcessOnPort,
  shouldNarratePollWaitTicks,
  shouldOpenBrowser,
  shouldRestartServer,
  startPollWaitReporter,
  stopCommand,
  VERSION,
} from "../src/cli.js";
import { serve } from "../src/server.js";
import { canonicalFile, sessionKey } from "../src/session-store.js";

async function waitForPollListening(base, key, timeoutMs = 10_000) {
  const socket = new WebSocket(`${base.replace(/^http/, "ws")}/events/${key}`, { origin: base });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("timed out waiting for listening presence")), timeoutMs);
      socket.on("message", (raw) => {
        const message = JSON.parse(String(raw));
        if (message.type !== "agent-presence" || message.data.state !== "listening") return;
        clearTimeout(timer);
        resolve(undefined);
      });
      socket.once("error", reject);
    });
  } finally {
    socket.close();
  }
}

function assertObservablePollWakePath(text) {
  assert.match(text, /Keep the poll in the foreground by default/i);
  assert.match(text, /return the feedback directly to the agent/i);
  assert.match(text, /harness-native tracked background-job facility/i);
  assert.match(text, /guaranteed to resume or notify the same agent/i);
  assert.match(text, /Never use `nohup`/);
  assert.match(text, /shell `&`/);
  assert.match(text, /`disown`/);
  assert.match(text, /redirected fire-and-forget processes/);
  assert.match(text, /detached terminal without an explicit verified callback/);
  assert.match(text, /no completion-aware background facility/i);
  assert.match(text, /verified wake callback into the surrounding supervisor/i);
  assert.match(text, /Do not tell the user the artifact is being monitored until that wake path is live/i);
  assert.doesNotMatch(text, /foreground command may run.*run the poll as a background task/i);
}

test("home help names TEXTCAST_CHAT_AXI_ALLOWED_HOSTS for the 403 forbidden host case", () => {
  const output = createHomeOutput({ bin: "textcast-chat-axi", sessions: [] });
  const hostHelp = output.help.find((item) => item.includes("TEXTCAST_CHAT_AXI_ALLOWED_HOSTS"));

  assert.ok(hostHelp, "home help names the allowlist variable");
  assert.match(hostHelp, /403 `forbidden host`/);
  assert.match(hostHelp, /reverse-proxy/);
  assert.match(hostHelp, /README's Allowed hosts section/);
  assert.doesNotMatch(hostHelp, /whitespace-separated/);
  assert.match(hostHelp, /`textcast-chat-axi stop`/);
});

test("CLI version tracks package.json so release-please bumps reach the published binary", async () => {
  const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  assert.equal(VERSION, packageJson.version);
});

test("open output surfaces unavailable Tailscale phone access", () => {
  const output = createOpenOutput({
    file: "/tmp/artifact.html",
    url: "http://127.0.0.1:4397/session/abc123",
    status: "opened",
    networkWarning: "Tailscale binding failed; there is no phone access.",
  });
  assert.equal(output.network_warning, "Tailscale binding failed; there is no phone access.");
});

test("home output warns agents that poll needs an observable wake path", () => {
  const output = createHomeOutput({ bin: "textcast-chat-axi", sessions: [] });
  const pollHelp = output.help.find((item) => item.includes("textcast-chat-axi poll <html-file>"));

  assert.ok(pollHelp, "home help mentions the poll command");
  assert.match(pollHelp, /long-poll/);
  assert.match(pollHelp, /stays silent/);
  assert.match(pollHelp, /never kill it/);
  assertObservablePollWakePath(pollHelp);
  assert.doesNotMatch(pollHelp, /Codex/);
  assert.match(pollHelp, /re-run/);
  assert.match(pollHelp, /feedback remains queued until delivery/);
  assert.match(pollHelp, /\*\*End session\*\* \(in the window's More menu\) ends the session/);
  assert.match(pollHelp, /feedback sent before it is still delivered once/);
  assert.doesNotMatch(pollHelp, /above 10 minutes/);
});

test("home output tailors poll guidance when invoked under Codex", () => {
  const output = createHomeOutput({ bin: "textcast-chat-axi", sessions: [], agent: "codex" });
  const pollHelp = output.help.find((item) => item.includes("textcast-chat-axi poll <html-file>"));

  assertObservablePollWakePath(pollHelp);
  assert.match(pollHelp, /Codex detected/);
  assert.match(pollHelp, /keep the poll attached to the active turn/);
});

test("home output keeps static skill poll guidance safe and agent-neutral", () => {
  const output = createHomeOutput({ bin: "textcast-chat-axi", sessions: [], agent: "static" });
  const pollHelp = output.help.find((item) => item.includes("textcast-chat-axi poll <html-file>"));

  assertObservablePollWakePath(pollHelp);
  assert.doesNotMatch(pollHelp, /keep the poll attached to the active turn/i);
  assert.doesNotMatch(pollHelp, /Codex detected/);
  assert.match(pollHelp, /feedback remains queued until delivery/);
});

test("invoking agent detection recognizes Codex runtime markers only", () => {
  assert.equal(detectInvokingAgent({ PATH: "/bin", CODEX_SANDBOX: "seatbelt" }), "codex");
  assert.equal(detectInvokingAgent({ PATH: "/bin", CODEX_THREAD_ID: "thread" }), "codex");
  assert.equal(detectInvokingAgent({ PATH: "/bin", CODEX_HOME: "/tmp/codex" }), "generic");
  assert.equal(detectInvokingAgent({ PATH: "/bin", CODEX_EXPERIMENTAL_FEATURE: "1" }), "generic");
  assert.equal(detectInvokingAgent({ PATH: "/bin" }), "generic");
});

test("top-level help renders static home output without dynamic sessions", async () => {
  const stateDir = await mkdtemp(`${os.tmpdir()}/textcast-chat-axi-help-test-`);
  try {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(new URL("../bin/textcast-chat-axi.js", import.meta.url)), "--help"],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        encoding: "utf8",
        env: { ...process.env, TEXTCAST_CHAT_AXI_STATE_DIR: stateDir },
      },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.doesNotMatch(result.stdout, /playbook/);
    assert.match(result.stdout, /reference other filesystem assets/);
    assert.match(result.stdout, /same directory as the HTML file/);
    assert.doesNotMatch(result.stdout, /Tailwind CSS browser runtime v4/);
    assert.doesNotMatch(result.stdout, /textcast-chat-axi design/);
    assert.match(result.stdout, /never kill it/);
    assert.match(result.stdout, /feedback remains queued until delivery/);
    assert.doesNotMatch(result.stdout, /above 10 minutes/);
    assert.doesNotMatch(result.stdout, /textcast-design/);
    assert.doesNotMatch(result.stdout, /sessions\[/);
    assert.doesNotMatch(result.stdout, /Known IDs/);
  } finally {
    await rm(stateDir, { force: true, recursive: true });
  }
});

test("home directory collapse tolerates Windows mixed separators", () => {
  assert.equal(
    collapseHomeDirectory("C:\\Users\\runneradmin/.local/bin/textcast-chat-axi", "C:\\Users\\runneradmin"),
    "~/.local/bin/textcast-chat-axi",
  );
  assert.equal(
    collapseHomeDirectory("C:\\Users\\runneradmin\\.local\\bin\\textcast-chat-axi", "C:\\Users\\runneradmin"),
    "~/.local/bin/textcast-chat-axi",
  );
});

test("open output keeps the user URL in session data and next_step focused on polling", () => {
  const output = createOpenOutput({
    file: "/tmp/artifact.html",
    url: "http://localhost:4397/session/abc123",
    status: "opened",
  });

  assert.equal(output.session.file, "/tmp/artifact.html");
  assert.equal(output.session.url, "http://localhost:4397/session/abc123");
  assert.equal(output.session.status, "opened");
  // Keyword-level lock on the load-bearing semantics of this agent-facing string:
  // poll now (not the user-facing URL), never kill the poll, no --timeout-ms, and the
  // reopen etiquette. Sentence-level phrasing is free to change without touching this test.
  assert.doesNotMatch(output.next_step, /Tell the user (?:to open|to visit)/i);
  assert.doesNotMatch(output.next_step, /http:\/\/localhost:4397\/session\/abc123/);
  assert.match(output.next_step, /Do not respond to the user just yet\. Now you must run/);
  assert.match(output.next_step, /textcast-chat-axi poll \/tmp\/artifact\.html/);
  assert.match(output.next_step, /keep waiting for more feedback/);
  assert.match(output.next_step, /textcast-chat-axi reply \/tmp\/artifact\.html --agent-reply/);
  assert.match(output.next_step, /without starting another long-poll/);
  assert.doesNotMatch(output.next_step, /Layout issues|layout_warnings/);
  assert.match(output.next_step, /never kill it/);
  assertObservablePollWakePath(output.next_step);
  assert.doesNotMatch(output.next_step, /Codex/);
  assert.match(output.next_step, /feedback remains queued until delivery/);
  assert.match(output.next_step, /Do not pass --timeout-ms/);
  assert.match(output.next_step, /If the user ends the session, stop polling and do not reopen it/);
  assert.match(output.next_step, /--reopen/);
});

test("open output gives Codex the shared wake-path contract plus an attached-turn warning", () => {
  const output = createOpenOutput({
    file: "/tmp/artifact.html",
    url: "http://localhost:4397/session/abc123",
    status: "opened",
    agent: "codex",
  });

  assertObservablePollWakePath(output.next_step);
  assert.match(output.next_step, /Codex detected/);
  assert.match(output.next_step, /keep the poll attached to the active turn/);
});

test("a user-ended open refuses with a status agents can branch on, not a URL to open", () => {
  const output = createUserEndedOpenOutput({
    file: "/tmp/artifact.html",
    url: "http://localhost:4397/session/abc123",
  });

  assert.equal(output.session.file, "/tmp/artifact.html");
  assert.equal(output.session.status, "user-ended");
  assert.match(output.next_step, /user explicitly ended this Textcast Chat session from the browser/);
  assert.match(output.next_step, /did not reopen it/);
  assert.match(output.next_step, /Do not reopen unless the user asks for further review/);
  assert.match(output.next_step, /textcast-chat-axi \/tmp\/artifact\.html --reopen/);
});

test("poll help requires an observable wake path", () => {
  const help = getCommandHelp("poll");

  assert.match(help, /long-polls indefinitely/);
  assert.match(help, /stays silent/);
  assert.match(help, /never kill it/);
  assertObservablePollWakePath(help);
  assert.doesNotMatch(help, /Codex/);
  assert.match(help, /feedback remains queued until delivery/);
  assert.match(help, /Do not pass --timeout-ms/);
  assert.match(help, /tests and debugging only/);
  assert.match(help, /\*\*End session\*\* \(in the window's More menu\) ends the session/);
  assert.match(help, /feedback sent before it is still delivered once/);
  assert.doesNotMatch(help, /above 10 minutes/);
});

test("poll help is Codex-aware when requested", () => {
  const help = getCommandHelp("poll", { agent: "codex" });

  assertObservablePollWakePath(help);
  assert.match(help, /Codex detected/);
  assert.match(help, /keep the poll attached to the active turn/);
});

test("feedback next step keeps the next poll completion observable", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "feedback", dom_snapshot: "", prompts: [] },
  });

  assert.equal("artifact_failures" in output, false);
  assert.equal("layout_warnings" in output, false);
  assert.match(output.next_step, /never kill it/);
  assert.match(output.next_step, /without --timeout-ms/);
  assertObservablePollWakePath(output.next_step);
  assert.doesNotMatch(output.next_step, /Codex/);
  assert.match(output.next_step, /feedback remains queued until delivery/);
  assert.match(output.next_step, /Do not respond to the user just yet\. If you are continuing to wait for feedback/);
  assert.doesNotMatch(output.next_step, /above 10 minutes/);
});

test("poll feedback emits prompts, failures, then next step, and no DOM snapshot", async () => {
  const stateDir = await mkdtemp(`${os.tmpdir()}/textcast-chat-axi-poll-output-test-`);
  const artifact = `${stateDir}/artifact.html`;
  await writeFile(artifact, "<html><body>hello</body></html>", "utf8");
  const response = {
    status: "feedback",
    prompts: [{ prompt: "Ship it", tag: "message" }],
    artifact_failures: [{ kind: "artifact-unavailable", detail: "HTTP 404", severity: "fatal" }],
    dom_snapshot: "large snapshot",
  };
  const server = createServer((req, res) => {
    if (new URL(req.url || "/", "http://localhost").pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, app: "textcast-chat-axi", version: VERSION }));
      return;
    }
    if (req.url?.startsWith("/api/poll?")) {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(response));
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== "string");
    const child = spawn(
      process.execPath,
      [
        fileURLToPath(new URL("../bin/textcast-chat-axi.js", import.meta.url)),
        "poll",
        artifact,
        "--timeout-ms",
        "1000",
      ],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        env: { ...process.env, TEXTCAST_CHAT_AXI_STATE_DIR: stateDir, TEXTCAST_CHAT_AXI_PORT: String(address.port) },
      },
    );
    let stdout = "";
    let stderr = "";
    assert.ok(child.stdout);
    assert.ok(child.stderr);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    const result = await new Promise((resolve) => {
      child.on("close", (status, signal) => resolve({ status, signal }));
    });

    assert.equal(result.status, 0, stderr);
    const promptsIndex = stdout.indexOf("prompts[");
    const failuresIndex = stdout.indexOf("artifact_failures[");
    const nextStepIndex = stdout.indexOf("next_step:");
    assert.ok(promptsIndex >= 0, "poll stdout contains prompts");
    assert.ok(failuresIndex >= 0, "poll stdout contains artifact_failures");
    assert.ok(nextStepIndex >= 0, "poll stdout contains next_step");
    assert.equal(stdout.indexOf("dom_snapshot"), -1, "poll stdout carries no DOM snapshot");
    assert.ok(promptsIndex < failuresIndex, "prompts precede artifact_failures in poll stdout");
    assert.ok(failuresIndex < nextStepIndex, "artifact_failures precede next_step in poll stdout");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(stateDir, { force: true, recursive: true });
  }
});

test("feedback next step is Codex-aware when requested", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "feedback", dom_snapshot: "", prompts: [] },
    agent: "codex",
  });

  assertObservablePollWakePath(output.next_step);
  assert.match(output.next_step, /Codex detected/);
  assert.match(output.next_step, /keep the poll attached to the active turn/);
});

test("a fatal artifact failure is the only thing that reaches the agent without user action", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      dom_snapshot: "",
      prompts: [],
      artifact_failures: [
        { kind: "artifact-asset-unavailable", detail: "<img> could not load /artifact/x/logo.png", severity: "fatal" },
      ],
    },
  });

  assert.ok("artifact_failures" in output);
  assert.equal(output.artifact_failures.length, 1);
  assert.match(output.next_step, /1 fatal artifact failure detected/);
  assert.match(output.next_step, /the review surface could not be used/);
  assert.match(output.next_step, /artifact-asset-unavailable/);
});

test("image-attachment feedback tells agents to open the local image paths", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      dom_snapshot: "",
      prompts: [
        {
          uid: "1",
          prompt: "Match this mock",
          selector: "header",
          tag: "header",
          text: "",
          attachments: [
            {
              id: "a".repeat(64) + ".png",
              type: "image",
              path: "/state/attachments/k/" + "a".repeat(64) + ".png",
              mime: "image/png",
              bytes: 1234,
              width: 800,
              height: 600,
              name: "mock.png",
            },
          ],
        },
      ],
    },
  });

  assert.match(output.next_step, /image attachments/);
  assert.match(output.next_step, /`attachments` array/);
  assert.match(output.next_step, /absolute local `path`/);
});

test("feedback without attachments does not mention image attachments", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      dom_snapshot: "",
      prompts: [{ uid: "1", prompt: "Tweak this", selector: "h1", tag: "h1", text: "" }],
    },
  });
  assert.doesNotMatch(output.next_step, /image attachments/);
});

test("a poll reporting the session ended by the user tells the agent to stop and not reopen", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "ended", ended_by: "user" },
  });

  assert.equal(output.session.status, "ended");
  assert.equal(output.session.ended_by, "user");
  assert.match(output.next_step, /user ended this Textcast Chat session/);
  assert.match(output.next_step, /Stop polling/);
  assert.match(output.next_step, /do not run `textcast-chat-axi \/tmp\/report\.html` to reopen it/);
  assert.match(output.next_step, /deliver any remaining updates directly in this conversation/i);
  assert.match(output.next_step, /textcast-chat-axi \/tmp\/report\.html --reopen/);
});

test("a poll reporting an agent-ended session allows a plain reopen if still needed", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "ended", ended_by: "agent" },
  });

  assert.equal(output.session.ended_by, "agent");
  assert.match(output.next_step, /Stop polling/);
  assert.match(output.next_step, /textcast-chat-axi \/tmp\/report\.html`\s+to open a fresh session/);
  assert.doesNotMatch(output.next_step, /--reopen/);
});

test("the final feedback batch before a user end flags session_ended and skips the reopen instruction", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      dom_snapshot: "",
      prompts: [{ uid: "", prompt: "Parting feedback", selector: "", tag: "message", text: "bye" }],
      session_ended: true,
      ended_by: "user",
    },
  });

  assert.equal(output.session.session_ended, true);
  assert.equal(output.session.ended_by, "user");
  assert.match(output.next_step, /last feedback before the user ended the session/);
  assert.match(output.next_step, /Stop polling \/tmp\/report\.html and do not reopen it/);
  assert.match(output.next_step, /textcast-chat-axi \/tmp\/report\.html --reopen/);
  assert.doesNotMatch(output.next_step, /reload or re-open/);
});

test("the final feedback batch before an agent end preserves ended_by and allows plain reopen", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      dom_snapshot: "",
      prompts: [{ uid: "", prompt: "Parting feedback", selector: "", tag: "message", text: "bye" }],
      session_ended: true,
      ended_by: "agent",
    },
  });

  assert.equal(output.session.session_ended, true);
  assert.equal(output.session.ended_by, "agent");
  assert.match(output.next_step, /last feedback before the Textcast Chat session ended/);
  assert.match(output.next_step, /textcast-chat-axi \/tmp\/report\.html`\s+to open a fresh session/);
  assert.doesNotMatch(output.next_step, /--reopen/);
  assert.doesNotMatch(output.next_step, /user ended this Textcast Chat session/);
});

test("final user-ended feedback still reports a fatal artifact failure without reopening", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      prompts: [],
      artifact_failures: [{ kind: "artifact-unavailable", detail: "HTTP 404", severity: "fatal" }],
      session_ended: true,
      ended_by: "user",
    },
  });

  assert.match(output.next_step, /fatal artifact failure/);
  assert.match(output.next_step, /confirm it renders without reopening this ended Textcast Chat session/);
  assert.doesNotMatch(output.next_step, /--reopen/);
});

test("final agent-ended feedback points a fatal artifact failure at a fresh session", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: {
      status: "feedback",
      prompts: [],
      artifact_failures: [{ kind: "artifact-unavailable", detail: "HTTP 404", severity: "fatal" }],
      session_ended: true,
      ended_by: "agent",
    },
  });

  assert.match(output.next_step, /fatal artifact failure/);
  assert.match(output.next_step, /to open a fresh session/);
});

test("poll wait messages tell watching agents the silence is normal", () => {
  const banner = pollWaitBannerText("/tmp/report.html");
  assert.match(banner, /\[textcast-chat-axi\]/);
  assert.match(banner, /Long-polling for user feedback/);
  assert.match(banner, /stays silent/);
  assert.match(banner, /leave it running/i);
  assert.match(banner, /feedback remains queued until delivery/);

  const tick = pollWaitTickText(3 * 60_000);
  assert.match(tick, /\[textcast-chat-axi\]/);
  assert.match(tick, /Still waiting for user feedback \(3m\)/);
  assert.match(tick, /leave this running/i);

  const interrupted = pollInterruptedText("/tmp/report.html");
  assert.match(interrupted, /\[textcast-chat-axi\]/);
  assert.match(interrupted, /Poll interrupted/);
  assert.match(interrupted, /user may still be reviewing/);
  assert.match(interrupted, /textcast-chat-axi poll \/tmp\/report\.html/);
  assert.match(interrupted, /feedback remains queued until delivery/);
});

test("Herdr poll chime is disabled unless both Textcast Chat and Herdr opt in", () => {
  assert.equal(herdrPollChimeEnabled({}), false);
  assert.equal(herdrPollChimeEnabled({ HERDR_ENV: "1" }), false);
  assert.equal(herdrPollChimeEnabled({ TEXTCAST_CHAT_AXI_HERDR_CHIME: "1" }), false);
  assert.equal(herdrPollChimeEnabled({ HERDR_ENV: "1", TEXTCAST_CHAT_AXI_HERDR_CHIME: "0" }), false);
  assert.equal(herdrPollChimeEnabled({ HERDR_ENV: "1", TEXTCAST_CHAT_AXI_HERDR_CHIME: "1" }), true);
});

test("Herdr poll chime requests attention without making notification failure fatal", async () => {
  const calls = [];
  /** @type {import("node:child_process").ChildProcess | undefined} */
  let child;
  const notified = notifyHerdrPollReady({
    env: { HERDR_ENV: "1", TEXTCAST_CHAT_AXI_HERDR_CHIME: "1" },
    runner(command, args, options) {
      calls.push({ command, args, options });
      child = spawn(process.execPath, ["-e", "process.exit(0)"], options);
      return child;
    },
  });

  assert.equal(notified, true);
  assert.ok(child);
  child.ref();
  await once(child, "close");
  assert.deepEqual(calls, [
    {
      command: "herdr",
      args: [
        "notification",
        "show",
        "Textcast Chat review ready",
        "--body",
        "The artifact is open and Textcast Chat is polling for your feedback.",
        "--sound",
        "request",
      ],
      options: { stdio: "ignore" },
    },
  ]);

  assert.equal(
    notifyHerdrPollReady({
      env: { HERDR_ENV: "1", TEXTCAST_CHAT_AXI_HERDR_CHIME: "1" },
      runner() {
        throw new Error("Herdr unavailable");
      },
    }),
    false,
  );
});

test("Herdr failures and a stalled notification do not delay poll feedback", { timeout: 10_000 }, async (t) => {
  const server = createServer((_req, res) => {
    res.setHeader("Textcast-Poll-State", "listening");
    res.end(JSON.stringify({ status: "feedback", prompts: [{ text: "Review this" }] }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const env = { HERDR_ENV: "1", TEXTCAST_CHAT_AXI_HERDR_CHIME: "1" };

  for (const behavior of ["missing", "rejected", "stalled"]) {
    await t.test(behavior, async () => {
      const exitListeners = process.listenerCount("exit");
      /** @type {import("node:child_process").ChildProcess | undefined} */
      let child;
      /** @type {Promise<{ code: number | null, signal: NodeJS.Signals | null }> | undefined} */
      let closed;
      const response = await fetchJson(`http://127.0.0.1:${address.port}`, {
        onResponse() {
          notifyHerdrPollReady({
            env,
            runner(_command, _args, options) {
              child =
                behavior === "missing"
                  ? spawn(path.join(process.cwd(), "missing-herdr-executable"), [], options)
                  : spawn(
                      process.execPath,
                      [
                        "-e",
                        behavior === "rejected"
                          ? "process.exit(1)"
                          : "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000)",
                      ],
                      options,
                    );
              closed = new Promise((resolve) => child.once("close", (code, signal) => resolve({ code, signal })));
              return child;
            },
          });
        },
      });
      try {
        assert.ok(child);
        assert.ok(closed);
        assert.deepEqual(response, { status: "feedback", prompts: [{ text: "Review this" }] });
        if (behavior === "stalled") {
          assert.equal(child.exitCode, null);
          assert.equal(child.signalCode, null);
          const result = await closed;
          if (process.platform !== "win32") assert.equal(result.signal, "SIGKILL");
          assert.ok(child.killed);
        } else {
          await closed;
        }
        assert.equal(process.listenerCount("exit"), exitListeners);
      } finally {
        child?.kill("SIGKILL");
      }
    });
  }
});

test("poll wait reporter writes a banner immediately and heartbeats on an interval", async () => {
  const lines = [];
  const reporter = startPollWaitReporter({
    file: "/tmp/report.html",
    write: (line) => {
      lines.push(line);
    },
    intervalMs: 5,
  });

  try {
    assert.equal(lines.length, 1);
    assert.match(lines[0], /Long-polling for user feedback/);

    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.ok(lines.length >= 2, "emits heartbeat lines while waiting");
    assert.match(lines[1], /Still waiting for user feedback/);
  } finally {
    reporter.stop();
  }

  const countAfterStop = lines.length;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(lines.length, countAfterStop, "stops heartbeating after stop()");
});

test("poll wait reporter still banners without ticks when narration is off", async () => {
  const lines = [];
  const reporter = startPollWaitReporter({
    file: "/tmp/report.html",
    write: (line) => {
      lines.push(line);
    },
    intervalMs: 5,
    narrateTicks: false,
  });

  try {
    assert.equal(lines.length, 1, "the one-shot not-hung banner is unconditional");
    assert.match(lines[0], /Long-polling for user feedback/);

    await new Promise((resolve) => setTimeout(resolve, 60));
    assert.equal(lines.length, 1, "suppresses the recurring heartbeat lines");
  } finally {
    reporter.stop();
  }
});

test("shouldNarratePollWaitTicks heartbeats only in an interactive terminal", () => {
  assert.equal(shouldNarratePollWaitTicks({ isTTY: true }), true);
  assert.equal(shouldNarratePollWaitTicks({ isTTY: undefined }), false);
  assert.equal(shouldNarratePollWaitTicks({ isTTY: false }), false);
});

test("spawned poll with piped stderr banners once and leaves re-run guidance when killed", async () => {
  const stateDir = await mkdtemp(`${os.tmpdir()}/textcast-chat-axi-poll-wait-test-`);
  const artifact = `${stateDir}/artifact.html`;
  await writeFile(artifact, "<html><body>hello</body></html>", "utf8");
  const server = await serve({ port: 0, stateFile: `${stateDir}/state.json`, version: VERSION });
  const base = `http://127.0.0.1:${server.port}`;
  try {
    const sessionResponse = await fetch(`${base}/api/sessions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ file: artifact }),
    });
    assert.ok(sessionResponse.ok, "session opens");

    const key = sessionKey(await canonicalFile(artifact));

    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL("../bin/textcast-chat-axi.js", import.meta.url)), "poll", artifact],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        env: { ...process.env, TEXTCAST_CHAT_AXI_STATE_DIR: stateDir, TEXTCAST_CHAT_AXI_PORT: String(server.port) },
      },
    );

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    await waitForPollListening(base, key);
    assert.equal(
      stderr.match(/Long-polling for user feedback/g)?.length,
      1,
      "piped stderr still gets the one-shot not-hung banner",
    );
    assert.doesNotMatch(stderr, /Still waiting for user feedback/, "the banner carries no immediate wait tick");

    // Wait for "close" rather than "exit": "exit" can fire while the final stderr chunk is
    // still in flight, so asserting on stderr at "exit" races the guidance message.
    const closed = new Promise((resolve) => child.on("close", (code, signal) => resolve({ code, signal })));
    child.kill("SIGTERM");
    await closed;

    // Windows terminates Node child processes directly instead of delivering SIGTERM
    // to the child process's JavaScript signal handler.
    if (process.platform !== "win32") {
      assert.match(stderr, /Poll interrupted/);
      assert.match(stderr, /feedback remains queued until delivery/);
    }
  } finally {
    await server.close();
    await rm(stateDir, { force: true, recursive: true });
  }
});

test("browser-disconnected poll output asks before reopening or ending the resumable session", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "browser_disconnected" },
  });

  assert.deepEqual(output.session, { file: "/tmp/report.html", status: "browser_disconnected" });
  assert.match(output.next_step, /review window (?:was closed|disconnected)/i);
  assert.match(output.next_step, /ask the user/i);
  assert.match(output.next_step, /reopen/i);
  assert.match(output.next_step, /end the session/i);
  assert.match(output.next_step, /remains open|resumable/i);
  assert.doesNotMatch(output.next_step, /Run `textcast-chat-axi \/tmp\/report\.html`/);
});

test("waiting next step reassures agents that re-running poll loses nothing", () => {
  const output = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "waiting" },
  });

  assert.match(output.next_step, /textcast-chat-axi poll \/tmp\/report\.html/);
  assert.match(output.next_step, /without --timeout-ms/);
  assert.match(output.next_step, /feedback remains queued until delivery/);
});

test("SDK reserved commands pass through instead of normalizing to open", () => {
  assert.deepEqual(normalizeArgv(["update"]), ["update"]);
  assert.deepEqual(normalizeArgv(["update", "--check"]), ["update", "--check"]);
  assert.deepEqual(normalizeArgv(["update", "--help"]), ["update", "--help"]);
});

test("server spawn options detach without inheriting invalid streams", () => {
  const options = createServerSpawnOptions();

  assert.equal(options.detached, true);
  assert.equal(options.stdio, "ignore");
});

test("server spawn options can persist detached server output to a log fd", () => {
  const options = createServerSpawnOptions(17);

  assert.equal(options.detached, true);
  assert.deepEqual(options.stdio, ["ignore", 17, 17]);
});

test("detached server entry dispatches the CLI", () => {
  const entry = fileURLToPath(new URL("../bin/textcast-chat-axi-server.js", import.meta.url));
  const result = spawnSync(process.execPath, [entry, "--version"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /\d+\.\d+\.\d+/);
});

test("local built CLI opens force a server restart while source and installed runs do not", () => {
  const root = fileURLToPath(new URL("..", import.meta.url));

  assert.equal(shouldForceRestartForLocalBuild(`${root}/dist/cli.mjs`, true), true);
  assert.equal(shouldForceRestartForLocalBuild(`${root}/bin/textcast-chat-axi.js`, true), false);
  assert.equal(
    shouldForceRestartForLocalBuild("/usr/local/lib/node_modules/textcast-chat-axi/dist/cli.mjs", false),
    false,
  );
});

test("a source checkout replaces a server started before its code last changed", async () => {
  const root = fileURLToPath(new URL("..", import.meta.url));
  assert.equal(isLocalSourceEntry(`${root}/bin/textcast-chat-axi.js`, true), true);
  assert.equal(isLocalSourceEntry(`${root}/dist/cli.mjs`, true), false);
  assert.equal(isLocalSourceEntry(`${root}/bin/textcast-chat-axi.js`, false), false);

  const dir = await mkdtemp(`${os.tmpdir()}/textcast-chat-axi-source-test-`);
  try {
    const file = path.join(dir, "chrome-client.js");
    await writeFile(file, "", "utf8");
    await writeFile(path.join(dir, "notes.md"), "", "utf8");
    const changed = new Date("2026-01-01T00:00:10Z");
    await utimes(file, changed, changed);
    assert.equal(await localSourceChangedSince(changed.getTime() - 1000, dir), true);
    assert.equal(await localSourceChangedSince(changed.getTime() + 1000, dir), false);
    assert.equal(await localSourceChangedSince(undefined, dir), true, "a server too old to say when it started");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("restart is a command, not a file to open", () => {
  assert.deepEqual(normalizeArgv(["restart"]), ["restart"]);
  assert.deepEqual(normalizeArgv(["restart", "page.html"]), ["restart", "page.html"]);
});

test("shouldRestartServer reuses a server running the same version", () => {
  assert.equal(shouldRestartServer("0.1.4", { ok: true, version: "0.1.4" }), false);
});

test("shouldRestartServer restarts a same-version server after a Tailscale transition", () => {
  const health = { ok: true, app: "textcast-chat-axi", version: "0.1.4", network_stale: true };
  assert.equal(shouldRestartServer("0.1.4", health), true);
  assert.equal(serverReplacementReason("0.1.4", health), "");
});

test("shouldRestartServer restarts same-version Textcast Chat servers when forced", () => {
  assert.equal(shouldRestartServer("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.4" }, true), true);
  assert.equal(shouldRestartServer("0.1.4", { ok: true, app: "other", version: "0.1.4" }, true), false);
});

test("shouldRestartServer restarts when the running server reports a different version", () => {
  // Catches the upgrade scenario: client got bumped to 0.1.4 but a 0.1.3 server is still
  // holding the port from a previous invocation.
  assert.equal(shouldRestartServer("0.1.4", { ok: true, version: "0.1.3" }), true);
});

test("shouldRestartServer adopts a server that is newer than the CLI", () => {
  assert.equal(shouldRestartServer("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.5" }), false);
  assert.equal(shouldRestartServer("0.1.85", { ok: true, app: "textcast-chat-axi", version: "0.1.86" }), false);
  assert.equal(shouldRestartServer("0.1.4", { ok: true, app: "textcast-chat-axi", version: "1.0.0" }), false);
});

test("shouldRestartServer replaces a server whose version is not plain x.y.z", () => {
  assert.equal(shouldRestartServer("0.1.87", { ok: true, app: "textcast-chat-axi", version: "0.1.87-beta.1" }), true);
  assert.equal(shouldRestartServer("0.1.87", { ok: true, app: "textcast-chat-axi", version: "v0.1.88" }), true);
  assert.equal(shouldRestartServer("0.1.87-beta.1", { ok: true, app: "textcast-chat-axi", version: "0.1.88" }), true);
});

test("shouldRestartServer compares versions numerically, not as strings", () => {
  assert.equal(shouldRestartServer("0.1.10", { ok: true, app: "textcast-chat-axi", version: "0.1.9" }), true);
  assert.equal(shouldRestartServer("0.1.9", { ok: true, app: "textcast-chat-axi", version: "0.1.10" }), false);
  assert.equal(shouldRestartServer("1.0.0", { ok: true, app: "textcast-chat-axi", version: "0.9.99" }), true);
});

test("shouldRestartServer still replaces a newer server when forced or network-stale", () => {
  const newer = { ok: true, app: "textcast-chat-axi", version: "0.1.5" };
  assert.equal(shouldRestartServer("0.1.4", newer, true), true);
  assert.equal(shouldRestartServer("0.1.4", { ...newer, network_stale: true }), true);
});

test("shouldRestartServer falls back to replacing a server whose version does not parse", () => {
  assert.equal(shouldRestartServer("0.1.4", { ok: true, app: "textcast-chat-axi", version: "nightly" }), true);
});

test("shouldRestartServer restarts when the running server predates the version handshake", () => {
  // Pre-handshake servers (any release older than this change) return `{ ok: true }` with
  // no version field. Treat that as "older than me" and restart so users actually get the
  // version they just installed.
  assert.equal(shouldRestartServer("0.1.4", { ok: true }), true);
});

test("shouldRestartServer does not restart when /health was unreachable", () => {
  // null = fetch failed; the caller should fall through to startServer instead of trying
  // to POST /shutdown against nothing.
  assert.equal(shouldRestartServer("0.1.4", null), false);
});

// Every other open review page is told why its server went away, so the reason has to name the
// branch that actually fired: a local-build force replaces a server of the same version, and
// calling that an update is false on both counts.
test("serverReplacementReason names a local-build force apart from a real version change", () => {
  assert.equal(serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.3" }), "upgrade");
  assert.equal(serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi" }), "upgrade");
  assert.equal(
    serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.4" }, true),
    "local-build",
  );
  // A version difference is an upgrade even when the local-build force is also set.
  assert.equal(
    serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.3" }, true),
    "upgrade",
  );
});

test("serverReplacementReason names nothing for a server newer than the CLI", () => {
  assert.equal(serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.5" }), "");
  assert.equal(
    serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.5" }, true),
    "local-build",
  );
});

test("serverReplacementReason names nothing when no replacement is warranted", () => {
  assert.equal(serverReplacementReason("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.4" }), "");
  assert.equal(serverReplacementReason("0.1.4", null), "");
});

test("shouldKillProcessOnPort does not kill unidentified health responders", () => {
  assert.equal(shouldKillProcessOnPort("0.1.4", { ok: true, app: "other", version: "0.1.3" }), false);
});

test("shouldKillProcessOnPort kills pre-handshake Textcast Chat servers after shutdown fails", () => {
  assert.equal(shouldKillProcessOnPort("0.1.4", { ok: true }), true);
});

test("shouldKillProcessOnPort only kills Textcast Chat servers with a mismatched version", () => {
  assert.equal(shouldKillProcessOnPort("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.3" }), true);
  assert.equal(shouldKillProcessOnPort("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.4" }), false);
});

test("shouldKillProcessOnPort leaves a Textcast Chat server that is newer than the CLI", () => {
  assert.equal(shouldKillProcessOnPort("0.1.4", { ok: true, app: "textcast-chat-axi", version: "0.1.5" }), false);
  assert.equal(shouldKillProcessOnPort("0.1.10", { ok: true, app: "textcast-chat-axi", version: "0.1.9" }), true);
});

test("shutdownServerOnPort kills pre-handshake Textcast Chat servers when shutdown does not free the port", async () => {
  let shutdowns = 0;
  let kills = 0;
  const portFreeResults = [false, true];

  const output = await shutdownServerOnPort(4397, {
    baseUrl: "http://127.0.0.1:4397",
    currentVersion: "0.1.4",
    fetchHealth: async () => ({ ok: true }),
    requestShutdown: async () => {
      shutdowns += 1;
    },
    waitForPortFree: async () => portFreeResults.shift() ?? false,
    killServerProcess: () => {
      kills += 1;
      return true;
    },
    processMatchesTextcast: () => true,
  });

  assert.equal(shutdowns, 1);
  assert.equal(kills, 1);
  assert.deepEqual(output, { server: { status: "stopped", port: 4397 } });
});

test("shutdownServerOnPort ignores unidentified health responders", async () => {
  let shutdowns = 0;
  let kills = 0;

  const output = await shutdownServerOnPort(4397, {
    baseUrl: "http://127.0.0.1:4397",
    currentVersion: "0.1.4",
    fetchHealth: async () => ({ ok: true }),
    requestShutdown: async () => {
      shutdowns += 1;
    },
    waitForPortFree: async () => false,
    killServerProcess: () => {
      kills += 1;
      return true;
    },
    processMatchesTextcast: () => false,
  });

  assert.equal(shutdowns, 0);
  assert.equal(kills, 0);
  assert.deepEqual(output, { server: { status: "not-textcast", port: 4397 } });
});

test("polling a file without an active session tells the agent to open it first", () => {
  assert.throws(
    () => createPollOutput({ file: "/tmp/report.html", response: { status: "missing" } }),
    (error) => {
      assert.ok(error instanceof AxiError);
      assert.equal(error.code, "NOT_FOUND");
      assert.match(error.message, /No active Textcast Chat session/);
      assert.ok(error.suggestions.some((item) => item.includes("textcast-chat-axi /tmp/report.html")));
      return true;
    },
  );
});

test("network fetch failures become structured Textcast Chat server errors", async () => {
  await assert.rejects(
    () => fetchJson("http://127.0.0.1:1/api/poll"),
    (error) => {
      assert.ok(error instanceof AxiError);
      assert.equal(error.code, "SERVER_ERROR");
      assert.match(error.message, /Textcast Chat server connection failed/);
      assert.ok(error.suggestions.some((item) => item.includes("textcast-chat-axi server --verbose")));
      return true;
    },
  );
});

test("fetchJson retries transient connection failures", async () => {
  let requests = 0;
  const server = createServer((req, res) => {
    requests += 1;
    if (requests === 1) {
      req.socket.destroy();
      return;
    }

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "waiting" }));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind to a TCP port");
    const port = address.port;
    const result = await fetchJson(`http://127.0.0.1:${port}/api/poll`, { retries: 1, retryDelayMs: 1 });

    assert.deepEqual(result, { status: "waiting" });
    assert.equal(requests, 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("fetchJson reports interrupted response body failures without retrying", async () => {
  let requests = 0;
  const server = createServer((req, res) => {
    requests += 1;
    res.writeHead(200, { "content-type": "application/json" });
    res.end("{");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("test server did not bind to a TCP port");
    const port = address.port;

    await assert.rejects(
      () => fetchJson(`http://127.0.0.1:${port}/api/poll`, { retries: 1, retryDelayMs: 1 }),
      (error) => {
        assert.ok(error instanceof AxiError);
        assert.equal(error.code, "SERVER_ERROR");
        assert.match(error.message, /Textcast Chat poll response was interrupted/);
        return true;
      },
    );
    assert.equal(requests, 1);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("stop command shuts down the running server on the configured port", async () => {
  const dir = await mkdtemp(`${os.tmpdir()}/textcast-chat-axi-stop-test-`);
  const server = await serve({ port: 0, stateFile: `${dir}/state.json`, version: "9.9.9-test" });
  const previousStateDir = process.env.TEXTCAST_CHAT_AXI_STATE_DIR;
  process.env.TEXTCAST_CHAT_AXI_STATE_DIR = dir;
  try {
    const output = await stopCommand(["--port", String(server.port)]);
    assert.deepEqual(output, { server: { status: "stopped", port: server.port } });
    await server.done;
    await assert.rejects(() => fetch(`http://127.0.0.1:${server.port}/health`), /fetch failed|ECONNREFUSED/);
  } finally {
    if (previousStateDir === undefined) delete process.env.TEXTCAST_CHAT_AXI_STATE_DIR;
    else process.env.TEXTCAST_CHAT_AXI_STATE_DIR = previousStateDir;
    await server.close();
    await rm(dir, { force: true, recursive: true });
  }
});

test("stop command reports when no server is running", async () => {
  const dir = await mkdtemp(`${os.tmpdir()}/textcast-chat-axi-stop-test-`);
  try {
    // Bind then release a port so we know nothing is listening on it.
    const probe = await serve({ port: 0, stateFile: `${dir}/state.json` });
    const freePort = probe.port;
    await probe.close();

    const output = await stopCommand(["--port", String(freePort)]);
    assert.deepEqual(output, { server: { status: "not-running", port: freePort } });
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});

// A stand-in for a running server of another version: it answers /health, records what the CLI
// actually puts on the wire at /shutdown, and then frees the port like a real one.
async function startShutdownRecorder(version = "0.0.0-previous") {
  const bodies = [];
  const server = createServer((req, res) => {
    if (new URL(req.url || "/", "http://localhost").pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, app: "textcast-chat-axi", version }));
      return;
    }
    if (req.url === "/shutdown" && req.method === "POST") {
      let raw = "";
      req.on("data", (chunk) => {
        raw += chunk;
      });
      req.on("end", () => {
        bodies.push(raw ? JSON.parse(raw) : {});
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ status: "shutting-down" }));
        server.close();
        server.closeAllConnections?.();
      });
      return;
    }
    res.writeHead(404).end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(undefined)));
  const address = /** @type {import("node:net").AddressInfo} */ (server.address());
  return { bodies, port: address.port, close: () => server.close() };
}

test("textcast-chat-axi stop tells the server it was stopped, and names no session to reload", async () => {
  const recorder = await startShutdownRecorder();
  try {
    const output = await shutdownServerOnPort(recorder.port, {
      baseUrl: `http://127.0.0.1:${recorder.port}`,
      currentVersion: "0.1.4",
    });

    assert.deepEqual(recorder.bodies, [{ reason: "stop" }]);
    assert.equal(output.server.status, "stopped");
  } finally {
    recorder.close();
  }
});

// The page being opened is the one that reloads itself, and the server picks it by key, so the
// key the CLI sends has to be the canonical session key for the file - an empty or non-canonical
// one silently degrades the feature to "nobody reloads, everybody gets a banner".
test("opening an artifact names that session as the one to reload across a version upgrade", async () => {
  const recorder = await startShutdownRecorder();
  const dir = await mkdtemp(path.join(os.tmpdir(), "textcast-open-reload-"));
  const stateDir = path.join(dir, "state");
  const nested = path.join(dir, "pages");
  await mkdir(nested, { recursive: true });
  const artifact = path.join(nested, "board.html");
  await writeFile(artifact, "<!doctype html><html><body>board</body></html>");
  const base = `http://127.0.0.1:${recorder.port}`;

  try {
    // Spawned asynchronously on purpose: the recorder runs in this process, so a blocking
    // spawnSync would deadlock the CLI's own /health request against it.
    const child = spawn(
      process.execPath,
      // A path with a `..` hop: the key must come from the canonicalized file, not this spelling.
      [
        fileURLToPath(new URL("../bin/textcast-chat-axi.js", import.meta.url)),
        path.join(nested, "..", "pages", "board.html"),
        "--no-open",
      ],
      {
        cwd: fileURLToPath(new URL("..", import.meta.url)),
        env: {
          ...process.env,
          TEXTCAST_CHAT_AXI_PORT: String(recorder.port),
          TEXTCAST_CHAT_AXI_STATE_DIR: stateDir,
          TEXTCAST_CHAT_AXI_TELEMETRY: "0",
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.stdout.resume();
    const code = await new Promise((resolve) => child.on("exit", resolve));

    assert.equal(code, 0, stderr);
    assert.deepEqual(recorder.bodies, [{ reload_key: sessionKey(await canonicalFile(artifact)), reason: "upgrade" }]);
  } finally {
    // The CLI replaced the recorder with a real server on that port; stop it again.
    await fetch(`${base}/shutdown`, { method: "POST" }).catch(() => {});
    for (let i = 0; i < 30; i += 1) {
      const alive = await fetch(`${base}/health`).then(
        () => true,
        () => false,
      );
      if (!alive) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    recorder.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test("html file arguments normalize to the hidden open command", () => {
  assert.deepEqual(normalizeArgv(["report.html"]), ["open", "report.html"]);
  assert.deepEqual(normalizeArgv(["--no-open", "report.html"]), ["open", "--no-open", "report.html"]);
  assert.deepEqual(normalizeArgv(["--reopen", "report.html"]), ["open", "--reopen", "report.html"]);
  assert.deepEqual(normalizeArgv(["poll", "report.html"]), ["poll", "report.html"]);
  assert.deepEqual(normalizeArgv(["--help"]), ["--help"]);
});

test("open can resume a session without opening another browser window", () => {
  assert.equal(shouldOpenBrowser(["--no-open", "artifact.html"], {}), false);
  assert.equal(shouldOpenBrowser(["artifact.html", "--no-open"], {}), false);
  assert.equal(shouldOpenBrowser(["--reopen", "artifact.html"], {}), true);
  assert.equal(shouldOpenBrowser(["artifact.html"], { TEXTCAST_CHAT_AXI_NO_OPEN: "1" }), false);
  assert.equal(shouldOpenBrowser(["artifact.html"], {}), true);
  assert.match(getCommandHelp("open"), /--no-open/);
  assert.doesNotMatch(getCommandHelp("open"), /--no-gate/);
  assert.match(getCommandHelp("open"), /--reopen/);
});

test("home output teaches agents to review Textcast pages", () => {
  const output = createHomeOutput({ bin: `${os.homedir()}/.local/bin/textcast-chat-axi`, sessions: [] });

  assert.equal(output.bin, "~/.local/bin/textcast-chat-axi");
  assert.match(output.description, /Textcast reading page/);
  assert.match(output.description, /span#seg<N>-<src\|tgt>-<mode>/);
  assert.match(output.description, /details#topic-<N>/);
  assert.deepEqual(output.sessions, []);
  assert.equal("visual_guidance" in output, false);
  assert.equal("playbooks" in output, false);
  assert.ok(output.help.some((item) => item.includes("textcast-chat-axi <html-file>")));
  assert.ok(!output.help.some((item) => item.includes("playbook")));
  assert.ok(!output.help.some((item) => item.includes("`.textcast/`")));
});

test("an ended review tells the agent to stop with stop_polling", () => {
  const ended = createPollOutput({ file: "/tmp/report.html", response: { status: "ended", ended_by: "user" } });
  assert.equal(ended.stop_polling, true);
  assert.match(ended.next_step, /^stop_polling is true/);

  const last = createPollOutput({
    file: "/tmp/report.html",
    response: { status: "feedback", prompts: [], session_ended: true, ended_by: "user" },
  });
  assert.equal(last.stop_polling, true);

  const open = createPollOutput({ file: "/tmp/report.html", response: { status: "feedback", prompts: [] } });
  assert.equal("stop_polling" in open, false);
});
