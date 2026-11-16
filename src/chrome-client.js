/* global document, location, window */

const sessionDataElement = document.getElementById("textcast-session");
const sessionData = JSON.parse(sessionDataElement?.textContent || "{}");
// The page-language translator the server inlines (src/chrome-i18n.js). It takes the formatted
// English, so every string below stays written in English; without it the chrome is English.
const chromeTranslator = /** @type {Record<string, any>} */ (/** @type {unknown} */ (window)).__textcastT;
/** @type {(text: string) => string} */
const t = typeof chromeTranslator === "function" ? chromeTranslator : (text) => String(text);
const key = String(sessionData.key || "");
const filePath = String(sessionData.file || "");
// The page on screen: the session's file, or another page of its site the reader followed a link to.
let currentPage = String(sessionData.page || filePath);
const queueStorageKey = "textcast-chat-axi:queued:" + key;
const terminalStorageKey = "textcast-chat-axi:terminal:" + key;
// Review-chrome state that must survive a browser refresh. Keyed per session so one review's
// triage can never leak into another artifact's.
// Unsent annotation-card text lives only in the sandboxed iframe, so a full page reload would
// destroy it unless the chrome persists what the SDK reports. Keyed per session like the queue,
// so a draft can never reappear over a different artifact.
const reviewStateStorageKey = "textcast-chat-axi:review-state:" + key;
// Drafts Textcast Chat could not replay. The text outlives the draft that carried it, so the user can
// still read and copy it after the anchor it was written against is gone for good.
const retiredDraftStorageKey = "textcast-chat-axi:retired-drafts:" + key;
/** @type {any[]} */
const retiredDraftNodes = [];
const internalQueueKeyField = "_textcastQueueKey";
const promptIdentityField = "prompt_id";
const PROMPT_IDENTITY_MAX = 128;
const PROMPT_IDENTITY_RE = /^[A-Za-z0-9_-]+$/;
const initialChat = Array.isArray(sessionData.initialChat) ? sessionData.initialChat : [];
const initialChatAckIds = Array.isArray(sessionData.initialChatAckIds) ? sessionData.initialChatAckIds : [];
const initialChatRevision = parseChatRevision(sessionData.initialChatRevision) || 0;
const MODE_TOGGLE_HOTKEY_KEY = String(sessionData.modeToggleHotkeyKey || "").toLowerCase();
const attachmentMaxBytes = Number(sessionData.attachmentMaxBytes) || 0;
const attachmentMaxCount = Number(sessionData.attachmentMaxCount) || 4;
// Threaded from the server's single accepted-image list, which also drives the
// file picker's accept attribute, so the two can never disagree. An unwired
// list falls back to the same defaults as the SDK's acceptedImageTypes - an
// empty Set would refuse every image while the card in the same session
// accepts them, the exact divergence the single list exists to prevent.
const CHAT_ATTACHMENT_MIME = new Set(
  (Array.isArray(sessionData.attachmentAcceptedMime) && sessionData.attachmentAcceptedMime.length
    ? sessionData.attachmentAcceptedMime
    : ["image/png", "image/jpeg", "image/webp"]
  ).map(String),
);
// Named in the rejection copy, so the message can never tell the user to use a
// format this build does not accept.
const CHAT_ATTACHMENT_LABELS = (() => {
  const labels = [...CHAT_ATTACHMENT_MIME].map((mime) => mime.replace(/^image\//, "").toUpperCase());
  if (labels.length < 2) return labels.join("");
  return labels.slice(0, -1).join(", ") + (labels.length > 2 ? ", or " : " or ") + labels[labels.length - 1];
})();

// The chrome is the only path from the sandboxed (opaque-origin) artifact iframe to
// the loopback server, so it is the sole place a same-origin confused-deputy can be
// mediated: the frame's postMessage source check proves a message came from the
// artifact frame but NOT that a user gesture (paste/drop/pick) drove it, so hostile
// artifact script could otherwise drive unbounded uploads. Bound both the rate and
// the cumulative bytes per chrome session here; the server keeps a bounded disk
// quota as the durable backstop.
const UPLOAD_RATE_WINDOW_MS = 60_000;
const UPLOAD_RATE_MAX = 30;
const UPLOAD_SESSION_BYTE_QUOTA = 256 * 1024 * 1024; // 256 MiB per chrome session
// The rate and cumulative-byte guards bound uploads over time, but not how many run
// AT ONCE: each accepted message starts fetch() immediately, so a hostile artifact
// could post ~30 large bodies in one tick and hold hundreds of MiB of structured
// clones + server body buffers concurrently before the cumulative quota trips (D8).
// Cap the number in flight; the over-cap ones are refused with a retry hint (like the
// rate guard) and a freed slot admits the next.
const UPLOAD_MAX_IN_FLIGHT = 4;
const uploadTimestamps = [];
let uploadedBytesTotal = 0;
let uploadsInFlight = 0;

function formatByteLimit(bytes) {
  if (bytes >= 1024 * 1024) return Math.round(bytes / (1024 * 1024)) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " bytes";
}

// Turn the server's atomic-reject detail (C4) into one human line naming the cap
// that was hit, so the user knows what to fix. Nothing was delivered - the queue is
// preserved - so the wording is about correcting, not about a partial send.
function describeAttachmentRejection(rejected, caps) {
  const reasons = new Set(rejected.map((ref) => ref && ref.reason));
  const parts = [];
  if (reasons.has("prompt-bytes-exceeded") && caps && caps.maxPromptBytes) {
    parts.push("images exceed the " + formatByteLimit(caps.maxPromptBytes) + " per-prompt limit");
  }
  if (reasons.has("too-many") && caps && caps.maxPerPrompt) {
    parts.push(t("more than " + caps.maxPerPrompt + " images on one prompt"));
  }
  if (reasons.has("too-many-in-request")) {
    parts.push(t("too many images queued at once"));
  }
  if (reasons.has("malformed")) {
    parts.push(t("an image attachment was malformed"));
  }
  if (reasons.has("not-found")) {
    parts.push(t("an image is no longer available"));
  }
  const detail = parts.length ? parts.join("; ") : t("some attachments could not be delivered");
  return t("Not sent — " + detail + ". Remove or fix the image, then send again.");
}

function isModeToggleHotkeyEvent(event) {
  if (event.shiftKey || event.altKey) return false;
  return Boolean(event.metaKey || event.ctrlKey) && String(event.key || "").toLowerCase() === MODE_TOGGLE_HOTKEY_KEY;
}

const frame = /** @type {HTMLIFrameElement} */ (document.getElementById("artifact"));
const panelScroll = /** @type {HTMLDivElement} */ (document.getElementById("panelScroll"));
const queuedLog = /** @type {HTMLDivElement} */ (document.getElementById("queuedLog"));
const chatLog = /** @type {HTMLDivElement} */ (document.getElementById("chatLog"));
const chatComposer = /** @type {HTMLDivElement} */ (document.getElementById("chatComposer"));
const chatInput = /** @type {HTMLTextAreaElement} */ (document.getElementById("chatInput"));
const chatAttachments = /** @type {HTMLDivElement} */ (document.getElementById("chatAttachments"));
const chatAttachButton = /** @type {HTMLButtonElement} */ (document.getElementById("chatAttach"));
const chatAttachInput = /** @type {HTMLInputElement} */ (document.getElementById("chatAttachInput"));
const chatAttachmentNotice = /** @type {HTMLSpanElement} */ (document.getElementById("chatAttachmentNotice"));
const panel = /** @type {HTMLElement} */ (document.getElementById("panel"));
const panelHead = /** @type {HTMLDivElement} */ (document.getElementById("panelHead"));
const panelSummary = /** @type {HTMLSpanElement} */ (document.getElementById("panelSummary"));
const panelClose = /** @type {HTMLButtonElement} */ (document.getElementById("panelClose"));
const launcherPeek = /** @type {HTMLButtonElement} */ (document.getElementById("launcherPeek"));
const launcherPeekText = /** @type {HTMLSpanElement} */ (document.getElementById("launcherPeekText"));
const panelScrim = /** @type {HTMLDivElement} */ (document.getElementById("panelScrim"));
const sidebarToggle = /** @type {HTMLButtonElement} */ (document.getElementById("sidebarToggle"));
const sidebarToggleCount = /** @type {HTMLSpanElement} */ (document.getElementById("sidebarToggleCount"));
const sendButton = /** @type {HTMLButtonElement} */ (document.getElementById("send"));
const sendAndEndButton = /** @type {HTMLButtonElement} */ (document.getElementById("sendAndEnd"));
const annotationSwitch = /** @type {HTMLButtonElement} */ (document.getElementById("annotation"));
const moreWrap = /** @type {HTMLDivElement} */ (document.getElementById("moreWrap"));
const moreButton = /** @type {HTMLButtonElement} */ (document.getElementById("moreButton"));
const moreMenu = /** @type {HTMLDivElement} */ (document.getElementById("moreMenu"));
const reloadArtifactButton = /** @type {HTMLButtonElement} */ (document.getElementById("reloadArtifact"));
const endButton = /** @type {HTMLButtonElement} */ (document.getElementById("end"));
const copyPathButton = /** @type {HTMLButtonElement} */ (document.getElementById("copyPath"));
const copyHint = /** @type {HTMLSpanElement} */ (document.getElementById("copyHint"));
const copyHintText = /** @type {HTMLSpanElement} */ (document.getElementById("copyHintText"));
const composerBox = /** @type {HTMLDivElement} */ (document.getElementById("composerBox"));
const handoffBanner = /** @type {HTMLDivElement} */ (document.getElementById("handoffBanner"));
const handoffTakeoverButton = /** @type {HTMLButtonElement} */ (document.getElementById("handoffTakeover"));
const outdatedBanner = /** @type {HTMLDivElement} */ (document.getElementById("outdatedBanner"));
const outdatedText = /** @type {HTMLSpanElement} */ (document.getElementById("outdatedText"));
const outdatedReloadButton = /** @type {HTMLButtonElement} */ (document.getElementById("outdatedReload"));
const outdatedDismissButton = /** @type {HTMLButtonElement} */ (document.getElementById("outdatedDismiss"));
const reconnectCard = /** @type {HTMLDivElement} */ (document.getElementById("reconnectCard"));
const reconnectTitle = /** @type {HTMLElement} */ (document.getElementById("reconnectTitle"));
const reconnectText = /** @type {HTMLPreElement} */ (document.getElementById("reconnectText"));
const reconnectCopyButton = /** @type {HTMLButtonElement} */ (document.getElementById("reconnectCopy"));
const reconnectCopyText = /** @type {HTMLSpanElement} */ (document.getElementById("reconnectCopyText"));
const loadNotice = /** @type {HTMLDivElement} */ (document.getElementById("loadNotice"));
const loadNoticeTitle = /** @type {HTMLDivElement} */ (document.getElementById("loadNoticeTitle"));
const loadNoticeCopy = /** @type {HTMLParagraphElement} */ (document.getElementById("loadNoticeCopy"));
const loadNoticeAction = /** @type {HTMLButtonElement} */ (document.getElementById("loadNoticeAction"));
const loadNoticeDismiss = /** @type {HTMLButtonElement} */ (document.getElementById("loadNoticeDismiss"));
const revisionsWrap = /** @type {HTMLDivElement} */ (document.getElementById("revisionsWrap"));
const revisionsButton = /** @type {HTMLButtonElement} */ (document.getElementById("revisionsButton"));
const revisionsCount = /** @type {HTMLSpanElement} */ (document.getElementById("revisionsCount"));
const revisionsDrawer = /** @type {HTMLDivElement} */ (document.getElementById("revisionsDrawer"));
const revisionsSummary = /** @type {HTMLParagraphElement} */ (document.getElementById("revisionsSummary"));
const revisionsList = /** @type {HTMLDivElement} */ (document.getElementById("revisionsList"));
const sendHint = /** @type {HTMLDivElement} */ (document.getElementById("sendHint"));
const artifactSrc = frame.dataset.artifactSrc || frame.getAttribute?.("data-artifact-src") || frame.src || "";

const queued = loadQueuedPrompts();
let annotation = true;
// Page defaults follow artifact loads until the reviewer explicitly chooses a mode.
let annotationOverridden = false;
let annotationDefaultReceived = false;
let ended = false;
let agentPresence = "waiting";
// A freshly opened window usually has an agent a few seconds from starting its poll, so "not
// listening" is not news yet: until the first listener (or CONNECT_GRACE_MS) the status line says
// it is connecting and the offline banner stays down.
const CONNECT_GRACE_MS = 15_000;
let connecting = true;
let chromeOutdatedReason = "";
let chromeOutdatedGeneration = 0;
let outdatedReloadInFlight = false;
// The live-event socket reconnects forever on a 5s cap. Silence there is indistinguishable from a
// healthy idle stream, so a page whose server has gone away keeps rendering its last state and
// tells the user nothing until they reload into a connection error. Past this many consecutive
// failures the banner says so, with the health-probed reload the banner already offers.
const LIVE_EVENT_UNREACHABLE_FAILURES = 5;
let liveEventFailures = 0;
// Only a banner this path raised may be hidden by this path: a `chrome-outdated` event means the
// server was replaced, which a reconnect does not disprove.
let unreachableBannerOwned = false;
let unreachableDismissed = false;
/** @type {{ selector: string, revision: number } | null} */
let unrestorableDraftMiss = null;
let retiredDrafts = loadRetiredDrafts();
let loadNoticeActive = false;
// A failure only the user can retire. The artifact-load notice clears itself once a load
// succeeds; the server-replacement notice must not, because the page is still running the
// pre-upgrade client against the replacement server and nothing else would tell the user that.
let loadNoticeSticky = false;
let loadNoticeCycle = 0;
/** @typedef {{ done: Promise<boolean>, finish: (succeeded: boolean) => void }} FeedbackPreparation */
/** @typedef {{ prompts: any[], inFlight: boolean, order: number }} TerminalSubmission */
/** @type {Map<string, { action: "copy" | "submit", prompts?: any[], chatAtRequest?: any[], endAfter?: boolean, terminal?: TerminalSubmission | null, acknowledgement?: object, order?: number, timeout?: ReturnType<typeof setTimeout> }>} */
const snapshotRequests = new Map();
let nextSnapshotRequestId = 0;
let nextSendOperationOrder = 0;
let workingBubble = null;
let displayedChat = initialChat.slice();
let chatRevision = initialChatRevision;
// Settlement is by per-submission identity, not displayed content: two tabs can queue notes
// whose chat projection is identical (same selected text under one container, different range
// boundaries) without settling each other, and a reload after a lost POST response still
// recognizes an already-accepted note.
let submitQueuedPromise = null;
const pendingSubmissions = [];
/** @type {{ prompts?: any[] } | null} */
let activeSubmission = null;
const deliveredPrompts = new WeakSet();
const pendingAcknowledgements = new Set();
/** @type {Set<FeedbackPreparation>} */
const feedbackPreparations = new Set();
/** @type {TerminalSubmission | null} */
let terminalSubmission =
  loadJsonState(terminalStorageKey, false) === true
    ? { prompts: queued.slice(), inFlight: false, order: ++nextSendOperationOrder }
    : null;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let sendAcknowledgementTimer;
let lastScroll = { x: 0, y: 0 };
// The queued note open for editing in the panel, by prompt identity, and its unsaved words.
let editingPromptId = "";
let editingDraft = "";
let editFocusPending = false;
// The selector list last told to the artifact, so a render that changes nothing stays quiet.
// In-iframe review context (an open annotation card's unsent text, textcast-owned question
// answers). The sandbox means the chrome cannot read it back after a reload, so the SDK reports
// it as it changes and the chrome replays it once the new document is up. It is persisted per
// session so a full page reload replays it too.
let lastReviewState = loadJsonState(reviewStateStorageKey, null);
if (lastReviewState && typeof lastReviewState !== "object") lastReviewState = null;
const ARTIFACT_SILENCE_PROBE_MS = 8000;
const ARTIFACT_LOAD_BEGIN_RETRY_DELAYS_MS = [100, 300];
// Backoff for retrying a whole begin-load attempt after its in-call retries ran out. The
// in-call retries span 400ms, which only covers a slow response - not the multi-second window
// where the server is being replaced (a version-driven restart, or another `textcast-chat-axi <file>`
// invocation restarting the shared server). Without these the chrome abandons the artifact for
// good: the frame is never navigated, `artifact_revision` never advances, and the page sits on
// the layout gate and then on an empty frame with nothing to click.
const ARTIFACT_LOAD_RECOVERY_DELAYS_MS = [1000, 3000, 8000, 20000];
// How long a chrome told to reload after a server restart keeps probing /health before giving
// up, and how long it waits for an outage to appear at all before treating a healthy answer as
// "the server never went away".
const CHROME_RESTART_SETTLE_MS = 5000;
const CHROME_RESTART_WAIT_MS = 60000;
// Probe fast while the replacement is expected to bind, then back off: a server that never comes
// back would otherwise spend the whole wait filling the network log with refused connections.
const CHROME_RESTART_PROBE_MS = 100;
const CHROME_RESTART_SLOW_PROBE_MS = 500;
// A probe must always settle, so the control that is waiting on it always comes back.
const HEALTH_PROBE_TIMEOUT_MS = 4000;
// A send starts before the artifact snapshot arrives and ends only when /prompts acknowledges the
// batch. Bound that whole wait so a missing SDK response or a browser/network stall can never look
// like a dead button while the user's queue remains safely stored in this tab.
const SEND_ACKNOWLEDGEMENT_WARNING_MS = 10_000;
const TERMINAL_PREPARATION_TIMEOUT_MS = 5000;
// A DOM snapshot adds useful context, but the reviewer's own words are the payload.
// If the artifact frame navigated away from the injected SDK (or otherwise stopped
// answering), deliver those words without a snapshot instead of waiting forever.
const SNAPSHOT_REQUEST_TIMEOUT_MS = 5000;
const SEND_STALLED_COPY = t(
  "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.",
);
const SEND_FAILED_COPY = t(
  "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.",
);
const TERMINAL_SEND_FAILED_COPY = t(
  "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.",
);
const HEALTH_NO_ANSWER_TITLE = t("Textcast Chat did not answer.");
const HEALTH_NO_ANSWER_COPY = t(
  "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.",
);
let artifactLoadToken = "";
let artifactLoadRevision = Number(sessionData.initialArtifactRevision) || 0;
let artifactLoadRequestSequence = Number(sessionData.initialArtifactLoadSequence) || 0;
let chromeLoadToken = String(sessionData.chromeLoadToken || "");
artifactLoadToken = String(sessionData.initialArtifactLoadToken || "");
let artifactSpokeToken = "";
let artifactLoadRecoveryAttempt = 0;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let artifactLoadRecoveryTimer;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let artifactSilenceTimer;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let copyHintTimer;
let reconnectCopyTimer;
/** @type {ReturnType<typeof setTimeout> | undefined} */
let sendHintTimer;
let sendHintPersistent = false;
// Send was pressed while the agent was busy: the notes wait in the queue and go out by themselves
// the moment a poll is listening again.
let sendWhenAgentReady = false;
/** @type {{ kind: "preparation" | "submission" | "terminal", operation: object, preparationType?: string } | null} */
let sendFailureOwner = null;
let sendAcknowledgementWarningVisible = false;

function artifactFrameSrcForLoad(load) {
  const separator = artifactSrc.includes("?") ? "&" : "?";
  return (
    artifactSrc +
    separator +
    "artifact_revision=" +
    encodeURIComponent(load.revision) +
    "&artifact_load_token=" +
    encodeURIComponent(load.token) +
    "&textcast_theme=" +
    encodeURIComponent(currentChromeTheme() || "light")
  );
}

// The inline head script (CHROME_THEME_BOOT_JS) owns applying and storing the page palette; the
// client only forwards the SDK's reports and asks which theme the next page load should open in.
function chromeThemeApi() {
  return /** @type {{ apply?: (raw: unknown, persist: boolean) => unknown, current?: () => string } | undefined} */ (
    /** @type {Record<string, any>} */ (/** @type {unknown} */ (window)).__textcastTheme
  );
}

function currentChromeTheme() {
  return String(chromeThemeApi()?.current?.() || "");
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function loadJsonState(storageKey, fallback) {
  try {
    const raw = sessionStorage.getItem(storageKey);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJsonState(storageKey, value) {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(value));
    return true;
  } catch {
    // The in-memory state still works if browser storage is unavailable.
    return false;
  }
}

// A queued prompt is authored by the untrusted artifact iframe, so its attachment
// refs are validated at the single boundary every prompt crosses before it is
// persisted or rendered. Anything that is not a well-formed `{id}` object is
// dropped: the queue is written to sessionStorage BEFORE it renders, so one bad
// entry would throw out of render(), stay on disk, and throw again on every
// reload - wedging the tab permanently instead of failing once. The card's own
// flow only ever produces `{id, name}`, so a malformed entry is fabricated and
// there is no user image to preserve. The server re-validates independently.
// Each surviving ref is PROJECTED onto a fresh primitives-only object rather than
// kept by reference: postMessage delivers a structured clone, which faithfully
// preserves BigInt values and cycles that `JSON.stringify` then refuses. Passing
// the artifact's own object through would carry that junk into sessionStorage and
// the POST body, where the throw makes the queue unsendable - the same wedge as a
// poisoned entry, just one step later.
function sanitizeAttachmentRefs(value) {
  if (!Array.isArray(value)) return [];
  const refs = [];
  for (const ref of value) {
    if (!ref || typeof ref !== "object" || Array.isArray(ref)) continue;
    if (typeof ref.id !== "string" || !ref.id) continue;
    const projected = { id: ref.id };
    if (typeof ref.name === "string" && ref.name) projected.name = ref.name;
    refs.push(projected);
  }
  return refs;
}

function isPromptIdentity(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= PROMPT_IDENTITY_MAX &&
    PROMPT_IDENTITY_RE.test(value)
  );
}

function promptIdentity(value) {
  return isPromptIdentity(value?.[promptIdentityField]) ? value[promptIdentityField] : "";
}

const chatAckIds = new Set();
function rememberChatAckIds(ids) {
  if (!Array.isArray(ids)) return;
  for (const value of ids) {
    if (isPromptIdentity(value)) chatAckIds.add(value);
  }
}
rememberChatAckIds(initialChatAckIds);

function createPromptIdentity() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
}

function assignPromptIdentity(prompt, keepExisting) {
  if (keepExisting && promptIdentity(prompt)) return prompt;
  prompt[promptIdentityField] = createPromptIdentity();
  return prompt;
}

function adoptQueuedPrompt(rawPrompt, keepIdentity) {
  const prompt = sanitizeQueuedPrompt(rawPrompt);
  if (!prompt) return null;
  if (!keepIdentity) delete prompt[promptIdentityField];
  assignPromptIdentity(prompt, true);
  return prompt;
}

function sanitizeQueuedPrompt(prompt) {
  if (!prompt || typeof prompt !== "object") return null;
  if (!("attachments" in prompt)) return prompt;
  const clean = { ...prompt };
  const refs = sanitizeAttachmentRefs(clean.attachments);
  if (refs.length) clean.attachments = refs;
  else delete clean.attachments;
  return clean;
}

function loadQueuedPrompts() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(queueStorageKey) || "[]");
    // Also sanitize on restore: a tab poisoned before this guard existed still has
    // the bad prompt on disk and would otherwise stay wedged after an upgrade.
    // Keep a stored identity so a reload can settle an already-accepted note; mint
    // one only when the restored prompt predates identity.
    return Array.isArray(parsed) ? parsed.map((item) => adoptQueuedPrompt(item, true)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function persistQueuedPrompts() {
  try {
    if (queued.length) {
      sessionStorage.setItem(queueStorageKey, JSON.stringify(queued));
    } else {
      sessionStorage.removeItem(queueStorageKey);
    }
  } catch {
    // The in-memory queue still works if browser storage is unavailable.
  }
}

function persistTerminalReservation(reserved) {
  try {
    if (reserved) sessionStorage.setItem(terminalStorageKey, "true");
    else sessionStorage.removeItem(terminalStorageKey);
  } catch {
    // Session storage can be unavailable; the in-memory reservation still protects this page.
  }
}

const REMOVE_ICON_SVG =
  '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false"><path d="M1 1L9 9M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const EDIT_ICON_SVG =
  '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" focusable="false"><path d="M6.5 1.5L8.5 3.5L3.5 8.5H1.5V6.5L6.5 1.5Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>';
const ANCHOR_EXCERPT_MAX = 120;
const ANCHOR_SELECTOR_MAX = 512;
const ANCHOR_LABEL_MAX = 40;

function boundAnchorText(value, max) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

// What a queued note is attached to, in the annotation card's own words. This is the same rule
// as the server's `chatEntryForPrompt` (src/chat-messages.js), which derives the anchor for the
// note once it is sent: a queued prompt has not reached the server yet and this file cannot
// import modules, so the rule is duplicated here and test/chrome-client-queue.test.js pins the
// two against the same fixtures. A bubble must not change its anchor when it settles.
function promptAnchor(prompt) {
  const tag = String(prompt?.tag || "");
  if (tag === "message") return null;
  const target = prompt?.target && typeof prompt.target === "object" ? prompt.target : null;
  const selector = boundAnchorText(prompt?.selector, ANCHOR_SELECTOR_MAX);
  const withSelector = (anchor) => (selector ? { ...anchor, selector } : anchor);
  const type = String(target?.type || "");
  if (type === "text-range") {
    return withSelector({
      kind: "text",
      label: "text",
      excerpt: boundAnchorText(target.text || prompt.text, ANCHOR_EXCERPT_MAX),
    });
  }
  const elementTag = tag.trim();
  if (!elementTag) return null;
  return withSelector({
    kind: "element",
    label: boundAnchorText("<" + elementTag + ">", ANCHOR_LABEL_MAX),
    excerpt: boundAnchorText(prompt.text, ANCHOR_EXCERPT_MAX),
  });
}

// The anchor line: a mono chip naming the kind (`<h2>`, `text`, `cell`, ...) and a quoted
// excerpt, with the full excerpt and selector on hover.
function anchorHtml(anchor) {
  if (!anchor || typeof anchor !== "object") return "";
  const excerpt = String(anchor.excerpt || "");
  const title = [excerpt, anchor.selector].filter(Boolean).join("\n");
  return (
    '<div class="anchor" title="' +
    escapeHtml(title) +
    '"><span class="anchor-kind">' +
    escapeHtml(anchor.label || "") +
    "</span>" +
    (excerpt
      ? '<span class="anchor-excerpt' +
        (anchor.kind === "text" ? " text" : "") +
        '">\u201C' +
        escapeHtml(excerpt) +
        "\u201D</span>"
      : "") +
    "</div>"
  );
}

// What a note with images and no words says for itself. A queued prompt keeps its words in
// `prompt` (`text` is the element's excerpt); a transcript entry keeps them in `text`.
function attachmentOnlyText(entry) {
  if (!attachmentCount(entry)) return "";
  return entry.tag === "message" || entry.kind === "message" ? t("Image message") : t("Image annotation");
}

function userBubbleTextHtml(entry, text) {
  const displayText = String(text || attachmentOnlyText(entry));
  return displayText ? '<div class="bubble-text">' + escapeHtml(displayText) + "</div>" : "";
}

// A queued note is the user bubble in its not-yet-sent state: dashed, labelled Queued (Sending
// while its batch is in flight), and editable and removable until then. It settles in place as a
// sent bubble once the server's transcript carries it, so nothing moves between regions.
function queuedBubbleHtml(prompt, index) {
  const sending = isPromptSending(prompt);
  if (!sending && editingPromptId && promptIdentity(prompt) === editingPromptId) {
    return queuedEditorHtml(prompt, index);
  }
  return (
    '<div class="bubble user queued" data-index="' +
    index +
    '"><small>' +
    escapeHtml(t(sending ? "Sending\u2026" : "Queued")) +
    ' <button class="queued-edit" type="button" aria-label="' +
    escapeHtml(t("Edit queued prompt")) +
    '" data-index="' +
    index +
    '">' +
    EDIT_ICON_SVG +
    '</button><button class="queued-remove" type="button" aria-label="' +
    escapeHtml(t("Remove queued prompt")) +
    '" data-index="' +
    index +
    '">' +
    REMOVE_ICON_SVG +
    "</button></small>" +
    anchorHtml(promptAnchor(prompt)) +
    userBubbleTextHtml(prompt, prompt.prompt) +
    bubbleAttachmentsHtml(prompt) +
    "</div>"
  );
}

// The same bubble while its words are being revised. The anchor and images stay as they were:
// an edit changes what the note says, not what it points at.
function queuedEditorHtml(prompt, index) {
  return (
    '<div class="bubble user queued editing" data-index="' +
    index +
    '"><small>' +
    escapeHtml(t("Editing")) +
    "</small>" +
    anchorHtml(promptAnchor(prompt)) +
    '<textarea class="queued-edit-input" aria-label="' +
    escapeHtml(t("Edit queued prompt")) +
    '" data-index="' +
    index +
    '">' +
    escapeHtml(editingDraft) +
    '</textarea><div class="queued-edit-actions"><button class="queued-edit-cancel" type="button">' +
    escapeHtml(t("Cancel")) +
    '</button><button class="queued-edit-save" type="button">' +
    escapeHtml(t("Save")) +
    "</button></div>" +
    bubbleAttachmentsHtml(prompt) +
    "</div>"
  );
}

// Whether a queued prompt is committed to a send that has not been answered yet: waiting for its
// snapshot, queued behind another submission, in flight, or held by the terminal reservation.
// Derived from the existing send bookkeeping rather than tracked separately, so no failure path
// can strand a note labelled Sending with its remove control disabled.
function isPromptSending(prompt) {
  if (terminalSubmission?.inFlight && terminalSubmission.prompts.includes(prompt)) return true;
  for (const request of snapshotRequests.values()) {
    if (request.action === "submit" && Array.isArray(request.prompts) && request.prompts.includes(prompt)) return true;
  }
  for (const submission of pendingSubmissions) {
    if (Array.isArray(submission.prompts) && submission.prompts.includes(prompt)) return true;
  }
  return Boolean(
    activeSubmission && Array.isArray(activeSubmission.prompts) && activeSubmission.prompts.includes(prompt),
  );
}

function render() {
  const editing = editingPromptId ? queued.find((prompt) => promptIdentity(prompt) === editingPromptId) : null;
  // A note that left the queue or started sending takes its editor with it.
  if (editingPromptId && (!editing || !isPromptEditable(editing))) endQueuedEdit();
  const keepEditFocus = editFocusPending || queuedLog.contains(document.activeElement);
  // A re-render while the reviewer is typing keeps their caret and scroll; only a freshly opened
  // edit starts at the end of its words.
  const previousInput = /** @type {HTMLTextAreaElement | null} */ (queuedLog.querySelector(".queued-edit-input"));
  const caret =
    !editFocusPending && previousInput && previousInput === document.activeElement
      ? {
          start: previousInput.selectionStart,
          end: previousInput.selectionEnd,
          direction: previousInput.selectionDirection,
          scrollTop: previousInput.scrollTop,
        }
      : null;
  editFocusPending = false;
  queuedLog.innerHTML = queued.map((prompt, index) => queuedBubbleHtml(prompt, index)).join("");

  for (const button of queuedLog.querySelectorAll(".queued-remove")) {
    const removeButton = /** @type {HTMLButtonElement} */ (button);
    const prompt = queued[Number(removeButton.dataset.index)];
    removeButton.disabled = terminalSubmission !== null || isPromptSending(prompt);
    removeButton.addEventListener("click", (event) => removeQueuedPrompt(Number(removeButton.dataset.index), event));
  }
  for (const button of queuedLog.querySelectorAll(".queued-edit")) {
    const editButton = /** @type {HTMLButtonElement} */ (button);
    editButton.disabled = !isPromptEditable(queued[Number(editButton.dataset.index)]);
  }
  if (editingPromptId && keepEditFocus) {
    const input = /** @type {HTMLTextAreaElement | null} */ (queuedLog.querySelector(".queued-edit-input"));
    if (input) {
      input.focus();
      if (caret) {
        input.setSelectionRange?.(caret.start, caret.end, caret.direction);
        input.scrollTop = caret.scrollTop;
      } else {
        input.setSelectionRange?.(input.value.length, input.value.length);
      }
    }
  }
  updateSendState();
  scrollPanelToBottom();
  renderSheetSummary();
}

function updateSendState() {
  const terminalReserved = terminalSubmission !== null;
  // A terminal send owns the exact review batch, so freeze interactions inside the
  // artifact without disabling annotation mode. Disabling annotation mode closes the
  // SDK card and destroys an unsent draft before delivery has actually succeeded.
  // An ended session only stops feedback: the page itself stays scrollable, clickable and playable.
  frame.inert = terminalReserved;
  sendButton.disabled = ended || terminalReserved;
  if (sendAndEndButton) sendAndEndButton.disabled = ended || Boolean(terminalSubmission?.inFlight);
  annotationSwitch.disabled = ended || terminalReserved;
  chatInput.disabled = ended || terminalReserved;
  chatAttachButton.disabled = ended || terminalReserved;
  endButton.disabled = ended || terminalReserved;
}

function attachmentCount(prompt) {
  return Array.isArray(prompt.attachments) ? prompt.attachments.length : 0;
}

// How many thumbnails a bubble shows before the rest collapse into a badge.
const BUBBLE_THUMBNAIL_LIMIT = 4;

// Thumbnails for a note's images, served straight from the same-origin attachment endpoint (the
// ids are already server-vetted at upload time). The bubble has room for only a few, but the
// per-prompt cap is configurable (TEXTCAST_CHAT_AXI_MAX_ATTACHMENTS_PER_PROMPT), so a note can
// legitimately carry more than fit: the remainder collapses into a +N badge rather than being
// dropped from the preview, which would make the queue look like it lost the extra images (W-A).
function bubbleAttachmentsHtml(entry) {
  const count = attachmentCount(entry);
  if (!count) return "";
  const hidden = count - BUBBLE_THUMBNAIL_LIMIT;
  return (
    '<span class="bubble-attachments">' +
    entry.attachments
      .slice(0, BUBBLE_THUMBNAIL_LIMIT)
      .map((attachment) => {
        const alt = escapeHtml(attachment.name || "image");
        return (
          '<img class="bubble-attachment" src="/api/' +
          encodeURIComponent(key) +
          "/attachments/" +
          encodeURIComponent(attachment.id) +
          '" alt="' +
          alt +
          '" title="' +
          alt +
          '">'
        );
      })
      .join("") +
    (hidden > 0
      ? '<span class="bubble-attachment-more" title="' +
        escapeHtml(t(hidden + " more image" + (hidden === 1 ? "" : "s"))) +
        '">+' +
        hidden +
        "</span>"
      : "") +
    "</span>"
  );
}

function replaceExpiredThumbnail(event) {
  const image = event.target;
  if (
    String(image?.tagName || "").toUpperCase() !== "IMG" ||
    !String(image.className || "")
      .split(/\s+/)
      .includes("bubble-attachment")
  )
    return;
  const expired = document.createElement("span");
  expired.className = "bubble-attachment bubble-attachment-expired";
  expired.textContent = t("Image expired");
  expired.title = String(image.alt || "image");
  image.replaceWith(expired);
}

chatLog.addEventListener("error", replaceExpiredThumbnail, true);

const UNSENT_OWNERSHIP_COPY = t(
  "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.",
);
const DEFAULT_SEND_HINT = t(
  "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.",
);
const EMPTY_SEND_HINT_HOLD_MS = 9000;
const EMPTY_END_HINT = t("Nothing to send. To end without feedback, use End session in the More menu (⋮).");

function showSendHint(message = DEFAULT_SEND_HINT, holdMs = 2600, focusInput = true) {
  sendHint.textContent = message;
  sendHint.hidden = false;
  clearTimeout(sendHintTimer);
  sendHintPersistent = holdMs === null;
  sendHint.classList.toggle("persistent", sendHintPersistent);
  if (sendHintPersistent) {
    sendHintTimer = undefined;
    if (focusInput) chatInput.focus();
    return;
  }
  sendHintTimer = setTimeout(() => {
    sendHint.hidden = true;
    sendHint.textContent = DEFAULT_SEND_HINT;
    sendHintPersistent = false;
  }, holdMs);
  if (focusInput) chatInput.focus();
}

function hideSendHint(force = false) {
  if (sendHintPersistent && force !== true) return;
  clearTimeout(sendHintTimer);
  sendHint.hidden = true;
  sendHint.textContent = DEFAULT_SEND_HINT;
  sendHint.classList.remove("persistent");
  sendHintPersistent = false;
  sendAcknowledgementWarningVisible = false;
}

function armSendAcknowledgementWarning() {
  if (sendAcknowledgementTimer || pendingAcknowledgements.size === 0) return;
  sendAcknowledgementTimer = setTimeout(() => {
    sendAcknowledgementTimer = undefined;
    if (pendingAcknowledgements.size > 0 && !sendFailureOwner) {
      sendAcknowledgementWarningVisible = true;
      showSendHint(SEND_STALLED_COPY, null, false);
    }
  }, SEND_ACKNOWLEDGEMENT_WARNING_MS);
}

function clearSendAcknowledgementWarning() {
  clearTimeout(sendAcknowledgementTimer);
  sendAcknowledgementTimer = undefined;
  sendAcknowledgementWarningVisible = false;
}

function showQueuedSendFailure(message = SEND_FAILED_COPY, owner = null) {
  showPersistentSendFailure(message, true, owner);
}

function showPersistentSendFailure(message, requireQueuedFeedback = false, owner = null) {
  clearSendAcknowledgementWarning();
  if (requireQueuedFeedback && !queued.length) return;
  if (sendFailureOwner?.kind === "preparation") return;
  const currentOrder = Number(sendFailureOwner?.operation?.order) || 0;
  const nextOrder = Number(owner?.operation?.order) || 0;
  if (owner?.kind !== "preparation" && currentOrder > nextOrder) return;
  sendFailureOwner = owner;
  showSendHint(message, null, false);
}

function clearPersistentSendFailure() {
  sendFailureOwner = null;
  hideSendHint(true);
}

function clearPreparationFailure(preparationType) {
  if (sendFailureOwner?.kind !== "preparation" || sendFailureOwner.preparationType !== preparationType) return;
  clearPersistentSendFailure();
}

function setMenuOpen(button, menu, open) {
  menu.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
}

function closeMenus() {
  setMenuOpen(moreButton, moreMenu, false);
}

function toggleMenu(button, menu) {
  const open = menu.hidden;
  closeMenus();
  setMenuOpen(button, menu, open);
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the textarea-based fallback below.
  }
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
  return true;
}

