import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assignTopics, topicMatches, topicSetKey } from '../src/lib/classify.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';
import { buildModel } from '../src/lib/metrics.mjs';

// Названия и коды тем в духе классификации OpenAlex: [подобласть, название, ожидаемая компетенция или null]
const CASES = [
  [2209, 'Electrical Discharge Machining Processes', 'laser-edm-plasma'],
  [2209, 'Advanced Machining and Optimization Techniques', 'machining'],
  [2209, 'Advanced Surface Polishing Techniques', 'machining'],
  [2209, 'Additive Manufacturing and 3D Printing Technologies', 'additive-manufacturing'],
  [2505, 'Additive Manufacturing Materials and Processes', 'additive-manufacturing'],
  [2210, 'Tribology and Wear Analysis', 'coatings-tribology'],
  [2211, 'Metal and Thin Film Mechanics', 'coatings-tribology'],
  [2508, 'Electrodeposition and Electroless Coatings', 'coatings-tribology'],
  [2508, 'Anodic Oxide Films and Nanostructures', 'coatings-tribology'],
  [2503, 'Advanced ceramic materials synthesis', 'ceramics-composites'],
  [2503, 'Diamond and Carbon-based Materials Research', 'ceramics-composites'],
  [2506, 'Titanium Alloys Microstructure and Properties', 'metals-alloys'],
  [2502, 'Bone Tissue Engineering Materials', 'biomaterials'],
  [2207, 'Robotic Mechanisms and Dynamics', 'robotics'],
  [2210, 'Machine Fault Diagnosis Techniques', 'condition-monitoring'],
  [2210, 'Gear and Bearing Dynamics Analysis', 'machine-tools-control'],
  [2210, 'Hydraulic and Pneumatic Systems', 'machine-tools-control'],
  [3107, 'Laser Material Processing Techniques', 'laser-edm-plasma'],
  [3104, 'Plasma Diagnostics and Applications', 'laser-edm-plasma'],
  [3105, 'Advanced Measurement and Metrology Techniques', 'metrology-quality'],
  [1702, 'Neural Networks and Applications', 'ai-data'],
  [1712, 'Software Engineering Research', 'software-it'],
  [2209, 'Digital Transformation in Industry', 'digital-manufacturing'],
  [2604, 'Fractional Differential Equations Solutions', 'modeling-mechanics'],
  [2002, 'Economic and Technological Developments in Russia', 'industrial-economics'],
  [3304, 'Engineering Education and Curriculum Development', 'engineering-education'],
  [2210, 'Welding Techniques and Residual Stresses', 'forming-welding'],
  // не наши области — вне компетенций
  [3107, 'Laser-induced spectroscopy and plasma', null],
  [3107, 'Advanced Fiber Laser Technologies', null],
  [2205, 'Concrete and Cement Materials Research', null],
  [2730, 'Cancer Immunotherapy Research', null],
  [3106, 'Laser-Plasma Interactions and Diagnostics', null],
  [1909, 'Drilling and Well Engineering', null],
];

const topics = CASES.map(([subfield, name], i) => ({ id: `T${10001 + i}`, name, subfield, field: Math.floor(subfield / 100), domain: 3 }));

test('темы относятся к ожидаемым компетенциям', () => {
  const { byTopic } = assignTopics(topics, COMPETENCIES);
  CASES.forEach(([, name, expected], i) => {
    assert.equal(byTopic.get(topics[i].id) ?? null, expected, name);
  });
});

// Реальные идентификаторы, названия и коды тем OpenAlex: регрессия по профильному корпусу.
// Здесь сохранены только публичные сведения о классификации, без приватного корпуса работ.
const REAL_CASES = [
  ['T13113', 'Engineering Technology and Methodologies', 2209, 22, 'engineering-methods'],
  ['T10377', 'Metal and Thin Film Mechanics', 2211, 22, 'coatings-tribology'],
  ['T10188', 'Advanced machining processes and optimization', 2210, 22, 'machining'],
  ['T11451', 'Advanced Machining and Optimization Techniques', 2208, 22, 'machining'],
  ['T10705', 'Additive Manufacturing Materials and Processes', 2210, 22, 'additive-manufacturing'],
  ['T12408', 'Educational Innovations and Challenges', 1710, 17, 'engineering-education'],
  ['T13978', 'Foreign Language Teaching Methods', 3304, 33, 'engineering-education'],
  ['T14470', 'Advanced Data Processing Techniques', 2207, 22, 'ai-data'],
  ['T11659', 'Advanced Image Fusion Techniques', 2214, 22, 'ai-data'],
  ['T14420', 'Advanced Research in Systems and Signal Processing', 2207, 22, 'ai-data'],
  ['T13267', 'Advanced Theoretical and Applied Studies in Material Sciences and Geometry', 2204, 22, 'modeling-mechanics'],
  ['T12176', 'Optimization and Packing Problems', 2209, 22, 'modeling-mechanics'],
  ['T10461', 'Gas Sensing Nanomaterials and Sensors', 2208, 22, 'metrology-quality'],
  ['T11897', 'Digital Holography and Microscopy', 3107, 31, 'metrology-quality'],
  ['T13129', 'Material Properties and Applications', 2500, 25, 'general-materials'],
  ['T13093', 'Electric Power Systems and Control', 2208, 22, null],
  ['T13190', 'Engineering and Environmental Studies', 2212, 22, null],
  ['T14423', 'Military Technology and Strategies', 2202, 22, null],
];

test('реальные профильные темы не теряются и относятся по фактическим кодам OpenAlex', () => {
  const realTopics = REAL_CASES.map(([id, name, subfield, field]) => ({ id, name, subfield, field, domain: 3 }));
  const { byTopic } = assignTopics(realTopics, COMPETENCIES);
  for (const [id, name, , , expected] of REAL_CASES) {
    assert.equal(byTopic.get(id) ?? null, expected, `${id}: ${name}`);
  }
});

