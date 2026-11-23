사전의 탐색 흐름을 기준으로 삼되, 채택 전에는 표시 범위와 일괄 처리 범위를 맞추고 조회 목록과 편집 표의 적용 범위를 명시하는 데 합의할 것을 권합니다.

## 지적 목록

### R-01 · 높음 · 사전의 전체 선택이 표시 상한을 넘는다 (L-5·L-7·L-10)

- 근거 — 사전은 500행만 그리지만, 머리글 체크 상태와 전체 선택은 상한을 적용하기 전 결과에서 계산한다. 화면에서 한 번도 보지 않은 기관 항목도 선택될 수 있다. 모델 표는 표시된 선택과 숨은 선택을 구분하고 적용 범위도 따로 제공한다. `docs/ux/mockups/dictionary.html:305`, `docs/ux/mockups/dictionary.html:309`, `docs/ux/mockups/dictionary.html:318`, `docs/ux/mockups/dictionary.html:412`, `docs/ux/mockups/model.html:1120`, `docs/ux/mockups/model.html:1155`
- 권고 — 머리글 체크와 부분 선택 표시를 같은 행 집합에서 계산한다. 선택할 수 없는 행은 뺀다. 필터로 숨은 기존 선택은 따로 세고, 기본 일괄 행동은 현재 결과에서 선택한 행에만 적용한다. 건수는 범위 전체, 조건 일치, 표시, 선택으로 구분한다. 스크롤 화면에서 ‘보이는 행’은 스크롤 위치에 따라 범위가 달라지므로 ‘이 페이지의 선택 가능 항목’처럼 이름을 명시한다.

### R-02 · 높음 · 조회 목록과 편집 표에 같은 상한과 단축키를 적용하면 작업 범위가 바뀐다 (L-7·L-9, §0·§4)

- 근거 — 엑셀 검수는 상태·오류 규칙·방금 바꾼 행을 교차 적용한다. 같은 범위를 표, 상세, F8, 자동 수정, 찾아 바꾸기가 공유한다. 모델 표의 찾기는 논리명 강조와 바꾸기에 연결된다. §0의 ‘↑↓ 이동은 두 곳뿐’은 용어 마법사 검토 행과 모델 속성 편집 표를 포함하는 순간 성립하지 않는다. `docs/ux/mockups/excel-import.html:555`, `docs/ux/mockups/excel-import.html:690`, `docs/ux/mockups/excel-import.html:774`, `docs/ux/mockups/model.html:1117`, `docs/ux/mockups/model.html:1127`, `docs/ux/mockups/model.html:959`, `docs/ux/mockups/term-wizard.html:524`
- 권고 — 탐색 목록에는 목록 표준을 적용한다. 편집 표에는 건수, 접근성, 상태 안내를 공유하고 키보드와 편집 범위는 화면의 작업 규칙을 따른다. 모델 표에 거르기를 추가한다면 바꾸기 대상이 달라지므로 먼저 범위를 명시한다. 엑셀에서는 상태 접기나 렌더링 최적화 전후에 같은 행 집합이 수정 대상으로 남는지 확인한다.

### R-03 · 높음 · 주소 복원 범위를 정하지 않으면 기존 업무 링크가 깨진다 (L-3·L-4·L-9·L-11)

