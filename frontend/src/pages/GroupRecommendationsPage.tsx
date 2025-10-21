import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/ui/movieCard";
import { api } from "@/lib/api";
import { fetchTrending, type Movie } from "@/lib/tmdb-api-helper";

type TopGenreBackend = {
  group_id: string;
  top_genre: string | null;
  reason?: { count: number; avg_rank: number };
  breakdown?: { genre: string; count: number; avg_rank: number }[];
};

const PAGE_SIZE = 20; // same feel as TMDB

const GroupRecommendationsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();

  const [topGenre, setTopGenre] = useState<string | null>(null);

  const [period, setPeriod] = useState<"day" | "week">("week");
  const [allTrending, setAllTrending] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);

  // 1) Load top genre for the group
  useEffect(() => {
    if (!groupId) return;

    let cancelled = false;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await api(`/api/groups/${groupId}/top-genre`);
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch top genre");
        }
        const data: TopGenreBackend = await res.json();
        if (!cancelled) setTopGenre(data.top_genre ?? null);
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? "Failed to fetch top genre");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupId]);

  // 2) Load trending movies pool (first 3 pages) and keep updating when period changes
  useEffect(() => {
    let aborted = false;
    const ctrl = new AbortController();

    (async () => {
      try {
        setErr(null);
        setLoading(true);
        // Grab first 3 pages to have enough to filter by genre
        const pagesToFetch = [1, 2, 3];
        const results = await Promise.all(
          pagesToFetch.map((p) => fetchTrending(period, p, ctrl.signal))
        );
        const combined = results.flatMap((r) => r.movies);
        if (!aborted) {
          setAllTrending(combined);
          setPage(1); // reset pagination when period changes
        }
      } catch (e: any) {
        if (!aborted && e.name !== "AbortError") {
          setErr(e?.message ?? "Failed to load trending movies");
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    })();

    return () => {
      aborted = true;
      ctrl.abort();
    };
  }, [period]);

  // 3) Filter to the chosen genre
  const filtered = useMemo(() => {
    if (!topGenre) return [];
    return allTrending.filter((m) =>
      (m.genre ?? "").toLowerCase() === topGenre.toLowerCase()
    );
  }, [allTrending, topGenre]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSlice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handlePeriodChange = (newPeriod: "day" | "week") => {
    setPeriod(newPeriod);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Group Recommendations</h1>
          <p className="text-sm text-muted-foreground">
            Group ID: {groupId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary">
            <Link to={`/groups/${groupId}`}>Back to Group</Link>
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-6">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {err && <p className="text-red-600">Error: {err}</p>}

        {!loading && !err && (
          <>
            <h2 className="text-2xl font-semibold">
              Chosen Genre:{" "}
              <span className="font-bold">
                {topGenre ?? "—"}
              </span>
            </h2>

            {topGenre ? (
              <p className="text-sm text-muted-foreground mt-1">
                Showing trending movies in <strong>{topGenre}</strong>.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                No top genre found for this group yet.
              </p>
            )}
          </>
        )}
      </Card>

      {/* Period selector */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            className="cursor-pointer"
            variant={period === "day" ? "default" : "secondary"}
            onClick={() => handlePeriodChange("day")}
          >
            Today
          </Button>
          <Button
            className="cursor-pointer"
            variant={period === "week" ? "default" : "secondary"}
            onClick={() => handlePeriodChange("week")}
          >
            This Week
          </Button>
        </div>

        {!loading && !err && (
          <p className="text-sm text-muted-foreground">
            {topGenre
              ? `Found ${total} ${topGenre} movies`
              : "—"}
          </p>
        )}
      </div>

      {/* Movie grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading && <p className="text-muted-foreground">Loading movies…</p>}
        {!loading && !err && topGenre && pageSlice.length === 0 && (
          <p className="text-muted-foreground">
            No trending movies found for {topGenre} (try switching period).
          </p>
        )}
        {!loading && !err && topGenre && pageSlice.length > 0 && (
          pageSlice.map((m) => (
            <MovieCard
              key={m.id}
              id={m.id}
              title={m.title}
              year={m.year}
              poster={m.poster}
              genre={m.genre}
              rating={m.rating}
              description={m.description}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && !err && topGenre && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>

          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNum)}
                  className="min-w-10"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default GroupRecommendationsPage;
