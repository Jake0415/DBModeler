# 성능 측정 스파이크

제품 코드가 아니라 **측정용 시제품**입니다. 결과와 해석은 [docs/spec/da-feature-spec/23-performance-spike.md](../docs/spec/da-feature-spec/23-performance-spike.md)에 있습니다.

| 폴더 | 측정 | 실행 |
|---|---|---|
| `dict-search/` | 사전 검색(부분 일치·초성·약어, trigram 색인, 페이지 이동) | `docker run -d --name dbm-spike-pg -e POSTGRES_PASSWORD=spike -e POSTGRES_DB=spike -p 55433:5432 postgres:16` → `npm i` → `node bench.js` → `node short.js` → 끝나면 `docker rm -f dbm-spike-pg` |
| `erd-canvas/` | ERD 캔버스(React Flow·LOD·elkjs Worker), 표 가상화 | `npm i` → `npm exec vite` (포트 5190) → 다른 창에서 `node run.mjs` (설치된 Chrome을 헤드리스로 사용) |
| `excel/` | 엑셀 행 수별 쓰기·읽기(스트리밍/전체)·메모리 | `npm i` → `node --expose-gc --max-old-space-size=8192 bench.js` |
| `yjs-sync/` | Yjs + Hocuspocus 공동 편집(동기화·전달 지연·되돌리기·읽기 전용·오프라인 병합·재시작) | `npm i` → `node bench.js` |

- 사전 검색은 행안부 공통표준 공공데이터(`SEED` 환경 변수 경로)를 측정 입력으로만 읽습니다. 데이터는 저장소에 넣지 않습니다.
- 결과 원본은 각 폴더의 `result*.json`입니다.
