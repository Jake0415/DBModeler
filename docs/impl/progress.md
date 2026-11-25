# NeoDB 구현 진행 기록

> 조정자가 갱신한다. 규칙: [00-orchestration-plan.md](00-orchestration-plan.md). 오케스트레이션이 멈추면 이 파일에서 이어 간다.

## 확인 필요 (사람)
> 자체 결정 · 보류 건. 응답: **확인**(그대로) · **뒤집기**(새 작업) · **방향 제시**(의견을 적으면 새 작업, 회차 0부터).

| 결정 | 작업 | 결정 종류 | W1 경로 막음 | 상태 | 응답 |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

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

## P0 준비 점검표
- [ ] Orca 에이전트 권한 확인 — 리뷰어 · 권한 감사관 읽기 전용
- [ ] Orca 오케스트레이션 · CLI 켜기, `orca status --json`, 스킬 설치
- [ ] Heartbeat 15분
- [x] Codex CLI ≥ 0.171.0 + Windows 샌드박스 셔임 재적용 + DBModeler 신뢰 등록 — 2026-11-25: 0.172.0, 셔임 재적용, 신뢰 등록. Claude Code 2.1.290 → 2.1.331(Fable 5.2 인식)
- [x] 모델 확인(계획 §3.3) — 2026-11-25: `gpt-6.2-sol` · `gpt-6.2-astra` · `claude-opus-5-5` · `claude-fable-5-2` 모두 경고 없이 응답, Codex 프로젝트 기본값 Sol · medium 적용 확인
- [x] 미커밋 목업 · 검토 문서 커밋 — 이미 커밋돼 있음(남은 것: `NeoDB-mockups-20261120.zip`·폴더, 빈 `model.html` — 사용자 판단)
- [x] worktree 준비 스크립트(DB 이름 · API 포트) — `scripts/worktree-env.ps1`, Codex Sol 리뷰 4회(수정 3회 + 후속 2건 반영, 기각 1건: `-Drop` 뒤 기록 저장 실패 시 기록 잔존 — 다음 실행이 DB를 다시 만들 뿐 해가 없음)
- [x] 시험 계정 시드 · DB 초기화 — `npm run db:seed:test` · `scripts/worktree-env.ps1 -Reset -Seed -TestAccounts`, 13개 계정(계획 §9.1). API 로그인 확인: 정상 4 · 임시 비밀번호 변경 요구(tdatmp) · 기한 만료(texp) · 사용 중지(tstop) 401 + 이유. Codex Sol 리뷰 3회(R-01~07: 수정 2회, 후속 F-001 · F-002, 기각 1건 — 빈 `?`/`#` 주소는 접속지가 같아 해 없음)
- [ ] 역할별 로그인 상태 저장 틀(Playwright storageState) — web · E2E 틀이 생기는 P1로 이동. 시나리오별 빠른 초기화(시드가 끝난 DB를 TEMPLATE으로 복제)도 P1 E2E 틀에서
- [x] PERMS → 권한 검사 표 생성기 — `packages/rules/src/matrix.ts`(권한 판정 637칸 + 결재 행위 6사례), 기준 파일 [rbac-matrix.md](rbac-matrix.md) · `e2e/rbac/perm-matrix.json`, 갱신 `npm run rbac:matrix`(사람 승인 뒤). 시험 계정 정의를 `@neodb/domain` TEST_ACCOUNTS로 옮겨 시드와 같이 씀. 문서 기대값 테스트 22개. Codex Sol 리뷰 3회(RBAC-01~07: 수정 2회, 보류 → 후속 F-003 감리 감사 로그 범위)
- [ ] 작업 목록(기능 → 목업 → API → 테스트 대응표)
- [ ] 목업 기준 스크린샷
- [ ] Orca 브라우저 탭 쿠키 공유 여부, `--effort max` 전달 여부 확인
