// Поведение страниц: меню, перерисовка графиков под ширину блока, подсказки, сортировка таблиц.
// Без JavaScript сайт остаётся рабочим: графики нарисованы при сборке, данные есть в таблицах.

import { initWorldTrends } from './world-trends.mjs';
import { initExplorer } from './explorer.mjs';
import { RENDERERS } from './charts/charts.mjs';
import { strategyMatrix, capabilityHeatmap } from './charts/strategy.mjs';
import { pishLoop, cohortsChart, pishTopicLandscape } from './charts/pish.mjs';
import { pishTopicTree, pishResearchPaths } from './charts/pish-topics.mjs';

const ALL_RENDERERS = { ...RENDERERS, 'strategy-matrix': strategyMatrix, 'strategy-heatmap': capabilityHeatmap, 'pish-loop': pishLoop, 'pish-cohorts': cohortsChart, 'pish-landscape':pishTopicLandscape, 'pish-topic-tree':pishTopicTree, 'pish-research-paths':pishResearchPaths };

const lang = document.documentElement.lang || 'ru';

// ---------- меню на узких экранах ----------
const toggle = document.querySelector('.menu-toggle');
if (toggle) {
  const label = toggle.querySelector('.visually-hidden');
  const set = (open) => {
    document.documentElement.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (label) label.textContent = open ? toggle.dataset.closeLabel : toggle.dataset.openLabel;
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      set(false);
      toggle.focus();
    }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => e.matches && set(false));
}

// ---------- подсказки ----------
function tooltipFor(body) {
  let tip = body.querySelector(':scope > .tooltip');
  if (!tip) {
    tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'status');
    tip.hidden = true;
    body.append(tip);
  }
  return tip;
}

function fillTooltip(tip, data) {
  tip.replaceChildren();
  if (data.t) {
    const title = document.createElement('div');
    title.className = 'tooltip-title';
    title.textContent = data.t;
    tip.append(title);
  }
  for (const [value, label] of data.r ?? []) {
    const row = document.createElement('div');
    row.className = 'tooltip-row';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const span = document.createElement('span');
    span.textContent = label;
    row.append(strong, span);
    tip.append(row);
  }
}

function placeTooltip(body, tip, clientX, clientY) {
  const box = body.getBoundingClientRect();
  tip.hidden = false;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  let x = clientX - box.left + 14;
  let y = clientY - box.top - th - 12;
  if (x + tw > box.width) x = Math.max(0, clientX - box.left - tw - 14);
  if (y < 0) y = clientY - box.top + 16;
  tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  tip.style.left = '0';
  tip.style.top = '0';
}

function hideTooltip(body) {
  const tip = body.querySelector(':scope > .tooltip');
  if (tip) tip.hidden = true;
  body.querySelectorAll('.is-active').forEach((el) => el.classList.remove('is-active'));
  const cross = body.querySelector('.crosshair');
  if (cross) cross.setAttribute('visibility', 'hidden');
}

function parseTip(el) {
  try {
    return JSON.parse(el.getAttribute('data-tip'));
  } catch {
    return null;
  }
}

function bindTooltips(body) {
  const show = (el, x, y) => {
    const data = parseTip(el);
    if (!data) return;
    body.querySelectorAll('.is-active').forEach((n) => n.classList.remove('is-active'));
    el.classList.add('is-active');
    const tip = tooltipFor(body);
    fillTooltip(tip, data);
    placeTooltip(body, tip, x, y);
  };
  body.addEventListener('pointermove', (e) => {
    const layer = e.target.closest('.hover-layer');
    if (layer) {
      crosshair(body, layer, e.clientX, e.clientY);
      return;
    }
    const el = e.target.closest('[data-tip]');
    if (el && body.contains(el)) show(el, e.clientX, e.clientY);
    else hideTooltip(body);
  });
  body.addEventListener('pointerleave', () => hideTooltip(body));
  body.addEventListener('focusin', (e) => {
    const el = e.target.closest('[data-tip]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    show(el, r.left + r.width / 2, r.top + r.height / 2);
  });
  body.addEventListener('focusout', () => hideTooltip(body));
}

function crosshair(body, layer, clientX, clientY) {
  const svg = layer.ownerSVGElement;
  const xs = layer.dataset.xs.split(',').map(Number);
  let rows;
  try {
    rows = JSON.parse(layer.dataset.rows);
  } catch {
    return;
  }
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return;
  const loc = pt.matrixTransform(ctm.inverse());
  let best = 0;
  for (let i = 1; i < xs.length; i += 1) if (Math.abs(xs[i] - loc.x) < Math.abs(xs[best] - loc.x)) best = i;
  const cross = svg.querySelector('.crosshair');
  if (cross) {
    cross.setAttribute('x1', xs[best]);
    cross.setAttribute('x2', xs[best]);
    cross.setAttribute('visibility', 'visible');
  }
  const tip = tooltipFor(body);
  fillTooltip(tip, rows[best]);
  placeTooltip(body, tip, clientX, clientY);
}

// ---------- графики: перерисовка под ширину ----------
for (const fig of document.querySelectorAll('figure.chart[data-chart]')) {
  const body = fig.querySelector('.chart-body');
  const specEl = fig.querySelector('.chart-spec');
  const render = ALL_RENDERERS[fig.dataset.chart];
  if (!body || !specEl || !render) continue;
  let spec;
  try {
    spec = JSON.parse(specEl.textContent);
  } catch {
    continue;
  }
  let lastWidth = 0;
  const draw = () => {
    const width = Math.round(body.clientWidth);
    if (!width || Math.abs(width - lastWidth) < 4) return;
    lastWidth = width;
    // узкая версия пузырьковой диаграммы нумерует точки — показываем список названий под ней
    if (fig.dataset.chart === 'bubble') fig.classList.toggle('is-compact', width < 600);
    const svg = body.querySelector('svg.chart-svg');
    const html = render(spec, width);
    const holder = document.createElement('div');
    holder.innerHTML = html; // разметка собрана модулем графиков, все подписи экранированы
    const fresh = holder.firstElementChild;
    if (svg && fresh) svg.replaceWith(fresh);
    hideTooltip(body);
  };
  bindTooltips(body);
  fig.addEventListener('strategy-redraw', () => {
    spec = JSON.parse(specEl.textContent);
    lastWidth = 0;
    draw();
  });
  if ('ResizeObserver' in window) {
    let frame = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(draw);
    }).observe(body);
  } else {
    draw();
  }
}

