// src/lib/privacy-client.ts
import { api } from "@/lib/api"

export type PrivacySettings = {
  profile_visibility: "public" | "friends" | "private"
  allow_friend_requests: boolean
  show_activity: boolean
  show_favorites_to: "everyone" | "friends" | "only_me"
  allow_tagging: boolean
  blocked_users: string[]
}

export const defaults: PrivacySettings = {
  profile_visibility: "public",
  allow_friend_requests: true,
  show_activity: true,
  show_favorites_to: "friends",
  allow_tagging: true,
  blocked_users: []
}

const KEY = "privacy_settings_demo_v1"
const FORCE_FAKE = (import.meta.env.VITE_PRIVACY_FAKE === "1")

function readLS(): PrivacySettings {
  const raw = localStorage.getItem(KEY)
  if (!raw) return { ...defaults }
  try {
    const d = JSON.parse(raw)
    return { ...defaults, ...d, blocked_users: d.blocked_users ?? [] }
  } catch {
    return { ...defaults }
  }
}

function writeLS(v: PrivacySettings) {
  localStorage.setItem(KEY, JSON.stringify(v))
}

function shouldFallback(resp?: Response) {
  return FORCE_FAKE || !resp || resp.status === 401 || resp.status === 403 || resp.status === 404
}

export async function loadAll(): Promise<PrivacySettings> {
  if (FORCE_FAKE) return readLS()
  try {
    const r = await api("/api/privacy")
    if (shouldFallback(r)) return readLS()
    const d = await r.json()
    return { ...defaults, ...d, blocked_users: d.blocked_users ?? [] }
  } catch {
    return readLS()
  }
}

export async function saveAll(v: PrivacySettings): Promise<void> {
  if (FORCE_FAKE) return writeLS(v)
  try {
    const r = await api("/api/privacy", {
      method: "PUT",
      body: JSON.stringify({
        profile_visibility: v.profile_visibility,
        allow_friend_requests: v.allow_friend_requests,
        show_activity: v.show_activity,
        show_favorites_to: v.show_favorites_to,
        allow_tagging: v.allow_tagging,
      })
    })
    if (shouldFallback(r)) return writeLS(v)
  } catch {
    writeLS(v)
  }
}

export async function blockUser(user: string): Promise<string[]> {
  user = user.trim()
  if (!user) return readLS().blocked_users
  if (FORCE_FAKE) {
    const s = readLS()
    if (!s.blocked_users.includes(user)) {
      s.blocked_users.push(user)
      writeLS(s)
    }
    return s.blocked_users
  }
  try {
    const r = await api("/api/privacy/block", {
      method: "POST",
      body: JSON.stringify({ user })
    })
    if (shouldFallback(r)) {
      const s = readLS()
      if (!s.blocked_users.includes(user)) {
        s.blocked_users.push(user)
        writeLS(s)
      }
      return s.blocked_users
    }
    const d = await r.json()
    return d.blocked_users ?? []
  } catch {
    const s = readLS()
    if (!s.blocked_users.includes(user)) {
      s.blocked_users.push(user)
      writeLS(s)
    }
    return s.blocked_users
  }
}

export async function unblockUser(user: string): Promise<string[]> {
  user = user.trim()
  if (!user) return readLS().blocked_users
  if (FORCE_FAKE) {
    const s = readLS()
    s.blocked_users = s.blocked_users.filter(u => u !== user)
    writeLS(s)
    return s.blocked_users
  }
  try {
    const r = await api(`/api/privacy/block/${encodeURIComponent(user)}`, { method: "DELETE" })
    if (shouldFallback(r)) {
      const s = readLS()
      s.blocked_users = s.blocked_users.filter(u => u !== user)
      writeLS(s)
      return s.blocked_users
    }
    const d = await r.json()
    return d.blocked_users ?? []
  } catch {
    const s = readLS()
    s.blocked_users = s.blocked_users.filter(u => u !== user)
    writeLS(s)
    return s.blocked_users
  }
}
