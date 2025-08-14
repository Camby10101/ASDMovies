import { useEffect, useState } from "react";
import { getTrending } from "../lib/api";
import "./MovieTest.css";

export default function MovieTest() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    getTrending("day").then(setData).catch(setErr);
  }, []);

  if (err) return <p>Error: {String(err.message || err)}</p>;
  if (!data) return <p>Loading…</p>;

  return (
    <>
      <h1>Trending</h1>
      <ul className="movie-grid">
        {data.results?.slice(0, 100).map(m => (
          <li key={m.id} className="movie-card">
            {m.poster_path ? (
              <img
                className="movie-poster"
                alt={m.title}
                loading="lazy"
                src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                srcSet={
                  `https://image.tmdb.org/t/p/w185${m.poster_path} 185w, ` +
                  `https://image.tmdb.org/t/p/w342${m.poster_path} 342w, ` +
                  `https://image.tmdb.org/t/p/w500${m.poster_path} 500w`
                }
                sizes="(min-width: 1100px) 160px, (min-width: 700px) 25vw, 45vw"
                width={228} height={342} /* keeps layout stable */
              />
            ) : (
              <div className="movie-poster" aria-label="No poster available" />
            )}
            <div className="movie-meta">
              <div className="movie-title">{m.title}</div>
              <div className="movie-year">{m.release_date?.slice(0, 4) || "-"}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}