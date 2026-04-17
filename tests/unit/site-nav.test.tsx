import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

// Override the global next/navigation mock for this test only.
const pathnameMock = vi.fn(() => "/matching")
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}))

import { SiteNav } from "@/components/layout/site-nav"

describe("SiteNav", () => {
  it("marks the active route with aria-current='page'", () => {
    pathnameMock.mockReturnValue("/matching")
    render(
      <SiteNav
        items={[
          { href: "/explore", label: "탐색" },
          { href: "/matching", label: "매칭" },
          { href: "/community", label: "커뮤니티" },
        ]}
      />,
    )

    const matchingLink = screen.getByRole("link", { name: "매칭" })
    expect(matchingLink).toHaveAttribute("aria-current", "page")

    const exploreLink = screen.getByRole("link", { name: "탐색" })
    expect(exploreLink).not.toHaveAttribute("aria-current")
  })

  it("treats prefix matches as active (e.g. /events/123)", () => {
    pathnameMock.mockReturnValue("/events/42")
    render(<SiteNav items={[{ href: "/events", label: "이벤트" }]} />)
    expect(screen.getByRole("link", { name: "이벤트" })).toHaveAttribute(
      "aria-current",
      "page",
    )
  })
})
