# E2E Selenium Tests

This directory contains end-to-end UI tests for the ERD Builder application using Selenium and pytest.

## Test Structure

- `conftest.py` - Pytest fixtures for WebDriver setup, authentication, and test utilities
- `test_erd_flows.py` - Main test cases covering 5 user stories
- `run_tests.sh` - Shell script to run tests inside Docker
- `requirements.txt` - Python dependencies

## User Stories Tested

1. **Create Entity** - Add entity nodes via toolbar button
2. **Rename Entity** - Edit entity labels by double-clicking
3. **Add Attributes** - Add attribute nodes to the canvas
4. **Connect Entities** - Draw edges between nodes using handles
5. **Generate SQL** - Transform ERD to DSD and generate SQL scripts

## Running Tests

### Via Docker Compose (Recommended)

```bash
# Start all services including test infrastructure
docker-compose --profile test up --build

# Or run tests against already-running services
docker-compose --profile test run tests
```

### Viewing Test Results

After tests complete:
- HTML report: `tests/reports/report.html`
- Screenshots on failure: `tests/reports/<test_name>_failure.png`

### Debugging Tests

You can connect to the Selenium browser via VNC:
- URL: `http://localhost:7900`
- Password: `secret`

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FRONTEND_URL` | `http://frontend:3000` | URL of the frontend service |
| `SELENIUM_HUB` | `http://selenium-chrome:4444/wd/hub` | Selenium WebDriver hub URL |
| `TEST_USERNAME` | `testuser` | Test account username |
| `TEST_PASSWORD` | `TestP@ssw0rd!2024` | Test account password |

## Adding New Tests

1. Add test functions in `test_erd_flows.py` or create new test files
2. Use fixtures from `conftest.py`:
   - `driver` - Raw WebDriver instance
   - `logged_in_driver` - WebDriver with authenticated session
   - `editor_page` - Driver positioned on editor with example project
   - `empty_editor_page` - Driver positioned on editor with new empty project
   - `wait_factory` - Create WebDriverWait instances

3. Follow naming convention: `test_<action>_<expected_result>`
