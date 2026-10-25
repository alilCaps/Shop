import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StoreHeader from "../../components/store/StoreHeader";
import ProductCard from "../../components/store/ProductCard";
import { api } from "../../services/api";

const SORTS = [
    { value: "popular", label: "Best selling" },
    { value: "price_asc", label: "Price: low to high" },
    { value: "price_desc", label: "Price: high to low" },
    { value: "rating", label: "Top rated" }
];

export default function ProductSearch() {
    const [params, setParams] = useSearchParams();
    const q = params.get("q") || "";
    const category = params.get("category") || "";

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sort, setSort] = useState("popular");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api("/api/products"), api("/api/categories")])
            .then(([productData, categoryData]) => {
                setProducts(productData);
                setCategories(categoryData);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const results = useMemo(() => {
        const term = q.trim().toLowerCase();

        const filtered = products.filter((product) => {
            const matchesText =
                !term ||
                `${product.name} ${product.brand || ""} ${product.description || ""}`
                    .toLowerCase()
                    .includes(term);
            const matchesCategory = !category || product.category === category;

            return matchesText && matchesCategory;
        });

        const sorters = {
            popular: (a, b) => Number(b.sold) - Number(a.sold),
            price_asc: (a, b) => Number(a.price) - Number(b.price),
            price_desc: (a, b) => Number(b.price) - Number(a.price),
            rating: (a, b) => Number(b.rating) - Number(a.rating)
        };

        return [...filtered].sort(sorters[sort]);
    }, [products, q, category, sort]);

    function setCategory(value) {
        const next = new URLSearchParams(params);

        if (value) next.set("category", value);
        else next.delete("category");

        setParams(next);
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
            <StoreHeader key={q} initialQuery={q} />

            <main className="mx-auto grid max-w-300 grid-cols-1 gap-5 px-4 py-6 lg:grid-cols-[200px_minmax(0,1fr)]">
                <aside className="h-fit rounded-sm bg-white p-4 shadow-sm">
                    <h2 className="mb-3 text-sm font-semibold uppercase">Categories</h2>
                    <ul className="space-y-1 text-sm">
                        <li>
                            <button
                                type="button"
                                onClick={() => setCategory("")}
                                className={`w-full rounded px-2 py-1.5 text-left hover:bg-orange-50 ${
                                    !category ? "font-medium text-[#EE4D2D]" : ""
                                }`}
                            >
                                All categories
                            </button>
                        </li>
                        {categories.map((item) => (
                            <li key={item.category_id}>
                                <button
                                    type="button"
                                    onClick={() => setCategory(item.category_name)}
                                    className={`w-full rounded px-2 py-1.5 text-left hover:bg-orange-50 ${
                                        category === item.category_name
                                            ? "font-medium text-[#EE4D2D]"
                                            : ""
                                    }`}
                                >
                                    {item.category_name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>

                <section>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm text-gray-600">
                            {q ? (
                                <>
                                    Results for <strong>“{q}”</strong>
                                </>
                            ) : (
                                "All products"
                            )}
                            {category && ` in ${category}`} — {results.length} found
                        </p>

                        <select
                            value={sort}
                            onChange={(event) => setSort(event.target.value)}
                            aria-label="Sort products"
                            className="rounded border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-[#EE4D2D]"
                        >
                            {SORTS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {loading ? (
                        <p className="py-20 text-center text-sm text-gray-500">Loading products...</p>
                    ) : error ? (
                        <p className="py-20 text-center text-sm text-red-600">{error}</p>
                    ) : results.length === 0 ? (
                        <div className="rounded-sm bg-white py-20 text-center shadow-sm">
                            <p className="text-4xl">🔎</p>
                            <p className="mt-3 text-sm text-gray-600">No products matched your search.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                            {results.map((product) => (
                                <ProductCard key={product.product_id} product={product} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}
