import * as assert from 'assert';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import { PdfViewerApi } from '../../extension';

export async function run(): Promise<void> {
  const extension =
    vscode.extensions.getExtension<PdfViewerApi>('TeamDman.pdf');
  assert.ok(extension, 'Fork is registered');
  const api = await extension.activate();
  api.registerOnClickCallback(() => {}).dispose();
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'pdf-viewer-test-'),
  );
  const pdfPath = path.join(directory, 'preview.pdf');
  const data = await fs.readFile(
    path.resolve(__dirname, '../../../../test/fixtures/sample.pdf'),
  );
  await fs.writeFile(pdfPath, data);
  const sourcePath = path.join(directory, 'source.typ');
  await fs.writeFile(sourcePath, 'Keep typing here');
  const source = await vscode.workspace.openTextDocument(
    vscode.Uri.file(sourcePath),
  );
  await vscode.window.showTextDocument(source, vscode.ViewColumn.One);
  await vscode.commands.executeCommand(
    'vscode.openWith',
    vscode.Uri.file(pdfPath),
    'pdf.preview',
    vscode.ViewColumn.Two,
  );
  await new Promise((resolve) => setTimeout(resolve, 2500));
  const editor = await vscode.window.showTextDocument(
    source,
    vscode.ViewColumn.One,
  );
  for (let i = 0; i < 4; i++) {
    await fs.writeFile(pdfPath, data);
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.strictEqual(
      vscode.window.activeTextEditor,
      editor,
      'PDF rebuild stole source editor focus',
    );
  }
  await fs.unlink(pdfPath);
  await fs.writeFile(pdfPath, data);
  await new Promise((resolve) => setTimeout(resolve, 1000));
  assert.strictEqual(
    vscode.window.activeTextEditor,
    editor,
    'PDF replacement stole focus',
  );
  assert.ok(
    vscode.window.tabGroups.all.some((group) =>
      group.tabs.some(
        (tab) =>
          tab.input instanceof vscode.TabInputCustom &&
          tab.input.uri.fsPath.toLowerCase() === pdfPath.toLowerCase(),
      ),
    ),
    'PDF tab closed during replacement',
  );
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  await fs.rm(directory, { recursive: true, force: true });
  console.log(
    'VS Code activation, PDF rebuild focus, and atomic replacement checks passed.',
  );
}
