import { CJK_STRINGS } from "./chrome-locales/cjk.js";
import { EUROPEAN_STRINGS } from "./chrome-locales/european.js";
import { OTHER_STRINGS } from "./chrome-locales/other.js";

// The chrome and the in-page Ask card speak the page's language. The server reads the artifact's
// `<html lang>`, picks a locale here, and hands its strings to both. English is the source text and
// the key: a locale only lists what it translates, so a missing entry falls back to English instead
// of breaking. A key may hold `{name}` placeholders; `makeTranslator` then also translates the
// already-formatted English (numbers, file names filled in), so call sites can stay as they are.

/** @type {Record<string, Record<string, string>>} */
const CHROME_STRINGS = {
  ...CJK_STRINGS,
  ...EUROPEAN_STRINGS,
  ...OTHER_STRINGS,
  zh: {
    // Panel and launcher
    Conversation: "对话",
    "Show conversation": "打开对话",
    "Hide conversation": "收起对话",
    "Minimize conversation": "收起对话",
    Minimize: "收起",
    "New reply": "新回复",
    "{n} queued": "{n} 条待发送",
    " ({n} queued)": "（{n} 条待发送）",
    " (new reply)": "（有新回复）",
    "Session ended": "会话已结束",
    "Agent is working…": "智能体正在处理…",
    "External listener active": "外部监听已连接",
    "Agent listening": "智能体在线",
    "Agent not listening": "智能体未在线",
    More: "更多",
    Revisions: "修订记录",
    "The agent declares these in the page itself. Reveal points at the next block it marked for that revision; nothing about the page is restyled.":
      "修订记录由智能体写在页面里。点“定位”会指向该次修订标记的下一处内容，不会改动页面样式。",
    Reveal: "定位",
    "Reveal {pos}/{total}": "定位 {pos}/{total}",
    "Reveal the next block changed in {label}": "定位“{label}”修改的下一处内容",
    "Ask about selected text": "划选文字提问",
    "Toggle annotate/explore mode": "开关划词提问",
    Editing: "正在编辑",
    "Copy path": "复制路径",
    Copy: "复制",
    Copied: "已复制",
    "Reload page": "重新载入页面",
    "End session": "结束会话",
    "Take over here": "在这里接管",
    "Check and reload": "检查并重新载入",
    Dismiss: "关闭",
    Reload: "重新载入",
    "Message the agent, or select text on the page to ask about it": "给智能体发消息，或在页面上划选文字提问",
    "Select any sentence on the page to ask about it, or write a message below.":
      "在页面上划选任意一句话就能提问，也可以在下方直接给智能体发消息。",
    "Attach images": "添加图片",
    "Send everything and end the session": "全部发送并结束会话",
    "Send & End": "发送并结束",
    "Send to Agent": "发送",
    "Session ended.": "会话已结束。",
    "To talk here again, copy this and send it to any agent.": "想在这里继续对话，复制下面这段发给任意一个智能体。",
    "Talk with me in this Textcast window:": "用这个 Textcast 窗口和我对话：",
    "Then follow the next_step it prints.": "运行后按它输出的 next_step 继续。",
    "This review is open in another Textcast Chat tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "这个页面已在另一个标签页打开。未发送的内容只保存在输入它的标签页里，在这里接管不会带过来。",
    "The agent is offline.": "智能体已离线。",
    "Connecting to the agent\u2026": "正在连接智能体…",

    // Bubbles and receipts
    Agent: "智能体",
    You: "我",
    Queued: "待发送",
    "Sending…": "发送中…",
    Cancel: "取消",
    Save: "保存",
    "Edit queued prompt": "编辑待发送内容",
    "Remove queued prompt": "删除待发送内容",
    "Image message": "图片消息",
    "Image annotation": "图片批注",
    "Image expired": "图片已过期",
    "{n} more image": "还有 {n} 张图片",
    "{n} more images": "还有 {n} 张图片",
    Seen: "已读",
    Working: "处理中",
    Done: "完成",
    "Seen: not yet": "尚未读取",
    "Working: not yet": "尚未开始处理",
    "Done: not yet": "尚未完成",
    "No agent is listening": "智能体未在线",
    Delivering: "正在送达",
    "Agent is busy; delivered on its next poll": "智能体正忙，下次监听时送达",
    "Unsent annotation": "未发送的批注",
    "The artifact removed or replaced what this note was attached to, so Textcast Chat could not keep it open. Your text is kept here:":
      "页面里这条批注对应的内容被删除或替换了，批注无法保留在原处。你写的内容保存在这里：",

    // Send hints and failures
    "Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "未发送的内容只保存在输入它的标签页里，在别的窗口接管不会带过去。",
    "Nothing queued in this tab. Unsent answers stay in the tab or window where you entered them; taking over in another window does not bring them along.":
      "这个标签页里没有待发送的内容。未发送的内容只保存在输入它的标签页里，在别的窗口接管不会带过去。",
    "Nothing to send. To end without feedback, use End session in the More menu (⋮).":
      "没有可发送的内容。如果想直接结束，请在“更多”菜单（⋮）里选“结束会话”。",
    "Still trying to send. Your feedback is saved in this tab. Keep this tab open while Textcast Chat catches up, and check that the server is running.":
      "仍在尝试发送。内容已保存在这个标签页，请保持页面打开，并确认审阅服务仍在运行。",
    "Could not send. Your feedback is still queued in this tab. Check that Textcast Chat is running, then click Send to Agent to retry.":
      "发送失败，内容仍在待发送列表里。请确认审阅服务在运行，然后再点“发送”。",
    "Could not send. Your terminal feedback is still queued in this tab. Check that Textcast Chat is running, then click Send & End to retry the same batch.":
      "发送失败，内容仍在待发送列表里。请确认审阅服务在运行，然后再点“发送并结束”。",
    "Could not finish preparing all feedback within 5 seconds. This review remains open, and existing queued feedback is still editable.":
      "5 秒内没能准备好全部内容。会话仍然开着，待发送的内容还可以编辑。",
    "Could not send because this feedback is too large. It is still queued. Remove some feedback or attachments, then try again.":
      "内容太大，发送失败，仍在待发送列表里。请删掉一些内容或图片后再试。",
    "Not sent — {detail}. Remove or fix the image, then send again.": "未发送：{detail}。请删除或更换图片后再发送。",
    "more than {n} images on one prompt": "一条消息超过 {n} 张图片",
    "too many images queued at once": "一次排队的图片太多",
    "an image attachment was malformed": "有图片格式损坏",
    "an image is no longer available": "有图片已失效",
    "some attachments could not be delivered": "部分图片无法送达",

    // Attachments
    "Uploading…": "上传中…",
    "Upload failed": "上传失败",
    Retry: "重试",
    Remove: "删除",
    "Retry {name}": "重试 {name}",
    "Remove {name}": "删除 {name}",
    "Remove image": "删除图片",
    "Could not read image": "无法读取图片",
    "Waiting for an image to finish uploading…": "正在等待图片上传完成…",
    "An image couldn't be attached. Retry or remove it before sending.": "有图片没能添加，请重试或删掉后再发送。",
    "An image couldn't be attached. Retry or remove it before queuing.": "有图片没能添加，请重试或删掉后再加入待发送。",
    "You can attach up to {n} image.": "最多可以添加 {n} 张图片。",
    "You can attach up to {n} images.": "最多可以添加 {n} 张图片。",
    "Image is larger than the {limit} limit": "图片超过 {limit} 的大小限制",
    "Unsupported file type. Use {types}.": "不支持这种文件，请使用 {types}。",
    "Too many uploads. Wait a moment and retry.": "上传太频繁，请稍后再试。",
    "Upload limit reached for this session ({limit}).": "本次会话的上传额度已用完（{limit}）。",
    "Too many uploads in flight. Wait a moment and retry.": "同时上传的图片太多，请稍后再试。",

    // Server and load notices
    "Textcast Chat was updated. This page is running the previous version.": "审阅服务已更新，这个页面还是旧版本。",
    "Textcast Chat was restarted to pick up a local build. This page is running the copy the previous server sent.":
      "审阅服务已重启并换成了本地构建，这个页面还是之前的版本。",
    "Textcast Chat was restarted. This page is running the copy the previous server sent.":
      "审阅服务已重启，这个页面还是之前的版本。",
    "Textcast Chat was stopped. Reload after you start it again.": "审阅服务已停止，重新启动后再刷新页面。",
    "The Textcast Chat server this page was connected to is no longer running. Reloading will work once it is running again.":
      "这个页面连接的审阅服务已不在运行，等它重新运行后刷新即可。",
    "Textcast Chat did not answer.": "审阅服务没有响应。",
    "Textcast Chat did not answer the check, so this page cannot tell whether it is running. Try again in a moment.":
      "审阅服务没有响应检查，无法确定它是否在运行。请稍后再试。",
    "Textcast Chat could not load this artifact.": "页面没能载入。",
    "The Textcast Chat server did not answer this review's load request. It usually restarted while this page was opening. Check and reload to reconnect.":
      "审阅服务没有响应载入请求，通常是页面打开时服务刚好重启了。点“检查并重新载入”重新连接。",
    "Textcast Chat is still not answering. Start it again with your agent, then use Check and reload.":
      "审阅服务仍然没有响应。请让智能体重新启动它，然后点“检查并重新载入”。",
    "This review is already open in another tab.": "这个页面已在另一个标签页打开。",
    "Textcast Chat is not running.": "审阅服务没有运行。",
    "The Textcast Chat server restarted and did not come back. Start it again with your agent, then check and reload this page.":
      "审阅服务重启后没有恢复。请让智能体重新启动它，然后检查并重新载入页面。",
    "Textcast Chat is still not running. Start it again with your agent, then use Check and reload.":
      "审阅服务仍然没有运行。请让智能体重新启动它，然后点“检查并重新载入”。",
    "Textcast Chat is still not running. Start it again, then use Check and reload.":
      "审阅服务仍然没有运行。请重新启动它，然后点“检查并重新载入”。",
    "Textcast Chat could not finish loading.": "页面没能载入完成。",
    "The Textcast Chat editor script did not load. The server usually restarted while this page was opening. Check and reload to reconnect.":
      "审阅界面的脚本没有载入，通常是页面打开时服务刚好重启了。点“检查并重新载入”重新连接。",

    // The video player
    "Now playing": "正在播放原片",
    "Close player": "关闭播放器",
    "Play the video when a line is clicked": "点击文字时播放视频",

    // The in-page Ask card
    Ask: "提问",
    "Ask about this, or say what to change...": "针对这段提问，或说说要怎么改…",
    "Tell the agent what to change...": "告诉智能体要怎么改…",
    "Attach image": "添加图片",
    "Enter to queue · {key}+Enter to send": "Enter 加入待发送 · {key}+Enter 直接发送",
    Queue: "待发送",
    Send: "发送",
    "Annotate <{tag}>": "批注 <{tag}>",
  },
};

