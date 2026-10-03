import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pishBetMap, pishFundingChart, pishSubmissionPath, pishRoadmapChart } from '../src/charts/pish-bet.mjs';
import { PISH_BET, PISH_BET_REASONS, PISH_BET_OPTIONS, PISH_BET_CRITERIA, PISH_BET_PARTNERS, PISH_BET_WORKPACKAGES, PISH_BET_TIMELINE, PISH_BET_BOUNDARY, PISH_BET_RISKS } from '../content/pish-bet.mjs';
import { PISH_SOURCES, PISH_MINIMUMS } from '../content/pish.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';

const clean = svg => !/NaN|Infinity|undefined|\[object Object\]/.test(svg);

test('the bet content is bilingual, sourced and keeps qualitative ratings without scores', () => {
  const sources = new Set(PISH_SOURCES.map(s => s.id));
  const groups = new Set(COMPETENCIES.map(c => c.id));
  for (const key of ['title', 'thesis', 'product', 'scienceQuestion', 'condition', 'fallback']) assert.ok(PISH_BET[key].ru && PISH_BET[key].en, key);
  assert.ok(PISH_BET.sourceIds.every(id => sources.has(id)));
  for (const r of PISH_BET_REASONS) {
    assert.ok(r.title.ru && r.title.en && r.text.ru && r.text.en, r.id);
    assert.ok(r.sourceIds.every(id => sources.has(id)), r.id);
    assert.ok(r.competencyIds.every(id => groups.has(id)), r.id);
  }
  assert.deepEqual(PISH_BET_OPTIONS.filter(o => o.recommended).map(o => o.id), ['adaptive']);
  for (const o of PISH_BET_OPTIONS) {
    assert.equal(o.score, undefined, 'no invented numeric score');
    assert.ok(o.competencyIds.every(id => groups.has(id)), o.id);
    for (const c of PISH_BET_CRITERIA) assert.ok(['high', 'mid', 'low'].includes(o.ratings[c.id]?.level), `${o.id}:${c.id}`);
  }
  assert.ok(PISH_BET_BOUNDARY.length >= 5 && PISH_BET_RISKS.length >= 5);
});

test('cooperation respects the five-organisation limit and one responsible owner per work package', () => {
  assert.ok(PISH_BET_PARTNERS.length <= 5);
  assert.equal(PISH_BET_PARTNERS.filter(p => p.kind === 'lead').length, 1);
  assert.equal(PISH_BET_PARTNERS.filter(p => p.kind === 'customer').length, 1);
  for (const wp of PISH_BET_WORKPACKAGES) {
    assert.equal(PISH_BET_PARTNERS.filter(p => p.roles[wp.id] === 'R').length, 1, wp.id);
  }
});

test('the submission path keeps the official window and ends on the deadline', () => {
  const dates = PISH_BET_TIMELINE.map(i => i.date);
  assert.deepEqual(dates, [...dates].sort());
  assert.equal(PISH_BET_TIMELINE.at(-1).date, '2026-12-01');
  assert.ok(PISH_BET_TIMELINE.find(i => i.date === '2026-10-05').official);
  assert.ok(PISH_BET_TIMELINE.some(i => i.gate && !i.official), 'an internal go / no-go gate exists');
});

test('bet diagrams render at phone, tablet and desktop widths without inline styles or broken values', () => {
  const map = { lang: 'ru', existing: { title: 'A', sub: 'b', items: [{ label: '<Tool>', sub: 'x & y' }] }, product: { title: 'P', sub: 's', name: 'System', parts: ['a', 'b'], steps: [{ label: 'Измерить', sub: 'a' }, { label: 'Скорректировать', sub: 'b' }], loop: 'loop', baseTitle: 'B', gapTitle: 'G' }, customer: { title: 'КВАЛИФИЦИРОВАННЫЙ ЗАКАЗЧИК', sub: 'c', items: [{ label: 'C', sub: 'd' }] }, base: [{ label: 'Обработка · FWCI 1,1 · n=10' }], gaps: [{ label: 'ИИ · FWCI — · n=—' }], flows: { reuse: 'r', product: 'p', money: 'm' }, note: 'n' };
  const cumulative = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034].map(y => PISH_MINIMUMS.find(r => r.id === 'business-rnd').values[y]);
  const funding = { lang: 'en', years: [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034], cumulative, context: { value: 586.2, label: 'all receipts' } };
  const path = { lang: 'ru', window: { from: '2026-10-05', to: '2026-12-01' }, items: PISH_BET_TIMELINE.map(i => ({ ...i, label: i.label.ru })) };
  const road = { lang: 'en', years: [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035, 2036], lanes: [{ id: 'p', tone: 'product', label: 'Product', bars: [{ from: 2027, to: 2028, label: 'Bench & model' }] }], gates: [{ year: 2031, label: 'Accepted' }] };
  for (const width of [360, 760, 1160]) {
    const svgs = [pishBetMap(map, width), pishFundingChart(funding, width), pishSubmissionPath(path, width), pishRoadmapChart(road, width)];
    for (const svg of svgs) {
      assert.ok(clean(svg), svg.slice(0, 80));
      assert.ok(!svg.includes('<style>'), 'page SVG obeys the CSP');
      assert.ok(!/\sstyle="/.test(svg));
    }
    assert.ok(svgs[0].includes('&lt;Tool&gt;') && svgs[0].includes('x &amp; y'));
    assert.ok(svgs[1].includes('1 500') || svgs[1].includes('1,500'), 'cumulative 2034 minimum is printed');
    assert.ok(svgs[2].includes('01.12'));
    assert.ok(svgs[3].includes('Bench &amp; model'));
  }
  assert.ok(pishBetMap(map, 1160, { standalone: true }).includes('<style>'));
  assert.ok(pishRoadmapChart(road, 1160, { standalone: true }).includes('<style>'));
});

test('funding increments are derived from the cumulative minimum and missing values stay absent', () => {
  const svg = pishFundingChart({ lang: 'en', years: [2027, 2028, 2029], cumulative: [100, null, 400] }, 1160);
  assert.ok(svg.includes('>100<'));
  assert.ok(!svg.includes('>300<'), 'no increment is invented across a missing year');
  assert.ok(clean(svg));
});
