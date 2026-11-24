import { randomBytes } from 'node:crypto';
import { hash } from '@node-rs/argon2';
import { eq } from 'drizzle-orm';
import { createDb } from '../index';
import { users, userRoles, userSystems, auditEvents } from '../schema';

/**
 * 최초 관리자 한 명만 만든다 — 운영 설치에서 목업 계정은 만들지 않는다 (§13.6).
 * 임시 비밀번호는 한 번만 출력하고, 첫 로그인에서 바꾸기 전에는 비밀번호 변경만 할 수 있다.
 */
async function main() {
  const id = (process.env.SEED_ADMIN_ID ?? 'admin').toLowerCase();
  const name = process.env.SEED_ADMIN_NAME ?? '시스템 관리자';
  const { db, pool } = createDb(undefined, 1);
  const exists = await db.select({ id: users.id }).from(users).where(eq(users.id, id));
  if (exists.length) { console.log(`이미 있습니다: ${id} — 아무것도 바꾸지 않았습니다`); await pool.end(); return; }
  const temp = randomBytes(9).toString('base64url') + '!7';
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id, name, mail: `${id}@localhost`, pwHash: await hash(temp), pwTemp: true, pwTempUntil: new Date(Date.now() + 24 * 3600 * 1000), pwAt: new Date() });
    await tx.insert(userRoles).values({ userId: id, role: 'admin' });
    await tx.insert(userSystems).values({ userId: id, systemCode: '전체' });
    await tx.insert(auditEvents).values({ actorId: null, actorName: '설치', act: '최초 관리자 발급', target: id, kind: 'admin' });
  });
  await pool.end();
  console.log(`최초 관리자 ${id}를 만들었습니다. 임시 비밀번호(24시간, 한 번만 표시): ${temp}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
