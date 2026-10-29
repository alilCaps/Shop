import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StoreHeader from "../../components/store/StoreHeader";
import LoginPrompt from "../../components/LoginPrompt";
import {
    api,
    getStoredUser,
    isCustomer,
    notifyCartChanged
} from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";
import { getProductImage } from "../../utils/productImages";
import { CartIcon, HeartIcon, StarIcon } from "../../components/icons";

function Stars({ value }) {
    const rounded = Math.round(Number(value) || 0);

    return (
        <span className="inline-flex gap-0.5" role="img" aria-label={`${rounded} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <StarIcon
                    key={n}
                    width={16}
                    height={16}
                    className={n <= rounded ? "text-yellow-500" : "text-gray-300"}
                />
            ))}
        </span>
    );
}

export default function ProductDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const user = getStoredUser();
    const customer = Boolean(user?.token) && isCustomer(user);

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [variantId, setVariantId] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    const [promptOpen, setPromptOpen] = useState(false);
    const [wishlisted, setWishlisted] = useState(false);
    const [imageIndex, setImageIndex] = useState(0);

    useEffect(() => {
        let cancelled = false;

        api(`/api/products/${productId}`)
            .then((result) => {
                if (cancelled) return;
                setData(result);
                setVariantId(result.variants[0]?.variant_id ?? null);
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoading(false));

        if (customer) {
            api(`/api/customer/${user.user_id}/wishlist`)
                .then((result) => {
                    if (!cancelled) {
                        setWishlisted(
                            result.items.some((i) => String(i.product_id) === String(productId))
                        );
                    }
                })
                .catch(() => {});
        }

        return () => {
            cancelled = true;
        };
    }, [productId, customer, user?.user_id]);

    const variant = data?.variants.find((v) => v.variant_id === variantId);
    const stock = variant?.stock ?? 0;

    function requireLogin() {
        if (!user?.token) {
            setPromptOpen(true);
            return false;
        }

        if (!customer) {
            setNotice({ type: "error", text: "Only customer accounts can shop." });
            return false;
        }

        return true;
    }

    async function addToCart() {
        if (!requireLogin() || !variant) return null;

        setBusy(true);
        setNotice(null);

        try {
            const result = await api(`/api/customer/${user.user_id}/cart`, {
                method: "POST",
                body: { variant_id: variant.variant_id, quantity }
            });

            notifyCartChanged();
            setNotice({ type: "success", text: "Added to your cart." });
            return result.cart_item_id;
        } catch (err) {
            setNotice({ type: "error", text: err.message });
            return null;
        } finally {
            setBusy(false);
        }
    }

    async function buyNow() {
        const cartItemId = await addToCart();

        if (cartItemId) {
            navigate("/customer/checkout", { state: { selected: [cartItemId] } });
        }
    }

    async function toggleWishlist() {
        if (!requireLogin()) return;

        try {
            if (wishlisted) {
                await api(`/api/customer/${user.user_id}/wishlist/${productId}`, {
                    method: "DELETE"
                });
            } else {
                await api(`/api/customer/${user.user_id}/wishlist`, {
                    method: "POST",
                    body: { product_id: Number(productId) }
                });
            }

            setWishlisted(!wishlisted);
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5]">
                <StoreHeader />
            <LoginPrompt
                open={promptOpen}
                onClose={() => setPromptOpen(false)}
                message="Log in to add items to your cart and check out."
            />
                <p className="py-32 text-center text-sm text-gray-500">Loading product...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#F5F5F5]">
                <StoreHeader />
                <div className="py-32 text-center">
                    <p className="text-sm text-red-600">{error || "Product not found."}</p>
                    <Link to="/search" className="mt-4 inline-block text-sm text-[#EE4D2D] hover:underline">
                        Browse other products
                    </Link>
                </div>
            </div>
        );
    }

    const { product, variants, images, reviews } = data;
    const gallery = images.length
        ? images.map((i) => i.image_url)
        : [getProductImage(product.name, null)];
    const price = variant?.price ?? product.base_price;

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
            <StoreHeader />

            <main className="mx-auto max-w-300 space-y-4 px-4 py-6">
                <nav className="text-xs text-gray-500">
                    <Link to="/" className="hover:text-[#EE4D2D]">Home</Link> ›{" "}
                    <Link
                        to={`/search?category=${encodeURIComponent(product.category)}`}
                        className="hover:text-[#EE4D2D]"
                    >
                        {product.category}
                    </Link>{" "}
                    › {product.name}
                </nav>

                <section className="grid gap-8 rounded-sm bg-white p-5 shadow-sm md:grid-cols-2 lg:grid-cols-[400px_minmax(0,1fr)]">
                    <div>
                        <div className="flex h-96 items-center justify-center overflow-hidden rounded bg-white">
                            <img
                                src={gallery[imageIndex]}
                                alt={product.name}
                                className="h-full w-full object-contain"
                            />
                        </div>

                        {gallery.length > 1 && (
                            <div className="mt-3 flex gap-2">
                                {gallery.map((src, index) => (
                                    <button
                                        key={src}
                                        type="button"
                                        onClick={() => setImageIndex(index)}
                                        className={`h-16 w-16 overflow-hidden rounded border ${
                                            index === imageIndex ? "border-[#EE4D2D]" : "border-gray-200"
                                        }`}
                                    >
                                        <img src={src} alt="" className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h1 className="text-xl font-medium">{product.name}</h1>

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                                <strong className="text-[#EE4D2D]">
                                    {Number(product.rating || 0).toFixed(1)}
                                </strong>
                                <Stars value={product.rating} />
                            </span>
                            <span>{product.total_reviews} ratings</span>
                            <span>{Number(product.sold).toLocaleString("en-PH")} sold</span>
                        </div>

                        <p className="mt-4 bg-gray-50 px-4 py-3 text-3xl text-[#EE4D2D]">
                            {formatCurrency(price)}
                        </p>

                        <p className="mt-3 text-sm text-gray-500">
                            Sold by <span className="font-medium text-gray-700">{product.shop_name}</span>
                        </p>

                        {variants.length > 1 && (
                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                <span className="w-20 text-sm text-gray-500">Variation</span>
                                {variants.map((v) => (
                                    <button
                                        key={v.variant_id}
                                        type="button"
                                        disabled={v.stock === 0}
                                        onClick={() => {
                                            setVariantId(v.variant_id);
                                            setQuantity(1);
                                        }}
                                        className={`rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 ${
                                            v.variant_id === variantId
                                                ? "border-[#EE4D2D] text-[#EE4D2D]"
                                                : "border-gray-300 hover:border-[#EE4D2D]"
                                        }`}
                                    >
                                        {v.variant_name || "Standard"}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <span className="w-20 text-sm text-gray-500">Quantity</span>
                            <div className="flex items-center rounded border border-gray-300">
                                <button
                                    type="button"
                                    aria-label="Decrease quantity"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="h-8 w-8 hover:bg-gray-50"
                                >
                                    −
                                </button>
                                <span className="w-12 text-center text-sm">{quantity}</span>
                                <button
                                    type="button"
                                    aria-label="Increase quantity"
                                    onClick={() => setQuantity((q) => Math.min(stock || 1, q + 1))}
                                    className="h-8 w-8 hover:bg-gray-50"
                                >
                                    +
                                </button>
                            </div>
                            <span className="text-sm text-gray-500">
                                {stock > 0 ? `${stock} available` : "Out of stock"}
                            </span>
                        </div>

                        {notice && (
                            <p
                                role="status"
                                className={`mt-4 rounded border px-3 py-2 text-sm ${
                                    notice.type === "success"
                                        ? "border-green-200 bg-green-50 text-green-700"
                                        : "border-red-200 bg-red-50 text-red-700"
                                }`}
                            >
                                {notice.text}{" "}
                                {notice.type === "success" && (
                                    <Link to="/customer/cart" className="font-medium underline">
                                        View cart
                                    </Link>
                                )}
                            </p>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={busy || stock === 0}
                                onClick={addToCart}
                                className="inline-flex items-center gap-2 rounded border border-[#EE4D2D] bg-orange-50 px-6 py-3 text-sm text-[#EE4D2D] hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <CartIcon width={18} height={18} /> Add to cart
                            </button>
                            <button
                                type="button"
                                disabled={busy || stock === 0}
                                onClick={buyNow}
                                className="rounded bg-[#EE4D2D] px-8 py-3 text-sm text-white hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Buy now
                            </button>
                            <button
                                type="button"
                                onClick={toggleWishlist}
                                className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-3 text-sm hover:bg-gray-50"
                            >
                                <HeartIcon width={18} height={18} filled={wishlisted} className={wishlisted ? "text-[#EE4D2D]" : ""} />
                                {wishlisted ? "In wishlist" : "Add to wishlist"}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="rounded-sm bg-white p-5 shadow-sm">
                    <h2 className="mb-3 bg-gray-50 px-4 py-3 text-base font-medium">Product description</h2>
                    <p className="whitespace-pre-line px-4 text-sm leading-6 text-gray-700">
                        {product.description || "The seller has not added a description yet."}
                    </p>
                    {product.brand && (
                        <p className="mt-3 px-4 text-sm text-gray-500">Brand: {product.brand}</p>
                    )}
                </section>

                <section className="rounded-sm bg-white p-5 shadow-sm">
                    <h2 className="mb-3 bg-gray-50 px-4 py-3 text-base font-medium">Product ratings</h2>

                    {reviews.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-500">No reviews yet.</p>
                    ) : (
                        <ul className="divide-y divide-gray-100 px-4">
                            {reviews.map((review) => (
                                <li key={review.review_id} className="py-4">
                                    <p className="text-sm font-medium">{review.reviewer}</p>
                                    <Stars value={review.rating} />
                                    <p className="mt-1 text-xs text-gray-400">{formatDate(review.created_at)}</p>
                                    {review.review_text && (
                                        <p className="mt-2 text-sm text-gray-700">{review.review_text}</p>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
}