// One transcript entry, as the server serialized it (src/chat-messages.js). An agent entry's
// `html` is the server's rendering of the agent's text and is the only html ever set here; a
// user entry is always escaped text, with its anchor line and thumbnails when it carries them.
function chatBubbleHtml(entry) {
  if (entry.role === "agent") {
    return (
      "<small>" +
      escapeHtml(t("Agent")) +
      "</small>" +
      (typeof entry.html === "string" && entry.html
        ? '<div class="chat-md">' + entry.html + "</div>"
        : '<div class="bubble-text">' + escapeHtml(entry.text) + "</div>")
    );
  }
  return (
    "<small>" +
    escapeHtml(t("You")) +
    "</small>" +
    anchorHtml(entry.anchor) +
    userBubbleTextHtml(entry, entry.text) +
    bubbleAttachmentsHtml(entry) +
    receiptHtml(entry)
  );
}

// Delivery receipt (docs/delivery-acks.md): the per-note view of what the server observed. Seen,
// Working, and Done are stamps on the entry, so the row is derived from it on every render and
// never tracked here. Before Seen, the row says why, from the presence the live stream reports.
// The row shows only the furthest step reached, as a small line icon and its word (one check:
// seen, a turning ring: working, two checks: done); hover and screen readers get every step with
// its time.
const RECEIPT_ICONS = {
  Seen: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  Working: '<path d="M12 4a8 8 0 1 1-8 8"/>',
  Done: '<path d="M2 12.5l4.2 4.2L16 7"/><path d="M11.5 15.8l.9.9L22 7"/>',
};

