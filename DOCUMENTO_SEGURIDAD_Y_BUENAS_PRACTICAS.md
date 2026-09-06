# Justificación Técnica: Seguridad, Buenas Prácticas y Arquitectura en Plataforma Atlan

**Proyecto:** Plataforma Atlan  
**Fecha:** 5 de Septiembre, 2026  
**Documento:** Informe de Seguridad, Manejo de Estado y Desarrollo Seguro  

---

## 📋 Resumen Ejecutivo

Este documento justifica las políticas, patrones de arquitectura y mecanismos de seguridad implementados en la **Plataforma Atlan**. El desarrollo ha sido concebido bajo los estándares modernos de desarrollo web, seguridad en la nube (Cloud Security) y cumplimiento de las mejores prácticas de la industria (OWASP, Supabase RLS, Next.js Architecture).

---

## 🛡️ 1. Validación de Entradas (Input Validation & Sanitization)

Para garantizar la integridad de los datos y prevenir vulnerabilidades como **Inyección SQL (SQLi)** y **Cross-Site Scripting (XSS)**, se han aplicado múltiples capas de validación:

* **Validación en Cliente y Servidor:** Todos los formularios de la plataforma (registro, creación de puntos turísticos, reseñas y reservas) cuentan con restricciones de tipo, longitud y formato antes del envío.
* **Filtro de Contenido y Palabras Prohibidas:** Las reseñas y publicaciones procesadas por la comunidad son auditadas contra la tabla de moderación `public.palabras_prohibidas` y restricciones de caracteres (`contenido <= 2000` chars, `comentarios <= 500` chars).
* **Consultas Parametrizadas y PostGIS:** Se eliminan los riesgos de SQL Injection mediante el uso del cliente oficial de Supabase y Procedimientos Almacenados (RPCs) parametrizados en PostgreSQL (`ST_SetSRID`, `ST_MakePoint`, `buscar_puntos_cercanos`).
* **Escape Automático en Renderizado:** El framework React / Next.js sanitiza y escapa automáticamente cualquier cadena ingresada por el usuario en el DOM, evitando la ejecución maliciosa de scripts JS (XSS).

---

## ⚠️ 2. Manejo de Errores (Error Handling & Resiliencia)

La plataforma cuenta con un sistema de gestión de errores defensivo para asegurar una experiencia ininterrumpida y prevenir la fuga de información sensible:

* **Captura Controlada de Excepciones:** Todos los bloques de llamadas asíncronas a APIs o bases de datos están envueltos en estructuras `try/catch/finally` con mensajes de error amigables para el usuario.
* **Protección contra Fuga de Trazas (Stack Traces):** Los errores de base de datos e infraestructura son interceptados en la capa del cliente, evitando exponer nombres de tablas internas, credenciales o estructuras de servidor en la consola pública o interfaz gráfica.
* **Mapeo y Caché de Contingencia (Offline-First):** Ante caídas de red o fallos de conexión a Internet, los hooks del mapa y la aplicación leen de forma transparente del almacenamiento local seguro (`localStorage`), permitiendo que la interfaz siga funcionando sin colapsar.

---

## 🔒 3. Protección de Rutas y Datos: Roles y Permisos (RBAC & RLS)

La seguridad de acceso a la información se maneja tanto en la capa de la Base de Datos como en la capa de Navegación de Next.js:

### A. Row Level Security (RLS) en PostgreSQL
Todas las tablas principales (`perfiles`, `puntos`, `negocios`, `reservas`, `resenas`) tienen habilitado **Row Level Security (RLS)** en Supabase:
* **Lectura pública regulada:** Los puntos turísticos y negocios aprobados son visibles públicamente.
* **Escritura restringida por propietario:** Un usuario solo puede modificar o eliminar sus propios datos utilizando la función estricta `auth.uid() = usuario_id`.

### B. Control de Acceso Basado en Roles (RBAC)
Los usuarios están segmentados mediante roles definidos en la base de datos:
* `turista`: Navegación, creación de reseñas, guardado de favoritos y reservas.
* `dueno`: Gestión de perfil comercial, menú de productos y recepción de reservas.
* `guia` / `guia_turistico`: Perfil profesional de turismo y gestión de tours.
* `admin`: Moderación global, aprobación de puntos turísticos y administración del sistema.

### C. Protección de Rutas (Guards & Middleware)
El contexto de autenticación (`AuthContext.js`) y componentes contenedores validan la sesión activa y el rol requerido antes de permitir el acceso a rutas privadas como `/dashboard`, `/perfil` o `/admin`.

---

## 💻 4. Desarrollo Seguro (Secure Software Development)

El ciclo de vida del desarrollo se adhiere a los principios de **Seguridad desde el Diseño (Security by Design)**:

* **Aislamiento de Variables de Entorno:** Las claves maestras (`SERVICE_ROLE_KEY`) se mantienen estrictamente del lado del servidor. Únicamente las llaves públicas limitadas por anon/RLS (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) son expuestas al cliente.
* **Protocolos de Transmisión Segura:** Toda la comunicación entre cliente, servidor de Next.js y Supabase se realiza exclusivamente bajo cifrado **TLS/HTTPS** (HTTPS + WSS).
* **Políticas CORS:** Los endpoints y servicios RPC están configurados para aceptar peticiones autorizadas únicamente desde dominios de origen confiables.

---

## 🔑 5. Autenticación de 2 Factores (2FA / MFA)

Para proteger las cuentas de administradores, dueños de negocios y usuarios vulnerables a ataques de fuerza bruta o suplantación de identidad:

* **Soporte Multi-Factor (TOTP / OTP):** Integración nativa con la capa de autenticación de Supabase Auth para habilitar autenticación de dos factores mediante aplicaciones autenticadoras (Google Authenticator, Authy) o códigos SMS/Email OTP.
* **Desafío de Verificación Secundaria:** Acciones críticas (como transferencia de propiedad de un negocio o cambios de credenciales) requieren re-autenticación obligatoria antes de confirmar el cambio en la base de datos.

---

## ⏱️ 6. Manejo de Estados y Expiración de Sesión (Session Lifecycle)

Para prevenir el secuestro de sesión (Session Hijacking) y el acceso no autorizado en dispositivos compartidos:

* **Expiración por Inactividad (`useInactivityLogout`):**
  La plataforma incluye un hook personalizado que monitorea eventos de interacción en tiempo real (`mousemove`, `keydown`, `touchstart`, `scroll`, `click`). Si el usuario permanece inactivo durante **30 minutos**, el sistema finaliza la sesión automáticamente y redirige a la pantalla de login.
* **Rotación de Tokens JWT:** Las sesiones utilizan JSON Web Tokens (JWT) de corta duración con rotación automática de *Refresh Tokens*.
* **Limpieza Segura de Estado (Sanitization on Logout):** Al cerrar sesión (`auth.signOut()`), el sistema destruye los tokens guardados en memoria, borra la caché local de usuario y reinicia el estado global de la aplicación.
