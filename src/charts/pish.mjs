// PISH: presentation-ready, self-contained scientific diagrams.
// Coordinates encode real cohort values; unknown values remain unplotted.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const finite = v => v != null && Number.isFinite(v);
const fmt = (lang,v,d=2) => finite(v) ? new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v).replace(/^-/,'−') : '—';
const tx = (x,y,s,a='') => `<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
function lines(s,n) {
  const words = String(s ?? '').split(/\s+/); const out=[]; let line='';
  for (const word of words) { if (line && line.length + word.length + 1 > n) {out.push(line);line=word;} else line += `${line ? ' ' : ''}${word}`; }
  if (line) out.push(line); return out;
}
const multiline = (x,y,s,n,lh,attrs='') => lines(s,n).map((l,i)=>tx(x,y+i*lh,l,attrs)).join('');
export const PISH_SVG_STYLE = `<style>.pish-diagram{font-family:'Golos Text',Arial,sans-serif;color:#252420}.pish-diagram text{fill:#252420}.pish-diagram .pish-muted{fill:#69675f}.pish-diagram .pish-small{font-size:11px}.pish-diagram .pish-node-box{fill:#fbf9f4;stroke:#d9d4c8;stroke-width:1.3}.pish-diagram .pish-node a:focus .pish-node-box,.pish-diagram .pish-node a:hover .pish-node-box{stroke:#2f6db5;stroke-width:2.5}.pish-diagram .pish-strong{fill:#e4efea;stroke:#2b7e75}.pish-diagram .pish-build{fill:#e8eef6;stroke:#2f6db5}.pish-diagram .pish-verify{fill:#f6e8df;stroke:#b4432d}.pish-diagram .pish-flow{fill:none;stroke:#8b877d;stroke-width:1.6}.pish-diagram .pish-feedback{fill:none;stroke:#2f6db5;stroke-width:2.5}.pish-diagram .pish-qualification{fill:none;stroke:#69675f;stroke-width:1.5;stroke-dasharray:5 4}.pish-diagram .pish-cohort-before{fill:#fbf9f4;stroke:#69675f;stroke-width:2}.pish-diagram .pish-cohort-after{fill:#2f6db5;stroke:#fbf9f4;stroke-width:2}.pish-diagram .pish-cohort-down{fill:#b4432d}.pish-diagram .pish-grid{stroke:#e6e1d6;stroke-width:1}.pish-diagram .pish-reference{stroke:#8b877d;stroke-dasharray:4 4}.pish-diagram .pish-row-link:hover text,.pish-diagram .pish-row-link:focus text{fill:#2f6db5}.pish-diagram .pish-connector{fill:none;stroke:#2f6db5;stroke-width:2}.pish-diagram .pish-connector-down{stroke:#b4432d}.pish-diagram .pish-learning{fill:none;stroke:#2b7e75;stroke-width:2;stroke-dasharray:7 4}.pish-diagram .pish-t-blue{fill:#2f6db5}.pish-diagram .pish-t-green{fill:#2b7e75}.pish-diagram .pish-t-coral{fill:#b4432d}.pish-diagram .pish-band-line-green{stroke:#2b7e75}.pish-diagram .pish-band-line-blue{stroke:#2f6db5}.pish-diagram .pish-band-line-coral{stroke:#b4432d}.pish-diagram .pish-product-box{fill:#e8eef6;stroke:#2f6db5;stroke-width:2}.pish-diagram .pish-chip-base{fill:#e4efea;stroke:#2b7e75}.pish-diagram .pish-chip-gap{fill:#f6e8df;stroke:#b4432d}.pish-diagram .pish-step{fill:#fbf9f4;stroke:#2f6db5;stroke-width:1.3}.pish-diagram .pish-side-box{fill:#fbf9f4;stroke:#d9d4c8;stroke-width:1.2}.pish-diagram .pish-flow-blue{fill:none;stroke:#2f6db5;stroke-width:2.2}.pish-diagram .pish-flow-coral{fill:none;stroke:#b4432d;stroke-width:2.2}.pish-diagram .pish-flow-muted{fill:none;stroke:#8b877d;stroke-width:1.6;stroke-dasharray:5 4}.pish-diagram .pish-bar{fill:#2f6db5}.pish-diagram .pish-band-budget{fill:#e4efea}.pish-diagram .pish-band-extra{fill:#f6e8df;opacity:.7}.pish-diagram .pish-band-window{fill:#e8eef6;opacity:.75}.pish-diagram .pish-gate{fill:#b4432d}.pish-diagram .pish-official{fill:#252420}.pish-diagram .pish-internal{fill:#2f6db5}.pish-diagram .pish-gate-line{stroke:#b4432d;stroke-dasharray:4 4}.pish-diagram .pish-lane-product{fill:#e8eef6;stroke:#2f6db5}.pish-diagram .pish-lane-science{fill:#e4efea;stroke:#2b7e75}.pish-diagram .pish-lane-people{fill:#efebe2;stroke:#8b877d}.pish-diagram .pish-lane-money{fill:#f6e8df;stroke:#b4432d}.pish-diagram .pish-axis{stroke:#8b877d}.pish-diagram .pish-halo{paint-order:stroke;stroke:#fbf9f4;stroke-width:4px;stroke-linejoin:round}</style>`;

// Seven functions grouped by owner, with three feedback loops at different speeds:
// the CNC servo loop (inside the machine), the adaptive loop and the learning loop.
export function pishLoop(spec = {}, width = 1160, { standalone = false } = {}) {
  const {lang='ru',nodes=[]}=spec; const en=lang==='en';
  const w=Math.max(340,Number.isFinite(width)?Math.round(width):1160); const narrow=w<800;
  const bands=[
    {from:0,to:1,tone:'green',label:en?'PROCESS PHYSICS · STANKIN BASE':'ФИЗИКА ПРОЦЕССА · ОПОРА СТАНКИН'},
    {from:2,to:5,tone:'blue',label:en?'MACHINING INTELLIGENCE · THE NEW SCHOOL PRODUCT':'ИНТЕЛЛЕКТ ОБРАБОТКИ · ПРОДУКТ НОВОЙ ПИШ'},
    {from:6,to:6,tone:'coral',label:en?'ACCEPTANCE':'ПРИЁМКА'},
  ].filter(b=>b.from<nodes.length);
  const texts={
    adaptive:en?'≤10 ms* · ADAPTIVE LOOP: NEW PERMITTED SETTINGS → MACHINING':'≤10 мс* · АДАПТИВНЫЙ КОНТУР: НОВЫЙ РАЗРЕШЁННЫЙ РЕЖИМ → ОБРАБОТКА',
    part:en?'PART → INDEPENDENT METROLOGY · ACCEPTED / REJECTED':'ДЕТАЛЬ → НЕЗАВИСИМАЯ МЕТРОЛОГИЯ · ГОДНАЯ / БРАК',
    learning:en?'BETWEEN BATCHES · UPDATE THE MODEL ONLY AFTER VERIFICATION':'МЕЖДУ ПАРТИЯМИ · ОБНОВИТЬ МОДЕЛЬ ТОЛЬКО ПОСЛЕ ПРОВЕРКИ',
  };
  const legend=[
    ['servo',en?'CNC servo loop · 100 µs* (inside the machine)':'Сервоконтур ЧПУ · 100 мкс* (внутри станка)'],
    ['adaptive',en?'Adaptive loop · ≤10 ms*':'Адаптивный контур · ≤10 мс*'],
    ['learning',en?'Learning loop · between batches':'Контур обучения · между партиями'],
    ['part',en?'Part flow to independent acceptance':'Деталь — к независимой приёмке'],
  ];
  const id=`pish-arrow-${lang}`,fid=`pish-feedback-arrow-${lang}`,gid=`pish-learning-arrow-${lang}`;
  const head=h=>`<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram pish-loop-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(en?'Proposed smart-machine system':'Предлагаемая система умного станка')}"><title>${esc(en?'From cutting to an accepted part':'От обработки к годной детали')}</title><desc>${esc(en?'Seven steps in the proposed system, grouped as process physics, the new school product and acceptance. The CNC servo loop runs inside the machine at about 100 µs; the adaptive loop changes permitted settings within about 10 ms; the learning loop updates the model between batches only after independent measurement. The system and its targets still need to be built and tested.':'Семь шагов предлагаемой системы, сгруппированных как физика процесса, продукт новой ПИШ и приёмка. Сервоконтур ЧПУ работает внутри станка с циклом около 100 мкс; адаптивный контур меняет разрешённый режим за время до 10 мс; контур обучения обновляет модель между партиями только после независимого измерения. Систему и её целевые показатели ещё нужно испытать.')}</desc>${standalone?PISH_SVG_STYLE:''}<defs><marker id="${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7" class="pish-muted"/></marker><marker id="${fid}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" class="pish-t-blue"/></marker><marker id="${gid}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" class="pish-t-green"/></marker></defs>`;
  const swatch=(kind,x,y)=>kind==='servo'?`<circle cx="${x+11}" cy="${y-4}" r="7" fill="none" class="pish-flow"/><path d="M${x+14},${y-14} l4,3 l-4,3 z" class="pish-muted"/>`:kind==='adaptive'?`<path d="M${x},${y-4} H${x+22}" class="pish-feedback"/>`:kind==='learning'?`<path d="M${x},${y-4} H${x+22}" class="pish-learning"/>`:`<path d="M${x},${y-4} H${x+22}" class="pish-qualification"/>`;
  const card=(n,i,p,cardW,cardH,labelN,subN)=>{
    const status=n.status??'build';const titleLines=lines(n.label,labelN);const subY=p.y+47+titleLines.length*19;
    return `<g class="pish-node"><a href="${esc(n.href??`#pish-node-${n.id}`)}" aria-label="${esc(`${String(i+1).padStart(2,'0')}. ${n.label}. ${n.subtitle??''}. ${n.statusLabel??''}`)}"><title>${esc(`${n.label}: ${n.subtitle??''}; ${n.statusLabel??''}`)}</title><rect x="${p.x}" y="${p.y}" width="${cardW}" height="${cardH}" rx="6" class="pish-node-box pish-${status}"/>${tx(p.x+13,p.y+22,String(i+1).padStart(2,'0'),'font-size="11" font-weight="600" class="pish-muted"')}${multiline(p.x+13,p.y+45,n.label,labelN,19,'font-size="15.5" font-weight="600"')}${multiline(p.x+13,subY,n.subtitle,subN,15,'font-size="11.5" class="pish-muted"')}${multiline(p.x+13,p.y+cardH-18,n.statusLabel,subN+2,13,'font-size="10.5" font-weight="600"')}</a></g>`;
  };
  const out=[];
  if(!narrow){
    const l=24,gap=14,cardW=(w-l*2-gap*6)/7,cardH=150,top=114,bottom=top+cardH;
    const pos=nodes.map((n,i)=>({x:l+i*(cardW+gap),y:top}));const cx=i=>pos[i].x+cardW/2;
    out.push(tx(l,26,en?'PROPOSED TASK · DETECT WEAR, ADJUST SETTINGS, CHECK THE PART':'ПРЕДЛАГАЕМАЯ ЗАДАЧА · ЗАМЕТИТЬ ИЗНОС, ПОДОБРАТЬ РЕЖИМ, ПРОВЕРИТЬ ДЕТАЛЬ','font-size="12" font-weight="600" letter-spacing="1"'));
    for(const b of bands){const x1=pos[b.from].x,x2=pos[Math.min(b.to,nodes.length-1)].x+cardW;out.push(`<path d="M${x1},66 V58 H${x2} V66" fill="none" stroke-width="1.5" class="pish-band-line-${b.tone}"/>`,tx(x1,50,b.label,`font-size="10.5" font-weight="700" letter-spacing=".7" class="pish-t-${b.tone}"`));}
    nodes.forEach((n,i)=>{
      if(i<nodes.length-1)out.push(`<path class="${i===5?'pish-qualification':'pish-flow'}" d="M${pos[i].x+cardW},${top+cardH/2} H${pos[i+1].x-5}" marker-end="url(#${id})"/>`);
      out.push(card(n,i,pos[i],cardW,cardH,15,20));
    });
    if(nodes.length>=7){
      const ly=94;
      out.push(`<path class="pish-learning" d="M${cx(6)},${top} V${ly} H${cx(3)} V${top-5}" marker-end="url(#${gid})"/>`,tx((cx(3)+cx(6))/2,ly-6,texts.learning,'font-size="11" font-weight="600" text-anchor="middle" class="pish-t-green"'));
      const ay=bottom+36;
      out.push(`<path class="pish-feedback" d="M${cx(5)},${bottom} V${ay-14} Q${cx(5)},${ay} ${cx(5)-14},${ay} H${cx(1)+14} Q${cx(1)},${ay} ${cx(1)},${ay-14} V${bottom+5}" marker-end="url(#${fid})"/>`,tx((cx(1)+cx(5))/2,ay-7,texts.adaptive,'font-size="12" font-weight="600" text-anchor="middle" class="pish-t-blue"'));
      const py=bottom+80;
      out.push(`<path class="pish-qualification" d="M${cx(1)-18},${bottom} V${py} H${cx(6)} V${bottom+5}" marker-end="url(#${id})"/>`,tx((cx(1)+cx(6))/2,py-7,texts.part,'font-size="11.5" text-anchor="middle" class="pish-muted"'));
      const gy=bottom+122;let lx=l;
      legend.forEach(([kind,label])=>{out.push(swatch(kind,lx,gy),tx(lx+30,gy,label,'font-size="11.5"'));lx+=30+label.length*6.3+26;});
      out.push(tx(l,gy+36,en?'Before changing settings: check prediction reliability, permitted limits and part quality':'Перед сменой режима: проверить надёжность прогноза, разрешённые пределы и качество детали','font-size="12.5" font-weight="600"'));
      out.push(tx(l,gy+60,en?'*Proposed targets for testing. Select a step to see the research, target, responsible team and test.':'*Целевые значения для испытаний. Нажмите шаг: исследования, цель, ответственные и способ проверки.','class="pish-muted" font-size="11.5"'));
      return head(gy+78)+out.join('')+'</svg>';
    }
    return head(bottom+40)+out.join('')+'</svg>';
  }
  // narrow: a vertical chain; adaptive loop on the right, learning loop on the left
  const left=40,right=34,cardW=w-left-right-12,cardH=124,gap=18;const labelN=Math.max(12,Math.floor((cardW-26)/8.7)),subN=Math.max(14,Math.floor((cardW-26)/6.5));
  out.push(multiline(16,26,en?'PROPOSED SMART-MACHINE SYSTEM':'ПРЕДЛАГАЕМАЯ СИСТЕМА УМНОГО СТАНКА',Math.floor((w-32)/7),15,'font-size="12" font-weight="600" letter-spacing="1"'));
  out.push(multiline(16,54,en?'CNC 100 µs* · model ≤10 ms* · learning between batches':'ЧПУ 100 мкс* · модель ≤10 мс* · обучение между партиями',Math.floor((w-32)/7.3),16,'font-size="13" font-weight="600"'));
  let y=54+lines(en?'CNC 100 µs* · model ≤10 ms* · learning between batches':'ЧПУ 100 мкс* · модель ≤10 мс* · обучение между партиями',Math.floor((w-32)/7.3)).length*16+8;
  out.push(tx(16,y,en?'Separate layers · *proposed target':'Разные уровни · *проектная цель','class="pish-muted" font-size="11"'));y+=22;
  const pos=[];
  nodes.forEach((n,i)=>{
    const band=bands.find(b=>b.from===i);
    if(band){out.push(`<path d="M${left},${y+6} H${left+cardW}" stroke-width="1.5" class="pish-band-line-${band.tone}"/>`,multiline(left,y,band.label,Math.floor(cardW/7.4),13,`font-size="10.5" font-weight="700" letter-spacing=".5" class="pish-t-${band.tone}"`));y+=lines(band.label,Math.floor(cardW/7.4)).length*13+10;}
    pos.push({x:left,y});y+=cardH+gap;
  });
  nodes.forEach((n,i)=>{
    if(i<nodes.length-1){const a=pos[i],b=pos[i+1];out.push(`<path class="${i===5?'pish-qualification':'pish-flow'}" d="M${a.x+cardW/2},${a.y+cardH} V${b.y-5}" marker-end="url(#${id})"/>`);}
    out.push(card(n,i,pos[i],cardW,cardH,labelN,subN));
  });
  if(nodes.length>=7){
    const bx=w-18,c=pos[1],r=pos[5];
    out.push(`<path class="pish-feedback" d="M${r.x+cardW},${r.y+cardH*.52} H${bx} V${c.y+cardH*.52} H${c.x+cardW+5}" marker-end="url(#${fid})"/>`);
    const my=(c.y+r.y)/2+cardH/2;out.push(`<text x="${bx-8}" y="${my}" transform="rotate(-90 ${bx-8} ${my})" font-size="11.5" text-anchor="middle" class="pish-t-blue">${esc(en?'≤10 ms* · new permitted settings → cutting':'≤10 мс* · новый разрешённый режим → обработка')}</text>`);
    const lx=16,a=pos[6],m=pos[3];
    out.push(`<path class="pish-learning" d="M${a.x},${a.y+cardH*.5} H${lx} V${m.y+cardH*.5} H${m.x-5}" marker-end="url(#${gid})"/>`);
    const gy=(a.y+m.y)/2+cardH/2;out.push(`<text x="${lx+11}" y="${gy}" transform="rotate(-90 ${lx+11} ${gy})" font-size="11" text-anchor="middle" class="pish-t-green">${esc(en?'Between batches: update the model after checks':'Между партиями: обновить модель после проверки')}</text>`);
  }
  y+=4;
  out.push(multiline(16,y,en?'Independent measurements check the finished part.':'Готовую деталь проверяют независимым измерением.',Math.floor((w-32)/7),17,'font-size="12"'));
  y+=lines(en?'Independent measurements check the finished part.':'Готовую деталь проверяют независимым измерением.',Math.floor((w-32)/7)).length*17+12;
  out.push(multiline(16,y,en?'Select a step: who does it and how we test it.':'Нажмите шаг: кто делает и как проверяем.',Math.floor((w-32)/6.2),15,'class="pish-muted" font-size="10.5"'));
  y+=30;
  return head(y)+out.join('')+'</svg>';
}

export function cohortsChart(spec = {}, width = 1160) {
  const {rows=[],lang='ru',period}=spec;const p1Label=(period?.p1??[2016,2020]).join('–');const p2Label=(period?.p2??[2021,2025]).join('–');const en=lang==='en'; const w=Math.max(360,Number.isFinite(width)?Math.round(width):1160); const narrow=w<750;
  const labelW=narrow?136:250; const right=narrow?31:116; const top=89; const rowH=narrow?69:57; const h=top+rows.length*rowH+71;
  const values=rows.flatMap(r=>[r.p1?.fwci,r.p2?.fwci]).filter(finite);
  const hi=Math.max(2,Math.ceil(Math.max(1,...values)*2)/2); const plotW=w-labelW-right; const X=v=>labelW+v/hi*plotW;
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram pish-cohorts-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(en?'STANKIN citation impact by publication cohort':'Цитирование работ СТАНКИН по пятилетиям')}"><title>${esc(en?'Citation impact: 2016–2020 → 2021–2025':'Цитирование: 2016–2020 → 2021–2025')}</title><desc>${esc(en?'Each row compares mean FWCI for works published in 2016–2020 and 2021–2025. Hollow circles show the earlier years; filled circles show the later years. One is the world reference. Missing values are labelled. FWCI adjusts for year, type and field. Citation windows for recent works are still incomplete; the difference does not prove a change in research quality.':'В строке сравнивается средний FWCI работ 2016–2020 и 2021–2025 годов. Пустой круг — ранние годы, заполненный — поздние. Единица — мировой ориентир. Пропуски подписаны. FWCI учитывает год, тип и область. Окно цитирования новых работ ещё не завершено; разница не доказывает изменение качества исследований.')}</desc>`];
  out.push(tx(12,24,narrow?(en?'MEAN FWCI BY PUBLICATION YEARS':'СРЕДНИЙ FWCI ПО ГОДАМ РАБОТ'):(en?'MEAN FWCI · ONE SCALE FOR BOTH PERIODS':'СРЕДНИЙ FWCI · ОБЩАЯ ШКАЛА ДВУХ ПЯТИЛЕТИЙ'),'font-size="12" font-weight="600"'));
  out.push(`<circle cx="20" cy="49" r="5" class="pish-cohort-before"/>`,tx(32,53,'2016–2020','font-size="11.5"'),`<circle cx="153" cy="49" r="5" class="pish-cohort-after"/>`,tx(165,53,'2021–2025','font-size="11.5"'));
  if(!narrow&&spec.standalone) out.push(tx(w-10,53,en?'Citation change does not prove a change in quality':'Изменение цитирования не доказывает изменение качества','font-size="11" class="pish-muted" text-anchor="end"'));
  for(let v=0;v<=hi+.001;v+=.5){out.push(`<line class="${v===1?'pish-reference':'pish-grid'}" x1="${X(v)}" x2="${X(v)}" y1="${top-13}" y2="${top+rows.length*rowH-10}"/>`,tx(X(v),top+rows.length*rowH+13,fmt(lang,v,1),'font-size="11" class="pish-muted" text-anchor="middle"'));}
  out.push(tx(X(1),top+rows.length*rowH+39,en?'FWCI 1 = world reference':'FWCI 1 = мировой ориентир','font-size="11" class="pish-muted" text-anchor="middle"'));
  rows.forEach((r,i)=>{
    const y=top+i*rowH+15;const p1=r.p1??{},p2=r.p2??{};const a=p1.fwci,b=p2.fwci;const down=finite(a)&&finite(b)&&b<a;
    const title=`${r.name??r.id}. 2016–2020: FWCI ${fmt(lang,a)}, n=${fmt(lang,p1.n,0)}; 2021–2025: FWCI ${fmt(lang,b)}, n=${fmt(lang,p2.n,0)}.`;
    out.push(`<g class="pish-row-link"><${r.href?'a':'g'}${r.href?` href="${esc(r.href)}"`:' tabindex="0"'} aria-label="${esc(title)}"><title>${esc(title)}</title>`);
    out.push(multiline(12,y+3,r.name??r.id,narrow?17:30,16,'font-size="12.5" font-weight="500"'));
    out.push(tx(12,y+(narrow?43:22),`n ${fmt(lang,p1.n,0)} → ${fmt(lang,p2.n,0)}`,'font-size="10.5" class="pish-muted"'));
    if(finite(a)&&finite(b)){
      out.push(`<line x1="${X(a)}" x2="${X(b)}" y1="${y}" y2="${y}" class="pish-connector${down?' pish-connector-down':''}"/>`);
      const sign=b>=a?1:-1;out.push(`<path d="M${X(b)-sign*8},${y-4} L${X(b)},${y} L${X(b)-sign*8},${y+4}" fill="none" stroke="${down?'#b4432d':'#2f6db5'}" stroke-width="1.5"/>`);
    }
    if(finite(a))out.push(`<circle cx="${X(a)}" cy="${y}" r="6" class="pish-cohort-before"/>`,tx(X(a),y-12,fmt(lang,a,2),'font-size="10.5" class="pish-muted" text-anchor="middle"'));
    if(finite(b))out.push(`<circle cx="${X(b)}" cy="${y}" r="6" class="pish-cohort-after${down?' pish-cohort-down':''}"/>`,tx(X(b),y+21,fmt(lang,b,2),'font-size="10.5" font-weight="600" text-anchor="middle"'));
    if(!finite(a)||!finite(b))out.push(tx(labelW+4,y+38,en?'No value for this period':'Нет данных за это пятилетие','font-size="10" class="pish-muted"'));
    if(!narrow)out.push(tx(w-10,y+3,`${fmt(lang,a,2)} → ${fmt(lang,b,2)}`,'font-size="12" font-weight="600" text-anchor="end"'));
    out.push(`</${r.href?'a':'g'}></g>`);
  });
  return (out.join('')+'</svg>').replaceAll('2016–2020',p1Label).replaceAll('2021–2025',p2Label);
}

