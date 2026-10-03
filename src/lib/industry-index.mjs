// Scientific publication presence per 10,000 world works in an explicit scope.
// No composite score, teaching-quality measure, rank or inferred staff capability.
import { summarizeCohort } from './metrics.mjs';
import { bootstrapMeanCI95, bootstrapDifferenceCI95, stableSeed, wilsonCI95 } from './stats.mjs';
import { INDUSTRY_SCOPES, INDUSTRY_SCOPE_VERSION, INDUSTRY_TOPIC_ROLES, INDUSTRY_TOPIC_BASIS, INDUSTRY_SCOPE_LIMITATIONS, INDUSTRY_TOPIC_REVIEWS } from '../../content/industry-scope.mjs';

const SCALE = 10000;
const count = value => Number.isInteger(value) && value >= 0 ? value : null;
const round = value => Number.isFinite(value) ? Math.round(value * 1e6) / 1e6 : null;
const ratio = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;
const change = (a, b) => {
  const relative = ratio(a, b);
  return relative == null ? null : round(relative - 1);
};
const inPeriod = (year, range) => Array.isArray(range) && year >= range[0] && year <= range[1];
const completeSum = values => values.every(value => count(value) != null) ? values.reduce((sum, value) => sum + value, 0) : null;
const close = (a, b, tolerance = 0.000001) => a == null && b == null
  || Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
function worldYears(snapshot, range) {
  return completeSum(Array.from({ length: range[1] - range[0] + 1 }, (_, index) => snapshot.world.byYear?.[range[0] + index]));
}

function statisticalSummary(works, key, home) {
  const summary = summarizeCohort(works, { home });
  const percentiles = works.filter(work => Number.isFinite(work.p));
  const top10Count = percentiles.reduce((sum, work) => sum + (work.t10 ?? 0), 0);
  const available = works.filter(work => Number.isFinite(work.fw)).sort((a, b) => b.fw - a.fw || String(a.id).localeCompare(String(b.id)));
  const highest = available[0];
  const fwciSum = available.reduce((sum, work) => sum + work.fw, 0);
  return { ...summary,
    workIds: works.map(work => work.id),
    top10N: percentiles.length, top10Count,
    fwciWithoutHighest: available.length > 1 ? round((fwciSum - highest.fw) / (available.length - 1)) : null,
    highestFwciWorkId: highest?.id ?? null, highestFwciValue: highest?.fw ?? null,
    top3FwciSumShare: ratio(available.slice(0, 3).reduce((sum, work) => sum + work.fw, 0), fwciSum),
    fwciCI95: bootstrapMeanCI95(works.map(work => work.fw), { seed: stableSeed(key) }),
    top10CI95: wilsonCI95(top10Count, percentiles.length),
  };
}

/** Indices are calculated independently for each declared scope and period.
 * Own denominators include all retained institutional works of the configured
 * document types, including those lacking a primary topic. World denominators
 * use the matching annual total, rather than a sum of classified topics.
 */
