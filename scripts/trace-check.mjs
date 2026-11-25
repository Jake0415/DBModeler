// 요구사항 완전성 검사 — docs/impl/00-orchestration-plan.md §15
//   node scripts/trace-check.mjs [--phase Pn] [--gate start|end] [--report]
//
// - 행: docs/impl/trace/requirements.json — 입력(출처 · assign · behaviors)의 지문이 다르면 '추적표가 오래됨'(관문 실패)
// - 연결: **테스트 이름(it/test 제목 자체)**의 [ID]만 센다. describe 제목 · 주석의 ID는 세지 않는다.
//   예: it('[ST-R08][BH-model-041] 준수율 …'). 한 테스트가 여러 ID를 가질 수 있다.
// - 결과: 가장 최근 실행 .trace/runs/<시각>/(npm run trace:test). 화면 · API 행은 **e2e/ 파일의 테스트가 통과**해야 통과
//   (verify 'unit' 행 · ARCH 는 어느 테스트든). 건너뜀 · fixme · todo · 예상된 실패(test.fail)는 미충족.
// - 상태: passed · failed · skipped · not-run · no-e2e · no-test · unassigned · bad-task · exempt · exempt-no-decision
// - 관문:
//   --gate start --phase Pn : 추적표 최신 · Pn 행이 모두 배정 · Pn 행의 작업이 01-task-list 의 실제 ID(묶음 이름 'Pn:…' 금지) · 제외 근거
//   --gate end   --phase Pn : 위 + P1~Pn 행이 모두 passed/exempt · 최근 실행의 커밋 = HEAD · 변경 없음 · 지문 일치 · 필수 러너 결과
//   종료 코드: 통과 0, 실패 1, 인수 오류 2. --report 는 docs/impl/trace/coverage.md 를 쓴다.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { decisionStatus, inputsHash, PHASES, pIdx, root, taskIds } from './trace-lib.mjs';

/* 인수 */
const args = process.argv.slice(2);
const known = new Set(['--phase', '--gate', '--report']);
for (const a of args) if (a.startsWith('--') && !known.has(a)) { console.error(`알 수 없는 인수: ${a}`); process.exit(2); }
const val = (k) => {
  const i = args.indexOf(k);
  if (i < 0) return undefined;
  const v = args[i + 1];
  if (!v || v.startsWith('--')) { console.error(`${k} 에 값이 없습니다`); process.exit(2); }
  return v;
};
const phase = val('--phase');
const gate = val('--gate');
const writeReport = args.includes('--report');
if (phase && pIdx(phase) < 1) { console.error(`알 수 없는 단계: ${phase} (P1~P6)`); process.exit(2); }
if (gate && !['start', 'end'].includes(gate)) { console.error('--gate 는 start | end'); process.exit(2); }
if (gate && !phase) { console.error('--gate 에는 --phase 가 필요합니다'); process.exit(2); }

/* 추적표 · 최신 여부 */
const reqPath = join(root, 'docs/impl/trace/requirements.json');
if (!existsSync(reqPath)) { console.error('requirements.json 이 없습니다 — npm run trace:extract 먼저'); process.exit(2); }
const req = JSON.parse(readFileSync(reqPath, 'utf8'));
const rows = req.rows;
const ids = new Set(rows.map((r) => r.id));
const currentHash = inputsHash();
const tableStale = req.inputsHash !== currentHash;

