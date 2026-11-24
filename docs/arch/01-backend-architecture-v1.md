# NeoDB 백엔드 1차 구성안 (v1, 2026-11-25)

> 목적: 목업(docs/ux/mockups)으로 확정한 화면 · 규칙을 실제 서비스로 옮기기 위한 백엔드 구성의 첫 안. 구현 착수 전에 기술 선택 · 모듈 경계 · 데이터 · API · 배포 · 단계를 정한다.
> 상태: **1차안 v1.1 — Codex 검토 반영(§13)**. 결정이 필요한 것은 §11. §13이 앞 절의 해당 부분보다 우선한다.

## 0. 한눈에

| 항목 | 1차안 |
|---|---|
| 배포 | 기관 **내부망 단일 서버(온프레미스)**, Docker Compose. 동시 사용 6~20명. 외부 인터넷 의존 없음 |
| 언어 · 런타임 | **TypeScript(Node 22 LTS)** 한 언어 — 프런트(React · React Flow · Yjs)와 규칙 코드를 함께 쓴다(§2) |
| API 서버 | **NestJS(Fastify 어댑터)** — 모듈 경계 · DI · 가드(RBAC) · OpenAPI 자동 |
| 공동 편집 | **Hocuspocus(Yjs)** — API 서버와 같은 저장소의 별도 프로세스, 인증 · 권한은 API와 같은 코드 |
| DB | **PostgreSQL 16** 하나(업무 데이터 · Yjs 문서 · 작업 큐 · 세션) + `pg_trgm` 검색 색인 |
| 작업 큐 | **pg-boss**(PostgreSQL 기반) — 엑셀 읽기 · 산출물 · 공식 ERD 렌더 · 만료 처리. Redis 없이 시작 |
| 파일 | 업로드 원본 · 산출물은 **로컬 볼륨**(기본) 또는 S3 호환(MinIO, 선택) |
| ORM · 마이그레이션 | **Drizzle ORM** + SQL 마이그레이션(검토 가능한 SQL 파일) |
| 인증 | ID · 비밀번호(argon2id) + 사내 SSO 선택(SAML 2.0 · OIDC), 서버 세션(httpOnly 쿠키) |
| 규칙 코드 | `packages/rules` — 권한표(PERMS) · 사전 검사 · 용어 분해 · 표준 판정 · 결재선 · DDL 변환을 **프런트와 서버가 같은 코드로** |
| 산출물 | DDL(4종 DBMS) · 엑셀(exceljs 스트리밍) · 공식 ERD PDF/PNG(서버 헤드리스 Chromium) |

## 1. 현재 시스템 분석 — 백엔드가 맡을 것

### 1.1 목업이 이미 정한 것
목업은 화면만이 아니라 **공용 상태 계층**(`assets/app.js`)에 업무 규칙을 담고 있다. 백엔드는 이 계층을 서버로 옮기는 일이다.

| 목업 저장소(localStorage) | 업무 대상 | 백엔드 책임 |
|---|---|---|
| `dbm-users` · `dbm-auth` · `dbm-user-roles` · `dbm-users-deleted` | 사용자 · 인증 정책 · 역할 · 예약 ID | 계정 · 세션 · SSO · 잠금 · 임시 비밀번호 · ID 영구 예약 |
| `dbm-projects` · `dbm-admin-reqs` | 사업 · 관리 변경 확인(29) | 사업 · 사용 기한 · 일괄 중지 · 두 사람 확인 |
| `dbm-org` · `dbm-policy` · `dbm-set-extra` | 기관 설정 · 결재 정책 · 검수 기준(정책 버전) | 설정 · 버전 · 확인 대기 |
| `dbm-systems` · `dbm-typemap-*` · `dbm-types` · `dbm-type-reqs` | 시스템(DBMS) · 타입 등록부 · 매핑 · 타입 요청(27) | 시스템 · 타입 규칙 버전 · 매핑 |
| `dbm-dict` · `dbm-groups` · `dbm-common-ver` · `dbm-changes` · `dbm-pub` | 기관 사전(단어 · 도메인 · 용어 · 코드 · 엔터티 용어) · 도메인 그룹 · 공통표준 판 · 변경 내역 · 공표(제정차수) | 사전 저장 · 검색 색인 · 버전 · 변경 내역 · 공표 |
| `dbm-docs` | 결재 문서(사전 신청 · 모델 확정) · 처리 이력 | **결재 엔진**(단계 · 결재선 스냅샷 · 자기 승인 · 위임 · 열람 범위) |
| `dbm-batches` · `dbm-baselines` | 엑셀 업로드 묶음 · 검증 기준점 | 업로드 · 스트리밍 검사 · 보류 · 재검증 |
| `dbm-cand-list` | 후보 큐(미등록 단어 발생 위치) | 후보 수집 · 판단 |
| `dbm-model` · `dbm-mdata-<영역>-v<버전>` · `dbm-area-*` · `dbm-moves` · `dbm-views-*` · `dbm-notes` | 업무 영역 · 모델 버전(작업본 · 확정본) · 영역 이동 · 보기 · 메모 | **모델 저장**(Yjs 문서 + 확정 스냅샷) · 잠금 · 버전 |
| `dbm-comp-*` | 준수 판정 캐시 | 판정 결과 투영(검색 · 준수율 · 사용처) |
| `dbm-audit` · `dbm-purge` · `dbm-notifs` · `dbm-notify-*` | 감사 로그 · 영구 삭제 기록 · 알림 · 알림 설정 | 추가만 하는 감사(5년) · 알림 · 메일 |
| `dbm-theme` · `dbm-density` · `dbm-start` · `dbm-mode-*` 등 | 개인 환경 | 사용자 환경 설정(서버 저장 또는 브라우저 유지) |