function receiptTime(at) {
  const date = new Date(String(at));
  return Number.isNaN(date.getTime())
    ? String(at)
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function receiptStepText(label, at) {
  return at ? t(label) + " " + receiptTime(at) : t(label + ": not yet");
}

function receiptStateHtml(entry) {
  const step = entry.done_at ? "Done" : entry.working_at ? "Working" : "Seen";
  const summary = [
    receiptStepText("Seen", entry.delivered_at),
    receiptStepText("Working", entry.working_at),
    receiptStepText("Done", entry.done_at),
  ].join(" · ");
  return (
    '<span class="receipt-state is-' +
    step.toLowerCase() +
    '" role="img" aria-label="' +
    escapeHtml(summary) +
    '" title="' +
    escapeHtml(summary) +
    '"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    RECEIPT_ICONS[step] +
    '</svg><span class="receipt-label">' +
    escapeHtml(t(step)) +
    "</span></span>"
  );
}

// Every branch must be true where it is shown: `waiting` is no poll at all, `listening` is a poll
// that will take the note within milliseconds, and `working` or an external listener is an agent
// whose next poll will take it.
function receiptNoteText() {
  if (agentPresence === "waiting") return t("No agent is listening");
  if (agentPresence === "listening") return t("Delivering");
  return t("Agent is busy; delivered on its next poll");
}

// A transcript entry from before receipts existed (`receipt: "none"`, marked by the server once at
// load) gets no row: nothing was ever observed about it, and an empty row would read as "never seen".
function hasReceipt(entry) {
  return Boolean(entry) && entry.receipt !== "none";
}

function receiptHtml(entry) {
  if (!hasReceipt(entry)) return "";
  return (
    '<div class="receipt">' +
    (entry.delivered_at || entry.done_at
      ? receiptStateHtml(entry)
      : '<span class="receipt-note">' + escapeHtml(receiptNoteText()) + "</span>") +
    "</div>"
  );
}

// Only the pre-Seen line names the live presence, so a presence change rewrites that line alone.
// Rebuilding the bubble would also rebuild its thumbnails and undo an t("Image expired") placeholder.
function refreshUnseenReceipts() {
  for (const note of chatLog.querySelectorAll(".receipt-note")) note.textContent = receiptNoteText();
}

function addChat(entry, shouldScroll = true) {
  if (!entry || typeof entry !== "object") return;
  const role = entry.role === "agent" ? "agent" : "user";
  const text = String(entry.text || "");
  if (!text && !(role === "agent" ? entry.html : attachmentCount(entry) || entry.anchor)) return;

  const el = document.createElement("div");
  el.className = "bubble " + role;
  el.innerHTML = chatBubbleHtml({ ...entry, role, text });
  chatLog.appendChild(el);
  if (shouldScroll) scrollElementIntoView(el);
  return el;
}

function chatEntryDisplayKey(entry) {
  return JSON.stringify({
    role: entry?.role === "agent" ? "agent" : "user",
    kind: entry?.kind,
    text: String(entry?.text || ""),
    anchor: entry?.anchor,
    attachments: Array.isArray(entry?.attachments) ? entry.attachments.map((item) => String(item?.id || "")) : [],
  });
}

function chatEntriesMatch(left, right) {
  if (chatEntryDisplayKey(left) !== chatEntryDisplayKey(right)) return false;
  const leftAt = String(left?.at || "");
  const rightAt = String(right?.at || "");
  return !leftAt || !rightAt || leftAt === rightAt;
}

function parseChatRevision(value) {
  const revision = Number(value);
  return Number.isSafeInteger(revision) && revision >= 0 ? revision : null;
}

function chatContainsEntries(candidate, entries) {
  if (!Array.isArray(candidate) || !Array.isArray(entries)) return false;
  if (entries.length === 0) return true;
  // A size-bound transcript may drop a prefix of what this tab already showed. The remaining
  // displayed suffix must still appear in order; a stale sync that is missing a newer tail
  // (including an empty wipe) is rejected.
  for (let start = 0; start < entries.length; start += 1) {
    const suffix = entries.slice(start);
    let matched = 0;
    for (const entry of candidate) {
      if (matched < suffix.length && chatEntriesMatch(entry, suffix[matched])) matched += 1;
    }
    if (matched === suffix.length) return true;
  }
  return false;
}

function chatStartsWith(candidate, prefix) {
  return (
    Array.isArray(candidate) &&
    Array.isArray(prefix) &&
    candidate.length >= prefix.length &&
    prefix.every((entry, index) => chatEntriesMatch(candidate[index], entry))
  );
}

function mergeAcceptedChat(accepted, chatAtRequest) {
  if (!Array.isArray(accepted) || !Array.isArray(chatAtRequest)) return null;
  if (!chatStartsWith(displayedChat, chatAtRequest)) return null;
  let requestOffset = chatAtRequest.length;
  for (let i = 0; i <= chatAtRequest.length; i += 1) {
    if (chatStartsWith(accepted, chatAtRequest.slice(i))) {
      requestOffset = i;
      break;
    }
  }
  const displayedTail = displayedChat.slice(chatAtRequest.length);
  const unmatchedDisplayed = [];
  let acceptedIndex = chatAtRequest.length - requestOffset;
  for (const displayedEntry of displayedTail) {
    while (acceptedIndex < accepted.length && !chatEntriesMatch(accepted[acceptedIndex], displayedEntry)) {
      acceptedIndex += 1;
    }
    if (acceptedIndex < accepted.length) {
      acceptedIndex += 1;
    } else {
      unmatchedDisplayed.push(displayedEntry);
    }
  }
  return accepted.concat(unmatchedDisplayed);
}

function queuedPromptMatchesEntry(prompt, entry) {
  const id = promptIdentity(prompt);
  return Boolean(id) && entry?.role === "user" && promptIdentity(entry) === id;
}

function promptAcknowledgedInChat(prompt, chat) {
  const id = promptIdentity(prompt);
  if (!id) return false;
  if (chatAckIds.has(id)) return true;
  if (!Array.isArray(chat)) return false;
  return chat.some((entry) => queuedPromptMatchesEntry(prompt, entry));
}

function settleQueuedFromTranscript(chat, shouldRender = true) {
  if (!Array.isArray(chat) || !queued.length) return false;
  // Match by the per-submission identity only. Displayed content is not identity: two tabs
  // can send the same selected text under one container with different range boundaries,
  // and each note must settle exactly once against its own acknowledgement.
  const settledPrompts = new Set();
  for (const prompt of queued) {
    if (!promptAcknowledgedInChat(prompt, chat)) continue;
    settledPrompts.add(prompt);
    deliveredPrompts.add(prompt);
  }
  if (!settledPrompts.size) return false;
  for (let i = queued.length - 1; i >= 0; i -= 1) {
    if (settledPrompts.has(queued[i])) queued.splice(i, 1);
  }
  persistQueuedPrompts();
  if (shouldRender) render();
  return true;
}

function syncChat(chat, revision) {
  const nextChat = Array.isArray(chat) ? chat : [];
  settleQueuedFromTranscript(nextChat);
  const nextRevision = parseChatRevision(revision);
  if (nextRevision !== null && nextRevision < chatRevision) return false;
  if (nextRevision === null || nextRevision === chatRevision) {
    if (!chatContainsEntries(nextChat, displayedChat)) return false;
  }
  if (nextRevision !== null) chatRevision = nextRevision;
  displayedChat = nextChat.slice();
  for (const el of [...chatLog.querySelectorAll(".bubble.user,.bubble.agent:not(.agent-working)")]) {
    el.remove();
  }

  let lastChatBubble = null;
  for (const item of nextChat) lastChatBubble = addChat(item, false) || lastChatBubble;
  if (workingBubble) chatLog.appendChild(workingBubble);
  // Handed-back drafts were written at the end of the conversation, and a rebuild re-appends the
  // whole transcript - so without this they end up above it, where the scroll below would leave
  // them off-screen. They are the one thing here the user cannot recover anywhere else.
  for (const note of retiredDraftNodes) chatLog.appendChild(note);
  const anchor = retiredDraftNodes[retiredDraftNodes.length - 1] || workingBubble || lastChatBubble;
  if (anchor) scrollElementIntoView(anchor);
  return true;
}

function setAgentPresence(state) {
  agentPresence = state === "listening" || state === "external" || state === "working" ? state : "waiting";
  if (agentPresence !== "waiting") connecting = false;
  updateSendState();
  renderSheetSummary();
  refreshUnseenReceipts();
  renderReconnectCard();
  if (sendWhenAgentReady && agentPresence === "listening" && !ended) {
    sendWhenAgentReady = false;
    if (queued.length) sendQueued(false);
  }

  // A supervisor-owned process-only listener is busy on the agent's behalf. It must not make the
  // composer look like an idle captain turn while the owning agent is offline.
  if (agentPresence !== "working" && agentPresence !== "external") {
    if (workingBubble) workingBubble.remove();
    workingBubble = null;
    return;
  }

  if (!workingBubble) {
    workingBubble = document.createElement("div");
    workingBubble.className = "bubble agent agent-working";
    workingBubble.innerHTML = '<span class="spinner"></span><span>Working...</span>';
    chatLog.appendChild(workingBubble);
  }
  scrollElementIntoView(workingBubble);
}

function setHandoffSuperseded(visible) {
  if (handoffBanner) handoffBanner.hidden = ended || !visible;
}

// The server this page was connected to went away. What is true beyond that depends on why, so
// the shutdown names its reason and each one gets its own line - a page told "Textcast Chat was updated"
// after a deliberate stop is being told something false. An unnamed reason (SIGTERM, or any
// caller that names none) claims neither.
function chromeOutdatedCopy(reason) {
  if (reason === "upgrade") return t("Textcast Chat was updated. This page is running the previous version.");
  if (reason === "local-build") {
    return t(
      "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.",
    );
  }
  if (reason === "restart")
    return t("Textcast Chat was restarted. This page is running the copy the previous server sent.");
  if (reason === "stop") return t("Textcast Chat was stopped. Reload after you start it again.");
  return t(
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.",
  );
}

// Say so where the user can dismiss it, and never reload on their behalf - a forced reload
// interrupts whatever they were reading or writing.
function setChromeOutdated(visible, reason = chromeOutdatedReason) {
  chromeOutdatedReason = String(reason || "");
  chromeOutdatedGeneration += 1;
  if (outdatedText) outdatedText.textContent = chromeOutdatedCopy(chromeOutdatedReason);
  outdatedReloadInFlight = false;
  if (outdatedReloadButton) outdatedReloadButton.disabled = false;
  if (outdatedBanner) outdatedBanner.hidden = ended || !visible;
}

function setReviewState(state) {
  lastReviewState = state;
  // The artifact reported a card, so its anchor exists: whatever miss was recorded is answered.
  if (state?.card) unrestorableDraftMiss = null;
  if (!state || (!state.card && !(Array.isArray(state.fields) && state.fields.length))) {
    try {
      sessionStorage.removeItem(reviewStateStorageKey);
    } catch {
      // The in-memory state still works if browser storage is unavailable.
    }
    return;
  }
  saveJsonState(reviewStateStorageKey, state);
}

function hasUnsentDraft() {
  if (editingPromptId) return true;
  return Boolean(lastReviewState && lastReviewState.card && String(lastReviewState.card.text || "").trim());
}

// The SDK looked for this draft's anchor in a loaded artifact and did not find it. Retiring a
// draft is itself data loss - the user may still be typing while the agent rewrites the element
// they anchored to - so one miss only records the answer. The draft is retired only when a
// SECOND artifact revision reports the same anchor missing: an element that is merely being
// rewritten comes back, and a report on the revision already recorded is the same answer twice,
// not two answers. Any report for a different draft, or for a draft that is no longer stored,
// leaves the stored text alone.
function discardUnrestorableDraft(selector) {
  if (!selector || !lastReviewState || !lastReviewState.card) return;
  if (String(lastReviewState.card.selector || "") !== selector) return;
  const revision = artifactLoadRevision;
  if (unrestorableDraftMiss?.selector !== selector) {
    unrestorableDraftMiss = { selector, revision };
    return;
  }
  if (unrestorableDraftMiss.revision === revision) return;
  unrestorableDraftMiss = null;
  keepRetiredDraft(String(lastReviewState.card.text || ""));
  setReviewState({ ...lastReviewState, card: null });
}

// Retiring a draft ends Textcast Chat's ability to replay it, so the text itself is handed back to the
// user before it goes: it is written to the conversation panel verbatim, where it is selectable,
// nothing overwrites what they may already be typing, and no control can discard it by accident.
// It is persisted per session so a reload does not take the last copy with it.
function loadRetiredDrafts() {
  const stored = loadJsonState(retiredDraftStorageKey, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter((entry) => typeof entry === "string" && entry.trim());
}

// No entry already handed back is ever dropped to make room for a new one. When browser storage
// refuses the write, the note says so on the spot instead of an older one quietly disappearing at
// the next page load - the text the user wrote is the thing being protected here.
function keepRetiredDraft(text) {
  if (!text.trim()) return;
  retiredDrafts = [...retiredDrafts, text];
  renderRetiredDraft(text, saveJsonState(retiredDraftStorageKey, retiredDrafts));
}

function renderRetiredDraft(text, stored = true) {
  if (!chatLog) return;
  const el = document.createElement("div");
  el.className = "bubble note";
  el.innerHTML =
    "<small>" +
    escapeHtml(t("Unsent annotation")) +
    "</small><div>" +
    escapeHtml(
      t(
        "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:",
      ),
    ) +
    "</div>" +
    '<div class="note-draft">' +
    escapeHtml(text) +
    "</div>" +
    (stored
      ? ""
      : '<div class="note-warning">This browser refused to store it, so copy it before you reload this page.</div>');
  retiredDraftNodes.push(el);
  chatLog.appendChild(el);
  scrollElementIntoView(el);
}

async function refreshChromeLoadHandoff(requestSequence) {
  const response = await fetch("/api/" + key + "/chrome-loads/begin", {
    method: "POST",
    headers: { "content-type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  const token = String(data?.chrome_load_token || "");
  if (!response.ok || !token) throw new Error("failed to refresh chrome handoff");
  if (requestSequence !== artifactLoadRequestSequence) return false;
  chromeLoadToken = token;
  const revision = Number(data?.artifact_revision);
  const loadToken = String(data?.artifact_load_token || "");
  if (Number.isSafeInteger(revision) && revision >= 0) artifactLoadRevision = revision;
  if (loadToken) artifactLoadToken = loadToken;
  return true;
}

function scrollPanelToBottom() {
  panelScroll.scrollTop = panelScroll.scrollHeight;
}

// ---- Phone-width conversation sheet ----
// Below this width chrome.css turns the conversation panel into a bottom sheet the launcher raises
// over the artifact. This controller owns intent, accessibility state, the drag-to-close gesture,
// visual-viewport measurements, and the status line; CSS owns the geometry. The query must match
// the one chrome.css lays the sheet out under.
const MOBILE_SHEET_MEDIA = "(max-width: 860px)";
// How far a drag on the sheet's head must travel before it closes the sheet.
const SHEET_DRAG_THRESHOLD_PX = 48;
const sheetStorageKey = "textcast-chat-axi:sheet-open:" + key;
const sheetMedia = typeof window.matchMedia === "function" ? window.matchMedia(MOBILE_SHEET_MEDIA) : null;
// The user's intent, kept across a chrome reload so a live-reload or server upgrade does not drop
// them back onto a closed dock mid-conversation.
let sheetOpen = readSheetOpen();
// The latest agent reply that landed while the sheet was closed: the dock previews it until the
// user opens the sheet, so a reply never arrives silently behind the artifact.
let unreadAgentReply = "";
/** @type {{ pointerId: any, startY: number, moved: boolean } | null} */
let sheetDrag = null;

function readSheetOpen() {
  try {
    return sessionStorage.getItem(sheetStorageKey) === "1";
  } catch {
    return false;
  }
}

function isMobileSheet() {
  return Boolean(sheetMedia && sheetMedia.matches);
}

function setSheetOpen(open) {
  const next = Boolean(open);
  const changed = next !== sheetOpen;
  sheetOpen = next;
  try {
    if (sheetOpen) sessionStorage.setItem(sheetStorageKey, "1");
    else sessionStorage.removeItem(sheetStorageKey);
  } catch {
    // Storage refused is not worth a broken sheet: the state just stops surviving a reload.
  }
  if (sheetOpen) unreadAgentReply = "";
  applySheetState();
  if (!changed || !isMobileSheet()) return;
  if (sheetOpen) scrollPanelToBottom();
}

// Re-derives every sheet attribute from the phone layout, sheet-open, and session-ended state so a
// viewport crossing the breakpoint in either direction cannot make an ended composer interactive or
// leave a closed dock trapping focus. The conversation itself stays scrollable once ended.
function applySheetState() {
  const mobile = isMobileSheet();
  const open = mobile && sheetOpen;
  document.body.classList.toggle("sheet-open", open);
  panelScroll.inert = false;
  chatComposer.inert = ended;
  applyConversationVisibility();
}

// The head's status line. One line, most actionable state first: work the user has queued,
// then a reply they have not seen, then whether the agent is there to receive a send.
function sheetSummary() {
  if (ended) return { text: t("Session ended"), accent: false, unread: false };
  if (queued.length > 0) {
    return { text: t(queued.length + " queued"), accent: true, unread: false };
  }
  if (unreadAgentReply) return { text: unreadAgentReply, accent: false, unread: true };
  if (agentPresence === "working") return { text: t("Agent is working…"), accent: false, unread: false };
  if (agentPresence === "external") return { text: t("External listener active"), accent: false, unread: false };
  if (agentPresence === "listening") return { text: t("Agent listening"), accent: false, unread: false };
  if (connecting) return { text: t("Connecting to the agent…"), accent: false, unread: false };
  return { text: t("Agent not listening"), accent: false, unread: false };
}

function renderSheetSummary() {
  const summary = sheetSummary();
  panelSummary.textContent = summary.text;
  panelSummary.classList.toggle("is-accent", summary.accent);
  panelSummary.classList.toggle("is-unread", summary.unread);
  panelSummary.dataset.presence = ended
    ? "ended"
    : connecting && agentPresence === "waiting"
      ? "connecting"
      : agentPresence;
  renderSidebarToggle();
}

// A brief pulse on the launcher when something the user should notice lands while the
// conversation is closed: a prompt they queued from the artifact, or an agent reply.
function pulseSheetDock() {
  if (!isConversationHidden()) return;
  sidebarToggle.classList.remove("is-fresh");
  // Restart the animation even when the previous pulse is still running.
  void sidebarToggle.offsetWidth;
  sidebarToggle.classList.add("is-fresh");
}

function noteAgentReply(text) {
  if (!isConversationHidden()) return;
  // A one-line preview: the reply is Markdown, so drop its markup characters before showing it.
  unreadAgentReply = String(text || "")
    .replace(/[#*_`>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  renderSheetSummary();
  pulseSheetDock();
}

// The phone keyboard shrinks the visual viewport without touching the layout viewport on iOS, so
// the sheet reads its height and offset from here; chrome.css consumes these only under the phone
// breakpoint. Android reports the same numbers through the layout viewport thanks to the
// `interactive-widget=resizes-content` viewport meta, which makes this a no-op there.
function syncVisualViewport() {
  const root = document.documentElement;
  if (!root || !root.style || typeof root.style.setProperty !== "function") return;
  const viewport = window.visualViewport;
  const height = viewport ? viewport.height : window.innerHeight;
  const top = viewport ? viewport.offsetTop : 0;
  if (!(height > 0)) return;
  root.style.setProperty("--vv-height", Math.round(height) + "px");
  root.style.setProperty("--vv-top", Math.round(Math.max(0, top || 0)) + "px");
}

function sheetDragOffset(event) {
  return sheetDrag ? Number(event.clientY) - sheetDrag.startY : 0;
}

function clearSheetDrag() {
  sheetDrag = null;
  panel.classList.remove("is-dragging");
  panel.style.transform = "";
}

function finishSheetDrag(event) {
  if (!sheetDrag || event.pointerId !== sheetDrag.pointerId) return;
  const offset = sheetDragOffset(event);
  const moved = sheetDrag.moved;
  clearSheetDrag();
  if (moved && sheetOpen && offset > SHEET_DRAG_THRESHOLD_PX) setSheetOpen(false);
}

// The head's own tools (revisions, menu, minimize) keep their clicks; only the bare head drags.
function isPanelToolEvent(event) {
  const target = /** @type {Element | null} */ (event.target);
  return Boolean(target && typeof target.closest === "function" && target.closest(".panel-tools"));
}

panelScrim.addEventListener("click", () => setSheetOpen(false));
panelHead.addEventListener("pointerdown", (event) => {
  if (event.button || isPanelToolEvent(event)) return;
  if (!isMobileSheet()) {
    if (!panelCollapsed) beginFloatDrag("panel", panel, panelHead, event);
    return;
  }
  if (!sheetOpen) return;
  sheetDrag = { pointerId: event.pointerId, startY: Number(event.clientY), moved: false };
  if (typeof panelHead.setPointerCapture === "function") panelHead.setPointerCapture(event.pointerId);
});
panelHead.addEventListener("pointermove", (event) => {
  if (moveFloatDrag(event)) return;
  if (!sheetDrag || event.pointerId !== sheetDrag.pointerId) return;
  const offset = sheetDragOffset(event);
  if (Math.abs(offset) > 6) sheetDrag.moved = true;
  if (!sheetDrag.moved) return;
  panel.classList.add("is-dragging");
  // Follow the finger down; the sheet only closes by dragging.
  panel.style.transform = "translateY(" + Math.max(0, offset) + "px)";
});
panelHead.addEventListener("pointerup", (event) => {
  if (endFloatDrag(event)) return;
  finishSheetDrag(event);
});
panelHead.addEventListener("pointercancel", (event) => {
  if (endFloatDrag(event)) return;
  if (!sheetDrag || event.pointerId !== sheetDrag.pointerId) return;
  clearSheetDrag();
});
if (sheetMedia && typeof sheetMedia.addEventListener === "function") {
  sheetMedia.addEventListener("change", (event) => {
    if (!event.matches) {
      sheetOpen = false;
      try {
        sessionStorage.removeItem(sheetStorageKey);
      } catch {
        // Storage refusal only prevents persistence; the in-memory state is already reset.
      }
    }
    // A reply previewed while one layout hid the conversation is no longer owed once the other
    // layout shows it.
    if (!isConversationHidden()) unreadAgentReply = "";
    applySheetState();
    applyPanelCollapsed();
    applyFloatPositions();
  });
}
if (window.visualViewport && typeof window.visualViewport.addEventListener === "function") {
  window.visualViewport.addEventListener("resize", syncVisualViewport);
  window.visualViewport.addEventListener("scroll", syncVisualViewport);
}
window.addEventListener("resize", syncVisualViewport);
syncVisualViewport();

// ---- Desktop floating conversation panel ----
// Above the phone breakpoint the conversation is a floating card the round launcher opens and
// minimizes, so the page keeps its whole width. The choice is a per-viewer preference rather than
// per-review state, so it lives in localStorage under one key for every session, and a first visit
// starts minimized. chrome.css only honours `panel-collapsed` outside the phone breakpoint, and
// this controller never sets it there, so a stored preference cannot hide the phone sheet.
const panelCollapsedStorageKey = "textcast-chat-axi:panel-collapsed";
let panelCollapsed = readPanelCollapsed();

function readPanelCollapsed() {
  try {
    return localStorage.getItem(panelCollapsedStorageKey) !== "0";
  } catch {
    return true;
  }
}

// Whether the conversation is out of sight right now, in whichever layout is active.
function isConversationHidden() {
  return isMobileSheet() ? !sheetOpen : panelCollapsed;
}

function revealConversation() {
  if (isMobileSheet()) setSheetOpen(true);
  else if (panelCollapsed) setPanelCollapsed(false);
}

function hideConversation() {
  if (isMobileSheet()) setSheetOpen(false);
  else setPanelCollapsed(true);
}

function setPanelCollapsed(collapsed) {
  panelCollapsed = Boolean(collapsed);
  try {
    localStorage.setItem(panelCollapsedStorageKey, panelCollapsed ? "1" : "0");
  } catch {
    // Storage refused only means the preference does not survive a reload.
  }
  if (!panelCollapsed) unreadAgentReply = "";
  applyPanelCollapsed();
  if (!panelCollapsed && !isMobileSheet()) scrollPanelToBottom();
}

function applyPanelCollapsed() {
  document.body.classList.toggle("panel-collapsed", panelCollapsed && !isMobileSheet());
  applyConversationVisibility();
}

// One place derives what a hidden conversation means in either layout: the panel leaves the tab
// order, focus inside it returns to the launcher, and the launcher says which way it points.
function applyConversationVisibility() {
  const hidden = isConversationHidden();
  panel.inert = hidden;
  const activeElement = document.activeElement;
  if (hidden && activeElement && panel.contains(activeElement)) sidebarToggle.focus();
  document.body.classList.toggle("conversation-open", !hidden);
  sidebarToggle.setAttribute("aria-expanded", hidden ? "false" : "true");
  renderSheetSummary();
}

// While hidden the launcher stands in for the panel: it counts queued notes (the thing still to
// send) or, failing that, marks an agent reply that arrived out of sight and previews it.
function renderSidebarToggle() {
  const hidden = isConversationHidden();
  const count = hidden ? queued.length : 0;
  const reply = hidden ? unreadAgentReply : "";
  const unread = count === 0 && Boolean(reply);
  sidebarToggleCount.textContent = count > 0 ? String(count) : "";
  sidebarToggleCount.hidden = count === 0;
  sidebarToggle.classList.toggle("is-unread", unread);
  let label = t(hidden ? "Show conversation" : "Hide conversation");
  if (count > 0) label += t(" (" + count + " queued)");
  else if (unread) label += t(" (new reply)");
  sidebarToggle.setAttribute("aria-label", label);
  sidebarToggle.title = label;
  // The reply preview shows even beside a queued count: an answer is worth seeing either way.
  launcherPeekText.textContent = reply;
  launcherPeek.hidden = !reply;
}

sidebarToggle.addEventListener("click", () => {
  // The click that ends a drag is not a request to open or close the conversation.
  if (suppressLauncherClick) {
    suppressLauncherClick = false;
    return;
  }
  if (isConversationHidden()) revealConversation();
  else hideConversation();
});
panelClose.addEventListener("click", () => hideConversation());
launcherPeek.addEventListener("click", () => revealConversation());

// ---- Dragging the launcher and the floating panel (desktop only) ----
// Both can be moved off whatever part of the page they cover. A position is a per-viewer
// preference like the minimized state, so it lives in localStorage for every session. The launcher
// snaps to the nearer side edge; a panel that was never dragged itself sits beside the launcher, so
// moving the launcher takes it along. The phone sheet keeps its fixed layout: every inline position
// is cleared under the phone breakpoint.
const FLOAT_DRAG_THRESHOLD_PX = 5;
const FLOAT_MARGIN_PX = 8;
const FLOAT_GAP_PX = 12;
const LAUNCHER_EDGE_PX = 20;
const launcherPosStorageKey = "textcast-chat-axi:launcher-pos";
const panelPosStorageKey = "textcast-chat-axi:panel-pos";
let launcherPos = readFloatPos(launcherPosStorageKey);
let panelPos = readFloatPos(panelPosStorageKey);
/** @type {{ kind: string, el: HTMLElement, handle: HTMLElement, pointerId: any, startX: number, startY: number, originX: number, originY: number, moved: boolean } | null} */
let floatDrag = null;
let suppressLauncherClick = false;

function readFloatPos(storageKey) {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (value && Number.isFinite(value.x) && Number.isFinite(value.y)) return { x: value.x, y: value.y };
  } catch {
    // An unreadable position falls back to the default corner.
  }
  return null;
}

function writeFloatPos(storageKey, pos) {
  try {
    if (pos) localStorage.setItem(storageKey, JSON.stringify({ x: Math.round(pos.x), y: Math.round(pos.y) }));
    else localStorage.removeItem(storageKey);
  } catch {
    // Storage refused only means the position does not survive a reload.
  }
}

function canPlaceFloats() {
  return !isMobileSheet() && typeof sidebarToggle.getBoundingClientRect === "function" && window.innerWidth > 0;
}

// Keeps a floating element whole inside the viewport, however the window was resized since.
function clampFloatPos(pos, el) {
  const rect = el.getBoundingClientRect();
  const maxX = Math.max(FLOAT_MARGIN_PX, window.innerWidth - rect.width - FLOAT_MARGIN_PX);
  const maxY = Math.max(FLOAT_MARGIN_PX, window.innerHeight - rect.height - FLOAT_MARGIN_PX);
  return {
    x: Math.min(Math.max(FLOAT_MARGIN_PX, pos.x), maxX),
    y: Math.min(Math.max(FLOAT_MARGIN_PX, pos.y), maxY),
  };
}

function setFloatStyle(el, pos) {
  el.style.left = pos ? pos.x + "px" : "";
  el.style.top = pos ? pos.y + "px" : "";
  el.style.right = pos ? "auto" : "";
  el.style.bottom = pos ? "auto" : "";
}

function launcherOnRight() {
  const rect = sidebarToggle.getBoundingClientRect();
  return rect.left + rect.width / 2 >= window.innerWidth / 2;
}

// Where an undragged panel goes once the launcher has moved: above it, on the launcher's side,
// below it when there is no room above, or beside it when neither fits.
function panelPosBesideLauncher() {
  const launcher = sidebarToggle.getBoundingClientRect();
  const size = panel.getBoundingClientRect();
  const onRight = launcherOnRight();
  let x = onRight ? launcher.right - size.width : launcher.left;
  let y = launcher.top - FLOAT_GAP_PX - size.height;
  if (y < FLOAT_MARGIN_PX) {
    y = launcher.bottom + FLOAT_GAP_PX;
    if (y + size.height > window.innerHeight - FLOAT_MARGIN_PX) {
      // No room above or below: open beside the launcher instead of over it.
      x = onRight ? launcher.left - FLOAT_GAP_PX - size.width : launcher.right + FLOAT_GAP_PX;
      y = launcher.bottom - size.height;
    }
  }
  return clampFloatPos({ x, y }, panel);
}

function placeLauncherPeek() {
  const style = launcherPeek.style;
  if (!launcherPos) {
    style.left = style.right = style.bottom = "";
    return;
  }
  const launcher = sidebarToggle.getBoundingClientRect();
  const onRight = launcherOnRight();
  style.left = onRight ? "auto" : launcher.right + FLOAT_GAP_PX + "px";
  style.right = onRight ? window.innerWidth - launcher.left + FLOAT_GAP_PX + "px" : "auto";
  style.bottom = window.innerHeight - launcher.bottom + 4 + "px";
}

function placePanel() {
  if (panelPos) panelPos = clampFloatPos(panelPos, panel);
  setFloatStyle(panel, panelPos || (launcherPos ? panelPosBesideLauncher() : null));
}

function applyFloatPositions() {
  if (!canPlaceFloats()) {
    setFloatStyle(sidebarToggle, null);
    setFloatStyle(panel, null);
    setFloatStyle(playerDock, null);
    launcherPeek.style.left = launcherPeek.style.right = launcherPeek.style.bottom = "";
    return;
  }
  if (launcherPos) launcherPos = clampFloatPos(launcherPos, sidebarToggle);
  setFloatStyle(sidebarToggle, launcherPos);
  placePanel();
  placeLauncherPeek();
  placePlayer();
}

function beginFloatDrag(kind, el, handle, event) {
  if (!canPlaceFloats()) return;
  const rect = el.getBoundingClientRect();
  floatDrag = {
    kind,
    el,
    handle,
    pointerId: event.pointerId,
    startX: Number(event.clientX),
    startY: Number(event.clientY),
    originX: rect.left,
    originY: rect.top,
    moved: false,
  };
  if (typeof handle.setPointerCapture === "function") handle.setPointerCapture(event.pointerId);
}

function moveFloatDrag(event) {
  if (!floatDrag || event.pointerId !== floatDrag.pointerId) return false;
  const dx = Number(event.clientX) - floatDrag.startX;
  const dy = Number(event.clientY) - floatDrag.startY;
  if (!floatDrag.moved && Math.hypot(dx, dy) < FLOAT_DRAG_THRESHOLD_PX) return true;
  if (!floatDrag.moved) {
    floatDrag.moved = true;
    document.body.classList.add("is-float-dragging");
  }
  const pos = clampFloatPos({ x: floatDrag.originX + dx, y: floatDrag.originY + dy }, floatDrag.el);
  if (floatDrag.kind === "launcher") {
    launcherPos = pos;
    setFloatStyle(sidebarToggle, launcherPos);
    placePanel();
    placeLauncherPeek();
  } else if (floatDrag.kind === "player") {
    playerPos = pos;
    setFloatStyle(playerDock, playerPos);
  } else {
    panelPos = pos;
    setFloatStyle(panel, panelPos);
  }
  return true;
}

function endFloatDrag(event) {
  if (!floatDrag || event.pointerId !== floatDrag.pointerId) return false;
  const drag = floatDrag;
  floatDrag = null;
  if (!drag.moved) return true;
  document.body.classList.remove("is-float-dragging");
  if (drag.kind === "launcher") {
    // Settle against the nearer side edge, at the height it was dropped.
    const rect = sidebarToggle.getBoundingClientRect();
    const x = launcherOnRight() ? window.innerWidth - rect.width - LAUNCHER_EDGE_PX : LAUNCHER_EDGE_PX;
    launcherPos = clampFloatPos({ x, y: rect.top }, sidebarToggle);
    writeFloatPos(launcherPosStorageKey, launcherPos);
    applyFloatPositions();
    suppressLauncherClick = true;
    window.setTimeout(() => {
      suppressLauncherClick = false;
    }, 0);
  } else if (drag.kind === "player") {
    writeFloatPos(playerPosStorageKey, playerPos);
  } else {
    writeFloatPos(panelPosStorageKey, panelPos);
  }
  return true;
}

sidebarToggle.addEventListener("pointerdown", (event) => {
  if (event.button) return;
  beginFloatDrag("launcher", sidebarToggle, sidebarToggle, event);
});
sidebarToggle.addEventListener("pointermove", (event) => moveFloatDrag(event));
sidebarToggle.addEventListener("pointerup", (event) => endFloatDrag(event));
sidebarToggle.addEventListener("pointercancel", (event) => endFloatDrag(event));

// ---- The video player for Textcast pages ----
// A Textcast page sends `textcast:play` with only the video's identity and a start second; the chrome
// builds the embed URL itself from a fixed pattern per site, so the page cannot point this
// unsandboxed frame anywhere else. It floats bottom-left by default, away from the launcher, drags
// by the grip at its top, and grows from its corner grip; the default size is the smallest.
const playerDock = /** @type {HTMLElement} */ (document.getElementById("playerDock"));
const playerGrip = /** @type {HTMLElement} */ (document.getElementById("playerGrip"));
const playerSlot = /** @type {HTMLElement} */ (document.getElementById("playerSlot"));
const playerClose = /** @type {HTMLButtonElement} */ (document.getElementById("playerClose"));
const playerResizers = /** @type {HTMLElement[]} */ (Array.from(playerDock.querySelectorAll(".player-resize")));
const playerSwitch = /** @type {HTMLButtonElement} */ (document.getElementById("videoSwitch"));
const playerEnabledStorageKey = "textcast-chat-axi:video-on-click";
const playerPosStorageKey = "textcast-chat-axi:player-pos";
const playerWidthStorageKey = "textcast-chat-axi:player-width";
const PLAYER_MIN_WIDTH_PX = 400;
let playerPos = readFloatPos(playerPosStorageKey);
let playerWidth = readPlayerWidth();
let playerEnabled = readPlayerEnabled();
/** @type {{ edge: string, handle: HTMLElement, pointerId: any, startX: number, startY: number, rect: { left: number, top: number, right: number, bottom: number, width: number } } | null} */
let playerResizeDrag = null;

function readPlayerEnabled() {
  try {
    return localStorage.getItem(playerEnabledStorageKey) !== "0";
  } catch {
    return true;
  }
}
/** @type {HTMLIFrameElement | null} */
let playerFrame = null;

function playerEmbedUrl(msg) {
  const start = Math.max(0, Math.floor(Number(msg.start) || 0));
  const id = String(msg.id || "");
  if (msg.kind === "youtube" && /^[\w-]{6,20}$/.test(id)) {
    return "https://www.youtube.com/embed/" + id + "?start=" + start + "&autoplay=1&rel=0";
  }
  if (msg.kind === "bilibili" && /^BV[0-9A-Za-z]{8,12}$/.test(id)) {
    const page = Math.min(999, Math.max(1, Math.floor(Number(msg.page) || 1)));
    return (
      "https://player.bilibili.com/player.html?bvid=" +
      id +
      "&p=" +
      page +
      "&t=" +
      start +
      "&autoplay=1&high_quality=1&danmaku=0"
    );
  }
  return "";
}

function readPlayerWidth() {
  try {
    const value = Number(localStorage.getItem(playerWidthStorageKey));
    if (Number.isFinite(value) && value > PLAYER_MIN_WIDTH_PX) return value;
  } catch {
    // An unreadable size falls back to the default.
  }
  return 0;
}

// The widest the player can be with its 16:9 height still inside the window.
function playerMaxWidth() {
  const byWidth = window.innerWidth - 2 * FLOAT_MARGIN_PX;
  const byHeight = ((window.innerHeight - 2 * FLOAT_MARGIN_PX) * 16) / 9;
  return Math.max(0, Math.min(byWidth, byHeight));
}

function setPlayerWidth(width) {
  playerDock.style.width = width > PLAYER_MIN_WIDTH_PX ? Math.round(width) + "px" : "";
}

function placePlayer() {
  if (playerDock.hidden) return;
  if (!canPlaceFloats()) {
    setFloatStyle(playerDock, null);
    setPlayerWidth(0);
    return;
  }
  setPlayerWidth(playerWidth ? Math.min(playerWidth, Math.max(PLAYER_MIN_WIDTH_PX, playerMaxWidth())) : 0);
  if (playerPos) playerPos = clampFloatPos(playerPos, playerDock);
  setFloatStyle(playerDock, playerPos);
}

function playVideo(msg) {
  const url = playerEmbedUrl(msg);
  if (!url || !playerEnabled) return;
  if (!playerFrame) {
    playerFrame = /** @type {HTMLIFrameElement} */ (document.createElement("iframe"));
    playerFrame.className = "player-frame";
    playerFrame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
    playerFrame.setAttribute("allowfullscreen", "");
    playerFrame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    playerSlot.appendChild(playerFrame);
  }
  playerFrame.src = url;
  playerDock.hidden = false;
  placePlayer();
}

function closePlayer() {
  playerDock.hidden = true;
  if (playerFrame) playerFrame.remove();
  playerFrame = null;
}

playerClose.addEventListener("click", closePlayer);
// The grip sits over the video, so the video's frame stops taking the pointer from the press on;
// otherwise the first move lands in the frame and the drag never starts.
playerGrip.addEventListener("pointerdown", (event) => {
  if (event.button || !canPlaceFloats()) return;
  document.body.classList.add("is-float-dragging");
  beginFloatDrag("player", playerDock, playerGrip, event);
});
playerGrip.addEventListener("pointermove", (event) => {
  if (!event.buttons) endPlayerDrag(event);
  else moveFloatDrag(event);
});
function endPlayerDrag(event) {
  endFloatDrag(event);
  document.body.classList.remove("is-float-dragging");
}
playerGrip.addEventListener("pointerup", endPlayerDrag);
playerGrip.addEventListener("pointercancel", endPlayerDrag);
playerGrip.addEventListener("lostpointercapture", endPlayerDrag);

// Every edge and corner resizes, keeping 16:9: the opposite edge (or corner) stays put while the
// one held moves. The default size is the smallest; the window is the largest.
function beginPlayerResize(handle, event) {
  if (event.button || !canPlaceFloats()) return;
  const rect = playerDock.getBoundingClientRect();
  playerPos = { x: rect.left, y: rect.top };
  setFloatStyle(playerDock, playerPos);
  playerResizeDrag = {
    edge: String(handle.getAttribute("data-edge") || "se"),
    handle,
    pointerId: event.pointerId,
    startX: Number(event.clientX),
    startY: Number(event.clientY),
    rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width },
  };
  document.body.classList.add("is-float-dragging");
  if (typeof handle.setPointerCapture === "function") handle.setPointerCapture(event.pointerId);
  event.preventDefault();
}

function movePlayerResize(event) {
  const drag = playerResizeDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  // A release the grip never heard about (it can land outside the window) ends the resize here,
  // so merely passing over the grip afterwards can never keep resizing.
  if (!event.buttons) {
    endPlayerResize(event);
    return;
  }
  const { edge, rect } = drag;
  const dx = Number(event.clientX) - drag.startX;
  const dy = Number(event.clientY) - drag.startY;
  const byX = edge.includes("e") ? dx : edge.includes("w") ? -dx : null;
  const byY = edge.includes("s") ? (dy * 16) / 9 : edge.includes("n") ? (-dy * 16) / 9 : null;
  const grow = byX === null ? byY || 0 : byY === null ? byX : Math.max(byX, byY);
  // A held edge stops at the window and the edge across from it never moves. Holding a side edge
  // also grows the other axis; that one has no edge held, so it slides back inside the window.
  const fromLeft = edge.includes("w");
  const fromTop = edge.includes("n");
  const roomX = fromLeft ? rect.right - FLOAT_MARGIN_PX : window.innerWidth - FLOAT_MARGIN_PX - rect.left;
  const roomY = fromTop ? rect.bottom - FLOAT_MARGIN_PX : window.innerHeight - FLOAT_MARGIN_PX - rect.top;
  const room = Math.min(playerMaxWidth(), byX === null ? Infinity : roomX, byY === null ? Infinity : (roomY * 16) / 9);
  const floor = Math.min(PLAYER_MIN_WIDTH_PX, window.innerWidth - 2 * FLOAT_MARGIN_PX);
  playerWidth = Math.max(floor, Math.min(rect.width + grow, room));
  setPlayerWidth(playerWidth);
  const height = (playerWidth * 9) / 16;
  const x = fromLeft ? rect.right - playerWidth : rect.left;
  const y = fromTop ? rect.bottom - height : rect.top;
  playerPos = clampFloatPos({ x, y }, playerDock);
  setFloatStyle(playerDock, playerPos);
}

function endPlayerResize(event) {
  const drag = playerResizeDrag;
  if (!drag || event.pointerId !== drag.pointerId) return;
  playerResizeDrag = null;
  document.body.classList.remove("is-float-dragging");
  if (typeof drag.handle.releasePointerCapture === "function") {
    try {
      drag.handle.releasePointerCapture(event.pointerId);
    } catch {
      // Already released.
    }
  }
  if (playerWidth <= PLAYER_MIN_WIDTH_PX) playerWidth = 0;
  try {
    if (playerWidth) localStorage.setItem(playerWidthStorageKey, String(Math.round(playerWidth)));
    else localStorage.removeItem(playerWidthStorageKey);
  } catch {
    // Storage refused only means the size does not survive a reload.
  }
  writeFloatPos(playerPosStorageKey, playerPos);
}

for (const handle of playerResizers) {
  handle.addEventListener("pointerdown", (event) => beginPlayerResize(handle, event));
  handle.addEventListener("pointermove", movePlayerResize);
  handle.addEventListener("pointerup", endPlayerResize);
  handle.addEventListener("pointercancel", endPlayerResize);
  handle.addEventListener("lostpointercapture", endPlayerResize);
}

// "Play the video when a line is clicked", in the More menu, shown only on a page with a video.
// Off, a click on the transcript plays nothing: the chrome ignores the page's request, and the
// page, which only opens a tab when no review window is around to ask, never falls back to one.
function applyPlayerSwitch() {
  playerSwitch.setAttribute("aria-pressed", String(playerEnabled));
}

function showPlayerSwitch(pageHasVideo) {
  playerSwitch.hidden = !pageHasVideo;
}

playerSwitch.addEventListener("click", () => {
  playerEnabled = !playerEnabled;
  try {
    localStorage.setItem(playerEnabledStorageKey, playerEnabled ? "1" : "0");
  } catch {
    // Storage refused only means the choice does not survive a reload.
  }
  applyPlayerSwitch();
  if (!playerEnabled) closePlayer();
});
applyPlayerSwitch();

window.addEventListener("resize", applyFloatPositions);
applyFloatPositions();

function scrollElementIntoView(el) {
  el.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function isPromptEditable(prompt) {
  return Boolean(prompt) && !terminalSubmission && !isPromptSending(prompt);
}

function editQueuedPrompt(index, { reveal = true } = {}) {
  const prompt = queued[index];
  if (ended || !isPromptEditable(prompt)) return;
  const id = promptIdentity(prompt);
  if (!id) return;
  if (id === editingPromptId) {
    // Collapsing keeps the open edit, so asking for it again brings it back into view.
    if (isConversationHidden()) {
      editFocusPending = true;
      revealConversation();
      render();
    }
    return;
  }
  // Moving to another note keeps what was typed into the first, the way leaving a field does.
  commitQueuedEdit();
  editingPromptId = id;
  editingDraft = String(prompt.prompt || "");
  editFocusPending = true;
  revealConversation();
  render();
  if (reveal && prompt.selector) postToFrame({ type: "textcast:revealElement", selector: String(prompt.selector) });
}

function endQueuedEdit() {
  editingPromptId = "";
  editingDraft = "";
}

// Writes the open edit into its note without rendering. Returns whether the queue changed. A note
// cleared of words and images is removed, as if its remove control had been used.
function commitQueuedEdit() {
  if (!editingPromptId) return false;
  const index = queued.findIndex((prompt) => promptIdentity(prompt) === editingPromptId);
  const text = editingDraft.trim();
  endQueuedEdit();
  const prompt = queued[index];
  if (!isPromptEditable(prompt)) return false;
  if (!text && !attachmentCount(prompt)) {
    queued.splice(index, 1);
    afterQueuedPromptRemoved();
  } else {
    // In place, not replaced: the send bookkeeping tracks notes by object identity.
    prompt.prompt = text;
    persistQueuedPrompts();
  }
  return true;
}

function saveQueuedEdit() {
  commitQueuedEdit();
  render();
}

function cancelQueuedEdit() {
  endQueuedEdit();
  render();
}

queuedLog.addEventListener("click", (event) => {
  const target = /** @type {Element | null} */ (event.target);
  if (!target || typeof target.closest !== "function") return;
  // The remove control owns its own click, and an editor's textarea is for typing.
  if (target.closest(".queued-remove") || target.closest(".queued-edit-input")) return;
  if (target.closest(".queued-edit-save")) return saveQueuedEdit();
  if (target.closest(".queued-edit-cancel")) return cancelQueuedEdit();
  const bubble = /** @type {HTMLElement | null} */ (target.closest(".queued-edit") || target.closest(".bubble.queued"));
  if (bubble) editQueuedPrompt(Number(bubble.dataset.index));
});
queuedLog.addEventListener("input", (event) => {
  const target = /** @type {HTMLTextAreaElement | null} */ (event.target);
  if (target && typeof target.closest === "function" && target.closest(".queued-edit-input")) {
    editingDraft = String(target.value || "");
  }
});
queuedLog.addEventListener("keydown", (event) => {
  const target = /** @type {Element | null} */ (event.target);
  if (!target || typeof target.closest !== "function" || !target.closest(".queued-edit-input")) return;
  // The annotation card's keys: Enter keeps the words, Shift+Enter breaks the line.
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    event.stopPropagation();
    saveQueuedEdit();
  } else if (event.key === "Escape" && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    event.stopPropagation();
    cancelQueuedEdit();
  }
});

function removeQueuedPrompt(index, event) {
  if (event) event.stopPropagation();
  if (terminalSubmission || isPromptSending(queued[index])) return;
  queued.splice(index, 1);
  afterQueuedPromptRemoved();
  render();
}

function afterQueuedPromptRemoved() {
  persistQueuedPrompts();
  if (!queued.length) {
    clearSendAcknowledgementWarning();
    if (sendFailureOwner?.kind !== "preparation") clearPersistentSendFailure();
  }
}

function promptQueueKey(prompt) {
  return prompt && typeof prompt[internalQueueKeyField] === "string" ? prompt[internalQueueKeyField].trim() : "";
}

function enqueuePrompt(rawPrompt, /** @type {FeedbackPreparation | null} */ preparation = null) {
  if ((preparation && !feedbackPreparations.has(preparation)) || (terminalSubmission && !preparation)) return false;
  // The sandboxed iframe is untrusted: never accept a caller-supplied settlement identity.
  const prompt = adoptQueuedPrompt(rawPrompt, false);
  if (!prompt) return false;
  // The page it was written on is the chrome's to say, not the frame's, and only worth saying
  // once the reader has left the session's own file.
  delete prompt.page;
  if (currentPage !== filePath) prompt.page = currentPage;

  const queueKey = promptQueueKey(prompt);
  if (queueKey) {
    const index = queued.findIndex((item) => promptQueueKey(item) === queueKey);
    if (index !== -1) {
      // The replacement is the artifact's newer answer. Words typed against the old answer never
      // move onto it; they are handed back to the reviewer instead.
      if (editingPromptId && promptIdentity(queued[index]) === editingPromptId) {
        const draft = editingDraft.trim();
        endQueuedEdit();
        if (draft !== String(queued[index].prompt || "").trim()) keepRetiredDraft(draft);
      }
      queued[index] = prompt;
    } else {
      queued.push(prompt);
    }
  } else {
    queued.push(prompt);
  }
  persistQueuedPrompts();
  render();
  return true;
}

function stripInternalPromptFields(prompt) {
  if (!prompt || typeof prompt !== "object") return prompt;
  const clean = { ...prompt };
  delete clean[internalQueueKeyField];
  return clean;
}

function postToFrame(message) {
  if (frame.contentWindow) frame.contentWindow.postMessage(message, "*");
}

// A Send first round-trips through the artifact frame, so every note the frame already posted is
// queued before the batch leaves. The frame answers with an empty snapshot: Textcast notes carry
// segment selectors, so no DOM snapshot is collected or delivered to the agent.
function requestSnapshot(action, prompts = [], endAfter = false, terminal = null) {
  const requestId = "snapshot-" + ++nextSnapshotRequestId;
  const request = {
    action,
    prompts,
    chatAtRequest: displayedChat.slice(),
    endAfter,
    terminal,
    order: terminal?.order || ++nextSendOperationOrder,
  };
  snapshotRequests.set(requestId, request);
  request.acknowledgement = {};
  pendingAcknowledgements.add(request.acknowledgement);
  armSendAcknowledgementWarning();
  request.timeout = setTimeout(() => completeSnapshotRequest(requestId, ""), SNAPSHOT_REQUEST_TIMEOUT_MS);
  postToFrame({ type: "textcast:requestSnapshot", snapshot_request_id: requestId });
}

function takeSnapshotRequest(requestId) {
  if (typeof requestId !== "string" || !requestId || !snapshotRequests.has(requestId)) return null;
  const request = snapshotRequests.get(requestId);
  snapshotRequests.delete(requestId);
  if (request?.timeout) clearTimeout(request.timeout);
  return request || null;
}

function completeSnapshotRequest(requestId, snapshot) {
  const request = takeSnapshotRequest(requestId);
  if (!request) return;

  submitQueued({
    prompts: request.prompts || [],
    chatAtRequest: request.chatAtRequest || [],
    domSnapshot: snapshot || "",
    endAfter: request.endAfter === true,
    terminal: request.terminal || null,
    acknowledgement: request.acknowledgement || null,
    order: request.order || 0,
  }).catch(() => {});
}

function createChatAttachmentsController() {
  const items = [];
  let nextId = 0;
  let capRejected = false;
  let sendBlocked = false;

  function currentImageCount() {
    return items.filter((item) => item.file && CHAT_ATTACHMENT_MIME.has(item.file.type)).length;
  }

  function renderAttachments() {
    chatAttachments.innerHTML = items
      .map((item) => {
        const status = item.status === "uploading" ? t("Uploading…") : item.status === "error" ? t(item.error) : "";
        const preview = item.preview
          ? '<img class="chat-attachment-thumb" src="' + escapeHtml(item.preview) + '" alt="">'
          : "";
        const retry =
          item.status === "error" && item.file
            ? '<button type="button" aria-label="' +
              escapeHtml(t("Retry " + item.name)) +
              '" data-chat-attachment-retry="' +
              item.localId +
              '">' +
              escapeHtml(t("Retry")) +
              "</button>"
            : "";
        const errorData = item.errorCode ? ' data-error="' + escapeHtml(item.errorCode) + '"' : "";
        return (
          '<div class="chat-attachment-chip chat-attachment-' +
          item.status +
          '"' +
          errorData +
          ">" +
          preview +
          '<span class="chat-attachment-copy"><strong>' +
          escapeHtml(item.name) +
          "</strong>" +
          (status ? '<span class="chat-attachment-status" aria-live="polite">' + escapeHtml(status) + "</span>" : "") +
          "</span>" +
          retry +
          '<button type="button" aria-label="' +
          escapeHtml(t("Remove " + item.name)) +
          '" title="' +
          escapeHtml(t("Remove " + item.name)) +
          '" data-chat-attachment-remove="' +
          item.localId +
          '">×</button></div>'
        );
      })
      .join("");
    syncNotice();
  }

  // The notice is DERIVED from the current item states on every render, never
  // written imperatively by a caller: a blocked send that only stamped a string
  // went stale the moment the pending upload it described failed, leaving the
  // user waiting on an upload that was already over.
  function syncNotice() {
    if (currentImageCount() < attachmentMaxCount) capRejected = false;
    const pending = items.some((item) => item.status === "uploading");
    const errored = items.some((item) => item.status === "error");
    if (!pending && !errored) sendBlocked = false;
    chatAttachmentNotice.textContent =
      sendBlocked && pending
        ? t("Waiting for an image to finish uploading…")
        : sendBlocked && errored
          ? t("An image couldn't be attached. Retry or remove it before sending.")
          : capRejected
            ? t("You can attach up to " + attachmentMaxCount + " image" + (attachmentMaxCount === 1 ? "" : "s") + ".")
            : "";
  }

  async function startUpload(item) {
    const abortController = new AbortController();
    item.abortController = abortController;
    item.status = "uploading";
    item.error = "";
    renderAttachments();
    try {
      const bytes = await item.file.arrayBuffer();
      if (!items.includes(item)) return;
      await uploadAttachment(
        { localId: item.localId, bytes, mime: item.file.type },
        (result) => {
          if (!items.includes(item)) return;
          if (result.ok && result.id) {
            item.status = "ready";
            item.id = result.id;
          } else {
            item.status = "error";
            item.error = String(result.error || t("Upload failed"));
          }
          renderAttachments();
        },
        abortController.signal,
      );
    } catch (error) {
      if (!items.includes(item)) return;
      item.status = "error";
      item.error = error instanceof Error ? error.message : String(error);
      renderAttachments();
    }
  }

  function addFiles(files) {
    let added = false;
    let imageCount = currentImageCount();
    for (const file of Array.from(files || [])) {
      if (!CHAT_ATTACHMENT_MIME.has(String(file.type || ""))) continue;
      const tooLarge = attachmentMaxBytes > 0 && Number(file.size) > attachmentMaxBytes;
      // The cap counts only chips that can upload, mirroring currentImageCount:
      // if a size-refused chip (file: null) consumed a slot here, syncNotice
      // would clear the cap notice on the same render tick and a valid image
      // later in the batch would vanish with no chip and no explanation.
      if (!tooLarge && imageCount >= attachmentMaxCount) {
        capRejected = true;
        continue;
      }
      const localId = String(nextId++);
      const item = {
        localId,
        file: tooLarge ? null : file,
        name: String(file.name || "image"),
        preview: tooLarge ? "" : URL.createObjectURL(file),
        status: tooLarge ? "error" : "uploading",
        error: tooLarge ? t("Image is larger than the " + formatByteLimit(attachmentMaxBytes) + " limit") : "",
        errorCode: "",
        id: "",
        abortController: /** @type {AbortController | null} */ (null),
      };
      items.push(item);
      if (!tooLarge) imageCount += 1;
      added = true;
      if (!tooLarge) startUpload(item);
    }
    renderAttachments();
    return added;
  }

  function rejectUnsupported(files) {
    for (const file of Array.from(files || [])) {
      if (CHAT_ATTACHMENT_MIME.has(String(file.type || ""))) continue;
      items.push({
        localId: String(nextId++),
        file: null,
        name: String(file.name || "file"),
        preview: "",
        status: "error",
        error: t("Unsupported file type. Use " + CHAT_ATTACHMENT_LABELS + "."),
        errorCode: "UNSUPPORTED_TYPE",
        id: "",
        abortController: /** @type {AbortController | null} */ (null),
      });
    }
    renderAttachments();
  }

  function remove(localId) {
    const index = items.findIndex((item) => item.localId === localId);
    if (index < 0) return;
    const [item] = items.splice(index, 1);
    item.abortController?.abort();
    if (item.preview) URL.revokeObjectURL(item.preview);
    renderAttachments();
  }

  function reset() {
    for (const item of items) {
      item.abortController?.abort();
      if (item.preview) URL.revokeObjectURL(item.preview);
    }
    items.length = 0;
    capRejected = false;
    sendBlocked = false;
    renderAttachments();
  }

  return {
    addFiles,
    rejectUnsupported,
    remove,
    retry(localId) {
      const item = items.find((candidate) => candidate.localId === localId);
      if (item?.file) startUpload(item);
    },
    hasPending: () => items.some((item) => item.status === "uploading"),
    hasErrors: () => items.some((item) => item.status === "error"),
    noteSendBlocked() {
      sendBlocked = true;
      syncNotice();
    },
    collectReady: () =>
      items.filter((item) => item.status === "ready").map((item) => ({ id: item.id, name: item.name })),
    reset,
  };
}

const chatAttachmentController = createChatAttachmentsController();

function sendQueued(endAfter) {
  if (ended) return;
  if (terminalSubmission) {
    if (endAfter && !terminalSubmission.inFlight) retryTerminalSubmission();
    return;
  }
  closeMenus();
  // Send delivers what the panel shows, so an open edit is kept rather than sent stale.
  if (commitQueuedEdit()) render();

  // A pending or failed chip holds back only the COMPOSER message (and an
  // explicit end, which would strand the chips) - queued annotation prompts
  // still deliver, mirroring how the annotation card holds only its own card
  // open. Gating the whole pipeline here made Send and Send & End silently
  // deliver nothing while the only signal sat in the composer toolbar.
  const chipsBlocked = chatAttachmentController.hasPending() || chatAttachmentController.hasErrors();
  if (chipsBlocked) chatAttachmentController.noteSendBlocked();

  if (!chipsBlocked) {
    const text = chatInput.value.trim();
    const attachments = chatAttachmentController.collectReady();
    if (text || attachments.length) {
      const prompt = { uid: "", prompt: text, selector: "", tag: "message", text: "Freeform message" };
      if (currentPage !== filePath) prompt.page = currentPage;
      if (attachments.length) prompt.attachments = attachments;
      assignPromptIdentity(prompt, false);
      queued.push(prompt);
      persistQueuedPrompts();
      // Render the durable queued bubble before clearing the editor. If anything after this point
      // fails, the user's words are already both stored and visibly recoverable in the tab. It
      // becomes a sent bubble only when the server's transcript carries it (see submitQueuedOnce).
      render();
      chatInput.value = "";
      chatAttachmentController.reset();
    }
  }
  const shouldEnd = Boolean(endAfter && !chipsBlocked);
  const preparations = shouldEnd ? [...feedbackPreparations] : [];
  if (!queued.length && preparations.length === 0) {
    if (!chipsBlocked && !sendFailureOwner) {
      if (endAfter) showSendHint(EMPTY_END_HINT);
      else showSendHint(DEFAULT_SEND_HINT, EMPTY_SEND_HINT_HOLD_MS);
    }
    return;
  }
  if (!shouldEnd && (agentPresence === "working" || agentPresence === "external")) {
    sendWhenAgentReady = true;
    render();
    return;
  }
  if (!sendFailureOwner) hideSendHint(true);
  if (shouldEnd) {
    const terminal = {
      prompts: [],
      inFlight: true,
      order: ++nextSendOperationOrder,
    };
    terminalSubmission = terminal;
    updateSendState();
    finishTerminalPreparation(terminal, preparations);
    return;
  }
  requestSnapshot("submit", queued.slice(), false, null);
  render();
}

function finishTerminalPreparation(terminal, preparations) {
  if (preparations.length === 0) {
    completeTerminalPreparation(terminal, []);
    return;
  }
  const timeout = setTimeout(() => {
    if (terminalSubmission !== terminal || ended) return;
    for (const preparation of preparations) preparation.finish(false);
    showPersistentSendFailure(
      t(
        "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.",
      ),
      false,
      { kind: "preparation", operation: terminal, preparationType: "terminal" },
    );
    releaseTerminalSubmission(terminal);
  }, TERMINAL_PREPARATION_TIMEOUT_MS);
  Promise.all(preparations.map((preparation) => preparation.done)).then((results) => {
    clearTimeout(timeout);
    completeTerminalPreparation(terminal, results);
  });
}

function completeTerminalPreparation(terminal, results) {
  if (terminalSubmission !== terminal || ended) return;
  if (results.some((succeeded) => !succeeded)) {
    releaseTerminalSubmission(terminal);
    return;
  }
  terminal.prompts = queued.slice();
  clearPreparationFailure("terminal");
  if (!terminal.prompts.length) {
    releaseTerminalSubmission(terminal);
    if (!sendFailureOwner) showSendHint(EMPTY_END_HINT);
    return;
  }
  // Only make the reservation durable once every preparation has joined the exact
  // batch. A reload before this point must restore an ordinary editable queue, not
  // an incomplete terminal submission.
  persistTerminalReservation(true);
  requestSnapshot("submit", terminal.prompts, true, terminal);
  render();
}

function retryTerminalSubmission() {
  if (!terminalSubmission || terminalSubmission.inFlight || ended) return;
  terminalSubmission.inFlight = true;
  updateSendState();
  requestSnapshot("submit", terminalSubmission.prompts, true, terminalSubmission);
  render();
}

function markTerminalSubmissionFailed(submission) {
  if (!terminalSubmission || submission.terminal !== terminalSubmission || ended) return;
  terminalSubmission.inFlight = false;
  updateSendState();
}

function releaseTerminalSubmission(terminal) {
  if (terminalSubmission !== terminal || ended) return;
  terminalSubmission = null;
  persistTerminalReservation(false);
  render();
}

async function submitQueued(submission) {
  if (!Array.isArray(submission.chatAtRequest)) submission.chatAtRequest = displayedChat.slice();
  pendingSubmissions.push(submission);
  if (submitQueuedPromise) {
    return submitQueuedPromise;
  }

  submitQueuedPromise = (async () => {
    /** @type {unknown} */
    let firstError = null;
    while (pendingSubmissions.length && !ended) {
      const next = pendingSubmissions.shift();
      if (!next) continue;
      activeSubmission = next;
      try {
        const result = await submitQueuedOnce(next, firstError !== null);
        if (result === false) markTerminalSubmissionFailed(next);
      } catch (error) {
        markTerminalSubmissionFailed(next);
        if (firstError === null) firstError = error;
      } finally {
        if (next.acknowledgement) pendingAcknowledgements.delete(next.acknowledgement);
        activeSubmission = null;
        // Whatever happened, the batch is no longer in flight: a failed note reads Queued again
        // with its remove control back.
        render();
      }
    }
    if (firstError !== null) throw firstError;
  })();
  try {
    return await submitQueuedPromise;
  } finally {
    submitQueuedPromise = null;
  }
}

async function submitQueuedOnce(submission, preserveFailureState = false) {
  settleQueuedFromTranscript(displayedChat);
  const prompts = submission.prompts.filter(
    (prompt) => !deliveredPrompts.has(prompt) && !promptAcknowledgedInChat(prompt, displayedChat),
  );
  const shouldEndSession = submission.endAfter;
  if (!prompts.length) {
    if (shouldEndSession && !ended) {
      try {
        await endSession(submission.terminal);
      } catch (error) {
        showPersistentSendFailure(TERMINAL_SEND_FAILED_COPY, false, {
          kind: "terminal",
          operation: submission.terminal,
        });
        throw error;
      }
    }
    settleAcknowledgementGuidance(submission, preserveFailureState);
    return;
  }
  const body = { prompts: prompts.map(stripInternalPromptFields), domSnapshot: submission.domSnapshot };
  if (shouldEndSession) body.endSession = true;
  let response;
  try {
    response = await fetch("/api/" + key + "/prompts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    // The DOM snapshot is optional context and can be the difference between a
    // useful terminal batch and Express' request-size limit. Retry exactly once
    // without it; never mutate or split the user's exact feedback batch.
    if (response.status === 413 && body.domSnapshot) {
      body.domSnapshot = "";
      response = await fetch("/api/" + key + "/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  } catch (error) {
    showQueuedSendFailure(submission.terminal ? TERMINAL_SEND_FAILED_COPY : SEND_FAILED_COPY, {
      kind: submission.terminal ? "terminal" : "submission",
      operation: submission.terminal || submission,
    });
    throw error;
  }
  if (!response.ok) {
    if (response.status === 413) {
      showQueuedSendFailure(
        t(
          "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.",
        ),
        { kind: "submission", operation: submission },
      );
      if (submission.terminal) releaseTerminalSubmission(submission.terminal);
      throw new Error("queued feedback exceeds the request size limit");
    }
    if (response.status === 409) {
      const data = await response.json().catch(() => null);
      // The session already ended before this batch arrived - most likely this chrome missed the
      // live `ended` event (a dropped connection). Go read-only now instead of leaving Send enabled
      // for another attempt that will be refused the same way.
      if (data?.status === "ended") {
        clearSendAcknowledgementWarning();
        markSessionEnded();
        return false;
      }
    }
    // C4: the server persisted nothing (atomic reject) - the queue below is left
    // intact because the splice only runs on success. Surface exactly what failed
    // so the user can fix the offending attachment(s) rather than losing them.
    if (response.status === 400) {
      const detail = await response.json().catch(() => ({}));
      if (Array.isArray(detail.rejected) && detail.rejected.length) {
        showQueuedSendFailure(describeAttachmentRejection(detail.rejected, detail.caps), {
          kind: "submission",
          operation: submission,
        });
        if (submission.terminal) releaseTerminalSubmission(submission.terminal);
      } else {
        showQueuedSendFailure(submission.terminal ? TERMINAL_SEND_FAILED_COPY : SEND_FAILED_COPY, {
          kind: submission.terminal ? "terminal" : "submission",
          operation: submission.terminal || submission,
        });
      }
    } else {
      showQueuedSendFailure(submission.terminal ? TERMINAL_SEND_FAILED_COPY : SEND_FAILED_COPY, {
        kind: submission.terminal ? "terminal" : "submission",
        operation: submission.terminal || submission,
      });
    }
    throw new Error("failed to submit queued prompts");
  }
  const accepted = typeof response.json === "function" ? await response.json().catch(() => null) : null;
  rememberChatAckIds(accepted?.ack_ids);
  const acceptedChat = Array.isArray(accepted?.chat) ? accepted.chat : null;
  if (acceptedChat) settleQueuedFromTranscript(acceptedChat);
  const acceptedRevision = parseChatRevision(accepted?.chat_revision);
  const reconciledChat = acceptedChat
    ? acceptedRevision !== null && acceptedRevision > chatRevision
      ? acceptedChat
      : mergeAcceptedChat(acceptedChat, submission.chatAtRequest)
    : null;
  if (!acceptedChat || reconciledChat) {
    for (const prompt of prompts) {
      deliveredPrompts.add(prompt);
      const index = queued.indexOf(prompt);
      if (index !== -1) queued.splice(index, 1);
    }
    persistQueuedPrompts();
    if (reconciledChat) syncChat(reconciledChat, acceptedRevision);
  }
  render();
  settleAcknowledgementGuidance(submission, preserveFailureState);
  if (shouldEndSession) {
    markSessionEnded();
    return;
  }
}

function submissionResolvesSendFailure(submission) {
  if (!sendFailureOwner) return true;
  if (sendFailureOwner.kind === "preparation") return false;
  if (sendFailureOwner.kind === "terminal") return sendFailureOwner.operation === submission.terminal;
  const failedSubmission = sendFailureOwner.operation;
  return (
    failedSubmission === submission ||
    (Array.isArray(failedSubmission.prompts) &&
      failedSubmission.prompts.every((prompt) => deliveredPrompts.has(prompt)))
  );
}

function settleAcknowledgementGuidance(submission, preserveFailureState) {
  if (!submissionResolvesSendFailure(submission) || (preserveFailureState && queued.length)) return;
  const hasLaterAcknowledgement = [...pendingAcknowledgements].some(
    (acknowledgement) => acknowledgement !== submission.acknowledgement,
  );
  if (hasLaterAcknowledgement) {
    if (!sendAcknowledgementTimer && !sendAcknowledgementWarningVisible) armSendAcknowledgementWarning();
    return;
  }
  clearSendAcknowledgementWarning();
  clearPersistentSendFailure();
}

// The few failures the chrome cannot work around on its own: the page never loaded and retrying
// stopped helping, the server did not come back after a restart, or another tab owns a review
// this tab never showed. The notice floats over the page without covering it, and the reader can
// always dismiss it, so no failure ever stands between the reader and the page.
function showLoadNotice(title, copy, actionLabel = t("Reload"), onAction, { sticky = false } = {}) {
  if (ended) return;
  // A sticky notice is the user's to retire, and that has to hold against being overwritten as
  // well as against being cleared: the version-skew warning is the only thing telling this page
  // it is running the pre-upgrade client, and a later ordinary load failure must not replace it.
  if (loadNoticeActive && loadNoticeSticky && !sticky) return;
  loadNoticeActive = true;
  loadNoticeSticky = sticky;
  loadNoticeCycle += 1;
  if (loadNoticeTitle) loadNoticeTitle.textContent = title;
  if (loadNoticeCopy) loadNoticeCopy.textContent = copy;
  if (loadNoticeAction) {
    loadNoticeAction.disabled = false;
    loadNoticeAction.textContent = actionLabel;
    loadNoticeAction.onclick = onAction || (() => location.reload());
  }
  if (loadNotice) loadNotice.hidden = false;
}

function hideLoadNotice() {
  loadNoticeActive = false;
  loadNoticeSticky = false;
  loadNoticeCycle += 1;
  if (loadNotice) loadNotice.hidden = true;
}

// Every notice in this feature is raised in a state where the server may not be listening, so
// none of them may navigate on trust: a reload into a dead port replaces a recoverable page with
// the browser's own connection-error page. Ask first, and say so when nothing answers.
// Title and body are written together: a probe that timed out establishes neither that the server
// is running nor that it is gone, so a heading naming a definite cause may not stand over a line
// saying the cause is unknown.
function checkServerThenReload(failureTitle, stillDownCopy) {
  let checking = false;
  return async () => {
    if (checking) return;
    checking = true;
    if (loadNoticeAction) loadNoticeAction.disabled = true;
    // The notice this click was made on. A probe can take until HEALTH_PROBE_TIMEOUT_MS, and the
    // notice may have moved on to a different failure, or gone, by then; its copy is not this
    // probe's to overwrite.
    const cycle = loadNoticeCycle;
    let outcome = "not-running";
    let navigating = false;
    try {
      outcome = await probeChromeHealth();
      if (outcome === "running") {
        navigating = true;
        location.reload();
      }
    } finally {
      // Every path that does not navigate hands the control back, including a probe that timed
      // out or threw: a button that stays disabled is worse than the reload it was guarding.
      if (!navigating) {
        checking = false;
        if (loadNoticeAction) loadNoticeAction.disabled = false;
        if (cycle === loadNoticeCycle) {
          const answered = outcome !== "no-answer";
          if (loadNoticeTitle) loadNoticeTitle.textContent = answered ? failureTitle : HEALTH_NO_ANSWER_TITLE;
          if (loadNoticeCopy) loadNoticeCopy.textContent = answered ? stillDownCopy : HEALTH_NO_ANSWER_COPY;
        }
      }
    }
  };
}

// A load attempt that gets going again retires an ordinary failure notice, never a sticky one.
function clearLoadNotice() {
  if (!loadNoticeActive || loadNoticeSticky) return;
  hideLoadNotice();
}

async function reportArtifactFailures(failures, loadToken = artifactLoadToken) {
  if (loadToken !== artifactLoadToken) return;
  await fetch("/api/" + key + "/artifact-failures", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ failures, artifact_load_token: loadToken, artifact_revision: artifactLoadRevision }),
  });
}

// The narrow fatal probe. A healthy artifact boots its SDK and starts talking within seconds; if
// nothing ever arrives we ask the server whether the document is servable at all. Probing only on
// silence keeps the normal path to a single artifact request, and a non-OK answer is the one
// signal that the review is unusable.
function armArtifactAvailabilityProbe(loadToken = artifactLoadToken) {
  clearTimeout(artifactSilenceTimer);
  artifactSilenceTimer = setTimeout(() => {
    if (loadToken !== artifactLoadToken) return;
    probeArtifactAvailability(loadToken).catch(() => {});
  }, ARTIFACT_SILENCE_PROBE_MS);
  artifactSilenceTimer?.unref?.();
}

function artifactProbeSrc() {
  const separator = artifactSrc.includes("?") ? "&" : "?";
  return (
    artifactSrc +
    separator +
    "probe=1&artifact_revision=" +
    encodeURIComponent(artifactLoadRevision) +
    "&artifact_load_token=" +
    encodeURIComponent(artifactLoadToken)
  );
}

async function probeArtifactAvailability(loadToken) {
  if (loadToken !== artifactLoadToken) return;
  try {
    const response = await fetch(artifactProbeSrc(), { cache: "no-store" });
    if (loadToken !== artifactLoadToken) return;
    if (response.status === 409) return;
    if (response.ok) return;
    await reportArtifactFailures(
      [{ kind: "artifact-unavailable", detail: "the artifact document responded with HTTP " + response.status }],
      loadToken,
    );
  } catch {
    // A transient fetch failure is uncertainty, not proof - stay silent.
  }
}

// ---------------------------------------------------------------------------
// Revision legend
//
// The agent declares what it changed in the artifact HTML itself (a
// `data-textcast-revisions` registry plus `data-textcast-revision` marks); the SDK
// reads it and posts it here. The legend lives entirely in the chrome, so the
// served artifact still matches the file on disk - Textcast Chat never paints the
// change indicator into the page. Reveal uses the SDK's transient marker, and
// only when the reader asks for it.

// The payload crosses postMessage from a sandboxed frame rendering author
// content, so it is untrusted here whatever built it. These bound what is
// examined, not what is accepted: capping accepted rows alone would let a
// registry of ten thousand records walk the whole array on the chrome's main
// thread before yielding its handful of rows.
// Server-owned, injected into the session JSON from src/artifact-revisions.js.
// The swatch is presentation the chrome owes the reader, not something the
// artifact gets a say in, so nothing about it is read from the message.
const REVISION_PALETTE = (Array.isArray(sessionData.revisionPalette) ? sessionData.revisionPalette : []).filter(
  (entry) => entry && /^#[0-9a-fA-F]{6}$/.test(String(entry.hex)),
);
const REVISION_LIMITS = {
  // Derived from the server-injected palette (src/artifact-revisions.js) rather than a
  // second hardcoded number, so the two can never drift; falls back to 6 only if the
  // palette itself came through empty.
  entries: REVISION_PALETTE.length > 0 ? REVISION_PALETTE.length : 6,
  rawEntries: 256,
  marks: 200,
  rawMarks: 2000,
  id: 60,
  label: 80,
  summary: 400,
  timestamp: 40,
  excerpt: 120,
  selector: 400,
};
const REVISION_BORDER_STYLES = ["solid", "dashed", "dotted", "double"];

/** @type {any[]} */
let revisionEntries = [];
/** @type {any[]} */
let revisionMarks = [];
/** @type {Map<string, number>} */
const revisionRevealCursor = new Map();
let revisionsDrawerOpen = false;

// Display-only fields. Anything the legend merely shows can be shortened.
function revisionText(value, max) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const text = String(value).trim();
  return text.length > max ? text.slice(0, max) : text;
}

// Identity fields, mirroring `exactRevisionText` in src/artifact-revisions.js.
// The message is untrusted here, so shortening an id or a selector is worse
// than dropping it: two distinct overlong ids collapse into one legend row, and
// the first 400 characters of a long selector are a different valid selector
// that Reveal would resolve to some other block.
function revisionExact(value, max) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  const text = String(value).trim();
  return text.length > 0 && text.length <= max ? text : "";
}

function revisionPatternFill(pattern) {
  if (pattern === "diagonal") return "repeating-linear-gradient(45deg, currentColor 0 2px, transparent 2px 5px)";
  if (pattern === "dots") return "radial-gradient(currentColor 1px, transparent 1px)";
  return "";
}

// The swatch for a revision's position in the registry. Position is the only
// thing the artifact influences, and it cannot repeat one: ids are deduplicated
// before this runs, so each accepted revision gets a distinct index and
// therefore a distinct swatch.
function revisionPresentation(index) {
  const entry = REVISION_PALETTE.length > 0 ? REVISION_PALETTE[index % REVISION_PALETTE.length] : null;
  return {
    color: entry ? String(entry.hex) : "#0072b2",
    borderStyle: REVISION_BORDER_STYLES.includes(String(entry && entry.borderStyle))
      ? String(entry.borderStyle)
      : "solid",
    pattern: revisionPatternFill(entry && entry.pattern),
  };
}

// Only text crosses from the artifact into the legend, and it crosses as
// textContent. Nothing the message carries reaches a style property.
function normalizeRevisionMessage(msg) {
  const rawRevisions = Array.isArray(msg && msg.revisions) ? msg.revisions : [];
  const revisions = [];
  const byId = new Map();
  let examined = 0;
  for (const raw of rawRevisions) {
    if (examined >= REVISION_LIMITS.rawEntries || revisions.length >= REVISION_LIMITS.entries) break;
    examined += 1;
    if (!raw || typeof raw !== "object") continue;
    const id = revisionExact(raw.id, REVISION_LIMITS.id);
    if (!id || /\s/.test(id) || byId.has(id)) continue;
    const entry = {
      id,
      label: revisionText(raw.label, REVISION_LIMITS.label) || id,
      timestamp: revisionText(raw.timestamp, REVISION_LIMITS.timestamp),
      summary: revisionText(raw.summary, REVISION_LIMITS.summary),
      ...revisionPresentation(revisions.length),
      marks: [],
    };
    byId.set(id, entry);
    revisions.push(entry);
  }

  const rawMarks = Array.isArray(msg && msg.marks) ? msg.marks : [];
  const marks = [];
  examined = 0;
  for (const raw of rawMarks) {
    if (examined >= REVISION_LIMITS.rawMarks || marks.length >= REVISION_LIMITS.marks) break;
    examined += 1;
    if (!raw || typeof raw !== "object") continue;
    const revisionId = revisionExact(raw.revision_id, REVISION_LIMITS.id);
    const selector = revisionExact(raw.selector, REVISION_LIMITS.selector);
    const owner = byId.get(revisionId);
    if (!owner || !selector) continue;
    const mark = {
      revisionId,
      selector,
      tag: revisionText(raw.tag, 40).toLowerCase(),
      excerpt: revisionText(raw.excerpt, REVISION_LIMITS.excerpt),
    };
    owner.marks.push(mark);
    marks.push(mark);
  }

  return { revisions, marks };
}

function resetRevisionLegend() {
  revisionEntries = [];
  revisionMarks = [];
  revisionRevealCursor.clear();
  renderRevisionLegend();
}

function applyRevisionMessage(msg) {
  const normalized = normalizeRevisionMessage(msg);
  revisionEntries = normalized.revisions;
  revisionMarks = normalized.marks;
  for (const id of [...revisionRevealCursor.keys()]) {
    if (!revisionEntries.some((entry) => entry.id === id)) revisionRevealCursor.delete(id);
  }
  renderRevisionLegend();
}

function revisionMarkSummary(entry) {
  if (entry.marks.length === 0) return "no marked blocks";
  return entry.marks.length === 1 ? "1 marked block" : entry.marks.length + " marked blocks";
}

function buildRevisionRow(entry) {
  const row = document.createElement("div");
  row.className = "revision-row";

  const swatch = document.createElement("span");
  swatch.className = "revision-swatch";
  swatch.setAttribute("aria-hidden", "true");
  swatch.style.color = entry.color;
  swatch.style.borderColor = entry.color;
  swatch.style.borderStyle = entry.borderStyle;
  if (entry.pattern) swatch.style.backgroundImage = entry.pattern;
  row.appendChild(swatch);

  const body = document.createElement("div");
  body.className = "revision-body";

  const head = document.createElement("div");
  head.className = "revision-head";
  const label = document.createElement("span");
  label.className = "revision-label";
  label.textContent = entry.label;
  head.appendChild(label);
  if (entry.timestamp) {
    const time = document.createElement("span");
    time.className = "revision-time";
    time.textContent = entry.timestamp;
    head.appendChild(time);
  }
  body.appendChild(head);

  if (entry.summary) {
    const summary = document.createElement("p");
    summary.className = "revision-summary";
    summary.textContent = entry.summary;
    body.appendChild(summary);
  }

  const foot = document.createElement("div");
  foot.className = "revision-foot";
  const count = document.createElement("span");
  count.className = "revision-marks";
  count.textContent = revisionMarkSummary(entry);
  foot.appendChild(count);
  if (entry.marks.length > 0) {
    const reveal = document.createElement("button");
    reveal.type = "button";
    reveal.className = "revision-reveal";
    const position = (revisionRevealCursor.get(entry.id) || 0) % entry.marks.length;
    reveal.textContent = t(entry.marks.length === 1 ? "Reveal" : "Reveal " + (position + 1) + "/" + entry.marks.length);
    reveal.setAttribute("aria-label", t("Reveal the next block changed in " + entry.label));
    // Bound per row rather than delegated from the list: the rows are rebuilt
    // on every render anyway, so there is no listener to accumulate, and the
    // button carries the revision it belongs to without a data attribute round
    // trip through the DOM.
    reveal.onclick = () => revealNextRevisionMark(entry.id);
    foot.appendChild(reveal);
  }
  body.appendChild(foot);

  row.appendChild(body);
  return row;
}

function renderRevisionLegend() {
  if (!revisionsWrap) return;
  const count = revisionEntries.length;
  revisionsWrap.hidden = count === 0 || ended;
  if (revisionsWrap.hidden && revisionsDrawerOpen) setRevisionsDrawerOpen(false);
  revisionsCount.textContent = String(count);
  revisionsButton.setAttribute("aria-label", count === 1 ? "1 revision" : count + " revisions");
  revisionsSummary.textContent =
    (count === 1 ? "1 revision" : count + " revisions") +
    " · " +
    (revisionMarks.length === 1 ? "1 marked block" : revisionMarks.length + " marked blocks");

  revisionsList.replaceChildren(...revisionEntries.map(buildRevisionRow));
}

function setRevisionsDrawerOpen(open) {
  revisionsDrawerOpen = open && !ended;
  revisionsDrawer.hidden = !revisionsDrawerOpen;
  revisionsButton.setAttribute("aria-expanded", String(revisionsDrawerOpen));
  if (revisionsDrawerOpen) closeMenus();
}

function closeRevisionsDrawer({ restoreFocus = false } = {}) {
  if (!revisionsDrawerOpen) return;
  setRevisionsDrawerOpen(false);
  if (restoreFocus) revisionsButton.focus();
}

// Step through a revision's marked blocks one at a time. The existing reveal
// path flashes one element and clears the previous marker, so a revision that
// touched several blocks is walked rather than lit up all at once.
function revealNextRevisionMark(id) {
  const entry = revisionEntries.find((candidate) => candidate.id === id);
  if (!entry || entry.marks.length === 0) return;
  const position = (revisionRevealCursor.get(id) || 0) % entry.marks.length;
  postToFrame({ type: "textcast:revealElement", selector: entry.marks[position].selector });
  revisionRevealCursor.set(id, (position + 1) % entry.marks.length);
  renderRevisionLegend();
}

async function endSession(terminal = null) {
  if (ended || (terminalSubmission && terminal !== terminalSubmission)) return;
  const response = await fetch("/api/" + key + "/end", { method: "POST" });
  if (!response.ok) throw new Error("failed to end session");
  markSessionEnded();
}

function markSessionEnded() {
  if (ended) return;
  ended = true;
  sendWhenAgentReady = false;
  pendingAcknowledgements.clear();
  clearSendAcknowledgementWarning();
  terminalSubmission = null;
  persistTerminalReservation(false);
  cancelArtifactLoadRecovery();
  closeMenus();
  closeRevisionsDrawer();
  renderRevisionLegend();
  annotationSwitch.disabled = true;
  chatInput.disabled = true;
  updateSendState();
  applySheetState();
  if (handoffBanner) handoffBanner.hidden = true;
  if (outdatedBanner) outdatedBanner.hidden = true;
  hideLoadNotice();
  postToFrame({ type: "textcast:setAnnotationMode", enabled: false });
  renderReconnectCard();
}

// With no agent to talk to, the composer gives way to the text that brings one back. The page stays
// readable either way. An ended session hides the whole composer; an offline agent hides only its
// input, so the handoff and server notices above it can still show.
function renderReconnectCard() {
  const offline = !ended && !connecting && agentPresence === "waiting";
  reconnectTitle.textContent = ended ? t("Session ended.") : t("The agent is offline.");
  reconnectCard.hidden = !ended && !offline;
  chatComposer.hidden = ended;
  composerBox.hidden = offline;
}

function copyReconnectPrompt() {
  copyText(reconnectText.textContent || "");
  reconnectCopyText.textContent = t("Copied");
  clearTimeout(reconnectCopyTimer);
  reconnectCopyTimer = setTimeout(() => {
    reconnectCopyText.textContent = t("Copy");
  }, 1600);
}

function copyFilePath() {
  copyText(currentPage);
  copyHint.classList.add("copied");
  copyHintText.textContent = t("Copied");
  clearTimeout(copyHintTimer);
  copyHintTimer = setTimeout(() => {
    copyHint.classList.remove("copied");
    copyHintText.textContent = t("Copy");
  }, 1600);
}

function cancelArtifactLoadRecovery() {
  if (artifactLoadRecoveryTimer) clearTimeout(artifactLoadRecoveryTimer);
  artifactLoadRecoveryTimer = undefined;
}

// Retry a begin-load attempt that failed for a recoverable reason. Returns false once the
// backoff is exhausted so the caller can surface the terminal failure. A `superseded` or
// `out-of-order` outcome never lands here: another reviewer or a newer request in this same
// chrome owns the artifact, and retrying would fight it.
function scheduleArtifactLoadRecovery() {
  const delay = ARTIFACT_LOAD_RECOVERY_DELAYS_MS[artifactLoadRecoveryAttempt];
  if (delay === undefined) return false;
  artifactLoadRecoveryAttempt += 1;
  const sequence = artifactLoadRequestSequence;
  cancelArtifactLoadRecovery();
  artifactLoadRecoveryTimer = setTimeout(() => {
    artifactLoadRecoveryTimer = undefined;
    if (sequence !== artifactLoadRequestSequence) return;
    replaceArtifactFrame({ recoveryRetry: true }).catch(() => {});
  }, delay);
  artifactLoadRecoveryTimer?.unref?.();
  return true;
}

// The backoff budget belongs to the load attempt that started it, not to the page: anything
// asking for a fresh load - a live reload, Reload artifact, a takeover - gets the whole budget
// again, and only the recovery timer's own retries spend it down. A page that carried an
// exhausted counter forward would have no retries left at all for the next outage.
async function replaceArtifactFrame({ recoveryRetry = false } = {}) {
  cancelArtifactLoadRecovery();
  if (!recoveryRetry) artifactLoadRecoveryAttempt = 0;
  clearTimeout(artifactSilenceTimer);
  // The iframe is sandboxed, so reload by resetting the iframe URL from chrome.
  if (!artifactSrc) {
    // The next document reports its own registry once it loads; until then the
    // previous revision's legend would point at blocks that may no longer exist.
    // Only clear it here, right before the frame is actually replaced - a preserved
    // load (superseded/out-of-order/exhausted retries below) must leave it intact.
    resetRevisionLegend();
    clearLoadNotice();
    const currentSrc = frame.src || "about:blank";
    frame.src = currentSrc + (currentSrc.includes("?") ? "&" : "?") + "textcast_reload=" + Date.now();
    return true;
  }
  const requestSequence = ++artifactLoadRequestSequence;
  const requestId = `textcast-load-${Date.now().toString(36)}-${requestSequence}-${Math.random().toString(36).slice(2)}`;
  const previousToken = artifactLoadToken;
  const preservePreviousLoad = () => {
    if (
      requestSequence === artifactLoadRequestSequence &&
      !ended &&
      previousToken &&
      artifactSpokeToken !== previousToken
    ) {
      // A first load that gets no fresh token falls back to the one embedded in the page, so a
      // superseded chrome still shows the artifact behind its takeover banner.
      if (!frame.src) frame.src = artifactFrameSrcForLoad({ revision: artifactLoadRevision, token: previousToken });
      armArtifactAvailabilityProbe(previousToken);
    }
    return false;
  };
  // Keep whatever is on screen, then try again later. A begin-load can fail for reasons that
  // clear on their own - the shared server is mid-restart, or a handoff no begin-load had yet
  // persisted was lost with that restart and this chrome's one re-handshake landed in the same
  // outage window. Giving up here is what leaves the review permanently unloaded.
  const recoverLater = () => {
    preservePreviousLoad();
    if (requestSequence !== artifactLoadRequestSequence) return false;
    if (scheduleArtifactLoadRecovery()) return false;
    // Out of retries. Only say so when there is nothing on screen to say it over: a chrome that
    // already shows an artifact keeps showing it rather than losing a usable review.
    if (!artifactLoadToken) {
      showLoadNotice(
        t("Textcast Chat could not load this artifact."),
        t(
          "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.",
        ),
        t("Check and reload"),
        checkServerThenReload(
          t("Textcast Chat could not load this artifact."),
          t("Textcast Chat is still not answering. Start it again with your agent, then use Check and reload."),
        ),
      );
    }
    return false;
  };
  let load;
  let transportAttempt = 0;
  let handoffRefreshAttempted = false;
  while (true) {
    if (requestSequence !== artifactLoadRequestSequence) return false;
    try {
      const response = await fetch("/api/" + key + "/artifact-loads/begin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          request_sequence: requestSequence,
          chrome_load_token: chromeLoadToken,
        }),
      });
      const candidate = await response.json().catch(() => ({}));
      if (!response.ok) {
        const status = String(candidate?.status || "");
        if (status === "no-handoff") {
          // One re-handshake per attempt keeps a live reviewer from being ping-ponged; the
          // retry that follows is a whole fresh attempt, so the rule still holds.
          if (handoffRefreshAttempted) return recoverLater();
          handoffRefreshAttempted = true;
          try {
            const refreshed = await refreshChromeLoadHandoff(requestSequence);
            if (!refreshed) return false;
          } catch {
            return recoverLater();
          }
          continue;
        }
        if (status === "superseded") {
          setHandoffSuperseded(true);
          // The takeover banner sits in the conversation panel, which may be minimized. A chrome
          // that never loaded the artifact would otherwise show an empty page with its only
          // recovery control out of sight, so say it on the notice as well. Still no background
          // retry: the reload is the user's to make.
          if (!artifactLoadToken) {
            showLoadNotice(
              t("This review is already open in another tab."),
              UNSENT_OWNERSHIP_COPY,
              t("Take over here"),
            );
          }
          return preservePreviousLoad();
        }
        if (status === "out-of-order") return preservePreviousLoad();
        throw new Error("failed to begin artifact load");
      }
      const candidateRevision = Number(candidate?.artifact_revision);
      const candidateToken = String(candidate?.artifact_load_token || "");
      if (!Number.isSafeInteger(candidateRevision) || candidateRevision < 0 || !candidateToken) {
        throw new Error("invalid artifact load");
      }
      load = { artifact_revision: candidateRevision, artifact_load_token: candidateToken };
      break;
    } catch {
      const delay = ARTIFACT_LOAD_BEGIN_RETRY_DELAYS_MS[transportAttempt++];
      if (delay === undefined) return recoverLater();
      await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }
  if (requestSequence !== artifactLoadRequestSequence) return false;
  const revision = Number(load?.artifact_revision);
  const token = String(load?.artifact_load_token || "");
  if (!Number.isSafeInteger(revision) || revision < 0 || !token) return recoverLater();
  artifactLoadRecoveryAttempt = 0;
  artifactLoadRevision = revision;
  artifactLoadToken = token;
  artifactSpokeToken = "";
  annotationDefaultReceived = false;
  setHandoffSuperseded(false);
  clearLoadNotice();
  // The next document reports its own registry once it loads; until then the
  // previous revision's legend would point at blocks that may no longer exist.
  resetRevisionLegend();
  frame.src = artifactFrameSrcForLoad({ revision, token });
  return true;
}

function resetFrame() {
  return replaceArtifactFrame();
}

let chromeRestartReloadPromise = null;

function loadFrame() {
  if (artifactSrc) {
    replaceArtifactFrame().catch(() => {});
  }
}

function reloadArtifact() {
  closeMenus();
  resetFrame();
}

// A link the page asked the chrome to follow (`textcast:navigate`). The server decides whether it is
// a page of this site; a refusal leaves the current page as it is.
let navigationInFlight = false;
async function navigateArtifact(href) {
  if (navigationInFlight || typeof href !== "string" || !href) return;
  navigationInFlight = true;
  try {
    const response = await fetch("/api/" + key + "/page", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ href }),
    });
    if (!response.ok) return;
    const data = await response.json();
    if (typeof data.page !== "string" || !data.page) return;
    currentPage = data.page;
    showCurrentPagePath(data);
    // The tab names the page now on screen, as the server would on a fresh load of it.
    if (typeof data.title === "string" && data.title) loadTimeTitle = data.title + " · Textcast Chat";
    document.title = loadTimeTitle;
    await resetFrame();
  } catch {
    // The link stays unfollowed; the page on screen is still the review's page.
  } finally {
    navigationInFlight = false;
  }
}

