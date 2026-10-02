import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStrategy, STRATEGY_THRESHOLDS } from '../src/lib/strategy.mjs';

const group = (extra = {}) => ({ id: 'machining', n: 100, nP1: 50, nP2: 50, worldP1: 1000, worldP2: 1500, fwci: 1.2, fwciN: 100, visible: true, contextStatus: 'ok', ...extra });
const model = (rows, extra = {}) => ({ meta: { period: { p1: [2016, 2020], p2: [2021, 2025] } }, totals: { nP1: 100, nP2: 100, worldP1: 10000, worldP2: 20000 }, competencies: rows, ...extra });

test('absolute world growth is distinct from a loss of world publication share', () => {
  const r = buildStrategy(model([group()])).rows[0];
  assert.equal(r.trend.growthWorld, 1.5);
  assert.equal(r.trend.worldShareRatio, 0.75);
  assert.equal(r.trend.worldShareP1, 0.1);
  assert.equal(r.trend.worldShareP2, 0.075);
  assert.equal(r.trend.worldShareShiftPp, -2.5);
  assert.equal(r.trend.state, 'falling');
  assert.equal(r.action.code, 'reorient');
  assert.equal(r.position.growthOwn, 1);
  assert.equal(r.position.shareRatio, 0.666667);
  assert.equal(r.strength.aiP2, 6.666667);
  assert.equal(r.strength.ownShareP2, 0.5);
});

test('zero own baseline is not infinite growth and no publication is not no capability', () => {
  const r = buildStrategy(model([group({ n: 10, nP1: 0, nP2: 10, fwciN: 10 })])).rows[0];
  assert.equal(r.position.growthOwn, null);
  assert.equal(r.position.shareRatio, null);
  assert.ok(r.confidence.reasons.includes('zero-own-baseline'));
  const empty = buildStrategy(model([group({ n: 0, nP1: 0, nP2: 0, fwci: null, fwciN: 0 })]));
  assert.equal(empty.rows[0].strength.state, 'not-observed');
  assert.equal(empty.rows[0].strength.score, 0);
  assert.ok(empty.limitations.some((s) => s.includes('does not establish')));
});

test('few highly cited works do not become a demonstrated strong publication base', () => {
  const r = buildStrategy(model([group({ n: 5, nP1: 1, nP2: 4, worldP2: 300, fwci: 12, fwciN: 5 })])).rows[0];
  assert.equal(r.strength.state, 'emerging');
  assert.equal(r.confidence.level, 'limited');
  assert.equal(r.citationState, 'at-or-above-world');
  assert.ok(r.strength.score <= 100);
});

test('missing denominators with high counts cannot become a strong or growing conclusion', () => {
  const r = buildStrategy(model([group()], { totals: { nP1: 100, nP2: 100 } })).rows[0];
  assert.equal(r.trend.state, 'unknown');
  assert.equal(r.strength.state, 'unknown');
  assert.equal(r.opportunityScore, null);
  assert.equal(r.action.code, 'verify-evidence');
  assert.equal(r.confidence.level, 'limited');
});

test('missing peer context reduces confidence but does not erase available world period totals', () => {
  const r = buildStrategy(model([group({ contextStatus: 'missing' })])).rows[0];
  assert.equal(r.trend.worldShareRatio, 0.75);
  assert.equal(r.confidence.level, 'moderate');
  assert.ok(r.confidence.reasons.includes('peer-context-unavailable'));
});

test('citation coverage gates citation state and is never treated as research quality', () => {
  const r = buildStrategy(model([group({ fwci: 4, fwciN: 2 })])).rows[0];
  assert.equal(r.citationState, 'unknown');
  assert.equal(r.strength.state, 'specialized');
  assert.ok(r.confidence.reasons.includes('limited-citation-coverage'));
  assert.equal('quality' in r, false);
});

test('industry frontline excludes general mixed groups and non-industry support', () => {
  const s = buildStrategy(model([
    group({ id: 'engineering-methods', worldP2: 10000 }),
    group({ id: 'general-materials', worldP2: 10000 }),
    group({ id: 'engineering-education', worldP2: 10000 }),
    group({ id: 'additive-manufacturing', worldP2: 4000 }),
    group({ id: 'ai-data', worldP2: 3000 }),
  ]));
  assert.deepEqual(s.frontline.map((r) => r.id), ['additive-manufacturing', 'ai-data']);
  assert.equal(s.frontline[0].frontlineRank, 1);
  assert.equal(s.rows.find((r) => r.id === 'engineering-methods').action.code, 'disaggregate');
  assert.equal(s.rows.find((r) => r.id === 'engineering-methods').opportunityScore, null);
  assert.equal(s.rows.find((r) => r.id === 'ai-data').scope, 'cross-cutting');
});

test('configured thresholds change interpretations without changing evidence', () => {
  const m = model([group({ worldP2: 2200 })]);
  const standard = buildStrategy(m).rows[0];
  const strict = buildStrategy(m, { thresholds: { risingWorldShare: 1.2, strongMinWorks: 200 } }).rows[0];
  assert.equal(standard.trend.state, 'rising');
  assert.equal(strict.trend.state, 'stable');
  assert.equal(strict.strength.state, 'emerging');
  assert.deepEqual(strict.evidence, standard.evidence);
  assert.equal(STRATEGY_THRESHOLDS.strongMinWorks, 50);
});

test('all scores are bounded and comparison uses period totals rather than CAGR', () => {
  const s = buildStrategy(model([group({ worldP2: 100000, fwci: 100 }), group({ id: 'robotics', worldP2: 0 })]));
  for (const r of s.rows) {
    assert.ok(r.strength.score == null || r.strength.score >= 0 && r.strength.score <= 100);
    assert.ok(r.opportunityScore == null || r.opportunityScore >= 0 && r.opportunityScore <= 100);
    assert.equal(r.confidence.probabilistic, false);
  }
  assert.equal(s.rows[0].trend.growthWorld, 100);
  assert.equal(s.rows[1].trend.state, 'falling');
  assert.ok(s.formulas.growthWorld.includes('not annual compound'));
});

test('unequal period durations are explicitly recorded', () => {
  const m = model([group()]);
  m.meta.period.p2 = [2021, 2024];
  const s = buildStrategy(m);
  assert.deepEqual(s.periodLengths, { p1: 5, p2: 4 });
  assert.ok(s.rows[0].confidence.reasons.includes('unequal-period-lengths'));
});

test('a world direction absent from the first period has no invented growth ratio', () => {
  const r = buildStrategy(model([group({ worldP1: 0, worldP2: 3000 })])).rows[0];
  assert.equal(r.trend.growthWorld, null);
  assert.equal(r.trend.worldShareRatio, null);
  assert.equal(r.trend.state, 'unknown');
  assert.equal(r.opportunityScore, null);
  assert.ok(r.confidence.reasons.includes('zero-world-baseline'));
});
