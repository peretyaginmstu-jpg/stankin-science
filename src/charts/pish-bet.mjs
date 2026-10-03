// PISH bet: self-contained SVG diagrams for the application concept.
// Every number arrives in the spec; the renderers never invent a value.
import { PISH_SVG_STYLE } from './pish.mjs';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const finite = v => v != null && Number.isFinite(v);
const fmt = (lang, v, d = 0) => finite(v) ? new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'ru-RU', { maximumFractionDigits: d }).format(v) : '—';
const tx = (x, y, s, a = '') => `<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
const size = w => Math.max(340, Number.isFinite(w) ? Math.round(w) : 1160);
const textW = (s, px) => String(s ?? '').length * px * 0.56;
function lines(s, n) {
  const words = String(s ?? '').split(/\s+/).filter(Boolean); const out = []; let line = '';
  for (const word of words) { if (line && line.length + word.length + 1 > n) { out.push(line); line = word; } else line += `${line ? ' ' : ''}${word}`; }
  if (line) out.push(line); return out;
}
const multiline = (x, y, s, n, lh, attrs = '') => lines(s, n).map((l, i) => tx(x, y + i * lh, l, attrs)).join('');
const charsFor = (width, px) => Math.max(8, Math.floor(width / (px * 0.56)));
const open = (cls, w, h, label, title, desc, standalone) => `<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram ${cls}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}"><title>${esc(title)}</title><desc>${esc(desc)}</desc>${standalone ? PISH_SVG_STYLE : ''}`;
const marker = (id, cls) => `<marker id="${id}" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" class="${cls}"/></marker>`;

// Chips flow left to right and wrap; returns the markup and the occupied height.
function chipFlow(items, x, y, maxW, cls, px = 11) {
  let cx = x, cy = y; const h = 24, gap = 7; const parts = [];
  for (const item of items) {
    const label = String(item.label ?? '');
    const width = Math.min(maxW, textW(label, px) + 20);
    if (cx > x && cx + width > x + maxW) { cx = x; cy += h + gap; }
    const shown = textW(label, px) + 20 > maxW ? `${label.slice(0, charsFor(maxW - 24, px) - 1)}…` : label;
    parts.push(`<g><title>${esc(item.title ?? label)}</title><rect x="${cx}" y="${cy}" width="${width}" height="${h}" rx="4" class="${cls}"/>${tx(cx + 10, cy + 16, shown, `font-size="${px}"`)}</g>`);
    cx += width + gap;
  }
  return { svg: parts.join(''), height: items.length ? cy - y + h : 0 };
}

