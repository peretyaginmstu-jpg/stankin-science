// Блок «Насколько прочна научная опора» для ставки ПИШ: выводы, интервальный график и таблица.
// Все числа — из model.betEvidence (src/lib/bet-evidence.mjs); тексты собираются из них при сборке.

import { esc, figure, legend, table, cell, text, tip } from './kit.mjs';
import { evidence } from '../charts/charts.mjs';
import { BET_CORE, BET_GAPS } from '../lib/bet-evidence.mjs';

const L = (ctx, ru, en) => (ctx.lang === 'en' ? en : ru);
const d2 = (ctx, v) => (v == null || !Number.isFinite(v) ? '—' : ctx.dec(v, 2));
const p0 = (ctx, v) => (v == null || !Number.isFinite(v) ? '—' : ctx.pct(v, 0));
const ciText = (ctx, ci) => (ci?.status === 'ok' ? `${d2(ctx, ci.lower)} … ${d2(ctx, ci.upper)}` : L(ctx, 'мало работ', 'too few works'));

export function betEvidenceSpec(ctx) {
  const ev = ctx.model.betEvidence;
  const groupOf = { core: L(ctx, 'Ядро ставки', 'Core of the bet'), gap: L(ctx, 'Закрывают партнёры', 'Partners close the gap'), context: L(ctx, 'Для сравнения', 'For comparison') };
  const row = (r, extra = {}) => ({
    id: r.id ?? extra.id,
    group: extra.group ?? r.role,
    label: extra.label ?? ctx.compShort(r.id),
    sub: L(ctx, `n = ${ctx.int(r.n)} · ведёт СТАНКИН ${p0(ctx, r.led.share)}`, `n = ${ctx.int(r.n)} · STANKIN-led ${p0(ctx, r.led.share)}`),
    strong: !!extra.strong,
    mean: r.fwci,
    lo: r.ci95?.status === 'ok' ? r.ci95.lower : null,
    hi: r.ci95?.status === 'ok' ? r.ci95.upper : null,
    median: r.fwciMedian,
    led: r.led.n ? r.led.fwci : null,
    href: r.id ? ctx.page(`competencies/${r.id}/`) : undefined,
    tip: tip(extra.label ?? ctx.compShort(r.id), [
      [d2(ctx, r.fwci), L(ctx, 'средний FWCI', 'mean FWCI')],
      [ciText(ctx, r.ci95), L(ctx, '95% интервал', '95% interval')],
      [d2(ctx, r.fwciMedian), L(ctx, 'медиана', 'median')],
      [d2(ctx, r.led.fwci), L(ctx, `ведёт СТАНКИН (${r.led.n})`, `STANKIN-led (${r.led.n})`)],
      [d2(ctx, r.partnerLed.fwci), L(ctx, `ведёт партнёр (${r.partnerLed.n})`, `partner-led (${r.partnerLed.n})`)],
    ]),
  });
  const rows = [
    row(ev.bundles.core, { id: 'bundle-core', group: 'core', label: L(ctx, 'Ядро вместе', 'Core combined'), strong: true }),
    ...ev.rows.filter((r) => r.role === 'core').map((r) => row(r)),
    row(ev.bundles.gaps, { id: 'bundle-gaps', group: 'gap', label: L(ctx, 'Разрывы вместе', 'Gaps combined'), strong: true }),
    ...ev.rows.filter((r) => r.role === 'gap').map((r) => row(r)),
    ...ev.rows.filter((r) => r.role === 'context').map((r) => row(r)),
  ];
  return {
    lang: ctx.lang,
    label: L(ctx, 'Средний FWCI работ 2021–2025 с 95% интервалом, медиана и FWCI работ, где СТАНКИН ведущий', 'Mean FWCI of 2021–2025 works with a 95% interval, the median and the FWCI of STANKIN-led works'),
    ref: 1,
    cap: 3,
    axis: L(ctx, 'FWCI, мир = 1', 'FWCI, world = 1'),
    groups: groupOf,
    rows,
  };
}

