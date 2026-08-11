.PHONY: help up down logs build \
        migrate migrate-down migrate-history \
        seed demo-seed \
        prod-build prod-up prod-down prod-logs prod-migrate prod-demo-seed \
        test test-cov lint type-check \
        web-install web-dev web-build web-test web-lint \
        flutter-get flutter-build flutter-run-android flutter-run-ios \
        docs-install docs-dev docs-build \
        setup clean

COMPOSE_PROD := docker compose -f infra/docker-compose.prod.yml --env-file infra/.env

# ── Colours ──────────────────────────────────────────────────────────────────
CYAN  := \033[0;36m
RESET := \033[0m

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	awk 'BEGIN{FS=":.*?## "}{printf "$(CYAN)%-22s$(RESET)%s\n",$$1,$$2}'

# ── Docker ────────────────────────────────────────────────────────────────────
up: ## Start all services (detached)
	docker compose -f infra/docker-compose.yml up -d

up-tools: ## Start all services including pgAdmin
	docker compose -f infra/docker-compose.yml --profile tools up -d

down: ## Stop all services
	docker compose -f infra/docker-compose.yml down

down-v: ## Stop all services and remove volumes
	docker compose -f infra/docker-compose.yml down -v

logs: ## Follow API logs
	docker compose -f infra/docker-compose.yml logs -f api

logs-worker: ## Follow Celery worker logs
	docker compose -f infra/docker-compose.yml logs -f worker

build: ## Rebuild API image
	docker compose -f infra/docker-compose.yml build api

restart: ## Restart API service
	docker compose -f infra/docker-compose.yml restart api

# ── Production Docker ─────────────────────────────────────────────────────────
prod-build: ## Build production images (api, web, worker)
	$(COMPOSE_PROD) build

prod-up: ## Start production stack (nginx on HTTP_PORT, default 80)
	$(COMPOSE_PROD) up -d

prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

prod-logs: ## Follow production nginx + API logs
	$(COMPOSE_PROD) logs -f nginx api

prod-migrate: ## Run migrations in production (one-shot init profile)
	$(COMPOSE_PROD) --profile init run --rm migrate

prod-demo-seed: ## Load demo seed in production (seed profile; dev/demo only)
	$(COMPOSE_PROD) --profile seed run --rm demo-seed

# ── Migrations ────────────────────────────────────────────────────────────────
migrate: ## Apply all pending migrations
	docker compose -f infra/docker-compose.yml exec api alembic upgrade head

migrate-down: ## Roll back one migration
	docker compose -f infra/docker-compose.yml exec api alembic downgrade -1

migrate-history: ## Show migration history
	docker compose -f infra/docker-compose.yml exec api alembic history --verbose

migrate-check: ## Verify no pending model changes (CI gate)
	docker compose -f infra/docker-compose.yml exec api alembic check

# ── Seeds ─────────────────────────────────────────────────────────────────────
seed: ## Run basic seed (one user per role + facility)
	docker compose -f infra/docker-compose.yml exec api python -m seed.seed

demo-seed: ## Run comprehensive demo seed with realistic blood bank data
	docker compose -f infra/docker-compose.yml exec api python -m seed.demo_seed

# ── Backend tests & lint ──────────────────────────────────────────────────────
test: ## Run backend test suite
	cd backend && pytest -q

test-cov: ## Run backend tests with coverage report
	cd backend && pytest --cov=app --cov-report=term-missing --cov-report=html -q

test-file: ## Run a specific test file: make test-file F=tests/test_units.py
	cd backend && pytest $(F) -v

lint: ## Lint backend with ruff
	cd backend && ruff check .

lint-fix: ## Auto-fix ruff lint issues
	cd backend && ruff check --fix .

type-check: ## Run mypy on backend
	cd backend && mypy app --ignore-missing-imports

fmt: ## Format backend code
	cd backend && ruff format .

# ── Web (Bun) ─────────────────────────────────────────────────────────────────
web-install: ## Install web dependencies with Bun
	cd web && bun install

web-dev: ## Start web dev server
	cd web && bun run dev

web-build: ## Production build
	cd web && bun run build

web-test: ## Run web tests (Vitest)
	cd web && bun run test

web-test-ui: ## Run web tests with Vitest UI
	cd web && bun run test:ui

web-lint: ## Lint web code
	cd web && bun run lint

web-type-check: ## TypeScript type check for web
	cd web && bun run type-check

# ── Flutter mobile ────────────────────────────────────────────────────────────
flutter-get: ## Install Flutter dependencies
	cd mobile && flutter pub get

flutter-run-android: ## Run on Android emulator (API via 10.0.2.2)
	cd mobile && flutter run --dart-define=API_BASE_URL=http://10.0.2.2:8000

flutter-run-ios: ## Run on iOS simulator (API via localhost)
	cd mobile && \
	CC="$$(xcrun --find clang)" CXX="$$(xcrun --find clang++)" \
	PATH="/opt/homebrew/lib/ruby/gems/4.0.0/bin:$$PATH" \
	flutter run --dart-define=API_BASE_URL=http://127.0.0.1:8000

flutter-build: ## Build Flutter app (Android APK debug)
	cd mobile && flutter build apk --debug

flutter-test: ## Run Flutter tests
	cd mobile && flutter test

flutter-analyze: ## Analyze Flutter code
	cd mobile && flutter analyze

# ── Full setup ────────────────────────────────────────────────────────────────
setup: ## Full local setup: docker up → migrate → demo seed
	@echo "$(CYAN)Starting services…$(RESET)"
	$(MAKE) up
	@echo "$(CYAN)Waiting for database…$(RESET)"
	@sleep 5
	@echo "$(CYAN)Running migrations…$(RESET)"
	$(MAKE) migrate
	@echo "$(CYAN)Loading demo seed data…$(RESET)"
	$(MAKE) demo-seed
	@echo "$(CYAN)Installing web deps…$(RESET)"
	$(MAKE) web-install
	@echo "$(CYAN)Setup complete. Run 'make web-dev' to start the frontend.$(RESET)"

setup-fresh: ## Destroy volumes and do a clean setup
	$(MAKE) down-v
	$(MAKE) setup

# ── Docs (Docusaurus) ─────────────────────────────────────────────────────────
docs-install: ## Install docs-site dependencies with Bun
	cd docs-site && bun install

docs-dev: ## Start Docusaurus dev server on port 3001
	cd docs-site && bun run start

docs-build: ## Build static docs site
	cd docs-site && bun run build

# ── Cleanup ───────────────────────────────────────────────────────────────────
clean: ## Remove Python cache files
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null; true
	find backend -type f -name "*.pyc" -delete 2>/dev/null; true
	rm -rf backend/htmlcov backend/.coverage 2>/dev/null; true
