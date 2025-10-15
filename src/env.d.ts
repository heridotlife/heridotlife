/* eslint-disable @typescript-eslint/triple-slash-reference */
/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        AUTH_SECRET: string;
        ADMIN_PASSWORD: string;
        D1_db: D1Database;
        heridotlife_kv: KVNamespace;
      };
      cf: CfProperties;
      ctx: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        waitUntil(promise: Promise<any>): void;
        passThroughOnException(): void;
      };
    };
  }
}
