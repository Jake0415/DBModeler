// Synthetic model: N entities, ~colsPer attributes each, `rels` relations (tree-ish + extra links).
// Deterministic so every run draws the same model.
export function makeModel(n = 300, colsPer = 10, rels = 500) {
  let s = 11; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const ents = Array.from({ length: n }, (_, i) => ({
    id: 'e' + i, name: `엔터티${i}기본`, phys: `ENT${i}_M`,
    cols: Array.from({ length: colsPer }, (_, j) => ({ id: `e${i}c${j}`, name: j === 0 ? `엔터티${i}ID` : `속성${j}명`, phys: j === 0 ? `ENT${i}_ID` : `ATTR${j}_NM`, type: j === 0 ? 'VARCHAR2(10)' : 'VARCHAR2(100)', pk: j === 0, fk: false, st: rnd() < 0.08 ? 'bad' : 'ok' }))
  }));
  const edges = [];
  for (let k = 0; k < rels; k++) {
    const c = 1 + Math.floor(rnd() * (n - 1)); const p = k < n - 1 ? Math.floor(rnd() * c) : Math.floor(rnd() * n);
    if (p === c) continue;
    const child = ents[c]; const fkCol = { id: `${child.id}fk${k}`, name: `${ents[p].name}ID`, phys: `${ents[p].phys}_ID`, type: 'VARCHAR2(10)', pk: false, fk: true, st: 'ok' };
    child.cols.push(fkCol);
    edges.push({ id: 'r' + k, source: ents[p].id, sourceHandle: `${ents[p].cols[0].id}-s`, target: child.id, targetHandle: `${fkCol.id}-t`, type: 'smoothstep', data: { ident: rnd() < 0.3 } });
  }
  return { ents, edges };
}
