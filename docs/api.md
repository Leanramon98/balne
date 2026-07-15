# API REST - Referencia

## Base URL

```
Development: http://localhost:8080/api
```

## Autenticacion

Todas las rutas excepto `/auth/*` y `/public/*` requieren header:

```
Authorization: Bearer <jwt_token>
```

El JWT contiene: `userID`, `role`, `email`, `destinationID`.

## Endpoints

### Autenticacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /auth/login | Iniciar sesion (email + password) |
| POST | /auth/register | Registro de usuario |
| POST | /auth/forgot-password | Solicitar restablecimiento |
| POST | /auth/reset-password | Restablecer contrasena |

### Health

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /health | Health check del gateway |

### Usuarios (Users Service)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /users | Listar usuarios (Admin) |
| POST | /users | Crear usuario |
| GET | /users/:id | Obtener usuario |
| PUT | /users/:id | Actualizar usuario |
| DELETE | /users/:id | Eliminar usuario |
| PUT | /users/:id/restore-password | Restaurar contrasena |
| GET | /users/access-log | Historial de accesos |

### Catalogos Administrativos

#### Niveles Subnacionales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/subnational-levels | Listar |
| POST | /admin/subnational-levels | Crear |
| GET | /admin/subnational-levels/:id | Obtener |
| PUT | /admin/subnational-levels/:id | Actualizar |
| DELETE | /admin/subnational-levels/:id | Eliminar |

#### Tipologias de Destino

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/typologies | Listar |
| POST | /admin/typologies | Crear |
| GET | /admin/typologies/:id | Obtener |
| PUT | /admin/typologies/:id | Actualizar |
| DELETE | /admin/typologies/:id | Eliminar |

#### Rangos de Poblacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/population-ranges | Listar |
| POST | /admin/population-ranges | Crear |
| GET | /admin/population-ranges/:id | Obtener |
| PUT | /admin/population-ranges/:id | Actualizar |
| DELETE | /admin/population-ranges/:id | Eliminar |

#### Regiones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/regions | Listar |
| POST | /admin/regions | Crear |
| GET | /admin/regions/:id | Obtener |
| PUT | /admin/regions/:id | Actualizar |
| DELETE | /admin/regions/:id | Eliminar |

#### Tipos de Miembro

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/member-types | Listar |
| POST | /admin/member-types | Crear |
| GET | /admin/member-types/:id | Obtener |
| PUT | /admin/member-types/:id | Actualizar |
| DELETE | /admin/member-types/:id | Eliminar |

#### Areas Responsables

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/responsible-areas | Listar |
| POST | /admin/responsible-areas | Crear |
| GET | /admin/responsible-areas/:id | Obtener |
| PUT | /admin/responsible-areas/:id | Actualizar |
| DELETE | /admin/responsible-areas/:id | Eliminar |

#### Ejes / Niveles

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /admin/axes | Listar niveles por eje |
| POST | /admin/axes | Crear nivel |
| GET | /admin/axes/:id | Obtener |
| PUT | /admin/axes/:id | Actualizar |
| DELETE | /admin/axes/:id | Eliminar |

### Ambitos, Requisitos e Indicadores (Read-only)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /scopes | Listar ambitos |
| GET | /requirements | Listar requisitos |
| GET | /indicators | Listar indicadores |
| GET | /scopes/:scopeId/indicators | Indicadores por ambito |

### Destinos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /destinations | Listar destinos |
| POST | /destinations | Crear destino |
| GET | /destinations/:id | Obtener destino |
| PUT | /destinations/:id | Actualizar destino |
| DELETE | /destinations/:id | Eliminar destino |

### Evaluaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /evaluations | Listar evaluaciones |
| POST | /evaluations | Crear evaluacion |
| GET | /evaluations/:id | Obtener evaluacion |
| PUT | /evaluations/:id | Actualizar evaluacion |
| DELETE | /evaluations/:id | Eliminar evaluacion |
| POST | /evaluations/:id/change-status | Cambiar estado |
| POST | /evaluations/:id/promote | Promover al siguiente tipo |

### Accesos a Evaluaciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /evaluations/:id/users | Listar accesos |
| POST | /evaluations/:id/users | Conceder acceso |
| DELETE | /evaluations/:id/users/:userId | Revocar acceso |

### Acciones

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /actions | Listar acciones |
| POST | /actions | Crear accion |
| GET | /actions/:id | Obtener accion |
| PUT | /actions/:id | Actualizar accion |
| DELETE | /actions/:id | Eliminar accion |

### Evidencias de Accion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /actions/:id/evidence | Agregar evidencia |
| GET | /actions/:id/evidence | Listar evidencias |

### Vinculo Accion-Indicador

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /actions/:id/link-indicator | Vincular indicador |
| DELETE | /actions/:id/unlink-indicator/:indicatorId/:evaluationId | Desvincular |

### Buenas Practicas

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| PUT | /actions/:id/designate-good-practice | Designar buena practica |
| PUT | /actions/:id/approve-good-practice | Aprobar/rechazar buena practica |

### Plan de Transformacion DTI

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /dti-plans | Listar planes |
| POST | /dti-plans | Crear plan |
| GET | /dti-plans/:id | Obtener plan |
| PUT | /dti-plans/:id | Actualizar plan |
| DELETE | /dti-plans/:id | Eliminar plan |

### Metas del Plan DTI

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /dti-plans/:id/goals | Agregar meta |
| PUT | /dti-plans/:id/goals/:goalId | Actualizar meta |
| DELETE | /dti-plans/:id/goals/:goalId | Eliminar meta |
| GET | /dti-plans/:id/goals | Listar metas |

### Indicadores de Evaluacion

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /evaluations/:evaluationId/indicators/:id | Obtener valor del indicador |
| PUT | /evaluations/:evaluationId/indicators/:id/value | Guardar valor destino |
| DELETE | /evaluations/:evaluationId/indicators/:id/value | Eliminar valor destino |
| PUT | /evaluations/:evaluationId/indicators/:id/evaluator | Guardar valor evaluador |
| PUT | /evaluations/:evaluationId/indicators/:id/ai | Guardar campos IA |

### Progreso por Ambito

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /evaluations/:id/scopes | Progreso de ambitos |

### Mensajes

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /indicators/:indicatorValueId/messages | Listar mensajes |
| POST | /indicators/:indicatorValueId/messages | Crear mensaje |

### Analisis IA

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /indicators/:id/analyze | Ejecutar analisis IA |

### Resultados

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /results | Resultados comparativos |

### Publico (sin autenticacion)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /public/good-practices | Banco de buenas practicas |

## Estados HTTP

| Codigo | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Creado |
| 400 | Error de validacion |
| 401 | No autenticado |
| 403 | No autorizado (permiso insuficiente) |
| 404 | No encontrado |
| 409 | Conflicto (regla de negocio) |
| 422 | Error de dominio (transicion de estado invalida, etc.) |
| 500 | Error interno |
