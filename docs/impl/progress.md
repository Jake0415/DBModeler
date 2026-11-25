# NeoDB 구현 진행 기록

> 조정자가 갱신한다. 규칙: [00-orchestration-plan.md](00-orchestration-plan.md). 오케스트레이션이 멈추면 이 파일에서 이어 간다.

## 확인 필요 (사람)
> 자체 결정 · 보류 건. 응답: **확인**(그대로) · **뒤집기**(새 작업) · **방향 제시**(의견을 적으면 새 작업, 회차 0부터).

| 결정 | 작업 | 결정 종류 | W1 경로 막음 | 상태 | 응답 |
|---|---|---|---|---|---|
| [01-task-list §6 Q-1](01-task-list.md) | DDL 가져오기(SC-36) W1/W2 | 문서 충돌 — 우선순위 20 §2.0(W1) ↔ 백엔드 설계 §13.9(W2). 지금은 P5(W2) | 아니오(엑셀 정의서 경로로 W1 완주 가능) | 확인됨 | 확인 — W2(P5) 유지 (사용자 2026-11-25) |
| [01-task-list §6 Q-2](01-task-list.md) | W3 요구 3개(PH-R06 · RV-R04 · RV-R05) | 계획 밖 — 추적표에서 제외(사유 기록) | 아니오 | 확인됨 | 제외 확정 — 이번 계획에서 만들지 않음 (사용자 2026-11-25) |
| [고객 모델 요청 M-1 ~ M-9](../ux/review/model-requests/01-summary.md) | 중복 속성 해소 · 엑셀 최소 검증 · ‘추가만’ · PK 삭제 · 모델 검증 · 승인본 DDL · 표기 · 우선순위(LG-R07 · LG-R05 → W1) | 목업 동작 변경 + 26 §6-1 · 6-2 결정 변경 + 우선순위 변경 | 아니오 | 확인됨 | 확인 — 9개 모두 권장안대로, 목업 반영 지시 (사용자 2026-11-25) |

## 현재 단계
- 단계: **P0 준비**
- 실행 중: —
- 사용량: —

## 연쇄 실패 지표
| 지표 | 값 | 기준 |
|---|---|---|
| 묶음별 보류 · 자체 결정 | — | 3건 이상이면 묶음 중지 |
| 같은 원인 보류 | — | 2건 이상이면 원인 작업 먼저 |
| 전체 보류 비율 | — | 20% 초과면 전체 중지 |

## 작업
| ID | 제목 | 단계 · 묶음 | 담당 | 난이도 | 상태 | 회차(수정) | 모델 | 결과 · 링크 |
|---|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | — | — |

상태: 준비됨 · 계약 · 구현 · 리뷰 · 수정 · E2E · 병합됨 · 보류 · 대기(의존)

## 모델 · CLI 최신 확인 (2026-11-25 13:15)
- 모델은 모두 최신: **Opus 5.5**(2026-09-22) · **Fable 5.2**(2026-11-09) · **GPT-6.2 Sol · Astra**(2026-11-17). Orca Codex 모델 목록(더 보기 포함)에도 6.2보다 새 모델 없음
- Claude Code CLI 2.1.331 → **2.1.332**(오늘 배포, 공식 win32 실행 파일 · Anthropic 서명) — Opus 5.5 · Fable 5.2 호출 · 실행 뒤 파일 유지 확인. Codex 0.172.0 = 최신
- 새 모델이 나오면: 계획 §3.2 표 · coordinator §4 표 · AGENTS.md/CLAUDE.md 모델 표 · `.codex/config.toml` · Orca 기본 모델을 함께 바꾼다(사용자 승인 뒤)

## Orca 실행 준비 (2026-11-25)
- [x] 역할 지시서 — [roles/](roles/): 공통 규칙 `_common.md` · 지시서 양식 `_spec-template.md` · 역할 10개(조정자 · 계약 · BE · FE · 공동 편집 · UX · 역할 시나리오 QA · 리뷰어 · QA · 권한 감사관), 조정자 시작 프롬프트 [coordinator-kickoff.md](coordinator-kickoff.md), 실행 안내 [02-orca-runbook.md](02-orca-runbook.md)
- 주요 결정: 리뷰어는 `codex -s read-only -a never …` 읽기 전용 터미널, 의존 = 계약은 main 병합 뒤 · 검증은 리뷰 통과 뒤, BE · FE 묶음은 통합 worktree에서 QA → 시나리오 → 권한 감사 차례로, 수정은 같은 worktree에 새 수정 Task(모델 상향), worktree 정리는 `orca worktree rm --run-hooks --delete-branch`(예비: `worktree-env.ps1 -Prune -Target <절대 경로>`), 브랜치는 Orca 기본 이름 기록, T-P1-02 → 02b(BE) → 02c, T-P1-01에 lint
- 실측: Orca 새 worktree 준비(node_modules 공유 · DB · 시험 계정) 성공, `--run-hooks` 정리 성공, `--run-hooks` 없으면 DB 남음
- 리뷰: Codex Sol 4회(REV-01 ~ 24, 수정 4회, 기각 2: REV-02 실측 근거 · REV-16 UX 모델은 계획 §3.2)

