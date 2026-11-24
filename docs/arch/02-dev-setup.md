# 개발 환경 — NeoDB 모노레포 (B0)

> 백엔드 구성안: [01-backend-architecture-v1.md](01-backend-architecture-v1.md). 이 문서는 지금 동작하는 것만 적는다.

## 준비물
- Node 26 LTS(`.nvmrc`), npm 11 — pnpm은 쓰지 않는다(npm 워크스페이스)
- Docker(개발용 PostgreSQL)

## 처음 한 번
```
npm install
cp .env.example .env          # 개발 기본값
npm run db:up                 # PostgreSQL 16 → localhost:55432 (infra/data/pg에 저장)
npm run db:migrate            # packages/db/migrations 적용
npm run db:seed               # 최초 관리자(admin) — 임시 비밀번호를 한 번만 출력, 24시간
```

## 날마다
```
npm run build                 # tsc -b (domain → rules → db → api)
npm test                      # vitest — packages/rules 권한 · 결재 판정
npm run dev:api               # http://localhost:4310/api/v1  (healthz · readyz는 /healthz · /readyz)
```
- 스키마를 바꾸면 `packages/db/src/schema.ts` 수정 → `npm run db:generate`(SQL 생성, 검토 후 커밋) → `npm run db:migrate`.
- 끝낼 때 `npm run db:down`(데이터는 `infra/data/pg`에 남는다).

## 구성 (B0 지금)
| 위치 | 내용 |
|---|---|
| `packages/domain` | 역할 · 소속 · 결재 단계 · 정책 타입, 화면 이름(ROLE_NAME) |
| `packages/rules` | 권한표 PERMS · `canUser` · `canUserAct`(자기 승인 · 위임 · 독립성) · `lineGaps` · `canUserSeeDoc` — 목업 `app.js`에서 순수 함수로 옮김, 테스트 15건 |
| `packages/db` | Drizzle 스키마(`iam` 계정 · 역할 · 담당 · 세션 · 예약 ID, `audit.events`) · 마이그레이션 · 시드 |
| `apps/api` | NestJS(Fastify) — `/healthz` · `/readyz` · `POST /auth/login|logout|password` · `GET /auth/me` · `GET /audit`, 전역 가드(세션 · 같은 출처 쓰기 · 임시 비밀번호 전용 세션 · `@Can` 권한) |
| `infra/docker-compose.dev.yml` | 개발용 PostgreSQL |

## API 동작 (확인함)
- 로그인: 비밀번호를 먼저 확인 — 틀리면 없는 ID · 잠김 · 중지와 상관없이 ‘ID 또는 비밀번호가 맞지 않습니다’. 5회 틀리면 10분 잠김.
- 세션: httpOnly 쿠키 `neodb_sid`, 토큰 원문은 저장하지 않고 SHA-256만. 유휴 30분 · 절대 12시간. `users.sess_rev`가 오르면(권한 회수 · 중지 · 비밀번호 변경) 열린 세션이 모두 끝난다.
- 임시 비밀번호: 로그인은 되지만 비밀번호 변경 · 로그아웃 · `/me`만 된다(24시간 · 첫 로그인 변경).
- 권한 거부: 403 `{ code: 'forbidden', message: '{역할}만 할 수 있습니다 — {할 수 있는 일}' }`.
- 감사: 로그인 · 실패 · 잠김 · 비밀번호 변경 · 최초 관리자 발급이 `audit.events`에 남는다.

## 다음 (B0 남은 일)
- `apps/collab`(Hocuspocus — 세션 인증 · 조회 전용 · 쓰기 고정 스파이크), `apps/worker`(pg-boss), `apps/web`(목업 → React 셸)
- 운영 compose · nginx · 오프라인 설치 묶음 · 백업/복원 리허설 · CI
