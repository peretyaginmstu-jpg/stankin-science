// Editorial synthesis of primary research and manufacturing roadmaps, checked 2026-10-02.
// These mappings connect broad publication groups to research problems. They do not
// establish a STANKIN prototype, a closed-loop controller, or industrial readiness.
// No subjective score below is presented as a measured world rank or market forecast.

export const FRONTIER_SOURCES = [
  {
    id: 'cirp-adaptive-2023', year: 2023, kind: 'experimental-paper', publisher: 'CIRP Annals',
    title: 'Intelligent feedrate optimization using a physics-based and data-driven digital twin',
    url: 'https://doi.org/10.1016/j.cirp.2023.04.063',
    evidence: { ru: 'Эксперимент на прототипе ЧПУ связывает модель физики и данные датчиков с оптимизацией подачи при ограничении контурной ошибки.', en: 'A CNC prototype experiment combines physics and sensor data to optimise feedrate subject to contour-error constraints.' },
  },
  {
    id: 'cirp-metrology-2019', year: 2019, kind: 'keynote-review', publisher: 'CIRP Annals',
    title: 'On-machine and in-process surface metrology for precision manufacturing',
    url: 'https://doi.org/10.1016/j.cirp.2019.05.005',
    evidence: { ru: 'Обзор связывает измерения на станке, разделение ошибок, калибровку и прослеживаемость с обратной связью для компенсационной обработки.', en: 'The review connects on-machine measurement, error separation, calibration and traceability to feedback for compensation machining.' },
  },
  {
    id: 'nist-twins-2026', year: 2026, kind: 'research-programme', publisher: 'NIST',
    title: 'Digital Twins for Advanced Manufacturing',
    url: 'https://www.nist.gov/programs-projects/digital-twins-advanced-manufacturing',
    evidence: { ru: 'Программа развивает совместимые цифровые двойники, верификацию, валидацию и оценку неопределённости; проверяет реализации на испытательном стенде.', en: 'The programme develops interoperable digital twins, verification, validation and uncertainty quantification, with testbed reference implementations.' },
  },
  {
    id: 'cirp-sustainable-2024', year: 2024, kind: 'keynote-review', publisher: 'CIRP Annals',
    title: 'Sustainable machining: Recent technological advances',
    url: 'https://doi.org/10.1016/j.cirp.2024.06.001',
    openUrl: 'https://ebiltegia.mondragon.edu/xmlui/bitstream/handle/20.500.11984/6666/Sustainable%20machining%20Recent%20technological%20advances.pdf?isAllowed=y&sequence=1',
    evidence: { ru: 'Оценивает ресурсные и экологические последствия всей системы обработки: станок, материал, инструмент, СОЖ и жизненный цикл.', en: 'Assesses resource and environmental impacts of the complete machining system: machine, work material, tool, coolant and lifecycle.' },
  },
  {
    id: 'cirp-machinability-2024', year: 2024, kind: 'collaborative-review', publisher: 'CIRP Journal of Manufacturing Science and Technology',
    title: 'Review of current best-practices in machinability evaluation and understanding for improving machining performance',
    url: 'https://doi.org/10.1016/j.cirpj.2024.02.008',
    evidence: { ru: 'Проект CIRP IMPACT оценивает совместную работу материала, инструмента, станка и процесса через износ, силы, температуру и состояние поверхности.', en: 'The CIRP IMPACT project evaluates the combined workpiece–tool–machine–process system through wear, forces, temperature and surface integrity.' },
  },
  {
    id: 'effra-sria-2021', year: 2021, kind: 'research-roadmap', publisher: 'EFFRA / Made in Europe',
    title: 'Made in Europe Strategic Research and Innovation Agenda, October 2021',
    url: 'https://effra.eu/wp-content/uploads/2023/12/made_in_europe-sria.pdf',
    evidence: { ru: 'Повестка до 2030 включает бездефектное производство, ИИ, высокую точность, цифровые двойники, круговое использование ресурсов и человекоцентричность.', en: 'The agenda towards 2030 includes zero-defect manufacturing, AI, high precision, digital twins, circular resource use and human-centred innovation.' },
  },
  {
    id: 'fraunhofer-selforganisation', year: null, kind: 'research-programme', publisher: 'Fraunhofer IOSB',
    title: 'Agile production process control / self-organizing production',
    url: 'https://www.iosb.fraunhofer.de/en/business-units/automation-digitalization/flexible-production-value-chains/self-organization-flexible-production.html',
    evidence: { ru: 'Исследуется перестраиваемое производство с текущими состояниями оборудования и стандартными интерфейсами OPC UA / Asset Administration Shell.', en: 'Research addresses reconfigurable production using live equipment states and standard OPC UA / Asset Administration Shell interfaces.' },
  },
  {
    id: 'fraunhofer-safety-2026', year: 2026, kind: 'announced-research-project', publisher: 'Fraunhofer AISEC',
    title: 'KIbSIS: AI-based safety acknowledgment for machine tools',
    url: 'https://www.aisec.fraunhofer.de/en/media/press-releases/2026/ipcei-cis-projekt-kibsis-en.html',
    evidence: { ru: 'Проект 2025–2028 разрабатывает автоматические функции безопасности на основе доверенного ИИ; демонстратор заявлен на 2028 год, результат ещё не подтверждён.', en: 'The 2025–2028 project develops trustworthy AI safety functions; a demonstrator is planned for 2028 and is not yet a confirmed result.' },
  },
];

