import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { PLOT_FILES, verifyPlotIntegrity } from '../tools/plot-integrity.mjs';

test('графики нельзя публиковать с изменёнными данными или повреждённым файлом', async () => {
  const dir = await mkdtemp(path.join(tmpdir(),'science-plots-'));
  const folder = path.join(dir,'data/science-plots');
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  try {
    await mkdir(folder,{recursive:true});
    const pish = {totalWorks:2856,fetchedAt:'2026-10-02'};
    const manifest = {schema:1,...pish,inputs:{},files:[]};
    for (const [name,values] of [['pish',pish],['metrics',{meta:{totalWorks:2856}}]]) {
      const bytes = Buffer.from(JSON.stringify(values));
      await writeFile(path.join(dir,`data/${name}.json`),bytes);
      manifest.inputs[name] = {sha256:digest(bytes)};
    }
    for (const name of PLOT_FILES) {
      const bytes = Buffer.from(`plot fixture ${name}`);
      await writeFile(path.join(folder,name),bytes);
      manifest.files.push({name,bytes:bytes.length,sha256:digest(bytes)});
    }
    await writeFile(path.join(folder,'manifest.json'),JSON.stringify(manifest));
    assert.deepEqual(await verifyPlotIntegrity(dir,pish),[]);
    assert.ok((await verifyPlotIntegrity(dir,pish,'changed-generator')).some(error=>error.includes('Генератор изменился')));
    await writeFile(path.join(folder,PLOT_FILES[0]),'damaged');
    assert.ok((await verifyPlotIntegrity(dir,pish)).some(error=>error.includes('контрольная сумма')));
    const original = await readFile(path.join(dir,'data/pish.json'));
    await writeFile(path.join(dir,'data/pish.json'),Buffer.concat([original,Buffer.from('\n')]));
    assert.ok((await verifyPlotIntegrity(dir,pish)).some(error=>error.includes('изменились')));
    assert.ok((await verifyPlotIntegrity(dir,{...pish,totalWorks:2857})).some(error=>error.includes('другому снимку')));
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test('Think Tank figures must match institutional evidence, scientific data and generator', async () => {
  const {THINK_TANK_PLOT_FILES,verifyThinkTankPlots}=await import('../tools/plot-integrity.mjs');
  const dir=await mkdtemp(path.join(tmpdir(),'think-plots-')),folder=path.join(dir,'data/think-tank-plots');
  const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
  try {
    await mkdir(folder,{recursive:true});
    const data=Buffer.from(JSON.stringify({totalWorks:2856,fetchedAt:'2026-10-02'}));
    await writeFile(path.join(dir,'data/think-tank.json'),data);
    const manifest={schema:1,totalWorks:2856,fetchedAt:'2026-10-02',inputs:{data:{sha256:hash(data)},generator:{sha256:'current'}},files:[]};
    for(const name of THINK_TANK_PLOT_FILES){const bytes=Buffer.from('fixture '+name);await writeFile(path.join(folder,name),bytes);manifest.files.push({name,bytes:bytes.length,sha256:hash(bytes)});}
    await writeFile(path.join(folder,'manifest.json'),JSON.stringify(manifest));
    assert.deepEqual(await verifyThinkTankPlots(dir,'current'),[]);
    assert.ok((await verifyThinkTankPlots(dir,'old')).some(e=>e.includes('генератор')));
    await writeFile(path.join(dir,'data/think-tank.json'),Buffer.concat([data,Buffer.from('\n')]));
    assert.ok((await verifyThinkTankPlots(dir,'current')).some(e=>e.includes('Данные')));
    await writeFile(path.join(folder,THINK_TANK_PLOT_FILES[0]),'broken');
    assert.ok((await verifyThinkTankPlots(dir,'current')).some(e=>e.includes('Повреждён')));
  } finally {await rm(dir,{recursive:true,force:true});}
});
