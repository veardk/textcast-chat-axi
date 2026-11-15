import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { createSdkJs } from "../src/server.js";

// The SDK the browser actually runs is a serialized bundle, not the module: `createSdkJs` has to
// declare every helper `createArtifactSdk` reaches for. A helper left out compiles fine and only
// ReferenceErrors on the first click, so these tests boot the served bundle and drive the real
// annotation path through a DOM stub instead of inspecting the module directly.

function createElement(tag) {
  const attributes = new Map();
  const queried = new Map();
  const element = {
    tagName: String(tag).toUpperCase(),
    nodeName: String(tag).toUpperCase(),
    nodeType: 1,
    parentElement: null,
    children: [],
    style: {},
    value: "",
    innerHTML: "",
    textContent: "",
    offsetWidth: 100,
    offsetHeight: 100,
    hidden: false,
    listeners: [],
    classList: {
      add() {},
      remove() {},
      contains() {
        return false;
      },
    },
    setAttribute(name, value) {
      attributes.set(name, String(value));
    },
    getAttribute(name) {
      return attributes.has(name) ? attributes.get(name) : null;
    },
    matches(selectorList) {
      return String(selectorList)
        .split(",")
        .some((part) => {
          const selector = part.trim();
          // `tag`, `[attr]`, or `tag[attr]` (e.g. `a[href]`): enough selector for what the SDK asks.
          const bracket = selector.indexOf("[");
          const tag = bracket >= 0 ? selector.slice(0, bracket) : selector;
          if (tag && tag !== element.tagName.toLowerCase()) return false;
          return bracket < 0 || attributes.has(selector.slice(bracket + 1, selector.indexOf("]")).split("=")[0]);
        });
    },
    closest(selectorList) {
      let current = element;
      while (current) {
        if (current.matches(selectorList)) return current;
        current = current.parentElement;
      }
      return null;
    },
    appendChild(child) {
      child.parentElement = element;
      element.children.push(child);
      return child;
    },
    remove() {
      const index = element.parentElement?.children.indexOf(element) ?? -1;
      if (index >= 0) element.parentElement.children.splice(index, 1);
    },
    // Card internals are looked up by class after innerHTML is assigned, so hand back a stable
    // stub per selector: the test drives the very buttons the SDK wired up.
    querySelector(selector) {
      if (!queried.has(selector)) queried.set(selector, createElement(selector.replace(/^[.#]/, "")));
      return queried.get(selector);
    },
    querySelectorAll() {
      return [];
    },
    getBoundingClientRect() {
      return { left: 10, top: 10, right: 110, bottom: 40, width: 100, height: 30 };
    },
    addEventListener(type, handler) {
      element.listeners.push({ type, handler });
    },
    removeEventListener() {},
    focus() {},
    click() {},
    scrollIntoView() {},
    attachShadow() {
      element.shadowRoot = createElement("shadow-root");
      return element.shadowRoot;
    },
  };
  return element;
}

function appendTo(parent, child) {
  child.parentElement = parent;
  parent.children.push(child);
  return child;
}

function cell(tag, text) {
  const element = createElement(tag);
  element.textContent = text;
  return element;
}

function bootSdk({
  runAnimationFrames = false,
  revisionsScript = null,
  revisionMarkElements = [],
  htmlAnnotate = null,
  platform = "Linux",
} = {}) {
  const posted = [];
  const documentListeners = [];
  // Deferred work the SDK schedules, run only when a test asks for it: the draft-anchor settle
  // re-query is a real timer, and asserting on it means running it rather than assuming it.
  const timers = [];
  const scheduleTimer = (fn, ms) => timers.push({ fn, ms }) && timers.length;
  const cancelTimer = (id) => {
    if (timers[id - 1]) timers[id - 1].cancelled = true;
  };
  /** @type {(selector: string) => any} */
  let documentQuery = () => null;
  /** @type {any} */
  let selection = null;
  const documentElement = createElement("html");
  const head = createElement("head");
  const body = createElement("body");
  if (htmlAnnotate !== null) documentElement.setAttribute("data-textcast-annotate", htmlAnnotate);
  appendTo(documentElement, head);
  appendTo(documentElement, body);
  for (const element of revisionMarkElements) appendTo(body, element);

  const sandbox = {
    parent: { postMessage: (message) => posted.push(message) },
    navigator: { platform },
    CSS: { escape: (value) => String(value) },
    Element: class Element {},
    MutationObserver: class MutationObserver {
      observe() {}
      disconnect() {}
    },
    ResizeObserver: class ResizeObserver {
      observe() {}
      disconnect() {}
    },
    URL: {
      createObjectURL() {
        return "blob:textcast-test";
      },
      revokeObjectURL() {},
    },
    getComputedStyle: () => ({}),
    setTimeout: scheduleTimer,
    clearTimeout: cancelTimer,
    requestAnimationFrame: (fn) => (runAnimationFrames ? scheduleTimer(fn, 0) : 0),
    document: {
      readyState: "complete",
      documentElement,
      head,
      body,
      activeElement: body,
      baseURI: "http://127.0.0.1/artifact/abc/index.html",
      addEventListener: (type, handler) => documentListeners.push({ type, handler }),
      removeEventListener() {},
      createElement,
      getElementById: () => null,
      querySelector: (selector) =>
        selector === "script[data-textcast-revisions]" ? revisionsScript : documentQuery(selector),
      querySelectorAll: (selector) => (selector === "[data-textcast-revision]" ? revisionMarkElements : []),
      getSelection: () => selection,
    },
  };
  const windowListeners = [];
  sandbox.window = {
    addEventListener: (type, handler) => windowListeners.push({ type, handler }),
    removeEventListener() {},
    setTimeout: scheduleTimer,
    clearTimeout: cancelTimer,
    requestAnimationFrame: (fn) => (runAnimationFrames ? scheduleTimer(fn, 0) : 0),
    innerWidth: 1280,
    innerHeight: 800,
    scrollX: 0,
    scrollY: 0,
    location: { origin: "http://127.0.0.1" },
    URL: sandbox.URL,
  };
  sandbox.globalThis = sandbox;

  vm.runInNewContext(createSdkJs("abc", 3, "load-token"), sandbox);

  return {
    posted,
    body,
    api: sandbox.window.textcast,
    // Selects `text` inside `target` the way a drag-select does, then presses the Ask button the
    // SDK offers beside it. Returns whether the button was offered (annotation mode on).
    ask(target, text = target.textContent) {
      const textNode = { nodeType: 3, parentElement: target, parentNode: { childNodes: [] } };
      textNode.parentNode.childNodes.push(textNode);
      const range = {
        collapsed: false,
        commonAncestorContainer: textNode,
        startContainer: textNode,
        startOffset: 0,
        endContainer: textNode,
        endOffset: text.length,
        cloneRange: () => range,
        getClientRects: () => [],
        getBoundingClientRect: () => target.getBoundingClientRect(),
      };
      selection = { rangeCount: 1, getRangeAt: () => range, toString: () => text, removeAllRanges() {} };
      const listener = documentListeners.find((entry) => entry.type === "pointerup");
      assert.ok(listener, "the SDK registers a document pointerup listener");
      const before = timers.length;
      listener.handler({ target });
      // Run only the offer this release scheduled, so a test's own pending timers keep their turn.
      for (const timer of timers.splice(before)) {
        if (!timer.cancelled) timer.fn();
      }
      selection = null;
      const askButton = documentElement.children
        .flatMap((child) => child.shadowRoot?.children || [])
        .find((child) => child.className === "textcast-ask");
      if (!askButton || askButton.hidden) return false;
      const onClick = askButton.listeners.find((entry) => entry.type === "click");
      assert.ok(onClick, "the Ask button opens a card on click");
      onClick.handler({});
      return true;
    },
    // Closing a card reports `card: null`; until that report the card the test opened is still open.
    isCardOpen() {
      this.runTimers();
      return !posted.some((message) => message.type === "textcast:reviewState" && message.state.card === null);
    },
    setDocumentQuery(query) {
      documentQuery = query;
    },
    runTimers() {
      const pending = timers.splice(0, timers.length);
      for (const timer of pending) {
        if (!timer.cancelled) timer.fn();
      }
    },
    async runAllTimers() {
      for (let round = 0; round < 100; round += 1) {
        await Promise.resolve();
        await Promise.resolve();
        const pending = timers.splice(0, timers.length);
        if (pending.length === 0) {
          await Promise.resolve();
          if (timers.length === 0) return;
          continue;
        }
        for (const timer of pending) {
          if (!timer.cancelled) timer.fn();
        }
      }
      assert.fail("the SDK timer queue did not settle");
    },
    // The chrome is the only legitimate sender, so its messages arrive with `source: parent`.
    sendChromeMessage(data) {
      const listeners = windowListeners.filter((entry) => entry.type === "message");
      assert.ok(listeners.length > 0, "the SDK registers a window message listener");
      for (const listener of listeners) listener.handler({ source: sandbox.parent, data });
    },
    cards() {
      return documentElement.children
        .flatMap((child) => child.shadowRoot?.children || [])
        .filter((child) => child.className === "textcast-annotation-card");
    },
    card() {
      const card = this.cards().at(-1);
      assert.ok(card, "clicking an element opens an annotation card");
      return card;
    },
    queue(text) {
      const card = this.card();
      card.querySelector("textarea").value = text;
      card.querySelector(".textcast-send").onclick();
      return posted.at(-1);
    },
  };
}

for (const { label, attributes, enabled } of [
  { label: "default", attributes: {}, enabled: true },
  { label: "html off", attributes: { htmlAnnotate: "off" }, enabled: false },
  { label: "html on", attributes: { htmlAnnotate: "on" }, enabled: true },
  { label: "unknown html value", attributes: { htmlAnnotate: "no" }, enabled: true },
  { label: "empty html value", attributes: { htmlAnnotate: "" }, enabled: true },
]) {
  test(`annotation declaration honours ${label} and reports its initial mode`, () => {
    const sdk = bootSdk(attributes);
    const target = appendTo(sdk.body, cell("p", "Decision board"));
    assert.equal(sdk.ask(target), enabled);
    assert.equal(sdk.cards().length, enabled ? 1 : 0);
    const mode = sdk.posted.find((message) => message.type === "textcast:annotationMode");
    assert.ok(mode, "the SDK reports the initial mode to the chrome");
    assert.equal(mode.enabled, enabled);
    assert.equal(mode.artifact_load_token, "load-token");
  });
}

// Applying the page's "off" default closes no card, so it must not report one gone: the chrome
// saves every `card: null` report over the stored draft, and the frame's load event that replays
// that draft can arrive after a slow image, later than the report.
test("a page that declares off reports no review state at boot", () => {
  const sdk = bootSdk({ htmlAnnotate: "off" });
  sdk.runTimers();
  assert.equal(
    sdk.posted.some((message) => message.type === "textcast:reviewState"),
    false,
    "nothing was open, so there is no card state to retire",
  );
  const target = appendTo(sdk.body, cell("h1", "Headline"));
  sdk.sendChromeMessage({
    type: "textcast:restoreReviewState",
    state: { card: { selector: "h1", text: "needs a shorter headline" }, fields: [] },
  });
  sdk.setDocumentQuery((selector) => (selector === "h1" ? target : null));
  sdk.runTimers();
  assert.equal(sdk.card().querySelector("textarea").value, "needs a shorter headline");
});

test("the chrome can turn annotation on and off after a page declares off", () => {
  const sdk = bootSdk({ htmlAnnotate: "off" });
  const target = appendTo(sdk.body, cell("p", "Decision board"));
  assert.equal(sdk.ask(target), false);
  sdk.sendChromeMessage({ type: "textcast:setAnnotationMode", enabled: true });
  assert.equal(sdk.ask(target), true);
  assert.equal(sdk.cards().length, 1);
  sdk.sendChromeMessage({ type: "textcast:setAnnotationMode", enabled: false });
  assert.equal(sdk.ask(target), false);
  // This harness retains closed cards; no new card should appear while disabled.
  assert.equal(sdk.cards().length, 1);
  sdk.runTimers();
  const state = sdk.posted.filter((message) => message.type === "textcast:reviewState").at(-1);
  assert.equal(state.state.card, null, "turning annotation off closes the active card");
});

function buildTable(sdk) {
  const table = appendTo(sdk.body, createElement("table"));
  const thead = appendTo(table, createElement("thead"));
  const headerRow = appendTo(thead, createElement("tr"));
  for (const label of ["Permission / setting", "Visible state", "Database evidence"]) {
    appendTo(headerRow, cell("th", label));
  }
  const tbody = appendTo(table, createElement("tbody"));
  const dataRow = appendTo(tbody, createElement("tr"));
  appendTo(dataRow, cell("td", "Media & Apple Music"));
  appendTo(dataRow, cell("td", "4 apps"));
  const evidence = appendTo(dataRow, cell("td", "Drive, Neovide, Cursor"));
  const badge = appendTo(evidence, cell("code", "Drive"));
  return { evidence, badge };
}

test("the served SDK echoes the snapshot request id", () => {
  const sdk = bootSdk();

  sdk.sendChromeMessage({ type: "textcast:requestSnapshot", snapshot_request_id: "snapshot-17" });

  const response = sdk.posted.at(-1);
  assert.equal(response.type, "textcast:snapshot");
  assert.equal(response.snapshot_request_id, "snapshot-17");
  assert.equal(response.artifact_load_token, "load-token");
});

// readArtifactRevisions calls parseRevisionRegistry and collectRevisionMarks, which in turn call
// the rest of the revision helper chain; a helper left out of the bundle only ReferenceErrors on
// this real read, which a source-grep over the bundle text cannot catch.
test("the served SDK bundle reports the artifact's own revision registry and marks", () => {
  const revisionsScript = createElement("script");
  revisionsScript.textContent = JSON.stringify([
    { id: "r1", label: "Tightened header copy", summary: "Shortened the hero headline" },
  ]);
  const marked = createElement("h1");
  marked.setAttribute("data-textcast-revision", "r1");
  marked.textContent = "Ship faster";

  const sdk = bootSdk({ revisionsScript, revisionMarkElements: [marked] });

  const message = sdk.posted.find((entry) => entry.type === "textcast:revisions");
  assert.ok(message, "the SDK reports the revision registry on load");
  assert.equal(message.revisions.length, 1);
  assert.equal(message.revisions[0].id, "r1");
  assert.equal(message.revisions[0].label, "Tightened header copy");
  assert.equal(message.revisions[0].mark_count, 1);
  assert.equal(message.marks.length, 1);
  assert.equal(message.marks[0].revision_id, "r1");
  assert.equal(message.marks[0].selector, "html > body > h1");
  assert.equal(message.marks[0].excerpt, "Ship faster");
});

test("the served SDK bundle resolves table coordinates only for annotation clicks", () => {
  const sdk = bootSdk();
  const { evidence } = buildTable(sdk);

  sdk.api.queuePrompt("Programmatic note", { element: evidence });

  assert.equal(sdk.posted.at(-1).prompt.target, undefined);
});

// closeCard() reports `card: null` to the chrome, so that report is the observable proof of close.
function pressEscape(textarea) {
  const listener = textarea.listeners.find((entry) => entry.type === "keydown");
  assert.ok(listener, "the annotation textarea registers a keydown listener");
  listener.handler({ key: "Escape", preventDefault() {} });
}

test("Escape closes an annotation card with no text and no attachment", () => {
  const sdk = bootSdk();
  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));

  sdk.ask(paragraph);
  const textarea = sdk.card().querySelector("textarea");
  textarea.value = "   "; // whitespace-only counts as empty
  pressEscape(textarea);

  assert.equal(sdk.isCardOpen(), false, "the card reported itself closed");
});

test("Escape during IME composition leaves an empty annotation card open", () => {
  const sdk = bootSdk();
  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));

  sdk.ask(paragraph);
  const textarea = sdk.card().querySelector("textarea");
  const listener = textarea.listeners.find((entry) => entry.type === "keydown");
  listener.handler({ key: "Escape", isComposing: true, preventDefault() {} });

  assert.equal(sdk.isCardOpen(), true, "a composing Escape belongs to the IME, not the card");
});

