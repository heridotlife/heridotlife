/**
 * Global type definitions for Astro and Cloudflare Workers
 * @module env
 */

/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

/**
 * Cloudflare Workers environment bindings
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
  /**
   * Extend the request's lifetime until the promise resolves
   * Useful for background tasks that should complete even after response is sent
   */
  waitUntil(promise: Promise<unknown>): void;
  /**
   * Prevent Cloudflare's error page from being shown
   * Allow custom error handling
   */
  passThroughOnException(): void;
}

/**
 * Astro App namespace for type augmentation
 */
declare namespace App {
  /**
   * Astro.locals - Available in all endpoints and middleware
   */
  interface Locals {
    /** Cloudflare Workers runtime bindings */
    runtime: {
      /** Environment variables and bindings */
      env: CloudflareEnv;
      /** Cloudflare request properties (geo, colo, etc.) */
      cf: CfProperties;
      /** Execution context for worker lifecycle */
      ctx: CloudflareContext;
    };
  }
}
