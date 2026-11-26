**수정 필요.** `HEAD` 대비 작업 트리를 검토했습니다. 파일 수정과 브라우저 실행 없이 `git diff --check`, 변경된 목업 스크립트 14개 구문 검사, 주요 분기의 Node 검증을 수행했습니다. U-17에는 요청하신 F-018 제외 범위를 적용했습니다.

### 부분 해결 항목 재검증

| 항목 | 판정 | 근거 |
|---|---|---|
| F-01 | 부분 | SC-34·35 본문과 진행 띠는 열람 제한을 적용합니다. SC-34 상단 메뉴는 결재 중 작업본의 미준수 건수를 계속 표시하고, SC-35는 단어 후보를 만들 때 열람 판정 없이 다른 영역의 작업본을 읽습니다. [standardize.html:103](D:/project/DBModeler/docs/ux/mockups/standardize.html:103) · [app.js:1478](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1478) · [term-wizard.html:283](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:283) |
| F-02 | 부분 | 부모와 키를 물리명으로 찾고 반복된 키는 역할 접두어로 묶습니다. 키가 한 번씩만 나오면 접두어 검사를 건너뛰므로 `A_K1`과 `B_K2`를 한 관계로 묶을 수 있습니다. [model.html:1155](D:/project/DBModeler/docs/ux/mockups/model.html:1155) · [model.html:1165](D:/project/DBModeler/docs/ux/mockups/model.html:1165) |
| F-03 | 해결 | `fkOf()`가 선택한 부모·자식 컬럼 객체의 인덱스로 타입 수정 대상을 지정합니다. [app.js:1644](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1644) · [model.html:1189](D:/project/DBModeler/docs/ux/mockups/model.html:1189) |
| F-04 | 부분 | 긴 목록과 새로 넘긴 행의 종류를 보존합니다. 바구니 등에서 돌아와 초안을 복원하면 테이블명과 동명 속성의 선택이 같은 키로 합쳐집니다. [standardize.html:189](D:/project/DBModeler/docs/ux/mockups/standardize.html:189) · [term-wizard.html:408](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:408) · [term-wizard.html:421](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:421) |
| F-05 | 부분 | 적용 전 요약은 `okapply`와 `rule`을 세고, 복귀 토스트는 기준 위반만 남으면 해당 필터로 연결합니다. 같은 상태에서 진행 띠 ③은 여전히 용어 자동분석으로 연결합니다. [standardize.html:248](D:/project/DBModeler/docs/ux/mockups/standardize.html:248) · [model.html:2111](D:/project/DBModeler/docs/ux/mockups/model.html:2111) · [app.js:1575](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1575) |
| F-07 | 부분 | `A·B·A → A·B·B`는 차단합니다. 엔터티명 `A·B·A → C·A·A`에서는 마지막 행의 중복 상대만 바뀌어 기존 위반으로 처리되고 저장이 허용됩니다. [model.html:1242](D:/project/DBModeler/docs/ux/mockups/model.html:1242) · [app.js:1602](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1602) |
| F-08 | 해결 | 새 영역을 저장하기 직전에 미리보기를 다시 계산해 같은 시스템의 작업본과 확정본에 생긴 이름 충돌을 차단합니다. [import-excel.html:288](D:/project/DBModeler/docs/ux/mockups/import-excel.html:288) · [import-excel.html:483](D:/project/DBModeler/docs/ux/mockups/import-excel.html:483) |
| F-10 | 해결 | 잠긴 모델에서 신청 권한이 있는 사용자는 검증 보기 옆에 비활성 [확정 신청]과 연결된 사유를 봅니다. [app.js:1568](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1568) · [app.js:1576](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1576) |
| F-11 | 부분 | 첫 업로드가 전부 막히면 0개로 표시합니다. 기존 영역 추가는 파일 전체를 막는 머리글 오류와 정상 테이블이 함께 있을 때도 정상 테이블을 ‘가져올 컬럼’으로 셉니다. [import-excel.html:207](D:/project/DBModeler/docs/ux/mockups/import-excel.html:207) · [import-excel.html:300](D:/project/DBModeler/docs/ux/mockups/import-excel.html:300) · [import-excel.html:415](D:/project/DBModeler/docs/ux/mockups/import-excel.html:415) |
| F-13 | 해결 | SC-34의 ‘할 일’과 SC-35 ①의 미준수 집계가 같은 네 상태를 세며 신청 중을 제외합니다. [standardize.html:180](D:/project/DBModeler/docs/ux/mockups/standardize.html:180) · [term-wizard.html:511](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:511) |
| U-01 | 해결 | 기존 짝 때문에 건너뛴 후보를 사유 목록에 남기고 토스트에 건수를 표시합니다. [model.html:1180](D:/project/DBModeler/docs/ux/mockups/model.html:1180) · [model.html:1186](D:/project/DBModeler/docs/ux/mockups/model.html:1186) |
| U-04 | 해결 | 논리명을 바꾼 속성의 공용 판정이 `na`이면 비대상 상태와 사유를 저장합니다. [model.html:1247](D:/project/DBModeler/docs/ux/mockups/model.html:1247) |
| U-05 | 해결 | 띠를 닫으면 SC-34는 필터 칩으로, SC-35는 조작 가능한 단계 버튼으로 초점을 옮깁니다. [standardize.html:117](D:/project/DBModeler/docs/ux/mockups/standardize.html:117) · [term-wizard.html:243](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:243) |
| U-07 | 해결 | 승인분 [반영]이 표시되면 진행 띠의 [용어 자동분석]은 보조 버튼으로 표시됩니다. [standardize.html:351](D:/project/DBModeler/docs/ux/mockups/standardize.html:351) · [app.js:1568](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1568) |
| U-08 | 해결 | 바구니·후보 큐 복귀 주소가 `from`을 보존하고, 표준 맞추기 복귀는 모델의 반영·저장 경로를 거칩니다. [term-wizard.html:234](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:234) · [term-wizard.html:660](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:660) · [model.html:2689](D:/project/DBModeler/docs/ux/mockups/model.html:2689) |
| U-14 | 부분 | 분류어 없는 행의 기본 제안과 신청 중 행의 자동 비대상 예외는 맞췄습니다. 사전에 등록된 용어의 도메인이 영역 관례와 다르면 SC-34는 관례를, 마법사는 사전 도메인을 제안합니다. [standardize.html:158](D:/project/DBModeler/docs/ux/mockups/standardize.html:158) · [term-wizard.html:345](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:345) · [term-wizard.html:393](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:393) |
| U-15 | 해결 | ⑤에서 반영 예약을 적용한 모델 복사본으로 진행 띠를 다시 계산하고 반영 대기 건수를 표시합니다. [term-wizard.html:739](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:739) · [term-wizard.html:744](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:744) |
| U-17 | 부분 | 통합 검색과 업로드 이력의 버튼은 ‘사전 엑셀 일괄’로 바뀌었습니다. 디자인 가이드의 사전 탭 설명과 스타일 가이드 예시에는 ‘엑셀 가져오기’가 남아 있습니다. [dictionary.html:56](D:/project/DBModeler/docs/ux/mockups/dictionary.html:56) · [uploads.html:19](D:/project/DBModeler/docs/ux/mockups/uploads.html:19) · [01-design-guide.md:131](D:/project/DBModeler/docs/ux/01-design-guide.md:131) · [styleguide.html:106](D:/project/DBModeler/docs/ux/mockups/styleguide.html:106) |