function showCurrentPagePath(data) {
  copyPathButton.title = copyPathButton.title.replace(/ · .*$/, " · " + currentPage);
  const head = typeof copyPathButton.querySelector === "function" ? copyPathButton.querySelector(".path-head") : null;
  const tail = typeof copyPathButton.querySelector === "function" ? copyPathButton.querySelector(".path-tail") : null;
  if (head) head.textContent = String(data.path_head || "");
  if (tail) tail.textContent = String(data.path_tail || "");
}

async function reloadAfterServerRestart(reason) {
  if (chromeRestartReloadPromise) return chromeRestartReloadPromise;
  chromeRestartReloadPromise = reloadChromeAfterServerRestart(reason);
  return chromeRestartReloadPromise;
}

// Three outcomes, not two: a port that accepts a connection and then says nothing proves neither
// that the server is running nor that it is gone, and a probe that never settles would leave the
// control the user is holding disabled for as long as the browser's own network timeout takes.
async function probeChromeHealth() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_PROBE_TIMEOUT_MS);
  try {
    const res = await fetch("/health", { cache: "no-store", signal: controller.signal });
    return res.ok ? "running" : "not-running";
  } catch {
    return controller.signal.aborted ? "no-answer" : "not-running";
  } finally {
    clearTimeout(timer);
  }
}

