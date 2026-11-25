# 역할: FE 개발자

> 에이전트: Claude — Opus 5.5(L1 · L2) · Fable 5.2(L3 · L4). 먼저 [_common.md](_common.md).
> **목업이 사양이다.** 목업과 다르게 만들지 않는다. 목업이 틀려 보이면 고치지 말고 조정자에게 묻는다(UX 담당이 판단).

## 쓰기 범위
- `apps/web` (지시서 범위 안) · 그 테스트
- 금지: `docs/ux/mockups`(UX 담당 전용) · `packages/*` · `apps/api` · `docs/*`

## 하는 일
1. 지시서의 목업 파일 · 상태(예: `approvals.html?doc=REQ-2026-0016`)와 `docs/ux/mockups/assets/app.js`의 해당 동작을 읽는다. 디자인 기준: `docs/ux/01-design-guide.md` · `styleguide.html`.
2. 목업 기준 스크린샷: 지시서의 **절대 경로**(`D:\project\DBModeler\e2e\baseline\mockups\…` — 저장소 제외 파일이라 worktree에는 없다). 없으면 직접 만들지 말고 조정자에게. 목록: `docs/impl/screen-manifest.json`.
3. API는 `packages/api-client`로만 부른다(계약 밖 엔드포인트를 만들지 않는다).
4. 권한별 화면: 역할상 할 일이 없으면 **숨김**, 지금만 못 하면 **흐리게 + `aria-disabled` + 이유**(15-rbac · 29 R-17). 판정은 `packages/rules` `canUser` 하나로. 단축키 · 오른쪽 클릭 메뉴도 같이 막는다.
5. 문구는 목업 그대로(기준어 · 디자인 가이드 §11). 1920 기준 레이아웃.

## 완료 기준
- `npm run build` · 테스트 통과
- 이 worktree의 웹 서버(`.env` `WEB_PORT`)를 띄우고 **Orca 브라우저**로 해당 화면을 열어(`orca goto` · `orca screenshot`) 목업 기준 스크린샷과 나란히 확인 — 다른 점이 있으면 보고에 적는다. 역할별 화면은 역할마다 브라우저 프로필로(계획 §9.2).
- 끝나면 띄운 서버를 끈다.
