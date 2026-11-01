import tseslint from 'typescript-eslint';
export default tseslint.config(
  {
    ignores: [
      'lib/**',
      'node_modules/**',
      'out/**',
      '.build/**',
      '.vscode-test/**',
    ],
  },
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-empty-function': 'off' } },
);
