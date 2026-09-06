# Plataforma Atlan — Documentación Técnica del Sistema

**Plataforma Atlan** es una solución tecnológica integral orientada al turismo, la promoción del comercio local y el fortalecimiento de la comunidad interactiva en Nicaragua. 

El repositorio está organizado bajo un esquema de monorepo que contiene el código fuente de la aplicación **Web PWA** (desarrollada con Next.js) y la aplicación **Móvil Nativa** (desarrollada con Flutter).

---

## 1. Descripción General

El objetivo principal de la plataforma es digitalizar y gamificar la experiencia turística en los 17 departamentos de Nicaragua, conectando a visitantes, propietarios de comercios locales, guías turísticos certificados y residentes comunitarios a través de herramientas de geolocalización en tiempo real.

### Módulos y Funcionalidades Principales

*   **Mapa Turístico Interactivo (Mapbox GL):** Visualización vectorial de puntos de interés, trazado de rutas terrestres, categorización de establecimientos y distinción del estado de verificación de comercios (verificados, en revisión o no reclamados). Incluye máscaras territoriales y centroides departamentales.
*   **Verificación de Visitas por GPS:** Algoritmo de cálculo de distancia mediante la fórmula de Haversine (radio < 1 km) que valida la presencia física del usuario en un departamento o destino para desbloquear insignias y actualizar su puntuación en el ranking de exploradores.
*   **Directorio y Gestión de Guías Turísticos Certificados:** Módulo dedicado (`/guias` y `/perfil-guia`) para la búsqueda, filtrado por especialidad/idioma y contacto directo (vía WhatsApp e Instagram) con guías autorizados por INTUR.
*   **Panel Multi-Negocio (Propietarios):** Módulo de administración para dueños de comercios (`/dashboard`) donde pueden registrar establecimientos, editar horarios, gestionar imágenes, revisar motivos de rechazo en caso de revisiones administrativas y solicitar la verificación del local.
*   **Panel de Administración del Sistema:** Módulo restringido (`/admin`) para administradores enfocado en la moderación, aprobación y auditoría de solicitudes de nuevos negocios y registros de guías.
*   **Enciclopedia Departamental:** Guía informativa estructurada (`/mas-de-nicaragua` y `src/data/departamentos-data.js`) sobre los 17 departamentos con datos sobre historia, economía, puntos turísticos, pasatiempos y eventos culturales.
*   **Red Social Comunitaria y Chat en Tiempo Real:** Muro interactivo (`/comunidad`), perfiles públicos, seguidores/seguidos, visor de imágenes HD y mensajería privada directa mediante suscripciones WebSockets con Supabase Realtime (`/chat` y `ChatWidget.js`).
*   **Soporte PWA Offline y Multi-Idioma (i18n):** Service Worker (`public/sw.js`) con estrategia de caché offline para uso en movimiento y sistema de internacionalización (Español / Inglés) vía `src/lib/i18n/`.
*   **Sistema de Perfiles y Rangos de Usuario:** Gestión de niveles, roles y beneficios del sistema: Turista no registrado, Turista Tuani (registrado), Turista Deacachimba (con membresía activa), Guía Turístico Certificado y Administrador del Sistema.
*   **Seguridad y Autenticación:** Control de sesión con recuperación de contraseña (`/reset-password`), cierre automático por inactividad (`useInactivityLogout`) y políticas de seguridad por fila (RLS) en Supabase.

---

## 2. Arquitectura del Sistema

El sistema implementa una arquitectura basada en **Backend como Servicio (BaaS)**, apoyada en **Supabase** como núcleo central de base de datos y autenticación, sirviendo de manera desacoplada tanto al cliente Web como al cliente Móvil.

### Diagrama de Arquitectura

