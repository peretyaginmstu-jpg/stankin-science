// Научный портфель: координаты сохраняют исходные показатели, номера вынесены
// отдельно, чтобы плотность портфеля не превращалась в наложение названий.
// Относительные изменения передаются долями: 0.2 = +20%, не отношением 1.2.
// Площадь пузырька пропорциональна n. Null никогда не превращается в ноль.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
const finite = (value) => value != null && Number.isFinite(value);
const round = (value) => Math.round(value * 10) / 10;
const clip = (value, min, max) => Math.max(min, Math.min(max, value));
const shortText = (value, max) => {
  const s = String(value ?? '');
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.65 ? cut.slice(0, space) : cut).trim()}…`;
};
const locale = (lang) => lang === 'en' ? 'en-GB' : 'ru-RU';
// Показатели с базой 1 (FWCI, специализация) — всегда с одинаковым числом знаков.
const number = (lang, value, digits = 1) => finite(value)
  ? new Intl.NumberFormat(locale(lang), { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value).replace(/^-/, '−') : '—';
// Знак ставится после округления: −0,4 % при нуле знаков даёт «0 %», а не «−0 %».
const delta = (lang, value) => {
  if (!finite(value)) return '—';
  const digits = Math.abs(value) < 0.01 ? 1 : 0;
  const rounded = Math.round(value * 10 ** (digits + 2)) / 10 ** (digits + 2);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${new Intl.NumberFormat(locale(lang), { style: 'percent', minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Math.abs(rounded))}`;
};
const tipAttr = (tip) => ` data-tip="${esc(JSON.stringify(tip))}"`;

