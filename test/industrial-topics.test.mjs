import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndustrialTopics, INDUSTRIAL_TOPIC_LENSES } from '../content/topic-lenses.mjs';
import { FRONTIERS, FRONTIER_SOURCES } from '../content/frontiers.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';

test('industrial topic lens distinguishes a missing topic from zero observed university work', () => {
  const id = INDUSTRIAL_TOPIC_LENSES[0].id;
  const model = { topics: [], totals: { worldP1: 1000, worldP2: 2000 } };
  const rows = buildIndustrialTopics({ taxonomy: { topics: [{ id, name:'Topic' }] }, world: { topics: { [id]:[100,300] } } }, model);
  const present = rows.find(r => r.id === id);
  assert.equal(present.nP2,0);
  assert.equal(present.available,true);
  assert.equal(present.worldShareRatio,1.5);
  assert.equal(present.growthRatio,3);
  const missing = rows.find(r => r.id !== id);
  assert.equal(missing.available,false);
  assert.equal(missing.nP2,null);
  assert.equal(missing.worldShareRatio,null);
});

test('zero world baseline does not become infinite topic growth', () => {
  const id = INDUSTRIAL_TOPIC_LENSES[0].id;
  const rows = buildIndustrialTopics({ taxonomy: { topics:[{id,name:'Topic'}] }, world:{topics:{[id]:[0,300]}} }, {topics:[],totals:{worldP1:1000,worldP2:2000}});
  assert.equal(rows.find(r=>r.id===id).growthRatio,null);
});

test('research synthesis maps only existing publication groups and referenced primary sources', () => {
  const ids = new Set(COMPETENCIES.map(c=>c.id));
  const sources = new Set(FRONTIER_SOURCES.map(s=>s.id));
  for (const f of FRONTIERS) {
    assert.ok(f.competencyIds.length > 0);
    assert.ok(f.sourceIds.length > 0);
    assert.ok(f.competencyIds.every(id=>ids.has(id)),f.id);
    assert.ok(f.sourceIds.every(id=>sources.has(id)),f.id);
  }
});
