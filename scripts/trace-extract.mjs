// 요구사항 추적표 만들기 — docs/impl/00-orchestration-plan.md §15
//   node scripts/trace-extract.mjs        → docs/impl/trace/requirements.json (자동 생성, 직접 고치지 않는다)
//
// 원본(출처 문서)에서 기능 행을 뽑고, 사람이 정한 배정(docs/impl/trace/assign.json)을 합친다.
// 행 종류(kind)와 ID 형식 — 테스트 이름(it/test 의 제목)에 [ID] 를 붙이면 trace:check 가 연결한다:
//   REQ  우선순위 요구        ST-R08 · OUT-R02 …        docs/spec/da-feature-spec/20-priority.md
//   UIR  공통 UI 설계 규칙     UIR-01 …                  20-priority §2.2 (ID 없는 규칙에 표 순서로 번호)
//   UI   화면 · 패널 · 창      SC-10 · PN-21 · MO-22 · UI-MD-20(02-flows 의 MD 는 UI- 를 붙여 메타 규칙과 구분)
//   META 메타데이터 규칙       MD-01 …                  docs/spec/da-feature-spec/30-metadata-design.md
//   RBAC RBAC 2차 항목        R-01 · N-01 …            docs/ux/review/resolution-rbac-r2.md(최종 합의표) · 29-rbac-r2.md
//   ARCH 백엔드 검토 반영      ARCH-13.1 …              docs/arch/01-backend-architecture-v1.md §13
//   SCN  다중 계정 시나리오    S-01 …                   docs/impl/01-task-list.md §2
//   MS   목업 상태            MS-<화면>-<n>            docs/impl/screen-manifest.json
//   BH   화면 동작            BH-<화면>-<nnn>          docs/impl/trace/behaviors/*.json
//
// 배정 규칙(assign.json): rows(행별) > screens(화면 기본값). 화면 동작(BH)은 refs 로 가리킨 행 중 가장 늦은 단계로 맞춘다
// (예: 결재함 동작이 MD-27(P3 알림)을 가리키면 P3). 제외(exempt)는 근거가 있어야 한다 — 화면 동작은 '목업' 장치이거나
// decision, 그 밖의 행은 decision(Q-n · D-nnn · 계획 절)이 반드시 있어야 한다. 없으면 'exempt-no-decision'으로 남아 관문에서 걸린다.
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BEHAVIOR_DIR, inputsHash, pIdx, rd, root } from './trace-lib.mjs';

