#!/usr/bin/env node
// Сборка сайта из снимка данных OpenAlex.
//
//   node tools/build.mjs [--data data/snapshot/snapshot.json] [--out dist]
//
// Сеть не нужна: всё берётся из снимка (tools/fetch-openalex.mjs) или из синтетического снимка
// для разработки (data/fixture/snapshot.json — тогда на каждой странице будет плашка «демо»).
// Переменная SITE_BASE задаёт путь сайта на хостинге (по умолчанию /stankin-science/) — он нужен
// только странице 404, которую GitHub Pages отдаёт по любому адресу.

import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { SITE, INSTITUTION, THRESHOLDS } from '../config/site.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';
import * as TAXONOMY from '../content/taxonomy.mjs';
import { LANGS, STRINGS } from '../content/i18n.mjs';
import { buildModel } from '../src/lib/metrics.mjs';
import { buildStrategy } from '../src/lib/strategy.mjs';
import { buildIndustrialTopics } from '../content/topic-lenses.mjs';
import { decisionsPage } from '../src/render/strategy.mjs';
import { buildPishModel } from '../src/lib/pish.mjs';
import { buildThinkTank } from '../src/lib/think-tank.mjs';
import { thinkTankPage, thinkTankOverviewSvg } from '../src/render/think-tank.mjs';
import { buildIndustryIndex } from '../src/lib/industry-index.mjs';
import { industryIndexPage, industryIndexSvg } from '../src/render/industry-index.mjs';
import { buildWorldTrends } from '../src/lib/world-trends.mjs';
import { worldTrendSvg } from '../src/render/world-trends.mjs';
import { buildExplorer } from '../src/lib/explorer.mjs';
import { buildBetEvidence } from '../src/lib/bet-evidence.mjs';
import { pishPage, pishLoopSpec } from '../src/render/pish.mjs';
import { pishAgendaSpecs } from '../src/render/pish-agenda.mjs';
import { pishBetMapSpec, pishRoadmapSpec } from '../src/render/pish-bet.mjs';
import { pishBetMap, pishRoadmapChart } from '../src/charts/pish-bet.mjs';
import { PISH_BET, PISH_BET_REASONS, PISH_BET_OPTIONS, PISH_BET_BOUNDARY, PISH_BET_PARTNERS, PISH_BET_TIMELINE, PISH_BET_RISKS, PISH_BET_REVIEWED_AT } from '../content/pish-bet.mjs';
import { pishTopicTree, pishResearchPaths } from '../src/charts/pish-topics.mjs';
import { PISH_TOPIC_UMBRELLA, PISH_TOPIC_FAMILIES, PISH_TOPIC_METHOD_CAVEAT } from '../content/pish-topics.mjs';
import { pishLoop, pishTopicLandscape } from '../src/charts/pish.mjs';
import { PISH_REVIEWED_AT, PISH_SOURCES, PISH_REQUIREMENTS, PISH_MINIMUMS, PISH_CANDIDATES } from '../content/pish.mjs';
import { typograph } from '../src/lib/text.mjs';
import { makeContext, langPrefix } from '../src/render/kit.mjs';
import { layout } from '../src/render/layout.mjs';
import { homePage, competenciesPage, competencyPage, trendsPage, collaborationPage, methodPage, notFoundPage } from '../src/render/pages.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith('--')) continue;
    const [k, v] = argv[i].slice(2).split('=');
    out[k] = v ?? argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const dataFile = path.resolve(args.data ?? path.join(ROOT, 'data/snapshot/snapshot.json'));
const outDir = path.resolve(args.out ?? path.join(ROOT, 'dist'));
const base = (process.env.SITE_BASE ?? '/stankin-science/').replace(/\/?$/, '/');

const csvCell = (v) => {
  if (v == null) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (header, rows) => `﻿${[header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')}\n`;

async function write(file, content) {
  const full = path.join(outDir, file);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, content);
}

