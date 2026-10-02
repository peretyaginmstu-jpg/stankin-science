// Publication evidence for choosing a PISH topic. Pure functions, without a funding
// score: research output does not establish technology readiness or customer demand.
import { summarize, summarizeCohort } from './metrics.mjs';
import { BOOTSTRAP_ITERATIONS, BOOTSTRAP_MIN_N, bootstrapMeanCI95, bootstrapDifferenceCI95, stableSeed, wilsonCI95 } from './stats.mjs';

export const PISH_CANDIDATE_COMPETENCIES = Object.freeze({
  ai: Object.freeze(['ai-data']),
  adaptive: Object.freeze(['machining', 'metrology-quality', 'coatings-tribology']),
  tooling: Object.freeze(['coatings-tribology', 'ceramics-composites', 'metals-alloys', 'additive-manufacturing']),
});

const inPeriod = (year, range) => Array.isArray(range) && year >= range[0] && year <= range[1];
const ratio = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;
const rounded = (value, digits = 6) => Number.isFinite(value) ? Math.round(value * 10 ** digits) / 10 ** digits : null;
const limited = (cohort) => cohort.n < 20 || cohort.fwciCoverage == null || cohort.fwciCoverage < 0.7;
const fwciSummary = (works, home) => {
  const { n, fwci, fwciN } = summarize(works, { home });
  return { n, fwci, fwciN };
};

function cohortStatistics(works, key) {
  const percentiles = works.filter((work) => Number.isFinite(work.p));
  const top10 = percentiles.reduce((sum, work) => sum + (work.t10 ?? 0), 0);
  return {
    fwciCI95: bootstrapMeanCI95(works.map((work) => work.fw), { seed: stableSeed(key) }),
    top10CI95: wilsonCI95(top10, percentiles.length),
  };
}

function influence(works, home) {
  const available = works.filter((work) => Number.isFinite(work.fw)).sort((a, b) => b.fw - a.fw || String(a.id).localeCompare(String(b.id)));
  const sumFwci = available.reduce((sum, work) => sum + work.fw, 0);
  const max = available[0];
  const top3 = available.slice(0, 3);
  // Remove exactly one observation, even if an upstream dataset contains duplicates.
  const withoutMax = max ? works.filter((_, index) => index !== works.indexOf(max)) : works;
  const omitted = fwciSummary(withoutMax, home);
  const originalMean = available.length ? sumFwci / available.length : null;
  const omittedMean = max && available.length > 1 ? (sumFwci - max.fw) / (available.length - 1) : null;
  return {
    n: works.length,
    fwciN: available.length,
    sumFwci: available.length ? rounded(sumFwci) : null,
    maxWork: max ? { id: max.id, fwci: max.fw, shareOfFwciSum: rounded(ratio(max.fw, sumFwci)) } : null,
    withoutMax: omitted,
    meanChangeWithoutMax: originalMean != null && omittedMean != null ? rounded(omittedMean - originalMean) : null,
    top3: { n: top3.length, workIds: top3.map((work) => work.id), shareOfFwciSum: rounded(ratio(top3.reduce((sum, work) => sum + work.fw, 0), sumFwci)) },
  };
}

