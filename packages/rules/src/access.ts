import { ALL_SYSTEMS, type Actor, type ApprovalDoc, type OrgPolicy, type Step, type ViewScope } from '@neodb/domain';
import { APPROVAL_PERMS, permOf, type PermId } from './perms';

/**
 * 권한 · 결재 판정 — 목업 assets/app.js의 canUser · canUserAct · lineGaps · canUserSeeDoc을
 * 순수 함수로 옮긴 것. 입력(오늘 날짜 · 정책 · 사용자 목록 · 영역 → 시스템)은 모두 명시적으로 받는다
 * (같은 입력이면 브라우저 · API · 공동 편집 서버가 같은 결과 — 백엔드 구성안 §13.8).
 */
export interface RulesCtx {
  /** 기관 기준 오늘 (YYYY-MM-DD) */
  today: string;
  org: OrgPolicy;
  /** 활성 · 중지 포함 전체 사용자 — 결재 후보 · 위임 계산용 */
  users: readonly Actor[];
  /** 업무 영역 → 시스템 코드 (없으면 null) */
  systemOfArea(area: string): string | null;
}

export interface Target {
  system?: string;
  area?: string;
  doc?: ApprovalDoc;
}

export const viewScopeOf = (u: Actor): ViewScope => u.viewScope ?? (u.kind === 'out' || u.kind === 'aud' ? 'sys' : 'org');

export const expired = (u: Actor, today: string): boolean => !!u.until && u.until < today;

/** 담당 시스템 판정 — 시스템 코드로 비교 ('전체'는 앞으로 등록될 시스템 포함) */
export const inScope = (u: Actor, systemCode: string): boolean => u.systems.includes(ALL_SYSTEMS) || u.systems.includes(systemCode);

const docSystem = (ctx: RulesCtx, d: ApprovalDoc): string | null => d.sysAt?.code ?? (d.area ? ctx.systemOfArea(d.area) : null);

const targetSystem = (ctx: RulesCtx, t: Target): string | null =>
  t.system ?? (t.area ? ctx.systemOfArea(t.area) : t.doc ? docSystem(ctx, t.doc) : null);

const usable = (u: Actor | undefined, today: string): u is Actor => !!u && u.status !== 'stopped' && !expired(u, today);

/** can(user, permission, target) — 모든 화면 · API가 묻는 단 하나의 질문 */
export function canUser(ctx: RulesCtx, u: Actor | undefined, pid: PermId, t?: Target): boolean {
  if (!usable(u, ctx.today)) return false;
  const p = permOf(pid);
  if (u.pwTemp && APPROVAL_PERMS.includes(pid)) return false;
  const roleOk = p.roles.includes('*') || p.roles.some((r) => r !== '*' && u.roles.includes(r));
  if (!roleOk) return false;
  if (p.scope === 'view') {
    // 모델러만(내려받기): 담당 시스템 안에서만
    if (pid === 'out.export' && t && !u.roles.some((r) => r === 'da' || r === 'owner' || r === 'auditor')) {
      const sk = targetSystem(ctx, t);
      return !!sk && inScope(u, sk);
    }
    if (!t || viewScopeOf(u) === 'org' || t.doc?.type === 'dict') return true;
    const sk = targetSystem(ctx, t);
    return !!sk && inScope(u, sk); // 시스템을 모르면 막는다
  }
  if (p.scope !== 'sys' || !t) return true;
  if (p.adminAll && u.roles.includes('admin')) return true;
  if (t.doc?.type === 'dict') return true; // 사전 신청은 기관 전체
  const sk = targetSystem(ctx, t);
  return !!sk && inScope(u, sk);
}

/** DA 단계의 실제 승인자와 (대리였다면) 원 담당자 */
export function daIds(d: ApprovalDoc): string[] {
  const h = (d.hist ?? []).filter((x) => x.step === 'da' && /승인/.test(x.act) && !/취소|실패/.test(x.act)).slice(-1)[0];
  return h ? [h.whoId, h.forId].filter((x): x is string => !!x) : [];
}

function actSelf(ctx: RulesCtx, u: Actor, d: ApprovalDoc, step: Step): boolean {
  if (step === 'da') return canUser(ctx, u, 'appr.da', { doc: d }) && (d.req !== u.id || ctx.org.selfAppr !== false);
  if (step === 'final') return canUser(ctx, u, 'appr.final', { doc: d }) && d.req !== u.id && !daIds(d).includes(u.id);
  return false;
}

export const delegActive = (x: Actor, today: string): boolean =>
  !!x.deleg && x.deleg.from <= today && today <= x.deleg.until && usable(x, today);

