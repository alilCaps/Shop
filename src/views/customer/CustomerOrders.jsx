import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import CustomerLayout from "../../components/customer/CustomerLayout";
import StatusBadge from "../../components/StatusBadge";
import { EmptyState, ErrorNote, Notice, Spinner } from "../../components/Feedback";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api";
import {
    formatCurrency,
    formatDate,
    PAYMENT_METHOD_LABELS
} from "../../utils/format";
import { getProductImage } from "../../utils/productImages";
import { CheckIcon, StarIcon, StoreIcon } from "../../components/icons";
import ReturnRequestModal from "../../components/ReturnRequestModal";

const TABS = [
    { key: "ALL", label: "All", match: () => true },
    { key: "PENDING_PAYMENT", label: "To Pay", match: (s) => s === "PENDING_PAYMENT" },
    { key: "PAID", label: "To Ship", match: (s) => ["PAID", "PROCESSING"].includes(s) },
    { key: "SHIPPED", label: "To Receive", match: (s) => s === "SHIPPED" },
    { key: "DELIVERED", label: "To Review", match: (s) => ["DELIVERED", "COMPLETED"].includes(s) },
    { key: "CANCELLED", label: "Cancelled", match: (s) => ["CANCELLED", "REFUNDED"].includes(s) }
];

function ReviewForm({ onSubmit, onCancel, busy }) {
    const [rating, setRating] = useState(5);
    const [text, setText] = useState("");

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit({ rating, review_text: text });
            }}
            className="mt-3 space-y-2 rounded bg-gray-50 p-3"
        >
            <div className="flex gap-1" role="radiogroup" aria-label="Rating">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={rating === value}
                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                        onClick={() => setRating(value)}
                        className={value <= rating ? "text-yellow-500" : "text-gray-300"}
                    >
                        <StarIcon width={26} height={26} />
                    </button>
                ))}
            </div>
            <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Share your experience (optional)"
                className="w-full rounded border border-gray-300 p-2 text-sm outline-none focus:border-[#EE4D2D]"
            />
            <div className="flex gap-2">
                <button type="submit" disabled={busy} className="rounded bg-[#EE4D2D] px-4 py-1.5 text-sm text-white hover:bg-[#d73211] disabled:opacity-60">
                    Submit review
                </button>
                <button type="button" onClick={onCancel} className="rounded border border-gray-300 px-4 py-1.5 text-sm hover:bg-white">
                    Cancel
                </button>
            </div>
        </form>
    );
}

