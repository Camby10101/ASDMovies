// src/pages/GroupRecommendationsPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type TopGenreResponse = {
  genre: string | null;
  support: number;   // how many favorites in this genre across the group
  avg_rank: number;  // lower is better
};

const GroupRecommendationsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [topGenre, setTopGenre] = useState<TopGenreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) return;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await api(`/api/groups/${groupId}/top-genre`, { method: "GET" });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch top genre");
        }
        const data: TopGenreResponse = await res.json();
        setTopGenre(data);
      } catch (e: any) {
        setErr(e?.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Group Recommendations</h1>
        <Button asChild variant="secondary">
          <Link to={`/groups/${groupId}`}>Back to Group</Link>
        </Button>
      </div>

      <Card className="p-6">
        {loading && <p>Loading top genre…</p>}
        {err && <p className="text-red-600 text-sm">Error: {err}</p>}

        {!loading && !err && (
          <>
            <p className="text-gray-600 text-sm mb-1">Group ID: {groupId}</p>
            <h2 className="text-xl font-medium">
              Top Genre:{" "}
              <span className="font-semibold">
                {topGenre?.genre ?? "No genre found"}
              </span>
            </h2>
            {topGenre?.genre && (
              <p className="text-sm text-gray-500 mt-2">
                Votes: {topGenre.support} &middot; Avg. rank: {topGenre.avg_rank.toFixed(2)}
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default GroupRecommendationsPage;
