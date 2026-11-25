# 리뷰 요청 — 검수 기준 2차 구현(목업) 사후 리뷰

## 배경
플랜 `docs/ux/31-inspection-policy-v2.md`(v0.3, Q2 사용자 결정 포함)대로 FE 목업을 구현했다. 사전 리뷰는 `docs/ux/review/codex-inspection-policy-v2.md`, `ux-inspection-policy-v2.md`, 협의 결과 `resolution-inspection-policy-v2.md`.
변경은 `git diff main -- docs/ux/mockups` 로 본다(브랜치 `feat/inspection-policy-v2`).

## 바뀐 곳
- `assets/app.js`: 정책 v2(`POLICY_DEFAULT` · `policyFrom` 옛 값 옮기기 · `policyAt` · `bodies`), 판정 `ruleProblems` · `itemRuleProblems` · `policyConflicts` · `offRules` · `attrRuleProblems` · `entRuleProblems` · `ruleLink` · `abbrCase` · `polSep` · `entitySuffixes`. `checkItem` · `checkDictDoc`(함께 영향받는 칸) · `decompose` · 약어 전파 · `parseDomName` · `domName` · `compOf`(Q2)가 정책 사용.
- `rules.html`: 전면 개편 — 사전 규칙 표(행 펼침 편집 · 기호 라디오/칩/직접 입력 · 길이 제한 없음 · 어기면 3단 · 시험해 보기 지금/바꾼 뒤), 모델 이름 규칙, 엔터티 분류어 표, 명명 규칙 + 미리보기, 어긋남 검사, 변경 제안(모델러), 변경 이력(펼침 · 옛 버전 보기 `?v=`), `?from=` 바뀐 것, `?f=off` 검사 안 함 목록, 저장 전 영향 창(①~④ · 확인 체크).
- `dict-grid.html` · `dictionary.html` · `term-wizard.html` · `excel-import.html`: 대문자 강제 → `abbrCase`, 자체 정규식 → `ruleProblems`, 구분자 · 접미 → 정책, 오류 문구 [기준 보기], 엑셀 재검증에 오류 행 포함, 규칙 매핑 P-CHARS · P-FORM.
- `approvals.html`: 신청 vA · 현재 vB + [무엇이 바뀌었나] · [기준 보기] · 검사 안 함 규칙, 검사 탭에 경고.
- `standardize.html`(저장된 ok도 재판정 → '검수 기준 위반'), `ddl.html`(같은 판정 + 대문자 같은 이름 충돌), `model.html` · `home.html` · `outputs.html`(Q2 준수율 + 검사 안 함 규칙 n개), `dictionary.html` 공통표준 '기관 기준 예외' 배지.

## 확인 방법
`http://localhost:5178/rules.html?as=lee`(DA), `?as=park`(모델러). 다른 화면도 같은 `?as=`.

## 검토 요청
1. 플랜 v0.3 · 협의 결과 대비 빠진 것 · 다르게 구현한 것.
2. 판정 버그: 옛 정책 호환, null/[]/all, 'off'(Q2: 분모 유지 · 켜진 규칙만 판정), 구분자 '' · '-', 공통표준 예외, 버전 표시, 엑셀 매핑(문구 정규식) 회귀.
3. 화면별 회귀 위험(dict-grid 대문자 변환, excel-import RULE_OF, approvals 경고 열, standardize 'rule' 상태 · 필터).
4. (UX) 편집 흐름 · 문구 · 접근성 · 모델러 제안 흐름.
결과는 한국어, 번호 · 심각도 · 근거 파일:줄 · 고칠 방법. 파일은 고치지 않는다.
