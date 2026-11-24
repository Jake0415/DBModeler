# 리뷰 요청 — 검수 기준 2차(기관이 세우는 명명 표준) 수정 플랜

## 사용자 요청
"SWS의 표준사전 검수 기준(/management/inspection-policy)을 참조해 검수 기준을 업데이트해야 한다. 모델러에게 특수문자 · 자유도를 더 부여해 자신이 표준을 세우고 그에 맞게 모델링하게 해야 한다. 그리고 이 조건에 따라 표준 사전 검수 · 검증이 진행돼야 한다."

## 대상
- 플랜 초안: `docs/ux/31-inspection-policy-v2.md` ← **이것을 리뷰**
- 현재 화면: `docs/ux/mockups/rules.html` (SC-43)
- 판정 로직: `docs/ux/mockups/assets/app.js` — `checkItem`(866~), `checkDictDoc`(950~), `getPolicy`(1160), 약어 전파(797), ERP 조합(616~656)
- 소비 화면: `excel-import.html`, `dict-grid.html`, `term-wizard.html`, `approvals.html`, `standardize.html`, `model.html`
- 설계 기준: `docs/spec/da-feature-spec/30-metadata-design.md`(§4 검증 · ⑤ 일치 장치 · MD-40), `docs/ux/15-rbac.md`, `docs/ux/29-rbac-r2.md`
- SWS 참고(읽기만): `D:/project/sws-data-governance/frontend/src/features/standard-dictionary/fieldRules.ts`, `.../components/FieldRuleSettings.tsx`, `.../components/SpecialCharacterOptions.tsx`, `D:/project/sws-data-governance/docs/architecture/validation-rules.md`(14~28, 219~228행)

## 검토 요청
1. 플랜이 사용자 요청(자유도 · 특수문자 · 같은 기준으로 사전 검수와 모델 검증)을 충분히 덮는가. 빠진 하드코딩 규칙, 빠진 소비처.
2. 정책 v2 데이터 모양(§3)의 결함: 옛 값 호환, null/[]/all 구분, 고정 규칙 경계, 버전 · 토큰 · 결재 문서 고정과의 관계.
3. 규칙 변경이 기존 데이터 · 진행 중 결재 · 모델 물리명에 주는 영향(특히 구분자 변경 Q3, 소문자 Q5) — 안전한 처리 방안.
4. 권한 선택지(§6 A/B/C)와 직무 분리 — 추천과 이유.
5. 단계(§7) 순서 · 크기 · 위험.
6. 열린 질문 Q1~Q5 각각에 대한 의견.

결과는 한국어로, 번호를 붙여 (심각도 높음 · 중간 · 낮음 · 근거 파일:줄 · 고칠 방법) 쓴다. **파일은 고치지 않는다.**
