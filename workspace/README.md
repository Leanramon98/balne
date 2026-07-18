# Workspace operations

Run deployment commands from this directory through the `Makefile`. Every target uses the generated base Compose file followed by the versioned user-owned override:

```text
infra/docker-compose.yml
docker-compose.override.yml
```

Common commands:

```bash
make build
make up
make ps
make logs
make down
```

`make up` runs tenant migrations before `users-service`. For isolated automation, set `COMPOSE_PROJECT_NAME` and optionally `SERVICES`; these variables use the same ordered Compose files as production. Additional target flags are available through `BUILD_ARGS`, `UP_ARGS`, `DOWN_ARGS`, `LOG_ARGS`, `PS_ARGS`, and `CONFIG_ARGS`.
