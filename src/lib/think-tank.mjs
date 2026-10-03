// Institutional evidence and research options use separate clocks and definitions.
// Pareto membership is a descriptive filter, never a funding rule or world rank.
import { buildIndustryIndex } from './industry-index.mjs';
import { INSTITUTIONAL_SOURCES, INSTITUTIONAL_INDICATORS, INSTITUTIONAL_CONTEXT } from '../../content/institutional-evidence.mjs';
import { THINK_TANK_SOURCES, THINK_TANK_DIRECTIONS, THINK_TANK_SCENARIOS } from '../../content/think-tank.mjs';

const finite = Number.isFinite;
const round = value => finite(value) ? Math.round(value * 1e6) / 1e6 : null;
export const THINK_TANK_THRESHOLDS = Object.freeze({ minWorks: 20, minCoverage: 0.7 });
export const PARETO_DIMENSIONS = Object.freeze(['fwciWithoutHighest', 'top10', 'worldShareChange']);

export function compareInstitutionalIndicator(indicator, fromYear = indicator.comparisonYears?.[0] ?? 2020, toYear = indicator.comparisonYears?.[1] ?? 2025) {
  const before = indicator.observations.find(item => item.year === fromYear);
  const after = indicator.observations.find(item => item.year === toYear);
  const from = finite(before?.value) ? before.value : null;
  const to = finite(after?.value) ? after.value : null;
  const base = { fromYear, toYear, from, to, years: toYear - fromYear,
    absolute: null, relative: null, percentagePoints: null };
  if (toYear <= fromYear) return { ...base, status: 'invalid-period' };
  if (from == null || to == null) return { ...base, status: 'missing' };
  if (!indicator.comparable) return { ...base, status: 'not-comparable' };
  return { ...base, absolute: round(to - from),
    relative: from === 0 ? null : round(to / from - 1),
    // Institutional percentages are stored as 0..100, unlike OpenAlex shares.
    percentagePoints: indicator.unit === 'percent' ? round(to - from) : null,
    status: from === 0 ? 'zero-base' : 'comparable' };
}

function dimensions(row) {
  return [row.evidence?.cohorts?.p2?.fwciWithoutHighest,
    row.evidence?.cohorts?.p2?.top10, row.evidence?.worldShareChange];
}

/** Weakly better on every dimension and strictly better on at least one.
 * Equal vectors remain on the same front. Unknown values never become zero.
 */
export function dominates(a, b, epsilon = 1e-9) {
  const x = Array.isArray(a) ? a : dimensions(a), y = Array.isArray(b) ? b : dimensions(b);
  return x.length > 0 && x.length === y.length && x.every(finite) && y.every(finite)
    && x.every((value, i) => value >= y[i] - epsilon)
    && x.some((value, i) => value > y[i] + epsilon);
}

export function assignPareto(rows, thresholds = THINK_TANK_THRESHOLDS) {
  const eligibility = row => {
    const c = row.evidence?.cohorts?.p2;
    if (row.mappingStatus !== 'reviewed') return 'mapping';
    if (!c || row.evidence?.coverage?.missingTopicIds?.length || !dimensions(row).every(finite)) return 'missing';
    if (c.n < thresholds.minWorks) return 'small-sample';
    if (c.fwciCoverage < thresholds.minCoverage || c.top10Coverage < thresholds.minCoverage
      || !finite(c.fwciCoverage) || !finite(c.top10Coverage)) return 'coverage';
    return null;
  };
  const eligible = rows.filter(row => eligibility(row) == null);
  return rows.map(row => {
    const reason = eligibility(row);
    const dominatedBy = reason ? [] : eligible.filter(other => other.id !== row.id && dominates(other, row)).map(other => other.id);
    return { ...row, pareto: { eligible: reason == null, front: reason == null && !dominatedBy.length,
      dominatedBy, reason: reason ?? (dominatedBy.length ? 'dominated' : 'non-dominated') } };
  });
}

