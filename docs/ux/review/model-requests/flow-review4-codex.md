**수정 필요.** `HEAD` 대비 작업 트리를 검토했습니다. 파일 수정과 브라우저 실행 없이 `git diff --check`, 스크립트 15개 구문 검사, Node에서 주요 분기 검증을 수행했습니다. U-17의 F-018 범위는 제외했습니다.

### 항목별 판정

| 항목 | 판정 | 근거 |
|---|---|---|
| F-01 | 부분 | SC-34 메뉴에서 열람 제한 작업본의 건수를 숨기고, SC-35의 단어 학습은 `areaView()`를 사용합니다. 다만 SC-35의 물리명 역검색은 `modelOf()`로 제한된 작업본도 읽습니다. 그 작업본에 있는 단어에 따라 후보가 달라지는 것을 확인했습니다. [standardize.html:104](D:/project/DBModeler/docs/ux/mockups/standardize.html:104) · [term-wizard.html:283](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:283) · [term-wizard.html:295](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:295) |
| F-02 | 해결 | 복합 PK 후보를 같은 역할 접두어로 묶습니다. `A_K1 + B_K2`는 둘 다 미처리로 남습니다. [model.html:1166](D:/project/DBModeler/docs/ux/mockups/model.html:1166) · [model.html:1172](D:/project/DBModeler/docs/ux/mockups/model.html:1172) |
| F-04 | 부분 | 긴 목록 인계와 새 초안의 행별 선택은 보존합니다. 기존 형식의 초안을 이어 열면 저장된 선택이 기본값으로 돌아갑니다. 아래 N-04에서 재현했습니다. [standardize.html:191](D:/project/DBModeler/docs/ux/mockups/standardize.html:191) · [term-wizard.html:421](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:421) |
| F-05 | 해결 | 검수 기준 위반만 남으면 진행 띠 ③과 복귀 토스트 모두 [검수 기준 위반 보기]를 제공하고 `f=rule`로 연결합니다. [app.js:1563](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1563) · [app.js:1575](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1575) · [model.html:2129](D:/project/DBModeler/docs/ux/mockups/model.html:2129) |
| F-07 | 해결 | 중복 상대 집합을 비교합니다. `A·B·A → A·B·B`와 `A·B·A → C·A·A` 모두 저장을 차단합니다. [model.html:1258](D:/project/DBModeler/docs/ux/mockups/model.html:1258) · [model.html:1267](D:/project/DBModeler/docs/ux/mockups/model.html:1267) |
| F-11 | 해결 | 파일 전체를 막는 머리글 오류가 있으면 기존 영역 추가에서도 가져올 컬럼을 0개로 표시합니다. 개별 테이블 오류일 때는 추가 가능한 테이블만 셉니다. [import-excel.html:300](D:/project/DBModeler/docs/ux/mockups/import-excel.html:300) · [import-excel.html:415](D:/project/DBModeler/docs/ux/mockups/import-excel.html:415) |
| U-14 | 해결 | 사전에 등록된 용어에 도메인이 있으면 SC-34와 SC-35 모두 영역 관례보다 사전 도메인을 우선합니다. [standardize.html:162](D:/project/DBModeler/docs/ux/mockups/standardize.html:162) · [term-wizard.html:345](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:345) |
| U-17 | 해결 | 디자인 가이드의 사전 탭 설명과 스타일 가이드의 탭·빈 목록 예시가 ‘사전 엑셀 일괄’로 바뀌었습니다. [01-design-guide.md:131](D:/project/DBModeler/docs/ux/01-design-guide.md:131) · [styleguide.html:106](D:/project/DBModeler/docs/ux/mockups/styleguide.html:106) · [styleguide.html:156](D:/project/DBModeler/docs/ux/mockups/styleguide.html:156) |
| R-02 | 해결 | `A_K1, B_K2, B_K1, A_K2` 순서에서도 A와 B가 각각 한 관계로 묶입니다. 서로 다른 역할의 불완전한 후보는 미처리됩니다. [model.html:1169](D:/project/DBModeler/docs/ux/mockups/model.html:1169) · [model.html:1175](D:/project/DBModeler/docs/ux/mockups/model.html:1175) |
| R-04 | 해결 | 새 인계와 새 초안은 `E:`와 `A:` 키를 사용합니다. 동명 테이블과 속성의 포함 여부 및 ⑤ 반영 선택이 각각 저장됩니다. [standardize.html:191](D:/project/DBModeler/docs/ux/mockups/standardize.html:191) · [term-wizard.html:407](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:407) · [term-wizard.html:710](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:710) |
| N-01 | 해결 | [값 고르기]가 저장한 논리명을 ERD에서 출력할 때 엔터티명과 속성명 모두 `hx()`를 거칩니다. 이전에 지적한 직접 삽입 경로는 닫혔습니다. [model.html:1269](D:/project/DBModeler/docs/ux/mockups/model.html:1269) · [model.html:453](D:/project/DBModeler/docs/ux/mockups/model.html:453) · [model.html:457](D:/project/DBModeler/docs/ux/mockups/model.html:457) |
| N-02 | 부분 | FK가 전혀 없는 관계가 여러 개면 후보를 미처리로 남깁니다. 기존 관계에 FK가 일부 있는 B·A 역순 사례는 `ReferenceError`로 중단됩니다. 아래 N-03과 같은 결함입니다. [model.html:1182](D:/project/DBModeler/docs/ux/mockups/model.html:1182) · [model.html:1189](D:/project/DBModeler/docs/ux/mockups/model.html:1189) |

