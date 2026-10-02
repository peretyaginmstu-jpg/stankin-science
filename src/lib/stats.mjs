// Deterministic descriptive uncertainty intervals. Publication-level bootstrap
// assumes independent, exchangeable records; it is not a bias correction.
export const BOOTSTRAP_ITERATIONS = 2000;
export const BOOTSTRAP_MIN_N = 20;
export const INTERVAL_LEVEL = 0.95;
const Z95 = 1.959963984540054;
const round = (value) => Number.isFinite(value) ? Math.round(value * 1e6) / 1e6 : null;
const observed = (values) => values.filter(Number.isFinite).sort((a, b) => a - b);
const mean = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

export function stableSeed(key) {
  let seed = 2166136261;
  for (const character of String(key)) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
}

// Mulberry32: a fixed unsigned 32-bit seed, with no use of ambient randomness.
function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function quantile(sorted, probability) {
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
}

function resampleMean(values, random) {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) sum += values[Math.floor(random() * values.length)];
  return sum / values.length;
}

export function bootstrapMeanCI95(values, { seed = 0, iterations = BOOTSTRAP_ITERATIONS, minN = BOOTSTRAP_MIN_N } = {}) {
  if (!Number.isInteger(iterations) || iterations < 2) throw new RangeError('Bootstrap iterations must be an integer of at least 2.');
  const sample = observed(values);
  const result = { method: 'percentile-bootstrap', level: INTERVAL_LEVEL, n: sample.length, estimate: round(mean(sample)), lower: null, upper: null, status: sample.length === 0 ? 'missing' : sample.length < minN ? 'limited' : 'ok', iterations, seed: seed >>> 0 };
  if (result.status !== 'ok') return result;
  const random = rng(seed);
  const draws = Array.from({ length: iterations }, () => resampleMean(sample, random)).sort((a, b) => a - b);
  result.lower = round(quantile(draws, 0.025));
  result.upper = round(quantile(draws, 0.975));
  return result;
}

export function bootstrapDifferenceCI95(valuesP1, valuesP2, { seed = 0, iterations = BOOTSTRAP_ITERATIONS, minN = BOOTSTRAP_MIN_N } = {}) {
  if (!Number.isInteger(iterations) || iterations < 2) throw new RangeError('Bootstrap iterations must be an integer of at least 2.');
  const p1 = observed(valuesP1);
  const p2 = observed(valuesP2);
  const result = { method: 'independent-percentile-bootstrap', level: INTERVAL_LEVEL, nP1: p1.length, nP2: p2.length, estimate: p1.length && p2.length ? round(mean(p2) - mean(p1)) : null, lower: null, upper: null, status: !p1.length || !p2.length ? 'missing' : Math.min(p1.length, p2.length) < minN ? 'limited' : 'ok', iterations, seed: seed >>> 0 };
  if (result.status !== 'ok') return result;
  const random = rng(seed);
  const draws = Array.from({ length: iterations }, () => resampleMean(p2, random) - resampleMean(p1, random)).sort((a, b) => a - b);
  result.lower = round(quantile(draws, 0.025));
  result.upper = round(quantile(draws, 0.975));
  return result;
}

export function wilsonCI95(successes, n) {
  const valid = Number.isInteger(n) && n > 0 && Number.isInteger(successes) && successes >= 0 && successes <= n;
  const result = { method: 'wilson', level: INTERVAL_LEVEL, n, successes, estimate: valid ? round(successes / n) : null, lower: null, upper: null, status: valid ? 'ok' : n === 0 ? 'missing' : 'invalid' };
  if (!valid) return result;
  const p = successes / n;
  const z2 = Z95 ** 2;
  const divisor = 1 + z2 / n;
  const center = (p + z2 / (2 * n)) / divisor;
  const halfWidth = Z95 * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n) / divisor;
  result.lower = round(Math.max(0, center - halfWidth));
  result.upper = round(Math.min(1, center + halfWidth));
  return result;
}
