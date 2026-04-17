import { test, expect } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"

/**
 * Runs axe-core against key public pages. Reports serious+ violations as
 * test failures. WCAG 2.1 AA is the bar; update `withTags` to scope the
 * ruleset to your compliance target.
 */
const pages = ["/", "/about", "/pricing", "/faq", "/help", "/contact"]

for (const path of pages) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path)
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze()

    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    )
    expect(
      serious,
      serious.map((v) => `${v.id}: ${v.help}`).join("\n"),
    ).toEqual([])
  })
}
