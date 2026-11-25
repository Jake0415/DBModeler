# NeoDB (DBModeler) — Claude 에이전트 규칙

> 기준 문서: [docs/impl/00-orchestration-plan.md](docs/impl/00-orchestration-plan.md). 이 파일은 요약이며, 다르면 계획 문서가 우선한다.

## 언어
- 사용자에게 보이는 모든 글(보고 · 기록 · 커밋 메시지 본문 · 문서)은 **한국어**.

## 기준 (SoT)
- 화면 · 동작: `docs/ux/mockups/*.html` + `assets/app.js`(목업 = 사양). 디자인 기준: `docs/ux/01-design-guide.md`.
- 구조: `docs/arch/01-backend-architecture-v1.md` — **§13이 앞 절보다 우선**.
- 권한: `packages/rules`의 PERMS 한 곳(`docs/ux/15-rbac.md`, `29-rbac-r2.md`).
- 흐름: `docs/ux/02-flows.md`, 우선순위: `docs/spec/da-feature-spec/20-priority.md`(W1 = S0~S6 완주).

## 역할과 쓰기 범위
| 역할 | 쓰기 범위 |
|---|---|
| 조정자 | `docs/impl/*`, main 병합 — 제품 코드 작성 금지 |
| 계약 담당 | `packages/*`, `packages/db/migrations` — **공용 패키지는 계약 담당만** |
| BE | `apps/api`, `apps/worker` |
| FE | `apps/web` — **목업 수정 금지** |
| 공동 편집 | `apps/collab`, `packages/model-doc` |
| UX | `docs/ux/mockups`, `docs/ux/*.md` — 목업이 틀렸을 때만 수정 + 변경 기록 |
| 역할 시나리오 QA | `e2e/scenarios/` |
- 범위 밖 파일이 필요하면 고치지 말고 조정자에게 `orca orchestration ask`로 요청한다.

## 모델 (임의 변경 금지)
| 난이도 | 구현 |
|---|---|
| L1 | Opus 5.5 (`claude-opus-5-5`) · medium |
| L2 | Opus 5.5 · high |
| L3 | Fable 5.2 (`claude-fable-5-2`) · high |
| L4 | Fable 5.2 · xhigh |
- 조정자: Opus 5.5 · high 고정. 하위 모델로 내려가지 않는다. 모델을 바꾸려면 사용자 승인.

## 작업 한 건의 흐름
계약 확정 → 구현 + 단위 테스트 → **자체 검사(tsc · lint · vitest) 통과 후 제출** → Codex 리뷰 ‖ UX 화면 비교 → 조정자 판정 → 막는 실패만 수정 → E2E(QA · 역할 시나리오 · 권한 감사) → 조정자 병합.
- 권한 영향(권한 id · 역할별 허용 · 숨김 · 흐리게+이유 · 403)을 구현과 테스트에 반영한다. BE는 가드 + 서비스 재검사.
- 제출 전 자체 검사 시도는 3번 · 30분 안에서. 넘으면 그대로 제출하고 상황을 보고한다.

## 회차 규칙
- **처음 구현 + 수정 최대 5회.** 회차로 세는 것은 막는 실패만: 리뷰 치명 · 높음, E2E 실패, 권한 표 실패, UX 큰 불일치.
- 리뷰 중간 · 낮음, UX 작은 불일치 → 고치지 않고 `docs/impl/followups.md`.
- 불안정한 테스트 · 환경 오류는 세지 않는다(한 번 재실행, 또 실패하면 환경 문제로 보고).
- 수정 3회 뒤 조정자가 원인 점검(사양 · 계약 · 크기 · 환경 · 의견 충돌이면 중단하고 다른 처리).
- 5회 뒤 조정자 자체 결정(채택 · 기각 · 범위 축소 · 보류) → `docs/impl/decisions/D-xxx.md` + `progress.md` ‘확인 필요’.

## 자체 결정 금지 (보류 + 사람 확인)
- 권한표(PERMS) 변경 · 데이터를 지우는 마이그레이션 · 목업의 화면 동작 변경 · 보안 약화(인증 · 세션 · 감사) · 설계 문서와 다른 구조.
- `docs/impl/rbac-matrix.md` · `e2e/rbac/perm-matrix.json`이 바뀌는 변경 = 권한표 변경. `npm run rbac:matrix`는 사람 승인 뒤에만 실행한다.

## 브랜치 · 커밋
- 작업 브랜치 `impl/<작업ID>-<요약>`. 병합은 조정자만(`--no-ff`, main, push). PR 없음.
- 커밋 메시지: 기존 형식(이모지 + 범위 + 요약) + 사용 모델 · 회차 · 리뷰 결과.

## 개발 명령
```
npm install
npm run db:up && npm run db:migrate && npm run db:seed
npm run build
npm test
npm run dev:api
```
- **작업 worktree를 받으면 먼저** `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/worktree-env.ps1` 을 실행한다 — 이 worktree 전용 DB(`neodb_<작업>_<해시>`)와 `API_PORT`·`WEB_PORT`를 배정하고 `.env`를 맞춘 뒤 마이그레이션한다. 시드는 `-Seed`, 초기화는 `-Reset`, 작업이 끝나 worktree를 지울 때는 `-Drop`.
- worktree에서 `npm run db:up`을 실행하지 않는다(개발 DB 컨테이너는 main 체크아웃에서만 띄운다).
- 개발 환경 세부: `docs/arch/02-dev-setup.md`.
