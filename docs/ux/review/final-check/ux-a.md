# UX 최종 점검 — 그룹 A (home · system · model · standardize · term-wizard · import-excel · import · ddl · outputs · approvals · login · error · maintenance · mypage)
요약: 치명 0 · 높음 3 · 중간 9 · 낮음 9 — 보완 필요
| ID | 중요도 | 파일 | 내용 |
|---|---|---|---|
| A-01 | 높음 | import.html:109 | DDL 주석 논리명 · 읽기 오류 줄 XSS(재현) |
| A-02 | 높음 | mypage.html:140 · 149 | 내 신청 제목 · 내 작업 대상 이스케이프 없음 |
| A-03 | 높음 | system.html:93 · 115 · 117 | 역할 없는 사람에게 [+ 업무 영역] · 영역 메뉴 흐리게(R-17은 숨김) |
| A-04 | 중간 | model.html:370 | 진행 띠가 보이면 주 버튼 2개(확정 신청 + 띠) |
| A-05 | 중간 | standardize.html:284 | 할 일 0건이어도 처리 막대 · 이유 없는 흐린 버튼 |
| A-06 | 중간 | mypage.html:46 · 100 | [위임 저장] · 저장 막대 [저장] 주 버튼 2개 |
| A-07 | 중간 | home.html:128 · 161 | ‘기한 넘긴 결재’ 같은 이름에 범위 다름 |
| A-08 | 중간 | home.html:135 | ‘문제 없음: 보완 필요’ 거꾸로 읽힘 |
| A-09 | 중간 | app.css:183 · 366 · model.css:132 | 메뉴 항목 초점 표시 대비 부족(2px 링 아님) |
| A-10 | 중간 | model.html:1999 | 패널이 열린 채 [물리] → 반응 없어 보임 |
| A-11 | 중간 | maintenance.html ↔ error.html?code=maint | 같은 점검 상황 문구 · 약속 다름, 해요체 |
| A-12 | 중간 | 공통 | 1366×768 가로 스크롤(최소폭 1600 결정) — 사람 결정 재확인 |
| A-13 ~ A-21 | 낮음 | 여러 곳 | sr-only 1px 넘침, import 용어, 표기 · 가운뎃점, ‘~해야 합니다’, 문자 아이콘, login 인라인 style · h1 크기, 흐린 버튼 이유, window.prompt |
