import { spawn, spawnSync } from "node:child_process";
import { closeSync, createReadStream, existsSync, openSync, readFileSync } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import { get as httpGet } from "node:http";
import { isIP } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { AxiError, RESERVED_COMMANDS, runAxiCli } from "axi-sdk-js";

import { localInterfaceAddresses } from "./local-address.js";
import {
  clientHost,
  defaultPort,
  ensureStateDir,
  hostForUrl,
  isWildcardHost,
  LOOPBACK_HOST,
  resolveConcreteListenHosts,
  serverLogFile,
  stateFile,
  stateId,
} from "./paths.js";
import { serve } from "./server.js";
import { isHtmlPath } from "./artifact-path.js";
import { canonicalFile, sessionKey, SessionStore } from "./session-store.js";

const COMMANDS = new Set(["open", "poll", "reply", "end", "stop", "restart", "server"]);
// SDK-reserved built-ins (e.g. `update`) must reach runAxiCli untouched; otherwise
// the bare-arg normalization below would rewrite them into the hidden `open` command.
const RESERVED = new Set(RESERVED_COMMANDS);
const DESCRIPTION =
  "textcast-chat-axi opens a published Textcast reading page in a local review window, where the reader can ask about or annotate any sentence or topic card and send it back to the agent. " +
  "Run `textcast-chat-axi <html-file>` on the page, then `textcast-chat-axi poll <html-file>` to receive the reader's notes; each note's selector names the segment (`span#seg<N>-<src|tgt>-<mode>`) or topic card (`details#topic-<N>`) it points at.";
export const POLL_WAKE_PATH_RULES = Object.freeze([
  "Keep the poll in the foreground by default and let it return the feedback directly to the agent.",
  "A background poll is allowed only through a harness-native tracked background-job facility whose completion result is guaranteed to resume or notify the same agent.",
  "Never use `nohup`, shell `&`, `disown`, redirected fire-and-forget processes, or a detached terminal without an explicit verified callback merely to keep polling alive.",
  "If the harness has no completion-aware background facility, use the foreground poll or first wire a verified wake callback into the surrounding supervisor.",
  "Do not tell the user the artifact is being monitored until that wake path is live.",
  "If the poll gets killed or times out before feedback arrives, re-run it - feedback remains queued until delivery. Poll delivery consumes the response, so read it completely.",
  "If it returns browser_disconnected, the review window stayed disconnected past its reconnect grace period but the session remains resumable; ask the user whether to reopen or end it, and do neither uninvited.",
]);
export const POLL_SEND_AND_END_RULE =
  "`Send & End` ends the session. Its final feedback is still delivered once. After that response, polling stops, and the agent must not reopen the session uninvited.";
export const POLL_AGENT_REPLY_RULE =
  "Keep the reply concise. Only when a longer reply is genuinely necessary, use Markdown structure - blank-line paragraphs, `- ` / `1. ` lists, `## ` headings - so it renders scannably instead of a wall of text, and pass that body with `--agent-reply-file <path>` (`-` reads stdin) so newlines survive quoting.";
const POLL_AGENT_REPLY_HELP_POINTER =
  "The Conversation panel's Markdown subset is in README's Feedback controls bullet.";
const POLL_AGENT_REPLY_NEXT_POINTER =
  "The Conversation panel's Markdown subset is in `textcast-chat-axi poll --help` and README.";
const POLL_VALUE_FLAGS = ["--agent-reply", "--agent-reply-file", "--timeout-ms", "--owner"];
const AGENT_REPLY_JSON_LIMIT_BYTES = 2 * 1024 * 1024;
const AGENT_REPLY_JSON_ENVELOPE_BYTES = Buffer.byteLength(JSON.stringify({ agent_reply: "" }));
const AGENT_REPLY_INPUT_LIMIT_BYTES = AGENT_REPLY_JSON_LIMIT_BYTES - AGENT_REPLY_JSON_ENVELOPE_BYTES;
const AGENT_REPLY_LIMIT_LABEL = "2 MB JSON request limit";
const POLL_STATE_HEADER = "textcast-poll-state";
const CODEX_POLL_WAKE_PATH_GUIDANCE =
  "Codex detected: completed background tasks may not resume Codex automatically, so keep the poll attached to the active turn.";
// Inlined at build time from package.json; falls back to reading package.json so source-run tests work.
export const VERSION =
  process.env.TEXTCAST_CHAT_AXI_BUILD_VERSION ||
  JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version;

export function detectInvokingAgent(env = process.env) {
  return ["CODEX_SANDBOX", "CODEX_THREAD_ID"].some((key) => Object.hasOwn(env, key)) ? "codex" : "generic";
}

export function shouldNarratePollWaitTicks({ isTTY }) {
  return Boolean(isTTY);
}

export function herdrPollChimeEnabled(env = process.env) {
  return env.HERDR_ENV === "1" && env.TEXTCAST_CHAT_AXI_HERDR_CHIME === "1";
}

/**
 * @param {{
 *   env?: NodeJS.ProcessEnv,
 *   runner?: (command: string, args: string[], options: { stdio: "ignore" }) => import("node:child_process").ChildProcess,
 * }} [options]
 */
export function notifyHerdrPollReady({ env = process.env, runner = spawn } = {}) {
  if (!herdrPollChimeEnabled(env)) return false;
  try {
    const child = runner(
      "herdr",
      [
        "notification",
        "show",
        "Textcast Chat review ready",
        "--body",
        "The artifact is open and Textcast Chat is polling for your feedback.",
        "--sound",
        "request",
      ],
      { stdio: "ignore" },
    );
    const kill = () => {
      try {
        child.kill("SIGKILL");
      } catch {
        return;
      }
    };
    const timer = setTimeout(kill, 2_000);
    timer.unref();
    const cleanup = () => {
      clearTimeout(timer);
      process.off("exit", kill);
    };
    child.on("error", () => {});
    child.once("close", cleanup);
    process.once("exit", kill);
    child.unref();
    return true;
  } catch {
    // A desktop notification is optional and must never interrupt feedback delivery.
    return false;
  }
}

export function pollExecutionGuidance({ agent = "generic" } = {}) {
  const sharedGuidance = POLL_WAKE_PATH_RULES.join(" ");
  const agentGuidance = agent === "codex" ? ` ${CODEX_POLL_WAKE_PATH_GUIDANCE}` : "";
  return `${sharedGuidance}${agentGuidance}`;
}

// Mirrors the SDK's own version-flag detection so the fast path below prints exactly
// what `runAxiCli` would have printed, for exactly the same argv shapes.
export function isVersionOnlyArgv(argv) {
  return argv.length === 1 && (argv[0] === "--version" || argv[0] === "-v" || argv[0] === "-V");
}

