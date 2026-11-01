import * as path from 'path';
import { runTests } from '@vscode/test-electron';
async function main(): Promise<void> {
  delete process.env.ELECTRON_RUN_AS_NODE;
  await runTests({
    extensionDevelopmentPath: path.resolve(__dirname, '../../..'),
    extensionTestsPath: path.resolve(__dirname, 'suite/index'),
    vscodeExecutablePath: process.env.VSCODE_EXECUTABLE_PATH,
    launchArgs: [
      '--disable-extensions',
      '--skip-welcome',
      '--skip-release-notes',
    ],
  });
}
void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