const WORDS = {
  ru: {
    title: 'Стратегическая карта научных компетенций',
    description: 'По горизонтали — изменение доли тематики в мировой науке; по вертикали — нормализованное цитирование работ СТАНКИН (FWCI). Площадь круга пропорциональна числу работ университета. Цвет показывает статус по правилам модели. Номера соответствуют списку компетенций; при отсутствующих данных координаты не строятся.',
    worldAxis: 'Изменение доли тематики в мировой науке',
    impactAxis: 'Влияние СТАНКИН · FWCI',
    above: 'ВЫШЕ МИРОВОГО СРЕДНЕГО', below: 'НИЖЕ МИРОВОГО СРЕДНЕГО',
    loss: 'ДОЛЯ ТЕМЫ СНИЖАЕТСЯ', gain: 'ДОЛЯ ТЕМЫ РАСТЁТ',
    key: 'Компетенции · номер на карте', unplotted: 'Нет координат: недостаточно данных',
    work: 'Работы СТАНКИН', ai: 'Специализация (мир = 1)', fwci: 'Цитирование FWCI (мир = 1)',
    growthOwn: 'Поток работ СТАНКИН', growthWorld: 'Мировой поток работ',
    ownShareChange: 'Доля СТАНКИН в мировой тематике', worldShareChange: 'Доля тематики во всей мировой науке',
    strong: 'Сильная база', rising: 'Наращивать влияние', gap: 'Мир растёт, мы отстаём', declining: 'Сужать и переориентировать', watch: 'Проверить фокус',
    noData: 'Нет данных', filtered: 'Скрыто фильтром', confidence: 'Уверенность', action: 'Решение модели',
    area: 'Площадь круга = число работ', small: 'Меньше работ', large: 'Больше работ',
    matrix: 'Матрица силы и научной динамики',
    matrixDesc: 'В каждой строке показаны число работ, специализация, нормализованное цитирование, динамика потоков работ и долей. Специализация и FWCI сравниваются с единицей; изменения — с нулём. Внутренние полосы расходятся от базового значения, пустые клетки обозначают отсутствие данных.',
    baseline: 'Специализация и FWCI: база 1 · динамика: база 0 %',
    encoding: 'Цвет и длина полосы — положение относительно базы; числа — исходные значения.',
    headers: [['Работы', 'СТАНКИН'], ['Специализация', 'мир = 1'], ['Цитирование', 'FWCI, мир = 1'], ['Поток работ', 'СТАНКИН'], ['Поток работ', 'мир'], ['Доля СТАНКИН', 'в мировой теме'], ['Доля темы', 'в мировой науке']],
  },
  en: {
    title: 'Strategic map of research competencies',
    description: 'The horizontal axis is the relative change in the topic’s share of global research; the vertical axis is STANKIN’s field-normalised citation impact (FWCI). Bubble area is proportional to the university’s publication count. Colour indicates the model status. Point numbers match the competency key; missing coordinates are not plotted.',
    worldAxis: 'Change in the topic’s share of global research',
    impactAxis: 'STANKIN impact · FWCI',
    above: 'ABOVE WORLD AVERAGE', below: 'BELOW WORLD AVERAGE',
    loss: 'TOPIC SHARE FALLS', gain: 'TOPIC SHARE GROWS',
    key: 'Competencies · point number', unplotted: 'Not plotted: insufficient data',
    work: 'STANKIN publications', ai: 'Specialisation (world = 1)', fwci: 'Citation impact FWCI (world = 1)',
    growthOwn: 'STANKIN publication flow', growthWorld: 'World publication flow',
    ownShareChange: 'STANKIN’s share of the global topic', worldShareChange: 'Topic share of all global research',
    strong: 'Strong base', rising: 'Build citation impact', gap: 'World grows; we lose share', declining: 'Focus and redirect', watch: 'Review the focus',
    noData: 'No data', filtered: 'Hidden by filter', confidence: 'Confidence', action: 'Model decision',
    area: 'Bubble area = publication count', small: 'Fewer works', large: 'More works',
    matrix: 'Strength and research dynamics matrix',
    matrixDesc: 'Rows show publication count, specialisation, citation impact, publication-flow changes and share changes. Specialisation and FWCI are compared with one; changes with zero. Mini-bars diverge from the reference value and empty cells indicate missing data.',
    baseline: 'Specialisation and FWCI: reference 1 · changes: reference 0%',
    encoding: 'Colour and bar length show position relative to the reference; numbers are raw values.',
    headers: [['STANKIN', 'works'], ['Specialisation', 'world = 1'], ['Citation impact', 'FWCI, world = 1'], ['STANKIN', 'work flow'], ['World', 'work flow'], ['STANKIN share', 'in world topic'], ['Topic share', 'in world science']],
  },
};

const STATUS = new Set(['strong', 'rising', 'gap', 'declining', 'watch']);
const statusOf = (row) => STATUS.has(row.status) ? row.status : 'watch';
const colour = (status) => `var(--strategy-${status}, ${({ strong: '#2b7e75', rising: '#286bbb', gap: '#94613a', declining: '#b4432d', watch: '#8b877d' })[status]})`;
const titleRows = (row, lang) => {
  const t = WORDS[lang] ?? WORDS.ru;
  return [[t.work, number(lang, row.n, 0)], [t.ai, number(lang, row.ai, 2)], [t.fwci, number(lang, row.fwci, 2)], [t.growthOwn, delta(lang, row.growthOwn)], [t.growthWorld, delta(lang, row.growthWorld)], [t.ownShareChange, delta(lang, row.ownShareChange)], [t.worldShareChange, delta(lang, row.worldShareChange)], [t.action, typeof row.action === 'string' ? row.action : t[statusOf(row)]], [t.confidence, typeof row.confidence === 'string' ? row.confidence : finite(row.confidence) ? number(lang, row.confidence, 2) : '—']];
};
const rowTip = (row, lang) => ({ t: row.name ?? row.short ?? row.id, r: titleRows(row, lang) });
const rowTitle = (row, lang) => `${row.name ?? row.short ?? row.id}. ${titleRows(row, lang).map(([key, value]) => `${key}: ${value}`).join('; ')}`;
const nameOf = (row) => row.short ?? row.name ?? row.id ?? '';
const hrefOf = (row, hrefFor) => typeof hrefFor === 'function' ? hrefFor(row.id) : row.href;
const linkOpen = (row, hrefFor, lang, cls = '') => {
  const href = hrefOf(row, hrefFor);
  const attrs = `class="strategy-item ${cls}" aria-label="${esc(rowTitle(row, lang))}"${tipAttr(rowTip(row, lang))}`;
  return href ? `<a href="${esc(href)}" ${attrs}>` : `<g tabindex="0" ${attrs}>`;
};
const linkClose = (row, hrefFor) => hrefOf(row, hrefFor) ? '</a>' : '</g>';
const text = (x, y, value, attrs = '') => `<text x="${round(x)}" y="${round(y)}" ${attrs}>${esc(value)}</text>`;

