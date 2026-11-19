# D3 확인 검토: Claude (v10.1 수정 + v11 마무리)

> 대상: `assets/app.css` 612~666행("v10.1 fixes", "v11"), `assets/app.js`, 각 화면
> 기준: 09-geist-components.md, 08 §11
> 방법: 코드만 읽고 판단했다(브라우저 없음). 줄 번호는 지금 작업 사본 기준이다.

## 1. 직전 지적 확인

### Claude d2

| d2 ID | 확인 | 근거 |
|---|---|---|
| D2-01 상 (예외 배지 태그 노출) | 고침 | `model.html:424` innerHTML. 단 257행 배지 안에 flag 아이콘이 남음(아래 Codex D2-11 참고) |
| D2-02 비활성 이중 흐림 | 고침 | `app.css:614` `!important` 단일 표현(294·114행을 덮음). 비활성 주 버튼 hover도 `!important` 배경으로 고정됨 |
| D2-03 선택 = hover = 머리줄 | **일부** | 공통은 `app.css:616-617` blue-100으로 고침. **`excel-import.html:18` `#grid-body tr.sel td { background:var(--surface-2) }`**가 id 선택자라 이기므로 엑셀 검증 격자에서는 선택 행이 아직 gray-100(= hover = 머리줄)이다 → D3-04 |
| D2-04 배지 크기 | 일부 | `app.css:619` 24px/12. 화면 인라인 `height:16px` 배지가 남음: `model.html:603`(후보 대기), 59·297·471·771 |
| D2-05 오류 버튼 대비 | 고침 | 패널은 red-900 글자(약 5.4:1, `:622`), 모달은 `#da2f35`+`#fff`(4.7:1, `:624`) |
| D2-06 반려 채움 2개 | 고침 | `.btn.danger` 보조형(`:622`), 모달 안에서만 채움(`:624`). approvals 205-206·candidates 86은 자동으로 보조형이 됨 |
| D2-07 배지 안 체크·X | 일부 | dictionary 200·excel-import 80-84·import 93·settings 190 고침. **`standardize.html:118` 예외 라벨에 flag 아이콘**과 `model.html:257` 배지 안 flag가 남음 |
| D2-08 한 행 배지 하나 | 일부 | dictionary(출처는 글자)·candidates·mypage·dict-history는 고침. `model.html:603` 속성 행에 상태 배지(`stBadge`) + `후보 대기` 배지 2개가 남음 |
| D2-09 행 색 막대 | 고침(기호는 일부) | `app.css:629`로 막대 제거. **`standardize.html:118, 128`의 `! 미등록 단어`, `– 비대상`** 글자 기호가 그대로 → D3-05 |
| D2-10 반쯤 선택 | 고침 | `app.css:631, 633`(라이트·다크) |
| D2-11 색 점만으로 표시 | 고침 | 사전은 `신청 중` 글자로 바꿈(dictionary 200). sdot은 화면에서 쓰지 않음. 모델 캔버스는 `.stw` 상태 이름(`model.html:18-20, 462`) |

### Codex d2

