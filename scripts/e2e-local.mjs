#!/usr/bin/env node
/* global setTimeout, clearTimeout */

/**
 * Run the e2e smoke suite against a locally booted worker.
 *
 * Steps: build → boot `wrangler dev` → wait until ready → run the BASE_URL-driven
 * e2e suite (tests/e2e) → tear the worker down. Mirrors how CI runs the same
 * suite against the Cloudflare preview, just with a local target.
 *
 * The worker build runs via the current package runner (`bun run build`); the
 * wrangler/vitest steps use the project-local binaries (node_modules/.bin).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BIN = path.join(ROOT, 'node_modules', '.bin');
const PORT = process.env.E2E_PORT || '8799';
const BASE_URL = `http://localhost:${PORT}`;
const E2E_HOST = 'heri.life'; // satisfies the worker's TRUSTED_HOSTS check

const bin = (name) => {
  const local = path.join(BIN, name);
  return existsSync(local) ? local : name;
};

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd: ROOT, ...opts });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`\`${cmd} ${args.join(' ')}\` exited ${code}`))
    );
  });

const waitForReady = (worker, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`worker not ready within ${timeoutMs}ms`)),
      timeoutMs
    );
    worker.stdout.on('data', (b) => {
      const s = b.toString();
      process.stdout.write(s);
      if (s.includes('Ready on')) {
        clearTimeout(timer);
        resolve();
      }
    });
    worker.stderr.on('data', (b) => process.stderr.write(b.toString()));
    worker.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`worker exited early (code ${code})`));
    });
  });

async function main() {
  console.log('\n▶ Building worker...');
  // Build via the current runtime's package runner (`bun run build`).
  await run(process.execPath, ['run', 'build']);

  console.log(`\n▶ Booting worker on ${BASE_URL}...`);
  const worker = spawn(bin('wrangler'), ['dev', '--port', PORT], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  const cleanup = () => {
    try {
      process.kill(-worker.pid, 'SIGKILL'); // kill the whole group (incl. workerd)
    } catch {
      /* already gone */
    }
  };

  try {
    await waitForReady(worker, 90_000);
    console.log('\n▶ Running e2e smoke tests...');
    await run(bin('vitest'), ['run', '-c', 'vitest.e2e.config.ts'], {
      env: { ...process.env, BASE_URL, E2E_HOST },
    });
  } finally {
    cleanup();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('\n✖ e2e:local failed:', err.message);
  process.exit(1);
});