/** 지금 이 사람에게 위임한 사람들 */
export const delegatorsOf = (ctx: RulesCtx, u: Actor): Actor[] =>
  ctx.users.filter((x) => x.id !== u.id && delegActive(x, ctx.today) && x.deleg!.to === u.id);

/** 이 사람이 이 문서의 이 단계를 처리할 수 있는가 — 자기 승인 정책 · 위임 · 독립성 포함 (29 R-02 · R-06 · R-08) */
export function canUserAct(ctx: RulesCtx, u: Actor | undefined, d: ApprovalDoc, step: Step): boolean {
  if (!usable(u, ctx.today)) return false;
  if (actSelf(ctx, u, d, step)) return true;
  // 대리: 같은 결재 역할 · 임시 비밀번호 아님 · 자기 신청 아님 · 최종 단계 독립성
  if (u.pwTemp || !u.roles.includes(step === 'da' ? 'da' : 'owner')) return false;
  return delegatorsOf(ctx, u).some((x) => actSelf(ctx, x, d, step) && d.req !== u.id && (step !== 'final' || !daIds(d).includes(u.id)));
}

/** 대리로 처리하면 원 담당자, 직접이면 null */
export function actingFor(ctx: RulesCtx, u: Actor, d: ApprovalDoc, step: Step): Actor | null {
  if (actSelf(ctx, u, d, step)) return null;
  if (!canUserAct(ctx, u, d, step)) return null;
  return delegatorsOf(ctx, u).find((x) => actSelf(ctx, x, d, step)) ?? null;
}

export const approversFor = (ctx: RulesCtx, d: ApprovalDoc, step: Step): Actor[] =>
  ctx.users.filter((u) => usable(u, ctx.today) && canUserAct(ctx, u, d, step));

/** 결재선 — 사전은 기관 설정, 모델은 시스템 설정(최종 승인 사용) */
export function lineFor(ctx: RulesCtx, type: ApprovalDoc['type'], area?: string): Array<'da' | 'final'> {
  const fin = type === 'model' ? ctx.org.finalModel[(area && ctx.systemOfArea(area)) || ''] !== false : ctx.org.finalDict;
  return fin ? ['da', 'final'] : ['da'];
}

/**
 * 처리할 사람이 없는 단계 — 단계별 머릿수가 아니라 실제 DA → 최종 조합으로 본다.
 * 한 사람이 두 단계를 채울 수 없고, 자기 승인은 최종 승인자가 있어야 한다.
 */
export function lineGaps(ctx: RulesCtx, d: Omit<ApprovalDoc, 'id' | 'step'> & { id?: string }): Array<'da' | 'final'> {
  const line = d.line ?? lineFor(ctx, d.type, d.area);
  const d0: ApprovalDoc = { id: d.id ?? '_new', step: 'da', ...d, hist: [] };
  const das = approversFor(ctx, d0, 'da');
  if (!das.length) return [...line];
  const needFinal = (c: Actor) => line.includes('final') || c.id === d.req;
  const ok = das.some((c) => !needFinal(c) || approversFor(ctx, { ...d0, line: ['da', 'final'], hist: [{ step: 'da', act: 'DA 승인', whoId: c.id }] }, 'final').some((f) => f.id !== d.req && f.id !== c.id));
  return ok ? [] : ['final'];
}

export const inReview = (d: ApprovalDoc): boolean => d.step === 'da' || d.step === 'final';

/** 결재선 위의 사람인가 (지금 처리할 수 있거나 이미 처리했거나) */
export function onLine(ctx: RulesCtx, u: Actor, d: ApprovalDoc): boolean {
  if (u.status === 'stopped') return false;
  if (inReview(d) && canUserAct(ctx, u, d, d.step)) return true;
  if (canUser(ctx, u, 'appr.da', { doc: d })) return true;
  if ((d.line ?? ['da', 'final']).includes('final') && canUser(ctx, u, 'appr.final', { doc: d })) return true;
  return (d.hist ?? []).some((h) => h.whoId === u.id);
}

/** 결재 문서 열람 — 결재 중 = 신청자 · 결재선만, 끝난 문서 = 조회 범위 안 결재 역할 · 참조자 · 참여자 */
export function canUserSeeDoc(ctx: RulesCtx, u: Actor | undefined, d: ApprovalDoc): boolean {
  if (!u || !usable(u, ctx.today)) return false;
  if (d.req === u.id) return true;
  if (inReview(d)) return onLine(ctx, u, d);
  return canUser(ctx, u, 'appr.viewall', { doc: d }) || (d.cc ?? []).includes(u.id) || onLine(ctx, u, d);
}
