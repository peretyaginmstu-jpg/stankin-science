// The recommended bet for the 2026 PISH application: an authorial proposal for
// the meeting, built on the reviewed call terms in content/pish.mjs and the
// publication model. Ratings are qualitative and explained in words; they are
// not competition scores, a funding formula or a customer commitment.

const L = (ru, en) => ({ ru, en });

export const PISH_BET_REVIEWED_AT = '2026-10-03';

export const PISH_BET = {
  title: L('Ставка: интеллект отечественного станка', 'The bet: intelligence for domestic machine tools'),
  thesis: L(
    'Ставим не на «станок» и не на «ИИ вообще», а на управляющий интеллект отечественного станка. Это система, которая измеряет процесс, предсказывает износ инструмента и ошибку детали, меняет режим только в разрешённых пределах и подтверждает качество независимым измерением. Заказчик выпускает и продаёт её вместе со станками или как модуль для уже работающего оборудования.',
    'Not “a machine tool” and not “AI in general”, but the control intelligence of a domestic machine tool. The system measures the process, predicts tool wear and part error, changes settings only within permitted limits and confirms quality by independent measurement. The customer produces and sells it with new machines or as a module for installed equipment.',
  ),
  product: L('Встраиваемая система адаптивного управления точной обработкой', 'An embedded adaptive control system for precision machining'),
  productParts: [
    L('модуль для системы ЧПУ', 'CNC module'),
    L('сенсорный комплект', 'sensor kit'),
    L('гибридная модель процесса', 'hybrid process model'),
    L('протокол приёмки детали', 'part acceptance protocol'),
  ],
  scienceQuestion: L(
    'Как по неполным и зашумлённым сигналам оценивать износ инструмента и ошибку детали с проверенной неопределённостью и менять режим только в безопасных пределах так, чтобы модель переносилась на другой станок без обучения с нуля?',
    'How can tool wear and part error be estimated from incomplete, noisy signals with tested uncertainty, and settings changed only within safe limits, so that the model transfers to another machine without retraining from scratch?',
  ),
  condition: L(
    'Ставка действует при одном условии: к 31 октября есть квалифицированный заказчик, который письменно готов вложить не менее 50% бюджетных средств, заказывать исследования и разработки по траектории приложения 10 и согласовать главного конструктора и две станочные платформы. Без такого письма сильной заявки не получится — лучше переходить к запасному варианту.',
    'The bet holds on one condition: by 31 October a qualified customer confirms in writing that it will contribute at least 50% of the budget funding, commission R&D along the Annex 10 trajectory and agree a chief designer and two machine platforms. Without such a letter the application will be weak; switch to the fallback instead.',
  ),
  fallback: L(
    'Запасной вариант — роботизированная станочная ячейка с компанией-робототехником в роли заказчика. Спрос и поддержка нацпроекта сильные, но своя научная опора слабее, поэтому вариант годится только с сильным партнёром. Если нет и его, лучше вложиться в результаты действующей ПИШ и готовить заявку к следующему отбору.',
    'Fallback: a robotic machining cell with a robotics company as the customer. Demand and national-project support are strong, but STANKIN’s own research base is weaker, so this works only with a strong partner. If no such partner exists, invest in the existing school’s results and prepare for the next selection round.',
  ),
  sourceIds: ['pish-call-2026', 'stankin-pish-results-2025', 'stankin-axioma', 'national-project-production', 'programme-2026-targets'],
};

