import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { AFFILIATION_EXCLUSIONS, INSTITUTION, SITE, THRESHOLDS, WORK_TYPES } from '../config/site.mjs';
import { COMPETENCIES } from '../content/competencies.mjs';
import * as TAXONOMY from '../content/taxonomy.mjs';
import { auditUniversityWorks, removeOwnInstitutionGroups } from '../tools/fetch-openalex.mjs';
import { buildModel, rankIn } from '../src/lib/metrics.mjs';
import { makeContext, rankText } from '../src/render/kit.mjs';
import { methodPage } from '../src/render/pages.mjs';
import { startMockOpenAlex } from './mock-openalex.mjs';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('public exclusion list contains only 188 unique work IDs and preserves noindex', () => {
  assert.equal(AFFILIATION_EXCLUSIONS.auditDate, '2026-10-02');
  assert.equal(AFFILIATION_EXCLUSIONS.workIds.length, 188);
  assert.equal(new Set(AFFILIATION_EXCLUSIONS.workIds).size, 188);
  assert.ok(AFFILIATION_EXCLUSIONS.workIds.every((id) => /^W\d+$/.test(id)));
  assert.equal(SITE.noindex, true);
});

test('affiliation audit normalises IDs, deduplicates and does not reject unusual topics', () => {
  const conflict = { id: 'https://openalex.org/W2771007730', primary_topic: { display_name: 'Chemistry' } };
  const dental = { id: 'W4392049806', primary_topic: { display_name: 'Dental Materials' } };
  const military = { id: 'W9999999991', primary_topic: { display_name: 'Military Technology' } };
  const ambiguous = { id: 'W9999999992' };
  const result = auditUniversityWorks([conflict, dental, military, ambiguous, conflict]);
  assert.deepEqual(result.works, [dental, military, ambiguous]);
  assert.deepEqual({ raw: result.audit.rawUnique, excluded: result.audit.excluded, retained: result.audit.retained, duplicate: result.audit.duplicateRecords }, { raw: 4, excluded: 1, retained: 3, duplicate: 1 });
  assert.deepEqual(result.audit.excludedIds, ['W2771007730']);
  assert.equal(result.audit.rawFetched, 5);
  assert.throws(() => auditUniversityWorks([{ id: null }]), /valid OpenAlex work ID/);
});

test('cleaned rank cannot regain rejected works from raw provider group counts', () => {
  const context = {
    institutions: [{ id: 'I1', n: 100 }, { id: 'I2', n: 90 }, { id: 'I3', n: 80 }],
    russianInstitutions: [{ id: 'I1', n: 100 }, { id: 'I2', n: 90 }],
    countries: [{ code: 'RU', n: 150 }],
    worldByYear: { 2020: 200 },
  };
  const cleaned = removeOwnInstitutionGroups(context, ['https://openalex.org/I1']);
  assert.deepEqual(cleaned.institutions.map((g) => g.id), ['I2', 'I3']);
  assert.deepEqual(context.institutions.map((g) => g.id), ['I1', 'I2', 'I3']);
  assert.equal(cleaned.countries, context.countries);
  assert.equal(cleaned.worldByYear, context.worldByYear);
  const rank = rankIn(cleaned.institutions, ['I1'], 50);
  assert.equal(rank.n, 50);
  assert.equal(rank.rank, 3);
  assert.equal(rank.exact, false);
});

