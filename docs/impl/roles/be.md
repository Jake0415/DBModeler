# 역할: BE 개발자

> 에이전트: Claude — Opus 5.5(L1 · L2) · Fable 5.2(L3 · L4). 먼저 [_common.md](_common.md).

## 쓰기 범위
- `apps/api` · `apps/worker` (지시서 범위 안)
- 그 앱의 테스트(`apps/*/test`) · OpenAPI 문서를 앱에서 내보내는 연결 코드(T-P1-02의 앱 쪽)
- 금지: `packages/*`(계약이 부족하면 조정자에게 계약 작업을 요청) · 루트 `package.json`/`package-lock.json`(의존성은 계약 담당) · `apps/web` · `apps/collab` · `docs/*`
- 공동 편집 담당과 같이 맡는 작업(T-P2-503 · 602)은 조정자가 **BE 몫(`apps/api`)과 collab 몫(`apps/collab`)을 별도 작업으로** 나눈다.

## 하는 일
1. 지시서가 이어받으라는 **계약**(타입 · 규칙 · 스키마 · API 계약)을 확인한다. 계약에 없는 필드 · 엔드포인트를 만들지 않는다.
2. NestJS 모듈 규칙(설계 §3 · §13): 모듈은 자기 테이블만, 다른 모듈은 공개 명령 · outbox. 트랜잭션 주인을 지킨다(§13.5). **감사는 업무 변경과 같은 트랜잭션**.
3. 권한은 두 번: 컨트롤러 가드(`@Can`) + 서비스 안 재검사(실행 직전) — 둘 다 `packages/rules` `canUser`. 범위 밖은 403 + 이유(설계 §6).
4. 오류 응답 `{ code, message, field?, detail? }`, 문구는 디자인 가이드 §11.2 형식.
5. 변경 요청은 낙관적 잠금(`If-Match`) · 재시도는 `Idempotency-Key`(설계 §6).
6. 통합 테스트: 로컬은 이 worktree의 DB(`.env`)로 돌린다. CI(T-P1-01 이후)는 Testcontainers로 같은 테스트를 돌린다(설계 §9). 권한 우회 · 동시 처리 · 중복 신청 · 열람 범위 경우를 넣는다.

## 완료 기준
- `npm run build` · `npm test` 통과(새 테스트 포함)
- `npm run dev:api`로 이 worktree 포트(`.env` `API_PORT`)에서 뜨고, 바꾼 엔드포인트를 시험 계정으로 호출한 결과(허용 1개 이상 + 403 1개 이상)를 보고에 적는다. 시험 계정 비밀번호는 `.env`의 `TEST_PASSWORD`(보고에 적지 않는다).
- 끝나면 띄운 서버를 끈다.
