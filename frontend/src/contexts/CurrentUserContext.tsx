import { createContext } from "react";
import type { User } from "@/types/user";

export interface UserContextType {
	user: User | null;
	setUser: (user: User | null) => void;
	loading: boolean;
}

export const CurrentUserContext = createContext<UserContextType | undefined>(undefined);