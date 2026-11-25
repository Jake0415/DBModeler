// 추적표 공용 — 입력 파일 목록 · 지문 · 단계 · 작업 ID (trace-extract · trace-check · trace-test 가 함께 쓴다)
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const rd = (p) => readFileSync(join(root, p), 'utf8');
export const PHASES = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];
export const pIdx = (p) => PHASES.indexOf(p);

/** 추적표를 만드는 입력 — 이 중 하나라도 바뀌면 requirements.json 을 다시 만들어야 한다 */
export const SOURCE_FILES = [
  'docs/spec/da-feature-spec/20-priority.md',
  'docs/ux/02-flows.md',
  'docs/spec/da-feature-spec/30-metadata-design.md',
  'docs/ux/29-rbac-r2.md',
  'docs/ux/review/resolution-rbac-r2.md',
  'docs/ux/review/claude-r2rbac-agree.md',
  'docs/arch/01-backend-architecture-v1.md',
  'docs/impl/01-task-list.md',
  'docs/impl/screen-manifest.json',
  'docs/impl/trace/assign.json',
];
export const BEHAVIOR_DIR = 'docs/impl/trace/behaviors';

export function inputFiles() {
  const files = SOURCE_FILES.filter((p) => existsSync(join(root, p)));
  if (existsSync(join(root, BEHAVIOR_DIR))) {
    for (const n of readdirSync(join(root, BEHAVIOR_DIR)).filter((x) => x.endsWith('.json')).sort()) files.push(`${BEHAVIOR_DIR}/${n}`);
  }
  return files;
}

/** 입력 지문 — 줄바꿈 차이(CRLF/LF)는 무시 */
export function inputsHash() {
  const h = createHash('sha256');
  for (const f of inputFiles()) { h.update(f); h.update('\0'); h.update(rd(f).replace(/\r\n/g, '\n')); h.update('\0'); }
  return h.digest('hex');
}

/** 01-task-list 작업 표의 ID 칸에 있는 작업 ID만 (설명 문장에만 나오는 ID는 작업이 아니다) */
export function taskIds() {
  const ids = new Set();
  const lines = rd('docs/impl/01-task-list.md').split(/\r?\n/);
  let idCol = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('|')) { idCol = -1; continue; }
    const cells = line.split('|').map((c) => c.trim());
    // 표 머리(다음 줄이 |---|) — 'ID' 열 위치를 기억
    if (/^\|\s*:?-{2,}/.test(lines[i + 1] ?? '')) { idCol = cells.indexOf('ID'); continue; }
    if (/^\|\s*:?-{2,}/.test(line) || idCol < 0) continue;
    const id = cells[idCol];
    if (/^T-P\d-\d+[a-z]?$/.test(id ?? '')) ids.add(id);
  }
  return ids;
}

/** 사람 결정의 상태 — progress.md '확인 필요'의 Q-n 응답 칸 · decisions/D-nnn 의 '응답:' 줄 · 계획 절 참조 */
export function decisionStatus(decision) {
  if (!decision) return 'none';
  if (/^계획 §/.test(decision)) return 'approved';
  const q = decision.match(/^Q-\d+$/);
  if (q) {
    const line = rd('docs/impl/progress.md').split(/\r?\n/).find((l) => l.startsWith('|') && l.includes(decision));
    if (!line) return 'missing';
    const cells = line.split('|').map((c) => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1);
    const answer = (cells[cells.length - 1] ?? '').trim();
    return isApproval(answer) ? 'approved' : 'pending';
  }
  const d = decision.match(/^D-\d{3}$/);
  if (d) {
    const dir = join(root, 'docs/impl/decisions');
    const f = existsSync(dir) ? readdirSync(dir).find((n) => n.startsWith(`${decision}-`)) : null;
    if (!f) return 'missing';
    const ans = (rd(`docs/impl/decisions/${f}`).match(/-\s*응답:\s*(.+)$/m)?.[1] ?? '').trim();
    return isApproval(ans) ? 'approved' : 'pending';
  }
  return 'missing';
}

/** 사람 응답이 승인인가 — '확인' · '승인' · '제외'로 시작하고 대기 · 미확인 · 보류 · 뒤집기 · 방향 제시가 없을 때만 */
export function isApproval(answer) {
  if (!/^(확인|승인|제외)/.test(answer)) return false;
  return !/대기|미확인|보류|뒤집|방향 제시|\(확인 · 뒤집기/.test(answer);
}
