import { esc, figure, table, cell, text } from './kit.mjs';
import { pishBetMap, pishFundingChart, pishSubmissionPath, pishRoadmapChart } from '../charts/pish-bet.mjs';
import { PISH_SOURCES, PISH_MINIMUMS, PISH_REQUIREMENTS } from '../../content/pish.mjs';
import { PISH_BET, PISH_BET_REASONS, PISH_BET_CRITERIA, PISH_BET_OPTIONS, PISH_BET_BOUNDARY, PISH_BET_WORKPACKAGES, PISH_BET_PARTNERS, PISH_BET_TIMELINE, PISH_BET_RISKS, PISH_BET_FUNDING_CONTEXT } from '../../content/pish-bet.mjs';

const L = (ctx, ru, en) => ctx.lang === 'en' ? en : ru;
const phrase = (ctx, v) => typeof v === 'string' ? v : v?.[ctx.lang] ?? v?.ru ?? '';
const row = (ctx, id) => ctx.model.pish?.rows?.find(r => r.id === id);
const recent = (ctx, id) => row(ctx, id)?.cohorts?.p2 ?? null;
const fwci = (ctx, id) => { const c = recent(ctx, id); return c?.fwci == null ? '—' : ctx.dec(c.fwci, 2); };
const sourceRefs = (ctx, ids) => (ids ?? []).length ? `<span class="pish-source-links">${esc(L(ctx, 'Источники: ', 'Sources: '))}${ids.map(id => { const i = PISH_SOURCES.findIndex(s => s.id === id); const s = PISH_SOURCES[i]; return s ? `<a href="#pish-source-${esc(id)}" title="${esc(phrase(ctx, s.title))}" aria-label="${esc(phrase(ctx, s.title))}">${String(i + 1).padStart(2, '0')}</a>` : ''; }).join(' · ')}</span>` : '';
const minimum = (id, year) => PISH_MINIMUMS.find(r => r.id === id)?.values?.[year] ?? null;

// Live recent-cohort evidence for a competency: name, FWCI 2021–2025 and n.
export function evidenceChip(ctx, id) {
  const c = recent(ctx, id);
  return { label: `${ctx.compShort(id)} · FWCI ${fwci(ctx, id)} · n=${c?.n == null ? '—' : ctx.int(c.n)}`, title: L(ctx, `${ctx.compShort(id)}: средний FWCI работ 2021–2025 годов ${fwci(ctx, id)}, работ ${c?.n ?? '—'}`, `${ctx.compShort(id)}: mean FWCI of 2021–2025 works ${fwci(ctx, id)}, works ${c?.n ?? '—'}`) };
}