### 1.2 규칙의 무게 — 어디에 두나
- **화면에서 바로 보여야 하는 규칙**: 입력 중 표준 판정 점(●) · 자동완성 · 용어 분해 · 물리명 미리 보기 · 권한에 따른 버튼 숨김. 지연 없이 보여야 하므로 브라우저에서도 돈다.
- **서버가 최종 판정해야 하는 규칙**: 결재 승인 직전 재검사 · 권한 · 잠금 · 결재선 · 자기 승인 · 위임 · 열람 범위 · 영구 삭제 · 공표. 브라우저 판정은 참고일 뿐이다.
- 그래서 같은 규칙이 **두 곳에서 같은 결과**를 내야 한다. 목업 리뷰에서 가장 많이 나온 결함이 “화면마다 판정이 다르다”였다(29 · RBAC 2차). → **규칙 패키지 하나를 프런트와 서버가 함께 쓴다**(§2.2).

### 1.3 이미 결정된 제약
| 항목 | 결정 | 근거 |
|---|---|---|
| 캔버스 · 공동 편집 | React Flow + elkjs + **Yjs 실시간 공동 편집**(잠금 없음, 사용자별 되돌리기) | ux/03 §12 · §13, 20 §3 |
| 동시 사용 | 6~20명, 영역 권장 300 엔터티, 시스템 전체 1,000 엔터티 | 00-inputs 1-2, 23 §6 |
| 사전 검색 | trigram 색인 3열(이름 · 약어 · 초성), 2글자 이하 앞부분 일치, 1,000건까지만 셈 | 23 §6-1 |
| 엑셀 | 20MB · 10만 행, **스트리밍 읽기만** | 23 §6-4 |
| 대상 DBMS(DDL) | Oracle · PostgreSQL · Tibero · MySQL/MariaDB | 00-inputs 1-7 |
| 사전 구성 | 공통표준(읽기 전용) + 기관 사전 1개 | 00-inputs 1-6 |
| 인증 | 자체 ID · 비밀번호 + 사내 SSO 선택, 감사 로그 5년 | ux/14, 00-inputs §5 |
| 메타데이터 | SWS 시나리오만 참조해 재구현(코드 공유 없음) | spec 30, 21 |

## 2. 기술 선택

### 2.1 왜 TypeScript 한 언어인가 (권장)
| 기준 | TypeScript(Node) | Python(FastAPI, SWS · DocuCBD와 같음) |
|---|---|---|
| Yjs 서버 처리 | **원본 Yjs 그대로** — 승인 때 Y.Doc에서 스냅샷 · DDL · 판정을 바로 만든다 | `pycrdt`(Yjs 호환 포트) — 가능하지만 공동 편집 서버(Hocuspocus)는 Node로 따로 둬야 해 두 언어 |
| 규칙 공유 | **프런트와 같은 코드**(판정 · 분해 · 권한 · DDL) — 화면 판정 = 서버 판정 | 같은 규칙을 Python과 TS로 두 번 작성 · 맞춤 테스트 필요 |
| 엑셀 | exceljs 스트리밍(스파이크에서 측정 완료) | openpyxl read_only(SWS에서 검증) |
| 팀 익숙함 | 프런트 개발자와 같은 언어 | SWS · DocuCBD 경험 그대로 |
| 타입 · API 계약 | OpenAPI → 클라이언트 타입 자동, 규칙 패키지 타입 공유 | OpenAPI → TS 클라이언트 생성 |

**권장: TypeScript.** 이 제품의 차별점은 “캔버스에서 표준을 지키게 하는 것”이고, 그 판정이 브라우저 · 공동 편집 서버 · API 세 곳에서 같아야 한다. 한 언어면 규칙을 한 번만 쓴다. Python을 고르면 공동 편집 서버(Node)와 API(Python)를 두 언어로 운영하고 규칙을 이중으로 유지해야 한다. (§11 결정 B-1)

### 2.2 저장소 구조 (모노레포, pnpm workspace)
```
neodb/
├ apps/
│  ├ web/            React 18 · Vite · TS · TanStack Query · Zustand · React Flow · Yjs (목업 → 제품)
│  ├ api/            NestJS(Fastify) — REST /api/v1, 인증 · RBAC · 업무 모듈, OpenAPI
│  ├ collab/         Hocuspocus — Yjs WebSocket /collab, 인증 · 잠금 확인 · 저장 훅
│  └ worker/         pg-boss 작업 처리 — 엑셀 · 산출물 · 공식 ERD(헤드리스 Chromium) · 만료 · 메일
├ packages/
│  ├ rules/          ★ 권한표 PERMS · canUser · 결재선 · 자기 승인 · 위임 · 사전 검사 · 용어 분해 · 표준 판정 · 물리명 · 타입 변환 · DDL 생성
│  ├ domain/         엔터티 타입 · 상태 enum · 오류 코드 · 문구 키(디자인 가이드 §11 기준어)
│  ├ db/             Drizzle 스키마 · 마이그레이션 · 시드(공통표준 판 적재)
│  ├ model-doc/      Yjs 문서 구조(엔터티 · 속성 · 관계 · 보기 · 메모) ↔ JSON 스냅샷 변환
│  └ api-client/     OpenAPI 생성 클라이언트(web이 씀)
├ infra/             docker-compose · nginx · 백업 스크립트 · 운영 문서
└ docs/              (지금 저장소의 docs를 옮기거나 링크)
```
- `rules`는 **순수 함수**(입출력만, DB · DOM 없음)로 만들어 브라우저 · API · collab · worker가 그대로 쓴다. 목업 `app.js`의 `canUser` · `lineGaps` · `checkItem` · `decompose` · `physOf` 등이 출발점이다.

