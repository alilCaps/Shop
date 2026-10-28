import { useState } from "react";
import Modal from "./Modal";
import { api } from "../services/api";
import { formatCurrency } from "../utils/format";

const TYPES = [
    { key: "RETURN", label: "Return item & get refund", hint: "Send the item back to the seller." },
    { key: "REFUND", label: "Refund only", hint: "Keep the item, e.g. wrong or damaged item." }
];

export default function ReturnRequestModal({ order, userId, onClose, onDone }) {
    const [type, setType] = useState("RETURN");
    const [reason, setReason] = useState("");
    const [picked, setPicked] = useState(() =>
        Object.fromEntries(order.items.map((item) => [item.order_item_id, item.quantity]))
    );
    const [enabled, setEnabled] = useState(() =>
        Object.fromEntries(order.items.map((item) => [item.order_item_id, true]))
    );
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const deadline = order.return_info?.deadline;

    async function submit(event) {
        event.preventDefault();
        const items = order.items
            .filter((item) => enabled[item.order_item_id])
            .map((item) => ({
                order_item_id: item.order_item_id,
                quantity: Number(picked[item.order_item_id])
            }));

        if (items.length === 0) return setError("Choose at least one item.");
        if (!reason.trim()) return setError("Please tell us the reason.");

        setBusy(true);
        setError("");

        try {
            const result = await api(`/api/customer/${userId}/orders/${order.order_id}/return`, {
                method: "POST",
                body: { return_type: type, reason: reason.trim(), items }
            });
            onDone(result.message);
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    }

    return (
        <Modal
            title={`Return / refund · #${order.order_number}`}
            onClose={onClose}
            footer={
                <>
                    <button type="button" onClick={onClose} className="rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
                        Cancel
                    </button>
                    <button type="submit" form="return-form" disabled={busy} className="rounded bg-[#EE4D2D] px-4 py-2 text-sm text-white hover:bg-[#d73211] disabled:opacity-60">
                        {busy ? "Sending..." : "Submit request"}
                    </button>
                </>
            }
        >
            <form id="return-form" onSubmit={submit} className="space-y-4 text-sm">
                {deadline && (
                    <p className="rounded bg-orange-50 px-3 py-2 text-orange-700">
                        You can request a return until {new Date(deadline).toLocaleString()}.
                    </p>
                )}

                <fieldset className="space-y-2">
                    <legend className="mb-1 font-medium">What do you want?</legend>
                    {TYPES.map((option) => (
                        <label key={option.key} className="flex cursor-pointer items-start gap-2 rounded border border-gray-200 p-3 has-[:checked]:border-[#EE4D2D]">
                            <input type="radio" name="type" checked={type === option.key} onChange={() => setType(option.key)} className="mt-1" />
                            <span>
                                {option.label}
                                <span className="block text-xs text-gray-500">{option.hint}</span>
                            </span>
                        </label>
                    ))}
                </fieldset>

                <fieldset className="space-y-2">
                    <legend className="mb-1 font-medium">Items</legend>
                    {order.items.map((item) => (
                        <div key={item.order_item_id} className="flex items-center gap-3 rounded border border-gray-100 p-2">
                            <input
                                type="checkbox"
                                checked={enabled[item.order_item_id]}
                                onChange={(e) => setEnabled({ ...enabled, [item.order_item_id]: e.target.checked })}
                                aria-label={`Include ${item.product_name}`}
                            />
                            <span className="min-w-0 flex-1 truncate">{item.product_name}</span>
                            <span className="text-xs text-gray-500">{formatCurrency(item.unit_price)}</span>
                            <select
                                value={picked[item.order_item_id]}
                                disabled={!enabled[item.order_item_id]}
                                onChange={(e) => setPicked({ ...picked, [item.order_item_id]: e.target.value })}
                                aria-label="Quantity"
                                className="rounded border border-gray-300 px-2 py-1"
                            >
                                {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                        </div>
                    ))}
                </fieldset>

                <label className="block">
                    <span className="mb-1 block font-medium">Reason</span>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        required
                        placeholder="Describe the problem with your order"
                        className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#EE4D2D]"
                    />
                </label>

                {error && <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-red-700">{error}</p>}
            </form>
        </Modal>
    );
}
