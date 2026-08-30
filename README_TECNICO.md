# Documentación Técnica — Plataforma Atlan

Documentación técnica del proyecto Plataforma Atlan. El repositorio contiene el código fuente de la aplicación web PWA y la aplicación móvil nativa.

---

## 1. Descripción General

Plataforma Atlan es un sistema integral enfocado en el turismo, la gestión de comercios locales y la interacción comunitaria en Nicaragua.

El proyecto integra mapas interactivos en tiempo real, verificación geográfica de visitas, administración multi-negocio para propietarios, una enciclopedia turística departamental y una red social comunitaria con mensajería instantánea.

### Funcionalidades Principales

- **Mapa Turístico Interactivo (Mapbox GL):** Visualización de puntos de interés, rutas de navegación, categorías y estado de verificación de negocios (verificados, en revisión o sin reclamar).
- **Verificación de Visitas GPS:** Validación geográfica mediante algoritmo Haversine (radio menor a 1 km) para registrar visitas a departamentos y actualizar el ranking de exploradores.
- **Gestión Multi-Negocio:** Panel de administración para propietarios de establecimientos, con registro de locales, edición de información, visualización de motivos de rechazo y reenvío de solicitudes.
- **Panel de Administración:** Módulo para administradores del sistema enfocado en la aprobación o rechazo de nuevos negocios registrados.
- **Enciclopedia Departamental:** Sección informativa sobre los 17 departamentos de Nicaragua, categorizada en historia, economía, turismo, pasatiempos, lugares destacados y actividades.
- **Red Social y Mensajería:** Muro comunitario para compartir publicaciones, interacción con likes y comentarios, seguimiento entre usuarios y chat privado en tiempo real con Supabase Realtime.
- **Sistema de Perfiles y Rangos:** Clasificación de usuarios según su nivel de suscripción: Turista (usuario sin registrar), Turista Tuani (usuario registrado) y Turista Deacachimba (usuario con membresía de pago).

---

## 2. Arquitectura del Sistema

La arquitectura del proyecto sigue el patrón de diseño **BaaS (Backend as a Service)** sobre un esquema de monorepo desacoplado para Web y Móvil.

### Diagrama de Arquitectura de Alto Nivel

```text
               +----------------------------------+
               |        Clientes del Sistema      |
               +-----------------+----------------+
                                 |
         +-----------------------+-----------------------+
         |                                               |
+--------v-------+                              +--------v-------+
|  Aplicación    |                              |  Aplicación    |
|  Web (PWA)     |                              |  Móvil Nativa  |
|  Next.js 16    |                              |  Flutter 3.38  |
+--------+-------+                              +--------+-------+
         |                                               |
         |         REST API / WebSockets / RPC           |
         +-----------------------+-----------------------+
                                 |
               +-----------------v----------------+
               |         Supabase BaaS            |
               |  (Auth, Postgres, Realtime, RPC) |
               +-----------------+----------------+
                                 |
                                 v
               +----------------------------------+
               |       Proveedores Externos       |
               |    (Mapbox API / CDN Media)      |
               +----------------------------------+
```

### Componentes de la Arquitectura

1. **Capa de Presentación (Frontend):**
   - **Web PWA:** Renderizado híbrido (SSR / Cliente) mediante el App Router de Next.js 16 y React 19.
   - **Mobile App:** Aplicación nativa compilada con Flutter 3.38 y gestión de estado reactivo mediante Riverpod.
2. **Capa de Servicios y Negocio (Backend BaaS):**
   - **Supabase Core:** PostgreSQL relacional para la persistencia de datos y ejecución de funciones almacenadas en PL/pgSQL (RPC).
   - **Autenticación:** Gestión de identidades vía JWT y almacenamiento de perfiles de usuario.
   - **Realtime Engine:** WebSockets para suscripciones en tiempo real a tablas de mensajes y notificaciones.
   - **Storage Engine:** Almacenamiento y entrega distribuida de imágenes de perfil, publicaciones y fotos de comercios en el bucket `atlan-media`.
3. **Capa Geoespacial:**
   - Integración directa con los servicios de **Mapbox GL** para renderizado vectorial, centrado dinámico, polígonos GeoJSON y cálculo de rutas terrestres.

---

## 3. Stack Tecnológico y Dependencias

### Aplicación Web (PWA)

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

### Aplicación Móvil (Flutter Monorepo)

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

