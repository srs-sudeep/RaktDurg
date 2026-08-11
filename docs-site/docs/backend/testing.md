---
id: testing
title: Testing
---

# Backend Testing

## Running Tests

```bash
make test           # pytest with coverage
make lint           # ruff + mypy
make type-check     # mypy only
make fmt            # ruff format + isort
```

## Test Structure

```
backend/tests/
├── conftest.py           # fixtures: db session, test client, users per role
├── test_units.py         # blood unit lifecycle, barcode
├── test_camps.py         # camp apply, review, calendar blocking
├── test_wallet.py        # wallet enabled/disabled, credit, redeem
└── test_requisitions.py  # requisition flow, cancel, admin endpoints
```

## Key Fixtures

```python
# conftest.py
@pytest.fixture
async def db_session():
    # Uses in-memory SQLite or test PostgreSQL
    # Rolls back after each test

@pytest.fixture
def admin_token():
    # Returns JWT for admin user

@pytest.fixture
def lab_tech_token():
    # Returns JWT for lab_tech user

@pytest.fixture
async def facility():
    # Returns a seeded Facility record
```

## Test Examples

### Barcode Validation

```python
def test_validate_barcode_valid():
    barcode = "RDRKDURG000001K"
    assert validate_barcode(barcode) is True

def test_validate_barcode_wrong_length():
    assert validate_barcode("RDRKDURG00001") is False

def test_luhn_check_char():
    assert luhn_check_char("RDRKDURG000001") == "K"
```

### State Machine — Terminal States

```python
@pytest.mark.parametrize("state", ["transfused", "discarded", "expired"])
def test_terminal_states_have_no_transitions(state):
    assert VALID_TRANSITIONS[UnitLifecycleState(state)] == set()
```

### RBAC Enforcement

```python
async def test_citizen_cannot_access_authenticated_stock(client, citizen_token, facility):
    resp = await client.get(
        f"/stock/{facility.id}",
        headers={"Authorization": f"Bearer {citizen_token}"}
    )
    assert resp.status_code == 403
```

### Wallet Disabled by Default

```python
async def test_wallet_disabled_by_default(client, admin_token, donor):
    resp = await client.get(
        f"/wallet/donors/{donor.id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert resp.status_code == 503
```

## Coverage

Target: ≥ 80% line coverage. Run:

```bash
make test
# or
pytest --cov=app --cov-report=html
# Open htmlcov/index.html
```

## CI Integration

Tests run in CI against a real PostgreSQL 16 instance (not SQLite). See [`.github/workflows/ci.yml`](../ops/ci-cd.md):

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_DB: rakt_test
      POSTGRES_USER: rakt
      POSTGRES_PASSWORD: rakt
```
