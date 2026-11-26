**치명 0 · 높음 1.** `NEW-01~03`은 모두 해결됐습니다. 표준 맞추기에서 처리 가능한 신청 중 행만 남으면 [선택 적용]이 숨겨지는 높음 회귀 1건을 확인했습니다.

현재 작업 트리의 `git diff HEAD`를 검토하고, Node에서 관련 처리기와 변경된 스크립트 33개의 문법을 확인했습니다. 브라우저 실행과 파일 수정 없이 검증했습니다. B-04(F-021)와 FC-12의 W2(P5)는 제외했습니다.

### 항목별 검증

| 항목 | 판정 | 근거 |
|---|---|---|
| FC-03 | 해결 | 시스템 홈의 영역명·설명과 설정의 대상명은 이스케이프됩니다. 영역 복제·이동 알림도 공용 `toastSafe`를 거칩니다. [시스템 홈](/D:/project/DBModeler/docs/ux/mockups/system.html:110) · [설정](/D:/project/DBModeler/docs/ux/mockups/settings.html:216) · [알림 복원](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:3030) |
| FC-11 | 해결 | Node에서 연속 파일 선택, 읽기 실패, 읽는 중 가져오기 차단, 예시와 [읽기]를 통한 진행 중 읽기 취소를 확인했습니다. [DDL 가져오기](/D:/project/DBModeler/docs/ux/mockups/import.html:128) |
| FC-12 W1 | 해결 | 현재 필터 결과를 BOM 포함 CSV로 내려받고 같은 파일명으로 감사 로그를 남깁니다. Node에서 CSV 내용과 감사 기록을 확인했습니다. [변경 내역](/D:/project/DBModeler/docs/ux/mockups/dict-history.html:92) |
| FC-14 | 부분 | 역할에 따른 버튼 숨김과 `#new` 차단은 적용됐습니다. 모델러 단독 계정에서 개인정보 [만들기]는 처음에 흐리지만, 다른 산출물 생성 도중 개인정보 카드로 바꾸면 이전 생성의 완료 콜백이 버튼을 다시 켭니다. Node에서 그 버튼을 눌러도 개인정보 생성은 차단됨을 확인했습니다. [용어 자동분석](/D:/project/DBModeler/docs/ux/mockups/term-wizard.html:656) · [산출물 권한 상태](/D:/project/DBModeler/docs/ux/mockups/outputs.html:130) · [완료 콜백](/D:/project/DBModeler/docs/ux/mockups/outputs.html:193) |
| FC-15 | 해결 | 해시와 프레임·필터를 문자열로 비교합니다. Node에서 `f=todo`, `f=ex`, 알 수 없는 필터·해시의 분기를 확인했습니다. [공용 셸](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:3020) · [표준 맞추기](/D:/project/DBModeler/docs/ux/mockups/standardize.html:369) |
| A-03 | 해결 | 역할이 없으면 버튼을 숨기고, 담당 범위 밖 DA·모델러에게는 흐린 버튼과 연결된 이유를 표시합니다. `#new`와 클릭 모두 `area.create`를 검사합니다. [권한표](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:73) · [시스템 홈](/D:/project/DBModeler/docs/ux/mockups/system.html:94) |
| A-05 | 부분 | 빈 상태와 비활성 버튼의 이유 연결은 추가됐습니다. 새로 추가된 숨김 조건이 처리 가능한 신청 중 행의 [선택 적용]까지 가립니다. [표준 맞추기](/D:/project/DBModeler/docs/ux/mockups/standardize.html:285) |
| `toastSafe` | 허용 목록 우회 미발견 · 엔터티 보존 일부 실패 | Node에서 변형 입력 10,000건을 검사했습니다. 허용 목록 밖 태그나 속성이 출력된 경우는 없었습니다. 일반·숫자 엔터티는 유지되지만, `&lt;b&gt;`처럼 허용 태그를 나타내는 엔터티는 실제 서식으로 복원됩니다. [공용 토스트](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2821) |

### 남은 삽입 경로

**없음.** 기존 8유형에서 허용 목록 밖 HTML에 도달하는 경로를 확인하지 못했습니다.

