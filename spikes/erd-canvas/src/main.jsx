// Spike S2 (ERD canvas) + S3 (table virtualization).
//  #erd?n=300&vis=1&lod=1   → React Flow model, column-level handles, LOD summary with fixed node size, Worker layout
//  #table?rows=50000&virt=1 → 50k-row grid, virtualized vs plain
// Each page runs its own benchmark once mounted and stores the numbers in window.__result.
import React, { createContext, memo, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlow, ReactFlowProvider, Handle, Position, useReactFlow, useNodesState, useStore, MiniMap, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useVirtualizer } from '@tanstack/react-virtual';
import { makeModel } from './model.js';
import ELK from 'elkjs/lib/elk-api.js';
import elkWorkerUrl from 'elkjs/lib/elk-worker.min.js?url';

const T0 = performance.now();
const params = new URLSearchParams(location.hash.split('?')[1] || '');
const num = (k, d) => (params.has(k) ? +params.get(k) : d);
const W = 240, HEAD = 26, ROW = 18;
const frame = () => new Promise(r => requestAnimationFrame(r));
async function measureFrames(steps, fn) {
  const times = []; let last = performance.now();
  for (let i = 0; i < steps; i++) { fn(i); await frame(); const t = performance.now(); times.push(t - last); last = t; }
  const total = times.reduce((a, b) => a + b, 0);
  return { fps: +(1000 / (total / steps)).toFixed(1), long50: times.filter(t => t > 50).length, worstMs: +Math.max(...times).toFixed(1) };
}

// ---------- ERD ----------
const LodCtx = createContext(false);
const EntityNode = memo(({ data }) => {
  const summary = useContext(LodCtx);
  const h = HEAD + data.cols.length * ROW;
  return (
    <div style={{ width: W, height: h, background: '#fff', border: '1px solid #9aa', borderRadius: 4, boxSizing: 'border-box', position: 'relative' }}>
      <div style={{ height: HEAD, lineHeight: HEAD + 'px', padding: '0 6px', background: '#eef2f6', fontWeight: 600, fontSize: summary ? 18 : 12, overflow: 'hidden', whiteSpace: 'nowrap' }}>{data.name}</div>
      {/* summary mode keeps the node size and every handle position — only the row text disappears (lines don't jump) */}
      {!summary && data.cols.map(c => (
        <div key={c.id} style={{ height: ROW, lineHeight: ROW + 'px', padding: '0 6px', display: 'flex', gap: 4, borderTop: '1px solid #f0f0f0' }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, marginTop: 6, background: c.st === 'bad' ? '#e5a000' : '#2a9d55' }} />
          <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>{c.pk ? '# ' : ''}{c.name}{c.fk ? ' (FK)' : ''}</span>
          <span style={{ color: '#888' }}>{c.phys}</span>
        </div>))}
      {/* column-level handles: relations attach to the PK / FK row */}
      {data.cols.map((c, i) => (c.pk || c.fk) && (
        <React.Fragment key={c.id}>
          {c.pk && <Handle id={`${c.id}-s`} type="source" position={Position.Right} style={{ top: HEAD + i * ROW + ROW / 2, opacity: 0 }} />}
          {c.fk && <Handle id={`${c.id}-t`} type="target" position={Position.Left} style={{ top: HEAD + i * ROW + ROW / 2, opacity: 0 }} />}
        </React.Fragment>))}
    </div>);
});
const GroupNode = memo(({ data }) => <div style={{ width: '100%', height: '100%', border: '3px solid #7a8', borderRadius: 12, background: '#eef7f0', fontSize: 120, padding: 40, boxSizing: 'border-box' }}>{data.name}<div style={{ fontSize: 80, color: '#555' }}>엔터티 {data.count}</div><Handle type="target" position={Position.Left} style={{ opacity: 0 }} /><Handle type="source" position={Position.Right} style={{ opacity: 0 }} /></div>);
const nodeTypes = { ent: EntityNode, grp: GroupNode };

