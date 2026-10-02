import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildExplorer } from '../src/lib/explorer.mjs';
import { buildModel } from '../src/lib/metrics.mjs';
import { buildPishModel } from '../src/lib/pish.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';

const period = { from: 2016, to: 2025, p1: [2016, 2020], p2: [2021, 2025] };
const competencies = [
  { id: 'machining', match: { name: /^Cutting/ } },
  { id: 'coatings-tribology', match: { name: /^Coating/ } },
  { id: 'ai-data', match: { name: /^AI/ } },
];
const taxonomy = [
  { id: 'T10188', name: 'Cutting processes', subfield: 2209, field: 22, domain: 3 },
  { id: 'Tcut2', name: 'Cutting dynamics', subfield: 2209, field: 22, domain: 3 },
  { id: 'T10377', name: 'Coating mechanics', subfield: 2209, field: 22, domain: 3 },
  { id: 'Tai', name: 'AI analysis', subfield: 2209, field: 22, domain: 3 },
  { id: 'Tother', name: 'Unassigned', subfield: 2209, field: 22, domain: 3 },
];
const work = (id, tp, y, options = {}) => ({ id, tp, y, t: `Paper ${id}`, doi: null, fw: null, c: 0,
  p: null, t10: 0, t1: 0, co: ['RU'], in: ['I1'], s: null, oa: 0, lang: 'en', a: [], na: 1, lead: 1, ...options });

function fixture(works = []) {
  return {
    source: 'fixture', fetchedAt: '2026-10-03T00:00:00Z',
    config: { period, institutionIds: ['I1'], types: ['article'] },
    institution: { id: 'I1', ror: 'fixture' }, taxonomy: { topics: structuredClone(taxonomy) },
    world: { byYear: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [2016 + i, i < 5 ? 100 : 200])),
      topics: Object.fromEntries(taxonomy.map(topic => [topic.id, [10, 30]])) },
    stankin: { works, sources: {} }, institutions: {}, competencies: {},
  };
}

function modelOf(snapshot, groups = competencies) {
  const model = buildModel(snapshot, { competencies: groups, thresholds: { competencyMinWorks: 15, trendMinWorldWorks: 10, trendFastGrowth: 1.5 } });
  model.industrialTopics = [{ id: 'T10188', name: { ru: 'Резание', en: 'Cutting' } }];
  model.pish = buildPishModel(snapshot, model);
  return model;
}

const failed = explorer => explorer.checks.filter(check => !check.passed).map(check => check.id);

test('explorer uses competency topic unions and exact primary topics without altering inputs', () => {
  const snapshot = fixture([
    work('first', 'T10188', 2016, { fw: 2 }), work('last-p1', 'Tcut2', 2020, { fw: 4 }),
    work('first-p2', 'T10188', 2021, { fw: 0 }), work('last', 'T10188', 2025, { fw: 2 }),
    work('coating', 'T10377', 2023, { fw: 1 }), work('outside-group', 'Tother', 2022),
    work('no-topic', null, 2024), work('out-before', 'T10188', 2015), work('out-after', 'T10188', 2026),
  ]);
  const model = modelOf(snapshot), beforeSnapshot = structuredClone(snapshot), beforeModel = structuredClone(model);
  const explorer = buildExplorer(snapshot, model), group = explorer.groups.find(row => row.id === 'machining');
  const topic = explorer.topics.find(row => row.id === 'T10188');
  assert.equal(explorer.schema, 1);
  assert.equal(explorer.totalWorks, 7);
  assert.deepEqual(explorer.period, period);
  assert.equal(explorer.fetchedAt, snapshot.fetchedAt);
  assert.deepEqual(explorer.worldTotals, { p1: 500, p2: 1000 });
  assert.deepEqual(group.workIds, ['first', 'last-p1', 'first-p2', 'last']);
  assert.deepEqual(topic.workIds, ['first', 'first-p2', 'last']);
  assert.deepEqual(group.cohorts, model.pish.rows.find(row => row.id === 'machining').cohorts);
  assert.notEqual(group.cohorts, model.pish.rows.find(row => row.id === 'machining').cohorts);
  assert.equal(group.name.ru, COMPETENCIES.find(row => row.id === 'machining').name.ru);
  assert.equal(group.nP1, 2); assert.equal(group.nP2, 2);
  assert.equal(topic.nP1, 1); assert.equal(topic.nP2, 2);
  assert.equal(group.worldShareChange, 0.5);
  assert.equal(group.ownWorldShareChange, -0.666667);
  assert.equal(topic.ownWorldShareChange, -0.333333);
  assert.ok(explorer.works['outside-group'] && explorer.works['no-topic']);
  assert.ok(!explorer.works['out-before'] && !explorer.works['out-after']);
  assert.deepEqual(failed(explorer), []);
  assert.deepEqual(snapshot, beforeSnapshot); assert.deepEqual(model, beforeModel);
});

