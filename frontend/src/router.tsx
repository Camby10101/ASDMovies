import { createBrowserRouter } from 'react-router';
import TrendingMoviesPage from './pages/movies/TrendingMoviesPage.tsx';
import App from './App.tsx';
import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import FriendPage from './pages/FriendPage.tsx';
import MovieListPage from './pages/movies/MovieListPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx';
import IndividualMoviePage from './pages/movies/IndividualMoviePage.tsx';
import AccountPage from './pages/AccountPage.tsx';
import PrivacyPage from './pages/PrivacyPage.tsx';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "trendingMovies",
        element: <TrendingMoviesPage/>
      },
      {
        index: true,
        element: <TrendingMoviesPage />,
      },
      {
        path: "movies",
        element: <MovieListPage />,
      },
      {
        path: "movies/:id",
        element: <IndividualMoviePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "friend",
        element: <FriendPage />,
      },
      {
        path: "profile/",
        element: <ProfilePage />,
      },
      {
        path: "account",
        element: <AccountPage />,
      },
      // NOVO: rota /privacy
      {
        path: "privacy",
        element: <PrivacyPage />,
      },
    ],
  },
]);