| 기존 경로 | 현재 처리 |
|---|---|
| 로그인 주소 `from` | 화면명에서 쿼리와 해시를 제거한 뒤 이스케이프합니다. [로그인](/D:/project/DBModeler/docs/ux/mockups/login.html:55) |
| 저장된 사용자 이름·부서·메일 | 헤더, 사용자 메뉴, 검토 메모, 모델 참여자, 목업 지도의 출력값을 이스케이프합니다. [사용자 메뉴](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2789) · [검토 메모](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2033) · [모델 참여자](/D:/project/DBModeler/docs/ux/mockups/model.html:1567) · [목업 지도](/D:/project/DBModeler/docs/ux/mockups/index.html:75) |
| 시스템명·영역명 복제·이동 알림 | `flash`에 저장된 문구가 `toastSafe`를 거쳐 출력됩니다. [복제·이동](/D:/project/DBModeler/docs/ux/mockups/system.html:183) · [알림 복원](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:3030) |
| 저장된 시스템명·영역명 | DDL 주석, 전체 ERD·담당 범위 안내, 사용자 목록에서 이스케이프합니다. [DDL](/D:/project/DBModeler/docs/ux/mockups/ddl.html:193) · [전체 ERD](/D:/project/DBModeler/docs/ux/mockups/model.html:2081) · [담당 범위](/D:/project/DBModeler/docs/ux/mockups/model.html:2256) · [사용자 목록](/D:/project/DBModeler/docs/ux/mockups/settings.html:462) |
| 저장된 보기·엔터티·속성 이름 | 배치·변경·삭제 알림이 `toastSafe`를 거칩니다. [속성 삭제](/D:/project/DBModeler/docs/ux/mockups/model.html:960) · [보기 배치](/D:/project/DBModeler/docs/ux/mockups/model.html:2570) |
| 결재 제출 사본 비교 값 | 대상·이전 값·이후 값을 표에 넣기 전에 모두 이스케이프합니다. [결재 사본 비교](/D:/project/DBModeler/docs/ux/mockups/approvals.html:597) |
| 저장된 타입·그룹·분류명 | 등록 폼의 옵션 본문과 `value`를 이스케이프합니다. [등록 폼](/D:/project/DBModeler/docs/ux/mockups/dictionary.html:776) |
| 저장된 표준 사전 항목명 | `data-toast` 속성에 넣기 전에 이스케이프하고 클릭 시 다시 `toastSafe`를 거칩니다. [상세 이력](/D:/project/DBModeler/docs/ux/mockups/dictionary.html:373) · [클릭 처리](/D:/project/DBModeler/docs/ux/mockups/assets/app.js:2916) |

### 새 결함 검증

| ID | 판정 | 근거 및 제안 |
|---|---|---|
| NEW-01 | 해결 | 건수 선언이 복원됐습니다. Node에서 `f=todo`와 `f=ex`가 예외 없이 해당 필터를 열었습니다. [표준 맞추기](/D:/project/DBModeler/docs/ux/mockups/standardize.html:369) |
| NEW-02 | 해결 | Node에서 역할 부재와 범위 제한 모두 첫 진입·해시 변경·버튼 클릭 시 생성 창이 열리지 않았습니다. 허용된 경우에만 창이 열렸습니다. [시스템 홈](/D:/project/DBModeler/docs/ux/mockups/system.html:94) |
| NEW-03 | 해결 | Node에서 A·B 순으로 선택하고 B·A 순으로 읽기를 완료해도 미리보기와 실제 가져오기 대상은 B였습니다. [DDL 가져오기](/D:/project/DBModeler/docs/ux/mockups/import.html:128) |
| **NEW-04** | **높음** | **처리 가능한 신청 중 행만 남으면 [신청 중 용어로 맞춤]을 적용할 수 없습니다.** Node에서 같은 행을 넣었을 때 `HEAD`는 [선택 적용]을 표시하고 현재 트리는 버튼을 포함한 막대를 숨겼습니다. SC-34 §5.3의 신청 중 용어 적용 흐름을 막습니다. ‘할 일’ 건수와 별개로 처리 가능한 행이 있을 때 막대를 표시하도록 수정하는 것이 맞습니다. [숨김 조건](/D:/project/DBModeler/docs/ux/mockups/standardize.html:285) · [SC-34 흐름](/D:/project/DBModeler/docs/ux/02-flows.md:328) |

**요약** 기존 부분 항목 7건 중 해결 5건 · 부분 2건 · 허용 목록 밖 삽입 경로 0건 · NEW-01~03 해결 · 신규 치명 0건 · 높음 1건 · **목업 완성도 판정(보완 필요)**