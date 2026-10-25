import { ORDER_STATUS_LABELS } from "../utils/format";

const STYLES = {
    PENDING_PAYMENT: "bg-orange-50 text-orange-700",
    PAID: "bg-blue-50 text-blue-700",
    PROCESSING: "bg-blue-50 text-blue-700",
    SHIPPED: "bg-indigo-50 text-indigo-700",
    DELIVERED: "bg-green-50 text-green-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
    REFUNDED: "bg-purple-50 text-purple-700",
    ACTIVE: "bg-green-50 text-green-700",
    PENDING: "bg-yellow-50 text-yellow-800",
    FAILED: "bg-red-50 text-red-700",
    DRAFT: "bg-gray-100 text-gray-600",
    INACTIVE: "bg-gray-100 text-gray-600",
    OUT_OF_STOCK: "bg-red-50 text-red-700",
    BANNED: "bg-red-50 text-red-700",
    SUSPENDED: "bg-red-50 text-red-700",
    CLOSED: "bg-gray-100 text-gray-600"
};

export default function StatusBadge({ status, label, orderLabels = false }) {
    const key = String(status || "").toUpperCase();
    const text =
        label ||
        (orderLabels ? ORDER_STATUS_LABELS[key] : null) ||
        key.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) ||
        "Unknown";

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                STYLES[key] || "bg-gray-100 text-gray-600"
            }`}
        >
            {text}
        </span>
    );
}