function auditDataset(snapshot, model, works, rows) {
  const period = snapshot.config.period;
  const taxonomy = new Set(snapshot.taxonomy.topics.map((topic) => topic.id));
  const memberships = new Map();
  for (const source of model.competencies ?? []) for (const topicId of source.topicIds ?? []) memberships.set(topicId, (memberships.get(topicId) ?? 0) + 1);
  const ids = new Set();
  let duplicateRecords = 0;
  for (const work of works) { if (ids.has(work.id)) duplicateRecords += 1; ids.add(work.id); }
  const count = (filter) => works.filter(filter).length;
  const sumYears = (range) => Object.entries(snapshot.world.byYear ?? {}).reduce((sum, [year, n]) => sum + (inPeriod(Number(year), range) && Number.isFinite(n) ? n : 0), 0);
  const worldP1 = sumYears(period.p1);
  const worldP2 = sumYears(period.p2);
  const nP1 = count((work) => inPeriod(work.y, period.p1));
  const nP2 = count((work) => inPeriod(work.y, period.p2));
  const classified = count((work) => taxonomy.has(work.tp));
  const assigned = count((work) => memberships.has(work.tp));
  const worldClassified = Object.values(snapshot.world.topics).reduce((sum, [p1, p2]) => sum + p1 + p2, 0);
  const snapshotYear = Number(String(snapshot.fetchedAt ?? '').slice(0, 4));
  const close = (a, b, tolerance = 0.00051) => a == null && b == null || Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
  const checks = [
    { id: 'unique-work-ids', passed: duplicateRecords === 0 },
    { id: 'disjoint-competency-topics', passed: [...memberships.values()].every((n) => n === 1) },
    { id: 'own-total-and-cohorts', passed: model.totals.n === works.length && model.totals.nP1 === nP1 && model.totals.nP2 === nP2 && nP1 + nP2 === works.length },
    { id: 'world-denominators', passed: model.totals.worldP1 === worldP1 && model.totals.worldP2 === worldP2 && model.totals.worldTotal === worldP1 + worldP2 },
    { id: 'pooled-classified-denominator', passed: model.totals.classified === classified && model.totals.worldClassified === worldClassified },
    { id: 'assigned-work-total', passed: model.coverage?.assignedWorks === assigned && rows.reduce((sum, row) => sum + row.n, 0) === assigned },
  ];
  for (const row of rows) {
    const source = model.competencies.find((entry) => entry.id === row.id);
    const topicIds = new Set(source.topicIds ?? []);
    const selected = works.filter((work) => topicIds.has(work.tp));
    const raw = (list) => {
      const fwci = list.filter((work) => Number.isFinite(work.fw));
      const pct = list.filter((work) => Number.isFinite(work.p));
      return { n: list.length, fwciN: fwci.length, pctN: pct.length, fwci: fwci.length ? fwci.reduce((sum, work) => sum + work.fw, 0) / fwci.length : null, top10: pct.length ? pct.reduce((sum, work) => sum + (work.t10 ?? 0), 0) / pct.length : null };
    };
    const pooled = raw(selected);
    const p1 = raw(selected.filter((work) => inPeriod(work.y, period.p1)));
    const p2 = raw(selected.filter((work) => inPeriod(work.y, period.p2)));
    const world = [...topicIds].reduce((sum, topicId) => {
      const [a, b] = snapshot.world.topics[topicId] ?? [0, 0];
      return [sum[0] + a, sum[1] + b];
    }, [0, 0]);
    const shareRatio = ratio(ratio(world[1], worldP2), ratio(world[0], worldP1));
    checks.push({ id: `competency-${row.id}`, passed:
      source.n === pooled.n && source.fwciN === pooled.fwciN && close(source.fwci, pooled.fwci)
      && row.cohorts.p1.n === p1.n && row.cohorts.p2.n === p2.n
      && row.cohorts.p1.fwciN === p1.fwciN && row.cohorts.p2.fwciN === p2.fwciN
      && row.cohorts.p1.pctN === p1.pctN && row.cohorts.p2.pctN === p2.pctN
      && close(row.cohorts.p1.fwci, p1.fwci) && close(row.cohorts.p2.fwci, p2.fwci)
      && close(row.cohorts.p1.top10, p1.top10) && close(row.cohorts.p2.top10, p2.top10)
      && source.worldP1 === world[0] && source.worldP2 === world[1]
      && close(row.worldShareChange, shareRatio == null ? null : shareRatio - 1, 0.000001),
    });
  }
  const datasetQuality = {
    retainedWorks: works.length, uniqueWorkIds: ids.size, duplicateRecords,
    outOfPeriodRecords: snapshot.stankin.works.length - works.length,
    ownP1: nP1, ownP2: nP2, worldP1, worldP2,
    classifiedWorks: classified, assignedWorks: assigned, unassignedWorks: classified - assigned, unclassifiedWorks: works.length - classified,
    worldClassifiedWorks: worldClassified,
    nominalFourYearWindowIncompleteWorks: Number.isInteger(snapshotYear) && snapshotYear > 1900 ? count((work) => work.y + 3 >= snapshotYear) : null,
    missingFwci: count((work) => work.fw == null),
    invalidFwci: count((work) => work.fw != null && (!Number.isFinite(work.fw) || work.fw < 0)),
    missingPercentile: count((work) => work.p == null),
    invalidPercentile: count((work) => work.p != null && (!Number.isFinite(work.p) || work.p < 0 || work.p > 1)),
    invalidTop10Indicator: count((work) => Number.isFinite(work.p) && work.t10 !== 0 && work.t10 !== 1),
    top10PercentileDisagreementsAwayFromBoundary: count((work) => Number.isFinite(work.p) && (work.p > 0.9005 && work.t10 === 0 || work.p < 0.8995 && work.t10 === 1)),
    top10RoundedBoundaryCases: count((work) => Number.isFinite(work.p) && Math.abs(work.p - 0.9) <= 0.0005),
    top1PercentileDisagreementsAwayFromBoundary: count((work) => Number.isFinite(work.p) && (work.p > 0.9905 && work.t1 === 0 || work.p < 0.9895 && work.t1 === 1)),
    pooledAtOrAboveWorldRecentBelowWorld: rows.filter((row) => model.competencies.find((source) => source.id === row.id)?.fwci >= 1 && row.cohorts.p2.fwci != null && row.cohorts.p2.fwci < 1).map((row) => row.id),
    differenceIntervalsIncludingZero: rows.filter((row) => row.fwciDifferenceCI95.status === 'ok' && row.fwciDifferenceCI95.lower <= 0 && row.fwciDifferenceCI95.upper >= 0).map((row) => row.id),
    groups: rows.length,
    limitedGroups: rows.filter((row) => row.limited).map((row) => row.id),
  };
  const findings = [];
  if (checks.some((check) => !check.passed)) findings.push('A numerical consistency check failed; inspect checks before using the recommendation.');
  if (datasetQuality.invalidFwci || datasetQuality.invalidPercentile || datasetQuality.invalidTop10Indicator) findings.push('Invalid measurement values are present; coverage and intervals require source review.');
  findings.push('Pooled citation impact and recent-cohort citation impact have different meanings; pooled strength labels cannot establish improving recent influence.');
  findings.push('FWCI already normalises publication year, document type and subfield over the publication year plus three following years. Four-year windows ending in or after the snapshot year remain nominally incomplete; normalisation does not justify explaining all cohort differences by age alone.');
  findings.push('All confidence intervals are conditional descriptive intervals under publication-level independence. They do not correct affiliation errors, topic assignment errors, shared authorship or residual differences in citation exposure.');
  findings.push('Twenty competency contrasts are exploratory and unadjusted for multiple comparisons. No significance ranking or investment decision is inferred.');
  return {
    version: 1,
    methods: { level: 0.95, bootstrapIterations: BOOTSTRAP_ITERATIONS, bootstrapMinN: BOOTSTRAP_MIN_N, bootstrapSeed: 'FNV-1a of competency ID and cohort; Mulberry32 RNG; sorted finite values; linearly interpolated percentile bounds', meanDifference: 'mean(p2) - mean(p1), independently resampled cohorts', top10: 'Wilson score interval with z = 1.959963984540054; denominator: available percentiles; provider top-10 flag preserved rather than inferred from rounded percentile', simultaneousInference: false, fwciDefinitionSource: 'https://help.openalex.org/data/works/citations/', wilsonDefinitionSource: 'https://www.itl.nist.gov/div898/handbook/prc/section2/prc241.htm' },
    datasetQuality, checks, findings,
  };
}

