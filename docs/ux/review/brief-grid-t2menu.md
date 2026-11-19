# 검토 요청: 속성 편집 그리드(16) + 모델 트리 T2 메뉴(12 §9.2)

NeoDB UX 목업(정적 HTML, `docs/ux/mockups`, `serve.ps1` → http://localhost:5178)의 최근 두 커밋을 검토해 주세요.

- `a562ebb` 속성 편집 그리드 — 설계 `docs/ux/16-attribute-edit-grid.md`
  - `model.html`의 `attrGrid` · `agPend` · `agDetail` · `agEdit` · `agDel` · `agPkOff` · `agMove` · `agRename` · `pkSpread` · `pkReach` · `placeAttr`, 오른쪽 패널(`#rp-body`) 이벤트
  - `ddl.html`의 DEFAULT · COMMENT ON COLUMN
- `6c37672` 트리 T2 메뉴 — 설계 `docs/ux/12-model-tree-plan.md` §4.3 · §9.2
  - `assets/app.js` `drawTree` 안의 `editWhy` · `menuOf` · `runCmd` · `openMenu` · `closeMenu` · 우클릭 · ⋯ · Shift+F10 · F2 · Delete
  - `model.html`의 `runTreeCmd` · `dbm-tree-cmd` · `?cmd=`
  - 입력 중 줄 정리(`dataReady` 근처), Esc 취소 저장

## 볼 것

1. **정합성 버그**
   - PK 전파 · 해제 · 삭제가 자식 · 손자 FK와 `fkOf` 판정을 깨지 않는지(관계 그룹 `r.g` / `a.fkg`, 역할명 `ORG_`, 재귀 관계, 참조 엔터티)
   - 순서 불변식(PK가 맨 위) 유지
   - 실행 취소 일관성
   - 배열 인덱스(`ai` · `rel`)가 다시 그린 뒤나 다른 화면에서 어긋날 위험
2. **권한 · 잠금**
   - 메뉴를 열 때와 실행할 때 확인이 빠진 경로가 있는지
   - `?cmd=`로 들어온 명령이 잠금 · 권한 · 스냅숏을 우회할 수 있는지
3. **접근성**
   - 트리 메뉴: role=menu, 포커스 복귀, 비활성 항목 설명, ⋯ 버튼이 treeitem 안에 있는 구조
   - 그리드: 행 포커스, 키 충돌(Alt+↑↓, Space, Delete), 낭독 알림
4. **UX**
   - 확인을 묻는 기준(영향 있을 때만)이 적절한가
   - 메뉴 항목 이름 · 순서
   - 목업 항목 표시가 오해를 주지 않는가
   - 사용자(DA#에 익숙한 데이터 모델러)가 직관적으로 이해하는가
5. 문서(16, 12 §9.2)와 구현이 다른 곳

## 형식

- 한국어로 작성합니다.
- 지적마다 다음을 적습니다.
  - 번호
  - 심각도(높음 · 중간 · 낮음)
  - 위치(파일:함수 또는 줄)
  - 문제
  - 재현 또는 근거
  - 권장 수정
- 15건 이내로, 실제로 확인한 것만 적어 주세요. 추측이면 "추측"이라고 표시합니다.
- 코드는 고치지 말고, 결과 파일만 씁니다.
