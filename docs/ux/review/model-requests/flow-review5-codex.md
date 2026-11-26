### 항목별 검증

`HEAD` 대비 현재 작업 트리를 확인했습니다. `git diff --check`와 스크립트 구문 검사를 통과했습니다. 주요 분기는 Node에서 검증했습니다. 파일 수정과 브라우저 실행 없이 진행했습니다.

| 항목 | 판정 | 근거 |
|---|---|---|
| F-01 · 제한 작업본 노출 | 해결 | SC-34 메뉴는 제한 작업본의 건수를 숨깁니다. SC-35 단어 학습과 물리명 역검색은 `areaView()`를 사용합니다. 열람 제한 시 확정본 또는 빈 모델만 읽는 것을 확인했습니다. [standardize.html:104](/D:/project/DBModeler/docs/ux/mockups/standardize.html:104) · [term-wizard.html:283](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:283) · [term-wizard.html:295](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:295) · [app.js:1395](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1395) |
| F-04 · 행 인계와 초안 복원 | 부분 | 긴 행 목록 인계와 새 초안의 행별 키는 유지됩니다. 기존 초안은 아래 N-04의 예외가 남습니다. [standardize.html:191](/D:/project/DBModeler/docs/ux/mockups/standardize.html:191) · [term-wizard.html:238](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:238) · [term-wizard.html:407](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:407) |
| N-02 · 기존 FK 관계 짝짓기 | 해결 | 보고서의 두 사례를 확인했습니다. FK가 없는 관계가 여러 개면 후보를 미처리로 남기고, 일부 FK를 가진 관계가 B·A 순서여도 각 후보를 같은 접두어의 관계에 연결합니다. [model.html:1187](/D:/project/DBModeler/docs/ux/mockups/model.html:1187) · [model.html:1193](/D:/project/DBModeler/docs/ux/mockups/model.html:1193) |
| N-03 · `preOf` 참조 오류 | 해결 | 후보 묶기와 `evOf()`가 같은 범위의 `preOf()`를 사용합니다. 일부 FK가 있는 B·A 역순 사례에서 두 관계 모두 FK가 완성됐습니다. [model.html:1156](/D:/project/DBModeler/docs/ux/mockups/model.html:1156) · [model.html:1187](/D:/project/DBModeler/docs/ux/mockups/model.html:1187) |
| N-04 · 기존 초안의 행별 선택 | 부분 | 일반 구형 키는 포함 여부·후보·⑤ 반영 선택을 복원합니다. 동명 충돌은 미선택으로 표시합니다. 다만 `A:` 또는 `E:`로 시작하는 논리명의 구형 키를 새 키로 오인합니다. `A:` 사례에서 제외한 행이 다시 포함되고 후보와 반영 선택이 복원되지 않는 것을 확인했습니다. [term-wizard.html:421](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:421) · [term-wizard.html:426](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:426) · [model.html:1525](/D:/project/DBModeler/docs/ux/mockups/model.html:1525) |
| 토스트 이중 이스케이프 | 해결 | 찾기·바꾸기의 원문을 모델 토스트 래퍼가 한 번 이스케이프합니다. `&`와 `<`로 확인했습니다. [model.html:185](/D:/project/DBModeler/docs/ux/mockups/model.html:185) · [model.html:1412](/D:/project/DBModeler/docs/ux/mockups/model.html:1412) |
| HTML 삽입 ① 잘못된 `snap` | 해결 | 오류 배너에서 `hx(SNAP)`을 사용합니다. [model.html:2181](/D:/project/DBModeler/docs/ux/mockups/model.html:2181) |
| HTML 삽입 ② 영역 이동 토스트 버튼 | 해결 | 대상 영역명이 들어간 버튼 라벨을 공용 렌더러에서 이스케이프합니다. [model.html:2651](/D:/project/DBModeler/docs/ux/mockups/model.html:2651) · [app.js:2821](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2821) |
| HTML 삽입 ③ 결재함의 찾을 수 없는 `doc` | 해결 | 신청 배너와 상세 패널 모두 문서 번호를 이스케이프합니다. [approvals.html:969](/D:/project/DBModeler/docs/ux/mockups/approvals.html:969) · [approvals.html:626](/D:/project/DBModeler/docs/ux/mockups/approvals.html:626) · [approvals.html:658](/D:/project/DBModeler/docs/ux/mockups/approvals.html:658) |
| HTML 삽입 ④ 업로드 이력의 `f`·`sel` | 해결 | 상태 필터와 찾을 수 없는 업로드 번호에 각각 `hx()`를 적용합니다. [uploads.html:51](/D:/project/DBModeler/docs/ux/mockups/uploads.html:51) · [uploads.html:64](/D:/project/DBModeler/docs/ux/mockups/uploads.html:64) |
| HTML 삽입 ⑤ 공용 검색의 영역명 | 해결 | 엔터티와 속성 검색 결과 모두 영역명에 `esc()`를 적용합니다. [app.js:2069](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2069) · [app.js:2074](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2074) |

**공용 토스트 버튼 회귀 없음.** `rg`로 목업 전체를 검색하고 JavaScript 구문 분석으로 화면 27개와 공용 스크립트의 토스트 호출 507곳을 확인했습니다. 세 번째 인수를 전달하는 88곳은 배열·헬퍼·결재함 재전달까지 추적했습니다. 아이콘이나 서식 HTML을 요구하는 버튼 라벨은 없었습니다. 상태·닫기 아이콘과 버튼 클릭 콜백도 확인했습니다. [app.js:2821](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2821) · [app.js:2823](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2823) · [approvals.html:918](/D:/project/DBModeler/docs/ux/mockups/approvals.html:918)

### 새 결함

| ID | 심각도 | 문제 · 근거 · 제안 |
|---|---|---|
| N-05 | 높음 | **기존 FK의 역할 접두어가 섞여 있으면 불완전한 새 관계를 저장합니다.** 부모 PK가 `K1·K2·K3`이고 기존 관계에 `A_K1·B_K2`가 있을 때, 후보 `A_K2·A_K3`는 `coverOld()`를 통과합니다. 이후 재사용 판정은 섞인 접두어 때문에 기존 관계를 거부하지만, 새 관계를 생성해 `K1`이 빠진 FK를 저장합니다. Node에서 새 관계가 추가되고 `fkOf()`가 `miss`를 반환하는 것을 확인했습니다. 일부 키만 있는 후보 묶음은 같은 역할의 기존 관계를 재사용할 때만 처리해야 합니다. [model.html:1158](/D:/project/DBModeler/docs/ux/mockups/model.html:1158) · [model.html:1179](/D:/project/DBModeler/docs/ux/mockups/model.html:1179) · [model.html:1191](/D:/project/DBModeler/docs/ux/mockups/model.html:1191) · [model.html:1204](/D:/project/DBModeler/docs/ux/mockups/model.html:1204) · [02-flows.md:431](/D:/project/DBModeler/docs/ux/02-flows.md:431) |

**요약 — 기존 11건 중 해결 9 · 부분 2 · 미해결 0 / 새 회귀 치명 0 · 높음 1 / 수정 필요**