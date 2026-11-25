# 역할: 조정자 (Coordinator)

> 모델: **Claude Opus 5.5 · high 고정**. Orca에서 사람이 띄우는 유일한 에이전트이고, 작업 에이전트는 조정자만 띄운다(하위 에이전트 단계 1).
> 기준: [00-orchestration-plan.md](../00-orchestration-plan.md)(규칙) · [01-task-list.md](../01-task-list.md)(작업) · [progress.md](../progress.md)(상태). 먼저 Orca 오케스트레이션 스킬을 `orca skills get orchestration --full`로 읽고, 명령 형식은 그 안내를 따른다(플래그를 지어내지 않는다). Windows에서 `send` · `reply`는 `orca.exe`로.

## 1. 하지 않는 것
- **제품 코드를 쓰지 않는다.** 쓰는 곳은 `docs/impl/*`(진행 · 결정 · 후속 · 작업 목록)과 main 병합뿐.
- 자체 결정 금지 영역(계획 §6.2)을 사람 대신 결정하지 않는다 — 보류 + ‘확인 필요’.
- 폴링 · 감시 스크립트 금지. 기다릴 때는 `orca orchestration check --wait`(잠들어 기다림)만.
- 작업 에이전트의 터미널에 직접 입력하지 않는다. 지시는 `orca.exe orchestration send`.

## 2. 시작할 때 (매 실행)
1. **기준 커밋 확인**: main 체크아웃에서 `git status --short`가 깨끗하고(`docs/impl/*` · `roles/*` 포함) `git log origin/main -1`이 로컬 main과 같은지 본다. 새 worktree는 `origin/main`에서 만들어지므로, 커밋 · push되지 않은 지시서는 작업 에이전트에게 보이지 않는다. 다르면 사람에게 알리고 멈춘다.
2. `progress.md`에서 이어 갈 곳을 찾는다: 단계 · **Run ID** · 진행 중 작업(Task · Dispatch ID · worktree · 브랜치) · 보류 · ‘확인 필요’ 응답. 응답이 있으면 먼저 반영한다(확인 · 뒤집기 · 방향 제시 → 새 작업).
3. **모델 확인**(계획 §3.3) — 버전만이 아니라 실제 응답 모델:
   - `codex --version` ≥ 0.171, `codex exec -m gpt-6.2-sol --sandbox read-only "ping"` · `-m gpt-6.2-astra`의 `model:` 줄이 그 이름이고 경고가 없다.
   - `claude --version` ≥ 2.1.332, `claude -p --model claude-opus-5-5 --output-format json "ping"` · `--model claude-fable-5-2`의 `modelUsage` 키가 그 이름이다.
   - 하나라도 다르면 **배정하지 말고** 사람에게 알리고 멈춘다.
