const MovieListPage = () => {
  const movies = [
    { title: "Inception", year: 2010 },
    { title: "The Matrix", year: 1999 },
    { title: "Interstellar", year: 2014 },
    { title: "The Dark Knight", year: 2008 },
    { title: "Pulp Fiction", year: 1994 },
  ];

  return (
    <div>
      <h1>Movies</h1>
      <ul>
        {movies.map((movie) => (
          <li key={movie.title}>
            {movie.title} ({movie.year})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MovieListPage;