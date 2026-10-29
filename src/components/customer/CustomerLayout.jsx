import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreHeader from "../store/StoreHeader";
import { MenuIcon } from "../icons";
import CustomerSidebar from "../../views/customer/components/CustomerSidebar";
import {
    api,
    clearSession,
    getStoredUser,
    homeFor,
    isCustomer
} from "../../services/api";

// Auth + header + sidebar for every "My Account" page.
// `children` is a render function that receives the verified user.
export default function CustomerLayout({
    activeMenu,
    title,
    subtitle,
    actions,
    children
}) {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const stored = getStoredUser();

        if (!stored?.token || !stored?.user_id) {
            clearSession();
            navigate("/login", { replace: true });
            return undefined;
        }

        if (!isCustomer(stored)) {
            navigate(homeFor(stored), { replace: true });
            return undefined;
        }

        let cancelled = false;

        api(`/users/${stored.user_id}`)
            .then((data) => {
                if (!cancelled) setUser(data.user);
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err.message || "Unable to load your account.");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    function handleLogout() {
        clearSession();
        navigate("/login", { replace: true });
    }

    const displayName =
        [user?.first_name, user?.last_name]
            .filter((name) => typeof name === "string" && name.trim())
            .join(" ") ||
        user?.username ||
        "Customer";

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
            <StoreHeader />

            <main className="mx-auto max-w-300 px-4 py-6">
                <div>
                    <CustomerSidebar
                        user={user}
                        displayName={displayName}
                        activeMenu={activeMenu}
                        open={menuOpen}
                        onClose={() => setMenuOpen(false)}
                        onLogout={handleLogout}
                    />

                    <section className="min-w-0 overflow-hidden rounded-lg bg-white shadow-sm">
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-5">
                            <div className="flex min-w-0 items-start gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(true)}
                                    aria-label="Open account menu"
                                    aria-expanded={menuOpen}
                                    className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                                >
                                    <MenuIcon width={20} height={20} />
                                </button>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-medium">{title}</h1>
                                    {subtitle && (
                                        <p className="mt-1 text-sm text-gray-500">
                                            {subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {user && actions}
                        </div>

                        {error ? (
                            <div className="p-10 text-center">
                                <p className="text-sm text-red-600">{error}</p>
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="mt-4 rounded-md bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : !user ? (
                            <div className="flex min-h-60 items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EE4D2D]" />
                            </div>
                        ) : (
                            children(user)
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