// 1 · What the new school builds, what it reuses and who buys the product.
export function pishBetMap(spec = {}, width = 1160, { standalone = false } = {}) {
  const { lang = 'ru', existing = {}, product = {}, customer = {}, base = [], gaps = [], flows = {} } = spec;
  const en = lang === 'en'; const w = size(width); const narrow = w < 900; const id = `pish-betmap-${lang}`;
  const steps = product.steps ?? []; const parts = product.parts ?? [];
  const label = en ? 'The bet: what the new school builds' : 'Ставка: что создаёт новая ПИШ';
  const desc = en ? 'Three blocks. The existing school develops tooling and components; its tools become test objects. The new school builds an adaptive machining control system on STANKIN’s strong machining and metrology base, with partners covering control, diagnostics and AI. A qualified customer produces and sells the product and co-finances the work. This is a proposal, not an agreement.' : 'Три блока. Действующая ПИШ разрабатывает инструмент и узлы; её инструмент становится объектом испытаний. Новая ПИШ создаёт систему адаптивного управления обработкой на сильной базе резания и метрологии СТАНКИН, а управление, диагностику и ИИ усиливают партнёры. Квалифицированный заказчик выпускает и продаёт продукт и софинансирует работу. Это предложение, а не договорённость.';
  const defs = `<defs>${marker(`${id}-blue`, 'pish-t-blue')}${marker(`${id}-coral`, 'pish-t-coral')}${marker(`${id}-muted`, 'pish-muted')}</defs>`;
  const out = [];
  const sideItem = (x, y, wBox, item, nameN, subN) => {
    const nameL = lines(item.label, nameN); const subL = lines(item.sub, subN); const hBox = 22 + nameL.length * 17 + subL.length * 14 + 8;
    return { h: hBox, svg: `<g><rect x="${x}" y="${y}" width="${wBox}" height="${hBox}" rx="6" class="pish-side-box"/>${multiline(x + 12, y + 22, item.label, nameN, 17, 'font-size="13.5" font-weight="600"')}${multiline(x + 12, y + 26 + nameL.length * 17, item.sub, subN, 14, 'font-size="11" class="pish-muted"')}</g>` };
  };
  if (!narrow) {
    const pad = 20, sideW = Math.round(Math.min(230, (w - 40) * 0.17)), gap = Math.round(Math.min(118, (w - 40) * 0.095));
    const leftX = pad, centerX = pad + sideW + gap, centerW = w - 2 * pad - 2 * sideW - 2 * gap, rightX = centerX + centerW + gap;
    const top = 104;
    out.push(tx(pad, 26, en ? 'THE BET · WHAT THE NEW SCHOOL BUILDS AND HOW IT DIFFERS' : 'СТАВКА · ЧТО СОЗДАЁТ НОВАЯ ПИШ И ЧЕМ ОНА ОТЛИЧАЕТСЯ', 'font-size="12" font-weight="600" letter-spacing="1"'));
    const header = (x, wBox, title, sub, cls) => { const t = lines(title, Math.floor(wBox / 8.2)); return `${t.map((l, i) => tx(x, 50 + i * 14 - (t.length - 1) * 14 + 14, l, `font-size="11.5" font-weight="700" letter-spacing=".8" class="${cls}"`)).join('')}${multiline(x, 81, sub, charsFor(wBox, 11), 13, 'font-size="11" class="pish-muted"')}`; };
    out.push(header(leftX, sideW, existing.title, existing.sub, 'pish-muted'), header(centerX, centerW, product.title, product.sub, 'pish-t-blue'), header(rightX, sideW, customer.title, customer.sub, 'pish-t-coral'));
    // side columns
    let ly = top; const nameN = charsFor(sideW - 24, 13.5), subN = charsFor(sideW - 24, 11);
    for (const item of existing.items ?? []) { const b = sideItem(leftX, ly, sideW, item, nameN, subN); out.push(b.svg); ly += b.h + 10; }
    let ry = top;
    for (const item of customer.items ?? []) { const b = sideItem(rightX, ry, sideW, item, nameN, subN); out.push(b.svg); ry += b.h + 10; }
    // product box
    const nameLines = lines(product.name, charsFor(centerW - 40, 18)); const partsText = parts.join(' · '); const partsLines = lines(partsText, charsFor(centerW - 40, 11.5));
    const chipsTop = top + 30 + nameLines.length * 22 + partsLines.length * 15 + 12; const chipGap = 18; const chipW = (centerW - 32 - chipGap * Math.max(0, steps.length - 1)) / Math.max(1, steps.length);
    const longest = Math.max(1, ...steps.map(s => String(s.label ?? '').length)); const stepPx = Math.max(10.5, Math.min(13, (chipW - 18) / (longest * 0.6)));
    const subLines = Math.max(1, ...steps.map(s => lines(s.sub, charsFor(chipW - 16, 10)).length)); const chipH = 46 + subLines * 12;
    const boxBottom = chipsTop + chipH + 50;
    out.push(`<rect x="${centerX}" y="${top}" width="${centerW}" height="${boxBottom - top}" rx="8" class="pish-product-box"/>`);
    out.push(multiline(centerX + 16, top + 30, product.name, charsFor(centerW - 40, 18), 22, 'font-size="18" font-weight="650"'));
    out.push(multiline(centerX + 16, top + 30 + nameLines.length * 22 + 2, partsText, charsFor(centerW - 40, 11.5), 15, 'font-size="11.5" class="pish-muted"'));
    steps.forEach((s, i) => {
      const x = centerX + 16 + i * (chipW + chipGap);
      out.push(`<g><title>${esc(`${s.label}: ${s.sub ?? ''}`)}</title><rect x="${x}" y="${chipsTop}" width="${chipW}" height="${chipH}" rx="6" class="pish-step"/>${tx(x + 10, chipsTop + 19, String(i + 1).padStart(2, '0'), 'font-size="10" font-weight="600" class="pish-t-blue"')}${tx(x + 10, chipsTop + 37, s.label, `font-size="${stepPx.toFixed(1)}" font-weight="650"`)}${multiline(x + 10, chipsTop + 56, s.sub, charsFor(chipW - 16, 10), 12, 'font-size="10" class="pish-muted"')}</g>`);
      if (i < steps.length - 1) out.push(`<path class="pish-flow-blue" d="M${x + chipW + 2},${chipsTop + chipH / 2} H${x + chipW + chipGap - 4}" marker-end="url(#${id}-blue)"/>`);
    });
    if (steps.length > 1) {
      const fx = centerX + 16 + chipW / 2, lx = centerX + 16 + (steps.length - 1) * (chipW + chipGap) + chipW / 2, fy = chipsTop + chipH + 22;
      out.push(`<path class="pish-flow-blue" d="M${lx},${chipsTop + chipH} V${fy} H${fx} V${chipsTop + chipH + 6}" marker-end="url(#${id}-blue)"/>`);
      out.push(tx((fx + lx) / 2, fy + 17, product.loop ?? '', 'font-size="11" font-weight="600" text-anchor="middle" class="pish-t-blue"'));
    }
    // evidence chips under the product
    let cy = boxBottom + 26;
    out.push(tx(centerX, cy, product.baseTitle ?? '', 'font-size="11" font-weight="700" letter-spacing=".6" class="pish-t-green"'));
    const b1 = chipFlow(base, centerX, cy + 9, centerW, 'pish-chip-base'); out.push(b1.svg); cy += 9 + b1.height + 26;
    out.push(tx(centerX, cy, product.gapTitle ?? '', 'font-size="11" font-weight="700" letter-spacing=".6" class="pish-t-coral"'));
    const b2 = chipFlow(gaps, centerX, cy + 9, centerW, 'pish-chip-gap'); out.push(b2.svg); cy += 9 + b2.height;
    // flows between blocks
    const flow = (x1, x2, y, cls, mk, text, below = true) => {
      const t = lines(text, charsFor(gap - 12, 10.5));
      return `<path class="${cls}" d="M${x1},${y} H${x2}" marker-end="url(#${mk})"/>${t.map((l, i) => tx((x1 + x2) / 2, below ? y + 17 + i * 13 : y - 9 - (t.length - 1 - i) * 13, l, 'font-size="10.5" text-anchor="middle"')).join('')}`;
    };
    out.push(flow(leftX + sideW + 4, centerX - 6, top + 34, 'pish-flow-muted', `${id}-muted`, flows.reuse));
    out.push(flow(centerX + centerW + 4, rightX - 6, top + 34, 'pish-flow-blue', `${id}-blue`, flows.product));
    out.push(flow(rightX - 4, centerX + centerW + 6, boxBottom - 34, 'pish-flow-coral', `${id}-coral`, flows.money));
    const h = Math.max(cy, ly, ry) + 44;
    out.push(multiline(pad, h - 14, spec.note ?? '', charsFor(w - 40, 10.5), 13, 'font-size="10.5" class="pish-muted"'));
    return open('pish-bet-map', w, h, label, label, desc, standalone) + defs + out.join('') + '</svg>';
  }
  // narrow: a vertical story
  const pad = 16, innerW = w - 2 * pad; let y = 24;
  out.push(multiline(pad, y, en ? 'THE BET · WHAT THE NEW SCHOOL BUILDS' : 'СТАВКА · ЧТО СОЗДАЁТ НОВАЯ ПИШ', charsFor(innerW, 12), 15, 'font-size="12" font-weight="600" letter-spacing=".8"'));
  y += 30;
  const block = (title, sub, items, cls) => {
    out.push(tx(pad, y, title, `font-size="11.5" font-weight="700" letter-spacing=".6" class="${cls}"`)); y += 6;
    out.push(multiline(pad, y + 12, sub, charsFor(innerW, 11), 13, 'font-size="11" class="pish-muted"')); y += lines(sub, charsFor(innerW, 11)).length * 13 + 12;
    for (const item of items ?? []) { const b = sideItem(pad, y, innerW, item, charsFor(innerW - 24, 13.5), charsFor(innerW - 24, 11)); out.push(b.svg); y += b.h + 8; }
  };
  const down = (cls, mk, text) => {
    const t = lines(text, charsFor(innerW - 46, 11));
    out.push(`<path class="${cls}" d="M${pad + 18},${y} V${y + Math.max(34, t.length * 14 + 10)}" marker-end="url(#${mk})"/>`, ...t.map((l, i) => tx(pad + 36, y + 18 + i * 14, l, 'font-size="11"')));
    y += Math.max(34, t.length * 14 + 10) + 20;
  };
  block(existing.title, existing.sub, existing.items, 'pish-muted');
  down('pish-flow-muted', `${id}-muted`, flows.reuse);
  // product
  out.push(tx(pad, y, product.title, 'font-size="11.5" font-weight="700" letter-spacing=".6" class="pish-t-blue"')); y += 10;
  const nameN = charsFor(innerW - 28, 16), nameL = lines(product.name, nameN), partsText = parts.join(' · '), partsL = lines(partsText, charsFor(innerW - 28, 11));
  const cols = 2, cg = 10, cw = (innerW - 28 - cg) / cols, chH = 62, rows = Math.ceil(steps.length / cols);
  const boxH = 24 + nameL.length * 20 + partsL.length * 14 + 12 + rows * (chH + cg) + 26;
  out.push(`<rect x="${pad}" y="${y}" width="${innerW}" height="${boxH}" rx="8" class="pish-product-box"/>`);
  out.push(multiline(pad + 14, y + 26, product.name, nameN, 20, 'font-size="16" font-weight="650"'));
  out.push(multiline(pad + 14, y + 28 + nameL.length * 20, partsText, charsFor(innerW - 28, 11), 14, 'font-size="11" class="pish-muted"'));
  const gy = y + 24 + nameL.length * 20 + partsL.length * 14 + 12;
  steps.forEach((s, i) => {
    const x = pad + 14 + (i % cols) * (cw + cg), sy = gy + Math.floor(i / cols) * (chH + cg);
    out.push(`<g><title>${esc(`${s.label}: ${s.sub ?? ''}`)}</title><rect x="${x}" y="${sy}" width="${cw}" height="${chH}" rx="6" class="pish-step"/>${tx(x + 9, sy + 17, s.label, `font-size="${Math.max(10, Math.min(12.5, (cw - 16) / (String(s.label ?? '').length * 0.6))).toFixed(1)}" font-weight="650"`)}${multiline(x + 9, sy + 34, s.sub, charsFor(cw - 14, 10), 12, 'font-size="10" class="pish-muted"')}</g>`);
  });
  out.push(multiline(pad + 14, y + boxH - 12, `↺ ${product.loop ?? ''}`, charsFor(innerW - 28, 10.5), 13, 'font-size="10.5" font-weight="600" class="pish-t-blue"'));
  y += boxH + 22;
  out.push(tx(pad, y, product.baseTitle ?? '', 'font-size="11" font-weight="700" class="pish-t-green"'));
  const n1 = chipFlow(base, pad, y + 8, innerW, 'pish-chip-base', 10.5); out.push(n1.svg); y += 8 + n1.height + 24;
  out.push(tx(pad, y, product.gapTitle ?? '', 'font-size="11" font-weight="700" class="pish-t-coral"'));
  const n2 = chipFlow(gaps, pad, y + 8, innerW, 'pish-chip-gap', 10.5); out.push(n2.svg); y += 8 + n2.height + 18;
  down('pish-flow-blue', `${id}-blue`, flows.product);
  block(customer.title, customer.sub, customer.items, 'pish-t-coral');
  out.push(multiline(pad, y + 14, `↑ ${flows.money ?? ''}`, charsFor(innerW, 11.5), 15, 'font-size="11.5" font-weight="600" class="pish-t-coral"'));
  y += lines(`↑ ${flows.money ?? ''}`, charsFor(innerW, 11.5)).length * 15 + 26;
  out.push(multiline(pad, y, spec.note ?? '', charsFor(innerW, 10.5), 13, 'font-size="10.5" class="pish-muted"'));
  y += lines(spec.note ?? '', charsFor(innerW, 10.5)).length * 13 + 10;
  return open('pish-bet-map', w, y, label, label, desc, standalone) + defs + out.join('') + '</svg>';
}

