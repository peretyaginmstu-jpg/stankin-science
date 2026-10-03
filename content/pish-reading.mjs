// Общие оговорки страницы ПИШ: собраны в одном блоке «Как читать эту страницу» и относятся
// ко всем схемам, таблицам и числам. В подписях к рисункам остаются только оговорки,
// которые касаются именно этого рисунка.

const L = (ru, en) => ({ ru, en });

export const PISH_READING = Object.freeze({
  title: L('Как читать эту страницу', 'How to read this page'),
  lead: L(
    'Оговорки собраны здесь один раз и относятся ко всем схемам, таблицам и числам ниже. В подписях к рисункам остаются только уточнения к конкретному рисунку.',
    'The caveats are stated once here and apply to every diagram, table and number below. Figure captions keep only notes specific to that figure.',
  ),
  points: [
    {
      id: 'proposal',
      title: L('Это предложение, а не решение', 'A proposal, not a decision'),
      text: L(
        'Ставка, продукт, кооперация, цели и сроки (кроме 05.10 и 01.12) — авторские предложения к совещанию. Заказчик и соисполнители не выбраны, баллы конкурса не рассчитываются.',
        'The bet, product, cooperation, targets and dates (except 5 October and 1 December) are authorial proposals for the meeting. No customer or co-executor is chosen and no competition score is calculated.',
      ),
    },
    {
      id: 'publications',
      title: L('Публикации — ещё не продукт', 'Publications are not a product'),
      text: L(
        'Число работ и цитирование показывают исследовательский задел. Готовность системы, команду, стенды, спрос заказчика и новизну проверяют отдельно — по статьям, людям, оборудованию и договорам.',
        'Work counts and citations show research groundwork. System readiness, team, test benches, customer demand and novelty are checked separately — through papers, people, equipment and contracts.',
      ),
    },
    {
      id: 'zero',
      title: L('Ноль работ — не ноль компетенции', 'Zero works is not zero capability'),
      text: L(
        'Если OpenAlex не нашёл работ СТАНКИН с основной темой, специалисты и результаты всё равно могут быть: работы часто отнесены к другим темам, в том числе к общему кластеру T13113.',
        'If OpenAlex finds no STANKIN works with a primary topic, specialists and results may still exist: works are often filed under other topics, including the catch-all cluster T13113.',
      ),
    },
    {
      id: 'interval',
      title: L('Интервал — разброс, а не доказательство', 'An interval is spread, not proof'),
      text: L(
        '95% bootstrap-интервал показывает, насколько среднее зависит от состава работ. Он не исправляет ошибки тематики и аффилиаций и не учитывает множественные сравнения; по пересекающимся интервалам нельзя назвать лучшее направление.',
        'A 95% bootstrap interval shows how much the mean depends on which works are included. It does not correct topic or affiliation errors or adjust for multiple comparisons; overlapping intervals cannot name a best field.',
      ),
    },
    {
      id: 'window',
      title: L('Цитирование молодых работ ещё растёт', 'Young works are still collecting citations'),
      text: L(
        'У работ 2023–2025 годов окно цитирования не закрыто. Изменение FWCI между пятилетиями — повод разобрать сами работы, а не вывод о качестве науки.',
        'The citation window of 2023–2025 works is still open. A change in FWCI between periods is a reason to review the works, not a verdict on research quality.',
      ),
    },
    {
      id: 'world',
      title: L('Рост мировой темы — сигнал науки, а не рынка', 'World topic growth signals science, not markets'),
      text: L(
        'Рост считается относительно всех мировых работ тех же лет и типов и относится к широким темам OpenAlex, а не к каждой подтеме; рост узких подтем отдельно не измерен.',
        'Growth is measured against all world works of the same years and types and refers to broad OpenAlex topics, not to each subtopic; narrow subtopics are not measured separately.',
      ),
    },
    {
      id: 'overlap',
      title: L('Группы и темы пересекаются', 'Groups and topics overlap'),
      text: L(
        'Одна работа может входить в несколько тем, поэтому числа между карточками не складываются. Цвета статусов («опора», «нужно усилить») следуют заданным правилам и не означают превосходства.',
        'One work can belong to several topics, so numbers across cards do not add up. Status colours (“base”, “needs strengthening”) follow configured rules and do not mean superiority.',
      ),
    },
    {
      id: 'links',
      title: L('Связи на схемах — предложенная логика', 'Links in diagrams are proposed logic'),
      text: L(
        'Стрелки показывают, как задачи могли бы соединиться в работающую систему, а не измеренное соавторство или поток знаний.',
        'Arrows show how tasks could connect into a working system, not measured co-authorship or knowledge flow.',
      ),
    },
  ],
});