// The replacement server usually binds within a second, but it is a fresh node process competing
// with whatever else the machine is doing, and several `textcast-chat-axi` invocations can be racing for
// the same port. Reloading on a fixed short deadline regardless of whether anything is listening
// trades a recoverable page for the browser's connection-error page, which no Textcast Chat code can
// recover from. So wait for the port to answer, and if it never does, say so instead.
async function reloadChromeAfterServerRestart(reason = "") {
  let sawOutage = false;
  let healthy = false;
  let settled = false;
  // Keep the pre-outage behavior: a server that never actually went away is reloaded promptly.
  const settleDeadline = Date.now() + CHROME_RESTART_SETTLE_MS;
  const deadline = Date.now() + CHROME_RESTART_WAIT_MS;

  while (Date.now() < deadline) {
    // The bounded probe is what keeps this loop honest: a port that accepts and then says nothing
    // would otherwise hold one iteration open past the deadline, and neither the reload nor the
    // card below would ever happen.
    const outcome = await probeChromeHealth();
    healthy = outcome === "running";
    if (!healthy) sawOutage = true;
    if (healthy && (sawOutage || Date.now() >= settleDeadline)) {
      settled = true;
      break;
    }

    const probeDelay = Date.now() < settleDeadline ? CHROME_RESTART_PROBE_MS : CHROME_RESTART_SLOW_PROBE_MS;
    await new Promise((resolve) => setTimeout(resolve, probeDelay));
  }

  // A loop that ended on the deadline carries whatever the last probe happened to see, and in a
  // hidden tab the browser clamps these timers to seconds or minutes - so a single probe can be
  // the only one that ran. Neither answer may be trusted then: a stale failure claims a running
  // server is gone, and a stale success reloads into a port nothing is listening on.
  if (!settled) healthy = (await probeChromeHealth()) === "running";

  if (!healthy) {
    chromeRestartReloadPromise = null;
    showLoadNotice(
      t("Textcast Chat is not running."),
      t(
        "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.",
      ),
      t("Check and reload"),
      checkServerThenReload(
        t("Textcast Chat is not running."),
        t("Textcast Chat is still not running. Start it again with your agent, then use Check and reload."),
      ),
      { sticky: true },
    );
    return;
  }

  // Unsent annotation text is the user's writing. A reload replays it, but it is still their
  // call when to interrupt the card they are typing into, so offer the reload instead of taking
  // it. The same applies to a page the user is only reading: the banner never reloads by itself.
  if (hasUnsentDraft()) {
    chromeRestartReloadPromise = null;
    // The line this page shows comes from the same reason its siblings were sent. An event that
    // named none leaves the branch that claims neither.
    setChromeOutdated(true, reason);
    return;
  }

  location.reload();
}

