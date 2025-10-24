import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY

  console.log("[v0] Supabase URL:", supabaseUrl ? "exists" : "missing")
  console.log("[v0] Supabase Anon Key:", supabaseAnonKey ? "exists" : "missing")

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase URL and Anon Key are required")
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