- 근거 — 결재함은 `box/doc`, 업로드는 `b`, 후보는 `f/c`, 변경 내역은 `per/pub`, 공통표준은 `sel/code/tab`을 읽는다. 설정은 `user`를 읽고, 표준 맞추기는 `area/e/a/f` 등으로 업무 맥락을 받는다. 감사 로그도 감사 모드 주소를 읽지만 목록 조건은 복원하지 않는다. 사전은 주소를 다시 만들며, 현재 결과 밖의 상세도 열 수 있다. `docs/ux/mockups/approvals.html:741`, `docs/ux/mockups/uploads.html:35`, `docs/ux/mockups/candidates.html:56`, `docs/ux/mockups/dict-history.html:42`, `docs/ux/mockups/std-common.html:465`, `docs/ux/mockups/settings.html:310`, `docs/ux/mockups/standardize.html:85`, `docs/ux/mockups/standardize.html:92`, `docs/ux/mockups/standardize.html:267`, `docs/ux/mockups/audit.html:46`, `docs/ux/mockups/dictionary.html:327`, `docs/ux/mockups/dictionary.html:812`
- 권고 — 화면별로 기존 키와 해시를 보존하고, 목록이 소유하는 키만 갱신한다. ‘모두 지우기’는 검색과 필터를 초기화하고 함·업무 범위·보기·정렬을 유지한다. 상세 ID는 허용된 링크에서만 복원한다. 권한이 없거나 삭제된 항목에는 목록으로 돌아갈 길을 제공한다. 민감한 검색어와 초안·일괄 체크는 세션 상태로 둔다. 마이페이지의 최근 5건과 총건수는 결재함 ‘내 신청’의 동일한 권한·집계 기준을 사용하며 기존 행의 문서 링크를 유지한다.

### R-04 · 높음 · 행 이동과 주 행동을 분리해야 한다 (L-1·L-2·L-9)

- 근거 — 사전 검색창은 한글 조합 중 Enter를 검사하지만 행의 Enter는 자식 컨트롤에서 올라온 이벤트도 처리한다. 결재함은 J/K로 상세를 바꾸고 A/R로 업무 행동을 호출한다. 마이페이지에서 한 글자 단축키 사용 여부를 설정할 수 있다. 엑셀 편집 셀은 Esc를 자체 처리한다. `docs/ux/mockups/dictionary.html:404`, `docs/ux/mockups/dictionary.html:414`, `docs/ux/mockups/approvals.html:712`, `docs/ux/mockups/approvals.html:716`, `docs/ux/mockups/mypage.html:166`, `docs/ux/mockups/excel-import.html:684`
- 권고 — 조회 표는 기본 표 의미와 이름을 유지하고, 행에 명시적인 상세 버튼이나 링크를 제공한다. ↑↓는 목록에 초점이 있을 때 행 초점만 이동한다. Enter는 초점이 있는 항목을 열고, 검색창에서는 조합 완료 후에만 첫 상세를 열 수 있다. 승인·반려·편집은 별도 버튼과 확인 흐름을 거친다. 자식 컨트롤은 자체 키를 처리한다. 팝오버나 패널을 닫으면 열었던 컨트롤에 초점을 되돌린다. 단일 문자 단축키는 기존 설정과 입력 영역을 존중한다.

### R-05 · 중간 · 빈 결과는 행 개수와 화면 의미로 판정한다 (L-5·L-6, §0)

- 근거 — 업로드는 필터 결과가 비면 항상 최초 사용 문구를 낸다. 후보는 항상 `er done`을 쓰지만 문구는 ‘해당 상태 후보가 없습니다’다. 결재함은 대기 원본 건수와 필터를 비교한다. 감사 로그는 데이터 행을 숨긴 채 빈 행을 추가하므로 `tr.er:only-child`가 성립하지 않는다. 공통 CSS는 작은 표에서 머리글을 다시 표시한다. 마이페이지도 자체 빈 결과를 처리한다. `docs/ux/mockups/uploads.html:40`, `docs/ux/mockups/uploads.html:44`, `docs/ux/mockups/candidates.html:63`, `docs/ux/mockups/candidates.html:67`, `docs/ux/mockups/approvals.html:186`, `docs/ux/mockups/audit.html:72`, `docs/ux/mockups/audit.html:77`, `docs/ux/mockups/assets/app.css:486`, `docs/ux/mockups/assets/app.css:491`, `docs/ux/mockups/mypage.html:121`
- 권고 — 기본 대기 범위가 실제로 비었을 때만 큐 완료 상태를 쓴다. 추가 조건으로 결과가 비면 ‘모두 지우기’를 제공한다. 빈 상태와 머리글 표시 여부는 목록 상태로 정한다. 정렬이나 열 탐색에 필요한 머리글은 유지한다. §0은 ‘지우기’와 건수 줄의 합계 대신 화면별로 상시/빈 결과 전용, 목록/칩 건수를 기록한다. 결재함은 함별 건수와 빈 결과의 필터 해제 버튼이 있고, 표준 맞추기는 칩에 건수가 있다. `docs/ux/mockups/approvals.html:170`, `docs/ux/mockups/approvals.html:186`, `docs/ux/mockups/standardize.html:167`

