import { useState } from "react";
import CustomerLayout from "../../components/customer/CustomerLayout";
import ProductCard from "../../components/store/ProductCard";
import { EmptyState, ErrorNote, Notice, Spinner } from "../../components/Feedback";
import { Link } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { api, notifyCartChanged } from "../../services/api";

function Wishlist({ user }) {
    const base = `/api/customer/${user.user_id}`;
    const { data, loading, error, reload } = useApi(`${base}/wishlist`);
    const [notice, setNotice] = useState(null);

    async function remove(productId) {
        try {
            await api(`${base}/wishlist/${productId}`, { method: "DELETE" });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        }
    }

    async function addToCart(productId) {
        setNotice(null);

        try {
            await api(`${base}/cart`, { method: "POST", body: { product_id: productId, quantity: 1 } });
            notifyCartChanged();
            setNotice({ type: "success", text: "Added to your cart." });
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        }
    }

    const items = data?.items || [];

    return (
        <div className="space-y-4 p-5">
            <Notice notice={notice} />
            <ErrorNote message={error} onRetry={reload} />

            {loading ? (
                <Spinner />
            ) : items.length === 0 ? (
                <EmptyState icon="♡" title="Your wishlist is empty." hint="Tap the heart on a product to save it for later.">
                    <Link to="/search" className="rounded bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]">
                        Discover products
                    </Link>
                </EmptyState>
            ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {items.map((item) => (
                        <ProductCard
                            key={item.wishlist_id}
                            product={item}
                            footer={
                                <div className="flex gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => addToCart(item.product_id)}
                                        disabled={item.status !== "ACTIVE"}
                                        className="flex-1 rounded bg-[#EE4D2D] py-2 text-white hover:bg-[#d73211] disabled:opacity-50"
                                    >
                                        {item.status === "ACTIVE" ? "Add to cart" : "Unavailable"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => remove(item.product_id)}
                                        className="rounded border border-gray-300 px-3 py-2 hover:bg-gray-50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CustomerWishlist() {
    return (
        <CustomerLayout activeMenu="Wishlist" title="My wishlist">
            {(user) => <Wishlist user={user} />}
        </CustomerLayout>
    );
}