```text
               +-------------------------------------------------+
               |              Clientes del Sistema               |
               +-----------------------+-------------------------+
                                       |
          +----------------------------+----------------------------+
          |                                                         |
+---------v---------+                                     +---------v---------+
|   Cliente Web     |                                     |  Cliente Móvil    |
|   Next.js 16 PWA  |                                     |  Flutter 3.38     |
+---------+---------+                                     +---------+---------+
          |                                                         |
          |           API REST / WebSockets / RPC (PL/pgSQL)        |
          +----------------------------+----------------------------+
                                       |
                     +-----------------v-----------------+
                     |           Supabase BaaS           |
                     |  (PostgreSQL, Auth, Realtime, RLS)|
                     +-----------------+-----------------+
                                       |
                                       v
                     +-----------------------------------+
                     |       Servicios Externos          |
                     | (Mapbox GL Vector Tile Services)  |
                     +-----------------------------------+
```

### Componentes y Decisiones de Arquitectura

1.  **Capa de Presentación (Frontend Web & Mobile):**
    *   **Web (Next.js 16 + React 19):** Aprovecha el App Router para optimizar la carga inicial mediante Server Components y mantener reactividad client-side en mapas, chats y perfiles de guías. Incluye Service Worker (`public/sw.js`), manifiesto PWA y soporte multi-idioma (i18n ES/EN).
    *   **Mobile (Flutter 3.38):** Construcción nativa multiplataforma. Utiliza **Riverpod** para la gestión de estado reactiva e inyección de dependencias, y **GoRouter** para el manejo de rutas profundas.
2.  **Capa de Negocio y Datos (Supabase Core):**
    *   **PostgreSQL Relacional:** Almacenamiento persistente con esquemas estructurados para usuarios, perfiles, guías turísticos, comercios, publicaciones, mensajes y visitas.
    *   **Funciones Almacenadas (RPC en PL/pgSQL):** Consultas avanzadas ejecutadas en la base de datos (por ejemplo, cálculo de distancia radial de puntos de interés respecto a coordenadas GPS).
    *   **Seguridad por Filas (RLS - Row Level Security):** Políticas de control de acceso granulares para asegurar que solo los dueños modifiquen su información y que los chats permanezcan estrictamente privados.
    *   **Realtime Engine:** Motor de WebSockets para notificación instantánea de nuevos mensajes e interacciones sociales.
    *   **Storage (Bucket `atlan-media`):** Almacenamiento de archivos multimedia optimizados (fotos de negocios, avatares, guías y publicaciones).
3.  **Capa Geoespacial:**
    *   Servicios de **Mapbox GL** (JS para Web y Native SDK para Móvil) combinados con archivos GeoJSON locales para límites territoriales (`nicaragua-boundary.json`), centroides departamentales (`nicaragua-department-centroids.json`) y máscara de recorte nacional (`outside-nicaragua-mask.json`).

---

## 3. Tecnologías Utilizadas y Dependencias Clave

### Aplicación Web (`package.json`)

```json
{
  "dependencies": {
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "@supabase/supabase-js": "^2.105.4",
    "mapbox-gl": "^3.23.1",
    "@mapbox/mapbox-gl-directions": "^4.3.1"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.6"
  }
}
```

### Aplicación Móvil (`mobile/pubspec.yaml`)

```yaml
dependencies:
  flutter:
    sdk: flutter
  supabase_flutter: ^2.8.0
  mapbox_maps_flutter: ^2.5.0
  flutter_riverpod: ^2.6.0
  go_router: ^14.8.0
  geolocator: ^13.0.2
  geocoding: ^3.0.0
  flutter_dotenv: ^5.2.1
  cached_network_image: ^3.4.1
  flutter_animate: ^4.5.2
  flutter_inappwebview: ^6.1.5
```

---

## 4. Variables de Entorno

### Configuración Web (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto web:

```env
# URL del proyecto Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co

# Clave pública de acceso (Anon / Publishable Key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Token público de Mapbox GL JS
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94dXNlciIsImEiOiJjb...
```

### Configuración Móvil (`mobile/.env`)

Crea un archivo `.env` dentro del directorio `mobile/`:

