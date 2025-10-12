import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'advanced',
    functionPerRoute: false,
  }),
  integrations: [
    tailwind(),
    react({
      experimentalReactChildren: false,
    }),
  ],
  // Configure image service for Cloudflare Pages
  // Use 'compile' service to optimize images with sharp during build time
  // This suppresses the runtime Sharp warning for Cloudflare
  image: {
    service: {
      entrypoint: 'astro/assets/services/compile',
      config: {
        limitInputPixels: false,
      },
    },
  },
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(
        // eslint-disable-next-line no-undef
        process.env.NODE_ENV ?? 'development'
      ),
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom'],
            'lucide-icons': ['lucide-react'],
            'ui-components': [
              './src/components/ui/Button.tsx',
              './src/components/ui/Input.tsx',
              './src/components/ui/Card.tsx',
            ],
          },
        },
      },
    },
  },
});
