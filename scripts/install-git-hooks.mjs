import { copyFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function main() {
  const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
  const repoRoot = resolve(scriptsDir, '..');

  const src = resolve(repoRoot, 'scripts', 'hooks', 'pre-commit');
  const dest = resolve(repoRoot, '.git', 'hooks', 'pre-commit');

  await copyFile(src, dest);

  // On Windows, chmod may be a no-op or fail depending on filesystem.
  if (process.platform !== 'win32') {
    await chmod(dest, 0o755);
  }
}

main().catch((err) => {
  console.error('Failed to install git hooks:', err);
  process.exit(1);
});
