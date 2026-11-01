import * as vscode from 'vscode';
import { Disposable } from './disposable';

export function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/'/g, '&#39;');
}

export class PdfPreview extends Disposable {
  private reloadTimer: ReturnType<typeof setTimeout> | undefined;
  constructor(
    private readonly extensionRoot: vscode.Uri,
    private readonly resource: vscode.Uri,
    private readonly panel: vscode.WebviewPanel,
    private readonly onClick: (text: string) => void = () => {},
  ) {
    super();
    const parent = resource.with({
      path: resource.path.slice(0, resource.path.lastIndexOf('/') + 1),
      fragment: '',
      query: '',
    });
    panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [extensionRoot, parent],
    };
    this._register(panel.onDidDispose(() => this.dispose()));
    this._register(
      panel.webview.onDidReceiveMessage((message: unknown) => {
        if (typeof message !== 'object' || message === null) {
          return;
        }
        const data = message as { type?: unknown; text?: unknown };
        if (data.type === 'clicked' && typeof data.text === 'string') {
          this.onClick(data.text.slice(0, 100000));
        }
      }),
    );
    const watcher = this._register(
      vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(parent, '*'),
      ),
    );
    const changed = (uri: vscode.Uri): void => {
      if (
        uri.toString() === resource.with({ fragment: '', query: '' }).toString()
      ) {
        this.scheduleReload();
      }
    };
    this._register(watcher.onDidChange(changed));
    this._register(watcher.onDidCreate(changed));
    // Compilers may replace a PDF via delete + rename. Keep the preview open.
    this._register(watcher.onDidDelete(changed));
  }

  public async initialize(): Promise<void> {
    const webview = this.panel.webview;
    const asset = (...parts: string[]): string =>
      webview
        .asWebviewUri(vscode.Uri.joinPath(this.extensionRoot, 'lib', ...parts))
        .toString();
    const config = vscode.workspace.getConfiguration(
      'pdf-preview',
      this.resource,
    );
    const settings = {
      path: webview
        .asWebviewUri(this.resource.with({ fragment: '' }))
        .toString(),
      fragment: this.resource.fragment,
      cMapUrl: asset('web', 'cmaps') + '/',
      standardFontDataUrl: asset('web', 'standard_fonts') + '/',
      wasmUrl: asset('web', 'wasm') + '/',
      iccUrl: asset('web', 'iccs') + '/',
      workerSrc: asset('build', 'pdf.worker.mjs'),
      defaults: {
        cursor: config.get('default.cursor', 'select'),
        scale: config.get('default.scale', 'auto'),
        sidebar: config.get('default.sidebar', false),
        scrollMode: config.get('default.scrollMode', 'vertical'),
        spreadMode: config.get('default.spreadMode', 'none'),
      },
    };
    let html = Buffer.from(
      await vscode.workspace.fs.readFile(
        vscode.Uri.joinPath(this.extensionRoot, 'lib', 'web', 'viewer.html'),
      ),
    ).toString('utf8');
    const source = webview.cspSource;
    const csp = `default-src 'none'; script-src ${source} 'wasm-unsafe-eval'; worker-src ${source} blob:; style-src ${source} 'unsafe-inline'; img-src ${source} blob: data:; font-src ${source} data:; connect-src ${source}; base-uri 'none'; form-action 'none';`;
    html = html.replace(
      /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?\/>/,
      `<meta http-equiv="Content-Security-Policy" content="${escapeAttribute(csp)}">`,
    );
    html = html.replace(
      /(src|href)="([^"#]+)"/g,
      (match, attribute: string, value: string) => {
        if (/^[a-z]+:/i.test(value)) {
          return match;
        }
        return `${attribute}="${escapeAttribute(asset('web', value))}"`;
      },
    );
    html = html.replace(
      '</head>',
      `<meta id="pdf-preview-config" data-config="${escapeAttribute(JSON.stringify(settings))}"><link rel="stylesheet" href="${escapeAttribute(asset('pdf.css'))}"></head>`,
    );
    if (!this.isDisposed) {
      webview.html = html;
    }
  }

  private scheduleReload(): void {
    if (this.reloadTimer !== undefined) {
      clearTimeout(this.reloadTimer);
    }
    this.reloadTimer = setTimeout(() => {
      this.reloadTimer = undefined;
      if (!this.isDisposed) {
        void this.panel.webview.postMessage({ type: 'reload' });
      }
    }, 250);
  }

  public dispose(): void {
    if (this.reloadTimer !== undefined) {
      clearTimeout(this.reloadTimer);
    }
    super.dispose();
  }
}
