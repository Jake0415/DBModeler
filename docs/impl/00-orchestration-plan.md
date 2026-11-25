# NeoDB 구현 오케스트레이션 계획 (Orca) v1

> 2026-11-25 · 상태: **확정(사용자 결정)** — 에이전트 구성 · 모델 · 회차 규칙 · 실패 처리 · 작업 순서.
> 목적: 확정된 목업(`docs/ux/mockups`)과 백엔드 설계(`docs/arch/01-backend-architecture-v1.md` §13이 우선)를 기준으로, Orca 오케스트레이션에서 여러 에이전트가 FE · BE 전체를 구현 · 검증 · 리뷰하도록 운영 규칙을 정한다.
> 규칙의 요약은 저장소 루트 [`CLAUDE.md`](../../CLAUDE.md)(Claude 에이전트) · [`AGENTS.md`](../../AGENTS.md)(Codex 에이전트)에 있고, 이 문서가 기준(SoT)이다.

## 0. 한눈에

| 항목 | 결정 |
|---|---|
| 실행 환경 | Orca 오케스트레이션(작업마다 worktree), Windows · PowerShell |
| 구현 | Claude — Opus 5.5(L1 · L2), **Fable 5.2(L3 · L4)** |
| 리뷰 · QA · 권한 감사 | Codex — GPT-6.2 Sol(L1 · L2), **GPT-6.2 Astra(L3 · L4)** |
| 조정자 | Claude Opus 5.5 · high 고정, 코드를 쓰지 않음 |
| 기준 | 목업 = 화면 · 동작 기준, 백엔드 설계 §13 = 구조 기준, 권한표 = `packages/rules` PERMS 한 곳 |
| 회차 | 처음 구현 + **수정 최대 5회**, **막는 실패만** 회차로 셈, 수정 3회 뒤 원인 점검 |
| 5회 뒤 | 조정자 자체 결정(채택 · 기각 · 범위 축소 · 보류) → 결정 기록 `docs/impl/decisions/` |
| 동시 실행 | 전체 3~4개, Fable · Astra 동시 2개, 사용량 80%에서 새 배정 중지 |

## 1. 시작 전 확인 (P0)

| # | 항목 | 할 일 |
|---|---|---|
| 1 | Orca 에이전트 권한 | Orca는 기본으로 Claude `--dangerously-skip-permissions`, Codex `--dangerously-bypass-approvals-and-sandbox`를 붙여 실행한다. Settings → Agents → Agent Permissions를 확인하고, **리뷰어 · 권한 감사관은 읽기 전용 샌드박스**로 띄운다(§3 실행 예). |
| 2 | Orca 오케스트레이션 | 실험 기능 — Settings → Experimental에서 Orchestration · CLI를 켜고 `orca status --json`으로 확인. Windows는 `orca serve` · supervisor 미지원 → 조정자가 멈추면 사람이 다시 띄우고 `progress.md`로 이어 간다. 스킬: `orca skills install --skill orca-cli --skill orchestration`. |
| 3 | Heartbeat | Settings → Agent Orchestration → 15분(기본 5분 — 토큰 절약). |
| 4 | Codex CLI | `gpt-6.2-sol` · `gpt-6.2-astra`는 **Codex CLI 0.171.0 이상**. 업데이트(`npm i -g @openai/codex`) 뒤 Windows 샌드박스 셔임(`-c windows.sandbox=unelevated`)을 다시 적용한다. DBModeler를 Codex 신뢰 프로젝트로 등록해야 `.codex/config.toml`이 읽힌다. |
| 5 | 미커밋 정리 | worktree는 커밋된 상태에서 시작한다. 목업 · 검토 문서 변경을 먼저 커밋한다. |
| 6 | DB · 포트 분리 | `scripts/worktree-env.ps1`(작업 worktree에서 실행): DB `neodb_<작업>_<해시 12자리>` · `API_PORT` 4400~4899 · `WEB_PORT` = API+1000을 배정하고 `.env`를 맞춘 뒤 마이그레이션(`-Seed` · `-Reset` · `-Drop` · `-Adopt`). 배정 기록은 `.git/neodb-worktrees.json`, 동시 실행은 파일 잠금. 기본 체크아웃에서는 실행되지 않는다. 개발 DB 컨테이너는 main 체크아웃에서만 `npm run db:up`. 마이그레이션 파일은 계약 담당만 만든다. |
| 7 | 모델 확인 | §3.3 절차를 통과해야 첫 작업을 배정한다. |