// The banner is shown at the moment a server goes away, and in the deliberate-stop case nothing
// is coming to replace it, so this button probes before it navigates for the same reason the
// not-running card does: a reload into a dead port lands on the browser's own error page.
async function reloadChromeForOutdatedBanner() {
  if (outdatedReloadInFlight) return;
  outdatedReloadInFlight = true;
  if (outdatedReloadButton) outdatedReloadButton.disabled = true;
  // The banner this click was made on: a later one carries a newer reason, and that line stands.
  const generation = chromeOutdatedGeneration;
  let outcome = "not-running";
  let navigating = false;
  try {
    outcome = await probeChromeHealth();
    if (outcome === "running") {
      navigating = true;
      location.reload();
    }
  } finally {
    if (!navigating) {
      outdatedReloadInFlight = false;
      if (outdatedReloadButton) outdatedReloadButton.disabled = false;
      if (outdatedText && generation === chromeOutdatedGeneration) {
        outdatedText.textContent =
          outcome === "no-answer"
            ? HEALTH_NO_ANSWER_COPY
            : t("Textcast Chat is still not running. Start it again, then use Check and reload.");
      }
    }
  }
}

// ---- Tab title and icon from the artifact ----
// The server stamps the tab from the artifact's <head> once, when the chrome is served. A page that
// changes after that (a live dashboard) can ask the chrome to follow it with
// window.textcast.setDocumentMeta. The page is untrusted, so the chrome clamps the title and takes
// only a bounded SVG data: icon, which cannot run script or fetch anything as a tab icon.
const DOCUMENT_TITLE_MAX_CHARS = 120;
const DOCUMENT_ICON_MAX_CHARS = 8192;
const DOCUMENT_ICON_RE = /^data:image\/svg\+xml[;,]/i;
let loadTimeTitle = document.title;
const loadTimeIconLink = document.querySelector?.('link[rel~="icon"]');
const loadTimeIconHref = loadTimeIconLink ? loadTimeIconLink.getAttribute("href") : null;