```env
# Credenciales Supabase para el cliente móvil
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Access Token para Mapbox Maps SDK Nativo
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwYm94dXNlciIsImEiOiJjb...
```

---

## 5. Estructura Modular del Proyecto

El código está organizado modularmente para separar las responsabilidades de la plataforma Web, la App Móvil y los recursos estáticos geoespaciales:

```text
plataforma-atlan/
├── public/                               # Recursos estáticos, GeoJSON y PWA
│   ├── manifest.json                     # Manifiesto Web App e iconos instalables
│   ├── sw.js                             # Service Worker para caché offline
│   ├── nicaragua-departments.json        # Polígonos GeoJSON de los 17 departamentos
│   ├── nicaragua-department-centroids.json # Centroides para centrado de cámara y etiquetas
│   ├── nicaragua-boundary.json           # Contorno fronterizo nacional
│   ├── outside-nicaragua-mask.json       # Máscara visual para enfocar el territorio nacional
│   └── videos/                           # Video multimedia introductorio
│
├── src/                                  # APLICACIÓN WEB (NEXT.JS 16)
│   ├── app/                              # Rutas principales del App Router
│   │   ├── admin/                        # Panel de aprobación de negocios y guías
│   │   ├── chat/                         # Mensajería directa entre usuarios (Realtime)
│   │   ├── comunidad/                    # Feed social, publicaciones y perfiles comunitarios
│   │   ├── dashboard/                    # Gestión multi-negocio para propietarios
│   │   ├── departamentos/                # Ranking de exploradores y validación GPS
│   │   ├── guias/                        # Catálogo de Guías Turísticos certificados
│   │   ├── mas-de-nicaragua/             # Enciclopedia turística departamental
│   │   ├── mapa/                         # Vista interactiva del mapa a pantalla completa
│   │   ├── perfil/                       # Perfil de usuario, favoritos y ajustes
│   │   ├── perfil-guia/                  # Vista detallada y contacto directo del guía
│   │   ├── login/ & registro/            # Flujos de autenticación de usuarios
│   │   ├── reset-password/               # Restablecimiento seguro de credenciales
│   │   ├── globals.css                   # Estilos globales y efectos visuales neón/glassmorphism
│   │   └── page.js                       # Landing Page de bienvenida
│   │
│   ├── components/                       # Componentes React reutilizables
│   │   ├── MapaTuristico.js              # Integración cliente de Mapbox GL JS
│   │   ├── VideoIntro.js                 # Introducción audiovisual de la plataforma
│   │   ├── PWARegister.js                # Registro del Service Worker PWA
│   │   ├── ClientProviders.js            # Contenedor de proveedores de contexto client-side
│   │   └── ui/                           # Modales (BusinessProfileModal, ImageViewerModal, FollowersModal), Navbar, ChatWidget, NeonSigns, Icon.js
│   │
│   ├── data/                             # Datos estructurados del sistema
│   │   └── departamentos-data.js         # Enciclopedia estática de los 17 departamentos
│   │
│   ├── hooks/                            # Custom Hooks de React
│   │   ├── useInactivityLogout.js        # Cierre automático de sesión por inactividad
│   │   └── useTranslation.js             # Hook de traducción i18n dinámico
│   │
│   └── lib/                              # Servicios, utilidades y contexto
│       ├── AuthContext.js                # Provider del estado global de autenticación
│       ├── geoUtils.js                   # Algoritmo de validación geográfica Haversine
│       ├── imageUtils.js                 # Procesamiento y compresión de imágenes
│       ├── profileUtils.js               # Utilidades de formateo de perfiles
│       ├── storage.js                    # Conector de carga a Supabase Storage
│       ├── supabase.js                   # Inicialización del cliente Supabase JS
│       └── i18n/                         # Diccionarios de traducción (ES / EN)
│
├── mobile/                               # APLICACIÓN MÓVIL (FLUTTER MONOREPO)
│   ├── assets/                           # Recursos gráficos y GeoJSON nativos
│   ├── lib/                              # Código de la aplicación en Dart
│   │   ├── config/                       # Constantes, tema visual y rutas GoRouter
│   │   ├── l10n/                         # Archivos de localización nativa
│   │   ├── models/                       # Modelos de datos (Perfil, Negocio, Punto, Guía)
│   │   ├── providers/                    # Controladores de estado Riverpod
│   │   ├── screens/                      # Pantallas (Home, Mapa, Perfil, Chat, Admin, Dashboard, WebView)
│   │   ├── services/                     # Clientes de API, Supabase y ubicación GPS
│   │   ├── utils/                        # Utilidades y formateadores auxiliares
│   │   └── widgets/                      # Componentes gráficos reutilizables
│   └── pubspec.yaml                      # Configuración y dependencias de Flutter
│
├── supabase_guias_turisticos.sql         # Esquema SQL y políticas RLS para guías turísticos
├── .env.local                            # Variables de entorno local Web
├── README_TECNICO.md                     # Documentación técnica completa del sistema
└── package.json                          # Scripts y dependencias Web
```

