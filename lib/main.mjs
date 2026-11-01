export function createReloadQueue(reload, report = console.error) {
  let pending = false;
  let running;
  return function request() {
    pending = true;
    if (!running) {
      running = (async () => {
        while (pending) {
          pending = false;
          try {
            await reload();
          } catch (error) {
            report(error);
          }
        }
      })().finally(() => {
        running = undefined;
      });
    }
    return running;
  };
}

export function configureViewer(app, options) {
  const config = JSON.parse(
    document.getElementById('pdf-preview-config').dataset.config,
  );
  const security = {
    enableScripting: false,
    isEvalSupported: false,
    enableXfa: false,
    enablePermissions: true,
    disablePreferences: true,
    disableHistory: true,
    annotationEditorMode: -1,
    enableAltTextModelDownload: false,
    enableGuessAltText: false,
    enableAutoLinking: false,
    enableMerge: false,
    enableSplit: false,
    enableSignatureVerification: false,
  };
  for (const [key, value] of Object.entries({
    ...security,
    defaultUrl: '',
    viewOnLoad: 1,
    workerSrc: config.workerSrc,
    cMapUrl: config.cMapUrl,
    standardFontDataUrl: config.standardFontDataUrl,
    wasmUrl: config.wasmUrl,
    iccUrl: config.iccUrl,
  })) {
    options.set(key, value);
  }

  const vscode = acquireVsCodeApi();
  // VS Code routes resource requests through the window's service-worker client.
  // A cross-origin import from a worker can stall until that routing times out.
  const workerSource = fetch(config.workerSrc).then(async (response) => {
    if (!response.ok) {
      throw new Error(`PDF worker load failed: ${response.status}`);
    }
    return URL.createObjectURL(
      new Blob([await response.text()], { type: 'text/javascript' }),
    );
  });
  window.addEventListener(
    'pagehide',
    () => {
      void workerSource.then(
        (url) => URL.revokeObjectURL(url),
        () => {},
      );
    },
    { once: true },
  );
  let loaded = false;
  let password;
  const load = async () => {
    await app.initializedPromise;
    const { getDocument, GlobalWorkerOptions } = globalThis.pdfjsLib;
    GlobalWorkerOptions.workerSrc = await workerSource;
    const task = getDocument({
      url: config.path,
      password,
      cMapUrl: config.cMapUrl,
      cMapPacked: true,
      standardFontDataUrl: config.standardFontDataUrl,
      wasmUrl: config.wasmUrl,
      iccUrl: config.iccUrl,
      useWorkerFetch: false,
      disableAutoFetch: true,
      disableStream: true,
      isEvalSupported: false,
      enableXfa: false,
    });
    task.onPassword = async (updatePassword, reason) => {
      // A changed password must not open a focus-taking dialog during a background rebuild.
      if (loaded && !document.hasFocus()) {
        updatePassword(
          new Error('PDF password changed. Reopen the preview to unlock it.'),
        );
        return;
      }
      await app.passwordPrompt.setUpdateCallback((value) => {
        if (typeof value === 'string') {
          password = value;
        }
        updatePassword(value);
      }, reason);
      await app.passwordPrompt.open();
    };
    try {
      const doc = await task.promise;
      await doc.getPage(1);
      const viewer = app.pdfViewer;
      // Capture after fetching so reading while the compiler runs is preserved.
      const saved = loaded
        ? {
            page: viewer.currentPageNumber,
            scale: viewer.currentScaleValue,
            top: viewer.container.scrollTop,
            left: viewer.container.scrollLeft,
            rotation: viewer.pagesRotation,
            scroll: viewer.scrollMode,
            spread: viewer.spreadMode,
            sidebar: app.viewsManager.visibleView,
          }
        : null;
      await app.close();
      app.pdfLoadingTask = task;
      app.setTitleUsingUrl(config.path);
      await app.load(doc);
      viewer.pagesRotation = saved?.rotation ?? 0;
      viewer.scrollMode =
        saved?.scroll ??
        { vertical: 0, horizontal: 1, wrapped: 2 }[config.defaults.scrollMode];
      viewer.spreadMode =
        saved?.spread ??
        { none: 0, odd: 1, even: 2 }[config.defaults.spreadMode];
      app.viewsManager.switchView(
        saved?.sidebar ?? (config.defaults.sidebar ? 1 : 0),
        true,
      );
      viewer.currentScaleValue = saved?.scale || config.defaults.scale;
      app.pdfCursorTools.switchTool(config.defaults.cursor === 'hand' ? 1 : 0);
      if (saved) {
        viewer.currentPageNumber = Math.min(saved.page, doc.numPages);
        viewer.container.scrollTop = Math.max(
          0,
          Math.min(
            saved.top,
            viewer.container.scrollHeight - viewer.container.clientHeight,
          ),
        );
        viewer.container.scrollLeft = saved.left;
      } else if (config.fragment) {
        app.pdfLinkService.setHash(config.fragment);
      }
      loaded = true;
      document.getElementById('reload-error')?.remove();
    } catch (error) {
      if (app.pdfLoadingTask !== task) {
        await task.destroy();
      }
      throw error;
    }
  };
  const reload = createReloadQueue(load, (error) => {
    console.error('PDF reload failed', error);
    let message = document.getElementById('reload-error');
    if (!message) {
      message = document.createElement('div');
      message.id = 'reload-error';
      message.setAttribute('role', 'status');
      document.body.appendChild(message);
    }
    message.textContent =
      'Could not reload PDF. Retrying after the next file change.';
  });
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'reload') {
      void reload();
    }
  });
  document.getElementById('viewer').addEventListener('click', (event) => {
    const text = event.target.closest('.textLayer span')?.textContent;
    if (text) {
      vscode.postMessage({ type: 'clicked', text });
    }
  });
  void reload();
}
