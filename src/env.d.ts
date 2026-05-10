/**
 * Global type definitions for Astro and Cloudflare Workers
 * @module env
 */

/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers environment bindings
 * Used to type the `env` export from "cloudflare:workers"
 */
interface CloudflareEnv {
  /** JWT secret for authentication (min 32 characters) */
  AUTH_SECRET: string;
  /** Admin password for login */
  ADMIN_PASSWORD: string;
  /** D1 database instance */
  D1_db: D1Database;
  /** KV namespace for caching */
  heridotlife_kv: KVNamespace;
  /** Canonical domain for the application */
  CANONICAL_DOMAIN?: string;
  /** Comma-separated list of trusted hosts */
  TRUSTED_HOSTS?: string;
  /** Allow string indexing for additional environment variables */
  [key: string]: string | D1Database | KVNamespace | undefined;
}

/**
 * Cloudflare Workers execution context
 */
interface CloudflareContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Cloudflare Workers runtime env shape used by cloudflare:workers virtual module
 */
declare namespace Cloudflare {
  interface Env {
    AUTH_SECRET: string;
    ADMIN_PASSWORD: string;
    D1_db: D1Database;
    heridotlife_kv: KVNamespace;
    CANONICAL_DOMAIN?: string;
    TRUSTED_HOSTS?: string;
    [key: string]: string | D1Database | KVNamespace | undefined;
  }
}

/**
 * Module declaration for cloudflare:workers
 * Provides typed access to Cloudflare Workers environment bindings
 */
declare module 'cloudflare:workers' {
  const env: CloudflareEnv;
}

/**
 * Astro App namespace for type augmentation
 */
declare namespace App {
  /**
   * Astro.locals - Available in all endpoints and middleware
   */
  interface Locals {
    runtime: {
      env: CloudflareEnv;
      cf: CfProperties;
      ctx: CloudflareContext;
    };
    /** CSP nonce for inline scripts (generated per request) */
    cspNonce: string;
  }
}
