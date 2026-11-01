import * as vscode from 'vscode';
import { PdfCustomProvider } from './pdfProvider';

export interface PdfViewerApi {
  registerOnClickCallback(callback: (text: string) => void): vscode.Disposable;
}
export function activate(context: vscode.ExtensionContext): PdfViewerApi {
  const clicks = new vscode.EventEmitter<string>();
  const provider = new PdfCustomProvider(context.extensionUri, (text) =>
    clicks.fire(text),
  );
  context.subscriptions.push(
    clicks,
    provider,
    vscode.window.registerCustomEditorProvider(
      PdfCustomProvider.viewType,
      provider,
      {
        webviewOptions: {
          enableFindWidget: false,
          retainContextWhenHidden: true,
        },
      },
    ),
  );
  return { registerOnClickCallback: (callback) => clicks.event(callback) };
}