// Strategic lenses reuse the same data and numbering; they never recompute evidence.
for (const select of document.querySelectorAll('[data-strategy-filter]')) {
  const fig = document.getElementById(select.dataset.strategyFilter);
  if (!fig) continue;
  const original = JSON.parse(fig.querySelector('.chart-spec').textContent);
  select.addEventListener('change', () => {
    const include = r => select.value === 'all' || (select.value === 'growth' ? r.worldShareChange > .1 : r.status === select.value);
    const rows = original.rows.filter(include);
    const specEl = fig.querySelector('.chart-spec');
    // Keep every row in the spec, so point numbers remain stable under filtering.
    const spec = { ...original, rows: original.rows.map(r => ({ ...r, filtered: !include(r) })) };
    specEl.textContent = JSON.stringify(spec);
    fig.dispatchEvent(new Event('strategy-redraw'));
    for (const item of fig.querySelectorAll('[data-strategy-item]')) item.hidden = !rows.some(r => r.id === item.dataset.strategyItem);
    const count = select.closest('.strategy-controls').querySelector('.strategy-filter-count');
    count.textContent = `${rows.length} ${document.documentElement.lang === 'ru' ? 'направлений' : 'fields'}`;
  });
}

for (const button of document.querySelectorAll('[data-horizon]')) {
  button.addEventListener('click', () => {
    const section = button.closest('section');
    for (const b of section.querySelectorAll('[data-horizon]')) b.setAttribute('aria-pressed', String(b === button));
    for (const panel of section.querySelectorAll('[data-horizon-panel]')) panel.hidden = panel.dataset.horizonPanel !== button.dataset.horizon;
  });
}

// ---------- материалы ПИШ для совещания ----------
for (const button of document.querySelectorAll('[data-pish-projector]')) {
  button.addEventListener('click', () => {
    const enabled = !document.body.classList.contains('pish-projector');
    document.body.classList.toggle('pish-projector', enabled);
    button.setAttribute('aria-pressed', String(enabled));
    document.querySelectorAll('figure.chart').forEach(fig => fig.dispatchEvent(new Event('strategy-redraw')));
  });
}

document.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || document.querySelector('dialog[open]') || !document.body.classList.contains('pish-projector')) return;
  document.body.classList.remove('pish-projector');
  const button = document.querySelector('[data-pish-projector]');
  button?.setAttribute('aria-pressed', 'false');
  button?.focus();
});

for (const select of document.querySelectorAll('[data-pish-horizon]')) {
  select.addEventListener('change', () => {
    const section = select.closest('section');
    if (!section) return;
    for (const value of section.querySelectorAll('[data-pish-year]')) value.hidden = value.dataset.pishYear !== select.value;
    for (const label of section.querySelectorAll('[data-pish-selected-year]')) label.textContent = select.value;
  });
}

function revealPishNode() {
  if (!location.hash.startsWith('#pish-node-')) return;
  const node = document.getElementById(location.hash.slice(1));
  if (!node) return;
  if (node.matches('details')) node.open = true;
  node.closest('details')?.setAttribute('open', '');
}
window.addEventListener('hashchange', revealPishNode);
// Also reveal a node when the user selects the same hash twice.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#pish-node-"]');
  if (!link) return;
  const node = document.getElementById(link.getAttribute('href').slice(1));
  if (node?.matches('details')) node.open = true;
});
revealPishNode();

let printDetails = null;
window.addEventListener('beforeprint', () => {
  if (!document.body.classList.contains('page-pish') || printDetails) return;
  printDetails = [...document.querySelectorAll('main details')].map(node => [node, node.open]);
  for (const [node] of printDetails) node.open = true;
});
window.addEventListener('afterprint', () => {
  for (const [node, open] of printDetails ?? []) node.open = open;
  printDetails = null;
});
for (const button of document.querySelectorAll('[data-pish-print]')) button.addEventListener('click', () => window.print());

