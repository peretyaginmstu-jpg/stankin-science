import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWorldTrends } from '../src/lib/world-trends.mjs';

const period = { from: 2016, to: 2025, p1: [2016, 2020], p2: [2021, 2025] };
const work = (id, y, fw) => ({ id, y, tp: 'T10188', fw });
function fixture() {
  const snapshot = { fetchedAt: '2026-10-03T00:00:00Z', config: { period },
    taxonomy: { topics: [{ id: 'T10188', name: 'Machining primary cluster' }, { id: 'Tother', name: 'Other' }] },
    world: { topics: { T10188: [10, 20], Tother: [1, 1] },
      byYear: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2016 + i, i < 5 ? 200 : 400])) },
    stankin: { works: [work('old', 2016, 9), work('zero', 2021, 0), work('two', 2025, 2)] } };
  const model = { totals: { n: 3, worldP1: 1000, worldP2: 2000 },
    competencies: [{ id: 'machining', topicIds: ['T10188'] }, { id: 'other', topicIds: ['Tother'] }],
    explorer: { totalWorks: 3, worldTotals: { p1: 1000, p2: 2000 }, groups: [], topics: [{
      id: 'T10188', name: { ru: 'Обработка', en: 'Machining' }, nP1: 1, nP2: 2,
      worldP1: 10, worldP2: 20, worldShareChange: 0, ownWorldShareChange: 0,
      cohorts: { p1: { n: 1, fwciN: 1, fwci: 9 }, p2: { n: 2, fwciN: 2, fwci: 1 } },
      annual: [{ year: 2016, n: 1 }], workIds: ['old', 'zero', 'two'], questionIds: ['cutting-dynamics'],
    }] } };
  return { snapshot, model };
}
const failed = output => output.checks.filter(check => !check.passed).map(check => check.id);
const source = model => model.explorer.topics[0];
function setWorks(snapshot, model, works, nP1, nP2, fwciP2, fwciN = nP2) {
  snapshot.stankin.works = works; model.totals.n = works.length; model.explorer.totalWorks = works.length;
  source(model).nP1 = nP1; source(model).nP2 = nP2;
  source(model).cohorts = { p1: { n: nP1, fwciN: nP1, fwci: nP1 ? 9 : null },
    p2: { n: nP2, fwciN, fwci: fwciP2 } };
}

test('absolute growth, global topic share and institutional share have distinct denominators', () => {
  const { snapshot, model } = fixture(), beforeSnapshot = structuredClone(snapshot), beforeModel = structuredClone(model);
  const result = buildWorldTrends(snapshot, model), topic = result.topics[0];
  assert.equal(topic.absoluteGrowth, 1);
  assert.equal(topic.worldShareChange, 0);
  assert.equal(topic.worldShareP1, 0.01); assert.equal(topic.worldShareP2, 0.01);
  assert.equal(topic.ownShareP1, 0.1); assert.equal(topic.ownShareP2, 0.1);
  assert.equal(topic.ownWorldShareChange, 0); assert.equal(topic.observation, 'stable');
  assert.equal(topic.recentFwci, 1); assert.equal(topic.recentFwciN, 2); assert.equal(topic.recentFwciCoverage, 1);
  assert.equal(topic.small, true); assert.equal(topic.role, 'process'); assert.equal(topic.direct, true);
  assert.deepEqual(topic.groupIds, ['machining']);
  assert.equal(result.coverage.taxonomyTopics, 2); assert.equal(result.coverage.topicsWithWorldCounts, 2);
  assert.equal(result.coverage.selectedTopics, 1); assert.equal(result.coverage.selectedOwnP1, 1);
  assert.equal(result.coverage.selectedWorldP1, 10); assert.equal(result.coverage.selectedWorldP2, 20);
  assert.ok(!Object.hasOwn(topic, 'annual')); assert.ok(!Object.hasOwn(topic, 'workIds')); assert.ok(!Object.hasOwn(topic, 'score'));
  assert.deepEqual(failed(result), []); assert.deepEqual(snapshot, beforeSnapshot); assert.deepEqual(model, beforeModel);
});

test('normalization uses raw annual global totals and detects stale exported ratios', () => {
  const { snapshot, model } = fixture();
  for (let year = 2021; year <= 2025; year += 1) snapshot.world.byYear[year] = 200;
  const result = buildWorldTrends(snapshot, model);
  assert.equal(result.worldTotals.p2, 1000); assert.equal(result.topics[0].worldShareChange, 1);
  assert.ok(failed(result).includes('world-denominators'));
  assert.ok(failed(result).includes('T10188-normalization'));
});

test('zero world baseline is undefined growth, never infinity or a zero substitute', () => {
  const { snapshot, model } = fixture();
  snapshot.world.topics.T10188 = [0, 20]; source(model).worldP1 = 0;
  setWorks(snapshot, model, [work('recent', 2021, 0)], 0, 1, 0);
  source(model).worldShareChange = null; source(model).ownWorldShareChange = null;
  const topic = buildWorldTrends(snapshot, model).topics[0];
  assert.equal(topic.absoluteGrowth, null); assert.equal(topic.worldShareP1, 0);
  assert.equal(topic.worldShareChange, null); assert.equal(topic.ownShareP1, null);
  assert.equal(topic.observation, 'unknown'); assert.equal(topic.recentFwci, 0);
  assert.ok(!JSON.stringify(topic).includes('Infinity'));
  assert.deepEqual(failed(buildWorldTrends(snapshot, model)), []);
});