## 2. 에이전트 구성

| 역할 | 모델(기본 → L3 · L4) | 맡는 일 | 쓰기 범위 | 하지 않는 일 |
|---|---|---|---|---|
| **조정자** | Opus 5.5 · high (고정) | 작업 정의 · 난이도 지정 · 배정 · 결과 수집 · 리뷰 판정(채택 · 보류 · 기각) · 원인 점검 · 자체 결정 · 병합 · 기록 | `docs/impl/*`, main 병합 | 제품 코드 작성 |
| **계약 담당** | Opus 5.5 → Fable 5.2 | 기능마다 먼저 `packages/domain`(타입 · 오류 코드) · `packages/rules`(판정 · 권한) · DB 스키마 · 마이그레이션 · API 계약(OpenAPI) · 시드 | `packages/*`, `packages/db/migrations` — **혼자 소유** | 화면 |
| **BE 개발자** (1~2) | Opus 5.5 → Fable 5.2 | NestJS 모듈 · 통합 테스트(Testcontainers) | `apps/api`, `apps/worker` | 공용 패키지 변경(계약 담당에게 요청) |
| **FE 개발자** (1~2) | Opus 5.5 → Fable 5.2 | 목업 → React(`apps/web`). 목업 `assets/app.js`의 동작이 사양 | `apps/web` | 목업 수정 |
| **공동 편집 담당** | Fable 5.2 (L4 고정) | Hocuspocus(collab) · 확정 신청 고정 · Yjs 문서 구조 | `apps/collab`, `packages/model-doc` | — |
| **UX 담당** | Opus 5.5 + `ui-ux-pro-max` | Orca 브라우저로 목업 ↔ 구현 스크린샷 비교 · 불일치 판정 · **목업이 틀렸을 때만 목업 수정** + 변경 기록 | `docs/ux/mockups`, `docs/ux/*.md` | 제품 코드 |
| **역할 시나리오 QA** | Opus 5.5 → Fable 5.2 | 여러 계정으로 이어지는 업무 흐름 E2E(신청 → 1단계 → 최종 → 반영, 반려 · 회수 · 위임 · 자기 승인 · 열람 범위) · 역할별 스크린샷 | `e2e/scenarios/` | 제품 코드 |
| **리뷰어** | Sol → Astra (읽기 전용) | 작업 diff 리뷰(사양 · 권한 · 트랜잭션 · 보안 · 테스트), 기능 묶음 끝에 반론 리뷰 | 없음 | 수정 |
| **QA** | Sol → Astra | 사양(목업 · 설계)을 보고 E2E · 회귀 테스트 작성 · 실행. 구현 코드를 보고 테스트를 맞추지 않는다 | `e2e/`(scenarios · rbac 제외), 테스트 데이터 | 제품 코드 |
| **권한 감사관** | Sol → Astra | PERMS × 역할 × 범위 표 자동 검사: 화면(숨김 · 흐리게+이유), **API 직접 호출 403**, 범위 밖 주소, 단축키 · 오른쪽 클릭, 권한 회수 시 세션 종료 | `e2e/rbac/`, 감사 보고서 | 제품 코드 |

원칙
- **공용 패키지는 계약 담당 한 명만 쓴다.** 다른 에이전트가 필요하면 조정자에게 계약 변경 작업을 요청한다.
- **구현(Claude)과 검증(Codex)을 다른 모델로 나눈다.** 같은 모델이 자기 코드를 통과시키지 않게.
- **목업은 기준이다.** FE는 목업을 고치지 않는다. 목업 수정은 UX 담당만, 변경 기록과 함께.
- 한 번에 도는 에이전트는 3~4개. 검증 에이전트는 묶음 끝에 들어가므로 몰리지 않는다.

## 3. 모델 · 난이도