export function pishBetMapSpec(ctx) {
  return {
    lang: ctx.lang,
    existing: {
      title: L(ctx, 'ДЕЙСТВУЮЩАЯ ПИШ «ТБМ»', 'EXISTING SCHOOL'),
      sub: L(ctx, 'Железо. Не повторяем', 'Hardware. We do not repeat it'),
      items: [
        { label: L(ctx, 'Режущий инструмент', 'Cutting tools'), sub: L(ctx, 'Сборные фрезы, пластины, покрытия', 'Indexable cutters, inserts, coatings') },
        { label: L(ctx, 'Узлы станков', 'Machine components'), sub: L(ctx, 'Конструкция и испытания узла', 'Component design and tests') },
        { label: L(ctx, 'Инжиниринг производств', 'Factory engineering'), sub: L(ctx, 'Проекты инструментального предприятия', 'Tool-plant designs') },
      ],
    },
    product: {
      title: L(ctx, 'НОВАЯ ПИШ · ПРОДУКТ', 'NEW SCHOOL · PRODUCT'),
      sub: L(ctx, 'Интеллект обработки: другой объект и другое решение (п. 3.4)', 'Machining intelligence: a different object and solution (§3.4)'),
      name: phrase(ctx, PISH_BET.product),
      parts: PISH_BET.productParts.map(p => phrase(ctx, p)),
      steps: [
        { label: L(ctx, 'Измерить', 'Measure'), sub: L(ctx, 'датчики, метрология на станке', 'sensors, on-machine metrology') },
        { label: L(ctx, 'Предсказать', 'Predict'), sub: L(ctx, 'физика + ИИ, интервал ошибки', 'physics + AI, error interval') },
        { label: L(ctx, 'Скорректировать', 'Correct'), sub: L(ctx, 'ЧПУ, только разрешённые пределы', 'CNC, permitted limits only') },
        { label: L(ctx, 'Подтвердить', 'Confirm'), sub: L(ctx, 'независимая приёмка детали', 'independent part acceptance') },
      ],
      loop: L(ctx, 'Результат измерения меняет следующий режим', 'The measured result changes the next setting'),
      baseTitle: L(ctx, 'ОПОРА СТАНКИН · FWCI 2021–2025', 'STANKIN BASE · FWCI 2021–2025'),
      gapTitle: L(ctx, 'УСИЛИВАЮТ СОИСПОЛНИТЕЛИ', 'CO-EXECUTORS STRENGTHEN'),
    },
    customer: {
      title: L(ctx, 'КВАЛИФИЦИРОВАННЫЙ ЗАКАЗЧИК', 'QUALIFIED CUSTOMER'),
      sub: L(ctx, 'Выпуск, внедрение и продажа', 'Production, deployment and sales'),
      items: [
        { label: L(ctx, 'Станкостроитель', 'Machine builder'), sub: L(ctx, 'Станок с модулем в каталоге', 'Machines sold with the module') },
        { label: L(ctx, 'Завод-потребитель', 'User plant'), sub: L(ctx, 'Серия деталей и приёмка', 'A parts series and acceptance') },
        { label: L(ctx, 'Модернизация парка', 'Fleet retrofit'), sub: L(ctx, 'Модуль для работающих станков', 'A module for installed machines') },
      ],
    },
    base: ['machining', 'metrology-quality'].map(id => evidenceChip(ctx, id)),
    gaps: ['machine-tools-control', 'condition-monitoring', 'ai-data'].map(id => evidenceChip(ctx, id)),
    flows: {
      reuse: L(ctx, 'Инструмент и данные износа — объект испытаний', 'Tools and wear data become test objects'),
      product: L(ctx, 'Продукт, лицензия, обученные инженеры', 'Product, licence, trained engineers'),
      money: L(ctx, '≥50% средств, заказы НИОКР, приёмка', '≥50% funding, R&D orders, acceptance'),
    },
    note: L(ctx, 'Авторское предложение. Заказчик и соисполнители не выбраны; роли и числа FWCI — из текущего снимка OpenAlex, они не доказывают готовность продукта.', 'Authorial proposal. The customer and co-executors are not yet chosen; roles are proposed and FWCI values come from the current OpenAlex snapshot, not product readiness.'),
  };
}

export function pishFundingSpec(ctx) {
  const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
  return {
    lang: ctx.lang, years, budgetUntil: 2029,
    cumulative: years.map(y => minimum('business-rnd', y)),
    context: { value: PISH_BET_FUNDING_CONTEXT.value, label: phrase(ctx, PISH_BET_FUNDING_CONTEXT.label), short: L(ctx, 'все поступления вуза, 2025', 'all university receipts, 2025') },
    note: L(ctx, 'Σ — минимум нарастающим итогом из приложения 10; столбец — его прирост за год. Пунктир — другой контур, только для масштаба.', 'Σ is the cumulative Annex 10 minimum; each bar is its increase in that year. The dashed line is a different perimeter, shown for scale only.'),
  };
}

export function pishPathSpec(ctx) {
  const window = PISH_REQUIREMENTS.find(r => r.id === 'submission-window') ? { from: '2026-10-05', to: '2026-12-01' } : {};
  return { lang: ctx.lang, window, items: PISH_BET_TIMELINE.map(i => ({ date: i.date, official: i.official, gate: i.gate, label: phrase(ctx, i.label) })) };
}

