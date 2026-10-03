// Блок «Как читать эту страницу»: общие оговорки страницы один раз и сокращения.
// data — { title, lead, points: [{ id, title, text }] } с полями { ru, en }; glossary — [[термин, пояснение]].
import { esc } from './kit.mjs';

const phrase = (ctx, v) => (typeof v === 'string' ? v : v?.[ctx.lang] ?? v?.ru ?? '');

export function readingBlock(ctx, data, { id, glossary = [], glossaryTitle = '' } = {}) {
  const points = data.points.map((p, i) => `<li id="${esc(id)}-${esc(p.id)}"><span class="reading-index">${String(i + 1).padStart(2, '0')}</span><div><strong>${esc(phrase(ctx, p.title))}</strong><p>${esc(phrase(ctx, p.text))}</p></div></li>`).join('');
  const terms = glossary.length
    ? `<details class="reading-glossary"><summary>${esc(glossaryTitle)}</summary><dl>${glossary.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></details>`
    : '';
  return `<aside class="reading-block wrap" id="${esc(id)}" aria-labelledby="${esc(id)}-title"><div class="reading-head"><h2 id="${esc(id)}-title">${esc(phrase(ctx, data.title))}</h2><p>${esc(phrase(ctx, data.lead))}</p></div><ol class="reading-points">${points}</ol>${terms}</aside>`;
}