export async function run(argv) {
  // `--version` sits on the agent-startup hot path (harnesses probe every tool's version
  // at session start), so it must never pay for state-dir creation.
  if (isVersionOnlyArgv(argv)) {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  await ensureStateDir();
  const normalizedArgv = normalizeArgv(argv);
  const agent = detectInvokingAgent(process.env);
  const isTopLevelHelp = argv.length === 1 && argv[0] === "--help";
  await runAxiCli({
    description: DESCRIPTION,
    version: VERSION,
    argv: isTopLevelHelp ? [] : normalizedArgv,
    topLevelHelp: createTopLevelHelp({ agent }),
    home: async () =>
      createHomeOutput({
        bin: process.argv[1] || "textcast-chat-axi",
        sessions: isTopLevelHelp ? [] : await visibleSessions(),
        includeSessions: !isTopLevelHelp,
        agent,
      }),
    commands: {
      open: openCommand,
      poll: pollCommand,
      reply: replyCommand,
      end: endCommand,
      stop: stopCommand,
      restart: restartCommand,
      server: serverCommand,
    },
    getCommandHelp: (command) => getCommandHelp(command, { agent }),
  });
}

export function collapseHomeDirectory(file, home) {
  const normalizedFile = file.replaceAll("\\", "/");
  const normalizedHome = home.replaceAll("\\", "/");

  if (normalizedFile === normalizedHome) {
    return "~";
  }
  if (normalizedFile.startsWith(`${normalizedHome}/`)) {
    return `~/${normalizedFile.slice(normalizedHome.length + 1)}`;
  }
  return file;
}

export function normalizeArgv(argv) {
  const first = argv[0];
  if (!first || COMMANDS.has(first) || RESERVED.has(first)) {
    return argv;
  }
  if (first.startsWith("-")) {
    return argv.some((arg) => isHtmlPath(arg)) ? ["open", ...argv] : argv;
  }
  return ["open", ...argv];
}

export function createHomeOutput({ bin, sessions, includeSessions = true, agent = "generic" }) {
  return {
    bin: collapseHomeDirectory(bin, os.homedir()),
    description: DESCRIPTION,
    ...(includeSessions
      ? {
          sessions: sessions.map((session) => ({
            file: session.file,
            status: session.status,
            url: session.url,
            pending_prompts: session.pending_prompts || 0,
            listener: session.listener || "none",
          })),
        }
      : {}),
    help: [
      "Run `textcast-chat-axi <html-file>` to open or resume a Textcast Chat session. If the user explicitly ended the session from the browser, this refuses to reopen it and explains why instead of reopening uninvited - pass `--reopen` only when the user asks for further review or something important needs their visual attention",
      "Textcast Chat serves the html file through a local express.js server. If your html needs to reference other filesystem assets such as images, CSS, fonts, and local scripts, copy them into the same directory as the HTML file, then reference them with relative paths from that directory. Never prepend `/` to those asset paths - root paths won't work",
      `Run \`textcast-chat-axi poll <html-file>\` to wait for user feedback. It long-polls and stays silent until the user sends feedback, ends the session, or leaves every review window disconnected past the reconnect grace period, so leave it running - never kill it. The only exception is a fatal artifact_failures response, which means the review surface itself could not be used. ${pollExecutionGuidance({ agent })} ${POLL_SEND_AND_END_RULE}`,
      'Run `textcast-chat-axi reply <html-file> --agent-reply "<message>"` to show a concise reply and exit once Textcast Chat accepts it, when you are handing a result back and are not about to long-poll. The board stops showing Working only after this command exits 0. Use `textcast-chat-axi poll <html-file> --agent-reply "<message>"` when that reply should be followed by another wait for feedback. A longer reply uses `--agent-reply-file <path>` (`-` reads stdin) on either command. Run `textcast-chat-axi reply --help` for the receipt contract',
      "Run `textcast-chat-axi end <html-file>` to end a session as the agent - ending it this way still allows a plain reopen later. When the user ends it from the browser instead, a later `textcast-chat-axi <html-file>` refuses to reopen it without `--reopen`",
      "A request under a hostname Textcast Chat does not answer to (a reverse-proxy name, a LAN IP) gets 403 `forbidden host`. Set `TEXTCAST_CHAT_AXI_ALLOWED_HOSTS` in the environment that starts the server, running `textcast-chat-axi stop` first if one is already up. See README's Allowed hosts section for the rules",
      "Run `textcast-chat-axi restart <html-file>` to restart the background server and reload that review window onto it",
      "Run `textcast-chat-axi stop` to shut down the background server (it also self-stops when idle or after the last session ends with nothing connected)",
    ],
  };
}

export function createOpenOutput({ file, url, status, agent = "generic", networkWarning = undefined }) {
  // A failed bind is invisible to the person holding a review link at that address - the page
  // simply does not load - so the agent is told to pass it on rather than leave it in a field.
  const networkPrefix = networkWarning
    ? "Textcast Chat could not serve every address it was asked to (see network_warning): when you next message the user, tell them, because review links at that address will not load until it clears. "
    : "";
  return {
    session: { file, url, status },
    ...(networkWarning ? { network_warning: networkWarning } : {}),
    next_step: `${networkPrefix}Do not respond to the user just yet. Now you must run \`textcast-chat-axi poll ${file}\`. This command long-polls until the user sends feedback, ends the session, or leaves every review window disconnected past the reconnect grace period, and it stays silent the whole time - that is normal, never kill it. Do not pass --timeout-ms during normal agent use. ${pollExecutionGuidance({ agent })} After applying feedback, run \`textcast-chat-axi poll ${file} --agent-reply "<message for the user>"\` without --timeout-ms to show a concise response in Textcast Chat and keep waiting for more feedback. If instead you are handing back a result without starting another long-poll, run \`textcast-chat-axi reply ${file} --agent-reply "<message for the user>"\` to get an acceptance receipt. ${POLL_AGENT_REPLY_RULE} ${POLL_AGENT_REPLY_NEXT_POINTER} If the user ends the session, stop polling and do not reopen it by re-running \`textcast-chat-axi ${file}\` unless the user asks for further review or something genuinely important needs their visual attention - deliver routine updates directly in this conversation instead. When reopening is warranted, run \`textcast-chat-axi ${file} --reopen\`.`,
  };
}

// Shown when a plain `textcast-chat-axi <file>` targets a session the user explicitly ended from the
// browser. Reviving it silently would reopen a browser window the human deliberately closed, so
// this refuses and requires the explicit --reopen opt-in instead of erroring - the session
// staying closed is the correct, idempotent outcome unless the agent has a real reason to reopen.
export function createUserEndedOpenOutput({ file, url, networkWarning = undefined }) {
  return {
    session: { file, url, status: "user-ended" },
    ...(networkWarning ? { network_warning: networkWarning } : {}),
    next_step: `The user explicitly ended this Textcast Chat session from the browser, so \`textcast-chat-axi ${file}\` did not reopen it. Do not reopen unless the user asks for further review or something genuinely important needs their visual attention - deliver routine updates directly in this conversation instead. When reopening is warranted, run \`textcast-chat-axi ${file} --reopen\`.`,
  };
}

async function openCommand(args) {
  const file = firstPositionalArg(args);
  if (!file) {
    throw new AxiError("HTML file path is required", "VALIDATION_ERROR", ["Run `textcast-chat-axi <html-file>`"]);
  }
  await assertHtmlFile(file);
  const absolute = await canonicalFile(file);
  const reopen = args.includes("--reopen");
  const baseUrl = await ensureServer({
    forceRestart: shouldForceRestartForLocalBuild(process.argv[1] || ""),
    restartIfSourceChanged: isLocalSourceEntry(process.argv[1] || ""),
    reloadKey: sessionKey(absolute),
  });
  const response = await postJson(`${baseUrl}/api/sessions`, { file: absolute, reopen });
  if (response.status === "user-ended") {
    return createUserEndedOpenOutput({
      file: absolute,
      url: response.url,
      networkWarning: response.network_warning,
    });
  }
  if (shouldOpenBrowser(args, process.env)) {
    try {
      const open = (await import("open")).default;
      await open(response.url);
    } catch {
      response.status = "ready";
    }
  }
  return createOpenOutput({
    file: absolute,
    url: response.url,
    status: response.status || "opened",
    agent: detectInvokingAgent(process.env),
    networkWarning: response.network_warning,
  });
}

export function shouldOpenBrowser(args, env) {
  return !args.includes("--no-open") && env.TEXTCAST_CHAT_AXI_NO_OPEN !== "1";
}

async function pollCommand(args) {
  const file = firstPositionalArg(args, POLL_VALUE_FLAGS);
  if (!file) {
    throw new AxiError("HTML file path is required", "VALIDATION_ERROR", ["Run `textcast-chat-axi poll <html-file>`"]);
  }
  const ownerFlag = inspectValueFlag(args, "--owner");
  const owner = ownerFlag.present ? String(ownerFlag.value || "").trim() : null;
  if (ownerFlag.present && (!owner || owner.startsWith("-") || owner.toLowerCase() === "none")) {
    throw new AxiError(
      owner?.toLowerCase() === "none" ? "--owner none is reserved" : "--owner requires a non-empty label",
      "VALIDATION_ERROR",
      ["Pass `--owner <label>` to identify the process listening for feedback"],
    );
  }
  const takeover = args.includes("--takeover");
  const agentReply = await resolveAgentReply(args);
  const absolute = await canonicalFile(file);
  const baseUrl = await ensureServer();
  const timeoutMs = flagValue(args, "--timeout-ms");
  const query = new URLSearchParams({ file: absolute });
  if (timeoutMs) query.set("timeoutMs", timeoutMs);
  if (owner) query.set("owner", owner);
  if (takeover) query.set("takeover", "1");
  // The indefinite poll looks hung from the agent's side (stdout stays empty until the user
  // acts), so narrate the wait on stderr and leave re-run guidance behind if the agent's
  // harness kills the process anyway. stderr keeps the stdout JSON contract intact.
  // The one-shot banner is that "not hung" signal and stays unconditional; only the recurring
  // ticks - one line per minute, unbounded - are gated on an interactive stderr so piped,
  // merged agent captures do not accumulate them.
  const onPollSignal = (signal) => {
    process.stderr.write(`\n${pollInterruptedText(absolute)}\n`);
    process.exit(signal === "SIGINT" ? 130 : 143);
  };
  if (!timeoutMs) {
    // Register before the banner write below: a harness that kills the poll as soon as the
    // banner appears can deliver the signal before the next statement runs, and without a
    // handler the default disposition exits silently with no re-run guidance.
    process.on("SIGINT", onPollSignal);
    process.on("SIGTERM", onPollSignal);
  }
  const waitReporter = timeoutMs
    ? null
    : startPollWaitReporter({
        file: absolute,
        narrateTicks: shouldNarratePollWaitTicks({ isTTY: process.stderr.isTTY }),
      });
  try {
    const request =
      agentReply || takeover
        ? {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(agentReply ? { agent_reply: agentReply } : {}),
          }
        : {};
    const response = await fetchJson(`${baseUrl}/api/poll?${query}`, {
      ...request,
      // Poll ownership is claimed before the response is available. Retrying a transport failure
      // can leave the first claim alive and make the retry reject itself as LISTENER_ACTIVE.
      retries: 0,
      onResponse: (pollResponse) => {
        if (pollResponse.headers.get(POLL_STATE_HEADER) === "listening") notifyHerdrPollReady();
      },
    });
    if (response.code === "LISTENER_REPLACED") {
      throw new AxiError("Textcast Chat poll listener was replaced by a takeover", "LISTENER_REPLACED", [
        `Re-run textcast-chat-axi poll ${absolute} only if you intend to take over listening`,
      ]);
    }
    return createPollOutput({ file: absolute, response, agent: detectInvokingAgent(process.env) });
  } finally {
    waitReporter?.stop();
    if (!timeoutMs) {
      process.off("SIGINT", onPollSignal);
      process.off("SIGTERM", onPollSignal);
    }
  }
}

const REPLY_VALUE_FLAGS = ["--agent-reply", "--agent-reply-file"];
const REPLY_TOO_LARGE_HELP = "Shorten the reply, then retry `textcast-chat-axi reply <html-file>`";

async function replyCommand(args) {
  const file = firstPositionalArg(args, REPLY_VALUE_FLAGS);
  if (!file) {
    throw new AxiError("HTML file path is required", "VALIDATION_ERROR", [
      'Run `textcast-chat-axi reply <html-file> --agent-reply "<message>"`',
    ]);
  }
  const inline = inspectValueFlag(args, "--agent-reply");
  const fromFile = inspectValueFlag(args, "--agent-reply-file");
  if (!inline.present && !fromFile.present) {
    throw new AxiError("An agent reply is required", "VALIDATION_ERROR", [
      'Pass exactly one of --agent-reply "<message>" or --agent-reply-file <path> (`-` reads stdin)',
      "Use `textcast-chat-axi poll <html-file> --agent-reply` when the reply should be followed by a wait for feedback",
    ]);
  }
  const text = await resolveAgentReply(args, { tooLargeHelp: REPLY_TOO_LARGE_HELP });
  if (!String(text || "").trim()) {
    throw new AxiError("Agent reply text was empty", "VALIDATION_ERROR", [
      'Pass --agent-reply "<message>" or --agent-reply-file <path> with a non-empty body',
    ]);
  }
  await assertHtmlFile(file);
  const absolute = await canonicalFile(file);
  const baseUrl = await ensureServer();
  await postAgentReply(`${baseUrl}/api/${sessionKey(absolute)}/agent-reply`, text, absolute);
  return createReplyOutput(absolute);
}

function createReplyOutput(file) {
  return {
    reply: { file, status: "sent" },
    next_step: `Textcast Chat accepted the reply for ${file} and is no longer showing Working. Run \`textcast-chat-axi poll ${file}\` when you are ready to wait for more feedback.`,
  };
}

export function pollWaitBannerText(file) {
  return (
    `[textcast-chat-axi] Long-polling for user feedback on ${file}. This stays silent until the user sends feedback, ends the session, or leaves every review window disconnected past the reconnect grace period - leave it running. ` +
    `If it gets killed or times out before feedback arrives, re-run \`textcast-chat-axi poll ${file}\` - feedback remains queued until delivery. Poll delivery consumes the response, so read it completely.`
  );
}

export function pollWaitTickText(elapsedMs) {
  const minutes = Math.round(elapsedMs / 60_000);
  return `[textcast-chat-axi] Still waiting for user feedback (${minutes}m). Leave this running until the user sends feedback, ends the session, or leaves every review window disconnected.`;
}

export function pollInterruptedText(file) {
  return (
    `[textcast-chat-axi] Poll interrupted before user feedback arrived. The user may still be reviewing - ` +
    `re-run \`textcast-chat-axi poll ${file}\` to keep waiting; feedback remains queued until delivery. Poll delivery consumes the response, so read it completely.`
  );
}

export function startPollWaitReporter({
  file,
  write = (line) => {
    process.stderr.write(line);
  },
  intervalMs = 60_000,
  narrateTicks = true,
}) {
  write(`${pollWaitBannerText(file)}\n`);
  if (!narrateTicks) return { stop: () => {} };
  let elapsedMs = 0;
  const timer = setInterval(() => {
    elapsedMs += intervalMs;
    write(`${pollWaitTickText(elapsedMs)}\n`);
  }, intervalMs);
  timer.unref?.();
  return { stop: () => clearInterval(timer) };
}

/**
 * @returns {{
 *   session: { file: string, status: string, session_ended?: boolean, ended_by?: string },
 *   prompts?: any[],
 *   artifact_failures?: any[],
 *   stop_polling?: boolean,
 *   next_step?: string,
 * }}
 */
export function createPollOutput({ file, response, agent = "generic" }) {
  if (response.status === "missing") {
    throw new AxiError("No active Textcast Chat session for this file", "NOT_FOUND", [
      `Run \`textcast-chat-axi ${file}\` first`,
    ]);
  }
  if (response.status === "feedback") {
    const artifactFailures = Array.isArray(response.artifact_failures) ? response.artifact_failures : [];
    const sessionEnded = Boolean(response.session_ended);
    const endedBy = typeof response.ended_by === "string" ? response.ended_by : undefined;
    return {
      session: {
        file,
        status: "feedback",
        ...(sessionEnded ? { session_ended: true, ...(endedBy ? { ended_by: endedBy } : {}) } : {}),
      },
      // The one machine-readable signal to stop: the review is over, so no further poll will ever
      // return and the agent must not start one.
      ...(sessionEnded ? { stop_polling: true } : {}),
      prompts: response.prompts || [],
      ...(artifactFailures.length > 0 ? { artifact_failures: artifactFailures } : {}),
      next_step: createFeedbackNextStep(file, artifactFailures, sessionEnded, endedBy, response.prompts || [], agent),
    };
  }
  if (response.status === "ended") {
    return {
      session: { file, status: "ended", ...(response.ended_by ? { ended_by: response.ended_by } : {}) },
      stop_polling: true,
      next_step: createEndedNextStep(file, response.ended_by),
    };
  }
  if (response.status === "browser_disconnected") {
    return {
      session: { file, status: "browser_disconnected" },
      next_step:
        "The Textcast Chat review window was closed or disconnected. The session remains open and resumable; ask the user whether they want to reopen it or end the session. Do not reopen or end it without their direction.",
    };
  }
  return {
    session: { file, status: response.status || "waiting" },
    next_step: `No user feedback arrived before the optional timeout. Run \`textcast-chat-axi poll ${file}\` without --timeout-ms to wait indefinitely - feedback remains queued until delivery, so re-running the poll is safe while waiting. Poll delivery consumes the response, so read it completely.`,
  };
}

function createFeedbackNextStep(file, artifactFailures, sessionEnded, endedBy, prompts = [], agent = "generic") {
  const count = artifactFailures.length;
  const attachmentNote = prompts.some((prompt) => Array.isArray(prompt?.attachments) && prompt.attachments.length)
    ? `Some prompts carry image attachments the user added: each is an object in the prompt's \`attachments\` array with an absolute local \`path\` (plus id, mime, and dimensions). Open those image files to see what the user is referring to. `
    : "";
  const pageNote = prompts.some((prompt) => typeof prompt?.page === "string" && prompt.page)
    ? `Some prompts carry a \`page\`: the reader followed a link to another page of the same site and wrote them there, so apply each of those to the file its \`page\` names (its selector points into that file), not to ${file}. `
    : "";
  if (sessionEnded) {
    const failureNote =
      count > 0
        ? endedBy === "user"
          ? `${count} fatal artifact failure${count === 1 ? "" : "s"} arrived alongside this final feedback - the review surface itself could not be used. Repair ${file}, then open it directly and confirm it renders without reopening this ended Textcast Chat session. `
          : `${count} fatal artifact failure${count === 1 ? "" : "s"} arrived alongside this final feedback - the review surface itself could not be used. Repair ${file}, then run \`textcast-chat-axi ${file}\` to open a fresh session. `
        : "";
    if (endedBy === "user") {
      const reopenNote =
        count > 0
          ? ""
          : ` Only run \`textcast-chat-axi ${file} --reopen\` if the user explicitly asks for further review or something genuinely important needs their visual attention.`;
      return `${failureNote}${attachmentNote}${pageNote}This was the last feedback before the user ended the session. Stop polling ${file} and do not reopen it - deliver any remaining updates directly in this conversation instead.${reopenNote}`;
    }
    return `${failureNote}${attachmentNote}${pageNote}This was the last feedback before the Textcast Chat session ended. Stop polling ${file}. Deliver any remaining updates directly in this conversation, or run \`textcast-chat-axi ${file}\` to open a fresh session if the user needs further visual review.`;
  }
  const prefix =
    count > 0 ? artifactFailuresPrefix(file, artifactFailures) : `Apply the requested changes to ${file}. `;
  return `${prefix}${attachmentNote}${pageNote}Do not respond to the user just yet. If you are continuing to wait for feedback, run \`textcast-chat-axi poll ${file} --agent-reply "<message for the user>"\` without --timeout-ms to reply and keep polling. If instead you are handing back a result without starting another long-poll, run \`textcast-chat-axi reply ${file} --agent-reply "<message for the user>"\` to post it and receive an acceptance receipt. ${POLL_AGENT_REPLY_RULE} ${POLL_AGENT_REPLY_NEXT_POINTER} The poll waits silently until the user sends more feedback, ends the session, or leaves every review window disconnected past the reconnect grace period - never kill it. ${pollExecutionGuidance({ agent })}`;
}

// The narrow fatal path. Only failures that make the review itself unusable - the artifact document
// not being servable, or one of its own local assets failing to load - arrive without user action.
function artifactFailuresPrefix(file, artifactFailures) {
  const count = artifactFailures.length;
  const plural = count === 1 ? "" : "s";
  const details = artifactFailures
    .map((failure) => `${failure.kind}: ${failure.detail}`)
    .slice(0, 5)
    .join("; ");
  return `${count} fatal artifact failure${plural} detected - the review surface could not be used (${details}). Repair ${file} so it renders with all of its local assets, then re-check in the browser. Textcast Chat live-reloads the artifact automatically after you save, so you do not need to re-run \`textcast-chat-axi ${file}\` for this. `;
}

function createEndedNextStep(file, endedBy) {
  if (endedBy === "user") {
    return `stop_polling is true: the user clicked End session in the review window. Stop now - do not run another poll for ${file}, and do not wait on it. The user ended this Textcast Chat session. Stop polling ${file} - do not run \`textcast-chat-axi ${file}\` to reopen it. Deliver any remaining updates directly in this conversation instead. Only reopen with \`textcast-chat-axi ${file} --reopen\` if the user explicitly asks for further review or something genuinely important needs their visual attention.`;
  }
  return `This Textcast Chat session for ${file} has ended. Stop polling. Deliver any remaining updates directly in this conversation, or run \`textcast-chat-axi ${file}\` to open a fresh session if the user needs further visual review.`;
}

async function endCommand(args) {
  const file = firstPositionalArg(args);
  if (!file) {
    throw new AxiError("HTML file path is required", "VALIDATION_ERROR", ["Run `textcast-chat-axi end <html-file>`"]);
  }
  const absolute = await canonicalFile(file);
  const baseUrl = await ensureServer();
  const response = await postJson(`${baseUrl}/api/end`, { file: absolute });
  return { session: { file: absolute, status: response.status || "ended" } };
}

// Explicitly shut down the running Textcast Chat server. Unlike `end` (which closes a single
// session), this stops the background process so it stops dangling between sessions.
export async function stopCommand(args) {
  const port = Number(flagValue(args, "--port") || defaultPort());
  // A server that fell back to loopback answers there rather than at the requested bind host, and
  // a `stop` that only dials the requested host reports "not-running" while leaving it running.
  // A same-port duplicate at another address is this installation's server too, so it stops as well.
  const { baseUrl, duplicates, foreign } = await findRunningServer(port);
  if (foreign) throw otherInstallationError(port, foreign);
  await stopDuplicateServers(duplicates, { reason: "stop" });
  return shutdownServerOnPort(port, { baseUrl, currentVersion: VERSION });
}

// Restart the background server: stop the running one and start a fresh one from this
// installation. With a file, that review page reloads itself onto the new server; every other open
// page shows a dismissable notice with a reload button instead of losing what is on screen.
async function restartCommand(args) {
  const file = firstPositionalArg(args);
  const reloadKey = file ? sessionKey(await canonicalFile(file)) : "";
  const port = defaultPort();
  const { health } = await findRunningServer(port);
  await ensureServer({ forceRestart: true, restartReason: "restart", reloadKey });
  const restarted = health?.app === "textcast-chat-axi";
  const pollTarget = file
    ? `textcast-chat-axi poll ${await canonicalFile(file)}`
    : "textcast-chat-axi poll <html-file>";
  return {
    server: { status: restarted ? "restarted" : "started", port },
    ...(restarted
      ? {
          next_step: `A poll that was waiting on the old server has stopped with a server error. Run \`${pollTarget}\` again to keep waiting for feedback; anything already sent stays queued until delivered.`,
        }
      : {}),
  };
}

export async function shutdownServerOnPort(
  port,
  {
    baseUrl = `http://${hostForUrl(clientHost())}:${port}`,
    currentVersion = VERSION,
    fetchHealth: healthFetcher = fetchHealth,
    requestShutdown: shutdownRequester = requestShutdown,
    waitForPortFree: portFreeWaiter = waitForPortFree,
    killServerProcess = killTextcastListener,
    processMatchesTextcast = listenerMatchesTextcast,
  } = {},
) {
  const health = await healthFetcher(baseUrl);
  if (!health) {
    return { server: { status: "not-running", port } };
  }
  if (!(await canControlServerOnPort(baseUrl, health, processMatchesTextcast))) {
    return { server: { status: "not-textcast", port } };
  }
  await shutdownRequester(baseUrl, { reason: "stop" });
  let freed = await portFreeWaiter(baseUrl, 3000);
  if (!freed && shouldKillProcessOnPort(currentVersion, health)) {
    if (!killServerProcess(baseUrl)) throw unidentifiedListenerError(baseUrl);
    freed = await portFreeWaiter(baseUrl, 3000);
  }
  return { server: { status: freed ? "stopped" : "stopping", port } };
}

async function serverCommand(args) {
  const port = Number(flagValue(args, "--port") || defaultPort());
  const debug = args.includes("--verbose") || process.env.TEXTCAST_CHAT_AXI_DEBUG === "1";
  const server = await serve({
    port,
    stateFile: stateFile(),
    version: VERSION,
    debug,
    extraListenHosts: flagValues(args, "--also-listen"),
  });
  await server.done;
  return "";
}

async function visibleSessions() {
  const store = new SessionStore(stateFile());
  const sessions = (await store.listSessions()).filter((session) => session.status !== "ended");
  const { health } = await findRunningServer(defaultPort());
  const listeners = new Map(
    Array.isArray(health?.listeners)
      ? health.listeners
          .filter((listener) => listener && typeof listener.key === "string")
          .map((listener) => [listener.key, listener.label || "agent-listener"])
      : [],
  );
  return sessions.map((session) => ({ ...session, listener: listeners.get(session.key) || "none" }));
}

async function assertHtmlFile(file) {
  if (!isHtmlPath(file)) {
    throw new AxiError("Textcast Chat expects an HTML file", "VALIDATION_ERROR", [
      "Run `textcast-chat-axi <html-file>`",
    ]);
  }
  try {
    await access(file);
  } catch {
    throw new AxiError(`File not found: ${file}`, "NOT_FOUND", [
      "Create the HTML artifact first, then run `textcast-chat-axi <html-file>`",
    ]);
  }
}

const HEALTH_PROBE_TIMEOUT_MS = 500;
const DEFAULT_HEALTH_TIMEOUT_MS = 2000;
const MAX_HEALTH_BODY_BYTES = 256 * 1024;
// A reconcile asks the server to re-detect Tailscale and retry any unbound address before
// answering, which can take longer than a plain health read.
const HEALTH_RECONCILE_TIMEOUT_MS = 3000;

// Every address a Textcast Chat server on this port could be answering at, in preference order: the host
// this CLI is configured for, loopback, then every other local interface address. Agents on one
// machine do not share TEXTCAST_CHAT_AXI_HOST, and a CLI that only dialed its own host (plus loopback)
// concluded nothing was running while a server pinned to the tailnet address held the port, then
// spawned a second daemon beside it on the same port and the same state file.
function serverCandidateHosts() {
  const hosts = [clientHost(), LOOPBACK_HOST];
  for (const address of localInterfaceAddresses()) {
    if (!hosts.includes(address)) hosts.push(address);
  }
  return hosts;
}

function serverBaseUrl(host, port) {
  return `http://${hostForUrl(host)}:${port}`;
}

// A server is this installation's when it reports our state file. One from before `state_id`
// existed (0.1.77 and older) cannot say, so it counts as ours only at an address this CLI controls -
// its configured host or loopback - where replacing it is the upgrade path; anywhere else it may
// belong to another installation and is never adopted or stopped.
function isOwnedServer(entry, controlHosts) {
  if (entry.health.app !== "textcast-chat-axi") return false;
  if (typeof entry.health.state_id === "string") return entry.health.state_id === stateId();
  return controlHosts.has(entry.host);
}

// Another installation's Textcast Chat server at an address this CLI controls is never used, replaced, or
// stopped: its sessions and state file are not ours.
function otherInstallationError(port, foreign) {
  const dir = typeof foreign.health.state_dir === "string" ? foreign.health.state_dir : "an unknown state directory";
  return new AxiError(
    `Port ${port} is served by another Textcast Chat installation at ${foreign.host} (state directory ${dir})`,
    "SERVER_ERROR",
    [
      `Set TEXTCAST_CHAT_AXI_PORT to another port, or set TEXTCAST_CHAT_AXI_STATE_DIR to ${dir} to use that installation`,
    ],
  );
}

// Returns where a Textcast Chat server actually answered, plus any OTHER Textcast Chat daemon of this
// installation found on the same port at an address the chosen one does not serve. Every candidate
// is probed in parallel and each probe is bounded, so a hanging or foreign address cannot mask
// loopback, and a response whose app is textcast-chat-axi wins over a foreign /health. When nothing
// answers, the primary URL is still returned so callers have something to spawn against and report.
async function findRunningServer(port, { reconcileNetwork = false } = {}) {
  const controlHosts = new Set([clientHost(), LOOPBACK_HOST]);
  const probed = await Promise.all(
    serverCandidateHosts().map(async (host) => {
      const baseUrl = serverBaseUrl(host, port);
      const health = await probeHealth(baseUrl, { reconcileNetwork: false, timeoutMs: HEALTH_PROBE_TIMEOUT_MS });
      return health ? { host, baseUrl, health } : null;
    }),
  );
  const found = probed.filter((entry) => entry !== null);
  const owned = found.filter((entry) => isOwnedServer(entry, controlHosts));
  const foreign =
    found.find(
      (entry) =>
        controlHosts.has(entry.host) && entry.health.app === "textcast-chat-axi" && !isOwnedServer(entry, controlHosts),
    ) ?? null;
  const chosen = owned[0];
  if (!chosen) {
    const other = found.find((entry) => controlHosts.has(entry.host));
    return other
      ? { baseUrl: other.baseUrl, health: other.health, duplicates: [], foreign }
      : { baseUrl: serverBaseUrl(clientHost(), port), health: null, duplicates: [], foreign };
  }
  let health = chosen.health;
  if (reconcileNetwork) {
    health =
      (await probeHealth(chosen.baseUrl, { reconcileNetwork: true, timeoutMs: HEALTH_RECONCILE_TIMEOUT_MS })) ?? health;
  }
  return { baseUrl: chosen.baseUrl, health, duplicates: ownedDuplicates(owned, chosen), foreign };
}

// Other Textcast Chat daemons of this installation on the same port. An address the chosen server itself
// reports as bound is the chosen server, not a duplicate. A server too old to report its addresses
// is about to be replaced by version, so every other address is retired with it: an old daemon left
// holding loopback would otherwise make the upgraded server refuse to start.
function ownedDuplicates(owned, chosen) {
  const covered = new Set([chosen.host, ...(Array.isArray(chosen.health.hosts) ? chosen.health.hosts : [])]);
  const duplicates = [];
  for (const entry of owned) {
    if (entry === chosen || covered.has(entry.host)) continue;
    duplicates.push(entry);
    for (const host of Array.isArray(entry.health.hosts) ? entry.health.hosts : [entry.host]) covered.add(host);
  }
  return duplicates;
}

// Duplicates are retired over their own /shutdown, never by process name or port-wide signal, so
// nothing but an identified Textcast Chat server of this installation is ever stopped.
async function stopDuplicateServers(duplicates, { reloadKey = "", reason = "" } = {}) {
  for (const duplicate of duplicates) {
    await requestShutdown(duplicate.baseUrl, {
      reloadKey,
      reason: reason || serverReplacementReason(VERSION, duplicate.health),
    });
    await waitForPortFree(duplicate.baseUrl, 3000);
  }
}

// Keep the running server, retiring any same-port duplicate first. Only duplicates whose addresses
// the kept server already requests reach here (`hostsToServe`), and the reconcile afterwards makes
// it bind an address the duplicate was holding right away, instead of on its next background retry.
async function adoptServer(baseUrl, duplicates, reloadKey) {
  if (duplicates.length === 0) return baseUrl;
  await stopDuplicateServers(duplicates, { reloadKey });
  await probeHealth(baseUrl, { reconcileNetwork: true, timeoutMs: HEALTH_RECONCILE_TIMEOUT_MS });
  return baseUrl;
}

// The concrete addresses this CLI's own TEXTCAST_CHAT_AXI_HOST needs a server to serve. Without an explicit
// host any running server will do: loopback is always served, and Tailscale is the server's to
// detect. A name that does not resolve right now is still required as the name, so the server is
// asked to serve it, retries it, and reports it as network_warning instead of it being dropped.
async function requiredServerHosts(env = process.env) {
  const envHost = env.TEXTCAST_CHAT_AXI_HOST?.trim();
  if (!envHost || isWildcardHost(envHost)) return [];
  return resolveConcreteListenHosts([clientHost(env)], { keepUnresolved: true });
}

// Which required addresses a running server was never asked to serve. An address it was asked for
// but has not bound yet is NOT missing: that server is already retrying it, and a replacement could
// not bind it either. A server too old to report its requested addresses is judged by version.
export function missingServerHosts(healthBody, requiredHosts) {
  if (!healthBody || !Array.isArray(healthBody.requested_hosts)) return [];
  return requiredHosts.filter((host) => !healthBody.requested_hosts.includes(host));
}

// Every address the replaced servers were asked to serve, so a replacement - for an upgrade, a
// changed network, or a missing host - never drops another agent's address and its review links.
// This CLI's own hosts come from its environment. An address that is no longer on this machine (a
// Tailscale IP from a network that went away) is left out, so the replacement does not retry it
// forever; one still on a local interface is kept even when the network around it changed.
export function inheritedListenHosts(
  healthBodies,
  requiredHosts,
  inherited = [],
  localAddresses = localInterfaceAddresses(),
) {
  const hosts = [...inherited];
  for (const health of healthBodies) {
    if (!health || !Array.isArray(health.requested_hosts)) continue;
    for (const host of health.requested_hosts) {
      if (host === LOOPBACK_HOST || requiredHosts.includes(host)) continue;
      if (isIP(host) && !localAddresses.includes(host)) continue;
      if (!hosts.includes(host)) hosts.push(host);
    }
  }
  return hosts;
}

// Every address a kept server has to be asked to serve: this CLI's own, and every address a
// same-port duplicate serves, so retiring that duplicate never takes its review links with it.
function hostsToServe(requiredHosts, duplicates) {
  return inheritedListenHosts(
    duplicates.map((duplicate) => duplicate.health),
    [],
    requiredHosts,
  );
}

async function probeHealth(baseUrl, { reconcileNetwork, timeoutMs }) {
  const health = await fetchHealth(baseUrl, { reconcileNetwork, timeoutMs });
  return health && typeof health === "object" ? health : null;
}

// `reloadKey` names the session this invocation is about to open. A version-driven replacement
// reloads that chrome only; every other open review page is told it is outdated and left alone.
async function ensureServer({
  forceRestart = false,
  restartIfSourceChanged = false,
  restartReason = "",
  reloadKey = "",
} = {}) {
  const port = defaultPort();
  const requiredHosts = await requiredServerHosts();
  const { baseUrl, health: existing, duplicates, foreign } = await findRunningServer(port, { reconcileNetwork: true });
  if (foreign) throw otherInstallationError(port, foreign);
  // Run from a source checkout, a server started before the code last changed is still serving
  // the old code under the same version number, so it is replaced like a local build.
  if (
    !forceRestart &&
    restartIfSourceChanged &&
    existing?.app === "textcast-chat-axi" &&
    (await localSourceChangedSince(existing.started_at))
  ) {
    forceRestart = true;
  }
  const missingHosts =
    existing?.app === "textcast-chat-axi" ? missingServerHosts(existing, hostsToServe(requiredHosts, duplicates)) : [];
  if (existing && !shouldRestartServer(VERSION, existing, forceRestart) && missingHosts.length === 0) {
    return adoptServer(baseUrl, duplicates, reloadKey);
  }
  let alsoListen = inheritedListenHosts([existing, ...duplicates.map((duplicate) => duplicate.health)], requiredHosts);
  let unidentified = "";
  if (existing) {
    if (!(await canControlServerOnPort(baseUrl, existing, listenerMatchesTextcast))) {
      throw new AxiError(`Port ${port} is occupied by a non-textcast server`, "SERVER_ERROR", [
        `Stop the process using port ${port}, or set TEXTCAST_CHAT_AXI_PORT to another port`,
      ]);
    }
    await stopDuplicateServers(duplicates, { reloadKey });
    // Stale server from an older release is squatting on the port. Ask it to shut down
    // gracefully so the upgraded client doesn't keep handing users an old chrome.
    const replacementReason = serverReplacementReason(VERSION, existing, forceRestart);
    await requestShutdown(baseUrl, {
      reloadKey,
      reason: restartReason && replacementReason === "local-build" ? restartReason : replacementReason,
    });
    const freed = await waitForPortFree(baseUrl, 2000);
    if (!freed) {
      // Pre-handshake servers (any release older than this change) don't expose /shutdown
      // so the POST 404'd. Fall back to SIGTERM by PID so the very first upgrade still
      // works, then keep waiting.
      if (shouldKillProcessOnPort(VERSION, existing)) {
        if (killTextcastListener(baseUrl)) await waitForPortFree(baseUrl, 3000);
        else unidentified = baseUrl;
      }
    }
  }
  await startServer(port, { alsoListen });
  const replacedForNetwork =
    Boolean(existing) &&
    existing.app === "textcast-chat-axi" &&
    existing.network_stale === true &&
    !forceRestart &&
    typeof existing.version === "string" &&
    !isServerOlderThanCli(VERSION, existing.version);
  let networkRestarted = replacedForNetwork;
  let raceRestarted = false;
  let deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const {
      baseUrl: liveUrl,
      health,
      duplicates: liveDuplicates,
      foreign: liveForeign,
    } = await findRunningServer(port, { reconcileNetwork: true });
    if (liveForeign) throw otherInstallationError(port, liveForeign);
    const liveMissing =
      health?.app === "textcast-chat-axi"
        ? missingServerHosts(health, hostsToServe(requiredHosts, liveDuplicates))
        : [];
    // Once is the bound: every replacement carries the hosts of the server it replaces, so two CLIs
    // that each need their own address converge on one server instead of replacing each other.
    if (health && !shouldRestartServer(VERSION, health)) {
      if (liveMissing.length === 0) return adoptServer(liveUrl, liveDuplicates, reloadKey);
      if (raceRestarted) throw missingHostsError(port, liveMissing);
    }
    // Another daemon won the port while ours was starting (ours exits when a Textcast Chat server already
    // owns loopback) - an older release, or one missing an address this CLI needs. Retire it and
    // start once more rather than wait it out.
    if (health?.app === "textcast-chat-axi" && health.network_stale !== true && !raceRestarted) {
      raceRestarted = true;
      alsoListen = inheritedListenHosts(
        [health, ...liveDuplicates.map((duplicate) => duplicate.health)],
        requiredHosts,
        alsoListen,
      );
      await stopDuplicateServers(liveDuplicates, { reloadKey });
      await requestShutdown(liveUrl, { reloadKey, reason: serverReplacementReason(VERSION, health) });
      if (!(await waitForPortFree(liveUrl, 3000))) break;
      await startServer(port, { alsoListen });
      deadline = Date.now() + 5000;
      continue;
    }
    if (health?.network_stale === true && health.app === "textcast-chat-axi") {
      if (networkRestarted) {
        if (liveMissing.length > 0) throw missingHostsError(port, liveMissing);
        return adoptServer(liveUrl, liveDuplicates, reloadKey);
      }
      alsoListen = inheritedListenHosts([health], requiredHosts, alsoListen);
      await requestShutdown(liveUrl, { reloadKey, reason: "" });
      if (!(await waitForPortFree(liveUrl, 3000))) break;
      await startServer(port, { alsoListen });
      networkRestarted = true;
      deadline = Date.now() + 5000;
      continue;
    }
    await delay(100);
  }
  if (unidentified) throw unidentifiedListenerError(unidentified);
  throw new AxiError("Textcast Chat server did not start", "SERVER_ERROR", [
    `Run \`textcast-chat-axi server --port ${port}\` to inspect server startup`,
  ]);
}