## 3. 모듈 구성 (API 서버)

| 모듈 | 하는 일 | 주요 화면 |
|---|---|---|
| `iam` | 계정 · 로그인 · 세션 · SSO · 잠금 · 임시 비밀번호 · 역할 · 담당 시스템 · 소속 · 사용 기한 · 조회 범위 · 위임 | 로그인 · 설정 › 사용자 · 마이페이지 |
| `org` | 기관 설정 · 결재 정책 · 사업 · 관리 변경 확인(두 사람) | 설정 › 기관 · 결재함 › 확인 요청 |
| `catalog` | 시스템(DBMS · 스키마 · 명명 템플릿) · 업무 영역(만들기 · 이름 · 옮기기 · 복제 · 중지) | 시스템 홈 · 설정 › 시스템 |
| `dictionary` | 단어 · 도메인 · 용어 · 코드 · 엔터티 용어 · 도메인 그룹 · 분류 · 공통표준 판 · 검색 · 변경 내역 · 공표 · 영구 삭제 | 표준 사전 메뉴 전체 |
| `types` | 타입 등록부 · 시스템별 매핑 · 타입 요청 · 타입 규칙 버전 | 데이터 타입 · 축약명 |
| `rules-policy` | 검수 기준(정책 버전) · 표준 제외 규칙 | 검수 기준 |
| `approval` | 결재 문서 · 단계 · 결재선 스냅샷 · 승인 · 반려 · 회수 · 항목별 반려 · 재검사 · 의존 · 열람 범위 | 결재함 |
| `intake` | 엑셀 업로드 묶음 · 스트리밍 검사 · 보류 · 재검증 · 후보 큐 | 엑셀 가져오기 · 업로드 이력 · 후보 큐 |
| `modeling` | 모델 버전(작업본 · 확정본) · 잠금 상태 · 확정 신청 · 스냅샷 · 보기 · 메모 · 영역 이동 · 엑셀 정의서/DDL 가져오기 · 판정 투영 | 모델 · 표준 맞추기 · 용어 자동분석 |
| `outputs` | DDL · 산출물(엑셀 · 정의서) · 공식 ERD · 내려받기 감사 | DDL · 산출물 |
| `audit` | 추가만 하는 감사 로그 · 영구 삭제 기록 · 내려받기 기록 | 감사 로그 |
| `notify` | 앱 알림 · 메일(결재선 담당자만) · 알림 설정 | 상단 알림 |

**모듈 사이 규칙**
- 모듈은 자기 테이블만 쓴다. 다른 모듈 데이터는 서비스 호출 또는 **도메인 이벤트**(같은 트랜잭션 안 outbox 테이블)로 받는다. 예: `approval`이 사전 신청을 최종 승인 → `dictionary.applyDocument()` 호출(같은 트랜잭션) → `audit` · `notify`는 outbox 이벤트로.
- 권한은 컨트롤러 가드 한 곳(`@Can('dict.request', ctx)`)과 서비스 안 재검사(실행 직전) 두 번 — 둘 다 `packages/rules`의 `canUser`.

## 4. 데이터 설계 (요지)

### 4.1 원칙
- **PostgreSQL 하나**에 다 둔다(6~20명, 내부망 단일 서버). 스키마로 모듈을 나눈다(`iam` · `dict` · `appr` · `model` · `audit` …).
- 기준 데이터(사전 · 타입 · 정책)는 **행 단위 버전**(항목 버전 + 변경 내역 행). 결재 문서는 신청 당시 값을 **스냅샷**으로 갖는다(결재선 · 정책 버전 · 시스템 코드 `sysAt`).
- 모델은 **Yjs 문서가 원본**(작업본), 확정은 **불변 JSON 스냅샷**. 검색 · 준수율 · 용어 사용처는 스냅샷/작업본에서 만든 **투영 테이블**(`model.entity_idx` · `model.attr_idx`)로 본다.
- 감사 로그는 **추가만**(UPDATE · DELETE 권한 없음), 월 단위 파티션, 5년 보관.
- 시간은 `timestamptz`로 저장하고 화면 표시는 디자인 가이드 §11.3 형식으로(목업의 ‘11/17 15:02’ 문자열은 시드에서 변환).

