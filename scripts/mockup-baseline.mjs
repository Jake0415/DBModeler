// 목업 화면 목록 · 기준 스크린샷 — docs/impl/00-orchestration-plan.md §10 P0
//   node scripts/mockup-baseline.mjs            화면 목록만 갱신 (docs/impl/screen-manifest.json)
//   node scripts/mockup-baseline.mjs --shots    + 기준 스크린샷 (e2e/baseline/mockups/*.png, 저장소에 올리지 않음)
//
// - 화면 목록은 목업 assets/app.js 의 화면 목록(index 의 SCREENS: file · ids · name · menu · states)에서 뽑는다.
// - 스크린샷은 목업 서버(serve.ps1)를 잠시 띄우고 Edge 헤드리스로 1920×1080을 찍는다.
//   상태별 주소 + 화면마다 목업 사용자 5명(?as=…&audit=1 — 역할을 저장하지 않고 그 화면에서만 바꿈).
// - UX 담당은 구현 화면을 이 기준과 비교한다. 목업이 바뀌면 다시 만든다.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mock = join(root, 'docs', 'ux', 'mockups');
const manifestPath = join(root, 'docs', 'impl', 'screen-manifest.json');
const outDir = join(root, 'e2e', 'baseline', 'mockups');
const PORT = 5179;
const MOCK_USERS = [
  ['kim', '김모델 · 모델러+DA'],
  ['park', '박설계 · 외주 모델러'],
  ['lee', '이데이터 · DA+Admin'],
  ['hyun', '이현업 · 기관 담당자'],
  ['choi', '최담당 · 기관 담당자+모델러'],
];

/* ---------- 화면 목록 ---------- */
function parseCatalog() {
  const src = readFileSync(join(mock, 'assets', 'app.js'), 'utf8');
  const screens = [];
  for (const line of src.split(/\r?\n/)) {
    const m = line.match(/^\s*\{ file: '([a-z0-9-]+\.html)', ids: '([^']*)', name: '([^']*)', menu: '([^']*)'/);
    if (!m) continue;
    const statesPart = line.slice(line.indexOf('states:'));
    const states = [...statesPart.matchAll(/\['((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'\]/g)].map((s) => ({ label: s[1], url: s[2] }));
    screens.push({ file: m[1], ids: m[2], name: m[3], menu: m[4], states });
  }
  if (!screens.length) throw new Error('목업 화면 목록을 찾지 못했습니다(assets/app.js 형식이 바뀌었나요?)');
  return screens;
}

/* ---------- 스크린샷 ---------- */
const slug = (s) => s.replace(/\.html.*$/, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
function withParams(url, params) {
  const u = new URL(url, `http://localhost:${PORT}/`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}
function findEdge() {
  const c = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  const p = c.find((x) => existsSync(x));
  if (!p) throw new Error('Edge(msedge.exe)를 찾지 못했습니다.');
  return p;
}
async function waitServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://localhost:${PORT}/index.html`); if (r.ok) return; } catch { /* 아직 */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`목업 서버(localhost:${PORT})가 뜨지 않았습니다.`);
}

/** 포트가 비어 있어야 시작한다 — 다른 서버를 목업으로 착각하지 않게 */
function assertPortFree(port) {
  return new Promise((ok, fail) => {
    const s = createServer();
    s.once('error', () => fail(new Error(`포트 ${port}이(가) 사용 중입니다. 다른 서버를 끄고 다시 실행하세요.`)));
    s.listen(port, '127.0.0.1', () => s.close(() => ok()));
  });
}

/** 이 스크립트가 띄운 서버(자식 프로세스 트리)만 끈다 */
function stopServer(child) {
  if (!child.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill();
}

async function shots(screens) {
  mkdirSync(outDir, { recursive: true });
  const edge = findEdge();
  await assertPortFree(PORT);
  const server = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(mock, 'serve.ps1'), '-Port', String(PORT)], { stdio: 'ignore' });
  const profile = mkdtempSync(join(tmpdir(), 'neodb-baseline-'));
  const list = [];
  let shotTmp = '';
  try {
    // 촬영 임시 폴더는 결과 폴더와 같은 드라이브에 둔다(드라이브를 넘는 rename 은 Windows에서 실패)
    shotTmp = mkdtempSync(join(outDir, '.tmp-'));
    await waitServer();
    const seen = new Map();
    const add = (x) => { const d = seen.get(x.url); if (d) list.push({ ...x, dupOf: d }); else { seen.set(x.url, x.name); list.push(x); } };
    for (const s of screens) {
      s.states.forEach((st, i) => add({ name: `${slug(s.file)}__s${i + 1}`, url: withParams(st.url, { audit: '1' }), screen: s.file, what: st.label }));
      const first = s.states[0]?.url ?? s.file;
      for (const [u, label] of MOCK_USERS) add({ name: `${slug(s.file)}__as-${u}`, url: withParams(first, { as: u, audit: '1' }), screen: s.file, what: label });
    }
    let ok = 0;
    const todo = list.filter((x) => !x.dupOf);
    for (const x of todo) {
      // 이번 실행의 임시 파일에 찍고, 새로 생겼을 때만 기준 파일로 옮긴다(이전 파일을 성공으로 세지 않게)
      const tmp = join(shotTmp, `${x.name}.png`);
      const file = join(outDir, `${x.name}.png`);
      const r = spawnSync(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', `--user-data-dir=${join(profile, 'edge')}`, '--window-size=1920,1080', '--virtual-time-budget=4000', `--screenshot=${tmp}`, x.url], { stdio: 'ignore', timeout: 60000 });
      x.ok = r.status === 0 && existsSync(tmp) && statSync(tmp).size > 0;
      if (x.ok) renameSync(tmp, file);
      if (x.ok) ok++;
      process.stdout.write(x.ok ? '.' : 'x');
    }
    process.stdout.write('\n');
    writeFileSync(join(outDir, 'index.json'), JSON.stringify(list, null, 1) + '\n');
    const dups = list.length - todo.length;
    console.log(`기준 스크린샷 ${ok}/${todo.length}장 → ${outDir}` + (dups ? ` (같은 주소 ${dups}개는 중복이라 건너뜀 — index.json 의 dupOf)` : ''));
    if (ok !== todo.length) process.exitCode = 1;
  } finally {
    stopServer(server);
    rmSync(profile, { recursive: true, force: true });
    if (shotTmp) rmSync(shotTmp, { recursive: true, force: true });
  }
}

const screens = parseCatalog();
writeFileSync(manifestPath, JSON.stringify({ source: 'docs/ux/mockups/assets/app.js', mockUsers: MOCK_USERS.map(([id, label]) => ({ id, label })), screens }, null, 1) + '\n');
console.log(`화면 목록 ${screens.length}개 · 상태 ${screens.reduce((n, s) => n + s.states.length, 0)}개 → ${manifestPath}`);
if (process.argv.includes('--shots')) {
  try { await shots(screens); } catch (e) { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; }
}
