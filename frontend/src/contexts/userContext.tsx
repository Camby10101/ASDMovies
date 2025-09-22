import { createContext } from "react";
import type { Profile } from "@/types/profile";

export interface UserContextType {
    user: Profile | null;
    loading: boolean;
    refreshUser: () => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);