test("the Enter that confirms an IME conversion in WebKit leaves the annotation card open", () => {
  const sdk = bootSdk();
  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));

  sdk.ask(paragraph);
  const textarea = sdk.card().querySelector("textarea");
  textarea.value = "漢字";
  const listener = textarea.listeners.find((entry) => entry.type === "keydown");
  let prevented = false;
  // WebKit fires compositionend before this keydown, so only keyCode 229 marks it as the IME's.
  listener.handler({ key: "Enter", isComposing: false, keyCode: 229, preventDefault: () => (prevented = true) });

  assert.equal(prevented, false, "the IME keeps its Enter");
  assert.equal(sdk.isCardOpen(), true, "the card stays open");
});

test("Escape leaves an annotation card with typed text open and untouched", () => {
  const sdk = bootSdk();
  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));

  sdk.ask(paragraph);
  const textarea = sdk.card().querySelector("textarea");
  textarea.value = "keep this note";
  pressEscape(textarea);

  assert.equal(sdk.isCardOpen(), true, "the card is still open, so the highlight remains");
  assert.equal(textarea.value, "keep this note", "Escape never discards the typed text");
});

test("Escape leaves an annotation card with an in-flight attachment open, even with no text", () => {
  const sdk = bootSdk();
  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));

  sdk.ask(paragraph);
  const card = sdk.card();
  const attachInput = card.querySelector(".textcast-attach-input");
  // Never resolves - only the synchronous "uploading" status addFiles sets is needed here.
  attachInput.files = [{ name: "shot.png", type: "image/png", size: 10, arrayBuffer: () => new Promise(() => {}) }];
  const changeListener = attachInput.listeners.find((entry) => entry.type === "change");
  assert.ok(changeListener, "the attach input registers a change listener");
  changeListener.handler();

  pressEscape(card.querySelector("textarea"));

  assert.equal(sdk.isCardOpen(), true, "an attachment mid-upload is unsent content, so Escape must not close the card");
});