### 3.1 난이도 (조정자가 작업을 만들 때 지정, 이유 한 줄)
| 난이도 | 예 |
|---|---|
| **L1 쉬움** | 문구 · 간격, 목업 그대로 옮기는 단순 화면, 단순 조회 API |
| **L2 보통** | 화면 + API 한 기능(사전 검색 · 상세, 업로드 이력) |
| **L3 어려움** | 결재 상태 머신, 권한 · 열람 범위, 트랜잭션 · outbox, 10만 행 엑셀, 성능 |
| **L4 최고** | collab 고정 · 제출, Yjs 문서 구조, 세션 회수 전파, 보안, 데이터 손실 위험 마이그레이션 |

### 3.2 난이도별 모델 · effort (처음 실행)
| 난이도 | 구현 (Claude) | 리뷰 · QA · 권한 감사 (Codex) |
|---|---|---|
| L1 | Opus 5.5 · medium | Sol · low |
| L2 | Opus 5.5 · high | Sol · medium |
| L3 | **Fable 5.2 · high** | **Astra · high** |
| L4 | **Fable 5.2 · xhigh** | **Astra · xhigh** |

모델 ID: Opus 5.5 `claude-opus-5-5`, Fable 5.2 `claude-fable-5-2`, GPT-6.2 Sol `gpt-6.2-sol`, GPT-6.2 Astra `gpt-6.2-astra`. **다른 모델(하위 모델 포함) 사용 금지** — 바꾸려면 사용자 승인. 새 최신 모델이 나오면 사용자 승인 뒤 이 표를 갱신한다.

L3로 매기면 토큰이 크게 늘므로 조정자는 L3 지정 이유를 작업 설명에 한 줄 남긴다.

### 3.3 시작 전 모델 확인 (조정자, 실행마다)
1. `codex --version` ≥ 0.171.0
2. `codex exec -m gpt-6.2-sol "ping"` · `codex exec -m gpt-6.2-astra "ping"`이 경고 없이 응답(‘Model metadata not found’면 중단)
3. Claude 작업 에이전트가 보고하는 모델이 지정 모델과 같음
4. 하나라도 다르면 **배정하지 않고 사람에게 알린다.** 다른 모델로 조용히 바꿔 진행하지 않는다.

### 3.4 Orca 실행 예 (조정자가 매번 모델 · effort를 명시)
```powershell
orca orchestration run-create --objective "NeoDB P2 묶음 ② 사전 신청 → 결재 → 반영" --json
orca orchestration task-create --task-title "T-B1-021 approval 전이표" --spec "<작업 정의 §11>" --json
# 구현 (L3)
orca orchestration worker-start --task <taskId> --worktree new-child --name t-b1-021 --agent claude --model claude-fable-5-2 --effort high --setup run --json
# 리뷰 (L3, 읽기 전용 — Agent Permissions에서 Codex 샌드박스를 read-only로)
orca orchestration worker-start --task <reviewTaskId> --worktree current --agent codex --model gpt-6.2-astra --effort high --json
# 결과 대기 (기다리는 동안 토큰을 쓰지 않는다)
orca orchestration check --wait --types worker_done,escalation,question --timeout-ms 900000 --json
```
- 사람 확인이 필요한 결정은 `orca orchestration gate-create --task <id> --question "..." --options '["확인","보류"]'`.
- 명령 형식은 `orca skills get orchestration --full`로 매번 확인하고 플래그를 지어내지 않는다.

## 4. 작업 한 건의 흐름

```
준비됨
 → ① 계약 확정(계약 담당) — 타입 · 규칙 · 스키마 · API 계약 · 권한 영향
 → ② 구현 + 단위 테스트(BE ‖ FE, worktree 분리)
 → ③ 자체 검사(tsc · lint · vitest) — 통과해야 제출
 → ④ 리뷰(Codex) ‖ UX 화면 비교(화면 작업만)
 → ⑤ 조정자 판정 — 지적마다 채택 · 후속 · 기각 + 이유
 → ⑥ 막는 실패가 있으면 수정(회차 +1) → ④로, 최대 5회(§5)
 → ⑦ E2E: QA ‖ 역할 시나리오 QA ‖ 권한 감사관
 → ⑧ 조정자 병합(main) + progress.md 갱신
```
- **권한 영향**: 작업 정의에 관련 권한 id(`model.submit` · `appr.da` …)와 역할별 기대(허용 · 숨김 · 흐리게+이유 · 403)를 적는다. BE는 가드 + 서비스 재검사, FE는 숨김 · 흐리게 · 이유.
- **권한 표 검사가 하나라도 실패하면 병합하지 않는다.**
- 백엔드만 바뀐 작업은 UX 화면 비교를 건너뛰고 그 사실을 기록한다.