// Reasons carry the competency ids whose live cohort values the page prints.
export const PISH_BET_REASONS = [
  {
    id: 'distinct',
    title: L('Отвечает на п. 3.4: другой продукт', 'Meets §3.4: a different product'),
    text: L(
      'Действующая ПИШ разрабатывает «железо»: инструмент, узлы станков, проекты производств. Новая разрабатывает другой объект — систему управления процессом — и решает другую задачу: удержать точность и ресурс, когда меняется состояние станка и инструмента.',
      'The existing school develops hardware: tooling, machine components and factory designs. The new school develops a different object — a process control system — for a different task: holding accuracy and tool life while the machine and tool condition changes.',
    ),
    competencyIds: [],
    sourceIds: ['pish-call-2026', 'stankin-pish-results-2025'],
  },
  {
    id: 'base',
    title: L('Опирается на сильное ядро', 'Builds on a strong core'),
    text: L(
      'Физика резания и метрология — основа продукта. Среди пяти групп с сильным профилем только у обработки резанием и метрологии средний FWCI новых работ выше мирового ориентира 1.',
      'Cutting physics and metrology form the product core. Among the five strongly profiled groups, only machining and metrology have recent mean FWCI above the world reference of 1.',
    ),
    competencyIds: ['machining', 'metrology-quality'],
    sourceIds: [],
  },
  {
    id: 'gaps',
    title: L('Кооперация обоснована данными', 'Cooperation follows the data'),
    text: L(
      'Слабые места видны в цифрах: управление станком, диагностика и ИИ. Именно их закрывают соисполнители. Это прямой ответ на критерий «полнота и обоснованность кооперации» — 40% оценки.',
      'The weak points are visible in the numbers: machine control, diagnostics and AI. Co-executors cover exactly these. This answers the “completeness and justification of cooperation” criterion, worth 40% of the assessment.',
    ),
    competencyIds: ['machine-tools-control', 'condition-monitoring', 'ai-data'],
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'asset',
    title: L('Использует собственную ЧПУ', 'Uses STANKIN’s own CNC'),
    text: L(
      'Замкнутый контур требует доступа к управлению станком. У СТАНКИН есть отечественная открытая система ЧПУ «АксиОМА Контрол» — её удобно взять первой платформой. Публикации этот задел почти не показывают; инсталляции и надёжность нужно проверить.',
      'A closed loop needs access to machine control. STANKIN has a domestic open CNC system, AxiOMA Control, a natural first platform. Publications barely show this asset; installations and reliability need checking.',
    ),
    competencyIds: [],
    sourceIds: ['stankin-axioma'],
  },
  {
    id: 'money',
    title: L('Продаётся после 2029 года', 'Sells after 2029'),
    text: L(
      'После 2029 года бюджетного финансирования нет. Модуль даёт выручку от лицензий, сервиса и обучения инженеров заказчика. Программы, базы данных и способы управления быстро оформляются как РИД: в приложении 10 нужен рост на 43% к 2031 году и на 55% к 2034 году.',
      'There is no budget funding after 2029. The module earns licence, service and customer-training revenue. Software, databases and control methods register quickly as IP: Annex 10 requires 43% growth by 2031 and 55% by 2034.',
    ),
    competencyIds: [],
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'policy',
    title: L('Совпадает с нацпроектом и программой вуза', 'Fits the national project and university programme'),
    text: L(
      'Станки, ЧПУ и автоматизация — ядро нацпроекта «Средства производства и автоматизации». Программа развития СТАНКИН к 2036 году предполагает освоить выпуск 25 видов высокотехнологичного станочного оборудования; модуль повышает ценность каждого из них.',
      'Machine tools, CNC and automation are the core of the “Means of Production and Automation” national project. STANKIN’s programme aims to bring 25 types of advanced machine-tool equipment into production by 2036; the module adds value to each.',
    ),
    competencyIds: [],
    sourceIds: ['national-project-production', 'programme-2026-targets'],
  },
];

export const PISH_BET_CRITERIA = [
  { id: 'distinct', label: L('Отличие от действующей ПИШ (п. 3.4)', 'Distinct from the existing school (§3.4)') },
  { id: 'science', label: L('Своя научная опора', 'Own research base') },
  { id: 'customer', label: L('Заказчик с деньгами на НИОКР', 'Customer with R&D money') },
  { id: 'cooperation', label: L('Логика кооперации (40%)', 'Cooperation logic (40%)') },
  { id: 'policy', label: L('Нацпроект и программа вуза', 'National project and programme') },
  { id: 'after2029', label: L('Доход после 2029 года', 'Revenue after 2029') },
];

const R = (level, ru, en) => ({ level, note: L(ru, en) });

