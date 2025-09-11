import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ApiFriend = { user_id: string; email: string | null };

const Friends: React.FC = () => {
  const [friends, setFriends] = useState<ApiFriend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newFriendUserId, setNewFriendUserId] = useState<string>("");

  const backendUrl = useMemo(() => {
    return import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) throw new Error("Not signed in");

        const resp = await fetch(`${backendUrl}/api/friends`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!resp.ok) throw new Error(`Failed to load friends (${resp.status})`);
        const json = await resp.json();
        if (!mounted) return;
        setFriends(json.friends ?? []);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Failed to load friends");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [backendUrl]);

  const handleAddFriend = async (evt: React.FormEvent) => {
    evt.preventDefault();
    setError(null);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Not signed in");
      if (!newFriendUserId) throw new Error("Enter a user id");

      const form = new URLSearchParams();
      form.set("friend_user_id", newFriendUserId);

      const resp = await fetch(`${backendUrl}/api/friends?${form.toString()}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) throw new Error(`Failed to add friend (${resp.status})`);
      // Reload list
      setNewFriendUserId("");
      const listResp = await fetch(`${backendUrl}/api/friends`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await listResp.json();
      setFriends(json.friends ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to add friend");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>

      <form onSubmit={handleAddFriend} className="mb-6 flex gap-2">
        <input
          type="text"
          className="border rounded px-3 py-2 w-full max-w-md"
          placeholder="Enter friend's user_id"
          value={newFriendUserId}
          onChange={(e) => setNewFriendUserId(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Friend
        </button>
      </form>

      {loading && <div>Loading friends…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <div
              key={friend.user_id}
              className="bg-white shadow-md rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-lg transition"
            >
              <div className="w-20 h-20 rounded-full mb-4 bg-gray-200 flex items-center justify-center">
                <span className="text-xl">👤</span>
              </div>
              <h2 className="text-xl font-semibold">{friend.email ?? friend.user_id}</h2>
              <p className="text-gray-600 text-sm mt-2 break-all">{friend.user_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Friends;
