import * as vscode from 'vscode';
import { PdfPreview } from './pdfPreview';

export class PdfCustomProvider
  implements vscode.CustomReadonlyEditorProvider, vscode.Disposable
{
  public static readonly viewType = 'pdf.preview';
  private readonly previews = new Map<PdfPreview, vscode.Disposable>();
  constructor(
    private readonly extensionRoot: vscode.Uri,
    private readonly onClick: (text: string) => void = () => {},
  ) {}
  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: (): void => {} };
  }
  public async resolveCustomEditor(
    document: vscode.CustomDocument,
    panel: vscode.WebviewPanel,
  ): Promise<void> {
    const preview = new PdfPreview(
      this.extensionRoot,
      document.uri,
      panel,
      this.onClick,
    );
    const closed = panel.onDidDispose(() => {
      closed.dispose();
      preview.dispose();
      this.previews.delete(preview);
    });
    this.previews.set(preview, closed);
    try {
      await preview.initialize();
    } catch (error) {
      closed.dispose();
      preview.dispose();
      this.previews.delete(preview);
      throw error;
    }
  }
  public dispose(): void {
    for (const [preview, closed] of this.previews) {
      closed.dispose();
      preview.dispose();
    }
    this.previews.clear();
  }
}
