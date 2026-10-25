import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStoredUser, homeFor, isCustomer } from "../services/api";

// For customer-only pages: returns the logged-in customer, or redirects.
export function useRequireCustomer() {
    const navigate = useNavigate();
    const [user] = useState(() => getStoredUser());

    const allowed = Boolean(user?.token) && isCustomer(user);

    useEffect(() => {
        if (!user?.token) {
            navigate("/login", { replace: true });
        } else if (!isCustomer(user)) {
            navigate(homeFor(user), { replace: true });
        }
    }, [user, navigate]);

    return allowed ? user : null;
}
