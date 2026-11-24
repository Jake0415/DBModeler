# 리뷰 요청 — 바로잡기(25) 남은 네 가지 목업 반영

## 대상
- 기준 문서: `docs/ux/25-correction-flows.md` §8. 이전 리뷰와 종합은 [resolution-correction-flows](resolution-correction-flows.md)에 있다.
- 커밋: `8a95d24`.

## 바꾼 것
1. **이동 기록을 작업본 · 결재 사본에 고정**
   - `model.html`의 `MOVES`, `loadData`, `saveData`, `createDoc(... model.moves)`, `askMove`
   - `assets/app.js`의 `modelDiff`(사본의 `moves`를 먼저 쓴다)
2. **시스템별 데이터타입 매핑**
   - `settings.html` 시스템 탭: `TM` · `TM0` · `tmFill` · `tmDiffs`, `[data-tm]` 입력, `#tm-def`, 저장 막대(diff · drawDiff · revert · saveAll)와 연결, 시스템 등록 때 기본 매핑 저장
   - `assets/app.js`: `TM_ROWS`, `typeMapDefault`, `typeMapOf`, `saveTypeMap`, `convertTypeByMap`, `convertStructure`
3. **시스템 전체 한 번에 옮기기**
   - `system.html`: `#bulk-btn`, `#mo-bulk`, 처리 순서 `order()`, `plan()`, 실행 · 결과
   - `assets/app.js`: `copyAreaToSystem(…, pending)`, `relinkRefsIn`, `moveAreaToSystem`의 참조 다시 잇기
4. **담당 시스템을 코드로**
   - `assets/app.js`: `sysCodeOf`, `sysNameOf`, `sysNames`, 사용자 데이터 변환, `inScope`
   - 화면: `settings.html`(SYSOPT · 계정 패널 · 목록), `mypage.html`(역할 요청), `model.html`, `home.html`, `index.html`

## 화면
- http://localhost:5178/settings.html?as=lee#sys — 매핑 표, 시스템 등록
- http://localhost:5178/system.html?system=ERP&as=lee — [모든 영역 옮기기 · 복제]
- http://localhost:5178/model.html?area=e_wm&as=kim — 엔터티 메뉴 [다른 영역으로 옮기기…]

## 검토 요청
1. **데이터 무결성**
   - 이동 기록이 버전 · 결재 사본 · 다음 작업 버전(startNextVersion)에 걸쳐 맞게 이어지는가. 쌓이거나 잘못 표시되는 경우는 없는가.
   - 일괄 옮기기가 중간에 실패하면 어떻게 되는가. 순환 참조와 이름 충돌은 맞게 처리되는가.
   - 매핑 표가 비어 있거나 잘못 입력되면 타입 변환은 어떻게 되는가.
   - 사용자 데이터를 코드로 바꾸는 과정에 부작용은 없는가. 예: 보관 시스템, 같은 이름의 다른 시스템, 저장 시점.
2. **권한** — 일괄 옮기기 · 매핑 저장 · 코드로 바꾼 담당 범위 판정이 모든 화면(결재 · 모델 · 홈 · 가져오기 등)에서 같게 동작하는가.
3. **사용자 흐름 · 문구** — 일괄 옮기기의 미리 보기와 결과를 보고 다음 행동을 알 수 있는가. 매핑 표가 시스템마다 다르다는 것이 잘 드러나는가.
4. **접근성** — 새 창 · 표 · 버튼의 키보드 사용과 포커스.
5. 개선점은 번호 · 심각도(높음/중간/낮음) · 근거(파일:줄) · 제안으로 쓰고, 우선순위 순으로 정리하라. 고칠 필요가 없는 것은 ‘유지’로 적어라.

## 산출물
- 코드는 고치지 말고 리뷰 문서만 써라.
  - Codex: `docs/ux/review/codex-correction-four.md` (항목 번호 CQ-01부터)
  - UX 전문가: `docs/ux/review/claude-correction-four.md` (항목 번호 UQ-01부터)
