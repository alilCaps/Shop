import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorNote, Spinner } from "./Feedback";
import { useApi } from "../hooks/useApi";
import { api } from "../services/api";

const ICONS = {
    ORDER: "📦",
    PAYMENT: "💳",
    SHIPPING: "🚚",
    PROMOTION: "🏷️",
    SYSTEM: "⚙️",
    MESSAGE: "💬"
};

function timeLabel(value) {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? ""
        : date.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });
}

// Shared by the customer and seller notification pages.
// `ordersPath` is where "View order" links go for that kind of account.
export default function NotificationList({ ordersPath }) {
    const { data, loading, error, reload } = useApi("/api/notifications");
    const [actionError, setActionError] = useState("");

    const items = data?.notifications || [];

    async function mark(path) {
        setActionError("");

        try {
            await api(path, { method: "PUT", body: {} });
            reload();
        } catch (err) {
            setActionError(err.message);
        }
    }

    return (
        <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    {data ? `${data.unread} unread` : ""}
                </p>
                <button
                    type="button"
                    disabled={!data?.unread}
                    onClick={() => mark("/api/notifications/read-all")}
                    className="text-sm text-[#EE4D2D] hover:underline disabled:cursor-not-allowed disabled:text-gray-300 disabled:no-underline"
                >
                    Mark all as read
                </button>
            </div>

            <ErrorNote message={error || actionError} onRetry={error ? reload : undefined} />

            {loading ? (
                <Spinner />
            ) : items.length === 0 ? (
                <EmptyState icon="🔔" title="You're all caught up." hint="Order and shipping updates will show up here." />
            ) : (
                <ul className="divide-y divide-gray-100 rounded border border-gray-100">
                    {items.map((item) => (
                        <li
                            key={item.notification_id}
                            className={`flex gap-3 px-4 py-3 ${item.is_read ? "" : "bg-[#fff8f6]"}`}
                        >
                            <span className="text-2xl" aria-hidden="true">
                                {ICONS[item.notification_type] || "🔔"}
                            </span>
                            <div className="min-w-0 flex-1 text-sm">
                                <p className={item.is_read ? "text-gray-700" : "font-medium"}>{item.title}</p>
                                <p className="mt-0.5 text-gray-600">{item.message}</p>
                                <p className="mt-1 text-xs text-gray-400">{timeLabel(item.created_at)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 text-xs">
                                {ordersPath && item.reference_id && ["ORDER", "SHIPPING", "PAYMENT"].includes(item.notification_type) && (
                                    <Link to={ordersPath} className="text-[#EE4D2D] hover:underline">
                                        View orders
                                    </Link>
                                )}
                                {!item.is_read && (
                                    <button
                                        type="button"
                                        onClick={() => mark(`/api/notifications/${item.notification_id}/read`)}
                                        className="text-gray-500 hover:underline"
                                    >
                                        Mark read
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
