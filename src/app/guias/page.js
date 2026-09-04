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
    destinos_mapa: [
      {
        id: "dest-10",
        nombre: "Reserva Selva Negra",
        categoria: "Avistamiento & Café",
        icono: "🦜",
        deptSlug: "matagalpa",
        departamento: "Matagalpa",
        imagen: "/images/galeria-departamentos/matagalpa/1.1.jpg",
        desc: "Observación de aves exóticas (Quetzales) y tours por plantaciones de café orgánico en la montaña."
      },
      {
        id: "dest-11",
        nombre: "Macizo Peñas Blancas",
        categoria: "Senderismo Neotropical",
        icono: "🏔️",
        deptSlug: "matagalpa",
        departamento: "Matagalpa",
        imagen: "/images/galeria-departamentos/matagalpa/2.jpg",
        desc: "Expediciones a farallones rocosos cubiertos de bosque nuboso y cascadas monumentales."
      }
    ],
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
    destinos_mapa: [
      {
        id: "dest-12",
        nombre: "Volcán Masaya (Lago de Lava)",
        categoria: "Vulcanología",
        icono: "🌋",
        deptSlug: "masaya",
        departamento: "Masaya",
        imagen: "/images/galeria-departamentos/masaya/1.1.jpg",
        desc: "Mirador directo al cráter activo Santiago y su impresionante caldera magma incandescente."
      },
      {
        id: "dest-13",
        nombre: "Mercado de Artesanías",
        categoria: "Folclore & Compras",
        icono: "🎭",
        deptSlug: "masaya",
        departamento: "Masaya",
        imagen: "/images/galeria-departamentos/masaya/2.jpg",
        desc: "Templo del arte folclórico nicaragüense, marimbas, cuero, madera tallada y hamacas."
      },
      {
        id: "dest-14",
        nombre: "Mirador de Catarina & Apoyo",
        categoria: "Vistas Panorámicas",
        icono: "🌅",
        deptSlug: "masaya",
        departamento: "Masaya",
        imagen: "/images/galeria-departamentos/masaya/3.jpg",
        desc: "Espectacular vista panorámica hacia la laguna de cráter volcánico de Apoyo."
      }
    ],
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
  const [sortBy, setSortBy] = useState("rating");

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
                placeholder={lang === "en" ? "Search by name, city, volcano..." : "Buscar guía por nombre, volcán, ciudad..."}
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
                <option value="Todos" style={styles.selectOption}>{lang === "en" ? "All Depts" : "Todos los Deptos"}</option>
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
                <option value="Todas" style={styles.selectOption}>{lang === "en" ? "All Specialties" : "Todas las Especialidades"}</option>
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
                <option value="rating" style={styles.selectOption}>{lang === "en" ? "Best Rating" : "Mejor Calificación"}</option>
                <option value="experiencia" style={styles.selectOption}>{lang === "en" ? "Experience" : "Más Experiencia"}</option>
                <option value="precio_asc" style={styles.selectOption}>{lang === "en" ? "Price: Low to High" : "Precio: Menor a Mayor"}</option>
                <option value="precio_desc" style={styles.selectOption}>{lang === "en" ? "Price: High to Low" : "Precio: Mayor a Menor"}</option>
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
              <span>{lang === "en" ? "Filters" : "Filtros"}</span>
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
                    {lang === "en" ? "Languages (Multi-select):" : "Idiomas del Guía (Selección Múltiple):"}
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
                    {lang === "en" ? "Rate Range:" : "Tarifa Estimada:"}
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
                    <span>{lang === "en" ? "INTUR Verified Only" : "Solo Certificados INTUR"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CHIPS DE FILTROS ACTIVOS CON BOTÓN PARA ELIMINAR INDIVIDUALMENTE */}
          {hasActiveFilters && (
            <div style={styles.activeFiltersRow}>
              <span style={styles.activeFiltersLabel}>{lang === "en" ? "Active Filters:" : "Filtros Activos:"}</span>

              {selectedDept !== "Todos" && (
                <span style={styles.activeChip}>
                  <span>Dept: <b>{selectedDept}</b></span>
                  <button onClick={() => setSelectedDept("Todos")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              {selectedEspecialidad !== "Todas" && (
                <span style={styles.activeChip}>
                  <span>Especialidad: <b>{selectedEspecialidad}</b></span>
                  <button onClick={() => setSelectedEspecialidad("Todas")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}

              {selectedIdiomas.map((idioma) => (
                <span key={idioma} style={styles.activeChip}>
                  <span>Idioma: <b>{idioma}</b></span>
                  <button onClick={() => handleToggleIdioma(idioma)} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              ))}

              {selectedRangoPrecio !== "Todos" && (
                <span style={styles.activeChip}>
                  <span>Tarifa: <b>{selectedRangoPrecio}</b></span>
                  <button onClick={() => setSelectedRangoPrecio("Todos")} style={styles.chipRemoveBtn}>
                    <Icon name="x" size={12} />
                  </button>
                </span>
              )}



              {solamenteVerificados && (
                <span style={styles.activeChip}>
                  <span>Verificados INTUR</span>
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
                <span>{lang === "en" ? "Reset All" : "Limpiar Todos"}</span>
              </button>
            </div>
          )}
        </div>

        {/* CONTADOR DE RESULTADOS Y LIMPIEZA */}
        <div style={styles.resultsHeaderSlim}>
          <h2 style={styles.resultsTitleSlim}>
            <Icon name="user" size={18} color="#38BDF8" />
            <span>{lang === "en" ? "Available Guides" : "Guías Turísticos Disponibles"}</span>
            <span style={styles.resultsBadgeSlim}>{guiasFiltrados.length}</span>
          </h2>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} style={styles.resetFiltersBtnSlim}>
              <Icon name="x" size={13} />
              {lang === "en" ? "Reset All Filters" : "Limpiar Todos los Filtros"}
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

                  {/* Destinos en el Mapa cubiertos por el Guía */}
                  {guia.destinos_mapa && guia.destinos_mapa.length > 0 && (
                    <div style={styles.guideDestinationsContainer}>
                      <div style={styles.guideDestinationsHeader}>
                        <Icon name="mapPin" size={12} color="#38BDF8" />
                        <span>{lang === "en" ? "Map Destinations:" : "Lugares en el Mapa:"}</span>
                      </div>
                      <div style={styles.guideDestinationsChipsRow}>
                        {guia.destinos_mapa.slice(0, 3).map((dest) => (
                          <span
                            key={dest.id}
                            style={styles.mapDestChip}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuiaModal(guia);
                              setActiveModalTab("mapa_destinos");
                            }}
                            title={lang === "en" ? `View ${dest.nombre} in detail` : `Ver ${dest.nombre} en el mapa`}
                          >
                            <img
                              src={getCategorySvg(dest)}
                              alt={dest.nombre}
                              style={{ width: "13px", height: "13px", objectFit: "contain" }}
                            />
                            <span>{dest.nombre}</span>
                          </span>
                        ))}
                        {guia.destinos_mapa.length > 3 && (
                          <span
                            style={styles.mapDestMoreChip}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGuiaModal(guia);
                              setActiveModalTab("mapa_destinos");
                            }}
                          >
                            +{guia.destinos_mapa.length - 3} {lang === "en" ? "more" : "más"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

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

              <button
                onClick={() => setActiveModalTab("mapa_destinos")}
                style={{
                  ...styles.modalTabBtn,
                  borderBottom: activeModalTab === "mapa_destinos" ? "2.5px solid #10B981" : "none",
                  color: activeModalTab === "mapa_destinos" ? "#34D399" : "#94A3B8",
                  fontWeight: activeModalTab === "mapa_destinos" ? "800" : "600"
                }}
              >
                <Icon name="mapPin" size={14} color={activeModalTab === "mapa_destinos" ? "#10B981" : "#94A3B8"} />
                <span>{lang === "en" ? "Map Destinations" : "Lugares en el Mapa"} ({selectedGuiaModal.destinos_mapa?.length || 0})</span>
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

            {/* PESTAÑA 4: LUGARES Y DESTINOS EN EL MAPA */}
            {activeModalTab === "mapa_destinos" && (
              <div style={{ marginTop: "16px" }}>
                <h4 style={styles.modalSectionTitle}>
                  {lang === "en" ? "Points of Interest & Map Destinations" : "Sitios de Interés y Lugares Cubiertos en el Mapa"}
                </h4>
                {(!selectedGuiaModal.destinos_mapa || selectedGuiaModal.destinos_mapa.length === 0) ? (
                  <p style={{ fontSize: "13px", color: "#94A3B8", fontStyle: "italic", textAlign: "center", padding: "30px 0" }}>
                    {lang === "en" ? "No map destinations configured for this guide." : "No se han configurado destinos de mapa para este guía."}
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
                              <span>{lang === "en" ? "Explore in Department Map" : "Ver en Mapa Departamental"}</span>
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
    fontSize: "clamp(26px, 3.8vw, 42px)",
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: "-0.5px",
    margin: "12px 0 6px 0",
    lineHeight: "1.25",
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
    gap: "8px",
    textShadow: "0 3px 12px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.95)",
    filter: "drop-shadow(0 3px 8px rgba(0, 0, 0, 0.95))"
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
  },
  guideDestinationsContainer: {
    marginTop: "8px",
    marginBottom: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px"
  },
  guideDestinationsHeader: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "11.5px",
    fontWeight: "750",
    color: "#94A3B8"
  },
  guideDestinationsChipsRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    alignItems: "center"
  },
  mapDestChip: {
    background: "rgba(14, 165, 233, 0.12)",
    border: "1px solid rgba(14, 165, 233, 0.3)",
    borderRadius: "20px",
    padding: "3px 10px",
    fontSize: "11.5px",
    fontWeight: "600",
    color: "#38BDF8",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    cursor: "pointer",
    transition: "all 0.2s ease"
  },
  mapDestMoreChip: {
    background: "rgba(255, 255, 255, 0.08)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    borderRadius: "20px",
    padding: "3px 8px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#CBD5E1",
    cursor: "pointer"
  },
  destinosMapaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "14px",
    marginTop: "12px"
  },
  destinoMapaCard: {
    background: "rgba(15, 23, 42, 0.7)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: "14px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column"
  },
  destinoMapaImageWrapper: {
    width: "100%",
    height: "120px",
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
    top: "8px",
    right: "8px",
    background: "rgba(15, 23, 42, 0.85)",
    backdropFilter: "blur(4px)",
    color: "#38BDF8",
    fontSize: "10.5px",
    fontWeight: "800",
    padding: "2px 8px",
    borderRadius: "6px",
    border: "1px solid rgba(56, 189, 248, 0.3)"
  },
  destinoMapaContent: {
    padding: "12px",
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
