// A selected industrial publication lens, not a ranking of all world science.
// Topic counts refer to mutually exclusive OpenAlex primary-topic assignments.
// All changes below are relative changes (ratio - 1), and all shares are 0..1.
import { INDUSTRIAL_TOPIC_LENSES } from '../../content/topic-lenses.mjs';

const EXTRA_LENSES = [
  { id: 'T10377', role: 'materials', direct: true },
  { id: 'T12362', role: 'materials', direct: true },
];
const count = value => Number.isInteger(value) && value >= 0 ? value : null;
const finite = value => Number.isFinite(value) ? value : null;
const round = (value, digits = 6) => Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : null;
const ratio = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;
const change = (a, b) => {
  const relative = ratio(a, b);
  return relative == null ? null : round(relative - 1);
};
const close = (a, b, tolerance = 0.000001) => a == null && b == null
  || Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
const inPeriod = (year, range) => Array.isArray(range) && year >= range[0] && year <= range[1];
const completeSum = values => values.every(value => count(value) != null) ? values.reduce((sum, value) => sum + value, 0) : null;

function sumYears(snapshot, range) {
  if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isInteger) || range[1] < range[0]) return null;
  return completeSum(Array.from({ length: range[1] - range[0] + 1 }, (_, index) => snapshot.world.byYear?.[range[0] + index]));
}

function rawSummary(works) {
  const values = works.map(work => work.fw).filter(Number.isFinite);
  return { n: works.length, fwciN: values.length,
    fwci: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null };
}

function observation(nP1, nP2, ownShareP1, ownShareP2, ownChange) {
  if (nP1 == null || nP2 == null) return 'unknown';
  if (nP1 === 0 && nP2 === 0) return 'absent';
  if (ownShareP1 == null || ownShareP2 == null) return 'unknown';
  if (nP1 === 0 && nP2 > 0) return 'new';
  if (ownChange == null) return 'unknown';
  if (ownChange > 0) return 'gain';
  if (ownChange < 0) return 'lose';
  return 'stable';
}

/**
 * Recalculate global normalization from raw annual world totals and topic counts.
 * The independent checks compare the explorer with raw retained work records.
 * Coverage totals describe only the selected primary-topic lens, not the share
 * of the entire machine-tool industry, teaching quality or technology readiness.
 */
