import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const PLOT_KEYS = ['forest-all-fields', 'world-topics', 'research-position', 'research-bridges'];
export const PLOT_FILES = PLOT_KEYS.flatMap(key => ['ru','en'].flatMap(lang => ['svg','pdf','png'].map(ext => `${key}-${lang}.${ext}`)));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

/** Prevent old figures from being published alongside a new scientific corpus. */
export async function verifyPlotIntegrity(dir, pish, generatorSha = null) {
  const errors = [];
  const folder = path.join(dir, 'data/science-plots');
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(folder, 'manifest.json'),'utf8')); }
  catch { return ['Нет читаемого manifest.json научных графиков Python.']; }
  if (manifest.schema !== 1) errors.push('Неизвестная версия manifest научных графиков.');
  if (manifest.totalWorks !== pish.totalWorks || manifest.fetchedAt !== pish.fetchedAt) errors.push('Графики Python относятся к другому снимку работ.');
  if (generatorSha && manifest.inputs?.generator?.sha256 !== generatorSha) errors.push('Генератор изменился после построения графиков Python.');
  for (const name of ['pish','metrics']) {
    const actual = hash(await readFile(path.join(dir,`data/${name}.json`)));
    if (manifest.inputs?.[name]?.sha256 !== actual) errors.push(`Исходные данные ${name}.json изменились после построения графиков.`);
  }
  const entries = Array.isArray(manifest.files) ? manifest.files : [];
  if (entries.length !== PLOT_FILES.length || new Set(entries.map(x=>x.name)).size !== entries.length) errors.push('Неверный состав файлов научных графиков.');
  for (const name of PLOT_FILES) {
    const record = entries.find(entry=>entry.name===name);
    if (!record) { errors.push(`График не указан в manifest: ${name}`); continue; }
    try {
      const bytes = await readFile(path.join(folder,name));
      if (!bytes.length || bytes.length!==record.bytes || hash(bytes)!==record.sha256) errors.push(`Не совпала контрольная сумма графика: ${name}`);
    } catch { errors.push(`Нет графика Python: ${name}`); }
  }
  return errors;
}
