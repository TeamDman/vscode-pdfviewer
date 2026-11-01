const { test } = require('node:test');
const assert = require('node:assert/strict');
const { renderPreview, escapeAttribute } = require('./preview-helper.cjs');
test('webview escapes settings and confines scripts and connections', async () => {
  assert.equal(escapeAttribute('&"<\'>'), '&amp;&quot;&lt;&#39;&gt;');
  const html = await renderPreview('https://webview.example');
  assert.match(
    html,
    /script-src https:\/\/webview.example &apos;wasm-unsafe-eval&apos;|script-src https:\/\/webview.example &#39;wasm-unsafe-eval&#39;/,
  );
  assert.match(html, /connect-src https:\/\/webview.example;/);
  assert.doesNotMatch(html, /script-src[^;]*(?:unsafe-inline|["']unsafe-eval)/);
  assert.match(html, /src="https:\/\/webview.example\/lib\/build\/pdf.mjs"/);
  assert.match(html, /src="https:\/\/webview.example\/lib\/web\/viewer.mjs"/);
});
