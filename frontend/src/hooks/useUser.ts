import { useContext } from "react";
import { UserContext, type UserContextType } from "@/contexts/userContext";

export const useUser = (): UserContextType => {
	const context = useContext(UserContext);
	if (!context) throw new Error("Must be used within UserProvider");
	return context;
};