**토스트.** 모델 전용 래퍼의 기존 호출에서 `<b>` 강조와 [실행 취소] 등 동작 버튼이 유지됩니다. 공용 토스트의 링크와 `data-toast`는 공용 렌더러를 계속 사용합니다. 다만 [찾기·바꾸기]는 이미 이스케이프한 값을 래퍼에 넘겨 `&` 같은 문자가 엔터티 표기 그대로 보입니다. [model.html:185](D:/project/DBModeler/docs/ux/mockups/model.html:185) · [model.html:1407](D:/project/DBModeler/docs/ux/mockups/model.html:1407) · [model.html:2125](D:/project/DBModeler/docs/ux/mockups/model.html:2125) · [app.js:2821](D:/project/DBModeler/docs/ux/mockups/assets/app.js:2821) · [app.js:2905](D:/project/DBModeler/docs/ux/mockups/assets/app.js:2905)

**남은 HTML 삽입 경로.** 요청한 8개 화면을 확인했습니다. `HEAD`에도 있던 경로 중 모델의 잘못된 `snap` 값과 영역 이동 토스트의 대상 영역명 버튼, 결재함의 찾을 수 없는 `doc` 값, 업로드 이력의 `f`·`sel` 값, 공용 검색의 영역명이 이스케이프 없이 `innerHTML`에 도달합니다. [model.html:2176](D:/project/DBModeler/docs/ux/mockups/model.html:2176) · [model.html:2646](D:/project/DBModeler/docs/ux/mockups/model.html:2646) · [approvals.html:969](D:/project/DBModeler/docs/ux/mockups/approvals.html:969) · [uploads.html:51](D:/project/DBModeler/docs/ux/mockups/uploads.html:51) · [uploads.html:64](D:/project/DBModeler/docs/ux/mockups/uploads.html:64) · [app.js:2069](D:/project/DBModeler/docs/ux/mockups/assets/app.js:2069) · [app.js:2074](D:/project/DBModeler/docs/ux/mockups/assets/app.js:2074)

### 새 결함

| ID | 심각도 | 문제와 근거 |
|---|---|---|
| N-03 | 높음 | **기존 관계에 FK가 일부 있으면 [관계 한 번에 만들기]가 중단됩니다.** `preOf`는 엔터티 순회 콜백 안에 선언돼 있고, 콜백 밖의 `evOf`에서 호출합니다. Node에서 `ReferenceError: preOf is not defined`를 확인했습니다. 접두어 판정 함수를 두 호출부가 접근하는 범위에 두고, 일부 FK가 있는 관계의 재사용을 검증해야 합니다. [model.html:1166](D:/project/DBModeler/docs/ux/mockups/model.html:1166) · [model.html:1182](D:/project/DBModeler/docs/ux/mockups/model.html:1182) · [02-flows.md:431](D:/project/DBModeler/docs/ux/02-flows.md:431) |
| N-04 | 높음 | **기존 마법사 초안에서 제외했던 행이 다시 포함됩니다.** 같은 작업 버전에서 [하던 분석 이어서]를 열어도 이전 `r.key` 형식의 선택값을 새 `E:`·`A:` 키로 읽어 찾지 못합니다. Node에서 제외했던 행이 다시 포함되는 것을 확인했습니다. ⑤에서도 이전 선택값이 무시되어 반영 대상이 달라질 수 있습니다. 이전 키를 변환하고, 동명 행 때문에 이전 의도를 복원할 수 없으면 선택을 다시 받아야 합니다. [term-wizard.html:399](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:399) · [term-wizard.html:421](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:421) · [term-wizard.html:701](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:701) · [30-metadata-design.md:191](D:/project/DBModeler/docs/spec/da-feature-spec/30-metadata-design.md:191) |

**요약 — 12건 중 해결 9 · 부분 3 · 미해결 0 / 새 회귀 치명 0 · 높음 2 / 수정 필요**