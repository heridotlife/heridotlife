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

/**
 * Fetch Inter font from Google Fonts
 * @returns {Promise<ArrayBuffer>} Font data
 */
async function fetchInterFont() {
  // Fetch Inter font (Regular weight) from Google Fonts
  const CSS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap';

  try {
    // Get CSS with font URLs
    const cssResponse = await fetch(CSS_URL, {
      headers: {
        // User agent is important to get TTF format
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const css = await cssResponse.text();

    // Extract first font URL (should be TTF or OTF)
    const fontUrlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.(?:ttf|otf))\)/);

    if (!fontUrlMatch) {
      throw new Error('Could not extract font URL from Google Fonts CSS');
    }

    const fontUrl = fontUrlMatch[1];
    console.log(`📥 Fetching font from: ${fontUrl}`);

    // Fetch the actual font file
    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error(`Failed to fetch font: ${fontResponse.statusText}`);
    }

    return await fontResponse.arrayBuffer();
  } catch (error) {
    console.error('Failed to fetch font from Google Fonts:', error);
    throw error;
  }
}

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
      fontFamily: 'Inter',
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
    // Fetch Inter font
    console.log('📥 Fetching Inter font from Google Fonts...');
    const fontData = await fetchInterFont();
    console.log('✅ Font loaded successfully\n');

    // Generate SVG using Satori
    console.log('📝 Rendering SVG with Satori...');
    const svg = await satori(ogImage, {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
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

    // Save to src/assets/og.png
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
