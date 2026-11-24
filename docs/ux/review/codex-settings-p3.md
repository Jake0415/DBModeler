# 설정형 화면 P1~P3 재검토 · Codex

검토 기준은 커밋 `1ddbc36`의 마이페이지와 설정, 레이아웃 가이드 §3·§5·§8~10, 퍼블리싱 점검 S-1~S-9, 디자인 가이드의 키보드·접근성 규칙이다. 아래 동작과 폭은 소스에서 확인했다. 1920·1600의 실제 렌더링 및 화면 낭독기 검증은 완료하지 못했다.

## 개선 항목

### SP-01 · 테마 전환이 미저장 입력을 버릴 수 있음

- **심각도** 높음
- **근거** 테마 버튼은 저장소에 테마를 먼저 기록한 뒤 새로고침한다. 프로필이나 시작 화면에 미저장 값이 있으면 나가기 확인이 뜬다. 사용자가 새로고침을 취소하면 현재 테마는 그대로인데 선택값은 이미 저장되어 있고, 진행하면 미저장 입력이 사라진다. 앱 상단 메뉴에는 현재 문서를 유지하면서 테마를 적용하는 경로가 있다. `docs/ux/mockups/mypage.html:82`, `docs/ux/mockups/mypage.html:171`, `docs/ux/mockups/mypage.html:228`, `docs/ux/mockups/assets/app.js:2179`
- **제안** 기존 즉시 적용 경로를 사용하고 테마 버튼의 선택 상태를 함께 갱신한다. 프로필·시작 화면 초안과 하단 막대를 유지한다.

### SP-02 · 설정에서 편집할 수 있는 값 일부가 저장 대상에서 빠짐

- **심각도** 높음
- **근거** 기관명·기관 사전 이름·DBMS·버전/스키마가 편집 가능하지만 변경 감지 목록과 저장 처리에서 빠져 있다. 해당 값만 바꾸면 막대와 나가기 확인이 뜨지 않는다. 운영 목표 등 저장되는 값을 함께 바꾸면 ‘저장됨’이 떠서 편집한 값이 모두 반영됐다고 해석할 수 있다. 시스템 선택은 DBMS·버전 값을 다시 채운다. `docs/ux/mockups/settings.html:58`, `docs/ux/mockups/settings.html:95`, `docs/ux/mockups/settings.html:97`, `docs/ux/mockups/settings.html:243`, `docs/ux/mockups/settings.html:262`, `docs/ux/mockups/settings.html:312`, `docs/ux/mockups/settings.html:325`
- **제안** 목업에서 저장 경로가 없는 값은 조회 전용으로 표시하고, 저장을 시연하는 값은 변경 감지·변경 보기·검증·저장·되돌리기 범위에 함께 포함한다.

### SP-03 · 마이페이지 오류 탭을 열어도 오류 입력으로 포커스가 가지 않음

- **심각도** 중간
- **근거** 알림 설정이나 환경에서 저장하면 프로필 검증 함수가 숨겨진 입력에 먼저 포커스를 요청하고, 호출자가 뒤늦게 프로필 탭을 연다. 표시 이름 오류는 토스트로만 안내되며, 이메일 오류는 전화번호와 달리 입력과 오류 메시지가 연결되지 않는다. 설정은 오류 탭을 연 뒤 입력에 포커스를 준다. `docs/ux/mockups/mypage.html:38`, `docs/ux/mockups/mypage.html:149`, `docs/ux/mockups/mypage.html:221`, `docs/ux/mockups/settings.html:323`
- **제안** 실패한 입력과 사유를 받아 탭을 먼저 열고 해당 입력에 포커스를 준다. 각 오류를 입력 아래에서 표시하고 `aria-invalid`와 `aria-describedby`를 오류 해소 시까지 동기화한다.

### SP-04 · 같은 저장 막대의 실패·확인 처리 순서가 다름

