-- Script SQL para la plataforma Atlan
-- Tabla: guias_turisticos

CREATE TABLE IF NOT EXISTS public.guias_turisticos (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nombre_completo TEXT,
    avatar_url TEXT,
    departamento_principal TEXT DEFAULT 'León',
    especialidad TEXT DEFAULT 'Senderismo y Volcanes',
    idiomas TEXT DEFAULT 'Español, Inglés',
    experiencia_anios INT DEFAULT 5,
    tarifa_aprox TEXT DEFAULT '$30 - $50 / día',
    biografia TEXT,
    telefono_contacto TEXT,
    whatsapp TEXT,
    instagram TEXT,
    licencia_intur TEXT,
    galeria_fotos JSONB DEFAULT '[]'::jsonb,
    destinos_mapa JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.guias_turisticos ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
DROP POLICY IF EXISTS "Permitir lectura publica a guias_turisticos" ON public.guias_turisticos;
CREATE POLICY "Permitir lectura publica a guias_turisticos" 
ON public.guias_turisticos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir a guias actualizar su propio perfil" ON public.guias_turisticos;
CREATE POLICY "Permitir a guias actualizar su propio perfil" 
ON public.guias_turisticos FOR ALL USING (auth.uid() = id);
