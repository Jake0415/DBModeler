# 최종 점검 지시 — 목업(퍼블리싱) 전체 완성도 더블 체크 (읽기 전용)

너는 NeoDB 리뷰어다. 파일을 고치지 말고 검토만 한다. 모든 글은 한국어.

- 대상: docs/ux/mockups/*.html 전체(30개) + assets/app.js · app.css · model.css. 목업 = 구현 사양.
- 기준: 디자인 가이드 docs/ux/01-design-guide.md, 흐름 docs/ux/02-flows.md, 권한 원칙 docs/ux/29-rbac-r2.md(역할 없음 숨김 · 막히면 흐리게+이유 · 403), 화면 목록 docs/impl/01-task-list.md §1 · docs/impl/screen-manifest.json, 화면 동작 목록 docs/impl/trace/behaviors/*.json, 최근 결정 docs/ux/review/model-requests/01-summary.md · 02-flow-plan.md.
- 이미 알려진 후속은 다시 보고하지 않는다: docs/impl/followups.md의 열린 항목(F-001 ~ F-014 일부, F-020), docs/impl/trace/mockup-findings.md.
- 자동 점검 결과(조정자): 깨진 링크 0, 30개 화면 × 역할 콘솔 오류 0, 동작 목록 없는 화면 = erd(넘김) · index(목차) · styleguide(견본) · maintenance(점검 화면).

볼 것:
1. **완성도**: 사양 문서 · 작업 목록이 요구하는 화면 · 상태 · 패널 · 창이 목업에 다 있는지(빠진 화면 · 상태, ‘준비 중’ · TODO · 빈 껍데기 버튼 · 눌러도 아무 일 없는 버튼). maintenance.html이 동작 목록에 없어도 되는지.
2. **일관성**: 같은 개념의 용어 · 버튼 이름 · 상태 배지 · 빈 화면 문구 · 확인 창 · 토스트가 화면마다 같은지(디자인 가이드 §11 기준어), 주 버튼 하나 원칙, 표 · 필터 · 페이지 처리 패턴.
3. **권한 표시**: 역할별 숨김 · 흐리게+이유 · 403이 원칙대로인지(화면 간 차이).
4. **안전**: 사용자 입력 · 주소 인자가 이스케이프 없이 innerHTML로 가는 곳이 남았는지(최근 전 화면 점검을 했지만 빠진 화면이 있는지).
5. **동작 목록 · 문서와 목업 불일치**: behaviors JSON · UX 문서가 목업과 다른 곳.

출력: 발견 표(ID · 중요도 치명/높음/중간/낮음 · 파일:줄 · 내용 · 고칠 방법). 치명/높음 = 사양상 빠진 화면 · 상태, 결정과 다른 동작, 권한 위반, 보안, 화면 오류. 추측은 ‘추측’. 마지막 줄 요약(치명 n · 높음 n · 중간 n · 낮음 n)과 ‘목업 완성도 판정(완성 / 보완 필요)’ 한 줄.
