#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/raktdurg}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/infra/docker-compose.prod.yml}"
ENV_FILE="${ENV_FILE:-$APP_DIR/infra/.env}"
DEPLOY_STATE_DIR="${DEPLOY_STATE_DIR:-$APP_DIR/.deploy}"
ALEMBIC_SHA_FILE="$DEPLOY_STATE_DIR/alembic.sha"
ALEMBIC_DIR="$APP_DIR/backend/alembic/versions"

if [[ ! -f "$COMPOSE_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing compose or env file under $APP_DIR/infra" >&2
  exit 1
fi

cd "$APP_DIR/infra"

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

# Guard against macOS metadata files breaking Python imports in container builds.
find "$APP_DIR" -maxdepth 1 \( -name '._*' -o -name '.DS_Store' \) -delete 2>/dev/null || true
find "$APP_DIR/backend" "$APP_DIR/web" "$APP_DIR/infra" \
  \( -name '._*' -o -name '.DS_Store' \) -delete 2>/dev/null || true

mkdir -p "$DEPLOY_STATE_DIR"

alembic_fingerprint() {
  if [[ ! -d "$ALEMBIC_DIR" ]]; then
    echo "missing"
    return
  fi
  # Stable fingerprint of revision tree contents.
  find "$ALEMBIC_DIR" -type f -name '*.py' ! -name '._*' \
    | sort \
    | xargs sha256sum 2>/dev/null \
    | sha256sum \
    | awk '{print $1}'
}

compose up -d db redis

# Cached builds for all services that share the backend Dockerfile, plus web.
compose build api migrate worker beat web

CURRENT_ALEMBIC_SHA="$(alembic_fingerprint)"
PREVIOUS_ALEMBIC_SHA=""
if [[ -f "$ALEMBIC_SHA_FILE" ]]; then
  PREVIOUS_ALEMBIC_SHA="$(cat "$ALEMBIC_SHA_FILE")"
fi

if [[ "$CURRENT_ALEMBIC_SHA" != "$PREVIOUS_ALEMBIC_SHA" ]]; then
  echo "Alembic revisions changed — running migrations."
  compose --profile init run --rm migrate
  printf '%s\n' "$CURRENT_ALEMBIC_SHA" > "$ALEMBIC_SHA_FILE"
else
  echo "Alembic revisions unchanged — skipping migrations."
fi

# Bring app stack up with cached images (rebuild only if sources changed since last build).
compose up -d api worker beat web nginx prometheus grafana

# Nginx caches upstream IPs at process start unless config uses Docker DNS
# resolver + variable proxy_pass. Force a reload/restart after API recreate so
# a mid-deploy API IP change cannot leave /auth and /health returning 502.
compose up -d --force-recreate --no-deps nginx

FORCE_RESEED="${FORCE_RESEED:-0}"

if [[ "$FORCE_RESEED" == "1" || "$FORCE_RESEED" == "true" ]]; then
  echo "FORCE_RESEED=1 — wiping database and reseeding from scratch."
  compose stop api worker beat
  compose exec -T db psql -U rakt -d postgres -v ON_ERROR_STOP=1 <<'SQL'
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'rakt_durg' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS rakt_durg;
CREATE DATABASE rakt_durg OWNER rakt;
SQL
  compose --profile init run --rm migrate
  compose up -d api worker beat
  for _ in $(seq 1 30); do
    if compose exec -T api python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  compose run --rm --entrypoint python api -m seed.demo_seed
else
  USER_COUNT="$(
    compose exec -T db \
      psql -U rakt -d rakt_durg -tAc "SELECT COUNT(*) FROM users;" 2>/dev/null \
      || echo "0"
  )"
  USER_COUNT="$(echo "$USER_COUNT" | tr -d '[:space:]')"
  if [[ -z "$USER_COUNT" || "$USER_COUNT" == "0" ]]; then
    echo "No users found — running demo seed (roles, organizers, stock, camps)."
    compose run --rm --entrypoint python api -m seed.demo_seed
  else
    echo "Users already present ($USER_COUNT) — ensuring organizer login accounts exist."
    compose run --rm --entrypoint python api -m seed.ensure_organizers
  fi
fi

# Final nginx refresh after any API stop/start during seed (FORCE_RESEED path).
compose up -d --force-recreate --no-deps nginx

docker image prune -f

echo "Deployment complete."
