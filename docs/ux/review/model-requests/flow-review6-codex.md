| 항목 | 판정 | 현재 작업 트리 검증 |
|---|---|---|
| N-04(부분) · 기존 초안 복원 | 기존 지적 해결 | `A:` 또는 `E:`로 시작하는 논리명의 구형 초안에서 행 포함 여부, 후보, ⑤ 반영 선택이 복원됩니다. 동명으로 구분할 수 없는 행은 미선택 상태로 표시됩니다. [term-wizard.html](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:421) |
| N-05 · 불완전한 FK 관계 저장 | 기존 지적 해결 | 기존 FK가 `A_K1·B_K2`이고 후보가 `A_K2·A_K3`이면 새 관계를 만들지 않고 두 후보의 미처리 이유를 남깁니다. 기존 FK가 `A_K1`이면 같은 후보로 기존 관계를 완성하며 `fkOf()`는 `ok`를 반환합니다. [model.html](/D:/project/DBModeler/docs/ux/mockups/model.html:1158) |

| 새 결함 | 심각도 | 문제 · 근거 · 제안 |
|---|---|---|
| N-04 수정 회귀 | 높음 | `keyVer` 도입 전에 `A:`·`E:` 행별 키로 저장한 초안을 이어 열면 제외했던 행이 다시 포함되고 후보와 ⑤ 반영 선택도 사라집니다. 표식 없는 초안에서 구형 키와 행별 키를 모두 대조하고, 의도가 모호한 행은 재확인 대상으로 두어야 합니다. [복원 코드](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:422) · [MD-56](/D:/project/DBModeler/docs/spec/da-feature-spec/30-metadata-design.md:191) |
| N-05 수정 회귀 | 높음 | 위 재현 사례에 같은 부모의 완전한 후보 묶음 `C_K1·C_K2·C_K3`를 추가하면 다섯 후보가 모두 미처리됩니다. 수정 전 분기를 재구성해 비교했을 때 `C` 묶음은 유효한 FK를 생성했습니다. 미처리 판정을 해당 접두어 묶음에만 적용해야 합니다. [묶음 판정 코드](/D:/project/DBModeler/docs/ux/mockups/model.html:1176) · [일괄 처리 사양](/D:/project/DBModeler/docs/ux/02-flows.md:431) |

**요약** — 기존 지적 2건 해결 · 새 회귀 치명 0 · 높음 2 · 파일 수정과 브라우저 실행 없이 Node로 검증.