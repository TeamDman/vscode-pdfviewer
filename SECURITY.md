# Security

## PDF.js advisory review

Reviewed Mozilla's complete public PDF.js advisory list on 1 November 2026. The bundled release is 6.4.299.

| Advisory | Fixed release | Configuration in this fork |
| --- | --- | --- |
| [GHSA-wgrm-67xf-hhpq / CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq) | 4.2.67 | `isEvalSupported: false` is passed on every document load. Current PDF.js has removed that eval path. |
| [GHSA-hq66-cqwq-w95j / CVE-2026-16633](https://github.com/mozilla/pdf.js/security/advisories/GHSA-hq66-cqwq-w95j) | 6.2.108 | `enableScripting: false` is set before viewer initialization. CSP disallows inline scripts and JavaScript eval. |

## Additional restrictions

PDF XFA, automatic print actions, annotation editing, automatic link detection, document merge/split, and model downloads are disabled. Saved PDF.js preferences cannot re-enable scripting. Files are displayed read-only.

The webview allows scripts and connections only to VS Code's webview resource source. Local resource roots are the extension and the opened PDF's parent directory. PDF.js fonts, CMaps, image decoders, and translations are bundled locally. WASM compilation is allowed with `wasm-unsafe-eval`; JavaScript `unsafe-eval` is not allowed. Inline styles are permitted for PDF.js layout.

Webview messages are checked before dispatch. File notifications only reload the opened PDF. Reloads validate the next document before closing the current document and dispose superseded workers.

## Dependencies and reporting

The packaged extension has no npm runtime dependencies. Development dependencies are locked; overrides select security-fixed minimatch and MSAL Node versions. Run `npm audit` and the tests after dependency updates.

Report suspected vulnerabilities through this fork's GitHub security reporting feature if available. Otherwise open an issue with a minimal description and arrange private disclosure before attaching sensitive documents or exploit details.

This review found no deliberate malicious behavior in the reviewed PR code. It is not a guarantee that every parser or bundled dependency is free of defects.