### R-06 · 중간 · 공통 검색은 사전의 의미를 보존해야 한다 (L-2·L-8, §0)

- 근거 — 사전은 빈 검색에서 기관 최근 변경을 최대 8건 보여 준다. 짧은 검색은 이름·약어 앞부분만 찾고, 긴 검색은 동의어·금칙어·과거명도 찾는다. 초성은 이름에만 적용한다. 금칙어 안내가 순위에서 먼저 나온다. 공통표준은 코드명·약어·기관·관련 용어를 공백으로 이어 검색하고, 변경 내역은 항목·문서·담당자를 구분자 없이 이어 검색한다. `docs/ux/mockups/dictionary.html:245`, `docs/ux/mockups/dictionary.html:250`, `docs/ux/mockups/dictionary.html:271`, `docs/ux/mockups/dictionary.html:278`, `docs/ux/mockups/dictionary.html:285`, `docs/ux/mockups/std-common.html:217`, `docs/ux/mockups/dict-history.html:51`
- 권고 — 필드별 정규화와 낱말 AND를 공통으로 제공한다. 한 낱말은 한 필드 안에서 일치하고, 서로 다른 낱말은 여러 필드에 걸쳐 일치할 수 있게 한다. 짧은 앞부분 검색과 초성은 명칭 검색 프로필에 적용한다. 문서번호·코드·로그는 필드별 정확·포함 일치를 지정한다. 사전의 금칙어 안내와 최근 변경 기본 보기를 보존한다. 강조는 원문 위치가 확인된 경우에만 적용하고, 별칭·초성 등은 일치 이유를 표시한다. 검색 대상은 입력의 접근 가능한 이름이나 도움말에도 제공한다.

### R-07 · 중간 · 칩 규칙과 기존 도구줄의 위치가 충돌한다 (L-1·L-4)

- 근거 — 기존 가이드는 결재함과 논리/물리 같은 보기를 세그먼트로 정한다. 개선 문서와 사전 목업은 적용 조건을 건수 줄에 둔다. 모델 표는 26px 칩을 쓰고, 공통 칩은 32px이다. 감사 로그는 ‘전체’를 포함해 8개다. `docs/ux/01-design-guide.md:157`, `docs/ux/10-design-improvements.md:39`, `docs/ux/mockups/dictionary.html:305`, `docs/ux/mockups/model.html:1115`, `docs/ux/mockups/assets/app.css:434`, `docs/ux/mockups/audit.html:25`, `docs/ux/mockups/audit.html:32`
- 권고 — 상태로 결과를 좁히는 동작은 칩, 업무함과 보기 전환은 세그먼트로 정한다. 일반 탐색 목록에서 32px를 기본으로 쓴다. 조건이 적으면 기존 건수 줄을 활용하고 넘칠 때만 다음 줄에 배치한다. 같은 조건을 두 곳에서 해제할 수 있다면 두 컨트롤의 상태를 동기화한다. 복수 선택은 같은 조건군 안에서 OR, 서로 다른 조건군 사이에서 AND로 정의한다.

### R-08 · 중간 · 한 번에 모든 동작을 소유하는 목록 도우미는 충돌 위험이 크다 (§3)

