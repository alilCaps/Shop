import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/orange_logo.png";
import {
    api,
    getStoredUser,
    homeFor,
    isCustomer
} from "../../services/api";

// Shared Shopee-style header used by every storefront / customer page.
export default function StoreHeader({ initialQuery = "" }) {
    const navigate = useNavigate();
    const user = getStoredUser();
    const customer = Boolean(user?.token) && isCustomer(user);

    const [query, setQuery] = useState(initialQuery);
    const [cartCount, setCartCount] = useState(0);

    useEffect(() => {
        if (!customer) return undefined;

        let cancelled = false;

        const loadCount = () => {
            api(`/api/customer/${user.user_id}/cart`)
                .then((data) => {
                    if (!cancelled) setCartCount(data.items?.length || 0);
                })
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
        [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
        user?.username ||
        "";

    function handleSearch(event) {
        event.preventDefault();

        const term = query.trim();
        navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
    }

    return (
        <>
            <div className="bg-[#EE4D2D] text-xs text-white">
                <div className="mx-auto flex min-h-8 max-w-300 items-center justify-between gap-3 px-4">
                    <div className="flex items-center gap-3">
                        <Link to="/seller/dashboard" className="hover:opacity-80">
                            Seller Centre
                        </Link>
                        <span className="opacity-60">•</span>
                        <Link to="/search" className="hover:opacity-80">
                            All products
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        {user?.token ? (
                            <Link to={homeFor(user)} className="hover:opacity-80">
                                {displayName || "My account"}
                            </Link>
                        ) : (
                            <>
                                <Link to="/signup" className="hover:opacity-80">
                                    Sign up
                                </Link>
                                <span className="opacity-60">|</span>
                                <Link to="/login" className="hover:opacity-80">
                                    Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex min-h-17.5 max-w-300 items-center gap-6 px-4 py-3">
                    <Link to="/" className="flex w-40 shrink-0 items-center justify-center">
                        <img
                            src={logo}
                            alt="Shopee Logo"
                            className="h-auto w-32 object-contain"
                        />
                    </Link>

                    <form
                        onSubmit={handleSearch}
                        className="flex h-10 min-w-0 max-w-162.5 flex-1 items-center overflow-hidden rounded-md bg-gray-100"
                    >
                        <input
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search for products"
                            aria-label="Search products"
                            className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-gray-400"
                        />
                        <button
                            type="submit"
                            aria-label="Search"
                            className="mr-1 h-8 w-12 shrink-0 rounded-md bg-[#EE4D2D] text-white hover:bg-[#d73211]"
                        >
                            🔍
                        </button>
                    </form>

                    <nav className="flex shrink-0 items-center gap-5 text-xl">
                        <Link
                            to="/customer/wishlist"
                            aria-label="Wishlist"
                            className="hover:opacity-70"
                        >
                            ♡
                        </Link>

                        <Link
                            to="/customer/cart"
                            aria-label="Shopping cart"
                            className="relative hover:opacity-70"
                        >
                            🛒
                            {cartCount > 0 && (
                                <span className="absolute -right-3 -top-2 min-w-5 rounded-full bg-[#EE4D2D] px-1 text-center text-xs font-medium text-white">
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