// 2 · Annual increments of the cumulative Annex 10 business R&D minimum.
export function pishFundingChart(spec = {}, width = 1160, { standalone = false } = {}) {
  const { lang = 'ru', years = [], cumulative = [], context = null, budgetUntil = 2029 } = spec;
  const en = lang === 'en'; const w = size(width); const narrow = w < 700;
  const inc = cumulative.map((v, i) => finite(v) ? (i === 0 ? v : finite(cumulative[i - 1]) ? v - cumulative[i - 1] : null) : null);
  const left = narrow ? 42 : 62, right = narrow ? 12 : 214, top = 64, plotH = narrow ? 230 : 270; const plotW = w - left - right;
  const maxV = Math.max(1, ...inc.filter(finite), finite(context?.value) ? context.value : 0);
  const step = maxV > 600 ? 200 : 100; const yMax = Math.ceil(maxV * 1.12 / step) * step;
  const Y = v => top + plotH - v / yMax * plotH; const band = plotW / Math.max(1, years.length); const X = i => left + i * band;
  const label = en ? 'Business R&D minimum by year' : 'Минимум НИОКР в интересах бизнеса по годам';
  const desc = en ? 'Bars show the yearly increase of the cumulative Annex 10 minimum for business-oriented R&D funding. The dashed line shows STANKIN’s total 2025 receipts from R&D, services and production work, a different perimeter shown only for scale. Budget funding for the school ends in 2029.' : 'Столбцы — ежегодный прирост минимума нарастающего итога «Финансирование НИОКР в интересах бизнеса» из приложения 10. Пунктир — все поступления СТАНКИН от НИОКР, услуг и производственных работ за 2025 год: другой контур, показан только для масштаба. Бюджетное финансирование ПИШ заканчивается в 2029 году.';
  const out = [];
  out.push(tx(left, 22, en ? 'RUB MILLION PER YEAR · INCREASE OF THE CUMULATIVE MINIMUM' : 'МЛН ₽ В ГОД · ПРИРОСТ НАРАСТАЮЩЕГО МИНИМУМА', 'font-size="11.5" font-weight="600" letter-spacing=".6"'));
  const split = years.findIndex(y => y > budgetUntil); const splitX = split < 0 ? left + plotW : X(split);
  out.push(`<rect x="${left}" y="${top}" width="${splitX - left}" height="${plotH}" class="pish-band-budget"/>`);
  if (split >= 0) out.push(`<rect x="${splitX}" y="${top}" width="${left + plotW - splitX}" height="${plotH}" class="pish-band-extra"/>`);
  out.push(multiline(left + 8, top - 18, en ? `Budget + ≥50% customer · to ${budgetUntil}` : `Бюджет + ≥50% заказчика · до ${budgetUntil}`, charsFor(splitX - left - 10, 10.5), 12, 'font-size="10.5" font-weight="600" class="pish-t-green"'));
  if (split >= 0) out.push(multiline(splitX + 8, top - 18, en ? 'Extra-budgetary money only' : 'Только внебюджетные деньги', charsFor(left + plotW - splitX - 10, 10.5), 12, 'font-size="10.5" font-weight="600" class="pish-t-coral"'));
  for (let v = 0; v <= yMax + 0.001; v += step) out.push(`<line x1="${left}" x2="${left + plotW}" y1="${Y(v)}" y2="${Y(v)}" class="pish-grid"/>`, tx(left - 8, Y(v) + 4, fmt(lang, v), 'font-size="10.5" class="pish-muted" text-anchor="end"'));
  years.forEach((year, i) => {
    const v = inc[i]; const bw = band * (narrow ? 0.62 : 0.56); const x = X(i) + (band - bw) / 2;
    if (finite(v)) out.push(`<g><title>${esc(`${year}: +${fmt(lang, v, 1)} · Σ ${fmt(lang, cumulative[i], 1)}`)}</title><rect x="${x}" y="${Y(Math.max(0, v))}" width="${bw}" height="${Math.max(0, Y(0) - Y(Math.max(0, v)))}" rx="2" class="pish-bar"/>${tx(x + bw / 2, Y(Math.max(0, v)) - 6, fmt(lang, v), `font-size="${narrow ? 9.5 : 11}" font-weight="600" text-anchor="middle"`)}</g>`);
    out.push(tx(X(i) + band / 2, top + plotH + 18, String(narrow ? `’${String(year).slice(2)}` : year), `font-size="${narrow ? 10 : 11}" text-anchor="middle"`));
    out.push(tx(X(i) + band / 2, top + plotH + 34, `Σ ${fmt(lang, cumulative[i])}`, `font-size="${narrow ? 8.5 : 10}" class="pish-muted" text-anchor="middle"`));
  });
  if (finite(context?.value)) {
    const cy = Y(context.value);
    out.push(`<line x1="${left}" x2="${left + plotW}" y1="${cy}" y2="${cy}" class="pish-reference"/>`);
    if (narrow) out.push(tx(left + 4, cy - 6, `${fmt(lang, context.value, 1)} · ${context.short ?? ''}`, 'font-size="10" font-weight="600"'));
    else out.push(tx(left + plotW + 12, cy + 4, `${fmt(lang, context.value, 1)} ${en ? 'RUB m' : 'млн ₽'}`, 'font-size="13" font-weight="650"'), multiline(left + plotW + 12, cy + 22, context.label ?? '', charsFor(right - 18, 10.5), 13, 'font-size="10.5" class="pish-muted"'));
  }
  const h = top + plotH + (narrow ? 96 : 78);
  out.push(multiline(left, top + plotH + 58, spec.note ?? '', charsFor(w - left - 12, 10.5), 13, 'font-size="10.5" class="pish-muted"'));
  return open('pish-funding-chart', w, h, label, label, desc, standalone) + out.join('') + '</svg>';
}

