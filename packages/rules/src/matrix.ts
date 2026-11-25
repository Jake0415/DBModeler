import { TEST_ACCOUNTS, type Actor, type ApprovalDoc, type Step, type TestAccount } from '@neodb/domain';
import { canUser, canUserAct, expired, type RulesCtx, type Target } from './access';
import { APPROVAL_PERMS, PERMS, type Perm, type PermId } from './perms';

/**
 * 권한 검사 표 — 시험 계정 × 권한 × 대상마다 허용 · 거부와 거부 이유 (docs/impl/00-orchestration-plan.md §9.3).
 * - 권한 감사관(E2E)이 화면 · API 결과를 이 표와 비교한다.
 * - 권한 판정(canUser: 역할 · 범위)과 결재 행위 판정(canUserAct: 자기 승인 · 독립성 · 단계)을 따로 담는다.
 * - 기준 파일(e2e/rbac/*.json · docs/impl/rbac-matrix.md)은 테스트가 비교한다 — 권한표가 바뀌면 차이가 드러나고,
 *   기준 파일 갱신(`npm run rbac:matrix`)은 사람 승인 뒤에만 한다.
 */

/** 표를 만들 때 쓰는 고정 오늘 — 기한(untilDays)은 이 날 기준으로 계산한다 */
export const MATRIX_TODAY = '2026-12-01';

/** 목업과 같은 업무 영역 → 시스템 */
export const MATRIX_AREAS: Readonly<Record<string, string>> = { e_hr: 'ERP', rq: 'RQMS' };

/**
 * 거부 이유 — 화면 처리의 기준: role = 숨김(역할상 할 일이 없음), 나머지 = 흐리게 + 이유, API = 403.
 * 계정 상태(중지 · 기한)를 먼저, 그다음 역할, 역할이 있을 때만 임시 비밀번호 · 범위를 본다.
 */
export type DenyReason = 'stopped' | 'expired' | 'role' | 'pwTemp' | 'scope';
export const DENY_LABEL: Record<DenyReason, string> = { stopped: '중지', expired: '기한', role: '역할', pwTemp: '임시PW', scope: '범위' };

export interface MatrixTarget {
  key: string;
  label: string;
  target?: Target;
}

export interface MatrixRow {
  account: string;
  perm: PermId;
  target: string;
  allow: boolean;
  reason?: DenyReason;
}

const doc = (id: string, type: ApprovalDoc['type'], step: ApprovalDoc['step'], area?: string, extra: Partial<ApprovalDoc> = {}): ApprovalDoc => {
  const code = area ? MATRIX_AREAS[area] : undefined;
  return { id, type, step, req: 'someone', line: ['da', 'final'], ...(area && code ? { area, sysAt: { code } } : {}), hist: [], ...extra };
};

const NONE: MatrixTarget = { key: '-', label: '대상 없음' };
const SYS_TARGETS: MatrixTarget[] = [
  NONE,
  { key: 'sys:ERP', label: '통합ERP', target: { system: 'ERP' } },
  { key: 'sys:RQMS', label: '요구사항관리', target: { system: 'RQMS' } },
];
const REVIEW_DOCS: MatrixTarget[] = [
  { key: 'doc:dict', label: '사전 신청(결재 중)', target: { doc: doc('D-dict', 'dict', 'da') } },
  { key: 'doc:model:ERP', label: '모델 확정 · 통합ERP(결재 중)', target: { doc: doc('D-erp', 'model', 'da', 'e_hr') } },
  { key: 'doc:model:RQMS', label: '모델 확정 · 요구사항관리(결재 중)', target: { doc: doc('D-rq', 'model', 'da', 'rq') } },
];
const DONE_DOCS: MatrixTarget[] = [
  { key: 'done:dict', label: '사전 신청(끝남)', target: { doc: doc('D-dict-done', 'dict', 'done') } },
  { key: 'done:model:ERP', label: '모델 확정 · 통합ERP(끝남)', target: { doc: doc('D-erp-done', 'model', 'done', 'e_hr') } },
  { key: 'done:model:RQMS', label: '모델 확정 · 요구사항관리(끝남)', target: { doc: doc('D-rq-done', 'model', 'done', 'rq') } },
];

/** 권한마다 검사할 대상 */
export function targetsFor(p: Perm): MatrixTarget[] {
  if (p.id === 'appr.da' || p.id === 'appr.final') return REVIEW_DOCS;
  if (p.id === 'appr.viewall') return DONE_DOCS;
  return p.scope === 'org' ? [NONE] : SYS_TARGETS;
}

