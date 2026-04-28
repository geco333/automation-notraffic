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
from playwright.sync_api import Page

from tests.pom import SignalDetailPage

# Generate unique run ID for this test session
RUN_ID = str(uuid.uuid4())[:8]
RUN_TIMESTAMP = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

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
    signal_detail_page = SignalDetailPage(page)

    with allure.step("Navigate to Signal Detail page for ID 3"):
        signal_detail_page.open("3")

    with allure.step("Verify page components are visible"):
        signal_detail_page.assert_page_visible()

    with allure.step("Verify signal information displays correctly"):
        signal_detail_page.assert_signal_name("Main & 5th")
        signal_detail_page.assert_status_contains("Status: online")
        signal_detail_page.assert_status_contains("Phase: green")


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
    signal_detail_page = SignalDetailPage(page)
    api_called = False
    response_data = None

    def handle_route(route):
        nonlocal api_called, response_data

        api_called = True
        response = route.fetch()
        response_data = response.json()
        route.fulfill(response=response)

    with allure.step("Set up API interception for signal ID 3"):
        signal_detail_page.intercept_near_miss_signal_3(handle_route)
        signal_detail_page.open("3")
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
    Positive test: Verify API call and payload correctness for signal ID 1.

    Validates:
    - API endpoint includes the correct signalId query parameter
    - API request is made when navigating to signal detail page
    - API payload for signal ID 1 includes required near-miss structure and numeric values

    Args:
        page (Page): Playwright page object for interaction.
    """
    signal_detail_page = SignalDetailPage(page)
    api_url = ""
    response_data = None

    def handle_route(route):
        nonlocal api_url, response_data

        api_url = route.request.url
        response = route.fetch()
        response_data = response.json()
        route.fulfill(response=response)

    with allure.step("Set up API interception and navigate to signal ID 1"):
        signal_detail_page.intercept_near_miss(handle_route)
        signal_detail_page.open("1")
        page.wait_for_load_state("networkidle")

    with allure.step("Verify correct signal ID parameter in API request"):
        assert "signalId=1" in api_url

    with allure.step("Verify signal ID 1 response payload structure and value types"):
        assert response_data is not None
        required_keys = {"dateTimeRange", "nLeg", "sLeg", "eLeg", "wLeg", "updatedAt"}
        assert required_keys.issubset(response_data.keys())

        leg_keys = {"allRoadUsers", "onlyVehicles", "bicycleInvolved", "pedestrianInvolved"}
        for leg in ("nLeg", "sLeg", "eLeg", "wLeg"):
            assert leg_keys.issubset(response_data[leg].keys())
            for metric in leg_keys:
                assert isinstance(response_data[leg][metric], int)


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
    signal_detail_page = SignalDetailPage(page)

    with allure.step("Navigate to Signal Detail page"):
        signal_detail_page.open("3")

    with allure.step("Verify all UI elements are visible"):
        signal_detail_page.assert_core_controls_visible()


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
    signal_detail_page = SignalDetailPage(page)

    with allure.step("Navigate to Signal Detail page"):
        signal_detail_page.open("3")

    with allure.step("Verify dynamic API data in near-miss table"):
        signal_detail_page.assert_near_miss_first_cell_text("2")

    with allure.step("Verify hardcoded comparison data in search results table"):
        signal_detail_page.assert_search_results_first_cell_text("12")


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
    signal_detail_page = SignalDetailPage(page)

    with allure.step("Navigate to Signal Detail page"):
        signal_detail_page.open("3")

    with allure.step("Fill and submit signal cycle form"):
        signal_detail_page.set_cycle_seconds("100")
        signal_detail_page.save_cycle()

    with allure.step("Verify success notification appears"):
        signal_detail_page.assert_toast_visible()


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
    signal_detail_page = SignalDetailPage(page)

    with allure.step("Navigate to Signal Detail page"):
        signal_detail_page.open("3")

    with allure.step("Open date picker and select date"):
        signal_detail_page.open_date_picker()
        signal_detail_page.select_day("15")

    with allure.step("Verify selected date value"):
        signal_detail_page.assert_first_date_picker_value("15/03/2026")


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
    signal_detail_page = SignalDetailPage(page)

    with allure.step("Navigate to Signal Detail page"):
        signal_detail_page.open("3")

    with allure.step("Validate compare table mirrors near-miss API data (expected behavior)"):
        near_miss_first_cell = signal_detail_page.get_near_miss_first_cell_text()
        compare_first_cell = signal_detail_page.get_search_results_first_cell_text()
        assert compare_first_cell == near_miss_first_cell
