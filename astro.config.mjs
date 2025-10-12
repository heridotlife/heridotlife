import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    mode: 'directory'
  }),
  integrations: [tailwind(), react()],
  // Note: Image optimization is disabled in server mode on Cloudflare Pages
  // The adapter automatically switches to 'noop' service for compatibility
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development')
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
              './src/components/ui/Card.tsx'
            ]
          }
        }
      }
    }
  }
});