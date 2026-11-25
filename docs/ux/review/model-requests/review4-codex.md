현재 작업 트리의 `git diff HEAD`를 기준으로 재검토했습니다. 지정한 제외 항목은 범위에서 뺐습니다. 코드 추적과 Node 메모리 검증으로 판정했으며, 브라우저와 DB는 실행하지 않았습니다. 파일 수정은 없었습니다.

### 기존 미해결·부분 항목

| 항목 | 판정 | 근거 |
|---|---|---|
| R2-01 | 해결 | FK 복구에서 같은 관계의 다른 부모 키에 이미 연결된 컬럼은 재사용할 수 없습니다. 기존 `fkp`가 보존됩니다. [model.html:696](/D:/project/DBModeler/docs/ux/mockups/model.html:696) |
| R2-02 | 부분 | 9단계 전파와 기존 PK 재사용 시의 순환 차단을 확인했습니다. 부모 PK가 없는 관계 생성은 검사를 건너뛰므로, PK 없는 두 엔터티에 `A→B`, `B→A` 식별 관계를 만들 수 있습니다. [model.html:697](/D:/project/DBModeler/docs/ux/mockups/model.html:697) · [model.html:2140](/D:/project/DBModeler/docs/ux/mockups/model.html:2140) · [관계 사양:50](/D:/project/DBModeler/docs/ux/18-relation-scenario.md:50) |
| R2-04 | 부분 | 동일 물리명 컬럼은 확정 신청과 게이트 B에서 차단합니다. 엑셀 미리보기와 기존 영역 추가 시 시스템 중복 검사는 여전히 원본 `n0`를 비교해 물리명으로 대체된 논리명의 충돌을 놓칩니다. [app.js:1526](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1526) · [ddl.html:173](/D:/project/DBModeler/docs/ux/mockups/ddl.html:173) · [import-excel.html:268](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:268) |
| R2-05 | 해결 | 편집·신청·결재 재검사가 같은 정책 본문을 우선합니다. 정책 본문과 이전 저장 키가 충돌해도 막음 건수가 같고, 결재 탭은 신청 당시 집계와 현재 재검사를 함께 표시합니다. [app.js:1226](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1226) · [approvals.html:460](/D:/project/DBModeler/docs/ux/mockups/approvals.html:460) · [approvals.html:527](/D:/project/DBModeler/docs/ux/mockups/approvals.html:527) |
| R2-07 | 부분 | 인사 v5 작업본의 ALTER는 문서 없는 v4를 읽습니다. v6 작업을 시작하면 `base`가 5로 바뀌어, 공식 v5의 ALTER를 다시 열 때 v4를 잃고 전체 `CREATE`가 나옵니다. [ddl.html:146](/D:/project/DBModeler/docs/ux/mockups/ddl.html:146) · [app.js:464](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:464) · [app.js:1589](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1589) |
| R2-08 | 해결 | 물리명과 타입이 같아도 안정 ID가 바뀐 컬럼은 결재 비교에 `재추가` 1건으로 표시됩니다. [app.js:1462](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1462) |
| R2-11 | 부분 | v5 작업 중에는 문서 없는 v4가 공식 산출물 목록에 나옵니다. v5가 확정되면 현재 최신 버전만 보완하는 로직 때문에 v4가 목록에서 빠집니다. [outputs.html:97](/D:/project/DBModeler/docs/ux/mockups/outputs.html:97) · [산출물 사양:80](/D:/project/DBModeler/docs/impl/trace/behaviors/outputs.json:80) |
| R2-14 | 해결 | 중복 해소 창을 취소하기만 하면 저장과 리비전 증가가 없습니다. 창이 열린 동안 대기한 편집이 있으면 그 편집만 저장합니다. [model.html:295](/D:/project/DBModeler/docs/ux/mockups/model.html:295) · [model.html:782](/D:/project/DBModeler/docs/ux/mockups/model.html:782) |
| R2-16 | 해결 | 자식이나 부모의 타입 계열을 판정할 수 없으면 경고와 `fkCand`를 남깁니다. `UUID`가 `NUMBER`를 참조하는 예에서 관계가 생성되지 않았습니다. [import-excel.html:291](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:291) · [import-excel.html:301](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:301) |
| U-2 | 해결 | CSS 우선순위상 논리·물리·통합 보기 모두 16px 줄 높이에 위아래 2px씩 적용되어 기본 속성 행이 20px입니다. [model.css:51](/D:/project/DBModeler/docs/ux/mockups/assets/model.css:51) · [model.css:292](/D:/project/DBModeler/docs/ux/mockups/assets/model.css:292) |

### 새 결함 검증 및 이번 수정의 회귀

| 항목 | 판정 | 근거 |
|---|---|---|
| N-01 | 해결 | 용어 자동분석이 분리 저장된 타입과 길이를 `VARCHAR2(100)`으로 합쳐 제안합니다. 모델 반영과 저장을 거친 뒤에도 길이 100이 유지됩니다. [term-wizard.html:314](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:314) · [model.html:1973](/D:/project/DBModeler/docs/ux/mockups/model.html:1973) · [model.html:304](/D:/project/DBModeler/docs/ux/mockups/model.html:304) |
| N-02 | 부분 · 높음 | 전체 범위에서는 `B_M→C_M`을 `A_M→B_M`보다 먼저 출력합니다. **선택한 테이블**에서 A만 고르면 기존 `B_M`에 충돌하는 SQL만 생성되고 내려받기도 활성 상태입니다. 선택 범위 밖의 선행 변경이 필요하면 게이트 B에서 차단해야 합니다. [ddl.html:161](/D:/project/DBModeler/docs/ux/mockups/ddl.html:161) · [ddl.html:204](/D:/project/DBModeler/docs/ux/mockups/ddl.html:204) · [ddl.html:247](/D:/project/DBModeler/docs/ux/mockups/ddl.html:247) · [DDL 사양:120](/D:/project/DBModeler/docs/impl/trace/behaviors/ddl.json:120) |
| N-03 | 새 회귀 · 높음 | 맞바꾸기에서 임시 이름 `A_M_TMP$1`을 점유 여부 확인 없이 생성합니다. 같은 스키마에 이미 그 이름이 있으면 첫 SQL부터 충돌하는데 내려받기는 활성 상태입니다. 사용 가능한 임시 이름을 고르거나 확인할 수 없으면 출력을 차단해야 합니다. [ddl.html:199](/D:/project/DBModeler/docs/ux/mockups/ddl.html:199) · [ddl.html:247](/D:/project/DBModeler/docs/ux/mockups/ddl.html:247) · [DDL 사양:120](/D:/project/DBModeler/docs/impl/trace/behaviors/ddl.json:120) |
| N-04 | 새 회귀 · 높음 | 기존 영역 추가에서 대체 논리명이 겹치는 두 테이블과 정상 테이블을 함께 올리면, 미리보기는 모두 등록 가능으로 표시하고 새 저장 직전 검사는 전부 차단합니다. 미리보기에서 최종 이름을 비교해 중복 테이블만 제외해야 합니다. [import-excel.html:242](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:242) · [import-excel.html:454](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:454) · [엑셀 가져오기 사양:55](/D:/project/DBModeler/docs/ux/26-erd-excel-import.md:55) |

**요약** · 기존 10건 해결 6 · 부분 4 · 미해결 0 / N-01 해결 · N-02 부분 / 새 회귀 치명 0 · 높음 2.