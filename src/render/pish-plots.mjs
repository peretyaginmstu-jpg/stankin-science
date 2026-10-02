import { esc } from './kit.mjs';

const L = (ctx, ru, en) => ctx.lang === 'en' ? en : ru;

export function pishPythonPlots(ctx) {
  if (!ctx.model.meta.pythonPlots) return '';
  const plots = [
    ['forest-all-fields',
      '1 · Какие направления удерживают научное влияние',
      '1 · Which fields retain citation impact',
      'Все 20 групп: средний FWCI двух пятилетий, условные 95% интервалы и разность средних. Рядом — число работ, медиана и вклад трёх максимальных FWCI в их общую сумму. Так видно, где вывод держится на большой группе, а где — на нескольких работах.',
      'All 20 groups: mean FWCI for the two periods, conditional 95% intervals and the difference in means. Counts, medians and the three largest FWCI values’ contribution to their sum show where a result rests on many works and where a few papers dominate.'],
    ['world-topics',
      '2 · Где растёт мировая доля темы — и сколько работ есть у нас',
      '2 · World topic momentum and STANKIN publication counts',
      '13 выбранных основных тем OpenAlex. Слева — изменение доли темы во всех мировых публикациях. Справа — число работ СТАНКИН в каждом пятилетии. Это разные величины и разные шкалы; рост мировой темы ещё не означает роста нашего научного влияния.',
      '13 selected OpenAlex primary topics. The left panel shows a topic’s share change in all world publications; the right panel shows STANKIN counts in each period. These are different quantities on separate scales. World growth does not establish stronger local citation impact.'],
    ['research-bridges',
      '3 · Какие научные вопросы поставить на стыке направлений',
      '3 · Research questions at the intersections',
      'Пять семейств и 15 вопросов: от физики резания до переноса модели между станками. Каждая связь — предложение для исследований. Числа относятся к указанным группам и мировым темам; команда, данные и научная новизна требуют отдельной проверки.',
      'Five families and 15 questions, from cutting physics to model transfer between machines. Each connection is a research proposal. Numbers refer to the stated groups and world topics; people, data and novelty require separate checks.'],
  ];
  const folder = 'data/science-plots/';
  return `<section class="pish-python-plots" id="pish-python-plots" aria-labelledby="pish-python-heading"><p class="eyebrow">${esc(L(ctx,'Научные графики · Python / Matplotlib','Scientific figures · Python / Matplotlib'))}</p><h3 id="pish-python-heading">${esc(L(ctx,'Полная картина перед выбором темы','The full picture before choosing a topic'))}</h3><p class="section-lead">${esc(L(ctx,'Графики построены из той же базы, что и сайт. Их можно открыть крупно, скачать для совещания и пересчитать. Пропуски и малые выборки отмечены; суммарный балл «лучшей темы» не вводится.','These figures use the same corpus as the website. Open them at full size, download them for the meeting or reproduce them. Missing data and small groups are marked; there is no invented overall “best topic” score.'))}</p>${plots.map(([id,ru,en,ruNote,enNote]) => {
    const stem = `${folder}${id}-${ctx.lang}`;
    const title = L(ctx,ru,en);
    return `<figure class="pish-python-figure" id="pish-python-${id}"><figcaption><h4>${esc(title)}</h4><p>${esc(L(ctx,ruNote,enNote))}</p></figcaption><a class="pish-python-image" href="${esc(ctx.asset(stem+'.svg'))}" aria-label="${esc(L(ctx,'Открыть график крупно: ','Open full-size figure: ')+title)}"><img src="${esc(ctx.asset(stem+'.svg'))}" alt="${esc(title)}" loading="lazy" decoding="async"></a><div class="pish-downloads"><a href="${esc(ctx.asset(stem+'.svg'))}">${esc(L(ctx,'Открыть крупно','Open full size'))}</a>${['svg','pdf','png'].map(ext => `<a href="${esc(ctx.asset(stem+'.'+ext))}" download>${esc(ext.toUpperCase())}</a>`).join('')}</div></figure>`;
  }).join('')}<p class="pish-caption">${esc(L(ctx,'Интервалы отражают чувствительность среднего при повторной выборке работ, а не неопределённость полного числа публикаций. Окно цитирования работ 2023–2025 ещё не завершено. Связи тем предложены для обсуждения; это не измеренная сеть сотрудничества.','Intervals show mean sensitivity under publication resampling, not uncertainty in the recorded publication count. Citation windows for 2023–2025 are still incomplete. Topic connections are proposed for discussion, not measured collaboration networks.'))}</p><div class="pish-downloads"><a href="${esc(ctx.asset(folder+'manifest.json'))}" download>${esc(L(ctx,'Источники, версии и контрольные суммы','Sources, versions and checksums'))}</a><a href="${esc(ctx.site.repoUrl+'/blob/main/tools/scientific-plots.py')}">${esc(L(ctx,'Генератор на Python','Python generator'))}</a></div></section>`;
}
