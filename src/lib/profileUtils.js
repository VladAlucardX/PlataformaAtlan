// Helper para generar URLs amigables de perfil de usuario (ej: /comunidad/perfil/alucard en lugar de UUID)
export function getProfileSlug(perfil) {
  if (!perfil) return "";
  if (perfil.nombre_completo) {
    const slug = perfil.nombre_completo
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // eliminar tildes
      .replace(/[^a-z0-9]+/g, "-")     // reemplazar caracteres especiales con guion
      .replace(/^-+|-+$/g, "");        // limpiar guiones en bordes
    if (slug) return slug;
  }
  return perfil.id;
}