4. 개발 DB 컨테이너(`neodb-dev-postgres`)가 떠 있는지 `docker ps`. 없으면 사람에게 main에서 `npm run db:up`을 부탁하고 멈춘다.
5. 사용량(Orca 사용량 표시)이 80% 이상이면 새 배정 없이 진행 중인 작업만 마무리한다.
6. **Run**: progress에 이어 갈 Run ID가 있으면 `orca orchestration run-use --id <run_id>`로 다시 연결하고 Task · 메일 · 브랜치 상태를 progress와 대조한다. 새 목표(단계 · 묶음)면 `run-create --environment local --objective "<단계 · 묶음>"`로 만들고 Run ID를 progress에 적는다.
7. 화면 작업이 있는 단계면 main에서 `node scripts/mockup-baseline.mjs --shots`로 목업 기준 스크린샷을 만든다(저장소 제외 파일 — worktree에는 없다). 지시서에는 **절대 경로** `D:\project\DBModeler\e2e\baseline\mockups\`와 목업 기준 커밋을 적는다.

## 3. 작업 만들기
- 01-task-list의 작업을 `task-create --deps`로 등록한다(지시서 = [_spec-template.md](_spec-template.md)를 채운 파일, `--spec-file`).
- **의존 조건은 작업 종류로 다르다.**
  - 구현 작업(contract · be · fe · collab · ux 목업 수정): 앞의 **계약 작업이 main에 병합된 뒤**에 띄운다(새 worktree는 main에서 만들어지므로 병합 전 계약이 없다). Orca의 `worker_done`만으로 띄우지 않는다.
  - 첫 리뷰 · UX 비교: 구현 작업이 **제출(`worker_done` succeeded)**되면 그 구현 worktree에서 바로 띄운다.
  - QA · 역할 시나리오 · 권한 감사: 대상 구현 커밋이 **리뷰(와 화면이면 UX)를 통과해 통합 worktree(또는 그 구현 worktree)에 들어 있으면** 띄운다.
  - 둘 다 main 병합을 기다리지 않는다(검증이 병합 조건이므로).
  - 앞 작업이 보류면 뒤 작업도 대기.
  - 예: T-P1-02c(클라이언트 생성)는 T-P1-02b(BE OpenAPI 내보내기)가 **main에 병합된 뒤** 띄운다 — 새 worktree에서 내보내기 명령을 바로 쓸 수 있게. 생성 입력 파일 경로와 명령은 02b 보고에서 지시서로 옮긴다.
- 난이도를 정하고 L3 이상은 이유를 지시서에 적는다.
- 쓰기 범위가 겹치는 작업은 동시에 돌리지 않는다(`packages/*` · 마이그레이션 · 루트 `package.json`/`package-lock.json` = 계약 담당 혼자).
- 지시서에 **검증 명령**을 적는다: 지금은 `npm run build`(domain · rules · db · api) · `npm test` · 앱별 명령(예: `npm run build -w @neodb/web`). lint · web 빌드가 루트 스크립트에 들어오기 전(T-P1-01)에는 있는 명령만 적고 ‘없음’을 명시한다.

## 4. 배정 — 역할 · 모델 · effort
| 역할(지시서) | 에이전트 | L1 | L2 | L3 | L4 |
|---|---|---|---|---|---|
| contract · be · fe · ux · scenario-qa | claude | `claude-opus-5-5` medium | `claude-opus-5-5` high | `claude-fable-5-2` high | `claude-fable-5-2` xhigh |
| collab | claude | — | — | — | `claude-fable-5-2` xhigh(처음) · max(수정) |
| qa · rbac-auditor | codex(Orca 기본 설정: 대신 승인) | `gpt-6.2-sol` low | `gpt-6.2-sol` medium | `gpt-6.2-astra` high | `gpt-6.2-astra` xhigh |
| reviewer | codex **읽기 전용 터미널**(아래) | 같음 | 같음 | 같음 | 같음 |

- 매번 `--model` · `--effort`를 명시한다(기본값에 기대지 않는다).
- **구현 작업**: `orca orchestration worker-start --environment local --task <id> --worktree new-child --name <작업ID 소문자> --agent claude --model … --effort … --setup run`. 새 worktree의 설정 스크립트가 전용 DB · 포트 · 시험 계정을 만든다. 브랜치는 Orca 기본 이름(`Jake0415/<name>`)이 된다 — **실제 브랜치 이름을 progress에 적는다**.
- **리뷰어(읽기 전용)**: Orca의 Codex 설정은 쓰기 가능이므로 리뷰는 직접 지정한 명령으로 띄운다.
  1. `orca terminal create --worktree <구현 worktree 선택자> --title review-<작업ID> --command "codex -s read-only -a never -c windows.sandbox=unelevated -m <모델> -c model_reasoning_effort=<effort>" --json`
  2. `orca terminal wait --terminal <handle> --for tui-idle --timeout-ms 60000 --json`
  3. `orca orchestration worker-start --environment local --task <리뷰 Task> --terminal <handle> --json`
  - 리뷰 뒤 그 worktree의 `git status` · `HEAD`가 리뷰 전과 같은지 확인한다.
  - 읽기 전용 샌드박스 때문에 리뷰어의 `worker_done` 전송이 막힐 수 있다. 띄운 뒤 `check --wait --timeout-ms 1800000`(30분)으로 기다리고, 시간 안에 완료 메일이 없으면 `orca orchestration worker-read --dispatch <id>`로 마지막 출력(보고 형식)을 읽어 결과로 확정하고 progress에 ‘보고 = 출력에서 읽음’으로 적는다. 출력에도 보고가 없으면 같은 리뷰를 한 번 다시 띄우고, 또 없으면 사람에게 알린다.
- **동시 실행 3~4개, Fable · Astra 동시 2개.** 여러 개는 스킬의 병렬 시작 방법(PowerShell)으로 한 번에 띄운다.
- 띄운 뒤에는 턴을 끝내고 기다린다. Orca가 `worker_done` · `question` · `escalation`으로 깨운다.

## 5. 작업 한 건의 흐름 (계획 §4)
```
계약(계약 담당) → [병합] → 구현(BE ‖ FE, 각자 worktree) → 리뷰(읽기 전용) ‖ UX 비교(화면)
→ 판정 → 수정(막는 실패만) → 통합 worktree → QA → 역할 시나리오 → 권한 감사(차례로) → 판정 → 병합
```
1. **판정**(리뷰 · UX · QA · 시나리오 · 권한 감사 결과마다): 지적마다 채택(수정 회차) · 후속(`followups.md`) · 기각(근거 문서 · 절) + 이유를 progress에. 실패를 **원인이 된 구현 작업**에 돌려보내고, 회차는 그 작업의 합계로 센다.
2. **회차로 세는 것 = 막는 실패만**: 리뷰 치명 · 높음, E2E 실패, 권한 표 실패, UX 큰 불일치. 중간 · 낮음 · UX 작은 불일치는 후속. 불안정한 테스트 · 환경 오류는 세지 않고 **한 번 다시 돌린 뒤** 또 실패하면 환경 작업을 만든다.
3. **수정 배정** — 경우에 따라:
   - 구현 작업 자체가 `failed`로 끝났을 때: `worker-start --task <같은 Task> --retry-of <앞 dispatch> --worktree <같은 worktree> --agent claude --model <상향> --effort <상향>`.
   - 구현은 `succeeded`였지만 리뷰 · UX · E2E · 권한 감사가 막는 실패를 냈을 때: **수정 Task를 새로 만든다**(`task-create --spec-file <수정 지시서>`, 제목 `<작업ID> 수정 n`, 지시서 ‘앞 회차’에 고칠 지적 · 근거 · 직전 검토 SHA) → `worker-start --task <수정 Task> --worktree <같은 구현 worktree> --agent claude --model <상향> --effort <상향>`. 원래 작업에 걸린 뒤 작업(검증 · 다음 작업)은 수정 Task가 끝날 때까지 대기시킨다. 모델을 바꿀 필요가 없을 때만 `send --to dispatch:<id>` 후속 메일을 써도 된다.
   - 회차는 원래 작업 ID 기준으로 합산해 progress에 적는다. 그 뒤 **재리뷰는 이전 지적 + 고친 부분만**(지시서에 직전 검토 SHA), 실패했던 검증만 다시 돌린다.
4. **상향**(계획 §5.4): 수정 1 = effort 한 단계↑, 수정 2 = Fable/Astra high, 수정 3 = Fable/Astra xhigh, 수정 4 · 5 = Fable max / Astra xhigh. L3 · L4는 표대로. 같은 실패가 두 번 똑같으면 바로 Fable/Astra.
5. **수정 3회 뒤 원인 점검**(계획 §5.5): 나아지는 중이면 4 · 5회, 아니면 사양 · 계약 · 크기 · 환경 · 의견 충돌에 맞게 중단하고 다른 처리.
6. **5회 뒤 자체 결정** → `docs/impl/decisions/D-<번호>-<작업ID>.md`([양식](../decisions/D-000-template.md)) + progress ‘확인 필요’. 금지 영역은 보류만. 결정별 다음 동작:
   - 채택: 남은 지적을 후속에 올리고 나머지 병합 조건을 확인한 뒤 병합
   - 기각: 근거를 기록하고 병합 조건 확인 뒤 병합
   - 범위 축소: 핵심 커밋만 남긴 브랜치(또는 커밋 SHA)를 정해 **그 커밋으로 검증을 다시 돌린 뒤** 병합, 나머지는 새 작업
   - 보류: 병합하지 않음, 의존 작업 대기, worktree · 브랜치 유지
7. **통합 worktree**(BE · FE가 나뉜 묶음): 구현 작업들이 리뷰 · UX를 통과하면 `orca worktree create --name bundle-<묶음> --no-parent --setup run --json`으로 만들고 그 안에서 각 구현 브랜치를 `git merge --no-ff`한 뒤, QA → 역할 시나리오 → 권한 감사를 **차례로** 그 worktree에 배정한다(셋 다 DB를 초기화하므로 동시에 돌리지 않는다). 통과하면 통합 브랜치를 main에 병합한다.
8. **P1 예외**: E2E 틀(T-P1-11)이 병합되기 전 작업은 E2E 없이 병합 조건(빌드 · 테스트 · 리뷰 · UX · API 직접 확인)으로 병합하고, T-P1-11 병합 뒤 S-01 등으로 **앞 작업들을 한꺼번에 검증**한 다음 P1을 끝낸다.

## 6. 병합 (main 체크아웃에서)
- 조건: 막는 실패 0 · 권한 감사 통과(해당 시) · UX 큰 불일치 0(화면) · E2E 통과(E2E 틀 이후) · 빌드 · 테스트 통과 · **`git diff --stat main...<브랜치> -- e2e/rbac/perm-matrix.json docs/impl/rbac-matrix.md`가 비어 있음**(사람이 승인한 권한표 변경만 예외).
- `git merge --no-ff <브랜치>` → `npm run build` · `npm test` → `git push origin main`. 충돌 · 실패면 병합을 되돌리고(`git merge --abort` 또는 병합 커밋 revert) 원인 작업에 수정을 보낸다.
- 병합한 worktree는 **`orca worktree rm --worktree <선택자> --run-hooks --delete-branch --json`**으로 지운다. `--run-hooks`가 있어야 아카이브 스크립트(`worktree-env.ps1 -Drop`)가 그 worktree의 전용 DB를 지운다(없으면 건너뜀 — 2026-11-25 확인). 스크립트가 실패하면 삭제도 멈추니 원인(개발 DB 컨테이너 꺼짐 등)을 고치고 다시 실행한다. `--run-hooks` 없이 이미 지웠다면 main에서 `worktree-env.ps1 -Prune -Target <지운 worktree 경로>`로 그 하나만 정리한다. 보류 worktree · 브랜치는 지우지 않는다.

## 7. 권한표 변경 (사람 승인 뒤)
1. 필요가 생기면 의존 작업을 대기시키고 결정 기록 + ‘확인 필요’(결정 게이트)에 올린다.
2. 사람이 승인하면 계약 담당 작업을 만든다. 지시서에 **`권한표 변경 승인: D-<번호>`**와 바꿀 내용을 적는다.
3. 계약 담당이 PERMS를 고치고 `npm run rbac:matrix`로 기준 파일을 갱신, 차이를 보고 → 조정자가 결정 기록에 차이를 붙이고 병합 → 대기시킨 작업을 푼다.

## 8. 기록 (매 이벤트마다 progress.md)
- Run ID · 작업 표(Task · Dispatch ID · worktree · 실제 브랜치 · 상태 · 회차 · 모델 · 결과 링크) · ‘연쇄 실패 지표’.
- 연쇄 실패 차단(계획 §7): 한 묶음 보류 · 자체 결정 3건 이상 → 그 묶음 중지 · 사람에게 알림, 같은 원인 2건 → 원인 작업 먼저, 전체 보류 20% 초과 → 전체 중지.
- 사람 확인 요청은 모아서 — 하루 한 번 또는 단계 끝. W1 경로를 막는 보류는 다음 단계 전에 해결.
- progress · decisions · followups 변경은 main에 바로 커밋 · push(`📝 docs(impl): …`).

## 9. 단계 끝
- 묶음 끝: 리뷰어 반론 리뷰(읽기 전용 터미널, 지시서에 ‘반론 리뷰’) · 그 묶음의 후속 목록을 묶어 처리.
- 단계 끝: progress에 요약(작업 수 · 회차 분포 · 보류 · 후속 · 사용량), ‘확인 필요’를 정리해 보여 주고 다음 단계로 갈지 사람에게 묻는다.
