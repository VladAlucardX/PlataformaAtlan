"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageToggle from "@/components/ui/LanguageToggle";

export default function DashboardPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  // Estados del usuario y carga
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [negocio, setNegocio] = useState(null);

  // Estados de navegación interna (Pestañas)
  const [activeTab, setActiveTab] = useState("general"); // general | excentricidades | menu | reservas | resenas

  // Formularios y edición
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [rangoPrecios, setRangoPrecios] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Excentricidades (Checklist dinámico)
  const [hasMenu, setHasMenu] = useState(false);
  const [hasHours, setHasHours] = useState(false);
  const [hasLodging, setHasLodging] = useState(false);
  const [hasTransport, setHasTransport] = useState(false);

  // Menú (menu_items)
  const [menuItems, setMenuItems] = useState([]);
  const [newPlatoNombre, setNewPlatoNombre] = useState("");
  const [newPlatoPrecio, setNewPlatoPrecio] = useState("");
  const [newPlatoDesc, setNewPlatoDesc] = useState("");
  const [isAddingPlato, setIsAddingPlato] = useState(false);

  // Reservas
  const [reservas, setReservas] = useState([]);

  // Reseñas
  const [resenas, setResenas] = useState([]);

  // Reclamar punto
  const [puntosDisponibles, setPuntosDisponibles] = useState([]);
  const [isClaiming, setIsClaiming] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          router.push("/login");
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        // Perfil
        const { data: perfilData } = await supabase
          .from("perfiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        setPerfil(perfilData);

        if (perfilData?.rol !== "dueno" && perfilData?.rol !== "admin") {
          // Si no es dueño ni admin, redirigir al mapa
          router.push("/mapa");
          return;
        }

        // Negocio
        await loadNegocioData(currentUser.id);
      } catch (err) {
        console.error("Dashboard init error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const loadNegocioData = async (userId) => {
    const { data: negocioData } = await supabase
      .from("negocios")
      .select("*")
      .eq("dueno_id", userId)
      .maybeSingle();

    if (negocioData) {
      setNegocio(negocioData);
      setNombre(negocioData.nombre || "");
      setDescripcion(negocioData.descripcion || "");
      setTelefono(negocioData.telefono || "");
      setWhatsapp(negocioData.whatsapp || "");
      setRangoPrecios(negocioData.rango_precios || "");

      // Servicios (excentricidades)
      const serv = negocioData.servicios || {};
      setHasMenu(!!serv.has_menu);
      setHasHours(!!serv.has_hours);
      setHasLodging(!!serv.has_lodging);
      setHasTransport(!!serv.has_transport);

      // Cargar detalles asociados
      if (serv.has_menu) loadMenuItems(negocioData.id);
      if (serv.has_lodging) loadReservas(negocioData.id);
      loadResenas(negocioData.id);
    } else {
      // Si no tiene negocio, cargar puntos libres para reclamar
      const { data: puntosLibres } = await supabase
        .from("puntos")
        .select("*")
        .eq("estado", "sin_reclamar")
        .is("negocio_id", null);
      setPuntosDisponibles(puntosLibres || []);
    }
  };

  const loadMenuItems = async (negocioId) => {
    const { data } = await supabase
      .from("menu_items")
      .select("*")
      .eq("negocio_id", negocioId);
    setMenuItems(data || []);
  };

  const loadReservas = async (negocioId) => {
    const { data } = await supabase
      .from("reservas")
      .select(`
        *,
        perfiles:cliente_id (nombre_completo)
      `)
      .eq("negocio_id", negocioId)
      .order("fecha_hora", { ascending: false });
    setReservas(data || []);
  };

  const loadResenas = async (negocioId) => {
    const { data } = await supabase
      .from("resenas")
      .select("*")
      .eq("negocio_id", negocioId)
      .order("created_at", { ascending: false });
    setResenas(data || []);
  };

  // Reclamar un punto geográfico
  const handleReclamarPunto = async (puntoId) => {
    setIsClaiming(true);
    try {
      const puntoSeleccionado = puntosDisponibles.find(p => p.id === puntoId);
      if (!puntoSeleccionado) return;

      // 1. Crear el negocio asociado
      const { data: nuevoNegocio, error: negocioError } = await supabase
        .from("negocios")
        .insert([{
          dueno_id: user.id,
          nombre: puntoSeleccionado.nombre,
          descripcion: puntoSeleccionado.descripcion,
          tipo: puntoSeleccionado.categoria || "otro",
          servicios: { has_menu: false, has_hours: false, has_lodging: false, has_transport: false },
          activo: false // Requiere verificación presencial
        }])
        .select()
        .single();

      if (negocioError) throw negocioError;

      // 2. Asociar el punto al negocio y actualizar estado a 'pendiente'
      const { error: puntoError } = await supabase
        .from("puntos")
        .update({
          negocio_id: nuevoNegocio.id,
          estado: "pendiente" // en espera de verificación presencial
        })
        .eq("id", puntoId);

      if (puntoError) throw puntoError;

      alert(lang === "en" 
        ? "Claim requested successfully! Personal verification required." 
        : "¡Reclamo solicitado con éxito! Se requiere verificación presencial.");
      
      await loadNegocioData(user.id);
    } catch (err) {
      console.error("Error al reclamar:", err);
      alert("Error al procesar el reclamo.");
    } finally {
      setIsClaiming(false);
    }
  };

  // Crear un nuevo negocio de cero
  const handleCrearNuevoNegocio = async (e) => {
    e.preventDefault();
    setIsClaiming(true);
    try {
      // 1. Crear negocio
      const { data: nuevoNegocio, error: negocioError } = await supabase
        .from("negocios")
        .insert([{
          dueno_id: user.id,
          nombre: "Mi Nuevo Negocio",
          tipo: "otro",
          servicios: { has_menu: false, has_hours: false, has_lodging: false, has_transport: false },
          activo: false
        }])
        .select()
        .single();

      if (negocioError) throw negocioError;

      // 2. Crear punto geográfico por defecto (Managua)
      const { error: puntoError } = await supabase
        .from("puntos")
        .insert([{
          negocio_id: nuevoNegocio.id,
          nombre: "Mi Nuevo Negocio",
          categoria: "otro",
          ubicacion: "POINT(-86.2504 12.1364)",
          estado: "pendiente",
          nombre_creador: perfil?.nombre_completo || "Propietario"
        }]);

      if (puntoError) throw puntoError;

      alert(lang === "en" ? "Business created! Configure and await verification." : "¡Negocio creado! Configure y espere verificación.");
      await loadNegocioData(user.id);
    } catch (err) {
      console.error("Error al crear negocio:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  // Guardar datos generales del negocio
  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const { error } = await supabase
        .from("negocios")
        .update({
          nombre,
          descripcion,
          telefono,
          whatsapp,
          rango_precios: rangoPrecios
        })
        .eq("id", negocio.id);

      if (error) throw error;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando negocio:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Guardar excentricidades (checklist)
  const handleSaveExcentricidades = async () => {
    setIsSaving(true);
    try {
      const servicios = {
        has_menu: hasMenu,
        has_hours: hasHours,
        has_lodging: hasLodging,
        has_transport: hasTransport
      };

      const { error } = await supabase
        .from("negocios")
        .update({ servicios })
        .eq("id", negocio.id);

      if (error) throw error;

      // Actualizar estado local del negocio
      setNegocio({ ...negocio, servicios });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error guardando excentricidades:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Menú: Agregar plato
  const handleAddPlato = async (e) => {
    e.preventDefault();
    if (!newPlatoNombre || !newPlatoPrecio) return;
    setIsAddingPlato(true);

    try {
      const { error } = await supabase
        .from("menu_items")
        .insert([{
          negocio_id: negocio.id,
          nombre: newPlatoNombre,
          precio: parseFloat(newPlatoPrecio),
          descripcion: newPlatoDesc,
          disponible: true
        }]);

      if (error) throw error;

      setNewPlatoNombre("");
      setNewPlatoPrecio("");
      setNewPlatoDesc("");
      loadMenuItems(negocio.id);
    } catch (err) {
      console.error("Error agregando plato:", err);
    } finally {
      setIsAddingPlato(false);
    }
  };

  // Menú: Eliminar plato
  const handleDeletePlato = async (id) => {
    try {
      await supabase.from("menu_items").delete().eq("id", id);
      loadMenuItems(negocio.id);
    } catch (err) {
      console.error("Error eliminando plato:", err);
    }
  };

  // Reservas: Cambiar estado
  const handleUpdateReservaStatus = async (reservaId, newStatus) => {
    try {
      await supabase
        .from("reservas")
        .update({ estado_reserva: newStatus })
        .eq("id", reservaId);
      loadReservas(negocio.id);
    } catch (err) {
      console.error("Error actualizando reserva:", err);
    }
  };

  // Desconexión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="skeleton-loader" style={{ width: "80px", height: "80px", borderRadius: "50%" }}></div>
        <p style={{ color: "#a1a1aa", marginTop: "16px", fontWeight: "700" }}>{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div style={styles.container} className="dashboard-container">
      <header style={styles.header} className="dashboard-header">
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <Link href="/" style={styles.logo}>
            <span style={styles.logoIcon}>🗺️</span>
            <span style={styles.logoText}>Atlan</span>
          </Link>
          <span style={styles.badgeRol}>
            {lang === "en" ? "OWNER PANEL" : "PANEL PROPIETARIO"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <LanguageToggle variant="pill" />
          <button onClick={handleLogout} style={styles.logoutBtn}>
            🚪 {lang === "en" ? "Logout" : "Cerrar Sesión"}
          </button>
        </div>
      </header>

      {/* CASO A: EL DUEÑO NO TIENE UN NEGOCIO ASOCIADO */}
      {!negocio ? (
        <div style={styles.noNegocioContainer} className="glass-card animate-fade-in-up">
          <h2 style={{ fontSize: "24px", color: "var(--atlan-gold)", fontWeight: "800", marginBottom: "8px" }}>
            {lang === "en" ? "Claim or Register Your Business" : "Reclama o Registra tu Negocio"}
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
            {lang === "en" 
              ? "You can claim a point that a tourist previously added to the map, or register a new one." 
              : "Puedes reclamar un punto que un turista haya agregado previamente al mapa, o registrar uno nuevo."}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
            {/* Opción 1: Reclamar */}
            <div style={styles.claimSection}>
              <h3 style={{ fontSize: "16px", fontWeight: "800", color: "white", marginBottom: "12px" }}>
                🏷️ {lang === "en" ? "Unclaimed Points Nearby" : "Puntos sin Reclamar Disponibles"}
              </h3>
              {puntosDisponibles.length === 0 ? (
                <p style={{ fontSize: "13px", color: "#64748b" }}>
                  {lang === "en" ? "No unclaimed points found." : "No se hallaron puntos sin reclamar en este momento."}
                </p>
              ) : (
                <div style={styles.pointsList}>
                  {puntosDisponibles.map((p) => (
                    <div key={p.id} style={styles.pointRow}>
                      <div>
                        <div style={{ fontWeight: "750", fontSize: "13.5px" }}>{p.nombre}</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{p.categoria}</div>
                      </div>
                      <button
                        onClick={() => handleReclamarPunto(p.id)}
                        disabled={isClaiming}
                        style={styles.claimBtn}
                      >
                        {lang === "en" ? "Claim" : "Reclamar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Opción 2: Registrar Nuevo */}
            <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: "20px" }}>
              <button onClick={handleCrearNuevoNegocio} disabled={isClaiming} style={styles.createBtn}>
                ✨ {lang === "en" ? "Register New Business from Scratch" : "Registrar Nuevo Negocio de Cero"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CASO B: EL DUEÑO YA TIENE UN NEGOCIO ASOCIADO */
        <div style={styles.dashboardGrid} className="dashboard-grid">
          {/* Sidebar de navegación */}
          <aside style={styles.sidebar} className="dashboard-sidebar glass-card">
            <div style={{ padding: "10px 0 20px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: "15px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "850", color: "white" }}>{negocio.nombre}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                <span style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: negocio.activo ? "#10b981" : "#f59e0b",
                  display: "inline-block"
                }}></span>
                <span style={{ fontSize: "11px", fontWeight: "750", color: negocio.activo ? "#10b981" : "#f59e0b" }}>
                  {negocio.activo 
                    ? (lang === "en" ? "VERIFIED" : "VERIFICADO") 
                    : (lang === "en" ? "PENDING VERIFICATION" : "PENDIENTE DE VERIFICACIÓN")}
                </span>
              </div>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => setActiveTab("general")}
                className={`dashboard-tab-btn ${activeTab === "general" ? "active" : ""}`}
                style={{ ...styles.tabBtn, ...(activeTab === "general" ? styles.tabBtnActive : {}) }}
              >
                ℹ️ {lang === "en" ? "General Info" : "Datos Generales"}
              </button>
              <button
                onClick={() => setActiveTab("excentricidades")}
                className={`dashboard-tab-btn ${activeTab === "excentricidades" ? "active" : ""}`}
                style={{ ...styles.tabBtn, ...(activeTab === "excentricidades" ? styles.tabBtnActive : {}) }}
              >
                ⚙️ {lang === "en" ? "Settings Checklist" : "Checklist de Servicios"}
              </button>

              {hasMenu && (
                <button
                  onClick={() => setActiveTab("menu")}
                  className={`dashboard-tab-btn ${activeTab === "menu" ? "active" : ""}`}
                  style={{ ...styles.tabBtn, ...(activeTab === "menu" ? styles.tabBtnActive : {}) }}
                >
                  🍲 {lang === "en" ? "Menu Items" : "Menú Gastronómico"}
                </button>
              )}

              {hasLodging && (
                <button
                  onClick={() => setActiveTab("reservas")}
                  className={`dashboard-tab-btn ${activeTab === "reservas" ? "active" : ""}`}
                  style={{ ...styles.tabBtn, ...(activeTab === "reservas" ? styles.tabBtnActive : {}) }}
                >
                  📅 {lang === "en" ? "Reservations" : "Reservas"}
                </button>
              )}

              <button
                onClick={() => setActiveTab("resenas")}
                className={`dashboard-tab-btn ${activeTab === "resenas" ? "active" : ""}`}
                style={{ ...styles.tabBtn, ...(activeTab === "resenas" ? styles.tabBtnActive : {}) }}
              >
                ⭐ {lang === "en" ? "Reviews" : "Reseñas"}
              </button>
            </nav>
          </aside>

          {/* Área de Contenido Principal */}
          <main style={styles.mainContent} className="dashboard-main glass-card animate-fade-in">
            {saveSuccess && (
              <div style={styles.successBanner}>
                ✅ {lang === "en" ? "Settings saved successfully!" : "¡Configuraciones guardadas exitosamente!"}
              </div>
            )}

            {/* PESTAÑA 1: DATOS GENERALES */}
            {activeTab === "general" && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Business Profile" : "Perfil del Negocio"}</h3>
                <form onSubmit={handleSaveGeneral} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Business Name" : "Nombre del Negocio"}</label>
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Description" : "Descripción"}</label>
                    <textarea
                      rows="4"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      style={{ ...styles.input, resize: "none" }}
                    />
                  </div>

                  <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>{lang === "en" ? "Phone" : "Teléfono"}</label>
                      <input
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>WhatsApp</label>
                      <input
                        type="text"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>{lang === "en" ? "Price Range (e.g., $, $$, $$$)" : "Rango de Precios (ej. $, $$, $$$)"}</label>
                    <input
                      type="text"
                      value={rangoPrecios}
                      onChange={(e) => setRangoPrecios(e.target.value)}
                      placeholder="$, $$, $$$"
                      style={styles.input}
                    />
                  </div>

                  <button type="submit" disabled={isSaving} style={styles.saveBtn}>
                    {isSaving ? "..." : (lang === "en" ? "Save Profile" : "Guardar Perfil")}
                  </button>
                </form>
              </div>
            )}

            {/* PESTAÑA 2: CHECKLIST DE EXCENTRICIDADES */}
            {activeTab === "excentricidades" && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Services & Features Checklist" : "Checklist de Servicios y Excentricidades"}</h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
                  {lang === "en" 
                    ? "Select the options that apply to your business. This will enable custom sections in your dashboard." 
                    : "Selecciona las opciones que aplican a tu negocio. Esto habilitará secciones personalizadas en tu panel."}
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  {/* Menú Gastronómico */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasMenu}
                      onChange={(e) => setHasMenu(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "white" }}>🍲 {lang === "en" ? "Gastronomic Menu" : "Menú Gastronómico"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{lang === "en" ? "Display list of dishes and prices to tourists" : "Muestra lista de platillos y precios a los turistas"}</div>
                    </div>
                  </label>

                  {/* Horarios */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasHours}
                      onChange={(e) => setHasHours(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "white" }}>⏰ {lang === "en" ? "Opening Hours" : "Horarios de Atención"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{lang === "en" ? "Specify opening and closing schedules" : "Especifica horarios de apertura y cierre"}</div>
                    </div>
                  </label>

                  {/* Hospedaje */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasLodging}
                      onChange={(e) => setHasLodging(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "white" }}>🏨 {lang === "en" ? "Lodging Services" : "Servicios de Hospedaje"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{lang === "en" ? "Accept room/bed reservations directly" : "Acepta reservas de habitaciones directamente"}</div>
                    </div>
                  </label>

                  {/* Transporte */}
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={hasTransport}
                      onChange={(e) => setHasTransport(e.target.checked)}
                      style={styles.checkbox}
                    />
                    <div>
                      <div style={{ fontWeight: "750", color: "white" }}>🚌 {lang === "en" ? "Transport / Tours" : "Transporte o Tours"}</div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{lang === "en" ? "Provide tourist routing and itineraries" : "Provee itinerarios y rutas de viaje"}</div>
                    </div>
                  </label>
                </div>

                <button onClick={handleSaveExcentricidades} disabled={isSaving} style={styles.saveBtn}>
                  {isSaving ? "..." : (lang === "en" ? "Save Services" : "Guardar Servicios")}
                </button>
              </div>
            )}

            {/* PESTAÑA 3: MENÚ GASTRONÓMICO */}
            {activeTab === "menu" && hasMenu && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Manage Gastronomic Menu" : "Gestionar Menú Gastronómico"}</h3>
                
                {/* Formulario Agregar */}
                <form onSubmit={handleAddPlato} style={{ ...styles.form, background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)", marginBottom: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                    <input
                      type="text"
                      required
                      placeholder={lang === "en" ? "Dish Name" : "Nombre del Plato"}
                      value={newPlatoNombre}
                      onChange={(e) => setNewPlatoNombre(e.target.value)}
                      style={styles.input}
                    />
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder={lang === "en" ? "Price ($)" : "Precio ($)"}
                      value={newPlatoPrecio}
                      onChange={(e) => setNewPlatoPrecio(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={lang === "en" ? "Description (optional)" : "Descripción corta (opcional)"}
                    value={newPlatoDesc}
                    onChange={(e) => setNewPlatoDesc(e.target.value)}
                    style={styles.input}
                  />
                  <button type="submit" disabled={isAddingPlato} style={{ ...styles.saveBtn, margin: 0, padding: "10px" }}>
                    {isAddingPlato ? "..." : `➕ ${lang === "en" ? "Add Item" : "Agregar Platillo"}`}
                  </button>
                </form>

                {/* Lista Platos */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {menuItems.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "13px" }}>{lang === "en" ? "No dishes added yet." : "Aún no has agregado platillos a tu menú."}</p>
                  ) : (
                    menuItems.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                        <div>
                          <div style={{ fontWeight: "750", fontSize: "14px" }}>{item.nombre}</div>
                          {item.descripcion && <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{item.descripcion}</div>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ fontWeight: "800", color: "var(--atlan-gold)" }}>${item.precio}</span>
                          <button onClick={() => handleDeletePlato(item.id)} style={styles.deleteBtn}>🗑️</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 4: RESERVAS */}
            {activeTab === "reservas" && hasLodging && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Booking & Reservations Log" : "Bitácora de Reservas"}</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {reservas.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "13px" }}>{lang === "en" ? "No bookings received." : "No se han recibido reservas."}</p>
                  ) : (
                    reservas.map((res) => (
                      <div key={res.id} style={{ padding: "16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", display: "flex", justifycontent: "space-between", alignitems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "800", fontSize: "14px", color: "white" }}>
                            👤 {res.perfiles?.nombre_completo || (lang === "en" ? "Anonymous Traveler" : "Turista Anónimo")}
                          </div>
                          <div style={{ fontSize: "12.5px", color: "#94a3b8", marginTop: "4px" }}>
                            📅 {new Date(res.fecha_hora).toLocaleString()}
                          </div>
                          <div style={{ fontSize: "12px", color: "var(--atlan-gold)", marginTop: "4px" }}>
                            👥 {lang === "en" ? "Guests:" : "Personas:"} {res.num_personas || 1}
                          </div>
                          {res.notas && (
                            <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px", fontStyle: "italic" }}>
                              💬 "{res.notas}"
                            </div>
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignitems: "flex-end", gap: "8px", marginLeft: "16px" }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: "800",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: res.estado_reserva === "aprobada" ? "rgba(16,185,129,0.15)" : res.estado_reserva === "pendiente" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)",
                            color: res.estado_reserva === "aprobada" ? "#10b981" : res.estado_reserva === "pendiente" ? "#f59e0b" : "#ef4444"
                          }}>
                            {(res.estado_reserva || "pendiente").toUpperCase()}
                          </span>
                          
                          {res.estado_reserva === "pendiente" && (
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button onClick={() => handleUpdateReservaStatus(res.id, "aprobada")} style={styles.actionApproveBtn}>✓</button>
                              <button onClick={() => handleUpdateReservaStatus(res.id, "cancelada")} style={styles.actionCancelBtn}>✗</button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 5: RESEÑAS */}
            {activeTab === "resenas" && (
              <div style={styles.tabContent}>
                <h3 style={styles.tabTitle}>{lang === "en" ? "Customer Feedback" : "Opiniones de Clientes"}</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {resenas.length === 0 ? (
                    <p style={{ color: "#64748b", fontSize: "13px" }}>{lang === "en" ? "No reviews left yet." : "Aún no hay reseñas registradas."}</p>
                  ) : (
                    resenas.map((rev) => (
                      <div key={rev.id} style={{ padding: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontWeight: "750", fontSize: "13px" }}>{rev.nombre_usuario}</span>
                          <span style={{ color: "var(--atlan-gold)", fontWeight: "700" }}>⭐ {rev.estrellas}</span>
                        </div>
                        <p style={{ fontSize: "12.5px", color: "#cbd5e1", margin: 0 }}>"{rev.comentario}"</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

// ── ESTILOS PREMIUM DASHBOARD ───────────────────────────────────────────────
const styles = {
  container: {
    minHeight: "100vh",
    width: "100%",
    background: "#070b14",
    color: "#fff",
    fontFamily: "var(--font-outfit), sans-serif",
    padding: "90px 24px 24px 24px",
    position: "relative",
  },
  loadingContainer: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#070b14",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    padding: "20px 32px",
    background: "rgba(7, 11, 20, 0.75)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    textDecoration: "none",
  },
  logoIcon: {
    fontSize: "22px",
  },
  logoText: {
    fontSize: "20px",
    fontWeight: "800",
    color: "#fff",
  },
  badgeRol: {
    background: "rgba(212,175,55,0.1)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "#D4AF37",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.05em",
  },
  logoutBtn: {
    background: "transparent",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    color: "#ef4444",
    padding: "8px 16px",
    borderRadius: "10px",
    fontSize: "12.5px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  noNegocioContainer: {
    maxWidth: "600px",
    margin: "40px auto",
    padding: "32px",
    borderRadius: "20px",
    background: "rgba(16, 22, 40, 0.5)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  claimSection: {
    background: "rgba(255,255,255,0.02)",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  pointsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "220px",
    overflowY: "auto",
    marginTop: "8px",
  },
  pointRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
  },
  claimBtn: {
    background: "#D4AF37",
    color: "#0a0f1c",
    border: "none",
    padding: "6px 12px",
    borderRadius: "8px",
    fontWeight: "750",
    fontSize: "12px",
    cursor: "pointer",
  },
  createBtn: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "800",
    fontSize: "13.5px",
    cursor: "pointer",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: "24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sidebar: {
    padding: "20px",
    borderRadius: "20px",
    background: "rgba(16, 22, 40, 0.4)",
    border: "1px solid rgba(255,255,255,0.06)",
    height: "fit-content",
  },
  tabBtn: {
    width: "100%",
    padding: "12px 14px",
    textAlign: "left",
    background: "transparent",
    border: "none",
    borderRadius: "10px",
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    background: "rgba(212, 175, 55, 0.1)",
    color: "#D4AF37",
    borderLeft: "3px solid #D4AF37",
  },
  mainContent: {
    padding: "32px",
    borderRadius: "20px",
    background: "rgba(16, 22, 40, 0.45)",
    border: "1px solid rgba(255,255,255,0.06)",
    minHeight: "450px",
  },
  tabContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  tabTitle: {
    fontSize: "20px",
    fontWeight: "800",
    color: "var(--atlan-gold)",
    marginBottom: "16px",
    letterSpacing: "-0.01em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12.5px",
    fontWeight: "750",
    color: "#cbd5e1",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "10px",
    color: "#fff",
    fontSize: "13.5px",
    outline: "none",
  },
  saveBtn: {
    alignSelf: "flex-start",
    padding: "12px 24px",
    background: "linear-gradient(135deg, #D4AF37 0%, #b89324 100%)",
    color: "#0a0f1c",
    border: "none",
    borderRadius: "10px",
    fontWeight: "800",
    fontSize: "13.5px",
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(212, 175, 55, 0.2)",
    marginTop: "8px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "14px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  checkbox: {
    marginTop: "4px",
    width: "16px",
    height: "16px",
    cursor: "pointer",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
  },
  successBanner: {
    background: "rgba(16, 185, 129, 0.15)",
    border: "1px solid rgba(16, 185, 129, 0.25)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#34d399",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "16px",
  },
  actionApproveBtn: {
    background: "rgba(16, 185, 129, 0.2)",
    border: "none",
    color: "#10b981",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
  },
  actionCancelBtn: {
    background: "rgba(239, 68, 68, 0.2)",
    border: "none",
    color: "#ef4444",
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
  },
};
