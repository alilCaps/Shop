import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "../Logo";
import { assetUrl } from "../../services/api";
import StatusBadge from "../StatusBadge";
import {
    api,
    clearSession,
    getStoredUser,
    homeFor,
    roleOf
} from "../../services/api";
import {
    BellIcon,
    ClipboardIcon,
    GridIcon,
    HomeIcon,
    LogoutIcon,
    PackageIcon,
    MenuIcon,
    RefreshIcon,
    StoreIcon,
    XIcon
} from "../icons";

const MENU = [
    { to: "/seller/dashboard", label: "Dashboard", icon: GridIcon },
    { to: "/seller/shop", label: "My Shop", icon: StoreIcon },
    { to: "/seller/products", label: "Products", icon: PackageIcon },
    { to: "/seller/orders", label: "Orders", icon: ClipboardIcon },
    { to: "/seller/returns", label: "Returns", icon: RefreshIcon },
    { to: "/seller/notifications", label: "Notifications", icon: BellIcon }
];

// Auth guard + sidebar for every Seller Centre page (nested layout route).
// Pages read { user, shop, reloadShop } with useOutletContext().
export default function SellerLayout() {
    const navigate = useNavigate();
    const [user] = useState(() => getStoredUser());
    const [shop, setShop] = useState(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);

    const allowed = Boolean(user?.token) && roleOf(user) === "seller";

    useEffect(() => {
        if (!user?.token) {
            navigate("/login", { replace: true });
        } else if (!allowed) {
            navigate(homeFor(user), { replace: true });
        }
    }, [user, allowed, navigate]);

    async function reloadShop() {
        try {
            const data = await api(`/api/seller/${user.user_id}/shop`);
            setShop(data.shop);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setReady(true);
        }
    }

    useEffect(() => {
        if (allowed) reloadShop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowed]);

    useEffect(() => {
        if (!menuOpen) return undefined;

        const onKey = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [menuOpen]);

    function logout() {
        clearSession();
        navigate("/login", { replace: true });
    }

    if (!allowed) return null;

    const closeMenu = () => setMenuOpen(false);

    const name =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.username;

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-350 flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={menuOpen}
                            className="rounded-md border border-gray-200 p-2 text-gray-700 hover:bg-gray-50"
                        >
                            <MenuIcon width={20} height={20} />
                        </button>
                        <Logo to="/seller/dashboard" className="w-28" label="SELLER CENTRE" />
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        {shop && (
                            <>
                                {shop.shop_logo && (
                                    <img
                                        src={assetUrl(shop.shop_logo)}
                                        alt=""
                                        className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                                    />
                                )}
                                <span className="font-medium">{shop.shop_name}</span>
                                <StatusBadge status={shop.status} />
                            </>
                        )}
                        <span className="text-gray-500">{name}</span>
                    </div>
                </div>
            </header>

            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={closeMenu}
                    aria-hidden="true"
                />
            )}

            <aside
                aria-label="Seller menu"
                aria-hidden={!menuOpen}
                className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-200 ${
                    menuOpen ? "translate-x-0" : "-translate-x-full invisible"
                }`}
            >
                <div className="flex items-center justify-between border-b border-gray-100 p-4">
                    <Logo to="/seller/dashboard" className="w-28" label="SELLER CENTRE" />
                    <button
                        type="button"
                        onClick={closeMenu}
                        aria-label="Close menu"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                        <XIcon width={18} height={18} />
                    </button>
                </div>

                <nav className="flex-1 p-2">
                    {MENU.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={closeMenu}
                            className={({ isActive }) =>
                                `flex items-center gap-3 rounded-md px-3 py-3 text-sm transition ${
                                    isActive
                                        ? "bg-[#fff1ed] text-[#EE4D2D]"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`
                            }
                        >
                            <item.icon width={18} height={18} className="shrink-0" />
                            {item.label}
                        </NavLink>
                    ))}

                    <Link
                        to="/"
                        onClick={closeMenu}
                        className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <HomeIcon width={18} height={18} className="shrink-0" />
                        Back to store
                    </Link>
                </nav>

                <div className="border-t border-gray-100 p-2">
                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <LogoutIcon width={18} height={18} className="shrink-0" />
                        Logout
                    </button>
                </div>
            </aside>

            <div className="mx-auto max-w-350 px-4 py-6">
                <main className="min-w-0">
                    {!ready ? (
                        <div className="flex min-h-60 items-center justify-center">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EE4D2D]" />
                        </div>
                    ) : error ? (
                        <p role="alert" className="rounded bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </p>
                    ) : (
                        <Outlet context={{ user, shop, reloadShop }} />
                    )}
                </main>
            </div>
        </div>
    );
}
