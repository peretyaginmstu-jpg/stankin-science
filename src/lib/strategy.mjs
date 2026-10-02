// Decision support from publication evidence. Scores are configurable descriptive
// heuristics, not probabilities, scientific-quality ratings or budget prescriptions.

export const STRATEGY_THRESHOLDS = Object.freeze({
  strongMinWorks: 50,
  strongMinRecentWorks: 20,
  specializedAi: 2,
  worldLevelAi: 1,
  citationWorldLevel: 1,
  minCitationCoverage: 0.7,
  risingWorldShare: 1.1,
  fallingWorldShare: 0.9,
  fastWorldShare: 2,
  minWorldRecentWorks: 1000,
  specializationCeiling: 8,
  volumeCeiling: 100,
  citationCeiling: 2,
  strengthSpecializationWeight: 0.5,
  strengthVolumeWeight: 0.3,
  strengthCitationWeight: 0.2,
  opportunityMomentumWeight: 0.75,
  opportunityVolumeWeight: 0.25,
});

export const MIXED_COMPETENCY_IDS = Object.freeze(['engineering-methods', 'general-materials']);
export const INDUSTRY_COMPETENCY_IDS = Object.freeze([
  'additive-manufacturing', 'condition-monitoring', 'robotics', 'coatings-tribology',
  'laser-edm-plasma', 'machining', 'forming-welding', 'ceramics-composites',
  'metals-alloys', 'metrology-quality', 'ai-data', 'digital-manufacturing',
  'machine-tools-control', 'modeling-mechanics',
]);
export const CROSS_CUTTING_COMPETENCY_IDS = Object.freeze(['ai-data', 'modeling-mechanics']);

const valid = (x) => Number.isFinite(x) && x >= 0;
const ratio = (a, b) => valid(a) && Number.isFinite(b) && b > 0 ? a / b : null;
const round = (x, digits = 6) => Number.isFinite(x) ? Math.round(x * 10 ** digits) / 10 ** digits : null;
const clamp = (x) => Math.max(0, Math.min(1, x));
const atLeast = (x, threshold) => x >= threshold || Math.abs(x - threshold) < 1e-12;
const atMost = (x, threshold) => x <= threshold || Math.abs(x - threshold) < 1e-12;
const logScale = (x, ceiling) => valid(x) && ceiling > 0 ? clamp(Math.log1p(x) / Math.log1p(ceiling)) : null;
const deltaPp = (a, b) => a != null && b != null ? round((b - a) * 100) : null;
const duration = (p) => Array.isArray(p) && p.length === 2 && p[1] >= p[0] ? p[1] - p[0] + 1 : null;

export const STRATEGY_FORMULAS = Object.freeze({
  worldShareP1: 'worldP1 / totals.worldP1',
  worldShareP2: 'worldP2 / totals.worldP2',
  worldShareRatio: '(worldP2 / totals.worldP2) / (worldP1 / totals.worldP1)',
  ownShareP1: 'nP1 / totals.nP1',
  ownShareP2: 'nP2 / totals.nP2',
  aiP2: '(nP2 / totals.nP2) / (worldP2 / totals.worldP2)',
  shareP1: 'nP1 / worldP1',
  shareP2: 'nP2 / worldP2',
  shareRatio: '(nP2 / worldP2) / (nP1 / worldP1)',
  growthWorld: 'worldP2 / worldP1 (ratio of period totals; not annual compound growth)',
  growthOwn: 'nP2 / nP1 (ratio of period totals; not annual compound growth)',
  momentum: 'clamp(log2(worldShareRatio) / log2(fastWorldShare), 0, 1)',
  worldVolume: 'log1p(worldP2) / log1p(max eligible industry worldP2)',
  opportunityScore: '100 × (momentumWeight × momentum + volumeWeight × worldVolume) / (momentumWeight + volumeWeight)',
  strengthScore: '100 × weighted mean of log1p(aiP2)/log1p(specializationCeiling), log1p(nP2)/log1p(volumeCeiling), min(fwciP2/citationCeiling,1); each component clamped to [0,1]; missing components omitted',
});