// ---------- сортировка таблиц ----------
// Progressive enhancement: all scientific figures remain visible without JS and in print.
const plotGallery = document.querySelector('.pish-python-plots');
if (plotGallery) {
  const figures = [...plotGallery.querySelectorAll('.pish-python-figure')];
  const tabs = [...plotGallery.querySelectorAll('[data-pish-plot]')];
  const all = plotGallery.querySelector('.pish-plot-all');
  let selected = 'research-position';
  let showAll = false;
  const select = (id, updateUrl = false) => {
    if (!tabs.some(t => t.dataset.pishPlot === id)) return;
    selected = id;
    tabs.forEach(tab => {
      const active = tab.dataset.pishPlot === id;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    figures.forEach(figure => {
      figure.hidden = !showAll && figure.id !== `pish-python-${id}`;
      figure.setAttribute('role', showAll ? 'figure' : 'tabpanel');
      figure.setAttribute('aria-labelledby', figure.id.replace('pish-python-', 'pish-tab-'));
      figure.tabIndex = 0;
    });
    all.setAttribute('aria-pressed', String(showAll));
    if (updateUrl) history.replaceState(null, '', `#pish-python-${id}`);
  };
  const selectHash = () => {
    const id = location.hash.replace('#pish-python-', '');
    if (tabs.some(t => t.dataset.pishPlot === id)) { showAll = false; select(id); }
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => { showAll = false; select(tab.dataset.pishPlot, true); });
    tab.addEventListener('keydown', event => {
      const next = {ArrowRight:(index+1)%tabs.length, ArrowLeft:(index+tabs.length-1)%tabs.length, Home:0, End:tabs.length-1}[event.key];
      if (next == null) return;
      event.preventDefault();
      tabs[next].focus();
      tabs[next].click();
    });
  });
  all.addEventListener('click', () => { showAll = !showAll; select(selected); });
  plotGallery.querySelector('.pish-plot-controls').hidden = false;
  select(selected);
  selectHash();
  window.addEventListener('hashchange', selectHash);
  // Printing always includes every plot; CSS also covers browsers without print events.
  window.addEventListener('beforeprint', () => figures.forEach(f => { f.hidden = false; }));
  window.addEventListener('afterprint', () => select(selected));

  const dialog = plotGallery.querySelector('dialog');
  const zoom = dialog.querySelector('select');
  const frame = dialog.querySelector('.pish-zoom-frame');
  const image = frame.querySelector('img');
  const setZoom = () => { frame.classList.remove('zoom-2','zoom-3','zoom-4'); if (zoom.value !== '1') frame.classList.add(`zoom-${zoom.value}`); };
  zoom.addEventListener('change', setZoom);
  dialog.querySelector('[data-pish-zoom-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  plotGallery.querySelectorAll('[data-pish-zoom]').forEach(link => link.addEventListener('click', event => {
    if (!dialog.showModal || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    image.src = link.href;
    image.alt = link.closest('figure').querySelector('h4').textContent;
    dialog.querySelector('h3').textContent = image.alt;
    zoom.value = window.innerWidth < 700 ? '4' : '1';
    setZoom();
    dialog.showModal();
    frame.scrollTop = frame.scrollLeft = 0;
  }));
}

const collator = new Intl.Collator(lang, { numeric: true, sensitivity: 'base' });
for (const table of document.querySelectorAll('table.sortable')) {
  const heads = [...table.tHead.rows[0].cells];
  heads.forEach((th, index) => {
    const btn = th.querySelector('button.sort');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const numeric = th.classList.contains('num');
      const current = th.getAttribute('aria-sort');
      const dir = current ? (current === 'descending' ? 'ascending' : 'descending') : numeric ? 'descending' : 'ascending';
      heads.forEach((h) => h.removeAttribute('aria-sort'));
      th.setAttribute('aria-sort', dir);
      const body = table.tBodies[0];
      const rows = [...body.rows];
      const key = (row) => {
        const c = row.cells[index];
        const raw = c?.dataset.v ?? c?.textContent ?? '';
        if (numeric) {
          const n = parseFloat(raw);
          return Number.isFinite(n) ? n : null;
        }
        return raw;
      };
      rows.sort((a, b) => {
        const ka = key(a);
        const kb = key(b);
        if (ka == null || ka === '') return 1;
        if (kb == null || kb === '') return -1;
        const cmp = numeric ? ka - kb : collator.compare(ka, kb);
        return dir === 'ascending' ? cmp : -cmp;
      });
      body.append(...rows);
    });
  });
}

// Load the local ECharts package only as the research explorer enters view.
for (const root of document.querySelectorAll('[data-explorer]')) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      initExplorer(root);
    }, {rootMargin:'300px'});
    observer.observe(root);
  } else initExplorer(root);
}

for (const root of document.querySelectorAll("[data-world-trends]")) {
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); initWorldTrends(root); } }, {rootMargin:"300px"});
    observer.observe(root);
  } else initWorldTrends(root);
}