export function buildWorldTrends(snapshot, model) {
  const period = snapshot.config.period;
  const explorer = model.explorer ?? { topics: [], groups: [] };
  const retained = snapshot.stankin.works.filter(work => work.y >= period.from && work.y <= period.to);
  const taxonomy = new Map(snapshot.taxonomy.topics.map(topic => [topic.id, topic]));
  const lenses = new Map([...INDUSTRIAL_TOPIC_LENSES, ...EXTRA_LENSES].map(lens => [lens.id, lens]));
  const worldTotals = { p1: sumYears(snapshot, period.p1), p2: sumYears(snapshot, period.p2) };
  const checks = [
    { id: 'world-denominators', passed: close(worldTotals.p1, explorer.worldTotals?.p1, 0)
      && close(worldTotals.p2, explorer.worldTotals?.p2, 0)
      && (model.totals == null || close(worldTotals.p1, model.totals.worldP1, 0) && close(worldTotals.p2, model.totals.worldP2, 0)) },
    { id: 'total-works', passed: retained.length === explorer.totalWorks
      && (model.totals == null || retained.length === model.totals.n) },
    { id: 'period-partition', passed: retained.every(work => inPeriod(work.y, period.p1) !== inPeriod(work.y, period.p2)) },
    { id: 'unique-selected-topics', passed: new Set(explorer.topics.map(topic => topic.id)).size === explorer.topics.length },
    { id: 'selected-lens-definitions', passed: explorer.topics.every(topic => lenses.has(topic.id)) },
  ];
  const topics = explorer.topics.map(source => {
    const lens = lenses.get(source.id);
    const pair = snapshot.world.topics[source.id];
    const available = taxonomy.has(source.id) && Array.isArray(pair) && pair.length === 2 && pair.every(value => count(value) != null);
    const [worldP1, worldP2] = available ? pair : [null, null];
    const nP1 = count(source.nP1), nP2 = count(source.nP2);
    const worldShareP1 = ratio(worldP1, worldTotals.p1), worldShareP2 = ratio(worldP2, worldTotals.p2);
    const ownShareP1 = ratio(nP1, worldP1), ownShareP2 = ratio(nP2, worldP2);
    const worldShareChange = change(worldShareP2, worldShareP1);
    const ownWorldShareChange = change(ownShareP2, ownShareP1);
    const selected = retained.filter(work => work.tp === source.id);
    const p1 = rawSummary(selected.filter(work => inPeriod(work.y, period.p1)));
    const p2 = rawSummary(selected.filter(work => inPeriod(work.y, period.p2)));
    const recentFwci = finite(source.cohorts?.p2?.fwci);
    const recentFwciN = count(source.cohorts?.p2?.fwciN);
    checks.push(
      { id: `${source.id}-world-counts`, passed: close(source.worldP1, worldP1, 0) && close(source.worldP2, worldP2, 0) },
      { id: `${source.id}-own-counts`, passed: available
        ? nP1 === p1.n && nP2 === p2.n && source.cohorts?.p1?.n === p1.n && source.cohorts?.p2?.n === p2.n
        : nP1 == null && nP2 == null && source.cohorts == null },
      { id: `${source.id}-recent-fwci`, passed: source.cohorts == null
        ? recentFwci == null && recentFwciN == null
        : recentFwciN === p2.fwciN && close(recentFwci, p2.fwci, 0.000500001) },
      { id: `${source.id}-normalization`, passed: close(source.worldShareChange, worldShareChange)
        && close(source.ownWorldShareChange, ownWorldShareChange) },
    );
    return {
      id: source.id, name: structuredClone(source.name), openalexName: taxonomy.get(source.id)?.name ?? null,
      role: lens?.role ?? null, direct: lens?.direct ?? false, available,
      nP1, nP2, worldP1, worldP2,
      cohorts: source.cohorts == null ? null : structuredClone(source.cohorts),
      absoluteGrowth: change(worldP2, worldP1),
      worldShareP1: round(worldShareP1, 12), worldShareP2: round(worldShareP2, 12), worldShareChange,
      ownShareP1: round(ownShareP1, 12), ownShareP2: round(ownShareP2, 12), ownWorldShareChange,
      recentFwci, recentFwciN, recentFwciCoverage: ratio(recentFwciN, nP2),
      small: nP2 == null ? null : nP2 < 20,
      observation: observation(nP1, nP2, ownShareP1, ownShareP2, ownWorldShareChange),
      groupIds: (model.competencies ?? []).filter(group => group.topicIds?.includes(source.id)).map(group => group.id),
    };
  });
  const coverage = {
    taxonomyTopics: taxonomy.size,
    topicsWithWorldCounts: [...taxonomy.keys()].filter(id => {
      const pair = snapshot.world.topics[id];
      return Array.isArray(pair) && pair.length === 2 && pair.every(value => count(value) != null);
    }).length,
    selectedTopics: topics.length,
    selectedTopicsWithWorldCounts: topics.filter(topic => topic.available).length,
    selectedTopicsWithOwnCounts: topics.filter(topic => topic.nP1 != null && topic.nP2 != null).length,
    selectedWorldP1: completeSum(topics.map(topic => topic.worldP1)),
    selectedWorldP2: completeSum(topics.map(topic => topic.worldP2)),
    selectedOwnP1: completeSum(topics.map(topic => topic.nP1)),
    selectedOwnP2: completeSum(topics.map(topic => topic.nP2)),
  };
  const membership = new Set(topics.map(topic => topic.id));
  const selectedWorks = retained.filter(work => membership.has(work.tp));
  checks.push({ id: 'selected-own-coverage', passed: coverage.selectedOwnP1 == null || coverage.selectedOwnP2 == null
    ? topics.some(topic => topic.nP1 == null || topic.nP2 == null)
    : coverage.selectedOwnP1 === selectedWorks.filter(work => inPeriod(work.y, period.p1)).length
      && coverage.selectedOwnP2 === selectedWorks.filter(work => inPeriod(work.y, period.p2)).length });
  return { schema: 1, fetchedAt: snapshot.fetchedAt ?? null, totalWorks: retained.length,
    period: structuredClone(period), worldTotals, coverage, topics, checks };
}
