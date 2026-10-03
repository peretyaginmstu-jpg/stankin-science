import {loadLibrary} from './explorer.mjs';
const finite=Number.isFinite;
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!=null)n.textContent=value;return n;};
function localUrl(value){const u=new URL(value,location.href);if(u.origin!==location.origin)throw new Error('Think Tank resource must be local');return u.href;}
export async function initThinkTank(root){
 if(root.dataset.initialized)return;
 root.dataset.initialized='true';
 const en=root.dataset.lang==='en',lang=en?'en':'ru',L=(ru,eng)=>en?eng:ru,T=x=>typeof x==='string'?x:x?.[lang]??'';
 const num=(x,d=0)=>finite(x)?new Intl.NumberFormat(en?'en':'ru',{maximumFractionDigits:d}).format(x):'—';
 const pct=x=>finite(x)?`${x>0?'+':''}${num(x*100,1)}%`:'—';
 const status=root.querySelector('[data-tt-status]'),chartHost=root.querySelector('[data-tt-chart]'),staticHost=root.querySelector('[data-tt-static]'),controls=root.querySelector('[data-tt-controls]'),filter=root.querySelector('[data-tt-filter]'),choice=root.querySelector('[data-tt-choice]'),detail=root.querySelector('[data-tt-selected]');
 let data,chart,resizeTimer,lastWidth=0,printState=null,activeScenario=null;
 const projector=root.querySelector('[data-tt-projector]'),print=root.querySelector('[data-tt-print]');
 projector.hidden=false;print.hidden=false;
 projector.addEventListener('click',()=>{const enabled=!document.body.classList.contains('tt-projector');document.body.classList.toggle('tt-projector',enabled);projector.setAttribute('aria-pressed',String(enabled));chart?.resize();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('tt-projector')&&!document.querySelector('dialog[open]')){document.body.classList.remove('tt-projector');projector.setAttribute('aria-pressed','false');chart?.resize();}});
 print.addEventListener('click',()=>window.print());
 function selectScenario(id){
  activeScenario=id;
  root.dataset.scenario=id;
  for(const b of root.querySelectorAll('[data-tt-scenario]'))b.setAttribute('aria-pressed',String(b.dataset.ttScenario===id));
  for(const c of root.querySelectorAll('[data-tt-scenario-card]'))c.dataset.active=String(c.dataset.ttScenarioCard===id);
  for(const p of root.querySelectorAll('[data-tt-roadmap]'))p.hidden=p.dataset.ttRoadmap!==id;
  const s=data?.scenarios.find(x=>x.id===id);
  if(s)root.querySelector('[data-tt-scenario-status]').textContent=L(`Выбран вариант «${T(s.name)}». Результаты ниже — предложения, которые нужно согласовать и проверить.`,`Selected option: ${T(s.name)}. The outcomes below are proposals requiring agreement and validation.`);
 }
 for(const b of root.querySelectorAll('[data-tt-scenario]')){b.hidden=false;b.addEventListener('click',()=>{selectScenario(b.dataset.ttScenario);root.querySelector('#tt-horizons')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});});}
 window.addEventListener('beforeprint',()=>{if(printState)return;printState=[...root.querySelectorAll('details')].map(n=>[n,n.open]);for(const [n] of printState)if(!n.classList.contains('tt-selection-audit'))n.open=true;for(const p of root.querySelectorAll('[data-tt-roadmap]'))p.hidden=false;});
 window.addEventListener('afterprint',()=>{for(const [n,open] of printState??[])n.open=open;printState=null;if(activeScenario)selectScenario(activeScenario);});
 root.addEventListener('click',event=>{const a=event.target.closest('a[href^="#tt-direction-"]');if(!a)return;const target=document.getElementById(a.getAttribute('href').slice(1));if(target instanceof HTMLDetailsElement)target.open=true;});
 const initialTarget=location.hash.startsWith('#tt-direction-')?document.getElementById(location.hash.slice(1)):null;if(initialTarget instanceof HTMLDetailsElement)initialTarget.open=true;
 const cohort=d=>d.evidence?.cohorts?.p2??{};
 const rows=()=>data.directions.filter(d=>filter.value==='eligible'?d.pareto?.eligible:filter.value==='front'?d.pareto?.front:true);
 const plotted=()=>rows().filter(d=>finite(d.evidence?.worldShareChange)&&finite(cohort(d).fwci));
 function fillChoices(preferred){const list=rows();choice.replaceChildren(...list.map(d=>{const o=el('option','',T(d.name));o.value=d.id;return o;}));if(list.some(d=>d.id===preferred))choice.value=preferred;choice.disabled=!list.length;}
 function selection(){
  const d=data.directions.find(x=>x.id===choice.value);detail.replaceChildren();
  if(!d){detail.append(el('p','',L('В этом наборе нет направлений. Требования к данным сохраняются.','No directions meet this filter. Data requirements remain unchanged.')));return;}
  root.dataset.selected=d.id;
  const c=cohort(d),old=d.evidence?.cohorts?.p1??{},ci=c.fwciCI95;
  detail.append(el('h3','',T(d.name)),el('p','',T(d.question)));
  const dl=el('dl');
  const metrics=[
   [L('Работы: два пятилетия','Works: two periods'),`${num(old.n)} → ${num(c.n)}`],
   [L('Мировая доля темы: изменение','Topic world share change'),pct(d.evidence?.worldShareChange)],
   ['FWCI · 2021–2025',num(c.fwci,3)],
   [L('Условный 95% интервал','Conditional 95% interval'),finite(ci?.lower)&&finite(ci?.upper)?`${num(ci.lower,3)} … ${num(ci.upper,3)}`:'—'],
   [L('FWCI без максимальной работы','FWCI without the highest paper'),num(c.fwciWithoutHighest,3)],
   [L('Медиана FWCI','Median FWCI'),num(c.fwciMedian,3)],
   [L('Доля работ в top 10%','Top-10% share'),finite(c.top10)?`${num(c.top10*100,1)}%`:'—'],
   [L('Известный FWCI / работы','Known FWCI / works'),`${num(c.fwciN)} / ${num(c.n)}`],
  ];
  for(const [label,value] of metrics){const row=el('div');row.append(el('dt','',label),el('dd','',value));dl.append(row);}detail.append(dl);
  const mapping={reviewed:L('Определение темы соответствует направлению; содержание каждой статьи отдельно не проверялось.','The topic definition matches the direction; individual papers were not all manually audited.'),adjacent:L('Выборка включает смежные темы; соответствие направлению неполное.','The selection contains adjacent topics and only partly matches this direction.'),unverified:L('Граница направления пока не проверена.','The direction’s boundary has not yet been verified.')}[d.mappingStatus]??'';
  const eligible=d.pareto?.eligible?d.pareto.front?L('На границе Парето среди допущенных направлений. Это не мировой рейтинг.','On the Pareto frontier among eligible directions. This is not a world ranking.'):L('Другая допущенная альтернатива не ниже по трём показателям и выше хотя бы по одному.','Another eligible direction is no lower on all three measures and higher on at least one.'):L('Не участвует в сравнении Парето: требования к выборке или покрытию не выполнены. Это не отрицательная оценка компетенции.','Excluded from the Pareto comparison because sample or coverage requirements are not met. This is not a negative capability rating.');
  detail.append(el('p','tt-selection-limit',`${mapping} ${T(d.mappingNote)} ${eligible}`));
  const link=el('a','',L('Открыть научную задачу, аналоги и основания →','Open the research question, comparisons and evidence →'));link.href=`#tt-direction-${d.id}`;detail.append(link);
 }
 function draw(){
  const list=plotted(),width=chartHost.clientWidth,mobile=width<620;
  root.dataset.plotted=String(list.length);
  const xs=list.map(d=>d.evidence.worldShareChange*100),ys=list.flatMap(d=>[cohort(d).fwci,cohort(d).fwciCI95?.upper]).filter(finite);
  let xmin=Math.min(-5,...xs),xmax=Math.max(5,...xs);const pad=(xmax-xmin)*.13;xmin-=pad;xmax+=pad;
  const ymax=Math.max(1.4,...ys)*1.15;
  const all=data.directions;
  // Reusing one corpus for two proposed directions must not suggest two independent samples.
  const grouped=new Map();for(const d of list){const c=cohort(d),key=JSON.stringify([[...(d.topicIds??[])].sort(),d.evidence.worldShareChange,c.fwci,c.n]);if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push(d);}
  const maxN=Math.max(1,...list.map(d=>cohort(d).n??0));
  const points=[...grouped.values()].map(group=>{const d=group[0],c=cohort(d),selected=group.some(x=>x.id===choice.value);return {id:selected?choice.value:d.id,ids:group.map(x=>x.id),name:group.map(x=>T(x.name)).join(' / '),value:[d.evidence.worldShareChange*100,c.fwci,c.n],number:group.map(x=>all.indexOf(x)+1).join('/'),symbolSize:(mobile?37:49)*Math.sqrt(c.n/maxN),itemStyle:{color:selected?'#b96c32':group.some(x=>x.pareto?.eligible)?'#286d9d':'#94a2aa',opacity:.85,borderColor:'#fff',borderWidth:1.5}};});
  const intervals=list.filter(d=>finite(cohort(d).fwciCI95?.lower)&&finite(cohort(d).fwciCI95?.upper)).map(d=>[d.evidence.worldShareChange*100,cohort(d).fwciCI95.lower,cohort(d).fwciCI95.upper]);
  chart.setOption({animation:false,backgroundColor:'#fff',textStyle:{fontFamily:'Arial, sans-serif'},grid:{left:mobile?50:70,right:mobile?18:38,top:42,bottom:mobile?73:60},
   title:{text:L('Рост мировой доли × влияние работ СТАНКИН','World-share growth × STANKIN citation impact'),left:mobile?6:20,top:3,textStyle:{fontSize:mobile?12:16,fontWeight:500}},
   tooltip:{trigger:'item',renderMode:'richText',confine:true,formatter:p=>p.seriesType==='scatter'?`${p.data.number}. ${p.name}\n${L('Мировая доля','World share')}: ${pct(p.value[0]/100)}\nFWCI: ${num(p.value[1],3)} · n = ${num(p.value[2])}`:''},
   xAxis:{type:'value',min:xmin,max:xmax,name:L('Мировая доля: изменение, %','World-share change, %'),nameLocation:'middle',nameGap:mobile?47:35,nameTextStyle:{fontSize:mobile?10:12},axisLabel:{fontSize:mobile?10:11,formatter:v=>num(v,0)},splitLine:{lineStyle:{color:'#e7edf0'}}},
   yAxis:{type:'value',min:0,max:ymax,name:'FWCI',nameLocation:'middle',nameRotate:90,nameGap:mobile?36:45,nameTextStyle:{fontSize:12},axisLabel:{fontSize:11,formatter:v=>num(v,1)},splitLine:{lineStyle:{color:'#e7edf0'}}},
   series:[{type:'custom',name:'interval',silent:true,z:1,data:intervals,renderItem:(params,api)=>{const a=api.coord([api.value(0),api.value(1)]),b=api.coord([api.value(0),api.value(2)]);return {type:'group',children:[{type:'line',shape:{x1:a[0],y1:a[1],x2:b[0],y2:b[1]},style:{stroke:'#9babb5',lineWidth:1.5}},{type:'line',shape:{x1:a[0]-4,y1:a[1],x2:a[0]+4,y2:a[1]},style:{stroke:'#9babb5',lineWidth:1.5}},{type:'line',shape:{x1:b[0]-4,y1:b[1],x2:b[0]+4,y2:b[1]},style:{stroke:'#9babb5',lineWidth:1.5}}]};}},
    {type:'scatter',name:'directions',data:points,z:3,label:{show:true,position:'right',fontSize:12,color:'#243844',formatter:p=>String(p.data.number)},emphasis:{scale:1.15},markLine:{silent:true,symbol:'none',lineStyle:{type:'dashed',color:'#708a9a'},label:{show:false},data:[{xAxis:0},{yAxis:1}]}}]
  },true);
  status.textContent=L(`Показано ${list.length} из ${data.directions.length} направлений. Площадь круга пропорциональна числу работ; отрезок — условный 95% интервал FWCI. Синие точки допущены к сравнению Парето, серые — нет; оранжевая выбрана. Номера соответствуют карте выше. Совпадающие выборки объединены в одну точку с несколькими номерами. При менее чем 20 работах с известным FWCI интервал не строится.`,`Showing ${list.length} of ${data.directions.length} directions. Bubble area is proportional to work count; the line is a conditional 95% FWCI interval. Blue points meet Pareto eligibility; grey ones do not; orange marks the selection. Numbers match the map above. Identical paper sets share one point with several numbers. No interval is drawn when fewer than 20 papers have known FWCI.`);
 }
 function refresh(){selection();draw();}
 try{
  const response=await fetch(localUrl(root.dataset.source),{credentials:'same-origin'});if(!response.ok)throw new Error(`Think Tank data HTTP ${response.status}`);
  data=await response.json();if(data.schema!==1||!Array.isArray(data.directions)||data.checks?.some(c=>!c.passed))throw new Error('Think Tank validation failed');
  if(data.scenarios?.length)selectScenario(activeScenario??data.scenarios.find(x=>x.id==='connections')?.id??data.scenarios[0].id);
  await loadLibrary(localUrl(root.dataset.echarts));
  if(!window.echarts)throw new Error('Chart library unavailable');
  chartHost.hidden=false;chart=window.echarts.init(chartHost,null,{renderer:'canvas'});controls.hidden=false;staticHost.hidden=true;
  fillChoices(data.directions.find(d=>d.action==='advance')?.id);refresh();
  filter.addEventListener('change',()=>{fillChoices(choice.value);refresh();});choice.addEventListener('change',refresh);
  chart.on('click',p=>{if(p.seriesType!=='scatter'||!p.data?.id)return;choice.value=p.data.id;refresh();});
  new ResizeObserver(()=>{const w=chartHost.clientWidth;if(!w||w===lastWidth)return;lastWidth=w;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{chart.resize();draw();},80);}).observe(chartHost);
  root.dataset.ready='true';
 }catch(error){if(chart)chart.dispose();chartHost.hidden=true;controls.hidden=true;staticHost.hidden=false;status.textContent=L('Интерактивный график недоступен. Ниже сохранены схема и все расчётные значения.','The interactive chart is unavailable. The figure and all calculated values remain below.');root.dataset.ready='fallback';console.warn('Think Tank enhancement unavailable:',error.message);}
}