function missingHostsError(port, missingHosts) {
  return new AxiError(
    `The Textcast Chat server on port ${port} does not serve ${missingHosts.join(", ")}, and replacing it did not stick`,
    "SERVER_ERROR",
    ["Run `textcast-chat-axi stop`, then retry"],
  );
}

// Pure helper so the upgrade-detection logic is unit-testable without spinning up HTTP.
// Returns true when the running server is a different (or pre-handshake) version than
// what this CLI was built with - i.e. the user just upgraded and the stale server needs
// to step aside.
export function shouldRestartServer(currentVersion, healthBody, forceRestart = false) {
  if (!healthBody || typeof healthBody !== "object") return false;
  if (forceRestart && healthBody.app === "textcast-chat-axi") return true;
  if (healthBody.network_stale === true && healthBody.app === "textcast-chat-axi") return true;
  if (typeof healthBody.version !== "string" || healthBody.version === "") return true;
  return isServerOlderThanCli(currentVersion, healthBody.version);
}

// A running server newer than this CLI is adopted, never replaced: two installed versions on one
// machine would otherwise restart each other's server in turn. Numeric, so 0.1.9 is older than
// 0.1.10. A version that does not parse falls back to "different means replace".
function isServerOlderThanCli(currentVersion, runningVersion) {
  if (runningVersion === currentVersion) return false;
  const current = parseReleaseVersion(currentVersion);
  const running = parseReleaseVersion(runningVersion);
  if (!current || !running) return true;
  for (let index = 0; index < 3; index += 1) {
    if (running[index] !== current[index]) return running[index] < current[index];
  }
  return false;
}

function parseReleaseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version));
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

// Which branch of `shouldRestartServer` actually fired, because that is what the other open
// review pages are told. A local-build force replaces a server of the SAME version, so calling it
// an upgrade would be false on both counts; only a version this CLI does not match is one.
export function serverReplacementReason(currentVersion, healthBody, forceRestart = false) {
  if (!shouldRestartServer(currentVersion, healthBody, forceRestart)) return "";
  const runningVersion = healthBody.version;
  if (
    typeof runningVersion !== "string" ||
    runningVersion === "" ||
    isServerOlderThanCli(currentVersion, runningVersion)
  ) {
    return "upgrade";
  }
  return forceRestart ? "local-build" : "";
}

export function shouldForceRestartForLocalBuild(executablePath, sourceServerExists = localSourceServerExists()) {
  const localBuildEntry = fileURLToPath(new URL("../dist/cli.mjs", import.meta.url));
  return sourceServerExists && path.resolve(executablePath) === path.resolve(localBuildEntry);
}

// The CLI entry of a source checkout (not the bundled dist build, and never an installed package,
// which ships no bin/ source entry beside its src/).
export function isLocalSourceEntry(executablePath, sourceServerExists = localSourceServerExists()) {
  const sourceEntry = fileURLToPath(new URL("../bin/textcast-chat-axi.js", import.meta.url));
  return sourceServerExists && path.resolve(executablePath) === path.resolve(sourceEntry);
}

