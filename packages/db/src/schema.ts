import { sql } from 'drizzle-orm';
import { bigint, bigserial, boolean, date, index, integer, pgSchema, primaryKey, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

/**
 * B0 스키마 — 계정 · 역할 · 담당 시스템 · 세션 · 감사.
 * 모듈마다 PostgreSQL 스키마를 나눈다(백엔드 구성안 §4.1). 나머지(사전 · 결재 · 모델)는 B1부터.
 */
export const iam = pgSchema('iam');
export const audit = pgSchema('audit');

export const users = iam.table(
  'users',
  {
    id: text('id').primaryKey(), // 로그인 ID — 삭제해도 영구 예약(reserved_ids)
    name: text('name').notNull(),
    company: text('company').notNull().default(''),
    org: text('org').notNull().default(''),
    phone: text('phone').notNull().default(''),
    mail: text('mail').notNull(),
    status: text('status', { enum: ['active', 'stopped', 'locked'] }).notNull().default('active'),
    kind: text('kind', { enum: ['in', 'out', 'aud'] }).notNull().default('in'),
    projectId: text('project_id'),
    until: date('until'), // 사용 기한 (외주 · 감리 필수)
    viewScope: text('view_scope', { enum: ['org', 'sys'] }), // 예외만 저장
    viewWhy: text('view_why'),
    auth: text('auth', { enum: ['local', 'sso'] }).notNull().default('local'),
    pwHash: text('pw_hash'),
    pwTemp: boolean('pw_temp').notNull().default(false),
    pwTempUntil: timestamp('pw_temp_until', { withTimezone: true }),
    pwAt: timestamp('pw_at', { withTimezone: true }),
    fails: integer('fails').notNull().default(0),
    lockUntil: timestamp('lock_until', { withTimezone: true }),
    /** 오르면 그 사람의 열린 세션이 모두 끝난다 (권한 회수 · 중지 · 기한 만료 · 비밀번호 초기화) */
    sessRev: bigint('sess_rev', { mode: 'number' }).notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_mail_uq').on(sql`lower(${t.mail})`)],
);

export const userRoles = iam.table(
  'user_roles',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['modeler', 'da', 'owner', 'admin', 'auditor'] }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

export const userSystems = iam.table(
  'user_systems',
  {
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    systemCode: text('system_code').notNull(), // 시스템 코드 또는 '전체'
  },
  (t) => [primaryKey({ columns: [t.userId, t.systemCode] })],
);

export const reservedIds = iam.table('reserved_ids', {
  id: text('id').primaryKey(),
  at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = iam.table(
  'sessions',
  {
    /** 쿠키 토큰의 SHA-256 — 토큰 원문은 저장하지 않는다 */
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    /** 만들 때의 users.sess_rev — 다르면 무효 */
    rev: bigint('rev', { mode: 'number' }).notNull(),
    /** 임시 비밀번호 변경 전용 세션 (14 §8) */
    pwChangeOnly: boolean('pw_change_only').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    lastSeen: timestamp('last_seen', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ip: text('ip'),
    ua: text('ua'),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/** 추가만 하는 감사 로그 — 운영 DB 계정은 INSERT · SELECT만 (B5에서 권한 분리 · 월 파티션) */
export const auditEvents = audit.table(
  'events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    at: timestamp('at', { withTimezone: true }).notNull().defaultNow(),
    actorId: text('actor_id'), // 불변 실행자 키
    actorName: text('actor_name'), // 당시 이름
    forId: text('for_id'), // 대리였다면 원 담당자
    act: text('act').notNull(),
    target: text('target').notNull().default(''),
    why: text('why').notNull().default(''),
    sysCode: text('sys_code'), // 감리 열람 범위 판정용
    kind: text('kind', { enum: ['admin', 'work'] }).notNull().default('work'),
    result: text('result', { enum: ['ok', 'denied', 'failed'] }).notNull().default('ok'),
    ip: text('ip'),
  },
  (t) => [index('events_at_idx').on(t.at), index('events_actor_idx').on(t.actorId)],
);
