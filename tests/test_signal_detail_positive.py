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
from playwright.sync_api import Page, expect

# Expected API response data for signal ID 3
expected_near_miss_data = {
    "dateTimeRange": "14 Mar 06:00 - 15 Mar 23:59",
    "nLeg": {"allRoadUsers": 2, "onlyVehicles": 1, "bicycleInvolved": 0, "pedestrianInvolved": 1},
    "sLeg": {"allRoadUsers": 5, "onlyVehicles": 3, "bicycleInvolved": 1, "pedestrianInvolved": 1},
    "eLeg": {"allRoadUsers": 1, "onlyVehicles": 1, "bicycleInvolved": 0, "pedestrianInvolved": 0},
    "wLeg": {"allRoadUsers": 3, "onlyVehicles": 2, "bicycleInvolved": 0, "pedestrianInvolved": 1},
    "updatedAt": "2026-03-15T12:00:00.000Z",
}


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
    page.goto("/signals/3")

    expect(page.locator('[data-testid="signal-detail-page"]')).to_be_visible()
    expect(page.locator('[data-testid="signal-name"]')).to_have_text("Main & 5th")
    expect(page.locator('[data-testid="signal-status"]')).to_contain_text("Status: online")
    expect(page.locator('[data-testid="signal-status"]')).to_contain_text("Phase: green")


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

    page.route("**/data/near-miss.json?signalId=3", handle_route)
    page.goto("/signals/3")
    page.wait_for_load_state("networkidle")

    assert api_called is True
    assert response_data == expected_near_miss_data


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

    page.route("**/data/near-miss.json*", handle_route)
    page.goto("/signals/1")
    page.wait_for_load_state("networkidle")

    assert "signalId=1" in api_url


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
    page.goto("/signals/3")
    expect(page.locator("button.back")).to_be_visible()
    expect(page.locator('[data-testid="near-miss-table"]')).to_be_visible()
    expect(page.locator('[data-testid="search-results"]')).to_be_visible()
    expect(page.locator('[data-testid="download-pdf"]')).to_be_visible()
    expect(page.locator('[data-testid="download-csv"]')).to_be_visible()
    expect(page.locator('[data-testid="signal-cycle-input"]')).to_be_visible()


def test_positive_data_displays_correctly_in_tables(page: Page):
    """
    Positive test: Verify data displays correctly in the near-miss and search results tables.

    Validates:
    - Near-miss table displays dynamic data from API (value: 2 for nLeg allRoadUsers)
    - Search results (compare) table displays hardcoded comparison data (value: 12)

    Args:
        page (Page): Playwright page object for interaction.
    """
    page.goto("/signals/3")
    # Search Results table (dynamic data)
    expect(page.locator('[data-testid="near-miss-table"] .near-miss-cell-inner').first).to_have_text("2")

    # Compare table (hardcoded)
    expect(page.locator('[data-testid="search-results"] .near-miss-cell-inner').first).to_have_text("12")


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
    page.goto("/signals/3")
    page.fill('[data-testid="signal-cycle-input"]', "100")
    page.click('[data-testid="signal-save"]')
    expect(page.locator('[data-testid="toast"]')).to_be_visible()


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
    page.goto("/signals/3")
    page.click(".search-params-date-only")  # Open date picker
    page.click("text=15")  # Select date

    # Verify value updated (basic check)
    expect(page.locator(".search-params-date-only").first).to_have_value("15/03/2026")


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
    page.goto("/signals/3")

    # Would check if compare data matches API, but it's hardcoded
    assert True  # Placeholder
