import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { chromeLocale, chromeStrings, makeTranslator } from "../src/chrome-i18n.js";
import { createChromeHtml, createSdkJs, extractArtifactHead } from "../src/server.js";

test("the page language picks the chrome locale", () => {
  for (const lang of ["zh", "zh-CN", "zh-Hans", "zh_cn", "ZH-Hans-CN"]) assert.equal(chromeLocale(lang), "zh");
  for (const lang of ["", "en", "en-US", "ja", "zh-Hant", "zh-TW", "zh-HK"]) assert.equal(chromeLocale(lang), "en");
});

test("the translator falls back to English and translates formatted strings", () => {
  const t = makeTranslator(chromeStrings("zh"));
  assert.equal(t("Send to Agent"), "发送");
  assert.equal(t("3 queued"), "3 条待发送");
  assert.equal(t(" (2 queued)"), "（2 条待发送）");
  assert.equal(t("Reveal 2/5"), "定位 2/5");
  assert.equal(t("Enter to queue · {key}+Enter to send", { key: "⌘" }), "Enter 加入待发送 · ⌘+Enter 直接发送");
  assert.equal(t("Something nobody translated"), "Something nobody translated");
  const en = makeTranslator(chromeStrings("en"));
  assert.equal(en("3 queued"), "3 queued");
});

test("the artifact head reports its language", () => {
  assert.equal(extractArtifactHead('<!doctype html><html lang="zh-CN" dir="ltr"><head>').lang, "zh-CN");
  assert.equal(extractArtifactHead("<html><head>").lang, "");
});

test("a Chinese page gets a Chinese chrome and Ask card", () => {
  const html = createChromeHtml({ key: "abc", file: "/tmp/artifact.html" }, { locale: "zh" });
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<h2>对话<\/h2>/);
  assert.match(html, /id="send" type="button">发送<\/button>/);
  assert.match(html, /window\.__textcastT=/);
  assert.doesNotMatch(html.match(/window\.__textcastT=[\s\S]*?<\/script>/)?.[0].slice(0, -9) || "", /<\/script/i);

  const sdk = createSdkJs("abc", 0, "", { locale: "zh" });
  assert.match(sdk, /const makeTranslator=/);
  assert.match(sdk, /"Ask":"提问"/);

  const english = createChromeHtml({ key: "abc", file: "/tmp/artifact.html" });
  assert.match(english, /<html lang="en">/);
  assert.match(english, /id="send" type="button">Send to Agent<\/button>/);
});

// Every literal handed to t() must have a Chinese entry (exactly, or through a `{name}` pattern),
// so a reworded English string cannot silently stay English on a Chinese page.
test("every translated literal has a Chinese string", async () => {
  const t = makeTranslator(chromeStrings("zh"));
  const sources = await Promise.all(
    ["../src/chrome-client.js", "../src/artifact-sdk.js", "../src/server.js"].map((file) =>
      readFile(new URL(file, import.meta.url), "utf8"),
    ),
  );
  const missing = [];
  for (const source of sources) {
    for (const match of source.matchAll(/\b(?:t|tx|T)\(\s*"((?:[^"\\]|\\.)+)"\s*[,)]/g)) {
      const english = JSON.parse('"' + match[1] + '"');
      const hasVars = /\{\w+\}/.test(english);
      if ((hasVars ? t(english, {}) : t(english)) === english) missing.push(english);
    }
  }
  assert.deepEqual(missing, []);
});

test("the player is the video alone, with a grip, a close button, and resizable edges", () => {
  const html = createChromeHtml({ key: "abc", file: "/tmp/artifact.html" }, { locale: "zh" });
  const dock = html.match(/<aside class="player-dock"[\s\S]*?<\/aside>/)?.[0] || "";
  assert.match(dock, /id="playerGrip"/);
  assert.match(dock, /id="playerClose"[^>]*aria-label="关闭播放器"/);
  for (const edge of ["n", "s", "e", "w", "nw", "ne", "sw", "se"]) {
    assert.match(dock, new RegExp(`class="player-resize" data-edge="${edge}"`));
  }
  assert.doesNotMatch(dock.replace(/<[^>]*>/g, ""), /\S/);
});
