const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL, fileURLToPath } = require('node:url');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
function uri(url) {
  return {
    path: decodeURIComponent(url.pathname),
    fsPath: fileURLToPath(url),
    fragment: decodeURIComponent(url.hash.slice(1)),
    toString: () => url.href,
    with(changes) {
      const next = new URL(url);
      if (changes.path !== undefined) next.pathname = changes.path;
      if (changes.fragment !== undefined) next.hash = changes.fragment;
      if (changes.query !== undefined) next.search = changes.query;
      return uri(next);
    },
  };
}
const Uri = {
  file: (value) => uri(pathToFileURL(path.resolve(value))),
  joinPath: (base, ...parts) =>
    base.with({ path: path.posix.join(base.path, ...parts) }),
};
const events = [];
const subscribe = (callback) => {
  events.push(callback);
  return { dispose() {} };
};
const mock = {
  Uri,
  RelativePattern: class {},
  workspace: {
    createFileSystemWatcher: () => ({
      onDidChange: subscribe,
      onDidCreate: subscribe,
      onDidDelete: subscribe,
      dispose() {},
    }),
    getConfiguration: () => ({
      get: (key, fallback) => (key === 'default.scale' ? '1.25' : fallback),
    }),
    fs: { readFile: (resource) => fs.readFile(resource.fsPath) },
  },
};
const original = Module._load;
Module._load = function (id, ...args) {
  return id === 'vscode' ? mock : original.call(this, id, ...args);
};
const { PdfPreview, escapeAttribute } = require('../out/src/pdfPreview');
Module._load = original;
async function renderPreview(origin) {
  const resource = Uri.file(path.join(root, 'fixture.pdf'));
  const panel = {
    onDidDispose: subscribe,
    webview: {
      cspSource: origin,
      onDidReceiveMessage: subscribe,
      asWebviewUri: (value) => ({
        toString: () =>
          origin +
          '/' +
          path
            .relative(root, value.fsPath)
            .split(path.sep)
            .map(encodeURIComponent)
            .join('/'),
      }),
      postMessage: async () => true,
    },
  };
  const preview = new PdfPreview(Uri.file(root), resource, panel);
  await preview.initialize();
  preview.dispose();
  return panel.webview.html;
}
module.exports = { renderPreview, escapeAttribute };