### 4.2 주요 테이블 (1차)
| 스키마 | 테이블 | 메모 |
|---|---|---|
| `iam` | `users`(kind 내부/외주/감리, project_id, until, view_scope, view_why, status, pw_hash, pw_temp, sess_rev) · `user_roles` · `user_systems` · `sessions` · `delegations`(from, to, 기간) · `reserved_ids` · `auth_policy` | 역할 · 담당은 행으로(감사에 전후 기록 쉬움) |
| `org` | `org_settings`(결재 정책 · 운영 목표, 버전) · `projects` · `admin_requests`(kind, before, after, status, untilMs) | |
| `catalog` | `systems`(code, dbms — **변경 불가**, schema, 명명 템플릿) · `areas`(system_code, owner, off, final_model) · `area_moves` | 시스템은 코드로 참조(이름 변경 안전) |
| `dict` | `words` · `domains` · `terms` · `codes` · `entity_terms` · `domain_groups` · `domain_classes` · `common_editions` · `changes`(변경 내역) · `publications`(제정차수) · `purge_log` | `name` · `abbr` · `chosung` trigram GIN, 항목 `ver`, `pending_doc` |
| `types` | `logical_types` · `type_maps`(system_code, 규칙[]) · `type_requests` · `type_rule_versions` | |
| `policy` | `rule_policies`(검수 기준 버전, 값 JSON) · `exclusion_rules` | |
| `appr` | `documents`(type dict/model, step, line[], policy_ver, sys_at, req, cc[], key — 같은 key 진행 중 중복 금지) · `doc_items`(항목, 항목별 반려) · `doc_history`(act, who, for_id(대리), self) · `doc_snapshots`(모델 제출본) | 단계 전이는 상태 머신 하나(§5.2) |
| `intake` | `batches`(파일 · 기준점 · 집계 · 상태) · `batch_rows`(행 · 판정 · 보류) · `baselines` · `candidates` · `candidate_locations` | 10만 행 → `batch_rows` COPY 적재 |
| `model` | `model_versions`(area, ver, state edit/review/confirmed, base_ver, rev) · `ydocs`(area, ver, update bytea, 압축 · 주기적 병합) · `snapshots`(불변 JSON) · `views` · `memos` · `entity_idx` · `attr_idx`(논리명 · 물리명 · 용어 id · 판정) | 작업본은 Yjs, 확정본은 snapshot |
| `outputs` | `exports`(파일 · 버전 · 보안 컬럼 수 · 사유) | 내려받기 감사와 연결 |
| `audit` | `events`(at, who, act, target, why, sys_code, kind 관리/업무) | 감리 열람 범위는 `kind` · `sys_code`로 |
| `notify` | `notifications` · `notify_prefs` · `mail_outbox` | |
| `jobs` | pg-boss 테이블 | |

## 5. 핵심 흐름의 서버 설계

### 5.1 사전 신청 → 결재 → 반영
1. 화면(바구니 · 직접 등록 · 엑셀)이 항목을 모아 `POST /approvals`(type=dict). 서버가 `rules.checkItem`으로 **다시 검사**하고, 같은 항목이 진행 중이면 막는다(MD-10). 결재선은 `rules.lineFor` + `lineGaps`로 계산해 **문서에 스냅샷**.
2. `POST /approvals/{id}/approve` — 실행 직전에 권한(`canUserAct` — 자기 승인 · 위임 · 독립성), 단계 일치, 재검사. 마지막 단계면 **같은 트랜잭션에서** `dictionary.apply`(새 항목 V1 · 기존 항목 버전 +1 · 변경 내역 행).
3. 공표는 DA가 따로(`POST /dictionary/publications`) — 제정차수 올림.

### 5.2 결재 상태 머신 (문서 공통)
```
draft? → da ─승인→ final ─승인→ done
          │  └(최종 없음 · 자기 승인 아님)→ done
          ├반려→ rejected     final ─반려→ rejected
          └회수(신청자)→ withdrawn
자기 승인 → 최종 단계 자동 부착(독립 최종 승인자 필수, 29 R-02)
```
- 단계 전이는 `appr` 모듈 한 곳에서만. 동시 승인은 `UPDATE … WHERE step = $expected` 낙관적 검사로 막는다.
- 열람 범위(결재 중 = 신청자 · 결재선만, 끝난 문서 = 조회 범위)는 `rules.canUserSeeDoc` 하나로 목록 · 상세 · 검색 · 감사에 똑같이.

### 5.3 모델 — 공동 편집과 확정
```
web ──WebSocket /collab?area=e_hr&ver=5──▶ collab(Hocuspocus)
         onAuthenticate: 세션 쿠키 → 사용자 → rules.canUser('model.edit',{area}) · 잠금 상태(edit만 쓰기)
         읽기만 가능한 사용자 → readOnly 연결(조회 전용)
         onStoreDocument: ydocs에 update 추가(디바운스 2초) · 투영 갱신 작업(pg-boss) 등록
web ──POST /areas/e_hr/versions/5/submit──▶ api
         Y.Doc 최신 상태 → model-doc.toSnapshot() → 미준수 재검사 → snapshots 저장 → 문서 생성 → 버전 state=review
         review 동안 collab는 새 쓰기 연결을 거부하고 열린 연결은 readOnly로 바꾼다(브로드캐스트)
최종 승인 → state=confirmed, 다음 작업 버전은 [v6 작업 시작]에서 snapshot을 복사해 새 Y.Doc
```
- Yjs 문서는 업무 영역 · 버전마다 하나(권장 300 엔터티 ≈ 450KB, 스파이크 측정). 보기 · 메모도 같은 문서의 별도 맵.
- 판정 투영(`attr_idx`)은 저장 훅에서 비동기로 — 준수율 · 용어 사용처 · 전체 검색이 이것을 읽는다.

### 5.4 엑셀 · DDL 가져오기
- 업로드 → 파일 저장 → pg-boss 작업 → exceljs **스트리밍** 읽기 → `rules.checkItem` 행별 판정 → `batch_rows` COPY → 진행률 알림. 20MB · 10만 행 상한은 업로드 단계에서 막는다.
- 엑셀 정의서(26) · DDL 가져오기는 `model-doc`으로 엔터티 · 관계를 만들고 **새 작업본 Y.Doc**에 적용(병합 · 덮어쓰기 계획을 미리 계산해 확인 뒤 적용, 취소는 직전 rev 비교).