// Expert assessment for discussion. level: high | mid | low.
export const PISH_BET_OPTIONS = [
  {
    id: 'adaptive', recommended: true,
    title: L('Интеллект станка: адаптивная точная обработка', 'Machine intelligence: adaptive precision machining'),
    competencyIds: ['machining', 'metrology-quality'],
    ratings: {
      distinct: R('high', 'Другой объект: система управления, а не инструмент', 'A different object: a control system, not a tool'),
      science: R('high', 'Обработка и метрология — поздний FWCI выше 1', 'Machining and metrology: recent FWCI above 1'),
      customer: R('mid', 'Станкостроитель или холдинг с парком станков; бюджет подтвердить', 'A machine builder or a group with a machine fleet; confirm the budget'),
      cooperation: R('high', 'Партнёры закрывают измеренные разрывы', 'Partners cover measured gaps'),
      policy: R('high', 'Станки и ЧПУ — ядро нацпроекта', 'Machine tools and CNC are the national-project core'),
      after2029: R('high', 'Лицензии, сервис, обучение, РИД на ПО', 'Licences, service, training, software IP'),
    },
    verdict: L('Рекомендуем как основную ставку', 'Recommended as the main bet'),
  },
  {
    id: 'robot-cell', recommended: false,
    title: L('Роботизированная станочная ячейка', 'Robotic machining cell'),
    competencyIds: ['robotics', 'machine-tools-control'],
    ratings: {
      distinct: R('high', 'Ячейка — новый объект', 'A cell is a new object'),
      science: R('low', 'Мало работ, поздний FWCI низкий', 'Few works, low recent FWCI'),
      customer: R('mid', 'Спрос есть, много интеграторов-конкурентов', 'Demand exists; many competing integrators'),
      cooperation: R('mid', 'Ядро придётся брать у партнёра', 'The core would come from a partner'),
      policy: R('high', 'Роботизация — цель нацпроекта', 'Robotisation is a national-project goal'),
      after2029: R('mid', 'Проекты интеграции, меньше тиражируемого РИД', 'Integration projects, less replicable IP'),
    },
    verdict: L('Запасной вариант и этап после 2031 года', 'Fallback and the stage after 2031'),
  },
  {
    id: 'ai', recommended: false,
    title: L('ИИ в машиностроении', 'AI for mechanical engineering'),
    competencyIds: ['ai-data'],
    ratings: {
      distinct: R('mid', 'Зависит от выбранного продукта', 'Depends on the chosen product'),
      science: R('low', 'Широкая группа, поздний FWCI ниже 1', 'A broad group; recent FWCI below 1'),
      customer: R('mid', 'Спрос есть, продукт размыт', 'Demand exists; the product is vague'),
      cooperation: R('mid', 'Неясно, что делает вуз сам', 'Unclear what the university does itself'),
      policy: R('mid', 'ИИ — сквозная тема, не отраслевая', 'AI is cross-cutting, not sector-specific'),
      after2029: R('mid', 'Зависит от заказчика', 'Depends on the customer'),
    },
    verdict: L('Включить как метод внутри продукта', 'Include as a method inside the product'),
  },
  {
    id: 'tooling', recommended: false,
    title: L('Функциональный инструмент и покрытия', 'Functional tooling and coatings'),
    competencyIds: ['coatings-tribology', 'ceramics-composites'],
    ratings: {
      distinct: R('low', 'Пересекается с инструментом действующей ПИШ', 'Overlaps the existing school’s tooling'),
      science: R('mid', 'Много работ, но поздний FWCI покрытий ниже 1', 'Many works, but recent coatings FWCI is below 1'),
      customer: R('high', 'Инструментальные заводы, понятный продукт', 'Tool plants and a clear product'),
      cooperation: R('mid', 'Партнёры нужны меньше', 'Partners are less necessary'),
      policy: R('mid', 'Инструмент — часть нацпроекта', 'Tooling is part of the national project'),
      after2029: R('high', 'Продажи инструмента', 'Tool sales'),
    },
    verdict: L('Развивать в действующей ПИШ; в новой — объект испытаний', 'Develop in the existing school; a test object in the new one'),
  },
  {
    id: 'additive', recommended: false,
    title: L('Аддитивные технологии', 'Additive manufacturing'),
    competencyIds: ['additive-manufacturing'],
    ratings: {
      distinct: R('high', 'Другой объект', 'A different object'),
      science: R('low', 'Мир растёт, у СТАНКИН падают доля и FWCI', 'The world grows; STANKIN’s share and FWCI fall'),
      customer: R('mid', 'Много сильных конкурентов-ПИШ', 'Many strong competing schools'),
      cooperation: R('mid', 'Опора почти целиком у партнёров', 'The base would sit mostly with partners'),
      policy: R('mid', 'Поддержка есть, но не станочная', 'Supported, but outside machine tools'),
      after2029: R('mid', 'Услуги печати и материалы', 'Printing services and materials'),
    },
    verdict: L('Не выбирать темой новой школы', 'Do not choose as the new school topic'),
  },
];