function niceBounds(values, reference, { floorZero = false, minSpan = 0.4 } = {}) {
  let lo = Math.min(reference, ...values);
  let hi = Math.max(reference, ...values);
  const span = Math.max(minSpan, hi - lo);
  if (floorZero) lo = 0;
  else lo -= span * 0.16;
  hi += span * 0.16;
  const raw = (hi - lo) / 5;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = (raw / magnitude <= 1 ? 1 : raw / magnitude <= 2 ? 2 : raw / magnitude <= 2.5 ? 2.5 : raw / magnitude <= 5 ? 5 : 10) * magnitude;
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1e9) / 1e9);
  return { lo, hi, ticks };
}

const overlaps = (a, b) => a.x < b.x + b.w + 2 && b.x < a.x + a.w + 2 && a.y < b.y + b.h + 2 && b.y < a.y + a.h + 2;

/** rows are displayed in their incoming order; point/key numbers share that order. */
export function strategyMatrix({ rows = [], lang = 'ru', hrefFor } = {}, width = 1160) {
  const t = WORDS[lang] ?? WORDS.ru;
  const w = Math.max(360, Number.isFinite(width) ? Math.round(width) : 1160);
  const wide = w >= 860;
  const keyW = wide ? Math.min(330, w * 0.29) : 0;
  const m = { l: 54, t: 66, r: wide ? keyW + 28 : 20, b: 70 };
  const plotW = w - m.l - m.r;
  const plotH = wide ? Math.max(360, Math.min(500, rows.length * 24)) : 360;
  const keyCols = wide || w < 620 ? 1 : 2;
  const keyRowH = wide ? 28 : 32;
  const keyTop = wide ? 84 : m.t + plotH + 116;
  const h = wide ? Math.max(m.t + plotH + m.b + 64, keyTop + rows.length * keyRowH + 42) : keyTop + Math.ceil(rows.length / keyCols) * keyRowH + 54;
  // Filtering changes visibility only. Keep the full portfolio as the reference
  // for both axes and bubble areas so a gap does not inflate when the strong base
  // is hidden, and competencies do not move between filter states.
  const valid = rows.map((row, index) => ({ ...row, index })).filter((row) => finite(row.worldShareChange) && finite(row.fwci) && row.fwci >= 0);
  const xs = niceBounds(valid.map((row) => row.worldShareChange), 0);
  const ys = niceBounds(valid.map((row) => row.fwci), 1, { floorZero: true, minSpan: 1 });
  const X = (v) => m.l + (v - xs.lo) / (xs.hi - xs.lo) * plotW;
  const Y = (v) => m.t + plotH - (v - ys.lo) / (ys.hi - ys.lo) * plotH;
  const xRef = X(0); const yRef = Y(1);
  const maxN = Math.max(1, ...valid.filter((row) => finite(row.n) && row.n > 0).map((row) => row.n));
  const maxR = wide ? 31 : 22;
  const R = (n) => finite(n) && n > 0 ? Math.sqrt(n / maxN) * maxR : 0;
  const out = [`<svg class="chart-svg chart-strategy" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(t.title)}"><title>${esc(t.title)}</title><desc>${esc(t.description)}</desc>`];
  out.push(`<rect x="${m.l}" y="${m.t}" width="${plotW}" height="${plotH}" fill="var(--surface)"/>`);
  out.push(`<rect x="${round(xRef)}" y="${m.t}" width="${round(m.l + plotW - xRef)}" height="${plotH}" fill="var(--cool-wash)" opacity=".65"/>`);
  out.push(`<rect x="${m.l}" y="${round(yRef)}" width="${plotW}" height="${round(m.t + plotH - yRef)}" fill="var(--sunken)" opacity=".3"/>`);
  out.push('<g class="grid">');
  for (const v of xs.ticks) out.push(`<line x1="${round(X(v))}" x2="${round(X(v))}" y1="${m.t}" y2="${m.t + plotH}"/>`);
  for (const v of ys.ticks) out.push(`<line x1="${m.l}" x2="${m.l + plotW}" y1="${round(Y(v))}" y2="${round(Y(v))}"/>`);
  out.push('</g><g class="axis-text">');
  const xTicks = !wide && xs.ticks.length > 7 ? xs.ticks.filter((_, i) => i % 2 === 0) : xs.ticks;
  for (const v of xTicks) out.push(text(X(v), m.t + plotH + 21, delta(lang, v), 'text-anchor="middle"'));
  for (const v of ys.ticks) out.push(text(m.l - 9, Y(v) + 4, number(lang, v, 1), 'text-anchor="end"'));
  out.push(text(m.l, 26, t.impactAxis, 'class="axis-title" font-weight="600"'));
  out.push(text(m.l + plotW / 2, m.t + plotH + 48, t.worldAxis, `class="axis-title" text-anchor="middle" font-size="${wide ? 12 : 10}"`));
  out.push('</g><g class="ref">');
  out.push(`<line x1="${round(xRef)}" x2="${round(xRef)}" y1="${m.t}" y2="${m.t + plotH}" stroke-dasharray="5 4"/><line x1="${m.l}" x2="${m.l + plotW}" y1="${round(yRef)}" y2="${round(yRef)}" stroke-dasharray="5 4"/>`);
  out.push('</g>');
  // Labels sit outside the data area; quadrant descriptions remain readable even
  // when the zero line is close to an edge because a topic grows very fast.
  out.push(`<g fill="var(--muted)" font-size="${wide ? 10.5 : 8.7}" font-weight="600">`);
  out.push(text(m.l, m.t - 17, t.loss));
  out.push(text(m.l + plotW, m.t - 17, t.gain, 'text-anchor="end"'));
  out.push(text(m.l + plotW - 8, yRef - 12, t.above, 'text-anchor="end"'));
  out.push(text(m.l + plotW - 8, yRef + 20, t.below, 'text-anchor="end"'));
  out.push('</g><g class="strategy-points">');
  const plotted = valid.filter((row) => !row.filtered).map((row) => ({ ...row, cx: X(row.worldShareChange), cy: Y(row.fwci), radius: R(row.n) }));
  // Large bubbles first, to keep small competencies visible. Coordinates and areas
  // are never moved to make the layout look cleaner.
  for (const row of [...plotted].sort((a, b) => b.radius - a.radius)) {
    const status = statusOf(row);
    out.push(linkOpen(row, hrefFor, lang, `pt strategy-${status}`), `<title>${esc(rowTitle(row, lang))}</title>`);
    out.push(`<circle class="hit" cx="${round(row.cx)}" cy="${round(row.cy)}" r="${round(Math.max(12, row.radius + 4))}"/>`);
    if (row.radius > 0) out.push(`<circle class="dot strategy-dot" cx="${round(row.cx)}" cy="${round(row.cy)}" r="${round(row.radius)}" fill="${colour(status)}"/>`);
    else out.push(`<path d="M${round(row.cx - 4)},${round(row.cy - 4)}l8,8m-8,0l8,-8" stroke="${colour(status)}" stroke-width="2" fill="none"/>`);
    out.push(linkClose(row, hrefFor));
  }
  out.push('</g>');
  // Number chips have their own layout and leaders. This keeps dense clusters
  // readable without changing a competency's measured position.
  const placed = [];
  const chips = [];
  for (const row of plotted) {
    const chipW = row.index >= 9 ? 28 : 23; const chipH = 21;
    let spot = null;
    const candidates = [{ x: row.cx - chipW / 2, y: row.cy - chipH / 2 }];
    for (let ring = 1; ring <= 9; ring += 1) {
      for (const angle of [0, 180, 90, 270, 45, 135, 315, 225]) {
        const rad = angle * Math.PI / 180;
        const distance = row.radius + 11 + ring * 15;
        candidates.push({ x: row.cx + Math.cos(rad) * distance - chipW / 2, y: row.cy - Math.sin(rad) * distance - chipH / 2 });
      }
    }
    for (const candidate of candidates) {
      const box = { ...candidate, w: chipW, h: chipH };
      if (box.x >= m.l + 2 && box.y >= m.t + 2 && box.x + chipW <= m.l + plotW - 2 && box.y + chipH <= m.t + plotH - 2 && !placed.some((p) => overlaps(p, box))) { spot = box; break; }
    }
    if (!spot) continue; // Full names and numbers remain in the key and data table.
    placed.push(spot);
    const cx = spot.x + chipW / 2; const cy = spot.y + chipH / 2;
    if (Math.hypot(cx - row.cx, cy - row.cy) > 5) out.push(`<line class="leader" x1="${round(row.cx)}" y1="${round(row.cy)}" x2="${round(cx)}" y2="${round(cy)}"/>`);
    chips.push(linkOpen(row, hrefFor, lang, `strategy-number strategy-${statusOf(row)}`), `<title>${esc(rowTitle(row, lang))}</title><rect x="${round(spot.x)}" y="${round(spot.y)}" width="${chipW}" height="${chipH}" rx="5" fill="var(--surface)" stroke="${colour(statusOf(row))}" stroke-width="1.5"/>`, text(cx, cy + 4, row.index + 1, 'text-anchor="middle" fill="var(--ink)" font-size="11.5" font-weight="700"'), linkClose(row, hrefFor));
  }
  out.push(`<g>${chips.join('')}</g>`);
  const areaY = m.t + plotH + 80;
  out.push(`<g fill="var(--muted)" font-size="10.5">${text(m.l, areaY, t.area)}</g>`);
  for (const [r, x] of [[5, m.l + 224], [10, m.l + 249], [15, m.l + 282]]) out.push(`<circle cx="${x}" cy="${areaY - 3}" r="${r}" fill="var(--context)" fill-opacity=".22" stroke="var(--context)"/>`);
  const keyLeft = wide ? w - keyW + 5 : m.l;
  out.push(text(keyLeft, keyTop - 22, t.key, 'fill="var(--ink)" font-size="12" font-weight="600"'));
  const colWidth = wide ? keyW - 16 : (w - m.l - 18) / keyCols;
  rows.forEach((row, index) => {
    const col = wide ? 0 : index % keyCols;
    const keyRow = wide ? index : Math.floor(index / keyCols);
    const x = keyLeft + col * colWidth; const y = keyTop + keyRow * keyRowH;
    const complete = !row.filtered && finite(row.worldShareChange) && finite(row.fwci) && row.fwci >= 0;
    out.push(linkOpen(row, hrefFor, lang, `strategy-key strategy-${statusOf(row)}${row.filtered ? ' strategy-filtered' : ''}`), `<title>${esc(row.filtered ? `${t.filtered}. ${rowTitle(row, lang)}` : rowTitle(row, lang))}</title><rect x="${x - 6}" y="${y - 17}" width="${colWidth}" height="${keyRowH}" fill="transparent"/>`);
    out.push(`<circle cx="${x + 5}" cy="${y - 4}" r="9" fill="var(--surface)" stroke="${row.filtered ? 'var(--context)' : colour(statusOf(row))}" stroke-width="1.5"/>`);
    out.push(text(x + 5, y, index + 1, 'text-anchor="middle" fill="var(--ink)" font-size="10" font-weight="700"'));
    out.push(text(x + 22, y, shortText(nameOf(row), Math.floor((colWidth - 62) / 6.0)), `fill="var(--ink${complete ? '' : '-2'})" font-size="11.5"`));
    if (!complete) out.push(text(x + colWidth - 15, y, '—', 'text-anchor="end" fill="var(--muted)" font-size="12"'));
    out.push(linkClose(row, hrefFor));
  });
  if (rows.some((row) => !row.filtered && (!finite(row.worldShareChange) || !finite(row.fwci) || row.fwci < 0))) out.push(text(keyLeft, keyTop + Math.ceil(rows.length / keyCols) * keyRowH + 22, t.unplotted, 'fill="var(--muted)" font-size="10.5"'));
  out.push('</svg>');
  return out.join('');
}

