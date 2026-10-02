// Public evidence reviewed on 2026-10-02. Competition minimums were checked
// against the rendered original of Annex 10, PDF pages 68–71, not OCR alone.
// This page is an application concept for discussion, not an approved school,
// industrial commitment, official application score, or validated prototype.

export const PISH_REVIEWED_AT = '2026-10-02';

export const PISH_SOURCES = [
  {
    id: 'pish-call-2026',
    title: { ru: 'Минобрнауки: объявление отбора ПИШ 2026 и методические рекомендации', en: 'Ministry: 2026 Advanced Engineering Schools call and application guidelines' },
    url: 'https://www.minobrnauki.gov.ru/documents/?ELEMENT_ID=101744',
    section: { ru: 'Объявление; рекомендации, пп. 3.3–3.4, 4, 5.2, 6, 7.1, 12–13; приложение 10', en: 'Announcement; guidelines §§3.3–3.4, 4, 5.2, 6, 7.1, 12–13; Annex 10' },
  },
  {
    id: 'pish-order-2026',
    title: { ru: 'Минобрнауки: приказ от 25 сентября 2026 года № 784 о проведении отбора', en: 'Ministry: Order No. 784 of 25 September 2026 launching the selection' },
    url: 'https://www.minobrnauki.gov.ru/documents/?ELEMENT_ID=101719',
    section: { ru: 'Основание нового отбора ПИШ', en: 'Legal basis of the new Advanced Engineering Schools selection' },
  },
  {
    id: 'stankin-pish-results-2025',
    title: { ru: 'СТАНКИН: публичные результаты ПИШ «Технологическая база машиностроения» за 2025 год', en: 'STANKIN: published 2025 results of the existing engineering school' },
    url: 'https://stankin.ru/news/stankin-voshel-v-tretyu-gruppu-reytinga-pish/',
    section: { ru: 'Новости университета, 3 марта 2026 года', en: 'University news, 3 March 2026' },
  },
  {
    id: 'stankin-strategy',
    title: { ru: 'Стратегия МГТУ «СТАНКИН»: средства производства, автоматизация и внедрение', en: 'STANKIN strategy: production equipment, automation and deployment' },
    url: 'https://stankin.ru/about/strategiya/strategiya-universiteta/',
  },
  {
    id: 'cirp-adaptive-2023',
    title: { ru: 'CIRP: оптимизация подачи через физическую модель и данные, 2023', en: 'CIRP: feedrate optimisation with a physics-based and data-driven twin, 2023' },
    url: 'https://doi.org/10.1016/j.cirp.2023.04.063',
  },
  {
    id: 'ieee-uncertainty-2024',
    title: { ru: 'IEEE Access: оптимизация подачи с учётом неопределённости в модели прогнозирующего управления, 2024', en: 'IEEE Access: feedrate optimisation with uncertainty-aware model predictive control, 2024' },
    url: 'https://doi.org/10.1109/ACCESS.2024.3384471',
    publisher: 'Kim, Kontar, Okwudire · IEEE Access 12, 49947–49961',
    year: 2024,
  },
  {
    id: 'cirp-metrology-2019',
    title: { ru: 'CIRP: метрология поверхности на станке и внутри процесса, 2019', en: 'CIRP: on-machine and in-process surface metrology, 2019' },
    url: 'https://doi.org/10.1016/j.cirp.2019.05.005',
  },
  {
    id: 'nist-twins',
    title: { ru: 'NIST: цифровые двойники, валидация и неопределённость в производстве', en: 'NIST: manufacturing digital twins, validation and uncertainty' },
    url: 'https://www.nist.gov/programs-projects/digital-twins-advanced-manufacturing',
  },
  {
    id: 'cirp-machinability-2024',
    title: { ru: 'CIRP IMPACT: совместная оценка материала, инструмента, станка и процесса, 2024', en: 'CIRP IMPACT: evaluating the material–tool–machine–process system, 2024' },
    url: 'https://doi.org/10.1016/j.cirpj.2024.02.008',
  },
  {
    id: 'cirp-sustainable-2024',
    title: { ru: 'CIRP: ресурсная эффективность обработки, 2024', en: 'CIRP: sustainable machining, 2024' },
    url: 'https://doi.org/10.1016/j.cirp.2024.06.001',
  },
  {
    id: 'effra-sria',
    title: { ru: 'Made in Europe: исследовательская повестка производства до 2030 года', en: 'Made in Europe: manufacturing research agenda towards 2030' },
    url: 'https://effra.eu/wp-content/uploads/2023/12/made_in_europe-sria.pdf',
  },
];

