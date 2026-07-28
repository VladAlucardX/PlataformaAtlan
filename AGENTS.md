<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Workflow & Conventional Commits Protocol (Plataforma Atlan)

All agents and developers working on this repository MUST adhere strictly to the following workflow:

## 1. Branch Architecture
- `main`: **Production Branch.** Contains stable, deployed code. Direct commits to `main` are strictly forbidden.
- `develop`: **Integration Branch.** Main active development branch where all features converge.
- `feature/<task-name>`: Temporary feature branches created from `develop` for new features (e.g., `feature/filtro-mapa`).
- `fix/<task-name>`: Temporary bugfix branches created from `develop` for fixing issues (e.g., `fix/navegacion-gps`).

## 2. Task Execution Steps
1. Checkout `develop` and pull latest updates: `git checkout develop && git pull origin develop`
2. Create feature branch: `git checkout -b feature/<nombre-tarea>`
3. Implement code changes.
4. Format commit message using Conventional Commits: `git commit -m "tipo(scope): descripción"`
5. Push feature branch to remote GitHub: `git push -u origin feature/<nombre-tarea>`
6. Create Pull Request (PR) from `feature/<nombre-tarea>` into `develop`.
7. Merge `develop` into `main` via PR when ready for release to production.

## 3. Conventional Commit Standard
Structure: `tipo(alcance): descripción imperativa corta`
Types:
- `feat`: Nueva funcionalidad o capacidad para el usuario.
- `fix`: Corrección de errores o soluciones a bugs.
- `docs`: Cambios únicamente en documentación o comentarios.
- `style`: Ajustes estéticos, formato o CSS sin alterar lógica.
- `refactor`: Reestructuración de código sin cambiar comportamiento.
- `chore`: Tareas de mantenimiento, dependencias o configuración.