// The chrome cannot see into this document, so a draft whose anchor is gone is only ever retired
// if the SDK says so. Silence left it to be retried against every later load.
test("the served SDK bundle reports a draft whose anchor the artifact no longer has", () => {
  const sdk = bootSdk();

  sdk.sendChromeMessage({
    type: "textcast:restoreReviewState",
    state: { card: { selector: "#hero", text: "needs a shorter headline" }, fields: [] },
  });

  // The load event proves the document parsed, not that it finished rendering, so nothing is
  // reported until the anchor has had time to appear.
  assert.equal(
    sdk.posted.some((message) => message.type === "textcast:reviewDraftUnrestorable"),
    false,
  );

  sdk.runTimers();
  const report = sdk.posted.at(-1);
  assert.equal(report.type, "textcast:reviewDraftUnrestorable");
  assert.equal(report.selector, "#hero");
  assert.equal(report.artifact_load_token, "load-token");
});

// A section this page builds in script is not in the document when it loads. Reporting that as a missing anchor is how a live draft gets thrown away.
test("the served SDK bundle restores a draft whose anchor arrives after the load", () => {
  const sdk = bootSdk();
  let late = null;
  sdk.setDocumentQuery((selector) => (selector === "#hero" ? late : null));

  sdk.sendChromeMessage({
    type: "textcast:restoreReviewState",
    state: { card: { selector: "#hero", text: "needs a shorter headline" }, fields: [] },
  });
  late = appendTo(sdk.body, cell("h1", "Headline"));
  sdk.runTimers();

  assert.equal(
    sdk.posted.some((message) => message.type === "textcast:reviewDraftUnrestorable"),
    false,
    "an anchor that arrived late is restored, not reported gone",
  );
  assert.equal(sdk.card().querySelector("textarea").value, "needs a shorter headline");
});