## 5. 회차 규칙

### 5.1 회차로 세는 것 — 막는 실패만
- 리뷰 **치명 · 높음** 지적(심각도 정의는 `AGENTS.md`)
- E2E 실패(QA · 역할 시나리오)
- 권한 표 검사 실패
- UX **큰 불일치**: 목업과 정보 구조 · 동작 · 기준어 · 역할별 표시가 다름

### 5.2 회차로 세지 않는 것
| 대상 | 처리 |
|---|---|
| 리뷰 중간 · 낮음, UX 작은 불일치(간격 · 정렬) | 고치지 않고 [`followups.md`](followups.md)에 등록. 같은 기능의 다음 작업이나 단계 마무리 때 묶어서 처리 |
| tsc · lint · 단위 테스트 실패 | 구현자가 **제출 전에** 통과시킨다. 제출 전 자체 시도는 3번 · 30분 안에서 |
| 불안정한 테스트 · 환경 오류 | 한 번 다시 실행. 또 실패하면 ‘환경 문제’로 분류해 환경 작업을 만든다 |

### 5.3 재리뷰
- 2회차부터는 **이전 지적이 고쳐졌는지 + 고친 부분만** 본다. 전체를 새로 리뷰하지 않는다.
- 2회차부터 새로 나온 중간 · 낮음 지적은 후속 목록으로 보낸다.

### 5.4 상한과 상향 순서 — 처음 구현 + 수정 최대 5회
| 회차 | L1 · L2 | L3 | L4 |
|---|---|---|---|
| 처음 | 기본값(§3.2) | Fable/Astra · high | Fable/Astra · xhigh |
| 수정 1 | effort 한 단계 올림 | Fable/Astra · xhigh | Fable · max / Astra · xhigh |
| 수정 2 | **Fable/Astra · high** | Fable/Astra · xhigh | Fable · max / Astra · xhigh |
| 수정 3 | Fable/Astra · xhigh | Fable · max / Astra · xhigh | Fable · max / Astra · xhigh |
| **원인 점검** | §5.5 | | |
| 수정 4 | Fable · max / Astra · xhigh | 같음 | 같음 |
| 수정 5 (마지막) | Fable · max / Astra · xhigh | 같음 | 같음 |
| 그 뒤 | **중단 → 자체 결정 → 결정 기록**(§6) | | |

- 같은 실패가 두 번 똑같이 나면 L1 · L2도 바로 Fable/Astra로 올린다.
- 회차는 작업 전체 합계다(검사 종류별로 따로 세지 않는다). 6회째 수정은 실행하지 않는다.

### 5.5 수정 3회 뒤 원인 점검
수정 4 · 5회는 가장 비싼 설정이므로 조정자가 먼저 원인을 분류한다.

| 원인 | 판단 신호 | 처리 |
|---|---|---|
| 어렵지만 나아지는 중 | 막는 실패 수가 줄고 있음 | **수정 4 · 5회 계속** |
| 사양 모호 · 충돌 | 구현자와 리뷰어가 서로 다른 문서를 근거로 댐 | 중단 → UX · 계약 담당이 해석 + 결정 기록. 화면 동작이 바뀌면 보류 |
| 공용 계약 문제 | 고치려면 `packages/*`를 바꿔야 함 | 중단 → 계약 담당 새 작업(원래 작업과 회차 따로) |
| 작업이 너무 큼 | 고칠 때마다 다른 곳이 깨짐 | 중단 → 작업 쪼개기 |
| 환경 · 불안정 테스트 | 코드와 상관없이 실패 | 중단 → 환경 작업, 불안정한 테스트 격리 · 기록 |
| 리뷰 의견 반복 충돌 | 같은 지적을 구현자는 반박, 리뷰어는 재제기 | 중단 → 조정자 판정, 필요하면 다른 모델 의견 한 번(Fable ↔ Astra) |

## 6. 수정이 안 될 때 — 자체 결정

