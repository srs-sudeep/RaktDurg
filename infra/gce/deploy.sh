#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/raktdurg}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/infra/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$APP_DIR/infra/.env}"

if [[ ! -f "$COMPOSE_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing compose or env file under $APP_DIR/infra" >&2
  exit 1
fi

cd "$APP_DIR/infra"

# Guard against macOS metadata files breaking Python imports in container builds.
find "$APP_DIR" -maxdepth 1 \( -name '._*' -o -name '.DS_Store' \) -delete
find "$APP_DIR/backend" "$APP_DIR/web" "$APP_DIR/infra" \
  \( -name '._*' -o -name '.DS_Store' \) -delete

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d db redis
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache api web
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" --profile init run --rm migrate
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build api worker beat web nginx
docker image prune -f

echo "Deployment complete."