test("the served SDK bundle reports nothing when there is no draft to restore", () => {
  const sdk = bootSdk();
  const before = sdk.posted.length;

  sdk.sendChromeMessage({ type: "textcast:restoreReviewState", state: { card: null, fields: [] } });
  sdk.sendChromeMessage({ type: "textcast:restoreReviewState", state: { card: { selector: "#hero", text: "  " } } });
  sdk.runTimers();

  assert.equal(sdk.posted.length, before);
});

// `showAnnotationCard` closes whatever card is open before it draws, so a late restore landing on
// a card the user opened inside the settle window would delete text they are still typing - text
// no report has carried to the chrome yet.
test("the served SDK bundle leaves a card the user opened alone when the anchor arrives late", () => {
  const sdk = bootSdk();
  let late = null;
  sdk.setDocumentQuery((selector) => (selector === "#hero" ? late : null));

  sdk.sendChromeMessage({
    type: "textcast:restoreReviewState",
    state: { card: { selector: "#hero", text: "needs a shorter headline" }, fields: [] },
  });

  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));
  sdk.ask(paragraph);
  sdk.card().querySelector("textarea").value = "typing something new";
  late = appendTo(sdk.body, cell("h1", "Headline"));
  sdk.runTimers();

  assert.equal(sdk.card().querySelector("textarea").value, "typing something new");
  // The draft is still stored on the chrome side, so a later load can try again; nothing here
  // claims the anchor is gone either.
  assert.equal(
    sdk.posted.some((message) => message.type === "textcast:reviewDraftUnrestorable"),
    false,
  );
});

