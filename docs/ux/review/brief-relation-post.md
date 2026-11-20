# 사후 검토 요청: ERD 관계 연결 · 설정 · 삭제 — 반영 결과 리뷰와 테스트

앞서 이 시나리오의 사전 검토를 받았고([claude-relation.md](claude-relation.md) · [codex-relation.md](codex-relation.md)), 그 결과를 반영해 커밋 **e034427**에 FE 목업으로 구현했습니다. 이번에는 **반영 결과**를 UX 전문가 겸 테스터 관점에서 검토하고 시험해 주세요.

- 확정 설계: `docs/ux/18-relation-scenario.md`
- 결정 기록(엇갈린 결정 R1~R6과 이유): `docs/ux/review/resolution-relation.md`
- 구현: `docs/ux/mockups/model.html`의 `// ---- relations (18)` 블록(makeRel · rolePop · childPicker · relPanel · relSetKind · relSetCard · relSetOpt · relSetDel · relMap · relDelete · doRelDel · syncUk · cascadeChain · cascadeBlockers · normalizeGroups), 캔버스 click의 `tool === 'rel'` 분기, 키 처리(R · Delete), `assets/app.js`의 `fkOf` · `modelDiff`, `ddl.html`의 FK · UK 출력, `approvals.html`의 `drawDiff`
- 미리보기: http://localhost:5178/model.html?area=e_hr (인사관리) · `ddl.html?area=e_hr` · `approvals.html`
- 모델 데이터는 브라우저 localStorage `dbm-mdata-<area>-v5`에 저장된다. 시험 전후로 지우면 시드로 돌아간다.

## 부탁하는 것

1. **설계 대비 구현 검증.** 18 문서의 연결 규칙 · 패널 · 삭제 조건 표 · 산출물 연동이 코드에 맞게 구현됐는지. 어긋나는 곳은 줄 번호와 함께.
2. **결정 R1~R6 평가.** 각 결정이 DA# · ERwin에 익숙한 모델러에게 맞는지, 바꾸거나 보완할 점이 있는지(동의 / 보완 / 반대 + 이유).
3. **시험(테스트).** 아래 시나리오를 실제로 실행하거나(브라우저 · 헤드리스 가능하면) 코드 추적으로 판정하고, **통과 / 실패 / 판정 불가**와 근거를 적는다. 실패는 재현 절차 · 기대 · 실제를 적는다.
   - T1 일반 연결(부서→자격증): FK 1개, 0..N, 반드시, 막기, SET NULL 비활성
   - T2 식별 연결과 손자 전파, 식별↔비식별 전환 미리보기 → [적용] / [취소] / Esc
   - T3 이름 충돌 · 같은 방향 두 번째 관계(부서→사원): 역할 팝오버, Enter 확정, Esc 연결 취소(모델 원상 복구), 실행 취소 스택
   - T4 재귀(부서→부서): 확인 1회, 기존 재귀 안내, [기존 관계 열기]
   - T5 부모 PK 없는 엔터티에서 연결: FK 대기, [식별자 지정], 이후 PK 지정 시 FK 채움
   - T6 1:1 비식별: UK 추가/삭제, DDL `UNIQUE`, 식별 전환 시 UK 처리
   - T7 선택성 · ON DELETE: SET NULL 제약, 반드시로 바꿀 때 막기로 복귀, CASCADE 연쇄 · 막기 차단 안내, DDL `ON DELETE`
   - T8 FK 짝 변경(relMap): 다른 컬럼 지정, (없음), 복합 PK(급여기본→급여상세)
   - T9 삭제 조건 표 전 경우: M:N · FK 0개(바로 삭제), 비식별, 역할/재귀, 식별(손자 있음/없음, 다른 PK 있음/없음), 포커스 · 300ms · Esc, 실행 취소 한 번으로 전부 복원
   - T10 조회 전용 · 결재 중(as=다른 역할, 결재 중 버전): 패널 비활성, 키보드 R · Delete 차단
   - T11 결재 비교(modelDiff): 관계 추가 · 변경 · 삭제, ‘DB 동작 변경’ 묶음, CASCADE 경고 — 특히 **이전 확정본과 현재 모델의 관계 식별 방식**이 변경을 정확히 잡는지
   - T12 키보드 · 접근성: R → 자식 고르기, 포커스 복귀, aria-live, 텍스트 입력 중 단축키
   - 그 밖에 찾은 경계 상황
4. **남은 문제와 수정안.** 심각도(높음 · 중간 · 낮음) · 대상(파일:줄) · 문제 · 근거 · 권장 수정안.

## 형식

- 한국어로 씁니다.
- 구성: ① 요약(한 단락) ② 시험 결과 표(T1~T12 + 추가) ③ R1~R6 평가 표 ④ 지적 목록(15건 이내, 심각도 순).
- 코드는 고치지 말고 결과 파일만 씁니다. 시험으로 바꾼 localStorage는 끝에 지웁니다.