// Whether any source file changed after `startedAt` (ms). A server too old to report when it
// started is treated as changed.
export async function localSourceChangedSince(
  startedAt,
  sourceDir = fileURLToPath(new URL("../src/", import.meta.url)),
) {
  if (typeof startedAt !== "number" || !Number.isFinite(startedAt)) return true;
  let names;
  try {
    names = await readdir(sourceDir);
  } catch {
    return false;
  }
  for (const name of names) {
    if (!/\.(js|css)$/.test(name)) continue;
    try {
      if ((await stat(path.join(sourceDir, name))).mtimeMs > startedAt) return true;
    } catch {
      // A file removed mid-scan says nothing about the rest.
    }
  }
  return false;
}

function localSourceServerExists() {
  return existsSync(fileURLToPath(new URL("../src/server.js", import.meta.url)));
}

export function shouldKillProcessOnPort(currentVersion, healthBody) {
  if (!healthBody || typeof healthBody !== "object") return false;
  if (typeof healthBody.version !== "string" || healthBody.version === "") return true;
  if (healthBody.app !== "textcast-chat-axi") return false;
  return isServerOlderThanCli(currentVersion, healthBody.version);
}

async function canControlServerOnPort(baseUrl, healthBody, processMatchesTextcast) {
  if (!healthBody || typeof healthBody !== "object") return false;
  if (healthBody.app === "textcast-chat-axi") return true;
  if (typeof healthBody.version === "string" && healthBody.version !== "") return false;
  return processMatchesTextcast(baseUrl);
}

