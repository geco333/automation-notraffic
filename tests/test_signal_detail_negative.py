"""
Negative test suite for Signal Detail page functionality.

This module contains negative automated tests for the Signal Detail page (http://localhost:3000/signals/{signalId}).
Tests cover negative scenarios and error handling.
"""

import pytest
import allure
import uuid
import os
from datetime import datetime
from playwright.sync_api import Page, expect

# Generate unique run ID for this test session
RUN_ID = str(uuid.uuid4())[:8]
RUN_TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")


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


@allure.epic("Signal Detail Page")
@allure.feature("Error Handling")
@allure.story("Invalid Signal ID")
@pytest.mark.negative
def test_negative_invalid_signal_id_shows_error(page: Page):
    """
    Negative test: Verify application behavior with invalid signal ID.

    Validates:
    - Application gracefully handles non-existent signal IDs
    - Falls back to mock data when signal not found
    - Still displays signal information (in this case, mock data)

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to non-existent signal ID"):
        page.goto("/signals/999")

    with allure.step("Verify fallback to mock data"):
        # App falls back to mock data for invalid IDs, so check for mock signal name
        expect(page.locator('[data-testid="signal-name"]')).to_have_text("Main & 5th")


@allure.epic("Signal Detail Page")
@allure.feature("API Error Handling")
@allure.story("404 Error Response")
@pytest.mark.negative
def test_negative_api_404_fallback(page: Page):
    """
    Negative test: Verify application handles API 404 errors gracefully.

    Validates:
    - Application doesn't crash when API returns 404 status
    - Fallback to default/mock data occurs
    - Near-miss table remains visible despite API failure

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Set up API to return 404 error"):
        page.route("**/data/near-miss.json*", lambda route: route.fulfill(status=404))

    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Verify graceful fallback - table still visible"):
        # Should fallback to default data, table still visible
        expect(page.locator('[data-testid="near-miss-table"]')).to_be_visible()


@allure.epic("Signal Detail Page")
@allure.feature("API Error Handling")
@allure.story("Invalid JSON Response")
@pytest.mark.negative
def test_negative_invalid_api_response(page: Page):
    """
    Negative test: Verify application behavior with malformed API response.

    Validates:
    - Application handles invalid/malformed JSON response
    - Missing required data fields causes appropriate error handling
    - UI elements are hidden when data structure is invalid

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Set up API to return invalid JSON"):
        page.route("**/data/near-miss.json*", lambda route: route.fulfill(json={"invalid": "data"}))

    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Verify error handling - table hidden"):
        # Invalid JSON causes failure, table not shown
        expect(page.locator('[data-testid="near-miss-table"]')).not_to_be_visible()