test('new own publications and absent primary-topic publications are different from missing data', () => {
  const { snapshot, model } = fixture();
  setWorks(snapshot, model, [work('recent', 2021, 0)], 0, 1, 0);
  source(model).ownWorldShareChange = null;
  let topic = buildWorldTrends(snapshot, model).topics[0];
  assert.equal(topic.observation, 'new'); assert.equal(topic.ownWorldShareChange, null);
  assert.equal(topic.ownShareP1, 0); assert.equal(topic.ownShareP2, 0.05);
  setWorks(snapshot, model, [], 0, 0, null);
  topic = buildWorldTrends(snapshot, model).topics[0];
  assert.equal(topic.observation, 'absent'); assert.equal(topic.ownShareP2, 0);
  assert.equal(topic.recentFwciN, 0); assert.equal(topic.recentFwciCoverage, null);
  delete snapshot.world.topics.T10188;
  Object.assign(source(model), { nP1: null, nP2: null, worldP1: null, worldP2: null, worldShareChange: null, cohorts: null });
  const result = buildWorldTrends(snapshot, model); topic = result.topics[0];
  assert.equal(topic.observation, 'unknown'); assert.equal(topic.nP2, null);
  assert.equal(topic.small, null); assert.equal(topic.ownShareP2, null); assert.equal(topic.worldShareP2, null);
  assert.equal(result.coverage.selectedWorldP1, null); assert.equal(result.coverage.selectedOwnP1, null);
  assert.equal(result.coverage.selectedTopicsWithWorldCounts, 0); assert.equal(result.coverage.topicsWithWorldCounts, 1);
  assert.deepEqual(failed(result), []);
});

test('complete recent decline and zero world denominator do not invent own share change', () => {
  const { snapshot, model } = fixture();
  setWorks(snapshot, model, [work('old', 2016, 9)], 1, 0, null);
  source(model).ownWorldShareChange = -1;
  let topic = buildWorldTrends(snapshot, model).topics[0];
  assert.equal(topic.observation, 'lose'); assert.equal(topic.ownWorldShareChange, -1);
  snapshot.world.topics.T10188 = [10, 0]; source(model).worldP2 = 0;
  source(model).worldShareChange = -1; source(model).ownWorldShareChange = null;
  topic = buildWorldTrends(snapshot, model).topics[0];
  assert.equal(topic.absoluteGrowth, -1); assert.equal(topic.worldShareChange, -1);
  assert.equal(topic.ownShareP2, null); assert.equal(topic.observation, 'unknown');
  assert.deepEqual(failed(buildWorldTrends(snapshot, model)), []);
});

test('own share can rise while publication count stays unchanged', () => {
  const { snapshot, model } = fixture();
  snapshot.world.topics.T10188 = [10, 5];
  Object.assign(source(model), { worldP2: 5, worldShareChange: -0.75, ownWorldShareChange: 1 });
  setWorks(snapshot, model, [work('old', 2016, 9), work('recent', 2021, 2)], 1, 1, 2);
  const topic = buildWorldTrends(snapshot, model).topics[0];
  assert.equal(topic.nP1, topic.nP2); assert.equal(topic.absoluteGrowth, -0.5);
  assert.equal(topic.worldShareChange, -0.75); assert.equal(topic.ownWorldShareChange, 1);
  assert.equal(topic.observation, 'gain'); assert.deepEqual(failed(buildWorldTrends(snapshot, model)), []);
});

test('FWCI uses the recent cohort, preserves zeros and reports measurement coverage', () => {
  const { snapshot, model } = fixture();
  setWorks(snapshot, model, [work('old', 2016, 9), work('zero', 2021, 0), work('missing', 2025, null)], 1, 2, 0, 1);
  let result = buildWorldTrends(snapshot, model), topic = result.topics[0];
  assert.equal(topic.recentFwci, 0); assert.equal(topic.recentFwciN, 1); assert.equal(topic.recentFwciCoverage, 0.5);
  assert.deepEqual(failed(result), []);
  source(model).cohorts.p2.fwci = 9;
  result = buildWorldTrends(snapshot, model);
  assert.ok(failed(result).includes('T10188-recent-fwci'));
});

test('missing global year suppresses only global share arithmetic, not measured own topic ratios', () => {
  const { snapshot, model } = fixture();
  delete snapshot.world.byYear[2016];
  model.explorer.worldTotals.p1 = null; model.totals.worldP1 = null; source(model).worldShareChange = null;
  const result = buildWorldTrends(snapshot, model), topic = result.topics[0];
  assert.equal(result.worldTotals.p1, null); assert.equal(topic.absoluteGrowth, 1);
  assert.equal(topic.worldShareP1, null); assert.equal(topic.worldShareChange, null);
  assert.equal(topic.ownShareP1, 0.1); assert.equal(topic.observation, 'stable');
  assert.deepEqual(failed(result), []);
});

test('duplicate topics and corrupted counts are caught before aggregate coverage can be trusted', () => {
  const { snapshot, model } = fixture();
  source(model).nP2 = 3;
  model.explorer.topics.push(structuredClone(source(model)));
  const errors = failed(buildWorldTrends(snapshot, model));
  assert.ok(errors.includes('unique-selected-topics'));
  assert.ok(errors.includes('T10188-own-counts'));
  assert.ok(errors.includes('selected-own-coverage'));
});