/* 1) 정적: 테스트 파일에서 it/test 제목의 [ID] (파일별) */
const TEST_DIRS = ['packages', 'apps', 'e2e'];
const isTestFile = (p) => /\.(test|spec)\.(ts|tsx|js|mjs)$/.test(p);
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    if (n === 'node_modules' || n === 'dist' || n.startsWith('.')) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out); else if (isTestFile(p)) out.push(p);
  }
  return out;
};
// ID 형식: 대문자로 시작 + '-'로 이은 조각들(영문 · 숫자 · '.' · '_') — 예: ST-R08 · ARCH-13.1 · BH-_shell-001 · MS-dict-grid-2
const TAG = /\[([A-Z][A-Za-z0-9]*(?:-[A-Za-z0-9._]+)+)\]/g;
// it/test 다음의 수식어 사슬(.skip · .fails.each · .concurrent.only …)을 모두 잡는다
const TEST_CALL = /\b(?:it|test)((?:\.[A-Za-z]+)*)\s*(?:\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\))?\s*\(\s*(['"`])((?:\\.|(?!\2).)*)\2/g;
// skipIf · runIf 는 조건에 따라 다르므로 정적 검사가 아니라 러너 결과(건너뜀 · 통과)로 판정한다
const NON_PASSING = new Set(['skip', 'todo', 'fixme', 'fails', 'fail']);
// 주석을 지운다 — 문자열 · 템플릿 · 정규식 리터럴 안의 '//' · '/*' · 따옴표는 보존(간단한 상태 기계)
const stripComments = (s) => {
  let out = '';
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    const n = s[i + 1];
    if (q) { out += c; if (c === '\\') { out += n ?? ''; i++; } else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; out += c; continue; }
    // 정규식 리터럴: '/' 앞(공백 제외)이 연산자 · 여는 괄호 · 줄 시작 · return 이면 정규식으로 보고 끝 '/'까지 그대로 복사
    if (c === '/' && n !== '/' && n !== '*' && /(^|[(,=:[!&|?{};+\-*%<>~^]|\breturn|\btypeof)\s*$/.test(out.slice(-20))) {
      let cls = false;
      out += c;
      for (i++; i < s.length && s[i] !== '\n'; i++) {
        const d = s[i];
        out += d;
        if (d === '\\') { out += s[i + 1] ?? ''; i++; continue; }
        if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break;
      }
      continue;
    }
    if (c === '/' && n === '/') { while (i < s.length && s[i] !== '\n') i++; out += '\n'; continue; }
    if (c === '/' && n === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) i++; i++; continue; }
    out += c;
  }
  return out;
};
const staticTags = new Map(); // id -> Set(파일)
const nonPassingTags = new Set(); // skip · todo · fixme · 예상 실패(fails/fail)로 선언된 테스트의 ID
const unknownTags = new Map();
let e2eFileCount = 0;
for (const d of TEST_DIRS) {
  for (const f of walk(join(root, d))) {
    const rel = relative(root, f).replace(/\\/g, '/');
    if (rel.startsWith('e2e/')) e2eFileCount++;
    const text = stripComments(readFileSync(f, 'utf8'));
    for (const call of text.matchAll(TEST_CALL)) {
      const mods = (call[1] ?? '').split('.').filter(Boolean);
      for (const m of call[3].matchAll(TAG)) {
        if (mods.some((x) => NON_PASSING.has(x))) nonPassingTags.add(m[1]);
        const target = ids.has(m[1]) ? staticTags : unknownTags;
        if (!target.has(m[1])) target.set(m[1], new Set());
        target.get(m[1]).add(rel);
      }
    }
  }
}
// 상태 전수 E2E(T-P1-16)가 남기는 기대 역할: e2e/states/expected-roles.json = { "MS-…": ["tadm", "tda", …] }
// 테스트 제목에 '@<계정>'을 넣는다 — 예: test('[MS-approvals-1] @tda 대기함', …). 기대 역할이 모두 통과해야 그 행이 통과.
const expectedRolesPath = join(root, 'e2e/states/expected-roles.json');
const expectedRoles = existsSync(expectedRolesPath) ? JSON.parse(readFileSync(expectedRolesPath, 'utf8')) : {};

/* 2) 실행 결과: 가장 최근 실행만 */
const runsDir = join(root, '.trace/runs');
let runDir = null;
let meta = null;
if (existsSync(runsDir)) {
  // 가장 최근 실행 폴더 하나만 — 그 실행이 끝나지 않았으면(meta 없음 · state ≠ done) 이전 실행으로 내려가지 않는다
  const runs = readdirSync(runsDir).filter((n) => statSync(join(runsDir, n)).isDirectory()).sort();
  if (runs.length) {
    runDir = join(runsDir, runs[runs.length - 1]);
    const mp = join(runDir, 'meta.json');
    meta = existsSync(mp) ? JSON.parse(readFileSync(mp, 'utf8')) : { state: 'missing' };
  }
}
const runComplete = meta?.state === 'done';
// id -> { pass, fail, skip, passFiles:Set(통과한 테스트의 파일), roles:Set(e2e 통과 역할) }
const run = new Map();
const note = (title, file, outcome) => {
  const rel = String(file ?? '').replace(/\\/g, '/');
  const roles = [...String(title).matchAll(/@([a-z][a-z0-9_-]*)/g)].map((m) => m[1]);
  for (const m of String(title).matchAll(TAG)) {
    const s = run.get(m[1]) ?? { pass: 0, fail: 0, skip: 0, passFiles: new Set(), roles: new Map() };
    if (outcome === 'pass') { s.pass++; s.passFiles.add(rel); if (rel.startsWith('e2e/')) roles.forEach((r) => s.roles.set(r, (s.roles.get(r) ?? new Set()).add(rel))); }
    else if (outcome === 'fail') s.fail++; else s.skip++;
    run.set(m[1], s);
  }
};
const runnerFiles = runDir && runComplete ? readdirSync(runDir).filter((n) => n.endsWith('.json') && n !== 'meta.json') : [];
for (const n of runnerFiles) {
  const j = JSON.parse(readFileSync(join(runDir, n), 'utf8'));
  // vitest: testResults[].name(파일) · assertionResults[].title(테스트 제목 자체) · status
  for (const tr of j.testResults ?? []) {
    for (const a of tr.assertionResults ?? []) {
      const outcome = a.status === 'passed' ? 'pass' : a.status === 'failed' ? 'fail' : 'skip';
      note(a.title, relative(root, tr.name ?? ''), outcome);
    }
  }
  // playwright: suites[].specs[](title · file — config.rootDir 기준) · tests[].results[].status — 마지막 결과가 'passed' 이고 예상 상태가 통과일 때만 통과
  const pwRoot = j.config?.rootDir ?? root;
  const visit = (suite) => {
    for (const sp of suite.specs ?? []) {
      for (const t of sp.tests ?? []) {
        const last = (t.results ?? []).slice(-1)[0];
        const outcome = !last || last.status === 'skipped' || t.expectedStatus === 'skipped' ? 'skip'
          : last.status === 'passed' && t.expectedStatus === 'passed' ? 'pass' : 'fail';
        note(sp.title, sp.file ? relative(root, join(pwRoot, sp.file)) : '', outcome);
      }
    }
    for (const s of suite.suites ?? []) visit(s);
  };
  for (const s of j.suites ?? []) visit(s);
}

/* 3) 행 상태 */
const TASKS = taskIds();
const needsE2e = (r) => r.verify !== 'unit' && r.kind !== 'ARCH';
// 작업 ID 검사 — 없는 ID는 언제나 문제. 관문 단계(Pn)의 행은 묶음 이름('Pk:…')이 남아 있거나 더 늦은 단계 작업(T-P(k>n)-…)을 가리키면 문제
const taskProblem = (r) => {
  for (const t of r.tasks ?? []) {
    const bundle = t.match(/^(P\d):/);
    const inGatePhase = gate && r.phase === phase;
    if (bundle) { if (inGatePhase || (gate === 'end' && pIdx(r.phase) <= pIdx(phase))) return `묶음 미분해(${t})`; continue; }
    if (!TASKS.has(t)) return `없는 작업 ID(${t})`;
    const tp = t.match(/^T-(P\d)-/)?.[1];
    if (inGatePhase && tp && pIdx(tp) > pIdx(phase)) return `더 늦은 단계 작업(${t})`;
  }
  return null;
};
const exemptStatus = (r) => {
  if (r.verify === 'exempt-no-decision') return 'exempt-no-decision';
  if (!r.decision) return r.kind === 'BH' && /목업/.test(r.exemptReason ?? '') ? 'exempt' : 'exempt-no-decision';
  const d = decisionStatus(r.decision);
  return d === 'approved' ? 'exempt' : d === 'pending' ? 'exempt-pending' : 'exempt-no-decision';
};
const statusOf = (r) => {
  if (r.phase && taskProblem(r)) return 'bad-task'; // 제외 행도 단계 · 작업이 있으면 검사
  if (r.phase && !(r.tasks?.length)) return 'unassigned'; // 단계가 있으면 제외 행도 실제 작업 ID 가 있어야 한다
  if (r.verify === 'exempt' || r.verify === 'exempt-no-decision') return exemptStatus(r);
  if (!r.phase || pIdx(r.phase) < 1 || !(r.tasks?.length)) return 'unassigned';
  if (!staticTags.has(r.id)) return 'no-test';
  const tagged = [...staticTags.get(r.id)];
  const taggedE2e = tagged.filter((f) => f.startsWith('e2e/'));
  if (needsE2e(r) && !taggedE2e.length) return 'no-e2e';
  if (nonPassingTags.has(r.id)) return 'skipped';
  const s = run.get(r.id);
  if (!s) return 'not-run';
  if (s.fail > 0) return 'failed';
  if (s.skip > 0) return 'skipped';
  // 통과 결과는 그 ID를 태그한 파일(화면 · API 행은 e2e 파일)에서 나와야 한다
  const okFiles = needsE2e(r) ? taggedE2e : tagged;
  if (!okFiles.some((f) => s.passFiles.has(f))) return 'not-run';
  if (r.kind === 'MS') {
    const want = expectedRoles[r.id];
    // 역할마다 그 ID를 태그한 e2e 파일에서 통과해야 한다
    if (!Array.isArray(want) || !want.length || want.some((role) => !taggedE2e.some((f) => s.roles.get(role)?.has(f)))) return 'missing-role';
  }
  return 'passed';
};
const all = rows.map((r) => ({ ...r, status: statusOf(r), problem: taskProblem(r) }));
const LABEL = {
  passed: '통과', failed: '실패', skipped: '건너뜀 · fixme', 'not-run': '실행 결과 없음', 'no-e2e': '단위 테스트만(E2E 없음)',
  'missing-role': '역할 일부 미검증', 'no-test': '테스트 없음', unassigned: '미배정', 'bad-task': '작업 ID 문제',
  exempt: '제외', 'exempt-pending': '제외(사람 결정 대기)', 'exempt-no-decision': '제외(근거 없음)',
};
const upTo = (r, p) => r.phase && pIdx(r.phase) >= 1 && pIdx(r.phase) <= pIdx(p);

let scope = all;
const bad = [];
const runProblems = [];
if (gate) {
  if (tableStale) runProblems.push('추적표가 오래됨 — 입력(출처 · assign · behaviors)이 바뀌었다. npm run trace:extract 를 다시 실행');
  const always = all.filter((r) => ['unassigned', 'exempt-no-decision'].includes(r.status) || (r.status === 'bad-task' && /없는 작업 ID/.test(r.problem ?? '')));
  // 사람 결정을 기다리는 제외는 마지막 단계(P6) 끝 관문에서만 막는다 — 그 전에 사람이 답해야 계획이 끝난다
  const pending = gate === 'end' && phase === 'P6' ? all.filter((r) => r.status === 'exempt-pending') : [];
  if (gate === 'start') {
    scope = all.filter((r) => r.phase === phase);
    bad.push(...always, ...scope.filter((r) => r.status === 'bad-task'));
  } else {
    scope = all.filter((r) => upTo(r, phase));
    bad.push(...always, ...pending, ...scope.filter((r) => !['passed', 'exempt', 'exempt-pending'].includes(r.status)));
    if (!meta) runProblems.push('실행 결과 없음 — npm run trace:test');
    else if (!runComplete) runProblems.push(`최근 실행(${relative(root, runDir)})이 끝나지 않았다(meta ${meta.state}) — 다시 실행`);
    else {
      if (meta.changedDuringRun) runProblems.push('최근 실행 중에 커밋 · 작업 트리 · 입력이 바뀌었다');
      const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
      if (meta.commit !== head) runProblems.push(`최근 실행의 커밋(${String(meta.commit).slice(0, 8)})이 HEAD(${head.slice(0, 8)})와 다르다`);
      if (meta.dirty) runProblems.push('최근 실행 때 작업 트리에 커밋하지 않은 변경이 있었다');
      if (meta.inputsHash !== currentHash) runProblems.push('최근 실행 뒤 추적표 입력이 바뀌었다');
      if (!runnerFiles.includes('vitest.json')) runProblems.push('vitest 결과 없음');
      if (e2eFileCount > 0 && !runnerFiles.includes('playwright.json')) {
        if (!meta.playwrightConfig) runProblems.push('e2e/ 테스트가 있는데 Playwright 설정이 없다(T-P1-11)');
        else runProblems.push('Playwright 결과 없음');
      }
    }
  }
} else if (phase) scope = all.filter((r) => upTo(r, phase));

const uniq = [...new Map(bad.map((r) => [r.id, r])).values()];
const tally = (list) => Object.fromEntries(Object.keys(LABEL).map((k) => [k, list.filter((r) => r.status === k).length]));
const t = tally(scope);
console.log(`추적표 ${all.length}행${phase ? ` · 범위 ${gate === 'start' ? phase : `P1~${phase}`} ${scope.length}행` : ''} — ` + Object.entries(t).filter(([, n]) => n).map(([k, n]) => `${LABEL[k]} ${n}`).join(' · '));
if (tableStale) console.log('경고: 추적표가 오래됨 — npm run trace:extract');
if (!meta) console.log('실행 결과 없음(.trace/runs) — npm run trace:test');
else console.log(`최근 실행: ${relative(root, runDir)} · ${runComplete ? '' : `미완료(${meta.state}) · `}커밋 ${String(meta.commit ?? '?').slice(0, 8)}${meta.dirty ? ' (변경 있음)' : ''} · 러너 ${runnerFiles.map((f) => f.replace('.json', '')).join(', ') || '없음'}`);
// 단위 테스트(verify unit)로 둔 행 중 화면 표현이 있는 것 — 리뷰 · 조정자가 e2e 로 바꿀지 본다
const unitScreen = all.filter((r) => r.verify === 'unit' && r.kind === 'BH' && /표시|보인다|보임|화면|버튼|이동|포커스|문구|토스트|띄운다|열린다/.test(r.title ?? ''));
if (unitScreen.length) console.log(`참고: 'unit' 으로 둔 화면 동작 중 화면 표현이 있는 행 ${unitScreen.length}개 — e2e 가 맞는지 확인(--report 에 목록)`);
if (unknownTags.size) console.log(`추적표에 없는 테스트 태그 ${unknownTags.size}개: ${[...unknownTags.keys()].slice(0, 20).join(', ')}${unknownTags.size > 20 ? ' …' : ''}`);
if (gate) {
  if (uniq.length || runProblems.length) {
    console.log(`관문(${gate} ${phase}) 실패`);
    for (const p of runProblems) console.log(`  - ${p}`);
    for (const r of uniq.slice(0, 40)) console.log(`  ${r.id} [${LABEL[r.status]}${r.problem ? ` · ${r.problem}` : ''}] ${r.title?.slice(0, 70) ?? ''}`);
    if (uniq.length > 40) console.log(`  … 외 ${uniq.length - 40}행 (--report 로 전체)`);
    process.exitCode = 1;
  } else console.log(`관문(${gate} ${phase}) 통과`);
}

if (writeReport) {
  const kinds = ['REQ', 'UIR', 'UI', 'META', 'RBAC', 'ARCH', 'SCN', 'MS', 'BH'];
  const lines = [
    '# 요구사항 추적 현황 (자동 생성 — node scripts/trace-check.mjs --report)',
    '',
    `> 행 원본: requirements.json${tableStale ? ' **(오래됨)**' : ''} · 태그: 테스트 이름의 [ID] · 결과: ${meta ? `${relative(root, runDir).replace(/\\/g, '/')} (커밋 ${String(meta.commit ?? '?').slice(0, 8)})` : '없음'}`,
    '',
    '| 종류 | 전체 | ' + Object.values(LABEL).join(' | ') + ' |',
    '|---|---|' + Object.keys(LABEL).map(() => '---').join('|') + '|',
  ];
  for (const k of kinds) {
    const list = all.filter((r) => r.kind === k);
    const tk = tally(list);
    lines.push(`| ${k} | ${list.length} | ` + Object.keys(LABEL).map((s) => tk[s] || '').join(' | ') + ' |');
  }
  lines.push('', '## 단계별', '', '| 단계 | 행 | 통과 · 제외 | 남음 |', '|---|---|---|---|');
  for (const p of PHASES.slice(1)) {
    const list = all.filter((r) => r.phase === p);
    if (!list.length) continue;
    const ok = list.filter((r) => ['passed', 'exempt'].includes(r.status)).length;
    lines.push(`| ${p} | ${list.length} | ${ok} | ${list.length - ok} |`);
  }
  if (unitScreen.length) {
    lines.push('', `## 참고: 'unit'으로 둔 화면 동작 중 화면 표현이 있는 행 (${unitScreen.length})`, '', '> e2e 로 검증해야 하면 assign.json 행에 verify: e2e 를 적는다.', '');
    for (const r of unitScreen) lines.push(`- ${r.id} — ${(r.title ?? '').slice(0, 100)}`);
  }
  lines.push('', '## 통과하지 않은 행', '', '| ID | 종류 | 단계 | 작업 | 상태 | 내용 |', '|---|---|---|---|---|---|');
  for (const r of all.filter((x) => !['passed', 'exempt'].includes(x.status))) {
    lines.push(`| ${r.id} | ${r.kind} | ${r.phase ?? '—'} | ${(r.tasks ?? []).join(', ') || '—'} | ${LABEL[r.status]}${r.problem ? ` · ${r.problem}` : ''} | ${(r.title ?? '').replace(/\|/g, '/').slice(0, 90)} |`);
  }
  writeFileSync(join(root, 'docs/impl/trace/coverage.md'), lines.join('\n') + '\n');
  console.log('보고서: docs/impl/trace/coverage.md');
}
