# Guia de Desarrollo

## Requisitos

| Herramienta | Version |
|-------------|---------|
| Go | 1.24+ |
| Node.js | 20+ |
| Docker Desktop | Latest (con WSL2 en Windows) |
| npm | 10+ |

## Setup Inicial

```bash
# 1. Clonar el repositorio
git clone <repo-url> auto-insight
cd auto-insight

# 2. Iniciar infraestructura (PostgreSQL, RabbitMQ, Jaeger, Prometheus)
cd workspace
make up

# 3. Verificar que todos los servicios esten healthy
make ps

# 4. Inicializar frontend
cd frontend
npm install
npm run dev
```

La aplicacion estara disponible en:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- Jaeger UI: http://localhost:16686
- Prometheus: http://localhost:9090
- RabbitMQ Management: http://localhost:15672 (guest/guest)

## Comandos Make

Ejecutar desde `workspace/`:

```bash
make build   # Construye o reconstruye imagenes Docker
make up      # Inicia servicios en background
make down    # Detiene y limpia servicios
make logs    # Logs en tiempo real de todos los servicios
make ps      # Estado de los servicios
```

## Desarrollo Local

### Backend (Go)

Cada microservicio se puede ejecutar fuera de Docker para desarrollo:

```bash
# Evaluations Service
cd workspace/services/evaluations-service
go run ./cmd/

# Users Service (requiere PostgreSQL corriendo en Docker)
cd workspace/services/users-service
go run ./cmd/
```

Variables de entorno necesarias (ver `.env` y `docker-compose.yml`):
- `PORT` - Puerto del servicio
- `DB_URL` - Cadena de conexion a PostgreSQL
- `JWT_SECRET` - Secreto para firmar tokens
- `RABBIT_URL` - URL de conexion a RabbitMQ

### Testing

```bash
# Backend - todos los tests
cd workspace/services/evaluations-service
go test ./internal/... -v

# Tests especificos
go test ./internal/domain/... -v
go test ./internal/usecases/... -v

# Frontend - lint
cd workspace/frontend
npm run lint
```

### Frontend

```bash
# Desarrollo con hot-reload
cd workspace/frontend
npm run dev

# Build de produccion
npm run build

# Preview del build
npm run start
```

## Postman Collection

La coleccion completa de la API esta en:

```
workspace/infra/auto-insight.postman_collection.json
```

Contiene **123 requests** organizados en **15 folders** con variables de entorno pre-configuradas.

### Uso rapido:

1. Importar la coleccion en Postman
2. Seleccionar variable `base_url` = `http://localhost:8080/api`
3. Ejecutar **Login** -> copiar token automaticamente
4. Ejecutar **Setup > Fetch Seed IDs** -> pobla todas las variables
5. Navegar por los endpoints

## Estructura de Ramas

Se recomienda:

```
main           - Produccion
develop        - Integracion
feature/<nombre> - Features individuales
fix/<nombre>   - Correcciones
```

Commits con nomenclatura convencional:
- `feat:` Nueva funcionalidad
- `fix:` Correccion de bug
- `refactor:` Refactorizacion
- `test:` Tests
- `docs:` Documentacion

## Convenciones de Codigo

### Go

- Seguir `gofmt` y `go vet` (no hay excepciones)
- Nombres de archivos en snake_case
- Arquitectura hexagonal estricta: dominio no importa infraestructura
- Tests: tabla-driven tests con `t.Run()`
- Errores: siempre retornar con contexto (`fmt.Errorf("context: %w", err)`)

### Frontend

- TypeScript estricto (no `any`)
- Componentes en `components/` con PascalCase
- Paginas en `app/` con kebab-case
- Hooks personalizados en `hooks/`
- Contextos en `context/`
- SWR para data fetching

### Commits

Conventional Commits en espanol o ingles:
```
feat: agregar filtro por tipo en listado de evaluaciones
fix: corregir validacion de fecha en creacion de evaluacion
```

## Troubleshooting

### Error de conexion a PostgreSQL

```
Error: dial tcp: lookup postgres on ...: no such host
```

**Solucion**: Asegurarse de que los servicios de Docker esten corriendo:
```bash
cd workspace
make up
make ps
```

### UTF-8 corrupto en seed data

Si los acentos aparecen como caracteres extranos en la UI:

**Causa**: PowerShell corrompe UTF-8 al pipear SQL via `docker exec`.

**Solucion**: Usar `docker cp` en lugar de pipe:
```bash
Get-Content init.sql | Set-Content -Encoding UTF8 temp.sql
docker cp temp.sql postgres-container:/tmp/
docker exec postgres-container psql -U postgres -f /tmp/temp.sql
```

### Puerto en uso

Si el puerto 8080 o 5432 ya esta ocupado:
1. Detener el servicio que usa el puerto
2. O cambiar el mapeo en `docker-compose.yml`
