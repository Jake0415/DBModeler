import path from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDb } from '../index';

/** 마이그레이션은 배포 때 한 번만 실행한다 (백엔드 구성안 §8 · §13.7) */
async function main() {
  const { db, pool } = createDb(undefined, 1);
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../migrations') });
  await pool.end();
  console.log('마이그레이션을 적용했습니다');
}
main().catch((e) => { console.error(e); process.exit(1); });