- **심각도** 중간
- **근거** 마이페이지는 프로필 → 알림 설정 → 환경 순으로 저장하며 실패 시 중단한다. 현재 검증 실패를 반환하는 프로필이 첫 번째여서 ‘앞선 탭만 저장’ 분기는 형식 오류로 도달하지 않는다. 설정은 숫자 검증 실패 시 전체를 보류하며, 기관 값이 틀려도 유효한 검수 기준 변경의 영향 확인 창이 먼저 뜰 수 있다. `docs/ux/mockups/mypage.html:149`, `docs/ux/mockups/mypage.html:177`, `docs/ux/mockups/mypage.html:215`, `docs/ux/mockups/settings.html:316`, `docs/ux/24-settings-layout-guide.md:161`
- **제안** 두 화면 모두 변경값 검증 → 오류 탭 열기 → 필요한 영향 확인 → 저장 순으로 맞춘다. 부분 저장을 유지할 경우에는 저장된 탭과 보류된 탭을 막대에서 명시하고, 되돌리기는 실제로 저장한 기준값을 사용한다.

### SP-05 · 변경 보기와 탭 상태의 키보드·낭독 단서 부족

- **심각도** 중간
- **근거** 두 화면의 변경 목록은 `role="dialog"`지만 열 때 목록으로 포커스를 옮기지 않고, 목록 자체에도 포커스 가능한 요소가 없다. 입력을 키보드로 바꾸는 동안 목록은 다시 그려지지 않는다. 변경 점은 낭독에서 숨기고 탭 버튼의 `title`만 갱신하며, 활성 탭 전환도 CSS 클래스만 바꾼다. 저장·되돌리기 후에는 사용 중인 버튼이 사라진다. `docs/ux/mockups/mypage.html:25`, `docs/ux/mockups/mypage.html:89`, `docs/ux/mockups/mypage.html:187`, `docs/ux/mockups/mypage.html:209`, `docs/ux/mockups/settings.html:212`, `docs/ux/mockups/settings.html:273`, `docs/ux/mockups/settings.html:304`, `docs/ux/mockups/assets/app.js:2260`, `docs/ux/01-design-guide.md:206`
- **제안** 변경 보기를 버튼 다음에 읽을 수 있는 펼침 영역으로 제공하고, 열린 동안 목록을 갱신하며 변경이 없어지면 닫는다. 탭의 선택 상태와 미저장 건수를 접근성 이름 또는 설명에 반영한다. 저장·되돌리기 후에는 활성 탭 등 계속 쓸 수 있는 위치로 포커스를 돌린다.

### SP-06 · 저장·되돌리기의 기준값이 실제 저장값과 어긋남

- **심각도** 중간
- **근거** 프로필은 공백을 제거하고 이메일을 소문자로 저장하지만, 입력값은 그대로 두고 그 값을 새 비교 기준으로 삼는다. 따라서 저장 후 되돌리기는 이전 표시값으로 돌아가고, 새로 열면 실제 저장한 값이 나타난다. 두 화면에서 ‘되돌리기’의 전체 탭 적용 범위는 버튼 이름과 설명만으로는 드러나지 않는다. `docs/ux/mockups/mypage.html:91`, `docs/ux/mockups/mypage.html:149`, `docs/ux/mockups/mypage.html:201`, `docs/ux/mockups/mypage.html:218`, `docs/ux/mockups/settings.html:214`, `docs/ux/mockups/settings.html:292`
- **제안** 프로필 입력에 정규화된 저장값을 반영한 뒤 비교 기준을 갱신한다. 두 화면의 버튼이나 설명에 ‘모든 탭의 미저장 변경’을 명시한다.

### SP-07 · 즉시 적용과 메일 정책 안내가 행마다 다름