const METRICS = [
  { key: 'n', mode: 'count' }, { key: 'ai', mode: 'ratio' }, { key: 'fwci', mode: 'ratio' },
  { key: 'growthOwn', mode: 'change' }, { key: 'growthWorld', mode: 'change' },
  { key: 'ownShareChange', mode: 'change' }, { key: 'worldShareChange', mode: 'change' },
];

/** Dense matrix, designed to live in an overflow-x:auto wrapper on small screens. */
export function capabilityHeatmap({ rows = [], lang = 'ru', hrefFor } = {}, width = 1160) {
  const t = WORDS[lang] ?? WORDS.ru;
  const w = Math.max(980, Number.isFinite(width) ? Math.round(width) : 1160);
  const m = { l: 10, r: 10, t: 92, b: 68 };
  const nameW = Math.max(250, Math.min(318, w * 0.26));
  const cellW = (w - m.l - m.r - nameW) / METRICS.length;
  const rowH = 43; const h = m.t + rows.length * rowH + m.b;
  const maxCount = Math.max(1, ...rows.filter((row) => finite(row.n) && row.n >= 0).map((row) => row.n));
  // Log-ratio normalisation is centred on AI/FWCI=1. Signed changes use asinh:
  // a monotonic compression that keeps small changes legible beside large ones.
  const transform = (metric, value) => metric.mode === 'ratio' ? Math.log2(Math.max(1e-6, value)) : Math.asinh(value * 4);
  const extents = METRICS.map((metric) => metric.mode === 'count' ? 1 : Math.max(1, ...rows.filter((row) => finite(row[metric.key]) && (metric.mode !== 'ratio' || row[metric.key] >= 0)).map((row) => Math.abs(transform(metric, row[metric.key])))));
  const out = [`<svg class="chart-svg chart-capability-heatmap" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(t.matrix)}"><title>${esc(t.matrix)}</title><desc>${esc(t.matrixDesc)}</desc>`];
  out.push(text(m.l, 19, t.baseline, 'fill="var(--muted)" font-size="11.5"'));
  METRICS.forEach((metric, i) => {
    const x = m.l + nameW + i * cellW + cellW / 2;
    out.push(text(x, 48, t.headers[i][0], 'text-anchor="middle" fill="var(--ink)" font-size="10.5" font-weight="600"'));
    out.push(text(x, 65, t.headers[i][1], 'text-anchor="middle" fill="var(--muted)" font-size="10.5"'));
  });
  out.push(`<line x1="${m.l}" x2="${w - m.r}" y1="${m.t - 9}" y2="${m.t - 9}" stroke="var(--line)"/>`);
  rows.forEach((row, index) => {
    const y = m.t + index * rowH; const status = statusOf(row);
    out.push(linkOpen(row, hrefFor, lang, `strategy-heat-row strategy-${status}`), `<title>${esc(rowTitle(row, lang))}</title>`);
    if (index % 2 === 0) out.push(`<rect x="${m.l}" y="${y - 5}" width="${w - m.l - m.r}" height="${rowH}" fill="var(--sunken)" opacity=".4"/>`);
    out.push(`<rect x="${m.l}" y="${y}" width="3" height="${rowH - 9}" rx="1" fill="${colour(status)}"/>`);
    out.push(text(m.l + 20, y + 17, index + 1, 'text-anchor="middle" fill="var(--muted)" font-size="10.5"'));
    out.push(text(m.l + 38, y + 17, shortText(nameOf(row), Math.floor((nameW - 48) / 6.0)), 'fill="var(--ink)" font-size="11.5"'));
    METRICS.forEach((metric, i) => {
      const value = row[metric.key]; const x = m.l + nameW + i * cellW;
      const present = finite(value) && (metric.mode === 'change' || value >= 0);
      const cx = x + cellW / 2;
      const signed = metric.mode !== 'count';
      const normal = present ? metric.mode === 'count' ? Math.log1p(value) / Math.log1p(maxCount) : clip(transform(metric, value) / extents[i], -1, 1) : 0;
      const tone = metric.mode === 'count' ? 'var(--context)' : normal >= 0 ? 'var(--strategy-strong, #2b7e75)' : 'var(--strategy-declining, #b4432d)';
      out.push(`<rect x="${round(x + 3)}" y="${y - 1}" width="${round(cellW - 6)}" height="${rowH - 9}" rx="3" fill="${present ? tone : 'var(--surface)'}" fill-opacity="${present ? round(0.04 + Math.abs(normal) * 0.13) : 1}"/>`);
      out.push(text(cx, y + 14, metric.mode === 'change' ? delta(lang, value) : number(lang, present ? value : null, metric.mode === 'count' ? 0 : 2), 'class="num" text-anchor="middle" fill="var(--ink)" font-size="12" font-weight="600"'));
      if (present) {
        const barY = y + 24; const half = (cellW - 22) / 2;
        out.push(`<line x1="${round(x + 11)}" x2="${round(x + cellW - 11)}" y1="${barY}" y2="${barY}" stroke="var(--line)" stroke-width="3"/>`);
        if (signed) {
          const end = cx + normal * half;
          if (Math.abs(normal) > 0) out.push(`<line x1="${round(cx)}" x2="${round(end)}" y1="${barY}" y2="${barY}" stroke="${tone}" stroke-width="3"/>`);
          out.push(`<line x1="${round(cx)}" x2="${round(cx)}" y1="${barY - 4}" y2="${barY + 4}" stroke="var(--ref)" stroke-width="1"/>`);
        } else if (normal > 0) out.push(`<line x1="${round(x + 11)}" x2="${round(x + 11 + normal * (cellW - 22))}" y1="${barY}" y2="${barY}" stroke="${tone}" stroke-width="3"/>`);
      } else out.push(text(cx, y + 29, t.noData, 'text-anchor="middle" fill="var(--muted)" font-size="8.5"'));
    });
    out.push(linkClose(row, hrefFor));
  });
  const legendY = m.t + rows.length * rowH + 25;
  out.push(text(m.l, legendY, t.encoding, 'fill="var(--muted)" font-size="11"'));
  let lx = m.l;
  for (const status of STATUS) {
    out.push(`<rect x="${lx}" y="${legendY + 18}" width="9" height="9" rx="2" fill="${colour(status)}"/>`, text(lx + 15, legendY + 27, t[status], 'fill="var(--muted)" font-size="10.5"'));
    lx += (t[status].length * 6.1) + 35;
  }
  out.push('</svg>');
  return out.join('');
}
