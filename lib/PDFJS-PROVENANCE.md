# PDF.js distribution

- Version: 6.4.299, build d0991a0d5.
- Source: https://github.com/mozilla/pdf.js/releases/tag/v6.4.299
- Asset: https://github.com/mozilla/pdf.js/releases/download/v6.4.299/pdfjs-6.4.299-dist.zip
- SHA-256: `f2245eb7ef3f674c872fe568a177bfec15874f5c034613e55d8e307f93ebd86d`
- Download checksum verified against GitHub's release asset digest.
- License: [PDFJS-LICENSE](PDFJS-LICENSE).

The distribution's build and web directories replace the old 3.1.81 bundle. The sample PDF and source maps are omitted. Viewer HTML is loaded as a template; the extension rewrites its resource URLs and CSP.

Local changes in `web/viewer.mjs`:

1. Import `configureViewer` from `../main.mjs` and invoke it immediately before `PDFViewerApplication.run`.
2. Return the document initialization promise from `load`, including the nested view-initialization promise. This lets reloads wait for initialization before restoring state or starting the next load.
3. Disable the call to automatic PDF print-action handling.
4. Remove the print keyboard listener and leave Ctrl/Cmd+P (including Shift+P) to VS Code.

All other integration code is in `main.mjs`, `pdf.css`, and the extension source. PDF.js 6 no longer calls viewer.focus during document initialization. Annotation editing is disabled to avoid editor focus behavior and unsaved edits during compiler rebuilds.