export function pishRoadmapSpec(ctx) {
  const rnd31 = minimum('business-rnd', 2031), rnd34 = minimum('business-rnd', 2034), jobs31 = minimum('graduates-employed', 2031), jobs34 = minimum('graduates-employed', 2034);
  const n = v => v == null ? '—' : ctx.int(v);
  return {
    lang: ctx.lang, years: [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036], budgetUntil: 2029, annexUntil: 2034,
    lanes: [
      { id: 'product', tone: 'product', label: L(ctx, 'Продукт', 'Product'), sub: L(ctx, 'от требований до тиража', 'from requirements to roll-out'), bars: [
        { from: 2027, to: 2027, label: L(ctx, 'Требования, базовая серия', 'Requirements, baseline batch') },
        { from: 2028, to: 2028, label: L(ctx, 'Стенд: модель и пределы', 'Bench: model and limits') },
        { from: 2029, to: 2029, label: L(ctx, 'Перенос на 2-й станок', 'Transfer to a 2nd machine') },
        { from: 2030, to: 2031, label: L(ctx, 'Пилот у заказчика, приёмка серии', 'Customer pilot, batch acceptance') },
        { from: 2032, to: 2034, label: L(ctx, 'Тиражирование модуля и сервис', 'Module roll-out and service') },
        { from: 2035, to: 2036, label: L(ctx, 'Автономная ячейка', 'Autonomous cell') },
      ] },
      { id: 'science', tone: 'science', label: L(ctx, 'Наука', 'Research'), sub: L(ctx, 'вопрос и публикации', 'question and papers'), bars: [
        { from: 2027, to: 2028, label: L(ctx, 'Гибридная модель и интервалы прогноза', 'Hybrid model and prediction intervals') },
        { from: 2029, to: 2031, label: L(ctx, 'Перенос между станками без обучения с нуля', 'Transfer between machines without retraining') },
        { from: 2032, to: 2036, label: L(ctx, 'Автономное планирование и восстановление после сбоев', 'Autonomous planning and fault recovery') },
      ] },
      { id: 'people', tone: 'people', label: L(ctx, 'Кадры', 'People'), sub: L(ctx, 'магистратура и ДПО', 'master’s and CPD'), bars: [
        { from: 2027, to: 2029, label: L(ctx, 'Магистратура и ДПО по продукту', 'Master’s and CPD on the product') },
        { from: 2030, to: 2034, label: L(ctx, `Инженеры заказчика, сетевые программы · ${n(jobs34)} трудоустроенных к 2034`, `Customer engineers, network programmes · ${n(jobs34)} employed by 2034`) },
        { from: 2035, to: 2036, label: L(ctx, 'Кадры для автономных участков', 'Staff for autonomous sections') },
      ] },
      { id: 'money', tone: 'money', label: L(ctx, 'Деньги', 'Money'), sub: L(ctx, 'бюджет → внебюджет', 'budget → own revenue'), bars: [
        { from: 2027, to: 2029, label: L(ctx, 'Бюджет ПИШ + ≥50% от заказчика', 'School budget + ≥50% from the customer') },
        { from: 2030, to: 2034, label: L(ctx, 'Лицензии, сервис, заказы НИОКР', 'Licences, service, R&D orders') },
        { from: 2035, to: 2036, label: L(ctx, 'Доход от тиражирования', 'Roll-out revenue') },
      ] },
    ],
    gates: [
      { year: 2027, label: L(ctx, 'Утверждён протокол приёмки', 'Acceptance protocol agreed') },
      { year: 2028, label: L(ctx, 'Испытание на новых деталях', 'Test on a fresh batch') },
      { year: 2029, label: L(ctx, 'Результат повторён на 2-м станке', 'Result repeated on a 2nd machine') },
      { year: 2031, label: L(ctx, `Акт приёмки; НИОКР Σ ${n(rnd31)} млн ₽; ${n(jobs31)} трудоустроенных`, `Acceptance record; R&D Σ RUB ${n(rnd31)}m; ${n(jobs31)} employed`) },
      { year: 2034, label: L(ctx, `Тираж у заказчика; НИОКР Σ ${n(rnd34)} млн ₽`, `Customer roll-out; R&D Σ RUB ${n(rnd34)}m`) },
      { year: 2036, label: L(ctx, 'Ячейка на выбранных деталях', 'A cell on selected parts') },
    ],
    note: L(ctx, 'Суммы и численность — минимумы приложения 10 (нарастающим итогом); остальное — предлагаемые цели для обсуждения.', 'Sums and headcounts are Annex 10 cumulative minimums; everything else is a proposed target for discussion.'),
  };
}

const dot = (ctx, level) => {
  const label = ({ high: L(ctx, 'сильно', 'strong'), mid: L(ctx, 'средне', 'medium'), low: L(ctx, 'слабо', 'weak') })[level] ?? '—';
  return `<span class="pish-rate pish-rate-${esc(level)}" role="img" aria-label="${esc(label)}" title="${esc(label)}"></span>`;
};

