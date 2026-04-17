import { describe, it, expect } from "vitest"
import { escapeHtml } from "@/lib/email/escape"

describe("escapeHtml", () => {
  it("escapes HTML control characters", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    )
  })

  it("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry")
  })

  it("escapes quotes", () => {
    expect(escapeHtml(`"he'll"`)).toBe("&quot;he&#39;ll&quot;")
  })

  it("leaves plain text alone", () => {
    expect(escapeHtml("안녕하세요 Tom")).toBe("안녕하세요 Tom")
  })
})
