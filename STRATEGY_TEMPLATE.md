# Test strategy (candidate deliverable template)

*This assignment is designed to take 3–4 hours. We value a working solution with clear documentation over a comprehensive but incomplete one. Please track your approximate time.*

## 1. Test approach and tool choices

- **API testing**: (e.g. pytest + pytest-django + DRF APIClient)
- **E2E testing**: (e.g. Playwright Python or Cypress)
- **Integration testing**: (e.g. pytest-asyncio, channels.testing, fakeredis)
- **Rationale**: (brief justification)

## 2. Framework architecture

- Project structure: (e.g. `tests/api/`, `tests/e2e/`, `tests/integration/`)
- Fixtures and conftest: (e.g. auth, test data, API client)
- Design patterns: (e.g. Page Object Model for E2E)

## 3. Scaling to 500+ tests

- Test categorization and markers: (e.g. `@pytest.mark.unit`, `@pytest.mark.e2e`)
- Parallelization and CI stages: (e.g. unit → integration → e2e)
- Maintenance and flakiness mitigation

## 4. CI/CD integration

- (e.g. Jenkinsfile skeleton or `docker-compose.test.yml`)
- How tests are triggered and how reports are published

## 5. Quality improvement suggestions (5–8)

1. …
2. …

## 6. Known limitations and time spent

- What was not automated and why
- Approximate time: Part 1 ___ min, Part 2 ___ min, Part 3 ___ min, Part 4 ___ min
