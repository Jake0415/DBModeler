`git diff main -- docs/ux/mockups`와 v0.3 명세를 대조했습니다. 아래는 코드 경로에서 확인한 결과입니다. 브라우저 동작은 검증하지 않았습니다.

1. **높음 · 모델 확정 승인에서 최신 이름 규칙을 누락합니다.** 결재 화면은 제출된 모델을 `modelBad()`로 재검사합니다. 이 함수는 물리명이 비어 있는 엔터티와 `comb`·`unreg` 속성만 셉니다. 신청 후 규칙이 강화되어 기존 `ok` 속성이 미준수로 바뀌면 준수율에는 반영되지만, 결재에서는 확정할 수 있습니다. 제출 스냅샷의 승인 검사에 최신 정책의 차단 규칙을 적용해야 합니다. [approvals.html](/D:/project/DBModeler/docs/ux/mockups/approvals.html:770), [app.js](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1446)

2. **높음 · 공통표준 새 판 신청에도 기관 형식 규칙이 적용됩니다.** `policyExempt()`는 사전 상세의 배지와 영향 집계에 쓰이지만, `checkDictDoc()`은 `kind: 'common'`인 문서에도 추가 항목의 기관 규칙 위반을 차단으로 수집합니다. 공통표준 약어가 기관의 허용 기호나 길이 기준을 벗어나면 새 판 반영이 막힙니다. 공통표준 경로에서 기관 형식 규칙을 제외하고 중복·참조 검사는 유지해야 합니다. [app.js](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:963), [std-common.html](/D:/project/DBModeler/docs/ux/mockups/std-common.html:427)

3. **높음 · `-` 구분자를 선택하면 정책 저장이 막힙니다.** 충돌 검사는 엔터티와 속성 물리명 규칙에 `-`가 없으면 저장을 차단합니다. 두 규칙에 `-`를 추가하면 이번에는 DB에서 인용이 필요한 문자라는 이유로 저장을 차단합니다. 물리명 규칙을 `검사 안 함`으로 바꿔도 충돌 검사가 계속 해당 규칙을 평가합니다. 표준 약어와 DB 물리명의 제약을 구분하고, 꺼진 규칙의 제약은 충돌 판정에서도 제외해야 합니다. [app.js](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1239)

4. **중간 · 표준 맞추기의 `rule` 상태에서 제공하려던 조치를 실행할 수 없습니다.** `procOpts()`에는 ‘모델에서 이름 고치기’와 ‘예외로 유지’가 있지만, 렌더링은 `selectable()`을 통과한 행에만 조치를 표시합니다. `rule`은 선택 대상과 할 일 목록 양쪽에서 빠져 있어 위반을 확인한 뒤 해당 화면에서 처리할 수 없습니다. [standardize.html](/D:/project/DBModeler/docs/ux/mockups/standardize.html:146), [standardize.html](/D:/project/DBModeler/docs/ux/mockups/standardize.html:168)

5. **중간 · 결재 검사 탭에서 변경 신청의 경고가 빠지고, 승인 이력에서 사용한 기준을 확인할 수 없습니다.** 경고 계산이 `추가` 항목에만 적용되어 이름 변경과 함께 검사하는 약어에 경고가 있어도 검사 탭에 나타나지 않습니다. 승인 버전은 문서의 `decisionPolicyVer`에 덮어쓰므로 DA 승인과 최종 승인 사이에 정책이 바뀌면 단계별 버전을 보존할 수 없습니다. 공통 검사 결과에서 경고를 표시하고 각 승인 이력에 신청·검사 버전을 함께 기록해야 합니다. [approvals.html](/D:/project/DBModeler/docs/ux/mockups/approvals.html:455), [approvals.html](/D:/project/DBModeler/docs/ux/mockups/approvals.html:777)

6. **중간 · 엑셀에서 연속 기호 오류가 `P-FORM`으로 분류되지 않습니다.** 공통 검사는 `기호 __ 연속`처럼 실제 기호를 포함한 메시지를 만들지만, 정규식은 기호 뒤의 공백을 맞추지 못합니다. 이 경우 `X-CHECK`로 떨어져 해당 규칙의 수정 안내와 기준 링크를 잃습니다. 신청 직전 재검사도 메시지에서 유형을 추정하고 필드를 기본값으로 보정하므로, 공통 검사 결과의 `rule`과 `field`를 전달해 오류 유형과 수정할 셀을 잡는 편이 정확합니다. [app.js](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1220), [excel-import.html](/D:/project/DBModeler/docs/ux/mockups/excel-import.html:308), [excel-import.html](/D:/project/DBModeler/docs/ux/mockups/excel-import.html:1019)

7. **중간 · 과거 정책 본문이 없으면 해당 버전을 기본값으로 보여 줍니다.** `policyAt()`은 저장된 본문이 없는 버전을 약어 최대 6자의 정책으로 만들어 반환합니다. 구 정책에서 최대 길이를 바꾼 이력이 있으면 `?v=`와 `?from=`에서 실제와 다른 기준이나 차이가 표시될 수 있습니다. 이력으로 복원할 수 있는 값은 복원하고, 본문을 확인할 수 없는 버전은 그 상태를 표시해야 합니다. [app.js](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1187), [rules.html](/D:/project/DBModeler/docs/ux/mockups/rules.html:228)

8. **중간 · 명세의 정책 회귀 케이스가 누락됐습니다.** `assets/policy-cases.js`와 `styleguide.html` 연동을 확인할 수 없었습니다. v1 저장값 이관, v2의 `null` 보존, `chars: []`와 `special: 'all'`, Q2의 분모 유지, 구분자 변경과 소문자 정규화 충돌을 반복 검증할 수 있도록 명세의 케이스를 추가해야 합니다. [31-inspection-policy-v2.md](/D:/project/DBModeler/docs/ux/31-inspection-policy-v2.md), [styleguide.html](/D:/project/DBModeler/docs/ux/mockups/styleguide.html)