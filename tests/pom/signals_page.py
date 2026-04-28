"""Page object for signals list page."""

from .base_page import BasePage


class SignalsPage(BasePage):
    URL = "/signals"
    LOCATORS = {
        "page": '[data-testid="signals-list-page"]',
        "loading": '[data-testid="signals-loading"]',
    }

    def open(self):
        self.goto(self.URL)

    def signal_row(self, signal_id: str) -> str:
        return f'[data-testid="signal-row-{signal_id}"]'