## 요구사항 추적 · 완전성 검사 (2026-11-25)
- 목적: 모든 기능이 빠짐없이 구현 · 동작 확인되는지 자동 판정 — 규칙 [계획 §15](00-orchestration-plan.md), 데이터 [trace/](trace/)
- 추적표 `trace/requirements.json` **2,505행**: 요구(REQ 45 · UIR 9) · 화면(UI 45) · 메타(META 49) · 권한(RBAC 35) · 구조(ARCH 9) · 시나리오(SCN 17) · 목업 상태(MS 70) · 화면 동작(BH 2,226, 목업 27개 화면 전수 — [behaviors/](trace/behaviors/))
- 명령: `npm run trace:extract`(추적표 생성) → `npm run trace:test`(커밋된 깨끗한 트리에서 vitest · Playwright 실행, `.trace/runs/<시각>/`) → `npm run trace:check -- --gate start|end --phase Pn [--report]`
- 판정: 테스트 이름의 `[ID]` 태그 + 실행 결과(그 ID를 태그한 파일에서 통과, 화면 행은 e2e, 목업 상태 행은 역할별 통과). 건너뜀 · fixme · 예상 실패는 불인정. 제외는 사람 결정(Q-n · D-nnn 응답 = 확인) 있을 때만
- 관문: 묶음 시작 = 모든 행에 단계 · 실제 작업 ID, 묶음 끝 = 범위 행 전부 통과 + 실행이 HEAD · 깨끗한 트리 · 입력 지문 일치 · 실행 중 파일 변경 없음
- 현재: 테스트 없음 2,466 · 제외 39(W3 3개는 Q-2 제외 확정). P1 · P2 시작 관문 통과
- 리뷰: Codex Sol 4회(TR-01 ~ 14), 수정 5회(상한) — 모두 해결, 남은 한계는 후속 F-005 · F-006
- 목업 점검에서 나온 UX 판단 필요 항목: [trace/mockup-findings.md](trace/mockup-findings.md)(F-01 ~ 43 — 특히 F-26 · F-39 · F-40은 목업 ↔ 권한표 충돌, 사람 확인)

## 고객 모델 요청 반영 (2026-11-25 ~ 26)
- 요청 · 리뷰 · 결정 · 반영 결과: [docs/ux/review/model-requests/01-summary.md](../ux/review/model-requests/01-summary.md) (M-1 ~ M-9 확인, 수정 4회, 후속 F-007 ~ F-014)
- 영향: 우선순위 LG-R07 · LG-R05(키 표시) W2 → W1, 작업 T-P2-302 · 402 · 406 · 602 · 603 · 703 범위 보강, 설계 §5.5(공식 DDL = 확정 스냅샷) · §13.1(모델 불변식), 추적표 2,563행(P1 · P2 시작 관문 통과)
- **P1 시작 전**: 목업이 바뀌었으니 기준 스크린샷을 다시 만든다(`node scripts/mockup-baseline.mjs --shots`)

