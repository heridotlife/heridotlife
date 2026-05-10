#!/usr/bin/env node

/**
 * Post-build script to fix asset locations for Cloudflare Workers deployment
 *
 * For Astro 6: The adapter places all client assets in dist/client/ which is correct
 * for Workers Assets. This script just creates .assetsignore to exclude server code.
 *
 * This script:
 * 1. Creates .assetsignore to exclude server directory from static assets
 */

/* global URL */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

async function main() {
  try {
    console.log('📦 Fixing asset locations for Cloudflare Workers...');

    // Create .assetsignore to exclude server directory
    const assetsignorePath = join(distDir, 'client', '.assetsignore');
    await writeFile(assetsignorePath, 'server\n_worker.js\n', 'utf-8');
    console.log('✅ Created .assetsignore');

    console.log('✅ Asset fix completed successfully');
  } catch (error) {
    console.error('❌ Failed to fix assets:', error);
    process.exit(1);
  }
}

main();
