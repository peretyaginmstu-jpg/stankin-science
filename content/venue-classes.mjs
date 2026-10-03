// Классы площадок публикаций для сравнения цитирования. Правила открытые и приблизительные:
// класс определяется по названию источника, издателю, языку работы и префиксу DOI.
// Порядок важен: срабатывает первое подходящее правило (см. src/lib/bet-evidence.mjs → venueClass).

// Массовые сборники трудов конференций и «материаловедческие» серии с быстрой публикацией.
export const MASS_PROCEEDINGS = /IOP Conference Series|Journal of Physics:? Conference Series|AIP Conference|MATEC|E3S Web|EPJ Web|Web of Conferences|Materials Science Forum|Solid State Phenomena|Key Engineering Materials|Defect and Diffusion Forum|Advanced Materials Research|Applied Mechanics and Materials/i;

// Переводные версии российских журналов (Pleiades, Allerton, Springer).
export const RU_TRANSLATED = /^(Russian Engineering Research|Refractories and Industrial Ceramics|Glass and Ceramics|Measurement Techniques|Journal of Machinery Manufacture and Reliability|Steel in Translation|Metallurgist|Russian Metallurgy|Inorganic Materials|Physics of Metals and Metallography|Technical Physics|Instruments and Experimental Techniques|Journal of Surface Investigation|Protection of Metals|Journal of Friction and Wear|Russian Journal of|Mechanics of Solids|Bulletin of the Russian Academy|Optoelectronics, Instrumentation|Automation and Remote Control|Doklady|Chemical and Petroleum Engineering|Russian Physics Journal|Physics of the Solid State|Crystallography Reports|Journal of Applied Mechanics and Technical Physics|Polymer Science|Russian Aeronautics|Russian Electrical Engineering|Thermal Engineering|Power Technology|Colloid Journal|Journal of Engineering Physics|Journal of Superhard Materials|Optics and Spectroscopy|Quantum Electronics|Journal of Communications Technology|Journal of Computer and Systems Sciences International|Programming and Computer Software|Pattern Recognition and Image Analysis|Mathematical Models and Computer Simulations|Computational Mathematics and Mathematical Physics|Russian Microelectronics|Nanobiotechnology Reports|Nanotechnologies in Russia|Plasma Physics Reports|Theoretical Foundations of Chemical Engineering|Physical Mesomechanics|Lobachevskii|Moscow University|Technical Physics Letters|Metal Science and Heat Treatment|Coke and Chemistry|CIS Iron|Physics of Atomic Nuclei|Kinetics and Catalysis|Semiconductors|Laser Physics|Journal of Mining|Powder Metallurgy and Metal Ceramics|Strength of Materials|Materials Science$)/i;
export const RU_TRANSLATED_PUBLISHER = /Pleiades|Allerton/i;

// Российские издатели: журналы без переводной версии.
export const RU_PUBLISHER = /Russia|Moscow|Stankin|Saint Petersburg|Tomsk|Ural|Novosibirsk|Siberian|Ioffe|Peoples|Omsk|Real Economics|National Research Nuclear/i;

// Сборники трудов и книжные серии (кроме массовых).
export const PROCEEDINGS_NAME = /Procedia|Lecture Notes|Proceedings|Conference|Symposium|Congress|Workshop/i;

// У части докладов OpenAlex не указывает источник; их выдаёт префикс DOI издателя.
export const PROCEEDINGS_DOI = /^10\.(1109|1117)\//; // IEEE, SPIE

export const VENUE_CLASSES = Object.freeze([
  { id: 'intl-journal', ru: 'Международные журналы', en: 'International journals' },
  { id: 'proceedings', ru: 'Сборники трудов и серии', en: 'Proceedings and book series' },
  { id: 'ieee-spie', ru: 'Доклады IEEE и SPIE', en: 'IEEE and SPIE proceedings' },
  { id: 'mass-proceedings', ru: 'Массовые сборники (IOP, AIP, MATEC, EPJ…)', en: 'Mass proceedings (IOP, AIP, MATEC, EPJ…)' },
  { id: 'ru-translated', ru: 'Переводные российские журналы', en: 'Translated Russian journals' },
  { id: 'ru-domestic', ru: 'Российские журналы без перевода', en: 'Russian journals without translation' },
  { id: 'other', ru: 'Источник не определён', en: 'Source not identified' },
]);
