#!/usr/bin/env python3
"""Rebuild publication figures from the site's exported, audited JSON.

No network, query, fitted model or synthetic observations are used here.
The bootstrap and Wilson calculations are read from pish.json, not repeated.
Labels and links in the research agenda are editorial proposals, not measured
collaboration links or technology-readiness scores.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import math
from pathlib import Path
import sys
import textwrap
from datetime import datetime, timezone

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
from matplotlib.patches import Rectangle
from matplotlib.ticker import FuncFormatter, MaxNLocator
from matplotlib.font_manager import FontProperties

COLORS = {"blue": "#2472b2", "orange": "#c86b21", "gray": "#747979",
          "ink": "#232c35", "muted": "#53616c", "cream": "#f5f1e8",
          "grid": "#dfe3e4", "white": "#ffffff", "purple": "#71679a"}
LANGS = ("ru", "en")
PLOT_KEYS = ("forest-all-fields", "world-topics", "research-bridges")


def say(lang, ru, en):
    return en if lang == "en" else ru


def label(value, lang):
    if isinstance(value, dict):
        return str(value.get(lang) or value.get("en") or value.get("ru") or "")
    return str(value or "")


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def number(value, lang, digits=2, signed=False):
    if not finite(value):
        return "—"
    result = f"{value:+.{digits}f}" if signed else f"{value:.{digits}f}"
    if lang == "ru":
        result = result.replace(".", ",")
    return result.replace("-", "−")


def integer(value, lang):
    if not finite(value):
        return "—"
    return f"{int(value):,}".replace(",", "\u202f" if lang == "ru" else ",")


def percentage(value, lang, digits=1, signed=False):
    return number(value * 100, lang, digits, signed) + "%" if finite(value) else "—"


def wrap(value, width=44):
    return "\n".join(textwrap.wrap(str(value), width=width, break_long_words=False,
                                    break_on_hyphens=False))


def period_text(period, which):
    return "–".join(str(v) for v in period[which])


def read_json(path):
    def bad_constant(value):
        raise ValueError(f"Non-finite JSON value: {value}")
    def unique_keys(pairs):
        value = {}
        for key, item in pairs:
            if key in value:
                raise ValueError(f"Duplicate JSON key: {key}")
            value[key] = item
        return value
    data = json.loads(path.read_text(encoding="utf-8"), parse_constant=bad_constant,
                      object_pairs_hook=unique_keys)
    if not isinstance(data, dict):
        raise ValueError(f"Expected a JSON object: {path}")
    return data


def require_count(value, field, nullable=True):
    if value is None and nullable:
        return
    if not finite(value) or int(value) != value or value < 0:
        raise ValueError(f"Invalid count {field}: {value!r}")


def require_number(value, field, nonnegative=False):
    if value is None:
        return
    if not finite(value) or (nonnegative and value < 0):
        raise ValueError(f"Invalid number {field}: {value!r}")


def validate_interval(ci, field):
    if ci is None:
        return
    if not isinstance(ci, dict):
        raise ValueError(f"Invalid interval {field}")
    lower, upper = ci.get("lower"), ci.get("upper")
    if (lower is None) != (upper is None):
        raise ValueError(f"Incomplete bounds for {field}")
    if lower is not None and (not finite(lower) or not finite(upper) or lower > upper):
        raise ValueError(f"Invalid bounds for {field}")


def validate(data, metrics):
    period = data.get("period")
    if not isinstance(period, dict):
        raise ValueError("Missing PISH period")
    for key in ("p1", "p2"):
        limits = period.get(key)
        if (not isinstance(limits, list) or len(limits) != 2
                or not all(isinstance(v, int) and not isinstance(v, bool) for v in limits)
                or limits[0] > limits[1]):
            raise ValueError(f"Invalid cohort period {key}")
    if metrics.get("meta", {}).get("period") != period:
        raise ValueError("PISH and metrics exports have different periods")
    if metrics.get("meta", {}).get("fetchedAt") != data.get("fetchedAt"):
        raise ValueError("PISH and metrics exports have different snapshot dates")
    require_count(data.get("totalWorks"), "totalWorks", nullable=False)
    require_count(data.get("excludedWorks"), "excludedWorks")
    if metrics.get("totals", {}).get("n") != data["totalWorks"]:
        raise ValueError("PISH and metrics publication totals disagree")
    audit = data.get("mathAudit", {})
    for check in audit.get("checks", []) + audit.get("topicChecks", []):
        if not isinstance(check, dict) or check.get("passed") is not True:
            raise ValueError(f"Failed source audit check: {check}")
    rows = data.get("rows")
    if not isinstance(rows, list):
        raise ValueError("PISH rows must be a list")
    ids = set()
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("id"), str) or row["id"] in ids:
            raise ValueError("Each field needs a unique string ID")
        ids.add(row["id"])
        require_count(row.get("n"), f"{row['id']}.n")
        require_number(row.get("worldShareChange"), f"{row['id']}.worldShareChange")
        for key in ("p1", "p2"):
            cohort = row.get("cohorts", {}).get(key)
            if not isinstance(cohort, dict):
                raise ValueError(f"Missing cohort {row['id']}.{key}")
            for count in ("n", "fwciN", "pctN"):
                require_count(cohort.get(count), f"{row['id']}.{key}.{count}")
            for metric in ("fwci", "fwciMedian"):
                require_number(cohort.get(metric), f"{row['id']}.{key}.{metric}", True)
            for ci in ("fwciCI95", "top10CI95"):
                validate_interval(cohort.get(ci), f"{row['id']}.{key}.{ci}")
        validate_interval(row.get("fwciDifferenceCI95"), f"{row['id']}.difference")
    topics = data.get("topicEvidence")
    if not isinstance(topics, list):
        raise ValueError("topicEvidence must be a list")
    topic_ids = set()
    for topic in topics:
        if not isinstance(topic, dict) or not isinstance(topic.get("id"), str) or topic["id"] in topic_ids:
            raise ValueError("Each topic needs a unique string ID")
        topic_ids.add(topic["id"])
        for key in ("n", "nP1", "nP2", "worldP1", "worldP2"):
            require_count(topic.get(key), f"{topic['id']}.{key}")
        require_number(topic.get("worldShareChange"), f"{topic['id']}.worldShareChange")
    families = data.get("agenda", {}).get("families")
    if not isinstance(families, list):
        raise ValueError("agenda.families must be a list")
    question_ids = set()
    for family in families:
        if not isinstance(family, dict) or not isinstance(family.get("subtopics"), list):
            raise ValueError("Each research family needs its subtopic list")
        for question in family["subtopics"]:
            if question.get("id") in question_ids:
                raise ValueError("Repeated research-question ID")
            question_ids.add(question.get("id"))
            if not set(question.get("competencyIds", [])).issubset(ids):
                raise ValueError(f"Unknown competency link in {question.get('id')}")
            if not set(question.get("topicIds", [])).issubset(topic_ids):
                raise ValueError(f"Unknown topic link in {question.get('id')}")


def configure_style():
    used = ["default"]
    try:
        import scienceplots  # noqa: F401: registers Matplotlib styles
        plt.style.use(["science", "no-latex", "bright"])
        used = ["science", "no-latex", "bright"]
    except ImportError:
        plt.style.use("default")
    plt.rcParams.update({
        "font.family": "DejaVu Sans", "font.size": 10.5,
        "axes.titlesize": 12, "axes.labelsize": 11,
        "xtick.labelsize": 10, "ytick.labelsize": 10.5,
        "legend.fontsize": 10, "figure.titlesize": 20,
        "text.usetex": False, "mathtext.fontset": "dejavusans",
        "figure.facecolor": COLORS["white"], "axes.facecolor": COLORS["white"],
        "axes.edgecolor": COLORS["grid"], "axes.labelcolor": COLORS["muted"],
        "text.color": COLORS["ink"], "xtick.color": COLORS["muted"],
        "ytick.color": COLORS["ink"], "axes.spines.top": False,
        "axes.spines.right": False, "axes.spines.left": False,
        "axes.linewidth": 0.6, "grid.color": COLORS["grid"],
        "grid.linewidth": 0.5, "savefig.dpi": 220,
        "xtick.top": False, "ytick.right": False,
        "xtick.minor.visible": False, "ytick.minor.visible": False,
        "svg.fonttype": "path", "svg.hashsalt": "stankin-science-pish-v1",
        "pdf.fonttype": 42, "ps.fonttype": 42,
    })
    return used


def field_name(metrics, row, lang):
    names = metrics.get("competencyNames", {})
    return label(names.get(row["id"]) or row.get("name") or row["id"], lang)


def footer(fig, data, metrics, lang, caveat, y=0.025):
    demo = metrics.get("meta", {}).get("demo") is True
    head = say(lang, "ДЕМО · синтетические данные. ", "DEMO · synthetic data. ") if demo else ""
    source = say(lang, "OpenAlex · снимок", "OpenAlex · snapshot")
    date = str(data.get("fetchedAt") or "—")[:10]
    count = integer(data.get("totalWorks"), lang)
    words = say(lang, "работ после аудита аффилиаций", "works after the affiliation audit")
    fig.text(0.025, y, head + f"{source} {date} · {count} {words}\n" + caveat,
             fontsize=10, color=COLORS["muted"], va="bottom", linespacing=1.4)
    if demo:
        fig.text(0.975, 0.967, "DEMO", ha="right", va="top", fontsize=17,
                 weight="bold", color=COLORS["orange"])


def base_title(fig, title, subtitle):
    fig.text(0.025, 0.963, title, fontsize=20, fontweight="bold", va="top")
    fig.text(0.025, 0.925, subtitle, fontsize=10.5, color=COLORS["muted"], va="top")


def plot_interval(ax, estimate, ci, y, color, marker, filled=True):
    if not finite(estimate):
        return False
    available = (isinstance(ci, dict) and finite(ci.get("lower"))
                 and finite(ci.get("upper")) and ci.get("status") == "ok")
    tone = color if available else COLORS["gray"]
    if available:
        ax.hlines(y, ci["lower"], ci["upper"], color=tone, lw=1.5, zorder=2)
        ax.vlines([ci["lower"], ci["upper"]], y - 0.065, y + 0.065,
                  color=tone, lw=1.0, zorder=2)
    ax.plot(estimate, y, marker, ms=6.5, markeredgewidth=1.25,
            markeredgecolor=tone, markerfacecolor=tone if filled else COLORS["white"],
            linestyle="none", zorder=4)
    return True


def forest_all_fields(data, metrics, lang):
    rows = data["rows"]
    n = len(rows)
    fig = plt.figure(figsize=(16, max(10.7, n * 0.46 + 3)))
    grid = fig.add_gridspec(1, 3, left=0.285, right=0.985, bottom=0.15, top=0.79,
                           wspace=0.22, width_ratios=[4.0, 3.1, 3.0])
    mean_ax = fig.add_subplot(grid[0, 0])
    difference_ax = fig.add_subplot(grid[0, 1], sharey=mean_ax)
    detail_ax = fig.add_subplot(grid[0, 2], sharey=mean_ax)
    title = say(lang, "Все направления СТАНКИН: как изменилось цитирование",
                "Every STANKIN field: how citation impact changed")
    p1, p2 = period_text(data["period"], "p1"), period_text(data["period"], "p2")
    base_title(fig, title, say(lang,
        f"Все {n} настроенных групп, включая малые и смешанные. Средние FWCI и 95% интервалы взяты из опубликованного расчёта.",
        f"All {n} configured groups, including small and mixed fields. Mean FWCI and 95% intervals come from the published calculation."))
    mean_ax.set_title(say(lang, "Средний FWCI\nв двух пятилетиях", "Mean FWCI\nin the two periods"), loc="left", pad=16, fontsize=11)
    difference_ax.set_title(say(lang, "Разница средних\nновое − раннее", "Mean difference\nrecent − earlier"), loc="left", pad=16, fontsize=11)
    detail_ax.set_title(say(lang, "Медиана и влияние\nотдельных работ", "Median and\ninfluential works"), loc="left", pad=16, fontsize=11)
    ymax = max(1, n)
    for ax in (mean_ax, difference_ax, detail_ax):
        ax.set_ylim(-0.6, ymax - 0.4)
        for y in range(ymax):
            if y % 2 == 0:
                ax.axhspan(y - 0.47, y + 0.47, color=COLORS["cream"], zorder=0)
        ax.tick_params(axis="y", length=0)
    mean_ax.axvline(1, lw=1.1, color=COLORS["gray"], ls=(0, (4, 3)))
    difference_ax.axvline(0, lw=1.1, color=COLORS["gray"], ls=(0, (4, 3)))
    mean_values, difference_values = [0, 1], [0]
    for i, row in enumerate(rows):
        y = n - i - 1
        early, recent = row["cohorts"]["p1"], row["cohorts"]["p2"]
        for cohort, offset, color, marker, filled in (
                (early, 0.14, COLORS["orange"], "o", False),
                (recent, -0.14, COLORS["blue"], "D", True)):
            plot_interval(mean_ax, cohort.get("fwci"), cohort.get("fwciCI95"), y + offset,
                          color, marker, filled)
            if finite(cohort.get("fwci")):
                mean_values.append(cohort["fwci"])
            bounds = cohort.get("fwciCI95") or {}
            mean_values += [bounds[k] for k in ("lower", "upper") if finite(bounds.get(k))]
        ci = row.get("fwciDifferenceCI95") or {}
        estimate = ci.get("estimate")
        plot_interval(difference_ax, estimate, ci, y, COLORS["blue"], "o")
        difference_values += [ci[k] for k in ("estimate", "lower", "upper") if finite(ci.get(k))]
        if not finite(early.get("fwci")) and not finite(recent.get("fwci")):
            mean_ax.text(0.02, y, say(lang, "Нет FWCI", "FWCI unavailable"), fontsize=10, va="center")
        if not finite(estimate):
            difference_ax.text(0.02, y, "—", fontsize=10, va="center")
        influence = row.get("influence") or {}
        top3 = influence.get("top3") or {}
        without = influence.get("withoutMax") or {}
        median = f"{number(early.get('fwciMedian'), lang)} → {number(recent.get('fwciMedian'), lang)}"
        counts = f"n {integer(early.get('n'), lang)} → {integer(recent.get('n'), lang)}"
        details = (f"{counts}   ·   {say(lang, 'мед.', 'med.')} {median}\n"
                   f"{say(lang, 'FWCI без max', 'FWCI − max')} {number(without.get('fwci'), lang)}"
                   f"   ·   top 3 {percentage(top3.get('shareOfFwciSum'), lang)}")
        detail_ax.text(0.015, y, details, fontsize=10, va="center", linespacing=1.55)
    mean_ax.set_yticks(range(n), [wrap(field_name(metrics, row, lang), 39) for row in reversed(rows)])
    difference_ax.tick_params(labelleft=False)
    detail_ax.tick_params(labelleft=False, bottom=False, labelbottom=False)
    mean_ax.set_xlim(-0.03, max(mean_values) * 1.08 + 0.12)
    dl, du = min(difference_values), max(difference_values)
    span = max(0.6, du - dl)
    difference_ax.set_xlim(dl - span * 0.1, du + span * 0.1)
    detail_ax.set_xlim(0, 1)
    for ax in (mean_ax, difference_ax):
        ax.xaxis.set_major_locator(MaxNLocator(5))
        ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: number(x, lang, 1)))
        ax.grid(axis="x", alpha=0.55)
    mean_ax.set_xlabel(say(lang, "FWCI · 1 = мировой ориентир", "FWCI · 1 = world reference"))
    difference_ax.set_xlabel("Δ FWCI")
    legend = [Line2D([], [], color=COLORS["orange"], marker="o", mfc="white", ls="none", label=p1),
              Line2D([], [], color=COLORS["blue"], marker="D", ls="none", label=p2),
              Line2D([], [], color=COLORS["gray"], marker="o", ls="none", label=say(lang, "Малая выборка / интервал не построен", "Small sample / interval unavailable"))]
    fig.legend(handles=legend, loc="upper left", bbox_to_anchor=(0.282, 0.891), ncol=3, frameon=False)
    footer(fig, data, metrics, lang, say(lang,
        "Интервалы описывают чувствительность среднего к составу работ; они не исправляют классификацию и аффилиации.\nFWCI учитывает год, тип и область; окна новых работ ещё не завершены. Без max — среднее за весь период без работы с максимальным FWCI.\nTop 3 — доля трёх максимальных значений в сумме FWCI за весь период. Качество науки не доказано этими числами.",
        "Intervals describe sensitivity to the work mix; they do not correct classification or affiliations.\nFWCI adjusts for year, type and field; recent windows remain incomplete. Max omission uses the full period and removes the work with the highest FWCI.\nTop 3 is the share of the three highest values in the full-period FWCI sum. These numbers do not prove research quality."))
    if not rows:
        mean_ax.text(0.5, 0.5, say(lang, "В выгрузке нет групп", "No fields in the export"), transform=mean_ax.transAxes, ha="center")
    return fig, {"groups": n, "periods": {"p1": p1, "p2": p2},
                 "encoding": "Cohort means and source bootstrap intervals; no intervals inferred for small samples; pooled influential-work details."}


def world_topics(data, metrics, lang):
    topics = sorted(data["topicEvidence"], key=lambda t: (
        t.get("worldShareChange") is None, -(t.get("worldShareChange") or 0), t["id"]))
    n = len(topics)
    fig = plt.figure(figsize=(16, max(10, n * 0.49 + 3.3)))
    grid = fig.add_gridspec(1, 3, left=0.30, right=0.985, top=0.83, bottom=0.15,
                           wspace=0.25, width_ratios=[4.8, 3.0, 1.65])
    growth_ax = fig.add_subplot(grid[0, 0])
    own_ax = fig.add_subplot(grid[0, 1], sharey=growth_ax)
    fwci_ax = fig.add_subplot(grid[0, 2], sharey=growth_ax)
    p1, p2 = period_text(data["period"], "p1"), period_text(data["period"], "p2")
    base_title(fig, say(lang, "Мир меняет темы — где видны работы СТАНКИН",
                        "World research shifts — where STANKIN papers appear"),
               say(lang, f"{n} выбранных кластеров OpenAlex. Это отдельный срез, а не полный мировой рейтинг. {p2} против {p1}.",
                   f"{n} selected OpenAlex clusters. A separate view, not a complete world ranking. {p2} versus {p1}."))
    growth_ax.set_title(say(lang, "Изменение доли темы в мировой науке", "Change in topic share of world research"), loc="left", pad=17)
    own_ax.set_title(say(lang, "Число работ СТАНКИН", "STANKIN publication count"), loc="left", pad=17)
    fwci_ax.set_title(say(lang, "Новые работы", "Recent works"), loc="left", pad=17)
    growths = [t["worldShareChange"] * 100 for t in topics if finite(t.get("worldShareChange"))]
    gl, gu = min([0] + growths), max([0] + growths)
    span = max(40, gu - gl)
    growth_ax.set_xlim(gl - span * 0.08, gu + span * 0.19)
    own_max = max([1] + [t[k] for t in topics for k in ("nP1", "nP2") if finite(t.get(k))])
    own_ax.set_xlim(-own_max * 0.02, own_max * 1.28)
    for ax in (growth_ax, own_ax, fwci_ax):
        ax.set_ylim(-0.6, max(1, n) - 0.4)
        ax.tick_params(axis="y", length=0)
        for y in range(n):
            if y % 2 == 0:
                ax.axhspan(y - 0.48, y + 0.48, color=COLORS["cream"], zorder=0)
    growth_ax.axvline(0, color=COLORS["gray"], lw=1)
    for i, topic in enumerate(topics):
        y = n - i - 1
        shift = topic.get("worldShareChange")
        if finite(shift):
            tone = COLORS["blue"] if shift >= 0 else COLORS["orange"]
            growth_ax.barh(y, shift * 100, height=0.35, color=tone, zorder=3)
            growth_ax.text(shift * 100 + span * 0.015 if shift >= 0 else span * 0.015, y,
                           percentage(shift, lang, signed=True), va="center",
                           ha="left", fontsize=10.5)
        else:
            growth_ax.text(0, y, say(lang, "Изменение не определено", "Change unavailable"), va="center", fontsize=10)
        early, recent = topic.get("nP1"), topic.get("nP2")
        if finite(early) and finite(recent):
            own_ax.plot([early, recent], [y, y], color=COLORS["gray"], lw=1.5, zorder=2)
        if finite(early):
            own_ax.plot(early, y, "o", ms=8, mfc="white", mec=COLORS["orange"], mew=1.5, zorder=3)
        if finite(recent):
            own_ax.plot(recent, y, "D", ms=5.5, color=COLORS["blue"], zorder=4)
        own_ax.text(max(v for v in (early, recent, 0) if finite(v)) + own_max * 0.035, y,
                    f"{integer(early, lang)} → {integer(recent, lang)}", fontsize=10.5, va="center")
        cohort = (topic.get("cohorts") or {}).get("p2", {})
        text = f"FWCI {number(cohort.get('fwci'), lang, 3)}\n" + f"n = {integer(cohort.get('fwciN'), lang)}"
        fwci_ax.text(0.02, y, text, fontsize=10.5, va="center", linespacing=1.55)
    names = [wrap(label(t.get("name") or t["id"], lang), 38)
             + "\n" + say(lang, "Мир: ", "World: ")
             + f"{integer(t.get('worldP1'), lang)} → {integer(t.get('worldP2'), lang)}"
             for t in reversed(topics)]
    growth_ax.set_yticks(range(n), names)
    own_ax.tick_params(labelleft=False)
    fwci_ax.tick_params(labelleft=False, bottom=False, labelbottom=False)
    fwci_ax.set_xlim(0, 1)
    growth_ax.xaxis.set_major_formatter(FuncFormatter(lambda x, _: number(x, lang, 0) + "%"))
    growth_ax.xaxis.set_major_locator(MaxNLocator(6))
    own_ax.xaxis.set_major_locator(MaxNLocator(5, integer=True))
    growth_ax.grid(axis="x", alpha=0.6)
    own_ax.grid(axis="x", alpha=0.6)
    growth_ax.set_xlabel(say(lang, "Относительно всех мировых работ тех же типов и лет", "Relative to all world works of the same types and years"))
    own_ax.set_xlabel(say(lang, "Работы · линейная шкала от нуля", "Works · linear scale from zero"))
    legend = [Line2D([], [], marker="o", mfc="white", mec=COLORS["orange"], ls="none", label=p1),
              Line2D([], [], marker="D", color=COLORS["blue"], ls="none", label=p2)]
    fig.legend(handles=legend, loc="upper left", bbox_to_anchor=(0.604, 0.894), ncol=2, frameon=False)
    footer(fig, data, metrics, lang, say(lang,
        "Кластеры охватывают разные отрасли. Рост научной доли не доказывает рост рынка; FWCI — цитирование, не готовность технологии.\nНоль работ означает отсутствие публикаций с такой основной темой в выгрузке. «—» — нет значения. Для FWCI малых тем доверительные интервалы здесь не заявлены.",
        "Clusters span several industries. Research-share growth does not prove market growth; FWCI measures citations, not technology readiness.\nZero means no exported works with this primary topic. “—” means unavailable. No confidence intervals are claimed for small topic FWCI samples."))
    if not topics:
        growth_ax.text(0.5, 0.5, say(lang, "В выгрузке нет тем", "No topics in the export"), transform=growth_ax.transAxes, ha="center")
    return fig, {"topics": n, "sortedBy": "worldShareChange descending, unavailable last",
                 "encoding": "Relative-world-share bars; own counts on a zero-based linear scale; recent-only FWCI and available-value n."}


SHORT_NAMES = {
    "machining": ("Резание", "Machining"), "coatings-tribology": ("Покрытия / трибология", "Coatings / tribology"),
    "metrology-quality": ("Метрология", "Metrology"), "ceramics-composites": ("Керамика / композиты", "Ceramics / composites"),
    "metals-alloys": ("Металлы / сплавы", "Metals / alloys"), "ai-data": ("ИИ / данные*", "AI / data*"),
    "modeling-mechanics": ("Механика / модели", "Mechanics / models"), "condition-monitoring": ("Диагностика", "Diagnostics"),
    "machine-tools-control": ("Станки / управление", "Machines / control"), "robotics": ("Робототехника", "Robotics"),
    "digital-manufacturing": ("Цифровое производство", "Digital manufacturing"), "software-it": ("Программные системы", "Software systems"),
}

SHORT_TOPICS = {
    "T10763": ("Цифровизация промышленности", "Industrial digitalization"),
    "T10462": ("Обучение роботов", "Robot reinforcement learning"),
    "T11948": ("МО в материалах", "ML in materials"),
    "T10705": ("Материалы для АП", "Additive materials"),
    "T12111": ("Зрение / дефекты", "Vision / defects"),
    "T10220": ("Диагностика машин", "Machine fault diagnosis"),
    "T10783": ("АП / 3D-печать", "Additive / 3D printing"),
    "T10653": ("Роботы / манипулирование", "Robot manipulation"),
    "T10188": ("Обработка / оптимизация", "Machining / optimization"),
    "T11138": ("Трибология / смазка", "Tribology / lubrication"),
    "T11583": ("Метрология", "Metrology"),
    "T10377": ("Металлы / тонкие плёнки", "Metals / thin films"),
    "T12362": ("Трибология / износ", "Tribology / wear"),
}


def measured_wrap(renderer, text, width_points, fontsize, weight="normal", dpi=100):
    """Wrap in the actual bundled font, rather than assuming character widths."""
    font = FontProperties(family="DejaVu Sans", size=fontsize, weight=weight)
    width_pixels = width_points * dpi / 72
    lines = []
    for paragraph in str(text).split("\n"):
        line = ""
        for word in paragraph.split():
            candidate = (line + " " + word).strip()
            pixels = renderer.get_text_width_height_descent(candidate, font, False)[0]
            if line and pixels > width_pixels:
                lines.append(line)
                line = word
            else:
                line = candidate
        lines.append(line)
    return "\n".join(lines)


def research_bridges(data, metrics, lang):
    families = data["agenda"]["families"]
    n = len(families)
    columns = max([1] + [len(f.get("subtopics", [])) for f in families])
    fig = plt.figure(figsize=(16, 10))
    rows = {r["id"]: r for r in data["rows"]}
    topics = {t["id"]: t for t in data["topicEvidence"]}
    questions = sum(len(f["subtopics"]) for f in families)
    base_title(fig, say(lang, "От научных направлений — к конкретным вопросам",
                        "From research fields to specific scientific questions"),
               say(lang, f"{n} семей задач · {questions} вопросов. Каждая карточка связывает вопрос с публикациями СТАНКИН и выбранными мировыми темами.",
                   f"{n} research families · {questions} questions. Each card links a question to STANKIN publications and selected world topics."))
    styles = {
        "base": (COLORS["blue"], say(lang, "Есть работы", "Published work")),
        "develop": (COLORS["orange"], say(lang, "Развивать", "Develop")),
        "verify": (COLORS["gray"], say(lang, "Проверить", "Verify")),
        "partner": (COLORS["purple"], say(lang, "Нужен партнёр", "Partner needed")),
    }
    left = 0.16
    gap = 0.011
    cell_w = (1 - left - columns * gap) / columns
    renderer = fig.canvas.get_renderer()
    width_points = (cell_w - 0.025) * 16 * 0.96 * 72
    prepared = []
    row_points = 140
    for family in families:
        cards = []
        for question in family["subtopics"]:
            # The full research question is the heading: no duplicate short title.
            heading = measured_wrap(renderer, label(question.get("question"), lang),
                                    width_points, 10.5, "bold", fig.dpi)
            group_lines = []
            for cid in question.get("competencyIds", []):
                row = rows[cid]
                cohort = row["cohorts"]["p2"]
                name = say(lang, *SHORT_NAMES[cid]) if cid in SHORT_NAMES else field_name(metrics, row, lang).split(",")[0]
                text = f"{name}: n={integer(cohort.get('n'), lang)} · FWCI {number(cohort.get('fwci'), lang, 2)}"
                group_lines.append(measured_wrap(renderer, text, width_points, 10, dpi=fig.dpi))
            topic_lines = []
            for tid in question.get("topicIds", []):
                topic = topics[tid]
                name = say(lang, *SHORT_TOPICS[tid]) if tid in SHORT_TOPICS else label(topic.get("name") or tid, lang)
                text = f"{name} ({tid}): {percentage(topic.get('worldShareChange'), lang, signed=True)} · n₂={integer(topic.get('nP2'), lang)}"
                topic_lines.append(measured_wrap(renderer, text, width_points, 10, dpi=fig.dpi))
            topic_text = "\n".join(topic_lines) or say(lang, "Мировая доля этой узкой задачи\nотдельно не измерена", "World share of this narrow question\nhas not been measured separately")
            blocks = [(heading, 10.5, "bold", COLORS["ink"]),
                      ("\n".join(group_lines), 10, "normal", COLORS["ink"]),
                      (topic_text, 10, "normal", COLORS["muted"])]
            # Reserve real physical space for every line and the separate role.
            required = sum((text.count("\n") + 1) * size * 1.3 + 9
                           for text, size, _, _ in blocks) + 38
            row_points = max(row_points, required)
            cards.append((question, blocks))
        prepared.append(cards)
    fig.set_size_inches(16, max(10, max(1, n) * row_points / 72 / 0.75))
    ax = fig.add_axes([0.025, 0.11, 0.96, 0.75])
    ax.set_xlim(0, 1)
    ax.set_ylim(0, max(1, n))
    ax.axis("off")
    actual_row_points = fig.get_figheight() * 72 * 0.75 / max(1, n)
    for family_index, family in enumerate(families):
        y = n - family_index - 1
        ax.add_patch(Rectangle((0, y + 0.012), 0.147, 0.973, facecolor=COLORS["cream"], edgecolor="none"))
        family_heading = measured_wrap(renderer, label(family.get("title"), lang),
                                       (0.147 - 0.025) * 16 * 0.96 * 72,
                                       12, "bold", fig.dpi)
        ax.text(0.011, y + 0.9, family_heading, fontsize=12,
                weight="bold", va="top", linespacing=1.45)
        for j, (question, blocks) in enumerate(prepared[family_index]):
            x = left + j * (cell_w + gap)
            tone, status = styles.get(question.get("status"), (COLORS["gray"], say(lang, "Проверить", "Verify")))
            ax.add_patch(Rectangle((x, y + 0.012), cell_w, 0.973, facecolor=COLORS["white"], edgecolor=COLORS["grid"], lw=0.8))
            ax.add_patch(Rectangle((x, y + 0.012), 0.003, 0.973, facecolor=tone, edgecolor="none"))
            tx = x + 0.010
            top = y + 1 - 15 / actual_row_points
            for text, size, weight, color in blocks:
                ax.text(tx, top, text, fontsize=size, weight=weight, va="top", color=color, linespacing=1.3)
                top -= ((text.count("\n") + 1) * size * 1.3 + 9) / actual_row_points
            ax.text(x + cell_w - 0.012, y + 10 / actual_row_points, status, fontsize=10,
                    va="bottom", ha="right", color=tone, weight="bold")
    if not families:
        ax.text(0.5, 0.5, say(lang, "Исследовательская повестка не задана", "Research agenda is not specified"), ha="center", va="center", transform=ax.transAxes)
    footer(fig, data, metrics, lang, say(lang,
        "Связи и роли предложены авторами повестки: это не измеренная сеть соавторства и не веса значимости. Числа групп — новые работы и их FWCI; суммы карточек не складываются.\nУ тем: % — изменение мировой доли; n₂ — работы СТАНКИН за новое пятилетие. Сигналы кластеров не измеряют каждую узкую задачу отдельно.\n* ИИ / данные — широкая группа, включая классические методы. Работы не доказывают готовую технологию или сильный ИИ для станков.",
        "Links and roles are proposed by the agenda authors, not measured co-authorship or importance weights. Field counts and FWCI use recent works; card counts must not be added.\nFor topics: % is change in world publication share; n₂ is recent STANKIN works. Cluster signals do not measure each narrow question separately.\n* AI / data is a broad group including classical methods. Publications do not prove a ready technology or strong machine-tool AI."))
    return fig, {"families": n, "questions": questions, "layout": "family rows × question cards",
                 "encoding": "Semantic agenda links; recent competence metrics and selected-topic signals; categorical author-proposed roles, no measured edges or weights."}


def package_version(name):
    try:
        return importlib.metadata.version(name)
    except importlib.metadata.PackageNotFoundError:
        return None


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, required=True, help="Exported dist/data/pish.json")
    parser.add_argument("--metrics", type=Path, required=True, help="Matching dist/data/metrics.json")
    parser.add_argument("--out", type=Path, required=True, help="Output directory for figures and manifest")
    args = parser.parse_args()
    data, metrics = read_json(args.data), read_json(args.metrics)
    validate(data, metrics)
    styles = configure_style()
    args.out.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": 1,
        "generator": "tools/scientific-plots.py",
        "generatedUTC": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "fetchedAt": data.get("fetchedAt"), "totalWorks": data["totalWorks"],
        "excludedWorks": data.get("excludedWorks"), "period": data["period"],
        "demo": metrics.get("meta", {}).get("demo") is True,
        "inputs": {"pish": {"file": args.data.name, "sha256": sha256(args.data)},
                   "metrics": {"file": args.metrics.name, "sha256": sha256(args.metrics)},
                   "generator": {"file": "tools/scientific-plots.py", "sha256": sha256(Path(__file__))}},
        "versions": {"python": sys.version.split()[0], "matplotlib": matplotlib.__version__,
                     "scienceplots": package_version("SciencePlots")},
        "style": styles, "font": "DejaVu Sans", "svgFontType": "path",
        "svgHashSalt": "stankin-science-pish-v1",
        "methods": data.get("mathAudit", {}).get("methods", {}),
        "plots": [], "files": [],
        "limitations": [
            "Figures read existing numerical estimates and intervals; no measurements, uncertainty estimates, network weights or effect sizes are invented.",
            "Citation statistics do not prove research quality, industrial demand, technology readiness or the correct investment amount.",
            "Topic groups cover several industries; this selected view is not a complete world ranking.",
            "Research-bridge links are proposed semantic relationships, not measured co-authorship or technology-transfer flows.",
        ],
    }
    generators = dict(zip(PLOT_KEYS, (forest_all_fields, world_topics, research_bridges)))
    for key, generator in generators.items():
        for lang in LANGS:
            fig, details = generator(data, metrics, lang)
            entries = []
            for extension in ("png", "svg", "pdf"):
                path = args.out / f"{key}-{lang}.{extension}"
                metadata = {"Creator": "STANKIN science · scientific-plots.py"}
                if extension == "svg":
                    metadata.update({"Date": None, "Description": details["encoding"]})
                elif extension == "pdf":
                    metadata.update({"CreationDate": None, "ModDate": None, "Title": key})
                else:
                    metadata.update({"Software": f"Matplotlib {matplotlib.__version__}"})
                fig.savefig(path, format=extension, dpi=220, metadata=metadata,
                            facecolor=COLORS["white"])
                entries.append({"file": path.name, "format": extension,
                                "bytes": path.stat().st_size, "sha256": sha256(path)})
                manifest["files"].append({"name": path.name, "format": extension,
                                          "bytes": path.stat().st_size, "sha256": sha256(path)})
            plt.close(fig)
            manifest["plots"].append({"key": key, "lang": lang, "files": entries, **details})
    manifest_file = args.out / "manifest.json"
    manifest_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Scientific figures: {len(manifest['plots'])} bilingual plots, 18 files · {data['totalWorks']} source works")
    print(f"Manifest: {manifest_file}")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, TypeError) as error:
        print(f"Scientific plot generation failed: {error}", file=sys.stderr)
        raise SystemExit(1)