// Two distinct views: broad competency groups and selected OpenAlex topics.
// A topic is not silently treated as a subdivision of the plotted groups.
export function pishTopicLandscape(spec = {}, width = 1160, { standalone = false } = {}) {
  const { rows = [], topics = [], lang = 'ru' } = spec;
  const en=lang==='en',w=Math.max(360,Number.isFinite(width)?Math.round(width):1160),narrow=w<800;
  const delta=v=>{if(!finite(v))return '—';const r=Math.round(v*1000)/1000;return `${r>0?'+':r<0?'−':''}${new Intl.NumberFormat(en?'en-GB':'ru-RU',{style:'percent',maximumFractionDigits:1}).format(Math.abs(r))}`;};
  const state=r=>['strong','base'].includes(r.status)?'base':['strengthen','build','gap'].includes(r.status)?'build':['review','watch'].includes(r.status)?'review':'unknown';
  const stateText=r=>({base:en?'Our research base':'Своя научная опора',build:en?'Needs strengthening':'Нужно усилить',review:en?'Inspect a narrower topic':'Проверить узкую тему',unknown:en?'Check the evidence':'Проверить данные'})[state(r)];
  const stateColour=r=>({base:'#2b7e75',build:'#2f6db5',review:'#b4432d',unknown:'#8b877d'})[state(r)];
  const label=r=>r.label??r.id??'';
  const openLink=r=>`<g class="pish-row-link">${r.href?`<a href="${esc(r.href)}" aria-label="${esc(label(r))}">`:''}`;
  const closeLink=r=>`${r.href?'</a>':''}</g>`;
  const firstTop=114,firstHeight=narrow?rows.length*172+18:Math.max(500,rows.length*57+65);
  const secondTop=firstTop+firstHeight+49,topicH=narrow?124:65;
  // Подвал: на странице одна строка (общие оговорки — в блоке «Как читать»), в скачиваемом файле две.
  const footTop=secondTop+topics.length*topicH;
  const h=footTop+(standalone?(narrow?170:114):(narrow?96:58));
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram pish-topic-landscape" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(en?'Research fields and selected emerging topics':'Научные направления и растущие темы')}"><title>${esc(en?'Choose a field, then inspect the specific research topics':'Выбрать направление и проверить конкретные научные темы')}</title><desc>${esc(en?'The first view compares broad groups using change in world publication share, recent STANKIN FWCI and recent publication count. The second view shows selected OpenAlex topics on a separate taxonomy. World share is relative to all world publications. This is not a global ranking, market estimate or assessment of technology readiness. Missing values are distinguished from zero; action labels are supplied by the page model rather than inferred from coordinates.':'Сначала сравниваются широкие группы: изменение мировой публикационной доли, FWCI новых работ СТАНКИН и число новых работ. Затем отдельно показаны выбранные темы OpenAlex с другой детализацией классификации. Мировая доля считается относительно всех мировых работ. Это не мировой рейтинг, оценка рынка или готовности технологии. Пропуски отличаются от нуля; подписи действий передаёт модель страницы, а не координаты на графике.')}</desc>${standalone?PISH_SVG_STYLE:''}`];
  out.push(tx(18,26,en?'1 · BROAD RESEARCH FIELDS':'1 · ШИРОКИЕ НАУЧНЫЕ НАПРАВЛЕНИЯ','font-size="12" font-weight="600" letter-spacing=".8"'));
  out.push(multiline(18,53,en?'World topic-share change × recent STANKIN citation impact':'Изменение мировой доли направления × цитирование новых работ СТАНКИН',narrow?39:110,20,'font-size="16" font-weight="600"'));
  out.push(multiline(18,narrow?96:84,en?'Area = recent work count · whiskers = descriptive 95% intervals':'Площадь = число новых работ · усы = описательные 95% интервалы',narrow?47:140,14,'font-size="10.5" class="pish-muted"'));
  if(narrow) {
    rows.forEach((r,i)=>{
      const y=firstTop+i*172;
      out.push(openLink(r));
      out.push(`<rect x="18" y="${y}" width="${w-36}" height="159" rx="5" class="pish-node-box"/><rect x="18" y="${y}" width="4" height="159" rx="2" fill="${stateColour(r)}"/>`);
      const nameLines=lines(label(r),32);const bodyY=y+27+nameLines.length*18;
      out.push(multiline(31,y+24,label(r),32,18,'font-size="14" font-weight="600"'));
      out.push(tx(31,bodyY,`${en?'World-share change':'Изменение мировой доли'} ${delta(r.worldShareChange)} · FWCI ${fmt(lang,r.fwciP2,2)}`,'font-size="12"'));
      out.push(tx(31,bodyY+22,`${en?'STANKIN works':'Работы СТАНКИН'} ${fmt(lang,r.nP1,0)} → ${fmt(lang,r.nP2,0)}`,'font-size="11.5" class="pish-muted"'));
      if(finite(r.fwciLow)&&finite(r.fwciHigh))out.push(tx(31,bodyY+41,`95%: ${fmt(lang,r.fwciLow,2)} … ${fmt(lang,r.fwciHigh,2)}`,'font-size="10.5" class="pish-muted"'));
      out.push(tx(31,y+145,stateText(r),'font-size="11" font-weight="600"'),closeLink(r));
    });
  } else {
    const keyW=350,left=62,right=keyW+33,plotW=w-left-right,plotH=firstHeight-105,top=firstTop+18;
    const valid=rows.map((r,i)=>({...r,index:i})).filter(r=>finite(r.worldShareChange)&&finite(r.fwciP2)&&r.fwciP2>=0);
    const xs=valid.map(r=>r.worldShareChange),ys=valid.flatMap(r=>[r.fwciP2,finite(r.fwciHigh)?r.fwciHigh:r.fwciP2]);const rawLo=Math.min(0,...xs),rawHi=Math.max(0,...xs),span=Math.max(.4,rawHi-rawLo);
    const step=span<=.6?.1:span<=1.5?.25:span<=3?.5:1;
    const lo=Math.floor((rawLo-span*.15)/step)*step,hi=Math.ceil((rawHi+span*.15)/step)*step;
    const yHi=Math.max(2,Math.ceil(Math.max(1,...ys)*2)/2+.5),X=v=>left+(v-lo)/(hi-lo)*plotW,Y=v=>top+plotH-v/yHi*plotH;
    const maxN=Math.max(1,...valid.map(r=>finite(r.nP2)&&r.nP2>0?r.nP2:0));
    out.push(`<rect x="${left}" y="${top}" width="${plotW}" height="${plotH}" fill="#fbf9f4"/><rect x="${X(0)}" y="${top}" width="${left+plotW-X(0)}" height="${plotH}" fill="#e8eef6" opacity=".6"/>`);
    for(let x=lo;x<=hi+step/2;x+=step)out.push(`<line x1="${X(x)}" x2="${X(x)}" y1="${top}" y2="${top+plotH}" class="pish-grid"/>`,tx(X(x),top+plotH+22,delta(Math.abs(x)<1e-8?0:x),'font-size="10.5" class="pish-muted" text-anchor="middle"'));
    for(let y=0;y<=yHi+.01;y+=.5)out.push(`<line x1="${left}" x2="${left+plotW}" y1="${Y(y)}" y2="${Y(y)}" class="pish-grid"/>`,tx(left-10,Y(y)+4,fmt(lang,y,1),'font-size="10.5" class="pish-muted" text-anchor="end"'));
    out.push(`<line x1="${X(0)}" x2="${X(0)}" y1="${top}" y2="${top+plotH}" class="pish-reference"/><line x1="${left}" x2="${left+plotW}" y1="${Y(1)}" y2="${Y(1)}" class="pish-reference"/>`);
    out.push(tx(left,top-12,en?'Recent STANKIN FWCI':'FWCI новых работ СТАНКИН','font-size="11" font-weight="600"'));
    out.push(tx(left+plotW/2,top+plotH+48,en?'Change in world publication share':'Изменение доли направления в мировой науке','font-size="11" class="pish-muted" text-anchor="middle"'));
    const chips=[];
    [...valid].sort((a,b)=>(b.nP2??0)-(a.nP2??0)).forEach(r=>{
      const cx=X(r.worldShareChange),cy=Y(r.fwciP2),radius=finite(r.nP2)&&r.nP2>0?Math.sqrt(r.nP2/maxN)*27:0;
      const title=`${label(r)}. ${en?'World-share change':'Изменение мировой доли'} ${delta(r.worldShareChange)}; FWCI ${fmt(lang,r.fwciP2,2)}; n=${fmt(lang,r.nP2,0)}. ${stateText(r)}.`;
      out.push(`<g><title>${esc(title)}</title>`);
      if(finite(r.fwciLow)&&finite(r.fwciHigh)&&r.fwciLow>=0&&r.fwciHigh>=r.fwciLow)out.push(`<path d="M${cx},${Y(r.fwciLow)}V${Y(r.fwciHigh)}M${cx-5},${Y(r.fwciLow)}H${cx+5}M${cx-5},${Y(r.fwciHigh)}H${cx+5}" stroke="${stateColour(r)}" stroke-width="1.5" fill="none"/>`);
      if(radius>0)out.push(`<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${stateColour(r)}" fill-opacity=".77" stroke="#fbf9f4" stroke-width="1.5"/>`);
      else out.push(`<path d="M${cx-4},${cy}H${cx+4}M${cx},${cy-4}V${cy+4}" stroke="${stateColour(r)}" stroke-width="1.5"/>`);
      const candidates=[[cx+radius+12,cy-12],[cx-radius-12,cy-12],[cx+radius+12,cy+16],[cx-radius-12,cy+16],[cx,cy-radius-16],[cx,cy+radius+17],[cx+radius+29,cy],[cx-radius-29,cy]];
      const choice=candidates.find(([x,y])=>x>left+10&&x<left+plotW-10&&y>top+10&&y<top+plotH-10&&!chips.some(p=>Math.abs(p.x-x)<28&&Math.abs(p.y-y)<23))??[Math.min(left+plotW-13,Math.max(left+13,cx)),Math.min(top+plotH-12,Math.max(top+12,cy-radius-13))];
      chips.push({x:choice[0],y:choice[1]});
      out.push(`<line x1="${cx}" x2="${choice[0]}" y1="${cy}" y2="${choice[1]}" stroke="#8b877d" stroke-width=".8"/><rect x="${choice[0]-11}" y="${choice[1]-10}" width="22" height="20" rx="4" fill="#fbf9f4" stroke="${stateColour(r)}"/>`,tx(choice[0],choice[1]+4,String(r.index+1).padStart(2,'0'),'font-size="10" font-weight="600" text-anchor="middle"'),'</g>');
    });
    const keyX=w-keyW+1;
    // высота пункта зависит от числа строк названия: подписи не наезжают на следующий пункт
    let keyY=firstTop+6;
    rows.forEach((r,i)=>{
      const y=keyY,titleLines=lines(label(r),37).length,metaY=y+10+15*(titleLines-1)+16;
      out.push(openLink(r));
      out.push(`<g><title>${esc(label(r))}</title>`,tx(keyX,y+10,String(i+1).padStart(2,'0'),'font-size="10.5" font-weight="600" class="pish-muted"'));
      out.push(multiline(keyX+32,y+10,label(r),37,15,'font-size="12" font-weight="600"'));
      out.push(tx(keyX+32,metaY,`FWCI ${fmt(lang,r.fwciP2,2)} · n=${fmt(lang,r.nP2,0)} · ${delta(r.worldShareChange)}`,'font-size="10.5" class="pish-muted"'));
      out.push(tx(keyX+32,metaY+13,stateText(r),`font-size="10" font-weight="600" fill="${stateColour(r)}"`));
      out.push('</g>',closeLink(r));
      keyY=metaY+13+14;
    });
    const missing=rows.filter(r=>!finite(r.worldShareChange)||!finite(r.fwciP2)||r.fwciP2<0).length;
    if(missing)out.push(tx(left,top+plotH+68,`${en?'Not plotted: missing coordinates':'Не построено: нет координат'} · ${missing}`,'font-size="10.5" class="pish-muted"'));
  }
  out.push(`<line x1="18" x2="${w-18}" y1="${secondTop-32}" y2="${secondTop-32}" stroke="#d9d4c8"/>`);
  out.push(tx(18,secondTop-13,en?'2 · SELECTED OPENALEX TOPICS · A SEPARATE VIEW':'2 · ВЫБРАННЫЕ ТЕМЫ OPENALEX · ОТДЕЛЬНЫЙ СРЕЗ','font-size="12" font-weight="600" letter-spacing=".6"'));
  const maxGrowth=Math.max(.2,...topics.filter(t=>finite(t.worldShareChange)).map(t=>Math.abs(t.worldShareChange)));
  topics.forEach((t,i)=>{
    const y=secondTop+i*topicH+10;
    out.push(openLink(t));
    if(narrow) {
      out.push(`<rect x="18" y="${y}" width="${w-36}" height="111" rx="5" class="pish-node-box"/>`);
      out.push(multiline(30,y+24,label(t),34,18,'font-size="13" font-weight="600"'));
      out.push(tx(30,y+73,`${en?'World-share change':'Изменение мировой доли'} ${delta(t.worldShareChange)}`,'font-size="13" font-weight="600"'));
      out.push(tx(30,y+96,`${en?'STANKIN recent works':'Новые работы СТАНКИН'} ${fmt(lang,t.nP2,0)}`,'font-size="10.5" class="pish-muted"'));
    } else {
      const barX=422,barW=Math.max(120,w-762),zero=barX+barW*.5;
      out.push(multiline(18,y+13,label(t),49,16,'font-size="12.5" font-weight="600"'));
      out.push(tx(18,y+48,`${en?'World works':'Работы мира'} ${fmt(lang,t.worldP1,0)} → ${fmt(lang,t.worldP2,0)}`,'font-size="10.5" class="pish-muted"'));
      out.push(`<line x1="${barX}" x2="${barX+barW}" y1="${y+24}" y2="${y+24}" stroke="#e6e1d6" stroke-width="9"/><line x1="${zero}" x2="${zero}" y1="${y+14}" y2="${y+34}" stroke="#8b877d"/>`);
      if(finite(t.worldShareChange)) {
        const length=Math.abs(t.worldShareChange)/maxGrowth*barW*.45;
        out.push(`<rect x="${t.worldShareChange>=0?zero:zero-length}" y="${y+19.5}" width="${length}" height="9" fill="${t.worldShareChange>=0?'#2f6db5':'#b4432d'}"/>`);
      }
      out.push(tx(barX+barW+15,y+29,delta(t.worldShareChange),'font-size="14" font-weight="600"'));
      out.push(tx(w-16,y+17,`${en?'STANKIN n':'СТАНКИН n'}=${fmt(lang,t.nP2,0)}`,'font-size="12" font-weight="600" text-anchor="end"'));
      out.push(tx(w-16,y+41,en?'Recent period':'Новое пятилетие','font-size="11" class="pish-muted" text-anchor="end"'));
    }
    out.push(closeLink(t));
  });
  out.push(multiline(18,footTop+(narrow?30:32),en?'Selected topics are not a complete world ranking. Growth is relative to all world publications of the same types and years.':'Выбранные темы — не полный мировой рейтинг. Рост считается относительно всех мировых работ тех же типов и годов.',narrow?45:150,14,'font-size="10.5" class="pish-muted"'));
  if(standalone)out.push(multiline(18,footTop+(narrow?91:66),en?'Intervals describe the citation sample; they do not prove a winning topic or a ready product. Zero primary-topic works does not mean absent technology.':'Интервалы описывают выборку работ, а не доказывают приоритет темы или готовность продукта. Ноль работ с основной темой не означает отсутствие технологии.',narrow?46:150,14,'font-size="10.5" class="pish-muted"'));
  return out.join('')+'</svg>';
}
