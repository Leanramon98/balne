# 🚀 Onboarding — Auto-Insight DTI Platform

Guía completa para levantar el proyecto desde cero. Si algo falla, revisá [Troubleshooting](#troubleshooting).

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Frontend (UI) | Next.js (App Router) + React + TypeScript | 15 / 19 / 5.x |
| Frontend (estilos) | Tailwind CSS + shadcn/ui + Radix UI | latest |
| BFF / Proxy | Next.js API Routes (server-side) | — |
| API Gateway | Go + Echo v4 | 1.24+ |
| Microservicios | Go (hexagonal architecture) | 1.24+ |
| Base de datos | PostgreSQL | 16 |
| Mensajería | RabbitMQ | 3.12 |
| Almacenamiento | MinIO (S3-compatible) | latest |
| Observabilidad | OpenTelemetry + Jaeger + Prometheus | latest |
| Infraestructura | Docker Compose | — |

## Requisitos previos

Instalá todo esto antes de empezar:

| Herramienta | Versión mínima | Verificación |
|------------|---------------|-------------|
| Docker + Docker Compose | latest | `docker --version && docker compose version` |
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Go | 1.24+ | `go version` |

En Linux, agregá tu usuario al grupo `docker` para no usar `sudo` en cada comando:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## Levantar el proyecto (paso a paso)

### 1. Clonar el repo

```bash
git clone <repo-url> auto-insight
cd auto-insight
```

### 2. Configurar variables de entorno

```bash
# Copiá el template de variables
cp workspace/.env.example workspace/.env
```

Para desarrollo local **no necesitás** cambiar nada. Las APIs externas (Resend, DeepL) son opcionales y el sistema funciona sin ellas (solo fallan features específicos como recuperación de contraseña por email o traducción automática).

Si querés habilitarlas, editá `workspace/.env` con tus API keys.

### 3. Levantar infraestructura

Desde la raíz del repo:

```bash
cd workspace
make up
```

Esto levanta en orden:
1. **PostgreSQL 16** — se ejecutan los scripts de init automáticamente (`init_generated.sql` → `init_zz_evaluations.sql` → `init_zzz_seed_data.sql`)
2. **RabbitMQ** — mensajería entre servicios
3. **MinIO** — almacenamiento S3 para evidencias
4. **API Gateway** (:8080) — proxy JWT
5. **Users Service** (:8081) — auth y RBAC
6. **Evaluations Service** (:8082) — lógica de negocio
7. **Frontend** (:3000) — app Next.js
8. **Nginx** (:80) — reverse proxy que unifica todo
9. **Jaeger** (:16686) — tracing
10. **Prometheus** — métricas
11. **OpenTelemetry Collector** — agrega traces

Verificá que todo esté corriendo:

```bash
make ps
```

Deberías ver todos los servicios con estado `Up` o `healthy`.

### 4. Levantar frontend (desarrollo con hot-reload)

Si querés desarrollar el frontend con hot-reload (cambios en vivo):

```bash
cd workspace/frontend
npm install
npm run dev
```

Esto levanta Next.js en modo desarrollo en [http://localhost:3000](http://localhost:3000). El BFF (API proxy) se comunica con el API Gateway en `http://api-gateway:8080` (dentro de la red Docker).

Para desarrollo del backend Go, cada servicio se ejecuta standalone:

```bash
# Evaluations Service
cd workspace/services/evaluations-service
go run ./cmd/

# Users Service
cd workspace/services/users-service
go run ./cmd/
```

Necesitás tener PostgreSQL y RabbitMQ corriendo (el `make up` los levanta aunque reconstruyas los servicios Go).

### 5. Acceder a la app

| URL | Qué es |
|-----|--------|
| [http://localhost](http://localhost) | App completa (recomendado, pasa por Nginx) |
| [http://localhost:3000](http://localhost:3000) | Frontend directo |
| [http://localhost:8080/health](http://localhost:8080/health) | Health check del API Gateway |
| [http://localhost:15672](http://localhost:15672) | RabbitMQ Management (guest/guest) |
| [http://localhost:9001](http://localhost:9001) | MinIO Console (minioadmin/minioadmin) |
| [http://localhost:16686](http://localhost:16686) | Jaeger UI (tracing) |

## Arquitectura

```
 ┌─────────────────────────────────────────────────────────────────┐
 │                        Navegador                                │
 │                  http://localhost (Nginx :80)                    │
 └──────────────────────────┬──────────────────────────────────────┘
                            │
 ┌──────────────────────────▼──────────────────────────────────────┐
 │  Nginx :80                                                      │
 │  Reverse proxy → Next.js (todas las rutas pasan por acá)        │
 └──────────────────────────┬──────────────────────────────────────┘
                            │
 ┌──────────────────────────▼──────────────────────────────────────┐
 │  Frontend — Next.js :3000                                       │
 │  ┌──────────────────────┐  ┌──────────────────────────────┐     │
 │  │ UI (React components)│  │ BFF API Routes (/api/*)      │     │
 │  │ Server Components    │  │ → proxy a api-gateway:8080   │     │
 │  │ Client Components    │  │ → maneja cookies JWT         │     │
 │  └──────────────────────┘  └──────────┬───────────────────┘     │
 └───────────────────────────────────────┼─────────────────────────┘
                                         │
 ┌───────────────────────────────────────▼─────────────────────────┐
 │  API Gateway — Go/Echo :8080                                    │
 │  ┌─────────────────────────────────────────────────────────┐    │
 │  │ JWT Middleware → valida token → propaga headers          │    │
 │  │ Route proxy:  /api/users/* → users-service:8081          │    │
 │  │               /api/evaluations/* → evaluations-service:8082│  │
 │  │               /api/auth/* → users-service:8081           │    │
 │  └─────────────────────────────────────────────────────────┘    │
 └─────┬──────────────────────────────┬────────────────────────────┘
       │                              │
 ┌─────▼──────────────┐   ┌───────────▼──────────────┐
 │ Users Service :8081│   │ Evaluations Service :8082│
 │ ┌────────────────┐ │   │ ┌──────────────────────┐ │
 │ │ Auth (JWT)     │ │   │ │ Evaluaciones         │ │
 │ │ CRUD Usuarios  │ │   │ │ Indicadores          │ │
 │ │ Roles/Permisos │ │   │ │ Acciones             │ │
 │ │ Auditoría      │ │   │ │ Buenas Prácticas     │ │
 │ │ Password Reset │ │   │ │ Plan DTI             │ │
 │ └───────┬────────┘ │   │ │ Resultados/Informes  │ │
 │         │          │   │ └──────────┬───────────┘ │
 └─────────┼──────────┘   └────────────┼─────────────┘
           │                           │
 ┌─────────▼───────────────────────────▼─────────────┐
 │  PostgreSQL 16 :5432                              │
 │  ┌─────────────────┐  ┌────────────────────────┐  │
 │  │ users_service   │  │ evaluations_service    │  │
 │  │ schema          │  │ schema                 │  │
 │  └─────────────────┘  └────────────────────────┘  │
 └───────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────┐
 │  RabbitMQ :5672                                   │
 │  Eventos asíncronos entre servicios               │
 └───────────────────────────────────────────────────┘

 ┌───────────────────────────────────────────────────┐
 │  MinIO :9000                                      │
 │  Almacenamiento de archivos (evidencias)          │
 └───────────────────────────────────────────────────┘
```

### Patrón hexagonal (servicios Go)

Cada microservicio sigue la misma estructura interna:

```
internal/
├── domain/          ← Entidades, value objects (no dependen de infra)
├── ports/
│   ├── in/          ← Interfaces de entrada (driving ports)
│   └── out/         ← Interfaces de salida (driven ports)
├── usecases/        ← Casos de uso (orquestan lógica de negocio)
└── adapters/
    ├── in/http/     ← Handlers HTTP (Echo)
    └── out/postgres/← Repositorio PostgreSQL
```

Principio clave: **el dominio no importa infraestructura**. Los adaptadores dependen de los puertos, no al revés.

## Estructura del proyecto

```
auto-insight/
├── ONBOARDING.md                 ← Esta guía
├── README.md                     ← Puerta de entrada
├── AGENTS.md                     ← Instrucciones para agentes AI
├── test-users-guide.md           ← Usuarios de prueba y escenarios RBAC
├── .gitignore
├── Historias_de_Usuario_*.docx   ← Documento de historias de usuario
│
├── docs/
│   ├── architecture.md           ← Arquitectura del sistema
│   ├── api.md                    ← Referencia de API REST
│   ├── data-model.md             ← Modelo de datos completo
│   └── development.md            ← Guía de desarrollo y testing
│
├── openspec/
│   └── specs/                    ← Especificaciones SDD por feature
│
├── templates/                    ← Templates HTML del rediseño UI
│
├── .github/workflows/
│   └── docker-frontend.yml       ← CI: build de imagen Docker del frontend
│
└── workspace/
    ├── Makefile                  ← Atajos: make up, make down, make logs
    ├── .env.example              ← Template de variables de entorno
    │
    ├── frontend/                 ← Next.js 15 (App Router)
    │   ├── app/
    │   │   ├── (dti)/            ← Layout protegido: evaluaciones, acciones, plan
    │   │   ├── (admin)/          ← Layout protegido: solo administradores
    │   │   ├── (public)/         ← Layout público: banco de buenas prácticas
    │   │   └── (auth)/           ← Login
    │   ├── components/           ← Componentes React (Atomic Design)
    │   ├── sdk/                  ← API clients, auth context, hooks
    │   └── lib/                  ← Utilidades
    │
    ├── services/
    │   ├── evaluations-service/  ← Microservicio Go — lógica de evaluación
    │   │   ├── cmd/              ← Entry point
    │   │   ├── internal/         ← Hexagonal: domain, ports, usecases, adapters
    │   │   └── migrations/       ← Migraciones Go (estructura + seeds)
    │   │
    │   └── users-service/        ← Microservicio Go — auth y usuarios
    │       ├── cmd/              ← Entry point
    │       ├── internal/         ← Hexagonal: domain, ports, usecases, adapters
    │       └── migrations/       ← Migraciones Go (estructura)
    │
    ├── gateways/
    │   └── api-gateway/          ← Reverse proxy Go/Echo con JWT middleware
    │
    ├── shared/                   ← Código compartido entre servicios Go
    ├── shared-contracts/         ← Contratos compartidos
    │
    └── infra/                    ← Infraestructura Docker
        ├── docker-compose.yml    ← Definición de todos los servicios
        ├── nginx.conf            ← Reverse proxy Nginx
        ├── init_generated.sql    ← Schema SQL generado por core-cli
        ├── init_zz_evaluations.sql ← Schema evaluations + seeds de catálogos
        ├── init_zzz_seed_data.sql  ← Seeds mínimos funcionales
        ├── otel-collector-config.yml ← Config de OpenTelemetry
        ├── email-templates/      ← Plantillas de email (HTML)
        └── *.postman_*.json      ← Colección Postman para la API
```

## Base de datos

### Schemas

PostgreSQL usa el patrón **schema-per-service** para aislar los dominios:

| Schema | Servicio | Tablas principales |
|--------|---------|-------------------|
| `users_service` | users-service | `user`, `role`, `auditlog`, `password_reset_tokens` |
| `evaluations_service` | evaluations-service | `evaluation`, `destination`, `indicator`, `indicator_value`, `action`, `scope`, `requirement`, `dti_plan`, `good_practice`, etc. |

### Inicialización

Cuando PostgreSQL arranca por primera vez (volumen vacío), Docker ejecuta en orden alfabético los scripts en `/docker-entrypoint-initdb.d/`:

1. **`init_generated.sql`** — Crea schemas `users_service` y `evaluations_service` con sus tablas base y la extensión `uuid-ossp`. Generado por core-cli.
2. **`init_zz_evaluations.sql`** — Crea tipos ENUM, tablas de dominio del evaluations service, catálogos base (tipologías, rangos de población, ejes, roles), y el usuario admin.
3. **`init_zzz_seed_data.sql`** — Datos semilla mínimos: regiones, niveles subnacionales, ámbitos, requisitos, indicadores, 1 destino (Bariloche) y 1 evaluación de ejemplo.

Los servicios Go ejecutan sus propias migraciones al arrancar, que agregan el resto de indicadores y datos de catálogo (152 indicadores totales, 16+ ámbitos adicionales de la Red Iberoamericana, etc.).

### Seeds incluidos

| Dato | Cantidad | Ubicación |
|------|----------|-----------|
| Regiones | 10 (6 Argentina + 4 internacionales) | `init_zzz_seed_data.sql` |
| Niveles subnacionales | 8 (2 por país) | `init_zzz_seed_data.sql` |
| Ámbitos (scopes) | 16 base + extras via Go migration | SQL + Go migration |
| Requisitos | 74 | SQL + Go migration |
| Indicadores | 152 (gradient, boolean, numeric) | Go migration |
| Destino ejemplo | 1 (San Carlos de Bariloche) | `init_zzz_seed_data.sql` |
| Evaluación ejemplo | 1 (borrador) | `init_zzz_seed_data.sql` |
| Usuario admin | 1 (admin@dti.org) | `init_zz_evaluations.sql` |

### Conectarse a la BD

```bash
docker exec -it infra-postgres-1 psql -U postgres -d postgres
```

Consultas útiles:

```sql
-- Ver schemas
\dn

-- Ver tablas de un schema
\dt evaluations_service.*

-- Cambiar search_path
SET search_path TO evaluations_service;

-- Ver destinos
SELECT id, name, country FROM destination;

-- Ver evaluaciones
SELECT id, name, type, status FROM evaluation;
```

## Usuarios de prueba

| Email | Contraseña | Rol | Qué ve |
|-------|-----------|-----|--------|
| `admin@dti.org` | `123456` | Admin global | Todas las evaluaciones, CRUD completo |
| `gestor.bariloche@dti.org` | `123456` | Gestor de destino | Solo evaluaciones de Bariloche |

Para más usuarios de prueba con diferentes roles y escenarios de RBAC, ver **[test-users-guide.md](./test-users-guide.md)**.

## Comandos útiles

Todos desde `workspace/`:

```bash
# ── Docker Compose ──────────────────────────────────────────────────
make up          # Levantar todos los servicios
make down        # Detener y limpiar
make build       # Reconstruir imágenes Docker
make ps          # Estado de los servicios
make logs        # Logs en tiempo real de todos los servicios

# ── Logs específicos ────────────────────────────────────────────────
docker compose -f infra/docker-compose.yml logs evaluations-service --tail=50
docker compose -f infra/docker-compose.yml logs api-gateway -f
docker compose -f infra/docker-compose.yml logs frontend --tail=100

# ── Reconstruir un servicio después de cambios ─────────────────────
docker compose -f infra/docker-compose.yml build evaluations-service
docker compose -f infra/docker-compose.yml up -d evaluations-service

# ── Frontend ────────────────────────────────────────────────────────
cd frontend
npm install      # Instalar dependencias
npm run dev      # Dev server con hot-reload (localhost:3000)
npm run build    # Build de producción
npm run start    # Servir build de producción
npm run lint     # Linter

# ── Backend (Go) ────────────────────────────────────────────────────
cd services/evaluations-service
go run ./cmd/                    # Ejecutar servicio
go test ./internal/... -v        # Todos los tests
go test ./internal/usecases/... -v  # Tests de casos de uso
go test ./internal/domain/... -v    # Tests de dominio

# ── Base de datos ───────────────────────────────────────────────────
# Conectarse a PostgreSQL
docker exec -it infra-postgres-1 psql -U postgres -d postgres

# Ejecutar un script SQL
docker exec -i infra-postgres-1 psql -U postgres -d postgres -f /tmp/script.sql

# Reset completo de la BD (borra el volumen)
docker compose -f infra/docker-compose.yml down -v
make up    # Vuelve a crear todo desde cero

# ── Postman ─────────────────────────────────────────────────────────
# Importar colección: workspace/infra/auto-insight.postman_collection.json
# Base URL: http://localhost:8080/api
```

## Flujo de desarrollo

### Agregar un endpoint nuevo

El orden es **backend-first**:

1. **Definir en el dominio** (`internal/domain/`) — Agregar entidad si es nueva
2. **Interfaz del repositorio** (`internal/ports/out/repository_interface.go`) — Métodos CRUD
3. **Implementar repositorio** (`internal/adapters/out/postgres/`) — Queries SQL, usar schema prefix
4. **Caso de uso** (`internal/usecases/`) — Lógica de negocio, validaciones
5. **Registrar ruta HTTP** (`internal/adapters/in/http/handlers_register.go`) — Echo route
6. **Proxy en API Gateway** (`gateways/api-gateway/routes_evaluations.go`) — Ruta con middleware JWT
7. **Actualizar mock de tests** — Agregar métodos al `mockRepo` en `usecases/evaluation_test.go`
8. **Frontend SDK** (`workspace/frontend/sdk/api/`) — Cliente para el nuevo endpoint

### Crear una migración

Las migraciones de Go están en `workspace/services/*/migrations/`. Cada archivo se nombra:

```
{TIMESTAMP}_{descripcion}.up.sql
{TIMESTAMP}_{descripcion}.down.sql
```

El timestamp es epoch en segundos. Ejemplo:

```
1785000000_add_new_column.up.sql
1785000000_add_new_column.down.sql
```

Las migraciones se ejecutan automáticamente al iniciar el servicio.

### Convenciones de commits

Usamos **Conventional Commits**:

```
feat: descripción breve
fix: descripción del bug corregido
refactor: qué se refactorizó y por qué
test: qué se testeó
docs: qué se documentó
chore: tarea de mantenimiento
```

### Ramas

```
main              → producción
feature/<nombre>  → features nuevas
fix/<nombre>      → correcciones
```

### Reglas importantes

- **NUNCA editar archivos `*_generated.*`** — se regeneran con `core-cli sync`
- **El SDK del frontend es la fuente de verdad** para llamadas API — nunca llamar servicios directamente desde componentes UI
- **Siempre actualizar los mocks** de tests cuando se modifica una interfaz de repositorio
- **No commitear `.env`** — está en `.gitignore`
- **Usar `docker compose`** (con espacio), no `docker-compose` (obsoleto)

## Troubleshooting

### Los servicios no arrancan

```bash
# Ver logs de todos
make logs

# Ver si PostgreSQL está healthy primero
make ps | grep postgres
```

### Error de conexión a PostgreSQL

```
dial tcp: lookup postgres on ...: no such host
```

Asegurate de que los servicios estén en la misma red Docker y que PostgreSQL esté healthy:

```bash
make ps
# postgres debe mostrar "(healthy)"
```

### UTF-8 corrupto / caracteres extraños

Si ves caracteres como `turfstica` en vez de `turística`:

**Causa**: El encoding de la terminal corrompe UTF-8 al pipear datos.

**Solución**: Usar `docker cp` en vez de pipe:

```bash
docker cp script.sql infra-postgres-1:/tmp/
docker exec infra-postgres-1 psql -U postgres -d postgres -f /tmp/script.sql
```

### Puerto en uso

Si el puerto 5432, 8080, o 3000 ya está ocupado:

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :5432

# Detenerlo o cambiar el puerto en docker-compose.yml
```

### Reset completo

Si necesitás empezar de cero (borra TODO, incluida la BD):

```bash
cd workspace
make down
docker compose -f infra/docker-compose.yml down -v  # Borra volúmenes
make up  # Recrea todo
```

### El frontend no carga después de `make up`

El primer build de Next.js puede tardar unos minutos (instala dependencias, compila). Verificá los logs:

```bash
docker compose -f infra/docker-compose.yml logs frontend -f
```

Esperá a que aparezca `Ready in Xs` antes de acceder.

### Las migraciones Go no se ejecutan

Los servicios Go ejecutan migraciones al iniciar. Si no se ejecutaron:

1. Verificá los logs del servicio: `docker compose -f infra/docker-compose.yml logs evaluations-service`
2. Si la tabla de migraciones ya existe, las migraciones ya corridas no se re-ejecutan
3. Para forzar re-migración: `make down -v && make up`

## APIs externas necesarias

| API | Para qué | ¿Es obligatoria? | Configuración |
|-----|---------|-----------------|--------------|
| **Resend** | Envío de emails (recuperación de contraseña, notificaciones) | No — sin API key, el envío de emails falla silenciosamente | `RESEND_API_KEY` en `.env` |
| **DeepL** | Traducción automática de contenido (acciones, indicadores) | No — sin API key, la feature de traducción no está disponible | `DEEPL_API_KEY` en `.env` |

### Cómo obtener las API keys

- **Resend**: Registrate en [resend.com](https://resend.com) → API Keys → Create API Key
- **DeepL**: Registrate en [deepl.com/pro-api](https://www.deepl.com/pro-api) → Account → API Key

Agregalas a `workspace/.env` y reiniciá los servicios:

```bash
make build
make up
```
