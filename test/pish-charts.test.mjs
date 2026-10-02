import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pishLoop, cohortsChart } from '../src/charts/pish.mjs';
import { PISH_CANDIDATES } from '../content/pish.mjs';
import { PISH_CANDIDATE_COMPETENCIES } from '../src/lib/pish.mjs';

test('candidate descriptions refer to the exact publication unions they count', () => {
  for (const candidate of PISH_CANDIDATES) {
    assert.deepEqual(candidate.competencyIds, [...PISH_CANDIDATE_COMPETENCIES[candidate.id]]);
  }
});

test('responsive diagrams preserve all seven functions and distinct control times', () => {
  const nodes = Array.from({ length: 7 }, (_, i) => ({ id: `n${i}`, label: `Function ${i}`, subtitle: 'Acceptance evidence', statusLabel: 'Proposed' }));
  for (const width of [360, 760, 1160]) {
    const svg = pishLoop({ lang: 'en', nodes }, width);
    assert.equal((svg.match(/class="pish-node"/g) ?? []).length, 7);
    assert.match(svg, /100 µs/);
    assert.match(svg, /10 ms/);
    assert.match(svg, /pish-feedback/);
    assert.ok(!svg.includes('<style>'), 'page SVG obeys the existing CSP');
    assert.ok(!/NaN|Infinity|undefined/.test(svg));
  }
  assert.match(pishLoop({ lang: 'en', nodes }, 1160, { standalone: true }), /<style>/);
});

test('cohort charts distinguish absent citation values from real zeros and escape labels', () => {
  const rows = [
    { id: 'missing', name: '<script>x</script>', p1: { fwci: null, n: 4 }, p2: { fwci: 0, n: 2 } },
    { id: 'present', name: 'Measured', p1: { fwci: 2.7, n: 50 }, p2: { fwci: 0.93, n: 75 } },
  ];
  for (const width of [360, 1160]) {
    const svg = cohortsChart({ lang: 'en', rows }, width);
    assert.match(svg, /No value for this period/);
    assert.ok(!svg.includes('<script>'));
    assert.match(svg, /&lt;script&gt;/);
    assert.equal((svg.match(/<circle[^>]+class="pish-cohort-before"/g) ?? []).length, 2); // legend + measured
    assert.equal((svg.match(/<circle[^>]+class="pish-cohort-after/g) ?? []).length, 3); // legend + both cohorts, including zero
    assert.ok(!/NaN|Infinity|undefined/.test(svg));
  }
});
