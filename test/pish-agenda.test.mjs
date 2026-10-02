import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PISH_TOPIC_FAMILIES } from '../content/pish-topics.mjs';
import { PISH_SOURCES } from '../content/pish.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';
import { INDUSTRIAL_TOPIC_LENSES } from '../content/topic-lenses.mjs';
import { pishTopicTree,pishResearchPaths } from '../src/charts/pish-topics.mjs';
import { pishTopicLandscape } from '../src/charts/pish.mjs';

test('research questions cite existing sources and keep bibliometric clusters distinct',()=>{
  const sourceIds=new Set(PISH_SOURCES.map(s=>s.id)),groups=new Set(COMPETENCIES.map(c=>c.id)),topics=new Set(INDUSTRIAL_TOPIC_LENSES.map(t=>t.id));
  const questions=PISH_TOPIC_FAMILIES.flatMap(f=>f.subtopics);
  assert.equal(questions.length,15);assert.equal(new Set(questions.map(t=>t.id)).size,15);
  for(const q of questions){
    assert.ok(q.label.ru&&q.label.en&&q.question.ru&&q.question.en);
    assert.ok(q.sources.length&&q.sources.every(id=>sourceIds.has(id)),q.id);
    assert.ok(q.competencyIds.every(id=>groups.has(id)),q.id);
    assert.ok(q.topicIds.every(id=>topics.has(id)),q.id);
  }
  assert.deepEqual(questions.find(q=>q.id==='prediction-uncertainty').topicIds,[],'no invented growth series for the narrow UQ subtopic');
});

test('agenda trees and research paths preserve questions, links, responsive layouts and CSP',()=>{
  const families=PISH_TOPIC_FAMILIES.map(f=>({label:f.title.ru,metric:'n=10 · FWCI 0,8',status:'develop',subtopics:f.subtopics.map(q=>({label:q.label.ru,question:q.question.ru,status:q.status,href:`#pish-node-topic-${q.id}`}))}));
  for(const width of [360,760,900,1160]){
    const svg=pishTopicTree({root:{label:'<Research>',question:'Evidence & unknowns'},families},width);
    assert.equal((svg.match(/<a href=/g)??[]).length,15);
    assert.ok(svg.includes('&lt;Research&gt;')&&svg.includes('&amp;'));
    assert.ok(!svg.includes('<style>')&&!svg.includes('NaN')&&!svg.includes('undefined'));
    assert.ok(svg.includes('pish-node-topic-prediction-uncertainty'));
    const path=pishResearchPaths({paths:[{base:'Data',world:'World',question:'<Question>',decision:'Choice',href:'#pish-node-topic-model-transfer'}]},width);
    assert.ok(path.includes('&lt;Question&gt;')&&path.includes('pish-node-topic-model-transfer'));
  }
  assert.ok(pishTopicTree({families},1160,{standalone:true}).includes('<style>'));
});

test('topic landscape preserves zero and missing evidence and never invents a citation coordinate',()=>{
  const spec={rows:[{id:'zero',label:'A < B',fwciP2:0,nP2:0,nP1:1,worldShareChange:0,fwciLow:0,fwciHigh:0,status:'build'},{id:'missing',label:'Missing',fwciP2:null,nP2:null,worldShareChange:null}],topics:[{id:'t',label:'Known & wide',worldShareChange:0,nP2:0,worldP1:10,worldP2:10}]};
  for(const width of [360,800,1160]){
    const svg=pishTopicLandscape(spec,width);
    assert.ok(svg.includes('A &lt; B')&&svg.includes('Known &amp; wide'));
    assert.ok(!svg.includes('NaN')&&!svg.includes('undefined')&&!svg.includes('<style>'));
    assert.ok(svg.includes('—'),'missing citation data remain absent');
    assert.ok(svg.includes('0'),'measured zero remains zero');
  }
});
