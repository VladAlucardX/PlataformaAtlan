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

7. **Sección Enciclopedia "Más de Nicaragua" (`src/app/mas-de-nicaragua`):**
   - **Navegación e Integración:** Enlace *"Más de Nicaragua"* en la barra de navegación principal (`Navbar.js`) en desktop y móvil.
   - **Mapa Protagonista de Gran Formato:** Vista enfocada 100% en el mapa interactivo Mapbox GL (altura ampliada a `620px`) con botonera de filtros regionales (*Todos, Pacífico, Central, Caribe*) que reorientan suavemente la cámara del mapa.
   - **Cámara 100% Estática e Iluminación Neón en Selección:**
     - **Cámara Fija Fisiológica (Zoom `6.60`):** El mapa se mantiene inmóvil dentro del cuadro de `620px` (`dragPan: false`, `center: [-85.15, 12.80]`, `zoom: 6.60`), mostrando a Nicaragua de forma prominente y completa (incluyendo la frontera norte).
     - **Efecto de Resplandor Neón (`dept-glow`):** Al seleccionar un departamento, un aura difuminada neón (`line-blur: 8`, `line-width: 14`) en el color propio del departamento se enciende en 350ms alrededor de su silueta, acompañada de un contorno blanco brillante (`line-color: #FFFFFF`).
     - **Transición Suave de Opacidad:** Relleno de color con transición progresiva de 300ms del 28% al 88% de opacidad.
   - **Paleta de Colores Única y Resaltado Sostenido por Clic:**
     - Cada departamento posee un color vibrante distintivo único (ej. Managua `#FF5722`, León `#E91E63`, Granada `#3F51B5`, Rivas `#009688`, Jinotega `#2E7D32`, etc.).
     - Al pasar el cursor (`hover`), el departamento se ilumina con su color propio.
     - Al hacer clic, **el color del departamento seleccionado se mantiene marcado y fijo en el mapa** con un contorno engrosado de `3.5px` hasta dar clic en otro departamento o cerrar la previsualización.
   - **Diseño 100% Vectorial con Iconos SVG:** Se reemplazaron los emojis por componentes SVG `<Icon />` vectoriales estandarizados ([Icon.js](file:///c:/Users/Alucard/plataforma-atlan/src/components/ui/Icon.js) y [DepartmentTabs.js](file:///c:/Users/Alucard/plataforma-atlan/src/components/ui/DepartmentTabs.js)) para las 6 pestañas, filtros regionales, encabezados y metadatos.
   - **Flujo de Modales Flotantes sobre el Mapa:**
     - **Nivel 1 (Tarjeta Resumen Preview):** Al hacer clic en un departamento sobre el mapa, el mapa se centra (`flyTo`) y despliega una tarjeta preview Glassmórfica limpia con borde dorado `#FFD700` mostrando la Región, Cabecera, Extensión, Población y Apodo.
     - **Nivel 2 (Vista Modal Completa de Pestañas):** Al presionar *"Ver Historia y Pestañas ➔"*, se abre una ventana modal flotante por encima de la pantalla con filtro desenfocado (`backdrop-blur`), incorporando `DepartmentTabs.js` para navegar por las 6 pestañas (`Historia`, `Economía`, `Turismo`, `Pasatiempos`, `Lugares`, `Actividades`) conservando toda la información histórica, económica y cultural de forma íntegra.
   - **Base de Datos Estática (`src/data/departamentos-data.js`):** Archivo JS centralizado con información verídica para los 17 departamentos.
   - **Soporte Bilingüe (i18n):** Claves en `es.json` y `en.json` para renderizado fluido en Español e Inglés.

8. **Creación de la Aplicación Móvil en Flutter 3.38 / Dart 3.10 (Monorepo `mobile/`):**
   - **Arquitectura de Monorepo:** Creación e integración completa de la carpeta `mobile/` dentro de este proyecto, compartiendo credenciales de Supabase y tokens de Mapbox.
   - **Integración con Supabase BaaS:** Conexión directa mediante `supabase_flutter` con soporte para Autenticación, RPCs (`buscar_puntos_cercanos`, `registrar_visita_turista`), Storage (`atlan-media`) y Mensajería en tiempo real con Supabase Realtime.
   - **Diseño Premium Atlan:** Tema nativo oscuro (`#070B14`) con acentos dorados (`#D4AF37`), azul Atlan (`#146D9E`), decoraciones Glassmorphism/Claymorphism y soporte de fuentes Google Fonts (Inter).
   - **Navegación y Shell Móvil:** Implementación de `go_router` con `BottomNavigationBar` de 5 pestañas (*Inicio, Mapa, Comunidad, Chat, Perfil*).
   - **Servicios y Modelos Dart:** Modelos tipados para `Perfil`, `Negocio`, `Punto`, `Publicacion`, `Mensaje` y `Departamento` con gestión de estado mediante **Riverpod**.
   - **12 Pantallas Móviles Implementadas:** Splash animado, Login, Registro, Home, Mapa, Perfil, Comunidad, Chat, Dashboard multi-negocio, Admin, Departamentos y Enciclopedia "Más de Nicaragua".
   - **Internacionalización (i18n):** Migración de traducciones a formato ARB (`app_es.arb`, `app_en.arb`) con persistencia en SharedPreferences.

## Siguientes Pasos
Al retomar el desarrollo:
- Conectar el dispositivo Samsung Galaxy S24 Ultra por USB con depuración ADB activada y ejecutar `cd mobile && flutter run` para probar en vivo.
- Configurar el Mapbox Secret Token en `mobile/android/gradle.properties` para renderizar mapas nativos vectoriales con el SDK de Mapbox para Flutter.
- Expandir el catálogo de insignias y logros de turismo desbloqueables según el número de departamentos visitados.
- Monitorear el funcionamiento de la caché del Service Worker PWA en entornos de producción.

---
*Documento actualizado por Antigravity (IA) para preservar el contexto de desarrollo.*