function citationState(row, thresholds) {
  const coverage = ratio(row.fwciN, row.n);
  if (!valid(row.fwci) || coverage == null || coverage < thresholds.minCitationCoverage) return 'unknown';
  return row.fwci >= thresholds.citationWorldLevel ? 'at-or-above-world' : 'below-world';
}

function weightedScore(parts) {
  const known = parts.filter(([v, weight]) => Number.isFinite(v) && weight > 0);
  const weight = known.reduce((s, [, w]) => s + w, 0);
  return weight > 0 ? round(100 * known.reduce((s, [v, w]) => s + v * w, 0) / weight, 1) : null;
}

function strengthState(row, aiP2, citations, t) {
  if (!valid(row.nP2)) return 'unknown';
  if (row.nP2 === 0) return 'not-observed';
  if (aiP2 == null) return 'unknown';
  if (aiP2 < t.worldLevelAi) return 'underrepresented';
  if (row.n < t.strongMinWorks || row.nP2 < t.strongMinRecentWorks) return 'emerging';
  if (aiP2 >= t.specializedAi && citations === 'at-or-above-world') return 'strong';
  if (aiP2 >= t.specializedAi) return 'specialized';
  return 'represented';
}

function possibleAction(row) {
  if (row.mixed) return { code: 'disaggregate', reason: 'Mixed groups require topic-level analysis before selecting an industry priority.' };
  if (!row.industry) return { code: 'supporting-area', reason: 'This group supports the institution but is outside the selected machine-tool research scope.' };
  if (row.trend.state === 'unknown' || row.strength.state === 'unknown') return { code: 'verify-evidence', reason: 'Required denominators or a baseline are missing; no growth conclusion is warranted.' };
  if (row.trend.state === 'rising') {
    if (row.strength.state === 'strong') return { code: 'advance', reason: 'A substantial specialised publication base and citation performance align with a rising world share.' };
    if (row.strength.state === 'specialized') return { code: 'strengthen-impact', reason: 'World share is rising and a specialised publication base exists; investigate citation performance and industrial results.' };
    return { code: 'explore-partnership', reason: 'World share is rising; test the local capacity with a pilot or partnership before choosing scale.' };
  }
  if (row.trend.state === 'falling') return { code: 'reorient', reason: 'The direction loses world publication share; examine topics, customer demand and links to growing areas before deciding support.' };
  if (row.strength.state === 'strong' || row.strength.state === 'specialized') return { code: 'connect-core', reason: 'An established publication base can support machine-tool systems; stable world share alone does not justify expansion or withdrawal.' };
  return { code: 'verify-demand', reason: 'Publication evidence alone does not establish a priority; verify customer demand, staff, infrastructure and system integration.' };
}

/** Pure, reproducible strategic description of a buildModel() result.
 * Strength describes publications, not a verified laboratory capability.
 * All denominators use the same period and document-type universe from totals.
 * `frontline` ranks world opportunity among configured industry groups only.
 */
