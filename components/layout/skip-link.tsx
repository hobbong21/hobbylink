"use client"

/**
 * WCAG "Skip to main content" link. Renders visually hidden until focused
 * (e.g. by pressing Tab right after the page loads), then jumps keyboard
 * users past the header nav directly to #main-content.
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:shadow focus:outline focus:outline-2 focus:outline-primary"
    >
      메인 콘텐츠로 바로가기
    </a>
  )
}
