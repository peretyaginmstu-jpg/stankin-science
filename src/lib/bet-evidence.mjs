// Доказательная база ставки ПИШ: насколько прочны публикационные числа, на которые она опирается.
// Чистые функции: снимок OpenAlex + модель сайта → описательные показатели. Ничего не ранжирует
// и не предписывает: показывает, от чего зависит среднее, кто ведёт работы и с кем они написаны.
//
// Все показатели считаются по работам нового пятилетия (period.p2), если не сказано иное.
//   • среднее FWCI и его условный 95% bootstrap-интервал, медиана, среднее без самой цитируемой работы;
//   • вклад трёх самых цитируемых работ в сумму FWCI группы (концентрация);
//   • доля работ без цитирований, доля в топ-10 %;
//   • работы, где СТАНКИН ведущий (первый или корреспондирующий автор), и работы, где ведёт партнёр;
//   • международное соавторство и соавторство с компаниями (тип организации «company» в OpenAlex);
//   • первые авторы работ, где СТАНКИН ведущий: сколько разных имён и доля самого частого
//     (в снимке нет идентификаторов авторов — это приближение по написанию имени).

import { bootstrapMeanCI95, stableSeed } from './stats.mjs';
import { MASS_PROCEEDINGS, RU_TRANSLATED, RU_TRANSLATED_PUBLISHER, RU_PUBLISHER, PROCEEDINGS_NAME, PROCEEDINGS_DOI, VENUE_CLASSES } from '../../content/venue-classes.mjs';

export const BET_CORE = Object.freeze(['machining', 'metrology-quality']);
export const BET_GAPS = Object.freeze(['machine-tools-control', 'condition-monitoring', 'ai-data']);
export const BET_CONTEXT = Object.freeze(['coatings-tribology', 'additive-manufacturing', 'robotics']);
// Смешанный кластер OpenAlex, куда попадает много работ СТАНКИН о станках и ЧПУ.
export const CATCH_ALL_TOPIC = 'T13113';

// Линза по названиям работ: обработка + (измерение | диагностика | управление | ИИ) в одной работе.
// Ключевые слова проверяются по названию на любом языке и не зависят от темы OpenAlex.
export const BET_LENS = Object.freeze({
  machining: /machining|machinab|\bcutting\b(?!-edge)|milling|\bturning\b|drilling|grinding|lathe|tool wear|tool life|chip formation|резани|обработк|фрезеров|точени|шлифов|сверлени/i,
  modules: {
    measure: /measur|metrolog|accuracy|precision|calibrat|roughness|toleranc|coordinate measuring|interferomet|gauge|inspection|измер|точност|контрол[ья]/i,
    monitor: /diagnos|monitor|condition|fault|vibration|acoustic emission|non-?destructive|predictive maintenance|remaining useful|диагност|мониторинг|вибрац/i,
    control: /\bCNC\b|numerical(ly)? control|ЧПУ|machine tool|controller|control system|servo|feed drive|spindle|motion control|adaptive control|станк|управлен/i,
    ai: /machine learning|neural|deep learning|artificial intelligence|\bAI\b|data-driven|digital twin|intelligent|нейрон|интеллект|двойник/i,
  },
});

