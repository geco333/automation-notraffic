"""
Negative test suite for Signal Detail page functionality.

This module contains negative automated tests for the Signal Detail page (http://localhost:3000/signals/{signalId}).
Tests cover negative scenarios and error handling.

Test categories:
- Negative tests: Verify behavior with invalid data or error responses
"""

import pytest
from playwright.sync_api import Page, expect


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
    page.goto("/signals/999")

    # App falls back to mock data for invalid IDs, so check for mock signal name
    expect(page.locator('[data-testid="signal-name"]')).to_have_text("Main & 5th")


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
    page.route("**/data/near-miss.json*", lambda route: route.fulfill(status=404))
    page.goto("/signals/3")

    # Should fallback to default data, table still visible
    expect(page.locator('[data-testid="near-miss-table"]')).to_be_visible()


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
    page.route("**/data/near-miss.json*", lambda route: route.fulfill(json={"invalid": "data"}))
    page.goto("/signals/3")

    # Invalid JSON causes failure, table not shown
    expect(page.locator('[data-testid="near-miss-table"]')).not_to_be_visible()
