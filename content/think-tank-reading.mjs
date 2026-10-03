// Общие оговорки страницы Think Tank: один блок «Как читать эту страницу» вместо повторов
// в подписях. В карточках и под рисунками остаются только уточнения к конкретному показателю.

const L = (ru, en) => ({ ru, en });

export const THINK_TANK_READING = Object.freeze({
  title: L('Как читать эту страницу', 'How to read this page'),
  lead: L(
    'Оговорки собраны здесь один раз и относятся ко всем карточкам, схемам и числам ниже. Под отдельными показателями остаются только уточнения к ним.',
    'The caveats are stated once here and apply to every card, diagram and number below. Individual indicators keep only notes specific to them.',
  ),
  points: [
    {
      id: 'proposal',
      title: L('Варианты — предложения, а не стратегия', 'Options are proposals, not strategy'),
      text: L(
        'Восемь направлений, три варианта и результаты 2030/2036 — авторская повестка для обсуждения. Это не утверждённая стратегия и не прогноз; вероятности успеха, бюджеты, команды и обязательства партнёров не назначены.',
        'The eight directions, three options and 2030/2036 results are an authorial agenda for discussion. They are neither an approved strategy nor a forecast; no probabilities, budgets, teams or partner commitments are assigned.',
      ),
    },
    {
      id: 'official',
      title: L('Официальные цели живут отдельно', 'Official targets stand apart'),
      text: L(
        'Цели программы развития и требования ПИШ на 2031 год — самостоятельные обязательства. Авторские варианты в них не входят и их не заменяют; опубликованная цель — не достигнутый результат.',
        'Development-programme targets and the 2031 PISH requirements are separate commitments. The authorial options are not part of them and do not replace them; a published target is not an achieved result.',
      ),
    },
    {
      id: 'reports',
      title: L('Отчёты описывают вуз целиком', 'Reports describe the whole university'),
      text: L(
        'Данные самообследования не разделены по темам и кафедрам: общевузовской суммой нельзя доказать рост отдельного направления. Год отчёта и год показателя могут различаться, деньги — в номинальных рублях.',
        'Self-evaluation data are not split by topic or department: a university total cannot prove growth in a single direction. The report year and the indicator year may differ; money is in nominal roubles.',
      ),
    },
    {
      id: 'topics',
      title: L('Темы — не вся наука направления', 'Topics are not the whole direction'),
      text: L(
        'Числа описывают выбранные темы OpenAlex; соответствие проверено по определению темы, а не по каждой статье. Темы пересекаются, поэтому числа между карточками не складываются.',
        'The numbers describe selected OpenAlex topics; fit was checked against topic definitions, not each paper. Topics overlap, so numbers across cards do not add up.',
      ),
    },
    {
      id: 'zero',
      title: L('Ноль работ — не ноль компетенции', 'Zero works is not zero capability'),
      text: L(
        'Если в выбранных темах нет работ СТАНКИН, специалисты и результаты всё равно могут быть: работы часто отнесены к другим темам, в том числе к общему кластеру T13113.',
        'If the selected topics hold no STANKIN works, specialists and results may still exist: works are often filed under other topics, including the catch-all cluster T13113.',
      ),
    },
    {
      id: 'interval',
      title: L('Интервал и Парето — не рейтинг', 'Intervals and Pareto are not a ranking'),
      text: L(
        '95% интервал показывает, насколько средний FWCI зависит от состава работ; при числе работ меньше 20 он не строится. Фильтр Парето сравнивает точечные оценки: это эвристика, а не доказанное превосходство и не правило финансирования.',
        'A 95% interval shows how much mean FWCI depends on which works are included; it is not drawn below 20 works. The Pareto filter compares point estimates: a heuristic, not proven superiority or a funding rule.',
      ),
    },
    {
      id: 'window',
      title: L('Цитирование молодых работ ещё растёт', 'Young works are still collecting citations'),
      text: L(
        'FWCI работ 2023–2025 годов ещё меняется, а одна сильно цитируемая статья сдвигает среднее, поэтому рядом показаны медиана и среднее без максимальной работы. Интервалы не исправляют ошибки базы.',
        'FWCI of 2023–2025 works is still changing, and one highly cited paper moves the mean, so the median and the mean without the top work are shown alongside. Intervals do not correct database errors.',
      ),
    },
    {
      id: 'world',
      title: L('Рост мировой доли — сигнал науки, а не рынка', 'World-share growth signals science, not markets'),
      text: L(
        'Доля считается относительно всех мировых работ тех же типов и лет. Два пятилетия не измеряют ускорение последних лет. Стрелки на карте — предложенная логика исследований, а не измеренная кооперация.',
        'Shares are relative to all world works of the same types and years. Two five-year periods cannot measure recent acceleration. Arrows on the map are proposed research logic, not measured cooperation.',
      ),
    },
  ],
});
