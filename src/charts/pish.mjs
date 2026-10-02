// PISH: presentation-ready, self-contained scientific diagrams.
// Coordinates encode real cohort values; unknown values remain unplotted.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const finite = v => v != null && Number.isFinite(v);
const fmt = (lang,v,d=2) => finite(v) ? new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'ru-RU',{maximumFractionDigits:d}).format(v) : '—';
const tx = (x,y,s,a='') => `<text x="${x}" y="${y}" ${a}>${esc(s)}</text>`;
function lines(s,n) {
  const words = String(s ?? '').split(/\s+/); const out=[]; let line='';
  for (const word of words) { if (line && line.length + word.length + 1 > n) {out.push(line);line=word;} else line += `${line ? ' ' : ''}${word}`; }
  if (line) out.push(line); return out;
}
const multiline = (x,y,s,n,lh,attrs='') => lines(s,n).map((l,i)=>tx(x,y+i*lh,l,attrs)).join('');
const STYLE = `<style>.pish-diagram{font-family:'Golos Text',Arial,sans-serif;color:#252420}.pish-diagram text{fill:#252420}.pish-diagram .pish-muted{fill:#69675f}.pish-diagram .pish-small{font-size:11px}.pish-diagram .pish-node-box{fill:#fbf9f4;stroke:#d9d4c8;stroke-width:1.3}.pish-diagram .pish-node a:focus .pish-node-box,.pish-diagram .pish-node a:hover .pish-node-box{stroke:#2f6db5;stroke-width:2.5}.pish-diagram .pish-strong{fill:#e4efea;stroke:#2b7e75}.pish-diagram .pish-build{fill:#e8eef6;stroke:#2f6db5}.pish-diagram .pish-verify{fill:#f6e8df;stroke:#b4432d}.pish-diagram .pish-flow{fill:none;stroke:#8b877d;stroke-width:1.6}.pish-diagram .pish-feedback{fill:none;stroke:#2f6db5;stroke-width:2.5}.pish-diagram .pish-qualification{fill:none;stroke:#69675f;stroke-width:1.5;stroke-dasharray:5 4}.pish-diagram .pish-cohort-before{fill:#fbf9f4;stroke:#69675f;stroke-width:2}.pish-diagram .pish-cohort-after{fill:#2f6db5;stroke:#fbf9f4;stroke-width:2}.pish-diagram .pish-cohort-down{fill:#b4432d}.pish-diagram .pish-grid{stroke:#e6e1d6;stroke-width:1}.pish-diagram .pish-reference{stroke:#8b877d;stroke-dasharray:4 4}.pish-diagram .pish-row-link:hover text,.pish-diagram .pish-row-link:focus text{fill:#2f6db5}.pish-diagram .pish-connector{fill:none;stroke:#2f6db5;stroke-width:2}.pish-diagram .pish-connector-down{stroke:#b4432d}</style>`;

