# Auto-Insight — Plataforma de Evaluación DTI

Plataforma de evaluación de Destinos Turísticos Inteligentes (DTI) basada en el modelo de la Red Iberoamericana DTI.

Gestiona evaluaciones multi-fase, indicadores por ámbito, planes de transformación y banco de buenas prácticas para destinos turísticos.

## Arranque rápido

```bash
cd workspace
make up        # Levanta PostgreSQL, RabbitMQ, servicios y frontend
```

Abrí [http://localhost:3000](http://localhost:3000) y logeate con `admin@dti.org` / `123456`.

## Documentación

**[ONBOARDING.md](./ONBOARDING.md)** — Guía completa para levantar el proyecto desde cero, incluyendo:

- Requisitos previos e instalación
- Arquitectura del sistema
- Estructura del proyecto
- Base de datos y seeds
- Comandos útiles y flujo de desarrollo
- Troubleshooting

- **[docs/architecture.md](./docs/architecture.md)** — Arquitectura de microservicios, patrón hexagonal, decisiones técnicas
- **[docs/api.md](./docs/api.md)** — Referencia completa de la API REST
- **[docs/data-model.md](./docs/data-model.md)** — Modelo de datos, entidades y enumeraciones
- **[docs/development.md](./docs/development.md)** — Guía de desarrollo y testing
- **[test-users-guide.md](./test-users-guide.md)** — Usuarios de prueba y escenarios para verificar RBAC

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS |
| API Gateway | Go (Echo v4) |
| Microservicios | Go con arquitectura hexagonal |
| Base de datos | PostgreSQL 16 |
| Mensajería | RabbitMQ |
| Infra | Docker Compose |

## Licencia

Propietario — Todos los derechos reservados.
