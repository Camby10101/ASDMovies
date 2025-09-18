import { useState, useEffect, type ReactNode } from "react";
import { CurrentUserContext } from "./CurrentUserContext";
import type { User } from "@/types/user";

export const CurrentUserProvider = ({ children }: { children: ReactNode }) => {
  	const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const res = await fetch("/api/profile", { credentials: "include" });
				if (!res.ok) throw new Error("Failed to fetch user");
					const data = await res.json();
					setUser(data);
			} catch (err) {
				console.error(err);
				setUser(null);
			} finally {
				setLoading(false);
			}
		};

		fetchCurrentUser();
  	}, []);

  return (
    <CurrentUserContext value={{ user, setUser, loading }}>
      {children}
    </CurrentUserContext>
  );
};