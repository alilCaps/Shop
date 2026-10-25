import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../services/api";
import {
    PAYMENT_METHOD_LABELS,
    formatCurrency,
    formatDate
} from "../../utils/format";

const TABS = [
    ["", "All"],
    ["PENDING_PAYMENT", "To Pay"],
    ["PAID", "Paid"],
    ["PROCESSING", "Processing"],
    ["SHIPPED", "Shipped"],
    ["DELIVERED", "Delivered"],
    ["COMPLETED", "Completed"],
    ["CANCELLED", "Cancelled"]
];

// What a seller may do next (mirrors the backend's seller rules).
const ACTIONS = {
    PENDING_PAYMENT: [["CANCELLED", "Cancel order", "danger"]],
    PAID: [
        ["PROCESSING", "Start preparing", "primary"],
        ["CANCELLED", "Cancel order", "danger"]
    ],
    PROCESSING: [
        ["SHIPPED", "Ship order", "primary"],
        ["CANCELLED", "Cancel order", "danger"]
    ],
    SHIPPED: [["DELIVERED", "Mark delivered", "primary"]]
};

export default function SellerOrders() {
    const { user, shop } = useOutletContext();
    const base = `/api/seller/${user.user_id}`;

    const [tab, setTab] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [shipping, setShipping] = useState(null); // order being shipped
    const [shipForm, setShipForm] = useState({ courier: "", tracking_number: "" });
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = await api(`${base}/orders${tab ? `?status=${tab}` : ""}`);
            setOrders(data.orders);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [base, tab]);

    useEffect(() => {
        setLoading(true);
        load();
    }, [load]);

    async function update(order, status, extra = {}) {
        if (
            status === "CANCELLED" &&
            !window.confirm(`Cancel order ${order.order_number}? Stock will be restored.`)
        ) {
            return;
        }

        setBusy(true);
        setError("");

        try {
            await api(`${base}/orders/${order.order_id}/status`, {
                method: "PUT",
                body: { status, ...extra }
            });
            setShipping(null);
            await load();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    function act(order, status) {
        if (status === "SHIPPED") {
            setShipForm({ courier: "", tracking_number: "" });
            setShipping(order);
        } else {
            update(order, status);
        }
    }

    return (
        <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
                <h1 className="text-xl font-medium">Orders</h1>
            </div>

            <div className="flex overflow-x-auto border-b border-gray-100">
                {TABS.map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setTab(value)}
                        className={`whitespace-nowrap px-4 py-3 text-sm ${
                            tab === value
                                ? "border-b-2 border-[#EE4D2D] text-[#EE4D2D]"
                                : "text-gray-600 hover:text-[#EE4D2D]"
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {!shop && (
                <p className="m-5 text-sm text-gray-500">Create your shop to receive orders.</p>
            )}
            {error && (
                <p role="alert" className="m-5 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="space-y-4 p-5">
                {loading ? (
                    <p className="py-12 text-center text-sm text-gray-500">Loading orders...</p>
                ) : orders.length === 0 ? (
                    <p className="py-12 text-center text-sm text-gray-500">No orders here.</p>
                ) : (
                    orders.map((order) => (
                        <article key={order.order_id} className="rounded border border-gray-200">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                                <div>
                                    <span className="font-medium">{order.order_number}</span>
                                    <span className="ml-3 text-gray-500">
                                        {order.customer_name || order.username} · {formatDate(order.placed_at)}
                                    </span>
                                </div>
                                <StatusBadge status={order.status} orderLabels />
                            </div>

                            <ul className="divide-y divide-gray-100 px-4">
                                {order.items.map((item) => (
                                    <li key={item.order_item_id} className="flex justify-between gap-3 py-3 text-sm">
                                        <span>
                                            {item.product_name}
                                            {item.variant_name && (
                                                <span className="text-gray-500"> ({item.variant_name})</span>
                                            )}{" "}
                                            × {item.quantity}
                                        </span>
                                        <span>{formatCurrency(item.subtotal)}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="grid gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-600 md:grid-cols-3">
                                <div>
                                    <p className="font-medium text-gray-800">Ship to</p>
                                    {order.address ? (
                                        <p>
                                            {order.address.recipient_name}, {order.address.phone}
                                            <br />
                                            {[order.address.address_line, order.address.barangay, order.address.city, order.address.province, order.address.postal_code]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    ) : (
                                        <p>No address</p>
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">Payment</p>
                                    <p>
                                        {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method || "—"}{" "}
                                        <StatusBadge status={order.payment_status} />
                                    </p>
                                    {order.tracking_number && (
                                        <p className="mt-1">
                                            {order.courier} · {order.tracking_number}
                                        </p>
                                    )}
                                </div>
                                <div className="md:text-right">
                                    <p className="font-medium text-gray-800">Your total</p>
                                    <p className="text-lg text-[#EE4D2D]">{formatCurrency(order.shop_total)}</p>
                                </div>
                            </div>

                            {order.notes && (
                                <p className="border-t border-gray-100 px-4 py-2 text-xs text-gray-500">
                                    Note: {order.notes}
                                </p>
                            )}

                            {(ACTIONS[order.status] || []).length > 0 && (
                                <div className="flex justify-end gap-3 border-t border-gray-100 px-4 py-3">
                                    {ACTIONS[order.status].map(([status, label, kind]) => (
                                        <button
                                            key={status}
                                            type="button"
                                            disabled={busy || shop?.status !== "ACTIVE"}
                                            onClick={() => act(order, status)}
                                            className={`rounded px-4 py-2 text-sm disabled:opacity-50 ${
                                                kind === "primary"
                                                    ? "bg-[#EE4D2D] text-white hover:bg-[#d73211]"
                                                    : "border border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </article>
                    ))
                )}
            </div>

            {shipping && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            update(shipping, "SHIPPED", shipForm);
                        }}
                        className="w-full max-w-sm space-y-3 rounded-lg bg-white p-6 shadow-xl"
                    >
                        <h2 className="text-lg font-medium">Ship {shipping.order_number}</h2>
                        <input
                            placeholder="Courier (e.g. J&T Express)"
                            value={shipForm.courier}
                            onChange={(e) => setShipForm((f) => ({ ...f, courier: e.target.value }))}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#EE4D2D]"
                        />
                        <input
                            placeholder="Tracking number"
                            value={shipForm.tracking_number}
                            onChange={(e) => setShipForm((f) => ({ ...f, tracking_number: e.target.value }))}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#EE4D2D]"
                        />
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setShipping(null)} className="rounded border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={busy} className="rounded bg-[#EE4D2D] px-6 py-2 text-sm text-white hover:bg-[#d73211] disabled:opacity-50">
                                Confirm shipment
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