function ErdInner({ n, vis, lod }) {
  const model = useMemo(() => makeModel(n, 10, Math.round(n * 5 / 3)), [n]);
  // controlled nodes must take React Flow's changes (dimensions) back in, or nodes never count as measured
  const [nodes, setNodes, onNodesChange] = useNodesState(model.ents.map((e, i) => ({ id: e.id, type: 'ent', data: e, position: { x: (i % 20) * (W + 60), y: Math.floor(i / 20) * 300 } })));
  const edges = useMemo(() => model.edges.map(e => ({ ...e, style: { strokeDasharray: e.data.ident ? undefined : '5 4' } })), [model]);
  // subscribe to the LOD level only (a boolean), not the raw zoom — otherwise every zoom frame re-renders the whole canvas
  const summary = useStore(s => !!lod && n >= 50 && s.transform[2] < 0.35);
  // LOD level 2 (ux/03 §3.1): far out, the canvas shows area group boxes instead of entities (20 entities per group here)
  const clusters = useStore(s => lod >= 2 && s.transform[2] < 0.2);
  const groups = useMemo(() => { const G = Math.ceil(n / 20); return Array.from({ length: G }, (_, g) => ({ id: 'g' + g, type: 'grp', data: { name: `영역 ${g + 1}`, count: Math.min(20, n - g * 20) }, position: { x: 0, y: g * 1500 }, style: { width: 20 * (W + 60), height: 1400 } })); }, [n]);
  const groupEdges = useMemo(() => { const m = new Map(); model.edges.forEach(e => { const a = Math.floor(+e.source.slice(1) / 20), b = Math.floor(+e.target.slice(1) / 20); if (a === b) return; const k = a < b ? `${a}-${b}` : `${b}-${a}`; m.set(k, (m.get(k) || 0) + 1); }); return [...m].map(([k, c]) => { const [a, b] = k.split('-'); return { id: 'ge' + k, source: 'g' + a, target: 'g' + b, label: String(c) }; }); }, [model]);
  // with onlyRenderVisibleElements, off-screen nodes are never measured → start when the visible ones are (first measured frame)
  const rf = useReactFlow(); const measured = useStore(s => { let k = 0; s.nodeLookup.forEach(nd => { if (nd.measured && nd.measured.width) k++; }); return k; }); const inited = measured > 0; const ran = useRef(false);
  window.__dbg = { measured, inited, nodes: nodes.length, ran: ran.current };
  useEffect(() => {
    if (!inited || ran.current) return; ran.current = true;
    (async () => {
      const r = { page: 'erd', n, rels: edges.length, cols: model.ents.reduce((a, e) => a + e.cols.length, 0), vis, lod, mountMs: +(performance.now() - T0).toFixed(0) };
      rf.setViewport({ x: 0, y: 0, zoom: 1 }); await frame();
      console.log('stage pan100'); r.pan100 = await measureFrames(120, i => rf.setViewport({ x: -i * 25, y: -i * 8, zoom: 1 }));
      r.pan30 = await measureFrames(120, i => rf.setViewport({ x: -i * 25, y: -i * 8, zoom: 0.3 }));
      r.zoomSweep = await measureFrames(120, i => rf.setViewport({ x: 0, y: 0, zoom: 0.05 + i * 0.01 }));
      rf.fitView(); await frame(); await frame();
      r.fitZoom = +rf.getViewport().zoom.toFixed(3);
      console.log('stage panFit'); r.panFit = await measureFrames(120, i => { const v = rf.getViewport(); rf.setViewport({ x: v.x - 4, y: v.y, zoom: v.zoom }); });
      r.domNodesAtFit = document.querySelectorAll('.react-flow__node').length;
      // auto-layout in elkjs's own Web Worker (main thread stays free; cancel = terminateWorker)
      const elk = new ELK({ workerUrl: elkWorkerUrl });
      const tl = performance.now(); let mainBusy = 0, ticks = 0; const iv = setInterval(() => { ticks++; }, 16);
      console.log('stage layout');
      const res = await elk.layout({
        id: 'root', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.edgeRouting': 'ORTHOGONAL', 'elk.layered.spacing.nodeNodeBetweenLayers': '80', 'elk.spacing.nodeNode': '40', 'elk.separateConnectedComponents': 'true' },
        children: model.ents.map(e => ({ id: e.id, width: W, height: HEAD + e.cols.length * ROW })), edges: model.edges.map(e => ({ id: e.id, sources: [e.source], targets: [e.target] }))
      }).then(g => ({ ms: performance.now() - tl, pos: g.children.map(c => ({ id: c.id, x: c.x, y: c.y })) }), e => ({ ms: -1, pos: [], err: String(e && e.message || e) }));
      clearInterval(iv); elk.terminateWorker();
      const wall = performance.now() - tl; mainBusy = +(100 - Math.min(100, ticks * 16 / wall * 100)).toFixed(0);
      r.layout = { err: res.err, elkMs: +res.ms.toFixed(0), wallMs: +wall.toFixed(0), mainThreadBlockedPct: mainBusy };
      const ta = performance.now(); setNodes(ns => ns.map(nd => { const p = res.pos.find(q => q.id === nd.id); return p ? { ...nd, position: { x: p.x, y: p.y } } : nd; })); await frame(); await frame();
      r.layout.applyMs = +(performance.now() - ta).toFixed(0);
      window.__result = r; document.title = 'DONE'; console.log('BENCH', JSON.stringify(r));
    })();
  }, [inited]);
  return (
    <LodCtx.Provider value={summary}>
      <ReactFlow nodes={clusters ? groups : nodes} edges={clusters ? groupEdges : edges} nodeTypes={nodeTypes} onNodesChange={clusters ? undefined : onNodesChange} onlyRenderVisibleElements={!!vis} minZoom={0.01} maxZoom={2} defaultViewport={{ x: 0, y: 0, zoom: 1 }}>
        <Background />{num('mm', 1) ? <MiniMap pannable zoomable /> : null}
      </ReactFlow>
      <div style={{ position: 'absolute', top: 4, left: 4, background: '#fffc', padding: 4, zIndex: 10 }}>n={n} vis={vis} lod={lod} {clusters ? '묶음' : summary ? '요약' : '상세'}</div>
    </LodCtx.Provider>);
}
const Erd = () => <ReactFlowProvider><div style={{ width: '100%', height: '100%' }}><ErdInner n={num('n', 300)} vis={num('vis', 1)} lod={num('lod', 1)} /></div></ReactFlowProvider>;

