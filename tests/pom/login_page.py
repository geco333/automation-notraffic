"""Page object for login page."""

from .base_page import BasePage


class LoginPage(BasePage):
    URL = "/login"
    LOCATORS = {
        "email": '[data-testid="login-email"]',
        "password": '[data-testid="login-password"]',
        "submit": '[data-testid="login-submit"]',
    }

    def open(self):
        self.goto(self.URL)

    def fill_credentials(self, email: str, password: str):
        self.page.fill(self.LOCATORS["email"], email)
        self.page.fill(self.LOCATORS["password"], password)

    def submit(self):
        self.page.click(self.LOCATORS["submit"])

    def login(self, email: str, password: str):
        self.fill_credentials(email, password)
        self.submit()