### 5.5 산출물
- DDL: `rules.ddl(snapshot, dbms, 명명 템플릿, 타입 매핑)` — 4종 방언. 점검(차단 · 경고)을 먼저 돌려 차단이 있으면 내려받기 막음.
- 엑셀 산출물 · 정의서: worker에서 exceljs 스트리밍 쓰기.
- 공식 ERD(PDF · PNG · SVG): worker가 헤드리스 Chromium으로 web의 인쇄 전용 경로를 렌더(확정본 배치 · 표제란).
- 모든 내려받기는 `outputs.exports` + 감사(개인정보 컬럼 목록은 사유 필수, 29 R-14).

## 6. API 설계 원칙
- REST JSON `/api/v1`, OpenAPI 3.1 자동 생성 → `api-client` 타입 생성.
- 목록: 커서 페이지 + 정렬 · 필터 쿼리, 사전 검색은 23 §6-1 규칙(1,000건 캡 · 2글자 앞부분 일치).
- 변경 요청은 **낙관적 잠금**(`If-Match: rev`), 같은 제출 재시도는 `Idempotency-Key`로 한 번만.
- 오류는 `{ code, message, field?, detail? }` — `code`는 `packages/domain`의 오류 코드, `message`는 디자인 가이드 §11.2 형식(“{동작}하지 않았습니다. {원인}. {다음 행동}”).
- 권한 실패는 403 + 이유(`{역할}만 {동작}할 수 있습니다`), 범위 밖 대상은 404가 아닌 403(목업 결정: 조용히 다른 영역을 보여 주지 않음).
- 실시간 갱신(알림 · 결재 상태 · 잠금 변경)은 **SSE** `/api/v1/events` 하나(공동 편집은 WebSocket /collab).

### 6.1 목업 함수 → API (예)
| 목업(app.js) | API |
|---|---|
| `getDocs()` · `canSeeDoc` · `myQueue` | `GET /approvals?box=queue|mine|cc|all` |
| `createDoc(o)` | `POST /approvals` |
| 결재함 `act('approve'|'reject'|'withdraw')` | `POST /approvals/{id}/approve|reject|withdraw` |
| `getDict()` · 통합 검색 | `GET /dictionary/search?q=&kind=` |
| `applyDictDoc(d)` | (내부) 최종 승인 트랜잭션 |
| `getModelData(area, ver)` · `setModelData` | `WS /collab` · `GET /areas/{id}/versions/{ver}/snapshot` |
| `modelLock(area)` | `GET /areas/{id}/state` |
| `createAdminReq` · `applyAdminReq` | `POST /admin-requests` · `POST /admin-requests/{id}/confirm|reject|cancel` |
| `pushAudit(e)` | (내부) 감사 이벤트 — 화면에서 직접 쓰지 않음 |

## 7. 인증 · 권한 · 감사
- **세션**: 서버 세션(PostgreSQL `iam.sessions`), httpOnly · Secure · SameSite=Lax 쿠키, 유휴 30분(설정값). 역할 회수 · 사용 중지 · 기한 만료 시 `sess_rev`로 열린 세션 종료(14 §7, 29).
- **비밀번호**: argon2id, 정책(길이 · 문자 · 90일) 서버 검사, 임시 비밀번호는 한 번 보여 주고 첫 로그인에서 바꾸기 전에는 결재 권한 잠금(29 R-05).
- **SSO**: SAML 2.0(passport-saml 계열) · OIDC(openid-client). 불변 식별자로 계정 연결, Admin 비상 로그인 유지(14).
- **권한**: `packages/rules`의 PERMS · `canUser`(역할 × 할 수 있는 일 × 범위 — 담당 시스템 · 조회 범위 · 사전 문서는 기관 전체) — 컨트롤러 가드 + 서비스 재검사 + collab 인증 훅에서 같은 함수.
- **두 사람 확인**: 느슨해지는 결재 정책 · 높은 역할 부여는 `org.admin_requests`(신청자 · 대상자 제외, 7일 자동 만료 — worker 정기 작업).
- **감사**: 모든 쓰기 서비스가 같은 트랜잭션에서 `audit.events` 추가(전후 값 · 사유 · 시스템 코드 · 관리/업무 구분). DB 계정은 INSERT · SELECT만.

## 8. 배포 · 운영 (내부망)
```
[nginx :443] ─┬─ /            → web 정적 파일
              ├─ /api/        → api (Node, 2 프로세스)
              ├─ /api/v1/events (SSE)
              └─ /collab      → collab (Node, 1 프로세스, WebSocket)
worker (Node, 1 프로세스 + 헤드리스 Chromium)
PostgreSQL 16 (pg_trgm) ─ 일일 전체 백업 + WAL 보관(PITR)
/data/files (업로드 · 산출물 볼륨)
```
- Docker Compose 한 벌, 외부 CDN 없음(글꼴 · 라이브러리 자체 호스팅 — 디자인 가이드 §10).
- 설정은 `.env` + 기관 설정 화면. 비밀값(DB · SSO 인증서)은 파일 마운트.
- 관측: 구조화 로그(JSON · 요청 ID), `/healthz` · `/readyz`, 느린 쿼리 로그. 사용자 활동은 감사 로그와 분리.
- 버전 표기 `주.부.수정 + 빌드`(00-inputs §5), DB 마이그레이션은 배포 때 자동 · 되돌림 스크립트 동봉.

