# 리뷰 지시 — 고객 모델 요청사항 반영 검토 (읽기 전용)

너는 NeoDB(DBModeler) 설계 리뷰어다. 파일을 고치지 말고 검토만 한다. 모든 글은 한국어.

## 입력
- 고객 요청: docs/ux/review/model-requests/00-requests.md  (표기법은 IE로 결정됨)
- 현재 사양(SoT): 목업 docs/ux/mockups/*.html + docs/ux/mockups/assets/app.js (특히 erd.html · model.html · import-excel.html · excel-import.html · import.html · standardize.html · rules.html · approvals.html · ddl.html)
- 관련 UX 문서: docs/ux/02-flows.md, 03-erd-editor.md, 16-attribute-edit-grid.md, 18-relation-scenario.md, 23-erd-notation.md, 26-erd-excel-import.md, 28-erd-integrated-view.md, 31-inspection-policy-v2.md, 15-rbac.md, 29-rbac-r2.md
- 구조: docs/arch/01-backend-architecture-v1.md (§13이 우선), 우선순위 docs/spec/da-feature-spec/20-priority.md, 작업 목록 docs/impl/01-task-list.md, 추적표 docs/impl/trace/ (behaviors/erd.json 등)
- 필요하면 rg로 더 찾는다.

## 할 일
요청 항목마다(ERD-1~4, XL-1, P-1~7, ADD-1) 다음을 표로:
1. 현재 사양이 어떻게 되어 있는지 — 근거 파일:줄
2. 판정: 일치 / 부분 / 없음 / 충돌(기존 결정과 반대)
3. 고칠 곳(목업 · UX 문서 · 설계 · 추적표 · 작업 목록)과 고칠 내용 제안
4. 중요도: 높음(W1 흐름·데이터 정합성에 영향) / 중간 / 낮음
5. 권한(PERMS) 영향 여부 — 권한표 변경이 필요하면 따로 표시(사람 확인 대상)

그다음:
- 요청끼리 또는 기존 설계와 부딪히는 점(예: 엑셀 업로드 최소 검증 ↔ 기존 업로드 검증 단계, PK 삭제 시 FK만 끊기 ↔ 기존 동작, 신청 시점 스냅샷 · 승인 기준 DDL ↔ 기존 결재/DDL 설계, 표준화 단계 순서)
- 요청이 모호해서 사람에게 물어야 할 질문(최대 7개, 각 권장안 포함)
- 개선 제안(요청에는 없지만 같이 하면 좋은 것, 최대 5개)

## 출력
마지막 답에 위 내용 전체를 마크다운으로. 추측은 '추측'이라고 표시하고, 근거 없는 주장은 하지 않는다.