function optionsMatrix(ctx) {
  const head = `<thead><tr><th scope="col">${esc(L(ctx, 'Вариант темы', 'Topic option'))}</th>${PISH_BET_CRITERIA.map(c => `<th scope="col">${esc(phrase(ctx, c.label))}</th>`).join('')}<th scope="col">${esc(L(ctx, 'Вывод', 'Verdict'))}</th></tr></thead>`;
  const body = PISH_BET_OPTIONS.map(o => `<tr${o.recommended ? ' class="pish-option-recommended"' : ''}><th scope="row"><strong>${esc(phrase(ctx, o.title))}</strong><small>${o.competencyIds.map(id => `${esc(ctx.compShort(id))}: FWCI ${esc(fwci(ctx, id))}`).join(' · ')}</small></th>${PISH_BET_CRITERIA.map(c => { const r = o.ratings[c.id]; return `<td>${dot(ctx, r?.level)}<span>${esc(phrase(ctx, r?.note))}</span></td>`; }).join('')}<td class="pish-option-verdict">${esc(phrase(ctx, o.verdict))}</td></tr>`).join('');
  return `<div class="table-wrap pish-options"><table class="data"><caption>${esc(L(ctx, 'Экспертная оценка для обсуждения, не баллы конкурса. FWCI — средний за 2021–2025 годы в текущем снимке.', 'Expert assessment for discussion, not competition scores. FWCI is the 2021–2025 mean in the current snapshot.'))}</caption>${head}<tbody>${body}</tbody></table></div><ul class="pish-rate-legend"><li>${dot(ctx, 'high')}${esc(L(ctx, 'сильная сторона', 'strength'))}</li><li>${dot(ctx, 'mid')}${esc(L(ctx, 'нужно подтвердить', 'needs confirmation'))}</li><li>${dot(ctx, 'low')}${esc(L(ctx, 'слабое место', 'weakness'))}</li></ul>`;
}

export function boundaryTable(ctx) {
  return table([
    { key: 'label', label: L(ctx, 'Что сравниваем', 'Dimension') },
    { key: 'existing', label: L(ctx, 'Действующая ПИШ «ТБМ»', 'Existing school') },
    { key: 'interface', label: L(ctx, 'Как связаны, не пересекаясь', 'How they connect without overlap') },
    { key: 'proposed', label: L(ctx, 'Новая ПИШ', 'New school') },
  ], PISH_BET_BOUNDARY.map(r => ({ cells: { label: text(phrase(ctx, r.label)), existing: text(phrase(ctx, r.existing)), interface: cell(`<span class="pish-boundary-link">${esc(phrase(ctx, r.interface))}</span>`, phrase(ctx, r.interface)), proposed: cell(`<strong>${esc(phrase(ctx, r.proposed))}</strong>`, phrase(ctx, r.proposed)) } })), { cls: 'pish-boundary-table' });
}

export function raciTable(ctx) {
  const mark = v => v === 'R' ? `<span class="pish-raci pish-raci-r" title="${esc(L(ctx, 'Отвечает', 'Responsible'))}">${esc(L(ctx, 'О', 'R'))}</span>` : v === 'C' ? `<span class="pish-raci pish-raci-c" title="${esc(L(ctx, 'Участвует', 'Contributes'))}">${esc(L(ctx, 'У', 'C'))}</span>` : '<span class="pish-raci-none" aria-hidden="true">·</span>';
  const head = `<thead><tr><th scope="col">${esc(L(ctx, 'Участник (≤5 организаций)', 'Participant (≤5 organisations)'))}</th>${PISH_BET_WORKPACKAGES.map(p => `<th scope="col">${esc(phrase(ctx, p.label))}</th>`).join('')}</tr></thead>`;
  const body = PISH_BET_PARTNERS.map(p => `<tr class="pish-raci-${esc(p.kind)}"><th scope="row"><strong>${esc(phrase(ctx, p.name))}</strong><small>${esc(phrase(ctx, p.role))}</small>${p.evidenceIds.length ? `<small class="pish-raci-evidence">${p.evidenceIds.map(id => esc(evidenceChip(ctx, id).label)).join('<br>')}</small>` : ''}<em>${esc(phrase(ctx, p.status))}</em></th>${PISH_BET_WORKPACKAGES.map(w => `<td>${mark(p.roles[w.id])}</td>`).join('')}</tr>`).join('');
  return `<div class="table-wrap pish-raci-wrap"><table class="data pish-raci-table"><caption>${esc(L(ctx, 'О — отвечает за результат пакета, У — участвует. У каждого пакета один ответственный.', 'R — responsible for the work package result, C — contributes. Each package has one responsible organisation.'))}</caption>${head}<tbody>${body}</tbody></table></div>`;
}

