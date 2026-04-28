"""Shared helpers for page object classes."""

from playwright.sync_api import Locator, Page


class BasePage:
    """Base page object containing shared helpers."""

    def __init__(self, page: Page):
        self.page = page

    def goto(self, path: str):
        self.page.goto(path)

    def locator(self, selector: str) -> Locator:
        return self.page.locator(selector)