### Backend y Servicios

- **Supabase (PostgreSQL):** Base de datos relacional, Auth (JWT), Row Level Security (RLS) y RPCs de consulta geográfica.
- **Supabase Realtime:** Canales WebSockets para chat instantáneo y notificaciones en vivo.
- **Supabase Storage (`atlan-media`):** Almacenamiento distribuido para imágenes.
- **Mapbox API:** Servicios de mapas vectoriales y geolocalización.

---

## 4. Variables de Entorno

### Entorno Web (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# URL base del proyecto en Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co

# Clave pública anónima de API Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Token de acceso público para Mapbox GL JS
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94dXNlciIsImEiOiJjb...
```

### Entorno Móvil (`mobile/.env`)

Crea un archivo `.env` dentro de la carpeta `mobile/`:

```env
# Configuración del servicio Supabase para la app móvil
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Token de acceso para Mapbox Maps SDK Nativo
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwYm94dXNlciIsImEiOiJjb...
```

---

## 5. Estructura Modular del Proyecto

La estructura del código está dividida por módulos funcionales clara y mantenible:

```text
plataforma-atlan/
├── public/                               # Archivos estáticos y recursos PWA
│   ├── manifest.json                     # Manifiesto de PWA para instalación
│   ├── sw.js                             # Service Worker para estrategias de caché
│   ├── nicaragua-departments.json        # Polígonos GeoJSON de los 17 departamentos
│   └── nicaragua-boundary.json           # Límites territoriales nacionales
│
├── src/                                  # MÓDULO WEB (NEXT.JS 16)
│   ├── app/                              # Rutas del App Router
│   │   ├── admin/                        # Panel administrativo de solicitudes
│   │   ├── chat/                         # Módulo de mensajería privada en tiempo real
│   │   ├── comunidad/                    # Red social (publicaciones, comentarios, likes)
│   │   ├── dashboard/                    # Gestión multi-negocio para propietarios
│   │   ├── departamentos/                # Ranking de exploradores y validación GPS
│   │   ├── mas-de-nicaragua/             # Enciclopedia departamental interactiva
│   │   ├── mapa/                         # Vista dedicada del mapa geoespacial
│   │   ├── perfil/                       # Perfil de usuario, rangos y favoritos
│   │   ├── login/ & registro/            # Autenticación y creación de cuenta
│   │   ├── globals.css                   # Variables CSS, diseño neón y utilidades
│   │   └── page.js                       # Landing Page de bienvenida
│   │
│   ├── components/                       # Componentes de React
│   │   ├── MapaTuristico.js              # Integración de Mapbox GL JS
│   │   └── ui/                           # Modales, Navbar, ChatWidget, Icon.js
│   │
│   └── lib/                              # Servicios y clientes
│       ├── AuthContext.js                # Proveedor global del estado de autenticación
│       ├── geoUtils.js                   # Algoritmo Haversine para validación GPS
│       └── supabase.js                   # Inicialización del cliente Supabase JS
│
├── mobile/                               # MÓDULO MÓVIL (FLUTTER MONOREPO)
│   ├── assets/                           # Archivos GeoJSON e imágenes nativas
│   ├── lib/                              # Código Dart principal
│   │   ├── config/                       # Constantes, rutas (GoRouter) y temas
│   │   ├── models/                       # Modelos de datos (Perfil, Negocio, Punto)
│   │   ├── providers/                    # Controladores de estado con Riverpod
│   │   ├── screens/                      # Pantallas móviles (Home, Mapa, Perfil, Chat)
│   │   └── services/                     # Conectores a Supabase, GPS y Storage
│   └── pubspec.yaml                      # Configuración de dependencias móviles
│
├── .env.local                            # Variables de entorno Web
├── README_TECNICO.md                     # Documentación técnica completa
└── package.json                          # Scripts y dependencias Web
```

---

## 6. Requisitos Previos, Instalación y Ejecución

### 6.1. Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu entorno local:

- **Node.js:** Versión 18.0.0 o superior (recomendado v20 LTS).
- **npm:** Versión 9.0.0 o superior.
- **Flutter SDK:** Versión 3.10.7 o superior (necesario únicamente para la aplicación móvil).
- **Git:** Para control de versiones.

---

### 6.2. Instalación y Ejecución de la Aplicación Web (Next.js)

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/VladAlucardX/PlataformaAtlan.git
   cd plataforma-atlan
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).*

4. Compilar para producción (opcional):
   ```bash
   npm run build
   npm run start
   ```

---

### 6.3. Instalación y Ejecución de la Aplicación Móvil (Flutter)

1. Navegar a la carpeta del proyecto móvil:
   ```bash
   cd mobile
   ```

2. Instalar las dependencias de Flutter:
   ```bash
   flutter pub get
   ```

3. Verificar dispositivos conectados (emulador o dispositivo físico):
   ```bash
   flutter devices
   ```

4. Ejecutar la aplicación:
   ```bash
   flutter run
   ```

---

## 7. Scripts Disponibles

### Comandos de la Aplicación Web (Node.js / npm)

- **`npm run dev`**: Inicia el servidor de desarrollo en `http://localhost:3000`, ejecutando primero una limpieza de la caché de `.next`.
- **`npm run build`**: Compila y optimiza la aplicación web para despliegue en producción.
- **`npm run start`**: Inicia el servidor Node.js en modo producción utilizando el compilado previo.
- **`npm run lint`**: Ejecuta ESLint para analizar la calidad y estilo del código fuente.
- **`npm run clean`**: Elimina de forma forzada la carpeta de caché `.next`.

