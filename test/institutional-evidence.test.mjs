import test from 'node:test';
import assert from 'node:assert/strict';
import { INSTITUTIONAL_SOURCES, INSTITUTIONAL_INDICATORS, INSTITUTIONAL_CONTEXT } from '../content/institutional-evidence.mjs';

const bilingual = x => assert.ok(x?.ru?.trim() && x?.en?.trim(), 'Both languages must explain the evidence');
const sourceIds = new Set(INSTITUTIONAL_SOURCES.map(s => s.id));

test('institutional evidence has resolvable sources and precise observation metadata', () => {
  assert.equal(sourceIds.size, INSTITUTIONAL_SOURCES.length);
  assert.equal(new Set(INSTITUTIONAL_INDICATORS.map(x => x.id)).size, INSTITUTIONAL_INDICATORS.length);
  for (const source of INSTITUTIONAL_SOURCES) {
    bilingual(source.title);
    assert.match(source.url, /^https:\/\/(?:stankin\.ru|cloud\.stankin\.ru)\//);
    assert.ok(Number.isInteger(source.publicationYear));
    assert.match(source.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  for (const indicator of INSTITUTIONAL_INDICATORS) {
    for (const field of ['name', 'scope', 'comparisonNote']) bilingual(indicator[field]);
    assert.ok(['people', 'research', 'finance', 'infrastructure'].includes(indicator.category));
    assert.ok(['count', 'million-rub', 'percent', 'm2'].includes(indicator.unit));
    assert.equal(new Set(indicator.observations.map(o => o.year)).size, indicator.observations.length);
    for (const o of indicator.observations) {
      assert.ok(sourceIds.has(o.sourceId));
      assert.ok(Number.isInteger(o.year));
      assert.ok(o.value === null || (Number.isFinite(o.value) && o.value >= 0));
      assert.ok(o.page === null || (Number.isInteger(o.page) && o.page > 0));
      if (o.value !== null) assert.ok(o.page !== null, 'Every numeric observation needs a PDF page');
      assert.equal(o.evidenceStatus, 'reported');
      bilingual(o.definition);
    }
    for (const year of indicator.comparisonYears) {
      const o = indicator.observations.find(o => o.year === year);
      assert.ok(o, 'Comparison year must be an actual observation');
      if (indicator.comparable) assert.notEqual(o.value, null, 'Missing values cannot produce a comparison');
    }
  }
});

test('report publication dates do not replace observation years', () => {
  const enrolment = INSTITUTIONAL_INDICATORS.find(x => x.id === 'postgraduates');
  assert.deepEqual(enrolment.comparisonYears, [2020, 2025]);
  assert.equal(enrolment.observations.find(x => x.year === 2020).sourceId, 'self-assessment-2020');
  assert.equal(INSTITUTIONAL_SOURCES.find(x => x.id === 'self-assessment-2020').publicationYear, 2021);
  assert.equal(INSTITUTIONAL_SOURCES.find(x => x.id === 'self-assessment-2025').publicationYear, 2026);
  const rooms = INSTITUTIONAL_INDICATORS.find(x => x.id === 'computer-classrooms');
  assert.deepEqual(rooms.comparisonYears, [2021, 2026]);
  assert.match(rooms.observations[0].definition.ru, /2020–2021/);
  assert.match(rooms.observations[1].definition.ru, /2025–2026/);
});

test('changes in revenue and personnel scope block a growth calculation', () => {
  for (const id of ['research-services-receipts', 'teaching-staff-reported']) {
    assert.equal(INSTITUTIONAL_INDICATORS.find(x => x.id === id).comparable, false);
  }
  assert.match(INSTITUTIONAL_INDICATORS.find(x => x.id === 'research-services-receipts').observations[1].definition.ru, /производственных работ/);
  assert.match(INSTITUTIONAL_INDICATORS.find(x => x.id === 'state-fundamental-funding').comparisonNote.ru, /без поправки на инфляцию/);
});

test('unconfirmed annual values stay missing and database counts stay separate', () => {
  for (const id of ['research-only-funding', 'scopus-reported']) {
    const indicator = INSTITUTIONAL_INDICATORS.find(x => x.id === id);
    assert.equal(indicator.comparable, false);
    assert.equal(indicator.observations.find(x => x.year === 2025).value, null);
  }
  assert.match(INSTITUTIONAL_INDICATORS.find(x => x.id === 'ip-grants').name.ru, /патенты и свидетельства/);
});

test('programme targets remain distinct from reported equipment and undated capacity', () => {
  for (const item of INSTITUTIONAL_CONTEXT) {
    bilingual(item.title); bilingual(item.text);
    assert.ok(sourceIds.has(item.sourceId));
    assert.ok(Number.isInteger(item.page) && item.page > 0);
    assert.ok(['reported', 'official-target'].includes(item.evidenceStatus));
    if (item.evidenceStatus === 'official-target') {
      assert.ok([2030, 2036].includes(item.targetYear));
      assert.equal(item.sourceId, 'programme-2026');
      assert.equal(item.observationYear, undefined);
    }
  }
  const undated = INSTITUTIONAL_CONTEXT.find(x => x.id === 'programme-research-base');
  assert.equal(undated.observationYear, null);
  assert.equal(undated.publicationYear, 2026);
  const equipment = INSTITUTIONAL_CONTEXT.find(x => x.id === 'reported-machine-equipment');
  assert.equal(equipment.observationYear, null);
  assert.equal(equipment.publicationYear, 2026);
  assert.equal(equipment.reportingYear, 2025);
  assert.match(equipment.text.en, /not operability/);
});
