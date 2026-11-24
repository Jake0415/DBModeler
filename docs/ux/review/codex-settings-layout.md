# 설정 화면 배치 UX 리뷰

**총평** — 1920px에서 기관·시스템·검수 기준의 오른쪽 여백이 940px에 달하므로, 다섯 탭의 본문과 저장 막대 안쪽을 같은 1280px 중앙 열에 맞추고 항목별로 입력 폭을 제한하는 안을 권고한다.

## 지적 사항

폭은 브라우저 측정값을 확보하지 못해 관리자 경로 `settings.html?as=lee&audit=1`의 HTML과 CSS로 계산했다. 아래 수치는 1920px·1600px 앱 프레임에서 세로 스크롤바가 폭을 차지하지 않는 경우의 명목값이다. 글꼴별 줄바꿈, 표의 실제 최소 폭과 조작 시 화면 변화는 실측이 필요하다. 근거는 `docs/ux/mockups/assets/app.js:18`, `docs/ux/mockups/assets/app.css:38`, `docs/ux/mockups/assets/app.css:65`, `docs/ux/mockups/assets/app.css:119`.

| ID | 심각도 | 근거 및 영향 → 권고 |
|---|---|---|
| SL-01 | 높음 | 설정은 트리 없는 단일 그리드 열이다. 본문 좌우 패딩 20px 안에서 기관·시스템·검수 기준은 x=20부터 960px을 쓰므로 좌/우 여백이 1920에서 20/940px, 1600에서 20/620px이다. 화면을 훑을 때 정보가 왼쪽에 몰리고, 폭이 커져도 입력과 표는 공간을 얻지 못한다. → 본문을 중앙 정렬한다. `docs/ux/mockups/assets/app.js:2023`, `docs/ux/mockups/assets/app.css:106`, `docs/ux/mockups/assets/app.css:113`, `docs/ux/mockups/settings.html:12`, `docs/ux/mockups/settings.html:59`, `docs/ux/mockups/settings.html:62`, `docs/ux/mockups/settings.html:98`, `docs/ux/mockups/settings.html:165` |
| SL-02 | 중간 | 라벨·설명 240px과 간격 24px을 빼면 입력 칸은 명목 696px이다. 기관의 결재선 템플릿은 이 칸에 4열 그리드 두 개를, 시스템은 5열 매핑 표와 6열 컬럼 표를 넣는다. 검수 기준의 필드 표와 변경 이력은 이미 본문 폭을 쓴다. → 한 줄 입력은 길이를 제한하고, 열이 많은 표는 필요할 때 섹션 전체 폭을 쓴다. `docs/ux/mockups/settings.html:13`, `docs/ux/mockups/settings.html:15`, `docs/ux/mockups/settings.html:69`, `docs/ux/mockups/settings.html:107`, `docs/ux/mockups/settings.html:118`, `docs/ux/mockups/settings.html:168`, `docs/ux/mockups/settings.html:193` |
| SL-03 | 높음 | 실제 탭은 5개이며 **사용자 · 역할**은 한 탭이다. 사용자 · 역할 작업 영역과 권한표는 1880/1560px을 써서 폼과 폭이 920/600px 차이 난다. 사용자 · 역할은 열린 계정 상세 패널도 포함한다. 전환할 때 좌측 시작점은 같지만 오른쪽 끝과 시선이 따라가는 거리가 달라진다. → 다섯 탭의 바깥 폭을 맞추고 사용자 목록과 상세의 필요 폭은 따로 검증한다. `docs/ux/mockups/settings.html:52`, `docs/ux/mockups/settings.html:134`, `docs/ux/mockups/settings.html:136`, `docs/ux/mockups/settings.html:144`, `docs/ux/mockups/settings.html:152`, `docs/ux/mockups/assets/app.css:521` |
| SL-04 | 높음 | 저장 막대는 스크롤 영역 아래의 56px 형제 요소다. 상태 문구 왼쪽과 탭의 미저장 점은 변경을 알려주지만, 버튼 묶음 끝은 x=1900/1580으로 폼 끝 x=980과 920/600px 떨어진다. 저장 전까지 다른 탭을 보더라도 공동 저장 범위를 알 수 있어야 한다. → 문구와 버튼을 본문 양끝에 정렬하고 변경 건수·탭 이름과 기존 사용자별 저장을 유지한다. 실제 저장 대상 필드만 미저장 표시를 만든다. `docs/ux/mockups/settings.html:19`, `docs/ux/mockups/settings.html:21`, `docs/ux/mockups/settings.html:208`, `docs/ux/mockups/settings.html:260`, `docs/ux/mockups/settings.html:273`, `docs/ux/mockups/settings.html:419` |
| SL-05 | 중간 | 마이페이지도 같은 문제가 있다. 프로필·알림 설정·보안·환경은 x=20부터 920px로 오른쪽이 980/660px 남고, 내 신청·내 작업은 1880/1560px을 쓴다. 알림 설정은 표가 들어 있어도 폭이 좁은 편집 탭이다. → 설정과 같은 중앙 열을 적용하고 내 신청은 기존 요약과 결재함 링크를 유지한다. `docs/ux/mockups/mypage.html:12`, `docs/ux/mockups/mypage.html:35`, `docs/ux/mockups/mypage.html:48`, `docs/ux/mockups/mypage.html:52`, `docs/ux/mockups/mypage.html:55`, `docs/ux/mockups/mypage.html:60`, `docs/ux/mockups/mypage.html:66`, `docs/ux/mockups/mypage.html:82`, `docs/ux/22-list-standard.md:150` |
| SL-06 | 낮음 | 브리프의 ‘머리 오른쪽’은 제목 행을 가리킨다. 설정에서는 런타임 코드가 제목 행에 [ⓘ 화면 안내]를 붙이고, 펼친 패널은 탭 바로 뒤에 둔다. 가이드 표는 토글을 탭 줄에 둔다고 기술한다. → 탭형 설정 화면의 토글을 탭 줄 오른쪽에 맞추고, 탭별 안내와 키보드 동작을 재사용한다. `docs/ux/mockups/assets/app.js:1301`, `docs/ux/mockups/assets/app.js:2039`, `docs/ux/mockups/assets/app.css:617`, `docs/ux/01-design-guide.md:164`, `docs/ux/17-publishing-audit.md:151` |

