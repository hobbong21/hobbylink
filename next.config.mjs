/** @type {import('next').NextConfig} */

// Content Security Policy.
// Keep this as restrictive as possible; when integrating third-parties
// (analytics, map SDK, etc.) add their origin here and nowhere else.
const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : "*.supabase.co"

const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // required by Next.js runtime; acceptable with Trusted Types-less fallback
    "'unsafe-eval'",
    "https://va.vercel-scripts.com",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    `https://${SUPABASE_HOST}`,
    `wss://${SUPABASE_HOST}`,
    "https://va.vercel-scripts.com",
  ],
  "frame-ancestors": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "object-src": ["'none'"],
  "upgrade-insecure-requests": [],
}

const csp = Object.entries(cspDirectives)
  .map(([k, v]) => (v.length > 0 ? `${k} ${v.join(" ")}` : k))
  .join("; ")

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["warn", "error"] } : false,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ]
  },
}

export default nextConfig
