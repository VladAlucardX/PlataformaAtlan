# ==========================================
# Etapa 1: Instalación de dependencias
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar manifiestos de paquetes
COPY package.json package-lock.json* ./

# Instalar dependencias limpias
RUN npm ci

# ==========================================
# Etapa 2: Construcción (Builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Argumentos de compilación para variables públicas de Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_MAPBOX_TOKEN

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compilar proyecto Next.js
RUN npm run build

# ==========================================
# Etapa 3: Entorno de Ejecución (Runner Seguro No-Root)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear grupo y usuario estándar del sistema (NO-ROOT) para máxima seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos públicos estáticos
COPY --from=builder /app/public ./public

# Crear directorio .next y ajustar permisos para el usuario nextjs
RUN mkdir .next && chown nextjs:nodejs .next

# Copiar archivos de compilación standalone generados por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar al usuario estándar no privilegiado
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
