#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/raktdurg}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/infra/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$APP_DIR/infra/.env}"

if [[ -z "${GHCR_USERNAME:-}" || -z "${GHCR_TOKEN:-}" ]]; then
  echo "GHCR_USERNAME and GHCR_TOKEN are required" >&2
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing compose or env file under $APP_DIR/infra" >&2
  exit 1
fi

cd "$APP_DIR/infra"

echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull api web worker beat migrate demo-seed
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db redis
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile init run --rm migrate
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d api worker beat web nginx
docker image prune -f

echo "Deployment complete."