// Candidate competencies may overlap across candidates. Within each candidate, a
// publication is counted once even if topic sets overlap or records are duplicated.
function candidateEvidence(works, rows, period) {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return Object.fromEntries(Object.entries(PISH_CANDIDATE_COMPETENCIES).map(([candidate, ids]) => {
    const topicIds = new Set(ids.flatMap((id) => byId.get(id)?.topicIds ?? []));
    const union = new Map();
    for (const work of works) {
      if (topicIds.has(work.tp) && !union.has(work.id)) union.set(work.id, work);
    }
    const selected = [...union.values()];
    return [candidate, { n: selected.length, nP2: selected.filter((work) => inPeriod(work.y, period.p2)).length }];
  }));
}

/** The cohort periods, topic assignments and world denominators match buildModel().
 * FWCI normalises publication year, type and subfield, with a four-year window.
 * Windows ending in/after the snapshot year are incomplete; cohort comparisons
 * remain descriptive rather than causal, without assuming age explains them all.
 */
export function buildPishModel(snapshot, model) {
  const period = snapshot.config.period;
  const home = model.meta?.home ?? 'RU';
  const sourceRows = model.competencies ?? [];
  const works = snapshot.stankin.works.filter((work) => work.y >= period.from && work.y <= period.to);
  const rows = sourceRows.map((source) => {
    const topicIds = new Set(source.topicIds ?? []);
    const list = works.filter((work) => topicIds.has(work.tp));
    const listP1 = list.filter((work) => inPeriod(work.y, period.p1));
    const listP2 = list.filter((work) => inPeriod(work.y, period.p2));
    const baseCohorts = source.cohorts ?? {
      p1: summarizeCohort(listP1, { home }),
      p2: summarizeCohort(listP2, { home }),
    };
    const cohorts = {
      p1: { ...baseCohorts.p1, ...cohortStatistics(listP1, `${source.id}:p1`) },
      p2: { ...baseCohorts.p2, ...cohortStatistics(listP2, `${source.id}:p2`) },
    };
    const worldShareP1 = ratio(source.worldP1, model.totals?.worldP1);
    const worldShareP2 = ratio(source.worldP2, model.totals?.worldP2);
    const worldShareRatio = ratio(worldShareP2, worldShareP1);
    return {
      id: source.id,
      n: source.n,
      cohorts,
      worldShareChange: worldShareRatio == null ? null : rounded(worldShareRatio - 1),
      worldP1: source.worldP1 ?? null,
      worldP2: source.worldP2 ?? null,
      limited: limited(cohorts.p1) || limited(cohorts.p2),
      fwciDifferenceCI95: bootstrapDifferenceCI95(listP1.map((work) => work.fw), listP2.map((work) => work.fw), { seed: stableSeed(`${source.id}:difference`) }),
      influence: influence(list, home),
    };
  });

  const competencyId = 'coatings-tribology';
  const topicId = 'T10626';
  const coatingTopics = new Set(sourceRows.find((row) => row.id === competencyId)?.topicIds ?? []);
  const coatingWorks = works.filter((work) => coatingTopics.has(work.tp));
  const sensitivity = {
    competencyId,
    topicId,
    topicName: snapshot.taxonomy.topics.find((topic) => topic.id === topicId)?.name ?? null,
    all: fwciSummary(coatingWorks, home),
    withoutTopic: fwciSummary(coatingWorks.filter((work) => work.tp !== topicId), home),
    selectedTopic: fwciSummary(coatingWorks.filter((work) => work.tp === topicId), home),
  };

  return {
    fetchedAt: snapshot.fetchedAt ?? null,
    period,
    totalWorks: model.totals?.n ?? works.length,
    excludedWorks: snapshot.stankin.affiliationAudit?.excluded ?? null,
    rows,
    sensitivity,
    candidateEvidence: candidateEvidence(works, sourceRows, period),
    mathAudit: auditDataset(snapshot, model, works, rows),
    limitations: [
      'Cohorts describe publication years at one snapshot date. FWCI already normalises year, type and subfield over publication year plus three following years; windows ending in or after the snapshot year remain nominally incomplete. Differences in FWCI do not establish a causal change in research performance.',
      'FWCI measures normalised citation performance, not research quality. Its mean can be sensitive to a few highly cited works; the median and topic sensitivity supplement the unchanged full-corpus mean.',
      'Rows include all configured competencies. A cohort with fewer than 20 works or less than 70% FWCI coverage is marked limited; this flag is descriptive, not a statistical confidence interval.',
      'World share change is relative to the total world publication flow for the same periods and document types. Topic groups may include applications outside machine tools.',
      'Candidate publication unions describe a research foundation, not technology readiness, staff availability, partner commitments or a contest score. Publications may contribute to more than one candidate.',
      'The topic exclusion is a sensitivity calculation only. It does not alter the original snapshot, competency assignments or displayed full-corpus totals.',
      'Bootstrap and Wilson intervals assume independent publication records and are descriptive. They do not compensate for affiliation errors, topic-rule errors, dependence among works or different citation exposure; multiple group comparisons are exploratory and unadjusted.',
    ],
  };
}
