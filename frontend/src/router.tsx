import { createBrowserRouter } from 'react-router-dom';
import TrendingMoviesPage from './pages/movies/TrendingMoviesPage.tsx';
import App from './App.tsx';
// import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import FriendPage from './pages/FriendPage.tsx';
import GroupsPage from './pages/GroupsPage.tsx';
import GroupDetailsPage from './pages/GroupDetailsPage.tsx';
import MovieListPage from './pages/movies/MovieListPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx';
import IndividualMoviePage from './pages/movies/IndividualMoviePage.tsx';
import AccountPage from './pages/AccountPage.tsx';
import PrivacyPage from './pages/PrivacyPage.tsx';
import UserFavouriteMovies from './pages/movies/UserFavouriteMovies.tsx'; 
import GroupRecommendationsPage from './pages/GroupRecommendationsPage.tsx';

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
        path: "groups",
        element: <GroupsPage />,
      },
      {
        path: "/groups/:groupId",
        element: <GroupDetailsPage />,
      },
      {
        path: "/groups/:groupId/recommendations",
        element: <GroupRecommendationsPage />,
      },
      {
        path: "profile/:id",
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
      {
        path: "userFavouriteMovies/:id",
        element: <UserFavouriteMovies />,
      },
    ],
  },
]);
