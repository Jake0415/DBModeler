# 리뷰 요청 — 목록 화면 표준(표 탐색 · 검색 · 필터) 초안 v0.1

## 대상
- 표준 초안: `docs/ux/22-list-standard.md`
- 기존 가이드: `docs/ux/01-design-guide.md` §6.3 · §6.4, `docs/ux/10-design-improvements.md`(사전 도구줄)
- 목업 코드: `docs/ux/mockups/*.html`, `docs/ux/mockups/assets/app.js`(wire · filterRows), `app.css`
- 기준 화면: `dictionary.html`. 대비해 볼 화면: `approvals.html`, `uploads.html`, `audit.html`, `candidates.html`, `dict-history.html`, `domain-groups.html`, `std-common.html`, `standardize.html`, `settings.html`(사용자), `excel-import.html`(5단계), `model.html`(표 보기), `mypage.html`

## 제품 맥락
업무용 데이터 표준 · 모델링 SaaS(공공기관). 1920 데스크톱, 촘촘한 밀도. 사용자: 모델러, DA(표준 담당), 기관 담당자(승인), 관리자. 사전은 공통표준 포함 1.6만 건, 결재함 · 감사 로그 · 업로드 이력은 수십~수천 건. FE 목업 단계(구현 아님).

## 검토 요청
1. 현재 상태 조사(§0)가 코드와 맞는지 — 틀린 곳 · 빠진 화면.
2. 규칙 L-1~L-11이 업무 도구에 맞는지, 빠진 규칙(예: 열 고정 · 열 너비 · 내보내기 · 다중 정렬 · 저장 보기 · 접근성 · 로딩 · 오류 · 실시간 갱신 · 대량 선택)이 있는지.
3. 결정할 것 Q1~Q5에 대한 권고와 이유.
4. 화면별 맞추기 표(§4)의 누락 · 우선순위.
5. 공통 코드 방향(§3 listView)의 위험.

## 출력 형식
- 결과 파일: 지정된 경로에 마크다운으로 저장.
- 머리: 한 줄 총평.
- 지적 목록: `ID · 심각도(높음/중간/낮음) · 제목` → 근거(file:line) → 권고. 심각도 순.
- Q1~Q5 권고 표.
- 표준에 추가할 규칙 제안(문구 그대로 넣을 수 있게).
- 모든 문장은 한국어, 짧고 쉽게.
- **목업 파일은 수정하지 말 것**(리뷰 문서만 작성).
