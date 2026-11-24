import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { createDb, type Db } from '@neodb/db';
import type { Pool } from 'pg';

export const DB = Symbol('DB');
export const POOL = Symbol('POOL');
export const InjectDb = () => Inject(DB);

const conn = createDb();

@Global()
@Module({
  providers: [
    { provide: DB, useValue: conn.db },
    { provide: POOL, useValue: conn.pool },
  ],
  exports: [DB, POOL],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: Pool) {}
  async onApplicationShutdown() { await this.pool.end(); }
}

export type { Db };
