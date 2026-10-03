import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndustryIndex } from '../src/lib/industry-index.mjs';
import { INDUSTRY_SCOPES, INDUSTRY_SCOPE_EXCLUSIONS, INDUSTRY_TOPIC_BASIS, INDUSTRY_TOPIC_REVIEWS } from '../content/industry-scope.mjs';

const period = { from: 2016, to: 2025, p1: [2016, 2020], p2: [2021, 2025] };
const definitions = [
  { id: 'core', name: { ru: 'Ядро', en: 'Core' }, note: { ru: 'Прокси', en: 'Proxy' }, topicIds: ['T10188', 'T11451'] },
  { id: 'extended', name: { ru: 'Шире', en: 'Extended' }, note: { ru: 'Смежное', en: 'Adjacent' }, topicIds: ['T10188', 'T11451', 'T10377'] },
];
const work = (id, tp, y, fw = null, extras = {}) => ({ id, tp, y, fw, p: null, t10: 0, t1: 0, co: ['RU'], c: 0, lead: 1, oa: 0, ...extras });
function fixture(works = []) {
  return { fetchedAt: '2026-10-03T00:00:00Z', config: { period },
    taxonomy: { topics: ['T10188', 'T11451', 'T10377', 'Tother'].map(id => ({ id, name: id, subfield: 2210 })) },
    world: { topics: { T10188: [10, 20], T11451: [10, 20], T10377: [30, 60], Tother: [100, 200] },
      byYear: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2016 + i, i < 5 ? 200 : 400])) },
    stankin: { works } };
}
const build = (snapshot, scopes = definitions) => buildIndustryIndex(snapshot, { scopes });
const failed = output => output.checks.filter(check => !check.passed).map(check => check.id);

test('presence per 10,000, specialisation and citation impact are separate quantities', () => {
  const snapshot = fixture([
    work('old', 'T10188', 2016, 2), work('old-out', 'Tother', 2020, 0),
    work('recent1', 'T10188', 2021, 0), work('recent2', 'T11451', 2025, 2),
    work('recent-out', null, 2025, null),
  ]), before = structuredClone(snapshot), result = build(snapshot), core = result.scopes[0];
  assert.equal(result.scale, 10000); assert.equal(result.counting, 'full');
  assert.deepEqual(result.ownTotals, { p1: 2, p2: 3 }); assert.deepEqual(result.worldTotals, { p1: 1000, p2: 2000 });
  assert.equal(core.cohorts.p1.n, 1); assert.equal(core.cohorts.p1.worldWorks, 20);
  assert.equal(core.cohorts.p1.presenceIndex, 500); assert.equal(core.cohorts.p2.presenceIndex, 500);
  assert.equal(core.cohorts.p1.specialisationIndex, 25);
  assert.ok(Math.abs(core.cohorts.p2.specialisationIndex - 33.333333) < 0.000001);
  assert.equal(core.change.presenceIndex, 0); assert.equal(core.change.ownWorks, 1); assert.equal(core.change.worldWorks, 1);
  assert.equal(core.change.worldShareChange, 0); assert.equal(core.cohorts.p2.fwci, 1);
  assert.equal(core.cohorts.p2.fwciWithoutHighest, 0); assert.equal(core.cohorts.p2.highestFwciWorkId, 'recent2');
  assert.equal(core.cohorts.p2.fwciMedian, 1); assert.equal(core.cohorts.p2.incompleteWindowWorks, 1);
  assert.deepEqual(core.cohorts.p2.workIds, ['recent1', 'recent2']);
  assert.ok(!Object.hasOwn(core, 'rank')); assert.ok(!Object.hasOwn(core, 'score')); assert.ok(!Object.hasOwn(core, 'educationQuality'));
  assert.deepEqual(failed(result), []); assert.deepEqual(snapshot, before);
});

