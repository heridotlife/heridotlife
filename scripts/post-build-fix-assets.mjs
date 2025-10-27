#!/usr/bin/env node

/**
 * Post-build script to fix asset locations for Cloudflare Workers deployment
 *
 * The Cloudflare adapter in advanced mode places CSS files in dist/_worker.js/_astro/
 * but they need to be in dist/_astro/ to be served as static assets.
 *
 * This script:
 * 1. Copies CSS files from dist/_worker.js/_astro/ to dist/_astro/
 * 2. Creates .assetsignore to exclude _worker.js from being uploaded as asset
 */

/* global URL */

import { copyFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const workerAstroDir = join(distDir, '_worker.js', '_astro');
const distAstroDir = join(distDir, '_astro');

async function main() {
  try {
    console.log('📦 Fixing asset locations for Cloudflare Workers...');

    // Create .assetsignore to exclude worker script
    const assetsignorePath = join(distDir, '.assetsignore');
    await writeFile(assetsignorePath, '_worker.js\n', 'utf-8');
    console.log('✅ Created .assetsignore');

    // Copy CSS files from _worker.js/_astro/ to _astro/
    try {
      const files = await readdir(workerAstroDir);
      const cssFiles = files.filter((f) => f.endsWith('.css'));

      if (cssFiles.length > 0) {
        // Ensure dist/_astro directory exists
        await mkdir(distAstroDir, { recursive: true });

        // Copy each CSS file
        for (const file of cssFiles) {
          const srcPath = join(workerAstroDir, file);
          const destPath = join(distAstroDir, file);
          await copyFile(srcPath, destPath);
          console.log(`✅ Copied ${file} to dist/_astro/`);
        }

        console.log(`✅ Fixed ${cssFiles.length} CSS file(s)`);
      } else {
        console.log('ℹ️  No CSS files found to copy');
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('ℹ️  No _worker.js/_astro directory found (this is OK for some builds)');
      } else {
        throw error;
      }
    }

    console.log('✅ Asset fix completed successfully');
  } catch (error) {
    console.error('❌ Failed to fix assets:', error);
    process.exit(1);
  }
}

main();