export const PISH_BET_BOUNDARY = [
  {
    id: 'object',
    label: L('Объект разработки', 'Development object'),
    existing: L('Режущий инструмент, узлы станков, проекты производств', 'Cutting tools, machine components, factory designs'),
    proposed: L('Программно-аппаратная система управления обработкой: модуль ЧПУ, датчики, модель процесса', 'A hardware–software machining control system: CNC module, sensors, process model'),
    interface: L('Инструмент действующей ПИШ — объект испытаний', 'The existing school’s tools are test objects'),
  },
  {
    id: 'solution',
    label: L('Научно-техническое решение', 'Scientific and technical solution'),
    existing: L('Конструкция, материал и геометрия изделия', 'Product design, material and geometry'),
    proposed: L('Гибридная модель с проверенной неопределённостью, безопасная коррекция, перенос между станками', 'Hybrid model with tested uncertainty, safe correction and transfer between machines'),
    interface: L('Общий протокол испытаний на износ', 'A shared wear-test protocol'),
  },
  {
    id: 'result',
    label: L('Результат для заказчика', 'Result for the customer'),
    existing: L('Изделие: инструмент, узел, проект', 'An item: a tool, component or design'),
    proposed: L('Функция станка: точность, ресурс, стоимость годной детали', 'A machine function: accuracy, tool life, cost per accepted part'),
    interface: L('Разные акты приёмки', 'Separate acceptance records'),
  },
  {
    id: 'customer',
    label: L('Квалифицированный заказчик', 'Qualified customer'),
    existing: L('Партнёры действующей школы', 'The existing school’s partners'),
    proposed: L('Отдельный заказчик новой заявки', 'A separate customer for the new application'),
    interface: L('Старые соглашения не засчитываются', 'Existing agreements do not count'),
  },
  {
    id: 'team',
    label: L('Подразделение и команда', 'Unit and team'),
    existing: L('Действующее подразделение ПИШ', 'The existing school unit'),
    proposed: L('Обособленное подразделение и свой главный конструктор', 'A separate unit with its own chief designer'),
    interface: L('Стенды и семинары — по договору', 'Benches and seminars under agreement'),
  },
  {
    id: 'ip',
    label: L('Результаты интеллектуальной деятельности', 'Intellectual property'),
    existing: L('Патенты на конструкции и способы изготовления', 'Patents on designs and manufacturing methods'),
    proposed: L('Программы, базы данных, патенты на способы управления', 'Software, databases, patents on control methods'),
    interface: L('Раздельный учёт РИД', 'Separate IP records'),
  },
];

export const PISH_BET_WORKPACKAGES = [
  { id: 'requirements', label: L('Требования и приёмка', 'Requirements and acceptance') },
  { id: 'sensing', label: L('Измерение и датчики', 'Measurement and sensors') },
  { id: 'physics', label: L('Физическая модель резания', 'Cutting physics model') },
  { id: 'prediction', label: L('ИИ-прогноз с интервалом', 'AI prediction with interval') },
  { id: 'correction', label: L('Коррекция в ЧПУ', 'CNC correction') },
  { id: 'trials', label: L('Стенд и перенос', 'Bench and transfer') },
  { id: 'series', label: L('Серия и метрология', 'Series and metrology') },
  { id: 'market', label: L('Выпуск, продажа, сервис', 'Production, sales, service') },
  { id: 'people', label: L('Кадры и ДПО', 'Staff and continuing education') },
];

