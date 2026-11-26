# 리뷰 지시 — 처음 표준화 흐름 잇기 목업 수정 (읽기 전용)

너는 NeoDB 리뷰어다. 파일을 고치지 말고 검토만 한다. 모든 글은 한국어.

- 계획 · 결정: docs/ux/review/model-requests/02-flow-plan.md (A-1~A-6 · B-1~B-5, Q-F1~Q-F5 모두 권장안대로 확정)
- 변경: `git diff` (커밋 안 된 작업 트리). 목업 model · standardize · term-wizard · import-excel · excel-import · home · approvals · mypage .html, assets/app.js · model.css(공용: stdJudge · STD_PROPOSAL · flowCounts · flowBand · flowBandShown/Off/Reset, 인자 check=1 · then=std · flow=1, dbm-import-last{src}, dbm-apply.left, xDiff), UX 문서 02 · 03 · 07 · 18 · 26 · 31 · 30 MD-56, behaviors JSON, 작업 목록 S-18 · T-P2-705.
- 목업 서버 http://localhost:5178 (?as=kim|park|lee|hyun|choi). 시드 영역은 확정본이 있어 진행 띠가 안 보임 — `&flow=1`로 확인(목업 전용).

볼 것:
1. 0 사전 일괄 → 1 모델 엑셀 → 2 표준 맞추기 → 3 용어 자동분석 → 4 모델 검증 · 신청이 화면에서 끊김 없이 이어지는지(각 단계 끝에서 다음으로 가는 길, 넘기는 맥락 · 인자, 되돌아오는 길), 계획 A · B · 결정 Q-F가 빠짐없이 · 정확히 반영됐는지
2. 진행 띠 숫자가 각 화면의 실제 숫자와 같은지(표준 맞추기 칩 · 모델 검증 막음 · 마법사). 알려진 차이: SC-34 칩은 ‘조합 가능’에 사전에 있음(okapply), ‘미등록’에 검수 기준 위반(rule)을 묶어 셈 — 띠와 달라 보이는지 판단
3. 모델 검증 일괄 처리(FK 후보 관계 한 번에 · 타입 맞추기 · 정의 표 입력/CSV 받기 · 올리기 · xDiff 값 고르기)의 데이터 정합성(잘못 짝지음 · 되돌리기 · 중복 해소 창 연동)
4. Q-F4 시스템 전체 테이블명 유일(처음 업로드 막음, 열람 범위 밖 이름 숨김), 표준 예상 한 줄 · 사전 준비도 계산의 타당성
5. 권한(29 R-17: 역할 없으면 숨김 · 막히면 흐리게+이유), PERMS 변경 여부(있으면 치명), 다른 화면 회귀
6. 문서 · behaviors가 목업과 맞는지

출력: 발견 표(ID · 중요도 치명/높음/중간/낮음 · 파일:줄 · 내용 · 고칠 방법). 치명/높음 = 흐름 끊김 · 결정과 다른 동작 · 데이터 손상 · 권한 위반 · 화면 오류. 추측은 '추측'. 마지막 줄 요약(치명 n · 높음 n · 중간 n · 낮음 n).
