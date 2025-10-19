// src/lib/api.ts
import { supabase } from "@/lib/supabase"

// export const API_BASE = import.meta.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const API_BASE = "https://movielily.azurewebsites.net";

export async function api(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init.headers || {})
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  return fetch(url, { ...init, headers })
}
