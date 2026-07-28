# Estado del Proyecto: Plataforma Atlan

## Descripción General
La Plataforma Atlan es una aplicación web enfocada en turismo, mapas interactivos y gestión de negocios. Está construida utilizando el siguiente stack tecnológico:
- **Framework:** Next.js (App Router, versión 16)
- **Base de Datos / Backend:** Supabase (PostgreSQL)
- **Mapas:** Mapbox GL / Mapbox
- **Estilos:** CSS / TailwindCSS (si aplica, con Tailwind CSS v4)
- **Otras características:** PWA (Progressive Web App), i18n (Internacionalización)

## Características Implementadas y Recientes

1. **Autenticación y Usuarios:**
   - Sistema de login (`src/app/login/page.js`) y registro (`src/app/registro/page.js`).
   - Diferentes roles de usuario (Ej: Administrador, Dueños de negocios).

2. **Panel de Administración y Dashboard:**
   - Dashboard (`src/app/dashboard/page.js`) con soporte multi-negocio para que los dueños puedan gestionar múltiples propiedades.
   - **Corrección de Estilo en React 19:** Se resolvió un error crítico de re-renderizado al transicionar al selector de negocios reemplazando la propiedad abreviada `margin: "0 auto"` por propiedades separadas (`marginLeft`, `marginRight`, `marginTop`, `marginBottom`).
   - Panel administrativo (`src/app/admin/page.js`) para control general de aprobaciones.

3. **Mapa Turístico Interactivo (`src/components/MapaTuristico.js`):**
   - Integración con Mapbox GL.
   - **Visualización de Negocios en Verificación:** Se actualizó la función de base de datos RPC `buscar_puntos_cercanos` removiendo el filtro `n.activo = true` en el JOIN. Ahora, el mapa muestra correctamente los puntos y permite ver los perfiles de negocios pendientes de verificación.
   - **Diseño de Marcadores Premium:**
     - **Verificados (Aprobados):** Borde verde (`#10b981`), sombra verde e insignia de check (`✓`) en la esquina.
     - **En Espera de Verificación:** Borde naranja (`#f97316`), sombra naranja e insignia de reloj de arena (`⏳`), junto a una animación dinámica de pulso radar naranja.
     - **Sin Reclamar (Turísticos):** Borde gris (`#64748b`) e insignia de pregunta (`❓`).
     - *Nota:* Las insignias están anidadas en el elemento interno del marcador, por lo que se amplían y mueven de forma fluida junto con el marcador durante el efecto hover (zoom).
   - **Barra de Detalles Lateral (Detail Sheet):** Ahora muestra textualmente el estado real de verificación del negocio y muestra un banner informativo con un icono `⏳` cuando el negocio está pendiente de verificación presencial.
   - **Carga por URL:** Se propagó el estado del punto en la estructura de datos al cargarse desde enlaces por query string.
   - **Optimización de Rendimiento (Mapa Plano y Limpio):** Se retiró la carga de relieve/terreno DEM 3D y se eliminó la capa de neblina (`setFog`) para lograr un renderizado completamente limpio, plano y rápido sin neblina de fondo en el horizonte.

4. **Interfaz de Usuario y UX:**
   - Intro en video interactivo al entrar a la plataforma (`src/components/VideoIntro.js`) con el nuevo tagline: *"Descubrí lo tuyo, viví lo nuestro."*
   - Registro de Service Worker PWA (`public/manifest.json`, `src/components/PWARegister.js`).
   - **Service Worker Robusto:** Se corrigió un error en `public/sw.js` que causaba el fallo `Unexpected token '<'` al interceptar peticiones de Mapbox u otros APIs en caso de desconexión y retornar HTML como fallback. Se excluyó `mapbox.com` de la interceptación y se restringió el fallback HTML del index `/` únicamente a peticiones de tipo `text/html`.

    - **Flujo Premium de Aprobación y Rechazo:**
      - Se implementó un modal interactivo en el panel de administración (`src/app/admin/page.js`) para rechazar solicitudes con dos modalidades: *Rechazar con observaciones* (para corregir datos) y *Liberar punto* (para rechazo completo/fraude).
      - Se agregó la columna `motivo_rechazo` en la base de datos Supabase (tabla `negocios`) para persistir la retroalimentación del admin.
      - Se integraron banners informativos dinámicos de estado (*Pendiente de Verificación* y *Reclamo Rechazado*) con acciones de reenvío (*Guardar y Reenviar*) y cancelación (*Cancelar Reclamo*) en el dashboard del propietario (`src/app/dashboard/page.js`).