const round = (v, d = 3) => (v == null || !Number.isFinite(v) ? null : Math.round(v * 10 ** d) / 10 ** d);
const ratio = (a, b) => (b > 0 ? a / b : null);
const meanOf = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
function medianOf(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
const inPeriod = (y, [a, b]) => y >= a && y <= b;

function citationSummary(list) {
  const f = list.map((w) => w.fw).filter(Number.isFinite);
  const pct = list.filter((w) => Number.isFinite(w.p));
  return {
    n: list.length,
    fwciN: f.length,
    fwci: round(meanOf(f)),
    fwciMedian: round(medianOf(f)),
    top10: round(ratio(pct.reduce((s, w) => s + (w.t10 ? 1 : 0), 0), pct.length)),
  };
}

// Показатели одной группы работ. ownIds — идентификаторы университета, institutions — справочник типов.
export function cohortEvidence(list, { seedKey, ownIds, institutions, home = 'RU' }) {
  const own = new Set(ownIds);
  const f = list.map((w) => w.fw).filter(Number.isFinite).sort((a, b) => b - a);
  const sum = f.reduce((s, x) => s + x, 0);
  const ci = bootstrapMeanCI95(f, { seed: stableSeed(seedKey) });
  const pct = list.filter((w) => Number.isFinite(w.p));
  const top10N = pct.filter((w) => w.t10).length;
  const company = (w) => (w.in ?? []).some((id) => !own.has(id) && institutions[id]?.type === 'company');
  const companyRu = (w) => (w.in ?? []).some((id) => !own.has(id) && institutions[id]?.type === 'company' && institutions[id]?.country === home);
  const solo = (w) => (w.in ?? []).every((id) => own.has(id));
  const led = list.filter((w) => w.lead);
  const partnerLed = list.filter((w) => !w.lead);
  const ledF = led.map((w) => w.fw).filter(Number.isFinite);
  const partnerF = partnerLed.map((w) => w.fw).filter(Number.isFinite);
  // Первые авторы работ, где ведёт СТАНКИН (приближение: имя как написано в OpenAlex).
  const firsts = new Map();
  for (const w of led) {
    const name = String(w.a?.[0] ?? '').trim();
    if (name) firsts.set(name, (firsts.get(name) ?? 0) + 1);
  }
  const topFirst = Math.max(0, ...firsts.values());
  return {
    n: list.length,
    fwciN: f.length,
    fwci: round(meanOf(f)),
    ci95: { lower: round(ci.lower), upper: round(ci.upper), status: ci.status },
    fwciMedian: round(medianOf(f)),
    fwciWithoutTop: round(f.length > 1 ? (sum - f[0]) / (f.length - 1) : null),
    top3Share: round(sum > 0 ? f.slice(0, 3).reduce((s, x) => s + x, 0) / sum : null),
    top10: round(ratio(top10N, pct.length)),
    top10N,
    uncited: round(ratio(list.filter((w) => !w.c).length, list.length)),
    intl: round(ratio(list.filter((w) => (w.co ?? []).some((c) => c !== home)).length, list.length)),
    led: { n: led.length, share: round(ratio(led.length, list.length)), fwci: round(meanOf(ledF)), fwciMedian: round(medianOf(ledF)) },
    partnerLed: { n: partnerLed.length, fwci: round(meanOf(partnerF)) },
    company: list.filter(company).length,
    companyRu: list.filter(companyRu).length,
    solo: round(ratio(list.filter(solo).length, list.length)),
    conference: round(ratio(list.filter((w) => w.ty === 'conference-paper').length, list.length)),
    firstAuthors: { distinct: firsts.size, topShare: round(ratio(topFirst, led.length)) },
  };
}

// Класс площадки работы (content/venue-classes.mjs). sources — справочник источников снимка.
export function venueClass(w, sources) {
  const src = w.s ? sources[w.s] : null;
  if (!src) return PROCEEDINGS_DOI.test(w.doi ?? '') ? 'ieee-spie' : 'other';
  const name = src.name ?? '';
  if (MASS_PROCEEDINGS.test(name)) return 'mass-proceedings';
  if (RU_TRANSLATED.test(name) || RU_TRANSLATED_PUBLISHER.test(src.publisher ?? '')) return 'ru-translated';
  if (src.type === 'conference' || src.type === 'book series' || PROCEEDINGS_NAME.test(name)) return 'proceedings';
  if (w.lang === 'ru' || !src.publisher || RU_PUBLISHER.test(src.publisher)) return 'ru-domestic';
  return 'intl-journal';
}

export function buildBetEvidence(snapshot, model) {
  const period = snapshot.config.period;
  const home = model.meta?.home ?? 'RU';
  const ownIds = snapshot.config.institutionIds ?? [];
  const institutions = snapshot.institutions ?? {};
  const works = snapshot.stankin.works.filter((w) => w.y >= period.from && w.y <= period.to);
  const recent = works.filter((w) => inPeriod(w.y, period.p2));
  const compOfTopic = new Map();
  for (const c of model.competencies) for (const t of c.topicIds ?? []) compOfTopic.set(t, c.id);
  const opts = (key) => ({ seedKey: `bet:${key}`, ownIds, institutions, home });
  const of = (ids) => recent.filter((w) => ids.includes(compOfTopic.get(w.tp)));

  const ids = [...BET_CORE, ...BET_GAPS, ...BET_CONTEXT].filter((id) => model.competencies.some((c) => c.id === id));
  const rows = ids.map((id) => ({ id, role: BET_CORE.includes(id) ? 'core' : BET_GAPS.includes(id) ? 'gap' : 'context', ...cohortEvidence(of([id]), opts(id)) }));
  const bundles = {
    core: cohortEvidence(of(BET_CORE), opts('core')),
    gaps: cohortEvidence(of(BET_GAPS), opts('gaps')),
  };

  // Линза по названиям: работы о резании, где в названии есть измерение, диагностика, управление или ИИ.
  const lensMatch = (w) => BET_LENS.machining.test(w.t ?? '');
  const lensWorks = recent.filter((w) => lensMatch(w) && Object.values(BET_LENS.modules).some((re) => re.test(w.t ?? '')));
  const modules = Object.fromEntries(Object.entries(BET_LENS.modules).map(([key, re]) => {
    const list = recent.filter((w) => lensMatch(w) && re.test(w.t ?? ''));
    return [key, { n: list.length, ...pick(citationSummary(list), ['fwci', 'fwciMedian']) }];
  }));
  const lens = {
    ...cohortEvidence(lensWorks, opts('lens')),
    modules,
    inCatchAll: lensWorks.filter((w) => w.tp === CATCH_ALL_TOPIC).length,
    inCore: lensWorks.filter((w) => BET_CORE.includes(compOfTopic.get(w.tp))).length,
    inGaps: lensWorks.filter((w) => BET_GAPS.includes(compOfTopic.get(w.tp))).length,
    workIds: lensWorks.map((w) => w.id).sort(),
  };

  // Международное соавторство: цитирование работ с зарубежными соавторами и без них.
  const intlList = recent.filter((w) => (w.co ?? []).some((c) => c !== home));
  const domList = recent.filter((w) => !(w.co ?? []).some((c) => c !== home));
  const international = { intl: citationSummary(intlList), domestic: citationSummary(domList) };

  // Компании-соавторы за всё окно: кто, сколько работ, в каких компетенциях.
  const companies = new Map();
  for (const w of works) {
    const comp = compOfTopic.get(w.tp) ?? null;
    for (const id of new Set(w.in ?? [])) {
      const meta = institutions[id];
      if (ownIds.includes(id) || meta?.type !== 'company') continue;
      if (!companies.has(id)) companies.set(id, { id, name: meta.name ?? id, country: meta.country ?? null, n: 0, nP2: 0, competencies: {} });
      const row = companies.get(id);
      row.n += 1;
      if (inPeriod(w.y, period.p2)) row.nP2 += 1;
      if (comp) row.competencies[comp] = (row.competencies[comp] ?? 0) + 1;
    }
  }
  const companyWorks = works.filter((w) => (w.in ?? []).some((id) => !ownIds.includes(id) && institutions[id]?.type === 'company'));
  const industry = {
    works: companyWorks.length,
    worksP2: companyWorks.filter((w) => inPeriod(w.y, period.p2)).length,
    worksRu: companyWorks.filter((w) => (w.in ?? []).some((id) => !ownIds.includes(id) && institutions[id]?.type === 'company' && institutions[id]?.country === home)).length,
    coreP2: bundles.core.company,
    coreRuP2: bundles.core.companyRu,
    gapsP2: bundles.gaps.company,
    companies: [...companies.values()].sort((a, b) => b.n - a.n || a.name.localeCompare(b.name)),
  };

  // Площадки: доля работ и цитирование по классам (новое пятилетие) и типы документов.
  const sources = snapshot.stankin.sources ?? {};
  const venues = {
    classes: VENUE_CLASSES.map((c) => {
      const list = recent.filter((w) => venueClass(w, sources) === c.id);
      return { id: c.id, share: round(ratio(list.length, recent.length)), ...citationSummary(list) };
    }).filter((c) => c.n > 0),
    types: ['article', 'conference-paper', 'book-chapter', 'review'].map((type) => ({ type, nAll: works.filter((w) => w.ty === type).length, shareAll: round(ratio(works.filter((w) => w.ty === type).length, works.length)), shareP2: round(ratio(recent.filter((w) => w.ty === type).length, recent.length)) })),
  };

  return {
    schema: 1,
    period: structuredClone(period),
    method: {
      cohort: 'Works of the second period (p2) by primary-topic competency; FWCI as reported by OpenAlex.',
      interval: 'Percentile bootstrap of the mean, 2000 resamples, deterministic seed; descriptive, assumes independent works.',
      led: 'lead = a STANKIN author is first or corresponding (OpenAlex authorships).',
      company: 'Co-authorship with any OpenAlex institution of type "company" other than the university.',
      firstAuthors: 'Distinct first-author names among STANKIN-led works; names, not author identifiers.',
      lens: 'Title keywords: machining terms AND at least one of measurement, monitoring, control or AI terms; independent of OpenAlex topics.',
      venues: 'Venue classes from content/venue-classes.mjs: source name, publisher, work language and DOI prefix; approximate.',
    },
    rows,
    bundles,
    lens,
    international,
    industry,
    venues,
  };
}

function pick(obj, keys) {
  return Object.fromEntries(keys.map((k) => [k, obj[k]]));
}
