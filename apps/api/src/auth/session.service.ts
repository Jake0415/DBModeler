import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { schema } from '@neodb/db';
import type { Actor, Role } from '@neodb/domain';
import { InjectDb, type Db } from '../common/db.provider';

export const SESSION_COOKIE = 'neodb_sid';
const IDLE_MIN = Number(process.env.SESSION_IDLE_MIN ?? 30);
const ABS_HOURS = Number(process.env.SESSION_ABSOLUTE_HOURS ?? 12);

const sha = (t: string) => createHash('sha256').update(t).digest('hex');

export interface SessionInfo { actor: Actor; sessionId: string; pwChangeOnly: boolean }

/** 기관 기준 오늘 (YYYY-MM-DD) — 서버 시간대 기준. 운영에서 기관 시간대를 설정값으로 */
export const todayStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

@Injectable()
export class SessionService {
  constructor(@InjectDb() private readonly db: Db) {}

  /** 로그인 성공 — 새 토큰(세션 ID 교체), 원문은 쿠키에만 */
  async create(userId: string, rev: number, opts: { pwChangeOnly?: boolean; ip?: string; ua?: string } = {}) {
    const token = randomBytes(32).toString('base64url');
    await this.db.insert(schema.sessions).values({
      id: sha(token), userId, rev, pwChangeOnly: !!opts.pwChangeOnly,
      expiresAt: new Date(Date.now() + ABS_HOURS * 3600 * 1000), ip: opts.ip, ua: opts.ua?.slice(0, 300),
    });
    return token;
  }

  async destroy(token: string) { await this.db.delete(schema.sessions).where(eq(schema.sessions.id, sha(token))); }

  /** 매 요청 — 유휴 · 절대 만료 · 회수(rev) · 계정 상태 · 사용 기한을 함께 본다 */
  async resolve(token: string | undefined): Promise<SessionInfo | null> {
    if (!token) return null;
    const id = sha(token);
    const rows = await this.db.select().from(schema.sessions).innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id)).where(eq(schema.sessions.id, id));
    const row = rows[0];
    if (!row) return null;
    const s = row.sessions, u = row.users, now = Date.now();
    const idleOver = now - s.lastSeen.getTime() > IDLE_MIN * 60 * 1000;
    const today = todayStr();
    if (s.expiresAt.getTime() < now || idleOver || s.rev !== u.sessRev || u.status === 'stopped' || (u.until && u.until < today)) {
      await this.db.delete(schema.sessions).where(eq(schema.sessions.id, id));
      return null;
    }
    if (now - s.lastSeen.getTime() > 60 * 1000) await this.db.update(schema.sessions).set({ lastSeen: new Date() }).where(and(eq(schema.sessions.id, id)));
    return { actor: await this.actorOf(u.id), sessionId: id, pwChangeOnly: s.pwChangeOnly };
  }

  /** DB 행 → 권한 판정용 Actor */
  async actorOf(userId: string): Promise<Actor> {
    const [u] = await this.db.select().from(schema.users).where(eq(schema.users.id, userId));
    if (!u) throw new Error('user not found');
    const roles = (await this.db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, userId))).map((r) => r.role as Role);
    const systems = (await this.db.select().from(schema.userSystems).where(eq(schema.userSystems.userId, userId))).map((r) => r.systemCode);
    return {
      id: u.id, name: u.name, roles, systems, status: u.status, kind: u.kind,
      until: u.until ?? undefined, viewScope: u.viewScope ?? undefined, pwTemp: u.pwTemp,
    };
  }

  /** 권한 회수 · 중지 · 비밀번호 초기화 — 그 사람의 열린 세션을 모두 끝낸다 */
  async revokeAll(userId: string) {
    const [u] = await this.db.select({ rev: schema.users.sessRev }).from(schema.users).where(eq(schema.users.id, userId));
    await this.db.update(schema.users).set({ sessRev: (u?.rev ?? 0) + 1 }).where(eq(schema.users.id, userId));
    await this.db.delete(schema.sessions).where(eq(schema.sessions.userId, userId));
  }
}