test('nested scopes use disjoint primary topics within each union and are not added together', () => {
  const snapshot = fixture([work('one', 'T10188', 2021, 1), work('two', 'T10377', 2021, 2), work('other', 'Tother', 2021, 100)]);
  const result = build(snapshot), [core, extended] = result.scopes;
  assert.equal(core.cohorts.p2.n, 1); assert.equal(extended.cohorts.p2.n, 2);
  assert.equal(core.cohorts.p2.worldWorks, 40); assert.equal(extended.cohorts.p2.worldWorks, 100);
  assert.deepEqual(extended.cohorts.p2.workIds, ['one', 'two']);
  assert.equal(result.sensitivity.recentWorksAdded, 1); assert.equal(result.sensitivity.recentPresenceRatio, 0.8);
  assert.equal(result.sensitivity.recentPresenceDifference, -50); assert.equal(result.sensitivity.recentFwciDifference, 0.5);
  assert.deepEqual(failed(result), []);
  const duplicate = structuredClone(definitions); duplicate[0].topicIds.push('T10188');
  const flagged = build(snapshot, duplicate);
  assert.equal(flagged.scopes[0].cohorts.p2.n, 1); assert.equal(flagged.scopes[0].cohorts.p2.worldWorks, 40);
  assert.ok(failed(flagged).includes('core-unique-topics'));
});

test('partial world counts suppress indices rather than silently shrinking the denominator', () => {
  const snapshot = fixture([work('one', 'T10188', 2021, 1)]);
  snapshot.world.topics.T11451 = [10, null];
  const result = build(snapshot), core = result.scopes[0];
  assert.equal(core.cohorts.p1.worldWorks, 20); assert.equal(core.cohorts.p2.worldWorks, null);
  assert.equal(core.cohorts.p2.presenceIndex, null); assert.equal(core.cohorts.p2.specialisationIndex, null);
  assert.equal(core.cohorts.p2.n, 1); assert.equal(core.cohorts.p2.fwci, 1);
  assert.deepEqual(core.coverage.missingTopicIds, ['T11451']); assert.equal(core.status, 'limited');
  assert.equal(core.change.presenceIndex, null); assert.equal(core.change.worldShareChange, null);
  delete snapshot.taxonomy.topics[1]; snapshot.taxonomy.topics = snapshot.taxonomy.topics.filter(Boolean);
  assert.equal(build(snapshot).scopes[0].cohorts.p1.worldWorks, null);
  assert.deepEqual(failed(result), []);
});

test('zero bases distinguish no publications, undefined change and zero impact', () => {
  const snapshot = fixture([work('zero', 'T10188', 2021, 0)]);
  let core = build(snapshot).scopes[0];
  assert.equal(core.cohorts.p1.presenceIndex, 0); assert.equal(core.cohorts.p1.specialisationIndex, null);
  assert.equal(core.change.presenceIndex, null); assert.equal(core.change.ownWorks, null);
  assert.equal(core.cohorts.p2.fwci, 0); assert.equal(core.cohorts.p2.fwciMedian, 0);
  assert.equal(core.cohorts.p2.fwciWithoutHighest, null); assert.equal(core.cohorts.p2.top3FwciSumShare, null);
  snapshot.world.topics.T10188 = [0, 0]; snapshot.world.topics.T11451 = [0, 0];
  core = build(snapshot).scopes[0];
  assert.equal(core.cohorts.p1.presenceIndex, null); assert.equal(core.cohorts.p2.presenceIndex, null);
  assert.equal(core.cohorts.p2.specialisationIndex, null);
  assert.ok(!JSON.stringify(core).includes('Infinity'));
});

test('missing FWCI and percentile measurements have honest denominators and no fabricated zeros', () => {
  const snapshot = fixture([
    work('zero', 'T10188', 2021, 0, { p: 0.9, t10: 0 }),
    work('two', 'T10188', 2022, 2, { p: 0.99, t10: 1 }),
    work('missing', 'T11451', 2023, null),
  ]), core = build(snapshot).scopes[0], recent = core.cohorts.p2;
  assert.equal(recent.fwci, 1); assert.equal(recent.fwciN, 2); assert.equal(recent.fwciCoverage, 0.667);
  assert.equal(recent.top10, 0.5); assert.equal(recent.top10N, 2); assert.equal(recent.top10Count, 1);
  assert.equal(recent.top10CI95.n, 2); assert.equal(recent.top10CI95.successes, 1);
  assert.equal(recent.fwciCI95.status, 'limited'); assert.equal(recent.fwciWithoutHighest, 0);
  assert.equal(core.status, 'limited');
  const empty = build(fixture([work('missing', 'T10188', 2021, null)])).scopes[0].cohorts.p2;
  assert.equal(empty.fwci, null); assert.equal(empty.fwciN, 0); assert.equal(empty.fwciMedian, null);
});