const addDays = (ymd: string, days: number): string => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** 시험 계정 정의 → 판정용 사용자 */
export function actorOf(a: TestAccount, today = MATRIX_TODAY): Actor {
  return {
    id: a.id, name: a.name, roles: [...a.roles], systems: [...a.systems], status: a.status ?? 'active',
    kind: a.kind ?? 'in', ...(a.untilDays === undefined ? {} : { until: addDays(today, a.untilDays) }), pwTemp: a.pwTemp ?? false,
  };
}

export function matrixCtx(actors: readonly Actor[], today = MATRIX_TODAY): RulesCtx {
  return { today, org: { finalDict: true, finalModel: {} }, users: actors, systemOfArea: (area) => MATRIX_AREAS[area] ?? null };
}

function reasonOf(u: Actor, p: Perm, today: string): DenyReason {
  if (u.status === 'stopped') return 'stopped';
  if (expired(u, today)) return 'expired';
  const roleOk = p.roles.includes('*') || p.roles.some((r) => r !== '*' && u.roles.includes(r));
  if (!roleOk) return 'role';
  if (u.pwTemp && APPROVAL_PERMS.includes(p.id)) return 'pwTemp';
  return 'scope';
}

export function buildPermMatrix(accounts: readonly TestAccount[] = TEST_ACCOUNTS, today = MATRIX_TODAY): MatrixRow[] {
  const actors = accounts.map((a) => actorOf(a, today));
  const ctx = matrixCtx(actors, today);
  const rows: MatrixRow[] = [];
  for (const p of PERMS) {
    for (const t of targetsFor(p)) {
      for (const u of actors) {
        const allow = canUser(ctx, u, p.id, t.target);
        rows.push(allow ? { account: u.id, perm: p.id, target: t.key, allow } : { account: u.id, perm: p.id, target: t.key, allow, reason: reasonOf(u, p, today) });
      }
    }
  }
  return rows;
}

/* ---------- 결재 행위 (canUserAct) ---------- */

export interface ActCase {
  key: string;
  label: string;
  doc: ApprovalDoc;
  step: Step;
  /** 자기 승인 정책(없으면 허용 + 최종 승인 자동 부착) */
  selfAppr?: boolean;
}

/** 자기 승인 · 최종 승인 독립성 · 단계 · 범위를 가르는 결재 사례 (15-rbac §2 · §3) */
export const ACT_CASES: readonly ActCase[] = [
  { key: 'da:model:ERP:req=tmod', label: '1단계 · 모델 통합ERP · 신청 tmod', step: 'da', doc: doc('A1', 'model', 'da', 'e_hr', { req: 'tmod' }) },
  { key: 'da:model:ERP:req=tmulti', label: '1단계 · 모델 통합ERP · 신청 tmulti(자기 승인 허용)', step: 'da', doc: doc('A2', 'model', 'da', 'e_hr', { req: 'tmulti' }) },
  { key: 'da:model:ERP:req=tmulti:selfOff', label: '1단계 · 모델 통합ERP · 신청 tmulti(자기 승인 비허용)', step: 'da', selfAppr: false, doc: doc('A3', 'model', 'da', 'e_hr', { req: 'tmulti' }) },
  { key: 'final:model:ERP:req=tmod,da=tda', label: '최종 · 모델 통합ERP · 신청 tmod · 1단계 tda', step: 'final', doc: doc('A4', 'model', 'final', 'e_hr', { req: 'tmod', hist: [{ step: 'da', act: 'DA 승인', whoId: 'tda' }] }) },
  { key: 'final:dict:req=town2,da=tda', label: '최종 · 사전 · 신청 town2 · 1단계 tda', step: 'final', doc: doc('A5', 'dict', 'final', undefined, { req: 'town2', hist: [{ step: 'da', act: 'DA 승인', whoId: 'tda' }] }) },
  { key: 'final:model:RQMS:req=tmodin,da=tda2', label: '최종 · 모델 요구사항관리 · 신청 tmodin · 1단계 tda2', step: 'final', doc: doc('A6', 'model', 'final', 'rq', { req: 'tmodin', hist: [{ step: 'da', act: 'DA 승인', whoId: 'tda2' }] }) },
];

export interface ActRow {
  account: string;
  case: string;
  allow: boolean;
}