// Cancelling a card reports `card: null`, which is what retires the stored draft on the chrome
// side. A late restore firing after that cancel would draw text the chrome no longer holds and
// report it back as a live draft, so the card the user dismissed reappears with someone else's
// text in it.
test("the served SDK bundle drops a late restore once the user has opened a card of their own", () => {
  const sdk = bootSdk();
  let late = null;
  sdk.setDocumentQuery((selector) => (selector === "#hero" ? late : null));

  sdk.sendChromeMessage({
    type: "textcast:restoreReviewState",
    state: { card: { selector: "#hero", text: "needs a shorter headline" }, fields: [] },
  });

  const paragraph = appendTo(sdk.body, cell("p", "Just prose"));
  sdk.ask(paragraph);
  sdk.card().querySelector(".textcast-cancel").onclick();
  const cardsAfterCancel = sdk.cards().length;

  late = appendTo(sdk.body, cell("h1", "Headline"));
  sdk.runTimers();

  assert.equal(sdk.cards().length, cardsAfterCancel, "the cancelled card is not replaced by a restored one");
  assert.notEqual(sdk.card().querySelector("textarea").value, "needs a shorter headline");
  assert.equal(
    sdk.posted.some((message) => message.type === "textcast:reviewDraftUnrestorable"),
    false,
  );
});

test("setDocumentMeta posts the title and icon the page asked for, stamped with the load token", () => {
  const sdk = bootSdk();
  sdk.api.setDocumentMeta({ title: "(1) Board", icon: "data:image/svg+xml,<svg/>" });
  const message = sdk.posted.find((entry) => entry.type === "textcast:documentMeta");
  assert.deepEqual(
    { ...message },
    {
      type: "textcast:documentMeta",
      title: "(1) Board",
      icon: "data:image/svg+xml,<svg/>",
      artifact_load_token: "load-token",
    },
  );
});

test("setDocumentMeta forwards null to restore, omits unset fields and drops non-strings", () => {
  const sdk = bootSdk();
  sdk.api.setDocumentMeta({ title: null });
  sdk.api.setDocumentMeta({ icon: 42, title: { toString: () => "x" } });
  sdk.api.setDocumentMeta();
  const messages = sdk.posted.filter((entry) => entry.type === "textcast:documentMeta");
  assert.deepEqual(
    messages.map((entry) => JSON.parse(JSON.stringify({ title: entry.title, icon: entry.icon }))),
    [{ title: null }, {}, {}],
  );
});
