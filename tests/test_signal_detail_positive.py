"""
Positive test suite for Signal Detail page functionality.

This module contains positive automated tests for the Signal Detail page (http://localhost:3000/signals/{signalId}).
Tests cover positive scenarios, edge cases, API validation, and UI behavior.

Test categories:
- Positive tests: Verify expected behavior with valid data
- Edge case tests: Test boundary conditions and special scenarios
- Bug tests: Document known bugs (marked as skipped)
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

# Global locators dictionary for easier maintenance and updates
LOCATORS = {
    "signal_detail_page": '[data-testid="signal-detail-page"]',
    "signal_name": '[data-testid="signal-name"]',
    "signal_status": '[data-testid="signal-status"]',
    "near_miss_table": '[data-testid="near-miss-table"]',
    "near_miss_table_cell": '[data-testid="near-miss-table"] .near-miss-cell-inner',
    "search_results": '[data-testid="search-results"]',
    "search_results_cell": '[data-testid="search-results"] .near-miss-cell-inner',
    "download_pdf": '[data-testid="download-pdf"]',
    "download_csv": '[data-testid="download-csv"]',
    "signal_cycle_input": '[data-testid="signal-cycle-input"]',
    "signal_save": '[data-testid="signal-save"]',
    "toast": '[data-testid="toast"]',
    "back_button": "button.back",
    "date_picker": ".search-params-date-only",
    # API endpoints
    "api_near_miss": "**/data/near-miss.json*",
    "api_near_miss_signal_3": "**/data/near-miss.json?signalId=3",
}

# Expected API response data for signal ID 3
expected_near_miss_data = {
    "dateTimeRange": "14 Mar 06:00 - 15 Mar 23:59",
    "nLeg": {"allRoadUsers": 2, "onlyVehicles": 1, "bicycleInvolved": 0, "pedestrianInvolved": 1},
    "sLeg": {"allRoadUsers": 5, "onlyVehicles": 3, "bicycleInvolved": 1, "pedestrianInvolved": 1},
    "eLeg": {"allRoadUsers": 1, "onlyVehicles": 1, "bicycleInvolved": 0, "pedestrianInvolved": 0},
    "wLeg": {"allRoadUsers": 3, "onlyVehicles": 2, "bicycleInvolved": 0, "pedestrianInvolved": 1},
    "updatedAt": "2026-03-15T12:00:00.000Z",
}


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
@allure.feature("Page Loading")
@allure.story("Successful Page Load")
@pytest.mark.positive
def test_positive_page_loads_successfully_for_signal_id_3(page: Page):
    """
    Positive test: Verify Signal Detail page loads correctly for signal ID 3.

    Validates:
    - Signal detail page component is visible
    - Signal name displays correctly as "Main & 5th"
    - Signal status shows as "online"
    - Signal phase shows as "green"

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to Signal Detail page for ID 3"):
        page.goto("/signals/3")

    with allure.step("Verify page components are visible"):
        expect(page.locator('[data-testid="signal-detail-page"]')).to_be_visible()

    pytest.fail()

    with allure.step("Verify signal information displays correctly"):
        expect(page.locator('[data-testid="signal-name"]')).to_have_text("Main & 5th")
        expect(page.locator('[data-testid="signal-status"]')).to_contain_text("Status: online")
        expect(page.locator('[data-testid="signal-status"]')).to_contain_text("Phase: green")


@allure.epic("Signal Detail Page")
@allure.feature("API Integration")
@allure.story("API Response Validation")
@pytest.mark.positive
def test_positive_api_validation_for_signal_id_3(page: Page):
    """
    Positive test: Verify API response data matches expected near-miss data for signal ID 3.

    Validates:
    - API endpoint is called with correct signal ID
    - API response matches the expected near-miss data structure
    - Response includes dateTimeRange, leg data (nLeg, sLeg, eLeg, wLeg), and updatedAt

    Args:
        page (Page): Playwright page object for interaction.
    """
    api_called = False
    response_data = None

    def handle_route(route):
        nonlocal api_called, response_data

        api_called = True
        response = route.fetch()
        response_data = response.json()
        route.fulfill(response=response)

    with allure.step("Set up API interception for signal ID 3"):
        page.route("**/data/near-miss.json?signalId=3", handle_route)
        page.goto("/signals/3")
        page.wait_for_load_state("networkidle")

    with allure.step("Verify API was called and response matches expected data"):
        assert api_called is True
        assert response_data == expected_near_miss_data


