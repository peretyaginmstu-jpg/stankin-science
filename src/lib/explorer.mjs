// A public, reproducible drill-down into the fixed publication snapshot.
// These are publication topics, not inferred departments, staff or capabilities.
import { COMPETENCIES } from '../../content/competencies.mjs';
import { PISH_TOPIC_FAMILIES } from '../../content/pish-topics.mjs';

const finite = value => Number.isFinite(value) ? value : null;
const round = (value, digits = 6) => Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : null;
const inPeriod = (year, range) => Array.isArray(range) && year >= range[0] && year <= range[1];
const ratio = (numerator, denominator) => Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0 ? numerator / denominator : null;
const change = (recent, baseline) => {
  const relative = ratio(recent, baseline);
  return relative == null ? null : round(relative - 1);
};
const close = (a, b, tolerance = 0.000500001) => a == null && b == null
  || Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;

// Deliberately independent of summarize()/summarizeCohort(): the checks below
// compare their exported values with direct arithmetic on the selected records.
function rawSummary(works) {
  const values = works.map(work => work.fw).filter(Number.isFinite);
  return { n: works.length, fwciN: values.length, fwci: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null };
}

function worldSum(snapshot, topicIds) {
  const counts = topicIds.map(id => snapshot.world.topics[id]);
  if (counts.some(pair => !Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isFinite))) return [null, null];
  return counts.reduce(([a, b], [p1, p2]) => [a + p1, b + p2], [0, 0]);
}

function sumYears(snapshot, range) {
  const years = Array.from({ length: range[1] - range[0] + 1 }, (_, index) => range[0] + index);
  const counts = years.map(year => snapshot.world.byYear?.[year]);
  return counts.every(Number.isFinite) ? counts.reduce((sum, count) => sum + count, 0) : null;
}

function checkEntry(kind, entry, selected, expectedWorld, period, worldTotals) {
  const p1 = rawSummary(selected.filter(work => inPeriod(work.y, period.p1)));
  const p2 = rawSummary(selected.filter(work => inPeriod(work.y, period.p2)));
  const available = entry.cohorts != null;
  const counts = available
    ? entry.nP1 === p1.n && entry.nP2 === p2.n
      && entry.cohorts.p1.n === p1.n && entry.cohorts.p2.n === p2.n
    : entry.nP1 == null && entry.nP2 == null;
  const means = available
    ? ['p1', 'p2'].every(key => {
      const direct = key === 'p1' ? p1 : p2;
      return entry.cohorts[key].fwciN === direct.fwciN && close(entry.cohorts[key].fwci, direct.fwci);
    }) : true;
  const annual = entry.annual.every(point => {
    const direct = rawSummary(selected.filter(work => work.y === point.year));
    return point.n === direct.n && point.fwciN === direct.fwciN && close(point.fwci, direct.fwci);
  });
  const expectedGrowth = change(ratio(expectedWorld[1], worldTotals.p2), ratio(expectedWorld[0], worldTotals.p1));
  const expectedOwn = available ? change(ratio(p2.n, expectedWorld[1]), ratio(p1.n, expectedWorld[0])) : null;
  return [
    { id: `${kind}-${entry.id}-counts`, passed: counts && p1.n + p2.n === selected.length
      && entry.annual.reduce((sum, point) => sum + point.n, 0) === selected.length
      && entry.workIds.length === selected.length && new Set(entry.workIds).size === selected.length
      && entry.workIds.every(id => selected.some(work => work.id === id)) },
    { id: `${kind}-${entry.id}-means`, passed: means && annual },
    { id: `${kind}-${entry.id}-world`, passed: close(entry.worldP1, expectedWorld[0], 0)
      && close(entry.worldP2, expectedWorld[1], 0)
      && close(entry.worldShareChange, expectedGrowth, 0.000001)
      && close(entry.ownWorldShareChange, expectedOwn, 0.000001) },
  ];
}

/** Public metadata only; no network requests or affiliation/staff inference.
 * Annual series describe STANKIN works. World counts are available only for the
 * two full periods, so annual world growth is intentionally not manufactured.
 */