### 6.1 결정 네 가지
| 결정 | 언제 |
|---|---|
| **채택** | 남은 막는 실패가 실제로는 경미하다고 판단 → 병합, 남은 지적은 후속 목록 |
| **기각** | 지적이 사양과 맞지 않음 → 근거(문서 · 절)를 적고 병합 |
| **범위 축소** | 핵심만 병합, 어려운 부분은 새 작업 |
| **보류** | 병합하지 않고 브랜치 · worktree 유지(`worker-retain`). 의존 작업은 대기, 나머지는 계속 |

### 6.2 자체 결정으로 바꾸면 안 되는 것 → **보류만** 하고 사람 확인
- 권한표(PERMS) 변경
- 데이터를 지우는 마이그레이션
- 목업의 **화면 동작**을 바꾸는 수정
- 보안 약화(인증 · 세션 · 감사 로그)
- 설계 문서와 다른 구조

### 6.3 결정 뒤
- 결정 기록 `docs/impl/decisions/D-<번호>-<작업>.md`([양식](decisions/D-000-template.md))을 남기고 [`progress.md`](progress.md) ‘확인 필요’에 올린다.
- 사람 확인 요청은 그때그때 끊지 않고 **하루 한 번 또는 단계 끝에 묶어서** 보여 준다.
- **W1 완주 경로(S0~S6)를 막는 보류는 다음 단계 전에 반드시 해결**한다.
- 사람의 응답: **확인**(그대로) · **뒤집기**(조정자가 새 작업) · **방향 제시**(그 내용으로 새 작업, 회차 0부터).

## 7. 연쇄 실패 차단

| 조건 | 조치 |
|---|---|
| 한 기능 묶음에서 보류 · 자체 결정 3건 이상 | 그 묶음 전체 중지 → 사람에게 알림(사양 · 계약 문제 가능성) |
| 같은 원인 보류 2건 이상 | 원인 해결 작업 먼저, 관련 작업 대기 |
| 전체 작업 중 보류 비율 20% 초과 | 오케스트레이션 전체 중지 → 계획 재검토 |
| 사용량 한도 80% | 새 배정 중지, 진행 중인 작업만 마무리 |

## 8. 토큰 절약
- 수정 상한 5회와 원인 점검을 지킨다.
- 동시 실행 3~4개, Fable · Astra 동시 2개.
- 조정자는 `check --wait`로 잠들어 기다린다. Heartbeat 15분.
- 리뷰어에게는 **바뀐 파일 + 관련 사양 절**만 넘긴다. 저장소 전체를 읽히지 않는다.
- Codex 리뷰 게이트(Stop 훅 자동 반복)는 쓰지 않는다. 조정자가 필요할 때만 리뷰를 부른다.

## 9. RBAC 검증

### 9.1 시험 계정 (시드, 계정 하나에 역할 하나)
| 계정 | 역할 · 조건 | 확인할 것 |
|---|---|---|
| `tadm` | Admin | 설정 · 사용자, 표준 내용은 못 바꿈 |
| `tda` | DA (담당 통합ERP) | 1단계 승인 · 후보 큐 · 공표 |
| `tda2` | DA (다른 시스템) | 담당 밖 모델 결재 불가 |
| `tmod` | 모델러 · 외주 (통합ERP, 기한 있음) | 편집 · 확정 신청, 범위 밖 403 |
| `tmodin` | 모델러 · 내부 | 내부 조회 범위(기관 전체) |
| `town` | 기관 담당자 | 최종 승인 · 관리 변경 확인 |
| `town2` | 기관 담당자 | 두 사람 확인 · 위임 대리인 |
| `taud` | 감리 (기한 있음) | 읽기 전용 · 끝난 결재 · 감사 로그 |
| `tview` | 역할 없음 | 편집 도구 숨김 · 내려받기 차단 |
| `texp` · `tdatmp` · `tstop` · `tmulti` | 기한 만료 외주 · 임시 비밀번호 DA(24시간) · 사용 중지 · 겸임(모델러+DA) | 권한 없음 · 결재 잠김 · 자기 승인 규칙 |
- 만들기: `npm run db:seed:test`(또는 `scripts/worktree-env.ps1 -TestAccounts`). 정의: `packages/db/src/scripts/seed-test.ts`. 개발 DB(localhost:55432, `neodb` · `neodb_*`)에서만 실행되고, 메일이 `@test.localhost`인 시드 계정만 다시 만든다. 공통 비밀번호 = `.env`의 `TEST_PASSWORD`(시험값).
- 업무 영역 고정: `e_hr` = 통합ERP › 인사관리, `rq` = 요구사항관리 › 프로젝트(목업 데이터와 같게).
- 비밀번호는 **시드의 시험값**만. 운영 설치에서는 시험 계정이 빠진다(설계 §13.6).

