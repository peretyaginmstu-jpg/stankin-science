import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildModel, summarize, summarizeCohort } from '../src/lib/metrics.mjs';
import { buildPishModel } from '../src/lib/pish.mjs';
import { bootstrapMeanCI95, bootstrapDifferenceCI95, stableSeed, wilsonCI95 } from '../src/lib/stats.mjs';

const period = { from: 2000, to: 2003, p1: [2000, 2001], p2: [2002, 2003] };
const work = (id, tp, y, options = {}) => ({
  id, tp, y, fw: null, c: 0, p: null, t10: 0, t1: 0,
  co: ['RU'], in: ['I1'], s: null, oa: 0, lang: 'en', a: [], na: 1, lead: 1, ...options,
});
const groups = [
  ['coatings-tribology', 'Coatings'], ['machining', 'Machining'],
  ['metrology-quality', 'Metrology'], ['ai-data', 'AI'],
  ['ceramics-composites', 'Ceramics'], ['metals-alloys', 'Metals'],
  ['additive-manufacturing', 'Additive'], ['engineering-methods', 'Engineering'],
];
const competencies = groups.map(([id, name]) => ({ id, match: { name: new RegExp(`^${name}`) } }));
const topics = groups.map(([, name], i) => ({ id: `T${i}`, name, subfield: 2209, field: 22, domain: 3 }));
topics.push({ id: 'T10626', name: 'Coatings high-temperature behaviour', subfield: 2209, field: 22, domain: 3 });

function fixture(works = []) {
  return {
    source: 'fixture', fetchedAt: '2026-10-02T00:00:00Z',
    config: { period, institutionIds: ['I1'], types: ['article'] },
    institution: { id: 'I1', ror: 'fixture' }, taxonomy: { topics },
    world: { byYear: { 2000: 100, 2001: 100, 2002: 200, 2003: 200 }, topics: Object.fromEntries(topics.map((topic) => [topic.id, [10, 30]])) },
    stankin: { works, sources: {}, affiliationAudit: { excluded: 3 } },
    institutions: {}, competencies: {},
  };
}
const modelOf = (snapshot) => buildModel(snapshot, { competencies, thresholds: { competencyMinWorks: 15, trendMinWorldWorks: 10, trendFastGrowth: 1.5 } });

test('cohort summaries retain zero and omit non-finite or absent measurements', () => {
  const works = [
    work('W1', 'T0', 2000, { fw: 0, p: 0.95, t10: 1 }),
    work('W2', 'T0', 2000, { fw: 2, p: 0.5 }),
    work('W3', 'T0', 2000, { fw: NaN, p: NaN }),
    work('W4', 'T0', 2000, { fw: Infinity, p: Infinity }),
    work('W5', 'T0', 2000, { fw: '5', p: null }),
    work('W6', 'T0', 2000),
  ];
  const summary = summarizeCohort(works);
  assert.equal(summary.n, 6);
  assert.equal(summary.fwci, 1);
  assert.equal(summary.fwciN, 2);
  assert.equal(summary.fwciMedian, 1);
  assert.equal(summary.fwciCoverage, 0.333);
  assert.equal(summary.top10, 0.5);
  assert.equal(summary.pctN, 2);
  assert.equal(summary.top10Coverage, 0.333);
  assert.deepEqual(summarize(works), Object.fromEntries(Object.entries(summary).filter(([key]) => !['fwciMedian', 'fwciCoverage', 'top10Coverage'].includes(key))));
});

test('cohort empty and missing data do not become zero citation performance', () => {
  const empty = summarizeCohort([]);
  assert.equal(empty.n, 0);
  assert.equal(empty.fwciN, 0);
  assert.equal(empty.pctN, 0);
  for (const key of ['fwci', 'fwciMedian', 'fwciCoverage', 'top10', 'top10Coverage']) assert.equal(empty[key], null, key);
  const absent = summarizeCohort([work('W1', 'T0', 2000)]);
  assert.equal(absent.fwci, null);
  assert.equal(absent.fwciCoverage, 0);
  assert.equal(absent.top10, null);
  assert.equal(absent.top10Coverage, 0);
});