export function buildActMatrix(accounts: readonly TestAccount[] = TEST_ACCOUNTS, today = MATRIX_TODAY, cases: readonly ActCase[] = ACT_CASES): ActRow[] {
  const actors = accounts.map((a) => actorOf(a, today));
  const rows: ActRow[] = [];
  for (const c of cases) {
    const ctx: RulesCtx = { ...matrixCtx(actors, today), org: { finalDict: true, finalModel: {}, ...(c.selfAppr === undefined ? {} : { selfAppr: c.selfAppr }) } };
    for (const u of actors) rows.push({ account: u.id, case: c.key, allow: canUserAct(ctx, u, c.doc, c.step) });
  }
  return rows;
}

/* ---------- 사람이 보는 표 ---------- */

export function renderPermMatrixMarkdown(rows: readonly MatrixRow[], acts: readonly ActRow[], accounts: readonly TestAccount[] = TEST_ACCOUNTS): string {
  const ids = accounts.map((a) => a.id);
  const cell = new Map(rows.map((r) => [`${r.perm}|${r.target}|${r.account}`, r]));
  const actCell = new Map(acts.map((r) => [`${r.case}|${r.account}`, r]));
  const out: string[] = [
    '# 권한 검사 표 (자동 생성 — 직접 고치지 않는다)',
    '',
    `> 생성: \`npm run rbac:matrix\` · 원본: \`packages/rules\` PERMS · canUser · canUserAct, 시험 계정 \`@neodb/domain\` TEST_ACCOUNTS · 기준일 ${MATRIX_TODAY}.`,
    '> **이 파일이 바뀌는 변경은 권한표 변경이다 — 사람 승인(결정 게이트) 뒤에만 커밋 · 병합한다**(계획 §6.2 · §9.3).',
    `> 칸: ✓ 허용 · ${Object.entries(DENY_LABEL).map(([k, v]) => `${v}(${k})`).join(' · ')} 거부. 화면: 역할 = 숨김, 그 외 = 흐리게 + 이유, API = 403.`,
    '',
    '## 시험 계정',
    '',
    '| 계정 | 역할 | 담당 시스템 | 소속 | 상태 · 조건 |',
    '|---|---|---|---|---|',
    ...accounts.map((a) => `| \`${a.id}\` | ${a.roles.join(' + ') || '없음'} | ${a.systems.join(', ') || '—'} | ${a.kind ?? 'in'} | ${[a.status && a.status !== 'active' ? a.status : '', a.untilDays !== undefined ? `기한 ${a.untilDays >= 0 ? '+' : ''}${a.untilDays}일` : '', a.pwTemp ? '임시 비밀번호' : ''].filter(Boolean).join(' · ') || '—'} |`),
    '',
    '## 권한표 원본 (PERMS)',
    '',
    '| 권한 | 역할 | 범위 | Admin 전체 | 참고 |',
    '|---|---|---|---|---|',
    ...PERMS.map((p) => `| \`${p.id}\` | ${p.roles.join(', ')} | ${p.scope} | ${p.adminAll ? '예' : ''} | ${p.note ?? ''} |`),
    `| (임시 비밀번호로 잠기는 권한) | ${APPROVAL_PERMS.join(', ')} | | | |`,
    '',
  ];
  let group = '';
  for (const p of PERMS) {
    if (p.g !== group) {
      group = p.g;
      out.push(`## 권한 판정 — ${group}`, '', `| 권한 | 대상 | ${ids.join(' | ')} |`, `|---|---|${ids.map(() => ':-:').join('|')}|`);
    }
    for (const t of targetsFor(p)) {
      const cells = ids.map((id) => {
        const r = cell.get(`${p.id}|${t.key}|${id}`);
        return !r ? '?' : r.allow ? '✓' : DENY_LABEL[r.reason ?? 'scope'];
      });
      out.push(`| \`${p.id}\` ${p.n} | ${t.label} | ${cells.join(' | ')} |`);
    }
    const next = PERMS[PERMS.indexOf(p) + 1];
    if (!next || next.g !== group) out.push('');
  }
  out.push('## 결재 행위 판정 (canUserAct — 자기 승인 · 최종 승인 독립성 · 단계)', '', `| 사례 | ${ids.join(' | ')} |`, `|---|${ids.map(() => ':-:').join('|')}|`);
  for (const c of ACT_CASES) out.push(`| ${c.label} | ${ids.map((id) => (actCell.get(`${c.key}|${id}`)?.allow ? '✓' : '—')).join(' | ')} |`);
  out.push('');
  return out.join('\n');
}
