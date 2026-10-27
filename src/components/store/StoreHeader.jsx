import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../Logo";
import { CartIcon, HeartIcon, SearchIcon } from "../icons";
import { api, clearSession, getStoredUser, homeFor, isCustomer } from "../../services/api";

// Shared header for the landing page, storefront and customer pages.
export default function StoreHeader({ initialQuery = "" }) {
    const navigate = useNavigate();
    const user = getStoredUser();
    const loggedIn = Boolean(user?.token);
    const customer = loggedIn && isCustomer(user);

    const [query, setQuery] = useState(initialQuery);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        if (!customer) return undefined;

        let cancelled = false;

        const loadCount = () => {
            api(`/api/customer/${user.user_id}/cart`)
                .then((data) => !cancelled && setCartCount(data.items?.length || 0))
                .catch(() => {});
        };

        loadCount();
        window.addEventListener("cart:updated", loadCount);

        return () => {
            cancelled = true;
            window.removeEventListener("cart:updated", loadCount);
        };
    }, [customer, user?.user_id]);

    const displayName =
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username || "";

    function handleSearch(event) {
        event.preventDefault();

        const term = query.trim();
        navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    }

    function logout() {
        clearSession();
        navigate("/login", { replace: true });
    }

    const topLink = "hover:opacity-80";

    return (
        <>
            <div className="bg-[#EE4D2D] text-xs text-white">
                <div className="mx-auto flex min-h-8 max-w-300 items-center justify-between gap-3 px-4">
                    <div className="flex items-center gap-3">
                        <Link to="/customer/notifications" className={topLink}>Notifications</Link>
                        {loggedIn && (
                            <>
                                <span className="opacity-50">·</span>
                                <Link to={homeFor(user)} className={topLink}>{displayName || "My account"}</Link>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <Link to="/seller/dashboard" className={topLink}>Seller Centre</Link>
                        <span className="opacity-50">·</span>
                        {loggedIn ? (
                            <button type="button" onClick={logout} className={topLink}>Logout</button>
                        ) : (
                            <>
                                <Link to="/signup" className={topLink}>Sign up</Link>
                                <span className="opacity-50">·</span>
                                <Link to="/login" className={topLink}>Login</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
                <div className="mx-auto flex min-h-17.5 max-w-300 items-center gap-6 px-4 py-3">
                    <Logo className="w-28" />

                    <form
                        onSubmit={handleSearch}
                        className="flex h-11 min-w-0 max-w-162.5 flex-1 items-center overflow-hidden rounded-lg bg-gray-100"
                    >
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search for products, brands and shops"
                            aria-label="Search products"
                            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            className="mr-1 flex h-9 w-14 shrink-0 items-center justify-center rounded-lg bg-[#EE4D2D] text-white hover:bg-[#d73211]"
                        >
                            <SearchIcon width={18} height={18} />
                        </button>
                    </form>

                    <nav className="flex shrink-0 items-center gap-5 text-xs text-gray-600">
                        <Link to="/search" className="hidden hover:text-[#EE4D2D] md:inline">Categories</Link>
                        <Link to="/#flash-sale" className="hidden hover:text-[#EE4D2D] md:inline">Flash Sale</Link>
                        <Link to="/search" className="hidden hover:text-[#EE4D2D] lg:inline">Shopee Mall</Link>

                        <Link to="/customer/wishlist" aria-label="Wishlist" className="text-gray-700 hover:text-[#EE4D2D]">
                            <HeartIcon />
                        </Link>

                        <Link
                            to="/customer/cart"
                            aria-label="Shopping cart"
                            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1ed] text-[#EE4D2D] hover:bg-[#ffe3db]"
                        >
                            <CartIcon />
                            {cartCount > 0 && (
                                <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-[#EE4D2D] px-1 text-center text-[11px] font-medium text-white ring-2 ring-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </nav>
                </div>
            </header>
        </>
    );
}
