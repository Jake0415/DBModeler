import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export * as schema from './schema';
export type Db = NodePgDatabase<typeof schema>;

export const DEFAULT_DATABASE_URL = 'postgres://neodb:neodb-dev@localhost:55432/neodb';

/** 연결 풀 하나 — API · worker · collab가 각자 하나씩 만든다 (풀 크기 상한은 운영에서 조정) */
export function createDb(url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL, max = 10): { db: Db; pool: Pool } {
  const pool = new Pool({ connectionString: url, max });
  return { db: drizzle(pool, { schema }), pool };
}
