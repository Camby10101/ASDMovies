// CurrentUserContext.tsx
import { createContext } from "react";
import type { User as SupabaseUser } from "@supabase/auth-js";

export interface UserContextType {
	currentUser: SupabaseUser | null;
	setCurrentUser: (user: SupabaseUser | null) => void;
	loading: boolean;
}

export const CurrentUserContext = createContext<UserContextType | undefined>(undefined);