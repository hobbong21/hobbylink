import { test, expect } from "@playwright/test"

/**
 * Auth + gated page flow.
 *
 * These tests assume a dev Supabase project where anon signup is enabled but
 * email confirmation is OFF (so the test account activates immediately).
 * Tests use a unique email per run so they can be re-executed.
 *
 * Skip the whole file when credentials aren't wired up.
 */
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"

test.describe("Signup → interests → matching", () => {
  test("shows validation errors on bad signup", async ({ page }) => {
    await page.goto("/signup")
    await page.getByLabel(/이름/).fill("테스트 사용자")
    await page.getByLabel(/이메일/).fill("not-an-email")
    await page.getByLabel(/^비밀번호$/).fill("short")
    await page.getByLabel(/비밀번호 확인/).fill("short")
    // Browser-native validation blocks submit; ensure the page didn't navigate.
    await page.getByRole("button", { name: /회원가입/ }).click()
    await expect(page).toHaveURL(/\/signup$/)
  })

  test("signup form requires matching password confirmation", async ({ page }) => {
    await page.goto("/signup")
    await page.getByLabel(/이름/).fill("테스트")
    await page.getByLabel(/이메일/).fill(`qa-${Date.now()}@example.com`)
    await page.getByLabel(/^비밀번호$/).fill("password123!")
    await page.getByLabel(/비밀번호 확인/).fill("DIFFERENT123!")
    await page.getByLabel(/이용약관/).check()
    await page.getByRole("button", { name: /회원가입/ }).click()
    await expect(page.getByRole("alert")).toContainText("비밀번호가 일치하지 않습니다")
  })
})

test.describe("Search dialog keyboard shortcut", () => {
  test("⌘K opens and submit navigates to /search", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit requires different modifier handling")
    await page.goto("/")
    // ⌘K / Ctrl+K global shortcut
    const modifier = process.platform === "darwin" ? "Meta" : "Control"
    await page.keyboard.press(`${modifier}+k`)
    await expect(page.getByRole("dialog")).toBeVisible()
    await page.getByLabel("검색어").fill("등산")
    await page.keyboard.press("Enter")
    // Strip the protocol from BASE so the regex matches both localhost and
    // a deployed host. `\/\//` — the slashes in a regex literal need a
    // single backslash each; doubling them terminates the regex early.
    const host = BASE.replace(/^https?:\/\//, "")
    await expect(page).toHaveURL(new RegExp(`${host}/search\\?q=`))
  })
})

test.describe("Landing footer links resolve", () => {
  for (const path of [
    "/about",
    "/help",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/pricing",
    "/faq",
    "/status",
  ]) {
    test(`${path} renders a heading`, async ({ page }) => {
      await page.goto(path)
      await expect(page.locator("h1")).toBeVisible()
    })
  }
})
