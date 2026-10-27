import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StoreHeader from "../../components/store/StoreHeader";
import LoginPrompt from "../../components/LoginPrompt";
import { api, getStoredUser, isCustomer, notifyCartChanged } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { getProductImage } from "../../utils/productImages";
import { CartIcon, StoreIcon } from "../../components/icons";

export default function Cart() {
    const [user] = useState(() => getStoredUser());
    const loggedIn = Boolean(user?.token);
    const customer = loggedIn && isCustomer(user);
    const [promptOpen, setPromptOpen] = useState(false);
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [shipping, setShipping] = useState(null);
    const [selected, setSelected] = useState(() => new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        if (!customer) {
            setLoading(false);
            return;
        }

        try {
            const data = await api(`/api/customer/${user.user_id}/cart`);
            setItems(data.items);
            setShipping(data.shipping);
            setSelected(
                (previous) =>
                    new Set(
                        data.items
                            .filter((i) => i.available && !i.own_product)
                            .map((i) => i.cart_item_id)
                            .filter((id) => previous.size === 0 || previous.has(id))
                    )
            );
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user, customer]);

    useEffect(() => {
        load();
    }, [load]);

    async function changeQuantity(item, quantity) {
        try {
            await api(`/api/customer/${user.user_id}/cart/${item.cart_item_id}`, {
                method: "PUT",
                body: { quantity }
            });
            await load();
        } catch (err) {
            setError(err.message);
        }
    }

    async function remove(item) {
        await api(`/api/customer/${user.user_id}/cart/${item.cart_item_id}`, {
            method: "DELETE"
        });
        notifyCartChanged();
        await load();
    }

    function toggle(id) {
        setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    const groups = useMemo(() => {
        const map = new Map();

        for (const item of items) {
            if (!map.has(item.shop_id)) {
                map.set(item.shop_id, { shop_name: item.shop_name, items: [] });
            }
            map.get(item.shop_id).items.push(item);
        }

        return [...map.values()];
    }, [items]);

    function checkout() {
        if (!loggedIn) {
            setPromptOpen(true);
            return;
        }

        if (!customer) {
            setError("Only customer accounts can check out.");
            return;
        }

        if (chosen.length === 0) {
            setError(
                items.length === 0
                    ? "Your cart is empty."
                    : "Select at least one available item to check out."
            );
            return;
        }

        navigate("/customer/checkout", {
            state: { selected: chosen.map((i) => i.cart_item_id) }
        });
    }

    const chosen = items.filter((i) => selected.has(i.cart_item_id));
    const subtotal = chosen.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
            <StoreHeader />
            <LoginPrompt
                open={promptOpen}
                onClose={() => setPromptOpen(false)}
                message="Log in to check out your items."
            />

            <main className="mx-auto max-w-300 px-4 py-6">
                <h1 className="mb-4 text-xl font-medium">Shopping Cart</h1>

                {error && (
                    <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="py-20 text-center text-sm text-gray-500">Loading your cart...</p>
                ) : items.length === 0 ? (
                    <div className="rounded-sm bg-white py-20 text-center shadow-sm">
                        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1ed] text-[#EE4D2D]">
                            <CartIcon width={30} height={30} />
                        </span>
                        <p className="mt-4 text-sm text-gray-600">
                            {loggedIn ? "Your shopping cart is empty." : "Log in to see the items in your cart."}
                        </p>
                        <Link to="/search" className="mt-5 inline-block rounded bg-[#EE4D2D] px-6 py-2 text-sm text-white hover:bg-[#d73211]">
                            Go shopping now
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {groups.map((group) => (
                                <section key={group.shop_name} className="rounded-sm bg-white shadow-sm">
                                    <h2 className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 text-sm font-medium">
                                        <StoreIcon width={16} height={16} className="text-gray-500" /> {group.shop_name}
                                    </h2>

                                    <ul className="divide-y divide-gray-100">
                                        {group.items.map((item) => {
                                            const blocked = !item.available || item.own_product;

                                            return (
                                                <li key={item.cart_item_id} className="flex flex-wrap items-center gap-4 px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select ${item.product_name}`}
                                                        disabled={blocked}
                                                        checked={selected.has(item.cart_item_id)}
                                                        onChange={() => toggle(item.cart_item_id)}
                                                        className="h-4 w-4 accent-[#EE4D2D]"
                                                    />

                                                    <Link to={`/product/${item.product_id}`} className="flex min-w-60 flex-1 items-center gap-3">
                                                        <img
                                                            src={getProductImage(item.product_name, item.image_url)}
                                                            alt=""
                                                            className="h-20 w-20 rounded border border-gray-100 object-cover"
                                                        />
                                                        <div>
                                                            <p className="line-clamp-2 text-sm">{item.product_name}</p>
                                                            {item.variant_name && (
                                                                <p className="mt-1 text-xs text-gray-500">{item.variant_name}</p>
                                                            )}
                                                            {blocked && (
                                                                <p className="mt-1 text-xs font-medium text-red-600">
                                                                    {item.own_product ? "Your own product" : "Unavailable / out of stock"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </Link>

                                                    <p className="w-24 text-sm">{formatCurrency(item.price)}</p>

                                                    <div className="flex items-center rounded border border-gray-300">
                                                        <button
                                                            type="button"
                                                            aria-label="Decrease quantity"
                                                            disabled={item.quantity <= 1}
                                                            onClick={() => changeQuantity(item, item.quantity - 1)}
                                                            className="h-8 w-8 hover:bg-gray-50 disabled:opacity-40"
                                                        >
                                                            −
                                                        </button>
                                                        <span className="w-10 text-center text-sm">{item.quantity}</span>
                                                        <button
                                                            type="button"
                                                            aria-label="Increase quantity"
                                                            disabled={item.quantity >= item.stock}
                                                            onClick={() => changeQuantity(item, item.quantity + 1)}
                                                            className="h-8 w-8 hover:bg-gray-50 disabled:opacity-40"
                                                        >
                                                            +
                                                        </button>
                                                    </div>

                                                    <p className="w-24 text-sm font-medium text-[#EE4D2D]">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() => remove(item)}
                                                        className="text-sm text-gray-500 hover:text-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            ))}
                        </div>

                    </>
                )}

                <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-white px-5 py-4 shadow-md">
                    <p className="text-xs text-gray-500">
                        Shipping is calculated per shop. Free shipping on shop totals of{" "}
                        {formatCurrency(shipping?.free_shipping_minimum ?? 1000)}+.
                    </p>

                    <div className="flex items-center gap-5">
                        <p className="text-sm">
                            Subtotal ({chosen.length} item{chosen.length === 1 ? "" : "s"}):{" "}
                            <span className="text-xl text-[#EE4D2D]">{formatCurrency(subtotal)}</span>
                        </p>
                        <button
                            type="button"
                            onClick={checkout}
                            className="rounded bg-[#EE4D2D] px-10 py-3 text-sm text-white hover:bg-[#d73211]"
                        >
                            Check out
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