export const MAIN_VECTOR = {
  id: 'closed-loop-precision',
  status: 'synthesis',
  title: { ru: 'Приоритетный сквозной вектор: автономная точная обработка', en: 'Proposed integrating priority: autonomous precision machining' },
  short: { ru: 'Умный станок → автономная ячейка', en: 'Smart machine → autonomous cell' },
  description: { ru: 'Измерить → предсказать → скорректировать → подтвердить качество. Объединить материалы и инструмент, метрологию, модели и ИИ, управление станком и роботизацию в один проверяемый контур.', en: 'Measure → predict → correct → verify quality. Connect materials and tooling, metrology, models and AI, machine control and robotics in one testable loop.' },
  caveat: { ru: 'Это авторский синтез первичных источников, а не доказанный единственный мировой лидер по числу публикаций. Рост мировой литературы измеряется отдельно по тематическим группам.', en: 'This is an editorial synthesis of primary sources, not a proven single world leader by publication volume. Growth of the world literature is measured separately by topic group.' },
  mappingCaveat: { ru: 'Публикационная опора показывает близость научных тем. Наличие работ по метрологии, ИИ или покрытиям само по себе не доказывает замкнутое управление и готовый умный станок.', en: 'Publication support indicates thematic proximity. Papers on metrology, AI or coatings alone do not demonstrate closed-loop control or a working smart machine.' },
  sourceIds: ['cirp-adaptive-2023', 'cirp-metrology-2019', 'nist-twins-2026', 'effra-sria-2021'],
  gates: [
    { year: 2031, label: { ru: 'Сценарий: доказанный контур одного станка', en: 'Scenario: a validated loop on one machine' }, detail: { ru: 'Один материал и операция; сравнение с базовым режимом; измеримая точность, ресурс инструмента и время цикла; независимая приёмка детали.', en: 'One material and operation; comparison with a baseline; measured accuracy, tool life and cycle time; independently accepted part.' } },
    { year: 2036, label: { ru: 'Сценарий: масштабирование до автономной ячейки', en: 'Scenario: scale to an autonomous cell' }, detail: { ru: 'Перенос на семейство деталей; автоматическая смена инструмента и контроль; устойчивость к отказам, безопасность и подтверждённая работа без постоянного присутствия оператора.', en: 'Transfer to a part family; automated tool change and inspection; fault resilience, safety and verified operation without constant operator presence.' } },
  ],
};

