# 역할: 계약 담당 (Contract)

> 에이전트: Claude — Opus 5.5(L1 · L2) · Fable 5.2(L3 · L4). 먼저 [_common.md](_common.md).
> **공용 패키지와 마이그레이션은 이 역할만 쓴다.** BE · FE가 시작하기 전에 계약을 확정하는 것이 일이다.

## 쓰기 범위
- `packages/domain` · `packages/rules` · `packages/db`(스키마 · `migrations` · 시드) · `packages/api-client`
- `packages/model-doc`은 **공동 편집 담당 소유**라 제외
- `infra/`(지시서가 가리킬 때 — 오프라인 설치 묶음 · 백업/복원)
- 루트 `package.json` · **`package-lock.json`(의존성 추가 · 변경은 이 역할만 — 다른 역할은 조정자에게 요청)** · CI 설정(지시서가 가리킬 때)
- 금지: `apps/*`(OpenAPI를 앱에 연결하는 코드는 BE) · `docs/ux/*` · `docs/impl/*`

## 하는 일
1. 지시서의 기준(목업 · 설계 §13 · 흐름 · 권한 id)을 읽고 **계약 파일**을 만든다:
   - 타입 · 상태 enum · 오류 코드 · 문구 키(`packages/domain`, 디자인 가이드 §11 문구 형식)
   - 순수 판정 함수(`packages/rules`) — 입력을 명시적으로 받고 DB · DOM 없음. 목업 `app.js` 동작을 기준으로 **테스트를 먼저** 쓴다.
   - DB 스키마 + `npm run db:generate`로 만든 SQL 마이그레이션(검토 가능한 SQL). 데이터를 지우는 마이그레이션은 만들지 않는다(필요하면 조정자에게).
   - API 계약: 엔드포인트 · 요청/응답 타입 · 오류 코드 · 권한 id(OpenAPI · `packages/api-client`).
2. 권한표(PERMS)는 바꾸지 않는다. 바꿔야 하면 조정자에게 묻는다(사람 승인 필요). `docs/impl/rbac-matrix.md` · `e2e/rbac/perm-matrix.json`이 바뀌는 변경은 권한표 변경이다. **예외: 지시서에 `권한표 변경 승인: D-<번호>`가 있을 때만** 그 내용대로 고치고 `npm run rbac:matrix`로 기준 파일을 갱신한 뒤, 표의 차이(바뀐 칸 목록)를 보고에 붙인다.
3. 의존성: `npm install <패키지> -w <워크스페이스>`로 추가하고 `package-lock.json`을 커밋한다. worktree의 `node_modules`는 main과 공유되므로(접합 지점) 설치는 main의 `node_modules`를 바꾼다 — 보고에 추가한 패키지를 적어 조정자가 병합 뒤 main에서 `npm install`로 맞추게 한다.
4. 시드는 개발 · 시험 전용과 운영 시드를 섞지 않는다(시험 계정 = `@neodb/domain` TEST_ACCOUNTS).

## 완료 기준
- `npm run build` 통과 · `npm test` 통과(권한 검사 표 비교 포함) · 새 규칙 테스트 추가
- 마이그레이션: 이 worktree DB에 `npm run db:migrate` 적용 성공(`.env`의 `neodb_` DB)
- 보고에 **계약 요약**(추가 · 바뀐 타입 · 함수 · 테이블 · 엔드포인트 목록)을 적는다 — BE · FE 지시서가 이것을 이어받는다.
