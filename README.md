<h1 align="center">textcast-chat-axi</h1>
<p align="center">
  <a href="https://github.com/veardk/textcast-chat-axi/actions/workflows/ci.yml"
    ><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/veardk/textcast-chat-axi/ci.yml?style=flat-square&label=ci"
  /></a>
  <a href="https://github.com/veardk/textcast-chat-axi/actions/workflows/release-please.yml"
    ><img alt="Release" src="https://img.shields.io/github/actions/workflow/status/veardk/textcast-chat-axi/release-please.yml?style=flat-square&label=release"
  /></a>
  <a href="https://www.npmjs.com/package/textcast-chat-axi"
    ><img alt="npm" src="https://img.shields.io/npm/v/textcast-chat-axi?style=flat-square"
  /></a>
</p>

<h3 align="center">Reading-companion and revision AXI for Textcast.</h3>

> **Local-first.** textcast-chat-axi opens a Textcast page in a local review window and keeps
> the page, conversation, and revision loop on your machine.

Textcast turns a video, podcast, or long text into a single HTML reading page.
textcast-chat-axi opens that page in a local review window where the reader can ask about or annotate any sentence or topic card and send it to the agent.
The agent edits the translation or analysis, republishes the page, and the review window reloads it in place.

- **Local-first** - A local CLI and a local server. Nothing leaves the machine.
- **Sentence-level notes** - Every Textcast segment and topic card has a stable id, so a note arrives at the agent as `span#seg<N>-<src|tgt>-<mode>` or `details#topic-<N>` and points at exactly one line.
- **One loop** - Open, poll, reply. The agent long-polls for the reader's notes and answers in the same conversation panel.

