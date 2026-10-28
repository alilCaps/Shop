import StatusBadge from "./StatusBadge";
import { formatCurrency, formatDate } from "../utils/format";

// Shared card for a return request. `actions` are rendered by the caller.
export default function ReturnCard({ item, party, children }) {
    return (
        <article className="rounded-sm border border-gray-100 bg-white">
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 text-sm">
                <p>
                    <span className="font-medium">Order #{item.order_number}</span>
                    <span className="ml-3 text-xs text-gray-400">
                        {item.return_type === "RETURN" ? "Return" : "Refund only"} · requested {formatDate(item.requested_at)}
                    </span>
                    {party && <span className="ml-3 text-xs text-gray-500">{party}</span>}
                </p>
                <StatusBadge status={item.status} />
            </header>
            <ul className="divide-y divide-gray-50 px-4 text-sm">
                {item.items.map((line) => (
                    <li key={line.order_item_id} className="flex justify-between py-2">
                        <span>{line.product_name} <span className="text-gray-500">x{line.quantity}</span></span>
                        <span>{formatCurrency(line.unit_price * line.quantity)}</span>
                    </li>
                ))}
            </ul>
            <footer className="space-y-2 border-t border-gray-100 px-4 py-3 text-sm">
                <p className="text-gray-600">Reason: {item.reason}</p>
                <p>
                    {item.refund_amount != null ? "Refunded" : "Expected refund"}:{" "}
                    <span className="text-[#EE4D2D]">{formatCurrency(item.refund_amount ?? item.expected_refund)}</span>
                </p>
                {children && <div className="flex flex-wrap justify-end gap-2">{children}</div>}
            </footer>
        </article>
    );
}
