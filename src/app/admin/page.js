"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageToggle from '../../components/ui/LanguageToggle';

export default function AdminDashboard() {
  const { t, lang } = useTranslation();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(true);

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
  const [rejectionType, setRejectionType] = useState('observations'); // 'observations' | 'release'
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingRejection, setSubmittingRejection] = useState(false);

  // Verificar rol de admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }

        const { data: profile, error } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', session.user.id)
          .single();

        if (error || profile?.rol !== 'admin') {
          console.warn('[Atlan Admin] Acceso denegado. Rol insuficiente.');
          router.replace('/mapa');
          return;
        }

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
      // 1. Obtener puntos con estado = 'en_verificacion' (Reclamos pendientes)
      const { data: puntosPendientes, error: errorPuntos } = await supabase
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
            perfiles (
              nombre_completo
            )
          )
        `)
        .eq('estado', 'en_verificacion');

      if (errorPuntos) throw errorPuntos;
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

      // 2. Activar el negocio en negocios (activo = true)
      if (negocioId) {
        const { error: errNegocio } = await supabase
          .from('negocios')
          .update({ activo: true })
          .eq('id', negocioId);

        if (errNegocio) throw errNegocio;
      }

      alert(lang === 'en' ? 'Claim approved successfully!' : '¡Reclamo aprobado con éxito!');
      loadAdminData();
    } catch (err) {
      console.error('Error aprobando reclamo:', err);
      alert('Error al aprobar reclamo.');
    }
  };

  // Confirmar el rechazo desde el modal interactivo
  const handleConfirmarRechazo = async () => {
    if (!rejectionTarget) return;
    if (!rejectionReason.trim()) {
      alert(lang === 'en' ? 'Please enter a reason for the rejection.' : 'Por favor, ingrese un motivo para el rechazo.');
      return;
    }

    setSubmittingRejection(true);
    const { puntoId, negocioId } = rejectionTarget;

    try {
      if (rejectionType === 'observations') {
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

        alert(lang === 'en' ? 'Claim rejected with observations successfully.' : 'Reclamo rechazado con observaciones con éxito.');
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

        alert(lang === 'en' ? 'Point released and claim rejected.' : 'Punto liberado y reclamo rechazado.');
      }

      setRejectionTarget(null);
      loadAdminData();
    } catch (err) {
      console.error('Error procesando rechazo:', err);
      alert(lang === 'en' ? 'Error processing rejection.' : 'Error al procesar el rechazo.');
    } finally {
      setSubmittingRejection(false);
    }
  };

  if (loadingAuth) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1c', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontFamily: 'var(--font-outfit), sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#D4AF37', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
          <p style={{ fontSize: '15px', color: '#94a3b8', fontWeight: '600' }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-container" style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, rgba(10, 15, 28, 1) 0%, rgba(15, 23, 42, 1) 90%)',
      color: 'white',
      fontFamily: 'var(--font-outfit), sans-serif',
      padding: '40px 24px',
      position: 'relative'
    }}>
      {/* Cabecera */}
      <div className="admin-header" style={{ maxWidth: '1200px', margin: '0 auto 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '850', background: 'linear-gradient(135deg, #D4AF37 0%, #FFF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            ATLAN ADMIN PANEL
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#94a3b8' }}>
            {lang === 'en' ? 'Verify business claims and community contributions' : 'Verifica los reclamos de negocios y contribuciones de la comunidad'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => router.push('/mapa')}
            style={{
              padding: '8px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            ← {t('nav.map')}
          </button>
          <LanguageToggle variant="pill" />
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '20px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ⌛ {lang === 'en' ? 'Claims in Verification' : 'Reclamos en Verificación'}
          </p>
          <h2 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '900', color: '#f59e0b' }}>
            {stats.pendientes}
          </h2>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '20px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ✅ {lang === 'en' ? 'Approved Pointers' : 'Puntos Aprobados'}
          </p>
          <h2 style={{ margin: '8px 0 0', fontSize: '36px', fontWeight: '900', color: '#10b981' }}>
            {stats.aprobados}
          </h2>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.06)', padding: '24px', borderRadius: '20px' }}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '750', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
          style={{
            padding: '10px 20px',
            background: activeTab === 'pending' ? 'linear-gradient(135deg, #D4AF37 0%, #b89324 100%)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'pending' ? '#0a0f1c' : 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ⌛ {lang === 'en' ? 'Pending Claims' : 'Reclamos Pendientes'} ({reclamos.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'all' ? 'linear-gradient(135deg, #D4AF37 0%, #b89324 100%)' : 'rgba(255,255,255,0.03)',
            color: activeTab === 'all' ? '#0a0f1c' : 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🌍 {lang === 'en' ? 'All Points' : 'Todos los Puntos'} ({todosLosPuntos.length})
        </button>
      </div>

      {/* Contenido Principal */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {loadingData ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8' }}>
            {t('common.loading')}
          </div>
        ) : activeTab === 'pending' ? (
          reclamos.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '60px 20px', borderRadius: '24px', textAlign: 'center', color: '#94a3b8' }}>
              🏖️ {lang === 'en' ? 'No pending claims. All quiet on the front!' : 'No hay reclamos pendientes. ¡Todo en orden!'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '20px' }}>
              {reclamos.map((item) => (
                <div key={item.id} style={{
                  background: 'rgba(20, 27, 45, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  {/* Fila superior */}
                  <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(212,175,55,0.15)', color: 'var(--atlan-gold)', padding: '4px 8px', borderRadius: '6px', textTransform: 'uppercase', display: 'inline-block', marginBottom: '6px' }}>
                        {item.categoria}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '850', color: 'white' }}>
                        {item.nombre}
                      </h3>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                        {lang === 'en' ? 'Point creator:' : 'Creador del punto:'} <span style={{ fontWeight: '700', color: '#cbd5e1' }}>{item.nombre_creador || 'Comunidad'}</span>
                      </p>
                    </div>

                    {/* Botones de Acción */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAprobarReclamo(item.id, item.negocio_id)}
                        style={{
                          padding: '10px 18px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: '800',
                          fontSize: '12.5px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(16,185,129,0.2)'
                        }}
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
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      padding: '16px',
                      marginTop: '8px'
                    }}>
                      <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: '800', color: 'var(--atlan-gold)' }}>
                        🏢 {lang === 'en' ? 'Claiming Business Info' : 'Información Comercial del Reclamante'}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '13px', color: '#cbd5e1' }}>
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
                        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#94a3b8', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                          <strong>{lang === 'en' ? 'Commercial Description:' : 'Descripción Comercial:'}</strong> {item.negocios.descripcion}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          /* Lista de todos los puntos */
          <div style={{ background: 'rgba(10, 15, 28, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', padding: '20px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
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
                    aprobado: '#10b981',
                    en_verificacion: '#f59e0b',
                    sin_reclamar: '#64748b',
                    rechazado: '#ef4444'
                  };
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '14px 12px', fontWeight: '700' }}>{p.nombre}</td>
                      <td style={{ padding: '14px 12px' }}>{p.categoria}</td>
                      <td style={{ padding: '14px 12px', color: '#94a3b8' }}>{p.nombre_creador || 'Comunidad'}</td>
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
                      <td style={{ padding: '14px 12px', color: '#64748b' }}>
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
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 10, 20, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.3s ease forwards'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(20, 27, 45, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '520px',
            padding: '32px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: '850',
              color: '#D4AF37',
              letterSpacing: '0.04em',
              fontFamily: "'LC Mogi', var(--font-outfit), sans-serif"
            }}>
              {lang === 'en' ? 'Reject Business Claim' : 'Rechazar Reclamo de Negocio'}
            </h2>
            <p style={{ margin: 0, fontSize: '13.5px', color: '#94a3b8', lineHeight: 1.5 }}>
              {lang === 'en' 
                ? `Specify why you are rejecting the claim for ${rejectionTarget.nombreNegocio}:`
                : `Especifica por qué estás rechazando el reclamo para ${rejectionTarget.nombreNegocio}:`}
            </p>

            {/* Opciones de tipo de rechazo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  background: rejectionType === 'observations' ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: rejectionType === 'observations' ? '1px solid var(--atlan-gold)' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setRejectionType('observations')}
              >
                <input 
                  type="radio" 
                  name="rejectionType" 
                  checked={rejectionType === 'observations'}
                  onChange={() => {}}
                  style={{ marginTop: '3px', accentColor: '#D4AF37' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '750', color: 'white' }}>
                    {lang === 'en' ? 'Reject with observations' : 'Rechazar con observaciones'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                    {lang === 'en' 
                      ? 'The owner remains linked to the point. They can see your feedback, correct the business details, and resubmit.'
                      : 'El dueño sigue vinculado al punto. Podrá ver tus observaciones, corregir los datos del negocio y volver a enviar.'}
                  </div>
                </div>
              </label>

              <label 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '14px',
                  background: rejectionType === 'release' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: rejectionType === 'release' ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setRejectionType('release')}
              >
                <input 
                  type="radio" 
                  name="rejectionType" 
                  checked={rejectionType === 'release'}
                  onChange={() => {}}
                  style={{ marginTop: '3px', accentColor: '#ef4444' }}
                />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '750', color: '#fca5a5' }}>
                    {lang === 'en' ? 'Release point (Fraud / Delete claim)' : 'Liberar punto (Fraude / Cancelar reclamo)'}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.4 }}>
                    {lang === 'en' 
                      ? 'Desassociates the point immediately, returning it to unclaimed status. The business is marked inactive.'
                      : 'Desvincula el punto de inmediato, devolviéndolo a estado "sin reclamar" en el mapa. El negocio queda inactivo.'}
                  </div>
                </div>
              </label>
            </div>

            {/* Input del motivo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: '750', color: '#cbd5e1' }}>
                {lang === 'en' ? 'Reason for Rejection:' : 'Motivo del Rechazo:'}
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={lang === 'en' ? 'e.g. Please provide a clear profile photo and a valid phone number.' : 'Ej: Por favor, ingrese un número de teléfono de contacto válido y una descripción comercial clara.'}
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(10, 15, 28, 0.6)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '12px',
                  color: 'white',
                  fontSize: '13.5px',
                  outline: 'none',
                  resize: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = rejectionType === 'release' ? '#ef4444' : '#D4AF37'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Botones de acción */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={() => setRejectionTarget(null)}
                disabled={submittingRejection}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '750',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
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
                    : 'linear-gradient(135deg, #D4AF37 0%, #b89324 100%)',
                  color: rejectionType === 'release' ? 'white' : '#0a0f1c',
                  border: 'none',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: rejectionType === 'release' 
                    ? '0 4px 12px rgba(239,68,68,0.2)' 
                    : '0 4px 12px rgba(212,175,55,0.2)'
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
