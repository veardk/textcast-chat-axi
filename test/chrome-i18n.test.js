import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { chromeLangAttrs, chromeLocale, chromeStrings, makeTranslator } from "../src/chrome-i18n.js";
import { createChromeHtml, createSdkJs, extractArtifactHead } from "../src/server.js";

test("the page language picks the chrome locale", () => {
  for (const lang of ["zh", "zh-CN", "zh-Hans", "zh_cn", "ZH-Hans-CN"]) assert.equal(chromeLocale(lang), "zh");
  for (const lang of ["zh-Hant", "zh-TW", "zh-HK", "zh-Hant-TW"]) assert.equal(chromeLocale(lang), "zh-Hant");
  for (const [lang, locale] of [
    ["ja", "ja"],
    ["ko-KR", "ko"],
    ["fr", "fr"],
    ["de-DE", "de"],
    ["es-419", "es"],
    ["pt-BR", "pt"],
    ["it", "it"],
    ["ru", "ru"],
    ["ar", "ar"],
    ["hi", "hi"],
    ["vi", "vi"],
    ["th", "th"],
    ["id", "id"],
    ["tr", "tr"],
  ]) {
    assert.equal(chromeLocale(lang), locale);
  }
  for (const lang of ["", "en", "en-US", "xx", "nl"]) assert.equal(chromeLocale(lang), "en");
});

// Every Textcast page language gets a full chrome: the same keys as Chinese, the same `{name}`
// placeholders in each string, and no empty translation.
test("every locale translates every chrome string with the same placeholders", () => {
  const reference = chromeStrings("zh");
  const placeholders = (text) => [...text.matchAll(/\{\w+\}/g)].map((m) => m[0]).sort();
  for (const locale of [
    "zh-Hant",
    "ja",
    "ko",
    "fr",
    "de",
    "es",
    "pt",
    "it",
    "ru",
    "ar",
    "hi",
    "vi",
    "th",
    "id",
    "tr",
  ]) {
    const strings = chromeStrings(locale);
    assert.deepEqual(Object.keys(strings).sort(), Object.keys(reference).sort(), locale);
    for (const [english, text] of Object.entries(strings)) {
      assert.ok(text.trim(), `${locale}: ${english}`);
      assert.deepEqual(placeholders(text), placeholders(english), `${locale}: ${english}`);
    }
  }
});

test("the chrome page declares its language and direction", () => {
  assert.deepEqual(chromeLangAttrs("zh"), { lang: "zh-CN", dir: "ltr" });
  assert.deepEqual(chromeLangAttrs("zh-Hant"), { lang: "zh-Hant", dir: "ltr" });
  assert.deepEqual(chromeLangAttrs("ar"), { lang: "ar", dir: "rtl" });
  assert.deepEqual(chromeLangAttrs("en"), { lang: "en", dir: "ltr" });
  const arabic = createChromeHtml({ key: "abc", file: "/tmp/artifact.html" }, { locale: "ar" });
  assert.match(arabic, /<html lang="ar" dir="rtl">/);
  assert.match(arabic, /<h2>المحادثة<\/h2>/);
  const arabicSdk = createSdkJs("abc", 0, "", { locale: "ar" });
  assert.match(arabicSdk, /"dir":"rtl"/);
  // The card's `:host{all:initial}` resets direction, so the SDK has to add it back for RTL pages.
  assert.match(arabicSdk, /options\.dir === "rtl"\) style\.textContent \+= ":host\{direction:rtl\}"/);
  assert.match(createSdkJs("abc", 0, "", { locale: "ja" }), /"dir":"ltr"/);
  const japanese = createChromeHtml({ key: "abc", file: "/tmp/artifact.html" }, { locale: "ja" });
  assert.match(japanese, /<html lang="ja" dir="ltr">/);
  assert.match(japanese, /id="send" type="button">送信<\/button>/);
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
  assert.match(html, /<html lang="zh-CN" dir="ltr">/);
  assert.match(html, /<h2>对话<\/h2>/);
  assert.match(html, /id="send" type="button">发送<\/button>/);
  assert.match(html, /window\.__textcastT=/);
  assert.doesNotMatch(html.match(/window\.__textcastT=[\s\S]*?<\/script>/)?.[0].slice(0, -9) || "", /<\/script/i);

  const sdk = createSdkJs("abc", 0, "", { locale: "zh" });
  assert.match(sdk, /const makeTranslator=/);
  assert.match(sdk, /"Ask":"提问"/);

  const english = createChromeHtml({ key: "abc", file: "/tmp/artifact.html" });
  assert.match(english, /<html lang="en" dir="ltr">/);
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