test('общая инженерная группа использует точное название в нужной подобласти', () => {
  const rule = COMPETENCIES.find((c) => c.id === 'engineering-methods').match;
  assert.equal(topicMatches(rule, { name: 'Engineering Technology and Methodologies', subfield: 2209, field: 22 }), true);
  assert.equal(topicMatches(rule, { name: 'Military Technology and Strategies', subfield: 2202, field: 22 }), false);
  assert.equal(topicMatches(rule, { name: 'Other Engineering Technology and Methodologies', subfield: 2209, field: 22 }), false);
  assert.equal(topicMatches(rule, { name: 'Engineering Technology and Methodologies', subfield: 1710, field: 17 }), false);
});

test('общее материаловедение сохраняет смешанную тему, но не забирает все материалы и приложения', () => {
  const rule = COMPETENCIES.find((c) => c.id === 'general-materials').match;
  assert.equal(topicMatches(rule, { name: 'Material Properties and Applications', subfield: 2500, field: 25 }), true);
  assert.equal(topicMatches(rule, { name: 'Material Properties and Applications in Medicine', subfield: 2500, field: 25 }), false);
  assert.equal(topicMatches(rule, { name: 'Material Properties and Applications', subfield: 2204, field: 22 }), false);
  assert.equal(topicMatches(rule, { name: 'Titanium Alloys Microstructure and Properties', subfield: 2506, field: 25 }), false);
});

test('обработка изображений и сигналов остаётся в инженерном/вычислительном scope', () => {
  const rule = COMPETENCIES.find((c) => c.id === 'ai-data').match;
  assert.equal(topicMatches(rule, { name: 'Advanced Image Fusion Techniques', subfield: 2214, field: 22 }), true);
  assert.equal(topicMatches(rule, { name: 'Advanced Research in Systems and Signal Processing', subfield: 2207, field: 22 }), true);
  assert.equal(topicMatches(rule, { name: 'Clinical Image Fusion Techniques', subfield: 1702, field: 17 }), false);
  assert.equal(topicMatches(rule, { name: 'Advanced Image Fusion Techniques', subfield: 3107, field: 31 }), false);
});

test('сенсорные и голографические темы не включают произвольную микроскопию или клинические темы', () => {
  const rule = COMPETENCIES.find((c) => c.id === 'metrology-quality').match;
  assert.equal(topicMatches(rule, { name: 'Digital Holography and Microscopy', subfield: 3107, field: 31 }), true);
  assert.equal(topicMatches(rule, { name: 'Clinical Digital Holography and Microscopy', subfield: 3107, field: 31 }), false);
  assert.equal(topicMatches(rule, { name: 'Electron Microscopy in Cell Biology', subfield: 1307, field: 13 }), false);
  assert.equal(topicMatches(rule, { name: 'Gas Sensing Nanomaterials and Sensors', subfield: 2741, field: 27 }), false);
});

test('Military вне компетенций не означает чужую аффилиацию и не удаляет работу из корпуса', () => {
  const snapshot = {
    source: 'fixture',
    fetchedAt: '2026-10-02T00:00:00Z',
    config: {
      period: { from: 2016, to: 2025, p1: [2016, 2020], p2: [2021, 2025] },
      types: ['article'], institutionIds: ['I1'],
    },
    institution: { id: 'I1', ror: 'fixture', candidates: [] },
    taxonomy: { topics: [{ id: 'T14423', name: 'Military Technology and Strategies', subfield: 2202, field: 22, domain: 3 }] },
    world: { byYear: { 2020: 100 }, topics: { T14423: [100, 0] } },
    stankin: {
      works: [{ id: 'W1', y: 2020, tp: 'T14423', ty: 'article', fw: 0.3, c: 1, p: 0.2, t10: 0, t1: 0,
        co: ['RU'], in: ['I1'], s: null, oa: 0, lead: 1, lang: 'ru', affiliationStatus: 'confirmed_stankin' }],
      sources: {},
    },
    institutions: {}, competencies: {},
  };
  const model = buildModel(snapshot, { competencies: COMPETENCIES, thresholds: { competencyMinWorks: 15, trendMinWorldWorks: 3000, trendFastGrowth: 1.5 } });
  assert.equal(model.totals.n, 1);
  assert.equal(model.coverage.assignedWorks, 0);
  assert.equal(model.coverage.unassignedTopics[0].id, 'T14423');
  assert.equal(snapshot.stankin.works[0].affiliationStatus, 'confirmed_stankin');
});

test('у компетенций уникальные идентификаторы и полные тексты на двух языках', () => {
  const ids = COMPETENCIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of COMPETENCIES) {
    assert.match(c.id, /^[a-z0-9-]+$/);
    for (const key of ['name', 'short', 'summary']) {
      assert.ok(c[key].ru && c[key].en, `${c.id}.${key}`);
    }
    assert.ok(c.short.ru.length <= 30, `короткое название ${c.id} длиннее 30 знаков`);
  }
});

test('исключение сильнее включения целиком', () => {
  const rule = { whole: { fields: [22] }, exclude: /concrete/i };
  assert.equal(topicMatches(rule, { name: 'Concrete durability', field: 22, subfield: 2205 }), false);
  assert.equal(topicMatches(rule, { name: 'Steel bridges', field: 22, subfield: 2205 }), true);
});

test('отпечаток набора тем не зависит от порядка', () => {
  assert.equal(topicSetKey(['T2', 'T1', 'T3']), topicSetKey(['T3', 'T2', 'T1']));
  assert.notEqual(topicSetKey(['T1', 'T2']), topicSetKey(['T1', 'T3']));
});