function findings(ctx) {
  const ev = ctx.model.betEvidence;
  const core = ev.bundles.core;
  const gaps = ev.bundles.gaps;
  const byId = Object.fromEntries(ev.rows.map((r) => [r.id, r]));
  const out = [];
  // 1. Устойчивость среднего ядра
  if (core.ci95?.status === 'ok') {
    const robust = core.ci95.lower >= 1;
    out.push({
      tone: robust ? 'ok' : 'warn',
      title: robust ? L(ctx, 'Ядро выше мирового уровня с запасом', 'The core is above world level with a margin') : L(ctx, 'Ядро выше мира в среднем, но без запаса', 'The core is above world level on average, without a margin'),
      text: L(ctx,
        `Резание и метрология вместе: ${ctx.int(core.n)} работ 2021–2025, средний FWCI ${d2(ctx, core.fwci)}, 95% интервал ${ciText(ctx, core.ci95)}, медиана ${d2(ctx, core.fwciMedian)}. ${robust ? 'Нижняя граница интервала выше 1.' : 'Нижняя граница интервала ниже 1: превосходство над мировым уровнем не доказано, его создают несколько сильно цитируемых работ.'}`,
        `Machining and metrology together: ${ctx.int(core.n)} works from 2021–2025, mean FWCI ${d2(ctx, core.fwci)}, 95% interval ${ciText(ctx, core.ci95)}, median ${d2(ctx, core.fwciMedian)}. ${robust ? 'The lower bound is above 1.' : 'The lower bound is below 1: superiority over the world level is not established; a few highly cited works create it.'}`),
    });
  }
  // 2. Кто даёт цитирование: своё лидерство или партнёры
  const lines = BET_CORE.map((id) => byId[id]).filter(Boolean).map((r) => L(ctx,
    `${ctx.compShort(r.id)}: где ведёт СТАНКИН (${ctx.int(r.led.n)}) — ${d2(ctx, r.led.fwci)}, где ведёт партнёр (${ctx.int(r.partnerLed.n)}) — ${d2(ctx, r.partnerLed.fwci)}`,
    `${ctx.compShort(r.id)}: STANKIN-led (${ctx.int(r.led.n)}) ${d2(ctx, r.led.fwci)}, partner-led (${ctx.int(r.partnerLed.n)}) ${d2(ctx, r.partnerLed.fwci)}`));
  const dependent = BET_CORE.map((id) => byId[id]).filter((r) => r && r.led.fwci != null && r.led.fwci < 1 && r.partnerLed.fwci != null && r.partnerLed.fwci > 1);
  out.push({
    tone: dependent.length ? 'warn' : 'ok',
    title: L(ctx, 'Чьи работы дают цитирование', 'Whose works drive citations'),
    text: `${lines.join('. ')}. ${dependent.length ? L(ctx, `В направлении «${dependent.map((r) => ctx.compShort(r.id)).join('», «')}» средний FWCI выше 1 благодаря работам, где ведёт партнёр: собственная опора слабее, чем показывает среднее.`, `In ${dependent.map((r) => ctx.compShort(r.id)).join(', ')}, the mean is above 1 because of partner-led works: the university’s own base is weaker than the mean suggests.`) : L(ctx, 'Собственные работы держат уровень сами.', 'The university-led works hold the level on their own.')}`,
  });
  // 3. Разрывы
  const gapLine = BET_GAPS.map((id) => byId[id]).filter(Boolean).map((r) => `${ctx.compShort(r.id)} — ${ctx.int(r.n)}`).join(', ');
  out.push({
    tone: 'warn',
    title: L(ctx, 'Разрывы — это мало работ, а не только низкое цитирование', 'The gaps are few works, not just low citations'),
    text: L(ctx,
      `Работ 2021–2025: ${gapLine}. Средний FWCI вместе ${d2(ctx, gaps.fwci)}, доклады конференций — ${p0(ctx, gaps.conference)}, работ с компаниями — ${ctx.int(gaps.company)}. Поэтому партнёр по управлению и диагностике — условие продукта, а не дополнение.`,
      `Works from 2021–2025: ${gapLine}. Combined mean FWCI ${d2(ctx, gaps.fwci)}, conference papers ${p0(ctx, gaps.conference)}, works with companies ${ctx.int(gaps.company)}. A control and diagnostics partner is therefore a product condition, not an add-on.`),
  });
  // 4. Линза по названиям
  const lens = ev.lens;
  out.push({
    tone: 'info',
    title: L(ctx, 'Связка уже есть, но классификация её прячет', 'The link already exists, but the classification hides it'),
    text: L(ctx,
      `${ctx.int(lens.n)} работ 2021–2025 соединяют в названии резание с измерением, диагностикой, управлением или ИИ — это и есть задел контура. ${ctx.int(lens.inCatchAll)} из них OpenAlex отнёс к общему кластеру «Инженерные технологии и методы», и в группах компетенций их не видно. Медиана FWCI ${d2(ctx, lens.fwciMedian)}, СТАНКИН ведёт ${p0(ctx, lens.led.share)}.`,
      `${ctx.int(lens.n)} works from 2021–2025 combine machining with measurement, monitoring, control or AI in the title: this is the groundwork for the loop. OpenAlex filed ${ctx.int(lens.inCatchAll)} of them under the catch-all cluster “Engineering Technology and Methodologies”, so they are invisible in competency groups. Median FWCI ${d2(ctx, lens.fwciMedian)}; STANKIN leads ${p0(ctx, lens.led.share)}.`),
  });
  // 5. Промышленность
  const ind = ev.industry;
  out.push({
    tone: 'warn',
    title: L(ctx, 'Компаний среди соавторов почти нет', 'Companies are almost absent among co-authors'),
    text: L(ctx,
      `С 2016 по 2025 год — ${ctx.int(ind.works)} работ с соавторами из компаний, из них ${ctx.int(ind.worksP2)} в 2021–2025. В ядре ставки за пять лет — ${ctx.int(ind.coreP2)}, с российскими компаниями — ${ctx.int(ind.coreRuP2)}. Опыт работы с заказчиком придётся доказывать договорами и актами; первые совместные статьи и патенты с ним — измеримая цель 2027–2028 годов.`,
      `From 2016 to 2025, ${ctx.int(ind.works)} works had company co-authors, ${ctx.int(ind.worksP2)} of them in 2021–2025. In the core of the bet: ${ctx.int(ind.coreP2)} over five years, ${ctx.int(ind.coreRuP2)} with Russian companies. Customer experience must be shown through contracts and acceptance records; first joint papers and patents with the customer are a measurable 2027–2028 goal.`),
  });
  // 6. Международное соавторство
  const intl = ev.international;
  if (intl?.intl?.n && intl?.domestic?.n) out.push({
    tone: 'info',
    title: L(ctx, 'Зарубежные соавторы поднимают цитирование', 'Foreign co-authors raise citations'),
    text: L(ctx,
      `Все работы 2021–2025: с зарубежными соавторами (${ctx.int(intl.intl.n)}) средний FWCI ${d2(ctx, intl.intl.fwci)}, медиана ${d2(ctx, intl.intl.fwciMedian)}; без них (${ctx.int(intl.domestic.n)}) — ${d2(ctx, intl.domestic.fwci)} и ${d2(ctx, intl.domestic.fwciMedian)}. Это связь, а не причина, но для новой школы она подсказывает: публиковать результаты контура вместе с сильными внешними группами.`,
      `All 2021–2025 works: with foreign co-authors (${ctx.int(intl.intl.n)}) mean FWCI ${d2(ctx, intl.intl.fwci)}, median ${d2(ctx, intl.intl.fwciMedian)}; without them (${ctx.int(intl.domestic.n)}) ${d2(ctx, intl.domestic.fwci)} and ${d2(ctx, intl.domestic.fwciMedian)}. This is an association, not a cause, but it suggests publishing loop results together with strong external groups.`),
  });
  return out;
}

