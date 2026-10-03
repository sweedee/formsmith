import { evaluate, levels, type Point, type Template } from './model';
import './ux.css';

type Options = {
  templates: () => Template[];
  place: (p: Point) => void;
  cursor: (p: Point, free: boolean) => void;
  draw: () => void;
};
export function installUX(options: Options) {
  const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
  const select = (id: string, value: string) => { el<HTMLSelectElement>(id).value = value; el(id).dispatchEvent(new Event('change')); };
  const oldApp = el('app');
  const legacy = document.createElement('div'); legacy.hidden = true;
  while (oldApp.firstChild) legacy.append(oldApp.firstChild);
  oldApp.append(legacy);
  const shell = document.createElement('div'); shell.className = 'editor-shell';
  shell.innerHTML = `
    <header class="editor-header"><div class="brand"><span>◈</span><h1>Formsmith</h1></div><nav aria-label="Level navigation"><button id="previous" aria-label="Previous level">‹</button><button id="commissions"><small>YOUR COMMISSION</small><strong id="commission-name"></strong><span>Choose level ↗</span></button><button id="next" aria-label="Next level">›</button></nav><div id="history"><button id="help">? Help</button></div></header>
    <main class="editor-workspace" id="workspace"><div class="workspace-title"><small id="workspace-type">LEVEL WORKSPACE</small><div id="title-slot"></div><div id="hint-slot"></div></div><div class="workspace-actions" id="view-actions"><button id="back" hidden>← Back to level</button><button id="rename-shape" hidden>Rename shape</button></div><div id="progress-slot" role="status" aria-live="polite"></div><div class="scene-label target-label">REFERENCE<span>Match this shape</span></div><div class="scene-label build-label">YOUR WORKSPACE<span>Origin: red X · green Y · blue Z</span></div>
      <div class="tool-rail" role="toolbar" aria-label="Construction tools"><button data-tool="block" aria-label="Block tool"><b>▣</b><span>Block</span><kbd>1</kbd></button><button data-tool="socket" aria-label="Input socket tool"><b>◇</b><span>Socket</span><kbd>2</kbd></button><button data-tool="instance" aria-label="Template stamp tool"><b>▦</b><span>Stamp</span><kbd>3</kbd></button><button data-tool="erase" aria-label="Erase tool"><b>⌫</b><span>Erase</span><kbd>4</kbd></button></div>
      <section class="placement-panel" aria-label="Placement controls"><div class="placement-tabs"><button id="surface">On a face</button><button id="free">Anywhere in 3D</button></div><p id="placement-help">Click a face to build. Click the floor to start.</p><div id="cursor-controls" hidden><div class="coordinates"><label>X<input id="cursor-x" type="number" value="0" min="-100" max="100"></label><label>Y<input id="cursor-y" type="number" value="0" min="-100" max="100"></label><label>Z<input id="cursor-z" type="number" value="0" min="-100" max="100"></label></div><button id="place-cursor" class="primary">Place at cursor <kbd>Enter</kbd></button><small>Occupied positions are allowed. Templates can overlap.</small></div><div class="tool-context"><button id="turn-button">↻ 0° <kbd>R</kbd></button><button id="input-button"><span>Shape input</span><strong id="input-label">Single block</strong> ▾</button></div><p id="active-shape"></p></section>
      <div class="cost-pill"><small>SOLUTION COST</small><div id="score-slot"></div><div id="local-slot"></div></div>
      <div class="welcome" id="welcome" hidden><small>WELCOME TO YOUR WORKSHOP</small><h2>Start with one block.</h2><p>Recreate the gray reference in the blue outlines.</p><ol><li>Choose <b>Block</b> on the left.</li><li>Click the floor to start, then the top face to stack.</li><li>Use <b>Anywhere in 3D</b> for floating blocks. Drag colored handles or set coordinates, then press <b>Place</b>.</li></ol><button id="start" class="primary">Let me build →</button><p>Drag to orbit · Middle-drag to pan · Scroll to zoom</p></div>
    </main>
    <section class="asset-library" aria-label="Shape asset library"><div class="library-heading"><h2>Shape library</h2><span>Click a shape to stamp it. Edit opens its workbench.</span><div id="library-actions"><button id="create-shape" class="primary">+ New template</button><details><summary aria-label="Library options">•••</summary><div id="library-menu"></div></details></div></div><div id="asset-cards"></div></section>
    <dialog id="level-picker"><div class="dialog-title"><h2>Choose your commission</h2><button data-close="level-picker" aria-label="Close level chooser">✕</button></div><div id="level-cards" class="picker-cards"></div><p>Any exact recreation counts. Templates can make it cheaper.</p></dialog>
    <dialog id="input-picker"><div class="dialog-title"><div><h2>Choose the shape input</h2><p>Every socket becomes a copy of this shape.</p></div><button data-close="input-picker" aria-label="Close input chooser">✕</button></div><div id="input-cards" class="picker-cards"></div></dialog>
    <dialog id="name-picker"><form id="name-form"><h2 id="name-title">New template</h2><p>Build a spatial shape using fixed blocks and input sockets.</p><label>Template name<input id="shape-name" required maxlength="60" placeholder="e.g. Three-step column"></label><div class="dialog-buttons"><button type="button" data-close="name-picker">Cancel</button><button id="name-submit" class="primary" type="submit">Create & edit →</button></div></form></dialog>
  `;
  oldApp.append(shell);
  const move = (id: string, target: string) => el(target).append(el(id));
  move('viewport', 'workspace'); move('heading', 'title-slot'); move('hint', 'hint-slot'); move('status', 'progress-slot');
  move('undo', 'history'); move('redo', 'history'); move('diff', 'view-actions'); move('preview', 'view-actions'); move('reset', 'view-actions');
  move('score', 'score-slot'); move('local', 'local-slot'); move('export', 'library-menu'); move('import', 'library-menu');
  let free = false, erase = false, cursor: Point = [0, 0, 0], renaming = false;
  const tool = () => erase ? 'erase' : el<HTMLSelectElement>('tool').value;
  const editing = () => el<HTMLSelectElement>('mode').value === 'template';
  function setTool(value: string) {
    if (value === 'socket' && !editing()) return;
    if (value === 'instance' && !el<HTMLSelectElement>('instance').value) { el('active-shape').textContent = 'Create a template or choose a shape below.'; return; }
    erase = value === 'erase'; if (!erase) select('tool', value); options.draw(); sync();
  }
  function updateCursor(p: Point) {
    cursor = [...p]; ['x', 'y', 'z'].forEach((axis, i) => el<HTMLInputElement>(`cursor-${axis}`).value = String(cursor[i]));
    el<HTMLInputElement>('plane').value = String(cursor[1]); options.cursor(cursor, free); options.draw();
  }
  function thumbnail(points: Point[]) {
    const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 130;
    const ctx = canvas.getContext('2d')!;
    if (!points.length) { ctx.fillStyle = '#86a4b7'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Empty workbench', 120, 70); return canvas; }
    const sample = points.slice(0, 1500), projected = sample.map(([x, y, z]) => [(x - z) * .866, (x + z) * .5 - y]);
    const minX = Math.min(...projected.map(p => p[0])), maxX = Math.max(...projected.map(p => p[0]));
    const minY = Math.min(...projected.map(p => p[1])), maxY = Math.max(...projected.map(p => p[1]));
    const size = Math.min(23, 195 / (maxX - minX + 2), 94 / (maxY - minY + 2));
    const face = (v: number[][], color: string) => { ctx.beginPath(); v.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#15313d'; ctx.lineWidth = .7; ctx.stroke(); };
    for (const [x, y, z] of sample.slice().sort((a, b) => a[0] + a[2] - b[0] - b[2] || a[1] - b[1])) {
      const cx = 120 + ((x - z) * .866 - (minX + maxX) / 2) * size, cy = 63 + ((x + z) * .5 - y - (minY + maxY) / 2) * size;
      const w = size * .866, h = size * .5;
      face([[cx, cy - size], [cx + w, cy - h], [cx, cy], [cx - w, cy - h]], '#8de3cc');
      face([[cx - w, cy - h], [cx, cy], [cx, cy + size], [cx - w, cy + h]], '#387e7b');
      face([[cx, cy], [cx + w, cy - h], [cx + w, cy + h], [cx, cy + size]], '#53b29f');
    } return canvas;
  }
  function card(name: string, points: Point[], action: () => void, active = false) {
    const b = document.createElement('button'); b.className = 'asset-select'; b.setAttribute('aria-label', `Use ${name}`); b.setAttribute('aria-pressed', String(active));
    b.append(thumbnail(points)); const text = document.createElement('strong'); text.textContent = name; b.append(text); b.onclick = action; return b;
  }
  function refreshAssets() {
    el('asset-cards').replaceChildren();
    const wrapper = document.createElement('div'); wrapper.className = 'asset-card'; wrapper.append(card('Single block', [[0, 0, 0]], () => setTool('block'), tool() === 'block')); el('asset-cards').append(wrapper);
    for (const t of options.templates()) {
      const w = document.createElement('div'); w.className = 'asset-card'; let points: Point[] = []; try { points = evaluate(t.items, options.templates()); } catch { /* empty invalid preview */ }
      w.append(card(t.name, points, () => { select('instance', t.id); setTool('instance'); }, tool() === 'instance' && el<HTMLSelectElement>('instance').value === t.id));
      const edit = document.createElement('button'); edit.className = 'edit-asset'; edit.textContent = 'Edit shape ↗'; edit.setAttribute('aria-label', `Edit ${t.name}`);
      edit.onclick = () => { select('template', t.id); select('mode', 'template'); setTool('socket'); erase = false; updateCursor([0, 0, 0]); sync(); }; w.append(edit); el('asset-cards').append(w);
    }
    if (!options.templates().length) { const empty = document.createElement('div'); empty.className = 'library-empty'; empty.innerHTML = '<b>Build once. Reuse everywhere.</b><span>Create a template with input sockets, then stamp it into your solution.</span>'; el('asset-cards').append(empty); }
  }
  function sync() {
    const level = Number(el<HTMLSelectElement>('level').value);
    el('commission-name').textContent = levels[level].name; el<HTMLButtonElement>('previous').disabled = level === 0; el<HTMLButtonElement>('next').disabled = level === levels.length - 1;
    el('workspace-type').textContent = editing() ? 'TEMPLATE WORKBENCH' : 'LEVEL WORKSPACE';
    el('back').hidden = !editing(); el('rename-shape').hidden = !editing(); el('preview').hidden = !editing(); el('diff').hidden = editing();
    document.querySelector<HTMLElement>('.cost-pill small')!.textContent = editing() ? 'TEMPLATE DEFINITION' : 'SOLUTION COST';
    document.querySelector<HTMLElement>('.target-label')!.hidden = editing();
    el('surface').setAttribute('aria-pressed', String(!free)); el('free').setAttribute('aria-pressed', String(free)); el('cursor-controls').hidden = !free;
    el('placement-help').textContent = erase ? 'Click a placement to erase it. A stamp is removed as a whole.' : free ? 'Drag the colored handles or click the plane. Press Place to stamp.' : 'Click a face to build. Alt-click overlaps at the source anchor.';
    el('turn-button').hidden = tool() === 'block' || erase;
    el('turn-button').innerHTML = `↻ ${Number(el<HTMLSelectElement>('turn').value) * 90}° <kbd>R</kbd>`;
    el('input-button').hidden = !editing() && tool() !== 'instance';
    const input = el<HTMLSelectElement>('input'); el('input-label').textContent = input.selectedOptions[0]?.textContent ?? 'Single block';
    const instance = el<HTMLSelectElement>('instance'); el('active-shape').textContent = tool() === 'instance' ? `Stamping: ${instance.selectedOptions[0]?.textContent ?? 'Choose a shape below'}` : '';
    document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.tool === tool())); b.disabled = b.dataset.tool === 'socket' && !editing(); });
    el('progress-slot').classList.toggle('complete', el('status').textContent?.startsWith('Complete!') ?? false);
    refreshAssets();
  }
  const observe = new MutationObserver(() => sync());
  observe.observe(el('status'), { childList: true });
  document.querySelectorAll<HTMLButtonElement>('[data-tool]').forEach(b => b.onclick = () => setTool(b.dataset.tool!));
  el('surface').onclick = () => { free = false; options.cursor(cursor, false); options.draw(); sync(); };
  el('free').onclick = () => { free = true; updateCursor(cursor); sync(); };
  ['x', 'y', 'z'].forEach((axis, i) => el(`cursor-${axis}`).oninput = () => { const n = Number(el<HTMLInputElement>(`cursor-${axis}`).value); if (Number.isFinite(n)) { cursor[i] = Math.max(-100, Math.min(100, Math.round(n))); updateCursor(cursor); } });
  el('place-cursor').onclick = () => { if (!erase) options.place(cursor); };
  el('turn-button').onclick = () => { select('turn', String((Number(el<HTMLSelectElement>('turn').value) + 1) % 4)); options.draw(); sync(); };
  el('back').onclick = () => { select('mode', 'build'); setTool('block'); };
  const changeLevel = (index: number) => { if (!levels[index]) return; select('mode', 'build'); select('level', String(index)); setTool('block'); updateCursor([0, 0, 0]); el<HTMLDialogElement>('level-picker').close(); sync(); };
  el('previous').onclick = () => changeLevel(Number(el<HTMLSelectElement>('level').value) - 1); el('next').onclick = () => changeLevel(Number(el<HTMLSelectElement>('level').value) + 1);
  el('commissions').onclick = () => { el('level-cards').replaceChildren(); levels.forEach((l, i) => { const b = card(l.name, l.target, () => changeLevel(i), Number(el<HTMLSelectElement>('level').value) === i); b.setAttribute('aria-label', `Play ${l.name}`); el('level-cards').append(b); }); el<HTMLDialogElement>('level-picker').showModal(); };
  el('input-button').onclick = () => { el('input-cards').replaceChildren(); const choose = (id: string) => { select('input', id); el<HTMLDialogElement>('input-picker').close(); sync(); }; el('input-cards').append(card('Single block', [[0, 0, 0]], () => choose(''), !el<HTMLSelectElement>('input').value)); for (const t of options.templates()) el('input-cards').append(card(t.name, evaluate(t.items, options.templates()), () => choose(t.id), el<HTMLSelectElement>('input').value === t.id)); el<HTMLDialogElement>('input-picker').showModal(); };
  const nameDialog = (rename: boolean) => { renaming = rename; el('name-title').textContent = rename ? 'Rename template' : 'New template'; el('name-submit').textContent = rename ? 'Save name' : 'Create & edit →'; el<HTMLInputElement>('shape-name').value = rename ? el<HTMLSelectElement>('template').selectedOptions[0]?.textContent ?? '' : ''; el<HTMLDialogElement>('name-picker').showModal(); el('shape-name').focus(); };
  el('create-shape').onclick = () => nameDialog(false); el('rename-shape').onclick = () => nameDialog(true);
  el<HTMLFormElement>('name-form').onsubmit = e => { e.preventDefault(); const name = el<HTMLInputElement>('shape-name').value.trim(); if (!name) return; el<HTMLInputElement>('name').value = name; el(renaming ? 'rename' : 'new').click(); erase = false; el<HTMLDialogElement>('name-picker').close(); updateCursor([0, 0, 0]); sync(); };
  document.querySelectorAll<HTMLButtonElement>('[data-close]').forEach(b => b.onclick = () => el<HTMLDialogElement>(b.dataset.close!).close());
  el('help').onclick = () => el('welcome').hidden = !el('welcome').hidden;
  el('start').onclick = () => { el('welcome').hidden = true; localStorage.setItem('formsmith-onboarded', 'yes'); };
  el('welcome').hidden = localStorage.getItem('formsmith-onboarded') === 'yes';
  document.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) || document.querySelector('dialog[open]')) return;
    if (e.key === 'Enter' && free) { e.preventDefault(); if (!erase) options.place(cursor); }
    const shortcuts: Record<string, string> = { '1': 'block', '2': 'socket', '3': 'instance', '4': 'erase' }; if (shortcuts[e.key]) setTool(shortcuts[e.key]);
    if (e.key.toLowerCase() === 'g') el(free ? 'surface' : 'free').click();
    if (free && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) { e.preventDefault(); if (e.key === 'ArrowLeft') cursor[0]--; if (e.key === 'ArrowRight') cursor[0]++; if (e.key === 'ArrowUp') cursor[2]--; if (e.key === 'ArrowDown') cursor[2]++; if (e.key === 'PageUp') cursor[1]++; if (e.key === 'PageDown') cursor[1]--; updateCursor(cursor); }
    if (e.key.toLowerCase() === 'r') { options.draw(); sync(); }
  });
  sync(); return { sync, updateCursor, free: () => free, erase: () => erase, position: () => cursor };
}
