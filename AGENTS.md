<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Workflow & Conventional Commits Protocol (Plataforma Atlan)

All agents and developers working on this repository MUST adhere strictly to the following workflow:

## 1. Branch Architecture
- `main`: **Production Branch.** Contains stable, deployed code. Direct commits to `main` are strictly forbidden.
- `develop`: **Active Development Branch.** Main active branch where all work is implemented directly.

## 2. Task Execution Protocol
1. Stay on `develop` branch and pull latest updates: `git checkout develop && git pull origin develop`
2. Implement code changes directly on `develop` (DO NOT create `feature/*` or `fix/*` branches unless explicitly instructed by the user).
3. Format commit message using Conventional Commits: `git commit -m "tipo(scope): descripción"`.
4. Push directly to remote `develop`: `git push origin develop`.

## 3. Conventional Commit Standard
Structure: `tipo(alcance): descripción imperativa corta`
Types:
- `feat`: Nueva funcionalidad o capacidad para el usuario.
- `fix`: Corrección de errores o soluciones a bugs.
- `docs`: Cambios únicamente en documentación o comentarios.
- `style`: Ajustes estéticos, formato o CSS sin alterar lógica.
- `refactor`: Reestructuración de código sin cambiar comportamiento.
- `chore`: Tareas de mantenimiento, dependencias o configuración.