export function pishLoop(spec = {}, width = 1160, { standalone = false } = {}) {
  const {lang='ru',nodes=[]}=spec; const en=lang==='en';
  const w=Math.max(340,Number.isFinite(width)?Math.round(width):1160); const narrow=w<800;
  const l=24; const gap=narrow?20:14; const cardW=narrow?w-102:(w-l*2-gap*6)/7; const cardH=narrow?144:165;
  const top=narrow?96:92; const h=narrow?top+nodes.length*(cardH+gap)+114:466;
  const pos=nodes.map((n,i)=>({x:narrow?l:l+i*(cardW+gap),y:narrow?top+i*(cardH+gap):top}));
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram pish-loop-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(en?'Proposed smart-machine system':'Предлагаемая система умного станка')}"><title>${esc(en?'From cutting to an accepted part':'От обработки к годной детали')}</title><desc>${esc(en?'Seven steps in the proposed system. Measured wear informs permitted changes to cutting settings; an independent measurement checks the finished part. CNC control and AI run at different speeds. The system and its targets still need to be built and tested.':'Семь шагов предлагаемой системы. По измеренному износу станок меняет режим в разрешённых пределах; готовую деталь проверяют отдельным измерением. ЧПУ и ИИ работают с разной скоростью. Систему и её целевые показатели ещё нужно испытать.')}</desc>${standalone?STYLE:''}<defs><marker id="pish-arrow-${lang}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto-start-reverse"><path d="M0,0 L7,3.5 L0,7" fill="#8b877d"/></marker><marker id="pish-feedback-arrow-${lang}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7" fill="#2f6db5"/></marker></defs>`];
  out.push(tx(l,28,narrow?(en?'PROPOSED SMART-MACHINE SYSTEM':'ПРЕДЛАГАЕМАЯ СИСТЕМА УМНОГО СТАНКА'):(en?'PROPOSED TASK · DETECT WEAR, ADJUST SETTINGS, CHECK THE PART':'ПРЕДЛАГАЕМАЯ ЗАДАЧА · ЗАМЕТИТЬ ИЗНОС, ПОДОБРАТЬ РЕЖИМ, ПРОВЕРИТЬ ДЕТАЛЬ'),'font-size="12" font-weight="600" letter-spacing="1"'));
  if (!narrow) {
    out.push(tx(pos[1]?.x??l,59,en?'CNC control: 100 µs*':'ЧПУ: цикл 100 мкс*','font-size="12" font-weight="600"'));
    out.push(tx(pos[3]?.x??l,59,en?'Model response: ≤10 ms*':'Ответ модели: ≤10 мс*','font-size="12" font-weight="600"'));
    out.push(tx(l,77,en?'DIFFERENT CONTROL SPEEDS · *VALUES TO BE TESTED':'РАЗНЫЕ СКОРОСТИ УПРАВЛЕНИЯ · *ЦЕЛЕВЫЕ ЗНАЧЕНИЯ ДЛЯ ИСПЫТАНИЙ','class="pish-muted" font-size="10.5"'));
  } else {
    out.push(tx(l,54,en?'CNC 100 µs* · model ≤10 ms*':'ЧПУ 100 мкс* · модель ≤10 мс*','font-size="13" font-weight="600"'));
    out.push(tx(l,74,en?'Separate layers · *proposed target':'Разные уровни · *проектная цель','class="pish-muted" font-size="11"'));
  }
  for(let i=0;i<nodes.length;i++) {
    const n=nodes[i],p=pos[i]; const main=i<6; const titleLines=lines(n.label,narrow?27:15); const subY=p.y+48+titleLines.length*19;
    if(i<nodes.length-1&&main) {
      const next=pos[i+1];
      out.push(`<path class="${i===5?'pish-qualification':'pish-flow'}" d="${narrow?`M${p.x+cardW/2},${p.y+cardH} V${next.y-5}`:`M${p.x+cardW},${p.y+cardH/2} H${next.x-5}`}" marker-end="url(#pish-arrow-${lang})"/>`);
    }
    const status=n.status??'build';
    out.push(`<g class="pish-node"><a href="${esc(n.href??`#pish-node-${n.id}`)}" aria-label="${esc(`${String(i+1).padStart(2,'0')}. ${n.label}. ${n.subtitle??''}. ${n.statusLabel??''}`)}"><title>${esc(`${n.label}: ${n.subtitle??''}; ${n.statusLabel??''}`)}</title><rect x="${p.x}" y="${p.y}" width="${cardW}" height="${cardH}" rx="6" class="pish-node-box pish-${status}"/>`);
    out.push(tx(p.x+13,p.y+23,String(i+1).padStart(2,'0'),'font-size="11" font-weight="600" class="pish-muted"'));
    out.push(multiline(p.x+13,p.y+47,n.label,narrow?27:15,19,'font-size="15.5" font-weight="600"'));
    out.push(multiline(p.x+13,subY,n.subtitle,narrow?37:20,15,'font-size="11.5" class="pish-muted"'));
    out.push(multiline(p.x+13,p.y+cardH-24,n.statusLabel,narrow?35:21,13,'font-size="10.5" font-weight="600"'));
    out.push('</a></g>');
  }
  if(nodes.length>=7) {
    const cutting=pos[1],correction=pos[5],accepted=pos[6];
    if(narrow) {
      const bx=w-26;
      out.push(`<path class="pish-feedback" d="M${correction.x+cardW},${correction.y+cardH*.52} H${bx} V${cutting.y+cardH*.52} H${cutting.x+cardW+5}" marker-end="url(#pish-feedback-arrow-${lang})"/>`);
      out.push(`<text x="${bx-10}" y="${(cutting.y+correction.y)/2+cardH/2}" transform="rotate(-90 ${bx-10} ${(cutting.y+correction.y)/2+cardH/2})" font-size="12" fill="#2f6db5" text-anchor="middle">${esc(en?'New permitted settings → cutting':'Новый разрешённый режим → обработка')}</text>`);
      out.push(multiline(l,h-71,en?'Independent measurements check the finished part.':'Готовую деталь проверяют независимым измерением.',39,17,'font-size="12"'));
      out.push(multiline(l,h-33,en?'Select a step: who does it and how we test it.':'Нажмите шаг: кто делает и как проверяем.',43,15,'class="pish-muted" font-size="10.5"'));
    }else {
      const cy=correction.y+cardH,cx=correction.x+cardW/2,cutX=cutting.x+cardW/2,accX=accepted.x+cardW/2;
      out.push(`<path class="pish-feedback" d="M${cx},${cy} V305 Q${cx},319 ${cx-14},319 H${cutX+14} Q${cutX},319 ${cutX},305 V${cy+5}" marker-end="url(#pish-feedback-arrow-${lang})"/>`);
      out.push(tx((cx+cutX)/2,304,en?'CHANGE PERMITTED SETTINGS → MACHINE THE PART':'ИЗМЕНИТЬ РАЗРЕШЁННЫЙ РЕЖИМ → ОБРАБОТАТЬ ДЕТАЛЬ','font-size="12" font-weight="600" fill="#2f6db5" text-anchor="middle"'));
      out.push(`<path class="pish-qualification" d="M${cutX-17},${cy} V377 H${accX} V${cy+5}" marker-end="url(#pish-arrow-${lang})"/>`);
      out.push(tx((cutX+accX)/2,367,en?'INDEPENDENT METROLOGY · ACCEPTED PART / REJECTED PART':'НЕЗАВИСИМАЯ МЕТРОЛОГИЯ · ГОДНАЯ ДЕТАЛЬ / БРАК','class="pish-muted" font-size="11.5" text-anchor="middle"'));
      out.push(tx(l,415,en?'Before changing settings: check prediction reliability, permitted limits and part quality':'Перед сменой режима: проверить надёжность прогноза, разрешённые пределы и качество детали','font-size="12.5" font-weight="600"'));
      out.push(tx(l,445,en?'Select a step to see the research, target, responsible team and test.':'Нажмите шаг: исследования, цель, ответственные и способ проверки.','class="pish-muted" font-size="11.5"'));
    }
  }
  return out.join('')+'</svg>';
}

