# UX 최종 점검 — 그룹 B (dictionary · dict-grid · dict-history · excel-import · candidates · domain-groups · datatypes · std-common · rules · uploads · settings · audit · ops-status · index · styleguide)
요약: 높음 1 · 중간 7 · 낮음 12 · 참고 1 — 보완 필요
| ID | 중요도 | 파일 | 내용 |
|---|---|---|---|
| B-01 | 높음 | dictionary.html:313 · 314 | 주소 q 인자 XSS(재현), 행 이름 이스케이프 없음 |
| B-02 | 중간 | dict-grid.html:82 · domain-groups.html:52 | 사전 신청 권한 없는 사람에게 [바구니] 보임 |
| B-03 | 중간 | datatypes.html:207 | 역할 없는 사람에게 [타입 추가 요청] 흐리게(숨김이어야) |
| B-04 | 중간 | 공통 | 흐린 버튼 이유 전달 방식이 화면마다 다름(title · aria · 없음) |
| B-05 | 중간 | import-excel.html:497 · 513 | 감사 종류 ‘엑셀로 모델 가져오기’ 등 옛 이름 |
| B-06 | 중간 | settings.html:104 | 명명 템플릿 입력 label 미연결 |
| B-07 | 중간 | styleguide.html | 진행 띠 · 단계 막대 · 링크형 세그먼트 견본 없음 |
| B-08 | 중간 | index.html:38 | 감사 로그 권한 설명이 권한표와 다름, 목차 버전 낡음 |
| B-09 ~ B-20 | 낮음 | 여러 곳 | 견본과 실제 화면 차이, ‘도메인그룹’ 표기, 내보내기 버튼 이름 3종, ‘~해야 합니다’, W2 자리 표시 버튼, 내부 규칙 번호 노출, 문자 아이콘, 일시 형식, 빈 상태 주 버튼 2개, 업로드 칸 중복 · 예시 값, PERMS 참고 칸 ‘품의’(권한표 — 사람 확인), 후보 [반려]/[거절] 기준어 |
| B-21 | 참고 | 전 화면 | 1366×768 가로 스크롤 — 결정대로, 재확인 필요 |