### 비교 화면에서 폭을 쓰는 이유

- **감사 로그**는 검색·필터 아래의 7열 기록 표가 1880/1560px를 쓴다. 특히 변경 전후와 사유의 줄바꿈에 폭이 쓰인다. `docs/ux/mockups/audit.html:13`, `docs/ux/mockups/audit.html:25`, `docs/ux/mockups/audit.html:35`, `docs/ux/mockups/assets/app.css:545`
- **결재함**은 목록과 선택 문서 상세가 너비를 나눠 쓴다. 일반 상세는 420/380px이며, 사전 품의 항목을 검토하는 상세는 760/680px까지 쓰고 목록의 일부 열을 접는다. `docs/ux/mockups/approvals.html:26`, `docs/ux/mockups/approvals.html:94`, `docs/ux/mockups/approvals.html:111`, `docs/ux/mockups/approvals.html:120`, `docs/ux/mockups/approvals.html:535`, `docs/ux/mockups/assets/app.css:587`
- **표준 사전**은 11열 찾기 목록과 선택 상세·신청 패널을 위한 작업 화면이다. **모델**은 왼쪽 객체 트리와 캔버스가 프레임을 나눠 쓰며 기본 트리 폭은 264px, 접으면 56px이다. 이 화면들의 너비는 표 탐색과 동시 작업에 쓰인다. `docs/ux/mockups/dictionary.html:92`, `docs/ux/mockups/dictionary.html:100`, `docs/ux/mockups/model.html:13`, `docs/ux/mockups/assets/app.css:37`, `docs/ux/mockups/assets/app.css:110`, `docs/ux/mockups/assets/app.js:2023`

## 후보 비교

후보별 숫자는 px 단위의 설계 예산이다. 두 수치의 순서는 1920 / 1600이며, 바깥 여백에는 기본 패딩이 포함된다.