## 9. 품질 · 테스트
- `packages/rules`: 단위 테스트 — **목업 시나리오를 테스트 케이스로**(자기 승인 · 위임 · 결재 공백 · 조회 범위 · 용어 분해 · 표준 판정 · DDL 방언). 같은 테스트를 브라우저 빌드에서도 돈다.
- API: Testcontainers(PostgreSQL) 통합 테스트 — 권한 우회 · 동시 승인 · 중복 신청 · 열람 범위.
- collab: 두 클라이언트 동기화 · readOnly 전환 · 잠금 전이 테스트(스파이크 `yjs-sync` 재사용).
- E2E: Playwright — 목업의 역할별 회귀 점검(29 · 30에서 쓴 계정 × 화면 목록)을 그대로 옮긴다.
- 성능 회귀: 스파이크 숫자(23 §6)를 CI 기준선으로(사전 검색 · 300 엔터티 렌더 · 10만 행 엑셀).

## 10. 단계 (구현 웨이브와 맞춤)
| 단계 | 범위 | 끝나는 기준 |
|---|---|---|
| **B0 기반** (2주) | 모노레포 · CI · Docker Compose · DB 마이그레이션 · `iam`(로컬 로그인 · 세션 · 역할 · 담당) · RBAC 가드 · 감사 · OpenAPI · web 셸(목업 레이아웃) | 역할별 로그인 → 메뉴 · 403이 목업과 같다 |
| **B1 사전 · 결재** (4주, W1 핵심) | `dictionary`(공통표준 적재 · 기관 사전 · 검색 trigram) · `approval` 상태 머신 · 바구니 신청 · 직접 등록 · 반영 · 변경 내역 · 공표 · 후보 큐 | 사전 신청 → DA → 최종 → 반영 → 변경 내역이 목업 시나리오대로 |
| **B2 모델 · 공동 편집** (4주) | `catalog` · `modeling` · collab(Hocuspocus · 인증 · readOnly) · 확정 신청 · 스냅샷 · 판정 투영 · 표준 맞추기 | 두 사람 동시 편집 → 확정 신청 → 승인 → 확정본 |
| **B3 가져오기 · 산출물** (3주) | `intake` 엑셀(스트리밍 · 보류 · 재검증) · 엑셀 정의서 · DDL 가져오기 · `outputs` DDL 4종 · 엑셀 산출물 · 공식 ERD | 10만 행 엑셀 · DDL 4종 · 공식 ERD |
| **B4 관리 · 외부 계정** (2주) | `types` · `rules-policy` · `org`(사업 · 두 사람 확인) · 위임 · 조회 범위 · SSO · 메일 · 기한 만료 작업 | 29 RBAC 2차 시나리오 전체 |
| **B5 운영 준비** (1~2주) | 백업 · 복구 리허설 · 성능 회귀 · 보안 점검(세션 · 권한 우회 · 업로드) · 설치 문서 | 내부망 설치 리허설 통과 |

## 11. 결정이 필요한 것
| # | 질문 | 1차안 | 다른 안 |
|---|---|---|---|
| B-1 | **백엔드 언어** | TypeScript(NestJS) 한 언어 — 규칙 공유 · Yjs 원본. B0에서 망 반입 · 부하 · 복구로 검증(§13.8) | Python(FastAPI) — SWS · DocuCBD 경험, 공동 편집 서버만 Node |
| B-2 | 저장소 | **지금 DBModeler 저장소에 apps/ · packages/ 추가**(목업 · 규칙 · 구현을 한 변경에서 검토 — Codex 의견) | 새 저장소 neodb(접근 권한 · 릴리스 소유가 분리돼야 할 때) |
| B-3 | 파일 저장 | 로컬 볼륨 | MinIO(S3 호환) — 이중화 · 백업 정책이 있으면 |
| B-4 | ORM | Drizzle(SQL에 가까움 · 마이그레이션 SQL 검토) | Prisma(생산성) · TypeORM(NestJS 기본) |
| B-5 | 공식 ERD 렌더 | 서버 헤드리스 Chromium | 브라우저에서 만들어 올리기(서버 의존 없음, 공식성은 약함) |
| B-6 | 첫 배포 대상 | 단일 서버 Docker Compose | 기관 Kubernetes가 있으면 Helm |

## 12. 위험
- 아래 외에 Codex 검토로 드러난 위험과 대응은 §13.
- **Yjs 문서와 관계형 투영의 어긋남**: 투영은 저장 훅 비동기 — 확정 신청 · 승인은 항상 Y.Doc/스냅샷에서 다시 계산한다(투영은 조회용).
- **규칙 패키지가 커짐**: 목업 `app.js`(2,500줄+)의 규칙을 그대로 옮기지 말고, 화면 코드와 섞인 부분을 떼어 순수 함수로 다시 쓴다. 목업은 **사양 · 테스트 기준**으로 쓴다.
- **내부망 제약**: npm · 컨테이너 이미지 반입 절차가 있으면 오프라인 설치 묶음(이미지 tar · 의존성 캐시)을 B0에서 만든다.
- **목업 시드 형식**: 날짜 문자열 · 이름 기반 참조(`who` 이름) 등은 시드 변환에서 id · timestamptz로 바꾼다.

## 13. 검토 반영 (v1.1, Codex [codex-backend-v1](review/codex-backend-v1.md) BA-01 ~ 14)
> 아래가 §3 ~ §10의 해당 부분보다 우선한다.

