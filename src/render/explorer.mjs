import { FORMS, esc, table, cell, text } from './kit.mjs';

const L=(ctx,ru,en)=>ctx.lang==='en'?en:ru;
const shift=(ctx,n)=>n==null?'—':`${n>0?'+':''}${ctx.pct(n,1)}`;

function evidenceTable(ctx, entries) {
  return table([
    {key:'name',label:L(ctx,'Направление / тема','Field / topic')},
    {key:'n',label:L(ctx,'Работы: 2016–2020 → 2021–2025','Works: 2016–2020 → 2021–2025')},
    {key:'world',label:L(ctx,'Изменение мировой доли темы','Change in topic world share')},
    {key:'own',label:L(ctx,'Изменение доли СТАНКИН внутри темы','Change in STANKIN share within topic')},
    {key:'fwci',label:L(ctx,'FWCI: два пятилетия','FWCI: two periods')},
  ], entries.map(r=>({cells:{
    name:text(r.name[ctx.lang]),n:text(`${ctx.int(r.nP1)} → ${ctx.int(r.nP2)}`),
    world:text(shift(ctx,r.worldShareChange)),own:text(shift(ctx,r.ownWorldShareChange)),
    fwci:cell(`${ctx.dec(r.cohorts?.p1?.fwci,2)} → ${ctx.dec(r.cohorts?.p2?.fwci,2)}`,r.cohorts?.p2?.fwci),
  }})),{sortable:true});
}

