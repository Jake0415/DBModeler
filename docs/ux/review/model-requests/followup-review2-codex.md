### 판정 표

| 항목 | 판정 | 근거 |
|---|---|---|
| R-01 | 부분 수정 | Node에서 3열 붙여넣기를 재현했습니다. 파서는 인용 셀 안의 탭과 줄바꿈을 보존하고 `""`를 `"`로 읽습니다. 다만 목록 안의 정의는 `input type="text"`를 거치므로 줄바꿈이 저장 전에 제거됩니다. [model.html:1229](/D:/project/DBModeler/docs/ux/mockups/model.html:1229) |
| R-03 | 부분 수정 | 정의가 채워진 중복 두 행은 모두 반영하지 않고 `입력 중복`을 표시합니다. 이때 두 행을 1건으로 집계합니다. 한 행의 정의가 비어 있으면 중복으로 세지 않아 다른 행의 정의를 저장합니다. Node에서 두 경우를 재현했습니다. [model.html:1244](/D:/project/DBModeler/docs/ux/mockups/model.html:1244) |
| R-05 | 수정 확인 | Node에서 Excel·DDL 배너에 HTML 문자열을 건수로 넣었을 때 `0`으로 표시되는 것을 확인했습니다. [standardize.html:111](/D:/project/DBModeler/docs/ux/mockups/standardize.html:111) |
| R-06 | 수정 확인 | `BH-standardize-006`과 `BH-import-019/020`이 Excel·DDL 모두 완료 링크의 `imp`를 가져오기 기록 ID와 대조하는 동작과 일치합니다. [standardize.json:57](/D:/project/DBModeler/docs/impl/trace/behaviors/standardize.json:57) · [import.json:189](/D:/project/DBModeler/docs/impl/trace/behaviors/import.json:189) |
| U-F1 | 수정 확인 | `PERMS`의 `dict.request.n`을 바꾼 Node 테스트에서 배너가 그 이름을 `textContent`로 표시했습니다. [dict-grid.html:975](/D:/project/DBModeler/docs/ux/mockups/dict-grid.html:975) |
| U-F6 | 부분 수정 | `[선택 적용]`이 활성화되거나 승인 용어 `[반영]`이 보이면 진행 띠 버튼이 보조로 바뀝니다. 승인 용어가 보이는 상태에서 적용할 행도 선택하면 `[반영]`과 `[선택 적용]`이 동시에 주 버튼으로 남습니다. [standardize.html:35](/D:/project/DBModeler/docs/ux/mockups/standardize.html:35) · [standardize.html:288](/D:/project/DBModeler/docs/ux/mockups/standardize.html:288) |

### 새 결함 표

| ID | 심각도 | 문제 · 근거 | 제안 |
|---|---|---|---|
| N-01 | 높음 | 한 열 붙여넣기에서 `height 12" max` 뒤에 다음 줄을 붙이면 따옴표가 사라지고 두 줄이 한 칸으로 합쳐집니다. `first\n\nthird`는 빈 행이 빠져 `third`가 바로 다음 속성 칸에 들어갑니다. Node에서 두 경우를 재현했습니다. 저장하면 정의가 잘못된 속성에 반영될 수 있습니다. [model.html:1220](/D:/project/DBModeler/docs/ux/mockups/model.html:1220) · [BH-model-486](/D:/project/DBModeler/docs/impl/trace/behaviors/model.json:6796) | 셀 시작의 인용 부호만 인용 구문으로 처리하고, 한 열 붙여넣기에서는 빈 행의 위치도 보존합니다. |

**요약** — 수정 확인 3건 · 부분 수정 3건 · 새 회귀 치명 0건, 높음 1건. Node와 정적 검토로 확인했으며 파일 수정과 브라우저 실행은 없었습니다.