import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import StoreHeader from "./components/store/StoreHeader";
import StoreFooter from "./components/store/StoreFooter";
import FlashSaleCard from "./components/store/FlashSaleCard";
import CategoryTile from "./components/store/CategoryTile";
import ProductCard from "./components/store/ProductCard";
import LoginPrompt from "./components/LoginPrompt";
import { ArrowRight, BagIcon, HeadsetIcon, RefreshIcon, ShieldIcon, TruckIcon } from "./components/icons";
import { api, getStoredUser, isCustomer } from "./services/api";
import { getProductImage } from "./utils/productImages";

import laptopComputers from "./assets/laptop-computers.jpg";
import makeupFragrances from "./assets/makeup-fragrances.jpg";
import homeLiving from "./assets/home-living.jpg";
import healthPersonalCare from "./assets/healthPersonalCare.jpg";
import sports from "./assets/sports.jpg";
import toys from "./assets/toys.jpg";
import groceries from "./assets/groceries.jpg";
import shoes from "./assets/shoes.jpg";
import bags from "./assets/bags.jpg";
import accessories from "./assets/accessories.jpg";

const CATEGORY_IMAGES = {
    "Laptops & Computers": laptopComputers,
    Electronics: laptopComputers,
    "Makeups & Fragrances": makeupFragrances,
    "Home & Living": homeLiving,
    "Health & Personal Care": healthPersonalCare,
    "Health & Beauty": healthPersonalCare,
    "Sports & Outdoors": sports,
    "Toys & Games": toys,
    Groceries: groceries,
    Shoes: shoes,
    Bags: bags,
    Accessories: accessories
};

const FEATURED_COUNT = 5;

// Hours:minutes:seconds left until midnight (the daily deals "reset").
function useCountdown() {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const end = new Date(now);
    end.setHours(24, 0, 0, 0);

    const left = Math.max(0, Math.floor((end - now) / 1000));
    const pad = (value) => String(value).padStart(2, "0");

    return `${pad(Math.floor(left / 3600))}:${pad(Math.floor((left % 3600) / 60))}:${pad(left % 60)}`;
}

const PERKS = [
    { icon: TruckIcon, title: "Free shipping", text: "On selected orders" },
    { icon: ShieldIcon, title: "Shopee Guarantee", text: "Safe & secure payment" },
    { icon: RefreshIcon, title: "Easy returns", text: "Refund & return support" },
    { icon: HeadsetIcon, title: "24/7 support", text: "We're here to help" }
];