- 근거 — `wire`가 이미 문서에서 칩과 행을 처리한다. `filterRows`는 DOM 행의 표시만 바꾸고, 감사 로그와 표준 맞추기는 표시와 후속 처리를 자체 조합한다. 도메인 그룹은 계층과 좌우키를 관리한다. 엑셀은 편집 셀과 되돌리기 상태를 가진다. `docs/ux/mockups/assets/app.js:2041`, `docs/ux/mockups/assets/app.js:2046`, `docs/ux/mockups/assets/app.js:2082`, `docs/ux/mockups/audit.html:77`, `docs/ux/mockups/standardize.html:170`, `docs/ux/mockups/domain-groups.html:534`, `docs/ux/mockups/excel-import.html:684`, `docs/ux/mockups/excel-import.html:696`
- 권고 — 검색·정렬·표시 범위 계산부터 순수 함수로 공유한다. 주소와 UI 이벤트는 목록 루트별 연결 코드가 소유한다. 기존 `wire`와의 중복 실행을 막고, 건수와 빈 결과는 동일한 결과 모델에서 계산한다. 먼저 업로드와 감사 로그에서 검증하고, 사전은 별칭·권한·선택 계약을 고정한 뒤 옮긴다. 트리와 편집 표는 필요한 계산과 상태 표시만 가져간다.

### R-09 · 중간 · 화면별 표에 하위 목록과 적용 제외 기준이 빠졌다 (§0·§4)

- 근거 — 바구니 고르기 50행 외에도 편집 표와 값 표가 있다. 시스템 화면에 업무 영역 목록, 산출물 화면에 최근 생성 목록, 마이페이지에 내 작업 표, 공통표준에 원본 코드 외 탭이 있다. 홈 요약과 DDL 가져오기 미리보기에도 표가 있다. `docs/ux/mockups/dict-grid.html:122`, `docs/ux/mockups/dict-grid.html:125`, `docs/ux/mockups/dict-grid.html:129`, `docs/ux/mockups/dict-grid.html:931`, `docs/ux/mockups/system.html:31`, `docs/ux/mockups/outputs.html:48`, `docs/ux/mockups/mypage.html:53`, `docs/ux/mockups/std-common.html:141`, `docs/ux/mockups/home.html:124`, `docs/ux/mockups/import.html:32`
- 권고 — 시스템·산출물·내 작업·공통표준의 별도 목록을 §0과 §4에 추가한다. 홈 요약, 상세 내부 표, 미리보기, 설정용 표에는 필요한 기본 표 규칙을 명시한다. 결재함 집계도 본문 목록과 함께 분류한다. `docs/ux/mockups/approvals.html:220`

### R-10 · 낮음 · 기본 밀도와 개인화는 화면 수요에 따라 도입한다 (L-5·L-8)

- 근거 — 공통 CSS에는 스크롤 영역과 고정 머리글이 있다. 사전은 선택·이름·버전·사용처를 한 줄에 놓고, 업로드는 파일과 여러 처리 상태를 한 줄에 놓는다. 사전에 저장 검색과 내려받기 메뉴가 있으며, 감사 로그의 내려받기는 목업 알림이다. `docs/ux/mockups/assets/app.css:338`, `docs/ux/mockups/assets/app.css:460`, `docs/ux/mockups/dictionary.html:100`, `docs/ux/mockups/uploads.html:26`, `docs/ux/mockups/dictionary.html:740`, `docs/ux/mockups/dictionary.html:415`, `docs/ux/mockups/audit.html:83`
- 권고 — 기본 열 순서와 너비를 화면별로 정한다. 상세 패널을 열어도 이름과 식별자를 확인할 수 있게 한다. 가로 스크롤이 필요한 표에만 핵심 열 고정을 적용한다. 열 너비 조정, 다중 정렬, 저장 보기는 반복 수요를 확인한 화면부터 도입한다. 사전의 저장 검색은 유지하고, 단순 이력은 공유 링크로 시작한다.

### §0에 함께 반영할 코드 사실