const dayOf = s => Math.round(Date.parse(`${s}T00:00:00Z`) / 864e5);
const dateLabel = (lang, s) => { const [, m, d] = String(s).split('-').map(Number); return lang === 'en' ? `${d} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1]}` : `${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`; };
const shape = (item, x, y) => item.gate ? `<path d="M${x},${y - 8} L${x + 8},${y} L${x},${y + 8} L${x - 8},${y} Z" class="pish-gate"/>` : item.official ? `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" class="pish-official"/>` : `<circle cx="${x}" cy="${y}" r="6" class="pish-internal"/>`;

// 3 · From the decision to submission: dated steps and the go / no-go gate.
export function pishSubmissionPath(spec = {}, width = 1160, { standalone = false } = {}) {
  const { lang = 'ru', items = [], window = {} } = spec;
  const en = lang === 'en'; const w = size(width); const narrow = w < 760;
  const label = en ? 'Path to submission' : 'Путь к подаче заявки';
  const desc = en ? 'Dated steps from the decision to submission on 1 December 2026. Squares are dates set by the call; circles are proposed internal deadlines; diamonds are decision gates. The go / no-go gate on 31 October checks the customer letter, chief designer and machine platforms.' : 'Шаги от решения до подачи 1 декабря 2026 года. Квадрат — дата конкурса, круг — предлагаемый внутренний срок, ромб — ворота решения. Ворота 31 октября проверяют письмо заказчика, главного конструктора и станочные платформы.';
  const out = [];
  const legend = y => `${shape({ official: true }, 22, y)}${tx(34, y + 4, en ? 'Call date' : 'Дата конкурса', 'font-size="10.5"')}${shape({}, 150, y)}${tx(162, y + 4, en ? 'Proposed deadline' : 'Предлагаемый срок', 'font-size="10.5"')}${shape({ gate: true }, narrow ? 22 : 316, narrow ? y + 22 : y)}${tx(narrow ? 34 : 328, (narrow ? y + 22 : y) + 4, en ? 'Decision gate' : 'Ворота решения', 'font-size="10.5"')}`;
  if (narrow) {
    const lineX = 76, textX = 94, textN = charsFor(w - textX - 14, 12.5); let y = 30;
    out.push(tx(16, 18, en ? 'PATH TO SUBMISSION' : 'ПУТЬ К ПОДАЧЕ', 'font-size="11.5" font-weight="600" letter-spacing=".8"'));
    const rows = items.map(item => ({ item, l: lines(item.label, textN) }));
    const total = rows.reduce((s, r) => s + Math.max(46, r.l.length * 16 + 18), 0);
    out.push(`<line x1="${lineX}" x2="${lineX}" y1="${y + 14}" y2="${y + total - 30}" class="pish-axis"/>`);
    for (const { item, l } of rows) {
      const rh = Math.max(46, l.length * 16 + 18), cy = y + 18;
      out.push(`<g><title>${esc(`${dateLabel(lang, item.date)} · ${item.label}`)}</title>`, tx(16, cy + 4, dateLabel(lang, item.date), `font-size="13" font-weight="${item.gate ? 700 : 600}"${item.gate ? ' class="pish-t-coral"' : ''}`), shape(item, lineX, cy), multiline(textX, cy + 4, item.label, textN, 16, `font-size="12.5"${item.gate ? ' font-weight="650"' : ''}`), '</g>');
      y += rh;
    }
    out.push(legend(y + 6));
    const h = y + 46;
    return open('pish-submission-path', w, h, label, label, desc, standalone) + out.join('') + '</svg>';
  }
  const dateW = 76, x0 = dateW + 26, x1 = w - 24, top = 72, rowH = 40;
  const d0 = dayOf('2026-10-01'), d1 = dayOf('2026-12-04'); const X = s => x0 + (dayOf(s) - d0) / (d1 - d0) * (x1 - x0);
  out.push(tx(16, 22, en ? 'PATH TO SUBMISSION · AUTUMN 2026' : 'ПУТЬ К ПОДАЧЕ · ОСЕНЬ 2026', 'font-size="11.5" font-weight="600" letter-spacing=".8"'));
  const rows = items.map(item => { const x = X(item.date), toRight = x < x0 + (x1 - x0) * 0.56, avail = toRight ? x1 - x - 16 : x - x0 - 16; return { item, x, toRight, l: lines(item.label, charsFor(avail, 12.5)) }; });
  const heights = rows.map(r => Math.max(rowH, r.l.length * 15 + 16)); const bottom = top + heights.reduce((a, b) => a + b, 0);
  if (window.from && window.to) {
    out.push(`<rect x="${X(window.from)}" y="${top - 8}" width="${X(window.to) - X(window.from)}" height="${bottom - top + 8}" class="pish-band-window"/>`);
    out.push(tx(X(window.from) + 6, top - 14, en ? `Application window ${dateLabel(lang, window.from)} – ${dateLabel(lang, window.to)}` : `Окно приёма заявок ${dateLabel(lang, window.from)}–${dateLabel(lang, window.to)}`, 'font-size="10.5" font-weight="600" class="pish-t-blue"'));
  }
  for (let d = d0; d <= d1; d += 1) {
    const date = new Date(d * 864e5); if (date.getUTCDay() !== 1 && date.getUTCDate() !== 1) continue;
    const s = date.toISOString().slice(0, 10); const first = date.getUTCDate() === 1;
    out.push(`<line x1="${X(s)}" x2="${X(s)}" y1="${top - 4}" y2="${bottom}" class="${first ? 'pish-axis' : 'pish-grid'}"/>`);
    if (first) out.push(tx(X(s) + 4, bottom + 16, en ? date.toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' }) : ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь'][date.getUTCMonth()], 'font-size="10.5" class="pish-muted"'));
  }
  const gate = items.find(i => i.gate && !i.official);
  if (gate) out.push(`<line x1="${X(gate.date)}" x2="${X(gate.date)}" y1="${top - 8}" y2="${bottom}" class="pish-gate-line"/>`);
  let y = top;
  rows.forEach(({ item, x, toRight, l }, i) => {
    const cy = y + 20; const attrs = `font-size="12.5" class="pish-halo"${item.gate ? ' font-weight="650"' : ''}${toRight ? '' : ' text-anchor="end"'}`;
    const labelX = toRight ? x + 14 : x - 14;
    out.push(`<g><title>${esc(`${dateLabel(lang, item.date)} · ${item.label}`)}</title>`, tx(16, cy + 4, dateLabel(lang, item.date), `font-size="13" font-weight="${item.gate ? 700 : 600}"${item.gate ? ' class="pish-t-coral"' : ''}`), shape(item, x, cy), l.map((t, k) => tx(labelX, cy + 4 + k * 15, t, attrs)).join(''), '</g>');
    y += heights[i];
  });
  const h = bottom + 58;
  return open('pish-submission-path', w, h, label, label, desc, standalone) + out.join('') + legend(bottom + 40) + '</svg>';
}