/**
 * @param {string} baseUrl
 * @param {{ reconcileNetwork?: boolean, timeoutMs?: number }} [options]
 */
// Plain node:http with the socket destroyed on every exit path, not fetch: an aborted fetch leaves
// its TCP connect running, and discovery dials every local address - including a Tailscale IPv6
// address that silently drops connections to itself - so each CLI invocation lingered for the OS
// connect timeout (~10s) after printing its result.
function fetchHealth(baseUrl, { reconcileNetwork = false, timeoutMs = DEFAULT_HEALTH_TIMEOUT_MS } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    /** @type {import("node:http").ClientRequest | null} */
    let request = null;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      request?.destroy();
      resolve(value);
    };
    const abort = () => finish(null);
    const timer = setTimeout(abort, timeoutMs);
    try {
      const url = new URL(`${baseUrl}/health${reconcileNetwork ? "?reconcile_network=1" : ""}`);
      request = httpGet(url, { agent: false }, (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
          if (body.length > MAX_HEALTH_BODY_BYTES) finish(null);
        });
        response.on("end", () => {
          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            finish(null);
            return;
          }
          try {
            finish(JSON.parse(body));
          } catch {
            finish(null);
          }
        });
        response.on("error", abort);
      });
      request.on("error", abort);
    } catch {
      abort();
    }
  });
}

// `reason` is what every other open review page is told: this CLI has exactly two callers, and
// each knows which of them it is.
async function requestShutdown(baseUrl, { reloadKey = "", reason = "" } = {}) {
  const body = {};
  if (reloadKey) body.reload_key = reloadKey;
  if (reason) body.reason = reason;
  try {
    await fetch(`${baseUrl}/shutdown`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Best effort. If the server died before answering, the port will free up on its own.
  }
}

async function waitForPortFree(baseUrl, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await fetchHealth(baseUrl))) return true;
    await delay(100);
  }
  return false;
}