| 안 | 1920 / 1600 예산 | 폼·표 탭 적용과 장단점 | 난이도 |
|---|---|---|---|
| A. 960px 폼 중앙 정렬 | 폼 960, 한쪽 여백 480/320. 표 1880/1560 | 기존 행 구조로 가장 빨리 좌우 균형을 맞춘다. 본문 시작점이 탭을 바꿀 때 460/300px 이동하며, 폼 안쪽 표는 여전히 696px에 놓인다. 저장 막대 정렬도 별도로 해야 한다. | 낮음 |
| B. 왼쪽 섹션 목차 + 폼 | 192/160 + 24 + 960, 합계 1176/1144. 한쪽 여백 372/228 | 기관·시스템·검수 기준에서 하위 섹션을 바로 찾을 수 있다. 표 탭은 목차 없이 넓게 쓰므로 전환 시 틀이 달라진다. 자주 들어오지 않는 관리자가 몇 항목만 바꾸는 작업에는 상위 탭과 목차를 함께 읽는 비용이 생긴다. 앵커 이동, 키보드 초점, 현재 섹션 표시를 구현해야 한다. | 중간~높음 |
| C. 2열 항목 카드 | 1440/1320 안에서 708+24+708 / 648+24+648 | 기관의 독립 항목을 나란히 볼 수 있다. 시스템의 매핑·공통 컬럼, 검수 기준의 표·이력은 두 열을 합쳐야 한다. 카드 순서와 읽기 흐름을 다시 정해야 하며 표 탭은 별도 목록 배치를 쓴다. | 높음 |
| D. 오른쪽 도움말·마지막 변경·영향 범위 | 폼 960/960 + 간격 24 + 보조 열 320/280, 합계 1304/1264 | 중요한 정책 변경 전에 영향을 확인할 수 있다. 행 가까이 있는 영향 설명과 마지막 변경을 보조 열로 옮기면 해당 입력과의 연결이 약해진다. 사용자 · 역할에서는 계정 상세와 경쟁하고 권한표에서는 열이 줄어든다. 신뢰할 수 있는 변경·영향 데이터를 항목마다 연결해야 한다. `docs/ux/mockups/settings.html:64`, `docs/ux/mockups/settings.html:128`, `docs/ux/mockups/settings.html:287` | 중간~높음 |
| **E. 1280px 중앙 열 공유 + 항목별 폭 제한** | **320+1280+320 / 160+1280+160** | 폼과 표의 시작·끝, 탭 줄과 저장 위치를 고정한다. 기존 행 순서를 살리면서 넓은 표에 공간을 주고 짧은 입력은 적정 폭으로 둔다. 사용자 목록은 상세가 열리면 858/898px 명목 배분으로 줄어들어 실제 긴 값과 열 너비 검증이 필요하다. | 중간 |

## 권고안 E 와이어프레임

1280px은 제안값이다. 1600에서도 양쪽에 160px을 남기고 계정 상세 380px을 배치할 수 있다. 공통 상단 바와 헤더 배경은 프레임을 채운다. 제목·탭·안내 패널 내용·본문·공동 저장 막대 내용이 중앙 열의 양끝에 맞는다. 폼 행 예산은 **240 라벨 + 24 간격 + 1016 입력 영역**이다. 짧은 입력은 240~360px, 긴 텍스트 입력은 최대 640px을 기준으로 하며, 표·다열 입력은 1016px까지 쓴다. 두 줄 이상으로 설명이 길거나 열 비교가 중요한 표는 섹션 제목 아래 1280px을 쓸 수 있다.

```text
1920px  |<-- 320 -->|<------------------- 1280 ------------------->|<-- 320 -->|
상단 바 |=============================== 1920 전체 ==============================|
제목                설정
탭                  기관 ·  시스템  사용자 · 역할  권한표  검수 기준   [ⓘ 화면 안내]
안내                [펼쳤을 때 현재 탭 안내]
폼 본문             [라벨·설명 240] [24] [입력·결재선·표 1016]
                    [검수 기준 필드 표 / 변경 이력: 섹션 전체 1280]
표 본문             [사용자 · 역할: 목록 858 |2(외곽선 합)| 상세 420]
                    [권한표: 권한 매트릭스 1280]
하단                저장하지 않은 변경 1건 · 기관 설정           [되돌리기] [저장]
```

