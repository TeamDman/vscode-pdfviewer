# Teamy PDF Viewer

This is **TeamDman's hard fork** of [tomoki1207/vscode-pdfviewer](https://github.com/tomoki1207/vscode-pdfviewer), maintained independently at [TeamDman/vscode-pdfviewer](https://github.com/TeamDman/vscode-pdfviewer). Report issues and contribute changes here.

PDF previews update when Typst, LaTeX, or another tool rebuilds the file. Updates preserve source-editor focus, zoom, scroll position, and sidebar state. Rapid rebuilds are serialized; an unreadable partial write leaves the previous document visible until another change arrives.

The extension uses PDF.js **6.4.299**, with PDF scripting disabled and a restricted content security policy. See [SECURITY.md](SECURITY.md) for the advisory review and [UPSTREAM_REVIEW.md](UPSTREAM_REVIEW.md) for the disposition of all 15 open upstream PRs reviewed on 1 November 2026.

## Install locally

Requires VS Code 1.144 or later. This minimum matches the tested Electron runtime for the modern PDF.js bundle.

```sh
npm ci --ignore-scripts
npm run package
code --uninstall-extension tomoki1207.pdf
code --install-extension pdf-2.0.1.vsix --force
```

The extension ID is `TeamDman.pdf`. Reload VS Code after replacing the old viewer. Existing `pdf-preview.*` settings and `pdf.preview` file associations remain compatible.

## Develop and test

Use Node.js 24 or later.

```sh
npm ci --ignore-scripts
npx playwright install chromium
npm test
npm run lint
npm run test:integration
```

Browser tests use bundled Chromium by default; set `PDF_TEST_BROWSER=msedge` to use installed Edge. Set `VSCODE_EXECUTABLE_PATH` to test an installed VS Code; otherwise the test runner downloads a test copy. Tests use a separate VS Code profile.

Press F5 to launch the extension from this repository. `npm run package` creates a VSIX containing the viewer and compiled extension, with no npm runtime dependencies.

## Click API and PDF links

Extensions can activate `TeamDman.pdf` and call `registerOnClickCallback((text) => {})`. The returned disposable unregisters the callback. Click events contain text from the clicked PDF text span.

PDF URI fragments are passed to PDF.js, supporting named destinations and fragments such as `#page=3`. VS Code must preserve the fragment when opening the URI.

## Updating PDF.js

[lib/PDFJS-PROVENANCE.md](lib/PDFJS-PROVENANCE.md) records the official distribution, checksum, and local viewer changes. Keep the viewer HTML, scripts, fonts, translations, and WASM files from the same release. Reapply and test the small integration changes before shipping an update.

## License

Extension code retains the upstream [MIT license](LICENSE). PDF.js and its bundled resources retain their [Apache 2.0 license](lib/PDFJS-LICENSE) and embedded notices.
