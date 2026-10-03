// Editorial, explicitly declared OpenAlex primary-topic perimeters. Neither is
// an official industrial classification or a complete census of machine tools.
// Broad competency classifiers must not be substituted for these topic IDs.
export const INDUSTRY_SCOPE_VERSION = 1;

const CORE = ['T10188', 'T11451'];
const ADJACENT = ['T11301', 'T13049', 'T10732', 'T11583', 'T12019', 'T11890', 'T12111',
  'T10377', 'T13470', 'T11138', 'T12362', 'T12427', 'T11799', 'T12106', 'T10626'];

export const INDUSTRY_SCOPES = [
  {
    id: 'core',
    name: { ru: 'Ядро: резание и электрофизическая обработка', en: 'Core: cutting and non-conventional machining' },
    note: {
      ru: 'Работы по резанию, электроэрозионной и электрохимической обработке. Конструирование станков, ЧПУ и другие виды оборудования эта первая версия не охватывает.',
      en: 'A narrow publication proxy for cutting, electrical-discharge and electrochemical machining. It is not the full sector: machine-tool design, CNC and other equipment are not covered.',
    },
    topicIds: [...CORE],
  },
  {
    id: 'extended',
    name: { ru: 'Расширение: качество, поверхность и измерения', en: 'Extended: quality, surfaces and measurement' },
    note: {
      ru: 'Ядро и смежные межотраслевые кластеры лазерной обработки, метрологии, зрения, покрытий и трения. Часть работ относится к другим отраслям; это проверка чувствительности к границе предметной области.',
      en: 'The core plus adjacent cross-industry clusters in laser processing, metrology, vision, coatings and friction. Some works concern other industries; this is a sensitivity check on the scope boundary.',
    },
    topicIds: [...CORE, ...ADJACENT],
  },
];

// Roles explain inclusion; actual cluster names always come from the snapshot.
export const INDUSTRY_TOPIC_ROLES = {
  T10188: 'cutting', T11451: 'non-conventional-machining', T11301: 'cross-industry-finishing',
  T13049: 'surface-quality', T10732: 'laser-processing', T11583: 'metrology',
  T12019: 'calibration', T11890: 'measurement-uncertainty', T12111: 'industrial-vision',
  T10377: 'metal-thin-film-mechanics', T13470: 'surface-treatment', T11138: 'lubrication',
  T12362: 'wear', T12427: 'alloy-wear', T11799: 'surface-interactions',
  T12106: 'residual-stress', T10626: 'high-temperature-coatings',
};

export const INDUSTRY_TOPIC_BASIS = {
  T10188: { ru: 'Описание OpenAlex подтверждает резание, износ инструмента, вибрации и параметры обработки.', en: 'The OpenAlex description identifies cutting, tool wear, chatter and machining parameters.' },
  T11451: { ru: 'Описание OpenAlex подтверждает электроэрозионную, проволочную и электрохимическую обработку.', en: 'The OpenAlex description identifies electrical-discharge, wire-EDM and electrochemical machining.' },
  T11301: { ru: 'Только расширение: описание преимущественно о химико-механической полировке для микроэлектроники, с частью ультраточной доводки.', en: 'Extended scope only: the description primarily concerns chemical-mechanical polishing for microelectronics, with some ultra-precision finishing.' },
  T13049: { ru: 'Шероховатость и измерения поверхности; смежный контроль качества.', en: 'Surface roughness and measurement; adjacent quality control.' },
  T10732: { ru: 'Лазерная обработка материалов; смежная технология, не только станки.', en: 'Laser material processing; an adjacent technology beyond machine tools.' },
  T11583: { ru: 'Метрология; межотраслевой обеспечивающий кластер.', en: 'Metrology; a cross-industry enabling cluster.' },
  T12019: { ru: 'Калибровка измерений; межотраслевое обеспечение точности.', en: 'Measurement calibration; cross-industry accuracy support.' },
  T11890: { ru: 'Неопределённость измерений; общая научная методология.', en: 'Measurement uncertainty; general scientific methodology.' },
  T12111: { ru: 'Промышленное зрение и дефекты; кластер разных производств.', en: 'Industrial vision and defects across manufacturing sectors.' },
  T10377: { ru: 'Механика металлов и тонких плёнок; шире покрытий режущего инструмента.', en: 'Metal and thin-film mechanics; wider than cutting-tool coatings.' },
  T13470: { ru: 'Поверхностная обработка и покрытия; применение в нескольких отраслях.', en: 'Surface treatment and coatings across multiple industries.' },
  T11138: { ru: 'Трение и смазка; применение в нескольких типах оборудования.', en: 'Friction and lubrication across equipment types.' },
  T12362: { ru: 'Износ и трибология; межотраслевой кластер.', en: 'Wear and tribology; a cross-industry cluster.' },
  T12427: { ru: 'Износ металлических сплавов; смежная материаловедческая база.', en: 'Metal-alloy wear; an adjacent materials-science foundation.' },
  T11799: { ru: 'Адгезия и взаимодействия поверхностей; шире инструментальной отрасли.', en: 'Adhesion and surface interactions beyond tooling.' },
  T12106: { ru: 'Поверхностная обработка и остаточные напряжения.', en: 'Surface treatment and residual stress.' },
  T10626: { ru: 'Высокотемпературные покрытия; включает аэрокосмическое применение.', en: 'High-temperature coatings, including aerospace applications.' },
};