test('buildModel uses configured inclusive cohort boundaries and preserves pooled fields', () => {
  const snapshot = fixture([
    work('out-before', 'T1', 1999, { fw: 100 }),
    work('first', 'T1', 2000, { fw: 1, p: 0.95, t10: 1 }),
    work('p1-last', 'T1', 2001, { fw: 3, p: 0.5 }),
    work('p2-first', 'T1', 2002, { fw: 2, p: 0.5 }),
    work('last', 'T1', 2003, { fw: 4, p: 0.95, t10: 1 }),
    work('out-after', 'T1', 2004, { fw: 100 }),
  ]);
  const model = modelOf(snapshot);
  const row = model.competencies.find((entry) => entry.id === 'machining');
  assert.equal(model.totals.n, 4);
  assert.equal(row.n, 4);
  assert.equal(row.fwci, 2.5);
  assert.equal(row.fwciN, 4);
  assert.equal(row.top10, 0.5);
  assert.equal(row.nP1, 2);
  assert.equal(row.nP2, 2);
  assert.equal(row.cohorts.p1.n, row.nP1);
  assert.equal(row.cohorts.p2.n, row.nP2);
  assert.equal(row.cohorts.p1.fwci, 2);
  assert.equal(row.cohorts.p2.fwci, 3);
  assert.equal(row.cohorts.p1.fwciMedian, 2);
  assert.equal(row.cohorts.p2.fwciCoverage, 1);
  assert.equal(row.cohorts.p1.top10Coverage, 1);
});

test('PISH retains all configured rows and normalises growth by world publication flow', () => {
  const snapshot = fixture([work('W1', 'T1', 2002, { fw: 1 })]);
  const model = modelOf(snapshot);
  const pish = buildPishModel(snapshot, model);
  assert.equal(pish.rows.length, competencies.length);
  assert.ok(pish.rows.some((row) => row.id === 'engineering-methods'));
  const machining = pish.rows.find((row) => row.id === 'machining');
  assert.equal(model.competencies.find((row) => row.id === 'machining').visible, false);
  // Topic volume triples, world flow doubles: relative world share grows by 50%.
  assert.equal(machining.worldShareChange, 0.5);
  assert.equal(machining.limited, true);
  assert.equal(pish.fetchedAt, snapshot.fetchedAt);
  assert.deepEqual(pish.period, period);
  assert.equal(pish.totalWorks, 1);
  assert.equal(pish.excludedWorks, 3);
  assert.ok(pish.limitations.some((text) => text.includes('already normalises year')));
});

test('PISH world growth distinguishes zero recent output from an undefined baseline', () => {
  const snapshot = fixture();
  const model = modelOf(snapshot);
  const machining = model.competencies.find((row) => row.id === 'machining');
  machining.worldP2 = 0;
  assert.equal(buildPishModel(snapshot, model).rows.find((row) => row.id === 'machining').worldShareChange, -1);
  machining.worldP1 = 0;
  assert.equal(buildPishModel(snapshot, model).rows.find((row) => row.id === 'machining').worldShareChange, null);
  machining.worldP1 = 10;
  model.totals.worldP2 = 0;
  assert.equal(buildPishModel(snapshot, model).rows.find((row) => row.id === 'machining').worldShareChange, null);
  delete model.totals.worldP2;
  assert.equal(buildPishModel(snapshot, model).rows.find((row) => row.id === 'machining').worldShareChange, null);
});

test('limited flag considers both cohorts and FWCI availability without inventing a score', () => {
  const snapshot = fixture([
    ...Array.from({ length: 20 }, (_, i) => work(`p1-${i}`, 'T1', 2000, { fw: 1 })),
    ...Array.from({ length: 20 }, (_, i) => work(`p2-${i}`, 'T1', 2002, { fw: i < 14 ? 1 : null })),
  ]);
  assert.equal(buildPishModel(snapshot, modelOf(snapshot)).rows.find((row) => row.id === 'machining').limited, false);
  snapshot.stankin.works.find((entry) => entry.id === 'p2-13').fw = null;
  const row = buildPishModel(snapshot, modelOf(snapshot)).rows.find((entry) => entry.id === 'machining');
  assert.equal(row.limited, true);
  assert.equal(row.cohorts.p2.fwciCoverage, 0.65);
  assert.equal(row.score, undefined);
});