/** Locales written right to left; the chrome mirrors its layout for them. */
const RTL_LOCALES = new Set(["ar"]);

/**
 * The supported locale for a page language tag, or "en". Chinese splits by script: Traditional
 * (`zh-Hant`, `zh-TW`, `zh-HK`, `zh-MO`) and Simplified (everything else). Other tags match on their
 * primary subtag, so `pt-BR` and `es-419` find `pt` and `es`. These are the same languages a
 * Textcast page can be written in.
 * @param {string} lang
 */
export function chromeLocale(lang) {
  const tag = String(lang || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  const primary = tag.split("-")[0];
  if (primary === "zh") return /-(hant|tw|hk|mo)(-|$)/.test(tag) ? "zh-Hant" : "zh";
  return Object.hasOwn(CHROME_STRINGS, primary) ? primary : "en";
}

/**
 * The `lang` and `dir` attributes the chrome page declares for a locale.
 * @param {string} locale
 */
export function chromeLangAttrs(locale) {
  const known = locale === "en" || Object.hasOwn(CHROME_STRINGS, locale);
  return {
    lang: !known ? "en" : locale === "zh" ? "zh-CN" : locale,
    dir: RTL_LOCALES.has(locale) ? "rtl" : "ltr",
  };
}

/** @param {string} locale */
export function chromeStrings(locale) {
  return CHROME_STRINGS[locale] || {};
}

/**
 * A `t(english, vars?)` over one locale's strings. Serialized into the chrome and the SDK bundle, so
 * it may reference only its own argument and browser globals.
 * @param {Record<string, string>} strings
 */
export function makeTranslator(strings) {
  const table = strings && typeof strings === "object" ? strings : {};
  const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
  const patterns = [];
  for (const source of Object.keys(table)) {
    if (!/\{\w+\}/.test(source)) continue;
    const names = [];
    const body = source
      .split(/(\{\w+\})/)
      .map((part) => {
        const slot = /^\{(\w+)\}$/.exec(part);
        if (slot) {
          names.push(slot[1]);
          return "([\\s\\S]+?)";
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      })
      .join("");
    patterns.push({ re: new RegExp("^" + body + "$"), names, target: table[source] });
  }
  return function t(text, vars) {
    const source = String(text);
    if (vars) return fill(Object.prototype.hasOwnProperty.call(table, source) ? table[source] : source, vars);
    if (Object.prototype.hasOwnProperty.call(table, source)) return table[source];
    for (const pattern of patterns) {
      const match = pattern.re.exec(source);
      if (!match) continue;
      const found = {};
      pattern.names.forEach((name, index) => (found[name] = match[index + 1]));
      return fill(pattern.target, found);
    }
    return source;
  };
}
