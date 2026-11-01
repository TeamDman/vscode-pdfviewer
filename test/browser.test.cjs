const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

function pdf(text, pages = 3) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Count ' +
      pages +
      ' /Kids [' +
      Array.from({ length: pages }, (_, i) => 4 + i * 2 + ' 0 R').join(' ') +
      '] >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  for (let i = 0; i < pages; i++) {
    objects.push(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 3 0 R >> >> /Contents ' +
        (5 + i * 2) +
        ' 0 R >>',
    );
    const content =
      'BT /F1 24 Tf 50 700 Td (' + text + ' page ' + (i + 1) + ') Tj ET';
    objects.push(
      '<< /Length ' +
        content.length +
        ' >>\nstream\n' +
        content +
        '\nendstream',
    );
  }
  let result = '%PDF-1.7\n';
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(result.length);
    result += i + 1 + ' 0 obj\n' + obj + '\nendobj\n';
  });
  const start = result.length;
  result +=
    'xref\n0 ' +
    (objects.length + 1) +
    '\n0000000000 65535 f \n' +
    offsets
      .slice(1)
      .map((x) => String(x).padStart(10, '0') + ' 00000 n \n')
      .join('');
  return Buffer.from(
    result +
      'trailer\n<< /Size ' +
      (objects.length + 1) +
      ' /Root 1 0 R >>\nstartxref\n' +
      start +
      '\n%%EOF',
  );
}

test(
  'real PDF.js preserves external focus and view across rebuilds',
  { timeout: 120000 },
  async () => {
    let bytes = pdf('Before');
    let pdfReads = 0;
    const root = path.resolve(__dirname, '..');
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, 'http://localhost');
      res.setHeader('Cache-Control', 'no-store');
      if (url.pathname === '/favicon.ico') {
        res.statusCode = 204;
        res.end();
        return;
      }
      if (url.pathname === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end(
          '<input id="source" value="typing"><iframe src="/preview" style="width:900px;height:800px"></iframe>',
        );
        return;
      }
      if (url.pathname === '/fixture.pdf') {
        pdfReads++;
        res.setHeader('Content-Type', 'application/pdf');
        res.end(bytes);
        return;
      }
      if (url.pathname === '/preview') {
        const origin = 'http://127.0.0.1:' + server.address().port;
        const html = await require('./preview-helper.cjs').renderPreview(
          origin,
        );
        res.setHeader('Content-Type', 'text/html');
        res.end(html);
        return;
      }
      const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {
        res.statusCode = 404;
        res.end();
        return;
      }
      const types = {
        '.mjs': 'text/javascript',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.ftl': 'text/plain',
        '.wasm': 'application/wasm',
      };
      res.setHeader(
        'Content-Type',
        types[path.extname(file)] || 'application/octet-stream',
      );
      fs.createReadStream(file).pipe(res);
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const browser = await chromium.launch({
      channel: process.env.PDF_TEST_BROWSER || undefined,
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.addInitScript(() => {
        window.acquireVsCodeApi = () => ({ postMessage() {} });
      });
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e)));
      page.on('console', (m) => {
        if (m.type() === 'error') console.log('browser:', m.text());
      });
      await page.goto('http://127.0.0.1:' + server.address().port);
      const frame = page.frames().find((f) => f.url().endsWith('/preview'));
      await frame.waitForFunction(
        () =>
          window.PDFViewerApplication?.pdfViewer?.currentScaleValue === '1.25',
        null,
        { timeout: 30000 },
      );
      await frame.waitForFunction(() =>
        document.querySelector('.textLayer')?.textContent.includes('Before'),
      );
      await frame.evaluate(() => {
        const a = window.PDFViewerApplication;
        a.viewsManager.switchView(1, true);
        a.pdfViewer.currentPageNumber = 2;
        a.pdfViewer.container.scrollTop += 80;
      });
      await page.waitForTimeout(300);
      const before = await frame.evaluate(() => ({
        top: PDFViewerApplication.pdfViewer.container.scrollTop,
        scale: PDFViewerApplication.pdfViewer.currentScaleValue,
      }));
      await page.locator('#source').focus();
      bytes = pdf('After');
      await frame.evaluate(() => window.postMessage({ type: 'reload' }, '*'));
      await frame.waitForFunction(() =>
        document.querySelector('#viewer')?.textContent.includes('After'),
      );
      await page.waitForTimeout(300);
      assert.equal(
        await page
          .locator('#source')
          .evaluate((e) => document.activeElement === e),
        true,
        'Rebuild must not focus the PDF iframe',
      );
      const after = await frame.evaluate(() => ({
        top: PDFViewerApplication.pdfViewer.container.scrollTop,
        scale: PDFViewerApplication.pdfViewer.currentScaleValue,
      }));
      assert.equal(after.scale, before.scale);
      assert.ok(
        Math.abs(after.top - before.top) < 3,
        JSON.stringify({ before, after }),
      );
      assert.equal(
        await frame.evaluate(() =>
          PDFViewerApplicationOptions.get('enableScripting'),
        ),
        false,
      );
      assert.equal(
        await frame.evaluate(
          () => PDFViewerApplication.viewsManager.visibleView,
        ),
        1,
      );
      const readsBeforeUnrelatedMessage = pdfReads;
      const fingerprint = await frame.evaluate(
        () => PDFViewerApplication.pdfDocument.fingerprints[0],
      );
      await frame.evaluate(() => window.postMessage({ type: 'clicked' }, '*'));
      await page.waitForTimeout(200);
      assert.equal(
        await frame.evaluate(
          () => PDFViewerApplication.pdfDocument.fingerprints[0],
        ),
        fingerprint,
      );
      assert.equal(pdfReads, readsBeforeUnrelatedMessage);
      bytes = Buffer.from('half written PDF');
      await frame.evaluate(() => window.postMessage({ type: 'reload' }, '*'));
      await frame.waitForSelector('#reload-error');
      assert.equal(
        await frame.evaluate(
          () => PDFViewerApplication.pdfDocument.fingerprints[0],
        ),
        fingerprint,
      );
      bytes = pdf('Recovered', 1);
      await frame.evaluate(() => {
        for (let i = 0; i < 5; i++) window.postMessage({ type: 'reload' }, '*');
      });
      await frame.waitForFunction(() =>
        document.querySelector('#viewer')?.textContent.includes('Recovered'),
      );
      assert.equal(
        await frame.evaluate(
          () => PDFViewerApplication.pdfViewer.currentPageNumber,
        ),
        1,
      );
      assert.equal(
        await page
          .locator('#source')
          .evaluate((e) => document.activeElement === e),
        true,
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
      await new Promise((resolve) => server.close(resolve));
    }
  },
);
