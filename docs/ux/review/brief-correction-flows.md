# 리뷰 요청 — 잘못 입력한 값 바로잡기(25) 목업 반영

## 대상
- 기준 문서: `docs/ux/25-correction-flows.md`. 결정은 §5, 목업 반영 내용은 §6에 있다.
- 화면
  - `docs/ux/mockups/system.html` — http://localhost:5178/system.html?system=ERP&as=lee
    - 업무 영역 행 끝 ⋯ 메뉴, 영역 정보 수정 · 옮기기/복제 · 사용 중지/삭제 창, 보관함
  - `docs/ux/mockups/settings.html#sys` — `?as=lee`
    - [시스템 등록] · [시스템 정보] 창. DBMS는 등록 뒤 바꿀 수 없다.
  - `docs/ux/mockups/model.html` — `?area=e_wm&as=kim`
    - 모델 트리 엔터티 메뉴 [다른 영역으로 옮기기…] → `askMove()`
    - 트리 영역 메뉴의 세 항목은 시스템 홈의 창을 연다.
- 공통 코드
  - `docs/ux/mockups/assets/app.js`
    - 시스템 저장: `SYSLIST`, `saveSystems`, `activeSystems`
    - 업무 영역: `areaUse`, `areaHasHistory`, `saveAreaInfo`, `archiveArea`, `restoreArea`, `deleteArea`, `moveAreaToSystem`, `copyAreaToSystem`
    - 이동 기록: `moveLog`, `pushMove`
    - `modelDiff`의 ‘이동’ 표시, `getModels`(보관 영역 제외), 트리 메뉴 `menuOf`

## 결정 (사용자 확인)
1. 업무 영역 이름 변경은 결재 없이 바로 바꾸고, 감사 로그만 남긴다.
2. 엔터티의 영역 이동은 모델러가 직접 한다. 다음 확정 결재에서 DA가 확인한다.
3. DBMS는 바꿀 수 없다. 잘못 넣었으면 새 시스템을 등록하고, 업무 영역을 옮기거나 복제한 뒤 원래 시스템을 보관 · 삭제한다.

## 검토 요청
1. **규칙 결함** — 데이터가 깨지거나 이력이 사라질 수 있는 경우를 찾아라. 아래를 중심으로 본다.
   - 삭제 · 보관 · 옮기기 조건(확정본 · 결재 문서 · 참조 · 결재 중)
   - 엔터티 이동 때 관계 · FK 속성 · 보기(V) · id 충돌 처리
   - 여러 탭에서 동시에 작업할 때 덮어쓰기(이동이 대상 영역의 저장 수(rev)를 올리는데, 대상 영역을 연 다른 탭은 어떻게 되는가)
   - 보관 영역을 참조하던 영역, 보관 영역의 결재 문서가 결재함에서 어떻게 보이는가
2. **권한** — 누가 무엇을 할 수 있는가: 영역 정보 수정은 편집자 · 관리자, 옮기기 · 보관 · 삭제는 관리자, 엔터티 이동은 두 영역 편집자. 빠진 검사나 403 우회가 있는지 본다.
3. **사용자 흐름** — ‘DBMS를 잘못 넣음’ → 새 시스템 등록 → 영역 복제 → 원래 시스템 정리가 화면만 보고 따라갈 수 있는가. 안내 문구, 막힘 이유, 다음 행동이 잘 보이는지 본다.
4. **문구 · 접근성** — 창 제목 · 버튼 · 막힘 이유 문구, ⋯ 메뉴의 키보드 사용, 모달 포커스.
5. 개선점은 번호 · 심각도(높음/중간/낮음) · 근거(파일:줄) · 제안으로 쓰고, 우선순위 순으로 정리하라. 고칠 필요가 없는 것은 ‘유지’로 적어라.

## 산출물
- 코드는 고치지 말고 리뷰 문서만 써라.
  - Codex: `docs/ux/review/codex-correction-flows.md` (항목 번호 CF-01부터)
  - UX 전문가: `docs/ux/review/claude-correction-flows.md` (항목 번호 UC-01부터)
