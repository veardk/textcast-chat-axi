/* global CSS, Element, MutationObserver, document, parent, window */

import { readArtifactRevisions } from "./artifact-revisions.js";

export const TEXTCAST_INTERNAL_QUEUE_KEY = "_textcastQueueKey";

export const MODE_TOGGLE_HOTKEY_KEY = "i";

export function isModeToggleHotkeyEvent(event) {
  if (event.shiftKey || event.altKey) return false;
  return Boolean(event.metaKey || event.ctrlKey) && String(event.key || "").toLowerCase() === MODE_TOGGLE_HOTKEY_KEY;
}

// Derive the browser-only replacement key used to collapse unsent updates for the same input.
// The key is stripped by the chrome before prompts are sent to the server or returned by poll.
export function deriveTextcastQueueKey(element, options = {}) {
  function stringValue(value) {
    return value === null || value === undefined ? "" : String(value);
  }

  function attributeValue(el, name) {
    if (!el) return "";
    if (el.getAttribute) {
      const value = el.getAttribute(name);
      if (value !== null && value !== undefined) return value;
    }
    return el[name] || "";
  }

  function tagName(el) {
    return stringValue(el?.tagName || el?.nodeName).toLowerCase();
  }

  function closestElementMatching(el, selector) {
    return el && el.closest ? el.closest(selector) : null;
  }

  function elementPath(el) {
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 6) {
      let part = tagName(node) || "element";
      const id = stringValue(attributeValue(node, "id") || node.id).trim();
      if (id) {
        part += `#${id}`;
        parts.unshift(part);
        break;
      }

      const parent = node.parentElement;
      if (parent && parent.children) {
        const siblings = [...parent.children].filter((child) => tagName(child) === tagName(node));
        if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  }

  function scopeKey(el) {
    const scope = closestElementMatching(el, "form,fieldset") || el?.parentElement || el;
    const tag = tagName(scope) || "scope";
    const explicit = stringValue(
      attributeValue(scope, "data-textcast-question") || attributeValue(scope, "id") || attributeValue(scope, "name"),
    ).trim();
    if (explicit) return `${tag}:${explicit}`;
    return elementPath(scope) || tag;
  }

  function controlIdentity(el) {
    const identity = stringValue(attributeValue(el, "name") || attributeValue(el, "id") || el?.name).trim();
    if (identity) return identity;
    return elementPath(el);
  }

  function isKeyedInputType(type) {
    return !new Set(["button", "submit", "reset", "file", "image", "hidden", "radio", "checkbox"]).has(type);
  }

  if (Object.hasOwn(options, "queueKey")) {
    return stringValue(options.queueKey).trim();
  }

  const question = closestElementMatching(element, "[data-textcast-question]");
  const questionKey = stringValue(attributeValue(question, "data-textcast-question")).trim();
  if (questionKey) return `question:${questionKey}`;

  const tag = tagName(element);
  const type = stringValue(attributeValue(element, "type") || element?.type).toLowerCase();
  const scope = scopeKey(element);

  if (tag === "input" && type === "radio") {
    const name = stringValue(attributeValue(element, "name") || element?.name).trim();
    if (name) return `radio:${scope}:${name}`;
    return "";
  }

  if (tag === "input" && type === "checkbox") {
    const identity = controlIdentity(element);
    const explicitValue = stringValue(element?.getAttribute ? element.getAttribute("value") : "").trim();
    const option = explicitValue || stringValue(attributeValue(element, "id") || elementPath(element)).trim();
    if (identity) return `checkbox:${scope}:${identity}:${option}`;
    return "";
  }

  if (tag === "select" || tag === "textarea" || (tag === "input" && isKeyedInputType(type))) {
    const identity = controlIdentity(element);
    if (identity) return `field:${scope}:${identity}`;
  }

  return "";
}

export function isNativeInteractiveControl(el) {
  if (!el || !el.closest) return false;
  if (
    el.closest(
      "button,input,select,textarea,option,optgroup,label,summary,[contenteditable]:not([contenteditable='false'])",
    )
  ) {
    return true;
  }
  const widget = el.closest(
    "[role='button'],[role='checkbox'],[role='combobox'],[role='menuitem'],[role='menuitemcheckbox']," +
      "[role='menuitemradio'],[role='option'],[role='radio'],[role='switch'],[role='tab'],[role='treeitem']",
  );
  if (!widget) return false;
  const link = el.closest("a[href]");
  return !(link && widget.contains(link));
}

/**
 * Whether a picked/dropped/pasted file is within the client-side byte limit, and
 * the message to show if not. Returns "" when the file is acceptable.
 *
 * @param {number} size the file's byte length (`File.size`)
 * @param {number} maxBytes the limit; <= 0 or non-finite means "no client limit"
 * @returns {string} "" if acceptable, else a human-readable error
 */
export function attachmentSizeError(size, maxBytes) {
  const cap = Number(maxBytes);
  if (!Number.isFinite(cap) || cap <= 0) return "";
  const n = Number(size);
  if (!Number.isFinite(n) || n <= cap) return "";
  // Inlined formatter: a serialized SDK helper may reference only its own args and
  // browser globals, never a non-exported sibling.
  const limit = cap >= 1024 * 1024 ? Math.round(cap / (1024 * 1024)) + " MB" : Math.round(cap / 1024) + " KB";
  return "Image is larger than the " + limit + " limit";
}

/**
 * Decide the fate of a whole batch of picked/dropped files in ONE pass, so the card
 * can apply them and render once instead of re-rendering the entire chip DOM per file
 * (O(N²) on a large multi-drop, D7). Each decision is `skip` (wrong mime), `error`
 * (over the size limit, with the message), `cap` (would exceed the per-prompt count),
 * or `accept` (carry the file forward to upload). The count cap is honored ACROSS the
 * batch, not reset per file.
 *
 * @param {ArrayLike<any>} files
 * @param {{ currentCount?: number, maxCount?: number, maxBytes?: number, accepted?: Record<string, boolean> }} options
 * @returns {Array<{ kind: string, file?: any, error?: string }>}
 */
export function classifyAttachmentBatch(files, options = {}) {
  const { currentCount = 0, maxCount = Infinity, maxBytes = 0, accepted = {} } = options;
  const decisions = [];
  let count = currentCount;
  for (const file of Array.from(files || [])) {
    if (!file || !accepted[file.type]) {
      decisions.push({ kind: "skip" });
      continue;
    }
    const error = attachmentSizeError(file.size, maxBytes);
    if (error) {
      decisions.push({ kind: "error", error });
      continue;
    }
    if (count >= maxCount) {
      decisions.push({ kind: "cap" });
      continue;
    }
    count += 1;
    decisions.push({ kind: "accept", file });
  }
  return decisions;
}

/**
 * Split a drop/paste into the images the card can attach and the names of the
 * files it cannot.
 *
 * Both halves are always reported. A mixed drop (a screenshot alongside a PDF)
 * used to accept the images and say nothing about the rest, because the
 * unsupported branch only ran when NO image was found - so the companion files
 * vanished with no feedback. The card attaches what it can and raises a visible
 * error chip for each file it cannot, rather than silently dropping either half.
 *
 * @param {{ files?: ArrayLike<any>, items?: ArrayLike<any> }|null|undefined} dataTransfer
 * @param {Record<string, boolean>} acceptedMime
 * @returns {{ images: any[], unsupported: string[] }}
 */
export function partitionDroppedFiles(dataTransfer, acceptedMime) {
  const accepted = acceptedMime || {};
  const images = [];
  const unsupported = [];
  if (!dataTransfer) return { images, unsupported };
  const files = Array.from(dataTransfer.files || []).filter(Boolean);
  for (const file of files) {
    if (accepted[file.type]) images.push(file);
    else unsupported.push(file.name || "file");
  }
  if (!files.length) {
    // Pasted screenshots arrive as items, not files, in some browsers.
    for (const item of Array.from(dataTransfer.items || [])) {
      if (!item || item.kind !== "file") continue;
      if (accepted[item.type]) {
        const file = item.getAsFile();
        if (file) images.push(file);
      } else {
        unsupported.push("file");
      }
    }
  }
  return { images, unsupported };
}

/**
 * Build the accepted-image lookups the annotation card needs from the server's
 * `ACCEPTED_IMAGE_MIME` list, threaded in by `createSdkJs`.
 *
 * The card's paste/drop filter and its file picker's `accept` attribute both come
 * from the returned value, so no surface can offer a format another one refuses.
 * The literal is only the unwired fallback (a direct `createArtifactSdk` call in a
 * unit test), matching how the count and byte caps behave.
 *
 * @param {string[]|null|undefined} list
 * @returns {{ mimes: string[], accepted: Record<string, boolean>, accept: string }}
 */
export function acceptedImageTypes(list) {
  const named = (Array.isArray(list) ? list : []).map(String).filter(Boolean);
  const mimes = named.length ? named : ["image/png", "image/jpeg", "image/webp"];
  /** @type {Record<string, boolean>} */
  const accepted = {};
  for (const mime of mimes) accepted[mime] = true;
  return { mimes, accepted, accept: mimes.join(",") };
}

/**
 * Split a paste over the annotation textarea into the images it can attach and
 * whether the browser's own text paste must be preserved.
 *
 * A screenshot pasted alone should not also drop its (usually empty or
 * placeholder) text into the textarea, so that paste is consumed. A paste that
 * carries real text alongside an image is a mixed paste: the image attaches AND
 * the text must still land, so the default is left intact.
 *
 * Placeholder text includes the pasted files' own names: Finder/Explorer file
 * copies put the file's name or full path in text/plain, and keeping it would
 * silently paste a filesystem path beside the attached image. Text is kept
 * only when at least one line is not a pasted image's name or path.
 *
 * @param {{ files?: ArrayLike<any>, items?: ArrayLike<any>, getData?: (type: string) => string }|null|undefined} clipboardData
 * @param {Record<string, boolean>} acceptedMime
 * @returns {{ images: any[], keepTextPaste: boolean }}
 */
export function planClipboardPaste(clipboardData, acceptedMime) {
  const { images } = partitionDroppedFiles(clipboardData, acceptedMime);
  const text = clipboardData && clipboardData.getData ? clipboardData.getData("text/plain") : "";
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const names = images.map((file) => String((file && file.name) || "")).filter(Boolean);
  const keepTextPaste =
    lines.length > 0 &&
    !(
      names.length > 0 &&
      lines.every((line) =>
        names.some((name) => line === name || line.endsWith("/" + name) || line.endsWith("\\" + name)),
      )
    );
  return { images, keepTextPaste };
}

/**
 * Decide whether an incoming `textcast:attachmentResult` may be applied to this
 * document's chips. Two independent conditions, both required:
 *
 * 1. It came from the chrome (`event.source === parent`). The SDK's listener is on
 *    `window`, so without this the artifact can post to ITSELF and hand its own
 *    chips any server id - the upload mediation the chrome performs is bypassed.
 * 2. It carries THIS document's upload nonce. Chip ids (`att-1`, `att-2`, ...)
 *    restart on every document load, so a result still in flight across an iframe
 *    reload would otherwise match a brand-new chip by id alone and mark it ready
 *    with the previous document's image. The nonce is minted per document, so a
 *    pre-reload result can never match.
 *
 * The nonce is compared by exact string identity - no coercion, no truthiness -
 * so a hostile `{nonce: true}` or `{nonce: [realNonce]}` cannot pass.
 *
 * @param {{ source?: unknown, data?: { nonce?: unknown } }} event the message event
 * @param {{ parentWindow?: unknown, nonce?: string }} context this document's upload identity
 * @returns {boolean}
 */
export function isTrustedAttachmentResult(event, context = {}) {
  if (!event || !context.parentWindow || event.source !== context.parentWindow) return false;
  const expected = context.nonce;
  if (typeof expected !== "string" || !expected) return false;
  const actual = (event.data || {}).nonce;
  return typeof actual === "string" && actual === expected;
}

/**
 * @param {{ itemCount?: number, maxCount?: number, capRejected?: boolean, queueBlocked?: boolean, hasPending?: boolean, hasErrors?: boolean }} [state]
 * @returns {string}
 */
export function deriveAttachmentNoticeState(state = {}) {
  const itemCount = Number(state.itemCount) || 0;
  const maxCount = Number(state.maxCount) || 0;
  if (state.queueBlocked && state.hasPending) return "Waiting for an image to finish uploading…";
  if (state.queueBlocked && state.hasErrors) return "An image couldn't be attached. Retry or remove it before queuing.";
  if (state.capRejected && maxCount > 0 && itemCount >= maxCount)
    return "You can attach up to " + maxCount + " image" + (maxCount === 1 ? "" : "s") + ".";
  return "";
}

/**
 * @param {*} deriveQueueKey
 * @param {*} [isNativeInteractive]
 * @param {number} [artifactRevision]
 * @param {string} [artifactLoadToken]
 * @param {{ maxAttachmentCount?: number, maxAttachmentBytes?: number, acceptedImageMime?: string[], strings?: Record<string, string> }} [options]
 */
export function createArtifactSdk(
  deriveQueueKey,
  isNativeInteractive = isNativeInteractiveControl,
  artifactRevision = 0,
  artifactLoadToken = "",
  options = {},
) {
  // The page's language, chosen by the server (src/chrome-i18n.js). Without it the card is English.
  // `makeTranslator` is a const of the SDK bundle (createSdkJs); unit tests run without it.
  // @ts-ignore
  const bundledTranslator = typeof makeTranslator === "function" ? makeTranslator : undefined; // eslint-disable-line no-undef
  /** @type {(text: string, vars?: Record<string, unknown>) => string} */
  const t = bundledTranslator ? bundledTranslator(options.strings) : (text) => String(text);
  function postArtifactMessage(type, payload = {}) {
    parent.postMessage({ type, ...payload, artifact_load_token: String(artifactLoadToken || "") }, "*");
  }
  // Only an explicit "off" declaration on the root opts out; absent or unknown
  // values keep the artifact annotatable by default.
  const initialAnnotationMode = document.documentElement.getAttribute("data-textcast-annotate") !== "off";
  let annotationMode = initialAnnotationMode;
  let selected = null;
  // The text selection the floating Ask button would annotate, and the button itself.
  let offeredSelection = null;
  let askButton = null;
  let pointerSelecting = false;
  let shadow = null;
  let counter = 0;
  const ids = new WeakMap();

  // Image attachments for the open annotation card. These are UX guides only - the
  // server re-validates size and enforces the per-prompt count/byte caps at queue
  // time (see attachment-store.js), rejecting the entire send batch on a mismatch
  // so the chrome can preserve the queue and surface the correction to the user.
  // The count cap mirrors the server's TEXTCAST_CHAT_AXI_MAX_ATTACHMENTS_PER_PROMPT, passed
  // in via createSdkJs (W1); the literal 4 is only the fallback when the SDK runs
  // without that wiring (e.g. a unit-test call to createArtifactSdk).
  const ATTACHMENT_MAX_COUNT =
    Number.isFinite(options.maxAttachmentCount) && options.maxAttachmentCount > 0 ? options.maxAttachmentCount : 4;
  // The per-image byte limit, threaded from the server via createSdkJs. 0 means "no
  // client-side gate" (the server still enforces its own cap); it is the fallback
  // when the SDK runs unwired, e.g. a direct createArtifactSdk unit call. Checking
  // it in add() BEFORE reading the file is what stops a multi-GB drop from being
  // allocated and structured-cloned into the chrome ahead of any rejection.
  const ATTACHMENT_MAX_BYTES =
    Number.isFinite(options.maxAttachmentBytes) && options.maxAttachmentBytes > 0 ? options.maxAttachmentBytes : 0;
  const ATTACHMENT_IMAGE_TYPES = acceptedImageTypes(options.acceptedImageMime);
  const ATTACHMENT_ACCEPTED_MIME = ATTACHMENT_IMAGE_TYPES.accepted;
  // Minted once per document load and stamped on every upload, so a result the
  // chrome posts back can be tied to the exact document that asked for it. Chip
  // ids restart at att-1 on each load, so they cannot do this on their own: an
  // upload still in flight across a live-reload would otherwise land on a new
  // document's first chip. `randomUUID` needs a secure context, which the
  // sandboxed artifact frame is not guaranteed to be, hence the fallback - this
  // value only has to be unique per document, never unguessable.
  const ATTACHMENT_NONCE =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "n" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  let attachmentLocalCounter = 0;
  // The controller for the currently open card, so upload results routed from the
  // chrome reach the right chips. Only one card is ever open at a time.
  let activeAttachments = null;

  // A clean, self-contained close glyph: the SVG path is inlined directly (no
  // <use>/sprite/symbol/CSS-mask reference), so it paints inside the sandboxed
  // annotation-card iframe where any external symbol reference would resolve to
  // nothing. The X sits inside a 14-unit viewBox with even margins so it is
  // optically centered in the round button.
  const REMOVE_ICON =
    '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M3.5 3.5l7 7M10.5 3.5l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';

  function attachmentChipHtml(item, index) {
    const name = escapeAnnotationText(item.name || "image");
    const thumb = item.url
      ? '<img class="textcast-attachment-thumb" src="' + escapeAnnotationText(item.url) + '" alt="">'
      : '<span class="textcast-attachment-thumb textcast-attachment-thumb-empty" aria-hidden="true"></span>';
    let status = "";
    if (item.status === "uploading") status = '<span class="textcast-attachment-status">' + t("Uploading…") + "</span>";
    else if (item.status === "error")
      status =
        '<span class="textcast-attachment-status textcast-attachment-status-error">' +
        escapeAnnotationText(t(item.error || "Upload failed")) +
        "</span>";
    // Only a real (retryable) upload gets a Retry button; a rejected non-image has no file.
    const retry =
      item.status === "error" && item.file
        ? '<button type="button" class="textcast-attachment-retry" data-attachment-retry="' +
          index +
          '">' +
          t("Retry") +
          "</button>"
        : "";
    return (
      '<div class="textcast-attachment-chip' +
      (item.status === "error" ? " is-error" : "") +
      '">' +
      thumb +
      '<span class="textcast-attachment-body"><span class="textcast-attachment-name" title="' +
      name +
      '">' +
      name +
      "</span>" +
      status +
      "</span>" +
      retry +
      '<button type="button" class="textcast-attachment-remove" data-attachment-remove="' +
      index +
      '" aria-label="' +
      escapeAnnotationText(t("Remove image")) +
      '" title="' +
      escapeAnnotationText(t("Remove")) +
      '">' +
      REMOVE_ICON +
      "</button></div>"
    );
  }

  // Per-card image attachment state. Captures files, renders chips, drives uploads
  // through the chrome (which owns the same-origin server round trip), and reports
  // which uploads are ready to ride along with the queued prompt.
  /**
   * @param {HTMLElement} listEl
   * @param {{ notify?: (message: string) => void, onLayout?: () => void }} [config]
   */
  function makeAttachmentsController(listEl, { notify = () => {}, onLayout = () => {} } = {}) {
    const items = [];
    let capRejected = false;
    let queueBlocked = false;

    function render() {
      if (items.length < ATTACHMENT_MAX_COUNT) capRejected = false;
      if (!hasPending() && !hasErrors()) queueBlocked = false;
      notify(
        t(
          deriveAttachmentNoticeState({
            itemCount: items.length,
            maxCount: ATTACHMENT_MAX_COUNT,
            capRejected,
            queueBlocked,
            hasPending: hasPending(),
            hasErrors: hasErrors(),
          }),
        ),
      );
      listEl.innerHTML = items.map((item, index) => attachmentChipHtml(item, index)).join("");
      listEl.hidden = items.length === 0;
      for (const button of listEl.querySelectorAll("[data-attachment-remove]")) {
        button.addEventListener("click", () => removeAt(Number(button.getAttribute("data-attachment-remove"))));
      }
      for (const button of listEl.querySelectorAll("[data-attachment-retry]")) {
        button.addEventListener("click", () => retryAt(Number(button.getAttribute("data-attachment-retry"))));
      }
      // Chip rows change the card's height, so let the card re-clamp itself back
      // inside the viewport (W3) - otherwise a grown card can push Queue/Cancel off
      // the bottom of the frame.
      onLayout();
    }

    function upload(item) {
      item.status = "uploading";
      item.error = "";
      render();
      item.file
        .arrayBuffer()
        .then((bytes) => {
          if (!items.includes(item)) return;
          // Route through postArtifactMessage so the message carries the current
          // artifact_load_token - the chrome drops any artifact message without it
          // before the upload handler ever runs.
          postArtifactMessage("textcast:uploadAttachment", {
            nonce: ATTACHMENT_NONCE,
            localId: item.localId,
            name: item.name,
            mime: item.mime,
            bytes,
          });
        })
        .catch(() => {
          if (!items.includes(item)) return;
          item.status = "error";
          item.error = "Could not read image";
          render();
        });
    }

    // Append the chips for a whole batch, then render ONCE and start the uploads. The
    // per-file decision (mime / size / count cap) is made by classifyAttachmentBatch;
    // this only materializes chips + object URLs. A size error becomes a dismissible
    // chip (the oversized file is never read - see round-7 (a)); a cap rejection sets
    // the notice; accepted files upload. Uploads are count-capped (<= ATTACHMENT_MAX_COUNT),
    // so the render-per-upload they trigger is bounded, not O(N).
    function addFiles(fileList) {
      const files = [...(fileList || [])];
      const decisions = classifyAttachmentBatch(files, {
        currentCount: items.length,
        maxCount: ATTACHMENT_MAX_COUNT,
        maxBytes: ATTACHMENT_MAX_BYTES,
        accepted: ATTACHMENT_ACCEPTED_MIME,
      });
      const toUpload = [];
      let added = false;
      for (const decision of decisions) {
        if (decision.kind === "cap") {
          capRejected = true;
        } else if (decision.kind === "error") {
          items.push({
            localId: "att-" + ++attachmentLocalCounter,
            file: null,
            name: decision.file?.name || "image",
            mime: "",
            status: "error",
            id: "",
            error: decision.error,
            url: "",
          });
        } else if (decision.kind === "accept") {
          const item = {
            localId: "att-" + ++attachmentLocalCounter,
            file: decision.file,
            name: decision.file.name || "image",
            mime: decision.file.type,
            status: "uploading",
            id: "",
            error: "",
            url: URL.createObjectURL(decision.file),
          };
          items.push(item);
          toUpload.push(item);
          added = true;
        }
      }
      render();
      for (const item of toUpload) upload(item);
      return added;
    }

    function removeAt(index) {
      const item = items[index];
      if (!item) return;
      if (item.url) URL.revokeObjectURL(item.url);
      items.splice(index, 1);
      render();
    }

    function retryAt(index) {
      if (items[index] && items[index].file) upload(items[index]);
    }

    // Surface dropped non-images as dismissible UNSUPPORTED_TYPE error chips (no file,
    // so no thumbnail and no retry) instead of letting the browser open them. Batched:
    // a mixed drop of many unsupported files pushes all chips, then renders ONCE, so N
    // rejections cost one DOM rebuild rather than N (D7).
    function rejectUnsupportedBatch(names) {
      for (const name of names || []) {
        items.push({
          localId: "att-" + ++attachmentLocalCounter,
          file: null,
          name: name || "file",
          mime: "",
          status: "error",
          id: "",
          error: "UNSUPPORTED_TYPE",
          url: "",
        });
      }
      render();
    }

    function rejectUnsupported(name) {
      rejectUnsupportedBatch([name]);
    }

    function handleResult(localId, ok, id, error) {
      const item = items.find((entry) => entry.localId === localId);
      if (item) {
        if (ok && id) {
          item.status = "ready";
          item.id = String(id);
          item.error = "";
        } else {
          item.status = "error";
          item.error = String(error || "Upload failed");
        }
        render();
      }
    }

    function collectReady() {
      return items
        .filter((item) => item.status === "ready" && item.id)
        .map((item) => ({ id: item.id, name: item.name }));
    }

    function hasReady() {
      return items.some((item) => item.status === "ready" && item.id);
    }

    // Any chip still mid-flight. Queuing while one is uploading would silently drop
    // it (collectReady excludes it, and closeCard destroys the controller), so the
    // send path gates on this (R2.4).
    function hasPending() {
      return items.some((item) => item.status === "uploading");
    }

    // Any chip in the error state - a failed upload (retryable) or a rejected
    // non-image. collectReady drops these and closeCard destroys the card, so queuing
    // while one is present would silently discard the failed attachment along with its
    // retry/remove UI; the send path gates on this and keeps the card open (W2).
    function hasErrors() {
      return items.some((item) => item.status === "error");
    }

    function setQueueBlocked(value) {
      queueBlocked = Boolean(value);
      render();
    }

    function destroy() {
      for (const item of items) if (item.url) URL.revokeObjectURL(item.url);
      items.length = 0;
    }

    render();
    return {
      addFiles,
      rejectUnsupported,
      rejectUnsupportedBatch,
      handleResult,
      collectReady,
      hasReady,
      hasPending,
      hasErrors,
      setQueueBlocked,
      destroy,
    };
  }

  function uid(el) {
    if (!ids.has(el)) ids.set(el, String(++counter));
    return ids.get(el);
  }

  function escapeAnnotationText(value) {
    return String(value).replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );
  }

  function selector(el) {
    if (!el || !el.tagName) return "";

    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      if (node.id) {
        part += "#" + CSS.escape(node.id);
        parts.unshift(part);
        break;
      }

      const parent = node.parentElement;
      if (parent) {
        const same = [...parent.children].filter((x) => x.tagName === node.tagName);
        if (same.length > 1) part += ":nth-of-type(" + (same.indexOf(node) + 1) + ")";
      }
      parts.unshift(part);
      node = parent;
    }

    return parts.join(" > ");
  }

  function context(el) {
    const base = {
      uid: uid(el),
      selector: selector(el),
      tag: (el.tagName || "").toLowerCase(),
      text: (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 240),
    };

    return base;
  }

  // Hover and click outline the exact element they annotate.
  function annotationTargetEl(el) {
    return el;
  }

  window.addEventListener("message", (event) => {
    if (event.source !== parent) return;
    const msg = event.data || {};
    if (msg.type === "textcast:requestReady") reportReady();
  });

  function closestElement(node) {
    if (!node) return document.body;
    if (node.nodeType === 1) return node;
    return node.parentElement || document.body;
  }

  function nodePath(node, root) {
    const path = [];
    let current = node;
    while (current && current !== root) {
      const parentNode = current.parentNode;
      if (!parentNode) break;
      path.unshift([...parentNode.childNodes].indexOf(current));
      current = parentNode;
    }
    return path;
  }

  function rangeBoundary(node, offset) {
    const el = closestElement(node);
    return {
      selector: selector(el),
      path: nodePath(node, el),
      offset: Number(offset) || 0,
    };
  }

  function textSelectionContext(selection) {
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const text = selection.toString().trim().replace(/\s+/g, " ");
    if (range.collapsed || !text) return null;

    const ancestor = closestElement(range.commonAncestorContainer);
    if (isTextcastUi(ancestor) || isTextcastAction(ancestor) || isInteractiveControl(ancestor)) return null;

    const commonAncestorSelector = selector(ancestor);
    const target = {
      type: "text-range",
      text,
      selector: commonAncestorSelector,
      commonAncestorSelector,
      start: rangeBoundary(range.startContainer, range.startOffset),
      end: rangeBoundary(range.endContainer, range.endOffset),
    };

    return {
      uid: "",
      selector: commonAncestorSelector,
      tag: "text",
      text: text.slice(0, 240),
      target,
      element: ancestor,
      range: range.cloneRange(),
    };
  }

  function isTextcastUi(el) {
    return !!(el && el.closest && el.closest("[data-textcast-ui]"));
  }

  function isTextcastAction(el) {
    return !!(el && el.closest && el.closest("[data-textcast-action]"));
  }

  // Native interactive controls (radios, checkboxes, inputs, selects, buttons,
  // labels, disclosure summaries, editable regions, interactive ARIA widgets)
  // should toggle/focus/type natively instead of triggering annotation, just
  // like elements marked with data-textcast-action.
  function isInteractiveControl(el) {
    return isNativeInteractive(el);
  }

  function highlightElement(el) {
    if (!el) return;
    el.style.outline = "2px solid var(--brand, #1b365d)";
    el.style.outlineOffset = "2px";
  }

  function clearHighlight(el) {
    if (el) el.style.outline = "";
  }

  function clearTextHighlight() {
    if (!shadow) return;
    for (const el of [...shadow.querySelectorAll(".textcast-text-highlight")]) el.remove();
  }

  function highlightTextRange(range) {
    clearTextHighlight();
    const root = ensureShadow();
    for (const rect of [...range.getClientRects()]) {
      if (rect.width <= 0 || rect.height <= 0) continue;
      const mark = document.createElement("div");
      mark.className = "textcast-text-highlight";
      mark.style.left = rect.left + "px";
      mark.style.top = rect.top + "px";
      mark.style.width = rect.width + "px";
      mark.style.height = rect.height + "px";
      root.appendChild(mark);
    }
  }

  function setAnnotationMode(enabled) {
    annotationMode = !!enabled;
    if (!annotationMode) {
      hideAskButton();
      closeCard();
    }
  }

  function queuePrompt(prompt, options = {}) {
    const originElement = options.element || document.activeElement || document.body;
    /** @type {{ uid: string, prompt: string, selector: string, tag: string, text: string, target?: unknown, attachments?: Array<{ id: string, name?: string }>, _textcastQueueKey?: string }} */
    const item = {
      ...context(originElement),
      prompt: String(prompt || ""),
    };
    const queueKey = typeof deriveQueueKey === "function" ? deriveQueueKey(originElement, options) : "";
    if (queueKey) item._textcastQueueKey = String(queueKey);

    if (options.uid) item.uid = String(options.uid);
    if (options.selector) item.selector = String(options.selector);
    if (options.tag) item.tag = String(options.tag);
    if (options.text) item.text = String(options.text);
    if (options.target) item.target = options.target;
    if (options.data) item.prompt += "\n\nContext data:\n" + JSON.stringify(options.data, null, 2);
    // Attach only the client-controllable fields (server-vetted id + display name);
    // the chrome forwards these and the server re-resolves each id (see queuePrompts).
    if (Array.isArray(options.attachments) && options.attachments.length) {
      const attachments = options.attachments
        .filter((attachment) => attachment && attachment.id)
        .map((attachment) =>
          attachment.name
            ? { id: String(attachment.id), name: String(attachment.name) }
            : { id: String(attachment.id) },
        );
      if (attachments.length) item.attachments = attachments;
    }

    postArtifactMessage("textcast:queuePrompt", { prompt: item });
  }

  function sendQueuedPrompts() {
    postArtifactMessage("textcast:sendQueuedPrompts");
  }

  function endSession() {
    postArtifactMessage("textcast:endSession");
  }

  // Tells the chrome this document parsed and its SDK is running, right after the theme report the
  // chrome dresses itself in. The chrome asks again (`textcast:requestReady`) when a report lost a
  // token race, so the current document's theme still arrives.
  function reportReady() {
    lastThemeReport = "";
    reportTheme();
    // A Textcast page with a video marks its body `has-player`; the chrome then offers its switch.
    postArtifactMessage("textcast:ready", {
      artifact_revision: artifactRevision,
      has_video: Boolean(document.body && document.body.classList.contains("has-player")),
    });
  }

  // The page's colour theme, so the chrome around it can wear the same palette. The theme name
  // comes from `<html data-theme>`; the palette is the page's own custom properties as computed
  // now, plus the body colours for pages that define none. The chrome validates every value.
  const THEME_PROPERTIES = [
    "parchment",
    "ivory",
    "surface",
    "inline-code-bg",
    "warm-sand",
    "brand",
    "brand-light",
    "brand-tint",
    "on-brand",
    "near-black",
    "dark-warm",
    "olive",
    "stone",
    "border",
    "border-soft",
    "line",
    "shadow",
    "serif",
    "latin-ui",
  ];
  let lastThemeReport = "";
  function reportTheme() {
    const root = document.documentElement;
    if (!root || typeof window.getComputedStyle !== "function") return;
    const computed = window.getComputedStyle(root);
    /** @type {Record<string, string>} */
    const palette = {};
    for (const name of THEME_PROPERTIES) {
      const value = computed.getPropertyValue("--" + name).trim();
      if (value) palette[name] = value;
    }
    if (document.body) {
      const body = window.getComputedStyle(document.body);
      palette["body-bg"] = body.backgroundColor;
      palette["body-fg"] = body.color;
    }
    const payload = {
      theme: String(root.getAttribute("data-theme") || ""),
      scheme: computed.colorScheme || "",
      palette,
    };
    const signature = JSON.stringify(payload);
    if (signature === lastThemeReport) return;
    lastThemeReport = signature;
    postArtifactMessage("textcast:theme", payload);
  }
  if (typeof MutationObserver === "function") {
    new MutationObserver(() => reportTheme()).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class", "style"],
    });
  }

  // A sandboxed page cannot run a YouTube or Bilibili embed (the sandbox passes on to nested
  // frames), so a Textcast page hands the chrome what to play and the chrome shows the player.
  // Only the video's identity and start second cross; the chrome builds the embed URL itself.
  Object.defineProperty(window, "textcastHostPlayer", {
    configurable: true,
    value: (spec) => {
      const source = spec && typeof spec === "object" ? spec : {};
      postArtifactMessage("textcast:play", {
        kind: String(source.kind || ""),
        id: String(source.id || ""),
        page: Number(source.page) || 1,
        start: Number(source.start) || 0,
      });
    },
  });

  // A link to another page of the same site (a Textcast transcript, its summary, the index) is
  // followed by the chrome rather than by this frame: the server moves the review to that page and
  // serves it with this SDK, so asking about text keeps working there. Anything else - an anchor
  // on this page, another site, a new tab, a download - behaves as the page wrote it.
  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!link || isTextcastUi(link) || link.hasAttribute("download")) return;
    const target = String(link.getAttribute("target") || "").toLowerCase();
    if (target && target !== "_self") return;
    const href = String(link.getAttribute("href") || "").trim();
    if (!href || href.startsWith("#") || href.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(href)) return;
    if (!/\.html?$/i.test(href.split(/[?#]/)[0])) return;
    event.preventDefault();
    postArtifactMessage("textcast:navigate", { href: href.slice(0, 2000) });
  });

  // The narrow fatal path. A local subresource the artifact declares but the server cannot serve
  // makes the review unusable rather than merely mislaid, so it bypasses the passive inbox. Only
  // same-document (relative or /artifact/-rooted) references count; a remote CDN outage is the
  // viewer's network, not a defect in the artifact.
  function reportLocalAssetFailure(event) {
    const el = event.target;
    if (!(el instanceof Element) || isTextcastUi(el)) return;
    const tag = String(el.tagName || "").toLowerCase();
    if (!["img", "script", "link", "source", "video", "audio", "iframe"].includes(tag)) return;
    const raw = String(el.getAttribute("src") || el.getAttribute("href") || "");
    if (!raw) return;
    let resolved;
    try {
      resolved = new URL(raw, document.baseURI);
    } catch {
      return;
    }
    if (resolved.origin !== window.location.origin) return;
    postArtifactMessage("textcast:artifactAssetFailure", {
      detail: "<" + tag + "> could not load " + resolved.pathname,
    });
  }

  window.addEventListener("error", reportLocalAssetFailure, true);

  // ---------------------------------------------------------------------------
  // Review-context preservation. A live reload replaces this document wholesale, so anything the
  // user typed or answered inside it is lost unless the chrome replays it. Textcast Chat only ever
  // replays state it owns: an open annotation card, and controls inside a `data-textcast-question`
  // scope (the documented Textcast Chat input contract). Application-owned form state is left alone
  // because Textcast Chat cannot tell an intentional reset from a preserved answer.
  // ---------------------------------------------------------------------------

  let activeCardContext = null;
  let reviewStateTimer = 0;
  let draftRestoreTimer = 0;
  const REVIEW_DRAFT_ANCHOR_SETTLE_MS = 1500;

  // A card the user opened ends the pending late restore for good, not just for the instant the
  // settle timer happens to fire: closing that card reports `card: null`, which retires the stored
  // draft, so a restore landing afterwards would put text the chrome no longer holds back on
  // screen and back into persistence over a card the user already dismissed.
  function cancelPendingDraftRestore() {
    if (!draftRestoreTimer) return;
    window.clearTimeout(draftRestoreTimer);
    draftRestoreTimer = 0;
  }

  function safeQuerySelector(selector) {
    try {
      return document.querySelector(String(selector || ""));
    } catch {
      return null;
    }
  }

  function textcastQuestionControls() {
    const entries = [];
    for (const scope of document.querySelectorAll("[data-textcast-question]")) {
      const question = String(scope.getAttribute("data-textcast-question") || "");
      const controls = [...scope.querySelectorAll("input,select,textarea")];
      controls.forEach((el, index) => {
        const control = /** @type {any} */ (el);
        const type = String(control.getAttribute("type") || control.type || "text").toLowerCase();
        if (["button", "submit", "reset", "file", "image", "password"].includes(type)) return;
        if (entries.length >= 200) return;
        entries.push({
          el: control,
          key: [
            question,
            String(control.getAttribute("name") || control.id || ""),
            type,
            String(control.getAttribute("value") || ""),
          ]
            .join("|")
            .slice(0, 300),
          index,
          question,
          type,
        });
      });
    }
    return entries;
  }

  function collectReviewState() {
    const card = shadow ? shadow.querySelector(".textcast-annotation-card") : null;
    const textarea = card ? card.querySelector("textarea") : null;
    const text = textarea ? String(textarea.value || "") : "";
    return {
      // A text-range card is anchored to a live Range, which a reload invalidates - restoring it
      // could point the annotation at different text, so only element cards come back.
      card:
        activeCardContext && activeCardContext.tag !== "text" && text.trim()
          ? { selector: String(activeCardContext.selector || ""), text: text.slice(0, 4000) }
          : null,
      fields: textcastQuestionControls().map((entry) => ({
        key: entry.key,
        index: entry.index,
        question: entry.question,
        type: entry.type,
        value: String(entry.el.value === undefined || entry.el.value === null ? "" : entry.el.value).slice(0, 2000),
        checked: entry.type === "checkbox" || entry.type === "radio" ? Boolean(entry.el.checked) : null,
      })),
    };
  }

  function scheduleReviewStateReport() {
    if (reviewStateTimer) window.clearTimeout(reviewStateTimer);
    reviewStateTimer = window.setTimeout(() => {
      reviewStateTimer = 0;
      postArtifactMessage("textcast:reviewState", { state: collectReviewState() });
    }, 120);
  }

  function restoreReviewState(state) {
    if (!state || typeof state !== "object") return;
    const fields = Array.isArray(state.fields) ? state.fields : [];
    if (fields.length) {
      const entries = textcastQuestionControls();
      for (const field of fields) {
        const match =
          entries.find((entry) => entry.key === field.key) ||
          entries.find((entry) => entry.question === field.question && entry.index === field.index);
        if (!match) continue;
        // No synthetic change/input events: the artifact's own handlers queue prompts, and
        // replaying them would silently re-queue answers the user already sent.
        if (field.checked === null) match.el.value = String(field.value ?? "");
        else match.el.checked = Boolean(field.checked);
      }
    }
    const card = state.card;
    if (!card || !card.selector || !String(card.text || "").trim()) return;
    const target = safeQuerySelector(card.selector);
    if (!target) {
      // The load event says the document parsed, not that it finished rendering: a section this
      // page builds in script arrives later. Ask again once it has had
      // time to appear, and restore the card if it did. Only then is the anchor's absence an
      // answer worth reporting - the chrome cannot see into this document, and a draft it is
      // never told about is retried against every later load.
      cancelPendingDraftRestore();
      draftRestoreTimer = window.setTimeout(() => {
        draftRestoreTimer = 0;
        // The user may have opened a card of their own inside the settle window, and
        // `showAnnotationCard` closes whatever is open before it draws. Restoring over live
        // typing destroys text nothing has carried to the chrome yet, so a card on screen ends
        // this attempt: the draft is still stored, and the next load tries again.
        if (activeCardContext) return;
        const late = safeQuerySelector(card.selector);
        if (late) {
          showAnnotationCard(late, { restoreText: String(card.text) });
          return;
        }
        postArtifactMessage("textcast:reviewDraftUnrestorable", { selector: String(card.selector) });
      }, REVIEW_DRAFT_ANCHOR_SETTLE_MS);
      return;
    }
    showAnnotationCard(target, { restoreText: String(card.text) });
  }

  document.addEventListener("change", (event) => {
    const el = event.target;
    if (el instanceof Element && el.closest("[data-textcast-question]")) scheduleReviewStateReport();
  });
  document.addEventListener("input", (event) => {
    const el = event.target;
    if (el instanceof Element && el.closest("[data-textcast-question]")) scheduleReviewStateReport();
  });

  function ensureShadow() {
    if (shadow) return shadow;

    const host = document.createElement("div");
    host.className = "textcast-annotation-root";
    host.setAttribute("data-textcast-ui", "annotation-root");
    document.documentElement.appendChild(host);

    shadow = host.attachShadow({ mode: "open" });
    // Keep the artifact's own key handlers from seeing, and cancelling, typing in Textcast Chat controls.
    for (const type of ["keydown", "keypress", "keyup"]) {
      shadow.addEventListener(type, (event) => event.stopPropagation());
    }
    const style = document.createElement("style");
    style.textContent = `:host{all:initial;position:fixed;z-index:2147483647;left:0;top:0;--lv-surface:var(--surface,#fdfdfb);--lv-field:var(--parchment,#f5f4ed);--lv-fg:var(--near-black,#141413);--lv-soft:var(--dark-warm,#3d3d3a);--lv-muted:var(--stone,#6b6a64);--lv-border:var(--border,#e8e6dc);--lv-line:var(--line,#d8d5c8);--lv-accent:var(--brand,#1b365d);--lv-accent-hover:var(--brand-light,#2d5a8a);--lv-on-accent:var(--on-brand,#faf9f5);--lv-tint:var(--brand-tint,#eef2f7);--lv-shadow:var(--shadow,rgba(20,20,19,.06));--lv-serif:var(--serif,Georgia,serif);--lv-ui:var(--latin-ui,system-ui,-apple-system,"Segoe UI",sans-serif);--lv-danger:#b4442f;font-family:var(--lv-ui);color:var(--lv-fg)}*{box-sizing:border-box}:focus-visible{outline:2px solid var(--lv-accent);outline-offset:2px}button{font-family:var(--lv-ui)}.textcast-text-highlight{position:fixed;pointer-events:none;background:var(--lv-tint);border-radius:2px;box-shadow:inset 0 -2px 0 var(--lv-accent);opacity:.9}.textcast-ask{position:fixed;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 13px 0 11px;border:0;border-radius:999px;background:var(--lv-fg);color:var(--lv-field);font-size:13px;font-weight:600;letter-spacing:.01em;cursor:pointer;box-shadow:0 6px 18px -6px rgba(0,0,0,.35),0 1px 3px rgba(0,0,0,.12);animation:textcast-pop .14s ease-out}.textcast-ask:hover{background:var(--lv-accent);color:var(--lv-on-accent)}@keyframes textcast-pop{from{opacity:0;transform:translateY(4px) scale(.96)}to{opacity:1;transform:none}}.textcast-annotation-card{position:fixed;width:min(340px,calc(100vw - 24px));padding:14px;border-radius:14px;background:var(--lv-surface);color:var(--lv-fg);border:1px solid var(--lv-border);box-shadow:0 18px 48px -16px rgba(0,0,0,.28),0 2px 8px var(--lv-shadow);font:14px/1.5 var(--lv-ui);animation:textcast-pop .16s ease-out}.textcast-heading{font-weight:600;font-size:13px;color:var(--lv-muted);margin-bottom:8px}.textcast-quote{margin:0 0 10px;padding:2px 0 2px 10px;border-left:2px solid var(--lv-accent);font-family:var(--lv-serif);font-size:14px;line-height:1.6;color:var(--lv-soft);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.textcast-annotation-card textarea{display:block;width:100%;min-height:78px;resize:vertical;border-radius:10px;border:1px solid var(--lv-border);background:var(--lv-field);color:var(--lv-fg);padding:9px 11px;font:inherit;outline:none;transition:border-color .12s,box-shadow .12s}.textcast-annotation-card textarea:focus{border-color:var(--lv-accent);box-shadow:0 0 0 3px var(--lv-tint)}.textcast-annotation-card textarea::placeholder{color:var(--lv-muted)}.textcast-annotation-card .textcast-hint{margin-top:8px;font-size:11px;color:var(--lv-muted)}.textcast-annotation-card .textcast-hint-alert{color:var(--lv-danger);font-weight:600}.textcast-annotation-card .textcast-row{display:flex;gap:6px;align-items:center;margin-top:10px}.textcast-row-gap{flex:1}.textcast-annotation-card button{border:0;border-radius:9px;padding:7px 12px;font-size:13px;font-weight:600;cursor:pointer;transition:background .12s,color .12s,border-color .12s}.textcast-annotation-card button:active{transform:translateY(1px)}.textcast-annotation-card .textcast-cancel{background:transparent;color:var(--lv-muted);padding-left:6px;padding-right:6px}.textcast-annotation-card .textcast-cancel:hover{color:var(--lv-fg)}.textcast-annotation-card .textcast-send{background:transparent;color:var(--lv-fg);border:1px solid var(--lv-line)}.textcast-annotation-card .textcast-send:hover{border-color:var(--lv-accent);color:var(--lv-accent)}.textcast-annotation-card .textcast-send-now{background:var(--lv-accent);color:var(--lv-on-accent)}.textcast-annotation-card .textcast-send-now:hover{background:var(--lv-accent-hover)}.textcast-annotation-card.is-dropping{outline:2px dashed var(--lv-accent);outline-offset:3px}.textcast-attachments{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-height:176px;overflow-y:auto}.textcast-attachment-chip{display:flex;align-items:center;gap:8px;padding:6px;border-radius:10px;background:var(--lv-field);border:1px solid var(--lv-border)}.textcast-attachment-chip.is-error{border-color:var(--lv-danger)}.textcast-attachment-thumb{width:32px;height:32px;border-radius:6px;object-fit:cover;background:var(--lv-border);flex:0 0 auto}.textcast-attachment-thumb-empty{display:inline-block}.textcast-attachment-body{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1 1 auto}.textcast-attachment-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.textcast-attachment-status{font-size:11px;color:var(--lv-muted)}.textcast-attachment-status-error{color:var(--lv-danger)}.textcast-attachment-retry{flex:0 0 auto;padding:4px 8px!important;font-size:11px!important;border-radius:8px;background:transparent;border:1px solid var(--lv-line)!important;color:var(--lv-fg);cursor:pointer}.textcast-attachment-remove{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0!important;border-radius:50%;background:transparent;color:var(--lv-muted);cursor:pointer;border:0}.textcast-attachment-remove:hover{background:var(--lv-border);color:var(--lv-fg)}.textcast-attach-row{margin-top:8px}.textcast-attach{display:inline-flex;align-items:center;gap:6px;padding:4px 6px!important;background:transparent!important;color:var(--lv-muted)!important;font-size:12px!important;font-weight:500!important}.textcast-attach:hover{color:var(--lv-accent)!important}.textcast-reveal-marker{position:fixed;pointer-events:none;border:2px solid var(--lv-accent);border-radius:6px;box-shadow:0 0 0 5px var(--lv-tint);animation:textcast-reveal-pulse 2.4s ease-out forwards}@keyframes textcast-reveal-pulse{0%{opacity:0}12%{opacity:1}70%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion:reduce){.textcast-ask,.textcast-annotation-card{animation:none}}`;
    shadow.appendChild(style);
    return shadow;
  }

  function closeCard() {
    const hadCard = activeCardContext !== null;
    activeCardContext = null;
    if (activeAttachments) {
      activeAttachments.destroy();
      activeAttachments = null;
    }
    if (shadow) {
      for (const el of [...shadow.querySelectorAll(".textcast-annotation-card")]) el.remove();
    }
    clearHighlight(selected);
    clearTextHighlight();
    selected = null;
    // Only a card that was open has state to retire. Reporting `card: null` with nothing open
    // (a page declaring data-textcast-annotate="off" closes at boot) would overwrite a stored
    // draft the chrome has not replayed yet, because that replay waits for the frame's load event.
    if (hadCard) scheduleReviewStateReport();
  }

  // Apple platforms use Cmd where others use Ctrl, both for shortcut hints and link-follow clicks.
  function isApplePlatform() {
    return /Mac|iP(hone|ad|od)/.test(navigator.platform);
  }

  function showAnnotationCard(target, options = {}) {
    cancelPendingDraftRestore();
    const root = ensureShadow();
    closeCard();

    const c = options.context || context(target);
    activeCardContext = c;
    let anchor = target;
    if (options.range) {
      highlightTextRange(options.range);
    } else {
      anchor = annotationTargetEl(target);
      selected = anchor;
      highlightElement(selected);
    }

    const rect = options.range ? options.range.getBoundingClientRect() : anchor.getBoundingClientRect();
    const card = document.createElement("div");
    card.className = "textcast-annotation-card";
    // A text note quotes the words it is about; an element note names the element.
    const heading =
      c.tag === "text"
        ? '<blockquote class="textcast-quote">' + escapeAnnotationText(c.text) + "</blockquote>"
        : '<div class="textcast-heading">' + escapeAnnotationText(t("Annotate <{tag}>", { tag: c.tag })) + "</div>";
    const placeholder = escapeAnnotationText(
      t(c.tag === "text" ? "Ask about this, or say what to change..." : "Tell the agent what to change..."),
    );
    const sendNowHint = isApplePlatform() ? "⌘" : "Ctrl";
    card.innerHTML =
      heading +
      '<textarea placeholder="' +
      placeholder +
      '"></textarea><div class="textcast-attachments" data-attachments hidden></div>' +
      '<div class="textcast-attach-row"><button class="textcast-attach" type="button">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' +
      "<span>" +
      escapeAnnotationText(t("Attach image")) +
      "</span></button>" +
      '<input class="textcast-attach-input" type="file" accept="' +
      ATTACHMENT_IMAGE_TYPES.accept +
      '" multiple hidden></div>' +
      '<div class="textcast-hint">' +
      escapeAnnotationText(t("Enter to queue · {key}+Enter to send", { key: sendNowHint })) +
      '</div><div class="textcast-row"><button class="textcast-cancel" type="button">' +
      escapeAnnotationText(t("Cancel")) +
      '</button><span class="textcast-row-gap"></span><button class="textcast-send" type="button">' +
      escapeAnnotationText(t("Queue")) +
      '</button><button class="textcast-send-now" type="button">' +
      escapeAnnotationText(t("Send")) +
      "</button></div>";
    root.appendChild(card);

    // Clamp the card fully inside the viewport. Called again whenever its height
    // changes (attachment chip rows are added/removed) so a grown card never pushes
    // its Queue/Cancel buttons off the bottom of the frame (W3). The anchor `rect` is
    // captured once; only the card's own measured size varies between calls.
    function positionCard() {
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - card.offsetWidth - 12);
      const top = Math.min(Math.max(12, rect.bottom + 8), window.innerHeight - card.offsetHeight - 12);
      card.style.left = left + "px";
      card.style.top = top + "px";
    }
    positionCard();

    const textarea = /** @type {HTMLTextAreaElement | null} */ (card.querySelector("textarea"));
    const cancelButton = /** @type {HTMLButtonElement | null} */ (card.querySelector(".textcast-cancel"));
    const sendButton = /** @type {HTMLButtonElement | null} */ (card.querySelector(".textcast-send"));
    const sendNowButton = /** @type {HTMLButtonElement | null} */ (card.querySelector(".textcast-send-now"));
    const attachmentsList = /** @type {HTMLDivElement | null} */ (card.querySelector("[data-attachments]"));
    const attachButton = /** @type {HTMLButtonElement | null} */ (card.querySelector(".textcast-attach"));
    const attachInput = /** @type {HTMLInputElement | null} */ (card.querySelector(".textcast-attach-input"));
    const attachNotice = /** @type {HTMLDivElement | null} */ (card.querySelector(".textcast-hint"));
    if (!textarea || !cancelButton || !sendButton || !attachmentsList || !attachButton || !attachInput) return;

    // The card has one notice line, shared by the neutral keyboard hint and by
    // attachment problems (the count cap, a stalled upload, a failed one). A rejected
    // drop is an error, so it must not inherit the hint's passive gray - it renders in
    // the error color until cleared, and clearing restores the hint rather than
    // leaving stale red text behind.
    const defaultHintHtml = attachNotice ? attachNotice.innerHTML : "";
    const notify = (message) => {
      if (!attachNotice) return;
      if (message) {
        attachNotice.textContent = message;
        attachNotice.classList.add("textcast-hint-alert");
      } else {
        attachNotice.innerHTML = defaultHintHtml;
        attachNotice.classList.remove("textcast-hint-alert");
      }
    };
    const attachments = makeAttachmentsController(attachmentsList, { notify, onLayout: positionCard });
    activeAttachments = attachments;

    attachButton.onclick = () => attachInput.click();
    attachInput.addEventListener("change", () => {
      attachments.addFiles(attachInput.files);
      attachInput.value = "";
    });
    textarea.addEventListener("paste", (event) => {
      const { images, keepTextPaste } = planClipboardPaste(event.clipboardData, ATTACHMENT_ACCEPTED_MIME);
      if (images.length && attachments.addFiles(images) && !keepTextPaste) event.preventDefault();
    });
    card.addEventListener("dragover", (event) => {
      // Accept ANY file drag so the drop lands on the card (and is preventable)
      // instead of the browser navigating to a dropped non-image.
      if (dataTransferHasFiles(event.dataTransfer)) {
        event.preventDefault();
        card.classList.add("is-dropping");
      }
    });
    card.addEventListener("dragleave", (event) => {
      if (event.target === card) card.classList.remove("is-dropping");
    });
    card.addEventListener("drop", (event) => {
      // Intercept every drop over the card so a dropped PDF/other file can never
      // navigate the frame away, then partial-accept: attach the images and raise
      // one UNSUPPORTED_TYPE chip per file that cannot be attached.
      event.preventDefault();
      card.classList.remove("is-dropping");
      const { images, unsupported } = partitionDroppedFiles(event.dataTransfer, ATTACHMENT_ACCEPTED_MIME);
      if (images.length) attachments.addFiles(images);
      if (unsupported.length) attachments.rejectUnsupportedBatch(unsupported);
      // Some drags expose no enumerable files or items (only a "Files" type hint),
      // so nothing can be partitioned; still tell the user the drop was refused.
      if (!images.length && !unsupported.length && dataTransferHasFiles(event.dataTransfer)) {
        attachments.rejectUnsupported("file");
      }
    });

    // Try to queue the card. Returns true only if a prompt was actually queued, so
    // the caller knows whether a follow-up "send now" should fire. Gates on any
    // still-uploading attachment (R2.4): queuing then would silently drop it, so we
    // keep the card open and tell the user to wait instead. Also gates on any errored
    // attachment (W2): collectReady drops errors and closeCard tears down the card, so
    // queuing would discard the failed image and its retry/remove UI - keep the card
    // open so the user can retry or explicitly remove it first.
    function tryQueue() {
      if (attachments.hasPending()) {
        attachments.setQueueBlocked(true);
        return false;
      }
      if (attachments.hasErrors()) {
        attachments.setQueueBlocked(true);
        return false;
      }
      attachments.setQueueBlocked(false);
      const prompt = textarea.value.trim();
      const readyAttachments = attachments.collectReady();
      // Allow an image-only annotation (the element/target still identifies what it
      // refers to), but never queue an empty card.
      if (prompt || readyAttachments.length) {
        queuePrompt(prompt, { ...c, queueKey: "", attachments: readyAttachments });
      }
      closeCard();
      return true;
    }

    cancelButton.onclick = closeCard;
    sendButton.onclick = () => {
      tryQueue();
    };
    if (sendNowButton) {
      sendNowButton.onclick = () => {
        const sendNow = !!textarea.value.trim() || attachments.hasReady();
        // postMessage delivery is ordered, so the queued prompt lands before the send.
        if (tryQueue() && sendNow) sendQueuedPrompts();
      };
    }
    textarea.addEventListener("keydown", (event) => {
      // WebKit fires compositionend before the IME-confirming keydown, leaving only keyCode 229 to mark it.
      if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) {
        event.preventDefault();
        const sendNow = (event.ctrlKey || event.metaKey) && (!!textarea.value.trim() || attachments.hasReady());
        const queued = tryQueue();
        // postMessage delivery is ordered, so the queued prompt lands before the send.
        if (queued && sendNow) sendQueuedPrompts();
      } else if (event.key === "Escape" && !event.isComposing && event.keyCode !== 229) {
        // Close only when there is nothing to lose; excludes isComposing since mid-IME text isn't in textarea.value yet.
        if (textarea.value.trim() || attachments.hasPending() || attachments.hasErrors() || attachments.hasReady())
          return;
        event.preventDefault();
        closeCard();
      }
    });
    // Unsent annotation text is review context Textcast Chat owns, so it is reported to the chrome and
    // replayed after a live reload.
    textarea.addEventListener("input", scheduleReviewStateReport);
    if (typeof options.restoreText === "string") {
      textarea.value = options.restoreText;
      // Re-report immediately so restored text survives a second reload too, rather than only
      // living until the next keystroke.
      scheduleReviewStateReport();
    }
    setTimeout(() => textarea.focus(), 0);
  }

  function dataTransferHasFiles(dataTransfer) {
    if (!dataTransfer) return false;
    if ((dataTransfer.files || []).length) return true;
    for (const item of dataTransfer.items || []) {
      if (item.kind === "file") return true;
    }
    return (dataTransfer.types || []).includes?.("Files");
  }

  // Asks the chrome to mirror the page's live title and/or icon onto the outer browser tab. The
  // chrome owns the validation (length cap, SVG data: icons only); a string sets the field, `null`
  // restores what the tab loaded with, and a field left out stays as it is.
  /** @param {{ title?: string | null, icon?: string | null }} [meta] */
  function setDocumentMeta(meta) {
    /** @type {{ title?: string | null, icon?: string | null }} */
    const payload = {};
    for (const field of /** @type {const} */ (["title", "icon"])) {
      const value = meta?.[field];
      if (typeof value === "string" || value === null) payload[field] = value;
    }
    postArtifactMessage("textcast:documentMeta", payload);
  }

  /** @type {Window & { textcast?: unknown }} */ (window).textcast = {
    queuePrompt,
    sendQueuedPrompts,
    endSession,
    getQueuedPrompts: () => [],
    setStatus: (message) => postArtifactMessage("textcast:status", { message: String(message) }),
    setDocumentMeta,
  };

  window.addEventListener("message", (event) => {
    // The chrome is the only legitimate sender. This listener is on `window`, so
    // without the source check the artifact could post to itself and drive the SDK.
    if (event.source !== parent) return;
    const msg = event.data || {};
    if (msg.type === "textcast:setAnnotationMode") setAnnotationMode(msg.enabled);
    if (msg.type === "textcast:attachmentResult") {
      if (!isTrustedAttachmentResult(event, { parentWindow: parent, nonce: ATTACHMENT_NONCE })) return;
      activeAttachments?.handleResult(msg.localId, msg.ok, msg.id, msg.error);
    }
    if (msg.type === "textcast:requestSnapshot") {
      postArtifactMessage("textcast:snapshot", {
        snapshot: "",
        snapshot_request_id: typeof msg.snapshot_request_id === "string" ? msg.snapshot_request_id : "",
      });
    }
    if (msg.type === "textcast:restoreScroll") {
      window.scrollTo(Number(msg.x) || 0, Number(msg.y) || 0);
    }
    if (msg.type === "textcast:restoreReviewState") restoreReviewState(msg.state);
    if (msg.type === "textcast:revealElement") revealElement(msg.selector);
  });

  // Bring an element into view and flash it. The marker is Textcast Chat UI and is never annotatable.
  function revealElement(selector) {
    const target = selector === "html" ? document.documentElement : safeQuerySelector(selector);
    if (!(target instanceof Element)) return;
    target.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    const root = ensureShadow();
    for (const el of [...root.querySelectorAll(".textcast-reveal-marker")]) el.remove();
    const rect = target.getBoundingClientRect();
    const marker = document.createElement("div");
    marker.className = "textcast-reveal-marker";
    marker.style.left = rect.left + "px";
    marker.style.top = rect.top + "px";
    marker.style.width = Math.max(rect.width, 4) + "px";
    marker.style.height = Math.max(rect.height, 4) + "px";
    root.appendChild(marker);
    window.setTimeout(() => marker.remove(), 2400);
  }

  // Capture phase so the mode hotkey fires no matter where focus is inside the artifact -
  // including a checkbox, button, link, or the annotation-card textarea - without disturbing
  // normal typing. This SDK doesn't own the mode state; it asks the chrome to toggle the same
  // state the on-screen switch drives, via the same postMessage protocol as setAnnotationMode.
  document.addEventListener(
    "keydown",
    (event) => {
      if (!isModeToggleHotkeyEvent(event)) return;
      event.preventDefault();
      postArtifactMessage("textcast:toggleAnnotationMode");
    },
    true,
  );

  // Report scroll position to the chrome so it can be restored across hot reloads.
  // The iframe is sandboxed without same-origin, so the chrome can't read scrollY directly.
  let scrollFrame = 0;
  window.addEventListener(
    "scroll",
    () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        postArtifactMessage("textcast:scroll", { x: window.scrollX, y: window.scrollY });
      });
    },
    { passive: true },
  );

  // Annotation is text-first: selecting words offers a small Ask button beside the selection, and
  // only that button opens the card. The page's own clicks, links, and controls are never
  // intercepted, so a reading page stays fully usable while annotation is on.
  function hideAskButton() {
    offeredSelection = null;
    if (askButton) askButton.remove();
    askButton = null;
  }

  function positionAskButton() {
    if (!askButton || !offeredSelection) return;
    const rects = [...offeredSelection.range.getClientRects()].filter((rect) => rect.width > 0 && rect.height > 0);
    const last = rects[rects.length - 1] || offeredSelection.range.getBoundingClientRect();
    const first = rects[0] || last;
    const width = askButton.offsetWidth;
    const height = askButton.offsetHeight;
    const left = Math.min(Math.max(8, last.right - width / 2), window.innerWidth - width - 8);
    let top = last.bottom + 8;
    if (top + height > window.innerHeight - 8) top = Math.max(8, first.top - height - 8);
    askButton.style.left = left + "px";
    askButton.style.top = top + "px";
  }

  function offerSelection() {
    if (!annotationMode || activeCardContext) return hideAskButton();
    const c = textSelectionContext(document.getSelection());
    if (!c) return hideAskButton();
    offeredSelection = c;
    if (!askButton) {
      const root = ensureShadow();
      askButton = document.createElement("button");
      askButton.type = "button";
      askButton.className = "textcast-ask";
      askButton.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg><span>' +
        escapeAnnotationText(t("Ask")) +
        "</span>";
      // Keep the page selection alive while the button is pressed.
      askButton.addEventListener("mousedown", (event) => event.preventDefault());
      askButton.addEventListener("click", () => {
        const offered = offeredSelection;
        hideAskButton();
        if (offered) showAnnotationCard(offered.element, { context: offered, range: offered.range });
      });
      root.appendChild(askButton);
    }
    positionAskButton();
  }

  let selectionTimer = 0;
  function scheduleSelectionOffer(delay) {
    window.clearTimeout(selectionTimer);
    selectionTimer = window.setTimeout(offerSelection, delay);
  }
  document.addEventListener(
    "pointerdown",
    (event) => {
      if (isTextcastUi(event.target)) return;
      pointerSelecting = true;
      hideAskButton();
    },
    true,
  );
  document.addEventListener(
    "pointerup",
    (event) => {
      pointerSelecting = false;
      if (!isTextcastUi(event.target)) scheduleSelectionOffer(0);
    },
    true,
  );
  // A drag that ends outside this frame never delivers its pointerup here; the next move with no
  // button held closes the gesture instead, so the selection still gets its Ask button.
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!pointerSelecting || event.buttons !== 0) return;
      pointerSelecting = false;
      scheduleSelectionOffer(0);
    },
    true,
  );
  // Keyboard selection and touch selection handles end without a pointerup on the page.
  document.addEventListener("selectionchange", () => {
    if (pointerSelecting) return;
    scheduleSelectionOffer(250);
  });
  window.addEventListener("scroll", () => positionAskButton(), { passive: true });
  window.addEventListener("resize", () => positionAskButton(), { passive: true });

  setAnnotationMode(annotationMode);
  // Report the page default once; subsequent mode changes belong to the chrome.
  postArtifactMessage("textcast:annotationMode", { enabled: initialAnnotationMode });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reportReady, { once: true });
  } else {
    reportReady();
  }

  // Report the agent-declared revision registry so the chrome can offer its
  // legend. Read-only: the SDK never marks up the page for it, because a
  // highlight painted here would make the served artifact differ from the file
  // opened without textcast. The message is sent even when the artifact declares
  // nothing, so a reload that removed the registry clears a stale legend.
  function reportArtifactRevisions() {
    let payload = { revisions: [], marks: [] };
    try {
      payload = readArtifactRevisions(document);
    } catch {
      // A malformed registry costs the reader a legend, never the review.
    }
    postArtifactMessage("textcast:revisions", payload);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", reportArtifactRevisions, { once: true });
  } else {
    reportArtifactRevisions();
  }
}
