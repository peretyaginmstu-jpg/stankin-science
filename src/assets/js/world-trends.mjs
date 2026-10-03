// Local, linked views of the same two publication cohorts. No external requests.
import { loadLibrary } from './explorer.mjs';

const finite = Number.isFinite;
const node = (tag, className, value) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value != null) element.textContent = value;
  return element;
};
function localUrl(value) {
  const url = new URL(value, location.href);
  if (url.origin !== location.origin) throw new Error('Non-local trends resource');
  return url.href;
}

export async function initWorldTrends(root) {
  if (root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  root.setAttribute('aria-busy', 'true');
  const en = root.dataset.lang === 'en';
  const language = en ? 'en' : 'ru';
  const L = (ru, eng) => en ? eng : ru;
  const num = (value, digits = 0) => finite(value)
    ? new Intl.NumberFormat(en ? 'en' : 'ru', { maximumFractionDigits: digits }).format(value) : '—';
  const change = value => finite(value) ? `${value > 0 ? '+' : ''}${num(value * 100, 1)}%` : '—';
  const share = value => finite(value) ? `${num(value * 100, 5)}%` : '—';
  const localText = value => typeof value === 'string' ? value : value?.[language] ?? '';
  const name = item => localText(item.name) || item.id;
  const status = root.querySelector('[data-world-status]');
  const controls = root.querySelector('[data-world-controls]');
  const metric = root.querySelector('[data-world-metric]');
  const filter = root.querySelector('[data-world-filter]');
  const choice = root.querySelector('[data-world-choice]');
  const chartHost = root.querySelector('[data-world-chart]');
  const staticHost = root.querySelector('[data-world-static]');
  const detail = root.querySelector('[data-world-detail]');
  const fallback = root.querySelector('[data-world-fallback]');
  let data, chart, resizeTimer, lastWidth = 0;
  const selectedMetric = item => metric.value === 'volume' ? item.absoluteGrowth : item.worldShareChange;
  const periodName = key => data.period[key].join('–');
  const entries = () => data.topics.filter(item => filter.value === 'direct' ? item.direct === true
    : filter.value === 'gap' ? finite(item.nP2) && item.nP2 < 20 : true)
    .sort((a, b) => {
      const av = selectedMetric(a), bv = selectedMetric(b);
      return (finite(bv) ? bv : -Infinity) - (finite(av) ? av : -Infinity)
        || a.id.localeCompare(b.id);
    });
  const selected = () => data.topics.find(item => item.id === choice.value);

  function fillChoices(preferred) {
    const rows = entries();
    choice.replaceChildren(...rows.map(item => {
      const option = node('option', '', name(item));
      option.value = item.id;
      return option;
    }));
    if (rows.some(item => item.id === preferred)) choice.value = preferred;
    choice.disabled = !rows.length;
  }

  function addMetrics(values) {
    const list = node('dl', 'world-detail-metrics');
    for (const [label, value] of values) {
      const row = node('div');
      row.append(node('dt', '', label), node('dd', '', value));
      list.append(row);
    }
    detail.append(list);
  }

  function renderDetail(item) {
    detail.replaceChildren();
    if (!item) {
      detail.append(node('p', 'world-detail-note', L('В этом фильтре нет тем. Выберите другой набор.', 'No topics match this filter. Choose another set.')));
      return;
    }
    detail.append(node('h3', '', name(item)));
    detail.append(node('p', 'world-detail-note', L(
      `Основная тема OpenAlex · ${item.id}. Сравниваются ${periodName('p1')} и ${periodName('p2')}.`,
      `OpenAlex primary topic · ${item.id}. Comparing ${periodName('p1')} with ${periodName('p2')}.`
    )));
    addMetrics([
      [L('Работы в мире', 'Works worldwide'), `${num(item.worldP1)} → ${num(item.worldP2)}`],
      [L('Изменение числа работ в мире', 'World work count change'), change(item.absoluteGrowth)],
      [L('Доля темы в мировой науке', 'Topic share of world science'), `${share(item.worldShareP1)} → ${share(item.worldShareP2)}`],
      [L('Изменение мировой доли темы', 'Change in topic world share'), change(item.worldShareChange)],
      [L('Работы СТАНКИН', 'STANKIN works'), `${num(item.nP1)} → ${num(item.nP2)}`],
      [L('Доля СТАНКИН внутри темы', 'STANKIN share within topic'), `${share(item.ownShareP1)} → ${share(item.ownShareP2)}`],
      [L('Изменение нашей доли', 'Change in our share'), change(item.ownWorldShareChange)],
      [`FWCI · ${periodName('p2')}`, num(item.recentFwci, 3)],
      [L('Работы с известным FWCI', 'Works with known FWCI'), `${num(item.recentFwciN)} / ${num(item.nP2)}`],
    ]);
    const observation = {
      gain: L('Доля СТАНКИН внутри этой мировой темы увеличилась.', 'STANKIN gained publication share within this world topic.'),
      lose: L('Доля СТАНКИН внутри этой мировой темы сократилась.', 'STANKIN lost publication share within this world topic.'),
      absent: L('В обоих пятилетиях нет работ с этой основной темой в снимке.', 'Neither period contains works with this primary topic in the snapshot.'),
      new: L('В новом пятилетии появились работы. Процент роста от нулевой базы не рассчитывается.', 'Works appear in the recent period. Percentage growth from a zero baseline is not calculated.'),
      stable: L('Доля СТАНКИН внутри темы не изменилась.', 'STANKIN’s publication share within the topic is unchanged.'),
      unknown: L('Для сравнения доли СТАНКИН не хватает данных.', 'Data are insufficient to compare STANKIN’s publication share.'),
    }[item.observation];
    if (observation) detail.append(node('p', 'world-topic-verdict', observation));
    const role = {digital:L('Связь с производством: цифровые промышленные системы.','Manufacturing link: digital industrial systems.'), control:L('Связь с производством: управление и робототехника.','Manufacturing link: control and robotics.'), materials:L('Связь с производством: инструмент и материалы.','Manufacturing link: tooling and materials.'), process:L('Связь с производством: процессы изготовления.','Manufacturing link: production processes.'), measure:L('Связь с производством: измерение и контроль.','Manufacturing link: measurement and inspection.'),predict:L('Связь с производством: диагностика и прогноз.','Manufacturing link: diagnostics and prediction.')}[item.role];
    if (role) detail.append(node('p', 'world-topic-role', role));
    if (!finite(item.ownWorldShareChange)) {
      detail.append(node('p', 'world-detail-note', L(
        'Рост нашей доли не рассчитан: нет исходного значения или исходная доля равна нулю. Это не нулевой рост.',
        'Our share change cannot be calculated without a known, non-zero baseline. It is not zero growth.'
      )));
    }
    if ([item.nP1, item.nP2].some(value => finite(value) && value < 20)) {
      detail.append(node('p', 'world-detail-note world-small-sample', L(
        'Хотя бы в одном пятилетии менее 20 работ. Это малая публикационная база; отдельные статьи сильно влияют на сравнение. Ноль работ в снимке не доказывает отсутствие специалистов.',
        'At least one period has fewer than 20 works. This is a small publication base; individual papers strongly affect the comparison. Zero works in the snapshot does not prove there are no specialists.'
      )));
    }
    detail.append(node('p', 'world-detail-note', L(
      'FWCI рассчитан только по работам с известным значением. Поздние статьи ещё набирают цитирования. Публикационная динамика сама по себе не устанавливает новизну, готовность технологии или промышленный спрос.',
      'FWCI uses only works with known values. Recent papers are still accumulating citations. Publication trends alone do not establish novelty, technology readiness or industrial demand.'
    )));
    const target = new URL(root.dataset.explorer || '../pish/', location.href);
    target.searchParams.set('topic', item.id);
    target.hash = 'pish-explorer';
    const articles = node('a', 'world-topic-link', L('Открыть статьи и проверить вывод →', 'Open the papers and check the evidence →'));
    articles.href = target.href;
    detail.append(articles);
  }

  function wrapLabel(value, limit) {
    const words = value.split(/\s+/), lines = [''];
    for (const word of words) {
      const last = lines.length - 1;
      if (lines[last] && `${lines[last]} ${word}`.length > limit) lines.push(word);
      else lines[last] += `${lines[last] ? ' ' : ''}${word}`;
    }
    if (lines.length > 3) return [...lines.slice(0, 2), `${lines.slice(2).join(' ').slice(0, limit - 1)}…`].join('\n');
    return lines.join('\n');
  }

  function draw() {
    const rows = entries(), active = selected();
    const compact = chartHost.clientWidth < 800;
    const narrow = chartHost.clientWidth < 450;
    const volume = metric.value === 'volume';
    const values = rows.map(selectedMetric).filter(finite).map(value => value * 100);
    const validCount = values.length;
    const axisMin = Math.min(0, ...values), axisMax = Math.max(0, ...values);
    const padding = Math.max(15, (axisMax - axisMin) * .15);
    chartHost.style.height = `${Math.max(340, rows.length * (compact ? 60 : 55) + 140)}px`;
    chart.resize();
    const metricTitle = volume ? L('Число работ в мире · изменение, %', 'World work count · change, %')
      : L('Мировая доля темы · изменение, %', 'Topic world share · change, %');
    const description = `${metricTitle}. ${periodName('p2')} ${L('против', 'versus')} ${periodName('p1')}.`;
    const missing = rows.filter(item => !finite(selectedMetric(item)));
    status.textContent = `${description} ${L('Показано тем', 'Topics shown')}: ${rows.length}. ${compact
      ? L('Нажмите на полосу: числа СТАНКИН и исходные статьи — в карточке ниже.', 'Select a bar: STANKIN counts and source papers are in the card below.')
      : L('Справа — число работ СТАНКИН за каждое пятилетие. Это отдельная шкала.', 'The right panel shows STANKIN work counts in each period on a separate scale.')}`;
    if (missing.length) status.append(node('span', 'world-missing', ` ${L('Изменение не рассчитано', 'Change unavailable')}: ${missing.map(name).join('; ')}. ${L('Темы доступны в списке.', 'The topics remain selectable.')}`));
    if (!rows.length) {
      chart.clear();
      renderDetail(null);
      return;
    }
    const mainLeft = compact ? (narrow ? '48%' : '40%') : '32%';
    const labelWidth = chartHost.clientWidth * (compact ? (narrow ? .45 : .37) : .29);
    const grids = [{ left: mainLeft, right: compact ? 46 : '37%', top: 90, bottom: 50 }];
    const yAxes = [{ type: 'category', inverse: true, data: rows.map(name), axisTick: { show: false },
      axisLine: { show: false }, axisLabel: { fontSize: compact ? 11 : 12, lineHeight: 14,
        width: labelWidth, overflow: 'truncate', formatter: value => wrapLabel(value, narrow ? 20 : compact ? 32 : 36) } }];
    const xAxes = [{ type: 'value', min: axisMin < 0 ? axisMin - padding : 0,
      max: axisMax > 0 ? axisMax + padding : 0, axisLine: { show: false }, axisTick: { show: false },
      splitNumber: compact ? 3 : 4, axisLabel: { fontSize: 11, formatter: value => `${num(value)}%` },
      splitLine: { lineStyle: { color: '#e0e6eb' } } }];
    const series = [{ name: metricTitle, type: 'bar', barMaxWidth: 24,
      data: rows.map(item => ({ id: item.id, value: finite(selectedMetric(item)) ? selectedMetric(item) * 100 : null,
        itemStyle: { color: selectedMetric(item) >= 0 ? '#2469a4' : '#b75e22',
          borderColor: item.id === active?.id ? '#102c43' : 'transparent', borderWidth: item.id === active?.id ? 3 : 0 },
        label: { position: selectedMetric(item) < 0 ? 'left' : 'right' } })),
      label: { show: true, color: '#28333d', fontSize: 11, formatter: params => finite(params.value) ? `${params.value > 0 ? '+' : ''}${num(params.value, 1)}%` : '' },
      emphasis: { itemStyle: { borderWidth: 3, borderColor: '#102c43' } },
      markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#8996a1', type: 'solid' }, data: [{ xAxis: 0 }] } }];
    const titles = [{ text: metricTitle, subtext: `${periodName('p2')} / ${periodName('p1')}`, left: compact ? 10 : '32%', top: 12,
      textStyle: { fontSize: compact ? 13 : 14, color: '#28333d', width: chartHost.clientWidth * (compact ? .93 : .34), overflow: 'break' },
      subtextStyle: { fontSize: 11, color: '#52616e' } }];
    if (!compact) {
      grids.push({ left: '74%', right: '4%', top: 90, bottom: 50 });
      xAxes.push({ type: 'value', gridIndex: 1, min: 0, minInterval: 1, splitNumber: 3,
        axisLabel: { fontSize: 11 }, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#e0e6eb' } } });
      yAxes.push({ type: 'category', inverse: true, gridIndex: 1, data: rows.map(name), axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false } });
      titles.push({ text: L('Работы СТАНКИН', 'STANKIN works'), left: '74%', top: 12, textStyle: { fontSize: 14, color: '#28333d' } });
      for (const [key, period, color] of [['nP1', 'p1', '#bdc7d0'], ['nP2', 'p2', '#2469a4']]) {
        series.push({ name: periodName(period), type: 'bar', xAxisIndex: 1, yAxisIndex: 1, barMaxWidth: 10, barGap: '30%', itemStyle: {color},
          data: rows.map(item => ({ id: item.id, value: finite(item[key]) ? item[key] : null,
            itemStyle: { color, borderColor: item.id === active?.id ? '#102c43' : 'transparent', borderWidth: item.id === active?.id ? 1.5 : 0 } })),
          label: { show: true, position: 'right', fontSize: 10, color: '#28333d', formatter: params => num(params.value) } });
      }
    }
    chart.setOption({ animation: false, backgroundColor: '#fff', textStyle: { fontFamily: 'Golos Text, sans-serif', color: '#28333d' },
      aria: { enabled: true, label: { description: `${description} ${L('Значения доступны в таблице и карточке темы.', 'Values are also available in the table and topic card.')}` } },
      title: titles, grid: grids, xAxis: xAxes, yAxis: yAxes,
      legend: { show: !compact, data: [periodName('p1'), periodName('p2')], left: '73%', top: 46, itemWidth: 10, itemHeight: 10, itemGap: 9, textStyle: { fontSize: 10 } },
      tooltip: { trigger: 'item', renderMode: 'richText', confine: true, textStyle: { fontSize: 12 },
        formatter: params => {
          const item = data.topics.find(entry => entry.id === params.data?.id);
          if (!item) return '';
          return `${wrapLabel(name(item).replace(/[{}]/g, ''), compact ? 30 : 45)}\n${L('Изменение мировой доли', 'World share change')}: ${change(item.worldShareChange)}\n${L('Изменение числа работ в мире', 'World work count change')}: ${change(item.absoluteGrowth)}\n${L('Работы СТАНКИН', 'STANKIN works')}: ${num(item.nP1)} → ${num(item.nP2)}`;
        } }, series }, true);
    root.dataset.plotted = String(validCount);
    root.dataset.selected = active?.id ?? '';
    renderDetail(active);
  }

  try {
    const [loaded, library] = await Promise.all([
      fetch(localUrl(root.dataset.source)).then(response => {
        if (!response.ok) throw new Error('Missing world trends data');
        return response.json();
      }), loadLibrary(root.dataset.echarts),
    ]);
    data = loaded;
    if (data.schema !== 1 || !Array.isArray(data.topics) || !data.checks?.length || data.checks.some(check => !check.passed)
      || !['p1', 'p2'].every(key => Array.isArray(data.period?.[key]) && data.period[key].length === 2)) {
      throw new Error('Invalid world trends audit');
    }
    chartHost.hidden = false;
    chart = library.init(chartHost, null, { renderer: 'canvas' });
    controls.hidden = false;
    fillChoices(root.dataset.initial);
    draw();
    staticHost.hidden = true;
    metric.addEventListener('change', () => { const previous = choice.value; fillChoices(previous); draw(); });
    filter.addEventListener('change', () => { const previous = choice.value; fillChoices(previous); draw(); });
    choice.addEventListener('change', draw);
    chart.on('click', params => {
      if (params.componentType !== 'series' || !params.data?.id) return;
      choice.value = params.data.id;
      draw();
    });
    root.querySelector('[data-world-reset]').addEventListener('click', () => {
      metric.value = 'share';
      filter.value = 'all';
      fillChoices(root.dataset.initial);
      draw();
    });
    lastWidth = chartHost.clientWidth;
    const observer = new ResizeObserver(() => {
      if (Math.abs(chartHost.clientWidth - lastWidth) < 2) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { lastWidth = chartHost.clientWidth; draw(); }, 100);
    });
    observer.observe(root);
    let wasOpen = false;
    window.addEventListener('beforeprint', () => { wasOpen = fallback.open; fallback.open = true; });
    window.addEventListener('afterprint', () => { fallback.open = wasOpen; chart.resize(); });
    root.dataset.ready = 'true';
  } catch (error) {
    chart?.dispose();
    chartHost.hidden = true;
    controls.hidden = true;
    staticHost.hidden = false;
    fallback.open = true;
    status.textContent = L('Интерактивная схема не загрузилась. Статический график и таблица ниже сохраняют исходные числа.', 'The interactive chart could not load. The static chart and table below retain the source values.');
    console.error('World trends:', error.message);
  } finally {
    root.removeAttribute('aria-busy');
  }
}
