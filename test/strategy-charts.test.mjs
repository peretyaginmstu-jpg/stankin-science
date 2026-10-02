import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strategyMatrix, capabilityHeatmap } from '../src/charts/strategy.mjs';

const rows = [
  { id: 'coatings', name: 'Покрытия <x> & "трибология"', short: 'Покрытия', n: 400, ai: 2, fwci: 1.7, growthWorld: 0.05, growthOwn: 0.2, worldShareChange: 0.007, ownShareChange: 0.4, status: 'strong', action: 'Усилить связь с изделием', confidence: 'Средняя' },
  { id: 'additive', name: 'Аддитивное производство', short: 'Аддитивные технологии', n: 100, ai: 0.8, fwci: 0.95, growthWorld: 0.9, growthOwn: 0.7, worldShareChange: 0.72, ownShareChange: -0.1, status: 'rising', action: 'Развивать', confidence: 'Средняя' },
  { id: 'missing', name: 'Недостаточно данных', n: 0, ai: null, fwci: null, growthWorld: null, growthOwn: null, worldShareChange: null, ownShareChange: null, status: 'gap' },
];

function assertSafe(svg) {
  assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
  assert.ok(svg.includes('class="chart-svg '));
  assert.ok(svg.includes('<title>') && svg.includes('<desc>'));
  assert.ok(!/<x>|\b(?:NaN|undefined|Infinity)\b|\sstyle=/.test(svg));
  assert.equal((svg.match(/<a\s/g) ?? []).length, (svg.match(/<\/a>/g) ?? []).length);
}

test('strategy graphics retain metric signs, escape source text and support server/browser links', () => {
  const map = strategyMatrix({ rows, lang: 'ru', hrefFor: (id) => `/competencies/${id}/` });
  assertSafe(map);
  assert.ok(map.includes('Покрытия &lt;x&gt; &amp; &quot;трибология&quot;'));
  assert.ok(map.includes('+72') && map.includes('−10'));
  assert.ok(map.includes('href="/competencies/coatings/"'));
  assert.ok(map.includes('data-tip="'));
  const browserRows = rows.map((row) => ({ ...row, href: `/en/competencies/${row.id}/` }));
  for (const svg of [strategyMatrix({ rows: browserRows, lang: 'en' }, 360), capabilityHeatmap({ rows: browserRows, lang: 'en' })]) {
    assertSafe(svg);
    assert.ok(svg.includes('href="/en/competencies/coatings/"'));
  }
});

test('bubble area is proportional to publication count, and missing coordinates create no bubble', () => {
  const svg = strategyMatrix({ rows });
  const circles = [...svg.matchAll(/<circle class="dot strategy-dot"[^>]* r="([\d.]+)"/g)];
  assert.equal(circles.length, 2);
  const [large, small] = circles.map((match) => Number(match[1]));
  assert.equal((large / small) ** 2, 4);
  assert.ok(svg.includes('Нет координат: недостаточно данных'));
});

test('filters remove points without renumbering remaining competency keys', () => {
  const svg = strategyMatrix({ rows: rows.map((row, i) => ({ ...row, filtered: i === 0 })) });
  assert.equal((svg.match(/class="dot strategy-dot"/g) ?? []).length, 1);
  assert.ok(svg.includes('strategy-filtered'));
  assert.match(svg, /class="strategy-item strategy-number strategy-rising"[\s\S]*?>2<\/text>/);
  assert.ok(svg.includes('Скрыто фильтром'));
});

test('filters preserve axes, plotted coordinates and publication-area scale', () => {
  const full = strategyMatrix({ rows });
  const filtered = strategyMatrix({ rows: rows.map((row, i) => ({ ...row, filtered: i === 0 })) });
  const axes = (svg) => svg.match(/<g class="axis-text">[\s\S]*?<\/g>/)?.[0];
  const dots = (svg) => [...svg.matchAll(/<circle class="dot strategy-dot" cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/g)].map((match) => match.slice(1));
  assert.equal(axes(filtered), axes(full));
  assert.deepEqual(dots(filtered)[0], dots(full)[1], 'the smaller bubble keeps its coordinates and radius when the largest bubble is hidden');
  const filteredExtreme = strategyMatrix({ rows: rows.map((row, i) => ({ ...row, filtered: i === 1 })) });
  assert.equal(axes(filteredExtreme), axes(full), 'hiding the topic with the highest world growth must not change the x-axis');
  assert.deepEqual(dots(filteredExtreme)[0], dots(full)[0]);
});

test('missing ratios and changes remain distinct from a measured zero', () => {
  const zero = { id: 'zero', name: 'Zero', n: 0, ai: 0, fwci: 0, growthOwn: 0, growthWorld: 0, ownShareChange: 0, worldShareChange: 0, status: 'watch' };
  const matrix = capabilityHeatmap({ rows: [rows[2], zero], lang: 'en' });
  assertSafe(matrix);
  assert.equal((matrix.match(/>No data<\/text>/g) ?? []).length, 6);
  assert.ok(matrix.includes('>0%</text>'));
  assert.ok(matrix.includes('STANKIN’s share of the global topic'));
});

test('empty portfolios and invalid widths still produce finite accessible SVG', () => {
  for (const width of [360, 1160, null, Number.NaN]) {
    assertSafe(strategyMatrix({ rows: [] }, width));
    assertSafe(capabilityHeatmap({ rows: [] }, width));
  }
  const svg = capabilityHeatmap({ rows }, 360);
  assert.match(svg, /width="980"/);
});

test('repeated coordinates preserve plotted positions while number chips avoid collisions', () => {
  const repeated = Array.from({ length: 19 }, (_, index) => ({ ...rows[0], id: `repeat-${index}`, n: index + 1 }));
  const svg = strategyMatrix({ rows: repeated });
  const circles = [...svg.matchAll(/<circle class="dot strategy-dot" cx="([\d.]+)" cy="([\d.]+)"/g)];
  assert.equal(circles.length, 19);
  assert.equal(new Set(circles.map((match) => `${match[1]},${match[2]}`)).size, 1);
  const chips = [...svg.matchAll(/class="strategy-item strategy-number[\s\S]*?<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)].map((match) => ({ x: +match[1], y: +match[2], w: +match[3], h: +match[4] }));
  assert.equal(chips.length, 19);
  for (let i = 0; i < chips.length; i += 1) for (let j = i + 1; j < chips.length; j += 1) {
    const a = chips[i]; const b = chips[j];
    assert.ok(!(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h));
  }
});
