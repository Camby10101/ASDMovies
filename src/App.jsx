// src/App.jsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import Movies from "./pages/Movies";
import Account from "./pages/Account";
import MovieTest from "./pages/MovieTest";

const router = createBrowserRouter([
  {
    element: <RootLayout />, 
    children: [
      { path: "/", element: <Home /> },
      { path: "/movies", element: <Movies /> },
      { path: "/account", element: <Account /> },
      { path: "/movieTest", element: <MovieTest /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
