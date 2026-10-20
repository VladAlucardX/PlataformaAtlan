# Plataforma Atlan — Documentación Técnica del Sistema

**Plataforma Atlan** es una solución tecnológica integral orientada a la transformación digital del turismo, la dinamización del comercio local y el fortalecimiento de la comunidad interactiva en Nicaragua.

El repositorio está estructurado bajo un esquema de **Monorepo** que alberga:
1. **Aplicación Web Progresiva (PWA):** Construida con Next.js 16 (App Router), React 19 y TailwindCSS.
2. **Aplicación Móvil Nativa:** Desarrollada con Flutter 3.38 para Android e iOS.
3. **Infraestructura Cloud & DevOps:** Despliegue en Microsoft Azure con Docker, Nginx (Proxy Inverso con SSL Let's Encrypt) y Supabase como Backend as a Service (BaaS).

---

## Índice

1. [Descripción General y Módulos](#1-descripción-general-y-módulos)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Cumplimiento de Estándares de Producción (Rúbrica Técnica)](#3-cumplimiento-de-estándares-de-producción-rúbrica-técnica)
   - [3.1. Compilación Final y Optimización](#31-compilación-final-y-optimización)
   - [3.2. Servidor Seguro y Monitoreo (Azure)](#32-servidor-seguro-y-monitoreo-azure)
   - [3.3. Proxy Inverso Seguro (Nginx)](#33-proxy-inverso-seguro-nginx)
   - [3.4. Contenedores y Aislamiento (Docker)](#34-contenedores-y-aislamiento-docker)
   - [3.5. Seguridad, Variables Ocultas y CORS](#35-seguridad-variables-ocultas-y-cors)
   - [3.6. Rendimiento y Alta Disponibilidad](#36-rendimiento-y-alta-disponibilidad)
   - [3.7. Seguridad HTTPS y Certificados SSL](#37-seguridad-https-y-certificados-ssl)
   - [3.8. Flujo Automático y Pantallas de Error Amigables](#38-flujo-automático-y-pantallas-de-error-amigables)
   - [3.9. Integraciones Complejas (JWT, Supabase, OAuth, Mapbox)](#39-integraciones-complejas-jwt-supabase-oauth-mapbox)
   - [3.10. Vinculación con GitHub y Despliegue Continuo](#310-vinculación-con-github-y-despliegue-continuo)
4. [Tecnologías Utilizadas y Dependencias](#4-tecnologías-utilizadas-y-dependencias)
5. [Estructura Modular del Proyecto](#5-estructura-modular-del-proyecto)
6. [Variables de Entorno](#6-variables-de-entorno)
7. [Manual de Instalación y Ejecución Local](#7-manual-de-instalación-y-ejecución-local)
8. [Manual de Despliegue en Producción (Azure VM)](#8-manual-de-despliegue-en-producción-azure-vm)
9. [Distribución y Compilación del APK Móvil](#9-distribución-y-compilación-del-apk-móvil)
10. [Consultas de Ejemplo y Funciones Backend (RPC)](#10-consultas-de-ejemplo-y-funciones-backend-rpc)
11. [Solución de Problemas (Troubleshooting)](#11-solución-de-problemas-troubleshooting)

---

## 1. Descripción General y Módulos

El propósito de Plataforma Atlan es gamificar y digitalizar el descubrimiento de los 17 departamentos de Nicaragua, conectando turistas, negocios locales y guías turísticos oficiales de INTUR.

### Módulos Principales

*   **Mapa Turístico Interactivo (Mapbox GL):** Visualización vectorial fluida de destinos, negocios verificados, trazado de rutas punto a punto, máscaras territoriales y centroides departamentales.
*   **Verificación por GPS (Fórmula de Haversine):** Algoritmo geoespacial que valida si el usuario está físicamente dentro de un radio < 1 km de un punto turístico para desbloquear insignias y sumar puntos al ranking nacional.
*   **Directorio de Guías Turísticos Certificados:** Catálogo interactivo (`/guias` y `/perfil-guia`) con filtros por departamento, idiomas y contacto directo vía WhatsApp e Instagram.
*   **Panel Multi-Negocio para Propietarios (`/dashboard`):** Administración para dueños de comercios con métricas, edición de horarios, carga de fotos/logos y solicitud de verificación.
*   **Panel de Administración del Sistema (`/admin`):** Auditoría y moderación de establecimientos y solicitudes de guías turísticos.
*   **Comunidad y Red Social Interactiva (`/comunidad`):** Muro comunitario con historias, posts, seguimiento de usuarios y mensajería en tiempo real mediante WebSockets (`/chat`).
*   **Sincronización Avanzada de Perfiles:** Autenticación local y Google OAuth con extracción y persistencia automática de nombres, avatares y metadatos.
*   **PWA con Soporte Offline y Multi-Idioma (i18n):** Service Worker (`public/sw.js`) con almacenamiento en caché e internacionalización dinámica (Español, Inglés y Chino).

---

## 2. Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada basada en **Microservicios Contenerizados** y **Backend como Servicio (BaaS)**:

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
          | (HTTPS / Port 443)                                      | (API REST / Native)
          v                                                         |
+-------------------------------------------------------+           |
|            Servidor Cloud en Microsoft Azure          |           |
|  +-------------------------------------------------+  |           |
|  |           Proxy Inverso Seguro (Nginx)          |  |           |
|  |     (SSL Let's Encrypt, Gzip, Redirección HTTPS) |  |           |
|  +------------------------+------------------------+  |           |
|                           | (Red Interna Docker)      |           |
|  +------------------------v------------------------+  |           |
|  |        Contenedor App (Next.js Standalone)      |  |           |
|  |             Usuario No-Root: nextjs (1001)      |  |           |
|  +-------------------------------------------------+  |           |
+---------------------------+---------------------------+           |
                            |                                       |
                            |           API REST / WebSockets / JWT |
                            +-------------------+-------------------+
                                                |
                               +----------------v-----------------+
                               |           Supabase BaaS           |
                               |  (PostgreSQL, Auth, Realtime, RLS)|
                               +----------------+-----------------+
                                                |
                                                v
                               +----------------------------------+
                               |        Servicios Externos        |
                               | (Mapbox GL Vector Tile Services) |
                               +----------------------------------+
```

---

## 3. Cumplimiento de Estándares de Producción (Rúbrica Técnica)

Esta sección detalla cómo el sistema cumple rigurosamente con cada uno de los 10 criterios de producción y seguridad exigidos para la plataforma.

### 3.1. Compilación Final y Optimización
*   **Web (Next.js Standalone):** En [next.config.mjs](file:///c:/Users/Alucard/plataforma-atlan/next.config.mjs) se configuró `output: 'standalone'`, generando un paquete ultraligero que incluye únicamente las dependencias estrictamente necesarias de `node_modules`.
*   **Compresión y Caché Agresiva:** Nginx aplica compresión Gzip nivel 6 a todos los recursos de texto, JSON y JS. Los assets inmutables en `/_next/static/` cuentan con cabeceras `Cache-Control: "public, max-age=31536000, immutable"`.
*   **Móvil (Release APK Optimizado):** El APK para Android (`app-release.apk`, ~112 MB) fue generado con `flutter build apk --release`, aplicando un tree-shaking del 99.7% en icon fonts (`CupertinoIcons` y `MaterialIcons`), eliminando código muerto y reduciendo el footprint de memoria.

### 3.2. Servidor Seguro y Monitoreo (Azure)
*   **Alojamiento:** Desplegado en una Máquina Virtual de **Microsoft Azure** (Región: Mexico Central) con IP pública dedicada `158.23.164.47` y FQDN `plataforma-atlan.mexicocentral.cloudapp.azure.com`.
*   **Usuario Estándar No-Root:**
    - Dentro del contenedor Docker, la aplicación corre bajo el usuario sin privilegios `nextjs:nodejs` (UID/GID 1001), eliminando riesgos de escalada de privilegios.
    - La administración del servidor host en Azure se realiza mediante un usuario estándar con privilegios `sudo`, bloqueando inicios de sesión directos como `root`.
*   **Monitoreo Básico del Sistema:**
    - **Monitoreo en vivo de contenedores:** Comando `docker stats` para auditar uso de CPU, consumo de memoria RAM, operaciones de E/S y tráfico de red por contenedor.
    - **Auditoría de logs:** Supervisión centralizada mediante `docker compose logs -f proxy` y `docker compose logs -f app`.
    - **Métricas de Azure Monitor:** Supervisión desde el Portal de Azure con alertas sobre métricas de host (*Percentage CPU*, *Network In/Out*, *Disk Read/Write Bytes*).

### 3.3. Proxy Inverso Seguro (Nginx)
*   **Aislamiento del Código Fuente:** El puerto `3000` de Next.js **nunca se expone a internet**; permanece cerrado en el firewall del host y solo es accesible dentro de la red privada de Docker mediante la directiva `expose: "3000"`.
*   **Punto de Acceso Único:** Solo el contenedor Nginx expone los puertos `80` (HTTP) y `443` (HTTPS) hacia la red pública.
*   **Cabeceras de Protección del Servidor:** Nginx incluye `server_tokens off;` para ocultar la versión instalada y mitigar ataques dirigidos.

### 3.4. Contenedores y Aislamiento (Docker)
*   **Construcción en 3 Etapas (Multi-Stage Build):**
    1.  `deps`: Instala únicamente las dependencias de producción y desarrollo necesarias para el empaquetado (`npm ci`).
    2.  `builder`: Compila el código Next.js inyectando los argumentos de variables de entorno públicas y generando el bundle standalone.
    3.  `runner`: Imagen mínima basada en Alpine Linux (`node:20-alpine`) que contiene solo los archivos compilados, reduciendo la superficie de ataque y el peso final.
*   **Orquestación:** Configurada en [docker-compose.yml](file:///c:/Users/Alucard/plataforma-atlan/docker-compose.yml) con una red interna bridge (`atlan-network`), garantizando que la base de datos externa y los servicios se comuniquen de forma aislada.

### 3.5. Seguridad, Variables Ocultas y CORS
*   **Gestión de Credenciales:** Todas las claves maestras y tokens sensibles residen en el archivo `.env`, excluido estrictamente del control de versiones mediante `.gitignore` y `.dockerignore`.
*   **Configuración de CORS:**
    - En [next.config.mjs](file:///c:/Users/Alucard/plataforma-atlan/next.config.mjs) y [nginx/nginx.conf](file:///c:/Users/Alucard/plataforma-atlan/nginx/nginx.conf) para rutas `/api/*`.
    - Soporte completo de pre-flight requests para solicitudes HTTP `OPTIONS`, retornando status `204 No Content` con cabeceras `Access-Control-Allow-Origin: *` y métodos autorizados (`GET, POST, PUT, DELETE, PATCH, OPTIONS`).

### 3.6. Rendimiento y Alta Disponibilidad
*   **Dominio en Línea:** Acceso ininterrumpido en `https://plataforma-atlan.mexicocentral.cloudapp.azure.com`.
*   **Políticas de Auto-Recuperación:** Todos los contenedores cuentan con la directiva `restart: unless-stopped`, garantizando que ante cualquier fallo imprevisto o reinicio del servidor de Azure, la plataforma se restaure automáticamente en segundos.
*   **Rendimiento SSR + Client:** Optimización de hidratación en la Home (`VideoIntro`), evitando parpadeos de carga y desajustes de estado.

### 3.7. Seguridad HTTPS y Certificados SSL
*   **Candado de Seguridad Activo:** Certificado SSL/TLS emitido por la autoridad certificadora **Let's Encrypt**.
*   **Redirección Forzosa:** Redirección automática permanente de cualquier petición HTTP en el puerto 80 hacia el puerto seguro 443:
    ```nginx
    server {
        listen 80;
        server_name plataforma-atlan.mexicocentral.cloudapp.azure.com;
        return 301 https://plataforma-atlan.mexicocentral.cloudapp.azure.com$request_uri;
    }
    ```
*   **Cifrado Robusto:** Soporte exclusivo para protocolos TLSv1.2 y TLSv1.3 con suites de cifrado de alta seguridad (`HIGH:!aNULL:!MD5`).

### 3.8. Flujo Automático y Pantallas de Error Amigables
El sistema guía al usuario de inicio a fin sin exponer fallos técnicos, códigos de excepción ni volcados de base de datos:
*   **Error 404 (Destino No Encontrado):** Implementado en [src/app/not-found.js](file:///c:/Users/Alucard/plataforma-atlan/src/app/not-found.js). Muestra un diseño oscuro con detalles dorados, el logo de Atlan, un mensaje cálido (*"¡Ups! Este rincón aún no está en el mapa"*) y botones para regresar al inicio o explorar el mapa.
*   **Error 500 / Runtime:** Implementado en [src/app/error.js](file:///c:/Users/Alucard/plataforma-atlan/src/app/error.js). Captura excepciones de React de forma amigable (*"Ocurrió una pausa en el camino"*), ofreciendo reintentar la acción o volver al inicio sin revelar stack traces.
*   **Error 50X en Proxy Nginx:** Implementado en [nginx/50x.html](file:///c:/Users/Alucard/plataforma-atlan/nginx/50x.html) y montado en el contenedor Nginx para presentar una pantalla de mantenimiento institucional si la aplicación se encuentra reiniciándose.

### 3.9. Integraciones Complejas (JWT, Supabase, OAuth, Mapbox)
*   **Tokens JWT & RLS:** Gestión de sesiones autenticadas mediante tokens firmados por Supabase Auth, evaluados dinámicamente mediante políticas RLS en PostgreSQL.
*   **Google OAuth:** Extracción transparente de nombre, apellido y avatar de `user_metadata` con sincronización inmediata a la tabla de `perfiles`.
*   **Mapbox GL Native & JS:** Carga de mapas vectoriales interactivos con cálculo de direcciones y rutas en tiempo real.
*   **WebSockets Realtime:** Canal de chat privado y notificaciones en vivo mediante suscripciones reactivas a PostgreSQL.

### 3.10. Vinculación con GitHub y Despliegue Continuo
*   **Repositorio Oficial:** `https://github.com/VladAlucardX/PlataformaAtlan.git`
*   **Estrategia de Ramas:**
    - `develop`: Rama activa de integración continua y desarrollo de funcionalidades.
    - `main`: Rama de producción estable. El código ejecutándose en la máquina de Azure es una réplica exacta de esta rama.
*   **Procedimiento de Actualización en Servidor:**
    ```bash
    cd /home/azureuser/plataforma-atlan
    git pull origin main
    docker compose up -d --build
    ```

---

## 4. Tecnologías Utilizadas y Dependencias

### Pila Web (`package.json`)

```json
{
  "dependencies": {
    "next": "16.2.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "@supabase/supabase-js": "^2.105.4",
    "mapbox-gl": "^3.23.1",
    "@mapbox/mapbox-gl-directions": "^4.3.1",
    "supercluster": "^9.1.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.6"
  }
}
```

### Pila Móvil (`mobile/pubspec.yaml`)

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
  flutter_inappwebview: ^6.1.5
  cached_network_image: ^3.4.1
  flutter_animate: ^4.5.2
  video_player: ^2.9.5
  image_picker: ^1.1.2
```

---

## 5. Estructura Modular del Proyecto

```text
plataforma-atlan/
├── Dockerfile                            # Multi-stage build optimizado (deps, builder, runner)
├── docker-compose.yml                    # Orquestación de app y proxy Nginx en red privada
├── .dockerignore                         # Exclusiones de contexto para builds de Docker
├── .gitignore                            # Exclusión de credenciales (.env) y cachés
├── next.config.mjs                       # Configuración Next.js (output standalone, CORS, headers)
├── package.json                          # Scripts y dependencias del ecosistema Web
│
├── nginx/                                # CONFIGURACIÓN DE PROXY INVERSO
│   ├── nginx.conf                        # Proxy SSL Let's Encrypt, CORS, WebSockets y Gzip
│   └── 50x.html                          # Pantalla amigable de error 50X para usuarios
│
├── public/                               # RECURSOS ESTÁTICOS, GEOJSON Y PWA
│   ├── icon.png & icon-512.png           # Isotipo oficial de la plataforma Atlan
│   ├── manifest.json                     # Manifiesto Web App e íconos instalables
│   ├── sw.js                             # Service Worker para caché offline
│   ├── nicaragua-departments.json        # Polígonos GeoJSON de los 17 departamentos
│   ├── nicaragua-department-centroids.json # Centroides departamentales para zoom y etiquetas
│   └── outside-nicaragua-mask.json       # Máscara visual de delimitación territorial
│
├── src/                                  # APLICACIÓN WEB (NEXT.JS 16)
│   ├── app/                              # Rutas del App Router
│   │   ├── admin/                        # Panel de aprobación de negocios y guías
│   │   ├── chat/                         # Mensajería directa entre usuarios (Realtime)
│   │   ├── comunidad/                    # Feed social, publicaciones y perfiles
│   │   ├── dashboard/                    # Gestión multi-negocio para propietarios
│   │   ├── departamentos/                # Ranking de exploradores y validación GPS
│   │   ├── guias/ & perfil-guia/         # Catálogo y contacto de Guías INTUR
│   │   ├── login/ & registro/            # Flujos de autenticación local y Google OAuth
│   │   ├── mapa/                         # Vista de mapa turístico a pantalla completa
│   │   ├── not-found.js                  # Pantalla de error 404 personalizada y amigable
│   │   ├── error.js                      # Error Boundary para excepciones en tiempo de ejecución
│   │   ├── globals.css                   # Estilos visuales neón, glassmorphism y paleta oro
│   │   └── page.js                       # Portada y landing page principal
│   │
│   ├── components/                       # Componentes React reutilizables
│   │   ├── MapaTuristico.js              # Integración de mapas vectoriales Mapbox GL
│   │   ├── VideoIntro.js                 # Introducción audiovisual interactiva
│   │   └── ui/                           # Modales, Navbar, ChatWidget y Signs
│   │
│   ├── hooks/                            # Custom Hooks (useInactivityLogout, useStories)
│   └── lib/                              # Servicios auxiliares (AuthContext, i18n, Supabase)
│
├── mobile/                               # APLICACIÓN MÓVIL (FLUTTER MONOREPO)
│   ├── android/                          # Proyecto nativo Android
│   │   └── app/src/main/res/             # Íconos oficiales de la app (mdpi a xxxhdpi y round)
│   ├── assets/                           # Recursos gráficos nativos
│   │   └── images/logo_atlan.png         # Emblema heráldico de la aplicación
│   ├── build/app/outputs/flutter-apk/    # Binarios APK de producción (app-release.apk)
│   ├── lib/                              # Código Dart (Riverpod, GoRouter, Mapbox, WebView)
│   └── pubspec.yaml                      # Configuración y dependencias nativas
│
└── README_TECNICO.md                     # Documentación técnica completa del sistema
```

---

## 6. Variables de Entorno

### Configuración Web (`.env` / `.env.local`)

```env
# Conexión con Supabase BaaS
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave pública de Mapbox GL JS
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibWFwYm94dXNlciIsImEiOiJjb...
```

### Configuración Móvil (`mobile/.env`)

```env
# Supabase para Flutter
SUPABASE_URL=https://<tu-proyecto>.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapbox Native SDK
MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoibWFwYm94dXNlciIsImEiOiJjb...

# URL del servidor en producción para navegación y WebView
WEB_APP_URL=https://plataforma-atlan.mexicocentral.cloudapp.azure.com
```

---

## 7. Manual de Instalación y Ejecución Local

### Requisitos
*   Node.js v20 LTS o superior.
*   npm v9 o superior.
*   Flutter SDK v3.10 o superior (si se desea ejecutar el cliente móvil).

### Pasos para la Aplicación Web

```bash
# 1. Clonar el repositorio
git clone https://github.com/VladAlucardX/PlataformaAtlan.git
cd plataforma-atlan

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo local
npm run dev
```
La aplicación web se ejecutará en `http://localhost:3000`.

---

## 8. Manual de Despliegue en Producción (Azure VM)

Para desplegar o actualizar el sistema en la máquina virtual de Azure con Docker y Nginx:

### 1. Conexión SSH al Servidor
```bash
ssh azureuser@plataforma-atlan.mexicocentral.cloudapp.azure.com
```

### 2. Clonación o Actualización del Repositorio
```bash
cd /home/azureuser/plataforma-atlan
git checkout main
git pull origin main
```

### 3. Configurar Variables de Entorno
Asegurarse de que el archivo `.env` contenga las claves de producción:
```bash
nano .env
```

### 4. Construcción y Lanzamiento con Docker Compose
```bash
# Compilar imágenes y levantar contenedores en segundo plano
docker compose up -d --build
```

### 5. Verificación y Monitoreo
```bash
# Verificar estado de los contenedores
docker compose ps

# Monitorear consumo de recursos en tiempo real
docker stats

# Inspeccionar logs en vivo de Nginx
docker compose logs -f proxy

# Inspeccionar logs de la aplicación Next.js
docker compose logs -f app
```

---

## 9. Distribución y Compilación del APK Móvil

La aplicación móvil nativa de Atlan cuenta con su instalador de producción optimizado para Android con el isotipo oficial adaptativo.

### Compilar el APK de Producción

1. Ingresar a la carpeta móvil:
   ```bash
   cd mobile
   ```
2. Asegurar dependencias actualizadas:
   ```bash
   flutter pub get
   ```
3. Ejecutar la compilación release:
   ```bash
   flutter build apk --release
   ```

### Ubicación del Archivo Generado

El instalador final compilado se genera en:
```text
mobile/build/app/outputs/flutter-apk/app-release.apk
```
*   **Peso aproximado:** ~112 MB.
*   **Compatibilidad:** Android 6.0 (API 23) en adelante.
*   **Resoluciones de ícono soportadas:** `mipmap-mdpi` (48px), `hdpi` (72px), `xhdpi` (96px), `xxhdpi` (144px), `xxxhdpi` (192px) e íconos circulares (`android:roundIcon`).

---

## 10. Consultas de Ejemplo y Funciones Backend (RPC)

### 10.1. Cálculo Geoespacial Haversine (RPC en Supabase)

Llamada a la función PL/pgSQL en base de datos para recuperar destinos turísticos en un radio dinámico:

```javascript
import { supabase } from '@/lib/supabase';

const { data: lugaresCercanos, error } = await supabase.rpc('buscar_puntos_cercanos', {
  lat_usuario: 12.136389,
  lng_usuario: -86.251389,
  radio_km: 25
});
```

### 10.2. Registro de Visita Validada por GPS (Check-In)

```javascript
const { data: visita, error } = await supabase
  .from('visitas_puntos')
  .insert([
    {
      usuario_id: user.id,
      departamento: 'Rivas',
      punto_id: 8,
      fecha_visita: new Date().toISOString()
    }
  ]);
```

### 10.3. Mensajería en Tiempo Real (WebSockets Realtime)

```javascript
const canalChat = supabase
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
      console.log('Mensaje recibido instantáneamente:', payload.new);
    }
  )
  .subscribe();
```

---

## 11. Solución de Problemas (Troubleshooting)

*   **Error de Certificado SSL / Puerto 443:** Confirmar que los certificados de Let's Encrypt existan en `/etc/letsencrypt/live/plataforma-atlan.mexicocentral.cloudapp.azure.com/` en el host de Azure y que el puerto 443 esté abierto en el grupo de seguridad de red (NSG) de Azure.
*   **Fallo al conectar con la base de datos:** Revisar que la variable `NEXT_PUBLIC_SUPABASE_URL` en `.env` coincida exactamente con la URL del proyecto activo de Supabase.
*   **Permisos de GPS en el Móvil:** Si la validación de check-in falla en Android, asegurarse de que el usuario haya otorgado permisos de ubicación precisa (`ACCESS_FINE_LOCATION`) desde los ajustes del sistema operativo.
*   **Refresco de Caché en Contenedores:** Para forzar una recreación limpia de la imagen Docker en Azure:
    ```bash
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    ```
