// Scientific agenda diagrams: links are proposed research relationships,
// not measured co-authorship, secured cooperation or a technology demonstration.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text = (x,y,value,attrs='') => `<text x="${x}" y="${y}" ${attrs}>${esc(value)}</text>`;
function wrap(value,limit) {
  const lines=[]; let line='';
  for(const word of String(value ?? '').split(/\s+/)) {
    if(line && line.length+word.length+1>limit) {lines.push(line);line=word;} else line+=(line?' ':'')+word;
  }
  if(line) lines.push(line);return lines;
}
const multi=(x,y,value,limit,lineHeight,attrs='')=>wrap(value,limit).map((line,i)=>text(x,y+i*lineHeight,line,attrs)).join('');
const style=`<style>.pish-diagram{font-family:'Golos Text',Arial,sans-serif}.pish-diagram text{fill:#252420}.pish-muted{fill:#69675f!important}.pish-node-box{fill:#fbf9f4;stroke:#d9d4c8;stroke-width:1.2}.pish-strong{fill:#e4efea;stroke:#2b7e75}.pish-build{fill:#e8eef6;stroke:#2f6db5}.pish-verify{fill:#f6e8df;stroke:#b4432d}.pish-flow{fill:none;stroke:#8b877d;stroke-width:1.6}.pish-feedback{fill:none;stroke:#2f6db5;stroke-width:2}.pish-node a:hover rect{stroke:#2f6db5;stroke-width:2}</style>`;
const color=status=>status==='base'?'strong':status==='partner'||status==='verify'?'verify':'build';
const badge=(status,en)=>({base:en?'Related publications':'Есть работы по теме',develop:en?'Develop the method':'Разработать метод',partner:en?'Partner required':'Нужен партнёр',verify:en?'Check papers and data':'Проверить статьи и данные'}[status] ?? (en?'Research question':'Научный вопрос'));
function svgStart(w,h,label,desc,standalone) {
  return `<svg xmlns="http://www.w3.org/2000/svg" class="chart-svg pish-diagram" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><desc>${esc(desc)}</desc>${standalone?style:''}`;
}

export function pishTopicTree(spec={},width=1160,{standalone=false}={}) {
  const en=spec.lang==='en',families=spec.families??[],w=Math.max(340,Number.isFinite(width)?Math.round(width):1160),narrow=w<900;
  const gap=12,pad=22,fw=narrow?w-2*pad:(w-2*pad-gap*Math.max(0,families.length-1))/Math.max(1,families.length);
  const familyHeight=134,cardHeight=88,rowHeight=familyHeight+3*(cardHeight+12)+40;
  const h=narrow?150+families.length*rowHeight+65:660;
  const out=[svgStart(w,h,en?'Research agenda: five families, fifteen questions':'Научная повестка: пять семейств, пятнадцать вопросов',en?'Proposed questions connect existing research with selected world themes. Connections are hypotheses, not measured scientific networks. Select a question for evidence and limitations.':'Предлагаемые вопросы связывают имеющиеся исследования и выбранные мировые темы. Связи — гипотезы повестки, а не измеренная научная сеть. Нажмите вопрос, чтобы открыть данные и ограничения.',standalone)];
  const rootW=narrow?w-2*pad:Math.min(720,w-2*pad),rootX=(w-rootW)/2;
  out.push(`<rect x="${rootX}" y="16" width="${rootW}" height="94" rx="6" class="pish-node-box pish-build"/>`);
  out.push(multi(rootX+16,42,spec.root?.label??(en?'Intelligent precision machining':'Интеллектуальная точная обработка'),narrow?30:70,20,'font-size="17" font-weight="600"'));
  out.push(multi(rootX+16,narrow?78:72,spec.root?.question,narrow?40:90,15,'font-size="11.5" class="pish-muted"'));
  if(!narrow&&families.length)out.push(`<path class="pish-feedback" d="M${w/2},110 V135 M${pad+fw/2},135 H${w-pad-fw/2}"/>`);
  families.forEach((family,i)=>{
    const x=narrow?pad:pad+i*(fw+gap),y=narrow?148+i*rowHeight:160;
    if(!narrow)out.push(`<path class="pish-feedback" d="M${x+fw/2},135 V${y}"/>`);
    out.push(`<g class="pish-node"><rect x="${x}" y="${y}" width="${fw}" height="${familyHeight}" rx="5" class="pish-node-box pish-${color(family.status)}"/>`);
    out.push(text(x+12,y+20,String(i+1).padStart(2,'0'),'font-size="10.5" class="pish-muted"'));
    out.push(multi(x+12,y+42,family.label,narrow?38:23,17,'font-size="14" font-weight="600"'));
    out.push(multi(x+12,y+familyHeight-29,family.metric,narrow?46:29,13,'font-size="10" class="pish-muted"'));
    out.push('</g>');
    (family.subtopics??[]).forEach((topic,j)=>{
      const cy=y+familyHeight+16+j*(cardHeight+12);
      out.push(`<path class="pish-flow" d="M${x+fw/2},${j===0?y+familyHeight:cy-12} V${cy}"/>`);
      out.push(`<g class="pish-node"><a href="${esc(topic.href??'#')}" aria-label="${esc(topic.label+': '+topic.question)}"><title>${esc(topic.question)}</title><rect x="${x+7}" y="${cy}" width="${fw-14}" height="${cardHeight}" rx="5" class="pish-node-box pish-${color(topic.status)}"/>`);
      out.push(multi(x+18,cy+25,topic.label,narrow?36:22,17,'font-size="13" font-weight="500"'));
      out.push(text(x+18,cy+cardHeight-13,badge(topic.status,en),'font-size="9" class="pish-muted"'));
      out.push('</a></g>');
    });
  });
  out.push(multi(pad,h-40,en?'Select a question → why it matters, related papers, world signals, missing evidence.':'Нажмите вопрос → почему он нужен, связанные работы, мировой сигнал, чего пока не хватает.',narrow?43:140,16,'font-size="11" class="pish-muted"'));
  out.push('</svg>');return out.join('');
}

