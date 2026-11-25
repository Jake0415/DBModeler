import { hash } from '@node-rs/argon2';
import { TEST_ACCOUNTS } from '@neodb/domain';
import { and, inArray, sql } from 'drizzle-orm';
import { createDb, DEFAULT_DATABASE_URL } from '../index';
import { users, userRoles, userSystems, sessions, auditEvents } from '../schema';

/**
 * 개발 · 시험 전용 계정을 만든다 — 계정 정의는 @neodb/domain TEST_ACCOUNTS (docs/impl/00-orchestration-plan.md §9.1).
 * - 운영에서는 만들지 않는다: NODE_ENV=production 이면 거부, `--test-accounts` 인자가 있어야 실행(§13.6).
 * - 다시 실행하면 같은 ID의 시드 계정을 지우고 새로 만든다(세션도 끝남) — 시나리오마다 같은 출발점.
 * - 비밀번호: 환경 변수 TEST_PASSWORD(.env.example 의 시험값). 시험 계정에만 쓴다.
 * - 위임(town2 대리인)은 스키마가 생기는 P4에서 추가한다(후속 F-001).
 */

/** 시드가 만든 계정 표시 — 이 메일 도메인인 계정만 지우고 다시 만든다 */
const TEST_MAIL_DOMAIN = '@test.localhost';
const SEED_ACTOR = 'system:seed-test';

/** 개발 DB(docker-compose.dev.yml)만 허용: localhost:55432, DB 이름 neodb 또는 neodb_* */
function assertDevDatabase(url: string): void {
  let u: URL;
  try { u = new URL(url); } catch { throw new Error('DATABASE_URL 형식을 읽지 못했습니다.'); }
  const host = u.hostname.replace(/^\[|\]$/g, '');
  const db = decodeURIComponent(u.pathname.replace(/^\//, ''));
  const okHost = ['localhost', '127.0.0.1', '::1'].includes(host);
  const okPort = u.port === '55432';
  const okDb = db === 'neodb' || /^neodb_[a-z0-9_]+$/.test(db);
  // pg 는 쿼리 매개변수(host · port · hostaddr 등)를 URL 본문보다 우선한다 — 쿼리가 붙은 주소는 받지 않는다
  if (u.search || u.hash) throw new Error('시험 계정 시드는 쿼리 매개변수가 없는 개발 DB 주소만 받습니다.');
  if (!okHost || !okPort || !okDb) {
    throw new Error(`개발 DB가 아닙니다(${host}:${u.port}/${db}). 시험 계정은 localhost:55432 의 neodb · neodb_* 에만 만듭니다.`);
  }
}

function ymd(days: number): string {
  const d = new Date(Date.now() + days * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('운영(NODE_ENV=production)에서는 시험 계정을 만들지 않습니다.');
  if (!process.argv.includes('--test-accounts')) throw new Error('시험 계정 시드는 --test-accounts 인자가 있어야 실행합니다(npm run db:seed:test).');
  const pw = process.env.TEST_PASSWORD;
  if (!pw || pw.length < 12) throw new Error('TEST_PASSWORD(12자 이상)가 없습니다. .env.example 을 참고해 .env 에 넣으세요.');

  const url = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;
  assertDevDatabase(url);

  const { db, pool } = createDb(url, 1);
  const ids = TEST_ACCOUNTS.map((a) => a.id);
  const pwHash = await hash(pw);
  const now = new Date();
  await db.transaction(async (tx) => {
    // 같은 ID인데 시드가 만든 계정이 아니면 건드리지 않고 중단
    // 행을 잠그고 확인한다(확인과 삭제 사이에 바뀌지 않게)
    const existing = await tx.select({ id: users.id, mail: users.mail }).from(users).where(inArray(users.id, ids)).for('update');
    const foreign = existing.filter((r) => !r.mail.toLowerCase().endsWith(TEST_MAIL_DOMAIN));
    if (foreign.length) throw new Error(`시험 계정과 같은 ID의 다른 계정이 있어 중단합니다: ${foreign.map((r) => r.id).join(', ')}`);
    // 삭제할 때도 시드 계정 조건을 건다 — sessions · user_roles · user_systems 는 cascade
    const seedOnly = and(inArray(users.id, ids), sql`lower(${users.mail}) like ${'%' + TEST_MAIL_DOMAIN}`);
    await tx.delete(sessions).where(inArray(sessions.userId, tx.select({ id: users.id }).from(users).where(seedOnly)));
    await tx.delete(users).where(seedOnly);
    // 그 사이 같은 ID로 다른 계정이 생겼다면 아래 insert 가 기본 키 충돌로 실패해 전체가 되돌려진다
    for (const a of TEST_ACCOUNTS) {
      await tx.insert(users).values({
        id: a.id,
        name: a.name,
        company: a.kind === 'out' ? '(주)시험정보' : a.kind === 'aud' ? '(주)시험감리' : '시험기관',
        org: '시험',
        mail: `${a.id}${TEST_MAIL_DOMAIN}`,
        status: a.status ?? 'active',
        kind: a.kind ?? 'in',
        projectId: a.project ?? null,
        until: a.untilDays === undefined ? null : ymd(a.untilDays),
        pwHash,
        pwTemp: a.pwTemp ?? false,
        pwTempUntil: a.pwTemp ? new Date(now.getTime() + 24 * 3600 * 1000) : null, // 사양: 24시간
        pwAt: now,
      });
      if (a.roles.length) await tx.insert(userRoles).values(a.roles.map((role) => ({ userId: a.id, role })));
      if (a.systems.length) await tx.insert(userSystems).values(a.systems.map((systemCode) => ({ userId: a.id, systemCode })));
    }
    await tx.insert(auditEvents).values({ actorId: SEED_ACTOR, actorName: '시험 시드', act: '시험 계정 재생성', target: ids.join(','), why: '개발 · 시험 전용 계정 초기화(db:seed:test)', kind: 'admin' });
  });
  await pool.end();
  console.log(`시험 계정 ${ids.length}개를 만들었습니다: ${ids.join(', ')} (비밀번호 = TEST_PASSWORD)`);
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
