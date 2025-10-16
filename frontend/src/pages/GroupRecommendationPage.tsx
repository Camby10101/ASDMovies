// src/pages/groups/GroupRecommendationPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";

type Member = {
  user_id: string;
  user_email: string | null;
  is_admin?: boolean;
  joined_at?: string;
};

export default function GroupRecommendationPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ Use the known-good route you tested
        const res = await api(`/api/groups/${groupId}/members`, { method: "GET" });
        const data = await res.json();
        // data is expected to be an array of members
        setMembers(Array.isArray(data) ? data : []);
      } catch (e: any) {
        // show the backend error body if available
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">
        Group Recommendations (IDs) — {groupId}
      </h1>

      <Link to={`/groups/${groupId}`}>
        <span className="text-blue-600 hover:underline">Back to Group</span>
      </Link>

      {loading && <p>Loading…</p>}
      {error && (
        <p className="text-red-600">
          Error: {error}
        </p>
      )}

      {!loading && !error && (
        <>
          {members.length === 0 ? (
            <p>No members found.</p>
          ) : (
            <ul className="list-disc pl-6 space-y-1">
              {members.map((m) => (
                <li key={m.user_id}>
                  <strong>user_id:</strong> {m.user_id}{" "}
                  — <strong>email:</strong> {m.user_email || "—"}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
