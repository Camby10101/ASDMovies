import { NavLink } from "react-router-dom";

export default function NavBar({ brand = "MyApp", links = [] }) {
  return (
    <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
      <strong style={{ marginRight: "2rem" }}>{brand}</strong>
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          style={{ marginRight: "1rem" }}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

