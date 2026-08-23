// Gemini returns human-readable language names ("TypeScript JSX", "C++"),
// but vscode.workspace.openTextDocument expects a registered language id
// ("typescriptreact", "cpp"). Map the common cases; anything unrecognised
// still opens fine, just without syntax highlighting.
const ALIASES: Record<string, string> = {
  'typescript jsx': 'typescriptreact',
  tsx: 'typescriptreact',
  'javascript jsx': 'javascriptreact',
  jsx: 'javascriptreact',
  typescript: 'typescript',
  ts: 'typescript',
  javascript: 'javascript',
  js: 'javascript',
  python: 'python',
  py: 'python',
  'c++': 'cpp',
  cpp: 'cpp',
  'c#': 'csharp',
  csharp: 'csharp',
  c: 'c',
  go: 'go',
  golang: 'go',
  rust: 'rust',
  java: 'java',
  ruby: 'ruby',
  php: 'php',
  html: 'html',
  css: 'css',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  markdown: 'markdown',
  md: 'markdown',
  shell: 'shellscript',
  bash: 'shellscript',
  sh: 'shellscript',
  sql: 'sql',
  swift: 'swift',
  kotlin: 'kotlin',
};

export function toVscodeLanguageId(detected: string): string {
  const key = detected.trim().toLowerCase();
  return ALIASES[key] ?? 'plaintext';
}