textcast-chat-axi is an [AXI](https://axi.md): its CLI output tells the agent what to do next.

## Quick Start

Textcast's skill runs these for you. By hand:

```sh
npx -y textcast-chat-axi output/<category>/NN-<slug>.html   # open the review window
npx -y textcast-chat-axi poll output/<category>/NN-<slug>.html   # wait for the reader's notes
```

Node 22 or newer is required.

## How It Works

```
┌──────────────────────────┐
│ Textcast publishes       │
│ NN-<slug>.html           │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ textcast-chat-axi <file> │
│ opens the review window  │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ Reader annotates a       │
│ sentence or topic card,  │
│ or sends a message       │
└────────────┬─────────────┘
             ▼
┌──────────────────────────┐
│ textcast-chat-axi poll   │
│ returns the notes; the   │
│ agent edits, republishes │
└──────────────────────────┘
```

- **File-path identity** - Sessions are keyed by the canonical HTML file path, so agents do not need opaque IDs. Republishing a Textcast page keeps its path, so the session survives.
- **Sandboxed page** - The page runs in a sandboxed iframe while a small injected SDK handles annotations and feedback controls. The served page is otherwise byte-for-byte the file on disk, so it renders the same whether opened here or directly in a browser.
  Author-defined links and popups open in top-level tabs, while the page itself stays sandboxed without same-origin access.
- **Moving between pages** - A link to another HTML page of the same site - the transcript, its summary, the index - keeps the review open: the chrome moves the session to that page, so asking about text keeps working there, and live reload follows it. The site is the nearest directory up to four levels above the opened file that holds a Textcast `textcast.json`, or else the file's own directory; links outside it, to other sites, or into new tabs behave as the page wrote them. A note written on another page carries that file's absolute path as its `page`, and the poll tells the agent to edit that file.
- **Video player** - A Textcast page cannot run a YouTube or Bilibili embed inside the sandbox, so clicking a timestamp hands the video id and start second to the review window, which plays it in a floating player. The window builds the embed URL itself; the page cannot point it anywhere else. On a page with a video, the More menu (⋮) has a "Play the video when a line is clicked" switch; off, clicking the transcript plays nothing and opens no tab. The choice is kept per browser.
- **Draggable launcher, panel, and player** - On desktop the round launcher, the conversation panel (by its header), and the player (by the grip at its top) can be dragged. The launcher settles against the nearer side edge and hides while the panel is open; an undragged panel opens beside the launcher. The player has no title bar: its grip and close button appear on hover, and dragging any edge or corner resizes it at 16:9, never below its default size or past the window. Positions and the player size are kept per browser. Phones keep the fixed bottom sheet.
- **Language** - The review window and the in-page Ask card follow the page's `<html lang>`: Simplified Chinese pages get Chinese controls, everything else English.
- **Load notice** - Nothing covers the page while it loads. If the review cannot load at all - the window's own script never runs, or the server does not answer after several retries - a small notice at the top names the problem and offers **Check and reload**. **Dismiss** always closes it.
  A review already open in another tab is named the same way, with a **Take over here** button, because a page loads in one tab at a time. The takeover warning reads "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along."
- **Revisions legend** - Opt-in. The agent can declare what it changed in the page: one `<script type="application/json" data-textcast-revisions>` array of `{ id, label, timestamp, summary }` entries, plus `data-textcast-revision="<id>"` on each block it edited or added.
  A **Revisions** button then appears in the top bar with a legend listing each round - colour swatch, label, time, and the agent's summary - and **Reveal** steps through that round's changed blocks, flashing them one at a time.
  Each swatch carries a distinct border style and fill pattern as well as a colour. Pages with no registry show no button, a malformed registry is ignored, and at most 6 revisions are listed. The legend lives in the review window, never in the page.
- **Live tab title and icon** - The browser tab adopts the page's `<title>` and first `<link rel="icon">` when it loads. A page can update them afterwards with `window.textcast.setDocumentMeta({ title, icon })`: a string sets the field, `null` restores the load-time value, and an omitted field is left alone. The title is trimmed to 120 characters and shown as `<title> · Textcast Chat`; the icon must be a `data:image/svg+xml` URL of at most 8192 characters. Feature-detect with `window.textcast?.setDocumentMeta?.(...)`.
- **Local assets** - Images, CSS, fonts, and scripts next to the HTML file load through relative paths from that directory; root-prefixed paths such as `/assets/logo.png` do not resolve.
- **Live reload** - The HTML file is watched and the page reloads when it changes, keeping the iframe scroll position, an open annotation card's unsent text, and answers to `data-textcast-question` controls. Review state and the unsent queue are saved in that tab's `sessionStorage` and survive a full reload of the same tab; they are not shared with other tabs. To also reload on sibling asset changes, add `data-textcast-live-reload-root` to the root element or `<meta name="textcast-live-reload" content="root">`.
  If the element an unsent annotation was attached to is gone for good, or the page replaces a queued note while you are editing it, your text is kept in the conversation panel under **Unsent annotation** - never written over anything you have typed, and kept across reloads.
- **Feedback controls** - Native controls (radios, checkboxes, inputs, selects, buttons, labels, disclosure summaries, contenteditable) and custom widgets with an interactive ARIA role (`button`, `checkbox`, `combobox`, `menuitem`, `menuitemcheckbox`, `menuitemradio`, `option`, `radio`, `switch`, `tab`, `treeitem`) stay interactive automatically. A link (`<a href>`) stays annotatable when it carries one of these roles or sits inside such a widget.
  A page can start in explore mode with `data-textcast-annotate="off"` on the root `<html>` element. Annotation is on by default; the toolbar can override the page default, and the choice persists across reloads of the page.
  A page can queue an answer itself with `window.textcast.queuePrompt()`. Mark custom (non-native) clickable elements with `data-textcast-action` so they are not annotated, and use `data-textcast-question` or `queueKey` when pre-send updates for the same question should replace each other.
  Everything you send is part of the conversation: a note on an element, a text selection, or a composer message each becomes a bubble with an anchor line naming what it was attached to, a quoted excerpt, and the selector on hover. A queued, unsent note sits at the end as a dashed **Queued** bubble with edit and remove controls; clicking it opens its words for editing and scrolls the page to its element. While its batch is in flight it reads **Sending**, and once the server accepts it, it settles as a sent bubble in every tab of the session. The panel keeps the newest stored transcript up to 5 MiB. Agent replies render a small Markdown subset - paragraphs, line breaks, headings as bold lead lines, bullet and numbered lists, fenced and inline code, bold, italic, and http(s) links; your own messages are never parsed.
  On wider screens the conversation and queued notes share one scrollable panel above a sticky composer. The sidebar button hides the panel so the page takes the full width; while hidden it counts queued notes or marks an unseen agent reply, and the choice is remembered in this browser.
  The overflow menu holds copy path, reload, and end session; the composer has **Send & End** beside **Send to Agent**. Once **Send & End** starts, new feedback pauses, any open annotation draft is kept until delivery succeeds, and that exact final batch is held. A completed reservation survives a page reload. A transient delivery failure permits only retrying the same batch. An attachment rejection (HTTP 400) or an oversized batch (HTTP 413) cancels the reservation without ending the session and keeps the prompts queued for editing.
  Unsent notes belong to the tab where you entered them. An empty **Send to Agent** reports "Nothing queued in this tab." Annotate mode alone does not queue a note; use the annotation card's **Queue** action first. A failed or unacknowledged send keeps the queue and shows recovery guidance unless the transcript proves the server already accepted it.
- **Reviewing on a phone** - Below 860px wide, the page takes the whole screen above a **Conversation** dock, and the conversation opens as a bottom sheet: tap the dock, swipe it up, or press the chevron to raise it; tap the dimmed page, swipe down, press the chevron, or press Escape to lower it. The dock shows queued prompts, an unread reply, or whether the agent is listening. The sheet sizes itself to the visible viewport and keeps the send actions above the keyboard.
- **Keyboard shortcuts** - In the composer, Enter sends queued prompts and Shift+Enter inserts a newline.
  In the annotation card, Enter queues the note, Shift+Enter inserts a newline, and Ctrl+Enter (Cmd+Enter on macOS) queues it and sends everything queued. Escape closes an empty card and does nothing while it holds text or an attachment.
  While editing a queued note, Enter saves it, Shift+Enter inserts a newline, and Escape discards the edit.
  Cmd+I or Ctrl+I toggles annotate and explore mode from anywhere, including inside a textarea.
  In annotate mode a plain click on a link annotates it; Ctrl+click (Cmd+click on macOS) follows it in a new tab.
- **Agent presence** - The window shows when no agent is listening and keeps feedback actions available while the agent works. Feedback accepted by **Send** stays queued on the server for the next `textcast-chat-axi poll`, even across reloads. An agent reply concludes delivered work and returns presence to waiting.
- **Delivery receipts** - Every sent note carries three emoji that light up in turn: 👀 **Seen** when a poll takes it, 🛠️ **Working** when the page file changes after that, and ✅ **Done** when the agent replies. A step that has not happened yet is greyed out. Until 👀 lights, the row says why: no agent is listening, or the agent is busy. A note answered without touching the page goes Seen to Done with Working still grey.
  Closing the last review tab while a poll is active starts a reconnect grace period, 10 seconds by default. If every review stays disconnected, the poll returns `browser_disconnected` without ending the resumable session. Set `TEXTCAST_CHAT_AXI_DISCONNECT_GRACE_MS` on the server to a longer budget, or to `0` or `off` so a disconnect never ends the poll.
  The no-timeout poll writes an immediate stderr banner and adds periodic wait ticks only in an interactive terminal. Stdout is reserved for the final response. If the poll is interrupted, re-run it: feedback stays queued until delivery.
  In a Herdr-managed pane, `TEXTCAST_CHAT_AXI_HERDR_CHIME=1` requests a Herdr notification once an indefinite poll is waiting. It never blocks or fails the poll.
- **Session end etiquette** - A reader clicking **End session** (or **Send & End**) is a user-initiated end; `textcast-chat-axi end <html-file>` is agent-initiated.
  When either side ends the session, every open review tab becomes read-only, and feedback sent after the end is refused.
  A plain `textcast-chat-axi <html-file>` after a user-initiated end refuses to reopen and explains why; pass `--reopen` only when the reader asks for more review. Agent-initiated ends reopen normally.
- **Precise targets** - A note carries the CSS selector of the element it was attached to; Textcast's segment and topic-card ids make that selector name the exact line. Text selections also carry the selected text plus range anchors.
- **Image attachments** - Attach PNG, JPEG, or WebP images in the composer or an annotation card by pasting, drag-dropping, or using the picker; each shows a thumbnail chip with upload, remove, retry, and error states.
  Images are stored under the state dir, and the queued prompt carries a server-generated absolute `path` and content-hash `id` (plus mime and dimensions), never the raw bytes.
  Limits are `TEXTCAST_CHAT_AXI_MAX_ATTACHMENT_BYTES` (default 10 MiB per image), `TEXTCAST_CHAT_AXI_MAX_ATTACHMENTS_PER_PROMPT` (default 4), and `TEXTCAST_CHAT_AXI_MAX_PROMPT_ATTACHMENT_BYTES` (default 25 MiB per prompt). If any image is missing or any prompt breaches a cap, the whole batch is rejected, the queue is kept, and the reason is shown.
  Each review page allows 30 upload attempts per rolling minute, 4 uploads in flight, and 256 MiB of attempted image bytes over its lifetime.
  Unreferenced attachments expire after `TEXTCAST_CHAT_AXI_ATTACHMENT_TTL_MS` (default 7 days; `0`/`off` disables). `TEXTCAST_CHAT_AXI_MAX_ATTACHMENT_DISK_MB` (default 512 MiB; `0`/`off` disables) caps total attachment disk; an upload that still does not fit after reclaiming unreferenced files is refused with a storage-full error.
- **Server cleanup** - The detached server stops after the last session ends with nothing connected, or after `TEXTCAST_CHAT_AXI_IDLE_TIMEOUT_MS` (default 30 minutes) with no browser or poll connections. `0` or `off` disables idle self-shutdown.
- **Server upgrades** - One background server serves every session. Only a newer CLI replaces an older server; an older CLI uses a newer server as is. When a server is replaced, the review page for the file being opened reloads itself once the replacement answers (unless it holds unsent annotation text), and every other open review page shows "Textcast Chat was updated. This page is running the previous version." with **Check and reload** and **Dismiss**. A page whose server goes away shows the same banner after a few seconds of failed reconnects and clears it if the server returns.
  Every **Check and reload** asks the server whether it is running before navigating. In-flight polls end with an interrupted-poll error and are safe to re-run.
- **Local-first state** - Session state lives under `~/.textcast-chat-axi/`, or `TEXTCAST_CHAT_AXI_STATE_DIR` when set.
- **Server port** - `TEXTCAST_CHAT_AXI_PORT` chooses the server port; the default is `4397`.
- **Network binding** - With Tailscale running, the server listens only on loopback (`127.0.0.1`) and this machine's Tailscale IPv4 address - never on `0.0.0.0`. The session link then uses the machine's MagicDNS name, so it opens from a phone on the same tailnet. Without Tailscale, it is loopback-only. Binding beyond loopback exposes an unauthenticated server that can read local files, so the tailnet must be trusted.
  An explicit `TEXTCAST_CHAT_AXI_HOST` overrides automatic Tailscale binding; wildcard values are restricted to loopback, and the server always listens on loopback too. An address that cannot be bound is reported as `network_warning` in the open output and retried in the background. `TEXTCAST_CHAT_AXI_LINK_HOST` sets the link host when automatic Tailscale binding is off.
- **Running from a source checkout** - The server reads the chrome page, script, and stylesheet once when it starts, so a page and its script always come from the same code. `bin/textcast-chat-axi.js` replaces a running server whose source files changed after it started, and reloads the review window it opens; a published install never does this, since its files do not change under it.
- **One server per port** - CLIs with different `TEXTCAST_CHAT_AXI_HOST` settings share one server: a server not yet listening on a requested address is replaced once by one that listens on it plus every address the old one served, keeping all sessions. Run `textcast-chat-axi stop` first to drop an address. A server belonging to another state directory is never used, replaced, or stopped; pick another `TEXTCAST_CHAT_AXI_PORT`.
- **Allowed hosts** - The server rejects (`403`) any request whose `Host` header is not one it answers to: loopback names plus the bound Tailscale address and MagicDNS name. List reverse-proxy or other intentional hostnames in `TEXTCAST_CHAT_AXI_ALLOWED_HOSTS` (whitespace-separated); `X-Forwarded-Host` is validated against the same list. `*` disables the check and is only for a server behind your own authentication. Mutating routes also reject a foreign `Origin` or `Referer`.
- **Browser opening** - `TEXTCAST_CHAT_AXI_NO_OPEN=1`, like `--no-open`, creates or resumes a session without opening a browser window.

## CLI Reference

| Command                                   | Description                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `textcast-chat-axi`                       | Show current sessions and usage guidance.                                                                                                                                                                                                                                                                                                                                                                                  |
| `textcast-chat-axi update`                | Check for or apply the latest npm release through the AXI SDK self-updater.                                                                                                                                                                                                                                                                                                                                                |
| `textcast-chat-axi <html-file>`           | Open or resume a review session. Refuses to reopen a session the reader ended from the browser unless `--reopen` is passed.                                                                                                                                                                                                                                                                                                |
| `textcast-chat-axi poll <html-file>`      | Long-poll until the reader sends feedback, ends the session, or leaves every review disconnected past the reconnect grace period. On `browser_disconnected`, ask before reopening or ending the resumable session. On `ended` (and on the last batch before an end) the output carries `stop_polling: true`: stop polling and do not reopen uninvited. Reopening an ended session reloads any review tab still showing it. |
| `textcast-chat-axi reply <html-file>`     | Post an agent reply and exit 0 only after the server accepts it, so the review stops showing Working. Use this when handing a result back without starting another poll.                                                                                                                                                                                                                                                   |
| `textcast-chat-axi end <html-file>`       | End a session as the agent; unlike a reader-initiated end, this still allows a plain reopen later.                                                                                                                                                                                                                                                                                                                         |
| `textcast-chat-axi restart [<html-file>]` | Restart the background server. With a file, that review window reloads onto the new server; other open windows show a notice with a reload button. A poll waiting on the old server stops with an error and is run again.                                                                                                                                                                                                  |
| `textcast-chat-axi stop`                  | Shut down the background server.                                                                                                                                                                                                                                                                                                                                                                                           |
| `textcast-chat-axi server`                | Run the local review server.                                                                                                                                                                                                                                                                                                                                                                                               |

### Flags

| Command                         | Flag                        | Description                                                                                                                                                                                         |
| ------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `textcast-chat-axi <html-file>` | `--no-open`                 | Ensure the server and session exist without opening another browser window.                                                                                                                         |
| `textcast-chat-axi <html-file>` | `--reopen`                  | Reopen a session the reader ended from the browser.                                                                                                                                                 |
| `textcast-chat-axi update`      | `--check`                   | Report current vs latest npm version without installing.                                                                                                                                            |
| `textcast-chat-axi poll`        | `--owner <label>`           | Name the process listening for this session; the label appears in the home listing. A second concurrent poll is refused.                                                                            |
| `textcast-chat-axi poll`        | `--takeover`                | Displace the current poll listener. The displaced poll exits with `LISTENER_REPLACED`; without this flag the new poll fails with `LISTENER_ACTIVE`.                                                 |
| `textcast-chat-axi poll`        | `--agent-reply "..."`       | Show a concise reply in the conversation, mark every note the agent has seen as Done, and keep polling.                                                                                             |
| `textcast-chat-axi poll`        | `--agent-reply-file <path>` | Read a longer Markdown reply from a file (`-` for stdin) so newlines survive quoting. Cannot be combined with `--agent-reply`.                                                                      |
| `textcast-chat-axi poll`        | `--timeout-ms <ms>`         | Test and debug only; agents should omit it.                                                                                                                                                         |
| `textcast-chat-axi reply`       | `--agent-reply "..."`       | Reply text, required unless `--agent-reply-file` is set. Empty text is refused.                                                                                                                     |
| `textcast-chat-axi reply`       | `--agent-reply-file <path>` | Read the reply from a file (`-` for stdin). Cannot be combined with `--agent-reply`.                                                                                                                |
| `textcast-chat-axi stop`        | `--port <port>`             | Shut down a server on a non-default port.                                                                                                                                                           |
| `textcast-chat-axi server`      | `--verbose`                 | Log session and watcher events to stderr (also `TEXTCAST_CHAT_AXI_DEBUG=1`). Detached server output is appended to `~/.textcast-chat-axi/server.log` (or `TEXTCAST_CHAT_AXI_STATE_DIR/server.log`). |
| `textcast-chat-axi server`      | `--also-listen <host>`      | Also listen on this concrete address (repeatable). The CLI passes it when replacing a running server; see One server per port.                                                                      |

## Telemetry

textcast-chat-axi collects no telemetry and makes no analytics requests.

## Development

```sh
pnpm run check          # build, lint, format check, typecheck, and tests
pnpm run build          # bundle dist/cli.mjs and copy the review window assets
pnpm test               # node:test tests
pnpm run lint           # ESLint
pnpm run format:check   # Prettier check
pnpm run typecheck      # TypeScript checkJs validation
```

## Contributing

Please open an Issue before proposing a change. Pull Requests are currently limited to repository collaborators. See [CONTRIBUTING.md](CONTRIBUTING.md) for the local check and review expectations.

MIT. See [LICENSE](LICENSE). The local review architecture is derived from
[lavish-axi](https://github.com/kunchenguid/lavish-axi) by Kun Chen.