| d2 ID | 확인 | 근거 |
|---|---|---|
| D2-01 예외 배지 textContent | 고침 | `model.html:424` |
| D2-02 indeterminate | 고침 | `app.css:631` |
| D2-03 다크 체크·스위치 대비 | 고침 | `app.css:632-636`(어두운 체크, 비활성 체크 gray-600, 손잡이 `--on-ink`) |
| D2-04 이름 없는 닫기·아이콘 칸 | 고침 | 아이콘만 있는 `<button>` 중 aria-label이 없는 것은 0건(전 화면 검색). sr-only는 approvals·import·settings·model에 있음 |
| D2-05 조작부 경계 대비 | 일부(의도적 보류 판단) | 입력 테두리는 gray-700(3.2:1, `:641`)으로 고침. 보조 버튼 링은 gray-500 `#c9c9c9`(약 1.6:1, `:644`). 글자가 있는 버튼은 1.4.11 대상이 아니므로 보류로 받아들일 수 있음 |
| D2-06 포커스 표시·aria-pressed | 일부 | 도구 막대 선택(`:638`)·공용 메뉴(`:639`)·사전 메뉴(`dictionary.html:17`)는 고침. `aria-pressed`는 `.chip`에만 자동으로 붙고(`app.js:863`) **`.seg`(내 정보 테마)·`.utabs`(결재함 탭)에는 없음** |
| D2-07 캔버스 상태 점만 | 고침 | `.stw` 글자. 단 중간 확대 단계(`lod-mid`)에서는 숨김(`model.html:20`). 의도한 것으로 봄 |
| D2-08 버튼·입력 크기 변형 | 일부 | `.btn.md` 36·`.btn.warn` 추가(`:626-627`), 선택 오른쪽 36(`:650`). `.btn.sm` 28·인라인 26/28px 입력은 남음. 09 §3에 기록됐다면 의도적 보류 |
| D2-09 로컬 메뉴·팝오버 규격 | 고침 | `dictionary.html:14-17`, `model.html:77-101`(반경 12·menu-shadow·36px 항목, 도구 막대 선택 gray-100) |
| D2-10 표 통일 | 고침(새 문제 있음) | `app.css:654-662` 전역 8px 상자. outputs 미리보기(`outputs.html:20-21`)는 문서 서식 미리보기라 별도 유지(의도적 보류로 봄). 새 문제는 아래 D3-01~03 |
| D2-11 남은 기호·배지 체크 | 일부 | 대부분 고침. **남음**: `standardize.html:118, 128`(`!`·`–`·배지 안 flag), `model.html:605`(`＋ 조합 가능` 배지), `model.html:772`(`＋ ‘값’ 그대로 입력`), `dictionary.html:200` 끝의 `'– 미사용'` 대체값 |

## 2. 새 상·중 발견

| ID | 등급 | 파일:줄 | 문제 | 고칠 방향 |
|---|---|---|---|---|
| D3-01 | 중 | `app.css:664-666` × `import.html:96` | `:has()` 빈 상태 규칙은 "행이 하나뿐이고 colspan 5~11 칸"이면 무조건 빈 상태로 바꾼다. DDL 가져오기에서 **테이블 0개 + 파싱 오류 1건**이면 오류 행(`<tr class="row-danger"><td colspan="6">오류…</td>`)이 머리줄이 사라진 **회색 "빈 상자" 아이콘 칸**으로 보인다. 오류가 "없음"처럼 읽힌다. | 판정을 구조가 아닌 표시로 한다. 빈 상태 행에만 `class="empty-row"`(또는 `data-empty`)를 붙이고, 규칙을 `.tbl:has(> tbody > tr.empty-row:only-child)`로 바꾼다. 현재 빈 메시지 행 17곳에 붙이면 된다. |
| D3-02 | 중 | `app.css:151`(th sticky) + `:654-656` | 모든 표에 바깥 테두리와 위쪽 둥근 모서리가 생겼는데 머리줄은 `position:sticky; top:0`이다. 긴 목록(사전·결재함·감사·변경 내역·업로드)을 내리면 표의 위 테두리는 같이 올라가 사라진다. 머리줄은 둥근 모서리(7px)를 단 채 위에 붙어 있어 **모서리 틈으로 아래 행이 비치고 머리줄 위 선이 없다.** 1920 목록 화면 대부분에서 보인다. | 스크롤 영역의 표(`.scroll > .tbl`, `.gbody .tbl`)는 머리줄 둥근 모서리를 없애고(`border-radius:0`) 머리줄에 `box-shadow:inset 0 1px 0 var(--ds-gray-400)`로 위 선을 그린다. 또는 테두리 상자를 표 대신 감싸는 `div`(overflow:auto, 반경 8)로 옮기고 그 안에서 sticky를 쓴다(Geist 방식). |
| D3-03 | 중 | `model.html:113-118, 699` | 모델 표 보기(`#grid`)는 이미 반경 8 + `shadow-5` 떠 있는 상자다. 그 안의 `.gbody > .tbl`이 다시 1px 테두리 + 8px 반경 상자가 되어 **상자 속 상자**가 된다(가장자리 이중선, 안쪽 둥근 모서리). 패널 안 작은 표(approvals 검사·예외·이력, model 점검 `:624`, uploads `:57` 열쇠-값 표)도 모두 상자가 되어 패널 하나에 상자 3~4개가 쌓인다. | `.tbl.flat`(이미 정의만 있고 사용 0건)을 `#grid .gbody > .tbl`과 패널 안 열쇠-값 표에 적용한다. 또는 `.rp-body .tbl, #grid .tbl { border:0; border-radius:0 }`. uploads 57의 항목·건수 표는 09 규칙대로 `.desc`로 바꾼다. |
| D3-04 | 중 | `excel-import.html:18` | 위 D2-03 일부: 엑셀 검증 격자의 선택 행이 `#grid-body tr.sel td { background:var(--surface-2) }`(id 선택자)라 공통 blue-100을 이긴다. 그래서 선택 = hover = 머리줄 gray-100이다. 오류 행을 고치며 오가는 화면이라 영향이 크다. | 18행을 지운다(공통 규칙을 따르게). |
| D3-05 | 중 | `standardize.html:118, 128` | "사전·표준 맞추기 기호 글자화"가 표준 맞추기에는 적용되지 않았다. 상태 라벨 `! 미등록 단어`, `– 비대상`, 배지 안 flag 아이콘(`b-violet`)이 표 행과 필터 칩 두 곳에 그대로다. 08 금지 1번과 09 배지 규칙 위반이다. | 라벨을 `미등록 단어`, `비대상`, `예외`로 바꾼다. 예외는 `tag ex`(점선) 하나로, 필터 칩은 글자만 쓴다. |

