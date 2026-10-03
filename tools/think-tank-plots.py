#!/usr/bin/env python3
"""Offline Think Tank figures. All values and intervals come from checked site JSON."""
import argparse
import hashlib
import json
import math
import textwrap
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.ticker import MaxNLocator

BLUE, ORANGE, GRAY, INK = '#276ca7', '#bb6428', '#8a939a', '#24313b'
KEYS = ('institution', 'priorities', 'roadmap')

def finite(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)

def text(value, lang):
    return value.get(lang, '') if isinstance(value, dict) else str(value or '')

def say(lang, ru, en):
    return ru if lang == 'ru' else en

def wrap(value, width=45):
    return '\n'.join(textwrap.wrap(str(value), width=width, break_long_words=False, break_on_hyphens=False))

def number(value, lang, digits=1):
    if not finite(value):
        return '—'
    out = f'{value:,.{digits}f}' if value % 1 else f'{value:,.0f}'
    return out.replace(',', ' ').replace('.', ',') if lang == 'ru' else out

def validate(data):
    if data.get('schema') != 1 or not data.get('checks') or any(not c.get('passed') for c in data['checks']):
        raise ValueError('Think Tank numerical/provenance checks failed')
    if len(data.get('directions', [])) != 8:
        raise ValueError('Expected eight research directions')
    for item in data['institution']['indicators']:
        for obs in item['observations']:
            if obs['value'] is not None and (not finite(obs['value']) or not obs.get('sourceId') or not obs.get('page')):
                raise ValueError('Invalid institutional observation')
        if not item['comparable'] and item['comparison']['relative'] is not None:
            raise ValueError('Growth fabricated across a definition break')
    for row in data['directions']:
        if row['mappingStatus'] != 'reviewed' and row['pareto']['eligible']:
            raise ValueError('Adjacent mapping cannot enter Pareto comparison')

def heading(fig, title, subtitle, foot, lang):
    fig.suptitle(title, x=.065, y=.975, ha='left', fontsize=19, weight='bold', color=INK)
    fig.text(.065, .935, wrap(subtitle, 145), ha='left', va='top', fontsize=10, color='#53616c')
    fig.text(.065, .026, wrap(foot, 153), ha='left', va='bottom', fontsize=9, color='#53616c')

