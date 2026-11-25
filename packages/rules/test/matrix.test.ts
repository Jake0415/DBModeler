import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { TEST_ACCOUNTS, type TestAccount } from '@neodb/domain';
import { ACT_CASES, buildActMatrix, buildPermMatrix, PERMS, renderPermMatrixMarkdown, targetsFor, type MatrixRow } from '../src';

/**
 * 권한 검사 표 (계획 §9.3).
 * 1) 문서(docs/ux/15-rbac.md §2 · §3)에서 손으로 옮긴 기대값 — canUser 자체의 오류를 잡는다.
 * 2) 기준 파일 비교 — 권한표 · 판정이 바뀌면 차이가 드러난다. 갱신: `npm run rbac:matrix`(사람 승인 뒤).
 */
const rows = buildPermMatrix();
const acts = buildActMatrix();
const get = (account: string, perm: MatrixRow['perm'], target = '-'): MatrixRow => {
  const r = rows.find((x) => x.account === account && x.perm === perm && x.target === target);
  if (!r) throw new Error(`no row: ${account} ${perm} ${target}`);
  return r;
};
const allow = (a: string, p: MatrixRow['perm'], t?: string) => expect(get(a, p, t), `${a} ${p} ${t ?? '-'}`).toMatchObject({ allow: true });
const deny = (a: string, p: MatrixRow['perm'], reason: MatrixRow['reason'], t?: string) =>
  expect(get(a, p, t), `${a} ${p} ${t ?? '-'}`).toMatchObject({ allow: false, reason });

describe('권한 검사 표 — 크기', () => {
  it('모든 권한 × 대상 × 시험 계정을 한 줄씩 담는다', () => {
    const expected = PERMS.reduce((n, p) => n + targetsFor(p).length, 0) * TEST_ACCOUNTS.length;
    expect(rows).toHaveLength(expected);
  });
});

describe('권한 검사 표 — 문서 기대값 (15-rbac §2 · §3)', () => {
  it('계정 상태: 중지 · 기한 만료는 아무 권한이 없다', () => {
    deny('tstop', 'dict.view', 'stopped');
    deny('tstop', 'model.edit', 'stopped', 'sys:ERP');
    deny('texp', 'dict.view', 'expired');
    deny('texp', 'model.edit', 'expired', 'sys:ERP');
  });
  it('임시 비밀번호: 결재 권한만 잠기고 보기는 된다', () => {
    deny('tdatmp', 'appr.da', 'pwTemp', 'doc:dict');
    deny('tdatmp', 'cand.decide', 'pwTemp');
    deny('tdatmp', 'dict.publish', 'pwTemp');
    allow('tdatmp', 'dict.view');
    allow('tdatmp', 'dict.request');
  });
  it('모델 편집 · 확정 신청: 모델러 · 담당 시스템만', () => {
    allow('tmod', 'model.edit', 'sys:ERP');
    deny('tmod', 'model.edit', 'scope', 'sys:RQMS');
    allow('tmod', 'model.submit', 'sys:ERP');
    deny('tda', 'model.edit', 'role', 'sys:ERP');
    deny('tview', 'model.edit', 'role', 'sys:ERP');
    deny('tadm', 'model.edit', 'role', 'sys:ERP');
  });
  it('조회 범위: 내부는 기관 전체, 외주 · 감리는 담당 시스템만', () => {
    allow('tmodin', 'model.view', 'sys:RQMS');
    allow('tview', 'model.view', 'sys:RQMS');
    deny('tmod', 'model.view', 'scope', 'sys:RQMS');
    deny('taud', 'model.view', 'scope', 'sys:RQMS');
    allow('taud', 'model.view', 'sys:ERP');
  });
  it('내려받기: 조회만은 못 하고, 모델러만이면 담당 시스템만', () => {
    deny('tview', 'out.export', 'role', 'sys:ERP');
    allow('tmodin', 'out.export', 'sys:ERP');
    deny('tmodin', 'out.export', 'scope', 'sys:RQMS');
    allow('tda', 'out.export', 'sys:RQMS');
    allow('taud', 'out.export', 'sys:ERP');
    deny('tadm', 'out.export', 'role', 'sys:ERP');
  });
  it('업무 영역 만들기: Admin은 모든 시스템', () => {
    allow('tadm', 'area.create', 'sys:RQMS');
    deny('tda', 'area.create', 'scope', 'sys:RQMS');
    allow('tda', 'area.create', 'sys:ERP');
  });
  it('결재: DA 1단계는 사전 = 기관 전체 · 모델 = 담당 시스템, 최종은 기관 담당자', () => {
    allow('tda2', 'appr.da', 'doc:dict');
    allow('tda2', 'appr.da', 'doc:model:RQMS');
    deny('tda2', 'appr.da', 'scope', 'doc:model:ERP');
    allow('tda', 'appr.da', 'doc:model:ERP');
    allow('town', 'appr.final', 'doc:dict');
    allow('town', 'appr.final', 'doc:model:ERP');
    deny('town', 'appr.final', 'scope', 'doc:model:RQMS');
    deny('tmod', 'appr.da', 'role', 'doc:dict');
    allow('tmulti', 'appr.da', 'doc:model:ERP');
  });
  it('끝난 결재 보기: DA · 기관 담당자 · 감리, 감리는 조회 범위 안만(사전 문서는 기관 전체)', () => {
    allow('taud', 'appr.viewall', 'done:model:ERP');
    deny('taud', 'appr.viewall', 'scope', 'done:model:RQMS');
    allow('taud', 'appr.viewall', 'done:dict');
    deny('tmod', 'appr.viewall', 'role', 'done:dict');
  });
  it('관리: 설정 · 사용자는 Admin만, 감사 로그는 모델러 · 조회만 불가, 관리 변경 확인은 기관 담당자', () => {
    allow('tadm', 'settings');
    allow('tadm', 'users');
    deny('tda', 'settings', 'role');
    allow('taud', 'audit.view');
    deny('tmod', 'audit.view', 'role');
    deny('tview', 'audit.view', 'role');
    allow('town', 'admin.confirm');
    deny('tadm', 'admin.confirm', 'role');
  });
  it('사전: Admin은 표준 내용을 바꾸지 않는다(신청 · 후보 · 공표 불가)', () => {
    deny('tadm', 'dict.request', 'role');
    deny('tadm', 'cand.decide', 'role');
    deny('tadm', 'dict.publish', 'role');
    allow('tadm', 'dict.common');
  });
});

