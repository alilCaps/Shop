export function formatCurrency(amount) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP"
    }).format(Number(amount) || 0);
}

export function formatDate(date) {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "Date unavailable";

    return parsed.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

export const ORDER_STATUS_LABELS = {
    PENDING_PAYMENT: "To Pay",
    PAID: "To Ship",
    PROCESSING: "To Ship",
    SHIPPED: "To Receive",
    DELIVERED: "Delivered",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    REFUNDED: "Refunded"
};

export const PAYMENT_METHOD_LABELS = {
    CASH_ON_DELIVERY: "Cash on Delivery",
    GCASH: "GCash",
    MAYA: "Maya",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT_CARD: "Credit Card",
    DEBIT_CARD: "Debit Card",
    OTHER: "Other"
};

export function shippingFor(subtotal, shipping) {
    const fee = Number(shipping?.shipping_fee ?? 50);
    const freeFrom = Number(shipping?.free_shipping_minimum ?? 1000);

    return subtotal >= freeFrom ? 0 : fee;
}

// 12400 -> "12.4k"
export function formatSold(count) {
    const n = Number(count) || 0;

    if (n < 1000) return String(n);

    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
}
