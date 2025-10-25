#!/usr/bin/env node

/**
 * Post-build script to create Cloudflare Workers entry point
 * This runs after `astro build` to add the _worker.js file to dist/
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const distDir = join(__dirname, '..', 'dist');

const workerCode = `/**
 * Cloudflare Workers Entry Point for Astro Node.js Build
 *
 * This worker wraps the Astro Node.js adapter output to run on Cloudflare Pages/Workers.
 * Requires nodejs_compat flag in wrangler.toml for Node.js API support.
 */

// Import the Astro request handler from Node.js adapter output
import { handler } from './server/entry.mjs';

/**
 * Main fetch handler for Cloudflare Workers
 * @param {Request} request - Incoming request
 * @param {Object} env - Environment bindings (D1, KV, vars)
 * @param {Object} ctx - Execution context
 * @returns {Response} - Response from Astro app
 */
export default {
  async fetch(request, env, ctx) {
    try {
      // The Node.js adapter handler expects IncomingMessage/ServerResponse
      // but Cloudflare Workers use Web APIs (Request/Response)
      // We need to adapt the request for the Node.js handler

      // Create a modified request with Cloudflare locals
      const requestWithLocals = new Request(request, {
        duplex: 'half',
      });

      // Attach Cloudflare environment to the request
      // This will be available in Astro.locals.runtime
      requestWithLocals.locals = {
        runtime: {
          env: {
            // D1 Database binding
            D1_db: env.D1_db,
            // KV namespace bindings
            heridotlife_kv: env.heridotlife_kv,
            SESSION: env.SESSION,
            // Environment variables
            TRUSTED_HOSTS: env.TRUSTED_HOSTS,
            CANONICAL_DOMAIN: env.CANONICAL_DOMAIN,
          },
          // Cloudflare execution context for waitUntil
          ctx: {
            waitUntil: (promise) => ctx.waitUntil(promise),
          },
        },
      };

      // Call the Astro handler with the request
      const response = await handler(requestWithLocals);

      return response;
    } catch (error) {
      console.error('[Cloudflare Worker] Error:', error);

      // Return error response
      return new Response(\`Internal Server Error: \${error.message}\`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  },
};
`;

async function main() {
  try {
    const workerPath = join(distDir, '_worker.js');
    await writeFile(workerPath, workerCode, 'utf-8');
    console.log('✅ Created Cloudflare Workers entry point:', workerPath);
  } catch (error) {
    console.error('❌ Failed to create _worker.js:', error);
    process.exit(1);
  }
}

main();