### 13.1 모델 저장 · 확정 신청 (BA-01 · 03)
- **버전별 쓰기 주인은 collab 하나**: 업무 영역 · 버전 키마다 collab 프로세스 하나만 Y.Doc을 쓴다. 갱신은 증가하는 순번(`seq`)으로 `model.ydoc_updates`에 내구 저장하고, 주기적으로 체크포인트(`ydoc_checkpoints`, 문서 스키마 버전 포함)를 만든 뒤 그 이전 갱신을 정리한다. 재시작은 체크포인트 + 이후 갱신 재생.
- **저장 ACK**: 클라이언트는 서버가 내구 저장한 순번을 받기 전까지 ‘저장 중’으로 표시한다(목업의 저장 상태 표시와 같음).
- **확정 신청 = 고정 → 검증 → 커밋**:
  1. API가 collab에 고정 요청(내부 RPC) → collab이 그 키의 **새 쓰기를 거부**하고 대기 중 갱신을 모두 내구 저장 → 고정 순번 · 시각 · **정규화 제출본 해시**를 돌려준다.
  2. API가 고정 순번까지의 문서로 스냅샷을 만들고 재검사 → **한 트랜잭션**에서 `model.snapshots`(불변, 해시) · 결재 문서(스냅샷 ID · 해시 참조) · 버전 상태 `review` · 감사를 커밋.
  3. 실패하면 고정을 풀고 편집을 재개한다. 고정 여부는 DB 상태로 복구된다(재시작 안전). 중복 제출은 고정 순번 + 멱등 키로 한 번만.
- **쓰기 검증**: 갱신을 적용하기 전에 구조 · 참조 무결성(지운 엔터티를 가리키는 관계, 참조 사본 수정 등)을 검사해 거부한다. 표준 미준수는 편집 중 표시만 하고 제출에서 막는다. 갱신 크기 · 빈도 상한을 둔다.
- 보기 · 메모: 공유 보기 · 메모는 Y.Doc, 개인 설정(마지막 보기 · 상세도)은 사용자 환경 테이블 — 소유를 겹치지 않는다.

### 13.2 열람 범위는 쓰기 권한과 따로 (BA-02)
- collab 접속 판정 = 세션 유효 × 조회 범위 × **검토 상태**. `review`가 되면 결재선 · 신청자가 아닌 연결은 **구독을 끊고** 영역 화면은 마지막 확정본 스냅샷으로 돌린다(목업 `areaView`).
- 직접 주소 · 검색 · 집계 · 참조 미리보기 · SSE · 산출물에 같은 필터(`rules.canUserSeeDoc` · `areaView`). 존재 자체를 숨겨야 하는 대상의 응답 코드는 대상 종류별로 한 가지로 정한다.

### 13.3 판정 투영의 신선도 (BA-04)
- 투영 행에 `area · ver · 원본 seq/스냅샷 해시 · dict_gen · type_gen · policy_gen`을 기록한다. 사전 · 타입 · 정책이 바뀌면 세대가 오르고, **역참조 색인**(단어 → 용어 → 속성, 도메인 → 용어 → 속성)으로 영향 범위만 다시 판정한다. 오래된 작업 결과는 새 결과를 덮지 못한다(세대 비교).
- 투영은 조회용. 승인 · 공식 산출 · 사전 삭제 제한 같은 결정은 원본(스냅샷 · 사전)에서 다시 계산한다. ‘판정 갱신 중’ 표시와 전체 재구축 명령을 둔다.

### 13.4 결재 전이표 · 사전 항목 예약 (BA-05 · 06)
- 문서 유형별 **전이표**(단계 · 행위자 · 필수 사유 · 실패 결과 · 부수 효과)를 `packages/rules`에 데이터로 둔다. 회수는 진행 중 어느 단계에서나 신청자만, 반려 · 회수되면 모델 버전은 `edit`로 돌아가 편집 재개, 재신청은 새 제출본. 재검사 실패는 반영 없이 이력만. 승인 · 회수 경쟁은 문서 리비전 비교.
- 결재선 스냅샷 = 신청 당시 단계 · **시스템 코드** · 정책 버전(최종 승인 설정은 시스템 단위 — 목업 `lineFor`의 영역 키는 구현 때 시스템 키로). 실제 자격(위임 · 자기 승인 · 독립성)은 실행 때 다시 평가.
- **사전 항목 예약**: 수정은 항목 ID + 기대 버전, 신규는 종류 · 정규화 이름/약어 키로 `dict.item_reservations`(고유 제약)에 예약 — 서로 다른 바구니 · 엑셀 묶음의 같은 항목 경합을 DB가 막는다. 부분 반려는 그 항목 예약만 풀고 의존 항목을 다시 검사. 재검사 · 반영 · 변경 내역 · 예약 해제 · 문서 완료를 한 트랜잭션.

### 13.5 트랜잭션 소유와 outbox (BA-07)
- 유스케이스마다 트랜잭션 주인을 정한다(확정 신청 = modeling, 사전 승인 = approval, 사업 종료 = org). 다른 모듈은 **공개 명령**을 같은 트랜잭션 핸들로 실행한다.
- **감사는 업무 변경과 같은 트랜잭션**, 알림 · 투영 · 파일 처리 · 메일은 outbox → worker(업무 키로 중복 억제 · 재시도 · 실패 목록).
- 모델 스냅샷은 modeling이 소유, 결재 문서는 ID · 해시로 참조(내용을 두 번 저장하지 않음).

