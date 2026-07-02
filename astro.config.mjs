import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
/**
 * Deployment Strategy:
 * - Using Cloudflare adapter in advanced mode
 * - Deploying as Cloudflare Workers (not Pages) for better control
 * - The adapter builds successfully in Cloudflare's build environment
 * - D1 database and KV storage bindings work natively
 * - wrangler.jsonc configures Workers deployment with assets support
 */
export default defineConfig({
  site: 'https://heri.life',
  output: 'server',
  security: {
    // Astro-managed CSP (v6+): for SSR routes Astro emits the policy as a
    // content-security-policy response header, hashing its own inline
    // hydration scripts. The middleware adds a per-request 'nonce-…' script
    // resource for the project's is:inline scripts (see src/middleware.ts).
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:", // allow external OG images
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'", // prevents clickjacking
        "base-uri 'self'",
        "form-action 'self'",
        'upgrade-insecure-requests',
      ],
      scriptDirective: {
        resources: ["'self'"],
      },
      styleDirective: {
        // unsafe-inline is required for style="" attributes (theme icons) and
        // Tailwind-injected styles. Note: if Astro ever tracks a style hash,
        // browsers ignore unsafe-inline in this directive.
        resources: ["'self'", "'unsafe-inline'"],
      },
    },
  },
  adapter: cloudflare({
    // Use compile-time image optimization (works with free tier)
    // Images are optimized at build time instead of on-demand
    imageService: 'compile',
  }),
  integrations: [
    react({
      experimentalReactChildren: false,
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['react/jsx-dev-runtime', 'react/jsx-runtime'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        // eslint-disable-next-line no-undef
        process.env.NODE_ENV ?? 'development'
      ),
    },
    ssr: {
      // Explicitly externalize Node.js built-in modules for SSR
      // This prevents Vite warnings about automatic externalization
      external: ['node:fs/promises', 'node:path', 'node:url', 'node:crypto'],
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separate vendor chunks for better caching
            if (id.includes('node_modules')) {
              // React core (react / react-dom / scheduler) is intentionally NOT
              // split into its own chunk: a separate react-vendor chunk both
              // depends on and is depended upon by `vendor`, which Rollup warns
              // about as a circular chunk. Keeping it in the single `vendor`
              // chunk removes the cycle. (Splitting it was also what previously
              // separated satori's `css-to-react-native` from `css-color-keywords`
              // and crashed the worker with a `require$$0` TDZ error.)

              // Icon libraries (split separately as they're large)
              if (id.includes('lucide-react')) {
                return 'lucide-icons';
              }
              if (id.includes('react-icons')) {
                return 'react-icons';
              }
              // Validation and security libraries
              if (id.includes('jose') || id.includes('zod')) {
                return 'validation-libs';
              }
              // clsx / tailwind-merge are tiny and aren't present in every build
              // pass; a dedicated chunk for them produced an "empty chunk"
              // warning, so let them fall into `vendor`.
              // All other node_modules
              return 'vendor';
            }

            // Admin components - only loaded for admin pages
            if (id.includes('/components/admin/')) {
              return 'admin-components';
            }

            // UI components - shared across the site
            if (id.includes('/components/ui/')) {
              return 'ui-components';
            }
          },
        },
      },
    },
  },
});
