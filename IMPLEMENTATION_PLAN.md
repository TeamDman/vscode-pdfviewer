# Hard-fork implementation

**Plan status:** Complete
**Primary implementation root:** vscode-pdfviewer, main
**Last updated:** 2026-11-01
**Intent audit:** Passed against the initial goal and the PDF.js/security follow-up.

## Requirements and intent audit

| ID | User requirement | Coverage |
| --- | --- | --- |
| U1 | Review every open upstream PR for malicious or poor changes and merge the PR work | UPSTREAM_REVIEW.md; safe merges and corrected ports; explicit exclusion of unsafe editing and placeholder policy |
| U2 | Stop regenerated PDFs taking focus while typing in Typst with autosave | Current PDF.js and serialized reload; browser and VS Code focus tests |
| U3 | Use the local VS Code clone if helpful | Inspected webview focus-event handling; no core changes needed |
| U4 | Replace the installed upstream extension with this fork | Build VSIX, uninstall tomoki1207.pdf, install TeamDman.pdf, verify installed list |
| U5 | Commit and push everything to main | Safe PR merge commits plus implementation commit; verify origin/main and clean worktree |
| U6 | Make README clearly identify the user's hard fork | README and manifest identify TeamDman |
| U7 | Latest PDF.js and all advisory configurations | 6.4.299 verified release; both Mozilla advisories documented and mitigated |

Pass 1 extracted all outcomes, including install ordering and main push. Pass 2 mapped each outcome to implementation and validation above. Pass 3 checked autosave/Typst focus, every PR, optional VS Code reference, hard-fork ownership, and the later latest-version/security requirement. No source limitation.

## Update rule

Use [ ] not started, [~] in progress, [x] complete, [!] blocked. Keep evidence with each item. Update this plan when scope, decisions, or validation change.

## [x] Review upstream changes

15 open PRs recorded with exact head SHAs and decisions. Five small PRs merged directly. Other useful work ported to the new viewer APIs. Excluded #193/#216 for data-loss and integration failures, #195 for false placeholder claims; #131 superseded by latest PDF.js.

## [x] Implement and validate the viewer

Replaced 3.1.81 with checksum-verified 6.4.299. Removed the old double load and private reset override. Added serialized reload, full document/task disposal, debounce, message filtering, URL escaping, disposable click API, and URI fragments. Both published PDF.js advisories mitigated.

Compile, lint, five Node/browser tests, and VS Code integration passed. Browser test uses production-generated HTML/CSP. VS Code 1.144 test verifies four rewrites plus delete/recreate preserve source focus and leave the PDF tab open. npm audit: zero vulnerabilities after reviewed minimatch/MSAL overrides.

## [x] Package, install, and publish

Docs and package inspection completed. Installed TeamDman.pdf 2.0.0 and verified tomoki1207.pdf is absent. Five tests, lint, compilation, native integration, packaging, official vendor checksums, and zero-finding npm audit passed. Implementation commit eaa3de0 and six adaptation merge commits were pushed to main; origin/main matched 8bde07d after publication. The worktree was clean. This final documentation update records completion. Preserve the pre-existing .vscode/settings.json modernization in the final commit as requested by “everything”.

## Risks and limits

The old editing PRs cannot be safely installed as submitted. Read-only viewing is deliberate. Vendored PDF.js changes are listed in lib/PDFJS-PROVENANCE.md. Tests cannot prove the absence of all malicious PDF parser bugs. User documents and machine-specific paths must not enter the repository.

GitHub CI passed for f59d293 (run 41335893927), including Linux browser and VS Code integration tests, audit, and packaging. The final compatibility metadata requires the tested VS Code 1.144 runtime because the modern PDF.js bundle uses newer Map APIs.

## [x] Follow-up: slow loading and horizontal overflow

The user reported roughly 60-second startup and unwanted horizontal scrolling in the tab. Reproduced in an isolated VS Code host: PDF worker startup stalled and the webview had 40 pixels of document overflow. VS Code injects body padding of 0 20px. Changed worker startup to fetch its module text from the window and launch a local blob worker, and reset body padding/overflow while constraining the main container.

Verified using the user's existing PDF read-only, without copying it into the repo: worker fetch 116 ms, PDF fetch 19 ms, PDF bytes available at 318 ms from webview startup, rendered canvas present, and zero outer overflow. Browser regressions fail independently with the old worker code and old CSS and pass with both fixes at 320/630/900px. Release 2.0.1 carries the correction.
