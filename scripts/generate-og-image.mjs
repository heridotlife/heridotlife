#!/usr/bin/env node

/**
 * Generate custom OG (Open Graph) image for heridotlife
 *
 * Creates a 1200x630px image with:
 * - Name: Heri Rusmanto
 * - Title: DevOps & Backend Engineer
 * - Location: Tokyo, Japan
 * - Website: heri.life
 * - Brand colors: Sky blue gradient
 */

/* global URL */

import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// OG Image dimensions
const WIDTH = 1200;
const HEIGHT = 630;

// Design the OG image using JSX-like syntax
const ogImage = {
  type: 'div',
  props: {
    style: {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '80px',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #3b82f6 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    children: [
      // Name
      {
        type: 'div',
        props: {
          style: {
            fontSize: 80,
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1.2,
            marginBottom: 20,
            letterSpacing: '-0.02em',
          },
          children: 'Heri Rusmanto',
        },
      },
      // Title line 1
      {
        type: 'div',
        props: {
          style: {
            fontSize: 42,
            fontWeight: 600,
            color: '#f1f5f9',
            lineHeight: 1.3,
            marginBottom: 8,
          },
          children: 'DevOps & Backend Engineer',
        },
      },
      // Title line 2
      {
        type: 'div',
        props: {
          style: {
            fontSize: 36,
            fontWeight: 500,
            color: '#e2e8f0',
            lineHeight: 1.3,
            marginBottom: 40,
          },
          children: 'Infrastructure System Engineer',
        },
      },
      // Location and website container
      {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: 30,
            marginTop: 'auto',
          },
          children: [
            // Location
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 28,
                  fontWeight: 500,
                  color: '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                },
                children: '🗼 Tokyo, Japan',
              },
            },
            // Separator
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 28,
                  color: '#94a3b8',
                },
                children: '•',
              },
            },
            // Website
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 28,
                  fontWeight: 600,
                  color: '#ffffff',
                },
                children: 'heri.life',
              },
            },
          ],
        },
      },
    ],
  },
};

async function generateOGImage() {
  console.log('🎨 Generating custom OG image for heridotlife...\n');

  try {
    // Generate SVG using Satori
    console.log('📝 Rendering SVG with Satori...');
    const svg = await satori(ogImage, {
      width: WIDTH,
      height: HEIGHT,
      fonts: [], // Using system fonts
    });

    // Convert SVG to PNG using Resvg
    console.log('🖼️  Converting SVG to PNG...');
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: WIDTH,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Save to src/assets/og.jpg (we'll convert to JPEG)
    const outputPath = join(__dirname, '..', 'src', 'assets', 'og.png');
    await writeFile(outputPath, pngBuffer);

    console.log('\n✅ OG image generated successfully!');
    console.log(`📁 Saved to: ${outputPath}`);
    console.log(`📐 Dimensions: ${WIDTH}x${HEIGHT}px`);
    console.log(`💾 Size: ${(pngBuffer.length / 1024).toFixed(2)} KB\n`);

    // Also save to public/images/ for direct access
    const publicPath = join(__dirname, '..', 'public', 'images', 'og.png');
    await writeFile(publicPath, pngBuffer);
    console.log(`📁 Also saved to: ${publicPath}\n`);

    console.log('🎯 Next steps:');
    console.log('1. Convert PNG to JPEG for smaller file size:');
    console.log('   pnpm run og:convert');
    console.log('2. Or use the PNG as-is (slightly larger but supports transparency)');
    console.log('3. Rebuild and deploy: pnpm build && pnpm wrangler deploy\n');
  } catch (error) {
    console.error('❌ Failed to generate OG image:', error);
    process.exit(1);
  }
}

generateOGImage();
