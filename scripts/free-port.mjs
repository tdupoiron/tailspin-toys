/**
 * Stop any dev server already listening on the Astro dev port so `npm run dev`
 * can bind it instead of silently falling back to another port.
 *
 * Only Node processes are stopped; anything else is reported and left alone.
 * Usage: node scripts/free-port.mjs [port]
 */
import { execFileSync } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 4321);

/** Run a command, returning its stdout, or '' when it fails or matches nothing. */
function run(command, args) {
    try {
        return execFileSync(command, args, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch {
        return '';
    }
}

/** Find PIDs listening on the port, using the platform's own tooling. */
function listeningPids(port) {
    const output =
        process.platform === 'win32'
            ? run('netstat', ['-ano'])
                  .split(/\r?\n/)
                  .filter((line) => line.includes(`:${port}`) && line.includes('LISTENING'))
                  .map((line) => line.trim().split(/\s+/).pop())
                  .join('\n')
            : run('lsof', ['-t', `-iTCP:${port}`, '-sTCP:LISTEN']);

    const pids = output
        .split(/\s+/)
        .map((value) => Number(value))
        .filter((pid) => Number.isInteger(pid) && pid > 0 && pid !== process.pid);

    return [...new Set(pids)];
}

/** Describe a process so we only stop Node dev servers, never unrelated apps. */
function processName(pid) {
    if (process.platform === 'win32') {
        const row = run('tasklist', ['/FI', `PID eq ${pid}`, '/NH', '/FO', 'CSV']);
        return row.split(',')[0]?.replaceAll('"', '').trim() ?? '';
    }
    return run('ps', ['-p', String(pid), '-o', 'comm=']).trim();
}

/** True once the process has exited. */
function hasExited(pid) {
    try {
        process.kill(pid, 0);
        return false;
    } catch {
        return true;
    }
}

/** Ask a process to exit, escalating to SIGKILL only if it ignores SIGTERM. */
async function stopProcess(pid) {
    try {
        process.kill(pid, 'SIGTERM');
    } catch {
        return;
    }

    for (let attempt = 0; attempt < 20; attempt += 1) {
        if (hasExited(pid)) {
            return;
        }
        await sleep(100);
    }

    try {
        process.kill(pid, 'SIGKILL');
    } catch {
        // Already gone between the check and the signal.
    }
}

const pids = listeningPids(PORT);

for (const pid of pids) {
    const name = processName(pid);

    if (!name.toLowerCase().includes('node')) {
        console.warn(`Port ${PORT} is used by ${name || 'an unknown process'} (pid ${pid}); leaving it running.`);
        continue;
    }

    console.log(`Stopping dev server on port ${PORT} (pid ${pid}).`);
    await stopProcess(pid);
}
