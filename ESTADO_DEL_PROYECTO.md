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

## Siguientes Pasos
Al retomar el desarrollo:
- Monitorear el funcionamiento de la caché del Service Worker PWA en entornos de producción.
- Añadir nuevas excentricidades o servicios en el panel de propietario.

---
*Documento actualizado por Antigravity (IA) para preservar el contexto de desarrollo.*
