# 🗺️ Documentación Técnica del Proyecto: Plataforma Atlan

## 1. 📌 Ficha Técnica General

- **Nombre del Proyecto:** Plataforma Atlan
- **Tipo de Aplicación:** Aplicación Web Progresiva (PWA), Plataforma Turística, Social y Mapa Interactivo.
- **Enfoque Principal:** Turismo en Nicaragua, gestión multi-negocio, mapa geoespacial interactivo, comunidad social, enciclopedia departamental y sistema de recompensas/visitas GPS.
- **Lenguaje Principal:** JavaScript (ES6+ / JSX).
- **Control de Versiones:** Git con flujo GitFlow (`main`, `develop`, `feature/*`, `fix/*`) y soporte para Conventional Commits.

---

## 2. 🚀 Stack Tecnológico y Librerías

### Core & Frameworks
| Tecnología | Versión | Propósito / Uso |
| :--- | :--- | :--- |
| **JavaScript (Node.js / React)** | ES6+ / React 19.2.4 | Lenguaje base del cliente e interfaz de usuario. |
| **Next.js** | 16.2.6 (App Router) | Framework full-stack para React con renderizado híbrido y rutas dinámicas. |
| **Supabase** | `^2.105.4` (`@supabase/supabase-js`) | Backend as a Service (BaaS): PostgreSQL, Autenticación, Realtime, RPCs y Storage. |
| **Mapbox GL JS** | `^3.23.1` | Motor principal de mapas vectoriales e interactivos. |
| **Mapbox GL Directions** | `^4.3.1` | Módulo de cálculo y trazado de rutas de navegación. |

### Estilos, UI & Assets
| Tecnología | Versión | Propósito / Uso |
| :--- | :--- | :--- |
| **Tailwind CSS** | `^4.0.0` (`@tailwindcss/postcss`) | Framework de utilidades CSS de última generación. |
| **CSS3 Custom Properties** | Nativo | Estilos globales, variables de color, Glassmorphism, Claymorphism y efectos neón en `src/app/globals.css`. |
| **GeoJSON Data** | Estándar RFC 7946 | Polígonos de departamentos, máscaras territoriales y límites oficiales de Nicaragua (`public/*.json`). |
| **SVG Vector Icons** | Personalizados (`Icon.js`) | Componente único vectorial reutilizable para pestañas, categorías y estados. |

---

## 3. 📂 Arquitectura y Estructura de Directorios

La estructura sigue la convención del **App Router de Next.js 16** con separación limpia de componentes, utilidades y capas de datos:

```text
plataforma-atlan/
├── public/                               # Archivos estáticos y recursos PWA
│   ├── avatars/                          # Imágenes de avatares predeterminados
│   ├── fonts/                            # Fuentes tipográficas del proyecto
│   ├── images/                           # Imágenes de prueba y promocionales
│   ├── logos/                            # Logos oficiales de Atlan
│   ├── lugares/                          # Fotos estáticas de destinos turísticos
│   ├── videos/                           # Video interactivo de intro
│   ├── manifest.json                     # Manifiesto de PWA (instalable en móvil/desktop)
│   ├── sw.js                             # Service Worker de almacenamiento en caché PWA
│   ├── nicaragua-boundary.json           # GeoJSON del contorno nacional (#146D9E)
│   ├── nicaragua-departments.json        # GeoJSON de los 17 departamentos de Nicaragua
│   └── nicaragua-department-centroids.json # Centroides geométricos para vistas en mapa
│
├── src/                                  # Código fuente principal
│   ├── app/                              # Rutas principales del App Router
│   │   ├── admin/                        # Panel de administración de solicitudes y rechazos
│   │   ├── chat/                         # Sección de mensajería privada entre usuarios
│   │   ├── comunidad/                    # Red social (publicaciones, comentarios, likes)
│   │   ├── dashboard/                    # Panel para dueños de negocios (multi-negocio)
│   │   ├── departamentos/                # Mapa por departamentos, ranking y check-in GPS
│   │   ├── login/                        # Pantalla de inicio de sesión
│   │   ├── mapa/                         # Vista dedicada del mapa interactivo
│   │   ├── mas-de-nicaragua/             # Enciclopedia interactiva de departamentos (6 pestañas)
│   │   ├── perfil/                       # Perfil de usuario, insignias y favoritos
│   │   ├── registro/                     # Pantalla de registro de nuevos usuarios
│   │   ├── globals.css                   # Estilos globales, temas, neón y responsive
│   │   ├── layout.js                     # Root layout (Proveedores, Navbar, PWA, Intro Video)
│   │   └── page.js                       # Página principal (Landing Page con Hero, Mapa y Neon)
│   │
│   ├── components/                       # Componentes de React
│   │   ├── ClientProviders.js            # Contenedor de AuthContext e i18n
│   │   ├── MapaTuristico.js              # Módulo principal del Mapa Mapbox GL
│   │   ├── PWARegister.js                # Registro e instalación del Service Worker PWA
│   │   ├── VideoIntro.js                 # Video intro interactivo de bienvenida
│   │   └── ui/                           # Componentes reutilizables de UI
│   │       ├── BusinessProfileModal.js   # Modal de perfil detallado de negocio
│   │       ├── ChatWidget.js             # Widget flotante de chat en vivo
│   │       ├── DepartmentTabs.js         # Pestañas de historia/turismo en departamentos
│   │       ├── FollowersModal.js         # Modal de seguidores y seguidos
│   │       ├── Icon.js                   # Renderizador de iconos SVG vectoriales
│   │       ├── ImageViewerModal.js       # Visor modal de fotos e interacción social
│   │       ├── LanguageToggle.js         # Selector bilingüe (ES / EN)
│   │       ├── Navbar.js                 # Barra de navegación superior responsiva
│   │       ├── NeonBusinessSign.js       # Carteles neon decorativos para negocios
│   │       ├── NeonMapSign.js            # Carteles neon decorativos para mapa
│   │       ├── NotificationDropdown.js   # Menú desplegable de notificaciones
│   │       └── ShareDropdown.js          # Menú para compartir contenido
│   │
│   ├── data/                             # Base de datos local e información estática
│   │   └── departamentos-data.js        # Información cultural, historia y turismo de los 17 departamentos
│   │
│   ├── hooks/                            # Custom React Hooks
│   │
│   └── lib/                              # Configuraciones y clientes de API
│       ├── AuthContext.js                # Contexto de autenticación y estado del usuario
│       ├── geoUtils.js                   # Cálculo de distancias (Haversine) para validación GPS
│       ├── profileUtils.js               # Utilidades de perfil
│       ├── storage.js                    # Subida de medios a Supabase Storage (`atlan-media`)
│       ├── supabase.js                   # Cliente inicializado de Supabase JS
│       └── i18n/                         # Traducciones bilingües (`es.json`, `en.json`)
│
├── mobile/                               # 📱 APLICACIÓN MÓVIL FLUTTER (Monorepo)
│   ├── assets/                           # Recurso GeoJSON, imágenes y videos nativos
│   ├── lib/                              # Código Dart principal (Flutter 3.38)
│   │   ├── config/                       # Tema Atlan, rutas (GoRouter) y constantes
│   │   ├── l10n/                         # Traducciones i18n en formato ARB (app_es, app_en)
│   │   ├── models/                       # Modelos Dart (Perfil, Negocio, Punto, Publicacion, Mensaje)
│   │   ├── providers/                    # State management reactivo con Riverpod
│   │   ├── screens/                      # Pantallas (Home, Mapa, Perfil, Comunidad, Chat, Admin, etc.)
│   │   ├── services/                     # Servicios Supabase, Storage, GPS, Social y Chat
│   │   ├── utils/                        # Resolución de imágenes y utilidades
│   │   ├── widgets/                      # Shell de navegación (BottomNavigationBar)
│   │   ├── app.dart                      # Configuración de MaterialApp.router
│   │   └── main.dart                     # Punto de entrada nativo
│   ├── android/                          # Proyecto nativo Android
│   ├── ios/                              # Proyecto nativo iOS
│   ├── .env                              # Variables de entorno móvil
│   └── pubspec.yaml                      # Dependencias de Flutter (Supabase, Mapbox, Riverpod)
│
├── .env.local                            # Variables de entorno secretas (Local)
├── .gitignore                            # Archivos excluidos del control de versiones
├── AGENTS.md                             # Protocolos de desarrollo, GitFlow y Commits
├── ESTADO_DEL_PROYECTO.md                # Bitácora detallada de hitos y características
├── eslint.config.mjs                     # Configuración de ESLint
├── next.config.mjs                       # Configuración del servidor de Next.js
└── package.json                          # Manifest de dependencias y scripts de ejecución
```

---

## 4. 🧭 Rutas y Funcionalidades del Sistema

| Ruta | Descripción |
| :--- | :--- |
| `/` | **Landing Page:** Hero Banner con tipografía adaptativa, carteles neon interactivos, resumen de destinos y selector directo al mapa. |
| `/mapa` | **Mapa Turístico Interactivo:** Renderizado vector Mapbox GL con puntos turísticos, negocios verificados (`✓`), en verificación (`⏳`), sin reclamar (`❓`), rutas e información lateral. |
| `/departamentos` | **Explorador Departamental & Ranking GPS:** Mapa interactivo de los 17 departamentos de Nicaragua, ranking Top 10 de lugares más visitados y modal Claymórfico de validación GPS (>1 km). |
| `/mas-de-nicaragua` | **Enciclopedia Turística y Cultural:** Vista con mapa estático prominente (zoom 6.60), resplandor neón departamental y 6 pestañas (*Historia, Economía, Turismo, Pasatiempos, Lugares, Actividades*). |
| `/dashboard` | **Panel Propietario (Multi-negocio):** Administración de negocios propios, edición de datos, banners de retroalimentación de rechazo y reenvío de solicitudes. |
| `/admin` | **Panel de Control Administrativo:** Aprobación/Rechazo de negocios registrados con modalidades de observaciones o liberación de punto. |
| `/comunidad` | **Red Social Atlan:** Muro comunitario para publicar fotos, dar *likes*, comentar y seguir a otros viajeros o negocios. |
| `/chat` | **Mensajería en Tiempo Real:** Chat directo integrado mediante canales en vivo con Supabase Realtime. |
| `/perfil` | **Perfil de Usuario:** Datos de turista, rango (*Turista, Mochilero, Leyenda*), historial de visitas, reseñas y lista de favoritos. |
| `/login` & `/registro` | **Autenticación:** Iniciar sesión y registro de nuevas cuentas asociadas a perfiles en Supabase Auth. |