function evidenceTable(ctx) {
  const ev = ctx.model.betEvidence;
  const rows = [
    { ...ev.bundles.core, id: null, label: L(ctx, 'Ядро вместе', 'Core combined') },
    ...ev.rows.filter((r) => r.role === 'core'),
    { ...ev.bundles.gaps, id: null, label: L(ctx, 'Разрывы вместе', 'Gaps combined') },
    ...ev.rows.filter((r) => r.role !== 'core'),
  ];
  return table([
    { key: 'name', label: L(ctx, 'Группа', 'Group') },
    { key: 'n', label: L(ctx, 'Работ', 'Works'), num: true },
    { key: 'fwci', label: L(ctx, 'FWCI среднее', 'Mean FWCI'), num: true },
    { key: 'ci', label: L(ctx, '95% интервал', '95% interval'), num: true },
    { key: 'median', label: L(ctx, 'Медиана', 'Median'), num: true },
    { key: 'wo', label: L(ctx, 'Без лучшей работы', 'Without top work'), num: true },
    { key: 'top3', label: L(ctx, 'Вклад трёх лучших', 'Top-3 share'), num: true },
    { key: 'top10', label: L(ctx, 'Топ-10 %', 'Top 10%'), num: true },
    { key: 'led', label: L(ctx, 'Ведёт СТАНКИН: доля · FWCI', 'STANKIN-led: share · FWCI'), num: true },
    { key: 'partner', label: L(ctx, 'Ведёт партнёр: FWCI', 'Partner-led: FWCI'), num: true },
    { key: 'authors', label: L(ctx, 'Первых авторов · у самого частого', 'First authors · top one'), num: true },
    { key: 'company', label: L(ctx, 'С компаниями', 'With companies'), num: true },
    { key: 'uncited', label: L(ctx, 'Без цитирований', 'Uncited'), num: true },
  ], rows.map((r) => ({
    cls: r.id ? '' : 'pish-evidence-total',
    cells: {
      name: cell(r.id ? `<a href="${esc(ctx.page(`competencies/${r.id}/`))}">${esc(ctx.compShort(r.id))}</a>` : `<strong>${esc(r.label)}</strong>`, r.id ? ctx.compShort(r.id) : r.label),
      n: cell(ctx.int(r.n), r.n),
      fwci: cell(d2(ctx, r.fwci), r.fwci),
      ci: text(ciText(ctx, r.ci95)),
      median: cell(d2(ctx, r.fwciMedian), r.fwciMedian),
      wo: cell(d2(ctx, r.fwciWithoutTop), r.fwciWithoutTop),
      top3: cell(p0(ctx, r.top3Share), r.top3Share),
      top10: cell(`${p0(ctx, r.top10)} (${ctx.int(r.top10N)})`, r.top10),
      led: cell(`${p0(ctx, r.led.share)} · ${d2(ctx, r.led.fwci)}`, r.led.fwci),
      partner: cell(d2(ctx, r.partnerLed.fwci), r.partnerLed.fwci),
      authors: cell(`${ctx.int(r.firstAuthors.distinct)} · ${p0(ctx, r.firstAuthors.topShare)}`, r.firstAuthors.distinct),
      company: cell(ctx.int(r.company), r.company),
      uncited: cell(p0(ctx, r.uncited), r.uncited),
    },
  })), { cls: 'pish-evidence-table' });
}