**하 (5개 이내)**
- `system.html:31`, `outputs.html:47`, `excel-import.html:57`, `index.html:57·68`: 표의 인라인 `overflow:hidden`이 표를 스크롤 컨테이너로 만들어 머리줄 sticky가 동작하지 않을 수 있다. v11 전역 테두리와도 겹치므로 인라인 `border·radius·overflow`를 지운다. `mypage`·`settings`의 인라인 `border:1px`도 같다.
- 머리줄 없는 표(approvals 이력 `:225`, model 점검 `:624`, excel-import `:290` 3방향 비교, home 내 후보·오래 머무는 결재)는 첫 행 위쪽 모서리 반경 규칙이 없다. 선택·hover 바탕이 둥근 테두리 밖으로 각지게 삐져나온다. `tbody > tr:first-child > td:first/last-child`에도 반경을 준다.
- 빈 메시지가 colspan 2~4인 표(approvals `:171·191`, ddl `:119`, excel-import `:249`)는 빈 상태 규칙을 받지 않아, 한 화면 안에서 빈 상태가 두 가지 모양이 된다. D3-01의 클래스 방식으로 같이 해결된다.
- `.scroll[style*="padding"] > table.tbl`(`:662`)은 인라인 style 문자열에 기대는 선택자라 깨지기 쉽다. `.scroll.padded` 같은 클래스로 바꾼다.
- `aria-pressed`가 `.seg`·`.utabs`에 없다(Codex D2-06 남은 부분). `pressed()`의 선택자를 `.chip, .seg button, .utabs button`으로 넓힌다.

## 3. 사용자 확인에 올려도 되는가

사용자 확인에 올려도 되는가: 아니오. 상 등급은 없습니다. 다만 D3-02(긴 목록을 내리면 머리줄 모서리가 깨짐)와 D3-03(모델 표 보기·패널의 상자 속 상자)은 거의 모든 목록 화면에서 바로 보이고, D3-01은 DDL 파싱 오류를 빈 상태로 잘못 보여 줍니다. 세 가지는 작은 CSS 수정으로 고칠 수 있으니 고친 뒤 올리는 것을 권합니다.