- 결재함의 검색은 유형·단계와 별개로 여러 문자열을 이어 붙여 비교한다. 설정 사용자 검색은 각 필드를 소문자로 비교하며 인라인에 결과와 전체 인원을 함께 표시한다. 사용자의 Enter는 행 열기를 호출한다. `docs/ux/mockups/approvals.html:177`, `docs/ux/mockups/approvals.html:178`, `docs/ux/mockups/settings.html:339`, `docs/ux/mockups/settings.html:340`, `docs/ux/mockups/settings.html:468`
- 도메인 그룹과 공통표준 코드 탭의 빈 결과는 셀 안의 별도 빈 상태 요소다. 업로드는 결과가 남으면 필터 변경 뒤 첫 행을 다시 고른다. 후보 큐도 선택 행이 결과에서 빠지면 첫 행을 고른다. `docs/ux/mockups/domain-groups.html:205`, `docs/ux/mockups/std-common.html:230`, `docs/ux/mockups/uploads.html:42`, `docs/ux/mockups/uploads.html:98`, `docs/ux/mockups/candidates.html:66`
- 엑셀 검수는 주소에서 작업 재개·검증 대상과 단계 정보를 복원한다. 목록 상태의 주소 저장 여부와 업무 진입 링크를 §0의 별도 항목으로 기록한다. `docs/ux/mockups/excel-import.html:430`, `docs/ux/mockups/excel-import.html:463`
- 감사 로그의 화면 목록은 결과를 전부 그리지만, 목업의 신규 감사 이벤트 저장은 300개로 제한한다. §0의 행 상한은 표시 제한으로 명시한다. `docs/ux/mockups/audit.html:77`, `docs/ux/mockups/assets/app.js:889`

## 화면별 적용 순서

| 순서 | 화면 | §4에 보강할 작업 |
|---|---|---|
| 1 | 사전·바구니 고르기 | 표시 범위와 전체 선택을 일치시킨다. 50행 제한과 나머지 접근 경로를 보인다. |
| 1 | 업로드·후보 큐·결재함 | 빈 결과와 첫 선택 정책을 정한다. 항목 링크와 권한별 복원을 검증한다. |
| 1 | 감사 로그·변경 내역 | 검색 필드와 기간의 의미를 정한다. 건수와 내보내기 범위를 맞춘다. |
| 2 | 도메인 그룹·공통표준·설정 사용자 | 칩과 접근성 상태를 맞춘다. 트리 접힘과 열람·편집 상태를 보존한다. |
| 2 | 표준 맞추기·엑셀 검수·모델 표·바구니 편집·용어 마법사 | 빈 결과와 선택 범위를 맞춘다. 기존 편집·검증·되돌리기 범위를 확인한다. |
| 3 | 마이페이지·시스템·산출물·소형 표 | 내 신청 요약의 집계를 맞춘다. 누락된 목록에 건수와 상태를 적용한다. |

## Q1~Q5 권고

| 결정 | 권고 | 이유 |
|---|---|---|
| Q1 정렬 | **안 A를 탐색 목록에 선택 적용.** 날짜·이름·건수 등 비교 가능한 열만 허용한다. 큐는 업무 우선순위를 기본으로 두고, 편집 표는 원본 행 순서를 유지한다. | 사전의 관련도와 결재함의 내 차례를 기본으로 보존할 수 있다. 동률에는 고정 보조 키를 쓴다. |
| Q2 상한 | **500은 사전 목업의 표시 기본값.** 바구니의 50은 유지하고 추가 탐색 경로를 제공한다. 실제 조회는 연속 로드나 페이지로 끝까지 접근하게 한다. | 1.6만 건의 사전이나 감사 결과에서 고정 절단은 검토 누락을 만들 수 있다. 가상 스크롤은 렌더링 비용을 줄이는 구현 선택이다. |
| Q3 자동 선택 | **첫 진입과 필터 변경 시 기본 닫힘.** 유효한 상세 링크와 사용자가 이미 연 행은 복원한다. 처리 완료 뒤 다음 행으로 이동하는 동작은 큐에 명시한다. | 검토 대상이 조용히 바뀌는 일을 줄이고 연속 처리에 필요한 이동은 유지한다. |
| Q4 칩 초과 | **자주 쓰는 상태와 전체를 앞에 두고 나머지는 ‘상태 더 보기’에 둔다.** 접힌 상태의 적용 여부와 해제 방법을 표시한다. | 엑셀의 상태와 오류 규칙을 함께 쓰는 흐름을 유지하면서 도구줄을 줄일 수 있다. 감사 로그에도 적용할 수 있다. |
| Q5 주소 기록 | **조건 변경은 `replaceState`를 기본으로 한다.** 독립 화면으로 이동하는 링크는 일반 탐색을 따른다. 함 전환을 뒤로 가기로 되돌려야 한다면 확정 전환에만 `pushState`를 쓰고 `popstate`로 복원한다. | 검색 입력마다 브라우저 이력이 늘어나는 일을 막고, 뒤로 가기의 단위를 예측할 수 있다. |