// role: R — responsible, C — contributes. At most five organisations including the lead.
export const PISH_BET_PARTNERS = [
  {
    id: 'stankin', kind: 'lead',
    name: L('СТАНКИН · новая ПИШ', 'STANKIN · new school'),
    role: L('Головной вуз: физика резания, метрология, модель, интеграция, кадры', 'Lead university: cutting physics, metrology, model, integration, staff'),
    evidenceIds: ['machining', 'metrology-quality'],
    status: L('Есть работы по теме', 'Published work exists'),
    roles: { requirements: 'C', sensing: 'R', physics: 'R', prediction: 'C', correction: 'C', trials: 'R', series: 'C', market: '', people: 'R' },
  },
  {
    id: 'customer', kind: 'customer',
    name: L('Квалифицированный заказчик', 'Qualified customer'),
    role: L('Станкостроитель или холдинг с парком станков: требования, платформы, ≥50% средств, выпуск и продажа', 'A machine builder or a group with a machine fleet: requirements, platforms, ≥50% funding, production and sales'),
    evidenceIds: [],
    status: L('Нужно письмо до 31 октября', 'Letter needed by 31 October'),
    roles: { requirements: 'R', sensing: '', physics: '', prediction: '', correction: 'C', trials: 'C', series: 'C', market: 'R', people: 'C' },
  },
  {
    id: 'control', kind: 'partner',
    name: L('Соисполнитель: управление и ЧПУ', 'Co-executor: control and CNC'),
    role: L('Разработчик ЧПУ или приводов: интерфейс реального времени, пределы коррекции', 'A CNC or drive developer: real-time interface and correction limits'),
    evidenceIds: ['machine-tools-control'],
    status: L('Закрывает разрыв', 'Covers a gap'),
    roles: { requirements: '', sensing: '', physics: '', prediction: '', correction: 'R', trials: 'C', series: '', market: 'C', people: '' },
  },
  {
    id: 'data', kind: 'partner',
    name: L('Соисполнитель: данные, ИИ и датчики', 'Co-executor: data, AI and sensors'),
    role: L('Университет или институт с группой машинного обучения и сенсорики', 'A university or institute with machine-learning and sensing teams'),
    evidenceIds: ['ai-data', 'condition-monitoring'],
    status: L('Закрывает разрыв', 'Covers a gap'),
    roles: { requirements: '', sensing: 'C', physics: '', prediction: 'R', correction: '', trials: 'C', series: '', market: '', people: 'C' },
  },
  {
    id: 'site', kind: 'partner',
    name: L('Соисполнитель: площадка серийных испытаний', 'Co-executor: series test site'),
    role: L('Завод-потребитель или метрологический центр: серия деталей и независимое измерение', 'A user plant or metrology centre: a parts series and independent measurement'),
    evidenceIds: [],
    status: L('Можно заменить ЦКП', 'Could be replaced by the shared facility'),
    roles: { requirements: 'C', sensing: 'C', physics: '', prediction: '', correction: '', trials: '', series: 'R', market: '', people: 'C' },
  },
];

// Proposed internal schedule; only the window dates are set by the call.
export const PISH_BET_TIMELINE = [
  { id: 'decide', date: '2026-10-07', official: false, gate: false, label: L('Решение о ставке и рабочей группе', 'Decide the bet and the working group') },
  { id: 'open', date: '2026-10-05', official: true, gate: false, label: L('Открыт приём заявок', 'Applications open') },
  { id: 'shortlist', date: '2026-10-17', official: false, gate: false, label: L('Короткий список заказчиков; запрос оператору по п. 3.4 и 7.1', 'Customer shortlist; ask the operator about §§3.4 and 7.1') },
  { id: 'go', date: '2026-10-31', official: false, gate: true, label: L('Ворота «идём / не идём»: письмо заказчика, главный конструктор, две платформы', 'Go / no-go gate: customer letter, chief designer, two platforms') },
  { id: 'consortium', date: '2026-11-14', official: false, gate: false, label: L('Соглашения с соисполнителями, финансовая модель 2027–2034', 'Co-executor agreements, 2027–2034 financial model') },
  { id: 'sign', date: '2026-11-25', official: false, gate: false, label: L('Подписаны совместный проект и программа ПИШ', 'Joint project and school programme signed') },
  { id: 'submit', date: '2026-12-01', official: true, gate: true, label: L('Подача в ИС «ПИШ» до 23:59 мск', 'Submit in the PISH system by 23:59 Moscow time') },
].sort((a, b) => a.date.localeCompare(b.date));

