"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";

// Guías turísticos de demostración (fallback si Supabase aún no tiene registros)
const MOCK_GUIAS = [
  {
    id: "guia-1",
    nombre_completo: "Carlos Mendoza Silva",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80",
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
    resenas: [
      {
        id: "r1",
        autor_nombre: "Sarah Jenkins",
        autor_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&q=80",
        puntuacion: 5,
        comentario: "¡Carlos fue insuperable en Cerro Negro! Nos cuidó en todo momento y nos contó la historia geológica fascinante de Nicaragua. 100% recomendado.",
        created_at: "2026-08-15T10:30:00Z"
      },
      {
        id: "r2",
        autor_nombre: "Mateo Rivas",
        autor_avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80",
        puntuacion: 5,
        comentario: "Excelente tour nocturno en el volcán Telica viendo la lava arder. Muy puntual, profesional y conoce los mejores spots fotográficos.",
        created_at: "2026-07-28T14:15:00Z"
      }
    ]
  },
  {
    id: "guia-2",
    nombre_completo: "María José López",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&q=80",
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
    resenas: [
      {
        id: "r3",
        autor_nombre: "Lucía Fernández",
        autor_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80",
        puntuacion: 5,
        comentario: "Un recorrido cultural inolvidable por los templos y el Convento San Francisco. María transmite un amor contagioso por la historia nicaragüense.",
        created_at: "2026-08-20T11:00:00Z"
      }
    ]
  },
  {
    id: "guia-3",
    nombre_completo: "Alejandro Jarquín",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&q=80",
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
    resenas: [
      {
        id: "r4",
        autor_nombre: "David Miller",
        autor_avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&q=80",
        puntuacion: 5,
        comentario: "The trek to Volcán Maderas lagoon was challenging but Alejandro kept our spirits high. Truly awesome experience!",
        created_at: "2026-08-02T16:45:00Z"
      }
    ]
  },
  {
    id: "guia-4",
    nombre_completo: "Brenda Castillo",
    avatar_url: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&q=80",
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
    resenas: [
      {
        id: "r5",
        autor_nombre: "Hans Weber",
        autor_avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80",
        puntuacion: 5,
        comentario: "Sehr gut! Brenda hat uns das bezaubernde Quetzal im Nebelwald gezeigt. Unglaubliche Erfahrung.",
        created_at: "2026-07-12T09:20:00Z"
      }
    ]
  },
  {
    id: "guia-5",
    nombre_completo: "Nestor Moncada",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&q=80",
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
  const [sortBy, setSortBy] = useState("rating"); // 'rating' | 'experiencia'

  // Modal de Detalle de Guía
  const [selectedGuiaModal, setSelectedGuiaModal] = useState(null);

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
          // Mapear datos formateados
          const formatted = data.map((g) => ({
            ...g,
            nombre_completo: g.perfiles?.nombre_completo || g.nombre_completo || "Guía Turístico",
            avatar_url: g.perfiles?.avatar_url || g.avatar_url || "/images/perfil.svg",
            resenas: g.resenas || []
          }));
          setGuias(formatted);
        } else {
          // Usar mock si la tabla está vacía o no ha sido creada aún
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
    // Filtro departamento
    const matchDept =
      selectedDept === "Todos" ||
      guia.departamento_principal?.toLowerCase() === selectedDept.toLowerCase() ||
      (guia.departamentos_secundarios &&
        guia.departamentos_secundarios.some(
          (d) => d.toLowerCase() === selectedDept.toLowerCase()
        ));

    // Filtro especialidad
    const matchEspec =
      selectedEspecialidad === "Todas" ||
      guia.especialidad?.toLowerCase().includes(selectedEspecialidad.toLowerCase());

    // Buscador general
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
      // Intentar guardar en Supabase
      await supabase.from("resenas_guias").insert({
        guia_id: selectedGuiaModal.id,
        autor_id: session?.user?.id,
        puntuacion: newRating,
        comentario: newComment.trim()
      });
    } catch (err) {
      console.warn("Notice: Saved review to local state (Supabase table not sync yet):", err);
    }

    // Actualizar estado local
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

          // Actualizar también el modal seleccionado
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

      {/* HERO BANNER DE GUÍAS TURÍSTICOS */}
      <section style={styles.heroSection}>
        <div style={styles.heroGlowLeft} />
        <div style={styles.heroGlowRight} />

        <div style={styles.heroContent}>
          <div style={styles.badgeHero}>
            <Icon name="compass" size={16} color="#38BDF8" />
            <span>{lang === "en" ? "Official Guide Catalogue" : "Directorio Nacional de Guías"}</span>
          </div>

          <h1 style={styles.heroTitle}>
            {lang === "en" ? "Explore Nicaragua with Expert Local Guides" : "Explora Nicaragua con Guías Turísticos Locales"}
          </h1>

          <p style={styles.heroSubtitle}>
            {lang === "en"
              ? "Connect with certified guides in volcanoes, hiking, culture, birdwatching, and gastronomy across all 17 departments."
              : "Conecta con guías experimentados en volcanes, senderismo, cultura, avistamiento de aves y ecoturismo en los 17 departamentos."}
          </p>

          {/* Tarjetas de Estadísticas Rápida */}
          <div style={styles.statsRow}>
            <div style={styles.statBox}>
              <span style={styles.statNum}>17</span>
              <span style={styles.statLabel}>{lang === "en" ? "Departments" : "Departamentos"}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <span style={{ ...styles.statNum, color: "#38BDF8" }}>4.9 ★</span>
              <span style={styles.statLabel}>{lang === "en" ? "Average Rating" : "Calificación Promedio"}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statBox}>
              <span style={{ ...styles.statNum, color: "#10B981" }}>100%</span>
              <span style={styles.statLabel}>{lang === "en" ? "Local Expertise" : "Experiencia Local"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* FILTROS Y BÚSQUEDA */}
      <main style={styles.mainContainer}>
        <div style={styles.filterCard} className="clay-card-static no-sheen">
          {/* Barra Superior: Buscador y Ordenamiento */}
          <div style={styles.filterTopRow}>
            <div style={styles.searchBox}>
              <Icon name="search" size={18} color="#64748B" />
              <input
                type="text"
                placeholder={lang === "en" ? "Search guide by name, city or volcano..." : "Buscar guía por nombre, especialidad o ciudad..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} style={styles.clearSearchBtn}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>

            <div style={styles.sortBox}>
              <span style={styles.sortLabel}>{lang === "en" ? "Sort by:" : "Ordenar por:"}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.selectInput}
              >
                <option value="rating">{lang === "en" ? "Best Rating" : "Mejor Calificación"}</option>
                <option value="experiencia">{lang === "en" ? "Years of Experience" : "Años de Experiencia"}</option>
              </select>
            </div>
          </div>

          {/* Filtro 1: Departamentos en Pills desplazables */}
          <div style={styles.filterPillsSection}>
            <span style={styles.filterPillsTitle}>
              <Icon name="mapPin" size={14} color="#0EA5E9" />
              {lang === "en" ? "Department:" : "Departamento:"}
            </span>
            <div style={styles.pillsScrollContainer}>
              {DEPARTAMENTOS_LIST.map((dept) => {
                const isActive = selectedDept.toLowerCase() === dept.toLowerCase();
                return (
                  <button
                    key={dept}
                    onClick={() => setSelectedDept(dept)}
                    style={{
                      ...styles.pillBtn,
                      border: isActive ? "1.5px solid #0EA5E9" : "1px solid rgba(255, 255, 255, 0.15)",
                      background: isActive ? "rgba(14, 165, 233, 0.2)" : "rgba(15, 23, 42, 0.6)",
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

          {/* Filtro 2: Especialidad */}
          <div style={styles.filterPillsSection}>
            <span style={styles.filterPillsTitle}>
              <Icon name="tag" size={14} color="#FFD700" />
              {lang === "en" ? "Specialty:" : "Especialidad:"}
            </span>
            <div style={styles.pillsScrollContainer}>
              {ESPECIALIDADES_LIST.map((esp) => {
                const isActive = selectedEspecialidad.toLowerCase() === esp.toLowerCase();
                return (
                  <button
                    key={esp}
                    onClick={() => setSelectedEspecialidad(esp)}
                    style={{
                      ...styles.pillBtn,
                      border: isActive ? "1.5px solid #FFD700" : "1px solid rgba(255, 255, 255, 0.15)",
                      background: isActive ? "rgba(255, 215, 0, 0.18)" : "rgba(15, 23, 42, 0.6)",
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
        <div style={styles.resultsHeader}>
          <h2 style={styles.resultsTitle}>
            {lang === "en" ? "Available Tour Guides" : "Guías Turísticos Disponibles"}
            <span style={styles.resultsBadge}>{guiasFiltrados.length}</span>
          </h2>
          {(selectedDept !== "Todos" || selectedEspecialidad !== "Todas" || searchQuery) && (
            <button
              onClick={() => {
                setSelectedDept("Todos");
                setSelectedEspecialidad("Todas");
                setSearchQuery("");
              }}
              style={styles.resetFiltersBtn}
            >
              <Icon name="x" size={14} />
              {lang === "en" ? "Clear Filters" : "Limpiar Filtros"}
            </button>
          )}
        </div>

        {/* REJILLA DE TARJETAS DE GUÍAS */}
        {guiasFiltrados.length === 0 ? (
          <div style={styles.emptyState}>
            <Icon name="compass" size={48} color="#475569" />
            <h3 style={styles.emptyTitle}>
              {lang === "en" ? "No tour guides found" : "No se encontraron guías turísticos"}
            </h3>
            <p style={styles.emptySubtitle}>
              {lang === "en"
                ? "Try selecting another department or clearing search filters."
                : "Intenta seleccionando otro departamento o limpiando los filtros de búsqueda."}
            </p>
          </div>
        ) : (
          <div style={styles.guidesGrid}>
            {guiasFiltrados.map((guia) => (
              <div
                key={guia.id}
                style={styles.guideCard}
                className="clay-card-static no-sheen guide-card-hover"
              >
                {/* Header de la tarjeta */}
                <div style={styles.cardHeader}>
                  <div style={styles.avatarWrapper}>
                    <img
                      src={guia.avatar_url}
                      alt={guia.nombre_completo}
                      style={styles.avatarImg}
                    />
                    <div style={styles.verifiedIcon} title="Guía Certificado INTUR">
                      <Icon name="checkCircle" size={14} color="#FFFFFF" />
                    </div>
                  </div>

                  <div style={styles.headerInfo}>
                    <div style={styles.deptBadge}>
                      <Icon name="mapPin" size={12} color="#0EA5E9" />
                      <span>{guia.departamento_principal}</span>
                    </div>

                    <h3 style={styles.guideName}>{guia.nombre_completo}</h3>

                    {/* Rating con Flor de Sacuanjoche/Estrella */}
                    <div style={styles.ratingRow}>
                      <div style={styles.starsBox}>
                        <span style={{ color: "#FFD700", fontWeight: "900", fontSize: "14px" }}>★</span>
                        <span style={styles.ratingValue}>{guia.rating_promedio}</span>
                      </div>
                      <span style={styles.reviewsCount}>({guia.total_resenas} {lang === "en" ? "reviews" : "reseñas"})</span>
                    </div>
                  </div>
                </div>

                {/* Especialidad & Idiomas */}
                <div style={styles.detailsRow}>
                  <div style={styles.detailItem}>
                    <Icon name="tag" size={13} color="#CBD5E1" />
                    <span style={styles.detailText}>{guia.especialidad}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <Icon name="globe" size={13} color="#CBD5E1" />
                    <span style={styles.detailText}>{guia.idiomas}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <Icon name="clock" size={13} color="#CBD5E1" />
                    <span style={styles.detailText}>{guia.experiencia_anios} {lang === "en" ? "years experience" : "años de experiencia"}</span>
                  </div>
                </div>

                {/* Biografía corta */}
                <p style={styles.bioSnippet}>
                  {guia.biografia?.length > 130
                    ? guia.biografia.substring(0, 130) + "..."
                    : guia.biografia}
                </p>

                {/* Footer de Tarjeta: Tarifa y Botones de Acción */}
                <div style={styles.cardFooter}>
                  <div style={styles.priceBox}>
                    <span style={styles.priceLabel}>{lang === "en" ? "Approx Rate" : "Tarifa aprox."}</span>
                    <span style={styles.priceValue}>{guia.tarifa_aprox || "$25/día"}</span>
                  </div>

                  <div style={styles.actionButtonsGroup}>
                    {/* Botón WhatsApp */}
                    {guia.whatsapp && (
                      <a
                        href={`https://wa.me/${guia.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`¡Hola ${guia.nombre_completo}! Te vi en Plataforma Atlan y me gustaría consultar tu disponibilidad para un tour en ${guia.departamento_principal}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.whatsappBtn}
                        title="Contactar por WhatsApp"
                      >
                        <Icon name="whatsapp" size={18} color="#FFFFFF" />
                      </a>
                    )}

                    {/* Botón Ver Detalle */}
                    <button
                      onClick={() => setSelectedGuiaModal(guia)}
                      style={styles.detailsBtn}
                    >
                      <span>{lang === "en" ? "View Profile" : "Ver Detalle"}</span>
                      <Icon name="chevronRight" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL DETALLADO DEL GUÍA TURÍSTICO */}
      {selectedGuiaModal && (
        <div style={styles.modalOverlay} onClick={() => setSelectedGuiaModal(null)}>
          <div
            style={styles.modalCard}
            className="clay-card-static no-sheen animate-fade-in-up"
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
            <div style={styles.modalHeader}>
              <img
                src={selectedGuiaModal.avatar_url}
                alt={selectedGuiaModal.nombre_completo}
                style={styles.modalAvatar}
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

                <h2 style={styles.modalGuideName}>{selectedGuiaModal.nombre_completo}</h2>

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

            {/* Biografía e Información */}
            <div style={styles.modalSection}>
              <h4 style={styles.modalSectionTitle}>{lang === "en" ? "About this Guide" : "Acerca del Guía"}</h4>
              <p style={styles.modalBioText}>{selectedGuiaModal.biografia}</p>
            </div>

            {/* Ficha técnica */}
            <div style={styles.modalTechGrid}>
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

            {/* Botón directo de Contacto por WhatsApp */}
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

            {/* SECCIÓN DE RESEÑAS */}
            <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <h4 style={styles.modalSectionTitle}>
                {lang === "en" ? "Tourist Reviews" : "Reseñas de Turistas"}
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#94A3B8", marginLeft: "8px" }}>
                  ({selectedGuiaModal.resenas?.length || 0})
                </span>
              </h4>

              {/* Formulario para agregar nueva reseña */}
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

              {/* Lista de Reseñas */}
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
    background: "linear-gradient(180deg, #0A192F 0%, #0F172A 50%, #0B132B 100%)",
    color: "#F8FAFC",
    fontFamily: "var(--font-outfit), sans-serif",
    paddingBottom: "80px"
  },
  heroSection: {
    position: "relative",
    padding: "100px 24px 60px 24px",
    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    textAlign: "center"
  },
  heroGlowLeft: {
    position: "absolute",
    top: "-100px",
    left: "-100px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none"
  },
  heroGlowRight: {
    position: "absolute",
    bottom: "-100px",
    right: "-100px",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255, 215, 0, 0.12) 0%, rgba(0,0,0,0) 70%)",
    pointerEvents: "none"
  },
  heroContent: {
    maxWidth: "800px",
    margin: "0 auto",
    position: "relative",
    zIndex: 2
  },
  badgeHero: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(14, 165, 233, 0.12)",
    border: "1px solid rgba(14, 165, 233, 0.3)",
    color: "#38BDF8",
    padding: "6px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "750",
    marginBottom: "16px"
  },
  heroTitle: {
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
    margin: "0 0 14px 0",
    lineHeight: "1.2"
  },
  heroSubtitle: {
    fontSize: "15px",
    color: "#94A3B8",
    lineHeight: "1.6",
    margin: "0 auto 30px auto",
    maxWidth: "680px"
  },
  statsRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "24px",
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "20px",
    padding: "14px 28px",
    backdropFilter: "blur(12px)"
  },
  statBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center"
  },
  statNum: {
    fontSize: "20px",
    fontWeight: "900",
    color: "#FFD700"
  },
  statLabel: {
    fontSize: "12px",
    color: "#94A3B8",
    fontWeight: "600"
  },
  statDivider: {
    width: "1px",
    height: "28px",
    background: "rgba(255, 255, 255, 0.15)"
  },
  mainContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "30px 20px"
  },
  filterCard: {
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "20px",
    padding: "20px",
    backdropFilter: "blur(16px)",
    marginBottom: "30px",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  filterTopRow: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap"
  },
  searchBox: {
    flex: 1,
    minWidth: "260px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "rgba(30, 41, 59, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    padding: "10px 14px"
  },
  searchInput: {
    width: "100%",
    background: "none",
    border: "none",
    color: "#F8FAFC",
    fontSize: "14px",
    outline: "none"
  },
  clearSearchBtn: {
    background: "none",
    border: "none",
    color: "#94A3B8",
    cursor: "pointer",
    padding: "2px"
  },
  sortBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  sortLabel: {
    fontSize: "13px",
    color: "#94A3B8",
    fontWeight: "600"
  },
  selectInput: {
    background: "rgba(30, 41, 59, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#F8FAFC",
    padding: "8px 12px",
    borderRadius: "10px",
    fontSize: "13px",
    outline: "none",
    cursor: "pointer"
  },
  filterPillsSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  filterPillsTitle: {
    fontSize: "13px",
    fontWeight: "750",
    color: "#E2E8F0",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    whiteSpace: "nowrap"
  },
  pillsScrollContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none"
  },
  pillBtn: {
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "12.5px",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "all 0.2s"
  },
  resultsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "20px"
  },
  resultsTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#F8FAFC",
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  resultsBadge: {
    background: "rgba(14, 165, 233, 0.2)",
    color: "#38BDF8",
    fontSize: "13px",
    padding: "2px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(14, 165, 233, 0.3)"
  },
  resetFiltersBtn: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#EF4444",
    padding: "6px 12px",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  guidesGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
    gap: "24px"
  },
  guideCard: {
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "20px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    backdropFilter: "blur(12px)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  cardHeader: {
    display: "flex",
    gap: "16px",
    marginBottom: "14px"
  },
  avatarWrapper: {
    position: "relative",
    width: "64px",
    height: "64px",
    flexShrink: 0
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #0EA5E9"
  },
  verifiedIcon: {
    position: "absolute",
    bottom: "0",
    right: "0",
    background: "#10B981",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  },
  headerInfo: {
    flex: 1
  },
  deptBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(14, 165, 233, 0.15)",
    color: "#38BDF8",
    fontSize: "11.5px",
    fontWeight: "750",
    padding: "2px 8px",
    borderRadius: "6px",
    marginBottom: "4px"
  },
  guideName: {
    fontSize: "17px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: "2px 0 4px 0",
    lineHeight: "1.3"
  },
  ratingRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  starsBox: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  ratingValue: {
    fontWeight: "800",
    fontSize: "13.5px",
    color: "#F8FAFC"
  },
  reviewsCount: {
    fontSize: "12px",
    color: "#94A3B8"
  },
  detailsRow: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    background: "rgba(30, 41, 59, 0.5)",
    borderRadius: "12px",
    padding: "10px 12px",
    margin: "8px 0 12px 0"
  },
  detailItem: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  detailText: {
    fontSize: "12.5px",
    color: "#CBD5E1",
    fontWeight: "600"
  },
  bioSnippet: {
    fontSize: "13px",
    color: "#94A3B8",
    lineHeight: "1.5",
    marginBottom: "16px"
  },
  cardFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "12px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)"
  },
  priceBox: {
    display: "flex",
    flexDirection: "column"
  },
  priceLabel: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "600"
  },
  priceValue: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#10B981"
  },
  actionButtonsGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  whatsappBtn: {
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    width: "36px",
    height: "36px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 4px 10px rgba(37, 211, 102, 0.25)",
    transition: "transform 0.2s"
  },
  detailsBtn: {
    background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 14px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    boxShadow: "0 4px 12px rgba(14, 165, 233, 0.25)"
  },
  emptyState: {
    textAlign: "center",
    padding: "60px 20px",
    background: "rgba(15, 23, 42, 0.6)",
    borderRadius: "20px",
    border: "1px dashed rgba(255, 255, 255, 0.15)"
  },
  emptyTitle: {
    fontSize: "18px",
    fontWeight: "800",
    margin: "12px 0 6px 0"
  },
  emptySubtitle: {
    fontSize: "14px",
    color: "#94A3B8"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.75)",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px"
  },
  modalCard: {
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#0F172A",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "24px",
    padding: "26px",
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
  modalHeader: {
    display: "flex",
    gap: "18px",
    alignItems: "center",
    marginBottom: "20px"
  },
  modalAvatar: {
    width: "80px",
    height: "80px",
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
  modalGuideName: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#FFFFFF",
    margin: "4px 0"
  },
  modalSection: {
    marginBottom: "18px"
  },
  modalSectionTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center"
  },
  modalBioText: {
    fontSize: "14px",
    color: "#CBD5E1",
    lineHeight: "1.6"
  },
  modalTechGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    background: "rgba(30, 41, 59, 0.6)",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "20px"
  },
  techItem: {
    display: "flex",
    flexDirection: "column"
  },
  techLabel: {
    fontSize: "11.5px",
    color: "#64748B",
    fontWeight: "600"
  },
  techValue: {
    fontSize: "13.5px",
    color: "#F8FAFC",
    fontWeight: "750"
  },
  modalWhatsappBanner: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    padding: "12px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "800",
    fontSize: "14.5px",
    textDecoration: "none",
    boxShadow: "0 6px 18px rgba(37, 211, 102, 0.3)"
  },
  reviewForm: {
    background: "rgba(30, 41, 59, 0.5)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "14px",
    padding: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px"
  },
  reviewTextarea: {
    width: "100%",
    background: "rgba(15, 23, 42, 0.8)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "10px",
    padding: "10px",
    color: "#F8FAFC",
    fontSize: "13px",
    outline: "none",
    resize: "none"
  },
  reviewSuccessAlert: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#10B981",
    fontSize: "12.5px",
    fontWeight: "700",
    padding: "8px 12px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  submitReviewBtn: {
    alignSelf: "flex-end",
    background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
    color: "#FFFFFF",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },
  loginToReviewAlert: {
    background: "rgba(14, 165, 233, 0.1)",
    border: "1px solid rgba(14, 165, 233, 0.25)",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#94A3B8",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "10px"
  },
  reviewItemCard: {
    background: "rgba(30, 41, 59, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "12px",
    padding: "12px"
  }
};
