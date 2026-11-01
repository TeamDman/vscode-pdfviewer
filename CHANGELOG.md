# 2.0.1

- Fetch the PDF.js worker through the webview window before starting it, avoiding VS Code worker-resource routing timeouts.
- Remove injected webview body padding and constrain the viewer to the tab width.
- Test worker fetches and layout at 320, 630, and 900 pixels with VS Code's default padding reproduced.

# 2.0.0 - TeamDman hard fork

- Upgrade PDF.js to 6.4.299 and apply both published advisory mitigations.
- Preserve source-editor focus and reading position through compiler rebuilds.
- Serialize reloads, retain the last readable PDF during partial writes, and handle file replacement.
- Integrate reviewed upstream fixes, add tests and CI, and use the TeamDman.pdf extension identity.
- Record excluded or superseded PRs in UPSTREAM_REVIEW.md.

# Changelog

## 1.2.2 (2022/12/23)

- Fix about rendering Unicode characters

## 1.2.1 (2022/12/12)

- Update PDF.js to 3.1.81-legacy
- Restore scroll position during reload (#136)
- Run under remote development (#100)

### Thank you

- @kfigiela Run extension locally when using remote development #100
- @Daniel-Atanasov fix: Fix scroll location and flickering during reload #136

## 1.2.0 (2021/12/15)

- Allow pdf viewer to work in an untrusted workspace (#102)
- Bump version of PDF.js to Stable (v2.10.377) (#120)

### Bug fixes

- Support Unicode in PDF by passing the right cMapUrl to pdf.js (#116)
- Preserve the current page number and zoom level on reload (#121)

### Thank you
- @lramos15 Added settings about untrusted workspaces. #102
- @aifreedom Fixed bug about Unicode charactors. #116
- @simon446 Bump pdf.js version. #120
- @zamzterz Fixed to preserve page number and scale on reload. #121

## 1.1.0 (2020/07/13)

- The issue about extension view is resolved.
  + Remove message shown on loaded. 
- Support default viewer settings
  + cursor (**hand** or tool)
  + scale (**auto**, page-actual, etc...)
  + sidebar (**hide** or show)
  + scrollMode (**vertical**, horizontal or wrapped)
  + spreadMode (**none**, odd or even)

## 1.0.0 (2020/06/18)

- [Change extension API](https://github.com/microsoft/vscode/issues/77131)
- Resolve known issues about showing pdf preview.
- Upgrade PDF.js to 2.4.456

## 0.6.0 (2020/04/10)

- Support auto reload (#52)
- Migrate vscode-extension packages

### Thank you
- @GeorchW Implemented auto-refresh ( #11 )  #52

## 0.5.0 (2019/02/25)

- Recovery for working even VSCode 1.31.x.
- Avoid nested `<iframe>`.

## 0.4.3 (2018/11/28)

- Recovery for working even VSCode 1.30.0.

## 0.4.2 (2018/11/28)

- Revive display state on load VSCode.
- [Event-Stream Package Security Update](https://code.visualstudio.com/blogs/2018/11/26/event-stream)

## 0.4.0 (2018/11/9)

- Migrate vscode internal api. Due to [Microsoft/vscode#62630](https://github.com/Microsoft/vscode/issues/62630)
- Upgrade PDF.js to 2.1.36

## 0.3.0 (2018/6/6)

- Upgrade PDF.js to 1.9.426 (#23)

### Thank you
- @Kampfgnom bump to pdf.js version #23

## 0.2.0 (2017/1/12)

- Fixed displaying on linux (#5)
- Be able to open PDF from context menu in explorer now (#6)

### Thank you
- @serl support for context menu in explorer #6

## 0.1.0 (2016/11/30)

- Add extension icon.
- Use all PDF.js [Pre-built](https://mozilla.github.io/pdf.js/getting_started/#download) files.

## 0.0.2 (2016/11/24)

- consistent file icon

## 0.0.1 (2016/10/25)

- Initial release.