### 13.6 세션 · 인증 · 감사 통제 (BA-08 · 09)
- 세션: 유휴 · 절대 만료, 로그인 · 권한 변경 때 세션 ID 교체. 회수 · 중지 · 기한 만료 · 비밀번호 초기화는 **모든 프로세스에 전파**(PostgreSQL LISTEN/NOTIFY) — WS는 갱신 수신마다, SSE는 전달 때 자격 확인, 작업은 실행 · 공개 · 내려받기 때 재확인.
- 임시 비밀번호: 일회용 · 24시간 · **변경 전용 세션**(14 §8), 발급 버전 · 소비 · 세션 교체를 원자적으로.
- CSRF(쿠키 세션이므로 토큰 또는 SameSite+Origin 검사), WS Origin 검사, 출처 · 계정별 시도 제한, 운영 설치에서 목업 계정 제외 · 최초 관리자 발급 절차.
- SSO는 발급자 + 불변 식별자로 연결, 비상 로그인은 지정 관리자 · 접속 경로 제한 · 경보.
- 감사 행: 불변 실행자 ID + 당시 이름 · 대리 대상 · 결과 · 사유 · 시스템 범위 · 관리/업무 구분(감리 열람 범위 29 R-12).

### 13.7 입력 근거 고정 · 복구 · 내부망 (BA-10 · 11 · 12)
- 엑셀 검증 결과에 기준본 ID · 항목 버전 · 파일 해시 · 검수 기준 버전 · 비교한 사전 세대 · 행별 선택을 묶는다. 신청 때 입력이 바뀌었으면 재검증. 압축 해제 크기 · 셀 수 · 처리 시간 상한.
- 공식 산출물에는 스냅샷 해시 · 타입 규칙 버전 · 명명 템플릿 버전 · 렌더러 버전을 기록 — 같은 확정본은 같은 결과.
- 백업: 기관과 **RPO · RTO**를 정하고, DB(전체 + WAL)와 파일(불변 키 · 체크섬 목록)을 **별도 장애 영역**에 암호화 보관. 새 장비 복구 리허설에서 세션 무효화 · 파일 대조 · 큐 재개 · 투영 재구축까지 확인.
- 내부망: B0에서 고정 버전 이미지 · 잠금 파일 · 해시 목록 · 사내 CA · Chromium 한글 글꼴을 포함한 **오프라인 설치 묶음**을 실제 망 분리 환경에 설치해 본다. 렌더러는 저권한 · 자원 제한 프로세스, 파일은 인증된 핸들러로만 제공. DB 연결 풀 · 작업 동시성 상한.

### 13.8 언어 선택 보강 (BA-13)
- TypeScript는 **기본안**으로 두되 B0에서 검증한다: 망 반입 · 저장/복구 · 실제 부하(300 엔터티 동시 편집 · 10만 행 엑셀 · 검사의 이벤트 루프 영향 → worker 분리). 팀 운영 경험이 Python 쪽에 확실히 있으면 **FastAPI 업무 API + Node collab** 분리안을 같은 사례(고정 입력 · 판정 사례)로 비용 비교한다.
- 규칙 패키지는 **공통 순수 계산**(브라우저 · 서버 공통)과 **서버 전용 판정**(DB 조회가 필요한 것)으로 나눈다. 같은 결과를 보장하려면 입력(사전 세대 · 정규화 · 시각 · 권한)을 명시적으로 넘긴다.

### 13.9 단계 다시 짜기 — W1 업무 완주가 종료 기준 (BA-14)
| 단계 | 범위 | 끝나는 기준 |
|---|---|---|
| **B0 기반 · 위험 검증** (2~3주) | 모노레포 · CI · 오프라인 설치 묶음(망 분리 설치 리허설) · DB 마이그레이션 · `iam` 최소(로컬 로그인 · 세션 · 역할 · 담당 · 회수 전파) · RBAC 가드 · 감사 · **collab 고정 · 제출 스파이크** · 백업/복원 리허설 | 역할별 로그인 · 403이 목업과 같다 · 제출 고정이 동시 편집에서 깨지지 않는다 · 복원이 된다 |
| **B1 W1 수직 완주** (6~8주) | 엑셀 정의서 가져오기 → 사전 신청 · 결재 · 반영(최소 정책 · 타입 규칙 · 열람 범위 포함) → 두 사람 편집 → 표준 맞추기 → 확정 신청 · 승인 → 게이트를 거친 DDL · 정의서 · 준수율 | **한 데이터로 S0 ~ S6을 끝까지**(20 §1 W1 정의) |
| **B2 W1 마무리** (3~4주) | 사전 엑셀 일괄(10만 행 · 보류 · 재검증) · 후보 큐 · 공표 · 공식 ERD · 데이터 타입 · 검수 기준 · 산출물 나머지 | 목업 W1 화면 전체 |
| **B3 관리 · 외부 계정** (2~3주) | 사업 · 두 사람 확인 · 위임 · 조회 범위 · 감리 · SSO(기관 IdP) · 메일 · 기한 만료 작업 | 29 시나리오 전체 |
| **B4 W2** | DDL 가져오기 · 영역 이동 · 통합 보기 고도화 등 W2 | 20 W2 |
| **B5 운영 준비** (1~2주) | 성능 회귀 · 보안 점검 · 복구 리허설 · 설치 문서 | 내부망 인수 시험 |
- 일정은 **개발 2~3명 · 기관 환경(망 분리 서버 · IdP) 접근 가능**을 가정한 대략값이다. 인력 · 접근 조건이 정해지면 다시 잡는다.
