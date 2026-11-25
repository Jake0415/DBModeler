// 권한 검사 표 기준 파일 갱신 — docs/impl/00-orchestration-plan.md §9.3
// 권한표 변경이므로 사람 승인(결정 게이트) 뒤에만 실행한다. 결과(e2e/rbac/perm-matrix.json · docs/impl/rbac-matrix.md)의 차이를 함께 확인한다.
import { spawnSync } from 'node:child_process';

const r = spawnSync('npx', ['vitest', 'run', 'packages/rules/test/matrix.test.ts', '-u'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, RBAC_MATRIX_UPDATE: '1' },
});
process.exit(r.status ?? 1);