## 표준에 추가할 문구

- **L-12 적용 범위.** 조회 목록에는 검색·조건·정렬·상태 복원을 적용한다. 편집 표와 트리 표는 공통 상태 표시를 사용하고 편집·계층 탐색 키는 화면에서 정한다. 요약·미리보기·상세 내부 표에는 기본 표 의미와 빈 상태를 적용한다.
- **L-13 로딩·오류·갱신.** 최초 로딩, 재조회, 실패, 빈 결과를 구분한다. 재조회 중에는 마지막 성공 결과와 조건을 표시하고 건수 갱신을 알린다. 실패하면 조건과 작업을 보존하고 다시 시도할 수 있게 한다. 응답 순서가 바뀌어도 최신 요청의 결과만 적용한다. 큐에 새 항목이 도착하면 새 건수를 알리고, 사용자가 갱신할 때 초점과 선택을 행 ID 기준으로 복원한다. 대상 버전이나 권한이 바뀌면 실행 직전에 확인한다. 엑셀은 이미 다른 탭의 변경을 검출한다. `docs/ux/mockups/styleguide.html:113`, `docs/ux/mockups/excel-import.html:498`, `docs/ux/mockups/approvals.html:632`
- **L-14 열과 정렬.** 기본 열 순서와 최소 너비를 정한다. 가로 스크롤이 필요한 표는 식별 열을 고정할 수 있다. 고정 열과 머리글이 초점이나 셀을 가리지 않게 한다. 열 너비를 조절할 수 있으면 키보드 조작과 기본값 복원을 제공한다. 정렬 가능한 머리글에 버튼을 두고 현재 정렬 열의 머리글에 방향을 표시한다. 다중 정렬을 제공하는 화면은 열 순서와 각 방향을 표시한다. `docs/ux/mockups/assets/app.css:460`, `docs/ux/mockups/dictionary.html:100`
- **L-15 내보내기.** 내보내기 전에 범위와 건수를 표시한다. 현재 결과 전체는 표시 상한 밖의 일치 항목도 포함한다. 선택 항목은 숨은 선택 포함 여부를 알린다. 내보내기에는 조회 권한과 열별 공개 범위를 적용한다. 편집용 양식과 조회 결과 내보내기는 이름과 동작을 구분한다. `docs/ux/mockups/audit.html:83`, `docs/ux/mockups/dictionary.html:415`
- **L-16 대량 선택.** 머리글 체크는 표시 범위 안에서 선택 가능한 항목을 대상으로 하고 부분 선택 상태를 제공한다. 전체 검색 결과 선택이 필요한 화면은 별도 행동과 건수를 제공한다. 실행 직전에 적용 범위와 제외 건수를 알리고 권한·최신 상태를 확인한다. 처리에 실패한 항목은 이유와 함께 선택 상태를 남긴다. `docs/ux/mockups/dictionary.html:318`, `docs/ux/mockups/model.html:1155`
- **L-17 접근성.** 검색과 조건에 이름을 제공하고 버튼으로 조작할 수 있게 한다. 결과 건수와 오류는 보조 기술에 알리고 입력 중에는 초점을 유지한다. 행 초점, 열린 상세, 일괄 체크를 각각 표시한다. 편집 모드와 모달에서는 목록 단축키가 입력을 가로채지 않게 한다. 색만으로 선택과 오류를 구분하지 않는다. `docs/ux/mockups/dictionary.html:93`, `docs/ux/mockups/audit.html:82`, `docs/ux/mockups/excel-import.html:684`
- **L-18 저장 보기.** 반복 사용이 확인된 목록은 사용자별로 검색 조건·정렬·열 구성을 저장할 수 있다. 저장한 보기를 열 때 현재 권한과 유효한 조건을 다시 확인한다. 업무 기본 보기로 되돌리는 행동을 제공한다. `docs/ux/mockups/dictionary.html:740`