- **심각도** 중간
- **근거** 테마·밀도는 ‘누르면 바로 적용’, 단축키는 ‘바로 적용’, 비밀번호는 ‘아래 저장 막대와 따로’라고 안내한다. 막대가 없을 때 비밀번호 안내의 참조점이 없고, 세션 행에는 즉시 적용 안내가 없다. 세션 로그아웃 버튼의 목업 동작은 현재 행 제거와 토스트이며 재진입 시 정적 행이 다시 나타난다. 알림 표 설명은 앱 알림과 메일을 함께 소개한 뒤 ‘끈 종류는 알림 목록에 오지 않습니다’라고 해 메일 체크에도 해당하는 것으로 읽힌다. 설정의 메일 보조 칸은 발송 대상과 앱 전용 유형을 구분한다. `docs/ux/mockups/mypage.html:61`, `docs/ux/mockups/mypage.html:72`, `docs/ux/mockups/mypage.html:74`, `docs/ux/mockups/mypage.html:82`, `docs/ux/mockups/mypage.html:144`, `docs/ux/mockups/settings.html:86`
- **제안** 즉시 적용 행의 첫 문구를 ‘바로 적용됩니다’로 통일한다. 세션은 ‘선택한 기기에서 바로 로그아웃합니다’로 범위를 표시하고, 목업에서 시연하는 범위도 문구에 맞춘다. 알림 안내는 ‘앱 알림을 끄면 알림 목록에 표시되지 않습니다’와 ‘메일은 결재선 담당자에게만 보냅니다’로 나눈다.

### SP-08 · 넓은 행의 오른쪽 여백을 줄이고 시선 이동을 정리할 여지가 있음

- **심각도** 낮음
- **근거** 공통 CSS의 일반 행은 라벨 240px, 입력 최대 760px, 보조 칸 앞 간격 32px을 사용한다. 환경의 짧은 조작부와 최대 360px 비밀번호 폼은 입력 칸 왼쪽에 모이지만 안내는 세 번째 칸에서 시작한다. 알림·세션 표는 2열 최대 1200px로, 가이드 본문 폭 1875·1560px을 대입하면 라벨과 첫 간격까지 포함한 표 오른쪽에 약 411·96px이 남는다. 이는 실제 화면 실측 전 CSS 기반 추정이며, 1200px 표 상한과 양립한다. 마이페이지 알림·세션과 설정 시스템 넓은 행에는 표 바로 바깥의 가로 스크롤 지정이 없다. 현재 데이터에서 표가 넘친다는 관찰은 없다. `docs/ux/mockups/mypage.html:14`, `docs/ux/mockups/mypage.html:59`, `docs/ux/mockups/mypage.html:73`, `docs/ux/mockups/mypage.html:82`, `docs/ux/mockups/settings.html:105`, `docs/ux/mockups/settings.html:116`, `docs/ux/mockups/assets/app.css:876`, `docs/ux/24-settings-layout-guide.md:45`
- **제안** 표 상한과 행 정렬을 유지한다. 알림 표의 짧은 체크 열 너비를 정해 항목명에서 체크 두 칸까지의 거리를 줄이고, 긴 텍스트로 가로 넘침이 발생하는 표는 표 자체의 래퍼에서 스크롤한다. 즉시 적용 여부는 조작부에서 가까운 위치에서도 확인할 수 있게 한다.

### SP-09 · 보조 칸 말투와 소제목 구성을 맞출 여지가 있음

- **심각도** 낮음
- **근거** 프로필은 ‘계정 · 역할’ 제목을 사용하지만, 인증·비밀번호와 세션·로그인 기록을 다루는 보안에는 소제목이 없다. 설정 기관 탭은 주제별 소제목을 둔다. 프로필 설명은 ‘관리자’와 ‘Admin’을 섞고 이미 ‘조회 전용’인 역할 행에서 직접 변경할 수 없다는 정보를 반복한다. 비밀번호의 마지막 변경일은 라벨 쪽에 있어 보조 칸의 마지막 변경 우선 규칙과 다르다. `docs/ux/mockups/mypage.html:34`, `docs/ux/mockups/mypage.html:43`, `docs/ux/mockups/mypage.html:64`, `docs/ux/mockups/settings.html:57`, `docs/ux/mockups/settings.html:85`, `docs/ux/24-settings-layout-guide.md:68`
- **제안** 보안을 ‘인증 · 접속 기록’으로 묶고 비밀번호 변경일을 보조 칸 첫 줄로 옮긴다. ‘관리자에게 수정 요청하세요’, ‘처리 결과는 알림으로 알려 드립니다’처럼 행에서 필요한 행동과 결과를 짧게 쓴다.