function applyDocumentMeta(msg) {
  if (msg.title === null) document.title = loadTimeTitle;
  else if (typeof msg.title === "string") {
    const title = msg.title
      .replace(/\p{Cc}+/gu, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, DOCUMENT_TITLE_MAX_CHARS)
      .trim();
    document.title = title ? title + " · Textcast Chat" : loadTimeTitle;
  }
  if (msg.icon === null) setDocumentIcon(loadTimeIconHref);
  else if (
    typeof msg.icon === "string" &&
    msg.icon.length <= DOCUMENT_ICON_MAX_CHARS &&
    DOCUMENT_ICON_RE.test(msg.icon)
  ) {
    setDocumentIcon(msg.icon);
  }
}

function setDocumentIcon(href) {
  // Replace the element rather than edit its href: some browsers keep showing the old icon
  // otherwise.
  const old = document.querySelector('link[rel~="icon"]');
  const link = document.createElement("link");
  link.setAttribute("rel", "icon");
  if (href) link.setAttribute("href", href);
  if (old) old.replaceWith(link);
  else document.head.appendChild(link);
}

window.addEventListener("message", (event) => {
  if (event.source !== frame.contentWindow) return;

  const msg = event.data || {};
  const messageToken = String(msg.artifact_load_token || "");
  if (messageToken !== artifactLoadToken) {
    // A ready report can be stamped by the load that just lost a token race. Ask the current
    // artifact document to report again instead of consuming the only report for this cycle.
    if (msg.type === "textcast:ready") postToFrame({ type: "textcast:requestReady" });
    return;
  }
  artifactSpokeToken = messageToken;
  clearTimeout(artifactSilenceTimer);
  // The document's first word after it parsed; its theme report comes just before it.
  if (msg.type === "textcast:ready") {
    showPlayerSwitch(msg.has_video === true);
    return;
  }
  // The artifact spoke, so it rendered and ran its SDK - there is nothing fatal to probe for.
  if (msg.type === "textcast:annotationMode" && typeof msg.enabled === "boolean" && !annotationDefaultReceived) {
    annotationDefaultReceived = true;
    if (!annotationOverridden && !ended && !terminalSubmission) annotation = msg.enabled;
    annotationSwitch.setAttribute("aria-pressed", String(annotation && !ended));
    // Reconcile even if frame load replayed the old mode before this report arrived.
    postToFrame({ type: "textcast:setAnnotationMode", enabled: annotation && !ended });
  }
  if (msg.type === "textcast:queuePrompt") {
    enqueuePrompt(msg.prompt);
    // Queued from inside the artifact, where the closed dock is the only sign it landed.
    pulseSheetDock();
  }
  if (msg.type === "textcast:snapshot") {
    completeSnapshotRequest(msg.snapshot_request_id, msg.snapshot || "");
  }
  if (msg.type === "textcast:documentMeta") applyDocumentMeta(msg);
  if (msg.type === "textcast:theme") chromeThemeApi()?.apply?.(msg, true);
  if (msg.type === "textcast:play") playVideo(msg);
  if (msg.type === "textcast:navigate") navigateArtifact(msg.href);
  if (msg.type === "textcast:scroll") {
    lastScroll = { x: Number(msg.x) || 0, y: Number(msg.y) || 0 };
  }
  if (msg.type === "textcast:reviewState") {
    setReviewState(msg.state && typeof msg.state === "object" ? msg.state : null);
  }
  if (msg.type === "textcast:reviewDraftUnrestorable") {
    discardUnrestorableDraft(String(msg.selector || ""));
  }
  if (msg.type === "textcast:artifactAssetFailure") {
    reportArtifactFailures(
      [{ kind: "artifact-asset-unavailable", detail: String(msg.detail || "a local artifact asset failed to load") }],
      messageToken,
    ).catch(() => {});
  }
  if (msg.type === "textcast:uploadAttachment") uploadAttachment(msg);
  // There is deliberately no attachment-delete message. See removeAttachment's
  // removal note below: the iframe cannot be trusted to decide a delete, and the
  // chrome cannot see every live reference, so reclamation is the sweeper's job.
  if (msg.type === "textcast:sendQueuedPrompts") {
    // Sent straight from the page's ask card: show the conversation so the delivery is visible.
    if (!isMobileSheet()) revealConversation();
    sendQueued();
  }
  if (msg.type === "textcast:endSession") endSession();
  if (msg.type === "textcast:revisions") applyRevisionMessage(msg);
  if (msg.type === "textcast:toggleAnnotationMode") toggleAnnotationMode();
});

