import { createBrowserRouter } from 'react-router';
import App from './App.tsx';
import HomePage from './pages/HomePage.tsx';
import AboutPage from './pages/AboutPage.tsx';
import FriendPage from './pages/FriendPage.tsx';
import MovieListPage from './pages/movies/MovieListPage.tsx'
import ProfilePage from './pages/ProfilePage.tsx';

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
        path: "about",
        element: <AboutPage />,
      },
      {
        path: "friend",
        element: <FriendPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
]);