// Public institutional evidence. PDF page numbers are one-based and match the
// printed report pages. A publication year is never substituted for a data year.
// Missing values and changes in definitions must survive every downstream view.
const L = (ru, en) => ({ ru, en });
const O = (year, value, sourceId, page, ru, en) => ({
  year, value, sourceId, page, definition: L(ru, en), evidenceStatus: 'reported',
});
const UNIVERSITY = L('СТАНКИН в целом; распределения по научным темам нет.', 'STANKIN as an institution; no allocation to research topics.');
const MAIN_CAMPUS = L('Головной вуз: раздел отчёта до отдельного блока ЕТИ. Не сумма университета и филиала.', 'Main university: the report section before the separate ETI branch section. Not a combined university-and-branch total.');

export const INSTITUTIONAL_SOURCES = [
  {
    id: 'self-assessment-2020',
    title: L('Самообследование: результаты 2020 года, публикация 2021 года', 'Self-assessment: 2020 results, published in 2021'),
    url: 'https://stankin.ru/vikon/sveden/files/zip/Otchet_o_rezulytatax_samoobsledovaniya_2021.pdf',
    publicationYear: 2021, observationYears: [2020, 2021], checkedAt: '2026-10-03',
  },
  {
    id: 'self-assessment-2025',
    title: L('Самообследование: результаты 2025 года, публикация 2026 года', 'Self-assessment: 2025 results, published in 2026'),
    url: 'https://stankin.ru/vikon/sveden/files/zir/OTCHET_o_rezulytatax_samoobsledovaniya_2026%283%29.pdf',
    publicationYear: 2026, observationYears: [2021, 2022, 2023, 2024, 2025, 2026], checkedAt: '2026-10-03',
  },
  {
    id: 'programme-2026',
    title: L('Программа развития СТАНКИН на 2025–2036 годы, редакция 2026 года', 'STANKIN development programme for 2025–2036, 2026 edition'),
    url: 'https://cloud.stankin.ru/s/ZZMSLzwyPBpTArm',
    publicationYear: 2026, observationYears: [2023, 2024], targetYears: [2030, 2036], checkedAt: '2026-10-03',
  },
];