export function pishRoadmapFigure(ctx) {
  const spec = pishRoadmapSpec(ctx);
  const data = table([
    { key: 'lane', label: L(ctx, 'Направление', 'Workstream') },
    { key: 'years', label: L(ctx, 'Годы', 'Years') },
    { key: 'work', label: L(ctx, 'Работа', 'Work') },
  ], [...spec.lanes.flatMap(l => l.bars.map(b => ({ cells: { lane: text(l.label), years: text(`${b.from}${b.to !== b.from ? `–${b.to}` : ''}`), work: text(b.label) } }))), ...spec.gates.map(g => ({ cells: { lane: text(L(ctx, 'Ворота приёмки', 'Gate')), years: text(String(g.year)), work: text(g.label) } }))]);
  return figure(ctx, { id: 'pish-roadmap-chart', type: 'pish-roadmap', spec, svg: pishRoadmapChart(spec, 1160), table: data, wide: true });
}

export function betSection(ctx) {
  const mapSpec = pishBetMapSpec(ctx), fundSpec = pishFundingSpec(ctx), pathSpec = pishPathSpec(ctx);
  const reasons = `<ol class="pish-bet-reasons">${PISH_BET_REASONS.map((r, i) => `<li><span class="pish-bet-index">${String(i + 1).padStart(2, '0')}</span><h3>${esc(phrase(ctx, r.title))}</h3><p>${esc(phrase(ctx, r.text))}</p>${r.competencyIds.length ? `<ul class="pish-chips">${r.competencyIds.map(id => { const c = recent(ctx, id); return `<li><a href="${esc(ctx.page(`competencies/${id}/`))}">${esc(ctx.compShort(id))}</a><b>FWCI ${esc(fwci(ctx, id))}</b><b>n=${esc(c?.n == null ? '—' : ctx.int(c.n))}</b></li>`; }).join('')}</ul>` : ''}${sourceRefs(ctx, r.sourceIds)}</li>`).join('')}</ol>`;
  const map = figure(ctx, { id: 'pish-bet-map', type: 'pish-bet-map', spec: mapSpec, svg: pishBetMap(mapSpec, 1160), wide: true, after: `<p class="pish-caption"><a href="${esc(ctx.asset(`data/pish-bet-${ctx.lang}.svg`))}" download>${esc(L(ctx, 'Скачать схему ставки · SVG', 'Download the bet diagram · SVG'))}</a></p>` });
  const fundTable = table([{ key: 'year', label: L(ctx, 'Год', 'Year') }, { key: 'sum', label: L(ctx, 'Минимум нарастающим итогом, млн ₽', 'Cumulative minimum, RUB m'), num: true }, { key: 'inc', label: L(ctx, 'Прирост за год, млн ₽', 'Increase in the year, RUB m'), num: true }], fundSpec.years.map((y, i) => { const v = fundSpec.cumulative[i], p = i ? fundSpec.cumulative[i - 1] : 0; return { cells: { year: text(String(y)), sum: cell(v == null ? '—' : esc(ctx.dec(v, 1)), v), inc: cell(v == null || p == null ? '—' : esc(ctx.dec(v - p, 1)), v == null || p == null ? null : v - p) } }; }));
  const fund = figure(ctx, { id: 'pish-funding-chart', type: 'pish-funding', spec: fundSpec, svg: pishFundingChart(fundSpec, 1160), table: fundTable, wide: true });
  const path = figure(ctx, { id: 'pish-submission-path', type: 'pish-path', spec: pathSpec, svg: pishSubmissionPath(pathSpec, 1160), wide: true });
  const risks = table([{ key: 'risk', label: L(ctx, 'Риск', 'Risk') }, { key: 'signal', label: L(ctx, 'Ранний сигнал', 'Early signal') }, { key: 'response', label: L(ctx, 'Что делаем', 'Response') }], PISH_BET_RISKS.map(r => ({ cells: { risk: text(phrase(ctx, r.risk)), signal: text(phrase(ctx, r.signal)), response: text(phrase(ctx, r.response)) } })), { cls: 'pish-risk-table' });
  const rnd31 = minimum('business-rnd', 2031), rnd34 = minimum('business-rnd', 2034);
  const body = `<div class="pish-bet-hero"><div><p class="eyebrow">${esc(L(ctx, 'Рекомендуемая ставка', 'Recommended bet'))}</p><h3>${esc(phrase(ctx, PISH_BET.title))}</h3><p>${esc(phrase(ctx, PISH_BET.thesis))}</p></div><dl><div><dt>${esc(L(ctx, 'Продукт', 'Product'))}</dt><dd>${esc(phrase(ctx, PISH_BET.product))}</dd></div><div><dt>${esc(L(ctx, 'Научный вопрос', 'Research question'))}</dt><dd>${esc(phrase(ctx, PISH_BET.scienceQuestion))}</dd></div></dl></div>
${map}
<h3 class="pish-subhead">${esc(L(ctx, 'Почему именно эта ставка', 'Why this bet'))}</h3>${reasons}
<h3 class="pish-subhead">${esc(L(ctx, 'Сравнение с другими вариантами', 'Comparison with other options'))}</h3>${optionsMatrix(ctx)}
<h3 class="pish-subhead">${esc(L(ctx, 'Главный фильтр — деньги заказчика', 'The main filter is customer money'))}</h3><p class="pish-bet-lead">${esc(L(ctx, `Приложение 10 требует привлечь на НИОКР в интересах бизнеса не меньше ${rnd31 == null ? '—' : ctx.int(rnd31)} млн ₽ к 2031 году и ${rnd34 == null ? '—' : ctx.int(rnd34)} млн ₽ к 2034 году нарастающим итогом. В 2030–2033 годах это 260–300 млн ₽ в год — около половины всех нынешних поступлений университета от НИОКР, услуг и работ. Поэтому сначала выбираем заказчика, у которого есть такой бюджет и острая задача, а уже под него уточняем продукт.`, `Annex 10 requires at least RUB ${rnd31 == null ? '—' : ctx.int(rnd31)} million of business-oriented R&D by 2031 and RUB ${rnd34 == null ? '—' : ctx.int(rnd34)} million by 2034, cumulatively. In 2030–2033 that is RUB 260–300 million a year — about half of all current university receipts from R&D, services and other work. So choose the customer with such a budget and an urgent task first, then refine the product for it.`))}</p>${fund}${sourceRefs(ctx, ['pish-call-2026', 'self-assessment-2025-finance'])}
<div class="pish-bet-condition"><div><span class="pish-pill pish-pill-conditional">${esc(L(ctx, 'Условие ставки', 'Condition'))}</span><p>${esc(phrase(ctx, PISH_BET.condition))}</p></div><div><span class="pish-pill">${esc(L(ctx, 'Запасной вариант', 'Fallback'))}</span><p>${esc(phrase(ctx, PISH_BET.fallback))}</p></div></div>
<h3 class="pish-subhead">${esc(L(ctx, 'Путь к подаче: 8 недель', 'Path to submission: 8 weeks'))}</h3>${path}<p class="pish-caption">${esc(L(ctx, 'Даты 5 октября и 1 декабря установлены конкурсом; остальные сроки — предложение рабочей группе.', 'The 5 October and 1 December dates are set by the call; the others are proposals for the working group.'))} ${sourceRefs(ctx, ['pish-call-2026', 'pish-order-2026'])}</p>
<h3 class="pish-subhead">${esc(L(ctx, 'Риски и ранние сигналы', 'Risks and early signals'))}</h3>${risks}`;
  return `<section class="section pish-section pish-bet" id="pish-bet" aria-labelledby="pish-bet-heading"><div class="wrap"><div class="pish-section-head"><span class="pish-section-number">00</span><div><p class="eyebrow">${esc(L(ctx, 'ПИШ · главное решение', 'PISH · the key decision'))}</p><h2 id="pish-bet-heading">${esc(L(ctx, 'Какую ставку сделать в заявке', 'What to bet on in the application'))}</h2><p class="section-lead">${esc(L(ctx, 'Короткий ответ для совещания: что предлагаем, почему, чем это отличается от действующей школы, при каком условии ставка работает и что делать до 1 декабря.', 'The short answer for the meeting: what we propose, why, how it differs from the existing school, the condition for the bet and what to do before 1 December.'))}</p></div></div>${body}</div></section>`;
}