test('fetch filters before all local metrics, partners and venues; methodology reports RU/EN counts', { timeout: 120_000 }, async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'stankin-affiliation-'));
  let mock;
  try {
    const fixture = JSON.parse(await readFile(path.join(ROOT, 'data/fixture/snapshot.json'), 'utf8'));
    const originalCount = fixture.stankin.works.length;
    fixture.institutions.I888888888 = { name: 'Rejected-only synthetic partner', country: 'LU', type: 'education' };
    fixture.stankin.sources.S888888888 = { name: 'Rejected-only synthetic journal', type: 'journal' };
    const rejected = { ...fixture.stankin.works[0], id: 'W2771007730', in: [fixture.institution.id, 'I888888888'], co: ['RU', 'LU'], s: 'S888888888', c: 999999, fw: 999 };
    fixture.stankin.works.push(rejected, { ...rejected });
    const fixtureFile = path.join(dir, 'fixture.json');
    await writeFile(fixtureFile, JSON.stringify(fixture));
    mock = await startMockOpenAlex({ fixturePath: fixtureFile });
    const snapshotFile = path.join(dir, 'snapshot.json');
    await run('node', [path.join(ROOT, 'tools/fetch-openalex.mjs'), '--out', snapshotFile], {
      cwd: ROOT,
      env: { ...process.env, OPENALEX_API_KEY: 'test-key', OPENALEX_BASE: mock.url, YEARS_FROM: '2016', YEARS_TO: '2025' },
    });
    const snapshot = JSON.parse(await readFile(snapshotFile, 'utf8'));
    const audit = snapshot.stankin.affiliationAudit;
    assert.equal(audit.rawFetched, originalCount + 2);
    assert.equal(audit.rawUnique, originalCount + 1);
    assert.equal(audit.excluded, 1);
    assert.equal(audit.retained, originalCount);
    assert.equal(audit.duplicateRecords, 1);
    assert.equal(snapshot.api.accessMode, 'keyed');
    assert.ok(WORK_TYPES.includes('conference-paper'));
    const workQueries = mock.requests.filter((r) => r.startsWith('/works'));
    assert.ok(workQueries.every((r) => new URL(r, 'http://mock').searchParams.get('filter').includes('is_retracted:false')));
    const scopedQueries = workQueries.filter((r) => !new URL(r, 'http://mock').searchParams.get('filter').includes('type:review,'));
    assert.ok(scopedQueries.every((r) => new URL(r, 'http://mock').searchParams.get('filter').includes('conference-paper')));
    assert.ok(!snapshot.stankin.works.some((w) => w.id === rejected.id));
    assert.ok(!snapshot.stankin.sources.S888888888);
    assert.ok(!snapshot.institutions.I888888888);
    const model = buildModel(snapshot, { competencies: COMPETENCIES, thresholds: THRESHOLDS });
    assert.equal(model.totals.n, originalCount);
    assert.equal(model.meta.affiliationAudit, audit);
    assert.ok(![...model.collaboration.partnersForeign, ...model.collaboration.partnersHome].some((p) => p.id === 'I888888888'));
    for (const c of model.competencies.filter((c) => c.rankWorld)) assert.equal(c.rankWorld.n, c.n);
    // Force the incomplete multi-chunk contract, independently of the fixture topic count.
    for (const context of Object.values(snapshot.competencies)) context.rankingsComplete = false;
    const partialModel = buildModel(snapshot, { competencies: COMPETENCIES, thresholds: THRESHOLDS });
    const partialRank = partialModel.competencies.find((c) => c.rankWorld)?.rankWorld;
    assert.ok(partialRank.bound);
    assert.equal(partialRank.exact, false);
    for (const lang of ['ru', 'en']) {
      const ctx = makeContext({ lang, model, competencies: COMPETENCIES, taxonomyRu: TAXONOMY, route: 'method', pageDir: lang === 'ru' ? 'method/' : 'en/method/', site: SITE, institution: INSTITUTION });
      const html = methodPage(ctx, { competencies: COMPETENCIES });
      assert.match(html, /id="affiliation-audit"/);
      assert.ok(html.includes(lang === 'ru' ? 'Исключено по списку конфликтующих аффилиаций: 1.' : 'Excluded for conflicting affiliations: 1.'));
      assert.ok(html.includes('Military Technology'));
      assert.ok(html.includes('2026-10-02'));
      assert.ok(rankText(ctx, partialRank).includes('≥'));
    }
  } finally {
    if (mock) await mock.close();
    await rm(dir, { recursive: true, force: true });
  }
});