export function buildThinkTank(snapshot, model = {}, options = {}) {
  const definitions = options.directions ?? THINK_TANK_DIRECTIONS;
  const sources = options.sources ?? THINK_TANK_SOURCES;
  const institutionalSources = options.institutionalSources ?? INSTITUTIONAL_SOURCES;
  const indicators = options.indicators ?? INSTITUTIONAL_INDICATORS;
  const context = options.context ?? INSTITUTIONAL_CONTEXT;
  const scenarios = options.scenarios ?? THINK_TANK_SCENARIOS;
  const thresholds = { ...THINK_TANK_THRESHOLDS, ...options.thresholds };
  // Reuse exactly the cohort, counting and bootstrap machinery of the industry index.
  const index = buildIndustryIndex(snapshot, { scopes: definitions.map(row => ({
    id: row.id, name: row.name, note: row.mappingNote, topicIds: row.topicIds,
  })) });
  const taxonomy = new Map(snapshot.taxonomy.topics.map(topic => [topic.id, topic]));
  const workMap = new Map(snapshot.stankin.works.map(work => [work.id, work]));
  const scientific = definitions.map((row, i) => {
    const scope = index.scopes[i];
    const topics = row.topicIds.map(id => ({ id, name: taxonomy.get(id)?.name ?? id,
      worldP1: snapshot.world.topics[id]?.[0] ?? null,
      worldP2: snapshot.world.topics[id]?.[1] ?? null,
      nP1: scope.cohorts.p1.workIds.filter(workId => workMap.get(workId)?.tp === id).length,
      nP2: scope.cohorts.p2.workIds.filter(workId => workMap.get(workId)?.tp === id).length }));
    return { ...structuredClone(row), evidence: {
      cohorts: scope.cohorts, topics, coverage: scope.coverage,
      worldShareChange: scope.change.worldShareChange,
      presenceChange: scope.change.presenceIndex,
      fwciDifferenceCI95: scope.fwciDifferenceCI95,
    } };
  });
  const directions = assignPareto(scientific, thresholds);
  const selected = new Set(directions.flatMap(row => [...row.evidence.cohorts.p1.workIds, ...row.evidence.cohorts.p2.workIds]));
  const works = Object.fromEntries([...selected].map(id => {
    const work = workMap.get(id);
    return [id, { id, title: work.t ?? work.title ?? id, year: work.y,
      fwci: work.fw ?? null, doi: work.doi ?? null, topicId: work.tp,
      url: `https://openalex.org/${id}` }];
  }));
  const institution = { sources: structuredClone(institutionalSources),
    indicators: indicators.map(item => ({ ...structuredClone(item), comparison: compareInstitutionalIndicator(item) })),
    context: structuredClone(context) };
  const sourceIds = new Set([...sources, ...institutionalSources].map(item => item.id));
  const dirIds = new Set(directions.map(row => row.id));
  const referencedSources = [...directions.flatMap(row => [...row.sourceIds, ...row.benchmarks.flatMap(item => item.sourceIds)]),
    ...indicators.flatMap(item => item.observations.filter(o => o.value != null).map(o => o.sourceId)), ...context.map(item => item.sourceId)];
  const checks = [...index.checks.map(check => ({ ...check, id: `corpus-${check.id}` })),
    { id: 'institutional-source-pages', passed: indicators.every(item => item.observations.every(o => o.value == null
      || finite(o.value) && Number.isInteger(o.year) && sourceIds.has(o.sourceId) && Number.isInteger(o.page) && o.page > 0)) },
    { id: 'unique-institutional-years', passed: indicators.every(item => new Set(item.observations.map(o => o.year)).size === item.observations.length) },
    { id: 'known-sources', passed: referencedSources.every(id => sourceIds.has(id)) },
    { id: 'local-evidence-pages', passed: directions.every(row => (row.localSourceRefs ?? []).every(ref => sourceIds.has(ref.sourceId) && Number.isInteger(ref.page) && ref.page > 0)) },
    { id: 'context-source-pages', passed: context.every(item => sourceIds.has(item.sourceId) && Number.isInteger(item.page) && item.page > 0) },
    { id: 'unique-source-ids', passed: sourceIds.size === sources.length + institutionalSources.length },
    { id: 'scenario-directions', passed: scenarios.every(item => item.directionIds.every(id => dirIds.has(id))) },
    { id: 'unmapped-excluded-from-pareto', passed: directions.every(row => row.mappingStatus === 'reviewed' || !row.pareto.eligible) },
    { id: 'pareto-has-no-dominator', passed: directions.filter(row => row.pareto.front).every(row => !directions.some(other => other.pareto.eligible && dominates(other, row))) },
    { id: 'incomparable-not-subtracted', passed: institution.indicators.filter(item => !item.comparable).every(item => item.comparison.absolute == null && item.comparison.relative == null) },
    { id: 'same-publication-corpus', passed: model.meta?.fetchedAt == null || model.meta.fetchedAt === index.fetchedAt },
  ];
  return { schema: 1, asOf: '2026-10-03', fetchedAt: index.fetchedAt, totalWorks: index.totalWorks,
    period: index.period, plotReady: Boolean(model.meta?.pythonPlots),
    institution, directions, works, sources: structuredClone(sources), scenarios: structuredClone(scenarios),
    pareto: { dimensions: [...PARETO_DIMENSIONS], ...thresholds,
      eligibleIds: directions.filter(row => row.pareto.eligible).map(row => row.id),
      frontIds: directions.filter(row => row.pareto.front).map(row => row.id) },
    checks };
}
