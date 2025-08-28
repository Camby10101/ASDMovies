import { Link } from 'react-router';

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-6 flex items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="font-bold inline-block">
              ASD Movies
            </span>
          </Link>
        </div>

        <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link
            to="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Home
          </Link>
          <Link
            to="/movies"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Movies
          </Link>
          <Link
            to="/about"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            About
          </Link>
          <Link
            to="/friend"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            TEMP FRIENDS
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;