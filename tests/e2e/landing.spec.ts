import { test, expect } from "@playwright/test"

test.describe("Landing page", () => {
  test("renders hero and signup CTA", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: /HobbyLink/i }).first()).toBeVisible()
    await expect(page.getByRole("link", { name: /회원가입|Sign up/i }).first()).toBeVisible()
  })

  test("navigates to signup", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /회원가입|Sign up/i }).first().click()
    await expect(page).toHaveURL(/\/signup$/)
    await expect(page.getByRole("heading", { name: /회원가입/i })).toBeVisible()
  })
})

test.describe("Protected routes redirect to login", () => {
  for (const path of ["/profile", "/settings", "/messages", "/matching"]) {
    test(`${path} redirects when unauthenticated`, async ({ page }) => {
      await page.goto(path)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
