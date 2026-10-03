import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareInstitutionalIndicator, dominates, assignPareto, buildThinkTank } from '../src/lib/think-tank.mjs';

const indicator = (a, b, options = {}) => ({ comparable: true, unit: 'count',
  observations: [{ year: 2020, value: a }, { year: 2025, value: b }], ...options });
test('institutional five-year comparison uses observation years, not PDF publication years', () => {
  const c = compareInstitutionalIndicator(indicator(330, 311));
  assert.equal(c.years, 5); assert.equal(c.absolute, -19); assert.equal(c.relative, -0.057576);
  assert.equal(c.fromYear, 2020); assert.equal(c.toYear, 2025);
  assert.equal(compareInstitutionalIndicator(indicator(330, 311), 2025, 2020).status, 'invalid-period');
});
test('changed definitions and missing observations do not produce growth or false zeros', () => {
  const c = compareInstitutionalIndicator(indicator(502.6, 586.2, { comparable: false }));
  assert.equal(c.status, 'not-comparable'); assert.equal(c.absolute, null); assert.equal(c.relative, null);
  assert.equal(compareInstitutionalIndicator(indicator(null, 15)).status, 'missing');
  assert.equal(compareInstitutionalIndicator(indicator(null, 15)).from, null);
});
test('zero bases retain an absolute change and percentage shares report percentage points', () => {
  const zero = compareInstitutionalIndicator(indicator(0, 8));
  assert.equal(zero.absolute, 8); assert.equal(zero.relative, null); assert.equal(zero.status, 'zero-base');
  const percentage = compareInstitutionalIndicator(indicator(20, 30, { unit: 'percent' }));
  assert.equal(percentage.percentagePoints, 10); assert.equal(percentage.relative, 0.5);
});
test('Pareto dominance needs at least one strictly better dimension; ties remain equivalent', () => {
  assert.equal(dominates([2, .2, .1], [1, .2, .1]), true);
  assert.equal(dominates([2, .2, .1], [2, .2, .1]), false);
  assert.equal(dominates([2, .1, .1], [1, .2, .1]), false);
  assert.equal(dominates([2, null, .1], [1, .2, .1]), false);
  assert.equal(dominates([], []), false);
});
const row = (id, vector, extras = {}) => ({ id, mappingStatus: 'reviewed', evidence: {
  worldShareChange: vector[2], coverage: { missingTopicIds: [] },
  cohorts: { p2: { n: 20, fwciWithoutHighest: vector[0], top10: vector[1], fwciCoverage: 1, top10Coverage: 1 } },
}, ...extras });
test('Pareto preserves tradeoffs and excludes adjacent labels, small samples and incomplete coverage', () => {
  const a = row('a', [2, .2, .1]), b = row('b', [1, .2, .1]), c = row('c', [1, .3, .2]);
  const adjacent = row('adjacent', [100, 1, 100], { mappingStatus: 'adjacent' });
  const small = row('small', [100, 1, 100]); small.evidence.cohorts.p2.n = 19;
  const incomplete = row('incomplete', [100, 1, 100]); incomplete.evidence.cohorts.p2.top10Coverage = null;
  const result = assignPareto([a,b,c,adjacent,small,incomplete]);
  assert.deepEqual(result.filter(r=>r.pareto.front).map(r=>r.id), ['a','c']);
  assert.deepEqual(result[1].pareto.dominatedBy, ['a','c']);
  assert.equal(result[3].pareto.reason, 'mapping'); assert.equal(result[4].pareto.reason, 'small-sample');
  assert.equal(result[5].pareto.reason, 'coverage');
});
const bilingual = text => ({ ru: text, en: text });
const direction = id => ({ id, name: bilingual(id), short: bilingual(id), mappingNote: bilingual('Test'),
  mappingStatus: 'reviewed', topicIds: ['T1'], sourceIds: ['science'], benchmarks: [] });
function fixture() {
  const period = { from: 2016, to: 2025, p1: [2016,2020], p2: [2021,2025] };
  return { fetchedAt: '2026-10-02T14:11:33Z', config: { period },
    taxonomy: { topics: [{ id: 'T1', name: 'Machining' }] },
    world: { topics: { T1: [100,200] }, byYear: Object.fromEntries(Array.from({length:10},(_,i)=>[2016+i,1000])) },
    stankin: { works: Array.from({length:40},(_,i)=>({id:`W${i}`,t:`Title${i}`,tp:'T1',y:i<20?2020:2025,fw:i%2,
      c:1,p:.99,t10:1,t1:0,oa:0,co:['RU'],lead:1})) } };
}
function options() {
  return { directions: [direction('one'), direction('two')], sources: [{id:'science'}],
    institutionalSources: [{id:'report'}], context: [], scenarios: [{id:'schools',directionIds:['one']}],
    indicators: [{ ...indicator(10,20), id:'people', observations: [
      {year:2020,value:10,sourceId:'report',page:1}, {year:2025,value:20,sourceId:'report',page:2} ] }] };
}
test('overlapping research directions retain shared papers but never add them to the university total', () => {
  const snapshot = fixture(), before = structuredClone(snapshot), data = buildThinkTank(snapshot, {}, options());
  assert.equal(data.totalWorks, 40); assert.equal(Object.keys(data.works).length, 40);
  assert.equal(data.directions[0].evidence.cohorts.p2.n, 20);
  assert.equal(data.directions[1].evidence.cohorts.p2.n, 20);
  assert.equal(data.directions[0].evidence.worldShareChange, 1);
  assert.equal(data.works.W0.title, 'Title0'); assert.deepEqual(snapshot, before);
  assert.deepEqual(data.checks.filter(c=>!c.passed), []);
  assert.deepEqual(data.pareto.frontIds, ['one','two']);
});
test('broken provenance, duplicate observation years and unknown scenario directions block publication', () => {
  const o = options(); o.indicators[0].observations[0].page = null;
  o.indicators[0].observations.push({...o.indicators[0].observations[1]});
  o.scenarios[0].directionIds.push('unknown'); o.directions[0].sourceIds.push('unknown');
  o.directions[0].localSourceRefs = [{sourceId:'report',page:0}];
  o.context = [{sourceId:'report',page:null}];
  const failed = buildThinkTank(fixture(), {}, o).checks.filter(c=>!c.passed).map(c=>c.id);
  for (const id of ['institutional-source-pages','unique-institutional-years','known-sources','scenario-directions','local-evidence-pages','context-source-pages']) assert.ok(failed.includes(id), id);
});
test('unknown world counts suppress a direction trend and its Pareto eligibility', () => {
  const snapshot = fixture(); snapshot.world.topics.T1[1] = null;
  const data = buildThinkTank(snapshot, {}, options());
  assert.equal(data.directions[0].evidence.worldShareChange, null);
  assert.equal(data.directions[0].pareto.eligible, false);
  assert.equal(data.directions[0].evidence.cohorts.p2.n, 20);
});
