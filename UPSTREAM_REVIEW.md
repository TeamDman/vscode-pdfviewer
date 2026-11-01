# Upstream PR review

Snapshot: all 15 open PRs in [tomoki1207/vscode-pdfviewer](https://github.com/tomoki1207/vscode-pdfviewer/pulls), reviewed on 1 November 2026. Changes are integrated into this fork; upstream PRs are not closed or merged in the upstream repository.

The review covered PR descriptions, available discussion, diffs, dependency changes, extension/webview message boundaries, document writes, lifecycle handling, and build configuration. Generated code from the obsolete PDF.js upgrade was assessed as a distribution replacement and rejected as superseded; this is not a line-by-line audit of every PDF.js parser.

## [#216: Allow highlighting text in PDF](https://github.com/tomoki1207/vscode-pdfviewer/pull/216)

Head: `f22dda7ed4be84b1a50a221c7cc762077dfa1ea1`.

**Excluded: data-loss risks.** The custom document retains the bytes read on open. File-watcher reloads do not update those bytes; adding a highlight and saving after a compiler rebuild can overwrite newer content. Save/backup also do not await queued highlighting operations, and restored backups are not used for the initial webview load. The PR acknowledges unsaved highlights disappearing across reloads. It also changes ownership to another fork. Kept this fork read-only.

## [#211: fix: keep reading position when the PDF is rebuilt on disk](https://github.com/tomoki1207/vscode-pdfviewer/pull/211)

Head: `8bd25d39c2ceab64f8600c294f5d560edf074696`.

**Adapted for PDF.js 6.** Retained debouncing, message filtering, serialization, page clamping, and view preservation. Did not retain private _resetView and setInitialView replacements: the proposed serialization ends before asynchronous initialization completes, listeners can survive failures, and old workers are not destroyed. The new implementation validates a new document, closes the old task, waits for initialization, and restores state.

## [#200: fix: apply all improvements from PR #199](https://github.com/tomoki1207/vscode-pdfviewer/pull/200)

Head: `7f0145a37af0009372bcff6c10cfb0711401fde3`.

**Adapted with corrections.** Retained stricter typing, extensionUri, listener cleanup, tests, CI, and modern packaging. The diff references an undefined stateListener and does not contain the advertised escapeAttribute/Uri.joinPath fix. Implemented those fixes directly. Replaced its Node 18 and outdated dependencies with current tooling.

## [#198: fix: prevent race condition pattern_p0_27 error loading PDF.js](https://github.com/tomoki1207/vscode-pdfviewer/pull/198)

Head: `c72c66a7e9813afcd7bb93e22fd1ecffb4bf60c8`.

**Merged; retained.** disableAutoFetch and disableStream are applied to every document load, including the first. No added dependencies or unexpected actions.

## [#195: saimon khan jisan](https://github.com/tomoki1207/vscode-pdfviewer/pull/195)

Head: `100853a34d47c6dc1c3ad7fe25e013dd4c19707b`.

**Excluded: placeholder only.** Adds an unfilled security policy with unrelated 5.x/4.x support claims. No useful implementation. Replaced by an advisory-specific SECURITY.md for this fork.

## [#193: Add functionality for delete pages](https://github.com/tomoki1207/vscode-pdfviewer/pull/193)

Head: `40e73b08d57443a71e574686de9234c6ccbb7035`.

**Excluded: unsafe/broken editing.** Writes page deletions directly over the source file without undo or save conflict handling; range expansion is unbounded. Save/revert methods are stubs and backup throws. The manifest has mismatched activation/editor IDs. Also includes debug backups, unrelated thumbnail color inversion, another fork's branding, and machine-specific npm configuration. No evidence of deliberate malware, but unsuitable for installation.

## [#181: Set font color of popup annotations to black](https://github.com/tomoki1207/vscode-pdfviewer/pull/181)

Head: `2145c4e6dcff5d6f75063e5b2138dc0362de6724`.

**Merged; adapted CSS.** Makes popup annotation text readable. The replacement PDF.js distribution changes markup, so the fork stylesheet carries the text-color rule.

## [#167: Remediate grammatical and formatting errors in ReadMe.](https://github.com/tomoki1207/vscode-pdfviewer/pull/167)

Head: `3e645452e60f3fe0cb1986a6e240c3779d6b3d64`.

**Adapted in README rewrite.** Documentation wording improvements are included in the hard-fork README, with build/test and upgrade instructions rewritten for this implementation.

## [#157: Removing print event avoiding clash with VScode command palette + open file. #80 #85 #132](https://github.com/tomoki1207/vscode-pdfviewer/pull/157)

Head: `2353ae438ecda9af575afe3d410a3de51ff46455`.

**Merged; retained and completed.** Removes the print shortcut interception. PDF.js 6 has another Ctrl/Cmd+Shift+P handler; the fork also leaves that shortcut to VS Code. Explicit print toolbar actions remain available.

## [#155: Expose API for registering callbacks when the PDF is clicked](https://github.com/tomoki1207/vscode-pdfviewer/pull/155)

Head: `ffdef849c23a9df81e03ebbdf78dc1e33f4deba8`.

**Adapted with corrections.** Retained the click callback API. Removed debugger statement and unused imports, validated incoming messages, and made subscriptions disposable using VS Code EventEmitter. Kept the existing UI extension-host placement.

## [#143: Bump minimist from 1.2.5 to 1.2.7](https://github.com/tomoki1207/vscode-pdfviewer/pull/143)

Head: `9fe8ce45e65a39655885f0c847d437de47833296`.

**Merged; superseded by toolchain update.** Legitimate Dependabot minimist patch. The new dependency graph and lockfile replace the old tooling; npm audit reports zero findings at validation time.

## [#142: Bump simple-get from 3.1.0 to 3.1.1](https://github.com/tomoki1207/vscode-pdfviewer/pull/142)

Head: `97b4deb523864e973de073d495e238e1fbc745f2`.

**Merged; superseded by toolchain update.** Legitimate Dependabot simple-get cookie-leak patch. The new dependency graph removes the obsolete test runner that required it.

## [#140: Support for pdf links with named destinations](https://github.com/tomoki1207/vscode-pdfviewer/pull/140)

Head: `053da8c32c652f47568aa2d598a8d6104b6e0d9f`.

**Adapted.** Passes the URI fragment separately to PDF.js rather than splitting and decoding the complete resource URL. Relative links whose fragments VS Code drops remain outside the extension's control.

## [#131: Upgrade PDF.js to 2.13.216](https://github.com/tomoki1207/vscode-pdfviewer/pull/131)

Head: `d1260cfae93d4cdbf7912a7d5953eecdaf456299`.

**Superseded.** Would install PDF.js 2.13.216 over the fork's existing 3.1.81. Reviewed the distribution replacement and template changes; did not import obsolete generated bundles. The official, checksum-verified 6.4.299 distribution fulfills the upgrade intent and the user's latest-version requirement.

## [#122: Preserve side bar state (opened/closed) on reload.](https://github.com/tomoki1207/vscode-pdfviewer/pull/122)

Head: `51cdf30c0e9a0e98a73d2075328e384aa5777c15`.

**Adapted.** Preserves sidebar state using PDF.js 6 viewsManager.visibleView/switchView after initialization. Did not restore the obsolete open/reload flow.

## Validation

Browser tests exercise the production webview HTML and CSP, rebuilt PDF content, source-field focus, scroll/zoom preservation, message filtering, a partial write, and recovery with fewer pages. Separate queue tests cover coalescing and recovery. VS Code integration tests open a custom PDF editor and check active source-editor focus through repeated writes and delete/recreate, plus retention of the PDF tab. Compile, lint, packaging, and npm audit are release checks.
