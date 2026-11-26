### 판정 표

| 항목 | 판정 | 검증 결과 |
|---|---|---|
| R-01 | 부분 수정 | Node에서 셀 시작 인용부호가 탭과 줄바꿈을 같은 셀에 유지하고 `""`를 `"`로 읽는 것을 확인했습니다. 줄바꿈은 저장 전에 공백으로 바뀌고 안내도 표시됩니다. 다만 줄바꿈 바로 옆의 탭도 지워집니다. [model.html](/D:/project/DBModeler/docs/ux/mockups/model.html:1229) |
| R-03 | 수정 확인 | 같은 엔터티·속성 쌍이 반복되면 정의가 빈 행도 중복으로 집계합니다. 중복 행은 모두 반영하지 않고 행마다 `입력 중복`으로 표시합니다. 첫 행의 세 칸이 모두 `엔터티명 · 속성명 · 정의`일 때만 머리줄로 건너뛰는 것도 확인했습니다. [model.html](/D:/project/DBModeler/docs/ux/mockups/model.html:1254) |
| U-F6 | 수정 확인 | `[선택 적용]`이 활성 주 버튼이면 `[반영]`은 보조 버튼이 됩니다. 선택을 해제하면 `[반영]`이 다시 주 버튼이 됩니다. 두 버튼이 동시에 활성 주 버튼인 상태는 재현되지 않았습니다. [standardize.html](/D:/project/DBModeler/docs/ux/mockups/standardize.html:125) |
| N-01 | 수정 확인 | `height 12" max`의 따옴표는 문자로 남고 다음 행도 정상 반영됩니다. 1열 `first\n\nthird`는 두 번째 칸의 기존 값을 유지하고 세 번째 칸에 `third`를 넣습니다. [model.html](/D:/project/DBModeler/docs/ux/mockups/model.html:1221) · [붙여넣기 처리](/D:/project/DBModeler/docs/ux/mockups/model.html:1240) |

### 새 결함 표

| ID | 심각도 | 문제 및 근거 | 제안 |
|---|---|---|---|
| N-02 | 높음 | 인용된 정의 `a\t\n\tb`는 `csvRows`에서 온전히 읽히지만 `oneLine`을 거치면 `a b`가 됩니다. Node에서 붙여넣기와 CSV 올리기 모두 재현했습니다. `HEAD`의 CSV 경로는 두 탭을 유지했습니다. §5.6.1과 `BH-model-486`은 인용 셀의 탭을 보존하고 줄바꿈을 공백으로 바꾸도록 명시합니다. [model.html](/D:/project/DBModeler/docs/ux/mockups/model.html:1229) · [§5.6.1](/D:/project/DBModeler/docs/ux/02-flows.md:433) · [BH-model-486](/D:/project/DBModeler/docs/impl/trace/behaviors/model.json:6796) | 줄바꿈 문자만 공백으로 치환해 인접한 탭을 보존합니다. |

**요약** — 수정 확인 3건 · 부분 수정 1건 · 새 회귀 치명 0건, 높음 1건. 파일 변경 없이 Node와 현재 diff로 검증했습니다.