// The sandboxed artifact iframe can't reach the loopback server (opaque origin),
// so it hands captured image bytes here and the chrome performs the same-origin
// upload, then reports the server-vetted id back to the card.
async function uploadAttachment(message, reportResult = postToFrame, signal) {
  const localId = String(message.localId || "");
  if (!localId) return;
  // Echoed verbatim on every result so the artifact can tell a reply to ITS upload
  // from one still in flight for a previous document (E1). The chrome never
  // interprets it; it only round-trips it.
  const nonce = message.nonce;
  const bytes = message.bytes;
  let size;
  if (ArrayBuffer.isView(bytes)) {
    size = bytes.byteLength;
  } else {
    try {
      const byteLengthGetter = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength")?.get;
      size = byteLengthGetter ? byteLengthGetter.call(bytes) : NaN;
    } catch {
      size = NaN;
    }
  }
  if (!Number.isFinite(size) || size < 0) {
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: false,
      error: "invalid upload payload",
    });
    return;
  }
  // Reject over-cap images before they hit the network: an over-cap upload aborts
  // mid-stream, and the browser can hang or reset instead of surfacing the 413, so
  // the chip would never leave "uploading". Catching it here guarantees the card
  // reaches its error+retry state. The server still enforces the cap authoritatively.
  if (attachmentMaxBytes > 0 && size > attachmentMaxBytes) {
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: false,
      error: t("Image is larger than the " + formatByteLimit(attachmentMaxBytes) + " limit"),
    });
    return;
  }
  // Confused-deputy guard: rate + cumulative-byte ceiling before touching the network.
  const now = Date.now();
  while (uploadTimestamps.length && now - uploadTimestamps[0] > UPLOAD_RATE_WINDOW_MS) uploadTimestamps.shift();
  if (uploadTimestamps.length >= UPLOAD_RATE_MAX) {
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: false,
      error: t("Too many uploads. Wait a moment and retry."),
    });
    return;
  }
  if (uploadedBytesTotal + size > UPLOAD_SESSION_BYTE_QUOTA) {
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: false,
      error: t("Upload limit reached for this session (" + formatByteLimit(UPLOAD_SESSION_BYTE_QUOTA) + ")."),
    });
    return;
  }
  // In-flight ceiling: refuse rather than pile another large body onto the network
  // while the bound is full. The card keeps its retry affordance, and a settled
  // upload (below) frees a slot for the next.
  if (uploadsInFlight >= UPLOAD_MAX_IN_FLIGHT) {
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: false,
      error: t("Too many uploads in flight. Wait a moment and retry."),
    });
    return;
  }
  uploadTimestamps.push(now);
  uploadedBytesTotal += size;
  uploadsInFlight += 1;
  try {
    const response = await fetch("/api/" + key + "/attachments", {
      method: "POST",
      headers: { "content-type": String(message.mime || "application/octet-stream") },
      body: bytes,
      signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || t("Upload failed"));
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: true,
      id: (data.attachment && data.attachment.id) || "",
    });
  } catch (error) {
    reportResult({
      type: "textcast:attachmentResult",
      nonce,
      localId,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    uploadsInFlight -= 1;
  }
}

// There is intentionally no eager attachment delete here. Removing a chip used to
// ask the chrome to DELETE the stored file once no queued prompt referenced it,
// but that check is not authoritative: attachments are content-addressed, so two
// tabs (or two cards) can hold the SAME id, and a chip that is ready but not yet
// queued in another tab is invisible from here. The delete was also driven by the
// untrusted iframe, making the chrome a confused deputy - a malicious artifact
// could destroy bytes a live card still needed, which then failed as `not-found`
// on send. Unreferenced files are reclaimed by the server's reference-aware TTL
// sweeper and the disk-cap backstop, which see every session's pending prompts
// at once. Deleting late is cheap; deleting bytes someone still needs is not.

loadFrame();

function toggleAnnotationMode() {
  if (ended || terminalSubmission) return;
  annotationOverridden = true;
  annotation = !annotation;
  annotationSwitch.setAttribute("aria-pressed", String(annotation));
  postToFrame({ type: "textcast:setAnnotationMode", enabled: annotation });
}

annotationSwitch.onclick = toggleAnnotationMode;

sendButton.onclick = () => sendQueued(false);
if (sendAndEndButton) sendAndEndButton.onclick = () => sendQueued(true);
reconnectCopyButton.onclick = copyReconnectPrompt;
moreButton.onclick = () => {
  closeRevisionsDrawer();
  toggleMenu(moreButton, moreMenu);
};
revisionsButton.onclick = () => {
  setRevisionsDrawerOpen(revisionsDrawer.hidden);
};
chatAttachButton.onclick = () => chatAttachInput.click();
chatAttachInput.addEventListener("change", () => {
  chatAttachmentController.addFiles(chatAttachInput.files);
  chatAttachmentController.rejectUnsupported(chatAttachInput.files);
  chatAttachInput.value = "";
});
// The one place a paste or drop is turned into a file list, so both surfaces see
// the same payload. Pasted screenshots arrive as items, not files, in some
// browsers; `.files` alone silently attaches nothing there.
function transferredFiles(dataTransfer) {
  const files = Array.from(dataTransfer?.files || []).filter(Boolean);
  if (files.length) return files;
  return Array.from(dataTransfer?.items || [])
    .filter((item) => item && item.kind === "file")
    .map((item) => item.getAsFile())
    .filter(Boolean);
}
// Finder/Explorer file copies put the copied file's name or path in text/plain;
// that placeholder must not land in the message beside the attached image. Real
// captions (any line that is not a pasted file's name) keep the default paste.
// Mirrors planClipboardPaste in artifact-sdk.js, which owns the same rule for
// the annotation card - this file is served raw and cannot import it.
function keepsClipboardText(text, files) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return false;
  const names = files.map((file) => String(file?.name || "")).filter(Boolean);
  if (!names.length) return true;
  return !lines.every((line) =>
    names.some((name) => line === name || line.endsWith("/" + name) || line.endsWith("\\" + name)),
  );
}
chatInput.addEventListener("paste", (event) => {
  const files = transferredFiles(event.clipboardData);
  // Images only: Office and macOS pastes expose stray non-image file flavors
  // beside their text, so unsupported entries raise no chip here (matching the
  // annotation card) - a chip would block sending for a perceived text paste.
  const added = chatAttachmentController.addFiles(files);
  if (added && !keepsClipboardText(event.clipboardData?.getData("text/plain") || "", files)) event.preventDefault();
});
chatComposer.addEventListener("dragover", (event) => {
  if (Array.from(event.dataTransfer?.types || []).includes("Files")) {
    event.preventDefault();
    chatComposer.classList.add("is-dropping");
  }
});
chatComposer.addEventListener("dragleave", (event) => {
  const entering = /** @type {Node | null} */ (event.relatedTarget);
  if (!chatComposer.contains(entering)) chatComposer.classList.remove("is-dropping");
});
chatComposer.addEventListener("drop", (event) => {
  chatComposer.classList.remove("is-dropping");
  if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
  event.preventDefault();
  const files = transferredFiles(event.dataTransfer);
  if (!files.length) {
    // A drag advertising Files with nothing enumerable: the default was already
    // consumed, so refuse visibly (like the card) instead of swallowing it.
    chatAttachmentController.rejectUnsupported([{ name: "file", type: "" }]);
    return;
  }
  chatAttachmentController.addFiles(files);
  chatAttachmentController.rejectUnsupported(files);
});
// A file drop that misses the composer must not navigate the chrome away from
// the session (losing chips, uploads, and the live-event connection). Text drags stay
// untouched so dropping text into the textarea keeps working.
document.addEventListener("dragover", (event) => {
  if (Array.from(event.dataTransfer?.types || []).includes("Files")) event.preventDefault();
});
document.addEventListener("drop", (event) => {
  if (Array.from(event.dataTransfer?.types || []).includes("Files")) event.preventDefault();
});
chatAttachments.addEventListener("click", (event) => {
  const target = /** @type {HTMLElement | null} */ (event.target);
  const remove = /** @type {HTMLElement | null} */ (target?.closest?.("[data-chat-attachment-remove]") || null);
  if (remove) chatAttachmentController.remove(String(remove.dataset.chatAttachmentRemove || ""));
  const retry = /** @type {HTMLElement | null} */ (target?.closest?.("[data-chat-attachment-retry]") || null);
  if (retry) chatAttachmentController.retry(String(retry.dataset.chatAttachmentRetry || ""));
});
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    sendQueued(false);
  }
});
chatInput.addEventListener("input", () => hideSendHint());
copyPathButton.onclick = copyFilePath;
reloadArtifactButton.onclick = reloadArtifact;
endButton.onclick = () => {
  closeMenus();
  endSession();
};
handoffTakeoverButton.onclick = () => location.reload();
if (outdatedReloadButton) outdatedReloadButton.onclick = () => reloadChromeForOutdatedBanner();
if (outdatedDismissButton) {
  outdatedDismissButton.onclick = () => {
    // A dismissed unreachable banner stays dismissed until the stream actually recovers; without
    // this the next failed reconnect puts it straight back on screen.
    if (unreachableBannerOwned) {
      unreachableBannerOwned = false;
      unreachableDismissed = true;
    }
    setChromeOutdated(false);
  };
}
document.addEventListener("mousedown", (event) => {
  const target = /** @type {Node} */ (event.target);
  if (!moreMenu.hidden && !moreWrap.contains(target)) setMenuOpen(moreButton, moreMenu, false);
  if (revisionsDrawerOpen && !revisionsWrap.contains(target)) closeRevisionsDrawer();
});
// A non-modal popover closes when focus leaves it, so keyboard users are never stranded inside a
// panel they cannot see the end of.
revisionsWrap.addEventListener("focusout", (event) => {
  const next = /** @type {Node | null} */ (event.relatedTarget);
  if (revisionsDrawerOpen && next && !revisionsWrap.contains(next)) closeRevisionsDrawer();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (revisionsDrawerOpen) {
      closeRevisionsDrawer({ restoreFocus: true });
    } else if (!moreMenu.hidden) {
      closeMenus();
    } else if (!isConversationHidden()) {
      hideConversation();
    } else {
      closeMenus();
    }
  }
});
// Capture phase so the mode hotkey fires no matter where focus is in the chrome - including
// mid-keystroke in chatInput or an annotation-card textarea - without disturbing normal typing.
document.addEventListener(
  "keydown",
  (event) => {
    if (!isModeToggleHotkeyEvent(event)) return;
    event.preventDefault();
    toggleAnnotationMode();
  },
  true,
);
frame.addEventListener("load", () => {
  if (artifactSpokeToken !== artifactLoadToken) armArtifactAvailabilityProbe(artifactLoadToken);
  postToFrame({ type: "textcast:setAnnotationMode", enabled: annotation && !ended });
  // Replay the pre-reload scroll position so hot reloads don't jump the artifact to the top.
  postToFrame({ type: "textcast:restoreScroll", x: lastScroll.x, y: lastScroll.y });
  if (lastReviewState) postToFrame({ type: "textcast:restoreReviewState", state: lastReviewState });
});

if (loadNoticeDismiss) loadNoticeDismiss.onclick = () => hideLoadNotice();

// WebSockets leave the browser's HTTP connection pool free for sends and artifact loads.
const events = new Map();
let eventReconnectDelayMs = 500;
function connectLiveEvents() {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(protocol + "//" + location.host + "/events/" + encodeURIComponent(key));
  socket.addEventListener("open", () => {
    eventReconnectDelayMs = 500;
    liveEventFailures = 0;
    unreachableDismissed = false;
    if (unreachableBannerOwned) {
      unreachableBannerOwned = false;
      setChromeOutdated(false);
    }
  });
  socket.addEventListener("message", (message) => {
    try {
      const { type, data } = JSON.parse(message.data);
      return events.get(type)?.(data || {});
    } catch {
      // Ignore malformed frames; a later event or reconnect can recover the stream.
    }
  });
  socket.addEventListener("close", () => {
    liveEventFailures += 1;
    noteLiveEventsUnreachable();
    setTimeout(connectLiveEvents, eventReconnectDelayMs);
    eventReconnectDelayMs = Math.min(eventReconnectDelayMs * 2, 5000);
  });
}

// Raise the existing banner once the stream has been down long enough to mean it, and never
// against an ended session or a banner someone else owns. Reconnecting retires it.
function noteLiveEventsUnreachable() {
  if (liveEventFailures < LIVE_EVENT_UNREACHABLE_FAILURES) return;
  if (ended || unreachableDismissed || unreachableBannerOwned) return;
  if (outdatedBanner && !outdatedBanner.hidden) return;
  unreachableBannerOwned = true;
  setChromeOutdated(true, "");
}

events.set("reload", () => {
  resetFrame();
});
events.set("chrome-reload", (data) => reloadAfterServerRestart(String(data.reason || "")));
// The agent reopened this ended review. The server that says so is up, so there is nothing to wait
// out: one bounded probe, then the reload that brings back a live conversation.
events.set("reopened", async () => {
  if ((await probeChromeHealth()) === "running") location.reload();
});
// The replacement server serves a different artifact's review. This page keeps working against
// it; it is only running the previous version of the chrome, which is the user's to act on.
events.set("chrome-outdated", (data) => setChromeOutdated(true, String(data.reason || "")));
events.set("agent-reply", (data) => {
  const entry = {
    ...data,
    role: "agent",
    text: String(data.text || ""),
    ...(data.at ? { at: String(data.at) } : {}),
  };
  if (addChat(entry)) displayedChat.push(entry);
  noteAgentReply(entry.text);
});
events.set("chat-sync", (data) => {
  rememberChatAckIds(data.ack_ids);
  syncChat(data.chat || [], data.chat_revision);
});
events.set("agent-presence", (data) => setAgentPresence(data.mode === "external-listener" ? "external" : data.state));
events.set("ended", () => markSessionEnded());
connectLiveEvents();

applySheetState();
applyPanelCollapsed();
settleQueuedFromTranscript(initialChat, false);
render();
setChromeOutdated(false);
initialChat.forEach((item) => addChat(item));
retiredDrafts.forEach((text) => renderRetiredDraft(text));
setAgentPresence("waiting");
setTimeout(() => {
  connecting = false;
  setAgentPresence(agentPresence);
}, CONNECT_GRACE_MS);
// The session already ended before this page (re)loaded, so there is no future live `ended` event
// to wait for - start read-only instead of looking live until a Send gets silently refused.
if (sessionData.initialEnded) markSessionEnded();

// Reaching this line is the only proof that this file parsed and ran to completion. The inline
// bootstrap already owns the gate's bounded escape if this script fails; retire only its separate
// boot-failure timer now that the full client has taken over.
const chromeBootWindow = /** @type {Record<string, any>} */ (/** @type {unknown} */ (window));
chromeBootWindow.__textcastChromeReady = true;
chromeBootWindow.__textcastCancelChromeBootFailsafe?.();