const JS_MODULES = [
  ['src/assets/js/site.mjs','assets/js/site.mjs'],
  ['src/assets/js/explorer.mjs','assets/js/explorer.mjs'],
  ['src/assets/js/world-trends.mjs','assets/js/world-trends.mjs'],
  ['src/assets/js/think-tank.mjs','assets/js/think-tank.mjs'],
  ['src/charts/charts.mjs','assets/js/charts/charts.mjs'],
  ['src/charts/strategy.mjs','assets/js/charts/strategy.mjs'],
  ['src/charts/pish.mjs','assets/js/charts/pish.mjs'],
  ['src/charts/pish-topics.mjs','assets/js/charts/pish-topics.mjs'],
  ['src/charts/pish-bet.mjs','assets/js/charts/pish-bet.mjs'],
  ['src/lib/text.mjs','assets/js/lib/text.mjs'],
  ['src/lib/format.mjs','assets/js/lib/format.mjs'],
];

async function assetVersion() {
  const files = [...JS_MODULES.map(([source])=>source),'src/assets/css/site.css','src/assets/css/strategy.css','src/assets/css/pish.css','src/assets/css/explorer.css','src/assets/css/world-trends.css','src/assets/css/think-tank.css','src/assets/vendor/echarts/metadata.json'];
  const contents = await Promise.all(files.map(file=>readFile(path.join(ROOT,file))));
  const hash = createHash('sha256');
  for (const content of contents) hash.update(content);
  return hash.digest('hex').slice(0,16);
}

