"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";

// Guías turísticos de demostración con imágenes REALES del proyecto
const MOCK_GUIAS = [
  {
    id: "guia-1",
    nombre_completo: "Carlos Mendoza Silva",
    avatar_url: "/images/art1.jpeg",
    departamento_principal: "León",
    departamentos_secundarios: ["Chinandega", "Managua"],
    especialidad: "Senderismo y Volcanes",
    idiomas: "Español, Inglés",
    experiencia_anios: 8,
    tarifa_aprox: "$30 - $50 / día",
    biografia: "Guía nativo de León con más de 8 años guiando excursiones al Cerro Negro (Sandboarding), Volcán Momotombo y Telica. Especialista en vulcanología de la Cordillera de los Maribios y primeros auxilios de montaña.",
    telefono_contacto: "+505 8899 1122",
    whatsapp: "50588991122",
    instagram: "@carlos_volcano_tours",
    licencia_intur: "INTUR-LE-2018-941",
    rating_promedio: 4.9,
    total_resenas: 34,
    activo: true,
    galeria_fotos: [
      "/images/galeria-departamentos/leon/1.1.jpg",
      "/images/galeria-departamentos/leon/2.jpg",
      "/images/galeria-departamentos/leon/3.jpg",
      "/images/galeria-departamentos/leon/4.jpg"
    ],
    resenas: [
      {
        id: "r1",
        autor_nombre: "Sarah Jenkins",
        autor_avatar: "/images/art2.jpeg",
        puntuacion: 5,
        comentario: "¡Carlos fue insuperable en Cerro Negro! Nos cuidó en todo momento y nos contó la historia geológica fascinante de Nicaragua.",
        created_at: "2026-08-15T10:30:00Z"
      },
      {
        id: "r2",
        autor_nombre: "Mateo Rivas",
        autor_avatar: "/images/art3.jpeg",
        puntuacion: 5,
        comentario: "Excelente tour nocturno en el volcán Telica viendo la lava arder. Conoce los mejores spots fotográficos.",
        created_at: "2026-07-28T14:15:00Z"
      }
    ]
  },
  {
    id: "guia-2",
    nombre_completo: "María José López",
    avatar_url: "/images/art2.jpeg",
    departamento_principal: "Granada",
    departamentos_secundarios: ["Masaya", "Rivas"],
    especialidad: "Cultura e Historia",
    idiomas: "Español, Inglés, Francés",
    experiencia_anios: 10,
    tarifa_aprox: "$35 - $60 / día",
    biografia: "Historiadora y guía certificada especializada en la arquitectura colonial de la Gran Sultana, travesías náuticas en las Isletas de Granada y expediciones al dosel boscoso del Volcán Mombacho.",
    telefono_contacto: "+505 8765 4321",
    whatsapp: "50587654321",
    instagram: "@maria_granada_heritage",
    licencia_intur: "INTUR-GR-2016-512",
    rating_promedio: 5.0,
    total_resenas: 42,
    activo: true,
    galeria_fotos: [
      "/images/galeria-departamentos/granada/1.1.jpg",
      "/images/galeria-departamentos/granada/2.jpg",
      "/images/galeria-departamentos/granada/3.jpg",
      "/images/galeria-departamentos/granada/4.jpeg"
    ],
    resenas: [
      {
        id: "r3",
        autor_nombre: "Lucía Fernández",
        autor_avatar: "/images/art5.png",
        puntuacion: 5,
        comentario: "Un recorrido cultural inolvidable por los templos y el Convento San Francisco. María transmite un amor contagioso por la historia.",
        created_at: "2026-08-20T11:00:00Z"
      }
    ]
  },
  {
    id: "guia-3",
    nombre_completo: "Alejandro Jarquín",
    avatar_url: "/images/art3.jpeg",
    departamento_principal: "Rivas",
    departamentos_secundarios: ["Isla de Ometepe", "San Juan del Sur"],
    especialidad: "Ecoturismo Integral",
    idiomas: "Español, Inglés",
    experiencia_anios: 6,
    tarifa_aprox: "$25 - $45 / día",
    biografia: "Especialista en la mística Isla de Ometepe. Guiado de ascenso a los volcanes Concepción y Maderas, cascada San Ramón, petroglifos precolombinos y tours de pesca artesanal.",
    telefono_contacto: "+505 8812 3456",
    whatsapp: "50588123456",
    instagram: "@ometepe_ecotours",
    licencia_intur: "INTUR-RI-2020-304",
    rating_promedio: 4.8,
    total_resenas: 27,
    activo: true,
    galeria_fotos: [
      "/images/galeria-departamentos/rivas/1.1.webp",
      "/images/galeria-departamentos/rivas/2.jpg",
      "/images/galeria-departamentos/rivas/3.jpg",
      "/images/galeria-departamentos/rivas/4.jpg"
    ],
    resenas: [
      {
        id: "r4",
        autor_nombre: "David Miller",
        autor_avatar: "/images/art1.jpeg",
        puntuacion: 5,
        comentario: "The trek to Volcán Maderas lagoon was challenging but Alejandro kept our spirits high. Truly awesome experience!",
        created_at: "2026-08-02T16:45:00Z"
      }
    ]
  },
  {
    id: "guia-4",
    nombre_completo: "Brenda Castillo",
    avatar_url: "/images/art5.png",
    departamento_principal: "Matagalpa",
    departamentos_secundarios: ["Jinotega", "Estelí"],
    especialidad: "Avistamiento de Aves",
    idiomas: "Español, Inglés, Alemán",
    experiencia_anios: 12,
    tarifa_aprox: "$40 - $70 / día",
    biografia: "Ornitóloga y guía de ecoturismo en las reservas montañosas del norte. Recorridos fotográficos de aves en Selva Negra, Macizo Peñas Blancas y fincas cafetaleras orgánicas.",
    telefono_contacto: "+505 8944 5566",
    whatsapp: "50589445566",
    instagram: "@brenda_birds_nicaragua",
    licencia_intur: "INTUR-MT-2015-118",
    rating_promedio: 4.9,
    total_resenas: 39,
    activo: true,
    galeria_fotos: [
      "/images/galeria-departamentos/matagalpa/1.1.jpg",
      "/images/galeria-departamentos/matagalpa/2.jpg",
      "/images/galeria-departamentos/matagalpa/3.jpg",
      "/images/galeria-departamentos/matagalpa/4.jpg"
    ],
    resenas: [
      {
        id: "r5",
        autor_nombre: "Hans Weber",
        autor_avatar: "/images/art4.png",
        puntuacion: 5,
        comentario: "Sehr gut! Brenda hat uns das bezaubernde Quetzal im Nebelwald gezeigt. Unglaubliche Erfahrung.",
        created_at: "2026-07-12T09:20:00Z"
      }
    ]
  },
  {
    id: "guia-5",
    nombre_completo: "Nestor Moncada",
    avatar_url: "/images/art4.png",
    departamento_principal: "Masaya",
    departamentos_secundarios: ["Carazo", "Granada"],
    especialidad: "Gastronomía Tradicional",
    idiomas: "Español, Inglés",
    experiencia_anios: 7,
    tarifa_aprox: "$25 - $40 / día",
    biografia: "Apasionado por el folclore y los sabores auténticos de Masaya y los Pueblos Blancos. Experto en recorridos artesanales por Monimbó, Catarina, San Juan de Oriente y avistamiento del lago de lava en el Volcán Masaya.",
    telefono_contacto: "+505 8633 2211",
    whatsapp: "50586332211",
    instagram: "@nestor_masaya_tradicion",
    licencia_intur: "INTUR-MS-2019-722",
    rating_promedio: 4.7,
    total_resenas: 19,
    activo: true,
    galeria_fotos: [
      "/images/galeria-departamentos/masaya/1.1.jpg",
      "/images/galeria-departamentos/masaya/2.jpg",
      "/images/galeria-departamentos/masaya/3.jpg",
      "/images/galeria-departamentos/masaya/4.jpeg"
    ],
    resenas: []
  }
];

