#!/usr/bin/env node

/**
 * Convert OG PNG image to JPEG format for smaller file size
 *
 * Converts:
 * - src/assets/og.png → src/assets/og.jpg
 * - public/images/og.png → public/images/og.jpg
 *
 * JPEG provides better compression for photos/gradients
 * while maintaining good visual quality.
 */

/* global URL */

import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const JPEG_QUALITY = 90; // High quality JPEG (0-100)

async function convertToJpeg(inputPath, outputPath) {
  try {
    console.log(`📥 Reading: ${inputPath}`);
    const pngBuffer = await readFile(inputPath);

    console.log(`🔄 Converting to JPEG (quality: ${JPEG_QUALITY})...`);
    const jpegBuffer = await sharp(pngBuffer)
      .jpeg({
        quality: JPEG_QUALITY,
        progressive: true, // Progressive JPEG for better perceived loading
        mozjpeg: true, // Use MozJPEG for better compression
      })
      .toBuffer();

    console.log(`💾 Saving to: ${outputPath}`);
    await writeFile(outputPath, jpegBuffer);

    const pngSize = (pngBuffer.length / 1024).toFixed(2);
    const jpegSize = (jpegBuffer.length / 1024).toFixed(2);
    const savings = ((1 - jpegBuffer.length / pngBuffer.length) * 100).toFixed(1);

    console.log(`✅ Converted successfully!`);
    console.log(`   PNG:  ${pngSize} KB`);
    console.log(`   JPEG: ${jpegSize} KB`);
    console.log(`   📊 Saved ${savings}% file size\n`);

    return { pngSize, jpegSize, savings };
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🎨 Converting OG PNG images to JPEG format...\n');

  try {
    const files = [
      {
        input: join(__dirname, '..', 'src', 'assets', 'og.png'),
        output: join(__dirname, '..', 'src', 'assets', 'og.jpg'),
      },
      {
        input: join(__dirname, '..', 'public', 'images', 'og.png'),
        output: join(__dirname, '..', 'public', 'images', 'og.jpg'),
      },
    ];

    let totalSavings = 0;

    for (const file of files) {
      const result = await convertToJpeg(file.input, file.output);
      totalSavings += parseFloat(result.savings);
    }

    const avgSavings = (totalSavings / files.length).toFixed(1);

    console.log('✨ All conversions completed!');
    console.log(`📊 Average file size reduction: ${avgSavings}%\n`);

    console.log('🎯 Next steps:');
    console.log('1. Update your layout/pages to use og.jpg instead of og.png');
    console.log('2. Or keep both formats and serve based on browser support');
    console.log('3. Rebuild and deploy: bun run build && bunx wrangler deploy\n');
  } catch (error) {
    console.error('\n❌ Conversion failed:', error.message);
    process.exit(1);
  }
}

main();