// PIDs listening on exactly this server's address and port whose command is textcast. Other
// processes can share the port at other addresses, so nothing is identified by port alone.
// macOS/Linux only (lsof) - textcast-chat-axi isn't shipped for Windows today.
function textcastListenerPids(baseUrl) {
  const { hostname, port } = new URL(baseUrl);
  try {
    const listing = spawnSync("lsof", ["-t", `-iTCP@${hostname}:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
    if (listing.status !== 0) return [];
    const pids = [];
    for (const line of listing.stdout.split("\n")) {
      const pid = Number(line.trim());
      if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) continue;
      const command = spawnSync("ps", ["-p", String(pid), "-o", "command="], { encoding: "utf8" });
      if (command.status === 0 && /textcast-chat-axi/.test(command.stdout)) pids.push(pid);
    }
    return pids;
  } catch {
    return [];
  }
}

function listenerMatchesTextcast(baseUrl) {
  return textcastListenerPids(baseUrl).length > 0;
}

// Last-resort fallback for the bootstrap upgrade case: a pre-handshake server is squatting on the
// port and doesn't expose /shutdown, so its PID is resolved and SIGTERM'd. Reports whether a Textcast Chat
// process was found to signal.
function killTextcastListener(baseUrl) {
  const pids = textcastListenerPids(baseUrl);
  for (const pid of pids) {
    try {
      process.kill(pid, "SIGTERM");
    } catch {
      // Process already gone or permission denied - either way nothing we can do.
    }
  }
  return pids.length > 0;
}

function unidentifiedListenerError(baseUrl) {
  const { host } = new URL(baseUrl);
  return new AxiError(
    `The server at ${host} did not shut down, and no Textcast Chat process listening there could be identified`,
    "SERVER_ERROR",
    [`Stop the process listening on ${host} yourself, or set TEXTCAST_CHAT_AXI_PORT to another port`],
  );
}

async function startServer(port, { alsoListen = [] } = {}) {
  await ensureStateDir();
  const entry = resolveServerEntry();
  let logFd = null;
  try {
    logFd = openSync(serverLogFile(), "a");
  } catch {
    // If logging cannot be initialized, keep the server behavior unchanged.
  }
  try {
    const args = [entry, "server", "--port", String(port)];
    for (const host of alsoListen) args.push("--also-listen", host);
    const child = spawn(process.execPath, args, createServerSpawnOptions(logFd));
    child.unref();
  } finally {
    if (logFd !== null) closeSync(logFd);
  }
}

// The detached server child must stamp stdio before evaluating the CLI. In source layout that
// is `../bin/textcast-chat-axi-server.js`. In the published bundle only `dist/` ships, so the sibling
// `server.mjs` bootstrap is the entry. Ordinary user-facing commands still use `bin/textcast-chat-axi.js`
// / `dist/cli.mjs`.
function resolveServerEntry() {
  const sourceEntry = fileURLToPath(new URL("../bin/textcast-chat-axi-server.js", import.meta.url));
  if (existsSync(sourceEntry)) return sourceEntry;
  return fileURLToPath(new URL("./server.mjs", import.meta.url));
}

/**
 * @param {number | null} logFd
 * @returns {import("node:child_process").SpawnOptions}
 */
export function createServerSpawnOptions(logFd = null) {
  const stdio = /** @type {import("node:child_process").StdioOptions} */ (
    logFd === null ? "ignore" : ["ignore", logFd, logFd]
  );
  return {
    detached: true,
    stdio,
    env: { ...process.env, TEXTCAST_CHAT_AXI_NO_OPEN: "1" },
  };
}

/**
 * @param {string} url
 * @param {{ retries?: number, retryDelayMs?: number, onResponse?: ((response: Response) => void) | null, method?: string, headers?: Record<string, string>, body?: string }} [options]
 */
export async function fetchJson(
  url,
  { retries = 0, retryDelayMs = 250, onResponse = null, method = "GET", headers, body } = {},
) {
  let response;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      response = await fetch(url, {
        method,
        ...(headers ? { headers } : {}),
        ...(body === undefined ? {} : { body }),
      });
      break;
    } catch (error) {
      if (error instanceof AxiError) throw error;
      if (attempt >= retries) throw serverConnectionError();
      await delay(retryDelayMs);
    }
  }

  if (!response) throw serverConnectionError();
  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      // Keep the generic transport error when the server did not send JSON.
    }
    if (payload?.code) {
      const holder = payload.code.startsWith("LISTENER_") && payload.holder;
      const holderDetail =
        holder && typeof holder.label === "string" && Number.isFinite(holder.age_ms)
          ? ` (current listener: ${holder.label}; active for ${Math.max(0, holder.age_ms)}ms)`
          : "";
      const error = new AxiError(
        `${payload.error || `Textcast Chat request failed: ${response.status}`}${holderDetail}`,
        payload.code,
        ["Use --takeover only when you intend to displace the current listener"],
      );
      if (holder) Object.assign(error, { holder });
      throw error;
    }
    throw new AxiError(`Textcast Chat request failed: ${response.status}`, "SERVER_ERROR");
  }
  onResponse?.(response);
  try {
    return await response.json();
  } catch {
    throw pollResponseInterruptedError();
  }
}

async function postJson(url, body) {
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw serverConnectionError();
  }
  if (!response.ok) {
    throw new AxiError(`Textcast Chat request failed: ${response.status}`, "SERVER_ERROR");
  }
  return response.json();
}

const AGENT_REPLY_RECEIPT_TIMEOUT_MS = 10_000;

/**
 * @param {string} url
 * @param {string} text
 * @param {string} file
 * @param {{ timeoutMs?: number }} [options]
 */
export async function postAgentReply(url, text, file, { timeoutMs = AGENT_REPLY_RECEIPT_TIMEOUT_MS } = {}) {
  const signal = AbortSignal.timeout(timeoutMs);
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
      signal,
    });
  } catch {
    if (signal.aborted) throw agentReplyReceiptTimeoutError(file, timeoutMs);
    throw new AxiError("Textcast Chat server connection failed", "SERVER_ERROR", [
      "Run `textcast-chat-axi server --verbose` or inspect `~/.textcast-chat-axi/server.log` (`TEXTCAST_CHAT_AXI_STATE_DIR/server.log` when set) for server startup or crash diagnostics",
      `Re-run \`textcast-chat-axi reply ${file} --agent-reply "<message>"\` after the server is reachable`,
    ]);
  }
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    if (signal.aborted) throw agentReplyReceiptTimeoutError(file, timeoutMs);
  }
  if (response.status === 404) {
    throw new AxiError("No active Textcast Chat session for this file", "NOT_FOUND", [
      `Run \`textcast-chat-axi ${file}\` first`,
    ]);
  }
  if (response.status === 409 && payload?.status === "ended") {
    throw new AxiError("Textcast Chat session has ended; reply was not sent", "SESSION_ENDED", [
      createEndedNextStep(file, payload.ended_by),
    ]);
  }
  if (!response.ok || payload?.status !== "sent") {
    throw new AxiError(`Textcast Chat did not accept the agent reply (${response.status})`, "SERVER_ERROR", [
      `Confirm the session is open with \`textcast-chat-axi ${file}\`, then re-run \`textcast-chat-axi reply ${file}\``,
    ]);
  }
  return payload;
}

function agentReplyReceiptTimeoutError(file, timeoutMs) {
  return new AxiError(
    `Textcast Chat did not confirm the agent reply within ${timeoutMs}ms, so acceptance is unknown`,
    "SERVER_ERROR",
    [
      "Run `textcast-chat-axi server --verbose` or inspect `~/.textcast-chat-axi/server.log` (`TEXTCAST_CHAT_AXI_STATE_DIR/server.log` when set) for server diagnostics",
      `Check the Textcast Chat conversation for the reply before re-running \`textcast-chat-axi reply ${file}\`, so it is not posted twice`,
    ],
  );
}

function serverConnectionError() {
  return new AxiError("Textcast Chat server connection failed", "SERVER_ERROR", [
    "Run `textcast-chat-axi server --verbose` or inspect `~/.textcast-chat-axi/server.log` (`TEXTCAST_CHAT_AXI_STATE_DIR/server.log` when set) for server startup or crash diagnostics",
    "Re-run the last `textcast-chat-axi poll <html-file>` command after the server is healthy",
  ]);
}

function pollResponseInterruptedError() {
  return new AxiError("Textcast Chat poll response was interrupted", "SERVER_ERROR", [
    "Run `textcast-chat-axi server --verbose` or inspect `~/.textcast-chat-axi/server.log` (`TEXTCAST_CHAT_AXI_STATE_DIR/server.log` when set) for server startup or crash diagnostics",
    "Re-run the last `textcast-chat-axi poll <html-file>` command after the server is healthy",
  ]);
}

function firstPositionalArg(args, valueFlags = []) {
  const flags = new Set(valueFlags);
  let positionalMode = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!positionalMode && arg === "--") {
      positionalMode = true;
      continue;
    }
    if (!positionalMode && isValueFlagToken(arg, flags)) {
      if (!arg.includes("=")) i += 1;
      continue;
    }
    if (!positionalMode && arg.startsWith("-")) {
      continue;
    }
    return arg;
  }
  return null;
}

function flagValue(args, flag) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") return null;
    if (arg === flag) return args[i + 1] || null;
    if (arg.startsWith(`${flag}=`)) return arg.slice(flag.length + 1) || null;
  }
  return null;
}

function flagValues(args, flag) {
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") break;
    if (arg === flag && args[i + 1]) {
      values.push(args[i + 1]);
      i += 1;
    } else if (arg.startsWith(`${flag}=`) && arg.length > flag.length + 1) {
      values.push(arg.slice(flag.length + 1));
    }
  }
  return values;
}

function inspectValueFlag(args, flag) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") return { present: false };
    if (arg === flag) {
      return { present: true, value: i + 1 < args.length ? args[i + 1] : null, swallows: true };
    }
    if (arg.startsWith(`${flag}=`)) {
      return { present: true, value: arg.slice(flag.length + 1), swallows: false };
    }
  }
  return { present: false };
}

const AGENT_REPLY_FILE_HINT = "Pass --agent-reply-file <path>, or --agent-reply-file - to read stdin";

function agentReplyTooLargeError(suggestion) {
  return new AxiError(`Agent reply exceeds the ${AGENT_REPLY_LIMIT_LABEL}`, "VALIDATION_ERROR", [
    suggestion || "Shorten the reply, then retry the same poll command",
  ]);
}

/**
 * @param {import("node:stream").Readable} stream
 */
async function readAgentReplyStream(stream, tooLargeHelp) {
  const chunks = [];
  let bytes = 0;
  for await (const value of stream) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(value);
    bytes += chunk.length;
    if (bytes > AGENT_REPLY_INPUT_LIMIT_BYTES) {
      stream.destroy();
      throw agentReplyTooLargeError(tooLargeHelp);
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks, bytes).toString("utf8");
  if (Buffer.byteLength(JSON.stringify({ agent_reply: text })) > AGENT_REPLY_JSON_LIMIT_BYTES) {
    throw agentReplyTooLargeError(tooLargeHelp);
  }
  return text;
}

/**
 * Resolve the agent-reply body from `--agent-reply` or `--agent-reply-file`.
 * File/stdin is the path for a longer Markdown body so newlines survive quoting.
 *
 * @param {string[]} args
 * @param {{
 *   createReadStreamFn?: typeof createReadStream,
 *   stdin?: import("node:stream").Readable,
 *   stdinIsTTY?: boolean,
 *   tooLargeHelp?: string,
 * }} [io]
 * @returns {Promise<string | null>}
 */
export async function resolveAgentReply(
  args,
  {
    createReadStreamFn = createReadStream,
    stdin = process.stdin,
    stdinIsTTY = process.stdin.isTTY === true,
    tooLargeHelp = undefined,
  } = {},
) {
  const inline = inspectValueFlag(args, "--agent-reply");
  const fromFile = inspectValueFlag(args, "--agent-reply-file");
  if (inline.present && fromFile.present) {
    throw new AxiError("--agent-reply and --agent-reply-file cannot be combined", "VALIDATION_ERROR", [
      "Pass --agent-reply for a concise quoted reply, or --agent-reply-file <path> (`-` for stdin) when a longer Markdown body is necessary",
    ]);
  }
  if (fromFile.present) {
    return readAgentReplyFile(fromFile, { createReadStreamFn, stdin, stdinIsTTY, tooLargeHelp });
  }
  if (!inline.present) return null;
  return inline.value || null;
}

/**
 * @param {{ present: boolean, value?: string | null, swallows?: boolean }} fromFile
 * @param {{
 *   createReadStreamFn: typeof createReadStream,
 *   stdin: import("node:stream").Readable,
 *   stdinIsTTY: boolean,
 *   tooLargeHelp?: string,
 * }} io
 */