test('annual FWCI uses available measurements and distinguishes zero, missing and empty years', () => {
  const snapshot = fixture([
    work('zero', 'T10188', 2016, { fw: 0 }), work('two', 'T10188', 2016, { fw: 2 }),
    work('missing', 'T10188', 2016), work('all-missing', 'T10188', 2017),
  ]);
  const explorer = buildExplorer(snapshot, modelOf(snapshot));
  const row = explorer.groups.find(group => group.id === 'machining');
  assert.equal(row.annual.length, 10);
  assert.deepEqual(row.annual[0], { year: 2016, n: 3, fwci: 1, fwciN: 2 });
  assert.deepEqual(row.annual[1], { year: 2017, n: 1, fwci: null, fwciN: 0 });
  assert.deepEqual(row.annual[2], { year: 2018, n: 0, fwci: null, fwciN: 0 });
  assert.equal(explorer.works.zero.fwci, 0);
  assert.equal(explorer.works.missing.fwci, null);
  assert.equal(row.cohorts.p1.fwciCoverage, 0.5);
  assert.equal(row.cohorts.p2.fwciCoverage, null);
  assert.equal(row.cohorts.p1.fwciCI95.status, 'limited');
  assert.equal(row.ownWorldShareChange, -1);
  assert.ok(row.annual.every(point => !Object.hasOwn(point, 'world')));
  assert.deepEqual(failed(explorer), []);
});

test('zero or missing baselines never create infinite growth', () => {
  const snapshot = fixture([work('recent', 'T10188', 2021, { fw: 1 })]);
  let model = modelOf(snapshot), explorer = buildExplorer(snapshot, model);
  assert.equal(explorer.groups.find(row => row.id === 'machining').ownWorldShareChange, null);
  snapshot.world.topics.T10188 = [0, 30]; snapshot.world.topics.Tcut2 = [0, 30];
  model = modelOf(snapshot); explorer = buildExplorer(snapshot, model);
  assert.equal(explorer.groups.find(row => row.id === 'machining').worldShareChange, null);
  assert.equal(explorer.topics.find(row => row.id === 'T10188').worldShareChange, null);
  assert.deepEqual(failed(explorer), []);
  delete snapshot.world.byYear[2016];
  explorer = buildExplorer(snapshot, model);
  assert.equal(explorer.worldTotals.p1, null);
  assert.ok(failed(explorer).includes('world-denominators'));
  assert.ok(!JSON.stringify(explorer).includes('Infinity'));
});

test('zero recent world count means complete relative decline but no computable university/world ratio', () => {
  const snapshot = fixture([work('old', 'T10188', 2016, { fw: 1 })]);
  snapshot.world.topics.T10188 = [10, 0]; snapshot.world.topics.Tcut2 = [10, 0];
  const explorer = buildExplorer(snapshot, modelOf(snapshot));
  const row = explorer.groups.find(group => group.id === 'machining');
  assert.equal(row.worldShareChange, -1); assert.equal(row.ownWorldShareChange, null);
  assert.deepEqual(failed(explorer), []);
});

test('missing primary topic evidence remains missing instead of measured zero', () => {
  const snapshot = fixture();
  delete snapshot.world.topics.T10188;
  const explorer = buildExplorer(snapshot, modelOf(snapshot));
  const topic = explorer.topics.find(row => row.id === 'T10188');
  assert.equal(topic.nP1, null); assert.equal(topic.nP2, null);
  assert.equal(topic.cohorts, null); assert.equal(topic.worldP1, null);
  assert.equal(topic.worldShareChange, null); assert.equal(topic.ownWorldShareChange, null);
  assert.ok(topic.annual.every(point => point.n === 0 && point.fwci === null));
  assert.ok(!failed(explorer).some(id => id.startsWith('topic-')));
  // The old broad model silently substitutes missing world counts with zero;
  // the new independent check must detect that disagreement.
  assert.ok(failed(explorer).includes('group-machining-world'));
});