## 유지

- **행·표 탭 구분.** 두 화면은 920·960px 상자 없이 공통 행과 소제목 규칙을 사용한다. 마이페이지의 ‘내 신청 · 내 작업’은 설정의 사용자·역할·권한표와 같이 전체 폭 표 탭으로 둔다. 3칸 폼 행으로 바꿀 필요가 없다. `docs/ux/mockups/mypage.html:33`, `docs/ux/mockups/mypage.html:46`, `docs/ux/mockups/mypage.html:53`, `docs/ux/mockups/settings.html:133`, `docs/ux/mockups/settings.html:151`, `docs/ux/mockups/assets/app.css:875`, `docs/ux/24-settings-layout-guide.md:112`
- **막대 기본 구성과 화면 안내.** ‘저장하지 않은 변경 n건 · 탭 이름’, 변경 보기, 되돌리기, 저장과 저장 시각의 표시가 두 화면에 공통이다. 일반 탭 이동은 패널 표시만 바꾸므로 초안이 남고, 공통 막대 대상의 변경은 페이지 이탈 시 브라우저 확인을 요청한다. 화면 안내는 동일 함수가 탭 줄 끝에 버튼을 넣고 해당 탭의 내용을 아래에 펼친다. `docs/ux/mockups/mypage.html:187`, `docs/ux/mockups/mypage.html:228`, `docs/ux/mockups/settings.html:273`, `docs/ux/mockups/settings.html:312`, `docs/ux/mockups/assets/app.js:1265`, `docs/ux/mockups/assets/app.js:1294`, `docs/ux/mockups/assets/app.js:1324`, `docs/ux/mockups/assets/app.js:2062`, `docs/ux/mockups/assets/app.js:2260`
- **공통 CSS 사용 범위.** `docs/ux/mockups`에서 `.set-row`와 `.setbar`의 사용 화면은 마이페이지와 설정이다. 별도의 `.tdot` 문자열은 공통 JS의 모델 트리 생성 경로에 있으나, 탭 상태용 선택자는 `.tabs` 아래로 한정돼 그 경로와 겹치지 않는다. 검색 범위에서 공통 CSS 이동으로 영향을 받는 제3의 화면은 발견되지 않았다. `docs/ux/mockups/assets/app.css:329`, `docs/ux/mockups/assets/app.css:874`, `docs/ux/mockups/assets/app.js:1511`, `docs/ux/mockups/assets/app.js:1707`

## 우선순위 요약

| 우선순위 | 심각도 | 항목 | 개선 목표 |
|---|---|---|---|
| 1 | 높음 | SP-01 | 테마 적용 중 미저장 입력 보존 |
| 2 | 높음 | SP-02 | 편집 가능 여부와 저장 범위 일치 |
| 3 | 중간 | SP-03 | 오류 탭 표시 후 입력에 포커스 |
| 4 | 중간 | SP-04 | 검증·영향 확인·저장 순서 통일 |
| 5 | 중간 | SP-05 | 변경 보기와 탭 상태의 키보드·낭독 지원 |
| 6 | 중간 | SP-06 | 실제 저장값 및 되돌리기 범위 표시 |
| 7 | 중간 | SP-07 | 즉시 적용과 알림 정책 안내 명확화 |
| 8 | 낮음 | SP-08 | 표 안 시선 이동 및 넘침 처리 |
| 9 | 낮음 | SP-09 | 보조 문구와 소제목 정리 |
