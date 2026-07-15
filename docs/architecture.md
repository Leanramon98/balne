# Arquitectura del Sistema

## Vision General

Auto-Insight sigue una **arquitectura de microservicios** con un **API Gateway** central, implementada en Go, con frontend en Next.js. Cada servicio interno sigue el patron **hexagonal** (puertos y adaptadores).

## Diagrama de Arquitectura

```
Navegador (Next.js 15 + React 19)
         |
     HTTPS :3000
         |
 API Gateway (Go/Echo) :8080
   |  - JWT Middleware
   |  - Routing /api/users/*, /api/evaluations/*
   |
   +-----> Users Service (Go) :8081
   |         - Autenticacion, usuarios, roles
   |         - PostgreSQL schema: users_service
   |
   +-----> Evaluations Service (Go) :8082
             - Evaluaciones, indicadores, acciones
             - DTI Plans, Results, Good Practices
             - PostgreSQL schema: evaluations_service
             - RabbitMQ publisher

PostgreSQL 16 (schema-per-service)
RabbitMQ 3.12 (eventos asyncronos)
OpenTelemetry + Jaeger (tracing) + Prometheus (metricas)
```

## Patron Hexagonal

Cada servicio Go sigue la misma estructura interna:

```
internal/
  domain/       - Entidades, value objects, reglas de negocio
  ports/
    in/         - Interfaces de entrada (driving ports)
    out/        - Interfaces de salida (driven ports)
  usecases/     - Casos de uso (orquestan la logica)
  adapters/
    in/
      http/     - Handlers HTTP (Echo framework)
      grpc/     - Handlers gRPC
    out/
      postgres/ - Repositorio PostgreSQL
      messaging/- Publisher RabbitMQ
```

Principio clave: el dominio NO depende de infraestructura.

## Microservicios

### Users Service (:8081)

Responsabilidades:
- Autenticacion (login, JWT, recuperacion de password)
- CRUD de usuarios por perfil
- Gestion de roles y permisos
- Auditoria de accesos (AuditLog)

Entidades: User, Role, AuditLog

### Evaluations Service (:8082)

Responsabilidades:
- CRUD de destinos y catalogos administrativos
- CRUD de evaluaciones con maquina de estados
- Promocion entre tipos de evaluacion
- Gestion de accesos por evaluacion
- CRUD de indicadores y valores
- Analisis IA
- Mensajeria por indicador
- CRUD de acciones, evidencias, good practices
- Plan de Transformacion DTI
- Resultados comparativos
- Banco publico de buenas practicas

## API Gateway (:8080)

- Unico punto de entrada para el frontend
- Middleware JWT: valida token y propaga claims como headers
- Routing: /api/users/* y /api/evaluations/*
- No hace compose de respuestas (passthrough simple)

## Frontend (Next.js 15)

### Route Groups

- `(auth)` - Pagina de login
- `(dti)` - Layout protegido: evaluaciones, acciones, plan, resultados, informes
- `(admin)` - Layout protegido: solo administradores
- `(public)` - Layout publico: banco de buenas practicas

### Decisiones frontend

- **Radix UI**: Componentes headless accesibles con estilo via Tailwind
- **SWR**: Data fetching con cache y revalidacion automatica
- **react-hook-form**: Manejo de formularios complejos con validacion
- **Sonner**: Notificaciones toast ligeras
- **Recharts**: Graficos de resultados

## Base de Datos

### Schema-per-service

Cada microservicio tiene su propio schema en PostgreSQL:
- `users_service`: usuarios, roles, audit_logs
- `evaluations_service`: destinos, evaluaciones, indicadores, acciones, planes

### Inicializacion

Docker Compose monta 3 scripts SQL en `/docker-entrypoint-initdb.d/`:
1. `init_generated.sql` - Esquemas y tablas generadas por core-cli
2. `init_zz_evaluations.sql` - Migraciones del evaluations-service
3. `init_zzz_seed_data.sql` - Datos semilla

## Mensajeria (RabbitMQ)

- Intercambio de tipo `topic`
- Evaluations Service publica eventos de dominio
- Usado para notificaciones y eventos asyncronos

## Observabilidad

- **OpenTelemetry Collector**: Recibe traces y metricas de los servicios Go
- **Jaeger**: Visualizacion de tracing distribuido (:16686)
- **Prometheus**: Recoleccion de metricas (:9090)

## Decisiones Arquitectonicas

| Decision | Alternativa | Por que |
|----------|-------------|---------|
| Go + Echo | Node.js, Java | Rendimiento, tipado fuerte, gorutinas para concurrencia |
| Hexagonal | MVC clasico | Separacion de concerns, testabilidad del dominio puro |
| Schema-per-service | Base unica | Aislamiento entre servicios, evolucion independiente |
| RabbitMQ | Kafka (para este volumen) | Simplicidad operativa, topologia de routing flexible |
| Next.js App Router | Pages Router, SPA | SSR, layouts anidados, server components |
| PostgreSQL | MySQL | Tipos nativos (uuid, jsonb, arrays), schemas |
