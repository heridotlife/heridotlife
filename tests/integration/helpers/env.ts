import { Miniflare } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { D1Database, KVNamespace } from '@cloudflare/workers-types';

// Single source of truth for the schema — the same file applied to production D1.
const SCHEMA_PATH = path.resolve(process.cwd(), 'schema.sql');

export interface TestEnv {
  db: D1Database;
  kv: KVNamespace;
  session: KVNamespace;
  /** Tear down the underlying workerd/miniflare instance. Call in afterAll. */
  dispose: () => Promise<void>;
}

/**
 * Boot an isolated miniflare instance with real D1 + KV bindings and apply the
 * production schema. Unlike the unit suite (which mocks D1), this runs the real
 * SQLite engine — so FTS5, triggers, and constraints are actually exercised.
 *
 * We use miniflare directly rather than @cloudflare/vitest-pool-workers because
 * that package's config API is mid-rework on the Vitest 4 line; miniflare's API
 * is stable and gives the same real D1.
 */
export async function createTestEnv(): Promise<TestEnv> {
  const mf = new Miniflare({
    modules: true,
    // A worker script is required to boot; the integration tests don't use it —
    // they call the data-layer functions against the bindings below.
    script: 'export default { fetch() { return new Response("integration-test"); } };',
    compatibilityDate: '2026-04-21',
    compatibilityFlags: ['nodejs_compat'],
    d1Databases: { D1_db: 'integration-test' },
    kvNamespaces: ['heridotlife_kv', 'SESSION'],
  });

  const db = (await mf.getD1Database('D1_db')) as unknown as D1Database;
  await applySchema(db);

  return {
    db,
    kv: (await mf.getKVNamespace('heridotlife_kv')) as unknown as KVNamespace,
    session: (await mf.getKVNamespace('SESSION')) as unknown as KVNamespace,
    dispose: () => mf.dispose(),
  };
}

async function applySchema(db: D1Database): Promise<void> {
  const sql = readFileSync(SCHEMA_PATH, 'utf8');
  // wrangler's splitter keeps FTS5 trigger `BEGIN … END` blocks intact.
  const statements = unstable_splitSqlQuery(sql)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const statement of statements) {
    await db.prepare(statement).run();
  }
}
