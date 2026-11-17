# AGENTS.md — TaskFlow (`todoList`)

## 1. Reglas de Ahorro de Tokens (Estricto)
- **Respuestas:** En español, directas y de **máximo 3 líneas**. Sin saludos ni explicaciones largas.
- **Cero exploración:** No listes directorios ni busques archivos fuera del mapa. Lee solo archivos mencionados con `@` o implicados directamente en el error.
- **Archivos prohibidos:** NUNCA leas ni modifiques `database/tasks.db`, `public/icons/*`, ni `docs/` salvo orden explícita.
- **Ediciones puntuales:** Muestra/aplica solo los bloques modificados (`diff` o fragmentos), sin reescribir archivos completos innecesariamente.

## 2. Stack y Arquitectura
- **Backend:** PHP 8.0+ puro (`App\` → `src/` mediante autoloader PSR-4 manual en `public/index.php`), PDO + SQLite (`database/tasks.db`). Cero Composer/dependencias.
- **Frontend:** SPA en HTML5 + Tailwind CSS v4 (CDN) + JS Vanilla ES6+ (`type="module"`). PWA (`manifest.css`, `sw.js`).
- **Hosting / Apache:** Despliegue en `htdocs` (InfinityFree). `.htaccess` bloquea `src/`, `database/`, `docs/` y redirige `/api/*` a `public/index.php`.
- **Ejecución local:** `php -S localhost:8000 -t public public/index.php`

## 3. Mapa Exacto del Proyecto
- `.htaccess` -> Rewrites para `htdocs`, bloqueo `403` de carpetas privadas y `ForceType application/manifest+json` para `manifest.css`.
- `public/index.php` -> Front Controller, Router (`regex`), *guards* (sesión + CSRF) y soporte `X-HTTP-Method-Override`.
- `public/index.html` -> Shell SPA (`#auth-view`, `#app-view`), script inline anti-FOUC de tema.
- `public/manifest.css` -> Web App Manifest en JSON puro (extensión `.css` para evadir reto anti-bot `aes.js`).
- `public/sw.js` -> Service Worker (`CACHE_VERSION = 'taskflow-v2'`). **Nunca cachea `/api/`**.
- `public/js/api.js` -> Capa `fetch` (`credentials: 'same-origin'`, `X-CSRF-Token`, `ApiError`). Usa `POST` + `X-HTTP-Method-Override` para `PATCH`/`DELETE`.
- `public/js/ui.js` -> Manipulación segura del DOM (`createElement`/`textContent`, sin `innerHTML` con input de usuario), toasts, tema, Web Animations API.
- `public/js/app.js` -> Estado (`tasks`, `filter`, `query`, `busyIds`), delegación de eventos, UI optimista con rollback, atajos (`N`, `/`, `Ctrl+Enter`, `Esc`).
- `src/Core/Database.php` -> Singleton PDO (`ERRMODE_EXCEPTION`, `EMULATE_PREPARES=false`, `PRAGMA foreign_keys=ON`) + automigración `users` y `tasks`.
- `src/Core/Http.php` -> `Http::json($payload, $status)` y `Http::body()`.
- `src/Core/Session.php` -> Sesiones (`HttpOnly`, `SameSite=Lax`), `session_regenerate_id(true)` en login y validación CSRF con `hash_equals`.
- `src/Controllers/AuthController.php` -> `register`, `login`, `logout`, `me`.
- `src/Controllers/TaskController.php` -> `index`, `store`, `toggle`, `destroy` (usa `user_id` de sesión, nunca del cliente).
- `src/Models/User.php` -> CRUD usuarios (`email` UNIQUE, hash bcrypt max 72 chars).
- `src/Models/Task.php` -> Consultas preparadas filtradas estrictamente por `user_id`.

## 4. Esquema DB y Contratos API
- **SQLite:**
  - `users(id PK, name, email UK, password_hash, created_at)`
  - `tasks(id PK, title, content, completed INTEGER, created_at, user_id FK ON DELETE CASCADE)`
- **Endpoints (`application/json`):**
  - `GET /api/auth/me` -> `{data: user|null, csrf}`
  - `POST /api/auth/register` (`{name, email, password}`) / `POST /api/auth/login` (`{email, password}`) -> `{data: user, csrf}` (exentos de CSRF)
  - `POST /api/auth/logout` -> `{message}` (requiere `X-CSRF-Token`)
  - `GET /api/tasks` -> `{data: Task[]}`
  - `POST /api/tasks` (`{title, content?}`) -> `201 {data: Task}`
  - `PATCH /api/tasks/{id}/toggle` -> `200 {data: Task}` (vía `POST` + `X-HTTP-Method-Override: PATCH`)
  - `DELETE /api/tasks/{id}` -> `200 {message}` (vía `POST` + `X-HTTP-Method-Override: DELETE`)

## 5. Convenciones Obligatorias
- **Separación de capas:** SQL solo en `src/Models/`; validaciones y respuestas HTTP en `src/Controllers/`; `api.js` y `ui.js` nunca se importan entre sí (solo `app.js` los conecta).
- **Seguridad:** Siempre PDO preparado; devolver `404` (no `403`) si una tarea no pertenece al `user_id` en sesión; mantener `manifest.css` con extensión `.css`.
- **Caché PWA:** Si editas `public/index.html`, `public/manifest.css` o `public/js/*`, incrementa `CACHE_VERSION` en `public/sw.js`.