5. **Mejoras Recientes en Interfaz y Submenús (Julio 2026):**
   - **Hero Title sin quiebre:** Ajuste del título "Descubre Nicaragua." a una sola línea con `whiteSpace: "nowrap"` y tamaño responsivo dinámico.
   - **Carteles Neón Interactivos:** Separación ampliada entre "Explorar Mapa" y "¿Tienes un Negocio?", incorporación de delineado de letras con `-webkit-text-stroke` y eliminación de animaciones de parpadeo que causaban subpixel jittering en GPU.
   - **Botonera de Usuario en Navbar:** Botón desplegable blanco sólido con menú de opciones dinámico: incluye acceso directo a *"Mis Negocios"* entre *"Mi Perfil"* y *"Mis Giras"* únicamente si el usuario posee 1 o más negocios.
   - **Estética de Comunidad:** Ajuste del color de encabezado de banner de perfil en la comunidad al azul sólido `#0A192F` coincidiendo exactamente con el estilo de la barra de navegación principal.
   - **Delimitación Nacional en Mapa Turístico:**
     - **Filtrado Exclusivo para Nicaragua (`iso_3166_1 === 'NI'`):** Se filtraron todas las etiquetas de ciudades, nombres, carreteras y divisiones departamentales exteriores, ocultando líneas y textos de países vecinos (Costa Rica, Honduras, El Salvador) mientras se preserva el terreno y las aguas naturales de Mapbox intactas.
     - **Borde del Croquis de Nicaragua (`#146D9E`):** Integración del contorno GeoJSON oficial de Nicaragua ([`public/nicaragua-boundary.json`](file:///c:/Users/Alucard/plataforma-atlan/public/nicaragua-boundary.json)) estilizado en el azul oficial de Atlan `#146D9E`.
     - **Grosor Adaptativo con Zoom:** El grosor del borde escala dinámicamente (`interpolate` de `1.0px` en vista lejana del país a `3.5px - 5.0px` en vista cercana) para evitar saturación visual al alejar el mapa.

6. **Mapa por Departamentos, Ranking y Verificación GPS (> 1 km):**
   - **Mapa de 17 Departamentos:** Nueva sección interactiva en `/departamentos` que renderiza los polígonos de los 15 departamentos y 2 regiones autónomas de Nicaragua ([`public/nicaragua-departments.json`](file:///c:/Users/Alucard/plataforma-atlan/public/nicaragua-departments.json)).
   - **Ranking de Destinos:** Lista Top 10 interactiva ordenada por total de visitas reales, filtrable por departamento o visión nacional.
   - **Verificación de Visitas GPS (> 1 km):** Detección automática al navegar más de 1 km hacia un destino con modal flotante Claymórfico para confirmar e incrementar el contador en la base de datos Supabase (`visitas_puntos` y `registrar_visita_turista`).
   - **Sistema de Logros e Insignias:** Preparación del perfil de turista con medallas y rango (Turista, Mochilero, Leyenda).

## Siguientes Pasos
Al retomar el desarrollo:
- Expandir el catálogo de insignias y logros de turismo desbloqueables según el número de departamentos visitados.
- Monitorear el funcionamiento de la caché del Service Worker PWA en entornos de producción.

---
*Documento actualizado por Antigravity (IA) para preservar el contexto de desarrollo.*