### Comandos de la Aplicación Móvil (Flutter)

- **`flutter pub get`**: Descarga e instala las dependencias declaradas en `pubspec.yaml`.
- **`flutter run`**: Ejecuta la aplicación móvil en modo de depuración en un emulador o dispositivo físico.
- **`flutter build apk --release`**: Genera el paquete ejecutable APK para Android en producción.
- **`flutter build appbundle`**: Genera el paquete Android App Bundle (AAB) para Google Play Store.
- **`flutter build ipa`**: Compila la aplicación iOS para distribución mediante TestFlight o App Store.

---

## 8. Ejemplos de Endpoints y Consultas (Supabase & RPC)

La comunicación con la base de datos se realiza mediante el cliente de Supabase JS / Flutter y funciones almacenadas (RPC). A continuación se presentan ejemplos reales de uso en el sistema:

### 8.1. Autenticación de Usuarios

```javascript
// Inicio de sesión mediante email y contraseña
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'turista@atlan.ni',
  password: 'Password123!',
});

if (error) console.error('Error al autenticar:', error.message);
```

### 8.2. Búsqueda Geoespacial de Puntos Cercanos (RPC PL/pgSQL)

Función RPC personalizada para calcular distancias dinámicas entre las coordenadas GPS del usuario y los destinos registrados:

```javascript
// Búsqueda de destinos en un radio de 50 km desde la ubicación actual
const { data: puntos, error } = await supabase.rpc('buscar_puntos_cercanos', {
  lat_usuario: 12.136389,
  lng_usuario: -86.251389,
  radio_km: 50
});
```

### 8.3. Consulta de Negocios por Categoría

```javascript
// Obtener negocios verificados en la categoría de Restaurantes
const { data: negocios, error } = await supabase
  .from('negocios')
  .select('id, nombre, descripcion, departamento, estado_verificacion, latitud, longitud')
  .eq('categoria', 'Restaurantes')
  .eq('estado_verificacion', 'activo')
  .order('nombre', { ascending: true });
```

### 8.4. Registro de Visita Validada por GPS (Check-In)

```javascript
// Registrar check-in exitoso tras validar distancia < 1km
const { data, error } = await supabase
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

### 8.5. Suscripción a Mensajería en Tiempo Real (WebSockets)

```javascript
// Suscripción al canal de chat privado entre dos usuarios
const chatChannel = supabase
  .channel('chat_privado')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'mensajes',
      filter: `conversacion_id=eq.${conversacionId}`
    },
    (payload) => {
      console.log('Nuevo mensaje recibido:', payload.new);
    }
  )
  .subscribe();
```

---

## 9. Flujo de Trabajo y Commits

El desarrollo del proyecto utiliza el flujo GitFlow y la convención de Conventional Commits.

### Estructura de Ramas
- `main`: Rama de producción.
- `develop`: Rama principal de integración.
- `feature/<nombre>`: Ramas para desarrollo de nuevas características.
- `fix/<nombre>`: Ramas para corrección de errores.

### Formato de Commits
```bash
tipo(alcance): descripción breve en imperativo
```

Tipos aceptados: `feat`, `fix`, `docs`, `style`, `refactor`, `chore`.
