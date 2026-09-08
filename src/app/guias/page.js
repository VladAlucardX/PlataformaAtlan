"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import Navbar from "@/components/ui/Navbar";
import Icon from "@/components/ui/Icon";
import { getCategorySvg } from "@/lib/imageUtils";

// Guías turísticos de demostración con imágenes REALES del proyecto
const MOCK_GUIAS = [
  {
    id: "d377d6ef-b069-4449-98d1-c1646b2cac99",
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
    destinos_mapa: [
      {
        id: "dest-1",
        nombre: "Volcán Cerro Negro",
        categoria: "Sandboarding",
        icono: "🌋",
        deptSlug: "leon",
        departamento: "León",
        imagen: "/images/galeria-departamentos/leon/1.1.jpg",
        desc: "Ascenso directo al volcán más joven de Centroamérica y vertiginoso descenso en tabla de sandboard sobre arena volcánica."
      },
      {
        id: "dest-2",
        nombre: "Catedral de León",
        categoria: "Patrimonio UNESCO",
        icono: "🏛️",
        deptSlug: "leon",
        departamento: "León",
        imagen: "/images/galeria-departamentos/leon/2.jpg",
        desc: "La catedral más grande de Centroamérica. Recorrido histórico por sus cúpulas blancas y cripta colonial."
      },
      {
        id: "dest-3",
        nombre: "Volcán Telica (Lava Nocturna)",
        categoria: "Senderismo",
        icono: "🔥",
        deptSlug: "leon",
        departamento: "León",
        imagen: "/images/galeria-departamentos/leon/3.jpg",
        desc: "Excursión nocturna a la cumbre para contemplar la lava incandescente en las profundidades del cráter activo."
      }
    ],
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
    id: "b392401c-5d4b-4d9a-9c68-cc97f7f2e673",
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
    destinos_mapa: [
      {
        id: "dest-4",
        nombre: "Isletas de Granada",
        categoria: "Naturaleza & Náutica",
        icono: "🏝️",
        deptSlug: "granada",
        departamento: "Granada",
        imagen: "/images/galeria-departamentos/granada/1.1.jpg",
        desc: "Travesía en lancha o kayak por las 365 islas de origen volcánico en el Gran Lago Cocibolca."
      },
      {
        id: "dest-5",
        nombre: "Reserva Volcán Mombacho",
        categoria: "Ecoturismo",
        icono: "🌿",
        deptSlug: "granada",
        departamento: "Granada",
        imagen: "/images/galeria-departamentos/granada/2.jpg",
        desc: "Senderismo por el bosque de neblina alrededor del cráter extinto y miradores hacia Granada."
      },
      {
        id: "dest-6",
        nombre: "Centro Histórico & Convento",
        categoria: "Cultura",
        icono: "🏰",
        deptSlug: "granada",
        departamento: "Granada",
        imagen: "/images/galeria-departamentos/granada/3.jpg",
        desc: "Caminata cultural guiada por los templos coloniales, la Calzada y el Museo San Francisco."
      }
    ],
    galeria_fotos: [
      "/images/galeria-departamentos/granada/1.1.jpg",
      "/images/galeria-departamentos/granada/2.jpg",
      "/images/galeria-departamentos/granada/3.jpg",
      "/images/galeria-departamentos/granada/4.jpg"
    ],
    resenas: [
      {
        id: "r3",
        autor_nombre: "Lucía Fernández",
        autor_avatar: "/images/art5.png",
        puntuacion: 5,
        comentario: "Un recorrido cultural inolvidable por los templos y el Convento San Francisco. María transmite un amor contagioso por la historia.",
        created_at: "2026-08-20T11:00:00Z"
      },
      {
        id: "r3_b",
        autor_nombre: "Jean-Pierre Dubois",
        autor_avatar: "/images/art4.png",
        puntuacion: 5,
        comentario: "Visite guidée fantastique des Isletas de Granada. María habla un francés impecable y conoce perfectamente la ecología del lago.",
        created_at: "2026-07-14T15:30:00Z"
      }
    ]
  },
  {
    id: "f4a6c46b-498a-4c04-8abf-efdac96e071d",
    nombre_completo: "Alejandro Jarquín",
    avatar_url: "/images/art3.jpeg",
    departamento_principal: "Rivas",
    departamentos_secundarios: ["Isla de Ometepe", "San Juan del Sur"],
    especialidad: "Ecoturismo Integral",
    idiomas: "Español, Inglés",
    experiencia_anios: 7,
    tarifa_aprox: "$30 - $55 / día",
    biografia: "Especialista en la mística Isla de Ometepe. Guiado de ascenso a los volcanes Concepción y Maderas, cascada San Ramón, petroglifos precolombinos y tours de pesca artesanal.",
    telefono_contacto: "+505 8812 3456",
    whatsapp: "50588123456",
    instagram: "@ometepe_ecotours",
    licencia_intur: "INTUR-RI-2020-304",
    rating_promedio: 4.9,
    total_resenas: 29,
    activo: true,
    destinos_mapa: [
      {
        id: "dest-7",
        nombre: "Volcanes Concepción y Maderas",
        categoria: "Montañismo",
        icono: "⛰️",
        deptSlug: "rivas",
        departamento: "Rivas",
        imagen: "/images/galeria-departamentos/rivas/1.1.webp",
        desc: "Ascensos desafiantes a las cumbres icónicas que forman la mística Isla de Ometepe."
      },
      {
        id: "dest-8",
        nombre: "Ojo de Agua Ometepe",
        categoria: "Relajación Natural",
        icono: "💧",
        deptSlug: "rivas",
        departamento: "Rivas",
        imagen: "/images/galeria-departamentos/rivas/2.jpg",
        desc: "Reserva de aguas manantiales volcánicas ultra cristalinas y propiedades curativas."
      },
      {
        id: "dest-9",
        nombre: "San Juan del Sur & Cristo",
        categoria: "Playas & Surf",
        icono: "🏖️",
        deptSlug: "rivas",
        departamento: "Rivas",
        imagen: "/images/galeria-departamentos/rivas/3.jpg",
        desc: "Bahía turística, miradores panorámicos del Pacífico y playas vírgenes para practicar surf."
      }
    ],
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
      },
      {
        id: "r4_b",
        autor_nombre: "Camila Rivas",
        autor_avatar: "/images/art2.jpeg",
        puntuacion: 5,
        comentario: "Excelente atención y guianza en Ojo de Agua y ascenso a San Ramón. Nos dio recomendaciones locales fantásticas.",
        created_at: "2026-06-19T09:10:00Z"
      }
    ]
  },
  /* PERFILES DE PRUEBA TEMPORALES PARA PAGINACIÓN */
  {
    id: "test-guia-1",
    nombre_completo: "Beatriz Solís (Prueba)",
    avatar_url: "/images/art5.png",
    departamento_principal: "Matagalpa",
    departamentos_secundarios: ["Jinotega"],
    especialidad: "Avistamiento de Aves",
    idiomas: "Español, Inglés, Alemán",
    experiencia_anios: 9,
    tarifa_aprox: "$40 - $65 / día",
    biografia: "[PERFIL DE PRUEBA] Guía especialista en la observación de aves en Selva Negra y reservas naturales del norte.",
    telefono_contacto: "+505 8800 0001",
    whatsapp: "50588000001",
    instagram: "@beatriz_birds_test",
    licencia_intur: "INTUR-MT-2017-819",
    rating_promedio: 4.9,
    total_resenas: 18,
    activo: true,
    destinos_mapa: [],
    galeria_fotos: [
      "/images/galeria-departamentos/matagalpa/1.1.jpg",
      "/images/galeria-departamentos/matagalpa/2.jpg",
      "/images/galeria-departamentos/matagalpa/3.jpg",
      "/images/galeria-departamentos/matagalpa/4.jpg"
    ],
    resenas: []
  },
  {
    id: "test-guia-2",
    nombre_completo: "Gabriel Gutiérrez (Prueba)",
    avatar_url: "/images/art4.png",
    departamento_principal: "Masaya",
    departamentos_secundarios: ["Carazo"],
    especialidad: "Gastronomía Tradicional",
    idiomas: "Español, Inglés",
    experiencia_anios: 6,
    tarifa_aprox: "$25 - $45 / día",
    biografia: "[PERFIL DE PRUEBA] Apasionado por los recorridos artesanales y gastronómicos en los Pueblos Blancos y Masaya.",
    telefono_contacto: "+505 8800 0002",
    whatsapp: "50588000002",
    instagram: "@gabriel_masaya_test",
    licencia_intur: "INTUR-MS-2020-411",
    rating_promedio: 4.8,
    total_resenas: 15,
    activo: true,
    destinos_mapa: [],
    galeria_fotos: [
      "/images/galeria-departamentos/masaya/1.1.jpg",
      "/images/galeria-departamentos/masaya/2.jpg",
      "/images/galeria-departamentos/masaya/3.jpg",
      "/images/galeria-departamentos/masaya/4.jpeg"
    ],
    resenas: []
  },
  {
    id: "test-guia-3",
    nombre_completo: "Valeria Ramos (Prueba)",
    avatar_url: "/images/art2.jpeg",
    departamento_principal: "Chinandega",
    departamentos_secundarios: ["León"],
    especialidad: "Senderismo y Volcanes",
    idiomas: "Español, Inglés",
    experiencia_anios: 8,
    tarifa_aprox: "$35 - $50 / día",
    biografia: "[PERFIL DE PRUEBA] Guía de aventuras extremas en el Volcán Cosigüina y estero Padre Ramos.",
    telefono_contacto: "+505 8800 0003",
    whatsapp: "50588000003",
    instagram: "@valeria_volcano_test",
    licencia_intur: "INTUR-CH-2019-105",
    rating_promedio: 5.0,
    total_resenas: 22,
    activo: true,
    destinos_mapa: [],
    galeria_fotos: [
      "/images/galeria-departamentos/leon/1.1.jpg",
      "/images/galeria-departamentos/leon/2.jpg",
      "/images/galeria-departamentos/leon/3.jpg",
      "/images/galeria-departamentos/leon/4.jpg"
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

const IDIOMAS_LIST = [
  "Todos",
  "Español",
  "Inglés",
  "Francés",
  "Alemán"
];

const RANGOS_PRECIO_LIST = [
  "Todos",
  "Económico (< $30)",
  "Estándar ($30 - $50)",
  "Premium (> $50)"
];

export default function GuiasPage() {
  const { lang } = useTranslation();
  const { session, perfil } = useAuth();

  const [guias, setGuias] = useState(MOCK_GUIAS);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedDept, setSelectedDept] = useState("Todos");
  const [selectedEspecialidad, setSelectedEspecialidad] = useState("Todas");
  const [selectedIdiomas, setSelectedIdiomas] = useState([]);
  const [selectedRangoPrecio, setSelectedRangoPrecio] = useState("Todos");
  const [solamenteVerificados, setSolamenteVerificados] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("alfabetico");

  // Paginación (4 perfiles por página)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 4;

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDept, selectedEspecialidad, selectedIdiomas, selectedRangoPrecio, solamenteVerificados, searchQuery, sortBy]);

  // Modal de Detalle de Guía
  const [selectedGuiaModal, setSelectedGuiaModal] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("info");

  // Formulario de Reseña
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState("");

  // Cargar guías de Supabase (combinando registros de BD con MOCK_GUIAS)
  useEffect(() => {
    async function loadGuias() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("guias_turisticos")
          .select("*")
          .eq("activo", true)
          .order("updated_at", { ascending: false });

        let rawSaved = null;
        try {
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("atlan_guia_profile_global") || localStorage.getItem("atlan_guia_profile_carlos");
            if (raw) rawSaved = JSON.parse(raw);
          }
        } catch (e) {}

        if (!error && data && data.length > 0) {
          const formattedDbGuias = data.map((g) => ({
            ...g,
            nombre_completo: g.nombre_completo || g.perfiles?.nombre_completo || "Guía Turístico",
            avatar_url: g.avatar_url || g.perfiles?.avatar_url || "/images/perfil.svg",
            resenas: g.resenas || [],
            galeria_fotos: g.galeria_fotos && g.galeria_fotos.length > 0 ? g.galeria_fotos : [
              "/images/galeria-departamentos/leon/1.1.jpg",
              "/images/galeria-departamentos/leon/2.jpg"
            ]
          }));

          // Combinar guías de la BD con MOCK_GUIAS (priorizando el registro de BD más reciente)
          const merged = [];
          const usedDbIds = new Set();

          MOCK_GUIAS.forEach((mockG) => {
            const isCarlos = mockG.nombre_completo.toLowerCase().includes("carlos");
            const activeProfile = isCarlos && rawSaved ? rawSaved : null;

            // Buscar coincidencia exacta en la BD ordenada por actualización reciente
            const dbMatch = formattedDbGuias.find(
              (dbG) => dbG.id === mockG.id || (dbG.nombre_completo && dbG.nombre_completo.toLowerCase().trim() === mockG.nombre_completo.toLowerCase().trim())
            );

            const source = dbMatch || activeProfile;
            if (source) {
              if (dbMatch) usedDbIds.add(dbMatch.id);
              merged.push({
                ...mockG,
                ...source,
                id: mockG.id, // mantener id de navegación
                departamento_principal: source.departamento_principal || mockG.departamento_principal,
                especialidad: source.especialidad || mockG.especialidad,
                tarifa_aprox: source.tarifa_aprox || mockG.tarifa_aprox,
                experiencia_anios: source.experiencia_anios || mockG.experiencia_anios,
                biografia: source.biografia || mockG.biografia,
                whatsapp: source.whatsapp || mockG.whatsapp,
                licencia_intur: source.licencia_intur || mockG.licencia_intur,
                idiomas: source.idiomas || mockG.idiomas,
              });
            } else {
              merged.push(mockG);
            }
          });

          // Agregar cualquier guía adicional de la BD que no haya sido emparejada
          formattedDbGuias.forEach((dbG) => {
            if (!usedDbIds.has(dbG.id)) {
              merged.push(dbG);
            }
          });

          setGuias(merged);
        } else {
          // Si BD no tiene registros pero hay localSaved, aplicar localSaved a Carlos Mendoza
          if (rawSaved) {
            const merged = MOCK_GUIAS.map(mockG => {
              if (mockG.nombre_completo.toLowerCase().includes("carlos")) {
                return {
                  ...mockG,
                  ...rawSaved,
                  departamento_principal: rawSaved.departamento_principal || mockG.departamento_principal,
                  especialidad: rawSaved.especialidad || mockG.especialidad,
                  tarifa_aprox: rawSaved.tarifa_aprox || mockG.tarifa_aprox,
                  experiencia_anios: rawSaved.experiencia_anios || mockG.experiencia_anios,
                  biografia: rawSaved.biografia || mockG.biografia,
                  whatsapp: rawSaved.whatsapp || mockG.whatsapp,
                  licencia_intur: rawSaved.licencia_intur || mockG.licencia_intur,
                  idiomas: rawSaved.idiomas || mockG.idiomas,
                };
              }
              return mockG;
            });
            setGuias(merged);
          } else {
            setGuias(MOCK_GUIAS);
          }
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

  // Manejador de selección múltiple de idiomas
  const handleToggleIdioma = (langItem) => {
    if (langItem === "Todos") {
      setSelectedIdiomas([]);
    } else {
      if (selectedIdiomas.includes(langItem)) {
        setSelectedIdiomas(selectedIdiomas.filter((i) => i !== langItem));
      } else {
        setSelectedIdiomas([...selectedIdiomas, langItem]);
      }
    }
  };

  // Limpiar todos los filtros
  const hasActiveFilters =
    selectedDept !== "Todos" ||
    selectedEspecialidad !== "Todas" ||
    selectedIdiomas.length > 0 ||
    selectedRangoPrecio !== "Todos" ||
    solamenteVerificados ||
    searchQuery.trim() !== "";

  const clearAllFilters = () => {
    setSelectedDept("Todos");
    setSelectedEspecialidad("Todas");
    setSelectedIdiomas([]);
    setSelectedRangoPrecio("Todos");
    setSolamenteVerificados(false);
    setSearchQuery("");
  };

  // Filtrado y ordenamiento avanzado de guías
  const guiasFiltrados = guias.filter((guia) => {
    // 1. Departamento
    const matchDept =
      selectedDept === "Todos" ||
      guia.departamento_principal?.toLowerCase() === selectedDept.toLowerCase() ||
      (guia.departamentos_secundarios &&
        guia.departamentos_secundarios.some(
          (d) => d.toLowerCase() === selectedDept.toLowerCase()
        ));

    // 2. Especialidad
    const matchEspec =
      selectedEspecialidad === "Todas" ||
      guia.especialidad?.toLowerCase().includes(selectedEspecialidad.toLowerCase());

    // 3. Selección múltiple de Idiomas (Coincide si el guía habla cualquiera de los seleccionados)
    const matchIdioma =
      selectedIdiomas.length === 0 ||
      selectedIdiomas.some((i) =>
        guia.idiomas?.toLowerCase().includes(i.toLowerCase())
      );

    // 4. INTUR Verificados
    const matchVerificados = !solamenteVerificados || Boolean(guia.licencia_intur);

    // 5. Rango de precio
    let matchPrecio = true;
    if (selectedRangoPrecio !== "Todos") {
      const tarifaNum = parseInt((guia.tarifa_aprox || "").replace(/[^0-9]/g, "")) || 30;
      if (selectedRangoPrecio === "Económico (< $30)") {
        matchPrecio = tarifaNum < 30;
      } else if (selectedRangoPrecio === "Estándar ($30 - $50)") {
        matchPrecio = tarifaNum >= 30 && tarifaNum <= 50;
      } else if (selectedRangoPrecio === "Premium (> $50)") {
        matchPrecio = tarifaNum > 50;
      }
    }

    // 6. Buscador multi-campo inteligente
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      guia.nombre_completo?.toLowerCase().includes(q) ||
      guia.biografia?.toLowerCase().includes(q) ||
      guia.especialidad?.toLowerCase().includes(q) ||
      guia.departamento_principal?.toLowerCase().includes(q) ||
      guia.idiomas?.toLowerCase().includes(q) ||
      guia.licencia_intur?.toLowerCase().includes(q) ||
      (guia.departamentos_secundarios &&
        guia.departamentos_secundarios.some((d) => d.toLowerCase().includes(q)));

    return (
      matchDept &&
      matchEspec &&
      matchIdioma &&
      matchVerificados &&
      matchPrecio &&
      matchQuery
    );
  }).sort((a, b) => {
    if (sortBy === "alfabetico") {
      return (a.nombre_completo || "").localeCompare(b.nombre_completo || "", "es", { sensitivity: "base" });
    }
    if (sortBy === "rating") return b.rating_promedio - a.rating_promedio;
    if (sortBy === "experiencia") return b.experiencia_anios - a.experiencia_anios;
    if (sortBy === "precio_asc") {
      const pA = parseInt((a.tarifa_aprox || "").replace(/[^0-9]/g, "")) || 0;
      const pB = parseInt((b.tarifa_aprox || "").replace(/[^0-9]/g, "")) || 0;
      return pA - pB;
    }
    if (sortBy === "precio_desc") {
      const pA = parseInt((a.tarifa_aprox || "").replace(/[^0-9]/g, "")) || 0;
      const pB = parseInt((b.tarifa_aprox || "").replace(/[^0-9]/g, "")) || 0;
      return pB - pA;
    }
    return (a.nombre_completo || "").localeCompare(b.nombre_completo || "", "es", { sensitivity: "base" });
  });

  const totalPages = Math.ceil(guiasFiltrados.length / ITEMS_PER_PAGE) || 1;
  const paginatedGuias = guiasFiltrados.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
    setReviewSuccessMsg(lang === "en" ? "Review posted successfully!" : lang === "zh" ? "评价发布成功！" : "¡Reseña publicada con éxito!");
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

      {/* HERO BANNER DE DISEÑO MODERNO Y ELEGANTE */}
      <section style={styles.heroSectionCompact}>
        <div style={styles.heroGlowLeft} />

        <div style={styles.heroContentWide}>
          <h1 style={styles.heroTitleMain}>
            {lang === "en" ? (
              <>
                <span style={styles.whiteTextWithShadow}>Explore</span>{" "}
                <span style={styles.flagShadowWrapper}>
                  <span className="text-flag-nicaragua" style={styles.flagSpan}>Nicaragua</span>
                </span>{" "}
                <span style={styles.whiteTextWithShadow}>with Expert Local Guides</span>
              </>
            ) : lang === "zh" ? (
              <>
                <span style={styles.whiteTextWithShadow}>与本地专业导游探索</span>{" "}
                <span style={styles.flagShadowWrapper}>
                  <span className="text-flag-nicaragua" style={styles.flagSpan}>尼加拉瓜</span>
                </span>
              </>
            ) : (
              <>
                <span style={styles.whiteTextWithShadow}>Explora</span>{" "}
                <span style={styles.flagShadowWrapper}>
                  <span className="text-flag-nicaragua" style={styles.flagSpan}>Nicaragua</span>
                </span>{" "}
                <span style={styles.whiteTextWithShadow}>con Guías Turísticos Locales</span>
              </>
            )}
          </h1>
        </div>
      </section>

      {/* FILTROS Y CONTENEDOR ANCHO */}
      <main style={styles.mainContainerWide}>
        {/* BARRA DE FILTROS ULTRA COMPACTA (1 FILA PRINCIPAL + DESPLEGABLE DE FILTROS AVANZADOS) */}
        <div style={styles.filterPanelProfessional}>
          {/* Fila Principal Unificada y Compacta */}
          <div style={styles.filterRow1}>
            {/* 1. Buscador Slim */}
            <div style={styles.searchBoxSlim}>
              <Icon name="search" size={16} color="#0EA5E9" />
              <input
                type="text"
                placeholder={lang === "en" ? "Search by name, city, volcano..." : lang === "zh" ? "按导游姓名、火山、城市搜索..." : "Buscar guía por nombre, volcán, ciudad..."}
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

            {/* 2. Selector Desplegable de Departamento */}
            <div style={styles.selectFilterWrapper}>
              <Icon name="mapPin" size={14} color="#0EA5E9" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                style={styles.selectInputCompact}
              >
                <option value="Todos" style={styles.selectOption}>{lang === "en" ? "All Depts" : lang === "zh" ? "所有省份" : "Todos los Deptos"}</option>
                {DEPARTAMENTOS_LIST.filter(d => d !== "Todos").map((dept) => (
                  <option key={dept} value={dept} style={styles.selectOption}>{dept}</option>
                ))}
              </select>
            </div>

            {/* 3. Selector Desplegable de Especialidad */}
            <div style={styles.selectFilterWrapper}>
              <Icon name="tag" size={14} color="#FFD700" />
              <select
                value={selectedEspecialidad}
                onChange={(e) => setSelectedEspecialidad(e.target.value)}
                style={styles.selectInputCompact}
              >
                <option value="Todas" style={styles.selectOption}>{lang === "en" ? "All Specialties" : lang === "zh" ? "所有专长" : "Todas las Especialidades"}</option>
                {ESPECIALIDADES_LIST.filter(e => e !== "Todas").map((esp) => (
                  <option key={esp} value={esp} style={styles.selectOption}>{esp}</option>
                ))}
              </select>
            </div>

            {/* 4. Ordenamiento */}
            <div style={styles.sortBoxSlim}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.selectInputSlim}
              >
                <option value="alfabetico" style={styles.selectOption}>{lang === "en" ? "Alphabetical (A-Z)" : lang === "zh" ? "按字母顺序 (A-Z)" : "Orden Alfabético (A-Z)"}</option>
                <option value="rating" style={styles.selectOption}>{lang === "en" ? "Best Rating" : lang === "zh" ? "最高评分" : "Mejor Calificación"}</option>
                <option value="experiencia" style={styles.selectOption}>{lang === "en" ? "Experience" : lang === "zh" ? "最丰富经验" : "Más Experiencia"}</option>
                <option value="precio_asc" style={styles.selectOption}>{lang === "en" ? "Price: Low to High" : lang === "zh" ? "价格从低到高" : "Precio: Menor a Mayor"}</option>
                <option value="precio_desc" style={styles.selectOption}>{lang === "en" ? "Price: High to Low" : lang === "zh" ? "价格从高到低" : "Precio: Mayor a Menor"}</option>
              </select>
            </div>

            {/* 5. Botón Toggle Filtros Avanzados */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                ...styles.advancedToggleBtn,
                background: showAdvancedFilters || selectedIdiomas.length > 0 || selectedRangoPrecio !== "Todos" || solamenteVerificados
                  ? "rgba(14, 165, 233, 0.22)"
                  : "rgba(30, 41, 59, 0.8)",
                border: showAdvancedFilters || selectedIdiomas.length > 0 || selectedRangoPrecio !== "Todos" || solamenteVerificados
                  ? "1.5px solid #0EA5E9"
                  : "1px solid rgba(255, 255, 255, 0.12)",
                color: showAdvancedFilters || selectedIdiomas.length > 0 || selectedRangoPrecio !== "Todos" || solamenteVerificados
                  ? "#38BDF8"
                  : "#94A3B8"
              }}
            >
              <Icon name="filter" size={13} />
              <span>{lang === "en" ? "Filters" : lang === "zh" ? "筛选" : "Filtros"}</span>
              {(selectedIdiomas.length > 0 || selectedRangoPrecio !== "Todos" || solamenteVerificados) && (
                <span style={styles.activeFilterDot} />
              )}
              <Icon name={showAdvancedFilters ? "chevronUp" : "chevronDown"} size={12} />
            </button>
          </div>

          {/* DESPLEGABLE DE FILTROS AVANZADOS (IDIOMAS MÚLTIPLES, PRECIO E INTUR) */}
          {showAdvancedFilters && (
            <div style={styles.advancedFiltersDropdownContainer}>
              <div style={styles.dualFiltersRow}>
                {/* Idioma Múltiple */}
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <span style={styles.filterSectionTitleSlim}>
                    <Icon name="globe" size={13} color="#10B981" />
                    {lang === "en" ? "Languages (Multi-select):" : lang === "zh" ? "导游语言（多选）：" : "Idiomas del Guía (Selección Múltiple):"}
                  </span>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                    {IDIOMAS_LIST.map((langItem) => {
                      const isTodos = langItem === "Todos";
                      const isActive = isTodos
                        ? selectedIdiomas.length === 0
                        : selectedIdiomas.includes(langItem);
                      return (
                        <button
                          key={langItem}
                          onClick={() => handleToggleIdioma(langItem)}
                          style={{
                            ...styles.pillBtnSlim,
                            border: isActive ? "1.5px solid #10B981" : "1px solid rgba(255, 255, 255, 0.12)",
                            background: isActive ? "rgba(16, 185, 129, 0.22)" : "rgba(15, 23, 42, 0.7)",
                            color: isActive ? "#34D399" : "#94A3B8"
                          }}
                        >
                          {isActive && !isTodos ? "✓ " : ""}{langItem}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Rango de Tarifa */}
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <span style={styles.filterSectionTitleSlim}>
                    <Icon name="dollarSign" size={13} color="#38BDF8" />
                    {lang === "en" ? "Rate Range:" : lang === "zh" ? "参考费用：" : "Tarifa Estimada:"}
                  </span>
                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "4px" }}>
                    {RANGOS_PRECIO_LIST.map((rango) => {
                      const isActive = selectedRangoPrecio === rango;
                      return (
                        <button
                          key={rango}
                          onClick={() => setSelectedRangoPrecio(rango)}
                          style={{
                            ...styles.pillBtnSlim,
                            border: isActive ? "1.5px solid #38BDF8" : "1px solid rgba(255, 255, 255, 0.12)",
                            background: isActive ? "rgba(14, 165, 233, 0.22)" : "rgba(15, 23, 42, 0.7)",
                            color: isActive ? "#38BDF8" : "#94A3B8"
                          }}
                        >
                          {rango}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Solo Certificados INTUR Toggle */}
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={() => setSolamenteVerificados(!solamenteVerificados)}
                    style={{
                      ...styles.verifiedToggleBtn,
                      background: solamenteVerificados ? "rgba(16, 185, 129, 0.25)" : "rgba(30, 41, 59, 0.7)",
                      border: solamenteVerificados ? "1.5px solid #10B981" : "1px solid rgba(255, 255, 255, 0.12)",
                      color: solamenteVerificados ? "#34D399" : "#94A3B8"
                    }}
                  >
                    <Icon name="checkCircle" size={14} color={solamenteVerificados ? "#10B981" : "#64748B"} />
                    <span>{lang === "en" ? "INTUR Verified Only" : lang === "zh" ? "仅限INTUR认证导游" : "Solo Certificados INTUR"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CHIPS DE FILTROS ACTIVOS CON BOTÓN PARA ELIMINAR INDIVIDUALMENTE */}
          {hasActiveFilters && (
            <div style={styles.activeFiltersRow}>
              <span style={styles.activeFiltersLabel}>{lang === "en" ? "Active Filters:" : lang === "zh" ? "当前筛选：" : "Filtros Activos:"}</span>

              {selectedDept !== "Todos" && (
                <span style={styles.activeChip}>
                  <span>{lang === "en" ? "Dept:" : lang === "zh" ? "省份:" : "Dept:"} <b>{selectedDept}</b></span>
                  <button onClick={() => setSelectedDept("Todos")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              {selectedEspecialidad !== "Todas" && (
                <span style={styles.activeChip}>
                  <span>{lang === "en" ? "Specialty:" : lang === "zh" ? "专长:" : "Especialidad:"} <b>{selectedEspecialidad}</b></span>
                  <button onClick={() => setSelectedEspecialidad("Todas")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              {selectedIdiomas.map((idioma) => (
                <span key={idioma} style={styles.activeChip}>
                  <span>{lang === "en" ? "Language:" : lang === "zh" ? "语言:" : "Idioma:"} <b>{idioma}</b></span>
                  <button onClick={() => handleToggleIdioma(idioma)} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}

              {selectedRangoPrecio !== "Todos" && (
                <span style={styles.activeChip}>
                  <span>{lang === "en" ? "Rate:" : lang === "zh" ? "费用:" : "Tarifa:"} <b>{selectedRangoPrecio}</b></span>
                  <button onClick={() => setSelectedRangoPrecio("Todos")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              {solamenteVerificados && (
                <span style={styles.activeChip}>
                  <span>{lang === "en" ? "INTUR Verified" : lang === "zh" ? "INTUR 认证" : "Verificados INTUR"}</span>
                  <button onClick={() => setSolamenteVerificados(false)} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              {searchQuery.trim() !== "" && (
                <span style={styles.activeChip}>
                  <span>"{searchQuery}"</span>
                  <button onClick={() => setSearchQuery("")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              <button onClick={clearAllFilters} style={styles.clearAllFiltersBtn}>
                <Icon name="x" size={12} />
                <span>{lang === "en" ? "Reset All" : lang === "zh" ? "重置全部" : "Limpiar Todos"}</span>
              </button>
            </div>
          )}
        </div>

        {/* CONTADOR DE RESULTADOS Y CABECERA CON PAGINACIÓN INTEGRADA */}
        <div style={styles.resultsHeaderGlass}>
          <div style={styles.resultsTitleLeft}>
            <div style={styles.headerIconBox}>
              <Icon name="compass" size={15} color="#38BDF8" />
            </div>
            <h2 style={styles.resultsTitleClean}>
              {lang === "en" ? "Available Tour Guides" : lang === "zh" ? "可选导游" : "Guías Turísticos Disponibles"}
            </h2>
            <span style={styles.resultsBadgeSlim}>
              {guiasFiltrados.length} {guiasFiltrados.length === 1 ? (lang === "en" ? "guide" : lang === "zh" ? "位导游" : "guía") : (lang === "en" ? "guides" : lang === "zh" ? "位导游" : "guías")}
            </span>
          </div>

          {/* CONTROLES DE PAGINACIÓN INTEGRADOS Y RESET DE FILTROS */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "nowrap" }}>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} style={styles.resetFiltersBtnSlim}>
                <Icon name="x" size={12} />
                <span>{lang === "en" ? "Reset" : lang === "zh" ? "重置" : "Limpiar"}</span>
              </button>
            )}

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#94A3B8", fontSize: "12px", fontWeight: "600", marginRight: "4px" }}>
                  {lang === "en" ? `Page ${currentPage}/${totalPages}` : lang === "zh" ? `第 ${currentPage}/${totalPages} 页` : `Pág. ${currentPage}/${totalPages}`}
                </span>

                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: currentPage === 1 ? "rgba(255, 255, 255, 0.04)" : "rgba(20, 109, 158, 0.3)",
                    border: currentPage === 1 ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(56, 189, 248, 0.4)",
                    color: currentPage === 1 ? "#64748B" : "#38BDF8",
                    cursor: currentPage === 1 ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                  title="Página anterior"
                >
                  <Icon name="chevronLeft" size={14} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: currentPage === pageNum ? "linear-gradient(135deg, #146D9E 0%, #0F5579 100%)" : "rgba(255, 255, 255, 0.05)",
                      border: currentPage === pageNum ? "1.5px solid #FFD700" : "1px solid rgba(255, 255, 255, 0.08)",
                      color: currentPage === pageNum ? "#FFFFFF" : "#CBD5E1",
                      fontSize: "12px",
                      fontWeight: "800",
                      cursor: "pointer",
                      boxShadow: currentPage === pageNum ? "0 2px 8px rgba(20, 109, 158, 0.4)" : "none",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    background: currentPage === totalPages ? "rgba(255, 255, 255, 0.04)" : "rgba(20, 109, 158, 0.3)",
                    border: currentPage === totalPages ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(56, 189, 248, 0.4)",
                    color: currentPage === totalPages ? "#64748B" : "#38BDF8",
                    cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease"
                  }}
                  title="Página siguiente"
                >
                  <Icon name="chevronRight" size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* REJILLA DE TARJETAS HORIZONTALES DE GUÍAS (ACABADO GLASSMORPHI SINFÍN BORDES BLANCOS) */}
        {guiasFiltrados.length === 0 ? (
          <div style={styles.emptyStateSlim}>
            <Icon name="compass" size={42} color="#475569" />
            <h3 style={styles.emptyTitleSlim}>
              {lang === "en" ? "No tour guides found" : lang === "zh" ? "未找到导游" : "No se encontraron guías turísticos"}
            </h3>
            <p style={styles.emptySubtitleSlim}>
              {lang === "en"
                ? "Try selecting another department or clearing search filters."
                : lang === "zh"
                ? "尝试选择其他省份或清除筛选条件。"
                : "Intenta seleccionando otro departamento o limpiando los filtros de búsqueda."}
            </p>
          </div>
        ) : (
          <div style={styles.guidesGridWide}>
            {paginatedGuias.map((guia) => (
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
                        <span style={styles.reviewsCountWide}>({guia.total_resenas} {lang === "en" ? "reviews" : lang === "zh" ? "条评价" : "reseñas"})</span>
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
                      {guia.experiencia_anios} {lang === "en" ? "yrs exp" : lang === "zh" ? "年经验" : "años exp"}
                    </span>
                  </div>

                  <p style={styles.bioSnippetWide}>
                    {guia.biografia?.length > 65
                      ? guia.biografia.substring(0, 65) + "..."
                      : guia.biografia}
                  </p>

                  {/* Footer de Tarjeta: Tarifa y Botones Alineados */}
                  <div style={styles.cardFooterWide}>
                    <div style={styles.pricePillBadge}>
                      <Icon name="dollarSign" size={12} color="#10B981" />
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
                          <Icon name="whatsapp" size={16} color="#FFFFFF" />
                        </a>
                      )}

                      <button
                        onClick={() => {
                          setSelectedGuiaModal(guia);
                          setActiveModalTab("info");
                        }}
                        style={styles.detailsBtnSlim}
                      >
                        <span>{lang === "en" ? "View Profile" : lang === "zh" ? "查看资料" : "Ver Perfil"}</span>
                        <Icon name="chevronRight" size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha: Portada Rectangular de Travesía */}
                {guia.galeria_fotos && guia.galeria_fotos.length > 0 && (
                  <div
                    style={styles.coverPhotoBoxRight}
                    onClick={() => {
                      setSelectedGuiaModal(guia);
                      setActiveModalTab("galeria");
                    }}
                    title={lang === "en" ? "View full photo gallery" : lang === "zh" ? "查看完整相册" : "Ver galería de fotos completa"}
                  >
                    <img
                      src={guia.galeria_fotos[0]}
                      alt={guia.nombre_completo}
                      style={styles.coverPhotoImg}
                    />
                    <div style={styles.coverPhotoOverlayBadge}>
                      <Icon name="image" size={11} color="#FFFFFF" />
                      <span>+{guia.galeria_fotos.length}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL EXTENDIDO DEL GUÍA COMPLETO A LO ANCHO Y 100% UNIFORME */}
      {selectedGuiaModal && (
        <div style={styles.modalOverlay} onClick={() => setSelectedGuiaModal(null)}>
          <div
            style={styles.modalCardWide}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera Unificada de Perfil con Banner Integro */}
            <div style={styles.modalHeaderCard}>
              <button
                onClick={() => setSelectedGuiaModal(null)}
                style={styles.closeModalBtn}
                title={lang === "en" ? "Close Profile" : lang === "zh" ? "关闭资料" : "Cerrar Perfil"}
              >
                <Icon name="x" size={18} />
              </button>

              <div style={styles.modalAvatarContainer}>
                <img
                  src={selectedGuiaModal.avatar_url}
                  alt={selectedGuiaModal.nombre_completo}
                  style={styles.modalAvatarWide}
                />
                <div style={styles.modalAvatarBadgeVerified} title="Guía INTUR Certificado">
                  <Icon name="checkCircle" size={15} color="#FFFFFF" />
                </div>
              </div>

              <div style={styles.modalProfileMetaContent}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                  <span style={styles.modalDeptBadge}>
                    <Icon name="mapPin" size={12} color="#0EA5E9" />
                    {selectedGuiaModal.departamento_principal}
                  </span>
                  {selectedGuiaModal.licencia_intur && (
                    <span style={styles.modalLicenseBadge}>
                      <Icon name="shield" size={12} color="#10B981" />
                      {selectedGuiaModal.licencia_intur}
                    </span>
                  )}
                  <span style={styles.modalExpBadge}>
                    <Icon name="clock" size={12} color="#FFD700" />
                    {selectedGuiaModal.experiencia_anios} {lang === "en" ? "Years Exp" : lang === "zh" ? "年经验" : "Años Exp"}
                  </span>
                  <span style={styles.modalRateHighlight}>
                    <Icon name="dollarSign" size={12} color="#10B981" />
                    {selectedGuiaModal.tarifa_aprox || "$30 / día"}
                  </span>
                </div>

                <h2 style={styles.modalGuideNameWide}>{selectedGuiaModal.nombre_completo}</h2>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={styles.starsBox}>
                    <span style={{ color: "#FFD700", fontWeight: "900", fontSize: "16px" }}>★</span>
                    <span style={{ fontWeight: "800", color: "#F8FAFC", fontSize: "15px" }}>
                      {selectedGuiaModal.rating_promedio}
                    </span>
                    <span style={{ fontSize: "13px", color: "#94A3B8", marginLeft: "4px" }}>
                      ({selectedGuiaModal.total_resenas} {lang === "en" ? "reviews" : lang === "zh" ? "条评价" : "reseñas"})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas del Modal (Segmented Control 4 Columnas 100% Idénticas) */}
            <div style={styles.modalTabsContainer}>
              <div style={styles.modalTabsRow}>
                <button
                  onClick={() => setActiveModalTab("info")}
                  style={{
                    ...styles.modalTabBtn,
                    ...(activeModalTab === "info" ? styles.modalTabBtnActive : styles.modalTabBtnInactive)
                  }}
                >
                  <Icon name="user" size={15} color={activeModalTab === "info" ? "#38BDF8" : "#94A3B8"} />
                  <span>{lang === "en" ? "Profile Info" : lang === "zh" ? "基本信息" : "Perfil y Datos"}</span>
                </button>

                <button
                  onClick={() => setActiveModalTab("galeria")}
                  style={{
                    ...styles.modalTabBtn,
                    ...(activeModalTab === "galeria" ? styles.modalTabBtnActive : styles.modalTabBtnInactive)
                  }}
                >
                  <Icon name="image" size={15} color={activeModalTab === "galeria" ? "#38BDF8" : "#94A3B8"} />
                  <span>{lang === "en" ? "Gallery" : lang === "zh" ? "相册" : "Galería"} ({selectedGuiaModal.galeria_fotos?.length || 0})</span>
                </button>

                <button
                  onClick={() => setActiveModalTab("resenas")}
                  style={{
                    ...styles.modalTabBtn,
                    ...(activeModalTab === "resenas" ? styles.modalTabBtnActive : styles.modalTabBtnInactive)
                  }}
                >
                  <Icon name="star" size={15} color={activeModalTab === "resenas" ? "#38BDF8" : "#94A3B8"} />
                  <span>{lang === "en" ? "Reviews" : lang === "zh" ? "评价" : "Reseñas"} ({selectedGuiaModal.total_resenas || 0})</span>
                </button>

                <button
                  onClick={() => setActiveModalTab("mapa_destinos")}
                  style={{
                    ...styles.modalTabBtn,
                    ...(activeModalTab === "mapa_destinos" ? styles.modalTabBtnActive : styles.modalTabBtnInactive)
                  }}
                >
                  <Icon name="mapPin" size={15} color={activeModalTab === "mapa_destinos" ? "#38BDF8" : "#94A3B8"} />
                  <span>{lang === "en" ? "Map Places" : lang === "zh" ? "地图足迹" : "Lugares en Mapa"} ({selectedGuiaModal.destinos_mapa?.length || 0})</span>
                </button>
              </div>
            </div>

            {/* Contenido de la Pestaña Activa con Contenedor Interno de Padding */}
            <div style={styles.modalBodyContent}>
              {/* PESTAÑA 1: INFORMACIÓN Y DATOS */}
              {activeModalTab === "info" && (
                <div>
                  <div style={styles.modalSection}>
                    <h4 style={styles.modalSectionTitle}>
                      <Icon name="user" size={16} color="#0EA5E9" style={{ marginRight: "6px" }} />
                      {lang === "en" ? "About this Guide" : lang === "zh" ? "关于导游" : "Acerca del Guía"}
                    </h4>
                    <div style={styles.modalBioCard}>
                      <p style={styles.modalBioText}>{selectedGuiaModal.biografia}</p>
                    </div>
                  </div>

                  <div style={styles.modalTechGridWide}>
                    <div style={styles.techItem}>
                      <span style={styles.techLabel}>{lang === "en" ? "Specialty" : lang === "zh" ? "专业领域" : "Especialidad"}</span>
                      <span style={styles.techValue}>{selectedGuiaModal.especialidad}</span>
                    </div>
                    <div style={styles.techItem}>
                      <span style={styles.techLabel}>{lang === "en" ? "Languages" : lang === "zh" ? "掌握语言" : "Idiomas"}</span>
                      <span style={styles.techValue}>{selectedGuiaModal.idiomas}</span>
                    </div>
                    <div style={styles.techItem}>
                      <span style={styles.techLabel}>{lang === "en" ? "Experience" : lang === "zh" ? "带团经验" : "Experiencia"}</span>
                      <span style={styles.techValue}>{selectedGuiaModal.experiencia_anios} {lang === "en" ? "Years" : lang === "zh" ? "年" : "Años"}</span>
                    </div>
                    <div style={styles.techItem}>
                      <span style={styles.techLabel}>{lang === "en" ? "Approx Rate" : lang === "zh" ? "参考费用" : "Tarifa Aprox."}</span>
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
                      <span>{lang === "en" ? "Contact via WhatsApp Now" : lang === "zh" ? "立即通过 WhatsApp 咨询" : "Contactar por WhatsApp Ahora"}</span>
                    </a>
                  )}
                </div>
              )}

              {/* PESTAÑA 2: GALERÍA DE FOTOS DE TRAVESÍAS */}
              {activeModalTab === "galeria" && (
                <div>
                  <h4 style={styles.modalSectionTitle}>
                    <Icon name="image" size={16} color="#0EA5E9" style={{ marginRight: "6px" }} />
                    {lang === "en" ? "Expeditions & Guided Tours Photos" : lang === "zh" ? "带团与探险照片" : "Fotos de Travesías y Excursiones Guiadas"}
                  </h4>
                  {(!selectedGuiaModal.galeria_fotos || selectedGuiaModal.galeria_fotos.length === 0) ? (
                    <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
                      {lang === "en" ? "This guide has not uploaded tour photos yet." : lang === "zh" ? "该导游暂未上传带团照片。" : "Este guía aún no ha subido fotos de sus travesías."}
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
                <div>
                  <h4 style={styles.modalSectionTitle}>
                    <Icon name="star" size={16} color="#FFD700" style={{ marginRight: "6px" }} />
                    {lang === "en" ? "Tourist Reviews" : lang === "zh" ? "游客评价" : "Reseñas de Turistas"}
                  </h4>

                  {session ? (
                    <form onSubmit={handleAddReview} style={styles.reviewForm}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#E2E8F0" }}>
                          {lang === "en" ? "Rate your experience:" : lang === "zh" ? "为您的体验评分：" : "Califica tu experiencia:"}
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
                        placeholder={lang === "en" ? "Write a comment about this guide..." : lang === "zh" ? "写下您对该导游的评价或体验..." : "Escribe tu opinión o comentario sobre este guía..."}
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
                        <span>{submittingReview ? (lang === "en" ? "Submitting..." : lang === "zh" ? "正在提交..." : "Enviando...") : (lang === "en" ? "Submit Review" : lang === "zh" ? "发表评价" : "Publicar Reseña")}</span>
                      </button>
                    </form>
                  ) : (
                    <div style={styles.loginToReviewAlert}>
                      <Icon name="info" size={16} color="#38BDF8" />
                      <span>
                        {lang === "en" ? "Log in to leave a rating and review for this guide." : lang === "zh" ? "登录后可为该导游评分并发表评价。" : "Inicia sesión para dejar una calificación y opinión a este guía."}
                      </span>
                      <Link href="/login" style={{ color: "#38BDF8", fontWeight: "700", textDecoration: "underline", marginLeft: "6px" }}>
                        {lang === "en" ? "Log In" : lang === "zh" ? "登录" : "Iniciar Sesión"}
                      </Link>
                    </div>
                  )}

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
                    {(!selectedGuiaModal.resenas || selectedGuiaModal.resenas.length === 0) ? (
                      <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "16px 0" }}>
                        {lang === "en" ? "No reviews yet. Be the first to leave one!" : lang === "zh" ? "暂无评价，快来抢先评价吧！" : "Aún no hay reseñas. ¡Sé el primero en dejar una!"}
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

              {/* PESTAÑA 4: LUGARES Y DESTINOS EN EL MAPA */}
              {activeModalTab === "mapa_destinos" && (
                <div>
                  <h4 style={styles.modalSectionTitle}>
                    <Icon name="mapPin" size={16} color="#10B981" style={{ marginRight: "6px" }} />
                    {lang === "en" ? "Points of Interest & Map Destinations" : lang === "zh" ? "地图覆盖景点与路线" : "Sitios de Interés y Lugares Cubiertos en el Mapa"}
                  </h4>
                  {(!selectedGuiaModal.destinos_mapa || selectedGuiaModal.destinos_mapa.length === 0) ? (
                    <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
                      {lang === "en" ? "No map destinations configured for this guide." : lang === "zh" ? "该导游暂未配置地图景点。" : "No se han configurado destinos de mapa para este guía."}
                    </p>
                  ) : (
                    <div style={styles.destinosMapaGrid}>
                      {selectedGuiaModal.destinos_mapa.map((dest) => (
                        <div key={dest.id} style={styles.destinoMapaCard}>
                          {dest.imagen && (
                            <div style={styles.destinoMapaImageWrapper}>
                              <img src={dest.imagen} alt={dest.nombre} style={styles.destinoMapaImg} />
                              <span style={{ ...styles.destinoMapaCategoryBadge, display: "flex", alignItems: "center", gap: "4px" }}>
                                <img
                                  src={getCategorySvg(dest)}
                                  alt={dest.nombre}
                                  style={{ width: "12px", height: "12px", objectFit: "contain", filter: "brightness(0) invert(1)" }}
                                />
                                <span>{dest.categoria}</span>
                              </span>
                            </div>
                          )}
                          <div style={styles.destinoMapaContent}>
                            <div style={styles.destinoMapaHeader}>
                              <h5 style={styles.destinoMapaTitle}>{dest.nombre}</h5>
                              <span style={styles.destinoMapaDeptBadge}>{dest.departamento}</span>
                            </div>
                            <p style={styles.destinoMapaDesc}>{dest.desc}</p>
                            <div style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
                              <Link
                                href={`/departamentos?dept=${dest.deptSlug}`}
                                style={styles.destinoMapaLinkBtn}
                              >
                                <Icon name="mapPin" size={13} color="#0EA5E9" />
                                <span>{lang === "en" ? "Explore in Department Map" : lang === "zh" ? "在省份地图中查看" : "Ver en Mapa Departamental"}</span>
                                <Icon name="chevronRight" size={12} color="#0EA5E9" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
    background: "#0A192F",
    color: "#F8FAFC",
    fontFamily: "var(--font-outfit), sans-serif",
    paddingBottom: "16px",
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
    padding: "62px 24px 4px 24px",
    background: "transparent",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
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
    display: "none"
  },
  heroBadgesGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap"
  },
  badgeHeroVerified: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.35)",
    color: "#34D399",
    padding: "5px 14px",
    borderRadius: "999px",
    fontSize: "12.5px",
    fontWeight: "750"
  },
  badgeHeroExp: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(14, 165, 233, 0.15)",
    border: "1px solid rgba(14, 165, 233, 0.35)",
    color: "#38BDF8",
    padding: "5px 14px",
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
  heroTitleMain: {
    fontSize: "clamp(18px, 2.2vw, 24px)",
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: "-0.4px",
    margin: "2px 0 2px 0",
    lineHeight: "1.2",
    textAlign: "center"
  },
  whiteTextWithShadow: {
    color: "#FFFFFF",
    textShadow: "0 4px 16px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.95)",
    filter: "drop-shadow(0 4px 10px rgba(0, 0, 0, 0.95))"
  },
  flagShadowWrapper: {
    display: "inline-block",
    filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.95))"
  },
  flagSpan: {
    fontFamily: "'LC Mogi', 'LC Mogi A', 'LC Mogi B', 'LC Mogi C', var(--font-display), sans-serif",
    background: "linear-gradient(180deg, #0072CE 0%, #0072CE 33%, #FFFFFF 33%, #FFFFFF 67%, #0072CE 67%, #0072CE 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "0.02em",
    display: "inline-block",
    padding: "0 4px"
  },

  mainContainerWide: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "8px 24px 12px 24px",
    position: "relative",
    zIndex: 2
  },

  // PANEL DE FILTROS ULTRA PROFESIONAL
  filterPanelProfessional: {
    background: "rgba(15, 23, 42, 0.88)",
    border: "1px solid rgba(56, 189, 248, 0.18)",
    borderRadius: "14px",
    padding: "8px 14px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
    marginBottom: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
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
  selectFilterWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(30, 41, 59, 0.85)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "10px",
    padding: "6px 10px"
  },
  selectInputCompact: {
    background: "none",
    border: "none",
    color: "#F8FAFC",
    fontSize: "12.5px",
    fontWeight: "600",
    outline: "none",
    cursor: "pointer",
    maxWidth: "160px"
  },
  advancedToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 12px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: "750",
    cursor: "pointer",
    transition: "all 0.2s",
    position: "relative"
  },
  activeFilterDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#0EA5E9",
    boxShadow: "0 0 8px #0EA5E9"
  },
  advancedFiltersDropdownContainer: {
    paddingTop: "12px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    marginTop: "4px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  filterSectionTitleSlim: {
    fontSize: "11.5px",
    fontWeight: "750",
    color: "#CBD5E1",
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  trendingSpotsRowCompact: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    paddingTop: "8px",
    borderTop: "1px dashed rgba(255, 255, 255, 0.08)"
  },
  verifiedToggleBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "750",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  trendingSpotsRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    padding: "8px 0",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
  },
  trendingLabel: {
    fontSize: "12px",
    fontWeight: "800",
    color: "#FFD700",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap"
  },
  trendingChipsList: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap"
  },
  trendingChipBtn: {
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "11.5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s"
  },
  dualFiltersRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap"
  },
  activeFiltersRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)"
  },
  activeFiltersLabel: {
    fontSize: "12px",
    fontWeight: "750",
    color: "#94A3B8"
  },
  activeChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(14, 165, 233, 0.18)",
    border: "1px solid rgba(14, 165, 233, 0.35)",
    color: "#38BDF8",
    fontSize: "11.5px",
    fontWeight: "600",
    padding: "3px 9px",
    borderRadius: "6px"
  },
  chipRemoveBtn: {
    background: "none",
    border: "none",
    color: "#38BDF8",
    cursor: "pointer",
    padding: "0",
    display: "flex",
    alignItems: "center"
  },
  clearAllFiltersBtn: {
    background: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.35)",
    color: "#F87171",
    fontSize: "11.5px",
    fontWeight: "750",
    padding: "3px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    marginLeft: "auto"
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

  selectOption: {
    backgroundColor: "#0F172A",
    color: "#F8FAFC",
    padding: "8px 12px"
  },

  resultsHeaderGlass: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(15, 23, 42, 0.78)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    borderRadius: "12px",
    padding: "6px 14px",
    marginBottom: "10px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)"
  },
  resultsTitleLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  headerIconBox: {
    width: "28px",
    height: "28px",
    borderRadius: "7px",
    background: "rgba(14, 165, 233, 0.15)",
    border: "1px solid rgba(14, 165, 233, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },
  resultsTitleClean: {
    fontSize: "14.5px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: 0,
    letterSpacing: "-0.2px"
  },
  resultsBadgeSlim: {
    background: "rgba(14, 165, 233, 0.15)",
    color: "#38BDF8",
    fontSize: "11px",
    fontWeight: "750",
    padding: "2px 7px",
    borderRadius: "12px",
    border: "1px solid rgba(14, 165, 233, 0.3)",
    whiteSpace: "nowrap"
  },
  resetFiltersBtnSlim: {
    background: "rgba(239, 68, 68, 0.12)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#EF4444",
    padding: "4px 10px",
    borderRadius: "7px",
    fontSize: "11px",
    fontWeight: "750",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    transition: "all 0.2s ease"
  },

  // TARJETAS GLASSMORPISM ELEGANTES SIN BORDES BLANCOS EN L
  guidesGridWide: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(460px, 1fr))",
    gap: "10px"
  },
  guideCardGlass: {
    background: "rgba(15, 23, 42, 0.88)",
    border: "1px solid rgba(56, 189, 248, 0.15)",
    borderRadius: "14px",
    padding: "10px 12px",
    display: "flex",
    gap: "12px",
    backdropFilter: "blur(16px)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.22)",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  guideCardMainInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: 0
  },
  cardHeaderHorizontal: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "4px"
  },
  avatarWrapperWide: {
    position: "relative",
    width: "66px",
    height: "66px",
    flexShrink: 0
  },
  avatarImgWide: {
    width: "100%",
    height: "100%",
    borderRadius: "14px",
    objectFit: "cover",
    border: "2px solid #0EA5E9",
    boxShadow: "0 3px 14px rgba(14, 165, 233, 0.3)"
  },
  verifiedBadgeIcon: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    background: "#10B981",
    borderRadius: "50%",
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
    border: "1.5px solid #0F172A"
  },
  deptBadgeSlim: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    background: "rgba(14, 165, 233, 0.12)",
    color: "#38BDF8",
    fontSize: "10px",
    fontWeight: "750",
    padding: "1.5px 7px",
    borderRadius: "10px",
    border: "1px solid rgba(14, 165, 233, 0.25)"
  },
  licenseBadgeSlim: {
    background: "rgba(16, 185, 129, 0.12)",
    color: "#34D399",
    fontSize: "9.5px",
    fontWeight: "750",
    padding: "1.5px 5px",
    borderRadius: "10px",
    border: "1px solid rgba(16, 185, 129, 0.25)"
  },
  guideNameWide: {
    fontSize: "15.5px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: "1px 0 2px 0",
    lineHeight: "1.15"
  },
  ratingRowWide: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  ratingValueWide: {
    fontWeight: "800",
    fontSize: "12px",
    color: "#F8FAFC"
  },
  reviewsCountWide: {
    fontSize: "11px",
    color: "#94A3B8"
  },
  detailsRowSlim: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    margin: "2px 0 4px 0"
  },
  tagChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    color: "#CBD5E1",
    fontSize: "10px",
    fontWeight: "600",
    padding: "1.5px 6px",
    borderRadius: "16px",
    backdropFilter: "blur(4px)"
  },
  bioSnippetWide: {
    fontSize: "11.5px",
    color: "#94A3B8",
    lineHeight: "1.3",
    margin: "0 0 4px 0"
  },
  cardFooterWide: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: "6px",
    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
    gap: "6px"
  },
  pricePillBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    padding: "3px 7px",
    borderRadius: "6px",
    whiteSpace: "nowrap"
  },
  priceLabelSlim: {
    fontSize: "10.5px",
    color: "#94A3B8",
    fontWeight: "600"
  },
  priceValueSlim: {
    fontSize: "11.5px",
    fontWeight: "800",
    color: "#34D399",
    whiteSpace: "nowrap"
  },
  actionButtonsGroupSlim: {
    display: "flex",
    alignItems: "center",
    gap: "5px"
  },
  whatsappBtnSlim: {
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    width: "28px",
    height: "28px",
    borderRadius: "7px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    boxShadow: "0 2px 6px rgba(37, 211, 102, 0.25)",
    flexShrink: 0
  },
  detailsBtnSlim: {
    background: "linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)",
    color: "#FFFFFF",
    border: "none",
    padding: "0 10px",
    height: "28px",
    borderRadius: "7px",
    fontSize: "11.5px",
    fontWeight: "750",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 6px rgba(14, 165, 233, 0.25)",
    flexShrink: 0
  },
  btnTextSlim: {
    fontSize: "11px",
    fontWeight: "750"
  },

  // PORTADA RECTANGULAR DERECHA DE TRAVESÍA
  coverPhotoBoxRight: {
    width: "130px",
    flexShrink: 0,
    position: "relative",
    borderRadius: "10px",
    overflow: "hidden",
    cursor: "pointer",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.3)",
    transition: "transform 0.25s ease, border-color 0.25s ease"
  },
  coverPhotoImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  coverPhotoOverlayBadge: {
    position: "absolute",
    bottom: "6px",
    right: "6px",
    background: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(6px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "12px",
    padding: "2px 7px",
    display: "flex",
    alignItems: "center",
    gap: "3.5px",
    fontSize: "10.5px",
    fontWeight: "750",
    color: "#FFFFFF",
    boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
  },

  emptyStateSlim: {
    textAlign: "center",
    padding: "40px 20px",
    background: "rgba(15, 23, 42, 0.6)",
    borderRadius: "16px",
    border: "1px dashed rgba(255, 255, 255, 0.15)"
  },

  // MODAL EXTENDIDO COMPLETO A LO ANCHO Y ULTRA PROFESIONAL
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(3, 10, 26, 0.88)",
    backdropFilter: "blur(14px)",
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px"
  },
  modalCardWide: {
    width: "92%",
    maxWidth: "1020px",
    height: "min(670px, 90vh)",
    background: "linear-gradient(180deg, #0F172A 0%, #090E1A 100%)",
    border: "1.5px solid rgba(56, 189, 248, 0.35)",
    borderRadius: "24px",
    padding: "0 0 16px 0",
    position: "relative",
    boxShadow: "0 25px 65px rgba(0, 0, 0, 0.85), 0 0 35px rgba(14, 165, 233, 0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  modalHeaderCard: {
    padding: "20px 28px 16px 28px",
    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.22) 0%, rgba(2, 132, 199, 0.12) 40%, rgba(15, 23, 42, 0.98) 100%), url('/images/fondohracio.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    borderTopLeftRadius: "22px",
    borderTopRightRadius: "22px",
    borderBottom: "1px solid rgba(56, 189, 248, 0.25)",
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    flexShrink: 0
  },
  closeModalBtn: {
    position: "absolute",
    top: "16px",
    right: "16px",
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    color: "#F8FAFC",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(6px)",
    transition: "all 0.2s ease"
  },
  modalAvatarContainer: {
    position: "relative",
    flexShrink: 0
  },
  modalAvatarWide: {
    width: "82px",
    height: "82px",
    borderRadius: "18px",
    objectFit: "cover",
    border: "3.5px solid #0EA5E9",
    boxShadow: "0 0 20px rgba(14, 165, 233, 0.45)",
    background: "#0F172A"
  },
  modalAvatarBadgeVerified: {
    position: "absolute",
    bottom: "-2px",
    right: "-2px",
    background: "#10B981",
    border: "2px solid #0F172A",
    borderRadius: "50%",
    width: "22px",
    height: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
  },
  modalProfileMetaContent: {
    flex: 1,
    minWidth: "260px"
  },
  modalDeptBadge: {
    background: "rgba(14, 165, 233, 0.18)",
    border: "1px solid rgba(14, 165, 233, 0.35)",
    color: "#38BDF8",
    fontSize: "12px",
    fontWeight: "800",
    padding: "3.5px 10px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "5px"
  },
  modalLicenseBadge: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.35)",
    color: "#10B981",
    fontSize: "11.5px",
    fontWeight: "750",
    padding: "3.5px 10px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  modalExpBadge: {
    background: "rgba(255, 215, 0, 0.12)",
    border: "1px solid rgba(255, 215, 0, 0.3)",
    color: "#FBBF24",
    fontSize: "11.5px",
    fontWeight: "750",
    padding: "3.5px 10px",
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px"
  },
  modalGuideNameWide: {
    fontSize: "22px",
    fontWeight: "900",
    color: "#FFFFFF",
    margin: "2px 0",
    letterSpacing: "-0.3px",
    textShadow: "0 2px 8px rgba(0, 0, 0, 0.7)"
  },
  modalRateHighlight: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(16, 185, 129, 0.12)",
    border: "1px solid rgba(16, 185, 129, 0.3)",
    color: "#34D399",
    fontSize: "12px",
    fontWeight: "800",
    padding: "3.5px 10px",
    borderRadius: "6px"
  },
  starsBox: {
    display: "flex",
    alignItems: "center",
    gap: "4px"
  },
  modalTabsContainer: {
    padding: "16px 28px 14px 28px",
    flexShrink: 0
  },
  modalTabsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "8px",
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    padding: "6px",
    borderRadius: "16px"
  },
  modalTabBtn: {
    width: "100%",
    padding: "10px 8px",
    fontSize: "13px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    borderRadius: "12px",
    whiteSpace: "nowrap",
    boxSizing: "border-box",
    transition: "all 0.22s cubic-bezier(0.4, 0, 0.2, 1)"
  },
  modalTabBtnActive: {
    background: "linear-gradient(135deg, rgba(14, 165, 233, 0.28) 0%, rgba(2, 132, 199, 0.28) 100%)",
    border: "1.5px solid #38BDF8",
    color: "#FFFFFF",
    fontWeight: "850",
    boxShadow: "0 4px 14px rgba(14, 165, 233, 0.28)"
  },
  modalTabBtnInactive: {
    background: "rgba(30, 41, 59, 0.55)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    color: "#CBD5E1",
    fontWeight: "750",
    boxShadow: "none"
  },
  modalBodyContent: {
    flex: 1,
    padding: "0 28px 16px 28px",
    overflowY: "auto"
  },
  modalSection: {
    marginBottom: "18px"
  },
  modalSectionTitle: {
    fontSize: "15px",
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center"
  },
  modalBioCard: {
    background: "rgba(30, 41, 59, 0.45)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "14px",
    padding: "16px"
  },
  modalBioText: {
    fontSize: "13.5px",
    color: "#CBD5E1",
    lineHeight: "1.6",
    margin: 0
  },
  modalTechGridWide: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "12px",
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(56, 189, 248, 0.2)",
    borderRadius: "16px",
    padding: "16px",
    marginBottom: "18px"
  },
  techItem: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },
  techLabel: {
    fontSize: "11px",
    color: "#64748B",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  techValue: {
    fontSize: "13.5px",
    color: "#F8FAFC",
    fontWeight: "800"
  },
  modalWhatsappBanner: {
    width: "100%",
    background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
    color: "#FFFFFF",
    padding: "13px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "800",
    fontSize: "14.5px",
    textDecoration: "none",
    boxShadow: "0 6px 20px rgba(37, 211, 102, 0.35)",
    boxSizing: "border-box",
    transition: "all 0.2s ease"
  },
  fullGalleryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
    gap: "14px",
    marginTop: "12px"
  },
  fullGalleryCard: {
    width: "100%",
    height: "155px",
    borderRadius: "14px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
  },
  fullGalleryImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease"
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
  },
  guideDestinationsContainer: {
    marginTop: "4px",
    marginBottom: "6px",
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },
  guideDestinationsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10.5px",
    fontWeight: "700",
    color: "#64748B"
  },
  guideDestinationsChipsRow: {
    display: "flex",
    gap: "4px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  mapDestChip: {
    background: "rgba(14, 165, 233, 0.08)",
    border: "1px solid rgba(14, 165, 233, 0.2)",
    borderRadius: "20px",
    padding: "2px 7px",
    fontSize: "10.5px",
    fontWeight: "600",
    color: "#38BDF8",
    display: "inline-flex",
    alignItems: "center",
    gap: "3.5px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  mapDestMoreChip: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "20px",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "700",
    color: "#94A3B8",
    cursor: "pointer"
  },
  destinosMapaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "10px",
    marginTop: "8px"
  },
  destinoMapaCard: {
    background: "rgba(15, 23, 42, 0.75)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "12px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  destinoMapaImageWrapper: {
    width: "100%",
    height: "92px",
    position: "relative",
    overflow: "hidden"
  },
  destinoMapaImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  destinoMapaCategoryBadge: {
    position: "absolute",
    top: "6px",
    right: "6px",
    background: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(4px)",
    color: "#38BDF8",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 7px",
    borderRadius: "5px",
    border: "1px solid rgba(56, 189, 248, 0.3)"
  },
  destinoMapaContent: {
    padding: "9px 10px",
    display: "flex",
    flexDirection: "column",
    flex: 1
  },
  destinoMapaHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "8px",
    marginBottom: "6px"
  },
  destinoMapaTitle: {
    fontSize: "13.5px",
    fontWeight: "800",
    color: "#FFFFFF",
    margin: 0,
    lineHeight: "1.3"
  },
  destinoMapaDeptBadge: {
    background: "rgba(14, 165, 233, 0.15)",
    color: "#0EA5E9",
    fontSize: "10.5px",
    fontWeight: "750",
    padding: "2px 6px",
    borderRadius: "4px",
    whiteSpace: "nowrap"
  },
  destinoMapaDesc: {
    fontSize: "12px",
    color: "#94A3B8",
    lineHeight: "1.4",
    margin: 0,
    flex: 1
  },
  destinoMapaLinkBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11.5px",
    fontWeight: "750",
    color: "#38BDF8",
    textDecoration: "none",
    background: "rgba(14, 165, 233, 0.1)",
    border: "1px solid rgba(14, 165, 233, 0.25)",
    padding: "5px 10px",
    borderRadius: "8px",
    transition: "all 0.2s ease"
  }
};