export const PISH_BET_RISKS = [
  {
    id: 'customer',
    risk: L('Нет заказчика с бюджетом на НИОКР', 'No customer with an R&D budget'),
    signal: L('К 31 октября нет письма о софинансировании', 'No co-financing letter by 31 October'),
    response: L('Не подавать слабую заявку; перейти к запасному варианту', 'Do not file a weak application; switch to the fallback'),
  },
  {
    id: 'overlap',
    risk: L('Эксперты увидят пересечение с действующей ПИШ', 'Experts see overlap with the existing school'),
    signal: L('Инструмент или узел оказывается предметом разработки', 'A tool or component becomes the development object'),
    response: L('Инструмент — только объект испытаний; таблица границ; раздельный учёт РИД', 'Tools only as test objects; a boundary table; separate IP records'),
  },
  {
    id: 'cnc',
    risk: L('Нет доступа к управлению станком', 'No access to machine control'),
    signal: L('Разработчик ЧПУ не открывает интерфейс коррекции', 'The CNC developer will not open a correction interface'),
    response: L('Первая платформа — «АксиОМА Контрол», вторая — ЧПУ заказчика', 'First platform: AxiOMA Control; second: the customer’s CNC'),
  },
  {
    id: 'science',
    risk: L('Слабая база по управлению и ИИ', 'A weak base in control and AI'),
    signal: L('Нет общих статей, кода и данных с партнёром', 'No joint papers, code or data with the partner'),
    response: L('Соисполнитель с подтверждённой группой; совместные публикации и гранты к 2028 году', 'A co-executor with a proven team; joint papers and grants by 2028'),
  },
  {
    id: 'novelty',
    risk: L('Новизна не доказана', 'Novelty not established'),
    signal: L('Результат повторяет CIRP 2023 или IEEE Access 2024', 'The result repeats CIRP 2023 or IEEE Access 2024'),
    response: L('Вклад — перенос между станками и безопасная коррекция с проверенным интервалом', 'Contribute transfer between machines and safe correction with tested intervals'),
  },
  {
    id: 'facility',
    risk: L('ЦКП не поддержат', 'The shared facility is not approved'),
    signal: L('Отрицательное решение по заявке ЦКП', 'A negative decision on the facility application'),
    response: L('Заложить оборудование заказчика и площадки испытаний', 'Plan with customer and test-site equipment'),
  },
  {
    id: 'founder',
    risk: L('Вопрос о рекомендации учредителя', 'Founding-authority recommendation'),
    signal: L('Оператор подтверждает, что рекомендация нужна', 'The operator confirms a recommendation is required'),
    response: L('Показать выводы из работы действующей ПИШ и продуктовое управление новой', 'Show lessons from the existing school and product-led management of the new one'),
  },
];

// Context for the funding chart: an institution-wide reported figure, used only
// for scale. It is a different perimeter from the Annex 10 indicator.
export const PISH_BET_FUNDING_CONTEXT = {
  value: 586.2,
  year: 2025,
  label: L('Все поступления СТАНКИН от НИОКР, услуг и производственных работ, 2025', 'All STANKIN receipts from R&D, services and production work, 2025'),
  note: L('Самообследование 2026 года, с. 241. Другой контур: сравнение показывает масштаб, а не долю.', '2026 self-assessment, p. 241. A different perimeter: the comparison shows scale, not a share.'),
  sourceId: 'self-assessment-2025-finance',
};