// 4 · Workstreams 2027–2036 with gates; budget years and the Annex 10 horizon are marked.
export function pishRoadmapChart(spec = {}, width = 1160, { standalone = false } = {}) {
  const { lang = 'ru', years = [], lanes = [], gates = [], budgetUntil = 2029, annexUntil = 2034 } = spec;
  const en = lang === 'en'; const w = size(width); const narrow = w < 820;
  const label = en ? 'Roadmap 2027–2036' : 'Дорожная карта 2027–2036';
  const desc = en ? 'Four workstreams across the years: product, research, people and money. Diamonds mark acceptance gates. Budget funding covers 2027–2029; Annex 10 indicators run to 2034. Targets are proposals; the Annex 10 sums are competition minimums.' : 'Четыре направления работ по годам: продукт, наука, кадры и деньги. Ромбы — ворота приёмки. Бюджетное финансирование — 2027–2029 годы, показатели приложения 10 — до 2034 года. Цели — предложения; суммы приложения 10 — минимумы конкурса.';
  const out = [];
  const span = b => `${b.from}${b.to !== b.from ? `–${b.to}` : ''}`;
  if (narrow) {
    const pad = 16, innerW = w - 2 * pad; let y = 22;
    out.push(tx(pad, y, en ? 'ROADMAP 2027–2036' : 'ДОРОЖНАЯ КАРТА 2027–2036', 'font-size="11.5" font-weight="600" letter-spacing=".8"')); y += 22;
    for (const lane of lanes) {
      out.push(tx(pad, y + 8, lane.label, `font-size="12.5" font-weight="700" class="pish-t-${lane.tone === 'science' ? 'green' : lane.tone === 'money' ? 'coral' : lane.tone === 'product' ? 'blue' : 'muted'}"`)); y += 18;
      for (const b of lane.bars ?? []) {
        const l = lines(b.label, charsFor(innerW - 92, 11.5)); const rh = Math.max(30, l.length * 14 + 14);
        out.push(`<rect x="${pad}" y="${y}" width="${innerW}" height="${rh - 6}" rx="4" class="pish-lane-${lane.tone}"/>`, tx(pad + 10, y + 17, span(b), 'font-size="11" font-weight="650"'), multiline(pad + 84, y + 17, b.label, charsFor(innerW - 92, 11.5), 14, 'font-size="11.5"'));
        y += rh;
      }
      y += 10;
    }
    out.push(tx(pad, y + 8, en ? 'Gates' : 'Ворота приёмки', 'font-size="12.5" font-weight="700" class="pish-t-coral"')); y += 22;
    for (const g of gates) {
      const l = lines(g.label, charsFor(innerW - 70, 11.5));
      out.push(shape({ gate: true }, pad + 8, y + 1), tx(pad + 24, y + 5, String(g.year), 'font-size="11.5" font-weight="650"'), multiline(pad + 66, y + 5, g.label, charsFor(innerW - 70, 11.5), 14, 'font-size="11.5"'));
      y += Math.max(24, l.length * 14 + 10);
    }
    y += 6;
    out.push(multiline(pad, y + 8, spec.note ?? '', charsFor(innerW, 10.5), 13, 'font-size="10.5" class="pish-muted"'));
    y += lines(spec.note ?? '', charsFor(innerW, 10.5)).length * 13 + 16;
    return open('pish-roadmap-chart', w, y, label, label, desc, standalone) + out.join('') + '</svg>';
  }
  const labelW = 150, x0 = labelW + 24, x1 = w - 16, top = 70, laneH = 58, yearW = (x1 - x0) / Math.max(1, years.length);
  const X = year => x0 + (year - years[0]) * yearW; const bottom = top + lanes.length * laneH;
  out.push(tx(16, 22, en ? 'ROADMAP 2027–2036 · WORKSTREAMS AND GATES' : 'ДОРОЖНАЯ КАРТА 2027–2036 · НАПРАВЛЕНИЯ И ВОРОТА', 'font-size="11.5" font-weight="600" letter-spacing=".8"'));
  if (years.includes(budgetUntil)) {
    out.push(`<rect x="${x0}" y="${top - 26}" width="${X(budgetUntil + 1) - x0}" height="${bottom - top + 26}" class="pish-band-budget"/>`);
    out.push(tx(x0 + 6, top - 31, en ? `Budget funding · ${years[0]}–${budgetUntil}` : `Бюджетное финансирование · ${years[0]}–${budgetUntil}`, 'font-size="10.5" font-weight="600" class="pish-t-green"'));
  }
  if (years.includes(annexUntil)) {
    const ax = X(annexUntil + 1);
    out.push(`<line x1="${ax}" x2="${ax}" y1="${top - 26}" y2="${bottom + 18}" class="pish-gate-line"/>`, tx(ax - 6, top - 31, en ? `Annex 10 horizon · ${annexUntil}` : `Горизонт приложения 10 · ${annexUntil}`, 'font-size="10.5" font-weight="600" text-anchor="end" class="pish-t-coral"'));
  }
  years.forEach(year => out.push(tx(X(year) + yearW / 2, top - 8, String(year), 'font-size="11.5" font-weight="600" text-anchor="middle"'), `<line x1="${X(year)}" x2="${X(year)}" y1="${top}" y2="${bottom}" class="pish-grid"/>`));
  lanes.forEach((lane, i) => {
    const y = top + i * laneH;
    out.push(`<line x1="16" x2="${x1}" y1="${y}" y2="${y}" class="pish-grid"/>`, multiline(16, y + 24, lane.label, charsFor(labelW - 8, 13), 15, `font-size="13" font-weight="700" class="pish-t-${lane.tone === 'science' ? 'green' : lane.tone === 'money' ? 'coral' : lane.tone === 'product' ? 'blue' : 'muted'}"`));
    if (lane.sub) out.push(multiline(16, y + 24 + lines(lane.label, charsFor(labelW - 8, 13)).length * 15, lane.sub, charsFor(labelW - 8, 10), 12, 'font-size="10" class="pish-muted"'));
    for (const b of lane.bars ?? []) {
      const bx = X(b.from) + 3, bw = X(b.to + 1) - X(b.from) - 6; const l = lines(b.label, charsFor(bw - 14, 11));
      out.push(`<g><title>${esc(`${lane.label} · ${span(b)}: ${b.label}`)}</title><rect x="${bx}" y="${y + 7}" width="${bw}" height="${laneH - 14}" rx="5" class="pish-lane-${lane.tone}"/>${l.slice(0, 3).map((t, k) => tx(bx + 8, y + 7 + (laneH - 14) / 2 + 4 + (k - (Math.min(3, l.length) - 1) / 2) * 13, t, 'font-size="11"')).join('')}</g>`);
    }
  });
  out.push(`<line x1="16" x2="${x1}" y1="${bottom}" y2="${bottom}" class="pish-grid"/>`);
  out.push(tx(16, bottom + 30, en ? 'Gates' : 'Ворота приёмки', 'font-size="13" font-weight="700" class="pish-t-coral"'));
  let maxLines = 1;
  gates.forEach(g => {
    const gx = X(g.year) + yearW / 2; const l = lines(g.label, charsFor(yearW - 8, 10.5)); maxLines = Math.max(maxLines, l.length);
    out.push(`<g><title>${esc(`${g.year}: ${g.label}`)}</title><line x1="${gx}" x2="${gx}" y1="${bottom}" y2="${bottom + 16}" class="pish-gate-line"/>${shape({ gate: true }, gx, bottom + 24)}${l.map((t, k) => tx(gx, bottom + 48 + k * 13, t, 'font-size="10.5" text-anchor="middle"')).join('')}</g>`);
  });
  const h = bottom + 58 + maxLines * 13 + 30;
  out.push(multiline(16, h - 14, spec.note ?? '', charsFor(w - 32, 10.5), 13, 'font-size="10.5" class="pish-muted"'));
  return open('pish-roadmap-chart', w, h, label, label, desc, standalone) + out.join('') + '</svg>';
}
