
import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/movies", label: "Movies" },
  { to: "/account", label: "Account" },
  { to: "/movieTest", label: "MovieTest" },
];

export default function RootLayout() {
  return (
    <>
      <NavBar brand="Movie Magic" links={links} />
      <main style={{ padding: "1rem" }}>
        <Outlet />
      </main>
    </>
  );
}
