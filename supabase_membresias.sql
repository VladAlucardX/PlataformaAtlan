-- Script SQL para la plataforma Atlan
-- Membresía "Tuani Pro" (cobro manual por transferencia + cortesías del admin)
-- Ejecutar completo en Supabase > SQL Editor.

-- 1. Historial de membresías: una fila por pago o cortesía
CREATE TABLE IF NOT EXISTS public.membresias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'tuani_pro',
    origen TEXT NOT NULL DEFAULT 'pago' CHECK (origen IN ('pago', 'cortesia')),
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
    monto NUMERIC(8,2) DEFAULT 6.00,
    meses INT NOT NULL DEFAULT 1,
    dias_otorgados INT,
    metodo_pago TEXT,
    referencia TEXT,
    comprobante_url TEXT,
    notas TEXT,
    motivo_rechazo TEXT,
    revisado_por UUID REFERENCES auth.users(id),
    revisado_en TIMESTAMP WITH TIME ZONE,
    inicia_en TIMESTAMP WITH TIME ZONE,
    vence_en TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membresias_usuario_idx ON public.membresias (usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS membresias_estado_idx ON public.membresias (estado);

-- 2. Vencimiento vigente denormalizado en perfiles (lo lee todo el sistema sin joins)
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS membresia_vence_en TIMESTAMP WITH TIME ZONE;

-- 3. Un usuario NO puede modificar su propio vencimiento: solo service_role / SQL Editor
CREATE OR REPLACE FUNCTION public.proteger_membresia_vence_en()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.membresia_vence_en IS DISTINCT FROM OLD.membresia_vence_en
       AND auth.uid() IS NOT NULL THEN
        NEW.membresia_vence_en := OLD.membresia_vence_en;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_proteger_membresia_vence_en ON public.perfiles;
CREATE TRIGGER trg_proteger_membresia_vence_en
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.proteger_membresia_vence_en();

-- 4. RLS
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios ven sus membresias" ON public.membresias;
CREATE POLICY "Usuarios ven sus membresias"
ON public.membresias FOR SELECT
USING (
    auth.uid() = usuario_id
    OR EXISTS (SELECT 1 FROM public.perfiles p WHERE p.id = auth.uid() AND p.rol = 'admin')
);

-- Un usuario solo puede crear solicitudes PENDIENTES de pago para sí mismo
DROP POLICY IF EXISTS "Usuarios solicitan membresia" ON public.membresias;
CREATE POLICY "Usuarios solicitan membresia"
ON public.membresias FOR INSERT
WITH CHECK (
    auth.uid() = usuario_id
    AND estado = 'pendiente'
    AND origen = 'pago'
);

-- Aprobar/rechazar/cortesías se hacen vía /api/membresia (service_role), sin políticas de UPDATE/DELETE.

-- 5. Recargar caché de esquema del servidor API PostgREST
NOTIFY pgrst, 'reload schema';