export function buildExplorer(snapshot, model) {
  const period = snapshot.config.period;
  const retained = snapshot.stankin.works.filter(work => work.y >= period.from && work.y <= period.to);
  const years = Array.from({ length: period.to - period.from + 1 }, (_, index) => period.from + index);
  const worldTotals = { p1: sumYears(snapshot, period.p1), p2: sumYears(snapshot, period.p2) };
  const questions = PISH_TOPIC_FAMILIES.flatMap(family => family.subtopics);
  const definitions = new Map(COMPETENCIES.map(group => [group.id, group]));
  const sources = new Map((model.competencies ?? []).map(group => [group.id, group]));
  const checks = [];
  const createEntry = (source, selected, topicIds, kind) => {
    const name = kind === 'group' ? definitions.get(source.id)?.name ?? { ru: source.id, en: source.id } : source.name;
    const cohorts = source.cohorts == null ? null : structuredClone(source.cohorts);
    const nP1 = cohorts?.p1.n ?? null;
    const nP2 = cohorts?.p2.n ?? null;
    const entry = {
      id: source.id, name: { ...name }, nP1, nP2,
      worldP1: finite(source.worldP1), worldP2: finite(source.worldP2),
      worldShareChange: finite(source.worldShareChange),
      ownWorldShareChange: change(ratio(nP2, source.worldP2), ratio(nP1, source.worldP1)),
      cohorts,
      annual: years.map(year => ({ year, ...rawSummary(selected.filter(work => work.y === year)) })).map(point => ({ ...point, fwci: round(point.fwci, 3) })),
      workIds: selected.map(work => work.id),
      questionIds: questions.filter(question => (kind === 'group' ? question.competencyIds : question.topicIds).includes(source.id)).map(question => question.id),
    };
    const expectedWorld = kind === 'topic' && source.available === false ? [null, null] : worldSum(snapshot, topicIds);
    checks.push(...checkEntry(kind, entry, selected, expectedWorld, period, worldTotals));
    return entry;
  };
  const groups = (model.pish?.rows ?? []).map(row => {
    const topicIds = sources.get(row.id)?.topicIds ?? [];
    const membership = new Set(topicIds);
    return createEntry(row, retained.filter(work => membership.has(work.tp)), topicIds, 'group');
  });
  const topics = (model.pish?.topicEvidence ?? []).map(row => createEntry(row, retained.filter(work => work.tp === row.id), [row.id], 'topic'));
  const works = Object.fromEntries(retained.map(work => [work.id, {
    id: work.id, title: typeof work.t === 'string' ? work.t : null, year: work.y,
    doi: typeof work.doi === 'string' && work.doi ? work.doi : null,
    fwci: finite(work.fw), citations: finite(work.c), topicId: work.tp ?? null,
  }]));
  const memberships = new Map();
  for (const group of groups) for (const id of sources.get(group.id)?.topicIds ?? []) memberships.set(id, (memberships.get(id) ?? 0) + 1);
  const assigned = retained.filter(work => memberships.has(work.tp));
  checks.unshift(
    { id: 'unique-work-ids', passed: Object.keys(works).length === retained.length },
    { id: 'period-partition', passed: retained.every(work => inPeriod(work.y, period.p1) !== inPeriod(work.y, period.p2)) },
    { id: 'total-works', passed: retained.length === model.totals?.n && retained.length === model.pish?.totalWorks },
    { id: 'world-denominators', passed: worldTotals.p1 != null && worldTotals.p2 != null && worldTotals.p1 === model.totals?.worldP1 && worldTotals.p2 === model.totals?.worldP2 },
    { id: 'group-partition', passed: [...memberships.values()].every(count => count === 1) && assigned.length === groups.reduce((sum, group) => sum + group.workIds.length, 0) },
    { id: 'group-coverage', passed: groups.length === sources.size && groups.every(group => sources.has(group.id)) && new Set(groups.map(group => group.id)).size === groups.length },
    { id: 'unique-topics', passed: new Set(topics.map(topic => topic.id)).size === topics.length },
    { id: 'valid-measurements', passed: retained.every(work => (work.fw == null || Number.isFinite(work.fw) && work.fw >= 0) && (work.c == null || Number.isInteger(work.c) && work.c >= 0)) },
  );
  return { schema: 1, fetchedAt: snapshot.fetchedAt ?? null, totalWorks: retained.length, period: structuredClone(period), worldTotals, groups, topics, works, checks };
}