export function buildStrategy(model, options = {}) {
  const thresholds = { ...STRATEGY_THRESHOLDS, ...options.thresholds };
  const mixedIds = new Set(options.mixedIds ?? MIXED_COMPETENCY_IDS);
  const industryIds = new Set(options.industryIds ?? INDUSTRY_COMPETENCY_IDS);
  const crossCuttingIds = new Set(options.crossCuttingIds ?? CROSS_CUTTING_COMPETENCY_IDS);
  const totals = model.totals ?? {};
  const period = model.meta?.period ?? {};
  const periodLengths = { p1: duration(period.p1), p2: duration(period.p2) };
  const rows = (model.competencies ?? []).map((source) => {
    const ownShareP1 = ratio(source.nP1, totals.nP1);
    const ownShareP2 = ratio(source.nP2, totals.nP2);
    const worldShareP1 = ratio(source.worldP1, totals.worldP1);
    const worldShareP2 = ratio(source.worldP2, totals.worldP2);
    const worldShareRatio = ratio(worldShareP2, worldShareP1);
    const aiP1 = ratio(ownShareP1, worldShareP1);
    const aiP2 = ratio(ownShareP2, worldShareP2);
    const shareP1 = ratio(source.nP1, source.worldP1);
    const shareP2 = ratio(source.nP2, source.worldP2);
    // Current strength uses the recent cohort, never a pooled historic mean.
    // Pooled fields remain available as the accumulated research record.
    const recent = source.cohorts?.p2 ?? { n: source.nP2, fwci: null, fwciN: 0 };
    const citations = citationState(recent, thresholds);
    const reasons = [];
    if (!valid(source.n) || source.n < thresholds.strongMinWorks) reasons.push('small-total-sample');
    if (!valid(source.nP2) || source.nP2 < thresholds.strongMinRecentWorks) reasons.push('small-recent-sample');
    if (source.nP1 === 0) reasons.push('zero-own-baseline');
    if (source.worldP1 === 0) reasons.push('zero-world-baseline');
    if (aiP2 == null || worldShareRatio == null) reasons.push('missing-denominator');
    if (citations === 'unknown') reasons.push('limited-citation-coverage');
    if (source.contextStatus !== 'ok') reasons.push('peer-context-unavailable');
    if (mixedIds.has(source.id)) reasons.push('mixed-topic-group');
    if (crossCuttingIds.has(source.id)) reasons.push('world-group-broader-than-manufacturing');
    if (periodLengths.p1 && periodLengths.p2 && periodLengths.p1 !== periodLengths.p2) reasons.push('unequal-period-lengths');
    const decisive = reasons.some((r) => ['small-total-sample', 'small-recent-sample', 'zero-world-baseline', 'missing-denominator'].includes(r));
    const state = worldShareRatio == null ? 'unknown' : atLeast(worldShareRatio, thresholds.risingWorldShare) ? 'rising' : atMost(worldShareRatio, thresholds.fallingWorldShare) ? 'falling' : 'stable';
    const strength = strengthState(source, aiP2, citations, thresholds);
    const row = {
      id: source.id,
      name: model.competencyNames?.[source.id] ?? { ru: source.id, en: source.id },
      visible: source.visible !== false,
      mixed: mixedIds.has(source.id),
      industry: industryIds.has(source.id) && !mixedIds.has(source.id),
      scope: mixedIds.has(source.id) ? 'mixed' : crossCuttingIds.has(source.id) ? 'cross-cutting' : industryIds.has(source.id) ? 'industry' : 'supporting',
      evidence: {
        n: source.n ?? null, nP1: source.nP1 ?? null, nP2: source.nP2 ?? null,
        worldP1: source.worldP1 ?? null, worldP2: source.worldP2 ?? null,
        fwci: source.fwci ?? null, fwciN: source.fwciN ?? null,
        citationCoverage: round(ratio(source.fwciN, source.n)),
        fwciP2: recent.fwci ?? null, fwciNP2: recent.fwciN ?? null,
        citationCoverageP2: round(ratio(recent.fwciN, recent.n)),
        citationPeriod: period.p2 ?? null,
        contextStatus: source.contextStatus ?? 'missing',
      },
      citationState: citations,
      strength: {
        state: strength,
        score: source.nP2 === 0 ? 0 : weightedScore([
          [logScale(aiP2, thresholds.specializationCeiling), thresholds.strengthSpecializationWeight],
          [logScale(source.nP2, thresholds.volumeCeiling), thresholds.strengthVolumeWeight],
          [citations !== 'unknown' ? clamp(recent.fwci / thresholds.citationCeiling) : null, thresholds.strengthCitationWeight],
        ]),
        aiP1: round(aiP1), aiP2: round(aiP2),
        ownShareP1: round(ownShareP1), ownShareP2: round(ownShareP2),
        ownShareShiftPp: deltaPp(ownShareP1, ownShareP2),
      },
      trend: {
        state,
        growthWorld: round(ratio(source.worldP2, source.worldP1)),
        worldShareP1: round(worldShareP1), worldShareP2: round(worldShareP2),
        worldShareRatio: round(worldShareRatio),
        worldShareShiftPp: deltaPp(worldShareP1, worldShareP2),
      },
      position: {
        growthOwn: round(ratio(source.nP2, source.nP1)),
        shareP1: round(shareP1), shareP2: round(shareP2),
        shareRatio: round(ratio(shareP2, shareP1)),
        shareShiftPp: deltaPp(shareP1, shareP2),
      },
      confidence: { level: decisive ? 'limited' : reasons.length ? 'moderate' : 'robust', reasons, probabilistic: false },
      opportunityScore: null,
      frontlineRank: null,
      relativeGrowthRank: null,
    };
    row.action = possibleAction(row);
    return row;
  });
  const eligible = rows.filter((r) => r.industry && r.trend.worldShareRatio != null && r.evidence.worldP2 >= thresholds.minWorldRecentWorks);
  const maxVolume = Math.max(0, ...eligible.map((r) => r.evidence.worldP2));
  for (const row of eligible) {
    const momentum = thresholds.fastWorldShare > 1 && row.trend.worldShareRatio > 0 ? clamp(Math.log2(row.trend.worldShareRatio) / Math.log2(thresholds.fastWorldShare)) : 0;
    const volume = ratio(Math.log1p(row.evidence.worldP2), Math.log1p(maxVolume));
    row.opportunityScore = weightedScore([[momentum, thresholds.opportunityMomentumWeight], [volume, thresholds.opportunityVolumeWeight]]);
    row.opportunityComponents = { momentum: round(momentum), worldVolume: round(volume) };
  }
  const frontline = [...eligible].sort((a, b) => b.opportunityScore - a.opportunityScore || b.trend.worldShareRatio - a.trend.worldShareRatio || a.id.localeCompare(b.id));
  frontline.forEach((row, i) => { row.frontlineRank = i + 1; });
  [...eligible].sort((a, b) => b.trend.worldShareRatio - a.trend.worldShareRatio || b.evidence.worldP2 - a.evidence.worldP2 || a.id.localeCompare(b.id)).forEach((row, i) => { row.relativeGrowthRank = i + 1; });
  return {
    version: 2, thresholds, period, periodLengths,
    baselines: {
      ownP1: totals.nP1 ?? null, ownP2: totals.nP2 ?? null,
      worldP1: totals.worldP1 ?? null, worldP2: totals.worldP2 ?? null,
      growthOwn: round(ratio(totals.nP2, totals.nP1)), growthWorld: round(ratio(totals.worldP2, totals.worldP1)),
      maxIndustryWorldP2: maxVolume,
    },
    rows, frontline,
    summary: {
      strong: rows.filter((r) => !r.mixed && r.strength.state === 'strong').map((r) => r.id),
      specialized: rows.filter((r) => !r.mixed && r.strength.state === 'specialized').map((r) => r.id),
      gaps: rows.filter((r) => r.industry && ['underrepresented', 'emerging', 'not-observed'].includes(r.strength.state) && r.trend.state === 'rising').map((r) => r.id),
      reorient: rows.filter((r) => r.action.code === 'reorient').map((r) => r.id),
    },
    formulas: STRATEGY_FORMULAS,
    limitations: [
      'The universe is the configured OpenAlex periods, document types and topic rules, not all machine-tool research.',
      'No observed publications does not establish that a university capability is absent.',
      'Current citation state and strength use the recent publication cohort; pooled FWCI remains as historical evidence. Missing recent values are not replaced by pooled values.',
      'FWCI normalises by year, type and subfield, not research quality. Its publication-year plus three-year window is incomplete for the newest works.',
      'Citation change over time cannot be inferred from the pooled FWCI value.',
      'Scores and action labels are decision-support heuristics; staff, equipment, customer demand and industrial results must be verified before budget decisions.',
      'World opportunity ranking excludes mixed groups and distinguishes cross-cutting groups broader than manufacturing.',
    ],
  };
}
