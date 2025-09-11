// src/pages/PrivacyPage.tsx
import { useEffect, useState } from "react"
import { Typography } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import {
  loadAll,
  saveAll,
  blockUser,
  unblockUser,
  defaults,
  type PrivacySettings
} from "@/lib/privacy-client"

export default function PrivacyPage() {
  const [data, setData] = useState<PrivacySettings>(defaults)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [who, setWho] = useState("")
  const isDemo = import.meta.env.VITE_PRIVACY_FAKE === "1"

  const load = async () => {
    setLoading(true); setErr(null)
    try {
      const d = await loadAll()
      setData(d)
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setErr(null)
    try {
      await saveAll(data)
    } catch {
      setErr("Failed to save settings")
    }
  }

  const addBlock = async () => {
    if (!who.trim()) return
    try {
      const list = await blockUser(who)
      setData(s => ({ ...s, blocked_users: list }))
      setWho("")
    } catch {
      setErr("Failed to block user")
    }
  }

  const removeBlock = async (u: string) => {
    try {
      const list = await unblockUser(u)
      setData(s => ({ ...s, blocked_users: list }))
    } catch {
      setErr("Failed to unblock user")
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Typography size="h1">Privacy & Account Controls</Typography>
        {isDemo && (
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-900">
            Demo mode (local storage)
          </span>
        )}
      </div>

      {loading && <p>Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && (
        <>
          <section className="rounded-2xl border p-4 space-y-4">
            <Typography size="h2">Profile visibility</Typography>
            <select
              className="rounded border p-2"
              value={data.profile_visibility}
              onChange={e => setData({ ...data, profile_visibility: e.target.value as any })}
            >
              <option value="public">Public</option>
              <option value="friends">Friends only</option>
              <option value="private">Private</option>
            </select>
            <p className="text-sm text-muted-foreground">
              Choose who can view your profile information.
            </p>
          </section>

          <section className="rounded-2xl border p-4 space-y-3">
            <Typography size="h2">Preferences</Typography>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.allow_friend_requests}
                onChange={e => setData({ ...data, allow_friend_requests: e.target.checked })}
              />
              Allow friend requests
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.show_activity}
                onChange={e => setData({ ...data, show_activity: e.target.checked })}
              />
              Show my activity (likes, favorites)
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={data.allow_tagging}
                onChange={e => setData({ ...data, allow_tagging: e.target.checked })}
              />
              Allow tagging my profile
            </label>

            <div className="flex items-center gap-2">
              <span>Who can see my favorites:</span>
              <select
                className="rounded border p-2"
                value={data.show_favorites_to}
                onChange={e => setData({ ...data, show_favorites_to: e.target.value as any })}
              >
                <option value="everyone">Everyone</option>
                <option value="friends">Friends</option>
                <option value="only_me">Only me</option>
              </select>
            </div>

            <Button onClick={save}>Save changes</Button>
          </section>

          <section className="rounded-2xl border p-4 space-y-3">
            <Typography size="h2">Blocklist</Typography>

            <div className="flex gap-2">
              <input
                className="flex-1 rounded border p-2"
                placeholder="user id or email to block"
                value={who}
                onChange={e => setWho(e.target.value)}
              />
              <Button onClick={addBlock}>Block</Button>
            </div>

            {data.blocked_users.length === 0 ? (
              <p className="text-muted-foreground">No blocked users.</p>
            ) : (
              <ul className="space-y-2">
                {data.blocked_users.map(u => (
                  <li key={u} className="flex items-center justify-between rounded border p-2">
                    <span className="font-mono">{u}</span>
                    <Button variant="secondary" onClick={() => removeBlock(u)}>Unblock</Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
