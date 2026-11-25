# 작업 지시서(spec) 양식 — 조정자가 작업마다 채워 `worker-start --spec-file`로 넘긴다

```
역할: <be | fe | contract | collab | ux | scenario-qa | reviewer | qa | rbac-auditor>
먼저 읽기: docs/impl/roles/_common.md, docs/impl/roles/<역할>.md
작업: <Task ID> <제목>   (docs/impl/01-task-list.md 의 ID)
난이도: L1|L2|L3|L4 — 이유(L3 이상 필수)
모델 · effort: <조정자가 실행에 쓴 값>   회차: 처음 | 수정 n (앞 회차 지적은 아래 '앞 회차')
기준 문서: 목업 <파일 · 화면/상태> · 설계 <절> · 흐름 <02-flows 절> · 권한 <권한 id>
범위(쓰기 허용 경로):
의존 · 이어받기: <앞 작업 ID · 브랜치 · 계약 파일>
권한 영향: <권한 id → 역할별 허용 · 숨김 · 흐리게+이유 · 403>
추적 ID: <이 작업이 덮을 requirements.json 행 ID 전부 — 예: SC-20, PN-21, R-02, MD-25, BH-approvals-001~034. 테스트 이름에 [ID]로 붙인다>

완료 기준: <돌릴 명령 · 볼 화면 · 시나리오 — 숫자로 확인 가능하게>
검증 명령: <예: npm run build · npm test · npm run build -w @neodb/web — 아직 없는 검사(lint 등)는 '없음'>
금지: 범위 밖 파일 · 공용 패키지(계약 담당 제외) · 목업(UX 제외) · main 병합/push · e2e/rbac/perm-matrix.json · docs/impl/rbac-matrix.md(예외: 이 지시서에 아래 '권한표 변경 승인'이 있는 계약 작업)
권한표 변경 승인: <없음 | D-번호 — 사람이 승인한 결정 기록. 있을 때만 계약 담당이 PERMS 수정 · npm run rbac:matrix>
결과 대기(리뷰어): <check --wait 시간 · 완료 메일이 없으면 worker-read 로 확정>

앞 회차: <수정 회차일 때만 — 고칠 막는 지적 ID · 내용 · 근거 · 직전 검토 SHA>
검토 대상(검증 역할만): worktree <선택자> · 범위 <시작 SHA>..<끝 SHA> · 바뀐 파일 목록 · (재리뷰) 이전 지적과 상태
목업 기준(화면 작업만): 커밋 <SHA> · 스크린샷 D:\project\DBModeler\e2e\baseline\mockups\<파일>.png
권한 검사(권한 감사만): perms 대상 <권한 id 목록> · acts 사례 <ACT_CASES key 목록>
Placement: this machine (local), the user named it.
```

- 한 지시서에 작업 하나. 지시서만 읽고 시작할 수 있게 쓴다(앞 대화에 기대지 않는다).
- 검증 역할에는 **바뀐 파일 + 관련 사양 절만** 넘긴다(저장소 전체를 읽히지 않는다).