describe('권한 검사 표 — 담당이 제한된 Admin (adminAll)', () => {
  const extra: TestAccount = { id: 'xadm', name: '담당 제한 Admin', roles: ['admin'], systems: ['ERP'], note: '표 검사 전용' };
  const r2 = buildPermMatrix([...TEST_ACCOUNTS, extra]);
  const g = (p: MatrixRow['perm'], t: string) => r2.find((x) => x.account === 'xadm' && x.perm === p && x.target === t);
  it('업무 영역 만들기 · 이름 바꾸기는 담당 밖 시스템도 된다', () => {
    expect(g('area.create', 'sys:RQMS')).toMatchObject({ allow: true });
    expect(g('area.info', 'sys:RQMS')).toMatchObject({ allow: true });
  });
  it('모델 편집은 역할이 없어 안 된다', () => {
    expect(g('model.edit', 'sys:ERP')).toMatchObject({ allow: false, reason: 'role' });
  });
});

describe('권한 검사 표 — 거부 이유는 역할을 임시 비밀번호보다 먼저 본다', () => {
  it('DA만 있는 임시 비밀번호 계정의 최종 승인 = 역할(숨김)', () => {
    deny('tdatmp', 'appr.final', 'role', 'doc:dict');
    deny('tdatmp', 'admin.confirm', 'role');
  });
});

