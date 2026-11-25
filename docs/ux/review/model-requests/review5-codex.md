현재 `git diff`를 읽고 주요 경로를 Node에서 메모리로 실행해 확인했습니다.

### 지정 항목

| 항목 | 판정 | 근거 |
|---|---|---|
| R2-02 | 해결 | 부모 PK가 없어도 식별 관계를 저장하기 전에 순환을 검사합니다. PK 없는 `A→B`는 생성되고, 순환을 닫는 `B→A`는 차단됩니다. [model.html:679](/D:/project/DBModeler/docs/ux/mockups/model.html:679) · [model.html:2141](/D:/project/DBModeler/docs/ux/mockups/model.html:2141) |
| R2-04 | 해결 | 엑셀에서 논리명이 비면 물리명으로 대체한 뒤, 기존 엔터티의 현재 논리명과 표준화 전 논리명에 모두 대조합니다. 일치한 테이블은 추가 대상에서 제외됩니다. [import-excel.html:242](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:242) · [import-excel.html:275](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:275) |
| R2-07 | 해결 | 인사 v6 작업을 시작한 뒤에도 공식 v5의 ALTER는 문서 없는 v4를 비교 기준으로 읽습니다. [app.js:1591](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1591) · [ddl.html:146](/D:/project/DBModeler/docs/ux/mockups/ddl.html:146) |
| R2-11 | 해결 | 인사 v5 확정 뒤에도 문서 없는 v4가 공식 산출물 목록에 남고, 선택하면 v4 사본으로 미리보기를 만듭니다. [outputs.html:100](/D:/project/DBModeler/docs/ux/mockups/outputs.html:100) · [outputs.html:145](/D:/project/DBModeler/docs/ux/mockups/outputs.html:145) |
| N-02 | 해결 | 전체 범위에서는 `B_M→C_M`을 먼저 출력합니다. A만 선택하면 범위 밖 B의 선행 변경이 필요하다고 표시하고 복사와 다운로드를 차단합니다. [ddl.html:201](/D:/project/DBModeler/docs/ux/mockups/ddl.html:201) · [ddl.html:211](/D:/project/DBModeler/docs/ux/mockups/ddl.html:211) · [ddl.html:258](/D:/project/DBModeler/docs/ux/mockups/ddl.html:258) |
| N-03 | 부분 | 현재 영역의 직전 확정본과 이번 결과에서 점유된 임시 이름은 건너뛰고, 99개가 모두 점유되면 차단합니다. 같은 스키마의 다른 영역이 `A_M_TMP$1`을 사용하면 해당 이름이 점유 목록에서 빠져 충돌하는 SQL을 내려받을 수 있습니다. [ddl.html:205](/D:/project/DBModeler/docs/ux/mockups/ddl.html:205) · [ddl.html:212](/D:/project/DBModeler/docs/ux/mockups/ddl.html:212) · [ddl 사양:120](/D:/project/DBModeler/docs/impl/trace/behaviors/ddl.json:120) |
| N-04 | 해결 | 기존 영역 추가 미리보기에서 대체 논리명이 겹치는 두 테이블을 제외하고, 함께 올린 정상 테이블만 추가합니다. [import-excel.html:269](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:269) · [import-excel.html:281](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:281) · [import-excel.html:416](/D:/project/DBModeler/docs/ux/mockups/import-excel.html:416) |

### 새 결함

| ID | 심각도 | 문제 · 근거 | 수정 방향 |
|---|---|---|---|
| N-05 | 높음 | 산출물에서 인사 **v4 확정본**을 선택해도 [DDL 화면] 링크가 버전을 누락합니다. DDL은 최신 확정본인 **v5**를 열어, 선택한 버전과 다른 공식 SQL을 내려받을 수 있습니다. 사양은 선택한 기준 버전을 DDL 화면에 전달하도록 요구합니다. [outputs.html:135](/D:/project/DBModeler/docs/ux/mockups/outputs.html:135) · [ddl.html:98](/D:/project/DBModeler/docs/ux/mockups/ddl.html:98) · [산출물 사양:60](/D:/project/DBModeler/docs/impl/trace/behaviors/outputs.json:60) | 결재 문서가 없는 확정본도 버전 번호를 링크에 전달하고, DDL에서 해당 확정 사본을 읽도록 합니다. |

**요약** · 지정 7건 중 해결 6 · 부분 1 · 미해결 0 / 새 회귀 치명 0 · 높음 1.