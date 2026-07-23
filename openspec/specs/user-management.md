# OpenSpec: Administración de Usuarios y Rutas Autenticadas

## Propósito
Proporcionar una interfaz administrativa completa para gestionar el ciclo de vida de los usuarios del sistema, sus roles, los registros de auditoría de accesos y la visualización de la sesión del usuario.

## Requerimientos

### 1. Panel de Control y Navegación Dinámica (Shell)
- **Ruta**: `/` (Dashboard/Inicio).
- El sistema MUST usar un `ModuleRegistry` dinámico para construir la barra de navegación lateral en `NeutralShell`.
- Los módulos registrados independientes son:
  - **Dashboard**: En la sección "Principal".
  - **Usuarios, Roles, Auditoría**: En la sección "Administración".
  - **Notes (Reference)**: En la sección "Modules".

### 2. ABM de Usuarios (CRUD)
- **Ruta**: `/user`.
- Debe renderizar el componente `UsersTab` que se conecta a los endpoints del BFF `/api/users/users` y `/api/users/roles`.
- Funcionalidades requeridas:
  - Listado de usuarios activos e inactivos.
  - Creación de nuevo usuario (nombre completo, email, selección de rol).
  - Modificación de datos del usuario.
  - Activación/Desactivación individual y masiva (bulk actions).
  - Reinicio de contraseña desde la perspectiva del administrador.

### 3. Visualización de Roles
- **Ruta**: `/role`.
- Debe mostrar todos los roles configurados en la base de datos obtenidos de `/api/users/roles`.
- Para cada rol, debe listar sus permisos asociados (objeto JSON de permisos parsed).

### 4. Auditoría de Accesos
- **Ruta**: `/auditlog`.
- Debe listar el historial de eventos de auditoría (ingresos, cambios, acciones) llamando al BFF `/api/users/audit-logs`.

### 5. Configuración de Perfil
- **Ruta**: `/perfil`.
- Permite modificar la información del perfil del usuario autenticado (avatar, biografía, preferencias de visualización).

---

## Escenarios de Prueba (Gherkin)

### Escenario: Carga exitosa del menú lateral modular
- **GIVEN** un usuario autenticado con permisos de administración
- **WHEN** accede a cualquier ruta interna (`/`)
- **THEN** la barra de navegación MUST renderizar las opciones: "Dashboard", "Usuarios", "Roles", "Auditoría" y "Notes"

### Escenario: Registro de nuevo usuario
- **GIVEN** un administrador en la página de usuarios `/user`
- **WHEN** completa el formulario de alta con datos válidos y guarda
- **THEN** el sistema envía la petición POST `/api/users/users`
- **AND** el usuario es guardado con estado activo
- **AND** se crea una entrada en los registros de auditoría para la acción "CREATE"
