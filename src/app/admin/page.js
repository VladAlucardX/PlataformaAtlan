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

  // Rechazar un negocio reclamado
  const handleRechazarReclamo = async (puntoId, negocioId) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to reject this claim?' : '¿Está seguro de rechazar este reclamo de negocio?')) return;

    try {
      // 1. Devolver el punto a estado 'sin_reclamar' y desvincular el negocio_id
      const { error: errPunto } = await supabase
        .from('puntos')
        .update({ 
          estado: 'sin_reclamar',
          negocio_id: null 
        })
        .eq('id', puntoId);

      if (errPunto) throw errPunto;

      // 2. Marcar el negocio como inactivo o eliminarlo para liberar el reclamo
      if (negocioId) {
        const { error: errNegocio } = await supabase
          .from('negocios')
          .update({ activo: false })
          .eq('id', negocioId);

        if (errNegocio) throw errNegocio;
      }

      alert(lang === 'en' ? 'Claim rejected. Point restored to unclaimed.' : 'Reclamo rechazado. Punto devuelto a sin reclamar.');
      loadAdminData();
    } catch (err) {
      console.error('Error rechazando reclamo:', err);
      alert('Error al rechazar reclamo.');
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
                        onClick={() => handleRechazarReclamo(item.id, item.negocio_id)}
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
    </div>
  );
}