export const INSTITUTIONAL_INDICATORS = [
  {
    id: 'postgraduates', name: L('Аспиранты на конец года', 'Postgraduate researchers at year end'),
    unit: 'count', category: 'people', scope: UNIVERSITY, comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Сравнивается общая численность, а не число защит или выпускников. За 2020 год взято прямое утверждение в тексте: заголовок соседней таблицы ошибочно указывает 2019 год.', 'Total enrolment, not completions or defences. The 2020 figure follows the explicit narrative statement; the adjacent table heading says 2019 in error.'),
    observations: [
      O(2020, 330, 'self-assessment-2020', 185, 'Общая численность аспирантов в конце 2020 года, по тексту раздела 3.8.', 'Total postgraduate enrolment at the end of 2020, from section 3.8 narrative.'),
      O(2024, 392, 'self-assessment-2025', 269, 'Общая численность аспирантов на 31.12.2024; ретроспективное значение в отчёте за 2025 год.', 'Total postgraduate enrolment on 31 December 2024; retrospective value in the 2025 report.'),
      O(2025, 311, 'self-assessment-2025', 269, 'Общая численность аспирантов в конце 2025 года.', 'Total postgraduate enrolment at the end of 2025.'),
    ],
  },
  {
    id: 'teaching-staff-reported', name: L('ППС по кадровым таблицам отчётов', 'Teaching staff in the reports’ personnel tables'),
    unit: 'count', category: 'people', scope: MAIN_CAMPUS, comparable: false, comparisonYears: [2020, 2025],
    comparisonNote: L('Состав учёта требует сверки. Таблица 2020 года даёт 365 человек, возрастная таблица рядом — 372. Текст и таблицы по-разному описывают совместителей. Процент роста не рассчитывается; это не численность исследователей в полных ставках.', 'Counting scope needs reconciliation. The 2020 personnel table gives 365 people; the adjacent age table totals 372. Narrative and tables describe part-time staff differently. No growth rate is calculated; this is not research FTE.'),
    observations: [
      O(2020, 365, 'self-assessment-2020', 142, 'Строка «Всего», столбец 2020, таблица 6 о штатных сотрудниках ППС.', 'Total row, 2020 column, Table 6 on teaching staff.'),
      O(2025, 493, 'self-assessment-2025', 201, 'Строка «Всего», столбец 2025, таблица 12. Значение 513 относится к 01.04.2026, а не к 2025 году.', 'Total row, 2025 column, Table 12. The separate value 513 is dated 1 April 2026, not 2025.'),
    ],
  },
  {
    id: 'ip-grants', name: L('Полученные патенты и свидетельства', 'Patents and registration certificates received'),
    unit: 'count', category: 'research', scope: UNIVERSITY, comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Суммарный показатель двух видов документов. Его нельзя подписывать «патенты», считать внедрениями или оценкой коммерческого эффекта.', 'A combined count of two document types. It must not be labelled patents alone, implementations or commercial impact.'),
    observations: [
      O(2020, 45, 'self-assessment-2020', 181, 'Полученные за 2020 год патенты и свидетельства, вместе.', 'Patents and registration certificates received during 2020, combined.'),
      O(2025, 74, 'self-assessment-2025', 266, 'Полученные за 2025 год патенты и свидетельства, вместе.', 'Patents and registration certificates received during 2025, combined.'),
    ],
  },
  {
    id: 'ip-applications', name: L('Заявки на объекты интеллектуальной собственности', 'Intellectual property applications'),
    unit: 'count', category: 'research', scope: UNIVERSITY, comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Заявки, а не выданные охранные документы. Не складываются с полученными патентами и свидетельствами в общий результат.', 'Applications, not granted rights. They must not be added to granted patents and certificates as a single output total.'),
    observations: [
      O(2020, 62, 'self-assessment-2020', 181, 'Поданные в 2020 году заявки на объекты интеллектуальной собственности.', 'Intellectual property applications submitted during 2020.'),
      O(2025, 98, 'self-assessment-2025', 266, 'Поданные в 2025 году заявки на объекты интеллектуальной собственности.', 'Intellectual property applications submitted during 2025.'),
    ],
  },
  {
    id: 'dissertation-councils', name: L('Действующие диссертационные советы', 'Active dissertation councils'),
    unit: 'count', category: 'people', scope: UNIVERSITY, comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Число советов по тексту отчётов. Изменение номенклатуры специальностей и организации советов не позволяет считать это прямой мерой силы научных школ.', 'Council count as reported. Changes in the disciplinary classification and council organisation mean it is not a direct measure of research strength.'),
    observations: [
      O(2020, 4, 'self-assessment-2020', 187, 'Четыре совета, действовавших при университете в 2020 году.', 'Four councils operating at the university in 2020.'),
      O(2025, 2, 'self-assessment-2025', 273, 'Два совета, действовавших при университете в 2025 году.', 'Two councils operating at the university in 2025.'),
    ],
  },
  {
    id: 'council-defences', name: L('Защиты в советах СТАНКИН', 'Defences in STANKIN dissertation councils'),
    unit: 'count', category: 'research', scope: L('Все соискатели, защитившиеся в советах университета; не только его работники и аспиранты.', 'All candidates defending in university councils, not only its staff or postgraduate researchers.'),
    comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Использованы годовые итоги в тексте: 2 кандидатские в 2020 году; 8 кандидатских и 2 докторские в 2025 году. Заголовок таблицы 16 в старом отчёте указывает 2019 год, поэтому распределение той таблицы не используется. Две точки не устанавливают устойчивый темп роста.', 'Narrative annual totals: two Candidate of Sciences defences in 2020; eight Candidate and two Doctor of Sciences defences in 2025. The older Table 16 is headed 2019, so its breakdown is not used. Two observations do not establish a sustained growth rate.'),
    observations: [
      O(2020, 2, 'self-assessment-2020', 187, 'Всего защит в советах университета за 2020 год по тексту раздела 3.9; внешние защиты работников не включены.', 'Total 2020 defences in university councils per section 3.9 narrative; staff defences at other institutions are excluded.'),
      O(2025, 10, 'self-assessment-2025', 274, 'Всего защит в советах университета за 2025 год: 8 кандидатских и 2 докторские.', 'Total 2025 defences in university councils: eight Candidate and two Doctor of Sciences defences.'),
    ],
  },
  {
    id: 'state-fundamental-projects', name: L('Фундаментальные исследования по госзаданию', 'Basic research projects under the state assignment'),
    unit: 'count', category: 'research', scope: UNIVERSITY, comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Количество исследований в одном источнике финансирования. Размер проектов и трудоёмкость могут различаться; это не весь портфель НИОКР.', 'Project count within one funding stream. Project scale and workload may differ; this is not the complete R&D portfolio.'),
    observations: [
      O(2020, 3, 'self-assessment-2020', 167, 'Три фундаментальных исследования по государственному заданию Минобрнауки России в отчётном году.', 'Three basic research projects under the Ministry state assignment in the reporting year.'),
      O(2025, 8, 'self-assessment-2025', 241, 'Восемь фундаментальных исследований по государственному заданию Минобрнауки России в отчётном году.', 'Eight basic research projects under the Ministry state assignment in the reporting year.'),
    ],
  },
  {
    id: 'state-fundamental-funding', name: L('Финансирование фундаментальных исследований по госзаданию', 'State-assignment funding for basic research'),
    unit: 'million-rub', category: 'finance', scope: UNIVERSITY, comparable: true, comparisonYears: [2020, 2025],
    comparisonNote: L('Номинальные рубли соответствующего года, без поправки на инфляцию. Сопоставим источник финансирования; изменение суммы не измеряет эффективность исследований или реальную покупательную способность.', 'Nominal rubles of each year, without inflation adjustment. The funding stream is comparable; a change in the amount is not research efficiency or real purchasing-power growth.'),
    observations: [
      O(2020, 88.4, 'self-assessment-2020', 167, 'Годовое финансирование трёх фундаментальных исследований по госзаданию.', 'Annual funding of the three basic research projects under the state assignment.'),
      O(2025, 194.1, 'self-assessment-2025', 241, 'Годовое финансирование восьми фундаментальных исследований по госзаданию.', 'Annual funding of the eight basic research projects under the state assignment.'),
    ],
  },
  {
    id: 'research-services-receipts', name: L('Поступления от исследований, услуг и работ', 'Receipts from research, services and other work'),
    unit: 'million-rub', category: 'finance', scope: UNIVERSITY, comparable: false, comparisonYears: [2020, 2025],
    comparisonNote: L('В 2025 году в формулировку дополнительно включены производственные работы. Процент роста не рассчитывается: сначала нужен единый состав доходов. Суммы номинальные.', 'The 2025 definition additionally includes production work. No growth rate is calculated until the revenue scope is reconciled. Amounts are nominal.'),
    observations: [
      O(2020, 502.6, 'self-assessment-2020', 166, 'Бюджетные и внебюджетные поступления от НИОКР и научно-технических услуг.', 'Budgetary and non-budgetary receipts from R&D and scientific/technical services.'),
      O(2025, 586.2, 'self-assessment-2025', 241, 'Бюджетные и внебюджетные поступления от НИОКР, научно-технических услуг и производственных работ.', 'Budgetary and non-budgetary receipts from R&D, scientific/technical services and production work.'),
    ],
  },
  {
    id: 'research-only-funding', name: L('Финансирование исследований и разработок отдельно', 'Research and development funding reported separately'),
    unit: 'million-rub', category: 'finance', scope: UNIVERSITY, comparable: false, comparisonYears: [2020, 2025],
    comparisonNote: L('В отчёте за 2020 год НИР и разработки выделены отдельно от общего объёма работ и услуг. В проверенном разделе отчёта за 2025 год сопоставимая отдельная сумма не найдена. Пропуск не заменяется суммой 586,2 млн ₽.', 'The 2020 report separates research and development from the larger works-and-services total. An equivalent separate amount was not found in the reviewed 2025 section. The missing value is not replaced by RUB 586.2 million.'),
    observations: [
      O(2020, 376.3, 'self-assessment-2020', 166, 'Объём финансирования научных исследований и разработок; отдельное значение рядом с общими поступлениями.', 'Funding of scientific research and development; a separate value beside total receipts.'),
      O(2025, null, 'self-assessment-2025', 241, 'Нет подтверждённой отдельной суммы с тем же составом; проверен финансовый блок раздела 3.', 'No confirmed separate amount on the same basis; the financial part of section 3 reviewed.'),
    ],
  },
  {
    id: 'scopus-reported', name: L('Статьи Scopus в самообследовании', 'Scopus articles in the self-assessment report'),
    unit: 'count', category: 'research', scope: UNIVERSITY, comparable: false, comparisonYears: [2020, 2025],
    comparisonNote: L('Старое значение зафиксировано на 22.03.2021. Сопоставимый показатель за 2025 год в отчёте не найден. Не подменяется числом OpenAlex: у баз разные охват и дата учёта.', 'The historical value was recorded on 22 March 2021. An equivalent 2025 figure was not found in the report. OpenAlex is not substituted because database coverage and observation dates differ.'),
    observations: [
      O(2020, 269, 'self-assessment-2020', 180, 'Научные статьи сотрудников за 2020 год, индексируемые Scopus; состояние учёта на 22.03.2021.', 'Staff articles for 2020 indexed in Scopus, counted as of 22 March 2021.'),
      O(2025, null, 'self-assessment-2025', null, 'Сопоставимое годовое значение Scopus не найдено при проверке отчёта.', 'No comparable annual Scopus figure found when reviewing the report.'),
    ],
  },
  {
    id: 'computer-classrooms', name: L('Компьютерные классы: 2020/21 → 2025/26', 'Computer classrooms: 2020/21 → 2025/26'),
    unit: 'count', category: 'infrastructure', scope: MAIN_CAMPUS, comparable: true, comparisonYears: [2021, 2026],
    comparisonNote: L('Учебные годы, а не календарные 2020 и 2025. Значения относятся к строке «Компьютерные классы»; мультимедийные классы считаются отдельно. Количество помещений не измеряет загрузку или готовность исследовательского оборудования.', 'Academic years, not calendar years 2020 and 2025. Values refer to the computer-classrooms row; multimedia classrooms are listed separately. Room count does not measure research equipment utilisation or readiness.'),
    observations: [
      O(2021, 18, 'self-assessment-2020', 215, '18 компьютерных классов в 2020–2021 учебном году; год записи — конец учебного периода.', '18 computer classrooms in academic year 2020–2021; the recorded year denotes the academic-period end.'),
      O(2026, 24, 'self-assessment-2025', 303, '24 компьютерных класса в 2025–2026 учебном году; год записи — конец учебного периода.', '24 computer classrooms in academic year 2025–2026; the recorded year denotes the academic-period end.'),
    ],
  },
];

