// A deliberately selected industrial lens, not a ranking of all world science.
// Topic names are OpenAlex clusters: each may contain applications outside machine tools.
export const INDUSTRIAL_TOPIC_LENSES = [
  { id: 'T10763', name: { ru: 'Цифровая трансформация промышленности', en: 'Digital transformation in industry' }, role: 'digital', direct: false },
  { id: 'T10462', name: { ru: 'Обучение с подкреплением в робототехнике', en: 'Reinforcement learning in robotics' }, role: 'control', direct: false },
  { id: 'T11948', name: { ru: 'Машинное обучение в материаловедении', en: 'Machine learning in materials science' }, role: 'materials', direct: false },
  { id: 'T10705', name: { ru: 'Материалы и процессы аддитивного производства', en: 'Additive manufacturing materials and processes' }, role: 'process', direct: true },
  { id: 'T12111', name: { ru: 'Промышленное зрение и обнаружение дефектов', en: 'Industrial vision and defect detection' }, role: 'measure', direct: true },
  { id: 'T10220', name: { ru: 'Диагностика неисправностей машин', en: 'Machine fault diagnosis' }, role: 'predict', direct: true },
  { id: 'T10783', name: { ru: 'Аддитивное производство и 3D-печать', en: 'Additive manufacturing and 3D printing' }, role: 'process', direct: true },
  { id: 'T10653', name: { ru: 'Роботизированное манипулирование и обучение', en: 'Robot manipulation and learning' }, role: 'control', direct: false },
  { id: 'T10188', name: { ru: 'Передовая обработка и оптимизация', en: 'Advanced machining and optimization' }, role: 'process', direct: true },
  { id: 'T11583', name: { ru: 'Измерения и метрология', en: 'Measurement and metrology' }, role: 'measure', direct: true },
  { id: 'T11138', name: { ru: 'Трибология и смазка', en: 'Tribology and lubrication' }, role: 'materials', direct: true },
];

export function buildIndustrialTopics(snapshot, model) {
  const taxonomy = new Map(snapshot.taxonomy.topics.map(t => [t.id, t]));
  const own = new Map(model.topics.map(t => [t.id, t]));
  return INDUSTRIAL_TOPIC_LENSES.map(lens => {
    const counts = snapshot.world.topics[lens.id];
    const t = own.get(lens.id);
    const exists = taxonomy.has(lens.id) && counts != null;
    const [worldP1, worldP2] = exists ? counts : [null, null];
    const growthRatio = worldP1 > 0 ? worldP2 / worldP1 : null;
    const worldShareRatio = growthRatio != null && model.totals.worldP1 > 0 && model.totals.worldP2 > 0
      ? growthRatio / (model.totals.worldP2 / model.totals.worldP1) : null;
    return { ...lens, available: exists, openalexName: taxonomy.get(lens.id)?.name ?? null,
      worldP1, worldP2, growthRatio, worldShareRatio,
      n: exists ? t?.n ?? 0 : null, nP1: exists ? t?.nP1 ?? 0 : null, nP2: exists ? t?.nP2 ?? 0 : null,
      fwci: t?.fwci ?? null, competency: t?.competency ?? null };
  }).sort((a, b) => (b.worldShareRatio ?? -1) - (a.worldShareRatio ?? -1));
}
