# Traffic Management Platform - Test Automation

This repository contains the frontend app and an end-to-end Playwright test suite (Python) focused on `http://localhost:3000/signals/:id`, including API validation, UI behavior, negative flows, edge cases, and bug documentation.

## What Is Covered

The automated tests validate:

- Signal detail page loading and core UI rendering
- API request/response behavior for:
  - `http://localhost:3000/data/near-miss.json?signalId=3`
  - `http://localhost:3000/data/near-miss.json?signalId=1`
- UI behavior when API returns `404` or invalid JSON
- Form interactions (cycle update + success toast)
- Date picker edge behavior
- Known bug documentation via a skipped test

## Test Scenarios

### Scope

- Page under test: `http://localhost:3000/signals/3`
- Primary API: `http://localhost:3000/data/near-miss.json?signalId=3`
- Additional API coverage: `http://localhost:3000/data/near-miss.json?signalId=1`

### Positive Scenarios

- Signal detail page loads successfully for `signalId=3`
- Signal name and status/phase are rendered correctly
- Near-miss API for `signalId=3` is called and response payload matches expected data
- Near-miss API for `signalId=1` is called with correct query param and returns valid payload structure
- Required UI controls are visible (back button, tables, downloads, cycle input)
- Table values render as expected (near-miss dynamic data and compare data)
- Cycle form submission shows success toast

### Negative Scenarios

- Invalid signal ID (e.g. `999`) falls back gracefully and still shows signal info
- API `404` response does not crash the page and near-miss table remains visible
- Invalid API JSON structure hides near-miss table and triggers error handling behavior

### Edge Scenarios

- Date picker interaction updates selected date in expected format (`DD/MM/YYYY`)

### Known Bug Scenario (Skipped)

- Compare table contains hardcoded values that do not match live near-miss data
- Automated bug test exists and is intentionally skipped until fix:
  - `test_bug_hardcoded_compare_data_inconsistency`

## Test Architecture

The suite uses the Page Object Model (POM) pattern.

### POM goals

- Keep selectors and UI actions in one place
- Reduce duplication across tests
- Make tests readable and maintainable
- Centralize route interception helpers for API-focused tests

### POM modules

- `tests/pom/base_page.py` - shared base class/helpers
- `tests/pom/login_page.py` - login page actions
- `tests/pom/layout_component.py` - top navigation actions
- `tests/pom/dashboard_page.py` - dashboard-level actions/selectors
- `tests/pom/signals_page.py` - signals list page actions/selectors
- `tests/pom/signal_detail_page.py` - signal detail actions, assertions, and API interception helpers

## Project/Test Structure

Key testing files:

- `tests/conftest.py` - Playwright fixtures, one-time auth, context setup, failure screenshots, Allure environment/history setup
- `tests/test_signal_detail_positive.py` - positive, API, UI, edge, and skipped bug tests
- `tests/test_signal_detail_negative.py` - negative/error-handling tests

Generated output paths:

- `reports/report.html` - pytest-html output
- `allure-results/` - Allure raw results
- `allure-report/` - generated Allure report (when created)

## Running Tests

### Prerequisites

- Node.js installed (to run app)
- Python virtual environment at `.venv` with test dependencies
- App available at `http://localhost:3000`

### Install Python test dependencies

```bash
python -m pip install -r requirements.txt
python -m playwright install
```

### Start the app

```bash
npm install
npm run dev
```

Login credentials used by the tests:

- `qa@test.com`
- `test1234`

### Run full suite

```bash
.\.venv\Scripts\python.exe -m pytest -v
```

### Run only positive tests

```bash
.\.venv\Scripts\python.exe -m pytest -m positive -v
```

### Run only negative tests

```bash
.\.venv\Scripts\python.exe -m pytest -m negative -v
```

### Run edge tests

```bash
.\.venv\Scripts\python.exe -m pytest -m edge -v
```

## Allure Report

The suite writes raw Allure data into `allure-results/` automatically.

### Generate and open report

If the Allure CLI is installed:

```bash
allure generate allure-results --clean -o allure-report
allure open allure-report
```

Notes:

- `conftest.py` writes `environment.properties` for run metadata.
- Previous history is copied when available to support trend view.
- `allure-results/`, `allure-report/`, and `.allure-history/` are ignored in git.

## Pytest Markers

Configured markers in `pytest.ini`:

- `positive`
- `negative`
- `edge`
- `bug`

Examples:

```bash
.\.venv\Scripts\python.exe -m pytest -m "positive or edge" -v
.\.venv\Scripts\python.exe -m pytest -m "not bug" -v
```

## Known Bug Handling

Known bug tests are intentionally marked skipped until fixed, while still documenting expected behavior.

Current skipped bug test:

- `test_bug_hardcoded_compare_data_inconsistency`

## Troubleshooting

- App not running on `:3000`: start with `npm run dev` before tests.
- Authentication issues: remove `tests/.auth/state.json` and rerun tests to regenerate auth state.
- Empty Allure report: ensure tests ran and `allure-results/` contains files before `allure generate`.
