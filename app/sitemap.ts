import type { MetadataRoute } from "next"

/**
 * Static sitemap for publicly accessible routes. Auth-gated routes (profile,
 * matching, etc.) are intentionally omitted so search engines don't index
 * login walls.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const now = new Date()
  const routes = [
    "",
    "/explore",
    "/events",
    "/community",
    "/about",
    "/features",
    "/pricing",
    "/help",
    "/faq",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/status",
    "/login",
    "/signup",
  ]

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.5,
  }))
}
