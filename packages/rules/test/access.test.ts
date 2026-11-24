import { describe, expect, it } from 'vitest';
import type { Actor, ApprovalDoc } from '@neodb/domain';
import { approversFor, canUser, canUserAct, canUserSeeDoc, lineGaps, type RulesCtx } from '../src';

/** 목업 시드와 같은 사람들 (docs/ux/mockups/assets/app.js) + 29 시험 계정 */
const U = (o: Partial<Actor> & Pick<Actor, 'id' | 'roles'>): Actor => ({ name: o.id, systems: ['전체'], status: 'active', ...o });
const kim = U({ id: 'kim', roles: ['modeler', 'da'], systems: ['RQMS', 'ERP'] });
const park = U({ id: 'park', roles: ['modeler'], systems: ['RQMS', 'ERP'], kind: 'out', until: '2026-12-31', viewScope: 'org' });
const lee = U({ id: 'lee', roles: ['da', 'admin'] });
const hyun = U({ id: 'hyun', roles: ['owner'] });
const tmod = U({ id: 'tmod', roles: ['modeler'], systems: ['ERP'], kind: 'out', until: '2026-12-31' });
const taud = U({ id: 'taud', roles: ['auditor'], systems: ['ERP'], kind: 'aud', until: '2026-12-15' });
const tview = U({ id: 'tview', roles: [] });

const AREA_SYS: Record<string, string> = { rq: 'RQMS', risk: 'RQMS', e_hr: 'ERP' };
const ctx = (users: Actor[], org: Partial<RulesCtx['org']> = {}, today = '2026-11-25'): RulesCtx => ({
  today,
  org: { finalDict: true, finalModel: {}, ...org },
  users,
  systemOfArea: (a) => AREA_SYS[a] ?? null,
});
const ALL = [kim, park, lee, hyun, tmod, taud, tview];

describe('canUser — 역할 × 범위', () => {
  const c = ctx(ALL);
  it('모델 편집은 담당 시스템의 모델러만', () => {
    expect(canUser(c, tmod, 'model.edit', { area: 'e_hr' })).toBe(true);
    expect(canUser(c, tmod, 'model.edit', { area: 'rq' })).toBe(false);
    expect(canUser(c, lee, 'model.edit', { area: 'e_hr' })).toBe(false);
  });
  it('조회 범위: 외주 · 감리는 담당 시스템만, 예외(park)는 기관 전체, 시스템을 모르면 막음', () => {
    expect(canUser(c, tmod, 'model.view', { area: 'rq' })).toBe(false);
    expect(canUser(c, park, 'model.view', { area: 'rq' })).toBe(true);
    expect(canUser(c, taud, 'model.view', { area: 'e_hr' })).toBe(true);
    expect(canUser(c, tmod, 'model.view', { area: 'nowhere' })).toBe(false);
    expect(canUser(c, tview, 'model.view', { area: 'rq' })).toBe(true);
  });
  it('내려받기: 모델러만이면 담당 시스템, 조회만은 불가', () => {
    expect(canUser(c, tmod, 'out.export', { area: 'e_hr' })).toBe(true);
    expect(canUser(c, park, 'out.export', { area: 'e_hr' })).toBe(true);
    expect(canUser(c, tview, 'out.export', { area: 'e_hr' })).toBe(false);
  });
  it('Admin은 표준 내용을 바꾸지 않는다 (R-04)', () => {
    expect(canUser(c, U({ id: 'a', roles: ['admin'] }), 'dict.purge')).toBe(false);
    expect(canUser(c, U({ id: 'a', roles: ['admin'] }), 'type.map', { system: 'ERP' })).toBe(false);
  });
  it('기한이 지나면 아무 권한이 없다', () => {
    expect(canUser(ctx(ALL, {}, '2027-01-02'), tmod, 'model.view')).toBe(false);
  });
  it('임시 비밀번호면 결재 권한만 잠긴다 (R-05)', () => {
    const t = { ...hyun, pwTemp: true };
    expect(canUser(c, t, 'appr.final')).toBe(false);
    expect(canUser(c, t, 'dict.view')).toBe(true);
  });
});

const dictDoc = (req: string, o: Partial<ApprovalDoc> = {}): ApprovalDoc => ({ id: 'REQ-1', type: 'dict', step: 'da', req, line: ['da', 'final'], hist: [], ...o });

