| 검증 항목 | 판정 | Node 검증 결과 |
|---|---|---|
| NEW-04 · 표준 맞추기 | 해결 | ‘할 일’이 0건이어도 처리 가능한 ‘신청 중’ 행만 있으면 막대와 [선택 적용]이 표시되고, 적용 미리보기에 신청 재사용 1건이 잡혔습니다. 대기 기록만 있어도 막대가 표시됐고, 처리 가능한 행과 대기 기록이 모두 없으면 빈 상태가 표시됐습니다. [standardize.html](/D:/project/DBModeler/docs/ux/mockups/standardize.html:285) |
| FC-14(부분) · 산출물 | 부분 해결 | 완료 콜백은 현재 카드와 버전의 권한을 다시 판정했습니다. 모델러가 개인정보 카드로 바꾸면 완료 후 [만들기]가 이유와 함께 비활성화됐습니다. 다만 공용 타이머가 생성 도중 버튼을 활성화했고, 이때 다시 누르면 생성 순번 검사에서 첫 완료 콜백이 생략됐습니다. [outputs.html](/D:/project/DBModeler/docs/ux/mockups/outputs.html:192) |
| 사전 주소 `sel` | 해결 | 등록된 ID만 선택하고, 고정 선택자 `tr[data-id]`로 찾은 행의 `dataset.id`를 문자열로 비교했습니다. 일치하는 행에만 포커스를 주고, 필터 밖 ID는 상세만 열며, 미등록 ID는 무시했습니다. [dictionary.html](/D:/project/DBModeler/docs/ux/mockups/dictionary.html:836) |

| 새 결함 | 심각도 | 재현 및 수정 방향 |
|---|---|---|
| NEW-05 · 산출물 첫 생성 결과 누락 | 높음 | 테이블 정의서 생성 중 준수검사 카드로 전환하면 공용 `data-busy` 타이머가 900ms에 [만들기]를 활성화합니다. 901ms에 다시 누르면 첫 생성의 1200ms 콜백이 생략돼 최근 산출물과 감사 기록이 각각 1건만 남았습니다. `HEAD`의 타이머 로직을 적용한 대조 실행에서는 각각 2건이 남았습니다. 생성 상태를 페이지 로직에서 일관되게 관리하고, 처리 중 재진입도 차단해야 합니다. [공용 타이머](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:1777) · [완료 처리](/D:/project/DBModeler/docs/ux/mockups/outputs.html:193) · [동작 사양](/D:/project/DBModeler/docs/ux/02-flows.md:581) |

**요약** Node 재검증 3건 중 해결 2건 · 부분 해결 1건 · 신규 치명 0건 · 높음 1건. 브라우저 실행과 파일 수정 없이 검증했습니다.

**목업 완성도 판정(보완 필요)**