### 이전 신규 결함 재검증

| 항목 | 판정 | 근거 |
|---|---|---|
| R-01 | 해결 | 지적된 가져오기 기록 불일치 배너가 영역명을 `esc()`로 이스케이프합니다. [standardize.html:91](D:/project/DBModeler/docs/ux/mockups/standardize.html:91) · [standardize.html:112](D:/project/DBModeler/docs/ux/mockups/standardize.html:112) |
| R-02 | 부분 | 이전의 교차 순서 네 후보는 A·B 역할별로 정확히 묶입니다. `A_K1`과 `B_K2`만 있으면 서로 다른 역할의 불완전한 후보가 여전히 한 관계가 됩니다. [model.html:1165](D:/project/DBModeler/docs/ux/mockups/model.html:1165) · [02-flows.md:431](D:/project/DBModeler/docs/ux/02-flows.md:431) |
| R-03 | 해결 | FK가 누락된 `miss` 관계만 재사용합니다. `noFk`는 `ex`를 반환합니다. [model.html:1177](D:/project/DBModeler/docs/ux/mockups/model.html:1177) · [app.js:501](D:/project/DBModeler/docs/ux/mockups/assets/app.js:501) |
| R-04 | 부분 | 최초 인계는 `E:`와 `A:`로 행을 구분합니다. 초안 저장·복원과 ⑤ 선택은 여전히 같은 `r.key`를 사용해 두 행이 함께 선택될 수 있습니다. [term-wizard.html:436](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:436) · [term-wizard.html:408](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:408) · [term-wizard.html:708](D:/project/DBModeler/docs/ux/mockups/term-wizard.html:708) |
| R-05 | 해결 | 모델 검증이 같은 자동 비대상 규칙을 사용해 일치하는 속성의 미준수 차단과 물리 정보 경고를 제외합니다. [app.js:1537](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1537) · [app.js:1628](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1628) · [app.js:1636](D:/project/DBModeler/docs/ux/mockups/assets/app.js:1636) |

### 이번 diff에서 추가된 치명·높음 회귀

| ID | 심각도 | 문제와 수정 방향 | 근거 |
|---|---|---|---|
| N-01 | **치명** | **엑셀 논리명 선택에서 저장형 XSS 경로가 생겼습니다.** 엑셀의 대체 논리명을 [값 고르기]에서 선택하면 `o.n`에 저장됩니다. ERD가 그 이름을 이스케이프 없이 `innerHTML`에 넣으므로 브라우저가 HTML로 해석할 수 있습니다. 엔터티명과 속성명 모두 출력 시 텍스트로 처리해야 합니다. | [import-excel.html:258](D:/project/DBModeler/docs/ux/mockups/import-excel.html:258) · [model.html:1246](D:/project/DBModeler/docs/ux/mockups/model.html:1246) · [model.html:451](D:/project/DBModeler/docs/ux/mockups/model.html:451) · [model.html:454](D:/project/DBModeler/docs/ux/mockups/model.html:454) · [model.html:510](D:/project/DBModeler/docs/ux/mockups/model.html:510) |
| N-02 | **높음** | **복합 FK 후보를 올바르게 묶어도 기존 관계에 반대로 연결할 수 있습니다.** 같은 부모·자식의 미완성 관계가 B·A 순서로 저장돼 있으면, A·B 순으로 계산된 후보 묶음이 각각 B·A 관계에 붙습니다. 관계와 후보 묶음의 대응을 확인할 수 없으면 사용자에게 선택을 받거나 미처리로 남겨야 합니다. | [model.html:1177](D:/project/DBModeler/docs/ux/mockups/model.html:1177) · [model.html:1180](D:/project/DBModeler/docs/ux/mockups/model.html:1180) · [02-flows.md:431](D:/project/DBModeler/docs/ux/02-flows.md:431) |

**요약 — F/U 18건 중 해결 10 · 부분 8 · 미해결 0 / R 5건 중 해결 3 · 부분 2 · 미해결 0 / 추가 회귀 치명 1 · 높음 1 / 수정 필요**