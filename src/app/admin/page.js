"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageToggle from '../../components/ui/LanguageToggle';
import Navbar from '../../components/ui/Navbar';

export default function AdminDashboard() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);
  const [userSession, setUserSession] = useState(null);
  const [userPerfil, setUserPerfil] = useState(null);

  // Datos
  const [reclamos, setReclamos] = useState([]);
  const [stats, setStats] = useState({
    pendientes: 0,
    aprobados: 0,
    totalPuntos: 0
  });

  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all'
  const [todosLosPuntos, setTodosLosPuntos] = useState([]);

  // Estados para modal de rechazo interactivo
  const [rejectionTarget, setRejectionTarget] = useState(null); // { puntoId, negocioId, nombreNegocio }
  const [rejectionType, setRejectionType] = useState('correction'); // 'correction' | 'release'
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Toast Banner 3D
  const [toastBanner, setToastBanner] = useState(null);
  const showToast = (message, type = 'success') => {
    setToastBanner({ message, type });
    setTimeout(() => setToastBanner(null), 4000);
  };

  // Verificar rol de admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        setUserSession(session);

        const { data: profile, error } = await supabase
          .from('perfiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error || profile?.rol !== 'admin') {
          console.warn('[Atlan Admin] Acceso denegado. Rol insuficiente.');
          router.replace('/mapa');
          return;
        }

        setUserPerfil(profile);
        setIsAdmin(true);
      } catch (err) {
        console.error('[Atlan Admin] Error de verificación de rol:', err);
        router.replace('/mapa');
      } finally {
        setLoadingAuth(false);
      }
    };

    checkAdmin();
  }, [router]);

  // Cargar reclamos y estadísticas
  const loadAdminData = async () => {
    if (!isAdmin) return;
    setLoadingData(true);

    try {
      // 1. Cargar reclamos pendientes (puntos con estado 'en_verificacion')
      let { data: puntosPendientes, error: errorPuntos } = await supabase
        .from('puntos')
        .select(`
          id,
          nombre,
          descripcion,
          categoria,
          estado,
          negocio_id,
          nombre_creador,
          negocios (
            id,
            nombre,
            tipo,
            descripcion,
            telefono,
            whatsapp,
            rango_precios,
            servicios,
            datos_verificacion,
            dueno_id
          )
        `)
        .eq('estado', 'en_verificacion');

      if (errorPuntos) {
        console.warn('[Atlan Admin] Intentando consulta alternativa para reclamos:', errorPuntos);
        const { data: rawPuntos } = await supabase
          .from('puntos')
          .select('*')
          .eq('estado', 'en_verificacion');
        puntosPendientes = rawPuntos || [];
      }

      // Enriquecer con datos de perfil si dueno_id está presente
      if (puntosPendientes && puntosPendientes.length > 0) {
        const duenoIds = puntosPendientes
          .map(p => p.negocios?.dueno_id)
          .filter(Boolean);

        if (duenoIds.length > 0) {
          const { data: perfilesData } = await supabase
            .from('perfiles')
            .select('id, nombre_completo, email')
            .in('id', duenoIds);

          if (perfilesData) {
            const profileMap = new Map(perfilesData.map(p => [p.id, p]));
            puntosPendientes.forEach(p => {
              if (p.negocios && p.negocios.dueno_id) {
                p.negocios.perfiles = profileMap.get(p.negocios.dueno_id) || null;
              }
            });
          }
        }
      }

      setReclamos(puntosPendientes || []);

      // 2. Cargar todos los puntos para la segunda pestaña
      const { data: todosPuntos } = await supabase
        .from('puntos')
        .select('*')
        .order('nombre', { ascending: true });
      setTodosLosPuntos(todosPuntos || []);

      // 3. Calcular estadísticas
      const totalPuntos = todosPuntos?.length || 0;
      const pendientes = puntosPendientes?.length || 0;
      const aprobados = todosPuntos?.filter(p => p.estado === 'aprobado').length || 0;

      setStats({
        pendientes,
        aprobados,
        totalPuntos
      });

    } catch (err) {
      console.error('[Atlan Admin] Error cargando reclamos:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  // Aprobar un negocio reclamado
  const handleAprobarReclamo = async (puntoId, negocioId) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to approve this business claim?' : '¿Está seguro de aprobar este reclamo de negocio?')) return;

    try {
      // 1. Actualizar estado del punto a 'aprobado'
      const { error: errPunto } = await supabase
        .from('puntos')
        .update({ estado: 'aprobado' })
        .eq('id', puntoId);

      if (errPunto) throw errPunto;

      // 2. Activar el negocio en negocios (activo = true) y actualizar el rol del dueño a 'dueno'
      if (negocioId) {
        const { data: negData, error: errNegocio } = await supabase
          .from('negocios')
          .update({ activo: true })
          .eq('id', negocioId)
          .select('dueno_id')
          .single();

        if (errNegocio) throw errNegocio;

        if (negData?.dueno_id) {
          await supabase
            .from('perfiles')
            .update({ rol: 'dueno' })
            .eq('id', negData.dueno_id);
        }
      }

      showToast(lang === 'en' ? 'Claim approved successfully!' : '¡Reclamo aprobado con éxito!', 'success');
      loadAdminData();
    } catch (err) {
      console.error('Error aprobando reclamo:', err);
      showToast(lang === 'en' ? 'Error approving claim.' : 'Error al aprobar el reclamo.', 'error');
    }
  };

  // Confirmar el rechazo desde el modal interactivo
  const handleConfirmarRechazo = async () => {
    if (!rejectionTarget) return;
    if (!rejectionReason.trim()) {
      showToast(lang === 'en' ? 'Please enter a reason for the rejection.' : 'Por favor, ingrese un motivo para el rechazo.', 'error');
      return;
    }

    setSubmittingRejection(true);
    const { puntoId, negocioId } = rejectionTarget;

    try {
      if (rejectionType === 'correction' || rejectionType === 'observations') {
        // 1. Cambiar estado de punto a 'rechazado' (mantiene la vinculación para que el dueño corrija)
        const { error: errPunto } = await supabase
          .from('puntos')
          .update({ estado: 'rechazado' })
          .eq('id', puntoId);

        if (errPunto) throw errPunto;

        // 2. Guardar el motivo de rechazo en negocios y marcar como inactivo
        if (negocioId) {
          const { error: errNegocio } = await supabase
            .from('negocios')
            .update({ 
              activo: false,
              motivo_rechazo: rejectionReason 
            })
            .eq('id', negocioId);

          if (errNegocio) throw errNegocio;
        }

        showToast(lang === 'en' ? 'Claim rejected with observations successfully.' : '¡Reclamo rechazado con observaciones con éxito!', 'info');
      } else {
        // 1. Devolver el punto a estado 'sin_reclamar' y desvincular el negocio_id para liberar el reclamo
        const { error: errPunto } = await supabase
          .from('puntos')
          .update({ 
            estado: 'sin_reclamar',
            negocio_id: null 
          })
          .eq('id', puntoId);

        if (errPunto) throw errPunto;

        // 2. Registrar el motivo en el negocio y marcar como inactivo
        if (negocioId) {
          const { error: errNegocio } = await supabase
            .from('negocios')
            .update({ 
              activo: false,
              motivo_rechazo: `[LIBERADO] ${rejectionReason}` 
            })
            .eq('id', negocioId);

          if (errNegocio) throw errNegocio;
        }

        showToast(lang === 'en' ? 'Point released and claim rejected.' : '¡Punto liberado y reclamo rechazado con éxito!', 'success');
      }

      setRejectionTarget(null);
      loadAdminData();
    } catch (err) {
      console.error('Error procesando rechazo:', err);
      showToast(lang === 'en' ? 'Error processing rejection.' : 'Error al procesar el rechazo.', 'error');
    } finally {
      setSubmittingRejection(false);
    }
  };

  if (loadingAuth) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#1A1A2E', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(20, 109, 158, 0.12)', borderTopColor: '#FFD700', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: '15px', color: '#4A5568', fontWeight: '600' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-container" style={{
      minHeight: '100vh',
      background: 'var(--atlan-bg-primary)',
      color: '#1A1A2E',
      fontFamily: 'var(--font-outfit), sans-serif',
      padding: '110px 24px 40px 24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Orbes de luz ambientales de fondo */}
      <div style={{
        position: "absolute", top: "-5%", right: "-5%", width: "650px", height: "650px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(255,215,0,0.40) 0%, rgba(255,215,0,0.12) 50%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "absolute", bottom: "-5%", left: "-5%", width: "550px", height: "550px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(20,109,158,0.32) 0%, rgba(20,109,158,0.08) 50%, transparent 70%)",
        filter: "blur(40px)", pointerEvents: "none", zIndex: 0
      }} />
      <div style={{
        position: "absolute", top: "35%", left: "50%", transform: "translateX(-50%)", width: "450px", height: "450px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(23,170,74,0.28) 0%, transparent 70%)",
        filter: "blur(45px)", pointerEvents: "none", zIndex: 0
      }} />
      
      {/* Navbar Global Unificada */}
      <Navbar activePage="admin" session={userSession} perfil={userPerfil} />

      {/* TOAST NOTIFICATION BANNER 3D CLAYMORFISMO */}
      {toastBanner && (
        <div style={{
          position: "fixed",
          top: "84px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 1100,
          background: toastBanner.type === "success" 
            ? "linear-gradient(135deg, #10B981 0%, #059669 100%)" 
            : toastBanner.type === "error"
            ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
            : "linear-gradient(135deg, #146D9E 0%, #0D4E72 100%)",
          color: "#FFFFFF",
          padding: "14px 28px",
          borderRadius: "20px",
          fontWeight: "800",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          boxShadow: "0 14px 35px rgba(0, 0, 0, 0.25), inset 2px 2px 4px rgba(255, 255, 255, 0.4)",
          border: "2px solid rgba(255, 255, 255, 0.8)",
          pointerEvents: "none"
        }} className="animate-fade-in-down">
          <span>{toastBanner.type === "success" ? "✅" : toastBanner.type === "error" ? "❌" : "ℹ️"}</span>
          <span>{toastBanner.message}</span>
        </div>
      )}

      {/* Grid de Estadísticas */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        <div className="clay-stat-card">
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⌛ {lang === 'en' ? 'Claims in Verification' : 'Reclamos en Verificación'}
          </p>
          <h2 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '900', color: '#E6A800' }}>
            {stats.pendientes}
          </h2>
        </div>
        <div className="clay-stat-card">
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ✅ {lang === 'en' ? 'Approved Pointers' : 'Puntos Aprobados'}
          </p>
          <h2 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '900', color: '#17AA4A' }}>
            {stats.aprobados}
          </h2>
        </div>
        <div className="clay-stat-card">
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#4A5568', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            🌍 {lang === 'en' ? 'Total Pointers' : 'Total de Puntos'}
          </p>
          <h2 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '900', color: '#3b82f6' }}>
            {stats.totalPuntos}
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '1200px', margin: '0 auto 24px', display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          className={`clay-tab ${activeTab === 'pending' ? 'clay-tab-active' : ''}`}
        >
          ⌛ {lang === 'en' ? 'Pending Claims' : 'Reclamos Pendientes'} ({reclamos.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`clay-tab ${activeTab === 'all' ? 'clay-tab-active' : ''}`}
        >
          🌍 {lang === 'en' ? 'All Points' : 'Todos los Puntos'} ({todosLosPuntos.length})
        </button>
      </div>

      {/* Contenido Principal */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loadingData ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#4A5568' }}>
            {t('common.loading')}
          </div>
        ) : activeTab === 'pending' ? (
          reclamos.length === 0 ? (
            <div className="clay-card-static" style={{ padding: '60px 20px', textAlign: 'center', color: '#4A5568' }}>
              🏖️ {lang === 'en' ? 'No pending claims. All quiet on the front!' : 'No hay reclamos pendientes. ¡Todo en orden!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {reclamos.map((item) => (
                <div key={item.id} className="clay-card" style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Fila superior */}
                  <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(255, 215, 0,0.15)', color: 'var(--atlan-gold)', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '6px' }}>
                        {item.categoria}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '850', color: '#1A1A2E' }}>
                        {item.nombre}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#4A5568' }}>
                        {lang === 'en' ? 'Point creator:' : 'Creador del punto:'} <span style={{ fontWeight: '700', color: '#4A5568' }}>{item.nombre_creador || 'Comunidad'}</span>
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAprobarReclamo(item.id, item.negocio_id)}
                        className="clay-btn-green"
                        style={{ padding: '10px 18px', fontSize: '12.5px' }}
                      >
                        ✅ {lang === 'en' ? 'Approve Claim' : 'Aprobar Reclamo'}
                      </button>
                      <button
                        onClick={() => {
                          setRejectionTarget({ puntoId: item.id, negocioId: item.negocio_id, nombreNegocio: item.nombre });
                          setRejectionType('observations');
                          setRejectionReason('');
                        }}
                        style={{
                          padding: '10px 18px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                        }}
                      >
                        ❌ {lang === 'en' ? 'Reject' : 'Rechazar'}
                      </button>
                    </div>
                  </div>

                  {/* Detalles del Negocio comercial */}
                  {item.negocios && (
                    <div className="clay-card-static" style={{
                      padding: '16px',
                      marginTop: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '800', color: 'var(--atlan-gold)' }}>
                        🏢 {lang === 'en' ? 'Claiming Business Info' : 'Información Comercial del Reclamante'}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px', color: '#4A5568' }}>
                        <div>
                          <p style={{ margin: '0 0 4px' }}><strong>{lang === 'en' ? 'Owner Name:' : 'Nombre del Dueño:'}</strong> {item.negocios.perfiles?.nombre_completo || 'N/A'}</p>
                          <p style={{ margin: '0 0 4px' }}><strong>{lang === 'en' ? 'Business Type:' : 'Tipo de Negocio:'}</strong> {item.negocios.tipo}</p>
                          <p style={{ margin: '0' }}><strong>{lang === 'en' ? 'Price Range:' : 'Rango de Precios:'}</strong> {item.negocios.rango_precios || 'N/A'}</p>
                        </div>
                        <div>
                          <p style={{ margin: '0 0 4px' }}><strong>{lang === 'en' ? 'Telephone:' : 'Teléfono:'}</strong> {item.negocios.telefono || 'N/A'}</p>
                          <p style={{ margin: '0 0 4px' }}><strong>{lang === 'en' ? 'WhatsApp:' : 'WhatsApp:'}</strong> {item.negocios.whatsapp || 'N/A'}</p>
                          <p style={{ margin: '0' }}><strong>{lang === 'en' ? 'Services:' : 'Servicios:'}</strong> {item.negocios.servicios ? Object.keys(item.negocios.servicios).filter(k => item.negocios.servicios[k]).join(', ') : 'N/A'}</p>
                        </div>
                      </div>
                      {item.negocios.descripcion && (
                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#4A5568', borderTop: '1px dashed rgba(20, 109, 158, 0.08)', paddingTop: '10px' }}>
                          <strong>{lang === 'en' ? 'Commercial Description:' : 'Descripción Comercial:'}</strong> {item.negocios.descripcion}
                        </p>
                      )}

                      {/* Documentos y Verificación de Propiedad */}
                      {item.negocios?.datos_verificacion && (
                        <div style={{
                          marginTop: '14px',
                          padding: '16px',
                          background: 'rgba(20, 109, 158, 0.04)',
                          border: '1.5px solid rgba(20, 109, 158, 0.15)',
                          borderRadius: '16px'
                        }}>
                          <h5 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '850', color: '#146D9E', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📋 Documentos de Verificación Presentados por el Solicitante
                          </h5>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', fontSize: '13px', color: '#1A1A2E' }}>
                            <p style={{ margin: 0 }}><strong>Propietario Solicitante:</strong> {item.negocios.datos_verificacion.solicitante_nombre || 'N/A'}</p>
                            <p style={{ margin: 0 }}><strong>N° Cédula / ID / RUC:</strong> {item.negocios.datos_verificacion.solicitante_cedula || 'N/A'}</p>
                            <p style={{ margin: 0 }}>
                              <strong>Teléfono Contacto:</strong> {item.negocios.datos_verificacion.solicitante_telefono || 'N/A'}{' '}
                              {item.negocios.datos_verificacion.solicitante_telefono && (
                                <a
                                  href={`https://wa.me/${item.negocios.datos_verificacion.solicitante_telefono.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: '#17AA4A', fontWeight: '800', textDecoration: 'none', marginLeft: '6px', fontSize: '12px' }}
                                >
                                  💬 WhatsApp
                                </a>
                              )}
                            </p>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                            {item.negocios.datos_verificacion.documento_cedula_url ? (
                              <a
                                href={item.negocios.datos_verificacion.documento_cedula_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="clay-btn-blue"
                                style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}
                              >
                                📄 Ver Cédula de Identidad (PDF/Imagen)
                              </a>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: '700' }}>⚠️ Sin foto de cédula</span>
                            )}

                            {item.negocios.datos_verificacion.documento_propiedad_url && (
                              <a
                                href={item.negocios.datos_verificacion.documento_propiedad_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="clay-btn-gold"
                                style={{ padding: '6px 14px', fontSize: '12px', textDecoration: 'none' }}
                              >
                                📄 Ver Comprobante de Propiedad / Licencia
                              </a>
                            )}
                          </div>

                          {item.negocios.datos_verificacion.solicitud_notas && (
                            <p style={{ margin: '10px 0 0', fontSize: '12.5px', color: '#4A5568', fontStyle: 'italic', borderTop: '1px dashed rgba(20,109,158,0.1)', paddingTop: '8px' }}>
                              📝 <strong>Notas del Solicitante:</strong> "{item.negocios.datos_verificacion.solicitud_notas}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Lista de todos los puntos */
          <div className="clay-table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(20, 109, 158, 0.12)', color: '#4A5568' }}>
                  <th style={{ padding: '12px' }}>{lang === 'en' ? 'Name' : 'Nombre'}</th>
                  <th style={{ padding: '12px' }}>{lang === 'en' ? 'Category' : 'Categoría'}</th>
                  <th style={{ padding: '12px' }}>{lang === 'en' ? 'Creator' : 'Creador'}</th>
                  <th style={{ padding: '12px' }}>{lang === 'en' ? 'Status' : 'Estado'}</th>
                  <th style={{ padding: '12px' }}>{lang === 'en' ? 'Created At' : 'Creado el'}</th>
                </tr>
              </thead>
              <tbody>
                {todosLosPuntos.map((p) => {
                  const statusColors = {
                    aprobado: '#17AA4A',
                    en_verificacion: '#E6A800',
                    sin_reclamar: '#9CA3AF',
                    rechazado: '#ef4444'
                  };
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(20, 109, 158, 0.04)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 12px', fontWeight: '700' }}>{p.nombre}</td>
                      <td style={{ padding: '14px 12px' }}>{p.categoria}</td>
                      <td style={{ padding: '14px 12px', color: '#4A5568' }}>{p.nombre_creador || 'Comunidad'}</td>
                      <td style={{ padding: '14px 12px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          color: statusColors[p.estado] || '#white',
                          background: `${statusColors[p.estado]}15`,
                          padding: '4px 8px',
                          borderRadius: '6px'
                        }}>
                          {p.estado}
                        </span>
                      </td>
                      <td style={{ padding: '14px 12px', color: '#9CA3AF' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Animación Keyframes */}
      <style jsx global>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {/* Modal interactivo de Rechazo */}
      {rejectionTarget && (
        <div className="clay-modal-overlay">
          <div className="clay-modal" style={{ maxWidth: '520px' }}>
            <h2 style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: '850',
              color: '#FFD700',
              letterSpacing: '0.04em',
              fontFamily: "'LC Mogi', var(--font-outfit), sans-serif"
            }}>
              {lang === 'en' ? 'Reject Business Claim' : 'Rechazar Reclamo de Negocio'}
            </h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#4A5568', lineHeight: 1.5 }}>
              {lang === 'en' 
                ? `Specify why you are rejecting the claim for ${rejectionTarget.nombreNegocio}:`
                : `Especifica por qué estás rechazando el reclamo para ${rejectionTarget.nombreNegocio}:`}
            </p>

            {/* Opciones de tipo de rechazo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Radio 1: Corrección */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: rejectionType === 'correction' ? 'rgba(230, 194, 0, 0.08)' : 'rgba(20, 109, 158, 0.03)',
                border: `1.5px solid ${rejectionType === 'correction' ? 'rgba(230, 194, 0, 0.4)' : 'rgba(20, 109, 158, 0.12)'}`,
                borderRadius: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="rejectionType"
                  value="correction"
                  checked={rejectionType === 'correction'}
                  onChange={() => setRejectionType('correction')}
                  style={{ marginTop: '3px', accentColor: '#E6A800' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '750', color: '#1A1A2E' }}>
                    {lang === 'en' ? 'Request Correction (Keep pending claim)' : 'Solicitar Corrección (Mantener reclamo pendiente)'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '2px', lineHeight: 1.4 }}>
                    {lang === 'en' 
                      ? 'The owner will see your observations on their dashboard so they can fix their information.'
                      : 'El solicitante verá tus observaciones en su panel para que pueda corregir sus datos.'}
                  </div>
                </div>
              </label>

              {/* Radio 2: Liberar Punto */}
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                background: rejectionType === 'release' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(20, 109, 158, 0.03)',
                border: `1.5px solid ${rejectionType === 'release' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(20, 109, 158, 0.12)'}`,
                borderRadius: '14px',
                cursor: 'pointer'
              }}>
                <input
                  type="radio"
                  name="rejectionType"
                  value="release"
                  checked={rejectionType === 'release'}
                  onChange={() => setRejectionType('release')}
                  style={{ marginTop: '3px', accentColor: '#ef4444' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '750', color: '#DC2626' }}>
                    {lang === 'en' ? 'Release point (Fraud / Delete claim)' : 'Liberar punto (Fraude / Cancelar reclamo)'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#4A5568', marginTop: '2px', lineHeight: 1.4 }}>
                    {lang === 'en' 
                      ? 'Desassociates the point immediately, returning it to unclaimed status. The business is marked inactive.'
                      : 'Desvincula el punto de inmediato, devolviéndolo a estado "sin reclamar" en el mapa. El negocio queda inactivo.'}
                  </div>
                </div>
              </label>
            </div>

            {/* Input del motivo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '800', color: '#1A1A2E' }}>
                {lang === 'en' ? 'Reason for Rejection:' : 'Motivo del Rechazo:'}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Please provide a clear profile photo and a valid phone number.' : 'Ej: Por favor, adjunte un documento de cédula legible y proporcione un número de WhatsApp de contacto válido.'}
                rows={4}
                style={{
                  width: '100%',
                  background: '#F8FAFC',
                  border: '1.5px solid rgba(20, 109, 158, 0.2)',
                  borderRadius: '14px',
                  padding: '14px',
                  color: '#1A1A2E',
                  fontSize: '13.5px',
                  fontWeight: '500',
                  outline: 'none',
                  resize: 'none',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
                }}
              />
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setRejectionTarget(null)}
                disabled={submittingRejection}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(20, 109, 158, 0.05)',
                  border: '1px solid rgba(20, 109, 158, 0.12)',
                  borderRadius: '14px',
                  color: '#1A1A2E',
                  fontSize: '13px',
                  fontWeight: '750',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(20, 109, 158, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(20, 109, 158, 0.05)'}
              >
                {lang === 'en' ? 'Cancel' : 'Cancelar'}
              </button>
              <button
                onClick={handleConfirmarRechazo}
                disabled={submittingRejection}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: rejectionType === 'release' 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                    : 'linear-gradient(135deg, #FFD700 0%, #E6C200 100%)',
                  color: rejectionType === 'release' ? 'white' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: rejectionType === 'release' 
                    ? '0 4px 12px rgba(239,68,68,0.2)' 
                    : '0 4px 12px rgba(255, 215, 0,0.2)'
                }}
              >
                {submittingRejection 
                  ? (lang === 'en' ? 'Processing...' : 'Procesando...') 
                  : (lang === 'en' ? 'Confirm Rejection' : 'Confirmar Rechazo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
