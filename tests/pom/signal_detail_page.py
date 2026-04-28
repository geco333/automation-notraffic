"""Page object for signal detail page."""

from typing import Any, Callable

from playwright.sync_api import expect

from .base_page import BasePage


class SignalDetailPage(BasePage):
    LOCATORS = {
        "page": '[data-testid="signal-detail-page"]',
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
        "api_near_miss": "**/data/near-miss.json*",
        "api_near_miss_signal_3": "**/data/near-miss.json?signalId=3",
    }

    def open(self, signal_id: str):
        self.goto(f"/signals/{signal_id}")

    def set_cycle_seconds(self, value: str):
        self.page.fill(self.LOCATORS["signal_cycle_input"], value)

    def save_cycle(self):
        self.page.click(self.LOCATORS["signal_save"])

    def open_date_picker(self):
        self.page.click(self.LOCATORS["date_picker"])

    def intercept_near_miss(self, handler: Callable[[Any], None]):
        self.page.route(self.LOCATORS["api_near_miss"], handler)

    def intercept_near_miss_signal_3(self, handler: Callable[[Any], None]):
        self.page.route(self.LOCATORS["api_near_miss_signal_3"], handler)

    def mock_near_miss_404(self):
        self.page.route(self.LOCATORS["api_near_miss"], lambda route: route.fulfill(status=404))

    def mock_near_miss_invalid_json(self):
        self.page.route(self.LOCATORS["api_near_miss"], lambda route: route.fulfill(json={"invalid": "data"}))

    def select_day(self, day: str):
        self.page.click(f"text={day}")

    def assert_page_visible(self):
        expect(self.page.locator(self.LOCATORS["page"])).to_be_visible()

    def assert_signal_name(self, expected_name: str):
        expect(self.page.locator(self.LOCATORS["signal_name"])).to_have_text(expected_name)

    def assert_status_contains(self, expected_text: str):
        expect(self.page.locator(self.LOCATORS["signal_status"])).to_contain_text(expected_text)

    def assert_near_miss_table_visible(self):
        expect(self.page.locator(self.LOCATORS["near_miss_table"])).to_be_visible()

    def assert_near_miss_table_hidden(self):
        expect(self.page.locator(self.LOCATORS["near_miss_table"])).not_to_be_visible()

    def assert_core_controls_visible(self):
        expect(self.page.locator(self.LOCATORS["back_button"])).to_be_visible()
        expect(self.page.locator(self.LOCATORS["near_miss_table"])).to_be_visible()
        expect(self.page.locator(self.LOCATORS["search_results"])).to_be_visible()
        expect(self.page.locator(self.LOCATORS["download_pdf"])).to_be_visible()
        expect(self.page.locator(self.LOCATORS["download_csv"])).to_be_visible()
        expect(self.page.locator(self.LOCATORS["signal_cycle_input"])).to_be_visible()

    def assert_near_miss_first_cell_text(self, expected: str):
        expect(self.page.locator(self.LOCATORS["near_miss_table_cell"]).first).to_have_text(expected)

    def assert_search_results_first_cell_text(self, expected: str):
        expect(self.page.locator(self.LOCATORS["search_results_cell"]).first).to_have_text(expected)

    def get_near_miss_first_cell_text(self) -> str:
        return self.page.locator(self.LOCATORS["near_miss_table_cell"]).first.inner_text().strip()

    def get_search_results_first_cell_text(self) -> str:
        return self.page.locator(self.LOCATORS["search_results_cell"]).first.inner_text().strip()

    def assert_toast_visible(self):
        expect(self.page.locator(self.LOCATORS["toast"])).to_be_visible()

    def assert_first_date_picker_value(self, expected: str):
        expect(self.page.locator(self.LOCATORS["date_picker"]).first).to_have_value(expected)