test('public work export has an explicit metadata allowlist', () => {
  const snapshot = fixture([work('public', 'T10188', 2016, {
    t: 'A <specific> paper', doi: '10.1234/example', fw: 0, c: 7,
    a: ['Name from input'], internalBudget: 123, departmentGuess: 'Do not publish',
  })]);
  const exported = buildExplorer(snapshot, modelOf(snapshot)).works.public;
  assert.deepEqual(exported, { id: 'public', title: 'A <specific> paper', year: 2016, doi: '10.1234/example', fwci: 0, citations: 7, topicId: 'T10188' });
});

test('question links use configured competency and primary-topic references separately', () => {
  const snapshot = fixture(), explorer = buildExplorer(snapshot, modelOf(snapshot));
  const group = explorer.groups.find(row => row.id === 'machining');
  const topic = explorer.topics.find(row => row.id === 'T10188');
  assert.ok(group.questionIds.includes('physics-with-learned-correction'));
  assert.ok(group.questionIds.includes('feedrate-selection'));
  assert.ok(topic.questionIds.includes('cutting-dynamics'));
  assert.ok(!topic.questionIds.includes('physics-with-learned-correction'));
  assert.ok(!topic.questionIds.includes('feedrate-selection'));
  assert.equal(new Set(group.questionIds).size, group.questionIds.length);
});

test('independent checks detect corrupted cohort means, counts, denominators, overlaps and duplicates', () => {
  const snapshot = fixture([work('one', 'T10188', 2016, { fw: 2 })]);
  const model = modelOf(snapshot);
  model.pish.rows.find(row => row.id === 'machining').cohorts.p1.fwci = 100;
  model.pish.rows.find(row => row.id === 'machining').cohorts.p2.n = 5;
  model.totals.worldP1 += 1;
  model.competencies.find(row => row.id === 'ai-data').topicIds.push('T10188');
  const errors = failed(buildExplorer(snapshot, model));
  for (const id of ['group-machining-means', 'group-machining-counts', 'world-denominators', 'group-partition', 'group-ai-data-counts']) assert.ok(errors.includes(id), id);
  snapshot.stankin.works.push({ ...snapshot.stankin.works[0] });
  assert.ok(failed(buildExplorer(snapshot, modelOf(snapshot))).includes('unique-work-ids'));
});

test('all 20 competencies and 13 topic lenses are exported even with empty own cohorts', () => {
  const snapshot = fixture();
  const model = modelOf(snapshot, COMPETENCIES);
  model.industrialTopics = Array.from({ length: 11 }, (_, i) => ({ id: `Tempty${i}`, name: { ru: `Тема ${i}`, en: `Topic ${i}` } }));
  model.pish = buildPishModel(snapshot, model);
  const explorer = buildExplorer(snapshot, model);
  assert.equal(explorer.groups.length, 20); assert.equal(explorer.topics.length, 13);
  assert.equal(explorer.checks.length, 8 + 20 * 3 + 13 * 3);
  assert.ok(explorer.groups.every(row => row.nP1 === 0 && row.nP2 === 0 && row.annual.length === 10));
  assert.equal(explorer.totalWorks, 0);
  assert.deepEqual(failed(explorer), []);
});

test('non-finite measurements are omitted from means and flagged in the audit', () => {
  const snapshot = fixture([work('bad', 'T10188', 2016, { fw: Infinity, c: NaN }), work('valid', 'T10188', 2016, { fw: 2 })]);
  const explorer = buildExplorer(snapshot, modelOf(snapshot));
  assert.equal(explorer.works.bad.fwci, null); assert.equal(explorer.works.bad.citations, null);
  const row = explorer.groups.find(group => group.id === 'machining');
  assert.equal(row.annual[0].fwci, 2); assert.equal(row.annual[0].fwciN, 1);
  assert.deepEqual(failed(explorer), ['valid-measurements']);
});