---

## 6. Instalación Básica y Ejecución del Sistema

### 6.1. Requisitos Previos

Asegúrate de contar con el siguiente software instalado en tu entorno de desarrollo:

*   **Node.js:** v18.0.0 o superior (recomendado v20 LTS).
*   **npm:** v9.0.0 o superior.
*   **Flutter SDK:** v3.10.0 o superior (requerido únicamente si vas a ejecutar la aplicación móvil).
*   **Git:** Para control de versiones.

---

### 6.2. Ejecución de la Aplicación Web (Next.js)

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/VladAlucardX/PlataformaAtlan.git
    cd plataforma-atlan
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Iniciar el servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    *La aplicación estará disponible en `http://localhost:3000`.*

4.  **Compilar y probar la build de producción (Opcional):**
    ```bash
    npm run build
    npm run start
    ```

---

### 6.3. Ejecución de la Aplicación Móvil (Flutter)

1.  **Navegar al directorio móvil:**
    ```bash
    cd mobile
    ```

2.  **Obtener dependencias:**
    ```bash
    flutter pub get
    ```

3.  **Verificar dispositivos o emuladores disponibles:**
    ```bash
    flutter devices
    ```

4.  **Ejecutar en emulador o dispositivo físico:**
    ```bash
    flutter run
    ```

---

## 7. Scripts Disponibles

### Scripts Web (npm)

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el entorno de desarrollo en `localhost:3000` ejecutando previamente una limpieza de caché de `.next`. |
| `npm run build` | Compila y optimiza la aplicación Next.js para producción. |
| `npm run start` | Inicia el servidor Node.js en modo producción utilizando el compilado generado en `npm run build`. |
| `npm run lint` | Ejecuta ESLint para analizar la calidad y consistencia del código. |
| `npm run clean` | Fuerza la eliminación de la carpeta de caché `.next`. |

### Scripts Móviles (Flutter)

| Comando | Descripción |
| :--- | :--- |
| `flutter pub get` | Descarga las dependencias declaradas en `pubspec.yaml`. |
| `flutter run` | Inicia la app en modo debug en un dispositivo conectado. |
| `flutter build apk --release` | Compila el instalador APK optimizado para Android. |
| `flutter build appbundle` | Genera el paquete Android App Bundle (AAB) para Google Play. |
| `flutter build ipa` | Prepara el ejecutable de iOS para distribución en TestFlight o App Store. |

---

## 8. Ejemplos de Endpoints y Consultas (Supabase & RPC)

La comunicación con el backend se realiza mediante la librería oficial de Supabase. A continuación se presentan ejemplos reales de cómo interactúa la aplicación con la base de datos:

### 8.1. Autenticación de Usuarios (Auth API)

```javascript
import { supabase } from '@/lib/supabase';

// Inicio de sesión con correo y contraseña
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'turista@atlan.ni',
  password: 'Password123!',
});

if (error) {
  console.error('Error de autenticación:', error.message);
} else {
  console.log('Sesión iniciada:', data.user);
}
```

