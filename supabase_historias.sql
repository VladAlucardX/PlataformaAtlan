-- =====================================================================
-- ATLAN · HISTORIAS (videos de hasta 30 s que duran 24 horas)
-- Ejecutar UNA vez en: Supabase Dashboard > SQL Editor > New query > Run
-- Es seguro volver a ejecutarlo (usa IF NOT EXISTS / OR REPLACE).
-- =====================================================================

-- 1. Tabla principal de historias ---------------------------------------
CREATE TABLE IF NOT EXISTS public.historias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  video_url       text NOT NULL,
  storage_path    text,
  miniatura_url   text,
  miniatura_path  text,
  duracion_seg    numeric(5,1) CHECK (duracion_seg IS NULL OR duracion_seg <= 31),
  texto           text CHECK (texto IS NULL OR char_length(texto) <= 140),
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS historias_usuario_idx ON public.historias (usuario_id, created_at DESC);
CREATE INDEX IF NOT EXISTS historias_expires_idx ON public.historias (expires_at);

-- 2. Quién vio cada historia ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.historias_vistas (
  historia_id uuid NOT NULL REFERENCES public.historias(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES public.perfiles(id)  ON DELETE CASCADE,
  visto_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (historia_id, usuario_id)
);

-- 3. Reacciones (solo se cuentan; una por usuario por historia) -------------
CREATE TABLE IF NOT EXISTS public.historias_reacciones (
  historia_id uuid NOT NULL REFERENCES public.historias(id) ON DELETE CASCADE,
  usuario_id  uuid NOT NULL REFERENCES public.perfiles(id)  ON DELETE CASCADE,
  emoji       text NOT NULL CHECK (emoji IN ('❤️','😂','😮','🔥','👏')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (historia_id, usuario_id)
);

-- 4. Los comentarios a una historia llegan como mensaje privado ---------------
ALTER TABLE public.mensajes
  ADD COLUMN IF NOT EXISTS historia_id uuid REFERENCES public.historias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS historia_miniatura_url text,
  ADD COLUMN IF NOT EXISTS es_respuesta_historia boolean NOT NULL DEFAULT false;

-- 5. Seguridad (RLS) ---------------------------------------------------------
ALTER TABLE public.historias            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias_vistas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historias_reacciones ENABLE ROW LEVEL SECURITY;

-- Historias: todo usuario registrado ve las NO vencidas. Solo el dueño publica.
-- No hay política de DELETE/UPDATE: el dueño borra con eliminar_historia().
DROP POLICY IF EXISTS "historias_select_vigentes" ON public.historias;
CREATE POLICY "historias_select_vigentes" ON public.historias
  FOR SELECT TO authenticated
  USING (expires_at > now());

DROP POLICY IF EXISTS "historias_insert_propias" ON public.historias;
CREATE POLICY "historias_insert_propias" ON public.historias
  FOR INSERT TO authenticated
  WITH CHECK (
    usuario_id = auth.uid()
    AND expires_at <= now() + interval '24 hours 5 minutes'
  );

-- Vistas: cada quien registra y lee las suyas; el dueño de la historia ve todas.
DROP POLICY IF EXISTS "vistas_insert_propias" ON public.historias_vistas;
CREATE POLICY "vistas_insert_propias" ON public.historias_vistas
  FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "vistas_select" ON public.historias_vistas;
CREATE POLICY "vistas_select" ON public.historias_vistas
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.historias h WHERE h.id = historia_id AND h.usuario_id = auth.uid())
  );

-- Reacciones: cada quien gestiona la suya; el dueño de la historia las cuenta.
DROP POLICY IF EXISTS "reacciones_select" ON public.historias_reacciones;
CREATE POLICY "reacciones_select" ON public.historias_reacciones
  FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.historias h WHERE h.id = historia_id AND h.usuario_id = auth.uid())
  );

DROP POLICY IF EXISTS "reacciones_insert" ON public.historias_reacciones;
CREATE POLICY "reacciones_insert" ON public.historias_reacciones
  FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "reacciones_update" ON public.historias_reacciones;
CREATE POLICY "reacciones_update" ON public.historias_reacciones
  FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "reacciones_delete" ON public.historias_reacciones;
CREATE POLICY "reacciones_delete" ON public.historias_reacciones
  FOR DELETE TO authenticated USING (usuario_id = auth.uid());

-- 6. Borrar una historia propia antes de las 24 h ------------------------------
-- La marca como vencida; los archivos y filas se limpian en /api/historias/limpiar
CREATE OR REPLACE FUNCTION public.eliminar_historia(p_historia_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.historias
     SET expires_at = now()
   WHERE id = p_historia_id
     AND usuario_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.eliminar_historia(uuid) TO authenticated;
