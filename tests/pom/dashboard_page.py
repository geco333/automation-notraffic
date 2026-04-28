"""Page object for dashboard page."""

from .base_page import BasePage


class DashboardPage(BasePage):
    URL = "/dashboard"
    LOCATORS = {
        "page": '[data-testid="dashboard-page"]',
        "user": '[data-testid="dashboard-user"]',
        "ws_status": '[data-testid="ws-status"]',
        "loading": '[data-testid="dashboard-loading"]',
        "alert_list": '[data-testid="alert-list"]',
    }

    def open(self):
        self.goto(self.URL)