test('bootstrap intervals are deterministic and outlier sensitivity leaves the original corpus intact', () => {
  const works = Array.from({ length: 20 }, (_, i) => work(`old-${i}`, 'T10188', 2016, 1));
  works.push(...Array.from({ length: 20 }, (_, i) => work(`new-${i}`, 'T10188', 2021, i === 0 ? 21 : 1)));
  const snapshot = fixture(works), before = structuredClone(snapshot), a = build(snapshot), b = build(snapshot);
  assert.deepEqual(a.scopes[0].cohorts.p2.fwciCI95, b.scopes[0].cohorts.p2.fwciCI95);
  const core = a.scopes[0]; assert.equal(core.status, 'descriptive');
  assert.equal(core.cohorts.p2.fwci, 2); assert.equal(core.cohorts.p2.fwciMedian, 1);
  assert.equal(core.cohorts.p2.fwciWithoutHighest, 1); assert.equal(core.cohorts.p2.fwciN, 20);
  assert.equal(core.cohorts.p2.fwciCI95.status, 'ok'); assert.equal(core.fwciDifferenceCI95.status, 'ok');
  assert.deepEqual(snapshot, before);
});

test('documented scope uses verified machining core and excludes erosion/fossil-fuel/mineral clusters', () => {
  const core = INDUSTRY_SCOPES.find(scope => scope.id === 'core'), extended = INDUSTRY_SCOPES.find(scope => scope.id === 'extended');
  assert.deepEqual(core.topicIds, ['T10188', 'T11451']); assert.equal(extended.topicIds.length, 17);
  assert.ok(core.topicIds.every(id => extended.topicIds.includes(id)));
  assert.ok(INDUSTRY_SCOPE_EXCLUSIONS.every(topic => !extended.topicIds.includes(topic.id)));
  assert.ok(!core.topicIds.includes('T11301')); assert.ok(extended.topicIds.includes('T11301'));
  assert.match(INDUSTRY_TOPIC_BASIS.T11301.en, /microelectronics/);
  assert.ok(extended.topicIds.every(id => INDUSTRY_TOPIC_BASIS[id]?.ru && INDUSTRY_TOPIC_BASIS[id]?.en));
  assert.equal(INDUSTRY_TOPIC_REVIEWS.length, 4);
  assert.ok(INDUSTRY_TOPIC_REVIEWS.every(topic => topic.sourceURL === `https://api.openalex.org/topics/${topic.id}` && topic.checkedAt === '2026-10-03'));
  assert.equal(INDUSTRY_TOPIC_REVIEWS.find(topic => topic.id === 'T12092').decision, 'excluded');
});

test('missing annual world totals affect specialisation while topic presence stays measurable', () => {
  const snapshot = fixture([work('recent', 'T10188', 2021, 1)]);
  delete snapshot.world.byYear[2022];
  const result = build(snapshot), recent = result.scopes[0].cohorts.p2;
  assert.equal(result.worldTotals.p2, null); assert.equal(recent.presenceIndex, 250);
  assert.equal(recent.specialisationIndex, null); assert.equal(result.scopes[0].status, 'limited');
  assert.equal(result.scopes[0].change.worldShareChange, null);
});

test('period boundaries, duplicate source works and invalid measurements are audited', () => {
  const snapshot = fixture([work('first', 'T10188', 2016, 1), work('last-p1', 'T10188', 2020, 1),
    work('first-p2', 'T10188', 2021, 1), work('last', 'T10188', 2025, 1), work('outside', 'T10188', 2026, 1)]);
  let result = build(snapshot); assert.equal(result.totalWorks, 4);
  assert.equal(result.scopes[0].cohorts.p1.n, 2); assert.equal(result.scopes[0].cohorts.p2.n, 2);
  assert.deepEqual(failed(result), []);
  snapshot.stankin.works.push({ ...snapshot.stankin.works[0] }); snapshot.stankin.works[1].fw = Infinity;
  result = build(snapshot); assert.ok(failed(result).includes('unique-retained-works'));
  assert.ok(failed(result).includes('valid-measurements'));
});
