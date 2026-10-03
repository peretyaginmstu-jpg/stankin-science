// Сквозная проверка: выгрузка из имитации OpenAlex → снимок → сборка сайта → проверки сборки.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { startMockOpenAlex } from './mock-openalex.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('выгрузка, сборка и проверка на имитации API', { timeout: 120_000 }, async () => {
  const mock = await startMockOpenAlex();
  const dir = await mkdtemp(path.join(tmpdir(), 'stankin-science-'));
  try {
    const snapshotFile = path.join(dir, 'snapshot.json');
    const env = { ...process.env, OPENALEX_BASE: mock.url, OPENALEX_API_KEY: 'test-key', YEARS_FROM: '2016', YEARS_TO: '2025' };
    const fetched = await run('node', [path.join(ROOT, 'tools/fetch-openalex.mjs'), '--out', snapshotFile], { env, cwd: ROOT });
    assert.match(fetched.stdout, /Готово/);
    const snap = JSON.parse(await readFile(snapshotFile, 'utf8'));
    const fixture = JSON.parse(await readFile(path.join(ROOT, 'data/fixture/snapshot.json'), 'utf8'));

    assert.equal(snap.source, 'openalex');
    assert.deepEqual(snap.config.period, { from: 2016, to: 2025, p1: [2016, 2020], p2: [2021, 2025] });
    assert.equal(snap.institution.id, fixture.institution.id);
    assert.equal(snap.taxonomy.topics.length, fixture.taxonomy.topics.length);
    assert.equal(snap.stankin.works.length, fixture.stankin.works.length);
    assert.ok(Object.keys(snap.world.topics).length > 50);
    // компактные записи публикаций восстановлены из ответа API
    const w = snap.stankin.works.find((x) => x.id === fixture.stankin.works[0].id);
    const fw = fixture.stankin.works[0];
    for (const key of ['y', 'tp', 'fw', 'c', 'p', 't10', 'doi', 's', 'oa']) assert.deepEqual(w[key], fw[key], key);
    assert.deepEqual(w.co, fw.co);
    // мировой контекст компетенций: страны, организации, обзоры
    const ctx = Object.values(snap.competencies);
    assert.ok(ctx.length >= 10);
    assert.ok(ctx.every((c) => c.countries.length && c.institutions.length && c.topicKey));
    assert.ok(ctx.some((c) => c.reviews.length));
    assert.ok(Object.keys(snap.institutions).length > 20);
    // ключ не попал ни в журнал, ни в снимок
    assert.ok(!fetched.stdout.includes('test-key'));
    assert.ok(!JSON.stringify(snap).includes('test-key'));
    assert.ok(mock.requests.every((r) => r.includes('api_key=test-key')));

    const out = path.join(dir, 'site');
    await run('node', [path.join(ROOT, 'tools/build.mjs'), '--data', snapshotFile, '--out', out], { cwd: ROOT });
    const metrics = JSON.parse(await readFile(path.join(out,'data/metrics.json'),'utf8'));
    const html = await readFile(path.join(out,'index.html'),'utf8');
    const script = await readFile(path.join(out,'assets/js/site.mjs'),'utf8');
    assert.match(metrics.meta.assetVersion,/^[a-f0-9]{16}$/);
    assert.ok(html.includes(`assets/js/site.mjs?v=${metrics.meta.assetVersion}`));
    assert.ok(script.includes(`./charts/strategy.mjs?v=${metrics.meta.assetVersion}`));
    assert.ok(script.includes(`./charts/pish.mjs?v=${metrics.meta.assetVersion}`));
    const pish = JSON.parse(await readFile(path.join(out, 'data/pish.json'), 'utf8'));
    assert.equal(pish.totalWorks, snap.stankin.works.length);
    assert.ok(pish.rows.every(row => row.cohorts.p1 && row.cohorts.p2));
    for (const [locale, route] of [['ru', 'pish/'], ['en', 'en/pish/']]) {
      const page = await readFile(path.join(out, route, 'index.html'), 'utf8');
      assert.match(page, /data-pish-projector/);
      assert.match(page, /data-pish-print/);
      assert.match(page, /data-pish-horizon/);
      assert.ok(page.includes(`pish-loop-${locale}.svg`));
      assert.ok(page.includes('noindex, nofollow'));
      const diagram = await readFile(path.join(out, `data/pish-loop-${locale}.svg`), 'utf8');
      assert.match(diagram, /<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/);
      assert.ok(!diagram.includes('undefined'));
      for (const name of ['landscape','tree','paths']) {
        assert.ok(page.includes(`pish-${name}-${locale}.svg`));
        const agendaDiagram = await readFile(path.join(out,`data/pish-${name}-${locale}.svg`),'utf8');
        assert.match(agendaDiagram,/<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/);
        assert.ok(!agendaDiagram.includes('undefined')&&!agendaDiagram.includes('NaN'));
      }
      assert.ok(page.includes('pish-node-topic-physics-with-learned-correction'));
      for(const type of ['pish-landscape','pish-topic-tree','pish-research-paths']) assert.ok(page.includes(`data-chart="${type}"`),'new charts register their responsive renderer');
    }
    const think = JSON.parse(await readFile(path.join(out, 'data/think-tank.json'), 'utf8'));
    assert.equal(think.totalWorks, snap.stankin.works.length);
    assert.equal(think.directions.length, 8);
    assert.ok(think.checks.every(c => c.passed));
    for (const [locale, route] of [['ru','think-tank/'],['en','en/think-tank/']]) {
      const page = await readFile(path.join(out, route, 'index.html'), 'utf8');
      assert.ok(page.includes('noindex, nofollow'));
      for (const marker of ['data-think-tank','data-tt-projector','data-tt-print','data-tt-scenario','data-tt-static']) assert.ok(page.includes(marker), marker);
      assert.match(page, /<table/); // Numeric evidence remains available without JavaScript.
      for (const direction of think.directions) assert.ok(page.includes(`tt-direction-${direction.id}`));
      const diagram = await readFile(path.join(out, `data/think-tank-${locale}.svg`), 'utf8');
      assert.match(diagram, /<svg/);
      assert.ok(!diagram.includes('undefined') && !diagram.includes('NaN'));
    }
    const checked = await run('node', [path.join(ROOT, 'tools/check.mjs'), '--dir', out, '--publish'], { cwd: ROOT });
    assert.match(checked.stdout, /Проверка пройдена/);
  } finally {
    await mock.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('без ключа выгрузка останавливается с понятным сообщением', async () => {
  const env = { ...process.env, OPENALEX_API_KEY: '' };
  await assert.rejects(run('node', [path.join(ROOT, 'tools/fetch-openalex.mjs'), '--out', path.join(tmpdir(), 'never.json')], { env, cwd: ROOT }), (err) => err.code === 2 && /OPENALEX_API_KEY/.test(err.stderr));
});

test('явный анонимный режим получает настоящий по схеме снимок без параметра ключа', { timeout: 120_000 }, async () => {
  const mock = await startMockOpenAlex({ requireKey: false });
  const dir = await mkdtemp(path.join(tmpdir(), 'stankin-anonymous-'));
  try {
    const snapshotFile = path.join(dir, 'snapshot.json');
    const env = { ...process.env, OPENALEX_BASE: mock.url, OPENALEX_API_KEY: '', YEARS_FROM: '2016', YEARS_TO: '2025' };
    const fetched = await run('node', [path.join(ROOT, 'tools/fetch-openalex.mjs'), '--no-key', '--out', snapshotFile], { env, cwd: ROOT });
    const snapshot = JSON.parse(await readFile(snapshotFile, 'utf8'));
    assert.match(fetched.stdout, /Готово/);
    assert.equal(snapshot.source, 'openalex');
    assert.equal(snapshot.api.accessMode, 'anonymous');
    assert.equal(snapshot.stankin.affiliationAudit.retained, snapshot.stankin.works.length);
    assert.ok(mock.requests.length > 10);
    assert.ok(mock.requests.every((request) => !new URL(request, mock.url).searchParams.has('api_key')));
  } finally {
    await mock.close();
    await rm(dir, { recursive: true, force: true });
  }
});
