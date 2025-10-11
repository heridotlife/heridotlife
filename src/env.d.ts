/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

declare namespace App {
  interface Locals {
    runtime: {
      env: {
        AUTH_SECRET: string;
        ADMIN_PASSWORD: string;
        D1_db: D1Database;
      };
      cf: CfProperties;
      ctx: {
        waitUntil(promise: Promise<any>): void;
        passThroughOnException(): void;
      };
    };
  }
}