## P0 준비 점검표
- [x] Orca 에이전트 권한 — 2026-11-25 설정: **Codex = ‘대신 승인’**(`--approve-for-me` = workspace-write 샌드박스 + 승인 자동 검토, 리뷰어는 지시로 읽기 전용 · QA/권한 감사관은 `e2e/`만 씀) + 인수 `-c windows.sandbox=unelevated`(관리자 샌드박스 팝업 방지) · 실행 확인. **Claude = 전체 액세스 유지**(구현 에이전트, worktree 안에서 작업) · 기본 모델 Opus 4.8 → **Opus 5.5**
- [x] Orca 오케스트레이션 · CLI 켜기, `orca status --json`, 스킬 설치 — 앱 1.4.274 · 런타임 ready · `orca` 사용자 PATH 등록(새 셸부터) · `orchestration worker-list` 응답 · Claude 상태 훅 설치됨 · 스킬 orca-cli · orchestration 사용 가능
- [x] Codex 감지 — Orca가 설치한 Codex 0.172.0, 기본 에이전트, 모델 GPT-6.2-Sol · medium. `orca agent launch --agent codex` 실행 · 응답 확인
- [x] Orca 저장소 설정(DBModeler › 작업트리 후크) — 설정 스크립트 `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/worktree-env.ps1 -Seed -TestAccounts`(기존 `npm install` 대체), 아카이브 스크립트 `… worktree-env.ps1 -Drop`, **에이전트는 설정 완료 뒤 시작**(`wait-for-setup`), 기준 참조 `origin/main`, worktree 위치 `C:\Users\ysh\orca\workspaces`
- [x] Heartbeat — Orca 1.4.274 설정 화면에 항목 없음(오케스트레이션 화면: **하위 에이전트 최대 단계 10 → 1**(조정자만 작업 에이전트를 띄움, 2026-11-25 변경) · 완료된 워커 자동 닫기 · 코디네이터가 워커 권한 요청 승인 허용). 조정자가 `check --wait`로 기다리므로 영향 적음
- [x] Claude Code CLI(`Documents\Codex\Tools\ClaudeCode`) **2.1.331** — 공식 npm 패키지 `@anthropic-ai/claude-code-win32-x64@2.1.331`(무결성 검증 · Anthropic 서명 유효)의 실행 파일을 `bin\claude.exe`에 넣음. 실행 중인 docuCBD 빈 세션(PID 21180)은 건드리지 않음. 원인: 낡은 버전으로 시작할 때 자동 업데이트가 실행 파일을 `.old.<시각>`으로 바꾸고 새 버전 설치에 실패해 실행 파일이 사라짐(12:14 · 12:21 시험 실행과 일치). 최신 버전이라 다시 실행해도 유지됨을 확인. Orca 실행: ‘Claude Code v2.1.331 · Fable 5.2 with high effort’ 응답
- [x] Orca 실행 인자 확인 — `orca agent launch --agent claude --model claude-opus-5-5 --effort max` → Claude Code가 ‘Opus 5.5 with max effort’로 실행 · 응답(모델 · effort 그대로 전달)
- [x] Orca 브라우저 — 같은 프로필의 탭끼리 쿠키 · localStorage 공유(역할 동시 로그인 불가), **브라우저 프로필을 나누면 완전히 분리**(임시 프로필로 확인 후 삭제) → 역할별 화면 확인은 역할마다 프로필(`orca tab profile create` · `tab create --profile`)
- [x] Codex CLI ≥ 0.171.0 + Windows 샌드박스 셔임 재적용 + DBModeler 신뢰 등록 — 2026-11-25: 0.172.0, 셔임 재적용, 신뢰 등록. Claude Code 2.1.290 → 2.1.331(Fable 5.2 인식)
- [x] 모델 확인(계획 §3.3) — 2026-11-25: `gpt-6.2-sol` · `gpt-6.2-astra` · `claude-opus-5-5` · `claude-fable-5-2` 모두 경고 없이 응답, Codex 프로젝트 기본값 Sol · medium 적용 확인
- [x] 미커밋 목업 · 검토 문서 커밋 — 이미 커밋돼 있음(남은 것: `NeoDB-mockups-20261120.zip`·폴더, 빈 `model.html` — 사용자 판단)
- [x] worktree 준비 스크립트(DB 이름 · API 포트) — `scripts/worktree-env.ps1`, Codex Sol 리뷰 4회(수정 3회 + 후속 2건 반영, 기각 1건: `-Drop` 뒤 기록 저장 실패 시 기록 잔존 — 다음 실행이 DB를 다시 만들 뿐 해가 없음)
- [x] 시험 계정 시드 · DB 초기화 — `npm run db:seed:test` · `scripts/worktree-env.ps1 -Reset -Seed -TestAccounts`, 13개 계정(계획 §9.1). API 로그인 확인: 정상 4 · 임시 비밀번호 변경 요구(tdatmp) · 기한 만료(texp) · 사용 중지(tstop) 401 + 이유. Codex Sol 리뷰 3회(R-01~07: 수정 2회, 후속 F-001 · F-002, 기각 1건 — 빈 `?`/`#` 주소는 접속지가 같아 해 없음)
- [ ] 역할별 로그인 상태 저장 틀(Playwright storageState) — web · E2E 틀이 생기는 P1로 이동. 시나리오별 빠른 초기화(시드가 끝난 DB를 TEMPLATE으로 복제)도 P1 E2E 틀에서
- [x] PERMS → 권한 검사 표 생성기 — `packages/rules/src/matrix.ts`(권한 판정 637칸 + 결재 행위 6사례), 기준 파일 [rbac-matrix.md](rbac-matrix.md) · `e2e/rbac/perm-matrix.json`, 갱신 `npm run rbac:matrix`(사람 승인 뒤). 시험 계정 정의를 `@neodb/domain` TEST_ACCOUNTS로 옮겨 시드와 같이 씀. 문서 기대값 테스트 22개. Codex Sol 리뷰 3회(RBAC-01~07: 수정 2회, 보류 → 후속 F-003 감리 감사 로그 범위)
- [x] 작업 목록(기능 → 목업 → API → 테스트 대응표) — [01-task-list.md](01-task-list.md) v1.1: 화면 26개 대응표 · 다중 계정 시나리오 17개 · P1 작업 15개 · P2 묶음 7개(작업 35개, 의존 열) · P3 ~ P6 묶음. Codex Sol 리뷰 2회(REV-01 ~ 15 반영, Q-1 사람 확인)
- [x] 목업 기준 스크린샷 — `node scripts/mockup-baseline.mjs --shots`: 화면 목록 [screen-manifest.json](screen-manifest.json)(26개 · 상태 70개) + 상태별 · 목업 사용자 5명별 1920×1080, `e2e/baseline/mockups/`(저장소 제외, 목업에서 다시 만듦). 후속 F-004
- [x] Orca 브라우저 탭 쿠키 공유 여부, `--effort max` 전달 여부 확인 — 위 두 항목