export default function LandingPage() {
    const location = useLocation();
    const countdown = useCountdown();
    const user = getStoredUser();
    const customer = Boolean(user?.token) && isCustomer(user);

    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [wished, setWished] = useState(() => new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [promptOpen, setPromptOpen] = useState(false);

    useEffect(() => {
        Promise.all([api("/api/categories"), api("/api/products")])
            .then(([categoryData, productData]) => {
                setCategories(categoryData);
                setProducts(productData);
            })
            .catch((err) => setError(err.message || "Unable to load the store."))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!customer) return;

        api(`/api/customer/${user.user_id}/wishlist`)
            .then((data) => setWished(new Set(data.items.map((i) => i.product_id))))
            .catch(() => {});
    }, [customer, user?.user_id]);

    // Scroll to #flash-sale when arriving from the header link.
    useEffect(() => {
        if (!location.hash || loading) return;
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    }, [location.hash, loading]);

    const toggleWishlist = useCallback(
        async (product) => {
            if (!customer) {
                setPromptOpen(true);
                return;
            }

            const id = product.product_id;
            const has = wished.has(id);

            try {
                if (has) {
                    await api(`/api/customer/${user.user_id}/wishlist/${id}`, { method: "DELETE" });
                } else {
                    await api(`/api/customer/${user.user_id}/wishlist`, {
                        method: "POST",
                        body: { product_id: id }
                    });
                }

                setWished((previous) => {
                    const next = new Set(previous);
                    if (has) next.delete(id);
                    else next.add(id);
                    return next;
                });
            } catch {
                // The heart simply stays as it was.
            }
        },
        [customer, user?.user_id, wished]
    );

    const bestSellers = [...products]
        .sort((a, b) => Number(b.sold) - Number(a.sold))
        .slice(0, FEATURED_COUNT);
    const flashIds = new Set(bestSellers.map((p) => p.product_id));
    const discover = products.filter((p) => !flashIds.has(p.product_id));
    const heroImages = bestSellers.slice(0, 3);

    return (
        <div className="min-h-screen bg-[#f5f6f8] text-gray-800">
            <StoreHeader />

            <main className="mx-auto max-w-300 space-y-12 px-4 py-6">
                {error && (
                    <p role="alert" className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {/* Hero */}
                <section className="grid gap-4 lg:grid-cols-[1fr_290px]">
                    <div className="relative min-h-80 overflow-hidden rounded-2xl bg-linear-to-br from-[#c93a1e] via-[#EE4D2D] to-[#f58a63] p-6 text-white sm:p-8 md:p-10">
                        <div className="relative z-10 flex h-full max-w-md flex-col justify-center">
                            <p className="text-xs font-semibold tracking-widest text-orange-100">SUPER SHOPPING DAY</p>
                            <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                                Big joy, bigger savings.
                            </h1>
                            <p className="mt-3 text-base text-orange-50">Up to 70% off + free shipping all day</p>
                            <Link
                                to="/search"
                                className="mt-7 inline-flex w-fit items-center gap-2 rounded-lg bg-[#161a26] px-5 py-3 text-sm font-medium hover:bg-black"
                            >
                                <ArrowRight width={16} height={16} /> Shop the sale
                            </Link>
                        </div>

                        <div className="pointer-events-none absolute -right-6 top-1/2 hidden -translate-y-1/2 gap-3 md:flex" aria-hidden="true">
                            {heroImages.map((product, index) => (
                                <img
                                    key={product.product_id}
                                    src={getProductImage(product.name, product.image_url)}
                                    alt=""
                                    className={`h-44 w-36 rounded-2xl border-4 border-white/80 object-cover shadow-xl ${
                                        index === 1 ? "-translate-y-6 rotate-3" : index === 2 ? "translate-y-6 -rotate-3" : "-rotate-2"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <Link
                            to="/search"
                            className="flex flex-col justify-center rounded-2xl bg-[#161a26] p-6 text-white transition hover:bg-black"
                        >
                            <p className="text-[10px] font-semibold tracking-widest text-orange-300">SHOPEE MALL</p>
                            <p className="mt-2 text-2xl font-bold leading-tight">100% authentic finds</p>
                            <p className="mt-3 inline-flex items-center gap-1 text-xs">
                                Explore brands <ArrowRight width={14} height={14} />
                            </p>
                        </Link>

                        <Link
                            to={user?.token ? "/search" : "/signup"}
                            className="flex flex-col justify-center rounded-2xl bg-[#ffe9e2] p-6 transition hover:bg-[#ffddd2]"
                        >
                            <p className="text-[10px] font-semibold tracking-widest text-[#EE4D2D]">
                                {user?.token ? "DAILY DEALS" : "NEW HERE?"}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-[#EE4D2D]">
                                {user?.token ? "Fresh picks" : "Join Shopee"}
                            </p>
                            <p className="mt-2 text-xs text-gray-600">
                                {user?.token ? "Browse everything on sale today" : "Create a free account and start shopping"}
                            </p>
                            <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#EE4D2D]">
                                {user?.token ? "See all products" : "Sign up now"} <ArrowRight width={14} height={14} />
                            </p>
                        </Link>
                    </div>
                </section>

                {/* Categories */}
                <section aria-labelledby="categories-title">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <h2 id="categories-title" className="text-2xl font-bold">Shop by category</h2>
                        <Link to="/search" className="inline-flex items-center gap-1 text-xs font-semibold text-[#EE4D2D] hover:underline">
                            View all <ArrowRight width={14} height={14} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                        {categories.slice(0, 8).map((category) => (
                            <CategoryTile
                                key={category.category_id}
                                name={category.category_name}
                                image={CATEGORY_IMAGES[category.category_name] || accessories}
                            />
                        ))}
                    </div>
                </section>

                {/* Flash sale */}
                <section id="flash-sale" aria-labelledby="flash-title" className="scroll-mt-24">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                            <h2 id="flash-title" className="text-2xl font-bold text-[#EE4D2D]">FLASH SALE</h2>
                            <span className="rounded bg-[#161a26] px-2 py-0.5 font-mono text-xs text-white" aria-label="Time left today">
                                {countdown}
                            </span>
                        </div>
                        <Link to="/search" className="inline-flex items-center gap-1 text-xs font-semibold text-[#EE4D2D] hover:underline">
                            See all deals <ArrowRight width={14} height={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <p className="py-16 text-center text-sm text-gray-500">Loading deals...</p>
                    ) : bestSellers.length === 0 ? (
                        <p className="rounded-xl bg-white py-16 text-center text-sm text-gray-500">
                            No products yet. Check back soon!
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                            {bestSellers.map((product) => (
                                <FlashSaleCard
                                    key={product.product_id}
                                    product={product}
                                    wished={wished.has(product.product_id)}
                                    onWishlist={toggleWishlist}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Perks */}
                <section className="grid grid-cols-2 gap-6 rounded-xl bg-white px-4 py-5 shadow-sm sm:px-6 lg:grid-cols-4">
                    {PERKS.map(({ icon: Icon, title, text }) => (
                        <div key={title} className="flex items-center gap-3">
                            <span className="text-[#EE4D2D]"><Icon width={26} height={26} /></span>
                            <div>
                                <p className="text-xs font-semibold">{title}</p>
                                <p className="text-[11px] text-gray-500">{text}</p>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Daily discover */}
                {discover.length > 0 && (
                    <section aria-labelledby="discover-title">
                        <h2 id="discover-title" className="mb-4 flex items-center gap-2 text-2xl font-bold">
                            <BagIcon className="text-[#EE4D2D]" /> Daily discover
                        </h2>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
                            {discover.map((product) => (
                                <ProductCard key={product.product_id} product={product} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <StoreFooter />

            <LoginPrompt
                open={promptOpen}
                onClose={() => setPromptOpen(false)}
                message="Log in to save items to your wishlist."
            />
        </div>
    );
}
