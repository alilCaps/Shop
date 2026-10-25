import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import StoreHeader from "../../components/store/StoreHeader";
import AddressForm, { addressLines } from "../../components/customer/AddressForm";
import { ErrorNote, Spinner } from "../../components/Feedback";
import { useRequireCustomer } from "../../hooks/useCustomer";
import { api, notifyCartChanged } from "../../services/api";
import { formatCurrency, shippingFor, PAYMENT_METHOD_LABELS } from "../../utils/format";
import { getProductImage } from "../../utils/productImages";

const METHODS = [
    "CASH_ON_DELIVERY",
    "GCASH",
    "MAYA",
    "BANK_TRANSFER",
    "CREDIT_CARD",
    "DEBIT_CARD"
];

export default function Checkout() {
    const user = useRequireCustomer();
    const navigate = useNavigate();
    const location = useLocation();
    const selectedIds = location.state?.selected;

    const [cart, setCart] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [addressId, setAddressId] = useState(null);
    const [addingAddress, setAddingAddress] = useState(false);
    const [method, setMethod] = useState("CASH_ON_DELIVERY");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState("");
    const [placed, setPlaced] = useState(null);

    const userId = user?.user_id;

    useEffect(() => {
        if (!userId) return undefined;

        if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
            navigate("/customer/cart", { replace: true });
            return undefined;
        }

        let cancelled = false;

        Promise.all([
            api(`/api/customer/${userId}/cart`),
            api(`/api/customer/${userId}/addresses`)
        ])
            .then(([cartData, addressData]) => {
                if (cancelled) return;
                setCart(cartData);
                setAddresses(addressData.addresses);
                const preferred =
                    addressData.addresses.find((a) => a.is_default) ||
                    addressData.addresses[0];
                setAddressId(preferred?.address_id ?? null);
            })
            .catch((err) => !cancelled && setError(err.message))
            .finally(() => !cancelled && setLoading(false));

        return () => {
            cancelled = true;
        };
    }, [userId, selectedIds, navigate]);

    const shops = useMemo(() => {
        if (!cart) return [];

        const map = new Map();

        for (const item of cart.items) {
            if (!selectedIds.includes(item.cart_item_id)) continue;

            if (!map.has(item.shop_id)) {
                map.set(item.shop_id, { shop_name: item.shop_name, items: [] });
            }

            map.get(item.shop_id).items.push(item);
        }

        return [...map.values()].map((shop) => {
            const subtotal = shop.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const shipping = shippingFor(subtotal, cart.shipping);
            return { ...shop, subtotal, shipping, total: subtotal + shipping };
        });
    }, [cart, selectedIds]);

    const grandTotal = shops.reduce((sum, shop) => sum + shop.total, 0);

    async function saveAddress(payload) {
        const result = await api(`/api/customer/${userId}/addresses`, {
            method: "POST",
            body: payload
        });
        const data = await api(`/api/customer/${userId}/addresses`);

        setAddresses(data.addresses);
        setAddressId(result.address_id);
        setAddingAddress(false);
    }

    async function placeOrder() {
        setPlacing(true);
        setError("");

        try {
            const result = await api(`/api/customer/${userId}/checkout`, {
                method: "POST",
                body: {
                    address_id: addressId,
                    payment_method: method,
                    cart_item_ids: selectedIds,
                    note
                }
            });

            notifyCartChanged();
            setPlaced(result.orders);
        } catch (err) {
            setError(err.message);
        } finally {
            setPlacing(false);
        }
    }

    if (placed) {
        const needsPayment = placed.some((order) => order.status === "PENDING_PAYMENT");

        return (
            <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
                <StoreHeader />
                <main className="mx-auto max-w-150 px-4 py-12">
                    <div className="rounded-sm bg-white p-8 text-center shadow-sm">
                        <p className="text-5xl">🎉</p>
                        <h1 className="mt-4 text-xl font-medium">Order placed successfully!</h1>
                        <ul className="mt-4 space-y-1 text-sm text-gray-600">
                            {placed.map((order) => (
                                <li key={order.order_id}>
                                    #{order.order_number} — {formatCurrency(order.total_amount)}
                                </li>
                            ))}
                        </ul>
                        {needsPayment && (
                            <p className="mt-4 text-sm text-gray-500">
                                Your order is waiting for payment. You can pay from My orders.
                            </p>
                        )}
                        <div className="mt-6 flex justify-center gap-3">
                            <Link
                                to={needsPayment ? "/customer/orders?tab=PENDING_PAYMENT" : "/customer/orders"}
                                className="rounded bg-[#EE4D2D] px-6 py-2.5 text-sm text-white hover:bg-[#d73211]"
                            >
                                {needsPayment ? "Pay now" : "View my orders"}
                            </Link>
                            <Link to="/search" className="rounded border border-gray-300 px-6 py-2.5 text-sm hover:bg-gray-50">
                                Keep shopping
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
            <StoreHeader />

            <main className="mx-auto max-w-300 space-y-4 px-4 py-6">
                <h1 className="text-xl font-medium">Checkout</h1>
                <ErrorNote message={error} />

                {loading || !user ? (
                    <Spinner />
                ) : (
                    <>
                        <section className="rounded-sm bg-white p-5 shadow-sm">
                            <h2 className="mb-3 flex items-center gap-2 font-medium text-[#EE4D2D]">
                                📍 Delivery address
                            </h2>

                            {addresses.length > 0 && !addingAddress && (
                                <ul className="space-y-2">
                                    {addresses.map((address) => (
                                        <li key={address.address_id}>
                                            <label className="flex cursor-pointer items-start gap-3 rounded border border-gray-200 p-3 text-sm has-checked:border-[#EE4D2D] has-checked:bg-[#fff8f6]">
                                                <input
                                                    type="radio"
                                                    name="address"
                                                    checked={addressId === address.address_id}
                                                    onChange={() => setAddressId(address.address_id)}
                                                    className="mt-1 accent-[#EE4D2D]"
                                                />
                                                <span>
                                                    <span className="font-medium">
                                                        {address.recipient_name} · {address.phone}
                                                    </span>
                                                    {Boolean(address.is_default) && (
                                                        <span className="ml-2 rounded border border-[#EE4D2D] px-1.5 text-xs text-[#EE4D2D]">
                                                            Default
                                                        </span>
                                                    )}
                                                    <span className="block text-gray-600">{addressLines(address)}</span>
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {addingAddress || addresses.length === 0 ? (
                                <div className="mt-2">
                                    <AddressForm
                                        submitLabel="Save and use this address"
                                        onSubmit={saveAddress}
                                        onCancel={addresses.length > 0 ? () => setAddingAddress(false) : undefined}
                                    />
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAddingAddress(true)}
                                    className="mt-3 text-sm text-[#EE4D2D] hover:underline"
                                >
                                    + Add a new address
                                </button>
                            )}
                        </section>

                        {shops.map((shop) => (
                            <section key={shop.shop_name} className="rounded-sm bg-white shadow-sm">
                                <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-medium">
                                    🏬 {shop.shop_name}
                                </h2>
                                <ul className="divide-y divide-gray-50">
                                    {shop.items.map((item) => (
                                        <li key={item.cart_item_id} className="flex items-center gap-3 px-5 py-3 text-sm">
                                            <img
                                                src={getProductImage(item.product_name, item.image_url)}
                                                alt=""
                                                className="h-14 w-14 rounded border border-gray-100 object-cover"
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="line-clamp-1">{item.product_name}</span>
                                                {item.variant_name && (
                                                    <span className="text-xs text-gray-400">{item.variant_name}</span>
                                                )}
                                            </span>
                                            <span className="w-24 text-right text-gray-500">{formatCurrency(item.price)}</span>
                                            <span className="w-10 text-center">x{item.quantity}</span>
                                            <span className="w-28 text-right">{formatCurrency(item.price * item.quantity)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <dl className="ml-auto grid max-w-xs grid-cols-2 gap-y-1 px-5 py-3 text-sm">
                                    <dt className="text-gray-500">Merchandise</dt>
                                    <dd className="text-right">{formatCurrency(shop.subtotal)}</dd>
                                    <dt className="text-gray-500">Shipping</dt>
                                    <dd className="text-right">{shop.shipping === 0 ? "Free" : formatCurrency(shop.shipping)}</dd>
                                    <dt className="font-medium">Shop total</dt>
                                    <dd className="text-right font-medium text-[#EE4D2D]">{formatCurrency(shop.total)}</dd>
                                </dl>
                            </section>
                        ))}

                        <section className="rounded-sm bg-white p-5 shadow-sm">
                            <h2 className="mb-3 font-medium">Payment method</h2>
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {METHODS.map((value) => (
                                    <label
                                        key={value}
                                        className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-3 py-2.5 text-sm has-checked:border-[#EE4D2D] has-checked:bg-[#fff8f6]"
                                    >
                                        <input
                                            type="radio"
                                            name="payment"
                                            checked={method === value}
                                            onChange={() => setMethod(value)}
                                            className="accent-[#EE4D2D]"
                                        />
                                        {PAYMENT_METHOD_LABELS[value]}
                                    </label>
                                ))}
                            </div>

                            <label className="mt-4 block text-xs text-gray-500">
                                Message for seller (optional)
                                <textarea
                                    value={note}
                                    onChange={(event) => setNote(event.target.value)}
                                    maxLength={500}
                                    rows={2}
                                    className="mt-1 w-full rounded border border-gray-300 p-2 text-sm text-gray-800 outline-none focus:border-[#EE4D2D]"
                                />
                            </label>
                        </section>

                        <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-4 rounded-sm bg-white px-5 py-4 shadow-md">
                            <Link to="/customer/cart" className="text-sm text-gray-500 hover:text-[#EE4D2D]">
                                ← Back to cart
                            </Link>
                            <div className="flex items-center gap-5">
                                <p className="text-sm">
                                    Total payment:{" "}
                                    <span className="text-2xl text-[#EE4D2D]">{formatCurrency(grandTotal)}</span>
                                </p>
                                <button
                                    type="button"
                                    onClick={placeOrder}
                                    disabled={placing || !addressId || shops.length === 0}
                                    className="rounded bg-[#EE4D2D] px-12 py-3 text-sm text-white hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {placing ? "Placing order..." : "Place order"}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