export function betEvidenceBlock(ctx) {
  const ev = ctx.model.betEvidence;
  if (!ev?.rows?.length) return '';
  const spec = betEvidenceSpec(ctx);
  const keys = legend([
    { kind: 'mean', tone: '', label: L(ctx, 'среднее', 'mean') },
    { kind: 'ci', tone: '', label: L(ctx, '95% интервал среднего', '95% interval of the mean') },
    { kind: 'median', tone: '', label: L(ctx, 'медиана', 'median') },
    { kind: 'led', tone: '', label: L(ctx, 'среднее работ, где СТАНКИН ведущий', 'mean of STANKIN-led works') },
  ]);
  const chart = figure(ctx, {
    id: 'pish-evidence-chart', type: 'evidence', spec, svg: evidence(spec, 1160), wide: true, legend: keys,
    title: L(ctx, 'FWCI работ 2021–2025: среднее, разброс и собственное лидерство', 'FWCI of 2021–2025 works: mean, spread and own leadership'),
    table: evidenceTable(ctx),
  });
  const cards = findings(ctx).map((f) => `<article class="pish-evidence-card pish-evidence-${esc(f.tone)}"><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></article>`).join('');
  return `<h3 class="pish-subhead" id="pish-evidence-strength">${esc(L(ctx, 'Насколько прочна научная опора', 'How solid the research base is'))}</h3>
<p class="pish-bet-lead">${esc(L(ctx, 'Средний FWCI легко сдвигают несколько сильно цитируемых работ. Здесь те же группы проверены с трёх сторон: разброс (интервал и медиана), чьи это работы (ведёт СТАНКИН или партнёр) и есть ли в них промышленность.', 'A few highly cited works easily move a mean FWCI. Here the same groups are checked three ways: spread (interval and median), whose works they are (STANKIN-led or partner-led) and whether industry is involved.'))}</p>
<div class="pish-evidence-grid">${cards}</div>
${chart}
<p class="pish-caption">${esc(L(ctx, 'Работы 2021–2025 по основной теме OpenAlex. Интервал — bootstrap-оценка разброса среднего при независимых работах, а не доказательство качества. «Ведёт СТАНКИН» — автор университета первый или корреспондирующий. Первые авторы считаются по написанию имени: в снимке нет идентификаторов авторов. Линза по названиям — поиск ключевых слов, её состав нужно проверить вручную.', 'Works from 2021–2025 by OpenAlex primary topic. The interval is a bootstrap estimate of the spread of the mean under independent works, not proof of quality. “STANKIN-led” means a university author is first or corresponding. First authors are counted by name spelling: the snapshot has no author identifiers. The title lens is a keyword search and its contents need manual review.'))} <a href="${esc(ctx.asset('data/bet-evidence.json'))}" download>${esc(L(ctx, 'Расчёт · JSON', 'Calculation · JSON'))}</a></p>`;
}
