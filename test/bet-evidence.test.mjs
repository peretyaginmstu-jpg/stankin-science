import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cohortEvidence, BET_LENS } from '../src/lib/bet-evidence.mjs';
import { evidence } from '../src/charts/charts.mjs';

const OWN = 'I1';
const institutions = { I2: { type: 'company', country: 'RU', name: 'Plant' }, I3: { type: 'company', country: 'DE', name: 'Maker' }, I4: { type: 'education', country: 'CN', name: 'Uni' } };
const work = (o) => ({ y: 2023, ty: 'article', c: 1, fw: 1, p: 0.5, t10: 0, co: ['RU'], in: [OWN], lead: 1, a: ['A. Author'], ...o });
const options = { seedKey: 'test', ownIds: [OWN], institutions, home: 'RU' };

test('cohort evidence separates university-led and partner-led works and counts companies', () => {
  const list = [
    work({ fw: 0.2, lead: 1, a: ['A'] }),
    work({ fw: 0.4, lead: 1, a: ['A'], in: [OWN, 'I2'] }),
    work({ fw: 0.6, lead: 1, a: ['B'], c: 0 }),
    work({ fw: 5, lead: 0, co: ['RU', 'CN'], in: [OWN, 'I4', 'I3'], t10: 1 }),
  ];
  const e = cohortEvidence(list, options);
  assert.equal(e.n, 4);
  assert.equal(e.led.n + e.partnerLed.n, e.n);
  assert.equal(e.led.fwci, 0.4);
  assert.equal(e.partnerLed.fwci, 5);
  assert.equal(e.fwci, 1.55);
  assert.equal(e.fwciMedian, 0.5);
  assert.equal(e.fwciWithoutTop, 0.4, 'mean without the single most cited work');
  assert.equal(e.company, 2);
  assert.equal(e.companyRu, 1);
  assert.equal(e.intl, 0.25);
  assert.equal(e.uncited, 0.25);
  assert.equal(e.top10N, 1);
  assert.deepEqual(e.firstAuthors, { distinct: 2, topShare: 0.667 });
  assert.equal(e.ci95.status, 'limited', 'no interval below the bootstrap minimum');
});

test('missing FWCI values are not treated as zero', () => {
  const e = cohortEvidence([work({ fw: null }), work({ fw: 2 })], options);
  assert.equal(e.fwciN, 1);
  assert.equal(e.fwci, 2);
});

test('the title lens needs machining plus a loop module and ignores “machine learning” alone', () => {
  const match = (t) => BET_LENS.machining.test(t) && Object.values(BET_LENS.modules).some((re) => re.test(t));
  assert.equal(match('Tool wear monitoring in milling by acoustic emission'), true);
  assert.equal(match('Measurement of surface roughness after grinding'), true);
  assert.equal(match('Machine learning for image classification'), false);
  assert.equal(match('A cutting-edge review of sensors'), false);
});

test('the evidence chart draws every row, clips off-scale values and stays finite', () => {
  const spec = { lang: 'ru', label: 'x', ref: 1, cap: 3, axis: 'FWCI', groups: { core: 'Ядро' }, rows: [
    { id: 'a', group: 'core', label: 'A', sub: 'n = 10', mean: 1.2, lo: 0.8, hi: 1.9, median: 0.4, led: 0.6 },
    { id: 'b', group: 'core', label: 'B', sub: 'n = 7', mean: 4.2, lo: null, hi: null, median: 0, led: null },
  ] };
  for (const width of [360, 1160]) {
    const svg = evidence(spec, width);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
    assert.equal((svg.match(/class="ev-mean"/g) ?? []).length, 2);
    assert.match(svg, /4,20 →/, 'off-scale mean is labelled with its value');
  }
});
