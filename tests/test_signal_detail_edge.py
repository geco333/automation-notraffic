"""
Edge-case test suite for Signal Detail page functionality.

This module contains edge-case automated tests for the Signal Detail page
(http://localhost:3000/signals/{signalId}).
"""

import allure
import pytest
from playwright.sync_api import Page

from tests.pom import SignalDetailPage


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
