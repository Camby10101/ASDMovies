import { createBrowserRouter } from 'react-router';
import App from './App.tsx';
import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import MovieListPage from './pages/movies/MovieListPage.tsx'
import TrendingMoviesPage from './pages/movies/TrendingMoviesPage.tsx';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "movies",
        element: <MovieListPage />,
      },
      {
        path: "trendingMovies",
        element: <TrendingMoviesPage/>
      },
      {
        path: "about",
        element: <AboutPage />,
      },
    ],
  },
]);