### 8.2. Búsqueda Geoespacial con Función RPC (`PL/pgSQL`)

Consulta para calcular dinámicamente los lugares de interés dentro de un radio en kilómetros a partir de las coordenadas del dispositivo:

```javascript
// Obtener lugares turísticos en un radio de 50 km desde Managua
const { data: puntosCercanos, error } = await supabase.rpc('buscar_puntos_cercanos', {
  lat_usuario: 12.136389,
  lng_usuario: -86.251389,
  radio_km: 50
});

if (error) console.error('Error al ejecutar RPC:', error);
```

### 8.3. Consulta y Filtrado de Guías Turísticos Certificados

```javascript
// Consultar guías activos por departamento
const { data: guias, error } = await supabase
  .from('guias_turisticos')
  .select('id, nombre_completo, especialidad, idiomas, tarifa_aprox, departamento_principal, whatsapp')
  .eq('activo', true)
  .eq('departamento_principal', 'León');

if (error) console.error('Error al consultar guías:', error);
```

### 8.4. Filtrado de Negocios Verificados por Categoría

```javascript
// Consulta de establecimientos activos y verificados en la categoría de Restaurantes
const { data: restaurantes, error } = await supabase
  .from('negocios')
  .select('id, nombre, descripcion, departamento, estado_verificacion, latitud, longitud')
  .eq('categoria', 'Restaurantes')
  .eq('estado_verificacion', 'activo')
  .order('nombre', { ascending: true });
```

### 8.5. Registro de Visita Validada por GPS (Check-In)

```javascript
// Inserción de visita una vez validado que la distancia Haversine es < 1 km
const { data: checkIn, error } = await supabase
  .from('visitas_puntos')
  .insert([
    {
      usuario_id: user.id,
      departamento: 'Granada',
      punto_id: 12,
      fecha_visita: new Date().toISOString()
    }
  ]);
```

### 8.6. Suscripción a Chat en Tiempo Real (WebSockets Realtime)

```javascript
// Suscripción reactiva a la llegada de mensajes en una conversación privada
const chatChannel = supabase
  .channel(`chat_${conversacionId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'mensajes',
      filter: `conversacion_id=eq.${conversacionId}`
    },
    (payload) => {
      console.log('Nuevo mensaje recibido en vivo:', payload.new);
    }
  )
  .subscribe();
```

---

## 9. Solución de Problemas Comunes (Troubleshooting) & Notas Técnicas

### Permisos de Geolocalización
*   **En Web:** Asegúrate de que el navegador tenga autorizada la lectura de ubicación (`navigator.geolocation`). Si estás probando en entorno local sin HTTPS, algunos navegadores bloquean la geolocalización a menos que accedas explícitamente vía `localhost`.
*   **En Android/iOS:** Verifica que la app móvil incluya los permisos `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` configurados en `AndroidManifest.xml` e `Info.plist`.

### Visualización del Mapa (Mapbox)
*   Si los mapas no cargan o muestran un lienzo en blanco, confirma que la variable `NEXT_PUBLIC_MAPBOX_TOKEN` en `.env.local` (o `MAPBOX_ACCESS_TOKEN` en la app móvil) tenga un token válido activo asignado a tu cuenta de Mapbox.

### Caché y Service Worker en PWA
*   Si notas cambios que no se reflejan en la PWA Web, desregistra el Service Worker desde DevTools (`Application > Service Workers`) o ejecuta `npm run clean` para forzar la recreación de los paquetes estáticos.

### Seguridad y RLS en Supabase
*   Todas las tablas críticas del sistema (`mensajes`, `negocios`, `visitas_puntos`, `perfiles`, `guias_turisticos`) cuentan con políticas de **Row Level Security (RLS)** activadas. Los intentos de modificación directa sin un token JWT válido de usuario autenticado serán rechazados por la base de datos.
