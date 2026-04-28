"""Page object for shared navigation layout."""

from .base_page import BasePage


class LayoutComponent(BasePage):
    LOCATORS = {
        "main_nav": '[data-testid="main-nav"]',
        "nav_dashboard": '[data-testid="nav-dashboard"]',
        "nav_signals": '[data-testid="nav-signals"]',
        "nav_logout": '[data-testid="nav-logout"]',
    }

    def click_dashboard(self):
        self.page.click(self.LOCATORS["nav_dashboard"])

    def click_signals(self):
        self.page.click(self.LOCATORS["nav_signals"])

    def click_logout(self):
        self.page.click(self.LOCATORS["nav_logout"])