export const INSTITUTIONAL_CONTEXT = [
  {
    id: 'reported-machine-equipment', evidenceStatus: 'reported', observationYear: null, publicationYear: 2026, reportingYear: 2025,
    title: L('В отчёте перечислена станочная и измерительная база', 'The report lists machining and measurement equipment'),
    text: L('В перечне оснащения указаны MIKRON VCE 1000/1600 Pro, RXP 600DSH и RXP 300, пятиосевой S500U; на этой же странице — лазерный интерферометр Renishaw XL-80. Это подтверждает наличие записей об оборудовании, но не его исправность, доступность для проекта или готовность к замкнутому управлению. Перед выбором темы нужны проверка состояния и согласованный доступ.', 'The inventory lists MIKRON VCE 1000/1600 Pro, RXP 600DSH, RXP 300 and the five-axis S500U; the same page lists a Renishaw XL-80 laser interferometer. This confirms inventory entries, not operability, project access or readiness for closed-loop control. Equipment condition and access must be checked before selecting a project.'),
    sourceId: 'self-assessment-2025', page: 318,
  },
  {
    id: 'programme-research-base', evidenceStatus: 'reported', observationYear: null, publicationYear: 2026,
    title: L('Научная база по программе развития', 'Research base described in the development programme'),
    text: L('Редакция 2026 года сообщает о 20 лабораториях, 7 центрах и более чем 200 научных работниках. Дата этого среза не указана; это не перепись на конец 2025 года. Названия подразделений, состав команд и доступность установок следует подтвердить для каждой выбранной темы.', 'The 2026 edition reports 20 laboratories, seven centres and more than 200 research staff. The observation date is not stated; this is not a year-end 2025 census. Department identities, team membership and equipment access must be confirmed for each proposed topic.'),
    sourceId: 'programme-2026', page: 6,
  },
  {
    id: 'existing-engineering-school', evidenceStatus: 'reported', observationYear: 2025,
    title: L('Действующая ПИШ уже входит в институциональную базу', 'The existing engineering school is part of the institutional base'),
    text: L('В отчёте за 2025 год названа ПИШ «Технологическая база машиностроения» и участие университета в проекте с 2023 года. Новая научная повестка должна уточнять собственный предмет исследования и связь с действующей школой. Наличие ПИШ не подтверждает обязательств компаний по новой заявке.', 'The 2025 report names the Technological Base of Mechanical Engineering school and states that the university has participated since 2023. A new research agenda needs its own research object and a clear relationship to the existing school. The school’s existence does not establish company commitments to a new application.'),
    sourceId: 'self-assessment-2025', page: 353,
  },
  {
    id: 'official-2030', evidenceStatus: 'official-target', targetYear: 2030,
    title: L('2030: опубликованные цели программы', '2030: published programme targets'),
    text: L('Программа на 2025–2036 годы ставит на 2030 год доход от НИОКР 3 410 млн ₽ и долю научно-педагогических работников с опытом работы в промышленности или длительных стажировок 35%. Это цели опубликованного документа, а не достигнутые результаты, подтверждённое финансирование или прогноз Think Tank. Сравнивать доход с общей суммой работ и услуг 2025 года без сверки состава нельзя.', 'The programme for 2025–2036 sets 2030 targets of RUB 3,410 million in R&D income and 35% of academic staff with industrial work experience or long placements. These are published document targets, not delivered results, secured funding or Think Tank forecasts. Income cannot be compared with the broader 2025 works-and-services total without reconciling definitions.'),
    sourceId: 'programme-2026', page: 45,
  },
  {
    id: 'official-2036', evidenceStatus: 'official-target', targetYear: 2036,
    title: L('2036: опубликованные цели программы', '2036: published programme targets'),
    text: L('На 2036 год в программе указаны доход от НИОКР 5 280 млн ₽, 25 видов высокотехнологичного станочного оборудования, производство которых предполагается освоить, и 45% научно-педагогических работников с промышленным опытом или длительными стажировками. Выполнение этих целей и научное лидерство — разные вопросы; предлагаемые исследования должны иметь собственные проверки новизны и воспроизводимости.', 'For 2036 the programme specifies RUB 5,280 million in R&D income, 25 types of advanced machine-tool equipment to enter production, and 45% of academic staff with industrial experience or long placements. Meeting these targets and achieving research leadership are distinct questions; proposed research needs its own tests of novelty and reproducibility.'),
    sourceId: 'programme-2026', page: 45,
  },
];