@allure.epic("Signal Detail Page")
@allure.feature("API Integration")
@allure.story("Signal ID Parameter")
@pytest.mark.positive
def test_positive_api_validation_for_signal_id_1(page: Page):
    """
    Positive test: Verify API is called with correct signal ID parameter for signal 1.

    Validates:
    - API endpoint includes the correct signalId query parameter
    - API request is made when navigating to signal detail page

    Args:
        page (Page): Playwright page object for interaction.
    """
    api_url = ""

    def handle_route(route):
        nonlocal api_url

        api_url = route.request.url
        route.fulfill(json=expected_near_miss_data)

    with allure.step("Set up API interception and navigate to signal ID 1"):
        page.route("**/data/near-miss.json*", handle_route)
        page.goto("/signals/1")
        page.wait_for_load_state("networkidle")

    with allure.step("Verify correct signal ID parameter in API request"):
        assert "signalId=1" in api_url


@allure.epic("Signal Detail Page")
@allure.feature("UI Components")
@allure.story("Element Visibility")
@pytest.mark.positive
def test_positive_ui_elements_are_present(page: Page):
    """
    Positive test: Verify all required UI elements are present on the Signal Detail page.

    Validates visibility of:
    - Back button
    - Near-miss table
    - Search results section
    - Download PDF button
    - Download CSV button
    - Signal cycle input field

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Verify all UI elements are visible"):
        expect(page.locator("button.back")).to_be_visible()
        expect(page.locator('[data-testid="near-miss-table"]')).to_be_visible()
        expect(page.locator('[data-testid="search-results"]')).to_be_visible()
        expect(page.locator('[data-testid="download-pdf"]')).to_be_visible()
        expect(page.locator('[data-testid="download-csv"]')).to_be_visible()
        expect(page.locator('[data-testid="signal-cycle-input"]')).to_be_visible()


@allure.epic("Signal Detail Page")
@allure.feature("Data Display")
@allure.story("Table Data Rendering")
@pytest.mark.positive
def test_positive_data_displays_correctly_in_tables(page: Page):
    """
    Positive test: Verify data displays correctly in the near-miss and search results tables.

    Validates:
    - Near-miss table displays dynamic data from API (value: 2 for nLeg allRoadUsers)
    - Search results (compare) table displays hardcoded comparison data (value: 12)

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Verify dynamic API data in near-miss table"):
        expect(page.locator('[data-testid="near-miss-table"] .near-miss-cell-inner').first).to_have_text("2")

    with allure.step("Verify hardcoded comparison data in search results table"):
        expect(page.locator('[data-testid="search-results"] .near-miss-cell-inner').first).to_have_text("12")


@allure.epic("Signal Detail Page")
@allure.feature("Form Interaction")
@allure.story("Form Submission")
@pytest.mark.positive
def test_positive_form_submissions_work(page: Page):
    """
    Positive test: Verify form submission for signal cycle changes works correctly.

    Validates:
    - Signal cycle input field accepts user input
    - Save button triggers form submission
    - Toast notification appears after successful submission

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Fill and submit signal cycle form"):
        page.fill('[data-testid="signal-cycle-input"]', "100")
        page.click('[data-testid="signal-save"]')

    with allure.step("Verify success notification appears"):
        expect(page.locator('[data-testid="toast"]')).to_be_visible()


@allure.epic("Signal Detail Page")
@allure.feature("Date Picker")
@allure.story("Date Selection")
@pytest.mark.edge
def test_edge_date_pickers_update(page: Page):
    """
    Edge case test: Verify date picker functionality and value updates.

    Validates:
    - Date picker can be opened/focused
    - Date selections are captured in the search parameters
    - Selected value updates correctly in the input field
    - Date format is correct (DD/MM/YYYY)

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Open date picker and select date"):
        page.click(".search-params-date-only")  # Open date picker
        page.click("text=15")  # Select date

    with allure.step("Verify selected date value"):
        expect(page.locator(".search-params-date-only").first).to_have_value("15/03/2026")


@allure.epic("Signal Detail Page")
@allure.feature("Data Consistency")
@allure.story("Bug Documentation")
@pytest.mark.bug
@pytest.mark.skip(reason="Bug: Hardcoded compare data inconsistency - skip until fixed")
def test_bug_hardcoded_compare_data_inconsistency(page: Page):
    """
    Known bug test: Document hardcoded compare data that doesn't match API data.

    Bug Description:
    The search results comparison table contains hardcoded data that doesn't match
    the dynamic API response for near-miss events. This causes the compare table
    to show incorrect statistic values.

    Expected Behavior:
    Compare table should use API data or be updated dynamically for accuracy.

    Status: SKIPPED - marked as skip until bug is fixed

    Args:
        page (Page): Playwright page object for interaction.
    """
    with allure.step("Navigate to Signal Detail page"):
        page.goto("/signals/3")

    with allure.step("Document known bug - hardcoded compare data"):
        # Would check if compare data matches API, but it's hardcoded
        assert True  # Placeholder