const DEPARTAMENTOS_LIST = [
  "Todos",
  "Managua", "León", "Chinandega", "Granada", "Masaya", "Carazo", "Rivas",
  "Matagalpa", "Jinotega", "Estelí", "Madriz", "Nueva Segovia", "Boaco",
  "Chontales", "Río San Juan", "RACCN", "RACCS"
];

const ESPECIALIDADES_LIST = [
  "Todas",
  "Senderismo y Volcanes",
  "Cultura e Historia",
  "Avistamiento de Aves",
  "Playa y Surf",
  "Gastronomía Tradicional",
  "Ecoturismo Integral"
];

export default function GuiasPage() {
  const { lang } = useTranslation();
  const { session, perfil } = useAuth();

  const [guias, setGuias] = useState(MOCK_GUIAS);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedDept, setSelectedDept] = useState("Todos");
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  // Modal de Detalle de Guía
  const [selectedGuiaModal, setSelectedGuiaModal] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("info");

  // Formulario de Reseña
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Cargar guías de Supabase (con fallback a MOCK_GUIAS)
  useEffect(() => {
    async function loadGuias() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("guias_turisticos")
          .select("*, perfiles(nombre_completo, avatar_url, email)")
          .eq("activo", true);

        if (!error && data && data.length > 0) {
          const formatted = data.map((g) => ({
            ...g,
            nombre_completo: g.perfiles?.nombre_completo || g.nombre_completo || "Guía Turístico",
            avatar_url: g.perfiles?.avatar_url || g.avatar_url || "/images/perfil.svg",
            resenas: g.resenas || [],
            galeria_fotos: g.galeria_fotos && g.galeria_fotos.length > 0 ? g.galeria_fotos : [
              "/images/galeria-departamentos/leon/1.1.jpg",
              "/images/galeria-departamentos/leon/2.jpg"
            ]
          }));
          setGuias(formatted);
        } else {
          setGuias(MOCK_GUIAS);
        }
      } catch (err) {
        console.warn("Could not query guias_turisticos, using fallback data:", err);
        setGuias(MOCK_GUIAS);
      } finally {
        setLoading(false);
      }
    }
    loadGuias();
  }, []);

  // Filtrado y ordenamiento de guías
  const guiasFiltrados = guias.filter((guia) => {
    const matchDept =
      selectedDept === "Todos" ||
      guia.departamento_principal?.toLowerCase() === selectedDept.toLowerCase() ||
      (guia.departamentos_secundarios &&
        guia.departamentos_secundarios.some(
          (d) => d.toLowerCase() === selectedDept.toLowerCase()
        ));

    const matchEspec =
      selectedEspecialidad === "Todas" ||
      guia.especialidad?.toLowerCase().includes(selectedEspecialidad.toLowerCase());

    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      guia.nombre_completo?.toLowerCase().includes(q) ||
      guia.biografia?.toLowerCase().includes(q) ||
      guia.especialidad?.toLowerCase().includes(q) ||
      guia.departamento_principal?.toLowerCase().includes(q);

    return matchDept && matchEspec && matchQuery;
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating_promedio - a.rating_promedio;
    if (sortBy === "experiencia") return b.experiencia_anios - a.experiencia_anios;
    return 0;
  });

  // Enviar reseña
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!selectedGuiaModal || !newComment.trim()) return;

    setSubmittingReview(true);
    setReviewSuccessMsg("");

    const nuevaResena = {
      id: "res-" + Date.now(),
      guia_id: selectedGuiaModal.id,
      autor_nombre: perfil?.nombre_completo || session?.user?.email?.split("@")[0] || "Turista Atlan",
      autor_avatar: perfil?.avatar_url || "/images/perfil.svg",
      puntuacion: newRating,
      comentario: newComment.trim(),
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from("resenas_guias").insert({
        guia_id: selectedGuiaModal.id,
        autor_id: session?.user?.id,
        puntuacion: newRating,
        comentario: newComment.trim()
      });
    } catch (err) {
      console.warn("Notice: Saved review to local state:", err);
    }

    setGuias((prevGuias) =>
      prevGuias.map((g) => {
        if (g.id === selectedGuiaModal.id) {
          const resenasActuales = g.resenas || [];
          const nuevasResenas = [nuevaResena, ...resenasActuales];
          const suma = nuevasResenas.reduce((acc, curr) => acc + curr.puntuacion, 0);
          const nuevoPromedio = Number((suma / nuevasResenas.length).toFixed(1));

          const guiaActualizado = {
            ...g,
            resenas: nuevasResenas,
            total_resenas: nuevasResenas.length,
            rating_promedio: nuevoPromedio
          };

          setSelectedGuiaModal(guiaActualizado);
          return guiaActualizado;
        }
        return g;
      })
    );

    setSubmittingReview(false);
    setNewComment("");
    setReviewSuccessMsg(lang === "en" ? "Review posted successfully!" : "¡Reseña publicada con éxito!");
    setTimeout(() => setReviewSuccessMsg(""), 3000);
  };

  return (
    <div style={styles.pageWrapper}>
      <Navbar activePage="guias" />

      {/* CAPA DE FONDO DUPLICADA EN ESPEJO DE FONDOHRACIO.PNG */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "50%",
            backgroundImage: "url('/images/fondohracio.png')",
            backgroundSize: "cover",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: "50%",
            backgroundImage: "url('/images/fondohracio.png')",
            backgroundSize: "cover",
            backgroundPosition: "left center",
            backgroundRepeat: "no-repeat",
            transform: "scaleX(-1)",
          }}
        />
      </div>

      {/* ELEMENTOS DE FONDO SVG (MARCA DE AGUA EMBLEMÁTICA DE NICARAGUA) */}
      <img
        src="/images/guardabarranco.svg"
        alt=""
        style={styles.bgSvgGuardabarranco}
      />
      <img
        src="/images/tortuga.svg"
        alt=""
        style={styles.bgSvgTortuga}
      />
      <img
        src="/images/gueguense.svg"
        alt=""
        style={styles.bgSvgGueguense}
      />

      {/* HERO BANNER DE ALTO COMPACTO Y DISEÑO ANCHO */}
      <section style={styles.heroSectionCompact}>
        <div style={styles.heroGlowLeft} />

        <div style={styles.heroContentWide}>
          <div style={styles.topMetaHeader}>
            <div style={styles.badgeHeroCompact}>
              <Icon name="compass" size={15} color="#38BDF8" />
              <span>{lang === "en" ? "Official Guide Catalogue" : "Directorio Nacional de Guías Turísticos"}</span>
            </div>

            {/* Quick Stats Pill */}
            <div style={styles.statsRowCompact}>
              <span style={styles.statPill}><b>17</b> {lang === "en" ? "Depts" : "Departamentos"}</span>
              <span style={styles.statDividerDot}>•</span>
              <span style={{ ...styles.statPill, color: "#FFD700" }}><b>4.9 ★</b> {lang === "en" ? "Rating" : "Promedio"}</span>
              <span style={styles.statDividerDot}>•</span>
              <span style={{ ...styles.statPill, color: "#10B981" }}><b>100%</b> {lang === "en" ? "Verified" : "Verificados INTUR"}</span>
            </div>
          </div>

          <h1 style={styles.heroTitleCompact}>
            {lang === "en" ? "Explore Nicaragua with Expert Local Guides" : "Explora Nicaragua con Guías Turísticos Locales"}
          </h1>
        </div>
      </section>

      {/* FILTROS Y CONTENEDOR ANCHO */}
      <main style={styles.mainContainerWide}>
        {/* BARRA DE FILTROS ULTRA PROFESIONAL EN FILAS SEPARADAS */}
        <div style={styles.filterPanelProfessional}>
          {/* Fila 1: Buscador y Ordenamiento */}
          <div style={styles.filterRow1}>
            <div style={styles.searchBoxSlim}>
              <Icon name="search" size={16} color="#0EA5E9" />
              <input
                type="text"
                placeholder={lang === "en" ? "Search guide by name, city or volcano..." : "Buscar guía por nombre, especialidad o ciudad..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInputSlim}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            <div style={styles.sortBoxSlim}>
              <span style={styles.sortLabelSlim}>{lang === "en" ? "Sort:" : "Ordenar:"}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.selectInputSlim}
              >
                <option value="rating">{lang === "en" ? "Best Rating" : "Mejor Calificación"}</option>
                <option value="experiencia">{lang === "en" ? "Experience" : "Más Experiencia"}</option>
              </select>
            </div>
          </div>

          {/* Fila 2: SELECCIÓN INDEPENDIENTE DE DEPARTAMENTO */}
          <div style={styles.filterGroupSection}>
            <div style={styles.filterSectionTitle}>
              <Icon name="mapPin" size={14} color="#0EA5E9" />
              <span>{lang === "en" ? "Filter by Department:" : "Filtrar por Departamento:"}</span>
            </div>
            <div style={styles.pillsScrollContainer}>
              {DEPARTAMENTOS_LIST.map((dept) => {
                const isActive = selectedDept.toLowerCase() === dept.toLowerCase();
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    style={{
                      ...styles.pillBtnSlim,
                      border: isActive ? "1.5px solid #0EA5E9" : "1px solid rgba(255, 255, 255, 0.12)",
                      background: isActive ? "rgba(14, 165, 233, 0.28)" : "rgba(15, 23, 42, 0.7)",
                      color: isActive ? "#38BDF8" : "#94A3B8",
                      fontWeight: isActive ? "800" : "600",
                    }}
                  >
                    {dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila 3: SELECCIÓN INDEPENDIENTE DE TIPO DE TOUR / ESPECIALIDAD */}
          <div style={styles.filterGroupSection}>
            <div style={styles.filterSectionTitle}>
              <Icon name="tag" size={14} color="#FFD700" />
              <span>{lang === "en" ? "Tour Specialty / Experience:" : "Tipo de Tour / Especialidad del Guía:"}</span>
            </div>
            <div style={styles.pillsScrollContainer}>
              {ESPECIALIDADES_LIST.map((esp) => {
                const isActive = selectedEspecialidad.toLowerCase() === esp.toLowerCase();
                return (
                  <button
                    key={esp}
                    onClick={() => setSelectedEspecialidad(esp)}
                    style={{
                      ...styles.pillBtnSlim,
                      border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255, 255, 255, 0.12)",
                      background: isActive ? "rgba(255, 215, 0, 0.22)" : "rgba(15, 23, 42, 0.7)",
                      color: isActive ? "#FFD700" : "#94A3B8",
                      fontWeight: isActive ? "800" : "600",
                    }}
                  >
                    {esp}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* CONTADOR DE RESULTADOS */}
        <div style={styles.resultsHeaderSlim}>
          <h2 style={styles.resultsTitleSlim}>
            {lang === "en" ? "Available Guides" : "Guías Turísticos Disponibles"}
            <span style={styles.resultsBadgeSlim}>{guiasFiltrados.length}</span>
          </h2>
          {(selectedDept !== "Todos" || selectedEspecialidad !== "Todas" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDept("Todos");
                setSelectedEspecialidad("Todas");
                setSearchQuery("");
              }}
              style={styles.resetFiltersBtnSlim}
            >
              <Icon name="x" size={13} />
              {lang === "en" ? "Clear Filters" : "Limpiar Filtros"}
            </button>
          )}
        </div>

        {/* REJILLA DE TARJETAS HORIZONTALES DE GUÍAS (ACABADO GLASSMORPHI SINFÍN BORDES BLANCOS) */}
        {guiasFiltrados.length === 0 ? (
          <div style={styles.emptyStateSlim}>
            <Icon name="compass" size={42} color="#475569" />
            <h3 style={styles.emptyTitleSlim}>
              {lang === "en" ? "No tour guides found" : "No se encontraron guías turísticos"}
            </h3>
            <p style={styles.emptySubtitleSlim}>
              {lang === "en"
                ? "Try selecting another department or clearing search filters."
                : "Intenta seleccionando otro departamento o limpiando los filtros de búsqueda."}
            </p>
          </div>
        ) : (
          <div style={styles.guidesGridWide}>
            {guiasFiltrados.map((guia) => (
              <div
                key={guia.id}
                style={styles.guideCardGlass}
                className="guide-card-hover"
              >
                {/* Columna Izquierda: Información de Guía */}
                <div style={styles.guideCardMainInfo}>
                  <div style={styles.cardHeaderHorizontal}>
                    <div style={styles.avatarWrapperWide}>
                      <img
                        src={guia.avatar_url}
                        alt={guia.nombre_completo}
                        style={styles.avatarImgWide}
                      />
                      <div style={styles.verifiedBadgeIcon} title="Guía INTUR Certificado">
                        <Icon name="checkCircle" size={13} color="#FFFFFF" />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginBottom: "2px" }}>
                        <span style={styles.deptBadgeSlim}>
                          <Icon name="mapPin" size={11} color="#0EA5E9" />
                          {guia.departamento_principal}
                        </span>
                        {guia.licencia_intur && (
                          <span style={styles.licenseBadgeSlim}>INTUR</span>
                        )}
                      </div>

                      <h3 style={styles.guideNameWide}>{guia.nombre_completo}</h3>

                      <div style={styles.ratingRowWide}>
                        <span style={{ color: "#FFD700", fontWeight: "900", fontSize: "14px" }}>★</span>
                        <span style={styles.ratingValueWide}>{guia.rating_promedio}</span>
                        <span style={styles.reviewsCountWide}>({guia.total_resenas} {lang === "en" ? "reviews" : "reseñas"})</span>
                      </div>
                    </div>
                  </div>

                  {/* Etiquetas de especialidad e idioma */}
                  <div style={styles.detailsRowSlim}>
                    <span style={styles.tagChip}>
                      <Icon name="tag" size={12} color="#0EA5E9" />
                      {guia.especialidad}
                    </span>
                    <span style={styles.tagChip}>
                      <Icon name="globe" size={12} color="#FFD700" />
                      {guia.idiomas}
                    </span>
                    <span style={styles.tagChip}>
                      <Icon name="clock" size={12} color="#10B981" />
                      {guia.experiencia_anios} {lang === "en" ? "yrs exp" : "años exp"}
                    </span>
                  </div>

                  <p style={styles.bioSnippetWide}>
                    {guia.biografia?.length > 110
                      ? guia.biografia.substring(0, 110) + "..."
                      : guia.biografia}
                  </p>

                  {/* Footer de Tarjeta: Tarifa y Botones de Acción */}
                  <div style={styles.cardFooterWide}>
                    <div style={styles.priceBoxSlim}>
                      <span style={styles.priceLabelSlim}>{lang === "en" ? "Rate" : "Tarifa aprox."}</span>
                      <span style={styles.priceValueSlim}>{guia.tarifa_aprox || "$25/día"}</span>
                    </div>

                    <div style={styles.actionButtonsGroupSlim}>
                      {guia.whatsapp && (
                        <a
                          href={`https://wa.me/${guia.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${guia.nombre_completo}! Te vi en Plataforma Atlan y me gustaría consultar tu disponibilidad para un tour en ${guia.departamento_principal}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={styles.whatsappBtnSlim}
                          title="Contactar por WhatsApp"
                        >
                          <Icon name="whatsapp" size={17} color="#FFFFFF" />
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setSelectedGuiaModal(guia);
                          setActiveModalTab("info");
                        }}
                        style={styles.detailsBtnSlim}
                      >
                        <span>{lang === "en" ? "Details & Photos" : "Ver Detalle y Fotos"}</span>
                        <Icon name="chevronRight" size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Tira de Galería de Travesías (Con imágenes reales de Nicaragua) */}
                {guia.galeria_fotos && guia.galeria_fotos.length > 0 && (
                  <div style={styles.travesiaStripRight}>
                    <div style={styles.travesiaStripHeader}>
                      <Icon name="image" size={12} color="#38BDF8" />
                      <span>Travesías ({guia.galeria_fotos.length})</span>
                    </div>
                    <div style={styles.travesiaImagesGrid}>
                      {guia.galeria_fotos.slice(0, 3).map((imgUrl, i) => (
                        <div
                          key={i}
                          style={styles.travesiaThumbBox}
                          onClick={() => {
                            setSelectedGuiaModal(guia);
                            setActiveModalTab("galeria");
                          }}
                          title="Ver foto de travesía"
                        >
                          <img src={imgUrl} alt={`Travesía ${i + 1}`} style={styles.travesiaThumbImg} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL EXTENDIDO DEL GUÍA CON PESTAÑAS (INFO, GALERÍA DE TRAVESÍAS, RESEÑAS) */}
      {selectedGuiaModal && (
        <div style={styles.modalOverlay} onClick={() => setSelectedGuiaModal(null)}>
          <div
            style={styles.modalCardWide}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón Cerrar Modal */}
            <button
              onClick={() => setSelectedGuiaModal(null)}
              style={styles.closeModalBtn}
            >
              <Icon name="x" size={18} />
            </button>

            {/* Cabecera Modal */}
            <div style={styles.modalHeaderWide}>
              <img
                src={selectedGuiaModal.avatar_url}
                alt={selectedGuiaModal.nombre_completo}
                style={styles.modalAvatarWide}
              />

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                  <span style={styles.modalDeptBadge}>{selectedGuiaModal.departamento_principal}</span>
                  {selectedGuiaModal.licencia_intur && (
                    <span style={styles.modalLicenseBadge}>
                      <Icon name="shield" size={12} color="#10B981" />
                      {selectedGuiaModal.licencia_intur}
                    </span>
                  )}
                </div>

                <h2 style={styles.modalGuideNameWide}>{selectedGuiaModal.nombre_completo}</h2>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                  <div style={styles.starsBox}>
                    <span style={{ color: "#FFD700", fontWeight: "900" }}>★</span>
                    <span style={{ fontWeight: "800", color: "#F8FAFC", fontSize: "15px" }}>
                      {selectedGuiaModal.rating_promedio}
                    </span>
                    <span style={{ fontSize: "13px", color: "#94A3B8", marginLeft: "4px" }}>
                      ({selectedGuiaModal.total_resenas} {lang === "en" ? "reviews" : "reseñas"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas del Modal */}
            <div style={styles.modalTabsRow}>
              <button
                onClick={() => setActiveModalTab("info")}
                style={{
                  ...styles.modalTabBtn,
                  borderBottom: activeModalTab === "info" ? "2.5px solid #0EA5E9" : "none",
                  color: activeModalTab === "info" ? "#38BDF8" : "#94A3B8",
                  fontWeight: activeModalTab === "info" ? "800" : "600"
                }}
              >
                <Icon name="user" size={14} />
                <span>{lang === "en" ? "Profile Info" : "Perfil y Datos"}</span>
              </button>

              <button
                onClick={() => setActiveModalTab("galeria")}
                style={{
                  ...styles.modalTabBtn,
                  borderBottom: activeModalTab === "galeria" ? "2.5px solid #38BDF8" : "none",
                  color: activeModalTab === "galeria" ? "#38BDF8" : "#94A3B8",
                  fontWeight: activeModalTab === "galeria" ? "800" : "600"
                }}
              >
                <Icon name="image" size={14} />
                <span>{lang === "en" ? "Tour Gallery" : "Galería de Travesías"} ({selectedGuiaModal.galeria_fotos?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveModalTab("resenas")}
                style={{
                  ...styles.modalTabBtn,
                  borderBottom: activeModalTab === "resenas" ? "2.5px solid #FFD700" : "none",
                  color: activeModalTab === "resenas" ? "#FFD700" : "#94A3B8",
                  fontWeight: activeModalTab === "resenas" ? "800" : "600"
                }}
              >
                <Icon name="star" size={14} />
                <span>{lang === "en" ? "Reviews" : "Reseñas"} ({selectedGuiaModal.total_resenas || 0})</span>
              </button>
            </div>

            {/* PESTAÑA 1: INFORMACIÓN Y DATOS */}
            {activeModalTab === "info" && (
              <div style={{ marginTop: "16px" }}>
                <div style={styles.modalSection}>
                  <h4 style={styles.modalSectionTitle}>{lang === "en" ? "About this Guide" : "Acerca del Guía"}</h4>
                  <p style={styles.modalBioText}>{selectedGuiaModal.biografia}</p>
                </div>

                <div style={styles.modalTechGridWide}>
                  <div style={styles.techItem}>
                    <span style={styles.techLabel}>{lang === "en" ? "Specialty" : "Especialidad"}</span>
                    <span style={styles.techValue}>{selectedGuiaModal.especialidad}</span>
                  </div>
                  <div style={styles.techItem}>
                    <span style={styles.techLabel}>{lang === "en" ? "Languages" : "Idiomas"}</span>
                    <span style={styles.techValue}>{selectedGuiaModal.idiomas}</span>
                  </div>
                  <div style={styles.techItem}>
                    <span style={styles.techLabel}>{lang === "en" ? "Experience" : "Experiencia"}</span>
                    <span style={styles.techValue}>{selectedGuiaModal.experiencia_anios} {lang === "en" ? "Years" : "Años"}</span>
                  </div>
                  <div style={styles.techItem}>
                    <span style={styles.techLabel}>{lang === "en" ? "Approx Rate" : "Tarifa Aprox."}</span>
                    <span style={{ ...styles.techValue, color: "#10B981" }}>{selectedGuiaModal.tarifa_aprox || "$30 / día"}</span>
                  </div>
                </div>

                {selectedGuiaModal.whatsapp && (
                  <a
                    href={`https://wa.me/${selectedGuiaModal.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${selectedGuiaModal.nombre_completo}! Te encontré en Plataforma Atlan y me gustaría consultar disponibilidad para contratar un tour.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.modalWhatsappBanner}
                  >
                    <Icon name="whatsapp" size={22} color="#FFFFFF" />
                    <span>{lang === "en" ? "Contact via WhatsApp Now" : "Contactar por WhatsApp Ahora"}</span>
                  </a>
                )}
              </div>
            )}

            {/* PESTAÑA 2: GALERÍA DE FOTOS DE TRAVESÍAS */}
            {activeModalTab === "galeria" && (
              <div style={{ marginTop: "16px" }}>
                <h4 style={styles.modalSectionTitle}>
                  {lang === "en" ? "Expeditions & Guided Tours Photos" : "Fotos de Travesías y Excursiones Guiadas"}
                </h4>
                {(!selectedGuiaModal.galeria_fotos || selectedGuiaModal.galeria_fotos.length === 0) ? (
                  <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
                    {lang === "en" ? "This guide has not uploaded tour photos yet." : "Este guía aún no ha subido fotos de sus travesías."}
                  </p>
                ) : (
                  <div style={styles.fullGalleryGrid}>
                    {selectedGuiaModal.galeria_fotos.map((photoUrl, idx) => (
                      <div key={idx} style={styles.fullGalleryCard}>
                        <img src={photoUrl} alt={`Travesía ${idx + 1}`} style={styles.fullGalleryImg} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: RESEÑAS */}
            {activeModalTab === "resenas" && (
              <div style={{ marginTop: "16px" }}>
                <h4 style={styles.modalSectionTitle}>
                  {lang === "en" ? "Tourist Reviews" : "Reseñas de Turistas"}
                </h4>

                {session ? (
                  <form onSubmit={handleAddReview} style={styles.reviewForm}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: "#E2E8F0" }}>
                        {lang === "en" ? "Rate your experience:" : "Califica tu experiencia:"}
                      </span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "20px",
                              color: star <= newRating ? "#FFD700" : "#475569",
                              padding: "0 2px"
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      rows={3}
                      required
                      placeholder={lang === "en" ? "Write a comment about this guide..." : "Escribe tu opinión o comentario sobre este guía..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={styles.reviewTextarea}
                    />

                    {reviewSuccessMsg && (
                      <div style={styles.reviewSuccessAlert}>
                        <Icon name="checkCircle" size={14} color="#10B981" />
                        <span>{reviewSuccessMsg}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submittingReview || !newComment.trim()}
                      style={styles.submitReviewBtn}
                    >
                      <Icon name="send" size={14} />
                      <span>{submittingReview ? (lang === "en" ? "Submitting..." : "Enviando...") : (lang === "en" ? "Submit Review" : "Publicar Reseña")}</span>
                    </button>
                  </form>
                ) : (
                  <div style={styles.loginToReviewAlert}>
                    <Icon name="info" size={16} color="#38BDF8" />
                    <span>
                      {lang === "en" ? "Log in to leave a rating and review for this guide." : "Inicia sesión para dejar una calificación y opinión a este guía."}
                    </span>
                    <Link href="/login" style={{ color: "#38BDF8", fontWeight: "700", textDecoration: "underline", marginLeft: "6px" }}>
                      {lang === "en" ? "Log In" : "Iniciar Sesión"}
                    </Link>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                  {(!selectedGuiaModal.resenas || selectedGuiaModal.resenas.length === 0) ? (
                    <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                      {lang === "en" ? "No reviews yet. Be the first to leave one!" : "Aún no hay reseñas. ¡Sé el primero en dejar una!"}
                    </p>
                  ) : (
                    selectedGuiaModal.resenas.map((res) => (
                      <div key={res.id} style={styles.reviewItemCard}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={res.autor_avatar || "/images/perfil.svg"}
                              alt={res.autor_nombre}
                              style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                            />
                            <div>
                              <span style={{ fontSize: "13.5px", fontWeight: "750", color: "#F8FAFC", display: "block" }}>
                                {res.autor_nombre}
                              </span>
                              <span style={{ fontSize: "11px", color: "#64748B" }}>
                                {new Date(res.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div style={{ color: "#FFD700", fontWeight: "800", fontSize: "14px" }}>
                            {"★".repeat(res.puntuacion)}
                          </div>
                        </div>

                        <p style={{ fontSize: "13px", color: "#CBD5E1", margin: "8px 0 0 0", lineHeight: "1.4" }}>
                          {res.comentario}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageWrapper: {
    minHeight: "100vh",
    width: "100%",
    background: "#0A192F",
    color: "#F8FAFC",
    fontFamily: "var(--font-outfit), sans-serif",
    paddingBottom: "60px",
    position: "relative",
    overflowX: "hidden"
  },
  bgSvgGuardabarranco: {
    position: "absolute",
    top: "40px",
    right: "-60px",
    width: "480px",
    height: "480px",
    objectFit: "contain",
    zIndex: 0,
    pointerEvents: "none",
    filter: "brightness(0) saturate(100%) invert(60%) sepia(85%) saturate(1200%) hue-rotate(180deg) opacity(0.08)",
  },
  bgSvgTortuga: {
    position: "absolute",
    bottom: "20px",
    left: "-80px",
    width: "500px",
    height: "500px",
    objectFit: "contain",
    zIndex: 0,
    pointerEvents: "none",
    filter: "brightness(0) saturate(100%) invert(48%) sepia(85%) saturate(1400%) hue-rotate(100deg) opacity(0.07)",
  },
  bgSvgGueguense: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    objectFit: "contain",
    zIndex: 0,
    pointerEvents: "none",
    filter: "brightness(0) saturate(100%) invert(75%) sepia(90%) saturate(1200%) hue-rotate(350deg) opacity(0.04)",
  },

  heroSectionCompact: {
    position: "relative",
    padding: "70px 24px 20px 24px",
    background: "transparent",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    zIndex: 2
  },
  heroGlowLeft: {
    position: "absolute",
    top: "-80px",
    left: "-80px",
    width: "350px",
    height: "350px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none"
  },
  heroContentWide: {
    maxWidth: "1400px",
    margin: "0 auto"
  },
  topMetaHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "8px"
  },
  badgeHeroCompact: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(14, 165, 233, 0.15)",
    border: "1px solid rgba(14, 165, 233, 0.3)",
    color: "#38BDF8",
    padding: "4px 14px",
    borderRadius: "999px",
    fontSize: "12.5px",
    fontWeight: "750"
  },
  statsRowCompact: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "999px",
    padding: "4px 14px"
  },
  statPill: {
    fontSize: "12px",
    color: "#CBD5E1",
    fontWeight: "600"
  },
  statDividerDot: {
    color: "#64748B",
    fontSize: "12px"
  },
  heroTitleCompact: {
    fontSize: "clamp(22px, 3vw, 32px)",
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
    margin: "0",
    lineHeight: "1.2"
  },

  mainContainerWide: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "20px 24px",
    position: "relative",
    zIndex: 2
  },

  // PANEL DE FILTROS ULTRA PROFESIONAL
  filterPanelProfessional: {
    background: "rgba(15, 23, 42, 0.88)",
    border: "1px solid rgba(56, 189, 248, 0.18)",
    borderRadius: "20px",
    padding: "16px 20px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
    marginBottom: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },
  filterRow1: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexWrap: "wrap"
  },
  searchBoxSlim: {
    flex: 1,
    minWidth: "260px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(30, 41, 59, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    padding: "8px 12px"
  },
  searchInputSlim: {
    width: "100%",
    background: "none",
    border: "none",
    color: "#F8FAFC",
    fontSize: "13.5px",
    outline: "none"
  },
  clearSearchBtn: {
    background: "none",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    padding: "2px"
  },
  sortBoxSlim: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  sortLabelSlim: {
    fontSize: "12px",
    color: "#94A3B8",
    fontWeight: "600"
  },
  selectInputSlim: {
    background: "rgba(30, 41, 59, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#F8FAFC",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "12.5px",
    outline: "none",
    cursor: "pointer"
  },

  // FILTROS EN GRUPOS INDEPENDIENTES CON ENCABEZADO
  filterGroupSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  filterSectionTitle: {
    fontSize: "12.5px",
    fontWeight: "750",
    color: "#E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  pillsScrollContainer: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    overflowX: "auto",
    paddingBottom: "2px",
    scrollbarWidth: "none"
  },
  pillBtnSlim: {
    padding: "5px 13px",
    borderRadius: "999px",
    fontSize: "12px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s"
  },

  resultsHeaderSlim: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "14px"
  },
  resultsTitleSlim: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  resultsBadgeSlim: {
    background: "rgba(14, 165, 233, 0.2)",
    color: "#38BDF8",
    fontSize: "12px",
    padding: "1px 8px",
    borderRadius: "999px",
    border: "1px solid rgba(14, 165, 233, 0.3)"
  },
  resetFiltersBtnSlim: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#EF4444",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },

  // TARJETAS GLASSMORPISM ELEGANTES SIN BORDES BLANCOS EN L
  guidesGridWide: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(430px, 1fr))",
    gap: "18px"
  },
  guideCardGlass: {
    background: "rgba(15, 23, 42, 0.88)",
    border: "1px solid rgba(56, 189, 248, 0.15)",
    borderRadius: "18px",
    padding: "16px",
    display: "flex",
    gap: "14px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.25)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  guideCardMainInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between"
  },
  cardHeaderHorizontal: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px"
  },
  avatarWrapperWide: {
    position: "relative",
    width: "56px",
    height: "56px",
    flexShrink: 0
  },
  avatarImgWide: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #0EA5E9"
  },
  verifiedBadgeIcon: {
    position: "absolute",
    bottom: "0",
    right: "0",
    background: "#10B981",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  },
  deptBadgeSlim: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    background: "rgba(14, 165, 233, 0.15)",
    color: "#38BDF8",
    fontSize: "11px",
    fontWeight: "750",
    padding: "1px 6px",
    borderRadius: "4px"
  },
  licenseBadgeSlim: {
    background: "rgba(16, 185, 129, 0.15)",
    color: "#10B981",
    fontSize: "10.5px",
    fontWeight: "750",
    padding: "1px 6px",
    borderRadius: "4px"
  },
  guideNameWide: {
    fontSize: "16px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: "1px 0 2px 0",
    lineHeight: "1.2"
  },
  ratingRowWide: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  ratingValueWide: {
    fontWeight: "800",
    fontSize: "13px",
    color: "#F8FAFC"
  },
  reviewsCountWide: {
    fontSize: "11.5px",
    color: "#94A3B8"
  },
  detailsRowSlim: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    margin: "4px 0 6px 0"
  },
  tagChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(30, 41, 59, 0.6)",
    color: "#CBD5E1",
    fontSize: "11.5px",
    fontWeight: "600",
    padding: "2px 8px",
    borderRadius: "6px"
  },
  bioSnippetWide: {
    fontSize: "12.5px",
    color: "#94A3B8",
    lineHeight: "1.4",
    margin: "0 0 10px 0"
  },
  cardFooterWide: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "8px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)"
  },
  priceBoxSlim: {
    display: "flex",
    flexDirection: "column"
  },
  priceLabelSlim: {
    fontSize: "10.5px",
    color: "#64748B",
    fontWeight: "600"
  },
  priceValueSlim: {
    fontSize: "13.5px",
    fontWeight: "800",
    color: "#10B981"
  },
  actionButtonsGroupSlim: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  whatsappBtnSlim: {
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 4px 10px rgba(37, 211, 102, 0.25)"
  },
  detailsBtnSlim: {
    background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
    color: "#FFFFFF",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "750",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },

  // TIRA DE FOTOS DE TRAVESÍAS DEL GUÍA
  travesiaStripRight: {
    width: "115px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    borderLeft: "1px solid rgba(255,255,255,0.08)",
    paddingLeft: "12px"
  },
  travesiaStripHeader: {
    fontSize: "10.5px",
    fontWeight: "750",
    color: "#38BDF8",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  travesiaImagesGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  travesiaThumbBox: {
    width: "100%",
    height: "46px",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.15)",
    transition: "transform 0.2s"
  },
  travesiaThumbImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },

  emptyStateSlim: {
    textAlign: "center",
    padding: "40px 20px",
    background: "rgba(15, 23, 42, 0.6)",
    borderRadius: "16px",
    border: "1px dashed rgba(255, 255, 255, 0.15)"
  },
  emptyTitleSlim: {
    fontSize: "16px",
    fontWeight: "800",
    margin: "8px 0 4px 0"
  },
  emptySubtitleSlim: {
    fontSize: "13px",
    color: "#94A3B8"
  },

  // MODAL EXTENDIDO ANCHO
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.78)",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalCardWide: {
    width: "100%",
    maxWidth: "680px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0F172A",
    border: "1px solid rgba(56, 189, 248, 0.25)",
    borderRadius: "24px",
    padding: "24px",
    position: "relative",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)"
  },
  closeModalBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(255, 255, 255, 0.1)",
    border: "none",
    color: "#F8FAFC",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  modalHeaderWide: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    marginBottom: "16px"
  },
  modalAvatarWide: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid #0EA5E9",
    flexShrink: 0
  },
  modalDeptBadge: {
    background: "rgba(14, 165, 233, 0.2)",
    color: "#38BDF8",
    fontSize: "12px",
    fontWeight: "800",
    padding: "3px 10px",
    borderRadius: "6px"
  },
  modalLicenseBadge: {
    background: "rgba(16, 185, 129, 0.15)",
    color: "#10B981",
    fontSize: "11.5px",
    fontWeight: "750",
    padding: "3px 10px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  modalGuideNameWide: {
    fontSize: "20px",
    fontWeight: "900",
    color: "#FFFFFF",
    margin: "2px 0"
  },
  starsBox: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  modalTabsRow: {
    display: "flex",
    gap: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    paddingBottom: "4px"
  },
  modalTabBtn: {
    background: "none",
    border: "none",
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  modalSection: {
    marginBottom: "16px"
  },
  modalSectionTitle: {
    fontSize: "14.5px",
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center"
  },
  modalBioText: {
    fontSize: "13.5px",
    color: "#CBD5E1",
    lineHeight: "1.5"
  },
  modalTechGridWide: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    background: "rgba(30, 41, 59, 0.6)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "16px"
  },
  techItem: {
    display: "flex",
    flexDirection: "column"
  },
  techLabel: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "600"
  },
  techValue: {
    fontSize: "13px",
    color: "#F8FAFC",
    fontWeight: "750"
  },
  modalWhatsappBanner: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    padding: "11px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "800",
    fontSize: "14px",
    textDecoration: "none",
    boxShadow: "0 6px 18px rgba(37, 211, 102, 0.3)"
  },
  fullGalleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "12px",
    marginTop: "12px"
  },
  fullGalleryCard: {
    width: "100%",
    height: "140px",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.15)"
  },
  fullGalleryImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  reviewForm: {
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  reviewTextarea: {
    width: "100%",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "10px",
    padding: "8px 10px",
    color: "#F8FAFC",
    fontSize: "13px",
    outline: "none",
    resize: "none"
  },
  reviewSuccessAlert: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10B981",
    fontSize: "12px",
    fontWeight: "700",
    padding: "6px 10px",
    borderRadius: "6px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  submitReviewBtn: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
    color: "#FFFFFF",
    border: "none",
    padding: "6px 14px",
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: "750",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  loginToReviewAlert: {
    background: "rgba(14, 165, 233, 0.1)",
    border: "1px solid rgba(14, 165, 233, 0.25)",
    padding: "10px",
    borderRadius: "10px",
    fontSize: "12.5px",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  reviewItemCard: {
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    padding: "10px"
  }
};
