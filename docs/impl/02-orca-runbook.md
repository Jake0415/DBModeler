# Orca 실행 안내 (Runbook)

> 2026-11-25 · 규칙: [00-orchestration-plan.md](00-orchestration-plan.md) · 작업: [01-task-list.md](01-task-list.md) · 진행: [progress.md](progress.md)

## 1. 구조
- Orca에는 역할별 에이전트를 미리 등록하는 기능이 없다. 등록된 것은 **에이전트 종류**(Claude · Codex)뿐이고, **역할은 작업 지시서(spec)**로 정한다.
- 사람은 **조정자 하나**만 띄운다. 조정자가 작업마다 `orca orchestration worker-start`로 작업 에이전트를 띄우고(역할 지시서 + 모델 · effort), `worker_done` 보고를 받아 판정 · 병합한다. 작업 에이전트는 다른 에이전트를 띄우지 않는다(하위 에이전트 단계 = 1).

| 역할 | 지시서 | 에이전트 |
|---|---|---|
| 조정자 | [roles/coordinator.md](roles/coordinator.md) | Claude Opus 5.5 · high |
| 계약 담당 | [roles/contract.md](roles/contract.md) | Claude |
| BE 개발자 | [roles/be.md](roles/be.md) | Claude |
| FE 개발자 | [roles/fe.md](roles/fe.md) | Claude |
| 공동 편집 담당 | [roles/collab.md](roles/collab.md) | Claude Fable 5.2 · xhigh |
| UX 담당 | [roles/ux.md](roles/ux.md) | Claude |
| 역할 시나리오 QA | [roles/scenario-qa.md](roles/scenario-qa.md) | Claude |
| 리뷰어 | [roles/reviewer.md](roles/reviewer.md) | Codex — **읽기 전용 터미널**(`codex -s read-only -a never …`, 조정자가 띄움) |
| QA | [roles/qa.md](roles/qa.md) | Codex |
| 권한 감사관 | [roles/rbac-auditor.md](roles/rbac-auditor.md) | Codex |

- 공통 규칙: [roles/_common.md](roles/_common.md) · 작업 지시서 양식: [roles/_spec-template.md](roles/_spec-template.md)
- 모델 · effort는 난이도에 따라 조정자가 매번 지정한다(계획 §3 · coordinator §4).

## 2. 처음 한 번 (설정 — 2026-11-25 완료)
| 항목 | 값 |
|---|---|
| Orca 에이전트 | Claude(기본 모델 Opus 5.5, 권한 전체 액세스) · Codex(기본, GPT-6.2-Sol, 권한 ‘대신 승인’, 인수 `-c windows.sandbox=unelevated`) |
| 오케스트레이션 | 켜짐 · 스킬 설치됨 · 하위 에이전트 최대 단계 1 |
| DBModeler 저장소 | 설정 스크립트 `worktree-env.ps1 -Seed -TestAccounts` · 아카이브 스크립트 `worktree-env.ps1 -Drop` · 설정 완료 뒤 에이전트 시작 · 기준 `origin/main` |
| CLI | Claude Code 2.1.332 · Codex 0.172.0 · `orca` 사용자 PATH |

## 3. 실행할 때마다
0. **지시서가 main에 커밋 · push됐는지**: 새 worktree는 `origin/main`에서 만들어진다. `docs/impl/*`를 고쳤으면 먼저 커밋 · push(조정자도 시작할 때 확인한다).
1. **개발 DB 컨테이너**: main 체크아웃(`D:\project\DBModeler`)에서 `npm run db:up` (Docker Desktop 실행 중이어야 함). worktree에서는 실행하지 않는다.
2. **Orca**에서 DBModeler **기본 워크스페이스(main)**를 연다.
3. **새 에이전트 → Claude(CLI)**, 모델 **Opus 5.5**, effort **high**로 띄운다.
4. [coordinator-kickoff.md](coordinator-kickoff.md)의 프롬프트를 붙여 넣는다(‘이번 실행 목표’만 바꿈).
5. 조정자가 시작 전 확인(모델 · 버전 · DB · 사용량)을 보고하고 Run을 만든 뒤 작업 에이전트들을 띄운다. 사이드바에 작업별 worktree가 생긴다.