export function scienceExplorer(ctx) {
  const data=ctx.model.explorer;
  if (!data) return '';
  const version=ctx.model.meta.assetVersion;
  const options=(values)=>values.map(([value,label])=>`<option value="${value}">${esc(label)}</option>`).join('');
  return `<section class="science-explorer" id="pish-explorer" data-explorer data-lang="${ctx.lang}" data-source="${esc(ctx.asset('data/explorer.json'))}?v=${esc(version)}" data-echarts="${esc(ctx.asset('assets/vendor/echarts/echarts.min.js'))}?v=${esc(version)}" data-initial="T10188" aria-labelledby="explorer-title">
  <div class="explorer-heading"><p class="eyebrow">${esc(L(ctx,'Исследуйте данные · Apache ECharts','Explore the evidence · Apache ECharts'))}</p><h3 id="explorer-title">${esc(L(ctx,'От мировой темы — к нашим работам и научному вопросу','From a world topic to our papers and a research question'))}</h3><p>${esc(L(ctx,'Выберите точку на карте или название в списке. Сопоставьте две доли публикаций, проверьте цитирование и откройте статьи. Широкие компетенции и основные темы OpenAlex показаны отдельно.','Select a point or choose a name from the list. Compare two publication shares, check citation impact and open the papers. Broad competencies and OpenAlex primary topics are shown separately.'))}</p></div>
  <div class="explorer-controls" data-explorer-controls hidden>
    <label>${esc(L(ctx,'Уровень анализа','Analysis level'))}<select data-explorer-level>${options([['topics',L(ctx,'13 мировых тем','13 world topics')],['groups',L(ctx,`${ctx.count(data.groups.length,FORMS.groups)} компетенций`,'20 competency groups')]])}</select></label>
    <label>${esc(L(ctx,'Что сравниваем','Compare'))}<select data-explorer-mode>${options([['position',L(ctx,'Мировая тема и наша доля','World topic and our share')],['impact',L(ctx,'Мировая тема и цитирование','World topic and citation impact')]])}</select></label>
    <label>${esc(L(ctx,'Пятилетие для FWCI и статей','Period for FWCI and papers'))}<select data-explorer-period>${options([['p2','2021–2025'],['p1','2016–2020']])}</select></label>
    <label class="explorer-choice">${esc(L(ctx,'Выбранное направление','Selected field'))}<select data-explorer-choice></select></label>
    <button type="button" data-explorer-reset>${esc(L(ctx,'Сбросить масштаб','Reset zoom'))}</button>
  </div>
  <p class="explorer-status" data-explorer-status role="status">${esc(L(ctx,'Интерактивная карта загружается при открытии раздела. Все числа доступны в таблицах ниже.','The interactive map loads when this section is opened. All numbers are available in the tables below.'))}</p>
  <div class="explorer-grid"><div data-explorer-chart hidden aria-label="${esc(L(ctx,'Карта мировой динамики и положения СТАНКИН','Map of world momentum and STANKIN position'))}"></div><aside data-explorer-detail aria-live="polite" aria-atomic="true"></aside></div>
  <div class="explorer-evidence-grid"><div data-explorer-annual hidden aria-label="${esc(L(ctx,'Число публикаций СТАНКИН по годам','Annual STANKIN publication counts'))}"></div><div data-explorer-works></div></div>
  <details class="explorer-definitions" id="explorer-definitions"><summary>${esc(L(ctx,'Что означают оси и чего из них нельзя заключить','What the axes mean and what they cannot tell us'))}</summary><div class="explorer-formulas"><article><h4>${esc(L(ctx,'Мировая динамика','World momentum'))}</h4><p class="math">100 × [(w₂/W₂) / (w₁/W₁) − 1]</p><p>${esc(L(ctx,'Изменение доли темы во всех мировых работах. Это не рост рынка. w — работы темы; W — все мировые работы тех же лет и типов.','Change in the topic’s share of all world works, not market growth. w is topic works; W is all world works of the same years and types.'))}</p></article><article><h4>${esc(L(ctx,'Положение СТАНКИН','STANKIN position'))}</h4><p class="math">100 × [(n₂/w₂) / (n₁/w₁) − 1]</p><p>${esc(L(ctx,'Изменение доли университета внутри мировой темы. n — работы СТАНКИН. Если исходная база нулевая, изменение не определено.','Change in the university’s share within the world topic. n is STANKIN works. The change cannot be calculated from a zero baseline.'))}</p></article><article><h4>${esc(L(ctx,'Цитирование и объём данных','Citation impact and coverage'))}</h4><p class="math">FWCI = Σ FWCIᵢ / m</p><p>${esc(L(ctx,'Среднее по m работам с доступным FWCI. Пропуски не считаются нулями. Интервалы — чувствительность среднего, а не доказательство превосходства. Малые выборки обозначены отдельно.','The mean of m works with available FWCI. Missing values are not zero. Intervals show mean sensitivity, not proof of superiority. Small samples are marked separately.'))}</p></article></div><p>${esc(L(ctx,'Годовой график показывает только СТАНКИН. Мировые числа отдельных тем доступны в этом снимке по двум пятилетиям. Публикации 2023–2025 имеют незавершённые окна цитирования. Связанные научные вопросы предложены для обсуждения: они требуют чтения статей, проверки новизны и исполнителей.','The annual chart shows STANKIN only. World counts for individual topics are available in this snapshot for two five-year periods. Papers from 2023–2025 have incomplete citation windows. Related research questions are proposals that require paper review, novelty checks and people to deliver them.'))}</p></details>
  <details class="chart-table" data-explorer-fallback><summary>${esc(L(ctx,'Все числа: таблицы работают и без интерактивной карты','All numbers: tables also work without the interactive map'))}</summary><h4>${esc(L(ctx,'13 выбранных основных тем OpenAlex','13 selected OpenAlex primary topics'))}</h4>${evidenceTable(ctx,data.topics)}<h4>${esc(L(ctx,'20 групп компетенций сайта','20 website competency groups'))}</h4>${evidenceTable(ctx,data.groups)}</details>
  <div class="explorer-source"><p>${esc(L(ctx,`Основа: ${ctx.count(data.totalWorks,FORMS.works)} после аудита аффилиаций. Снимок ${ctx.date(data.fetchedAt)}`,`Based on ${ctx.int(data.totalWorks)} works after the affiliation audit. Snapshot ${ctx.date(data.fetchedAt)}.`))}</p><a href="${esc(ctx.asset('data/explorer.json'))}" download>${esc(L(ctx,'Скачать числа и перечень работ · JSON','Download metrics and paper metadata · JSON'))}</a> · <a href="https://github.com/apache/echarts">Apache ECharts</a> · <a href="${esc(ctx.asset('assets/vendor/echarts/metadata.json'))}">${esc(L(ctx,'Версия и происхождение библиотеки','Library version and provenance'))}</a></div>
  </section>`;
}
