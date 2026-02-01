import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptsDir, '..');

const filesToCopy = [
  ['data/workout-plan-v2.5.json', 'public/workout-plan-v2.5.json'],
  ['data/workout-plan-push.json', 'public/workout-plan-push.json'],
  ['data/exercises.json', 'public/exercises.json'],
  ['colors.css', 'public/colors.css'],
];

async function ensureDir(filePath) {
  await mkdir(dirname(filePath), { recursive: true });
}

async function main() {
  for (const [srcRel, destRel] of filesToCopy) {
    const src = resolve(repoRoot, srcRel);
    const dest = resolve(repoRoot, destRel);

    await ensureDir(dest);
    await copyFile(src, dest);
  }
}

main().catch((err) => {
  console.error('Failed to copy static assets:', err);
  process.exit(1);
});