```text
1600px  |<- 160 ->|<-------------------- 1280 -------------------->|<- 160 ->|
상단 바 |=============================== 1600 전체 =============================|
제목              설정
탭                기관 ·  시스템  사용자 · 역할  권한표  검수 기준     [ⓘ 화면 안내]
안내              [펼쳤을 때 현재 탭 안내]
폼 본문           [라벨·설명 240] [24] [입력·결재선·표 1016]
                  [검수 기준 필드 표 / 변경 이력: 섹션 전체 1280]
표 본문           [사용자 · 역할: 목록 898 |2(외곽선 합)| 상세 380]
                  [권한표: 권한 매트릭스 1280]
하단              저장하지 않은 변경 1건 · 기관 설정             [되돌리기] [저장]
```

- **기관**은 기관명·운영 목표·승인 설정을 기존 순서로 놓고 결재선 두 블록을 입력 영역에 유지한다. **시스템**은 시스템 선택과 추가를 본문 상단에 두고, 데이터타입 매핑·시스템 컬럼 표는 1016px부터 검증해 열 간 비교가 어려우면 해당 섹션만 1280px을 쓴다. **검수 기준**은 필드 표와 이력을 1280px에, 검수 제외 설정을 공통 라벨 행에 놓는다. `docs/ux/mockups/settings.html:62`, `docs/ux/mockups/settings.html:69`, `docs/ux/mockups/settings.html:98`, `docs/ux/mockups/settings.html:107`, `docs/ux/mockups/settings.html:165`, `docs/ux/mockups/settings.html:197`
- **사용자 · 역할**은 인증 설정과 목록·상세 묶음이 1280px을 공유한다. 그림의 2px은 외곽선의 좌우 1px 합이며 상세 패널 너비에 자체 경계선이 포함된다. 목록 스크롤의 좌우 20px을 추가로 빼면 표 너비는 명목 **818/858px**이다. **권한표**는 같은 1280px 안에서 매트릭스를 채운다. 긴 회사명·담당 시스템·참고 문구는 줄바꿈을 우선하고, 비교에 필요한 열의 최소 폭이 초과되면 표 영역 안에서만 가로 스크롤한다. `docs/ux/mockups/settings.html:134`, `docs/ux/mockups/settings.html:136`, `docs/ux/mockups/settings.html:142`, `docs/ux/mockups/settings.html:152`, `docs/ux/mockups/assets/app.css:71`, `docs/ux/mockups/assets/app.css:545`, `docs/ux/mockups/assets/app.css:587`
- 하단 막대는 공동 저장 대상에 변경이 남았을 때 어느 탭에서든 보인다. 사용자 · 역할의 인증·계정 작업은 각자 기존 저장 위치를 쓴다. 권한표 자체에는 저장 액션을 두지 않는다. `docs/ux/mockups/settings.html:209`, `docs/ux/mockups/settings.html:260`, `docs/ux/mockups/settings.html:273`, `docs/ux/mockups/settings.html:341`, `docs/ux/mockups/settings.html:419`

## 설정형 화면 레이아웃 가이드