// ---------- TABLE ----------
function TableBench() {
  const rows = num('rows', 50000), virt = num('virt', 1);
  const data = useMemo(() => Array.from({ length: rows }, (_, i) => ({ r: i + 2, st: i % 17 === 0 ? '오류' : i % 5 === 0 ? '변경' : '신규', name: `요구사항상태코드${i}`, abbr: `DEMND_MATER_STTS_CD${i}`, dom: '코드C2', desc: `요구사항 진행 상태 ${i}` })), [rows]);
  const ref = useRef(null);
  const v = useVirtualizer({ count: rows, getScrollElement: () => ref.current, estimateSize: () => 32, overscan: 12 });
  useEffect(() => {
    (async () => {
      await frame(); await frame();
      const r = { page: 'table', rows, virt, mountMs: +(performance.now() - T0).toFixed(0), domRows: ref.current.querySelectorAll('[data-row]').length };
      const el = ref.current, max = el.scrollHeight - el.clientHeight;
      r.scroll = await measureFrames(180, i => { el.scrollTop = (i / 179) * max; });
      window.__result = r; document.title = 'DONE'; console.log('BENCH', JSON.stringify(r));
    })();
  }, []);
  const Row = ({ d, style }) => <div data-row style={{ ...style, display: 'flex', height: 32, lineHeight: '32px', borderBottom: '1px solid #eee' }}><span style={{ width: 60 }}>{d.r}</span><span style={{ width: 60 }}>{d.st}</span><span style={{ width: 220 }}>{d.name}</span><span style={{ width: 260 }}>{d.abbr}</span><span style={{ width: 90 }}>{d.dom}</span><span style={{ flex: 1 }}>{d.desc}</span></div>;
  return (
    <div ref={ref} style={{ height: '100%', overflow: 'auto' }}>
      {virt ? <div style={{ height: v.getTotalSize(), position: 'relative' }}>{v.getVirtualItems().map(it => <Row key={it.key} d={data[it.index]} style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${it.start}px)` }} />)}</div>
        : data.map(d => <Row key={d.r} d={d} />)}
    </div>);
}

const App = () => (location.hash.startsWith('#table') ? <TableBench /> : <Erd />);
createRoot(document.getElementById('root')).render(<App />);