export const FRONTIERS = [
  {
    id: 'adaptive-machining',
    name: { ru: 'Адаптивная обработка и управление станком', en: 'Adaptive machining and machine control' },
    short: { ru: 'Управлять', en: 'Control' },
    description: { ru: 'Корректировать подачу и режим по измеренному состоянию, сохраняя требуемую точность.', en: 'Adjust feedrate and process settings from measured state while maintaining required accuracy.' },
    competencyIds: ['machining', 'machine-tools-control', 'condition-monitoring', 'modeling-mechanics'],
    sourceIds: ['cirp-adaptive-2023', 'effra-sria-2021'],
    validation: { ru: 'Сравнение замкнутого контура с базовым режимом: ошибка, брак, время цикла.', en: 'Closed-loop versus baseline: error, scrap and cycle time.' },
  },
  {
    id: 'in-process-metrology',
    name: { ru: 'Метрология внутри процесса и компенсация ошибок', en: 'In-process metrology and error compensation' },
    short: { ru: 'Измерять', en: 'Measure' },
    description: { ru: 'Связать измерения на станке с компенсацией ошибок и прослеживаемым подтверждением качества.', en: 'Connect on-machine measurement to error compensation and traceable quality verification.' },
    competencyIds: ['metrology-quality', 'machine-tools-control', 'modeling-mechanics', 'condition-monitoring'],
    sourceIds: ['cirp-metrology-2019', 'nist-twins-2026'],
    validation: { ru: 'Неопределённость измерения; погрешность до и после компенсации; внешняя проверка.', en: 'Measurement uncertainty; error before and after compensation; independent verification.' },
  },
  {
    id: 'trustworthy-twins-ai',
    name: { ru: 'Проверяемые цифровые двойники и ИИ', en: 'Validated digital twins and AI' },
    short: { ru: 'Предсказывать', en: 'Predict' },
    description: { ru: 'Синхронизировать физическую модель с данными; проверять прогноз, неопределённость и перенос на новые режимы.', en: 'Synchronise a physics model with data; validate prediction, uncertainty and transfer to new operating conditions.' },
    competencyIds: ['digital-manufacturing', 'ai-data', 'modeling-mechanics', 'software-it'],
    sourceIds: ['nist-twins-2026', 'cirp-adaptive-2023'],
    validation: { ru: 'Прогноз на новых данных; границы применимости; задержка обновления; совместимость.', en: 'Prediction on unseen data; applicability limits; update latency; interoperability.' },
  },
  {
    id: 'functional-tooling',
    name: { ru: 'Инструмент, покрытия и материалы как единая система', en: 'Tools, coatings and materials as an integrated system' },
    short: { ru: 'Повышать ресурс', en: 'Extend tool life' },
    description: { ru: 'Оценивать покрытие через функцию в конкретной обработке: износ, температуру, стойкость и качество поверхности.', en: 'Assess a coating through its function in a specific operation: wear, temperature, tool life and surface integrity.' },
    competencyIds: ['coatings-tribology', 'machining', 'ceramics-composites', 'metals-alloys', 'laser-edm-plasma'],
    sourceIds: ['cirp-machinability-2024', 'cirp-sustainable-2024'],
    validation: { ru: 'Сравнимые испытания инструмента с покрытием и без него при одинаковой задаче обработки.', en: 'Comparable coated-versus-uncoated tool trials under the same machining task.' },
  },
  {
    id: 'resource-efficient-processing',
    name: { ru: 'Точность при меньшем расходе энергии и материалов', en: 'Precision with lower energy and material use' },
    short: { ru: 'Сокращать потери', en: 'Reduce losses' },
    description: { ru: 'Оптимизировать систему обработки и жизненный цикл, сохраняя качество; оценивать также инструмент и СОЖ.', en: 'Optimise the machining system and lifecycle while maintaining quality; include tools and coolants in the assessment.' },
    competencyIds: ['machining', 'coatings-tribology', 'additive-manufacturing', 'digital-manufacturing', 'forming-welding'],
    sourceIds: ['cirp-sustainable-2024', 'effra-sria-2021'],
    validation: { ru: 'Энергия и расход материалов на принятую деталь; ресурс инструмента; сопоставимый жизненный цикл.', en: 'Energy and material use per accepted part; tool life; comparable lifecycle boundaries.' },
  },
  {
    id: 'autonomous-cells',
    name: { ru: 'Автономные ячейки и самоперестраиваемое производство', en: 'Autonomous cells and reconfigurable production' },
    short: { ru: 'Объединять', en: 'Integrate' },
    description: { ru: 'Объединить станки, роботов, контроль и планирование через совместимые интерфейсы; подтвердить безопасную автономность.', en: 'Connect machines, robots, inspection and scheduling through interoperable interfaces; validate safe autonomy.' },
    competencyIds: ['robotics', 'digital-manufacturing', 'machine-tools-control', 'condition-monitoring', 'software-it'],
    sourceIds: ['fraunhofer-selforganisation', 'fraunhofer-safety-2026', 'effra-sria-2021'],
    validation: { ru: 'Длительность автономной работы; восстановление после сбоя; приёмка качества и безопасности.', en: 'Autonomous runtime; recovery after failure; quality and safety acceptance.' },
  },
];