## 3-1. 빠짐없이 — 요구사항 추적 (계획 §15)
- 모든 기능 행(요구 · 화면 · 메타 규칙 · RBAC · 시나리오 · 목업 상태 · 화면 동작)이 `docs/impl/trace/requirements.json`에 있고, 테스트 이름의 `[ID]`로 연결된다.
- 조정자는 **단계 시작**에 `npm run trace:check -- --phase Pn --gate start`(전부 배정), **단계 끝**에 `npm run trace:test` → `npm run trace:check -- --phase Pn --gate end --report`(전부 통과)를 통과해야 넘어간다.
- 현황: `docs/impl/trace/coverage.md`(단계 끝마다 갱신).

## 4. 사람이 보는 것
- **[progress.md](progress.md) 맨 위 ‘확인 필요’** — 자체 결정 · 보류. ‘응답’ 칸에 확인 / 뒤집기 / 방향 제시를 적고 조정자에게 “확인 필요 응답 반영하고 계속해”.
- Orca 알림(작업 끝 · 입력 필요) · 사용량 표시(80%면 조정자가 새 배정을 멈춘다).
- 작업 worktree의 브라우저로 화면을 직접 볼 수 있다. 역할별로 볼 때는 역할마다 브라우저 프로필.

## 5. 멈추기 · 이어 가기
- 멈추기: 조정자에게 “새 배정 멈추고 진행 중인 것만 마무리해”. 급하면 Orca에서 작업 worktree를 Sleep.
- 이어 가기: Orca를 다시 켜면 조정자 프롬프트를 다시 붙여 넣는다(목표만 바꿈). 조정자는 progress.md에서 이어 간다.
- 작업 worktree는 `orca worktree rm --worktree <선택자> --run-hooks --delete-branch`로 지운다. **`--run-hooks`가 있어야 아카이브 스크립트가 전용 DB를 지운다**(없으면 건너뜀 — 2026-11-25 확인). 이미 그냥 지웠다면 main에서 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/worktree-env.ps1 -Prune -Target <지운 worktree 경로>`로 그 하나만 정리한다. 보류 작업의 worktree는 지우지 않는다.

## 6. 직접 한 역할만 시험할 때 (조정자 없이)
```powershell
orca worktree create --name try-be --no-parent --agent claude --model claude-opus-5-5 --effort high --prompt "docs/impl/roles/_common.md 와 docs/impl/roles/be.md 를 따른다. 작업: <내용>"
```
보고 · 회차 · 병합은 사람이 직접 관리해야 한다.

## 7. 문제 해결
| 증상 | 확인 · 조치 |
|---|---|
| Claude 실행 시 “claude.exe를 찾을 수 없음” | `Documents\Codex\Tools\ClaudeCode\node_modules\@anthropic-ai\claude-code\bin`에 `claude.exe`가 없고 `.old.*`만 있으면 낡은 버전의 자동 업데이트 실패. 공식 `@anthropic-ai/claude-code-win32-x64` 최신 실행 파일을 넣는다(progress.md 기록 참고) |
| Codex 실행 때 관리자 권한 팝업 | Orca Codex 인수에 `-c windows.sandbox=unelevated`가 있는지 확인 |
| worktree 준비 실패 | 개발 DB 컨테이너가 꺼짐 → main에서 `npm run db:up`. 같은 이름 DB가 기록 없이 남아 있으면 그 worktree에서 `worktree-env.ps1 -Adopt` |
| `orca` 명령을 못 찾음 | 새 터미널을 연다(PATH는 새 셸부터) |
| 지운 worktree의 DB가 남음 | main에서 `worktree-env.ps1 -Prune -Target <그 worktree 경로>`(지정한 하나만, 폴더가 이미 없을 때만) |
| 보고 · 답장이 거부됨 | Windows에서는 `orca.exe orchestration send/reply`(`orca.cmd`는 거부) |

## 8. 확인된 동작 (2026-11-25)
- `orca worktree create --setup run`으로 만든 새 worktree: `node_modules`가 main과 접합 지점으로 공유, `.env` 복사, 설정 스크립트가 전용 DB 생성 · 마이그레이션 · 관리자 · 시험 계정 13개까지 성공.
- `orca agent launch`가 `--model` · `--effort`를 그대로 넘김(Claude Opus 5.5 max · Fable 5.2 high, Codex GPT-6.2-Sol 확인).
- 같은 브라우저 프로필의 탭은 쿠키 · 저장소를 공유, 프로필을 나누면 분리.
- `orca worktree rm --run-hooks --delete-branch`: 아카이브 스크립트가 돌아 전용 DB · 배정 기록 · 브랜치 · 폴더가 모두 정리됨. `--run-hooks` 없이 지우면 아카이브 스크립트가 돌지 않아 DB가 남음.