export const PISH_REQUIREMENTS = [
  {
    id: 'submission-window',
    label: { ru: 'Приём заявок', en: 'Application window' },
    value: '05.10–01.12.2026',
    detail: { ru: 'Заявки принимают с 5 октября, 09:00 мск, до 1 декабря, 23:59 мск. Подать заявку нужно через ИС «ПИШ» на engineers2030.ru.', en: 'Applications open on 5 October at 09:00 Moscow time and close on 1 December at 23:59. Submit through the PISH system at engineers2030.ru.' },
    sourceIds: ['pish-call-2026', 'pish-order-2026'],
  },
  {
    id: 'one-application',
    label: { ru: 'Заявка и квалифицированный заказчик', en: 'Application and qualified industrial customer' },
    value: '1 + 1',
    detail: { ru: 'Университет подаёт одну заявку с одной высокотехнологичной компанией — квалифицированным заказчиком. Компания отвечает за готовый продукт, его внедрение, выпуск и продажу.', en: 'The university submits one application with one high-tech company as the qualified customer. The company is responsible for the finished product, deployment, production and sales.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'separate-school',
    label: { ru: 'Для университета с действующей ПИШ', en: 'For a university with an existing school' },
    value: '3.4',
    detail: { ru: 'Новая ПИШ должна стать обособленным структурным подразделением. По п. 3.4 её научно-технологическое решение и предмет разработки должны отличаться от действующей школы. В совместном проекте нужно объяснить, какой другой продукт создаёт новая школа и какую техническую задачу он решает.', en: 'The new school must be a separate university unit. Section 3.4 requires a different scientific and technological solution and development object from the existing school. The joint project must explain what different product the new school will create and what technical problem it solves.' },
    sourceIds: ['pish-call-2026', 'stankin-pish-results-2025'],
  },
  {
    id: 'company-cofinance',
    label: { ru: 'Обязательство компании по софинансированию', en: 'Company co-financing commitment' },
    value: '≥50%',
    detail: { ru: 'Компания должна вложить не менее 50% суммы бюджетных средств на совместный проект и развитие ПИШ. Это обязательство отличается от годового показателя внебюджетного финансирования в приложении 10: их нужно считать отдельно.', en: 'The company must contribute at least 50% of the budget funding for the joint project and school development. This commitment differs from the annual extra-budgetary funding indicator in Annex 10. Calculate them separately.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'cooperation-weight',
    label: { ru: 'Полнота, обоснованность и управление кооперацией', en: 'Completeness, justification and management of cooperation' },
    value: '40%',
    detail: { ru: 'В рекомендациях на оценку кооперации отведено 40%. Эксперты смотрят, зачем нужны партнёры и как организована совместная работа. Если соисполнителей нет, нужно объяснить, почему университет и компания справятся сами. Сравнение тем на сайте — наше предложение для обсуждения; баллы конкурса оно не рассчитывает.', en: 'The guidelines give cooperation a 40% assessment weight. Experts examine why partners are needed and how they will work together. Without co-executors, explain why the university and company can deliver on their own. This website compares topics for discussion; it does not calculate competition scores.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'cooperation-size',
    label: { ru: 'Участники кооперации — соисполнители', en: 'Cooperation participants — co-executors' },
    value: '≤5',
    detail: { ru: 'Не более пяти организаций, включая головной университет. Для каждого соисполнителя нужно указать задачу, людей, оборудование и результат, за который он отвечает.', en: 'No more than five organisations, including the lead university. For each co-executor, name the task, people, equipment and result they will be responsible for.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'two-documents',
    label: { ru: 'Совместный проект и программа школы', en: 'Joint project and school development programme' },
    value: '2 / ≥5',
    detail: { ru: 'Университет и компания подписывают два документа: совместный проект по созданию высокотехнологичного продукта и программу развития ПИШ. Программу составляют минимум на пять лет.', en: 'The university and company sign two documents: a joint project to create a high-tech product and a school development programme. The programme must cover at least five years.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'company-history',
    label: { ru: 'Инвестиции компании в НИОКР', en: 'Company R&D investment history' },
    value: '3',
    detail: { ru: 'Компания должна подтвердить, что вкладывала деньги в исследования и опытно-конструкторские работы за последние три года.', en: 'The company must provide evidence of investment in research and development over the last three years.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'chief-designer',
    label: { ru: 'Главный конструктор', en: 'Chief designer' },
    value: '1',
    detail: { ru: 'Руководитель университета назначает сотрудника ПИШ по согласованию с компанией. Главный конструктор руководит разработкой, связывает работу команд и отвечает за технические показатели продукта.', en: 'The university head appoints a school employee in agreement with the company. The chief designer leads development, coordinates the teams and is responsible for the product’s technical performance.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'financial-sustainability',
    label: { ru: 'Финансовая устойчивость', en: 'Financial sustainability' },
    value: '2027–2034',
    detail: { ru: 'В финансовой модели нужно показать, откуда поступают деньги и на что их тратит каждый соисполнитель. В таблице приложения 10 бюджетное финансирование после 2029 года не предусмотрено. В заявке нужно объяснить, за счёт чего школа и проект будут работать дальше.', en: 'The financial model must show where the money comes from and how each co-executor spends it. Annex 10 provides no budget funding after 2029. Explain how the school and project will continue to operate.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'founder-clarification',
    label: { ru: 'Уточнение по рекомендации учредителя', en: 'Clarify the founding authority recommendation' },
    value: '3.4 / 7.1',
    detail: { ru: 'В п. 3.4 требуется рекомендация учредителя с учётом результатов действующей ПИШ. В перечне документов п. 7.1 есть исключение для вузов Минобрнауки и Правительства РФ. У оператора нужно письменно уточнить, нужна ли такая рекомендация для новой заявки СТАНКИН.', en: 'Section 3.4 requires a founding authority recommendation based on the existing school’s results. The document list in §7.1 exempts universities founded by the Ministry or Russian Government. Ask the operator for written confirmation of whether STANKIN needs this recommendation for its new application.' },
    sourceIds: ['pish-call-2026'],
  },
];

const years = [2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034];
const valuesByYear = values => Object.fromEntries(years.map((year, index) => [year, values[index]]));
const cumulative = { ru: 'Нарастающий итог: результат с начала программы к выбранному году. Минимум установлен конкурсом.', en: 'Cumulative total: the result from the start of the programme up to the selected year. The minimum is set by the competition.' };

// Annex 10 contains three results and twelve characteristics. null means
// explicitly not applicable because budget funding is not envisaged, not zero.
export const PISH_MINIMUMS = [
  {
    id: 'development-programme',
    label: { ru: 'Реализованная программа развития ПИШ', en: 'School development programme implemented' },
    unit: { ru: 'ед.', en: 'units' },
    values: valuesByYear([1, 1, 1, 1, 1, 1, 1, 1]),
    note: { ru: 'Результат за выбранный год.', en: 'Result for the selected year.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'staff-development',
    label: { ru: 'ППС и управленческие команды: повышение квалификации и переподготовка', en: 'Faculty and management: professional development and retraining' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([25, 50, 75, 90, 105, 120, 135, 150]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'masters-placements',
    label: { ru: 'Студенты технологической магистратуры, прошедшие практики и стажировки', en: 'Technology master’s students completing placements and internships' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([13, 19, 25, 25, 25, 25, 25, 25]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'new-programmes',
    label: { ru: 'Новые программы ВО и ДПО с интерактивными комплексами подготовки', en: 'New degree and continuing education programmes with interactive training systems' },
    unit: { ru: 'ед.', en: 'units' },
    values: valuesByYear([2, 4, 6, 8, 10, 10, 10, 10]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'network-enrolment-growth',
    label: { ru: 'Рост числа обучающихся за счёт сетевой формы в вузах без ПИШ', en: 'Enrolment growth through network delivery at universities without a school' },
    unit: { ru: '%', en: '%' },
    values: valuesByYear([37.5, 52, 62, 68, 75, 90, 103, 109]),
    note: { ru: 'Рост в процентах по приложению 10. В заявке нужно указать, с каким исходным значением сравниваем и как считаем.', en: 'Percentage growth from Annex 10. In the application, state the baseline and how growth is calculated.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'engineers-continuing-education',
    label: { ru: 'Инженеры, обученные по программам ДПО', en: 'Engineers completing continuing education' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([25, 50, 75, 100, 125, 150, 175, 200]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'graduates-employed',
    label: { ru: 'Обученные, трудоустроившиеся в российские высокотехнологичные компании и предприятия', en: 'Trained learners employed by Russian high-tech companies and enterprises' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([25, 67, 117, 250, 320, 380, 450, 507]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'educational-spaces',
    label: { ru: 'Специальные образовательные пространства', en: 'Specialised educational spaces' },
    unit: { ru: 'ед.', en: 'units' },
    values: valuesByYear([2, 3, 4, 5, 6, 7, 7, 7]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'extra-budgetary-ratio',
    label: { ru: 'Отношение внебюджетных средств к федеральному финансированию программы', en: 'Extra-budgetary funding relative to federal programme funding' },
    unit: { ru: '%', en: '%' },
    values: valuesByYear([35, 25, 20, null, null, null, null, null]),
    note: { ru: 'С 2030 года — не применимо: бюджетное финансирование не предусмотрено. Показатель считают за год. Обязательство компании вложить ≥50% считают отдельно.', en: 'From 2030: not applicable because budget funding is not provided. This indicator is calculated for each year. The company’s ≥50% contribution commitment is calculated separately.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'business-rnd',
    label: { ru: 'Финансирование исследований и разработок в интересах бизнеса', en: 'Funding attracted for business-oriented research and development' },
    unit: { ru: 'млн ₽', en: 'RUB million' },
    values: valuesByYear([83.3, 153.3, 273.7, 533.3, 800, 1066.7, 1366.7, 1500]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'registered-ip-growth',
    label: { ru: 'Рост числа регистрируемых результатов интеллектуальной деятельности вуза', en: 'Growth in the university’s registered intellectual property results' },
    unit: { ru: '%', en: '%' },
    values: valuesByYear([20, 25, 30, 36, 43, 49, 53, 55]),
    note: { ru: 'Рост в процентах по приложению 10. В заявке нужно указать, с каким исходным значением сравниваем и как считаем.', en: 'Percentage growth from Annex 10. In the application, state the baseline and how growth is calculated.' },
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'extra-curricular-placements',
    label: { ru: 'Технологические магистранты: практики и стажировки вне образовательного процесса', en: 'Technology master’s students: extracurricular placements and internships' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([15, 23, 30, 37, 45, 54, 62, 70]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'school-pupils',
    label: { ru: 'Школьники, участвующие в ранней профориентации', en: 'School pupils participating in early career guidance' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([250, 500, 750, 1000, 1250, 1500, 1750, 2000]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'learners-degree-and-continuing',
    label: { ru: 'Прошедшие обучение по программам ВО и ДПО', en: 'People completing degree and continuing education programmes' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([50, 75, 100, 125, 150, 175, 200, 230]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
  {
    id: 'youth-professional-development',
    label: { ru: 'Молодёжь, вовлечённая в проекты профессионального развития', en: 'Young people involved in professional development projects' },
    unit: { ru: 'чел.', en: 'people' },
    values: valuesByYear([100, 300, 500, 700, 900, 1300, 1650, 2000]),
    note: cumulative,
    sourceIds: ['pish-call-2026'],
  },
];

export const PISH_CANDIDATES = [
  {
    id: 'ai',
    title: { ru: 'ИИ в машиностроении', en: 'AI for mechanical engineering' },
    // Quantified foundation; supporting groups are shown separately and are
    // not silently added to the displayed publication count.
    competencyIds: ['ai-data'],
    supportingCompetencyIds: ['digital-manufacturing', 'modeling-mechanics', 'software-it'],
    recommended: false,
    basis: { ru: 'В группу «ИИ и данные» попадают и ИИ, и обычная обработка данных, изображений и сигналов. Сколько здесь работ именно по ИИ для станков, нужно проверить по статьям. Считать это сильной стороной СТАНКИН пока рано.', en: 'The “AI and data” group includes AI as well as conventional data, image and signal processing. The papers need checking to establish how many concern machine-tool AI. It is too early to call this a STANKIN strength.' },
    trend: { ru: 'Доля работ по ИИ и цифровому производству в мировой науке растёт. Но в эту группу входят задачи из многих отраслей, включая те, которые не связаны со станками.', en: 'AI and digital manufacturing account for a growing share of world research. These groups include tasks from many industries, some unrelated to machine tools.' },
    product: { ru: 'ИИ-модуль для выбранной задачи: предсказать износ, найти неисправность, проверить результат или подготовить технологический процесс.', en: 'An AI module for a chosen task: predict wear, detect a fault, check the result or plan a manufacturing process.' },
    distinction: { ru: '«ИИ в машиностроении» — слишком широкая тема для заявки. Нужно выбрать один продукт для заказчика и показать, чем он отличается от разработок действующей ПИШ.', en: '“AI for mechanical engineering” is too broad for the application. Choose one product for the customer and show how it differs from the existing school’s developments.' },
    gaps: { ru: 'Для ИИ нужны команда, данные и испытания. Сначала стоит проверить статьи и опыт людей, затем выбрать задачу и партнёра. Ещё нужны заказчик, режим для сравнения и порядок приёмки. Заявка ЦКП рассматривается; рассчитывать на его инфраструктуру можно только условно.', en: 'AI needs a team, data and trials. First check the papers and people’s experience, then choose a task and partner. A customer, comparison baseline and acceptance procedure are also needed. The shared facility application is under review; its infrastructure remains conditional.' },
    verdict: { ru: 'Развивать ИИ для выбранного продукта. Для самой школы выбрать конкретную инженерную задачу.', en: 'Develop AI for the selected product. Choose a specific engineering task for the school itself.' },
    sourceIds: ['nist-twins', 'stankin-strategy', 'pish-call-2026'],
  },
  {
    id: 'adaptive',
    title: { ru: 'Инженерия интеллектуальных станков и автономной точной обработки', en: 'Engineering intelligent machine tools and autonomous precision machining' },
    competencyIds: ['machining', 'metrology-quality', 'coatings-tribology'],
    supportingCompetencyIds: ['ceramics-composites', 'metals-alloys', 'ai-data', 'condition-monitoring', 'machine-tools-control'],
    recommended: true,
    basis: { ru: 'В СТАНКИН есть работы по резанию, инструменту, метрологии, материалам и покрытиям. Для диагностики и управления нужно проверить, кто возьмётся за задачу и на каком оборудовании её можно испытать.', en: 'STANKIN has papers on machining, tooling, metrology, materials and coatings. For diagnostics and control, check who can take on the task and what equipment is available for trials.' },
    trend: { ru: 'Мировые исследования связывают измерение, прогноз и коррекцию обработки с проверкой качества детали. Мы выбрали эту цепочку по научным работам и исследовательским программам. Рейтинг её публикаций среди всех мировых направлений не рассчитывался.', en: 'World research links measurement, prediction and machining correction to part-quality checks. We selected this chain from research papers and programmes. Its publication volume has not been ranked against all world research directions.' },
    product: { ru: 'Система для отечественного станка: оценивает состояние инструмента, даёт прогноз качества вместе с интервалом, меняет разрешённые параметры обработки. Качество готовой детали проверяют независимо.', en: 'A system for a domestic machine tool: estimate tool condition, predict quality with an uncertainty interval, and adjust permitted machining parameters. Check the finished part’s quality independently.' },
    distinction: { ru: 'Предлагаем систему, которую можно перенести с одного станка на другой и проверить на производстве. В заявке нужно показать, чем этот продукт отличается от инструмента, оборудования и производственных проектов действующей ПИШ.', en: 'We propose a system that can transfer between machines and be tested in production. The application must show how this product differs from the existing school’s tooling, equipment and production projects.' },
    gaps: { ru: 'Нужны квалифицированный заказчик, главный конструктор и две станочные платформы. Нужно согласовать пределы коррекции и приёмку. «Умный станок» уже известен: научную новизну своего решения нужно показать сравнением с работами CIRP 2023 и IEEE Access 2024. Статьи СТАНКИН ещё не доказывают, что такая система работает.', en: 'A qualified customer, chief designer and two machine platforms are needed. Agree correction limits and acceptance. Smart machine tools already exist as a research field: show what is scientifically new by comparing the proposed solution with the CIRP 2023 and IEEE Access 2024 papers. STANKIN papers alone do not prove that such a system works.' },
    verdict: { ru: 'Предварительно рекомендуем эту тему ПИШ. До окончательного выбора нужно договориться о продукте, обязательствах заказчика и отличии от действующей школы.', en: 'We provisionally recommend this school topic. Before making the final choice, agree the product, customer commitments and difference from the existing school.' },
    sourceIds: ['cirp-adaptive-2023', 'ieee-uncertainty-2024', 'cirp-metrology-2019', 'nist-twins', 'effra-sria', 'stankin-pish-results-2025', 'pish-call-2026'],
  },
  {
    id: 'tooling',
    title: { ru: 'Функциональный инструмент, материалы и покрытия', en: 'Functional tooling, materials and coatings' },
    competencyIds: ['coatings-tribology', 'ceramics-composites', 'metals-alloys', 'additive-manufacturing'],
    supportingCompetencyIds: ['machining', 'laser-edm-plasma'],
    recommended: false,
    basis: { ru: 'У СТАНКИН много работ по материалам, покрытиям и аддитивным технологиям. На средний FWCI ранних работ по покрытиям влияют отдельные статьи. Поэтому нужно смотреть оба пятилетия и долю высокоцитируемых работ.', en: 'STANKIN has many papers on materials, coatings and additive manufacturing. Individual papers affect the mean FWCI of early coatings work. Examine both five-year periods and the share of highly cited papers.' },
    trend: { ru: 'Мировая доля работ по покрытиям почти не изменилась. Новый инструмент стоит оценивать по тому, сколько он работает, какое качество даёт и сколько стоит изготовленная годная деталь.', en: 'The world publication share of coatings has changed little. Judge a new tool by its working life, the quality it delivers and the cost per accepted part.' },
    product: { ru: 'Инструмент для выбранного материала и операции. В испытаниях нужно подтвердить его ресурс, качество поверхности и стоимость обработки.', en: 'A tool for a chosen material and operation. Trials must confirm its working life, surface quality and machining cost.' },
    distinction: { ru: 'Действующая ПИШ уже разрабатывает режущий инструмент. Для новой школы нужен другой продукт и другое техническое решение; это различие нужно показать в заявке.', en: 'The existing school already develops cutting tools. A new school needs a different product and technical solution, and the application must show this difference.' },
    gaps: { ru: 'Нужны заказчик, испытания в сравнении с обычным инструментом и проверка новизны. По одним цитированиям нельзя решить, сколько денег вкладывать в направление.', en: 'A customer, trials against existing tooling and a novelty check are needed. Citations alone cannot determine how much to invest in the field.' },
    verdict: { ru: 'Включить инструмент и покрытия в проект интеллектуальной обработки. Отдельную школу выбирать, только если найдены новый продукт и заказчик, а задачи не повторяют действующую ПИШ.', en: 'Include tooling and coatings in the intelligent machining project. Choose a standalone school only with a new product and customer, and tasks that do not repeat the existing school’s work.' },
    sourceIds: ['cirp-machinability-2024', 'cirp-sustainable-2024', 'stankin-pish-results-2025', 'pish-call-2026'],
  },
];