async function copyAssets(version) {
  const a = path.join(ROOT, 'src/assets');
  await cp(path.join(a, 'css'), path.join(outDir, 'assets/css'), { recursive: true });
  await cp(path.join(a, 'fonts'), path.join(outDir, 'assets/fonts'), { recursive: true });
  await cp(path.join(a, 'img'), path.join(outDir, 'assets/img'), { recursive: true });
  await cp(path.join(a, 'vendor'), path.join(outDir, 'assets/vendor'), { recursive: true });
  // Version the complete import graph, so a new HTML page cannot load an old module.
  for (const [source,target] of JS_MODULES) {
    const code = await readFile(path.join(ROOT,source),'utf8');
    const versioned = code.replace(/from (['"])(\.\.?\/[^'"]+\.mjs)\1/g,(_,quote,url)=>`from ${quote}${url}?v=${version}${quote}`);
    await write(target,versioned);
  }
}

function logSummary(model) {
  const rows = model.competencies.map((c) => [
    c.id.padEnd(24), String(c.n).padStart(5), String(c.topicCount).padStart(5),
    (c.ai ?? 0).toFixed(2).padStart(6), (c.fwci ?? 0).toFixed(2).padStart(6),
    String(c.rankHome?.rank ?? '—').padStart(5), String(c.rankWorld?.rank ?? '—').padStart(5),
    c.visible ? '' : 'скрыта', c.contextStatus === 'ok' ? '' : `контекст: ${c.contextStatus}`,
  ].join(' '));
  console.log('Компетенция               работ   тем  спец.   FWCI  №РФ №мир');
  for (const r of rows) console.log(r);
  const cov = model.coverage;
  console.log(`В компетенциях ${cov.assignedWorks} из ${cov.classifiedWorks} работ с темой; без темы ${cov.unclassifiedWorks}.`);
  if (cov.unassignedTopics.length) {
    console.log('Крупнейшие темы университета вне компетенций (для уточнения правил в content/competencies.mjs):');
    for (const t of cov.unassignedTopics.slice(0, 15)) console.log(`  ${String(t.n).padStart(4)}  ${t.id}  ${t.name} [${t.subfield}]`);
  }
}

async function main() {
  const snapshot = JSON.parse(await readFile(dataFile, 'utf8'));
  if (snapshot.schema !== 1) throw new Error(`Неизвестная версия снимка: ${snapshot.schema}`);
  const model = buildModel(snapshot, { competencies: COMPETENCIES, thresholds: THRESHOLDS, home: INSTITUTION.country });
  const version = await assetVersion();
  model.meta.assetVersion = version;
  // Python renders the exported numbers in a separate step. The checker verifies
  // their hashes before publication; a normal dependency-free Node build omits them.
  model.meta.pythonPlots = process.env.PYTHON_PLOTS === '1';
  model.strategy = buildStrategy(model);
  model.industrialTopics = buildIndustrialTopics(snapshot, model);
  model.pish = buildPishModel(snapshot, model);
  model.explorer = buildExplorer(snapshot, model);
  model.worldTrends = buildWorldTrends(snapshot, model);
  model.industryIndex = buildIndustryIndex(snapshot);
  model.thinkTank = buildThinkTank(snapshot, model);
  model.betEvidence = buildBetEvidence(snapshot, model);

  // Дополнения для страниц: источники публикаций, английские названия классификации, состав компетенций.
  model.sources = snapshot.stankin.sources ?? {};
  model.taxonomyNames = { subfields: snapshot.taxonomy.subfields ?? {}, fields: snapshot.taxonomy.fields ?? {} };
  const topicById = new Map(snapshot.taxonomy.topics.map((t) => [t.id, t]));
  const ownTopic = new Map(model.topics.map((t) => [t.id, t.n]));
  model.competencyTopics = Object.fromEntries(model.competencies.map((c) => [c.id, c.topicIds
    .map((id) => {
      const [p1, p2] = snapshot.world.topics[id] ?? [0, 0];
      return { id, name: topicById.get(id)?.name ?? id, world: p1 + p2, n: ownTopic.get(id) ?? 0 };
    })
    .sort((a, b) => b.n - a.n || b.world - a.world)]));

  logSummary(model);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  await copyAssets(version);

  const visible = model.competencies.filter((c) => c.visible).sort((a, b) => (b.ai ?? 0) - (a.ai ?? 0));
  const pages = [];
  const demo = model.meta.demo;

  for (const lang of LANGS) {
    const prefix = langPrefix(lang);
    const render = async (routeKey, routePath, title, description, bodyFn) => {
      const pageDir = prefix + routePath;
      const ctx = makeContext({ lang, model, competencies: COMPETENCIES, taxonomyRu: TAXONOMY, route: routeKey, pageDir, site: SITE, institution: INSTITUTION });
      const body = bodyFn(ctx);
      const html = layout(ctx, { title, description, body, routeKey, routePath, demo });
      const file = `${pageDir}index.html`;
      await write(file, typograph(html, lang));
      pages.push(file);
    };
    const t = STRINGS[lang];
    await render('home', '', t.home.title, t.site.description, (ctx) => homePage(ctx));
    await render('competencies', 'competencies/', t.competencies.title, null, (ctx) => competenciesPage(ctx));
    for (let i = 0; i < visible.length; i += 1) {
      const c = visible[i];
      const def = COMPETENCIES.find((d) => d.id === c.id);
      await render('competency', `competencies/${c.id}/`, def.name[lang], def.summary[lang], (ctx) => competencyPage(ctx, c, { prev: visible[i - 1], next: visible[i + 1] }));
    }
    await render('trends', 'trends/', t.trends.title, t.trends.lead, (ctx) => trendsPage(ctx));
    await render('industry-index', 'industry-index/', lang === 'ru' ? 'Отраслевой индекс университета' : 'University industry index', null, industryIndexPage);
    await render('think-tank', 'think-tank/', lang === 'ru' ? 'Think Tank: научные приоритеты' : 'Think Tank: research priorities', lang === 'ru' ? 'Научные приоритеты СТАНКИН внутри станкоинструментальной отрасли: изменения за пять лет и варианты развития до 2030 и 2036 года.' : 'STANKIN research priorities within the machine-tool industry: five years of change and options towards 2030 and 2036.', thinkTankPage);
    await render('decisions', 'decisions/', t.nav.decisions, t.site.description, decisionsPage);
    await render('pish', 'pish/', t.nav.pish, lang === 'ru' ? 'Какую новую ПИШ предложить СТАНКИН: что показывают исследования, что требуется по конкурсу и какой продукт нужен заказчику.' : 'Choosing a new STANKIN engineering school: what research shows, what the competition requires and what product the customer needs.', pishPage);
    const diagramCtx = makeContext({ lang, model, competencies: COMPETENCIES, taxonomyRu: TAXONOMY, route: 'pish', pageDir: prefix + 'pish/', site: SITE, institution: INSTITUTION });
    await write(`data/world-trends-${lang}.svg`, worldTrendSvg(diagramCtx,{standalone:true}));
    await write(`data/industry-index-${lang}.svg`, industryIndexSvg(diagramCtx,{standalone:true}));
    await write(`data/think-tank-${lang}.svg`, thinkTankOverviewSvg(diagramCtx,{standalone:true}));
    const diagramSpec = pishLoopSpec(diagramCtx);
    const pagesOwner = new URL(SITE.repoUrl).pathname.split('/').filter(Boolean)[0];
    const diagramPageUrl = `https://${pagesOwner}.github.io${base}${prefix}pish/`;
    // A saved SVG must link back to the page, rather than an absent local fragment.
    diagramSpec.nodes = diagramSpec.nodes.map(node => ({ ...node, href: `${diagramPageUrl}#pish-node-${node.id}` }));
    await write(`data/pish-loop-${lang}.svg`, pishLoop(diagramSpec, 1160, { standalone: true }));
    await write(`data/pish-bet-${lang}.svg`, pishBetMap(pishBetMapSpec(diagramCtx), 1160, { standalone: true }));
    await write(`data/pish-roadmap-${lang}.svg`, pishRoadmapChart(pishRoadmapSpec(diagramCtx), 1160, { standalone: true }));
    const agendaSpecs = pishAgendaSpecs(diagramCtx);
    const absoluteLinks = value => Array.isArray(value) ? value.map(absoluteLinks) : value && typeof value === 'object'
      ? Object.fromEntries(Object.entries(value).map(([key,item]) => [key,key==='href' ? new URL(item,diagramPageUrl).href : absoluteLinks(item)])) : value;
    for (const [key,renderer] of [['landscape',pishTopicLandscape],['tree',pishTopicTree],['paths',pishResearchPaths]]) {
      await write(`data/pish-${key}-${lang}.svg`, renderer(absoluteLinks(agendaSpecs[key]),1160,{standalone:true}));
    }
    await render('collaboration', 'collaboration/', t.collaboration.title, t.collaboration.lead, (ctx) => collaborationPage(ctx));
    await render('method', 'method/', t.method.title, t.method.lead, (ctx) => methodPage(ctx, { competencies: COMPETENCIES }));
  }

  // 404: GitHub Pages отдаёт этот файл по любому неизвестному адресу, поэтому ссылки в нём абсолютные.
  {
    const ctxRu = makeContext({ lang: 'ru', model, competencies: COMPETENCIES, taxonomyRu: TAXONOMY, route: '404', pageDir: '', site: SITE, institution: INSTITUTION });
    ctxRu.page = (p) => base + p;
    ctxRu.asset = (p) => base + p;
    const ctxEn = { ...makeContext({ lang: 'en', model, competencies: COMPETENCIES, taxonomyRu: TAXONOMY, route: '404', pageDir: '', site: SITE, institution: INSTITUTION }) };
    ctxEn.page = (p) => `${base}en/${p}`;
    ctxEn.asset = (p) => base + p;
    const body = `${notFoundPage(ctxRu)}<div lang="en">${notFoundPage(ctxEn)}</div>`;
    await write('404.html', typograph(layout(ctxRu, { title: STRINGS.ru.ui.notFoundTitle, body, routeKey: '404', routePath: null, demo }), 'ru'));
    pages.push('404.html');
  }

  // Данные для загрузки
  const { competencyTopics, explorer, worldTrends, industryIndex, thinkTank, ...exportable } = model;
  await write('data/think-tank.json', `${JSON.stringify(thinkTank,null,2)}\n`);
  await write('data/industry-index.json', `${JSON.stringify(industryIndex,null,2)}\n`);
  await write('data/world-trends.json', `${JSON.stringify(worldTrends)}\n`);
  await write('data/explorer.json', `${JSON.stringify(explorer)}\n`);
  await write('data/bet-evidence.json', `${JSON.stringify(model.betEvidence, null, 1)}\n`);
  await write('data/metrics.json', `${JSON.stringify({ ...exportable, competencyTopics, competencyNames: Object.fromEntries(COMPETENCIES.map((c) => [c.id, c.name])) }, null, 1)}\n`);
  await write('data/strategy.json', `${JSON.stringify({ ...model.strategy, industrialTopics: model.industrialTopics }, null, 2)}\n`);
  await write('data/pish.json', `${JSON.stringify({ ...model.pish, callReviewedAt: PISH_REVIEWED_AT, sources: PISH_SOURCES, requirements: PISH_REQUIREMENTS, minimums: PISH_MINIMUMS, candidates: PISH_CANDIDATES, bet: { reviewedAt: PISH_BET_REVIEWED_AT, bet: PISH_BET, reasons: PISH_BET_REASONS, options: PISH_BET_OPTIONS, boundary: PISH_BET_BOUNDARY, partners: PISH_BET_PARTNERS, timeline: PISH_BET_TIMELINE, risks: PISH_BET_RISKS }, agenda:{umbrella:PISH_TOPIC_UMBRELLA,families:PISH_TOPIC_FAMILIES,caveat:PISH_TOPIC_METHOD_CAVEAT} }, null, 2)}\n`);
  await write('data/competencies.csv', csv(
    ['id', 'name_ru', 'name_en', 'works', 'world_works', 'world_share', 'specialisation_index', 'fwci', 'top10_share', 'intl_share', 'growth_university', 'growth_world', 'rank_russia', 'rank_world', 'topics'],
    model.competencies.map((c) => {
      const d = COMPETENCIES.find((x) => x.id === c.id);
      return [c.id, d.name.ru, d.name.en, c.n, c.world, c.share, c.ai, c.fwci, c.top10, c.intl, c.growthOwn, c.growthWorld, c.rankHome?.exact ? c.rankHome.rank : '', c.rankWorld?.exact ? c.rankWorld.rank : '', c.topicCount];
    }),
  ));
  await write('data/subfields.csv', csv(
    ['subfield_id', 'name_en', 'name_ru', 'field_id', 'works', 'world_works', 'world_share', 'specialisation_index', 'fwci', 'top10_share'],
    model.subfields.map((s) => [s.id, TAXONOMY.SUBFIELDS[s.id]?.en ?? snapshot.taxonomy.subfields?.[s.id] ?? '', TAXONOMY.SUBFIELDS[s.id]?.ru ?? '', s.field, s.n, s.world, s.share, s.ai, s.fwci, s.top10]),
  ));
  await write('data/topics.csv', csv(
    ['topic_id', 'name', 'subfield_id', 'competency', 'works', 'works_p1', 'works_p2', 'world_works', 'world_p1', 'world_p2', 'specialisation_index', 'fwci', 'top10_share'],
    model.topics.map((t) => [t.id, t.name, t.subfield, t.competency ?? '', t.n, t.nP1, t.nP2, t.world, t.worldP1, t.worldP2, t.ai, t.fwci, t.top10]),
  ));

  await write('robots.txt', SITE.noindex ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n');
  await write('.nojekyll', '');
  await write('build.json', `${JSON.stringify({
    source: snapshot.source,
    demo,
    fetchedAt: snapshot.fetchedAt,
    pythonPlots: model.meta.pythonPlots,
    builtAt: new Date().toISOString(),
    base,
    period: model.meta.period,
    competencies: visible.map((c) => c.id),
    pages,
  }, null, 2)}\n`);
  console.log(`Сайт собран: ${outDir} · страниц ${pages.length}${demo ? ' · ДЕМО-ДАННЫЕ' : ''}`);
}

main().catch((err) => {
  console.error(`Сборка не удалась: ${err.stack ?? err.message}`);
  process.exit(1);
});