### 9.2 계정 바꾸기
| 방법 | 쓰는 곳 |
|---|---|
| 역할별 로그인 상태 저장(Playwright storageState) + 브라우저 컨텍스트 여러 개 | E2E — 한 시나리오 안에서 모델러 창 → DA 창 → 기관 담당자 창 |
| 실제 로그인 화면 | 시나리오마다 1회 — 로그인 · 임시 비밀번호 · 잠금 자체 검사 |
| Orca 브라우저 탭 — **역할마다 브라우저 프로필**(`orca tab profile create --label <계정>` → `orca tab create --profile <id>`) | UX 담당 · 사람의 역할별 화면 확인. 같은 프로필의 탭은 쿠키 · 저장소를 공유하므로(2026-11-25 확인) 프로필 없이 여러 역할을 동시에 열지 않는다 |
| ✕ 개발용 ‘역할 바로 바꾸기’ | 쓰지 않는다. 꼭 필요하면 개발 빌드에서만, 감사 로그와 함께 |

### 9.3 데이터
- 시나리오 시작마다 DB를 초기화하고 시드를 넣는다(결재 상태가 다음 시나리오를 깨뜨리지 않게).
- 권한 감사관의 검사 표는 `packages/rules` PERMS에서 **자동 생성**한다(`buildPermMatrix` = 계정 × 권한 × 대상, `buildActMatrix` = 결재 행위: 자기 승인 · 최종 승인 독립성 · 단계). 권한표가 바뀌면 검사도 같이 바뀐다.
  - 사람이 보는 표: [`rbac-matrix.md`](rbac-matrix.md) · E2E용: `e2e/rbac/perm-matrix.json` — 둘 다 기준 파일이고 `npm test`가 비교한다(다르거나 없으면 실패, `vitest -u`로도 덮어쓰지 않음).
  - 거부 이유 → 화면 처리: 역할 = 숨김, 중지 · 기한 · 임시PW · 범위 = 흐리게 + 이유, API = 403.
- 권한표 변경은 사람 승인(결정 게이트). 승인 뒤에만 `npm run rbac:matrix`로 기준 파일을 갱신하고, 그 차이를 결정 기록에 붙인다.

## 10. 작업 순서

| 단계 | 범위 | 병렬 | 끝나는 기준 |
|---|---|---|---|
| **P0 준비** | §1 확인 전부, worktree 준비 스크립트(DB · 포트), 시험 계정 시드 · 역할별 로그인 저장 틀 · DB 초기화, PERMS → 검사 표 생성기, 작업 목록(기능 → 목업 → API → 테스트 대응표), 목업 기준 스크린샷 | 1 | 첫 작업을 에이전트가 문서만 보고 시작할 수 있다 |
| **P1 기반** (설계 B0) | iam 완성(세션 · 역할 · 회수 전파), RBAC 가드, 감사, OpenAPI → `api-client`, **web 셸**(목업 레이아웃 · 디자인 토큰 · 내비게이션 · 권한별 메뉴), E2E 틀, CI, collab 고정 · 제출 스파이크 | 2 | 역할별 로그인 → 메뉴 · 403이 목업과 같다(시험 계정 9개) |
| **P2 W1 수직 완주** (B1) | S0→S6 순서로 묶음 7개: ① 공통표준 적재 + 사전 검색 · 상세 ② 사전 신청 → DA → 최종 → 반영 → 변경 내역 ③ 엑셀 정의서 가져오기 ④ 모델 공동 편집 ⑤ 표준 맞추기 ⑥ 확정 신청 · 승인 · 스냅샷 · 잠금 ⑦ DDL · 정의서 · 준수율 + 게이트 B | 묶음마다 3~4 | 한 데이터로 S0~S6 끝까지, 묶음마다 다중 계정 시나리오 1개 이상 |
| **P3 W1 마무리** (B2) | 사전 엑셀 일괄(10만 행) · 후보 큐 · 공표 · 공식 ERD · 데이터 타입 · 검수 기준 · 나머지 산출물 | 3~4 | 목업 W1 화면 전체 |
| **P4 관리** (B3) | 사업 · 두 사람 확인 · 위임 · 조회 범위 · 감리 · SSO · 메일 · 기한 만료 · 권한 회수 시 세션 종료 | 2~3 | 29 RBAC 시나리오 전체 |
| **P5 W2** (B4) | DDL 가져오기 · 영역 이동 · 통합 보기 등 | 3 | 20 W2 |
| **P6 운영 준비** (B5) | 성능 회귀 · 보안 점검(권한 감사관 확대) · 복구 리허설 · 설치 문서 | 2 | 내부망 인수 시험 |