| 항목 | 규칙 |
|---|---|
| 적용 범위·정렬 | 설정과 마이페이지처럼 간헐적으로 값을 편집하고 관련 표를 확인하는 화면에 적용한다. 바깥 셸은 창을 채우고, 본문은 좌우 최소 20px 안에서 최대 1280px을 중앙 정렬한다. 탭 전환이나 안내 열기, 세로 스크롤바 유무에 따라 본문 정렬이 흔들리지 않게 한다. 감사 로그·결재함·사전 목록과 모델 캔버스는 기존 작업 영역 규칙을 따른다. `docs/ux/01-design-guide.md:127`, `docs/ux/01-design-guide.md:129` |
| 폼·간격 | 라벨과 영향 설명은 240px 열에, 입력은 24px 간격 뒤에 둔다. 행 위아래 16px, 섹션 사이 32px, 제목과 첫 컨트롤 사이 12px을 기본으로 한다. 마지막 변경은 해당 항목 설명 아래에 두고 긴 표는 필요한 섹션에서 전체 폭을 쓴다. `docs/ux/01-design-guide.md:95`, `docs/ux/mockups/settings.html:13`, `docs/ux/mockups/settings.html:16` |
| 표 탭 | 폼 탭과 **바깥 최대 폭을 통일**한다. 작은 표와 긴 설명은 내용에 맞춰 제한하고, 표 탭의 제목·검색·필터·건수·목록은 같은 열에 정렬한다. 목록은 검색·필터, 건수, 빈 결과, 행 선택, 열 표시 기준을 재사용한다. 마이페이지의 내 신청은 요약과 결재함 링크를 유지한다. `docs/ux/22-list-standard.md:53`, `docs/ux/22-list-standard.md:94`, `docs/ux/22-list-standard.md:99`, `docs/ux/22-list-standard.md:120`, `docs/ux/22-list-standard.md:145`, `docs/ux/22-list-standard.md:150` |
| 저장 막대 | 여러 탭의 변경을 함께 저장하는 경우 56px 막대를 스크롤 영역 아래에 둔다. 상태·변경 범위는 왼쪽, [되돌리기]와 주 버튼 [저장]은 오른쪽이며 양끝은 본문과 일치한다. 탭 점에 접근 가능한 미저장 상태 이름을 제공한다. 프로필·알림·환경처럼 탭별로 독립 저장하는 경우는 해당 섹션 아래 오른쪽에, 계정 상세는 패널 하단에 둔다. `docs/ux/mockups/settings.html:21`, `docs/ux/mockups/settings.html:210`, `docs/ux/mockups/settings.html:273`, `docs/ux/mockups/mypage.html:45`, `docs/ux/mockups/mypage.html:63`, `docs/ux/mockups/mypage.html:87` |
| 화면 안내 | 탭이 있는 설정형 화면에서 안내가 필요하면 탭 줄 오른쪽에 [ⓘ 화면 안내]를 두고, 펼친 내용은 탭 줄 바로 아래에서 같은 폭을 쓴다. 기본은 접힘으로 두고 기존 [ⓘ 화면 안내]·`?`·Esc 동작과 탭별 내용 갱신을 재사용한다. 입력의 결과나 영향 범위는 해당 행에 둔다. `docs/ux/01-design-guide.md:164`, `docs/ux/17-publishing-audit.md:151`, `docs/ux/mockups/assets/app.js:1301` |

## 우선순위

1. **P1** — 설정 다섯 탭에 중앙 열과 공동 저장 막대 정렬을 적용한다. 1920·1600에서 탭의 양끝, 미저장 상태에서 표 탭으로 전환했을 때의 저장 범위와 버튼 위치, 열린 계정 상세와 긴 표 값의 가로 넘침을 확인한다. 기존 퍼블리싱 점검은 첫 화면 위주이므로 나머지 탭과 안내·상세 상태는 따로 연다. `docs/ux/01-design-guide.md:214`, `docs/ux/17-publishing-audit.md:157`
2. **P2** — 같은 배치를 마이페이지에 적용하고, 설정의 안내 토글을 탭 줄에 정렬한다. 프로필 입력, 알림 설정 표, 보안 세션 표, 내 신청·내 작업과 기존 탭별 저장 위치를 확인한다. `docs/ux/mockups/mypage.html:35`, `docs/ux/mockups/mypage.html:48`, `docs/ux/mockups/mypage.html:60`, `docs/ux/mockups/mypage.html:66`, `docs/ux/mockups/assets/app.js:2039`
3. **P3** — 중앙 배치 적용 후에도 긴 설정 탭에서 섹션을 찾기 어렵다는 관찰이 반복될 때 섹션 목차를 재검토한다. 마지막 변경·영향 범위는 기존 항목 옆 표시부터 검증한다. `docs/ux/mockups/settings.html:64`, `docs/ux/mockups/settings.html:128`, `docs/ux/mockups/settings.html:287`