def institution(data, lang):
    items = data['institution']['indicators']
    rows = math.ceil(len(items)/3)
    fig = plt.figure(figsize=(16, 4.5*rows+2))
    grid = fig.add_gridspec(rows, 3, left=.075, right=.94, top=.87, bottom=.09,
                           wspace=.44, hspace=.36)
    source_years = {s['id']: s.get('publicationYear') for s in data['institution'].get('sources', [])}
    units = {'count': say(lang,'чел. / ед. — по определению показателя','people / items as defined'), 'million-rub': say(lang,'млн ₽, номинально','RUB million, nominal'), 'percent':'%', 'm2':'м²'}
    for index, item in enumerate(items):
        panel = grid[index//3, index%3].subgridspec(2, 1, height_ratios=[3, 1.2], hspace=.62)
        ax = fig.add_subplot(panel[0])
        notes = fig.add_subplot(panel[1]); notes.set_axis_off()
        c = item['comparison']; selected = [next((o for o in item['observations'] if o['year']==year), {'year':year,'value':None}) for year in (c['fromYear'],c['toYear'])]
        vals = [o['value'] for o in selected]; maxval = max([v for v in vals if finite(v)] or [1])
        ax.set_title(wrap(text(item['name'],lang),33), loc='left', fontsize=11, weight='bold', pad=12)
        for y, obs in enumerate(selected):
            value = obs['value']; color = GRAY if y==0 else BLUE
            if finite(value):
                ax.barh(y,value,height=.42,color=color,alpha=.87)
                ax.text(value+maxval*.035,y,number(value,lang),va='center',fontsize=10)
            else:
                ax.text(maxval*.03,y,say(lang,'Нет данных','Not available'),va='center',fontsize=9,color=GRAY)
        ax.set_yticks([0,1],[str(o['year']) for o in selected]); ax.set_ylim(1.45,-.45)
        ax.set_xlim(0,maxval*1.4); ax.xaxis.set_major_locator(MaxNLocator(3)); ax.tick_params(labelsize=8)
        ax.set_xlabel(units.get(item['unit'],item['unit']),fontsize=8,color=GRAY)
        status = c['status']
        if status=='comparable':
            delta = f"{number(c['percentagePoints'],lang)} п.п." if item['unit']=='percent' and lang=='ru' else (f"{number(c['percentagePoints'],lang)} pp" if item['unit']=='percent' else f"{number(100*c['relative'],lang)}%")
            note = say(lang,'Изменение: ','Change: ')+delta
        elif status=='zero-base': note=say(lang,'Нулевая база: относительный рост не определён','Zero baseline: relative growth undefined')
        elif status=='not-comparable': note=say(lang,'Разрыв определения — рост не рассчитывается','Definition break — growth not calculated')
        else: note=say(lang,'Сравнение не рассчитано','Comparison unavailable')
        pages = []
        for o in selected:
            if not finite(o['value']): continue
            year = source_years.get(o.get('sourceId'))
            source_label = say(lang, f'отчёт {year}', f'{year} report') if year else o.get('sourceId', '—')
            pages.append(f"{o['year']}: {source_label}, {say(lang, 'с.', 'p.')} {o.get('page','—')}")
        notes.text(0,1,wrap(note,46)+'\n'+wrap('; '.join(pages),49),transform=notes.transAxes,
                   fontsize=8,va='top',color=ORANGE if status!='comparable' else INK)
        ax.spines[['top','right','left']].set_visible(False); ax.grid(axis='x',alpha=.12); ax.set_axisbelow(True)
    heading(fig,say(lang,'СТАНКИН: что изменилось за пять лет','STANKIN: five years of institutional change'),say(lang,'Отчётные показатели университета. Годы относятся к наблюдениям; учебные годы отмечены отдельно на сайте.','Institutional reported values. Years refer to observations; academic-year definitions are specified on the site.'),say(lang,'Источники и определения: /think-tank/. Нет статистических интервалов: это административные отчёты, а не выборочное обследование.','Sources and definitions: /en/think-tank/. No statistical intervals: these are administrative reports, not sample estimates.'),lang)
    return fig

def priorities(data,lang):
    fig,ax=plt.subplots(figsize=(15,9));fig.subplots_adjust(left=.1,right=.96,top=.84,bottom=.28)
    omitted=[]; limited=[]; labels={}
    for i,row in enumerate(data['directions']):
        c=row['evidence']['cohorts']['p2']; x=row['evidence']['worldShareChange']; y=c['fwci']
        if not finite(x) or not finite(y): omitted.append(f"{i+1:02d} {text(row['short'],lang)}"); continue
        x*=100; checked=row['mappingStatus']=='reviewed'; color=BLUE if checked else ORANGE
        ci=c.get('fwciCI95') or {}; lo,hi=ci.get('lower'),ci.get('upper')
        if finite(lo) and finite(hi): ax.vlines(x,lo,hi,color=color,lw=1.2,alpha=.8)
        else: limited.append(f"{i+1:02d} (FWCI n={c.get('fwciN', c['n'])})")
        ax.scatter([x],[y],s=45+9*math.sqrt(c['n']),facecolors=color if checked else 'none',edgecolors=color,linewidths=1.6,marker='o' if checked else 's',zorder=3,clip_on=False)
        # A shared corpus is one visible position, not two independent results.
        key=(x,y,tuple(sorted(c.get('workIds', []))))
        labels.setdefault(key,[]).append((i,row,c['n']))
    for (x,y,_), group in labels.items():
        if len(group)>1:
            ids=' / '.join(f'{i+1:02d}' for i,_,_ in group)
            names=' / '.join(text(row['short'],lang) for _,row,_ in group)
            label=f"{ids} {names}\n{say(lang,'Общая выборка','Shared corpus')}, n={group[0][2]}"
            offset=(8,-30)
        else:
            i,row,n=group[0]
            label=f"{i+1:02d} {text(row['short'],lang)} · n={n}"
            offset=(7,11 if y==0 or i%2==0 else -19)
        annotation='\n'.join(wrap(line,40) for line in label.splitlines())
        ax.annotate(annotation,(x,y),xytext=offset,textcoords='offset points',fontsize=9)
    ax.axvline(0,color=GRAY,ls='--',lw=1);ax.axhline(1,color=GRAY,ls='--',lw=1)
    ax.set_xlabel(say(lang,'Изменение мировой доли темы, % · 2021–2025 / 2016–2020','Change in the topic share of world science, % · 2021–2025 / 2016–2020'))
    ax.set_ylabel(say(lang,'Средний FWCI · 2021–2025','Mean FWCI · 2021–2025'))
    ax.margins(x=.22,y=.24)
    _, upper=ax.get_ylim();ax.set_ylim(bottom=-.055*upper)
    ax.set_yticks([tick for tick in ax.get_yticks() if tick>=0 and tick<=upper])
    ax.grid(alpha=.15);ax.spines[['top','right']].set_visible(False)
    ax.legend(handles=[Line2D([0],[0],marker='o',color=BLUE,ls='',label=say(lang,'Проверенная тематическая граница','Reviewed topic scope')),Line2D([0],[0],marker='s',markerfacecolor='white',color=ORANGE,ls='',label=say(lang,'Смежная публикационная область','Adjacent publication field'))],loc='upper right',fontsize=9)
    front=', '.join(text(r['short'],lang) for r in data['directions'] if r['pareto']['front']) or say(lang,'недостаточно данных','insufficient data')
    fig.text(.1,.18,wrap(say(lang,'Парето по трём показателям: ','Three-dimensional Pareto set: ')+front,145),fontsize=9,color=INK)
    if limited:fig.text(.1,.135,wrap(say(lang,'При числе значений FWCI<20 интервал не строится: ','No interval for fewer than 20 observed FWCI values: ')+', '.join(limited),145),fontsize=8,color=GRAY)
    if omitted:fig.text(.1,.09,wrap(say(lang,'Без численной позиции: ','No numerical position: ')+', '.join(omitted),145),fontsize=8,color=GRAY)
    heading(fig,say(lang,'Мировое движение и научное влияние СТАНКИН','World research shifts and STANKIN citation impact'),say(lang,'Площадь маркера зависит от числа работ. Вертикальные отрезки — условные 95% bootstrap-интервалы среднего FWCI.','Marker area depends on publication count. Vertical lines are conditional 95% bootstrap intervals for mean FWCI.'),say(lang,'Парето использует FWCI без максимальной работы, долю top-10% и мировую динамику. Это не граница на этой двумерной картинке и не мировой рейтинг.','Pareto uses mean FWCI without the highest work, top-10% share and world dynamics. It is not a frontier on this two-dimensional plot or a world ranking.'),lang)
    return fig

def roadmap(data,lang):
    fig,ax=plt.subplots(figsize=(19,15));ax.set_axis_off();fig.subplots_adjust(left=.045,right=.97,top=.9,bottom=.08)
    rows=data['directions']; ax.set_xlim(0,1);ax.set_ylim(0,len(rows)+.75)
    for x,label_ in [(.015,say(lang,'Научное направление','Research direction')),(.245,'2030'),(.63,'2036')]:ax.text(x,len(rows)+.45,label_,fontsize=14,weight='bold',color=INK)
    for i,row in enumerate(rows):
        y=len(rows)-i
        ax.axhspan(y-.8,y+.05,color='#f1f4f6' if i%2==0 else '#ffffff')
        ax.text(.015,y-.1,wrap(f"{i+1:02d} {text(row['short'],lang)}",25),va='top',fontsize=11,weight='bold',color=BLUE)
        ax.text(.245,y-.1,wrap(text(row['horizon2030'],lang),65),va='top',fontsize=10,color=INK)
        ax.text(.63,y-.1,wrap(text(row['horizon2036'],lang),65),va='top',fontsize=10,color=INK)
    heading(fig,say(lang,'2030 → 2036: какие научные результаты проверять','2030 → 2036: research results to test'),say(lang,'Предложения Think Tank для восьми направлений. Продолжение зависит от результатов предыдущего этапа.','Think Tank proposals across eight directions. Later stages depend on evidence from earlier work.'),say(lang,'Авторская исследовательская повестка. Не утверждённые показатели университета, не прогноз и не обещание научного лидерства.','An editorial research agenda. Not approved institutional targets, a forecast, or a promise of research leadership.'),lang)
    return fig

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data',type=Path,required=True);p.add_argument('--out',type=Path,required=True);args=p.parse_args()
    data=json.loads(args.data.read_text());validate(data)
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11,'svg.fonttype':'path','pdf.fonttype':42,'svg.hashsalt':'stankin-think-tank-v1','axes.labelcolor':INK,'text.color':INK,'axes.spines.top':False,'axes.spines.right':False})
    args.out.mkdir(parents=True,exist_ok=True)
    manifest={'schema':1,'totalWorks':data['totalWorks'],'fetchedAt':data['fetchedAt'],'asOf':data['asOf'],'inputs':{'data':{'sha256':sha(args.data)},'generator':{'sha256':sha(Path(__file__))}},'versions':{'matplotlib':matplotlib.__version__},'files':[]}
    for key,fn in zip(KEYS,(institution,priorities,roadmap)):
        for lang in ('ru','en'):
            fig=fn(data,lang)
            for ext in ('svg','pdf','png'):
                path=args.out/f'{key}-{lang}.{ext}'
                metadata={'Creator':'STANKIN Think Tank'}
                if ext=='svg':metadata['Date']=None
                if ext=='pdf':metadata.update({'CreationDate':None,'ModDate':None})
                fig.savefig(path,dpi=180,facecolor='white',metadata=metadata)
                manifest['files'].append({'name':path.name,'bytes':path.stat().st_size,'sha256':sha(path)})
            plt.close(fig)
    (args.out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(f'Think Tank: {len(manifest["files"])} scientific figure files from {data["totalWorks"]} works')

if __name__=='__main__':main()
