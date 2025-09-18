// src/lib/privacy-client.ts
import { api } from "@/lib/api"

export type Visibility = "public" | "friends" | "private"
export type FavsVis = "everyone" | "friends" | "only_me"

export type PrivacySettings = {
  profile_visibility: Visibility
  allow_friend_requests: boolean
  show_activity: boolean
  show_favorites_to: FavsVis
  allow_tagging: boolean
  blocked_users: string[]
}

export const defaults: PrivacySettings = {
  profile_visibility: "public",
  allow_friend_requests: true,
  show_activity: true,
  show_favorites_to: "friends",
  allow_tagging: true,
  blocked_users: [],
}

const KEY = "privacy_settings_demo_v1"
const FORCE_FAKE = import.meta.env.VITE_PRIVACY_FAKE === "1"

/** -------- LocalStorage helpers (modo demo / fallback) -------- */
function readLS(): PrivacySettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults }
    const d = JSON.parse(raw)
    return {
      ...defaults,
      ...d,
      blocked_users: Array.isArray(d?.blocked_users) ? d.blocked_users : [],
    }
  } catch {
    return { ...defaults }
  }
}

function writeLS(v: PrivacySettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v))
  } catch {}
}

/** Decide se devemos cair para o modo local */
function shouldFallback(resp?: Response) {
  return (
    FORCE_FAKE ||
    !resp ||
    !resp.ok ||
    resp.status === 401 ||
    resp.status === 403 ||
    resp.status === 404
  )
}

/** Normaliza dados parciais vindos do backend */
function normalizeSettings(s: any, blocked: string[]): PrivacySettings {
  return {
    profile_visibility: (s?.profile_visibility ?? defaults.profile_visibility) as Visibility,
    allow_friend_requests:
      typeof s?.allow_friend_requests === "boolean"
        ? s.allow_friend_requests
        : defaults.allow_friend_requests,
    show_activity:
      typeof s?.show_activity === "boolean" ? s.show_activity : defaults.show_activity,
    show_favorites_to: (s?.show_favorites_to ?? defaults.show_favorites_to) as FavsVis,
    allow_tagging:
      typeof s?.allow_tagging === "boolean" ? s.allow_tagging : defaults.allow_tagging,
    blocked_users: Array.isArray(blocked) ? blocked : [],
  }
}

/** -------------------- Public API -------------------- */

export async function loadAll(): Promise<PrivacySettings> {
  if (FORCE_FAKE) return readLS()

  try {
    const rSettings = await api("/api/privacy")
    const rBlocks = await api("/api/privacy/blocklist")

    if (shouldFallback(rSettings) || shouldFallback(rBlocks)) {
      return readLS()
    }

    const s = await rSettings.json()
    const b = await rBlocks.json()   // { blocked_users: [...] }

    return normalizeSettings(s, b?.blocked_users ?? [])
  } catch {
    return readLS()
  }
}

export async function saveAll(v: PrivacySettings): Promise<void> {
  const payload = {
    profile_visibility: v.profile_visibility,
    allow_friend_requests: v.allow_friend_requests,
    show_activity: v.show_activity,
    show_favorites_to: v.show_favorites_to,
    allow_tagging: v.allow_tagging,
  }

  if (FORCE_FAKE) {
    const cur = readLS()
    writeLS({ ...cur, ...payload })
    return
  }

  try {
    const r = await api("/api/privacy", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
    if (shouldFallback(r)) {
      const cur = readLS()
      writeLS({ ...cur, ...payload })
    }
  } catch {
    const cur = readLS()
    writeLS({ ...cur, ...payload })
  }
}

export async function blockUser(user: string): Promise<string[]> {
  user = user.trim()
  if (!user) return readLS().blocked_users

  if (FORCE_FAKE) {
    const s = readLS()
    if (!s.blocked_users.includes(user)) {
      s.blocked_users = [...s.blocked_users, user]
      writeLS(s)
    }
    return s.blocked_users
  }

  try {
    const r = await api("/api/privacy/block", {
      method: "POST",
      body: JSON.stringify({ user }),
    })
    if (shouldFallback(r)) {
      const s = readLS()
      if (!s.blocked_users.includes(user)) {
        s.blocked_users = [...s.blocked_users, user]
        writeLS(s)
      }
      return s.blocked_users
    }
    const d = await r.json() // { ok: true, blocked_users: [...] }
    const list = Array.isArray(d?.blocked_users) ? d.blocked_users : []
    const cur = readLS()
    writeLS({ ...cur, blocked_users: list })
    return list
  } catch {
    const s = readLS()
    if (!s.blocked_users.includes(user)) {
      s.blocked_users = [...s.blocked_users, user]
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
    const r = await api(`/api/privacy/block/${encodeURIComponent(user)}`, {
      method: "DELETE",
    })
    if (shouldFallback(r)) {
      const s = readLS()
      s.blocked_users = s.blocked_users.filter(u => u !== user)
      writeLS(s)
      return s.blocked_users
    }
    const d = await r.json() // { ok: true, blocked_users: [...] }
    const list = Array.isArray(d?.blocked_users) ? d.blocked_users : []
    const cur = readLS()
    writeLS({ ...cur, blocked_users: list })
    return list
  } catch {
    const s = readLS()
    s.blocked_users = s.blocked_users.filter(u => u !== user)
    writeLS(s)
    return s.blocked_users
  }
}
