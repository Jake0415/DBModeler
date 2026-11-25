| 항목 | 판정 | 검증 근거 |
|---|---|---|
| N-03(부분) | 해결 | 같은 시스템의 다른 업무 영역에서 확정본이나 작업본이 `A_M_TMP$1`을 점유하면 `A_M_TMP$2`를 사용합니다. 후보 99개가 모두 점유되면 복사와 내려받기가 비활성화됩니다. [ddl.html:208](/D:/project/DBModeler/docs/ux/mockups/ddl.html:208) · [ddl.html:219](/D:/project/DBModeler/docs/ux/mockups/ddl.html:219) |
| N-05 | 해결 | 인사 v4 확정본을 선택하면 산출물 링크가 `&ver=4`를 전달하고, DDL은 최신 확정본이 v5인 상태에서도 v4 사본을 읽습니다. 결재 문서와 작업본 링크도 각각 선택한 사본을 엽니다. [outputs.html:136](/D:/project/DBModeler/docs/ux/mockups/outputs.html:136) · [ddl.html:94](/D:/project/DBModeler/docs/ux/mockups/ddl.html:94) |

**새 결함** 없음

**요약** 통과 · 2건 해결 · 새 회귀 치명 0 · 높음 0 · 현재 작업 트리 코드를 Node에서 메모리로 검증했습니다.