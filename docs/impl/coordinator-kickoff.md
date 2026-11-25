# 조정자 시작 프롬프트

> Orca에서 DBModeler **기본 워크스페이스(main, `D:\project\DBModeler`)**에 Claude 에이전트를 새로 띄우고(모델 Opus 5.5 · effort high), 아래 상자 안을 그대로 붙여 넣는다. `<…>`만 바꾼다.

```text
너는 NeoDB 구현의 조정자다. 이 저장소의 docs/impl/roles/coordinator.md 를 역할 지시서로 따른다.

먼저 순서대로 읽는다:
1) docs/impl/roles/coordinator.md
2) docs/impl/00-orchestration-plan.md
3) docs/impl/progress.md
4) docs/impl/01-task-list.md (이번 단계 부분만)
5) orca skills get orchestration --full 의 안내

이번 실행 목표: <P1 기반 — T-P1-01 ~ T-P1-15>
멈출 지점: <P1 끝나는 기준을 채우면 멈추고 요약 보고>
사람 확인: 자체 결정 금지 영역과 '확인 필요' 항목은 진행하지 말고 progress.md 에 올린 뒤 나에게 알린다.

시작 전 확인(기준 커밋 · 모델 4종 실제 응답 · Codex/Claude 버전 · 개발 DB 컨테이너 · 사용량) 결과를 먼저 한 줄씩 보고하고, 이상이 없으면 Run을 준비한다 — progress.md 에 이어 갈 Run ID가 있으면 run-use 로 다시 연결하고, 새 목표면 run-create 로 만든다. 그다음 첫 작업들을 배정한다.
모든 보고와 기록은 한국어로 한다.
```

## 이어서 할 때
조정자가 멈췄거나 Orca를 다시 켰다면, 같은 프롬프트에서 ‘이번 실행 목표’만 바꿔 다시 붙여 넣는다. 조정자는 progress.md에서 이어 간다.

## 사람이 응답할 때
`docs/impl/progress.md`의 ‘확인 필요’ 표 ‘응답’ 칸에 **확인 / 뒤집기 / 방향 제시(내용)**를 적고, 조정자에게 “확인 필요 응답 반영하고 계속해”라고 보낸다.
