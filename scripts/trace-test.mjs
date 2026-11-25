// 추적 검사용 전체 테스트 실행 — docs/impl/00-orchestration-plan.md §15
//   node scripts/trace-test.mjs      (npm run trace:test)
//
// 실행마다 .trace/runs/<시각>/ 에 결과를 따로 남긴다:
//   vitest.json      vitest --reporter=json (packages · apps · e2e 의 vitest 테스트)
//   playwright.json  Playwright --reporter=json (playwright.config.* 가 있을 때만 — T-P1-11 이후)
//   meta.json        커밋 · 작업 트리 변경 여부 · 입력 지문 · 러너별 종료 코드 · 시각
// trace:check 는 가장 최근 실행만 읽고, end 관문은 meta(커밋 = HEAD · 변경 없음 · 지문 일치 · 필수 러너)를 확인한다.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, watch, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inputsHash, root } from './trace-lib.mjs';

const git = (...a) => spawnSync('git', a, { cwd: root, encoding: 'utf8' }).stdout.trim();
// 끝 관문에 쓸 실행은 커밋된 깨끗한 작업 트리에서 — 변경이 있으면 거부(--allow-dirty 로 시험용 실행만 허용, meta 에 dirty 로 남아 끝 관문은 실패)
if (git('status', '--porcelain').length > 0 && !process.argv.includes('--allow-dirty')) {
  console.error('작업 트리에 커밋하지 않은 변경이 있습니다. 커밋한 뒤 실행하세요(시험용은 --allow-dirty). 작업 에이전트가 모두 멈춘 상태에서 실행합니다.');
  process.exit(1);
}
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dir = join(root, '.trace', 'runs', stamp);
mkdirSync(dir, { recursive: true });
const shell = process.platform === 'win32';
// 실행 중 파일 변경 감시 — 바뀌었다가 복원된 경우도 잡는다(끝에서 git 이 무시하는 파일 · .git · .trace 는 뺀다)
const touched = new Set();
const watcher = watch(root, { recursive: true }, (_e, f) => { if (f) touched.add(String(f).replace(/\\/g, '/')); });
const run = (cmd, args, opts = {}) => new Promise((ok) => {
  const p = spawn(cmd, args, { cwd: root, stdio: 'inherit', shell, ...opts });
  p.on('close', (code) => ok(code));
  p.on('error', () => ok(-1));
});

// 실행 전에 상태를 먼저 기록한다(실행 중 바뀐 상태를 결과에 붙이지 않게). 끝나면 state = done 으로 바꾼다.
const before = { state: 'running', at: new Date().toISOString(), commit: git('rev-parse', 'HEAD'), dirty: git('status', '--porcelain').length > 0, inputsHash: inputsHash() };
writeFileSync(join(dir, 'meta.json'), JSON.stringify(before, null, 1) + '\n');
const runners = {};
runners.vitest = await run('npx', ['vitest', 'run', '--reporter=default', '--reporter=json', `--outputFile.json=${join(dir, 'vitest.json')}`]);
const pwConfig = ['playwright.config.ts', 'playwright.config.js', 'playwright.config.mjs'].find((f) => existsSync(join(root, f)));
if (pwConfig) {
  runners.playwright = await run('npx', ['playwright', 'test', '--reporter=json'], {
    stdio: ['ignore', 'ignore', 'inherit'], env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: join(dir, 'playwright.json') },
  });
}
await new Promise((ok) => setTimeout(ok, 500)); // 늦게 오는 감시 이벤트
watcher.close();
const candidates = [...touched].filter((f) => !/^(\.git|\.trace|node_modules)(\/|$)/.test(f));
let changedFiles = [];
if (candidates.length) {
  // git 이 무시하지 않는 파일(= 추적 대상 · 새 소스)만 남긴다
  const ig = spawnSync('git', ['check-ignore', '--stdin'], { cwd: root, encoding: 'utf8', input: candidates.join('\n') });
  const ignored = new Set(ig.stdout.split(/\r?\n/).filter(Boolean));
  changedFiles = candidates.filter((f) => !ignored.has(f) && !/(^|\/)node_modules\//.test(f));
}
const afterCommit = git('rev-parse', 'HEAD');
const meta = {
  ...before,
  state: 'done',
  finishedAt: new Date().toISOString(),
  // 실행 중에 커밋 · 작업 트리 · 입력이 바뀌었으면 기록(검사는 이 실행을 믿지 않는다)
  changedDuringRun: afterCommit !== before.commit || (git('status', '--porcelain').length > 0) !== before.dirty || inputsHash() !== before.inputsHash || changedFiles.length > 0,
  changedFiles: changedFiles.slice(0, 50),
  playwrightConfig: pwConfig ?? null,
  runners,
};
writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
console.log(`추적 실행 결과: ${dir}`);
console.log(`러너 종료 코드: ${Object.entries(runners).map(([k, v]) => `${k}=${v}`).join(' · ')}${pwConfig ? '' : ' (Playwright 설정 없음 — T-P1-11 이후 추가)'}`);
// 테스트 실패는 trace:check 가 행별로 판정한다 — 여기서는 러너가 결과를 못 만든 경우만 실패로
const missing = Object.keys(runners).filter((k) => !existsSync(join(dir, `${k}.json`)));
if (missing.length) { console.error(`결과 파일을 만들지 못한 러너: ${missing.join(', ')}`); process.exitCode = 1; }