export function cohortsChart(spec = {}, width = 1160) {
  const {rows=[],lang='ru',period}=spec;const p1Label=(period?.p1??[2016,2020]).join('–');const p2Label=(period?.p2??[2021,2025]).join('–');const en=lang==='en'; const w=Math.max(360,Number.isFinite(width)?Math.round(width):1160); const narrow=w<750;
  const labelW=narrow?136:250; const right=narrow?31:116; const top=89; const rowH=narrow?69:57; const h=top+rows.length*rowH+71;
  const values=rows.flatMap(r=>[r.p1?.fwci,r.p2?.fwci]).filter(finite);
  const hi=Math.max(2,Math.ceil(Math.max(1,...values)*2)/2); const plotW=w-labelW-right; const X=v=>labelW+v/hi*plotW;
  const out=[`<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram pish-cohorts-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(en?'STANKIN citation impact by publication cohort':'Цитирование работ СТАНКИН по пятилетиям')}"><title>${esc(en?'Citation impact: 2016–2020 → 2021–2025':'Цитирование: 2016–2020 → 2021–2025')}</title><desc>${esc(en?'Each row compares mean FWCI for works published in 2016–2020 and 2021–2025. Hollow circles show the earlier years; filled circles show the later years. One is the world reference. Missing values are labelled. FWCI adjusts for year, type and field. Citation windows for recent works are still incomplete; the difference does not prove a change in research quality.':'В строке сравнивается средний FWCI работ 2016–2020 и 2021–2025 годов. Пустой круг — ранние годы, заполненный — поздние. Единица — мировой ориентир. Пропуски подписаны. FWCI учитывает год, тип и область. Окно цитирования новых работ ещё не завершено; разница не доказывает изменение качества исследований.')}</desc>`];
  out.push(tx(12,24,narrow?(en?'MEAN FWCI BY PUBLICATION YEARS':'СРЕДНИЙ FWCI ПО ГОДАМ РАБОТ'):(en?'MEAN FWCI · ONE SCALE FOR BOTH PERIODS':'СРЕДНИЙ FWCI · ОБЩАЯ ШКАЛА ДВУХ ПЯТИЛЕТИЙ'),'font-size="12" font-weight="600"'));
  out.push(`<circle cx="20" cy="49" r="5" class="pish-cohort-before"/>`,tx(32,53,'2016–2020','font-size="11.5"'),`<circle cx="153" cy="49" r="5" class="pish-cohort-after"/>`,tx(165,53,'2021–2025','font-size="11.5"'));
  if(!narrow) out.push(tx(w-10,53,en?'Citation change does not prove a change in quality':'Изменение цитирования не доказывает изменение качества','font-size="11" class="pish-muted" text-anchor="end"'));
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
    if(finite(a))out.push(`<circle cx="${X(a)}" cy="${y}" r="6" class="pish-cohort-before"/>`,tx(X(a),y-12,fmt(lang,a,3),'font-size="10.5" class="pish-muted" text-anchor="middle"'));
    if(finite(b))out.push(`<circle cx="${X(b)}" cy="${y}" r="6" class="pish-cohort-after${down?' pish-cohort-down':''}"/>`,tx(X(b),y+21,fmt(lang,b,3),'font-size="10.5" font-weight="600" text-anchor="middle"'));
    if(!finite(a)||!finite(b))out.push(tx(labelW+4,y+38,en?'No value for this period':'Нет данных за это пятилетие','font-size="10" class="pish-muted"'));
    if(!narrow)out.push(tx(w-10,y+3,`${fmt(lang,a,3)} → ${fmt(lang,b,3)}`,'font-size="12" font-weight="600" text-anchor="end"'));
    out.push(`</${r.href?'a':'g'}></g>`);
  });
  return (out.join('')+'</svg>').replaceAll('2016–2020',p1Label).replaceAll('2021–2025',p2Label);
}
