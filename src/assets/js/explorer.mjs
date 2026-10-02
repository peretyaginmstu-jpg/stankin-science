// Linked evidence views. ECharts is a pinned local distribution; no external API.
let libraryPromise;
const node = (tag, cls, value) => { const el=document.createElement(tag); if(cls)el.className=cls; if(value!=null)el.textContent=value; return el; };
const finite = Number.isFinite;
function localUrl(value) { const url=new URL(value,location.href); if(url.origin!==location.origin)throw new Error('Non-local explorer resource'); return url.href; }
function loadLibrary(url) {
  if(window.echarts) return Promise.resolve(window.echarts);
  if(!libraryPromise) libraryPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=localUrl(url);script.async=true;
    script.onload=()=>window.echarts?resolve(window.echarts):reject(new Error('Missing ECharts'));
    script.onerror=()=>reject(new Error('Could not load ECharts'));document.head.append(script);
  });
  return libraryPromise;
}
const link = (label, href) => {const a=node('a','',label);a.href=href;return a;};

export async function initExplorer(root) {
  if(root.dataset.initialized)return;
  root.dataset.initialized='true';root.setAttribute('aria-busy','true');
  const en=root.dataset.lang==='en', L=(ru,eng)=>en?eng:ru;
  const num=(v,d=0)=>finite(v)?new Intl.NumberFormat(en?'en':'ru',{maximumFractionDigits:d}).format(v):'—';
  const pct=(v)=>finite(v)?`${v>0?'+':''}${num(v*100,1)}%`:'—';
  const status=root.querySelector('[data-explorer-status]');
  const controls=root.querySelector('[data-explorer-controls]');
  const level=root.querySelector('[data-explorer-level]'),mode=root.querySelector('[data-explorer-mode]');
  const period=root.querySelector('[data-explorer-period]'),choice=root.querySelector('[data-explorer-choice]');
  const detail=root.querySelector('[data-explorer-detail]'),worksHost=root.querySelector('[data-explorer-works]');
  const chartHost=root.querySelector('[data-explorer-chart]'),annualHost=root.querySelector('[data-explorer-annual]');
  let data, chart, annual, page=0, order='recent';
  const periodName=()=>data.period[period.value].join('–');
  const entries=()=>data[level.value]??[];
  const selected=()=>entries().find(item=>item.id===choice.value);
  const name=item=>item.name[en?'en':'ru'];
  const availableWorks=item=>item.workIds.map(id=>data.works[id]).filter(Boolean);
  const cohort=item=>item.cohorts?.[period.value];
  const coordinates=item=>{
    const y=mode.value==='position'?item.ownWorldShareChange:cohort(item)?.fwci;
    return finite(item.worldShareChange)&&finite(y)?[item.worldShareChange*100,mode.value==='position'?y*100:y]:null;
  };
  const small=item=>{
    const counts=mode.value==='position'?[item.nP1,item.nP2]:[cohort(item)?.fwciN];
    return counts.every(finite)?Math.min(...counts)<20:null;
  };
  const heading=(host,title)=>host.append(node('h4','',title));
  function metrics(host, values) {
    const dl=node('dl','explorer-metrics');
    for(const [title,value] of values){const row=node('div');row.append(node('dt','',title),node('dd','',value));dl.append(row);}host.append(dl);
  }
  function fillChoices(preferred) {
    choice.replaceChildren(...entries().map((item,index)=>{const option=node('option','',`${String(index+1).padStart(2,'0')} · ${name(item)}`);option.value=item.id;return option;}));
    if(entries().some(item=>item.id===preferred))choice.value=preferred;
  }
  function renderWorks(item) {
    const range=data.period[period.value];
    const rows=availableWorks(item).filter(w=>w.year>=range[0]&&w.year<=range[1]);
    rows.sort((a,b)=>order==='impact'?(finite(b.fwci)?b.fwci:-Infinity)-(finite(a.fwci)?a.fwci:-Infinity)||b.year-a.year||a.id.localeCompare(b.id):b.year-a.year||a.id.localeCompare(b.id));
    page=Math.min(page,Math.max(0,Math.ceil(rows.length/10)-1));
    worksHost.replaceChildren();
    const top=node('div','explorer-works-head');heading(top,L('Статьи за выбранное пятилетие','Papers in the selected period'));
    const label=node('label','',L('Порядок: ','Order: ')), sort=node('select');
    sort.setAttribute('aria-label',L('Порядок публикаций','Publication order'));
    for(const [value,title] of [['recent',L('Сначала новые','Newest first')],['impact',L('По FWCI','Highest FWCI first')]]){const op=node('option','',title);op.value=value;sort.append(op);}sort.value=order;
    sort.addEventListener('change',()=>{order=sort.value;page=0;renderWorks(item);worksHost.querySelector('select').focus();});label.append(sort);top.append(label);worksHost.append(top);
    worksHost.append(node('p','explorer-note',`${periodName()} · ${num(rows.length)} ${L('работ. FWCI относится к каждой статье; пропуски обозначены «—».','works. FWCI refers to each paper; missing values are shown as “—”.')}`));
    if(!rows.length){worksHost.append(node('p','explorer-empty',L('В этом срезе снимка работ нет. Это не доказывает отсутствие специалистов или исследований.','No works in this slice of the snapshot. This does not prove an absence of people or research.')));return;}
    const list=node('ol','explorer-work-list');list.start=page*10+1;
    for(const w of rows.slice(page*10,page*10+10)){
      const li=node('li');li.append(node('span','explorer-work-meta',`${w.year} · FWCI ${num(w.fwci,3)} · ${L('цитирований','citations')}: ${num(w.citations)}`));
      const title=w.title||L('Название не указано','Untitled work');
      li.append(/^W\d+$/.test(w.id)?link(title,`https://openalex.org/${w.id}`):node('span','',title));list.append(li);
    }worksHost.append(list);
    const nav=node('div','explorer-pager');nav.setAttribute('aria-label',L('Страницы публикаций','Publication pages'));
    const prev=node('button','',L('← Предыдущие','← Previous')),next=node('button','',L('Следующие →','Next →'));
    prev.type=next.type='button';prev.disabled=page===0;next.disabled=(page+1)*10>=rows.length;
    prev.addEventListener('click',()=>{page--;renderWorks(item);worksHost.querySelector('.explorer-pager button').focus();});
    next.addEventListener('click',()=>{page++;renderWorks(item);worksHost.querySelector('.explorer-pager button:last-child').focus();});
    nav.append(prev,node('span','',`${num(page*10+1)}–${num(Math.min((page+1)*10,rows.length))} / ${num(rows.length)}`),next);worksHost.append(nav);
  }
  function renderDetail(item) {
    detail.replaceChildren();heading(detail,name(item));
    detail.append(node('p','explorer-note',level.value==='topics'?L('Основная тема OpenAlex. Не отдельная кафедра.','OpenAlex primary topic, not a department.'):L('Группа нескольких основных тем. Не отдельная кафедра.','A group of primary topics, not a department.')));
    const c=cohort(item);
    metrics(detail,[[L('Наши работы: два пятилетия','Our works: two periods'),`${num(item.nP1)} → ${num(item.nP2)}`],
      [L('Мировая доля темы · изменение','Topic world share · change'),pct(item.worldShareChange)],
      [L('Наша доля внутри темы · изменение','Our share within topic · change'),pct(item.ownWorldShareChange)],
      [`FWCI · ${periodName()}`,num(c?.fwci,3)],
      [L('Покрытие FWCI','FWCI coverage'),`${num(c?.fwciN)} / ${num(c?.n)}`]]);
    const ci=c?.fwciCI95;
    detail.append(node('p','explorer-note',finite(ci?.lower)&&finite(ci?.upper)?`${L('Условный 95% интервал среднего','Conditional 95% mean interval')}: ${num(ci.lower,3)} … ${num(ci.upper,3)}`:L('Интервал для этого среза не рассчитан.','No interval was calculated for this slice.')));
    let verdict=L('Для сравнения долей не хватает данных или ненулевой исходной базы.','Comparing shares requires data and a non-zero baseline.');
    if(finite(item.worldShareChange)&&finite(item.ownWorldShareChange)) {
      const w=item.worldShareChange,o=item.ownWorldShareChange;
      verdict=L(`Мировая доля темы ${w>0?'растёт':w<0?'сокращается':'не меняется'}. Доля СТАНКИН внутри неё ${o>0?'растёт':o<0?'сокращается':'не меняется'}.`,
        `The topic's world share ${w>0?'increases':w<0?'decreases':'is unchanged'}. STANKIN's share within it ${o>0?'increases':o<0?'decreases':'is unchanged'}.`);
    }
    detail.append(node('p','explorer-verdict',verdict));
    const sample=small(item);
    detail.append(node('p','explorer-note',sample==null?L('Объём данных для этого сравнения не установлен. Пропуск не означает нулевое число работ.','The sample size for this comparison is unavailable. A missing value is not a zero work count.'):sample?L('Мало работ: положение может сильно меняться от нескольких публикаций. Это сигнал для проверки статей.','Small sample: a few papers can strongly change this position. Review the underlying papers.'):L('Это публикационная позиция. Научную новизну, команду и готовность технологии нужно проверять отдельно.','This is a publication position. Novelty, people and technology readiness need separate checks.')));
    if(item.questionIds.length){heading(detail,L('Какие вопросы проверить','Research questions to examine'));const ul=node('ul','explorer-question-links');
      for(const id of item.questionIds){if(!/^[a-z0-9-]+$/.test(id))continue;const target=document.getElementById(`pish-node-topic-${id}`);if(!target)continue;const label=target.querySelector('summary')?.textContent.replace(/\+\s*$/,'').trim()||id;const li=node('li');li.append(link(label,`#pish-node-topic-${id}`));ul.append(li);}detail.append(ul);
      detail.append(node('p','explorer-note',L('Это предложенные связи с повесткой; не каждая статья ниже решает данный вопрос.','These are proposed agenda links; not every paper below addresses each question.')));
    }
    detail.append(link(L('Определения показателей','Metric definitions'),'#explorer-definitions'));
  }
  function draw() {
    const item=selected();if(!item)return;
    const all=entries(),points=all.map((entry,index)=>({entry,index,xy:coordinates(entry)})).filter(p=>p.xy);
    const missing=all.filter(entry=>!coordinates(entry));
    const position=mode.value==='position';
    const description=position?L('X: изменение мировой доли темы. Y: изменение доли СТАНКИН внутри неё. Обе оси — %, 2021–2025 против 2016–2020.','X: change in topic world share. Y: change in STANKIN share within it. Both axes: %, 2021–2025 versus 2016–2020.'):
      L(`X: изменение мировой доли темы, %. Y: средний FWCI работ ${periodName()}.`,`X: change in topic world share, %. Y: mean FWCI of ${periodName()} works.`);
    status.textContent=`${description} ${L('Полый круг — менее 20 работ; номера соответствуют списку.','Hollow circles: fewer than 20 works; numbers match the list.')} ${L('На карте','Plotted')}: ${points.length}/${all.length}.`;
    if(missing.length) status.append(node('span','explorer-missing',`${L('Вне координат (нет значения или нулевая база)','Not plotted (missing value or zero baseline)')}: ${missing.map(name).join('; ')}. ${L('Их можно выбрать в списке.','They remain selectable in the list.')}`));
    const compact=chartHost.clientWidth<550;
    chart.setOption({animation:false,backgroundColor:'#fff',textStyle:{fontFamily:'Golos Text, sans-serif',color:'#28333d'},
      aria:{enabled:true,label:{description}},
      grid:{left:compact?58:70,right:25,top:50,bottom:95},
      xAxis:{type:'value',name:L('Мировая доля темы · изменение, %','Topic world share · change, %'),nameLocation:'middle',nameGap:35,nameTextStyle:{fontSize:12},axisLabel:{fontSize:11,formatter:v=>`${num(v,0)}%`},splitLine:{lineStyle:{color:'#e4e8eb'}},axisLine:{onZero:true}},
      yAxis:{type:'value',name:position?L('Наша доля · изменение, %','Our share · change, %'):L(`Средний FWCI · ${periodName()}`,`Mean FWCI · ${periodName()}`),nameTextStyle:{fontSize:12},nameLocation:'end',axisLabel:{fontSize:11,formatter:v=>position?`${num(v,0)}%`:num(v,1)},splitLine:{lineStyle:{color:'#e4e8eb'}},min:position?null:0},
      tooltip:{trigger:'item',renderMode:'richText',confine:true,textStyle:{fontSize:13},formatter:p=>{const e=p.data.entry;return `${name(e).replace(/[{}]/g,'')}\n${L('Изменение мировой доли','World share change')}: ${pct(e.worldShareChange)}\n${position?L('Изменение нашей доли','Our share change'):`FWCI ${periodName()}`}: ${position?pct(e.ownWorldShareChange):num(cohort(e)?.fwci,3)}\n${L('Работы','Works')}: ${num(e.nP1)} → ${num(e.nP2)}`;}},
      dataZoom:[{type:'slider',xAxisIndex:0,bottom:15,height:20,showDetail:false,brushSelect:false,filterMode:'none'}],
      series:[{type:'scatter',data:points.map(({entry,index,xy})=>{const active=entry.id===item.id,tone=(position?xy[1]>=0:xy[1]>=1)?'#2469a4':'#b75e22';return {value:xy,id:entry.id,entry,number:index+1,symbolSize:active?32:25,itemStyle:{color:small(entry)?'#fff':tone,borderColor:active?'#172c40':tone,borderWidth:active?3:1.5,opacity:1},label:{color:small(entry)?tone:'#fff'}};}),
        label:{show:true,position:'inside',fontSize:11,fontWeight:600,formatter:p=>String(p.data.number)},
        emphasis:{scale:1.2},markLine:{silent:true,symbol:'none',label:{show:false},lineStyle:{color:'#768797',type:'dashed'},data:[{xAxis:0},{yAxis:position?0:1}]}}]},true);
    annual.setOption({animation:false,backgroundColor:'#fff',textStyle:{fontFamily:'Golos Text, sans-serif'},aria:{enabled:true},
      title:{text:L('Публикации СТАНКИН по годам','STANKIN works by year'),subtext:L('Только университет; мировой годовой ряд тем не загружен','University only; no annual world-topic series in the snapshot'),left:14,top:14,textStyle:{fontSize:16,color:'#28333d'},subtextStyle:{fontSize:compact?10:12,color:'#52616e',width:annualHost.clientWidth-30,overflow:'break'}},
      grid:{top:95,left:45,right:20,bottom:40},xAxis:{type:'category',data:item.annual.map(p=>String(p.year)),axisLabel:{fontSize:11,interval:'auto'}},yAxis:{type:'value',min:0,minInterval:1,axisLabel:{fontSize:11}},
      tooltip:{trigger:'axis',renderMode:'richText',confine:true},series:[{type:'bar',barMaxWidth:35,data:item.annual.map(p=>({value:p.n,itemStyle:{color:p.year>=data.period[period.value][0]&&p.year<=data.period[period.value][1]?'#2469a4':'#cbd4dc'}})),label:{show:true,position:'top',fontSize:11}}]},true);
    renderDetail(item);renderWorks(item);
  }
  try {
    const [loaded,lib]=await Promise.all([fetch(localUrl(root.dataset.source)).then(r=>{if(!r.ok)throw new Error('Missing explorer data');return r.json();}),loadLibrary(root.dataset.echarts)]);
    data=loaded;
    if(data.schema!==1||!Array.isArray(data.groups)||!Array.isArray(data.topics)||!data.checks?.length||data.checks.some(c=>!c.passed))throw new Error('Invalid explorer audit');
    chartHost.hidden=annualHost.hidden=false;
    chart=lib.init(chartHost,null,{renderer:'canvas'});annual=lib.init(annualHost,null,{renderer:'canvas'});
    controls.hidden=false;fillChoices(root.dataset.initial);draw();
    level.addEventListener('change',()=>{page=0;fillChoices(level.value==='groups'?'machining':root.dataset.initial);draw();});
    for(const select of [mode,period,choice])select.addEventListener('change',()=>{page=0;draw();});
    chart.on('click',params=>{if(params.componentType!=='series'||!params.data?.id)return;choice.value=params.data.id;page=0;draw();});
    root.querySelector('[data-explorer-reset]').addEventListener('click',()=>chart.dispatchAction({type:'dataZoom',start:0,end:100}));
    let timer;new ResizeObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{chart.resize();annual.resize();},80);}).observe(root);
    const fallback=root.querySelector('[data-explorer-fallback]');let wasOpen=false;
    window.addEventListener('beforeprint',()=>{wasOpen=fallback.open;fallback.open=true;});
    window.addEventListener('afterprint',()=>{fallback.open=wasOpen;chart.resize();annual.resize();});
    root.dataset.ready='true';
  } catch(error) {
    chart?.dispose();annual?.dispose();chartHost.hidden=annualHost.hidden=true;controls.hidden=true;
    status.textContent=L('Интерактивная карта не загрузилась. Числа сохранены в таблицах ниже; они доступны для проверки и скачивания.','The interactive map could not load. The tables below retain the numbers for review and download.');
    root.querySelector('[data-explorer-fallback]').open=true;
    console.error('Research explorer:',error.message);
  } finally {root.removeAttribute('aria-busy');}
}
