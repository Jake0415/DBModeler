import { type CanActivate, type ExecutionContext, Injectable, SetMetadata, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { ROLE_NAME, type Actor } from '@neodb/domain';
import { canUser, permOf, type PermId, type RulesCtx } from '@neodb/rules';
import { denied, unauth } from '../common/errors';
import { SESSION_COOKIE, SessionService, todayStr, type SessionInfo } from './session.service';

declare module 'fastify' {
  interface FastifyRequest { session?: SessionInfo | null }
}

export const PUBLIC = 'neodb:public';
export const Public = () => SetMetadata(PUBLIC, true);
export const CAN = 'neodb:can';
/** @Can('dict.request') — 권한표의 id. 대상 범위가 필요한 판정은 서비스 안에서 다시 한다 */
export const Can = (pid: PermId) => SetMetadata(CAN, pid);
export const PW_CHANGE_OK = 'neodb:pwchange';
/** 임시 비밀번호 변경 전용 세션도 부를 수 있는 경로 */
export const PwChangeAllowed = () => SetMetadata(PW_CHANGE_OK, true);

export const CurrentActor = createParamDecorator((_: unknown, ctx: ExecutionContext): Actor => {
  const req = ctx.switchToHttp().getRequest<FastifyRequest>();
  return req.session!.actor;
});

/** 판정 입력 — B0은 사용자 목록 · 영역 없이(결재 판정은 B1 approval 모듈이 전체 입력으로 다시) */
export const baseCtx = (): RulesCtx => ({ today: todayStr(), org: { finalDict: true, finalModel: {} }, users: [], systemOfArea: () => null });

/**
 * 전역 가드 한 개:
 * 1) 세션 확인(@Public 제외) 2) 쓰기 요청은 같은 출처만(CSRF — 쿠키 세션) 3) 임시 비밀번호 세션은 변경만 4) @Can 권한
 */
@Injectable()
export class AppGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly sessions: SessionService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<FastifyRequest>();
    const meta = <T>(k: string) => this.reflector.getAllAndOverride<T>(k, [ctx.getHandler(), ctx.getClass()]);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const origin = req.headers.origin;
      if (origin && new URL(origin).host !== req.headers.host) throw denied('다른 출처의 요청은 받지 않습니다');
    }
    if (meta<boolean>(PUBLIC)) return true;
    const token = req.cookies?.[SESSION_COOKIE];
    req.session = await this.sessions.resolve(token);
    if (!req.session) throw unauth();
    if (req.session.pwChangeOnly && !meta<boolean>(PW_CHANGE_OK)) throw denied('임시 비밀번호를 먼저 바꾸세요');
    const pid = meta<PermId>(CAN);
    if (pid && !canUser(baseCtx(), req.session.actor, pid)) {
      const p = permOf(pid);
      const who = p.roles.filter((r) => r !== '*').map((r) => ROLE_NAME[r as keyof typeof ROLE_NAME]).join(' · ');
      throw denied(`${who}만 할 수 있습니다 — ${p.n}`);
    }
    return true;
  }
}
