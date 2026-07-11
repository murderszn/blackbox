#!/usr/bin/env node
/**
 * Local dev launcher — frees PORT if needed, then starts server.js.
 */
import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8080;

function freePort(port) {
    try {
        const pids = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN 2>/dev/null || true`, {
            encoding: 'utf8',
        })
            .trim()
            .split(/\s+/)
            .filter(Boolean);
        for (const pid of pids) {
            try {
                process.kill(Number(pid), 'SIGTERM');
            } catch {
                /* already gone */
            }
        }
        if (pids.length) {
            // brief wait so the socket is released
            execSync('sleep 0.35');
            console.log(`  Freed port ${port} (was held by pid ${pids.join(', ')})`);
        }
    } catch {
        /* ignore — port may already be free */
    }
}

if (process.env.DEV_FREE_PORT !== '0') {
    freePort(PORT);
}

const child = spawn(process.execPath, [path.join(root, 'server.js')], {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
});

child.on('exit', (code, signal) => {
    if (signal) process.kill(process.pid, signal);
    process.exit(code ?? 0);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, () => {
        if (!child.killed) child.kill(sig);
    });
}
