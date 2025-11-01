#!/usr/bin/env node
/**
 * Password verification utility to test if a password matches a hash
 *
 * Usage:
 *   node scripts/verify-password.mjs <password-to-test> <hash>
 *
 * Or test against .env:
 *   node scripts/verify-password.mjs <password-to-test>
 */

/* eslint-env node */
/* global TextEncoder */

import { webcrypto } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const crypto = webcrypto;

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64) {
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Constant-time buffer comparison
 */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Verify password against PBKDF2 hash
 */
async function verifyPassword(password, hashedPassword) {
  try {
    const parts = hashedPassword.split(':');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      console.error('❌ Invalid password hash format');
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const salt = base64ToUint8Array(parts[2]);
    const storedHash = base64ToUint8Array(parts[3]);

    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt.buffer,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      storedHash.length * 8
    );

    const computedHash = new Uint8Array(hashBuffer);
    return timingSafeEqual(computedHash, storedHash);
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/verify-password.mjs <password> [hash]');
    console.log('');
    console.log('If hash is not provided, it will read from .env file');
    process.exit(1);
  }

  const passwordToTest = args[0];
  let hashedPassword = args[1];

  // If no hash provided, read from .env
  if (!hashedPassword) {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const envPath = join(__dirname, '..', '.env');
      const envContent = readFileSync(envPath, 'utf-8');

      const match = envContent.match(/^ADMIN_PASSWORD="?([^"\n]+)"?/m);
      if (match) {
        hashedPassword = match[1];
        console.log('📄 Reading hash from .env file...\n');
      } else {
        console.error('❌ ADMIN_PASSWORD not found in .env file');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Could not read .env file:', error.message);
      process.exit(1);
    }
  }

  console.log('🔐 Verifying password...\n');
  console.log(`Password: ${passwordToTest}`);
  console.log(`Hash: ${hashedPassword.substring(0, 50)}...\n`);

  const startTime = Date.now();
  const isValid = await verifyPassword(passwordToTest, hashedPassword);
  const endTime = Date.now();

  if (isValid) {
    console.log('✅ Password is VALID!');
    console.log(`⏱️  Verification took ${endTime - startTime}ms\n`);
  } else {
    console.log('❌ Password is INVALID');
    console.log(`⏱️  Verification took ${endTime - startTime}ms\n`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
