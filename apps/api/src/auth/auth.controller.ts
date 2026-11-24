import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { hash, verify } from '@node-rs/argon2';
import { desc, eq } from 'drizzle-orm';
import { schema } from '@neodb/db';
import { ROLE_NAME, type Actor } from '@neodb/domain';
import { PERMS, canUser } from '@neodb/rules';
import { AuditService } from '../common/audit.service';
import { InjectDb, type Db } from '../common/db.provider';
import { bad, unauth } from '../common/errors';
import { Can, CurrentActor, Public, PwChangeAllowed, baseCtx } from './guards';
import { SESSION_COOKIE, SessionService, todayStr } from './session.service';

const LOCK_FAILS = 5, LOCK_MIN = 10;
const cookieOpts = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production' };

/** 비밀번호 규칙 — 목업 pwProblems와 같은 기준(9자 이상 · 영문 · 숫자 · 특수문자 · ID/이름 포함 금지) */
export function pwProblems(id: string, pw: string, name: string): string[] {
  const p: string[] = [];
  if (pw.length < 9) p.push('9자 이상');
  if (!/[A-Za-z]/.test(pw)) p.push('영문 포함');
  if (!/[0-9]/.test(pw)) p.push('숫자 포함');
  if (!/[!-/:-@[-`{-~]/.test(pw)) p.push('특수문자 포함');
  if (pw.toLowerCase().includes(id.toLowerCase()) || (name && pw.includes(name))) p.push('ID · 이름 포함 금지');
  return p;
}

@Controller('auth')
export class AuthController {
  constructor(@InjectDb() private readonly db: Db, private readonly sessions: SessionService, private readonly audit: AuditService) {}

  /**
   * 로그인 — 비밀번호를 먼저 확인한다. 틀리면 없는 ID · 잠김 · 중지 · Admin 여부와 상관없이 같은 문구(14 §8).
   */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { id?: string; password?: string }, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const id = String(body?.id ?? '').trim().toLowerCase(), pw = String(body?.password ?? '');
    const fail = () => unauth('ID 또는 비밀번호가 맞지 않습니다');
    if (!id || !pw) throw fail();
    const [u] = await this.db.select().from(schema.users).where(eq(schema.users.id, id));
    const ok = !!u?.pwHash && u.auth === 'local' && (await verify(u.pwHash, pw));
    if (!u || !ok) {
      if (u && u.auth === 'local' && u.status !== 'stopped') {
        const fails = u.fails + 1, lock = fails >= LOCK_FAILS;
        await this.db.update(schema.users).set({ fails, ...(lock ? { status: 'locked' as const, lockUntil: new Date(Date.now() + LOCK_MIN * 60 * 1000) } : {}) }).where(eq(schema.users.id, id));
        await this.audit.write({ actorId: id, actorName: u.name, act: lock ? '로그인 잠김' : '로그인 실패', kind: 'admin', result: 'denied', ip: req.ip });
      }
      throw fail();
    }
    if (u.status === 'locked' && u.lockUntil && u.lockUntil.getTime() > Date.now()) throw unauth(`비밀번호를 여러 번 틀려 계정이 잠겼습니다. ${Math.ceil((u.lockUntil.getTime() - Date.now()) / 60000)}분 뒤 다시 시도하세요`);
    if (u.status === 'stopped') throw unauth('사용이 중지된 계정입니다. 관리자에게 문의하세요');
    if (u.until && u.until < todayStr()) throw unauth(`사용 기한(${u.until})이 지난 계정입니다. 사업 담당자나 관리자에게 기한 연장을 요청하세요`);
    if (u.pwTemp && u.pwTempUntil && u.pwTempUntil.getTime() < Date.now()) throw unauth('임시 비밀번호의 유효 시간(24시간)이 지났습니다. 관리자에게 다시 발급을 요청하세요');
    await this.db.update(schema.users).set({ fails: 0, lockUntil: null, status: 'active' }).where(eq(schema.users.id, id));
    const token = await this.sessions.create(u.id, u.sessRev, { pwChangeOnly: u.pwTemp, ip: req.ip, ua: req.headers['user-agent'] });
    res.setCookie(SESSION_COOKIE, token, cookieOpts);
    await this.audit.write({ actorId: u.id, actorName: u.name, act: '로그인', kind: 'admin', ip: req.ip });
    return { ok: true, pwChangeRequired: u.pwTemp };
  }

  @PwChangeAllowed()
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const token = req.cookies?.[SESSION_COOKIE];
    if (token) await this.sessions.destroy(token);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }

  /** 내 비밀번호 바꾸기 — 임시 비밀번호 전용 세션에서도 된다. 바꾸면 다른 세션은 모두 끝나고 새 세션을 준다 */
  @PwChangeAllowed()
  @Post('password')
  @HttpCode(200)
  async changePassword(@CurrentActor() me: Actor, @Body() body: { current?: string; next?: string }, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const [u] = await this.db.select().from(schema.users).where(eq(schema.users.id, me.id));
    if (!u?.pwHash || !(await verify(u.pwHash, String(body?.current ?? '')))) throw bad('wrong_password', '비밀번호를 바꾸지 않았습니다. 지금 비밀번호가 맞지 않습니다', 'current');
    const next = String(body?.next ?? '');
    const probs = pwProblems(u.id, next, u.name);
    if (probs.length) throw bad('weak_password', `비밀번호를 바꾸지 않았습니다. ${probs.join(' · ')} 조건을 지키세요`, 'next');
    if (await verify(u.pwHash, next)) throw bad('same_password', '비밀번호를 바꾸지 않았습니다. 지금과 다른 비밀번호를 입력하세요', 'next');
    await this.db.update(schema.users).set({ pwHash: await hash(next), pwTemp: false, pwTempUntil: null, pwAt: new Date() }).where(eq(schema.users.id, u.id));
    await this.sessions.revokeAll(u.id);
    const [fresh] = await this.db.select({ rev: schema.users.sessRev }).from(schema.users).where(eq(schema.users.id, u.id));
    res.setCookie(SESSION_COOKIE, await this.sessions.create(u.id, fresh!.rev, { ip: req.ip, ua: req.headers['user-agent'] }), cookieOpts);
    await this.audit.write({ actorId: u.id, actorName: u.name, act: '비밀번호 변경', kind: 'admin', ip: req.ip });
    return { ok: true };
  }

  /** 나 — 역할 · 담당 · 할 수 있는 일(권한표 기준). 화면은 이것으로 메뉴 · 버튼을 정한다 */
  @PwChangeAllowed()
  @Get('me')
  me(@CurrentActor() me: Actor) {
    const c = baseCtx();
    return {
      id: me.id, name: me.name, roles: me.roles, roleNames: me.roles.map((r) => ROLE_NAME[r]), systems: me.systems,
      kind: me.kind, until: me.until ?? null, pwChangeRequired: !!me.pwTemp,
      can: PERMS.filter((p) => canUser(c, me, p.id)).map((p) => p.id),
    };
  }
}

/** 권한 가드 동작 확인용 — 감사 로그 목록(B0은 최근 50건). B1에서 audit 모듈로 옮긴다 */
@Controller('audit')
export class AuditController {
  constructor(@InjectDb() private readonly db: Db) {}
  @Can('audit.view')
  @Get()
  async list() {
    return this.db.select().from(schema.auditEvents).orderBy(desc(schema.auditEvents.id)).limit(50);
  }
}
