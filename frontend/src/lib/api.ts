// src/lib/api.ts
import { supabase } from "@/lib/supabase"

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000"

export async function api(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init.headers || {})
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (token && !headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`)

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`
  return fetch(url, { ...init, headers })
}