export function buildIndustryIndex(snapshot, { scopes: definitions = INDUSTRY_SCOPES, home = 'RU' } = {}) {
  const period = snapshot.config.period;
  const retained = snapshot.stankin.works.filter(work => work.y >= period.from && work.y <= period.to);
  const taxonomy = new Map(snapshot.taxonomy.topics.map(topic => [topic.id, topic]));
  const reviewedTopics = new Map(INDUSTRY_TOPIC_REVIEWS.map(topic => [topic.id, topic]));
  const ownTotals = { p1: retained.filter(work => inPeriod(work.y, period.p1)).length,
    p2: retained.filter(work => inPeriod(work.y, period.p2)).length };
  const worldTotals = { p1: worldYears(snapshot, period.p1), p2: worldYears(snapshot, period.p2) };
  const snapshotYear = Number(String(snapshot.fetchedAt ?? '').slice(0, 4));
  const knownSnapshotYear = Number.isInteger(snapshotYear) && snapshotYear > 1900;
  const checks = [
    { id: 'unique-retained-works', passed: new Set(retained.map(work => work.id)).size === retained.length },
    { id: 'period-partition', passed: ownTotals.p1 + ownTotals.p2 === retained.length
      && retained.every(work => inPeriod(work.y, period.p1) !== inPeriod(work.y, period.p2)) },
    { id: 'unique-scope-ids', passed: new Set(definitions.map(scope => scope.id)).size === definitions.length },
    { id: 'valid-measurements', passed: retained.every(work => (work.fw == null || Number.isFinite(work.fw) && work.fw >= 0)
      && (work.p == null || Number.isFinite(work.p) && work.p >= 0 && work.p <= 1)
      && (work.t10 == null || work.t10 === 0 || work.t10 === 1)) },
  ];
  const scopes = definitions.map(definition => {
    const topicIds = [...new Set(definition.topicIds)];
    const membership = new Set(topicIds);
    const selected = retained.filter(work => membership.has(work.tp));
    const missingTopicIds = topicIds.filter(id => !taxonomy.has(id) || !Array.isArray(snapshot.world.topics[id])
      || snapshot.world.topics[id].length !== 2 || snapshot.world.topics[id].some(value => count(value) == null));
    const selectedByPeriod = {};
    const cohorts = Object.fromEntries(['p1', 'p2'].map((key, index) => {
      const selectedWorks = selected.filter(work => inPeriod(work.y, period[key]));
      selectedByPeriod[key] = selectedWorks;
      const worldWorks = completeSum(topicIds.map(id => taxonomy.has(id) ? snapshot.world.topics[id]?.[index] : null));
      const summary = statisticalSummary(selectedWorks, `industry:${definition.id}:${key}`, home);
      const presence = ratio(summary.n, worldWorks);
      const specialisation = ratio(ratio(summary.n, ownTotals[key]), ratio(worldWorks, worldTotals[key]));
      const cohort = { ...summary, worldWorks, allOwnWorks: ownTotals[key], allWorldWorks: worldTotals[key],
        presenceIndex: presence == null ? null : round(SCALE * presence), specialisationIndex: round(specialisation),
        incompleteWindowWorks: knownSnapshotYear ? selectedWorks.filter(work => work.y + 3 >= snapshotYear).length : null,
      };
      // Alternate arithmetic verifies the units and normalisation without using ratio().
      const expectedPresence = worldWorks > 0 ? SCALE * selectedWorks.length / worldWorks : null;
      const expectedRta = ownTotals[key] > 0 && worldWorks > 0 && worldTotals[key] > 0
        ? selectedWorks.length * worldTotals[key] / (ownTotals[key] * worldWorks) : null;
      const observedFwci = selectedWorks.map(work => work.fw).filter(Number.isFinite);
      const expectedFwci = observedFwci.length ? observedFwci.reduce((sum, value) => sum + value, 0) / observedFwci.length : null;
      checks.push({ id: `${definition.id}-${key}-arithmetic`, passed: close(cohort.presenceIndex, expectedPresence)
        && close(cohort.specialisationIndex, expectedRta) && close(cohort.fwci, expectedFwci, 0.000500001)
        && cohort.n === selectedWorks.length && cohort.fwciN === observedFwci.length });
      return [key, cohort];
    }));
    checks.push(
      { id: `${definition.id}-unique-topics`, passed: topicIds.length === definition.topicIds.length },
      { id: `${definition.id}-own-partition`, passed: cohorts.p1.n + cohorts.p2.n === selected.length
        && new Set(selected.map(work => work.id)).size === selected.length },
    );
    const limited = missingTopicIds.length > 0 || cohorts.p2.n < 20 || cohorts.p2.presenceIndex == null || cohorts.p2.specialisationIndex == null
      || cohorts.p2.fwciCoverage == null || cohorts.p2.fwciCoverage < 0.7;
    return { id: definition.id, name: structuredClone(definition.name), note: structuredClone(definition.note),
      topicIds, topics: topicIds.map(id => ({ id, name: taxonomy.get(id)?.name ?? null,
        role: INDUSTRY_TOPIC_ROLES[id] ?? null, basis: INDUSTRY_TOPIC_BASIS[id] == null ? null : structuredClone(INDUSTRY_TOPIC_BASIS[id]),
        subfield: taxonomy.get(id)?.subfield ?? null, sourceURL: reviewedTopics.get(id)?.sourceURL ?? null,
        checkedAt: reviewedTopics.get(id)?.checkedAt ?? null })),
      coverage: { declaredTopics: topicIds.length, availableTopics: topicIds.length - missingTopicIds.length, missingTopicIds },
      cohorts, change: {
        presenceIndex: change(ratio(cohorts.p2.n, cohorts.p2.worldWorks), ratio(cohorts.p1.n, cohorts.p1.worldWorks)),
        ownWorks: change(cohorts.p2.n, cohorts.p1.n), worldWorks: change(cohorts.p2.worldWorks, cohorts.p1.worldWorks),
        worldShareChange: change(ratio(cohorts.p2.worldWorks, worldTotals.p2), ratio(cohorts.p1.worldWorks, worldTotals.p1)),
      },
      fwciDifferenceCI95: bootstrapDifferenceCI95(selectedByPeriod.p1.map(work => work.fw), selectedByPeriod.p2.map(work => work.fw), { seed: stableSeed(`industry:${definition.id}:difference`) }),
      status: limited ? 'limited' : 'descriptive',
      limitations: [...INDUSTRY_SCOPE_LIMITATIONS],
    };
  });
  const core = scopes.find(scope => scope.id === 'core'), extended = scopes.find(scope => scope.id === 'extended');
  let sensitivity = null;
  if (core && extended) {
    checks.push({ id: 'core-subset-of-extended', passed: core.topicIds.every(id => extended.topicIds.includes(id)) });
    const a = core.cohorts.p2, b = extended.cohorts.p2;
    const subtract = (recent, base) => Number.isFinite(recent) && Number.isFinite(base) ? round(recent - base) : null;
    sensitivity = { coreId: core.id, extendedId: extended.id,
      recentPresenceRatio: round(ratio(b.presenceIndex, a.presenceIndex)),
      recentPresenceDifference: subtract(b.presenceIndex, a.presenceIndex),
      recentWorksAdded: b.n - a.n, recentFwciDifference: subtract(b.fwci, a.fwci) };
  }
  return { schema: 1, scopeVersion: INDUSTRY_SCOPE_VERSION, fetchedAt: snapshot.fetchedAt ?? null,
    totalWorks: retained.length, period: structuredClone(period), scale: SCALE, counting: 'full',
    worldTotals, ownTotals, scopes, sensitivity, checks };
}
