import json
import logging
import os
import uuid
from datetime import datetime

import allure
import pytest
from playwright.sync_api import BrowserContext

# Configure logging for conftest.py
logger = logging.getLogger(__name__)

# Path to store authentication state
AUTH_STATE_FILE = os.path.join(os.path.dirname(__file__), ".auth", "state.json")

# Generate unique run ID for this test session
RUN_ID = str(uuid.uuid4())[:8]
RUN_TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")


@pytest.fixture(scope="session", autouse=True)
def perform_authentication_first(browser):
    """
    Perform authentication FIRST and save state before any tests run.

    This fixture must run before browser_context_args to ensure auth state file exists.
    Runs at the very beginning of test session execution.
    """
    # Create auth state directory if needed
    os.makedirs(os.path.dirname(AUTH_STATE_FILE), exist_ok=True)

    # Skip if auth state already exists (from previous test run)
    if os.path.exists(AUTH_STATE_FILE):
        logger.info(f"Using existing authentication state from {AUTH_STATE_FILE}")
        return

    logger.info("Authenticating once for entire test session...")

    # Create new context and page for authentication
    context = browser.new_context(base_url="http://localhost:3000")
    page = context.new_page()

    try:
        # Perform login
        page.goto("/login")
        page.fill('[data-testid="login-email"]', "qa@test.com")
        page.fill('[data-testid="login-password"]', "test1234")
        page.click('[data-testid="login-submit"]')
        page.wait_for_url("**/dashboard")

        logger.info("Login successful")

        # Save both Playwright storage state AND custom sessionStorage data
        auth_data = {
            "playwright_state": context.storage_state(),
            "session_storage": {
                "traffic_auth_user": page.evaluate("sessionStorage.getItem('traffic_auth_user')"),
                "traffic_auth_token": page.evaluate("sessionStorage.getItem('traffic_auth_token')")
            }
        }

        with open(AUTH_STATE_FILE, 'w') as f:
            json.dump(auth_data, f)

        logger.info(f"Authentication state saved to {AUTH_STATE_FILE}")
    except Exception as ex:
        logger.error(f"Authentication failed: {str(ex)}")
        raise
    finally:
        context.close()


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args, perform_authentication_first):
    """
    Configure browser context with base URL and authentication state.

    Depends on perform_authentication_first to ensure auth state file exists.
    Persists authentication state across all tests by loading from saved auth file.

    Args:
        browser_context_args: Default Playwright browser context args
        perform_authentication_first: Dependency to ensure auth happens first
    """
    context_args = {
        **browser_context_args,
        "base_url": "http://localhost:3000",
    }

    # Load authentication state if it exists
    if os.path.exists(AUTH_STATE_FILE):
        with open(AUTH_STATE_FILE, 'r') as f:
            auth_data = json.load(f)

        # Apply Playwright storage state (cookies, localStorage)
        context_args["storage_state"] = auth_data["playwright_state"]
        logger.info(f"Applying stored authentication state to browser context")
    else:
        logger.warning("Auth state file not found, tests will require login")

    return context_args


@pytest.fixture(scope="session")
def launch_args():
    """
    Configure browser launch arguments with slowdown and window size.
    
    Note: headless/headed mode is configured in pytest.ini [playwright] section.
    Browser will run in headed mode by default for visibility during testing.

    Returns:
        dict: Browser launch configuration
    """
    return {
        "slow_mo": 1000,
        "args": ["--start-maximized"],
    }


@pytest.fixture(scope="function")
def page(context: BrowserContext):
    """
    Override Playwright's default page fixture to ensure auth state is loaded.

    This fixture creates a page within the context that should have auth state applied.
    Creates a new page and navigates to dashboard to verify authentication works.
    Manually restores sessionStorage data that Playwright doesn't handle.

    Args:
        context: Browser context with auth state applied

    Yields:
        Page: Playwright page object ready for testing
    """
    page = context.new_page()

    # Restore sessionStorage data (Playwright doesn't handle this automatically)
    if os.path.exists(AUTH_STATE_FILE):
        with open(AUTH_STATE_FILE, 'r') as f:
            auth_data = json.load(f)

        session_data = auth_data.get("session_storage", {})
        if session_data.get("traffic_auth_user"):
            page.add_init_script(f"""
                sessionStorage.setItem('traffic_auth_user', '{session_data['traffic_auth_user']}');
                sessionStorage.setItem('traffic_auth_token', '{session_data['traffic_auth_token']}');
            """)
            logger.info("Restored sessionStorage authentication data")

    # Navigate to dashboard to verify authentication works
    page.goto("http://localhost:3000/dashboard")
    page.wait_for_load_state("networkidle")

    # Verify we're authenticated (not on login page)
    if "/login" in page.url:
        logger.warning("Still on login page after loading auth state - authentication may have failed")
    else:
        logger.info(f"Authentication successful - on page: {page.url}")

    yield page
    page.close()


@pytest.fixture(scope="session", autouse=True)
def create_allure_environment():
    """
    Create Allure environment.properties file for each test run.
    This adds metadata that appears in the Allure report.
    """
    env_content = f"""Browser=Chromium
Platform=Windows
Test_Run_ID={RUN_ID}
Timestamp={RUN_TIMESTAMP}
Test_Suite=Signal Detail Page Tests
Environment=Development
"""

    # Create allure-results directory if it doesn't exist
    os.makedirs("allure-results", exist_ok=True)

    # Write environment.properties file
    with open("allure-results/environment.properties", "w") as f:
        f.write(env_content)


@pytest.fixture(scope="session", autouse=True)
def setup_allure_history():
    """
    Set up Allure history by copying previous history data to allure-results.
    This enables trend analysis and historical comparison in Allure reports.
    """
    history_dir = "allure-results/history"
    previous_history_dir = "allure-report/history"

    # Create history directory if it doesn't exist
    os.makedirs(history_dir, exist_ok=True)

    # Copy previous history if it exists
    if os.path.exists(previous_history_dir):
        import shutil

        try:
            for file_name in os.listdir(previous_history_dir):
                src_file = os.path.join(previous_history_dir, file_name)
                dst_file = os.path.join(history_dir, file_name)
                if os.path.isfile(src_file):
                    shutil.copy2(src_file, dst_file)
        except Exception as e:
            print(f"Warning: Could not copy history files: {e}")


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    # Check if the test failed during the 'call' phase
    if report.when == "call" and report.failed:
        # Access the page fixture from the test item
        page = item.funcargs.get("page")

        if page:
            # Take a screenshot
            screenshot_path = f"failure_{item.nodeid.replace('::', '_').replace('/', '_')}.png"
            page.screenshot(path=screenshot_path)

            # Optional: Attach to Allure report
            allure.attach(page.screenshot(), name="failure", attachment_type=allure.attachment_type.PNG)