export const INDUSTRY_SCOPE_LIMITATIONS = [
  'The perimeter is a declared, editable primary-topic proxy. Broad taxonomy clusters are not identical to the machine-tool industry; topic names alone do not verify every paper.',
  'Primary-topic descriptions were checked for the initial scope: T11301 is cross-industry CMP/finishing and belongs only to the extension; T12092 predominantly covers erosion in other sectors and is excluded.',
  'The narrow and extended scopes overlap by design and must never be added together.',
  'Full counting credits one retained institutional publication once within a scope, including collaborative publications. The source does not support author-level fractional weights.',
  'The index measures scientific publication presence, not teaching quality, a university rank, technology readiness, industrial demand or funding efficiency.',
  'FWCI already normalises publication year, document type and subfield; its four-year windows for recent publications remain nominally incomplete at the snapshot date.',
  'Bootstrap and Wilson intervals are descriptive under conditional publication independence. They do not correct scope, affiliation, classification or citation-exposure errors.',
];

export const INDUSTRY_SCOPE_NOTES = {
  ru: [
    'Граница — авторский редактируемый прокси по primary topics, а не официальная классификация или полный каталог отрасли. Название кластера не подтверждает профиль каждой статьи.',
    'Проверены описания исходных кластеров: T11301 преимущественно о CMP/доводке и включён только в расширение; T12092 преимущественно об эрозии в других отраслях и исключён.',
    'Ядро входит в расширение; складывать их показатели нельзя.',
    'Полный счёт: каждая работа с участием университета, включая совместную, учитывается один раз внутри периметра. Данных для авторских дробных весов в снимке нет.',
    'Индекс отражает научное публикационное присутствие, а не качество образования, мировой рейтинг, готовность технологии, промышленный спрос или эффективность финансирования.',
    'FWCI нормализован по году, типу документа и подполю; четырёхлетние окна свежих публикаций на дату снимка ещё неполны.',
    'Интервалы bootstrap/Wilson описательные и условны на независимости публикаций; они не исправляют ошибки аффилиации, разметки, границы области или цитатной экспозиции.',
  ],
  en: [...INDUSTRY_SCOPE_LIMITATIONS],
};

// Explicitly excluded from automatic core selection despite broad regex groups.
export const INDUSTRY_SCOPE_EXCLUSIONS = [
  { id: 'T12092', reason: { ru: 'Описание преимущественно об эрозии частицами в нефтегазовых объектах, трубопроводах и гидротурбинах; водоструйная обработка лишь часть кластера.', en: 'The description primarily covers particle erosion in oil/gas facilities, pipelines and hydro turbines; abrasive waterjet machining is only part of the cluster.' } },
  { id: 'T10892', reason: { ru: 'Бурение скважин, а не кластер металлорежущих станков.', en: 'Well engineering is not a metal-cutting machine-tool cluster.' } },
  { id: 'T12282', reason: { ru: 'Измельчение минералов, а не кластер металлорежущих станков.', en: 'Mineral grinding is not a metal-cutting machine-tool cluster.' } },
  { id: 'T10399', reason: { ru: 'Нефтегазовая разведка вне заявленного периметра.', en: 'Hydrocarbon exploration is outside the declared industry perimeter.' } },
  { id: 'T10635', reason: { ru: 'Гидроразрыв пластов вне заявленного периметра.', en: 'Hydraulic fracturing is outside the declared industry perimeter.' } },
  { id: 'T11801', reason: { ru: 'Разработка месторождений вне заявленного периметра.', en: 'Reservoir engineering is outside the declared industry perimeter.' } },
];

// Public OpenAlex API descriptions inspected on this date; paraphrases above
// record the inclusion decision without copying the complete source text.
export const INDUSTRY_TOPIC_REVIEWS = [
  { id: 'T10188', sourceURL: 'https://api.openalex.org/topics/T10188', checkedAt: '2026-10-03', decision: 'core' },
  { id: 'T11451', sourceURL: 'https://api.openalex.org/topics/T11451', checkedAt: '2026-10-03', decision: 'core' },
  { id: 'T11301', sourceURL: 'https://api.openalex.org/topics/T11301', checkedAt: '2026-10-03', decision: 'extended-only' },
  { id: 'T12092', sourceURL: 'https://api.openalex.org/topics/T12092', checkedAt: '2026-10-03', decision: 'excluded' },
];