describe('canUserAct — 자기 승인 · 독립성 · 위임', () => {
  it('자기 승인: 기본 허용(DA 단계), 비허용이면 자기 신청은 내 차례가 아님', () => {
    expect(canUserAct(ctx(ALL), kim, dictDoc('kim'), 'da')).toBe(true);
    expect(canUserAct(ctx(ALL, { selfAppr: false }), kim, dictDoc('kim'), 'da')).toBe(false);
  });
  it('신청자와 DA 승인자는 최종 승인할 수 없다', () => {
    const d = dictDoc('hyun', { step: 'final', hist: [{ step: 'da', act: 'DA 승인', whoId: 'lee' }] });
    expect(canUserAct(ctx(ALL), hyun, d, 'final')).toBe(false);
    const owner2 = U({ id: 'choi', roles: ['owner'] });
    expect(canUserAct(ctx([...ALL, owner2]), owner2, d, 'final')).toBe(true);
  });
  it('위임: 같은 결재 역할의 대리인만, 대리 DA 승인 뒤 원 담당자도 최종 불가', () => {
    const owner2 = U({ id: 'choi', roles: ['owner'] });
    const hyunAway = { ...hyun, deleg: { to: 'choi', from: '2026-11-20', until: '2026-11-30' } };
    const d = dictDoc('kim', { step: 'final', hist: [{ step: 'da', act: 'DA 승인', whoId: 'lee' }] });
    // choi는 원래도 owner라 직접 가능 — 대리 경로는 역할 없는 사람에게 열리지 않는다
    const viewer = { ...tview, deleg: undefined };
    const away2 = { ...hyun, deleg: { to: 'tview', from: '2026-11-20', until: '2026-11-30' } };
    expect(canUserAct(ctx([kim, lee, away2, viewer]), viewer, d, 'final')).toBe(false);
    expect(canUserAct(ctx([kim, lee, hyunAway, owner2]), owner2, d, 'final')).toBe(true);
    const viaDeleg = dictDoc('kim', { step: 'final', hist: [{ step: 'da', act: 'DA 승인 (대리 — hyun)', whoId: 'lee', forId: 'hyun' }] });
    expect(canUserAct(ctx([kim, lee, hyun]), hyun, viaDeleg, 'final')).toBe(false);
  });
});

describe('lineGaps — 실제 DA → 최종 조합', () => {
  it('DA 겸 기관 담당자 한 사람뿐이면 최종 공백', () => {
    const both = U({ id: 'solo', roles: ['da', 'owner'] });
    expect(lineGaps(ctx([both, park]), { type: 'dict', req: 'park' })).toEqual(['final']);
  });
  it('DA와 기관 담당자가 따로 있으면 공백 없음', () => {
    expect(lineGaps(ctx(ALL), { type: 'dict', req: 'kim' })).toEqual([]);
  });
  it('자기 승인만 가능한 DA라도 최종 승인자가 있으면 통과, 없으면 공백', () => {
    expect(lineGaps(ctx([kim, hyun], { finalDict: false }), { type: 'dict', req: 'kim' })).toEqual([]);
    expect(lineGaps(ctx([kim], { finalDict: false }), { type: 'dict', req: 'kim' })).toEqual(['final']);
  });
  it('approversFor는 중지 계정을 뺀다', () => {
    const stopped = { ...hyun, status: 'stopped' as const };
    expect(approversFor(ctx([kim, lee, stopped]), dictDoc('kim', { step: 'final', hist: [{ step: 'da', act: 'DA 승인', whoId: 'lee' }] }), 'final')).toEqual([]);
  });
});

describe('canUserSeeDoc — 결재 중 열람 범위', () => {
  const c = ctx(ALL);
  const model = (step: ApprovalDoc['step']): ApprovalDoc => ({ id: 'REQ-2', type: 'model', step, req: 'park', area: 'rq', sysAt: { code: 'RQMS' }, line: ['da', 'final'], hist: [] });
  it('결재 중 모델 문서는 신청자 · 결재선만', () => {
    expect(canUserSeeDoc(c, park, model('da'))).toBe(true);
    expect(canUserSeeDoc(c, kim, model('da'))).toBe(true); // RQMS 담당 DA
    expect(canUserSeeDoc(c, tview, model('da'))).toBe(false);
    expect(canUserSeeDoc(c, taud, model('da'))).toBe(false);
  });
  it('끝난 문서: 감리는 조회 범위 안만', () => {
    expect(canUserSeeDoc(c, taud, model('done'))).toBe(false); // RQMS — 감리 담당은 ERP
    expect(canUserSeeDoc(c, taud, { ...model('done'), area: 'e_hr', sysAt: { code: 'ERP' } })).toBe(true);
  });
});