async function readAgentReplyFile(fromFile, { createReadStreamFn, stdin, stdinIsTTY, tooLargeHelp }) {
  if (fromFile.swallows && typeof fromFile.value === "string" && fromFile.value.startsWith("--")) {
    throw new AxiError(
      `--agent-reply-file was given no value: the next argument ${fromFile.value} is another flag, so it would have been used as the path`,
      "VALIDATION_ERROR",
      [AGENT_REPLY_FILE_HINT, "Use --agent-reply-file=<path> if the path itself starts with --"],
    );
  }
  const spec = fromFile.value;
  if (spec == null || !String(spec).trim()) {
    throw new AxiError("--agent-reply-file was given an empty value", "VALIDATION_ERROR", [AGENT_REPLY_FILE_HINT]);
  }
  let text;
  if (spec === "-") {
    if (stdinIsTTY) {
      throw new AxiError("--agent-reply-file - cannot read stdin from a terminal", "VALIDATION_ERROR", [
        "Pipe a Markdown body into stdin, or pass --agent-reply-file <path>",
      ]);
    }
    try {
      text = await readAgentReplyStream(stdin, tooLargeHelp);
    } catch (error) {
      if (error instanceof AxiError) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new AxiError(`Cannot read --agent-reply-file stdin: ${detail}`, "VALIDATION_ERROR", [
        "Pipe a Markdown body into stdin, or pass --agent-reply-file <path>",
      ]);
    }
  } else {
    try {
      text = await readAgentReplyStream(createReadStreamFn(spec), tooLargeHelp);
    } catch (error) {
      if (error instanceof AxiError) throw error;
      const detail = error instanceof Error ? error.message : String(error);
      throw new AxiError(`Cannot read --agent-reply-file ${spec}: ${detail}`, "VALIDATION_ERROR", [
        "Pass a UTF-8 Markdown file, or `-` to read stdin",
      ]);
    }
  }
  if (!String(text || "").trim()) {
    throw new AxiError("--agent-reply-file was empty", "VALIDATION_ERROR", [
      'Write Markdown into the file, or pass --agent-reply "<message>" for a concise reply',
    ]);
  }
  return String(text);
}

function isValueFlagToken(arg, flags) {
  for (const flag of flags) {
    if (arg === flag || arg.startsWith(`${flag}=`)) return true;
  }
  return false;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCommandHelp(command, { agent = "generic" } = {}) {
  return createCommandHelp({ agent })[command] || null;
}

function createTopLevelHelp({ agent = "generic" } = {}) {
  return `textcast-chat-axi - Textcast Chat AXI\n\nUsage:\n  textcast-chat-axi\n  textcast-chat-axi <html-file> [--no-open] [--reopen]\n  textcast-chat-axi poll <html-file> [--owner <label>] [--takeover] [--agent-reply "..."] [--agent-reply-file <path>]\n  textcast-chat-axi reply <html-file> (--agent-reply "..." | --agent-reply-file <path>)\n  textcast-chat-axi end <html-file>\n  textcast-chat-axi restart [<html-file>]\n  textcast-chat-axi stop\n\nNote: poll long-polls until the user sends feedback, ends the session, or leaves every review window disconnected past the reconnect grace period, staying silent while it waits - never kill it. Do not pass --timeout-ms during normal agent use; it is for tests and debugging only. ${pollExecutionGuidance({ agent })} ${POLL_SEND_AND_END_RULE} Use \`textcast-chat-axi reply\` when handing a result back without waiting for more feedback: it exits 0 only after the server accepts the reply, so the board stops showing Working. \`poll --agent-reply\` posts a reply and then keeps waiting.\n\n`;
}

function createCommandHelp({ agent = "generic" } = {}) {
  return {
    open: `Usage: textcast-chat-axi <html-file> [--no-open] [--reopen]\n\nOpen or resume a Textcast Chat review session for an HTML artifact. Use --no-open when you need to ensure the server/session exists without opening another browser window. If the user explicitly ended the session from the browser, this refuses to reopen it and returns guidance instead - pass --reopen to force it open when the user asks for further review or something important needs their visual attention. Sessions ended by the agent (\`textcast-chat-axi end\`) reopen normally without the flag.\n`,
    poll: `Usage: textcast-chat-axi poll <html-file> [--owner <label>] [--takeover] [--agent-reply "..."] [--agent-reply-file <path>]\n\nThis command exclusively long-polls for queued user prompts. Pass --owner <label> to make the active listener visible in session listings; --takeover displaces an existing listener, which receives LISTENER_REPLACED. A second poll without --takeover fails with LISTENER_ACTIVE instead of silently returning waiting.\n\nThis command long-polls indefinitely for queued user prompts. It stays silent while it waits - that is normal, never kill it. The only response that arrives without user action is artifact_failures - a fatal failure that made the review surface itself unusable. Do not pass --timeout-ms during normal agent use; it is for tests and debugging only. In a Herdr-managed pane, set TEXTCAST_CHAT_AXI_HERDR_CHIME=1 to request attention when the poll has entered its waiting state; unset it or use any other value to keep the current silent behavior. Notification failures never interrupt the poll. ${pollExecutionGuidance({ agent })} Use --agent-reply after applying prior feedback to display a concise response in Textcast Chat before waiting again. When you are handing a result back and are not about to long-poll, run \`textcast-chat-axi reply <html-file> --agent-reply "..."\` instead: that command exits 0 only after the server accepts the reply, so the board stops showing Working without this poll staying open. ${POLL_AGENT_REPLY_RULE} ${POLL_AGENT_REPLY_HELP_POINTER} Do not combine --agent-reply with --agent-reply-file.\n\nExamples:\n  textcast-chat-axi poll report.html --agent-reply "Renamed the payment step."\n  textcast-chat-axi poll report.html --agent-reply-file reply.md\n  textcast-chat-axi poll report.html --agent-reply-file -\n\n${POLL_SEND_AND_END_RULE}\n`,
    reply: `Usage: textcast-chat-axi reply <html-file> (--agent-reply "..." | --agent-reply-file <path>)\n\nPost an agent reply to the open Textcast Chat session and exit once the server confirms it was accepted. Exit 0 only when the server answers that the reply was sent, which is when the board stops showing Working. If that answer does not arrive within ${AGENT_REPLY_RECEIPT_TIMEOUT_MS / 1000} seconds, exit non-zero with a timeout error. Use this when you are handing a result back and are not about to wait for more feedback. A reply also marks every note the poll delivered to you as Done in the reviewer's panel, so reply once you have handled them.\n\nUse \`textcast-chat-axi poll <html-file> --agent-reply "..."\` instead when the reply should be followed by a long-poll. That command posts the reply and then keeps waiting, so it does not exit when the reply is accepted.\n\nPass exactly one of --agent-reply or --agent-reply-file. ${POLL_AGENT_REPLY_RULE} ${POLL_AGENT_REPLY_HELP_POINTER} Do not combine the two flags. An empty reply is refused.\n\nExamples:\n  textcast-chat-axi reply report.html --agent-reply "Renamed the payment step."\n  textcast-chat-axi reply report.html --agent-reply-file reply.md\n  textcast-chat-axi reply report.html --agent-reply-file -\n`,
    end: `Usage: textcast-chat-axi end <html-file>\n\nEnd a Textcast Chat session as the agent. A session ended this way still reopens normally on the next \`textcast-chat-axi <html-file>\`, unlike a user ending it from the browser, which requires --reopen.\n`,
    restart: `Usage: textcast-chat-axi restart [<html-file>]\n\nRestart the background Textcast Chat server: stop the running one and start a fresh one from this installation. Pass the review's html file to have that review window reload onto the new server; other open review windows show a notice with a reload button. A poll that was waiting on the old server stops with a server error; run it again - feedback stays queued until delivered. Opening a page already replaces a server from an older release, so this is for when the running server needs a fresh start anyway.\n`,
    stop: `Usage: textcast-chat-axi stop [--port <port>]\n\nShut down the background Textcast Chat server. The server also stops itself when no browser or poll has been connected for a while (TEXTCAST_CHAT_AXI_IDLE_TIMEOUT_MS, default 30m) and immediately when the last session ends with nothing connected.\n`,
    server: `Usage: textcast-chat-axi server [--port 4397] [--verbose] [--also-listen <host>...]\n\nRun the local Textcast Chat server. Pass --verbose (or set TEXTCAST_CHAT_AXI_DEBUG=1) to log session and watcher events to stderr. Detached server output is appended to ~/.textcast-chat-axi/server.log, or TEXTCAST_CHAT_AXI_STATE_DIR/server.log when set, for startup and crash diagnostics.\n\nBy default Textcast Chat binds to 127.0.0.1 and, when Tailscale is running, this machine's Tailscale IPv4. Any explicit TEXTCAST_CHAT_AXI_HOST overrides automatic Tailscale binding; wildcard values such as 0.0.0.0 or :: are restricted to loopback. An explicit non-wildcard TEXTCAST_CHAT_AXI_HOST sets the bind address, and the server also listens on 127.0.0.1 so every local CLI finds it; --also-listen adds further concrete addresses (the CLI passes it when it replaces a server, to keep every address the old one served). An address that cannot be bound is retried in the background and reported as network_warning. Binding beyond loopback exposes an unauthenticated server that can read and serve arbitrary local files to anything that can reach it, so only do so on a trusted network. With automatic binding enabled, a successfully bound Tailscale listener uses its MagicDNS name in generated session links; otherwise TEXTCAST_CHAT_AXI_LINK_HOST can set the link hostname. See README's Allowed hosts section for Host allowlisting and TEXTCAST_CHAT_AXI_ALLOWED_HOSTS. TEXTCAST_CHAT_AXI_NO_OPEN=1 (or --no-open) suppresses the local browser launch.\n`,
  };
}
