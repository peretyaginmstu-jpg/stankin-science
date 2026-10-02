import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PISH_CANDIDATES, PISH_MINIMUMS, PISH_REQUIREMENTS, PISH_SOURCES } from '../content/pish.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';

test('the published 2031 competition minimums preserve all annex rows', () => {
  assert.equal(PISH_MINIMUMS.length, 15);
  const byId = Object.fromEntries(PISH_MINIMUMS.map(row => [row.id, row]));
  assert.equal(byId['business-rnd'].values[2031], 800);
  assert.equal(byId['educational-spaces'].values[2031], 6);
  assert.equal(byId['new-programmes'].values[2031], 10);
  assert.equal(byId['staff-development'].values[2030], 90);
  assert.equal(byId['masters-placements'].values[2031], 25);
  assert.equal(byId['extra-curricular-placements'].values[2031], 45);
  assert.equal(byId['graduates-employed'].values[2031], 320);
  assert.equal(byId['registered-ip-growth'].values[2031], 43);
  assert.equal(byId['learners-degree-and-continuing'].values[2034], 230);
});

test('a company commitment and the annual funding indicator remain distinct; N/A is not zero', () => {
  const commitment = PISH_REQUIREMENTS.find(row => row.id === 'company-cofinance');
  const annualIndicator = PISH_MINIMUMS.find(row => row.id === 'extra-budgetary-ratio');
  assert.equal(commitment.value, '≥50%');
  assert.deepEqual(Object.values(annualIndicator.values), [35, 25, 20, null, null, null, null, null]);
  assert.match(annualIndicator.note.ru, /не применимо/);
  assert.match(commitment.detail.ru, /отличается/);
});

test('provisional topic comparison maps existing competencies and public evidence', () => {
  const competencyIds = new Set(COMPETENCIES.map(row => row.id));
  const sourceIds = new Set(PISH_SOURCES.map(row => row.id));
  assert.deepEqual(PISH_CANDIDATES.filter(row => row.recommended).map(row => row.id), ['adaptive']);
  for (const row of [...PISH_CANDIDATES, ...PISH_REQUIREMENTS, ...PISH_MINIMUMS]) {
    assert.ok(row.sourceIds.length > 0, row.id);
    assert.ok(row.sourceIds.every(id => sourceIds.has(id)), row.id);
  }
  for (const row of PISH_CANDIDATES) {
    assert.ok(row.competencyIds.every(id => competencyIds.has(id)), row.id);
    assert.ok(row.supportingCompetencyIds.every(id => competencyIds.has(id)), row.id);
    assert.ok(row.supportingCompetencyIds.every(id => !row.competencyIds.includes(id)), row.id);
    assert.equal(row.score, undefined);
  }
  assert.match(PISH_CANDIDATES.find(row => row.id === 'adaptive').verdict.ru, /Предварительно/);
  assert.ok(PISH_SOURCES.every(row => new URL(row.url).protocol === 'https:'));
});

test('all minimums cover the official 2027–2034 horizon and do not merge different placements', () => {
  const years = ['2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034'];
  for (const row of PISH_MINIMUMS) {
    assert.deepEqual(Object.keys(row.values), years, row.id);
    assert.ok(Object.values(row.values).every(value => value === null || Number.isFinite(value)), row.id);
  }
  const ordinary = PISH_MINIMUMS.find(row => row.id === 'masters-placements');
  const extra = PISH_MINIMUMS.find(row => row.id === 'extra-curricular-placements');
  assert.notDeepEqual(ordinary.values, extra.values);
  assert.match(extra.label.ru, /вне образовательного процесса/);
});
