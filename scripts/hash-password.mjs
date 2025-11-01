#!/usr/bin/env node
/**
 * Password hashing utility for generating PBKDF2 password hashes
 *
 * Usage:
 *   node scripts/hash-password.mjs <your-password>
 *
 * Or interactively:
 *   node scripts/hash-password.mjs
 *
 * The generated hash should be set as the ADMIN_PASSWORD environment variable
 * in your .env or .dev.vars file.
 */

/* eslint-env node */
/* global TextEncoder */

import { createInterface } from 'readline';
import { webcrypto } from 'crypto';

// Use Node's webcrypto for compatibility with Web Crypto API
const crypto = webcrypto;

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

/**
 * Hash a password using PBKDF2 with a random salt
 */
async function hashPassword(password) {
  const iterations = 600000; // OWASP recommended minimum for PBKDF2-SHA256
  const saltLength = 16; // 128 bits
  const hashLength = 32; // 256 bits

  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(saltLength));

  // Import password as key material
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    hashLength * 8 // bits
  );

  // Format: algorithm:iterations:salt:hash (all base64 encoded)
  const saltBase64 = arrayBufferToBase64(salt);
  const hashBase64 = arrayBufferToBase64(hashBuffer);

  return `pbkdf2:${iterations}:${saltBase64}:${hashBase64}`;
}

/**
 * Get password from command line or prompt
 */
async function getPassword() {
  // Check if password was provided as command line argument
  if (process.argv[2]) {
    return process.argv[2];
  }

  // Otherwise, prompt for password
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter password to hash: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log('🔐 Password Hash Generator\n');

  try {
    const password = await getPassword();

    if (!password || password.trim().length === 0) {
      console.error('❌ Error: Password cannot be empty');
      process.exit(1);
    }

    // Validate password strength
    if (password.length < 12) {
      console.warn(
        '⚠️  Warning: Password is less than 12 characters. Consider using a stronger password.'
      );
    }

    console.log('\n⏳ Hashing password (this may take a moment)...\n');

    const startTime = Date.now();
    const hashedPassword = await hashPassword(password);
    const endTime = Date.now();

    console.log('✅ Password hashed successfully!\n');
    console.log('Hash generation time:', `${endTime - startTime}ms\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Add this to your .env or .dev.vars file:\n');
    console.log(`ADMIN_PASSWORD="${hashedPassword}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('For Cloudflare Workers (production), use wrangler:');
    console.log(`wrangler secret put ADMIN_PASSWORD`);
    console.log('Then paste the hash when prompted.\n');

    console.log('ℹ️  Security Notes:');
    console.log('  • This hash uses PBKDF2 with 600,000 iterations (OWASP recommended)');
    console.log('  • Each hash includes a unique random salt');
    console.log('  • Store the hash securely in environment variables');
    console.log('  • Never commit the hash to version control\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