function OrderCard({ order, userId, onChanged, setNotice }) {
    const [busy, setBusy] = useState(false);
    const [reviewing, setReviewing] = useState(null);
    const [returning, setReturning] = useState(false);
    const base = `/api/customer/${userId}/orders/${order.order_id}`;

    async function run(path, body, success) {
        setBusy(true);
        setNotice(null);

        try {
            const result = await api(path, { method: "POST", body: body ?? {} });
            setNotice({ type: "success", text: success || result.message });
            setReviewing(null);
            onChanged();
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        } finally {
            setBusy(false);
        }
    }

    function confirmAction(message, path, success) {
        if (window.confirm(message)) run(path, {}, success);
    }

    const status = order.status;
    const button = "rounded px-4 py-2 text-sm disabled:opacity-60";

    return (
        <article className="rounded-sm border border-gray-100 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 text-sm">
                <p>
                    <StoreIcon width={16} height={16} className="mr-1 inline-block align-text-bottom text-gray-500" />
                    <span className="font-medium">{order.shop_name || "Shop"}</span>
                    <span className="ml-3 text-xs text-gray-400">
                        #{order.order_number} · {formatDate(order.placed_at)}
                    </span>
                </p>
                <StatusBadge status={status} orderLabels />
            </header>

            <ul className="divide-y divide-gray-50">
                {order.items.map((item) => (
                    <li key={item.order_item_id} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                            <img
                                src={getProductImage(item.product_name)}
                                alt=""
                                className="h-16 w-16 rounded border border-gray-100 object-cover"
                            />
                            <div className="min-w-0 flex-1">
                                <Link to={`/product/${item.product_id}`} className="line-clamp-2 text-sm hover:text-[#EE4D2D]">
                                    {item.product_name}
                                </Link>
                                {item.variant_name && (
                                    <p className="text-xs text-gray-400">{item.variant_name}</p>
                                )}
                                <p className="text-xs text-gray-500">x{item.quantity}</p>
                            </div>
                            <div className="text-right text-sm">
                                {formatCurrency(item.subtotal)}
                                {["DELIVERED", "COMPLETED"].includes(status) && (
                                    <div className="mt-1">
                                        {item.reviewed ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-green-600">Reviewed <CheckIcon width={12} height={12} /></span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => setReviewing(item.order_item_id)}
                                                className="inline-flex items-center gap-1 rounded border border-[#EE4D2D] px-3 py-1 text-xs font-medium text-[#EE4D2D] hover:bg-orange-50"
                                            >
                                                <StarIcon width={12} height={12} /> Write a review
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {reviewing === item.order_item_id && (
                            <ReviewForm
                                busy={busy}
                                onCancel={() => setReviewing(null)}
                                onSubmit={(review) =>
                                    run(`${base}/items/${item.order_item_id}/review`, review)
                                }
                            />
                        )}
                    </li>
                ))}
            </ul>

            <footer className="space-y-3 border-t border-gray-100 bg-[#fffefb] px-4 py-3">
                <div className="flex flex-wrap items-end justify-between gap-3 text-xs text-gray-500">
                    <div className="space-y-0.5">
                        {order.address && (
                            <p>
                                Ship to: {order.address.recipient_name}, {order.address.address_line},{" "}
                                {order.address.city}
                            </p>
                        )}
                        <p>
                            Payment: {PAYMENT_METHOD_LABELS[order.payment_method] || "—"}
                            {order.payment_status && ` (${order.payment_status.toLowerCase()})`}
                        </p>
                        {order.tracking_number && (
                            <p>
                                Tracking: {order.courier ? `${order.courier} · ` : ""}
                                {order.tracking_number}
                            </p>
                        )}
                    </div>
                    <p className="text-sm text-gray-700">
                        Order total:{" "}
                        <span className="text-xl text-[#EE4D2D]">{formatCurrency(order.total_amount)}</span>
                    </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                    {status === "PENDING_PAYMENT" && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => run(`${base}/pay`, {}, "Payment successful.")}
                            className={`${button} bg-[#EE4D2D] text-white hover:bg-[#d73211]`}
                        >
                            Pay now
                        </button>
                    )}
                    {["PENDING_PAYMENT", "PAID", "PROCESSING"].includes(status) && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => confirmAction("Cancel this order?", `${base}/cancel`, "Order cancelled.")}
                            className={`${button} border border-gray-300 hover:bg-gray-50`}
                        >
                            Cancel order
                        </button>
                    )}
                    {["SHIPPED", "DELIVERED"].includes(status) && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => confirmAction("Confirm that you received this order?", `${base}/receive`)}
                            className={`${button} bg-[#EE4D2D] text-white hover:bg-[#d73211]`}
                        >
                            Order received
                        </button>
                    )}
                    {["DELIVERED", "COMPLETED"].includes(status) && (
                        order.return_info?.latest_return &&
                        !["REJECTED", "CANCELLED"].includes(order.return_info.latest_return.status) ? (
                            <Link to="/customer/returns" className={`${button} border border-gray-300 hover:bg-gray-50`}>
                                Return: {order.return_info.latest_return.status.replace(/_/g, " ").toLowerCase()}
                            </Link>
                        ) : order.return_info?.can_return ? (
                            <button type="button" onClick={() => setReturning(true)} className={`${button} border border-gray-300 hover:bg-gray-50`}>
                                Return / refund
                            </button>
                        ) : (
                            <button type="button" disabled title="Returns are accepted within 3 days of delivery" className={`${button} border border-gray-200 text-gray-400`}>
                                Return window closed (3 days)
                            </button>
                        )
                    )}
                    {["COMPLETED", "CANCELLED"].includes(status) && order.items[0] && (
                        <Link
                            to={`/product/${order.items[0].product_id}`}
                            className={`${button} border border-gray-300 hover:bg-gray-50`}
                        >
                            Buy again
                        </Link>
                    )}
                </div>
            </footer>
            {returning && (
                <ReturnRequestModal
                    order={order}
                    userId={userId}
                    onClose={() => setReturning(false)}
                    onDone={(message) => {
                        setReturning(false);
                        setNotice({ type: "success", text: message });
                        onChanged();
                    }}
                />
            )}
        </article>
    );
}

function Orders({ user }) {
    const [params, setParams] = useSearchParams();
    const tabKey = TABS.some((t) => t.key === params.get("tab")) ? params.get("tab") : "ALL";
    const [term, setTerm] = useState("");
    const [notice, setNotice] = useState(null);

    const { data, loading, error, reload } = useApi(
        `/api/customer/${user.user_id}/orders?include=items`
    );

    const tab = TABS.find((t) => t.key === tabKey);
    const needle = term.trim().toLowerCase();

    const orders = (data?.orders || []).filter(
        (order) =>
            tab.match(order.status) &&
            (!needle ||
                order.order_number.toLowerCase().includes(needle) ||
                order.items.some((i) => i.product_name.toLowerCase().includes(needle)))
    );

    return (
        <div>
            <nav className="flex overflow-x-auto border-b border-gray-100" aria-label="Order status">
                {TABS.map((item) => (
                    <button
                        key={item.key}
                        type="button"
                        onClick={() => setParams(item.key === "ALL" ? {} : { tab: item.key })}
                        className={`shrink-0 border-b-2 px-5 py-3 text-sm ${
                            item.key === tabKey
                                ? "border-[#EE4D2D] text-[#EE4D2D]"
                                : "border-transparent text-gray-600 hover:text-[#EE4D2D]"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="space-y-4 bg-[#F5F5F5] p-4">
                <input
                    type="search"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search by order number or product name"
                    aria-label="Search orders"
                    className="w-full rounded-sm border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#EE4D2D]"
                />

                <Notice notice={notice} />
                <ErrorNote message={error} onRetry={reload} />

                {loading ? (
                    <Spinner label="Loading your orders..." />
                ) : orders.length === 0 ? (
                    <div className="rounded-sm bg-white">
                        <EmptyState title="No orders found." hint="Orders matching this tab will appear here.">
                            <Link to="/search" className="rounded bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]">
                                Browse products
                            </Link>
                        </EmptyState>
                    </div>
                ) : (
                    orders.map((order) => (
                        <OrderCard
                            key={order.order_id}
                            order={order}
                            userId={user.user_id}
                            onChanged={reload}
                            setNotice={setNotice}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default function CustomerOrders() {
    return (
        <CustomerLayout activeMenu="My orders" title="My orders">
            {(user) => <Orders user={user} />}
        </CustomerLayout>
    );
}
