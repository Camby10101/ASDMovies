import { useContext } from "react";
import { CurrentUserContext } from "@/contexts/CurrentUserContext";

export const useCurrentUser = () => {
    const context = useContext(CurrentUserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
};