test('candidate evidence uses actual publication-ID unions, including shared topics', () => {
  const snapshot = fixture([
    work('cut', 'T1', 2000), work('measure', 'T2', 2002), work('coat', 'T0', 2002),
    work('ceramic', 'T4', 2002), work('ai', 'T3', 2002),
    work('cut', 'T1', 2000), // Duplicate records cannot inflate a candidate union.
    work('out-of-period', 'T1', 2004),
  ]);
  const model = modelOf(snapshot);
  model.competencies.find((row) => row.id === 'metrology-quality').topicIds.push('T1');
  const before = structuredClone(snapshot);
  const result = buildPishModel(snapshot, model);
  assert.deepEqual(result.candidateEvidence, {
    ai: { n: 1, nP2: 1 }, adaptive: { n: 3, nP2: 2 }, tooling: { n: 2, nP2: 2 },
  });
  assert.deepEqual(snapshot, before);
});

test('coating sensitivity and median expose outliers without changing the corpus or model', () => {
  const snapshot = fixture([
    work('outlier', 'T10626', 2000, { fw: 40 }),
    work('ordinary-1', 'T0', 2001, { fw: 1 }),
    work('ordinary-2', 'T0', 2002, { fw: 1 }),
    work('ordinary-3', 'T0', 2003, { fw: 1 }),
  ]);
  const model = modelOf(snapshot);
  const beforeSnapshot = structuredClone(snapshot);
  const beforeModel = structuredClone(model);
  const result = buildPishModel(snapshot, model);
  assert.deepEqual(result.sensitivity.all, { n: 4, fwci: 10.75, fwciN: 4 });
  assert.deepEqual(result.sensitivity.withoutTopic, { n: 3, fwci: 1, fwciN: 3 });
  assert.deepEqual(result.sensitivity.selectedTopic, { n: 1, fwci: 40, fwciN: 1 });
  assert.equal(result.sensitivity.topicName, 'Coatings high-temperature behaviour');
  assert.equal(summarizeCohort(snapshot.stankin.works).fwciMedian, 1);
  assert.equal(result.totalWorks, 4);
  assert.deepEqual(snapshot, beforeSnapshot);
  assert.deepEqual(model, beforeModel);
});

test('empty snapshot and absent sensitivity topic remain computable', () => {
  const snapshot = fixture();
  snapshot.taxonomy.topics = snapshot.taxonomy.topics.filter((topic) => topic.id !== 'T10626');
  delete snapshot.stankin.affiliationAudit;
  const result = buildPishModel(snapshot, modelOf(snapshot));
  assert.equal(result.totalWorks, 0);
  assert.equal(result.excludedWorks, null);
  assert.equal(result.sensitivity.topicName, null);
  assert.deepEqual(result.sensitivity.all, { n: 0, fwci: null, fwciN: 0 });
  assert.deepEqual(result.candidateEvidence.adaptive, { n: 0, nP2: 0 });
  assert.ok(result.rows.every((row) => row.limited));
});

test('bootstrap intervals are deterministic, permutation invariant and translation equivariant', () => {
  const values = Array.from({ length: 30 }, (_, i) => i / 10);
  const options = { seed: stableSeed('reproducible-fixture') };
  const first = bootstrapMeanCI95(values, options);
  assert.deepEqual(bootstrapMeanCI95(values, options), first);
  assert.deepEqual(bootstrapMeanCI95([...values].reverse(), options), first);
  const shifted = bootstrapMeanCI95(values.map((value) => value + 5), options);
  assert.ok(Math.abs(shifted.lower - first.lower - 5) < 1e-6);
  assert.ok(Math.abs(shifted.upper - first.upper - 5) < 1e-6);
  assert.equal(first.n, 30);
  assert.equal(first.iterations, 2000);
  assert.equal(first.status, 'ok');
  assert.ok(first.lower < first.estimate && first.estimate < first.upper);
  assert.equal(values[0], 0);
  assert.equal(values[29], 2.9);
});

test('bootstrap does not infer an interval from a small or missing FWCI cohort', () => {
  const small = bootstrapMeanCI95([1, 2, NaN, null, Infinity]);
  assert.equal(small.n, 2);
  assert.equal(small.estimate, 1.5);
  assert.equal(small.status, 'limited');
  assert.equal(small.lower, null);
  assert.equal(small.upper, null);
  const empty = bootstrapMeanCI95([null, Infinity]);
  assert.equal(empty.status, 'missing');
  assert.equal(empty.estimate, null);
  const constant = bootstrapMeanCI95(Array(20).fill(0));
  assert.equal(constant.lower, 0);
  assert.equal(constant.upper, 0);
  assert.throws(() => bootstrapMeanCI95([1], { iterations: 1 }), RangeError);
});