export function pishResearchPaths(spec={},width=1160,{standalone=false}={}) {
  const en=spec.lang==='en',paths=spec.paths??[],w=Math.max(340,Number.isFinite(width)?Math.round(width):1160),narrow=w<900;
  const pad=22,gap=13,cw=narrow?w-2*pad:(w-2*pad-gap*3)/4,ch=narrow?113:150;
  const rowH=narrow?4*(ch+18)+43:ch+26,h=72+paths.length*rowH+65;
  const headings=en?['STANKIN research','World signal','A specific question','Proposed decision']:['Исследования СТАНКИН','Мировой сигнал','Конкретный вопрос','Предлагаемое решение'];
  const out=[svgStart(w,h,en?'From evidence to the choice of research questions':'От данных к выбору научных вопросов',en?'Four evidence steps for each proposed path. World publication trends do not establish market demand or technology readiness. Arrows describe proposed research choices.':'Четыре шага обоснования каждого предлагаемого пути. Рост публикаций не доказывает спрос рынка или готовность технологии. Стрелки показывают предлагаемые исследовательские связи.',standalone)];
  out.push(multi(pad,25,en?'WHY THESE QUESTIONS · EVIDENCE → WORLD CHANGE → SCIENTIFIC GAP → CHOICE':'ПОЧЕМУ ЭТИ ВОПРОСЫ · ДАННЫЕ → МИРОВОЙ СДВИГ → НАУЧНЫЙ РАЗРЫВ → ВЫБОР',narrow?36:130,16,'font-size="11.5" font-weight="600"'));
  paths.forEach((path,i)=>{
    const cells=[path.base,path.world,path.question,path.decision];
    cells.forEach((body,j)=>{
      const x=narrow?pad:pad+j*(cw+gap),y=72+i*rowH+(narrow?j*(ch+18):0),cls=j===0?'strong':j===3?'build':'verify';
      if(j<3)out.push(`<path class="pish-flow" d="${narrow?`M${x+cw/2},${y+ch} V${y+ch+18}`:`M${x+cw},${y+ch/2} H${x+cw+gap}`}"/>`);
      out.push(`<g class="pish-node">${j===2?`<a href="${esc(path.href??'#')}" aria-label="${esc(body)}">`:''}<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="5" class="pish-node-box pish-${cls}"/>`);
      out.push(text(x+12,y+21,`${i+1}.${j+1} · ${headings[j]}`,'font-size="10" class="pish-muted"'));
      out.push(multi(x+12,y+46,body,narrow?40:31,18,'font-size="12.5" font-weight="500"'));
      if(j===2)out.push('</a>');out.push('</g>');
    });
  });
  out.push(multi(pad,h-39,en?'A rising world theme is a signal to investigate. Novelty, people and a customer remain separate checks.':'Подъём мировой темы — повод проверить научную задачу. Новизна, исполнители и заказчик проверяются отдельно.',narrow?42:130,16,'font-size="11" class="pish-muted"'));
  out.push('</svg>');return out.join('');
}
