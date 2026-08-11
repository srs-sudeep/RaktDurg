---
id: migrations
title: Migrations
---

# Database Migrations

## Alembic Setup

Alembic is configured in `backend/alembic/`:

```
backend/
├── alembic/
│   ├── env.py          # async engine configuration
│   └── versions/       # migration files
└── alembic.ini
```

`env.py` imports SQLAlchemy models so Alembic can auto-generate diffs.

## Common Commands

```bash
# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Roll back to base (empty database)
alembic downgrade base

# Auto-generate a migration from model changes
alembic revision --autogenerate -m "add column X to table Y"

# Show current migration version
alembic current

# Show migration history
alembic history --verbose
```

Via Make:
```bash
make migrate        # alembic upgrade head inside container
```

## Writing a Migration

After changing a SQLAlchemy model:

```bash
cd backend
alembic revision --autogenerate -m "describe your change"
```

Review the generated file in `alembic/versions/`. Auto-generated migrations may miss:
- Partial indexes
- PostgreSQL RULE statements
- Custom CHECK constraints

Add these manually in the `upgrade()` function:

```python
def upgrade() -> None:
    # Auto-generated changes...

    # Manual additions:
    op.execute("""
        CREATE UNIQUE INDEX uix_camp_calendar
        ON camps (host_facility_id, requested_date)
        WHERE status IN ('submitted', 'under_review', 'approved')
    """)

    op.execute("""
        CREATE RULE no_update_audit_logs AS ON UPDATE TO audit_logs
        DO INSTEAD NOTHING
    """)
```

## CI/CD

Migrations run automatically in CI before tests:

```yaml
- name: Run migrations
  run: alembic upgrade head
  env:
    DATABASE_URL: postgresql+asyncpg://rakt:rakt@localhost:5432/rakt_test
```

## Production Migrations

In production, migrations run as a separate Docker Compose service before the API starts:

```yaml
migrate:
  image: ${API_IMAGE}
  command: alembic upgrade head
  profiles: [migrate]
  depends_on:
    postgres:
      condition: service_healthy
```

Never run `alembic downgrade` in production without a rollback plan.
