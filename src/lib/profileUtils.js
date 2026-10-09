// Helper para resolver el nombre visible real de un usuario (Google OAuth, metadatos o perfil)
export function resolveUserDisplayName(perfil, user = null) {
  // 1. Nombre directo en perfil de base de datos
  const perfilNombre = perfil?.nombre_completo || perfil?.nombre || perfil?.full_name;
  if (perfilNombre && typeof perfilNombre === "string") {
    const trimmed = perfilNombre.trim();
    if (
      trimmed &&
      trimmed.toLowerCase() !== "usuario" &&
      trimmed.toLowerCase() !== "usuario atlan"
    ) {
      return trimmed;
    }
  }

  // 2. Metadatos de Google OAuth o Supabase Auth (del objeto user o anidado en perfil)
  const meta = user?.user_metadata || perfil?.user_metadata || {};
  const metaName =
    meta.nombre_completo ||
    meta.full_name ||
    meta.name ||
    (meta.given_name ? `${meta.given_name} ${meta.family_name || ""}`.trim() : null);

  if (metaName && typeof metaName === "string" && metaName.trim()) {
    const trimmedMeta = metaName.trim();
    if (
      trimmedMeta.toLowerCase() !== "usuario" &&
      trimmedMeta.toLowerCase() !== "usuario atlan"
    ) {
      return trimmedMeta;
    }
  }

  // 3. Extraer del email (ej: "alucard" de "alucard@gmail.com")
  const email = perfil?.email || user?.email;
  if (email && typeof email === "string" && email.includes("@")) {
    const cleanEmail = email.split("@")[0].trim();
    if (cleanEmail) {
      // Capitalizar primer caracter (ej: "carlos" -> "Carlos")
      return cleanEmail.charAt(0).toUpperCase() + cleanEmail.slice(1);
    }
  }

  // 4. Si había un nombre no vacío aunque fuese default
  if (perfilNombre && typeof perfilNombre === "string" && perfilNombre.trim()) {
    return perfilNombre.trim();
  }

  return "Usuario";
}

// Helper para resolver el avatar real de un usuario (Google OAuth o base de datos)
export function resolveUserAvatar(perfil, user = null) {
  return (
    perfil?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    perfil?.user_metadata?.avatar_url ||
    perfil?.user_metadata?.picture ||
    null
  );
}

// Helper para generar URLs amigables de perfil de usuario (ej: /comunidad/perfil/alucard en lugar de UUID)
export function getProfileSlug(perfil, user = null) {
  if (!perfil && !user) return "";
  const name = resolveUserDisplayName(perfil, user);
  if (name && name.toLowerCase() !== "usuario") {
    const slug = name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // eliminar tildes
      .replace(/[^a-z0-9]+/g, "-")     // reemplazar caracteres especiales con guion
      .replace(/^-+|-+$/g, "");        // limpiar guiones en bordes
    if (slug) return slug;
  }
  return perfil?.id || user?.id || "";
}