test('the independent cohort contrast is p2 minus p1, and preserves absent information', () => {
  const p1 = Array(20).fill(2);
  const p2 = Array(20).fill(5);
  const difference = bootstrapDifferenceCI95(p1, p2, { seed: 17 });
  assert.equal(difference.estimate, 3);
  assert.equal(difference.lower, 3);
  assert.equal(difference.upper, 3);
  assert.equal(difference.nP1, 20);
  assert.equal(difference.nP2, 20);
  assert.equal(bootstrapDifferenceCI95(p1.slice(1), p2).status, 'limited');
  assert.equal(bootstrapDifferenceCI95([], p2).estimate, null);
  assert.equal(bootstrapDifferenceCI95([], p2).status, 'missing');
});

test('Wilson interval matches known values and remains informative at zero or all successes', () => {
  const half = wilsonCI95(5, 10);
  assert.equal(half.estimate, 0.5);
  assert.equal(half.lower, 0.236593);
  assert.equal(half.upper, 0.763407);
  const zero = wilsonCI95(0, 10);
  const all = wilsonCI95(10, 10);
  assert.equal(zero.lower, 0);
  assert.ok(zero.upper > 0);
  assert.equal(all.upper, 1);
  assert.ok(all.lower < 1);
  assert.equal(wilsonCI95(0, 0).status, 'missing');
  assert.equal(wilsonCI95(11, 10).status, 'invalid');
});

test('PISH statistics use available FWCI and percentiles, expose leverage and preserve the model', () => {
  const snapshot = fixture([
    ...Array.from({ length: 20 }, (_, i) => work(`p1-${i}`, 'T0', 2000, { fw: i === 0 ? 100 : 1, p: i < 10 ? 0.95 : null, t10: i < 5 ? 1 : 0 })),
    ...Array.from({ length: 20 }, (_, i) => work(`p2-${i}`, 'T0', 2002, { fw: 1, p: 0.5 })),
  ]);
  const model = modelOf(snapshot);
  const before = structuredClone(model);
  const result = buildPishModel(snapshot, model);
  const row = result.rows.find((entry) => entry.id === 'coatings-tribology');
  assert.equal(row.cohorts.p1.fwciCI95.n, 20);
  assert.equal(row.cohorts.p1.top10CI95.n, 10);
  assert.equal(row.cohorts.p1.top10CI95.successes, 5);
  assert.equal(row.cohorts.p1.top10CI95.lower, 0.236593);
  assert.equal(row.fwciDifferenceCI95.estimate, -4.95);
  assert.equal(row.influence.maxWork.id, 'p1-0');
  assert.equal(row.influence.maxWork.fwci, 100);
  assert.equal(row.influence.withoutMax.fwci, 1);
  assert.equal(row.influence.withoutMax.n, 39);
  assert.equal(row.influence.top3.n, 3);
  assert.ok(row.influence.top3.shareOfFwciSum > 0.7);
  assert.deepEqual(model, before);
  assert.ok(result.mathAudit.checks.every((check) => check.passed));
});

test('the numerical audit flags duplicates, overlapping groups, and corrupted denominators', () => {
  const snapshot = fixture([work('same-id', 'T1', 2000), work('same-id', 'T1', 2000)]);
  const model = modelOf(snapshot);
  model.competencies.find((row) => row.id === 'metrology-quality').topicIds.push('T1');
  model.totals.worldP1 += 1;
  const result = buildPishModel(snapshot, model);
  const checks = new Map(result.mathAudit.checks.map((check) => [check.id, check.passed]));
  assert.equal(checks.get('unique-work-ids'), false);
  assert.equal(checks.get('disjoint-competency-topics'), false);
  assert.equal(checks.get('world-denominators'), false);
  assert.equal(result.mathAudit.datasetQuality.duplicateRecords, 1);
  assert.ok(result.mathAudit.findings.some((finding) => finding.includes('failed')));
});
