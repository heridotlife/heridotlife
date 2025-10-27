#!/usr/bin/env node

/**
 * Build Wrapper Script
 *
 * Runs `astro build` and handles the ESM loader error that occurs locally
 * with the Cloudflare adapter. The error happens after the build completes
 * successfully, so we check the dist output and run postbuild if needed.
 *
 * Expected error (can be safely ignored):
 * "Only URLs with a scheme in: file, data, and node are supported by the
 *  default ESM loader. Received protocol 'cloudflare:'"
 */

/* global URL */

import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = join(__dirname, '..');

async function checkBuildOutput() {
  try {
    // Check if critical build outputs exist
    await access(join(rootDir, 'dist', '_worker.js', 'index.js'));
    return true;
  } catch {
    return false;
  }
}

async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    proc.on('close', (code) => {
      resolve(code);
    });

    proc.on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  console.log('🚀 Starting Astro build...\n');

  // Run astro build
  const buildCode = await runCommand('astro', ['build']);

  // Check if build actually succeeded by verifying output
  const buildSucceeded = await checkBuildOutput();

  if (!buildSucceeded && buildCode !== 0) {
    console.error('\n❌ Build failed - dist output is incomplete');
    process.exit(1);
  }

  if (buildCode !== 0) {
    console.log('\n⚠️  Build exited with error code (likely ESM loader issue)');
    console.log('   This is expected locally with Cloudflare adapter');
  }

  if (buildSucceeded) {
    console.log('\n✅ Build output is valid, running post-build fixes...\n');

    // Run post-build script
    const postBuildCode = await runCommand('node', ['scripts/post-build-fix-assets.mjs']);

    if (postBuildCode !== 0) {
      console.error('\n❌ Post-build script failed');
      process.exit(1);
    }

    console.log('\n✅ Build completed successfully!\n');
    process.exit(0);
  } else {
    console.error('\n❌ Build failed');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Build wrapper error:', error);
  process.exit(1);
});
