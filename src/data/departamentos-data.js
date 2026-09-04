// Base de Datos Estática con datos reales de los 17 Departamentos de Nicaragua

export const DEPARTAMENTOS_DATA = {
  managua: {
    slug: "managua",
    nombre: "Managua",
    apodo: "Capital de la República",
    cabecera: "Managua",
    region: "Pacífico",
    extension: "3,465 km²",
    poblacion: "~1,510,000 hab.",
    fundacion: "1819 (Elevada a Capital en 1852)",
    coordenadas: [-86.3, 12.1],
    imagenHero: "/images/departamentos/managua-hero.png",
    imagenCard: "/images/departamentos/managua-card.png",
    imagenReferencia: "/images/galeria-departamentos/managua/1.1.jpg",
    galeria: ["/images/galeria-departamentos/managua/2.jpg","/images/galeria-departamentos/managua/3.jpg","/images/galeria-departamentos/managua/4.jpg","/images/galeria-departamentos/managua/5.jpg","/images/galeria-departamentos/managua/6.webp","/images/galeria-departamentos/managua/7.jpg"],
    historia: {
      resumen: "Asentada sobre un histórico poblado precolombino a orillas del lago Xolotlán, Managua fue elevada a villa en 1819 y declarada capital de la nación en 1852 para resolver la disputa histórica entre León y Granada. Su centro urbano resurgió tras el devastador terremoto de 1972, transformándose en una metrópoli verde y descentralizada.",
      origenEtimologico: "Proveniente del Náhuatl 'Mana-ahuac', que traduce 'Junto al agua' o 'Lugar rodeado de grandes aguas', en referencia al Lago Xolotlán y sus numerosas lagunas cratéricas.",
      hitos: [
        { año: "1819", evento: "Es elevada al rango de Villa por Real Cédula del Rey Fernando VII." },
        { año: "1852", evento: "Se declara formalmente Capital de la República de Nicaragua para pacificar la rivalidad León-Granada." },
        { año: "1972", evento: "Devastador terremoto que redefinió la estructura urbana y dio origen a la metrópoli descentralizada actual." },
        { año: "2008", evento: "Construcción y apertura del Paseo Xolotlán y Puerto Salvador Allende, rescatando el malecón histórico." }
      ],
      personajes: [
        { nombre: "Salomón Ibarra Mayorga", titulo: "Poeta y Humanista (1887-1985)", aporte: "Autor de la hermosa letra del Himno Nacional de Nicaragua 'Salve a ti, Nicaragua'." },
        { nombre: "Alexis Argüello", titulo: "Trisoberano del Boxeo (1952-2009)", aporte: "Ídolo deportivo mundial y símbolo de disciplina, superación y nobleza nicaragüense." },
        { nombre: "Josefa Toledo de Aguerri", titulo: "Pionera de la Educación (1866-1962)", aporte: "Educadora insigne y primera gran defensora de los derechos civiles de la mujer." }
      ],
      patrimonio: [
        { sitio: "Huellas de Acahualinca", epoca: "Prehistórico (~6,000 a.C.)", desc: "Fósiles humanos y de fauna extinta petrificados en barro volcánico a orillas del Lago Xolotlán." },
        { sitio: "Antigua Catedral de Managua", epoca: "Neoclásico (1928)", desc: "Majestuosa estructura de acero traída de Bélgica que sobrevivió al gran terremoto de 1972." }
      ]
    },
    economia: {
      resumen: "Managua es el epicentro político, financiero, logístico e industrial del país. Concentra la sede de los principales bancos, organismos gubernamentales y empresas multinacionales.",
      sectores: [
        { titulo: "Comercio y Servicios", desc: "Principal generador de empleo formal con centros comerciales modernos y mercados populares." },
        { titulo: "Industria y Manufactura", desc: "Zonas francas, plantas procesadoras de alimentos, bebidas y textiles." },
        { titulo: "Logística y Transporte", desc: "Alberga el Aeropuerto Internacional Augusto C. Sandino y las principales terminales interurbanas." }
      ]
    },
    turismo: {
      resumen: "Ofrece un turismo urbano fascinante combinando cultura, historia revolucionaria, gastronomía y reservas naturales dentro de la ciudad.",
      atractivos: [
        { nombre: "Puerto Salvador Allende", desc: "Complejo turístico a orillas del Lago Xolotlán con restaurantes, paseos en barco y parque de atracciones." },
        { nombre: "Parque Histórico Loma de Tiscapa", desc: "Mirador panorámico con la icónica silueta del General Sandino y tirolesa urbana." },
        { nombre: "Paseo Xolotlán y Antigua Catedral", desc: "Réplicas a escala de la vieja Managua e historia de la arquitectura neoclásica." }
      ]
    },
    pasatiempos: {
      resumen: "Los managuas disfrutan de la vida nocturna, caminatas por los malecones, teatro, conciertos y su rica gastronomía urbana.",
      items: [
        "Pasear por el Malecón al atardecer probando quesillos y fritanga tradicional.",
        "Asistir a obras de teatro y recitales en el Teatro Nacional Rubén Darío.",
        "Explorar la oferta gastronómica y pubs de la Zona Hippos y Carretera a Masaya."
      ]
    },
    lugaresImportantes: [
      { nombre: "Teatro Nacional Rubén Darío", desc: "Uno de los teatros con mejor acústica de Latinoamérica.", imagen: "/images/departamentos/managua-teatro.png" },
      { nombre: "Laguna de Tiscapa", desc: "Reserva natural de origen cratérico en el centro geográfico de la ciudad.", imagen: "/images/departamentos/managua-tiscapa.png" },
      { nombre: "Catedral Metropolitana de la Inmaculada Concepción", desc: "Moderna catedral diseñada por el arquitecto Ricardo Legorreta.", imagen: "/images/departamentos/managua-catedral.png" }
    ],
    actividades: [
      { nombre: "Fiestas Patronales de Santo Domingo de Guzmán", fecha: "1 al 10 de Agosto", desc: "Tradicionales procesiones con los 'Chepes', vacas culonas y bailes folclóricos." },
      { nombre: "Festival Internacional de Jazz de Managua", fecha: "Marzo", desc: "Reunión de músicos nacionales e internacionales." }
    ]
  },

  leon: {
    slug: "leon",
    nombre: "León",
    apodo: "Ciudad Universitaria y Primera Capital",
    cabecera: "León",
    region: "Pacífico",
    extension: "5,138 km²",
    poblacion: "~420,000 hab.",
    fundacion: "1524 (León Viejo)",
    coordenadas: [-86.6, 12.4],
    imagenHero: "/images/departamentos/leon-hero.png",
    imagenCard: "/images/departamentos/leon-card.png",
    imagenReferencia: "/images/galeria-departamentos/leon/1.1.jpg",
    galeria: ["/images/galeria-departamentos/leon/2.jpg","/images/galeria-departamentos/leon/3.jpg","/images/galeria-departamentos/leon/4.jpg","/images/galeria-departamentos/leon/5.jpg","/images/galeria-departamentos/leon/6.jpg","/images/galeria-departamentos/leon/7.jpg"],
    historia: {
      resumen: "Fundada en 1524 por Francisco Hernández de Córdoba junto al lago Xolotlán. Tras una erupción del volcán Momotombo en 1610, la ciudad fue trasladada a su ubicación actual. Es la cuna intelectual de Nicaragua y hogar del insigne poeta Rubén Darío.",
      origenEtimologico: "Fundada originalmente en 1524 en Nagrando junto al lago Xolotlán y trasladada en 1610 al histórico asentamiento aborigen de Sutiaba.",
      hitos: [
        { año: "1524", evento: "Fundación de León Viejo (declarado Patrimonio de la Humanidad por UNESCO)." },
        { año: "1610", evento: "Traslado de la ciudad a su sitio actual tras el terremoto y erupción volcánica del Momotombo." },
        { año: "1812", evento: "Fundación de la UNAN-León, primera universidad de Nicaragua y referente centroamericano." },
        { año: "2011", evento: "La Real e Insigne Basílica Catedral es nombrada Patrimonio de la Humanidad por la UNESCO." }
      ],
      personajes: [
        { nombre: "Rubén Darío", titulo: "Príncipe de las Letras Castellanas (1867-1916)", aporte: "Padre del Modernismo literario universal que revolucionó la lengua española en América y Europa." },
        { nombre: "Miguel Larreynaga", titulo: "Prócer de la Independencia (1772-1847)", aporte: "Jurista, filósofo y diplomático clave en la firma de la Independencia de Centroamérica en 1821." },
        { nombre: "Alfonso Cortés", titulo: "Poeta de las Metafísicas (1893-1969)", aporte: "Genio lírico que escribió sus versos universales desde su estancia en la Casa de los Leones." }
      ],
      patrimonio: [
        { sitio: "Basílica Catedral de León", epoca: "Barroco-Neoclásico (1747-1814)", desc: "Patrimonio de la Humanidad UNESCO. La catedral más monumental de Centroamérica y tumba de Rubén Darío." },
        { sitio: "Ruinas de León Viejo", epoca: "Colonial (1524)", desc: "Patrimonio de la Humanidad UNESCO. Las ruinas de la primera capital española conservadas bajo ceniza volcánica." }
      ]
    },
    economia: {
      resumen: "Basada en el turismo internacional, la educación superior, la producción agropecuaria (maní, caña, ajonjolí) y el comercio regional.",
      sectores: [
        { titulo: "Turismo Cultural y de Aventura", desc: "Referente continental para el Sandboarding en el Cerro Negro y turismo patrimonial." },
        { titulo: "Educación y Salud", desc: "La comunidad universitaria genera una dinámica red de servicios y residencia." },
        { titulo: "Agroindustria", desc: "Procesamiento de aceite vegetal, cultivo de maní y producción ganadera." }
      ]
    },
    turismo: {
      resumen: "Combina el esplendor de iglesias coloniales de arquitectura deslumbrante con volcanes activos y amplias playas del Pacífico.",
      atractivos: [
        { nombre: "Basílica Catedral de León", desc: "La catedral más grande de Centroamérica, con vista panorámica desde sus cúpulas blancas." },
        { nombre: "Volcán Cerro Negro", desc: "Volcán activo único en el mundo para la práctica de Sandboarding a gran velocidad." },
        { nombre: "Sitio Histórico León Viejo", desc: "Ruinas coloniales del primer asentamiento de la ciudad del siglo XVI." }
      ]
    },
    pasatiempos: {
      resumen: "Caminar por las calles coloniales, admirar las Alfombras Pasionarias en Semana Santa y degustar la chicha comiteca.",
      items: [
        "Subir a los techos de la Catedral de León al atardecer.",
        "Descender en tabla sobre la ceniza volcánica del Cerro Negro.",
        "Disfrutar de las playas de Las Peñitas y Poneloya para el surf y mariscos frescos."
      ]
    },
    lugaresImportantes: [
      { nombre: "Catedral de León", desc: "Tumba del poeta Rubén Darío y joyas del arte barroco-neoclásico.", imagen: "/images/departamentos/leon-catedral.png" },
      { nombre: "Volcán Cerro Negro", desc: "Icono de aventura volcánica en la cordillera de Los Maribios.", imagen: "/images/departamentos/leon-cerro-negro.png" },
      { nombre: "Reserva Natural Isla Juan Venado", desc: "Refugio de biodiversidad marina y anidación de tortugas paslama.", imagen: "/images/departamentos/leon-juan-venado.png" }
    ],
    actividades: [
      { nombre: "Semana Santa y Alfombras Pasionarias", fecha: "Marzo/Abril", desc: "Arte efímero en aserrín de colores en el barrio Sutiaba." },
      { nombre: "La Gritería Chiquita", fecha: "14 de Agosto", desc: "Tradición religiosa única en honor a la Asunción de María." }
    ]
  },

  chinandega: {
    slug: "chinandega",
    nombre: "Chinandega",
    apodo: "Ciudad de las Naranjas y Motor Agroindustrial",
    cabecera: "Chinandega",
    region: "Pacífico",
    extension: "4,822 km²",
    poblacion: "~440,000 hab.",
    fundacion: "1836 (Títulos de Villa)",
    coordenadas: [-87.1, 12.6],
    imagenHero: "/images/departamentos/chinandega-hero.png",
    imagenCard: "/images/departamentos/chinandega-card.png",
    imagenReferencia: "/images/galeria-departamentos/chinandega/1.1.jpg",
    galeria: ["/images/galeria-departamentos/chinandega/2.jpg","/images/galeria-departamentos/chinandega/3.jpg","/images/galeria-departamentos/chinandega/4.jpg","/images/galeria-departamentos/chinandega/5.jpg","/images/galeria-departamentos/chinandega/6.jpg","/images/galeria-departamentos/chinandega/7.jpg"],
    historia: {
      resumen: "Ubicada en fértiles planicies volcánicas del noroeste. Su nombre proviene del náhuatl 'Chinamitl-tacalt' (lugar cercado por cañas). Fue capital de la Confederación Centroamericana en 1842 y es guardiana de valiosas tradiciones chorotegas y nicaraos.",
      origenEtimologico: "Del Náhuatl 'Chinamitl-tacalt', que significa 'Lugar rodeado de cañas' o 'Poblado protegido por cercas de cañaverales'.",
      hitos: [
        { año: "1835", evento: "Erupción histórica del Volcán Cosigüina que creó su famosa laguna en el cráter." },
        { año: "1842", evento: "Designada capital temporal de la Confederación de Centroamérica." },
        { año: "1858", evento: "Inauguración del Puerto de Corinto, motor del comercio marítimo nacional." }
      ],
      personajes: [
        { nombre: "Tiburcio Aguilera", titulo: "Educador y Poeta (1880-1950)", aporte: "Ilustre promotor cultural e historiador de las gestas independentistas de occidente." },
        { nombre: "Padre Francisco de Paula Lejarza", titulo: "Párroco Benemérito", aporte: "Líder espiritual e impulsor del tesoro sacro del Santuario Nacional de El Viejo." }
      ],
      patrimonio: [
        { sitio: "Santuario Basílica de El Viejo", epoca: "Colonial (1562)", desc: "Templo histórico donde reposa la imagen venerada de la Virgen del Trono traída por Don Pedro de Zepeda." },
        { sitio: "Parroquia Nuestra Señora de Santa Ana", epoca: "Siglo XVIII", desc: "Joya arquitectónica neoclásica con imponentes retablos de madera tallada." }
      ]
    },
    economia: {
      resumen: "Segunda fuerza económica del país. Destaca por albergar el ingenio azucarero más grande (Ingenio San Antonio) y el puerto comercial principal del Pacífico.",
      sectores: [
        { titulo: "Agroindustria Azucarera y Licorera", desc: "Producción masiva de azúcar y ron de renombre mundial (Flor de Caña)." },
        { titulo: "Puerto de Corinto", desc: "Entrada y salida estratégica de carga marítima internacional." },
        { titulo: "Camaronicultura y Agricultura", desc: "Cultivo de camarón de exportación, maní, plátano y ajonjolí." }
      ]
    },
    turismo: {
      resumen: "Destino vibrante para los amantes del vulcanismo, santuarios coloniales y playas vírgenes para el surf.",
      atractivos: [
        { nombre: "Volcán Cosigüina", desc: "Mirador de los Tres Países (Nicaragua, Honduras y El Salvador) y laguna cratérica turquesa." },
        { nombre: "Volcán San Cristóbal", desc: "El volcán más alto de Nicaragua (1,745 msnm), todo un desafío de senderismo." },
        { nombre: "Playas Jiquilillo y Aposentillo", desc: "Olas perfectas para el surf y estuarios rodeados de manglares." }
      ]
    },
    pasatiempos: {
      resumen: "Recorrer las plantaciones históricas de caña, visitar el Santuario de El Viejo y degustar delicias marinas frescas.",
      items: [
        "Senderismo hacia el cráter del Volcán Cosigüina.",
        "Tour por la fábrica de ron Flor de Caña en Chichigalpa.",
        "Navegar en kayak por el Estero Padre Ramos."
      ]
    },
    lugaresImportantes: [
      { nombre: "Santuario Nacional de El Viejo", desc: "Templo histórico donde se venera a la Virgen de la Inmaculada Concepción.", imagen: "/images/departamentos/chinandega-santuario.png" },
      { nombre: "Volcán San Cristóbal", desc: "El gigante imponente visible desde toda la llanura de occidente.", imagen: "/images/departamentos/chinandega-volcan.png" },
      { nombre: "Reserva Natural Estero Padre Ramos", desc: "Uno de los estuarios de manglar mejor conservados de Centroamérica.", imagen: "/images/departamentos/chinandega-estero.png" }
    ],
    actividades: [
      { nombre: "Lavada de la Plata en El Viejo", fecha: "6 de Diciembre", desc: "Fervorosa tradición donde los fieles limpian los tesoros de plata de la Virgen." },
      { nombre: "Fiestas Patronales de Santa Ana", fecha: "Julio", desc: "Hípicas, bailes de toros y ferias gastronómicas." }
    ]
  },

  granada: {
    slug: "granada",
    nombre: "Granada",
    apodo: "La Gran Sultana y Capital del Turismo",
    cabecera: "Granada",
    region: "Pacífico",
    extension: "1,040 km²",
    poblacion: "~215,000 hab.",
    fundacion: "1524",
    coordenadas: [-85.95, 11.85],
    imagenHero: "/images/departamentos/granada-hero.png",
    imagenCard: "/images/departamentos/granada-card.png",
    imagenReferencia: "/images/galeria-departamentos/granada/1.1.jpg",
    galeria: ["/images/galeria-departamentos/granada/2.jpg","/images/galeria-departamentos/granada/3.jpg","/images/galeria-departamentos/granada/4.jpg","/images/galeria-departamentos/granada/5.png","/images/galeria-departamentos/granada/6.jpg","/images/galeria-departamentos/granada/7.jpg"],
    historia: {
      resumen: "Fundada el 8 de diciembre de 1524 por Francisco Hernández de Córdoba a orillas del Gran Lago Cocibolca. Es una de las ciudades coloniales continentales más antiguas que conserva su trazado original. Resistió ataques piratas e incendios históricos.",
      origenEtimologico: "Bautizada en 1524 en memoria de la Granada española, erigida sobre el milenario asentamiento indígena Nahua de Xalteva.",
      hitos: [
        { año: "1524", evento: "Fundación de la ciudad a orillas del asentamiento indígena de Xalteva." },
        { año: "1856", evento: "Incendio provocado por el filibustero William Walker dejando la célebre frase 'Here was Granada'." },
        { año: "2024", evento: "Declarada Tesoro Nacional de la Cultura, Historia y Naturaleza por su V Centenario." }
      ],
      personajes: [
        { nombre: "General José Dolores Estrada", titulo: "Héroe Nacional (1792-1869)", aporte: "Comandante victorioso de la Batalla de San Jacinto de 1856 contra las tropas de William Walker." },
        { nombre: "Beata Sor María Romero", titulo: "Misionera de la Caridad (1902-1977)", aporte: "Religiosa salesiana nacida en Granada elevada a los altares por su incondicional amor a los desposeídos." },
        { nombre: "Pablo Antonio Cuadra", titulo: "Poeta e Intelectual (1912-2002)", aporte: "Figura cumbre del Movimiento de Vanguardia y renovador de la identidad poética nicaragüense." }
      ],
      patrimonio: [
        { sitio: "Convento e Iglesia San Francisco", epoca: "Fundado en 1529", desc: "El convento más antiguo del país, custodio de las célebres estatuas estelaroides precolombinas de la Isla Zapatera." },
        { sitio: "Fortaleza de La Pólvora", epoca: "Colonial (1748)", desc: "Baluarte militar español diseñado para defender los almacenes de armamento contra ataques piratas." }
      ]
    },
    economia: {
      resumen: "El turismo es su motor principal, impulsado por su riqueza arquitectónica colonial, la hotelería boutique y el ecoturismo lacustre.",
      sectores: [
        { titulo: "Turismo y Hotelería", desc: "Hoteles boutique en casonas coloniales restauradas, restaurantes y touroperadores." },
        { titulo: "Comercio e Industrias Creativas", desc: "Producción de cigarros artesanales, chocolate y artesanía fina." },
        { titulo: "Agricultura y Pesca", desc: "Cultivo de arroz, plátano y pesca artesanal en el Lago Cocibolca." }
      ]
    },
    turismo: {
      resumen: "El destino turístico emblemático de Nicaragua con arquitectura neoclásica vibrante, islas volcánicas y reservas boscosas.",
      atractivos: [
        { nombre: "Las Isletas de Granada", desc: "Archipiélago de 365 pequeñas islas formadas por una erupción pretérita del Mombacho." },
        { nombre: "Reserva Natural Volcán Mombacho", desc: "Bosque nuboso tropical con senderos entre fumarolas y tirolesas de canopy." },
        { nombre: "Centro Histórico y Calle La Calzada", desc: "Boulevard peatonal rodeado de arquitectura patrimonial, restaurantes y música viva." }
      ]
    },
    pasatiempos: {
      resumen: "Recorridos en coche jalado por caballos, paseos en lancha por las Isletas y degustar el famoso vigorón bajo la sombra de la plaza.",
      items: [
        "Comer vigorón tradicional en la Plaza de la Independencia servido en hoja de chagüite.",
        "Subir a la torre de la Iglesia La Merced para capturar la vista panorámica del techo rojo colonial.",
        "Navegar en kayak entre las Isletas observando aves migratorias."
      ]
    },
    lugaresImportantes: [
      { nombre: "Catedral de Granada", desc: "Icono neoclásico amarillo y blanco dominando el parque central.", imagen: "/images/departamentos/granada-catedral.png" },
      { nombre: "Convento e Iglesia San Francisco", desc: "Museo con estatuas precolombinas de la Isla Zapatera.", imagen: "/images/departamentos/granada-convento.png" },
      { nombre: "Fortaleza La Pólvora", desc: "Antiguo fuerte español del siglo XVIII construido para almacenar pertrechos de guerra.", imagen: "/images/departamentos/granada-fortaleza.png" }
    ],
    actividades: [
      { nombre: "Festival Internacional de Poesía de Granada", fecha: "Febrero", desc: "Reunión mundial de poetas que convierten las calles en un recital vivo." },
      { nombre: "Fiestas de la Virgen de la Asunción", fecha: "Agosto", desc: "Hípicas de renombre nacional y procesiones náuticas." }
    ]
  },

  masaya: {
    slug: "masaya",
    nombre: "Masaya",
    apodo: "Capital del Folclore y Ciudad de las Flores",
    cabecera: "Masaya",
    region: "Pacífico",
    extension: "612 km²",
    poblacion: "~390,000 hab.",
    fundacion: "1819 (Título de Ciudad en 1839)",
    coordenadas: [-86.09, 11.97],
    imagenHero: "/images/departamentos/masaya-hero.png",
    imagenCard: "/images/departamentos/masaya-card.png",
    imagenReferencia: "/images/galeria-departamentos/masaya/1.1.jpg",
    galeria: ["/images/galeria-departamentos/masaya/2.jpg","/images/galeria-departamentos/masaya/3.jpg","/images/galeria-departamentos/masaya/4.jpeg","/images/galeria-departamentos/masaya/5.jpg","/images/galeria-departamentos/masaya/6.jpeg","/images/galeria-departamentos/masaya/7.jpg"],
    historia: {
      resumen: "Corazón espiritual y artesanal de Nicaragua. El barrio de Monimbó mantiene vivas las raíces indígenas dirianes y náhuatl. Masaya jugó un rol heroico en la historia nacional y el derrocamiento de las dictaduras.",
      origenEtimologico: "Del Náhuatl 'Mazalt-yan', que significa 'Lugar de los venados' o 'Montaña de las flores', bastión ancestral de la etnia Diriane.",
      hitos: [
        { año: "1839", evento: "Declarada Ciudad con el lema 'Muy Noble y Leal Ciudad de Masaya'." },
        { año: "1979", evento: "Insurrección popular y repliegue táctico a Masaya durante la revolución." },
        { año: "2000", evento: "Declarada oficialmente Capital del Folclore Nicaragüense por el Congreso Nacional." }
      ],
      personajes: [
        { nombre: "General Augusto C. Sandino", titulo: "Héroe Nacional (1895-1934)", aporte: "Nacido en Niquinohomo, Masaya; Líder insigne del Ejército Defensor de la Soberanía Nacional." },
        { nombre: "Alejandro Vega Matus", titulo: "Compositor insigne (1863-1937)", aporte: "Padre de los sones de pascua y marchas religiosas que identifican la identidad musical de Nicaragua." }
      ],
      patrimonio: [
        { sitio: "Fortaleza El Coyotepe", epoca: "Militar (1893)", desc: "Fuerte estratégico erigido en la cumbre del cerro del mismo nombre, testigo de heroicas batallas nacionales." },
        { sitio: "Mercado de Artesanías de Masaya", epoca: "Neogótico (1891)", desc: "Castillo urbano de piedra rosada que alberga el centro neurálgico del folclore y arte tradicional." }
      ]
    },
    economia: {
      resumen: "Epicentro de la economía creativa y la artesanía nacional. Su producción de hamacas, calzado y carpintería se exporta a toda la región.",
      sectores: [
        { titulo: "Artesanías y Alfarería", desc: "Hamacas tejidas a mano, cerámica decorativa de San Juan de Oriente y marroquinería." },
        { titulo: "Turismo Cultural y Gastronómico", desc: "Comercialización en el afamado Mercado de Artesanías y Pueblos Blancos." },
        { titulo: "Pequeña Industria y Calzado", desc: "Talleres familiares de calzado y confección textil." }
      ]
    },
    turismo: {
      resumen: "Fascinante mezcla de maravillas geológicas con expresiones artísticas y tradicionales únicas en Centroamérica.",
      atractivos: [
        { nombre: "Parque Nacional Volcán Masaya", desc: "Uno de los pocos volcanes en el mundo donde se puede contemplar un lago de lava ardiente." },
        { nombre: "Reserva Natural Laguna de Apoyo", desc: "Laguna de origen volcánico con aguas termales y cristalinas idóneas para nadar." },
        { nombre: "Mercado de Artesanías (Mercado Viejo)", desc: "Castillo neogótico donde se concentra el mejor arte popular nicaragüense." }
      ]
    },
    pasatiempos: {
      resumen: "Escuchar sones de marimba en Monimbó, comprar artesanías y recorrer los Pueblos Blancos (Catarina, San Juan de Oriente).",
      items: [
        "Ver el atardecer desde el Mirador de Catarina contemplando la Laguna de Apoyo y el Lago Cocibolca.",
        "Adquirir hamacas de algodón tejidas a mano en los talleres de Monimbó.",
        "Asistir a los Jueves de Verbena con danzas folclóricas en vivo."
      ]
    },
    lugaresImportantes: [
      { nombre: "Volcán Masaya (Santiago)", desc: "El cráter activo con su resplandor nocturno conocido como 'La Boca del Infierno'.", imagen: "/images/departamentos/masaya-volcan.png" },
      { nombre: "Mirador de Catarina", desc: "La vista panorámica más fotografiada del país.", imagen: "/images/departamentos/masaya-catarina.png" },
      { nombre: "Fortaleza El Coyotepe", desc: "Antigua prisión y fuerte militar con vistas estratégicas de Masaya y Managua.", imagen: "/images/departamentos/masaya-coyotepe.png" }
    ],
    actividades: [
      { nombre: "Procesión de Los Agüizotes", fecha: "Último viernes de Octubre", desc: "Desfile nocturno de mitos y leyendas con máscaras artesanales de papel maché." },
      { nombre: "Torovenado de Monimbó", fecha: "Octubre / Noviembre", desc: "Sátira popular y folclore callejero en honor a San Jerónimo." }
    ]
  },

  carazo: {
    slug: "carazo",
    nombre: "Carazo",
    apodo: "Cuna del Güegüense y Clima Fresco",
    cabecera: "Jinotepe",
    region: "Pacífico",
    extension: "1,081 km²",
    poblacion: "~200,000 hab.",
    fundacion: "1891",
    coordenadas: [-86.25, 11.74],
    imagenHero: "/images/departamentos/carazo-hero.png",
    imagenCard: "/images/departamentos/carazo-card.png",
    imagenReferencia: "/images/galeria-departamentos/carazo/1.1.jpg",
    galeria: ["/images/galeria-departamentos/carazo/2.jpg","/images/galeria-departamentos/carazo/3.jpg","/images/galeria-departamentos/carazo/4.jpg","/images/galeria-departamentos/carazo/5.jpg","/images/galeria-departamentos/carazo/6.jpg","/images/galeria-departamentos/carazo/7.jpg"],
    historia: {
      resumen: "Creado como departamento en 1891 en honor al expresidente Evaristo Carazo. Habitado por los antiguos indígenas dirianes, es la cuna de 'El Güegüense o Macho Ratón', obra maestra del patrimonio oral e inmaterial de la humanidad por la UNESCO.",
      origenEtimologico: "Territorio originario de los aborígenes Dirianes. Creado en 1891 rindiendo homenaje al expresidente Evaristo Carazo.",
      hitos: [
        { año: "1891", evento: "Creación del departamento de Carazo separándose de Managua y Granada." },
        { año: "2005", evento: "La UNESCO proclama a 'El Güegüense' Patrimonio Oral e Inmaterial de la Humanidad." }
      ],
      personajes: [
        { nombre: "Evaristo Carazo", titulo: "Presidente de la República (1821-1889)", aporte: "Estadista promotor de la red ferroviaria y la modernización agrícola nicaragüense." },
        { nombre: "Maestros del Güegüense", titulo: "Dramaturgos Anónimos (Siglo XVII)", aporte: "Creadores de la primera obra teatral satírica de la América hispana en Diriamba." }
      ],
      patrimonio: [
        { sitio: "Basílica Menor de San Sebastián", epoca: "Neoclásico (1891)", desc: "Templo emblemático de Diriamba decorado con bellos vitrales italianos y escenario del baile de El Güegüense." },
        { sitio: "Reloj Público de Jinotepe", epoca: "1923", desc: "Torre de reloj traída de Alemania que constituye el punto de referencia histórico de la cabecera caraceña." }
      ]
    },
    economia: {
      resumen: "Favorecido por su meseta de clima fresco, Carazo es productor tradicional de café de sombra, cítricos y servicios educativos.",
      sectores: [
        { titulo: "Caficultura y Cítricos", desc: "Fincas cafetaleras en la meseta y producción de naranjas, mandarinas y limones." },
        { titulo: "Comercio y Educación", desc: "Jinotepe y Diriamba concentran universidades y comercio dinámico." },
        { titulo: "Turismo de Playa y Conservación", desc: "Playas del Pacífico como La Boquita y reservas de desove de tortugas." }
      ]
    },
    turismo: {
      resumen: "Combina el clima agradable de sus mesetas urbanas con playas vibrantes y santuarios naturales de vida silvestre.",
      atractivos: [
        { nombre: "Refugio de Vida Silvestre Chacocente", desc: "Santuario costero de arribadas masivas de tortugas marinas paslama." },
        { nombre: "Playas La Boquita y Huehuete", desc: "Centros turísticos costeros con centros de recreación y marisquerías." },
        { nombre: "Basílica Menor de San Sebastián en Diriamba", desc: "Joya neoclásica famosa por sus relieves e historia religiosa." }
      ]
    },
    pasatiempos: {
      resumen: "Disfrutar de las representaciones callejeras de El Güegüense, degustar el picadillo picante y descansar en el mar.",
      items: [
        "Probar el ajiaco caraceño y la picadura durante las fiestas patronales.",
        "Ver el desove de tortugas paslama por las noches en Chacocente.",
        "Tomar un café fresco en las plazas arboladas de Jinotepe o San Marcos."
      ]
    },
    lugaresImportantes: [
      { nombre: "Basílica de San Sebastián", desc: "Templo neoclásico con cúpula icónica en Diriamba.", imagen: "/images/departamentos/carazo-basilica.png" },
      { nombre: "Centro Turístico La Boquita", desc: "Área de sol y playa con restaurantes y paseos a caballo.", imagen: "/images/departamentos/carazo-boquita.png" },
      { nombre: "Reloj Público de Jinotepe", desc: "Monumento histórico en el parque central de Jinotepe.", imagen: "/images/departamentos/carazo-reloj.png" }
    ],
    actividades: [
      { nombre: "Fiestas de San Sebastián en Diriamba", fecha: "20 de Enero", desc: "Bailes de El Güegüense, El Toro Huaco y El Gigante en las calles." },
      { nombre: "Fiestas Patronales de Santiago en Jinotepe", fecha: "Julio", desc: "Topes de santos (San Sebastián, San Marcos y Santiago) e hípicas." }
    ]
  },

  rivas: {
    slug: "rivas",
    nombre: "Rivas",
    apodo: "Puerta a Ometepe y Paraíso del Surf",
    cabecera: "Rivas",
    region: "Pacífico",
    extension: "2,162 km²",
    poblacion: "~185,000 hab.",
    fundacion: "1720 (Villa de la Pura y Limpia Concepción)",
    coordenadas: [-85.75, 11.35],
    imagenHero: "/images/departamentos/rivas-hero.png",
    imagenCard: "/images/departamentos/rivas-card.png",
    imagenReferencia: "/images/galeria-departamentos/rivas/1.1.webp",
    galeria: ["/images/galeria-departamentos/rivas/2.jpg","/images/galeria-departamentos/rivas/3.jpg","/images/galeria-departamentos/rivas/4.jpg","/images/galeria-departamentos/rivas/5.jpg","/images/galeria-departamentos/rivas/6.jpg","/images/galeria-departamentos/rivas/7.jpg"],
    historia: {
      resumen: "Escenario principal de la Guerra Nacional de 1856 donde el héroe Emmanuel Mongalo y Rubio y la batalla de Rivas inmortalizaron la defensa de la soberanía nacional contra los filibusteros de William Walker.",
      origenEtimologico: "Asentamiento precolombino de Nicaraocallan, sede del gran Cacique Nicarao. Titulada en 1720 en honor a Francisco Rodríguez de Rivas.",
      hitos: [
        { año: "1855", evento: "Primera Batalla de Rivas con la hazaña heroica de Emmanuel Mongalo prendiendo fuego al Mesón." },
        { año: "1856", evento: "Segunda Batalla de Rivas clave para la derrota y expulsión de William Walker." },
        { año: "2010", evento: "La Isla de Ometepe es declarada Reserva de Biosfera por la UNESCO." }
      ],
      personajes: [
        { nombre: "Enmanuel Mongalo y Rubio", titulo: "Héroe Nacional (1834-1872)", aporte: "Maestro que en la Batalla de Rivas (1855) prendió fuego al Mesón donde se atrincheraban los filibusteros." },
        { nombre: "Cacique Nicarao", titulo: "Gobernante Aborigen (Siglo XVI)", aporte: "Sabio líder indígena que protagonizó el histórico encuentro filosófico y teológico con los conquistadores." }
      ],
      patrimonio: [
        { sitio: "Petroglifos de la Isla de Ometepe", epoca: "Precolombino (~1,000 a.C.)", desc: "Más de 1,700 grabados en piedra volcánica que documentan la cosmovisión astronómica de las tribus Nahuas." },
        { sitio: "Parroquia San Pedro de Rivas", epoca: "Siglo XVIII", desc: "Iglesia parroquial que conserva huellas de proyectiles de las batallas históricas contra los filibusteros." }
      ]
    },
    economia: {
      resumen: "Impulsada por el turismo internacional de sol, playa y surf, la energía eólica y la producción agrícola intensiva de plátano.",
      sectores: [
        { titulo: "Turismo de Playa y Surf", desc: "San Juan del Sur, Tola y Ometepe atraen miles de viajeros internacionales." },
        { titulo: "Energía Renovable", desc: "Parques eólicos del istmo de Rivas aprovechando los vientos alisios del lago." },
        { titulo: "Agricultura y Ganadería", desc: "El mayor productor de plátanos de alta calidad y caña de azúcar." }
      ]
    },
    turismo: {
      resumen: "Destino meca de surfistas globales, ecoturistas y exploradores de islas volcánicas dentro del Gran Lago.",
      atractivos: [
        { nombre: "Isla de Ometepe", desc: "Única isla en el mundo con dos majestuosos volcanes (Concepción y Maderas) en un lago dulce." },
        { nombre: "Bahía de San Juan del Sur", desc: "La ciudad portuaria más famosa de Nicaragua con vibrante vida nocturna." },
        { nombre: "Playas de Tola (Popoyo, Maderas, Colorado)", desc: "Olas de clase mundial reconocidas por torneos internacionales de surf." }
      ]
    },
    pasatiempos: {
      resumen: "Surfear olas perfectas, hacer senderismo en volcanes, bañarse en el Ojo de Agua y admirar atardeceres sobre el Pacífico.",
      items: [
        "Hacer kayak en el río Istián entre los dos volcanes de Ometepe.",
        "Subir al Cristo de la Misericordia en San Juan del Sur para la mejor vista de la bahía.",
        "Refrescarse en las aguas manantiales cristalinas de El Ojo de Agua."
      ]
    },
    lugaresImportantes: [
      { nombre: "Isla de Ometepe", desc: "Reserva de Biosfera UNESCO con petroglifos ancestrales y cascadas.", imagen: "/images/departamentos/rivas-ometepe.png" },
      { nombre: "Cristo de la Misericordia", desc: "Una de las estatuas de Jesús más altas de América sobre el acantilado de San Juan del Sur.", imagen: "/images/departamentos/rivas-cristo.png" },
      { nombre: "Playa Maderas", desc: "Icono del surf internacional rodeada de formaciones rocosas únicas.", imagen: "/images/departamentos/rivas-maderas.png" }
    ],
    actividades: [
      { nombre: "Fiestas Patronales de San Pedro en Rivas", fecha: "Junio", desc: "Hípicas regionales y ferias del plátano." },
      { nombre: "Torneos Internacionales de Surf en Tola", fecha: "Mayo - Octubre", desc: "Competencias con atletas de todo el mundo en Popoyo." }
    ]
  },

  matagalpa: {
    slug: "matagalpa",
    nombre: "Matagalpa",
    apodo: "La Perla del Septentrión y Cuna del Café",
    cabecera: "Matagalpa",
    region: "Central",
    extension: "6,804 km²",
    poblacion: "~600,000 hab.",
    fundacion: "1862 (Categoría de Ciudad)",
    coordenadas: [-85.6, 12.9],
    imagenHero: "/images/departamentos/matagalpa-hero.png",
    imagenCard: "/images/departamentos/matagalpa-card.png",
    imagenReferencia: "/images/galeria-departamentos/matagalpa/1.1.jpg",
    galeria: ["/images/galeria-departamentos/matagalpa/2.jpg","/images/galeria-departamentos/matagalpa/3.jpg","/images/galeria-departamentos/matagalpa/4.jpg","/images/galeria-departamentos/matagalpa/5.jpg","/images/galeria-departamentos/matagalpa/6.jpg","/images/galeria-departamentos/matagalpa/7.jpg"],
    historia: {
      resumen: "Tierra de origen indígena matagalpa. En el siglo XIX la llegada de inmigrantes europeos revolucionó el cultivo del café en sus montañas nebliselvas, convirtiendo a la región en el motor cafetalero del país.",
      origenEtimologico: "Del idioma indígena Matagalpa 'Ma-takt-ka-lpa', que traduce 'Pueblo de las diez familias' o 'Tierra de las diez casas'.",
      hitos: [
        { año: "1856", evento: "Participación decisiva de los Flecheros de Matagalpa en la Batalla de San Jacinto para expulsar al filibustero." },
        { año: "1862", evento: "Elevada al rango de Ciudad de Matagalpa." },
        { año: "1990", evento: "Desarrollo del circuito ecoturístico de la Ruta del Café en nebliselvas." }
      ],
      personajes: [
        { nombre: "Comandante Carlos Fonseca Amador", titulo: "Héroe Nacional (1936-1976)", aporte: "Nacido en Matagalpa; fundador del FSLN e ideólogo fundamental de la lucha social y patriótica." },
        { nombre: "Indios Flecheros de Matagalpa", titulo: "Héroes de la Patria (1856)", aporte: "Batallón aborigen cuyas flechas fueron determinantes para derrocar al invasor filibustero en San Jacinto." }
      ],
      patrimonio: [
        { sitio: "Catedral de San Pedro de Matagalpa", epoca: "Barroco (1874)", desc: "La tercera catedral más grande del país, construida enteramente por artesanos y constructores locales." },
        { sitio: "Casa Cuna de Carlos Fonseca", epoca: "Histórico", desc: "Museo memoria preservado en el centro urbano que custodia el legado histórico del héroe matagalpino." }
      ]
    },
    economia: {
      resumen: "Corazón agrícola del norte. Lidera la producción de café de exportación, hortalizas, flores, lácteos de montaña y cacao.",
      sectores: [
        { titulo: "Caficultura de Altura", desc: "Cultivo de grano de oro arábico de alta puntuación en tazas de excelencia mundial." },
        { titulo: "Agroturismo y Bosques Nubosos", desc: "Haciendas cafetaleras convertidas en ecolodges boutique." },
        { titulo: "Ganadería y Horticultura", desc: "Producción de papas, repollo, zanahorias y quesos de montaña." }
      ]
    },
    turismo: {
      resumen: "Paraíso de montaña con clima fresco todo el año, senderos en nebliselvas, cascadas y casonas cafetaleras históricas.",
      atractivos: [
        { nombre: "Hacienda Selva Negra", desc: "Reserva ecológica y hacienda de café histórica fundada por inmigrantes alemanes." },
        { nombre: "Cascada Blanca y Eco-Lodge", desc: "Impresionante caída de agua rodeada de senderos y cúpulas místicas." },
        { nombre: "Reserva Natural Cerro Apante", desc: "Mirador montañoso con la gran cruz sobre la ciudad de Matagalpa." }
      ]
    },
    pasatiempos: {
      resumen: "Catación de café artesanal, senderismo entre pinares, escuchar polka y mazurca matagalpina y probar chocobolas.",
      items: [
        "Hacer el tour 'del grano a la taza' en las fincas de San Ramón o Selva Negra.",
        "Visitar el Museo del Café en el centro de la ciudad de Matagalpa.",
        "Comer güirilas frescas con cuajada de hoja en la salida hacia Sébaco."
      ]
    },
    lugaresImportantes: [
      { nombre: "Catedral de San Pedro de Matagalpa", desc: "Majestuoso templo blanco de arquitectura barroca-renacentista.", imagen: "/images/departamentos/matagalpa-catedral.png" },
      { nombre: "Hacienda Selva Negra", desc: "Bosque nuboso con hotel ecológico y capilla de montaña.", imagen: "/images/departamentos/matagalpa-selvanegra.png" },
      { nombre: "Cascada Blanca", desc: "Salto de agua legendario donde se practica yoga y meditación.", imagen: "/images/departamentos/matagalpa-cascada.png" }
    ],
    actividades: [
      { nombre: "Feria Nacional del Café", fecha: "Noviembre", desc: "Exposición de los mejores cafés y barismo en vivo." },
      { nombre: "Festival de Polkas y Mazurcas", fecha: "Septiembre", desc: "Fiesta de música campesina del norte nicaragüense." }
    ]
  },

  jinotega: {
    slug: "jinotega",
    nombre: "Jinotega",
    apodo: "Ciudad de las Brumas",
    cabecera: "Jinotega",
    region: "Central",
    extension: "9,222 km²",
    poblacion: "~470,000 hab.",
    fundacion: "1891 (Departamento)",
    coordenadas: [-85.6, 13.8],
    imagenHero: "/images/departamentos/jinotega-hero.png",
    imagenCard: "/images/departamentos/jinotega-card.png",
    imagenReferencia: "/images/galeria-departamentos/jinotega/1.1.webp",
    galeria: ["/images/galeria-departamentos/jinotega/2.jpg","/images/galeria-departamentos/jinotega/3.jpg","/images/galeria-departamentos/jinotega/4.jpg","/images/galeria-departamentos/jinotega/5.jpg","/images/galeria-departamentos/jinotega/6.jpg","/images/galeria-departamentos/jinotega/7.jpg"],
    historia: {
      resumen: "El departamento más extenso de la región central. Su nombre náhuatl significa 'Ciudad de los hombres que viven entre brumas'. Escenario histórico de las gestas del General Augusto C. Sandino en San Rafael del Norte.",
      origenEtimologico: "Del Náhuatl 'Xiuh-notl-tecatl', que significa 'Ciudad de los hombres que viven entre brumas' o 'Vecinos de los matagalpas'.",
      hitos: [
        { año: "1891", evento: "Creación del departamento de Jinotega." },
        { año: "1930", evento: "Cuartel general del General Sandino y Blanca Aráuz en San Rafael del Norte." },
        { año: "1964", evento: "Construcción del Embalse y Lago Apanás para generación hidroeléctrica limpia." }
      ],
      personajes: [
        { nombre: "Blanca Aráuz Pineda", titulo: "Heroína Nacional (1909-1933)", aporte: "Nacida en San Rafael del Norte; telegrafista y estratega clave del Ejército Defensor de la Soberanía." },
        { nombre: "Padre Odorico D'Andrea", titulo: "Misionero de la Paz (1916-1990)", aporte: "Fraile franciscano que pacificó la región montañosa y construyó escuelas, caminos y capillas." }
      ],
      patrimonio: [
        { sitio: "Santuario Tepeyac de San Rafael", epoca: "Siglo XX", desc: "Complejo religioso y mirador erigido en las alturas de San Rafael del Norte como remanso de fe." },
        { sitio: "Catedral San Juan Bautista de Jinotega", epoca: "1805 / 1952", desc: "Templo neoclásico que alberga valiosos retablos tallados y esculturas religiosas coloniales." }
      ]
    },
    economia: {
      resumen: "El departamento que más volumen de café produce en Nicaragua. Posee una pujante agricultura de hortalizas y generación limpia de energía.",
      sectores: [
        { titulo: "Producción Cafetalera Líder", desc: "Aporta más del 65% del volumen del café de exportación del país." },
        { titulo: "Horticultura de Altura", desc: "Producción de papa, lechuga, repollo y apio abasteciendo los mercados nacionales." },
        { titulo: "Energía Hidroeléctrica", desc: "Planta Centroamérica utilizando las aguas del Lago Apanás." }
      ]
    },
    turismo: {
      resumen: "Naturaleza indómita de montaña con el macizo de Peñas Blancas, lagos de altura y santuarios históricos.",
      atractivos: [
        { nombre: "Lago Apanás", desc: "Primer lago artificial de Nicaragua, hogar de aves acuáticas y pesca deportiva." },
        { nombre: "Macizo de Peñas Blancas", desc: "Imponente pared rocosa de nebliselva perteneciente a la Reserva Bosawás." },
        { nombre: "San Rafael del Norte", desc: "Pueblo con encanto, museo de Sandino y la bella Basílica de la Virgen de la Luz." }
      ]
    },
    pasatiempos: {
      resumen: "Pasear en bote por el Lago Apanás, escalar la Cruz de Mayo en el Peña de La Cruz y probar pan dulce jinotegano.",
      items: [
        "Subir las escalinatas hacia el Mirador Peña de La Cruz contemplando la bruma sobre el valle.",
        "Avistamiento de aves en los senderos de Peñas Blancas.",
        "Degustar las tradicionales semitas y marquesotes jinoteganos con café bien caliente."
      ]
    },
    lugaresImportantes: [
      { nombre: "Peña de La Cruz", desc: "Mirador montañoso emblemático coronado por una gigantesca cruz blanca.", imagen: "/images/departamentos/jinotega-penacruz.png" },
      { nombre: "Lago Apanás", desc: "Humedal Ramsar de belleza escénica rodeado de pinos.", imagen: "/images/departamentos/jinotega-apanas.png" },
      { nombre: "Santuario Tepeyac (San Rafael del Norte)", desc: "Obra religiosa del Padre Odorico D'Andrea.", imagen: "/images/departamentos/jinotega-tepeyac.png" }
    ],
    actividades: [
      { nombre: "Fiestas del Padre Odorico D'Andrea", fecha: "Marzo", desc: "Romería multitudinaria en San Rafael del Norte." },
      { nombre: "Día de la Cruz", fecha: "3 de Mayo", desc: "Ascenso tradicional a la Peña de La Cruz con misa en las alturas." }
    ]
  },

  esteli: {
    slug: "esteli",
    nombre: "Estelí",
    apodo: "El Diamante de las Segovias",
    cabecera: "Estelí",
    region: "Central",
    extension: "2,230 km²",
    poblacion: "~230,000 hab.",
    fundacion: "1891",
    coordenadas: [-86.38, 13.14],
    imagenHero: "/images/departamentos/esteli-hero.png",
    imagenCard: "/images/departamentos/esteli-card.png",
    imagenReferencia: "/images/galeria-departamentos/esteli/1.1.jpg",
    galeria: ["/images/galeria-departamentos/esteli/2.jpg","/images/galeria-departamentos/esteli/3.jpg","/images/galeria-departamentos/esteli/4.jpg","/images/galeria-departamentos/esteli/5.jpg","/images/galeria-departamentos/esteli/6.jpg","/images/galeria-departamentos/esteli/7.jpg"],
    historia: {
      resumen: "Conocida como la 'Ciudad del Muralismo' por las pinturas de arte público que narran su historia. Fundada en el valle del río Estelí, ha crecido hasta convertirse en la capital económica de la zona norte de Nicaragua.",
      origenEtimologico: "Del idioma Matagalpa/Sumo 'Li' (río) y 'Estelí', traducido como 'Río de ojos de agua' o 'Río de lechos de sangre'.",
      hitos: [
        { año: "1891", evento: "Creación del departamento de Estelí." },
        { año: "1979", evento: "Tres insurrecciones históricas marcaron su identidad de resistencia heroica." },
        { año: "1995", evento: "Auge mundial de las fábricas de puros de hoja de tabaco premium de exportación." }
      ],
      personajes: [
        { nombre: "Leonel Rugama", titulo: "Poeta y Guerrero (1949-1970)", aporte: "Autor del legendario grito '¡Que se rinda tu madre!' y uno de los poetas más influyentes del siglo XX." },
        { nombre: "Don Alberto Gutiérrez", titulo: "Escultor del Jalacate", aporte: "Artista ermitaño que ha esculpido durante décadas más de 200 relieves en la roca del cerro Tisey." }
      ],
      patrimonio: [
        { sitio: "Galería de Murales Históricos", epoca: "Contemporáneo (1979-presente)", desc: "Más de 300 murales artísticos en las fachadas urbanas que narran la memoria y luchas del pueblo norteño." },
        { sitio: "Catedral de Nuestra Señora del Rosario", epoca: "1888", desc: "Majestuoso templo que combina elementos neoclásicos y góticos en el corazón del centro histórico." }
      ]
    },
    economia: {
      resumen: "Capital mundial de la industria del tabaco elaborado a mano. Concentra la mayor densidad de fábricas procesadoras y exportadoras de puros de calidad internacional.",
      sectores: [
        { titulo: "Industria del Tabaco Premium", desc: "Puros estelianos premiados como los mejores del mundo por Cigar Aficionado." },
        { titulo: "Comercio y Servicios del Norte", desc: "Centro financiero y comercial pujante de la carretera Panamericana." },
        { titulo: "Agroganadería y Cuero", desc: "Producción de hortalizas, talabartería y calzado." }
      ]
    },
    turismo: {
      resumen: "Ecoturismo montañoso, arte público callejero y la fascinante experiencia del proceso artesanal del tabaco.",
      atractivos: [
        { nombre: "Reserva Natural Miraflor", desc: "Meseta de biodiversidad con bosques secos, robledales, nebliselvas y cultivo de orquídeas." },
        { nombre: "Reserva Natural Tisey-La Estanzuela", desc: "Cascada impresionante y la finca El Jalacate con esculturas talladas en roca viva." },
        { nombre: "Ruta del Tabaco", desc: "Visitas guiadas por galpones de curado y fábricas de puros de reputación global." }
      ]
    },
    pasatiempos: {
      resumen: "Recorrer las calles admirando murales artísticos, hacer caminatas en Miraflor y disfrutar de la música vaquera.",
      items: [
        "Ver a Don Alberto Gutiérrez tallar animales y sirenas en la piedra de El Jalacate.",
        "Visitar una fábrica de puros para aprender el enrollado manual de las hojas.",
        "Refrescarse bajo la brisa del Salto de La Estanzuela."
      ]
    },
    lugaresImportantes: [
      { nombre: "Salto de La Estanzuela", desc: "Hermosa cascada rodeada de paredones rocosos y vegetación.", imagen: "/images/departamentos/esteli-estanzuela.png" },
      { nombre: "Finca Escultórica El Jalacate", desc: "Galería al aire libre esculpida en el cerro por un artesano ermitaño.", imagen: "/images/departamentos/esteli-jalacate.png" },
      { nombre: "Catedral Nuestra Señora del Rosario", desc: "Templo icónico frente al parque central de Estelí.", imagen: "/images/departamentos/esteli-catedral.png" }
    ],
    actividades: [
      { nombre: "Festival Internacional del Tabaco (Puro Sabor)", fecha: "Enero", desc: "Encuentro de aficionados y compradores globales del tabaco." },
      { nombre: "Fiestas Patronales del Rosario", fecha: "Octubre", desc: "Hípicas multitudinarias y festivales de música ranchera." }
    ]
  },

  madriz: {
    slug: "madriz",
    nombre: "Madriz",
    apodo: "Cuna del Cañón de Somoto y de las Rosquillas",
    cabecera: "Somoto",
    region: "Central",
    extension: "1,708 km²",
    poblacion: "~175,000 hab.",
    fundacion: "1936",
    coordenadas: [-86.49, 13.46],
    imagenHero: "/images/departamentos/madriz-hero.png",
    imagenCard: "/images/departamentos/madriz-card.png",
    imagenReferencia: "/images/galeria-departamentos/madriz/1.1.jpg",
    galeria: ["/images/galeria-departamentos/madriz/2.jpg","/images/galeria-departamentos/madriz/3.jpg","/images/galeria-departamentos/madriz/4.jpg","/images/galeria-departamentos/madriz/5.jpg","/images/galeria-departamentos/madriz/6.jpg","/images/galeria-departamentos/madriz/7.jpg"],
    historia: {
      resumen: "Creado en 1936 separándose de Nueva Segovia. Su cabecera, Somoto, proviene de 'Tecpecxomotli' (Valle de los Gansos). Es famosa por su hospitalidad, su acervo musical campesino y su riqueza geológica milenaria.",
      origenEtimologico: "Asentamiento ancestral 'Tecpecxomotli' (Valle de los gansos). Erigido en departamento en 1936 en honor al Dr. José Madriz.",
      hitos: [
        { año: "1936", evento: "Creación del departamento nombrándolo Madriz en honor a José Madriz." },
        { año: "2004", evento: "Descubrimiento y puesta en valor turístico del majestuoso Cañón de Somoto." },
        { año: "2006", evento: "Declaración del Cañón de Somoto como Monumento Nacional." }
      ],
      personajes: [
        { nombre: "Luis Enrique & Carlos Mejía Godoy", titulo: "Cantautores Nacionales", aporte: "Nacidos en Somoto; creadores del Son Nica, la Misa Campesina y el cancionero popular revolucionario." },
        { nombre: "Colectivo de Madres del Maíz", titulo: "Guardianas del Sabor", aporte: "Mujeres artesanas que preservan la receta ancestral de las tradicionales rosquillas somoteñas." }
      ],
      patrimonio: [
        { sitio: "Monumento Nacional Cañón de Somoto", epoca: "Falla Geológica (~10-15 Millones de años)", desc: "Imponente desfiladero esculpido por el cauce inicial del Río Coco, declarado área protegida nacional." },
        { sitio: "Templo Parroquial de Santiago Apóstol", epoca: "Colonial (1870)", desc: "Iglesia que conserva elementos de la arquitectura vernácula segoviana y altares de madera tallada." }
      ]
    },
    economia: {
      resumen: "Basada en la agricultura de granos básicos, el turismo de aventura en el Cañón y la célebre industria artesanal de rosquillas.",
      sectores: [
        { titulo: "Industria de Rosquillas Somoteñas", desc: "Decenas de talleres familiares que elaboran y exportan las famosas rosquillas de maíz y queso." },
        { titulo: "Ecoturismo de Aventura", desc: "Operadores locales de cañonismo, senderismo y paseos en bote." },
        { titulo: "Agricultura Tradicional", desc: "Frijol, maíz, sorgo y caficultura de altura en las serranías." }
      ]
    },
    turismo: {
      resumen: "Uno de los paisajes geológicos más espectaculares de Centroamérica combinando cañones de roca volcánica y tradiciones del campo.",
      atractivos: [
        { nombre: "Monumento Nacional Cañón de Somoto", desc: "Formación de entre 5 y 14 millones de años con paredes de hasta 250 metros donde nace el río Coco." },
        { nombre: "Pueblo de Somoto", desc: "Tranquila ciudad con talleres de rosquillas abiertas al visitante y parque central ameno." },
        { nombre: "Reserva Tepesomoto-La Pataste", desc: "Senderos de montaña con miradores y pozas naturales." }
      ]
    },
    pasatiempos: {
      resumen: "Flotar en neumático por las aguas cristalinas del Cañón, probar rosquillas calientes recién salidas del horno de leña.",
      items: [
        "Hacer el recorrido completo en agua y roca a través del Cañón de Somoto.",
        "Degustar rosquillas somoteñas con café de palo en los talleres de las 'Madres del Maíz'.",
        "Escuchar música campesina de guitarras en las comunidades rurales."
      ]
    },
    lugaresImportantes: [
      { nombre: "Cañón de Somoto", desc: "La falla geológica espectacular por donde fluye el cauce inicial del río Coco.", imagen: "/images/departamentos/madriz-canon.png" },
      { nombre: "Templo de San José de Somoto", desc: "Iglesia parroquial colonial con detalles de arquitectura vernácula.", imagen: "/images/departamentos/madriz-iglesia.png" },
      { nombre: "Mirador Cerro El Cañón", desc: "Vista panorámica superior del cañón y la frontera norte.", imagen: "/images/departamentos/madriz-mirador.png" }
    ],
    actividades: [
      { nombre: "Festival de las Rosquillas Somoteñas", fecha: "Agosto", desc: "Celebración con degustación masiva de rosquillas y bailes tradicionales." },
      { nombre: "Fiestas Patronales de Santiago", fecha: "Julio", desc: "Desfiles hípicos y corridas de toros al estilo del norte." }
    ]
  },

  "nueva-segovia": {
    slug: "nueva-segovia",
    nombre: "Nueva Segovia",
    apodo: "La Sultana del Norte y Tierra de Pinos",
    cabecera: "Ocotal",
    region: "Central",
    extension: "3,491 km²",
    poblacion: "~270,000 hab.",
    fundacion: "1543 (Ciudad Vieja)",
    coordenadas: [-86.23, 13.72],
    imagenHero: "/images/departamentos/nueva-segovia-hero.png",
    imagenCard: "/images/departamentos/nueva-segovia-card.png", 
    imagenReferencia: "/images/galeria-departamentos/nueva-segovia/1.1.jpg",
    galeria: ["/images/galeria-departamentos/nueva-segovia/2.jpg","/images/galeria-departamentos/nueva-segovia/3.jpg","/images/galeria-departamentos/nueva-segovia/4.jpg","/images/galeria-departamentos/nueva-segovia/5.jpg","/images/galeria-departamentos/nueva-segovia/6.jpeg","/images/galeria-departamentos/nueva-segovia/7.jpeg"],
    historia: {
      resumen: "Una de las zonas con mayor historia colonial e independentista. Asentada originalmente cerca de Jalapa, su cabecera Ocotal se consolidó rodeada de bosques de pino. Fue baluarte histórico del Ejército Defensor de la Soberanía Nacional.",
      origenEtimologico: "Fundada en 1543 como Ciudad Vieja por el capitán Diego de Castañeda en homenaje a la histórica ciudad de Segovia en España.",
      hitos: [
        { año: "1543", evento: "Fundación de Ciudad Vieja por Diego de Castañeda." },
        { año: "1927", evento: "Batalla de Ocotal entre las fuerzas del General Sandino y los marines estadounidenses." },
        { año: "2015", evento: "Consolidación de las fincas cafetaleras con premios de Taza de Excelencia." }
      ],
      personajes: [
        { nombre: "Monseñor Nicolás Antonio Madrigal", titulo: "Padre del Norte (1898-1977)", aporte: "Sacerdote benemérito impulsor de las obras sociales, educativas y el arte en el departamento." },
        { nombre: "General Miguel Ángel Ortez", titulo: "Joven Héroe de Palacagüina (1907-1931)", aporte: "Jefe militar de las fuerzas de Sandino inmortalizado por su valentía e integridad." }
      ],
      patrimonio: [
        { sitio: "Ruinas de Ciudad Vieja", epoca: "Colonial (1543)", desc: "Asentamiento hispánico pionero de la minería de oro abandonado tras incursiones de tribus feroces." },
        { sitio: "Santuario de la Virgen de la Piedra (Dipilto)", epoca: "1947", desc: "Gruta natural y río sagrado rodeado de bosques de pino a donde acuden miles de peregrinos." }
      ]
    },
    economia: {
      resumen: "Basada en el cultivo de café de estricta altura de fama internacional, la industria maderera sostenible de pino y la agricultura fronteriza.",
      sectores: [
        { titulo: "Cafés Especiales de Altura", desc: "Fincas en Dipilto y San Fernando que ganan consistentemente la Taza de Excelencia." },
        { titulo: "Silvicultura de Pino", desc: "Aprovechamiento maderero responsable en los grandes pinares segovianos." },
        { titulo: "Comercio Fronterizo", desc: "Intenso flujo comercial con la vecina República de Honduras." }
      ]
    },
    turismo: {
      resumen: "Naturaleza alpina de clima fresco, el punto más alto del país y la paz de sus pueblos serranos.",
      atractivos: [
        { nombre: "Cerro Mogotón", desc: "La cumbre más alta de Nicaragua (2,107 msnm) en la frontera con Honduras." },
        { nombre: "Santuario Nacional Virgen de la Piedra (Dipilto)", desc: "Lugar de peregrinación y oración en una gruta natural junto al río." },
        { nombre: "Ciudad de Ocotal", desc: "Conocida como la 'Ciudad de los Pinos', con su bello parque central lleno de flora norteña." }
      ]
    },
    pasatiempos: {
      resumen: "Senderismo en pinares, saborear café en las fincas de Dipilto y explorar aguas termales artesanales.",
      items: [
        "Ascender la cumbre del Mogotón rodeado de neblina y pinos.",
        "Visitar las aguas termales de Macuelizo y Jalapa.",
        "Probar la gastronomía a base de maíz en la Feria de Jalapa."
      ]
    },
    lugaresImportantes: [
      { nombre: "Cerro Mogotón", desc: "El techo geográfico de Nicaragua a 2,107 metros sobre el nivel del mar.", imagen: "/images/departamentos/nueva-segovia-mogoton.png" },
      { nombre: "Santuario de Dipilto", desc: "Gruta religiosa rodeada de pinos y fuentes de agua pura.", imagen: "/images/departamentos/nueva-segovia-dipilto.png" },
      { nombre: "Parque Central de Ocotal", desc: "Jardín botánico urbano con pérgolas coloniales e historia revolucionaria.", imagen: "/images/departamentos/nueva-segovia-parque.png" }
    ],
    actividades: [
      { nombre: "Gran Feria Nacional del Maíz en Jalapa", fecha: "Septiembre", desc: "La mayor celebración gastronómica del maíz en Centroamérica con carrozas y platos típicos." },
      { nombre: "Fiestas de Nuestra Señora de la Asunción", fecha: "Agosto", desc: "Celebraciones patronales en Ocotal." }
    ]
  },

  boaco: {
    slug: "boaco",
    nombre: "Boaco",
    apodo: "La Ciudad de Dos Pisos",
    cabecera: "Boaco",
    region: "Central",
    extension: "4,177 km²",
    poblacion: "~185,000 hab.",
    fundacion: "1895 (Título de Ciudad)",
    coordenadas: [-85.42, 12.53],
    imagenHero: "/images/departamentos/boaco-hero.png",
    imagenCard: "/images/departamentos/boaco-card.png",
    imagenReferencia: "/images/galeria-departamentos/boaco/1.1.jpg",
    galeria: ["/images/galeria-departamentos/boaco/2.jpg","/images/galeria-departamentos/boaco/3.jpg","/images/galeria-departamentos/boaco/4.jpg","/images/galeria-departamentos/boaco/5.jpg","/images/galeria-departamentos/boaco/6.jpg","/images/galeria-departamentos/boaco/7.jpg"],
    historia: {
      resumen: "Boaco proviene del náhuatl 'Boaj-yarr' (Lugar de los encantados). Su cabecera es famosa mundialmente por su topografía accidentada y empinada que da la ilusión óptica de estar dividida en niveles o 'pisos'.",
      origenEtimologico: "Del Náhuatl y Sumo 'Boaj-yarr', que traduce 'Pueblo de los encantadores' o 'Lugar de los sabios de la montaña'.",
      hitos: [
        { año: "1895", evento: "Elevada a la categoría de Ciudad por el Presidente José Santos Zelaya." },
        { año: "1935", evento: "Creación del departamento de Boaco independizándose de Chontales." }
      ],
      personajes: [
        { nombre: "Dr. Hernán Robleto Huete", titulo: "Escritor y Periodista (1892-1968)", aporte: "Novelista boaqueño de trascendencia hispanoamericana autor de 'Sangre en el Trópico'." },
        { nombre: "Armando Incer Barquero", titulo: "Historiador y Cronista", aporte: "Investigador fundamental que inmortalizó el patrimonio folclórico y urbano de la Ciudad de Dos Pisos." }
      ],
      patrimonio: [
        { sitio: "Graderías y Paseo Tovar", epoca: "Urbano (Siglo XIX)", desc: "Trazado escalonado único en el país que conecta los dos niveles arquitectónicos de la ciudad." },
        { sitio: "Parroquia Santiago Apóstol de Boaco", epoca: "Colonial (1860)", desc: "Templo de sólida mampostería colonial donde se celebra la ancestral comedia de Moros y Cristianos." }
      ]
    },
    economia: {
      resumen: "Tradicionalmente ganadera y agrícola. Produce carne de res, derivados lácteos de calidad, granos básicos y café en sus zonas altas.",
      sectores: [
        { titulo: "Ganadería Bovina y Lácteos", desc: "Producción de leche, queso y mantequilla para el mercado nacional e internacional." },
        { titulo: "Agricultura y Café", desc: "Cultivo de maíz, frijol y granos de café en las sierras de Camoapa." },
        { titulo: "Pirotecnia y Artesanía en Cuero", desc: "Confección de monturas, sombreros pita en Camoapa y productos de cuero." }
      ]
    },
    turismo: {
      resumen: "Turismo rural en fincas ganaderas, senderismo montañoso en formaciones rocosas y traditions folclóricas coloniales.",
      atractivos: [
        { nombre: "La Ciudad de Dos Pisos (Boaco)", desc: "Recorrido a pie por sus empinadas gradas, parques a desnivel y miradores urbanos." },
        { nombre: "Piedra del Cuachilape en Camoapa", desc: "Imponente monolito rocoso ideal para el senderismo y la escalada." },
        { nombre: "Embalse Las Canoas", desc: "Extenso cuerpo de agua para la pesca artesanal y avistamiento de aves." }
      ]
    },
    pasatiempos: {
      resumen: "Subir los graderíos de la ciudad, comprar sombreros pita en Camoapa y probar los quesos aromatizados.",
      items: [
        "Caminar por el Paseo Tovar apreciando la arquitectura a desnivel de Boaco.",
        "Comprar un genuino sombrero de pita elaborado a mano en Camoapa.",
        "Visitar las reservas privadas y fincas ganaderas de la serranía."
      ]
    },
    lugaresImportantes: [
      { nombre: "Paseo Tovar y Parque Central", desc: "Corazón urbano de la Ciudad de Dos Pisos.", imagen: "/images/departamentos/boaco-paseo.png" },
      { nombre: "Piedra del Cuachilape", desc: "Monolito geológico legendario en las afueras de Camoapa.", imagen: "/images/departamentos/boaco-piedra.png" },
      { nombre: "Iglesia Parroquial de Santiago", desc: "Templo colonial de fachada austera e historia viva.", imagen: "/images/departamentos/boaco-iglesia.png" }
    ],
    actividades: [
      { nombre: "Comedia Bailete de Moros y Cristianos", fecha: "25 de Julio", desc: "Tradición colonial dancística única en honor a Santiago Apóstol." },
      { nombre: "Feria Ganadera de Camoapa", fecha: "Marzo", desc: "Juzgamiento de ganado de pura sangre y subastas ganaderas." }
    ]
  },

  chontales: {
    slug: "chontales",
    nombre: "Chontales",
    apodo: "Tierra de Vaqueros: Ríos de Leche y Piedras de Cuajada",
    cabecera: "Juigalpa",
    region: "Central",
    extension: "6,481 km²",
    poblacion: "~190,000 hab.",
    fundacion: "1858",
    coordenadas: [-85.04, 12.12],
    imagenHero: "/images/departamentos/chontales-hero.png",
    imagenCard: "/images/departamentos/chontales-card.png",
    imagenReferencia: "/images/galeria-departamentos/chontales/1.1.jpg",
    galeria: ["/images/galeria-departamentos/chontales/2.jpg","/images/galeria-departamentos/chontales/3.jpg","/images/galeria-departamentos/chontales/4.jpg","/images/galeria-departamentos/chontales/5.jpg","/images/galeria-departamentos/chontales/6.jpg","/images/galeria-departamentos/chontales/7.jpg"],
    historia: {
      resumen: "Su nombre proviene del náhuatl 'Chondalli' (extranjero o montaraz). Región habitada por valientes tribus precolombinas que dejaron petroglifos y estatuas monolíticas únicas. Es el corazón de la cultura vaquera nicaragüense.",
      origenEtimologico: "Del Náhuatl 'Chontalli', vocablo con el que las tribus del pacífico llamaban a los 'pueblos extranjeros o serranos'.",
      hitos: [
        { año: "1858", evento: "Creación del departamento de Chontales." },
        { año: "1965", evento: "Fundación del Museo Arqueológico Gregorio Aguilar Barea con estatuaria gigante." }
      ],
      personajes: [
        { nombre: "Prof. Gregorio Aguilar Barea", titulo: "Arqueólogo e Historiador (1910-1970)", aporte: "Fundador del Museo Arqueológico de Juigalpa e impulsor de la preservación estatuaria monolítica." },
        { nombre: "Guillermo Rothschuh Tablada", titulo: "Poeta de Amerrisque (1926-2022)", aporte: "Cantaor mayor de la comarca chontaleña y educador de generaciones de intelectuales nicaragüenses." }
      ],
      patrimonio: [
        { sitio: "Museo Arqueológico Gregorio Aguilar Barea", epoca: "Precolombino (~500 d.C.)", desc: "Custodia la mayor colección del continente de estatuas antropomorfas esculpidas en basalto." },
        { sitio: "Cordillera Sierra de Amerrisque", epoca: "Formación Geológica Prehistórica", desc: "Meseta rocosa sagrada para los antiguos chontales con abundantes petroglifos y miradores míticos." }
      ]
    },
    economia: {
      resumen: "Potencia ganadera de Nicaragua. Lidera la producción lechera y cárnica nacional con una próspera industria de quesos de exportación.",
      sectores: [
        { titulo: "Ganadería Bovina Intensiva", desc: "El mayor hato ganadero del país y plantas procesadoras de leche (LALA, Prolacsa)." },
        { titulo: "Minería de Oro y Plata", desc: "Explotación minera histórica en Santo Domingo y La Libertad." },
        { titulo: "Comercio de Insumos Agropecuarios", desc: "Juigalpa es el centro comercial ganadero por excelencia." }
      ]
    },
    turismo: {
      resumen: "Turismo de aventura en mesetas rocosas, arqueología de estatuas gigantes y la auténtica experiencia vaquera.",
      atractivos: [
        { nombre: "Cordillera Sierra de Amerrisque", desc: "Meseta rocosa de paisajes míticos, ideal para el senderismo extremo y escalada." },
        { nombre: "Archipiélago El Nancital", desc: "Grupo de islas vírgenes en el Lago Cocibolca con playas de agua dulce." },
        { nombre: "Museo Arqueológico de Juigalpa", desc: "Colección única de estatuas de piedra esculpidas por antiguos chontales." }
      ]
    },
    pasatiempos: {
      resumen: "Montar a caballo, asistir a corridas de toros estilo chontaleño y comer queso ahumado con rosquillas.",
      items: [
        "Explorar las crestas de la Sierra de Amerrisque al amanecer.",
        "Navegar en lancha hacia las islas del Archipiélago El Nancital.",
        "Degustar quesos de cuajada ahumada y suero campesino."
      ]
    },
    lugaresImportantes: [
      { nombre: "Sierra de Amerrisque", desc: "Imponente muralla de roca que según teorías dio origen al nombre de América.", imagen: "/images/departamentos/chontales-amerrisque.png" },
      { nombre: "Catedral Nuestra Señora de la Asunción", desc: "Edificio moderno con techo voladizo único en Juigalpa.", imagen: "/images/departamentos/chontales-catedral.png" },
      { nombre: "Zoocriadero y Parque Zoológico de Juigalpa", desc: "Uno de los zoológicos más completos del país.", imagen: "/images/departamentos/chontales-zoo.png" }
    ],
    actividades: [
      { nombre: "Fiestas Patronales de Juigalpa", fecha: "15 de Agosto", desc: "Las fiestas bravas y rodeos de toros más famosos y concurridos de Nicaragua." },
      { nombre: "Feria Ganadera Hípica de Chontales", fecha: "Agosto", desc: "Desfile de miles de montados luciendo trajes vaqueros tradicionales." }
    ]
  },

  "rio-san-juan": {
    slug: "rio-san-juan",
    nombre: "Río San Juan",
    apodo: "El Mini Amazonas de Centroamérica",
    cabecera: "San Carlos",
    region: "Caribe",
    extension: "7,543 km²",
    poblacion: "~135,000 hab.",
    fundacion: "1957",
    coordenadas: [-84.7, 11.2],
    imagenHero: "/images/departamentos/rio-san-juan-hero.png",
    imagenCard: "/images/departamentos/rio-san-juan-card.png", 
    imagenReferencia: "/images/galeria-departamentos/rio-san-juan/1.1.jpg",
    galeria: ["/images/galeria-departamentos/rio-san-juan/2.jpg","/images/galeria-departamentos/rio-san-juan/3.jpg","/images/galeria-departamentos/rio-san-juan/4.jpg","/images/galeria-departamentos/rio-san-juan/5.jpg","/images/galeria-departamentos/rio-san-juan/6.jpg","/images/galeria-departamentos/rio-san-juan/7.jpg"],
    historia: {
      resumen: "Corredor fluvial histórico que une el Gran Lago de Nicaragua con el Mar Caribe. En la época colonial fue la ruta elegida por exploradores y piratas. En 1762 la joven Rafaela Herrera defendió heroicamente la Fortaleza de El Castillo del ataque británico.",
      origenEtimologico: "Bautizado en 1539 por Alonso Calero al navegar el 'Desaguadero del Lago' en la festividad de San Juan Bautista.",
      hitos: [
        { año: "1675", evento: "Construcción de la Fortaleza de la Inmaculada Concepción en El Castillo." },
        { año: "1762", evento: "Gesta heroica de Rafaela Herrera repeliendo la invasión naval inglesa." },
        { año: "1977", evento: "Ernesto Cardenal funda la comunidad artística en el Archipiélago de Solentiname." }
      ],
      personajes: [
        { nombre: "Rafaela Herrera", titulo: "Heroína de la Patria (1742-1805)", aporte: "Joven de 19 años que en 1762 lideró la artillería de la Fortaleza El Castillo derrotando a la armada británica." },
        { nombre: "Ernesto Cardenal", titulo: "Poeta y Sacerdote (1925-2020)", aporte: "Fundador de la comunidad de Solentiname y promotor mundial de la pintura primitivista." }
      ],
      patrimonio: [
        { sitio: "Fortaleza de la Inmaculada Concepción", epoca: "Colonial (1675)", desc: "Monumento Nacional. Castillo de piedra abaluartado erigido en la selva sobre los rápidos del río San Juan." },
        { sitio: "Archipiélago de Solentiname", epoca: "Reserva Histórico-Cultural", desc: "Conjunto de 36 islas en el lago Cocibolca donde floreció el movimiento primitivista de pintura y artesanía." }
      ]
    },
    economia: {
      resumen: "Basada en el ecoturismo fluvial, la pesca deportiva sustentable, el cacao de aroma fino y el transporte de carga hídrico.",
      sectores: [
        { titulo: "Ecoturismo y Aventura Fluvial", desc: "Hoteles de selva, touroperadores de pesca de sábalo real y visitas históricas." },
        { titulo: "Cacao y Agroforestería", desc: "Siembra de cacao fino de aroma para chocolates gourmet europeos." },
        { titulo: "Pesca y Comercio Fronterizo", desc: "Punto de intercambio comercial en el muelle de San Carlos con Costa Rica." }
      ]
    },
    turismo: {
      resumen: "Un paraíso indómito de selva virgen, fortalezas históricas en la jungla y pintura primitivista en islas pacíficas.",
      atractivos: [
        { nombre: "Fortaleza de la Inmaculada Concepción (El Castillo)", desc: "Imponente castillo de piedra del siglo XVII conservado en medio de la selva tropical." },
        { nombre: "Reserva Biológica Indio Maíz", desc: "Una de las reservas de biosfera de selva húmeda más importantes del continente." },
        { nombre: "Archipiélago de Solentiname", desc: "Grupo de islas habitadas por artistas de la pintura primitivista y artesanos de balsa." }
      ]
    },
    pasatiempos: {
      resumen: "Navegar en panga por el río, pescar el gran Sábalo Real, pintar con los artesanos de Solentiname y avistar caimanes nocturnos.",
      items: [
        "Tour nocturno en lancha para el avistamiento de caimanes y aves en Los Guatuzos.",
        "Comprar garzas y peces de madera de balsa pintados a mano en Solentiname.",
        "Caminar por las murallas de piedra de la Fortaleza El Castillo al atardecer."
      ]
    },
    lugaresImportantes: [
      { nombre: "Fortaleza El Castillo", desc: "Monumento histórico nacional rodeado por los rápidos del río San Juan.", imagen: "/images/departamentos/rio-san-juan-castillo.png" },
      { nombre: "Archipiélago de Solentiname (Isla Mancarrón)", desc: "Cuna de la pintura primitivista nicaragüense.", imagen: "/images/departamentos/rio-san-juan-solentiname.png" },
      { nombre: "Malecón de San Carlos", desc: "Puerto y mirador donde nace el majestuoso río desde el lago Cocibolca.", imagen: "/images/departamentos/rio-san-juan-sancarlos.png" }
    ],
    actividades: [
      { nombre: "Torneo Internacional de Pesca del Sábalo Real", fecha: "Septiembre", desc: "Competencia de pesca deportiva con captura y liberación en San Carlos." },
      { nombre: "Festival de la Purísima Fluvial", fecha: "7 de Diciembre", desc: "Procesión de lanchas decoradas sobre las aguas del río." }
    ]
  },

  raccn: {
    slug: "raccn",
    nombre: "RACCN (Caribe Norte)",
    apodo: "La Costa Miskita y Territorio Autónomo",
    cabecera: "Puerto Cabezas (Bilwi)",
    region: "Caribe",
    extension: "33,106 km²",
    poblacion: "~530,000 hab.",
    fundacion: "1987 (Estatuto de Autonomía)",
    coordenadas: [-84.2, 14.0],
    imagenHero: "/images/departamentos/raccn-hero.png",
    imagenCard: "/images/departamentos/raccn-card.png",
    imagenReferencia: "/images/galeria-departamentos/raccn/1.1.jpg",
    galeria: ["/images/galeria-departamentos/raccn/2.jpg","/images/galeria-departamentos/raccn/3.jpg","/images/galeria-departamentos/raccn/4.jpg","/images/galeria-departamentos/raccn/5.jpg","/images/galeria-departamentos/raccn/6.jpeg","/images/galeria-departamentos/raccn/7.jpg"],
    historia: {
      resumen: "La región autónoma más extensa de Nicaragua. Hogar ancestral del pueblo Miskito, Mayangna y Creoles. Mantuvo un protectorado británico histórico que moldeó su idioma (miskito y criollo inglés) y sus tradiciones únicas.",
      origenEtimologico: "Territorio soberano de la gran nación Miskita, Mayangna y Tuahka que mantuvo la independencia comunitaria durante siglos.",
      hitos: [
        { año: "1894", evento: "Reincorporación de la Mosquitia a la República de Nicaragua." },
        { año: "1987", evento: "Promulgación de la Ley de Autonomía de las Regiones de la Costa Caribe." },
        { año: "1997", evento: "Declaración de la Reserva de Biosfera Bosawás como patrimonio mundial de la UNESCO." }
      ],
      personajes: [
        { nombre: "Rey Robert Charles Frederic", titulo: "Monarca de la Mosquitia (1824-1842)", aporte: "Líder soberano que consolidó las alianzas territoriales e internacionales del pueblo miskito." },
        { nombre: "Consejo de Ancianos Mayangnas", titulo: "Guardianes de Bosawás", aporte: "Autoridades comunitarias que preservan el conocimiento botánico y cosmológico de la nebliselva." }
      ],
      patrimonio: [
        { sitio: "Reserva de Biosfera Bosawás", epoca: "Patrimonio Mundial UNESCO (1997)", desc: "El segundo pulmón tropical del continente americano y hogar ancestral de etnias autóctonas." },
        { sitio: "Cayos Miskitos", epoca: "Reserva Biológica y Marina", desc: "Santuario caribeño de arrecifes de coral y praderas marinas donde se conservan las tradiciones de pesca indígena." }
      ]
    },
    economia: {
      resumen: "Rica en recursos marinos, mineros y forestales. Destaca por la pesca del marisco caribeño, la minería de oro y el comercio pesquero.",
      sectores: [
        { titulo: "Pesca y Mariscado Industrial", desc: "Captura de langosta del caribe, camarón y peces de escama." },
        { titulo: "Minería de Oro y Plata (Triángulo Minero)", desc: "Explotación en los municipios de Siuna, Rosita y Bonanza." },
        { titulo: "Forestal y Madera Fina", desc: "Manejo forestal de maderas preciosas como caoba y pino caribeño." }
      ]
    },
    turismo: {
      resumen: "Ecoturismo comunitario de selva virgen, cultura autóctona miskita y cayos coralinos despoblados.",
      atractivos: [
        { nombre: "Cayos Miskitos", desc: "Archipiélago de cayos bioluminiscentes y arrecifes en medio del Mar Caribe." },
        { nombre: "Reserva de Biosfera Bosawás", desc: "El segundo pulmón vegetal más grande de América tras la Amazonía." },
        { nombre: "Ciudad de Bilwi (Puerto Cabezas)", desc: "Muelle histórico de madera, playas caribeñas y cultura multiétnica." }
      ]
    },
    pasatiempos: {
      resumen: "Bailar al ritmo del Palo de Mayo, comer Luk Luk y explorar comunidades pesqueras tradicionales.",
      items: [
        "Navegar en pipante (canoa indígena) por los grandes ríos de la selva.",
        "Degustar el plato tradicional Luk Luk (caldo de carne con yuca) y pan de coco.",
        "Visitar las comunidades miskitas de Waspam a orillas del río Coco."
      ]
    },
    lugaresImportantes: [
      { nombre: "Reserva de Biosfera Bosawás", desc: "Hogar de jaguares, águilas harpía y bosques primarios vírgenes.", imagen: "/images/departamentos/raccn-bosawas.png" },
      { nombre: "Cayos Miskitos", desc: "Reserva marina paradisíaca ideal para el buceo y la conservación de tortugas verdes.", imagen: "/images/departamentos/raccn-cayos.png" },
      { nombre: "Muelle de Bilwi", desc: "Estructura sobre el Caribe icono del comercio del norte caribeño.", imagen: "/images/departamentos/raccn-muelle.png" }
    ],
    actividades: [
      { nombre: "King Pulanka", fecha: "Enero", desc: "Fiesta tradicional miskita que recrea la coronación del Rey Miskito con bailes y sátira." },
      { nombre: "Fiestas del Palo de Mayo", fecha: "Mayo", desc: "Bailes afrocaribeños de fertilidad y bienvenida a las lluvias." }
    ]
  },

  raccs: {
    slug: "raccs",
    nombre: "RACCS (Caribe Sur)",
    apodo: "Paraíso Tropical y Corn Island",
    cabecera: "Bluefields",
    region: "Caribe",
    extension: "27,260 km²",
    poblacion: "~420,000 hab.",
    fundacion: "1987 (Estatuto de Autonomía)",
    coordenadas: [-84.3, 12.2],
    imagenHero: "/images/departamentos/raccs-hero.png",
    imagenCard: "/images/departamentos/raccs-card.png",
    imagenReferencia: "/images/galeria-departamentos/raccs/1.1.jpg",
    galeria: ["/images/galeria-departamentos/raccs/2.jpg","/images/galeria-departamentos/raccs/3.jpg","/images/galeria-departamentos/raccs/4.jpg","/images/galeria-departamentos/raccs/5.webp","/images/galeria-departamentos/raccs/6.jpg","/images/galeria-departamentos/raccs/7.jpg"],
    historia: {
      resumen: "Mosaico cultural fascinante habitado por seis pueblos (Creole, Miskito, Mestizo, Garífuna, Rama y Ulwa). Su cabecera Bluefields debe su nombre al pirata holandés Abraham Blauvelt. En 1841 se decretó la emancipación de la esclavitud en Corn Island.",
      origenEtimologico: "Punto neurálgico del Caribe Sur habitado por seis pueblos hermanos (Creole, Miskito, Garífuna, Rama, Ulwa y Mestizo).",
      hitos: [
        { año: "1841", evento: "Decreto histórico de abolición de la esclavitud en Corn Island por el superintendente británico." },
        { año: "1987", evento: "Establecimiento de la Región Autónoma del Caribe Sur." },
        { año: "2019", evento: "Inauguración de la primera carretera pavimentada que une el Pacífico con Bluefields." }
      ],
      personajes: [
        { nombre: "Abraham Blauvelt", titulo: "Corsario Neerlandés (Siglo XVII)", aporte: "Navegante holandés cuyos refugios costeros dieron origen a la fundación y nombre de Bluefields." },
        { nombre: "Miss Lizzie Nelson", titulo: "Matriarca del Folclore (1925-2015)", aporte: "Embajadora cultural que preservó el baile y ritmos del Mayo Ya (Palo de Mayo) caribeño." }
      ],
      patrimonio: [
        { sitio: "Monumento a la Emancipación en Corn Island", epoca: "Histórico (1841)", desc: "Conmemora la abolición definitiva de la esclavitud en las islas del caribe nicaragüense." },
        { sitio: "Barrio Histórico de Cotton Tree", epoca: "Tradicional", desc: "Cuna de la cultura Creole de Bluefields con sus icónicas casonas de madera y festivales afrocaribeños." }
      ]
    },
    economia: {
      resumen: "Basada en el turismo internacional de playas paradisíacas, la pesca industrial de camarón y langosta, el puerto comercial y la agricultura caribeña.",
      sectores: [
        { titulo: "Turismo Internacional de Sol y Playa", desc: "Corn Island y Little Corn Island atraen turismo de buceo y descanso de clase mundial." },
        { titulo: "Pesca y Exportación Marítima", desc: "Procesamiento de langosta, cangrejo y camarón en Bluefields." },
        { titulo: "Agricultura Caribeña", desc: "Cultivo de palma africana, cacao, yuca y coco." }
      ]
    },
    turismo: {
      resumen: "Las mejores playas de arena blanca y aguas turquesa del Caribe nicaragüense, arrecifes vivientes y ritmos afrocaribeños.",
      atractivos: [
        { nombre: "Corn Island y Little Corn Island", desc: "Islas paradisíacas de aguas transparentes sin autos, ideales para buceo en arrecifes." },
        { nombre: "Bluefields", desc: "Capital cultural del caribe sur, famosa por su gastronomía, museos y el festival Palo de Mayo." },
        { nombre: "Laguna de Perlas (Pearl Lagoon)", desc: "Tranquila bahía rodeada de pueblos pesqueros garífunas y creoles." }
      ]
    },
    pasatiempos: {
      resumen: "Bucear en los arrecifes de Corn Island, bailar al ritmo del Maypole y saborear un auténtico Rundown de mariscos.",
      items: [
        "Hacer snorkel en la pirámide sumergida de Little Corn Island.",
        "Comer Rundown (sopa de mariscos en leche de coco) fresca en Bluefields.",
        "Disfrutar de las playas vírgenes de Otto Beach en Little Corn."
      ]
    },
    lugaresImportantes: [
      { nombre: "Little Corn Island", desc: "La joya caribeña sin vehículos a motor con senderos de jungla y playas de coral.", imagen: "/images/departamentos/raccs-littlecorn.png" },
      { nombre: "Big Corn Island", desc: "Isla principal con el monumento Soul Beach y arrecifes impresionantes.", imagen: "/images/departamentos/raccs-bigcorn.png" },
      { nombre: "Bahía de Bluefields", desc: "Puerto y centro neurálgico de la cultura afrodescendiente del país.", imagen: "/images/departamentos/raccs-bluefields.png" }
    ],
    actividades: [
      { nombre: "Fiestas del Mayo Ya (Palo de Mayo)", fecha: "Todo el mes de Mayo", desc: "La mayor expresión dancística y folclórica afrocaribeña en las calles de Bluefields." },
      { nombre: "Celebración de la Emancipación de la Esclavitud", fecha: "27 de Agosto", desc: "Fiesta tradicional en Corn Island con carreras de caballos y sopa de cangrejo gratuita para todos." }
    ]
  }
};
