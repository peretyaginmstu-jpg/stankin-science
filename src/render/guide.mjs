// Shared navigation blocks: the PISH bet banner, a guide to the site sections
// and the role of a competency in the bet. Text only; numbers come from the model.
import { esc } from './kit.mjs';
import { PISH_BET } from '../../content/pish-bet.mjs';

const L = (ctx, ru, en) => ctx.lang === 'en' ? en : ru;
const phrase = (ctx, v) => typeof v === 'string' ? v : v?.[ctx.lang] ?? v?.ru ?? '';

export function betBanner(ctx, { secondary = ['decisions/', 'Где усиливать науку', 'Where to strengthen research'] } = {}) {
  return `<aside class="bet-banner" aria-labelledby="bet-banner-title"><div><p class="eyebrow">${esc(L(ctx, 'ПИШ 2026 · предлагаемая ставка', 'PISH 2026 · proposed bet'))}</p><h2 id="bet-banner-title">${esc(phrase(ctx, PISH_BET.title))}</h2><p>${esc(L(ctx, 'Встраиваемая система адаптивного управления точной обработкой: измерить → предсказать → скорректировать → подтвердить. Опора — резание и метрология; управление, диагностику и ИИ усиливают партнёры. Условие — письмо квалифицированного заказчика до 31 октября.', 'An embedded adaptive control system for precision machining: measure → predict → correct → confirm. Built on machining and metrology; partners strengthen control, diagnostics and AI. Condition: a qualified customer letter by 31 October.'))}</p></div><div class="bet-banner-actions"><a class="bet-banner-primary" href="${esc(ctx.page('pish/'))}#pish-bet">${esc(L(ctx, 'Ставка и обоснование', 'The bet and its rationale'))} →</a><a href="${esc(ctx.page(secondary[0]))}">${esc(L(ctx, secondary[1], secondary[2]))} →</a></div></aside>`;
}

const GUIDE = [
  ['decisions/', 'Куда развиваться', 'Where to develop', 'Где мы сильны, где растёт мир и что соединить для умного станка.', 'Where we are strong, where the world grows and what to connect for a smart machine tool.'],
  ['pish/', 'ПИШ: ставка', 'PISH: the bet', 'Что предложить в заявке 2026 года, чем это отличается от действующей школы и при каком условии подавать.', 'What to propose in the 2026 application, how it differs from the existing school and when to apply.'],
  ['think-tank/', 'Think Tank', 'Think Tank', 'Какие научные задачи выбрать до 2030 и 2036 годов: восемь направлений и три варианта.', 'Which research problems to choose for 2030 and 2036: eight fields and three options.'],
  ['trends/', 'Мировые тренды', 'World trends', 'Куда движется наука о станках: рост мировых тем и наши работы в них.', 'Where machine-tool research is heading: growing world topics and our work in them.'],
  ['industry-index/', 'Отраслевой индекс', 'Industry index', 'Какую долю мировой станкоинструментальной науки даёт СТАНКИН.', 'STANKIN’s share of world machine-tool research.'],
  ['competencies/', 'Компетенции', 'Competencies', 'Показатели {n}: объём, специализация, цитирование, место в России и мире.', 'Indicators for {n}: volume, specialisation, citations, rank in Russia and worldwide.'],
  ['collaboration/', 'Сотрудничество', 'Collaboration', 'С кем публикуемся: страны, организации, промышленность.', 'Who we publish with: countries, organisations, industry.'],
  ['method/', 'Методика', 'Method', 'Источник данных, формулы, аудит аффилиаций и ограничения выводов.', 'Data source, formulas, affiliation audit and limits of the conclusions.'],
];

const fieldsCount = (ctx) => {
  const n = ctx.model.competencies.filter((c) => c.visible).length;
  return ctx.lang === 'ru' ? `${n} ${ctx.plural(n, ['направления', 'направлений', 'направлений'])}` : `${n} ${n === 1 ? 'field' : 'fields'}`;
};

export function siteGuide(ctx, { exclude = [] } = {}) {
  const rows = GUIDE.filter(([path]) => !exclude.includes(path));
  return `<nav class="site-guide" aria-label="${esc(L(ctx, 'Разделы сайта', 'Site sections'))}">${rows.map(([path, ru, en, qru, qen], i) => `<a class="site-guide-card${path === 'pish/' ? ' site-guide-key' : ''}" href="${esc(ctx.page(path))}"><span class="site-guide-index">${String(i + 1).padStart(2, '0')}</span><strong>${esc(L(ctx, ru, en))}</strong><span>${esc(L(ctx, qru, qen).replace('{n}', fieldsCount(ctx)))}</span></a>`).join('')}</nav>`;
}

// Where a competency sits in the recommended bet; empty for unrelated fields.
const BET_ROLES = {
  machining: 'base', 'metrology-quality': 'base',
  'machine-tools-control': 'gap', 'condition-monitoring': 'gap', 'ai-data': 'gap',
  'coatings-tribology': 'object', 'ceramics-composites': 'object', robotics: 'next',
};

export function betRole(ctx, id) {
  const role = BET_ROLES[id];
  if (!role) return '';
  const text = {
    base: L(ctx, 'Опора ставки ПИШ: физика процесса и измерение, на которых строится продукт.', 'A base of the PISH bet: the process physics and measurement the product is built on.'),
    gap: L(ctx, 'Разрыв ставки ПИШ: этот пакет закрывает соисполнитель, СТАНКИН участвует.', 'A gap in the PISH bet: a co-executor leads this package, STANKIN contributes.'),
    object: L(ctx, 'В ставке ПИШ — объект испытаний: инструмент и покрытия остаются в действующей школе.', 'In the PISH bet, a test object: tooling and coatings stay with the existing school.'),
    next: L(ctx, 'Следующий этап ставки ПИШ: роботизированная ячейка после 2031 года и запасной вариант заявки.', 'The next stage of the PISH bet: a robotic cell after 2031 and the fallback application.'),
  }[role];
  return `<p class="bet-role bet-role-${role}"><span>${esc(L(ctx, 'Роль в ставке ПИШ', 'Role in the PISH bet'))}</span>${esc(text)} <a href="${esc(ctx.page('pish/'))}#pish-bet">${esc(L(ctx, 'Подробнее', 'Details'))} →</a></p>`;
}
