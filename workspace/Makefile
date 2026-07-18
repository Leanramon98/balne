.PHONY: build up down logs ps config

COMPOSE_PROJECT_NAME ?= auto-insight
COMPOSE_FILES := -f infra/docker-compose.yml -f docker-compose.override.yml
COMPOSE := COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) docker compose $(COMPOSE_FILES)
SERVICES ?=
BUILD_ARGS ?=
UP_ARGS ?=
DOWN_ARGS ?=
LOG_ARGS ?= -f
PS_ARGS ?=
CONFIG_ARGS ?=

build:
	$(COMPOSE) build $(BUILD_ARGS) $(SERVICES)

up:
	$(COMPOSE) up -d $(UP_ARGS) $(SERVICES)

down:
	$(COMPOSE) down $(DOWN_ARGS)

logs:
	$(COMPOSE) logs $(LOG_ARGS) $(SERVICES)

ps:
	$(COMPOSE) ps $(PS_ARGS) $(SERVICES)

config:
	$(COMPOSE) config $(CONFIG_ARGS)