- 단계가 끝나면 후속 목록(중간 · 낮음)을 묶어 처리하고, 보류 건을 사람과 정리한 뒤 다음 단계로 간다.
- collab(④ · ⑥)은 공동 편집 담당 전담, L4.

## 11. 작업 정의 양식 (`task-create --spec`)
```
ID: T-<단계>-<번호>   제목:
난이도: L1|L2|L3|L4 — 이유(L3 이상 필수):
담당: 계약 | BE | FE | collab | UX | QA | 역할 시나리오 | 권한 감사
기준 문서: 목업(파일 · 화면) · 설계 절 · 흐름(02-flows 절)
범위(쓰기 허용 경로):
의존 작업:
권한 영향: 권한 id · 역할별 기대(허용 · 숨김 · 흐리게+이유 · 403)
완료 기준: 테스트 · 화면 · 시나리오
금지: 범위 밖 파일 · 공용 패키지(계약 담당 제외) · 목업(UX 제외)
```

역할별 지시서는 [`roles/`](roles/)(공통 규칙 `_common.md` · 양식 `_spec-template.md` · 역할 10개), 실행 방법은 [02-orca-runbook.md](02-orca-runbook.md), 조정자 시작 프롬프트는 [coordinator-kickoff.md](coordinator-kickoff.md).

## 12. 기록
| 파일 | 내용 | 쓰는 사람 |
|---|---|---|
| [`progress.md`](progress.md) | 맨 위 ‘확인 필요’ · 단계 · 작업 상태 · 회차 · 모델 · 결과 | 조정자 |
| [`decisions/`](decisions/) | 자체 결정 한 건당 한 파일 | 조정자 |
| [`followups.md`](followups.md) | 회차로 세지 않은 중간 · 낮음 지적, UX 작은 불일치 | 조정자 |
| 작업 커밋 메시지 | 기존 형식(이모지 + 범위 + 요약) + 모델 · 회차 · 리뷰 결과 | 구현 에이전트 · 조정자 |

## 13. 브랜치 · 병합
- 작업 브랜치는 Orca가 만드는 기본 이름(`Jake0415/<worktree 이름>`, worktree 이름 = 작업 ID 소문자)을 쓰고, 조정자가 실제 브랜치 이름을 progress에 기록한다(`worker-start`에는 브랜치 이름 옵션이 없다 — 2026-11-25 확인). 설계 단계의 ‘main 직접 커밋’ 규칙은 구현 단계에서 이 규칙으로 바뀐다.
- 병합은 조정자만, ⑦까지 통과한 뒤 `--no-ff`로 main에 합치고 push한다. PR은 쓰지 않는다.
- 보류 브랜치는 지우지 않는다(결정 기록에 브랜치 이름).

## 14. 남은 확인
- `gpt-6.2-sol` · `gpt-6.2-astra` 이름은 Codex CLI 업데이트 뒤 실제 호출로 확인한다(§3.3).
- ~~Orca 브라우저 탭 쿠키 공유~~ — 확인(2026-11-25): 같은 프로필은 공유, 프로필을 나누면 분리 → §9.2.
- ~~Orca `--effort max` 전달~~ — 확인(2026-11-25): `--model` · `--effort max` 그대로 전달.
- Orca 기본 브랜치 이름은 `<GitHub 사용자>/<이름>`(예: `Jake0415/neoDB-Modeler`)이고 worktree는 `C:\Users\ysh\orca\workspaces\DBModeler\` 아래에 생긴다. §13의 `impl/<작업ID>`는 Orca 작업에서 `--branch`로 지정하거나 Orca 기본 이름을 받아들인다(worktree-env.ps1은 어느 이름이든 처리).
