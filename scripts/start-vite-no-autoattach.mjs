import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const env = { ...process.env };

// VS Code "Auto Attach" uses these env vars to inject a bootloader
// which enables the Node inspector and can break Playwright's webServer.
delete env.NODE_OPTIONS;
delete env.VSCODE_INSPECTOR_OPTIONS;

const viteBin = path.resolve('node_modules', 'vite', 'bin', 'vite.js');

const nodeCmd = process.execPath;
const args = [viteBin];

const child = spawn(nodeCmd, args, {
  stdio: 'inherit',
  env,
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