const rows = new Map();
const add = (r) => {
  if (rows.has(r.id)) { const o = rows.get(r.id); if (!o.title && r.title) o.title = r.title; return; }
  rows.set(r.id, r);
};
const clean = (s) => s.replace(/\*\*/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

/* REQ · UIR — 20-priority */
{
  const src = 'docs/spec/da-feature-spec/20-priority.md';
  const lines = rd(src).split(/\r?\n/);
  let wave = '';
  let inUir = false;
  let uir = 0;
  for (const line of lines) {
    const h = line.match(/^###\s+(W\d)/); if (h) wave = h[1];
    if (/^#{2,3}\s+2\.2\b/.test(line)) { inUir = true; continue; }
    if (inUir && /^#{2,3}\s/.test(line)) inUir = false;
    if (inUir) {
      const u = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*)\|/);
      if (u && !/^규칙$/.test(u[1]) && !/^-+$/.test(u[1].replace(/\s/g, ''))) { uir++; add({ id: `UIR-${String(uir).padStart(2, '0')}`, kind: 'UIR', title: clean(u[1]), basis: clean(u[2]), source: `${src} §2.2` }); }
      continue;
    }
    const m = line.match(/^\|\s*\d+\s*\|\s*([A-Z]{2,3}-R\d{2})\s*\|\s*([^|]+)\|\s*([^|]*)\|/);
    if (m) add({ id: m[1], kind: 'REQ', title: clean(m[2]), stage: clean(m[3]), wave, source: src });
  }
  for (const id of new Set(rd(src).match(/\b[A-Z]{2,3}-R\d{2}\b/g) ?? [])) add({ id, kind: 'REQ', title: '', wave: '', source: src });
}

/* UI — 02-flows 화면 목록 표 (첫 칸에 ID가 여러 개일 수 있다) */
{
  const src = 'docs/ux/02-flows.md';
  for (const line of rd(src).split(/\r?\n/)) {
    const m = line.match(/^\|([^|]*\b(?:SC|PN|MO|MD)-\d{2}[^|]*)\|\s*([^|]+)\|/);
    if (m) for (const id of m[1].match(/\b(?:SC|PN|MO|MD)-\d{2}[a-zA-Z]?\b/g)) add({ id: id.startsWith('MD-') ? `UI-${id}` : id, kind: 'UI', title: clean(m[2]), source: src });
  }
  for (const id of new Set(rd(src).match(/\b(?:SC|PN|MO)-\d{2}[a-zA-Z]?\b/g) ?? [])) add({ id, kind: 'UI', title: '', source: src });
}

/* META — 30 메타데이터 표 */
{
  const src = 'docs/spec/da-feature-spec/30-metadata-design.md';
  for (const line of rd(src).split(/\r?\n/)) {
    const m = line.match(/^\|\s*\**\s*(MD-\d{2})[^|]*\|\s*([^|]+)\|/);
    if (m) add({ id: m[1], kind: 'META', title: clean(m[2]), source: src });
  }
  for (const id of new Set(rd(src).match(/\bMD-\d{2}\b/g) ?? [])) add({ id, kind: 'META', title: '', source: src });
}

/* RBAC — 최종 합의표(resolution) 먼저, 그다음 29 본문 · 합의 검토 문서로 보충 */
{
  const src = 'docs/ux/review/resolution-rbac-r2.md';
  if (existsSync(join(root, src))) {
    for (const line of rd(src).split(/\r?\n/)) {
      const m = line.match(/^\|\s*\**([RN]-\d{2})\**\s*\|\s*([^|]*)\|\s*([^|]+)\|/);
      if (m) add({ id: m[1], kind: 'RBAC', title: clean(m[3]).slice(0, 200), severity: clean(m[2]), source: src });
    }
  }
  const src29 = 'docs/ux/29-rbac-r2.md';
  const text = rd(src29);
  for (const id of new Set(text.match(/\b[RN]-\d{2}\b/g) ?? [])) {
    const line = text.split(/\r?\n/).find((l) => l.includes(id) && !/R-01 ~ 26/.test(l)) ?? '';
    const cell = line.split('|').map((c) => c.trim()).filter(Boolean).find((c) => c.includes(id)) ?? line;
    add({ id, kind: 'RBAC', title: clean(cell).slice(0, 160), source: src29 });
  }
  const srcA = 'docs/ux/review/claude-r2rbac-agree.md';
  if (existsSync(join(root, srcA))) {
    for (const line of rd(srcA).split(/\r?\n/)) {
      const m = line.match(/^#{2,4}\s+([RN]-\d{2})\s+(.+?)(?:\s+—.*)?$/);
      if (m) add({ id: m[1], kind: 'RBAC', title: clean(m[2]), source: srcA });
    }
  }
}

/* ARCH — 백엔드 §13 하위 절 */
{
  const src = 'docs/arch/01-backend-architecture-v1.md';
  for (const line of rd(src).split(/\r?\n/)) {
    const m = line.match(/^###\s+(13\.\d+)\s+(.+)$/);
    if (m) add({ id: `ARCH-${m[1]}`, kind: 'ARCH', title: clean(m[2]), source: src });
  }
}

/* SCN — 작업 목록 §2 시나리오 표 */
{
  const src = 'docs/impl/01-task-list.md';
  for (const line of rd(src).split(/\r?\n/)) {
    const m = line.match(/^\|\s*(S-\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|/);
    if (m) add({ id: m[1], kind: 'SCN', title: clean(m[2]), accounts: clean(m[3]), phaseHint: clean(m[4]), source: src });
  }
}

/* UI 보충 · MS — screen-manifest */
{
  const src = 'docs/impl/screen-manifest.json';
  const man = JSON.parse(rd(src));
  for (const s of man.screens) for (const id of s.ids.match(/\b(?:SC|PN|MO)-[0-9A-Za-z]+\b/g) ?? []) add({ id, kind: 'UI', title: s.name, screen: s.file, source: src });
  for (const s of man.screens) {
    const slug = s.file.replace(/\.html$/, '');
    s.states.forEach((st, i) => add({ id: `MS-${slug}-${i + 1}`, kind: 'MS', title: `${s.name} — ${st.label}`, screen: s.file, url: st.url, source: src }));
  }
}

/* BH — 화면 동작 목록 */
if (existsSync(join(root, BEHAVIOR_DIR))) {
  for (const f of readdirSync(join(root, BEHAVIOR_DIR)).filter((n) => n.endsWith('.json')).sort()) {
    const j = JSON.parse(rd(`${BEHAVIOR_DIR}/${f}`));
    for (const b of j.behaviors ?? []) {
      add({
        id: b.id, kind: 'BH', title: `${b.where} · ${b.trigger} → ${b.expected}`.slice(0, 300), screen: j.screen,
        roles: b.roles, refs: b.refs ?? [], states: b.states ?? [], verify: b.verify, exemptReason: b.exemptReason, source: `${BEHAVIOR_DIR}/${f}`,
      });
    }
  }
}

/* 배정 합치기 */
const assign = JSON.parse(rd('docs/impl/trace/assign.json'));
const merged = new Map();
for (const r of rows.values()) {
  const byScreen = r.screen ? assign.screens?.[r.screen] : undefined;
  const a = assign.rows?.[r.id] ?? {};
  const m = { ...r, phase: a.phase ?? byScreen?.phase ?? null, tasks: [...(a.tasks ?? byScreen?.tasks ?? [])], explicit: !!assign.rows?.[r.id] };
  if (a.verify) m.verify = a.verify;
  if (a.exemptReason) m.exemptReason = a.exemptReason;
  if (a.decision) m.decision = a.decision;
  if (a.note) m.note = a.note;
  if (!m.verify) m.verify = 'test';
  // 'W2 범위' · '후속 차수' · '다음 버전'이라는 이유로 제외한 동작은 제외가 아니라 P5(W2)에서 구현 · 검증한다 — 빠지지 않게
  if (m.verify === 'exempt' && /W2|후속 ?차수|다음 버전|후속 범위/.test(m.exemptReason ?? '') && !a.verify) {
    m.verify = 'test';
    m.phase = 'P5';
    m.tasks = ['P5:모델링 완성도(W2)'];
    m.note = `W2 범위 → P5 (원래 제외 사유: ${m.exemptReason})`;
    delete m.exemptReason;
  }
  if (m.kind === 'MS' && !m.tasks.includes('T-P1-16')) m.tasks.push('T-P1-16');
  merged.set(m.id, m);
}
// 화면 동작은 refs 로 가리킨 행 중 가장 늦은 단계로(행별 배정이 있으면 그대로)
for (const m of merged.values()) {
  if (m.kind !== 'BH' || m.explicit || m.verify === 'exempt') continue;
  for (const ref of m.refs ?? []) {
    const t = merged.get(ref) ?? merged.get(`UI-${ref}`);
    if (t?.phase && pIdx(t.phase) > pIdx(m.phase ?? 'P0')) {
      m.phase = t.phase;
      m.tasks = [...new Set([...m.tasks, ...t.tasks])];
      m.note = [m.note, `단계를 ${ref}(${t.phase})에 맞춤`].filter(Boolean).join(' · ');
    }
  }
}
// 제외 근거 검사
for (const m of merged.values()) {
  if (m.verify !== 'exempt') continue;
  const ok = m.kind === 'BH' ? (/목업/.test(m.exemptReason ?? '') || !!m.decision) : !!m.decision;
  if (!ok || !m.exemptReason) m.verify = 'exempt-no-decision';
}

const out = [...merged.values()].map(({ explicit, ...r }) => r);
const kindOrder = ['REQ', 'UIR', 'UI', 'META', 'RBAC', 'ARCH', 'SCN', 'MS', 'BH'];
out.sort((x, y) => kindOrder.indexOf(x.kind) - kindOrder.indexOf(y.kind) || x.id.localeCompare(y.id, 'en', { numeric: true }));
const unknownAssign = Object.keys(assign.rows ?? {}).filter((id) => !rows.has(id));
const unknownScreens = Object.keys(assign.screens ?? {}).filter((s) => !out.some((r) => r.screen === s));
writeFileSync(join(root, 'docs/impl/trace/requirements.json'), JSON.stringify({
  note: '자동 생성 — node scripts/trace-extract.mjs. 직접 고치지 말고 출처 문서 · assign.json · behaviors/*.json 을 고친다.',
  inputsHash: inputsHash(),
  rows: out,
}, null, 1) + '\n');
const count = (k) => out.filter((r) => r.kind === k).length;
console.log(`추적표 ${out.length}행 — ${kindOrder.map((k) => `${k} ${count(k)}`).join(' · ')}`);
console.log(`단계 없음 ${out.filter((r) => !r.phase && !r.verify.startsWith('exempt')).length}행 · 제외 근거 없음 ${out.filter((r) => r.verify === 'exempt-no-decision').length}행`);
if (unknownAssign.length) { console.error(`assign.json rows 에만 있고 출처에 없는 ID: ${unknownAssign.join(', ')}`); process.exitCode = 1; }
if (unknownScreens.length) { console.error(`assign.json screens 에 있지만 행이 없는 화면: ${unknownScreens.join(', ')}`); process.exitCode = 1; }