describe('결재 행위 표 — 자기 승인 · 최종 승인 독립성 (15-rbac §2 · §3)', () => {
  const act = (a: string, c: string) => acts.find((x) => x.account === a && x.case === c)?.allow;
  it('1단계: 담당 시스템 DA만, 임시 비밀번호는 잠김', () => {
    expect(act('tda', 'da:model:ERP:req=tmod')).toBe(true);
    expect(act('tda2', 'da:model:ERP:req=tmod')).toBe(false);
    expect(act('tdatmp', 'da:model:ERP:req=tmod')).toBe(false);
    expect(act('tmod', 'da:model:ERP:req=tmod')).toBe(false);
  });
  it('자기 승인: 기본은 허용(최종 승인자가 따로 있을 때), 비허용이면 안 된다', () => {
    expect(act('tmulti', 'da:model:ERP:req=tmulti')).toBe(true);
    expect(act('tmulti', 'da:model:ERP:req=tmulti:selfOff')).toBe(false);
    expect(act('tda', 'da:model:ERP:req=tmulti:selfOff')).toBe(true);
  });
  it('최종: 기관 담당자 · 담당 시스템, 신청자 · 1단계 승인자는 안 된다', () => {
    expect(act('town', 'final:model:ERP:req=tmod,da=tda')).toBe(true);
    expect(act('tda', 'final:model:ERP:req=tmod,da=tda')).toBe(false);
    expect(act('town', 'final:dict:req=town2,da=tda')).toBe(true);
    expect(act('town2', 'final:dict:req=town2,da=tda')).toBe(false);
    expect(act('town', 'final:model:RQMS:req=tmodin,da=tda2')).toBe(false);
  });
  it('1단계 승인자는 최종 승인을 겸해도 그 문서의 최종 승인을 할 수 없다', () => {
    const xdo: TestAccount = { id: 'xdo', name: 'DA+기관 담당자 겸임', roles: ['da', 'owner'], systems: ['ERP'], note: '표 검사 전용' };
    const base = ACT_CASES.find((c) => c.key === 'final:model:ERP:req=tmod,da=tda')!;
    const cases = [
      { ...base, key: 'final:da=xdo', doc: { ...base.doc, id: 'X1', hist: [{ step: 'da' as const, act: 'DA 승인', whoId: 'xdo' }] } },
      { ...base, key: 'final:da=tda' },
    ];
    const r = buildActMatrix([...TEST_ACCOUNTS, xdo], undefined, cases);
    const a2 = (a: string, c: string) => r.find((x) => x.account === a && x.case === c)?.allow;
    expect(a2('xdo', 'final:da=xdo')).toBe(false);
    expect(a2('xdo', 'final:da=tda')).toBe(true);
    expect(a2('town', 'final:da=xdo')).toBe(true);
  });
  it('사례마다 모든 시험 계정을 담는다', () => {
    expect(acts).toHaveLength(ACT_CASES.length * TEST_ACCOUNTS.length);
  });
});

/**
 * 기준 파일 — 일반 테스트는 기준 파일이 없거나 다르면 실패한다(새로 만들지 않는다).
 * 갱신은 `npm run rbac:matrix`(RBAC_MATRIX_UPDATE=1 + vitest -u)로만, 사람 승인 뒤에.
 */
const JSON_GOLDEN = '../../../e2e/rbac/perm-matrix.json';
const MD_GOLDEN = '../../../docs/impl/rbac-matrix.md';
const updating = process.env.RBAC_MATRIX_UPDATE === '1';
const goldenExists = (rel: string) => existsSync(fileURLToPath(new URL(rel, import.meta.url)));

describe('권한 검사 표 — 기준 파일', () => {
  it('기준 파일이 있다(없으면 npm run rbac:matrix 를 사람 승인 뒤 실행)', () => {
    if (!updating) {
      expect(goldenExists(JSON_GOLDEN), JSON_GOLDEN).toBe(true);
      expect(goldenExists(MD_GOLDEN), MD_GOLDEN).toBe(true);
    }
  });
  // 갱신 모드가 아니면 스냅샷 기능을 쓰지 않고 파일을 직접 읽어 비교한다 — `vitest -u` 를 직접 실행해도 덮어쓰지 않는다
  const check = async (rel: string, actual: string) => {
    if (updating) { await expect(actual).toMatchFileSnapshot(rel); return; }
    const path = fileURLToPath(new URL(rel, import.meta.url));
    expect(existsSync(path), `${rel} 기준 파일이 없다 — 사람 승인 뒤 npm run rbac:matrix`).toBe(true);
    const golden = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
    expect(actual === golden, `${rel} 이 생성 결과와 다르다 — 권한표 변경이면 사람 승인 뒤 npm run rbac:matrix`).toBe(true);
  };
  it('E2E용 JSON이 기준과 같다', async () => {
    await check(JSON_GOLDEN, JSON.stringify({ today: '2026-12-01', perms: rows, acts }, null, 1) + '\n');
  });
  it('사람이 보는 표가 기준과 같다', async () => {
    await check(MD_GOLDEN, renderPermMatrixMarkdown(rows, acts) + '\n');
  });
});