---

## 5. 🗄️ Modelo de Datos en Supabase (Tablas Principales)

El backend opera sobre Supabase (PostgreSQL) con las siguientes tablas identificadas:

- `perfiles`: Información del usuario, avatar, rol (turista, propietario, admin) y biografía.
- `negocios`: Datos del negocio, coordenadas, categoría, estado de verificación (`activo`, `motivo_rechazo`, propietario).
- `puntos`: Ubicaciones geográficas de atracción turística asociadas a coordenadas Lat/Lng.
- `visitas_puntos`: Registro de visitas contadas mediante verificación GPS.
- `publicaciones`: Entradas sociales compartidas por los usuarios en `/comunidad`.
- `comentarios_social` & `likes_social`: Interacciones dentro de la red social.
- `seguimientos`: Relación de usuarios que se siguen entre sí.
- `conversaciones` & `mensajes`: Mensajería privada y estado de lectura (`leido`).
- `notificaciones`: Alertas en tiempo real para usuarios.
- `resenas` & `favoritos`: Calificaciones y guardado de destinos preferidos.

---

## 6. ⚙️ Variables de Entorno (`.env.local`)

El archivo `.env.local` debe contener la configuración de los servicios externos:

```env
# Conexión a Supabase BaaS
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-clave-anonima-jwt>

# Proveedor de Mapas Vectoriales
NEXT_PUBLIC_MAPBOX_TOKEN=pk.<tu-token-publico-de-mapbox>
```

---

## 7. 🔌 Extensiones Recomendadas para VS Code

Para optimizar la experiencia de desarrollo en este proyecto, se sugiere instalar las siguientes extensiones en Visual Studio Code:

1. **ES7+ React/Redux/React-Native snippets** (`dsznajder.es7-react-js-snippets`)
   - Autocompletado y snippets para React 19 y JSX.
2. **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
   - Autocompletado de clases CSS de Tailwind, resaltado de sintaxis y previas de color.
3. **ESLint** (`dbaeumer.vscode-eslint`)
   - Detección de errores de sintaxis y código según las reglas del proyecto.
4. **PostCSS Language Support** (`csstree.vscode-postcss`)
   - Soporte para la sintaxis PostCSS/Tailwind v4 en `globals.css`.
5. **vscode-icons** (`vscode-icons-team.vscode-icons`) o **Material Icon Theme**
   - Iconos visuales descriptivos para carpetas de Next.js App Router (`app`, `components`, `public`).
6. **Prettier - Code Formatter** (`esbenp.prettier-vscode`)
   - Formateador automático de código para mantener uniformidad.
7. **Supabase** (`supabase.supabase-vscode`)
   - Integración y gestión de esquemas de Supabase desde el editor.

---

## 8. 🔄 Protocolo Git y Flujo de Trabajo (AGENTS.md)

### Arquitectura de Ramas
- `main`: **Producción.** Código estable desplegado. Prohibido hacer commits directos.
- `develop`: **Integración.** Rama principal de desarrollo donde convergen los avances.
- `feature/<nombre-tarea>`: Ramas temporales creadas desde `develop` para nuevas funciones.
- `fix/<nombre-tarea>`: Ramas temporales creadas desde `develop` para corregir fallos.

### Formato de Commits (Conventional Commits)
Sintaxis: `tipo(alcance): descripción imperativa corta`

- `feat`: Nueva funcionalidad para el usuario.
- `fix`: Corrección de errores o soluciones a bugs.
- `docs`: Cambios únicamente en documentación.
- `style`: Ajustes estéticos o CSS sin cambiar lógica.
- `refactor`: Reestructuración de código sin alterar comportamiento.
- `chore`: Tareas de mantenimiento, dependencias o configuración.

---

## 9. 🛠️ Comandos de Ejecución

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Limpia el directorio temporal `.next` e inicia el servidor de desarrollo local. |
| `npm run build` | Compila la aplicación Next.js para producción. |
| `npm run start` | Inicia el servidor de producción con la compilación de `npm run build`. |
| `npm run clean` | Elimina la carpeta caché `.next`. |
| `npm run lint` | Ejecuta ESLint para analizar el código en busca de advertencias o errores. |

---
*Documentación generada automáticamente para la Plataforma Atlan.*
