import { useState } from "react";
import ReturnCard from "../../components/ReturnCard";
import { EmptyState, ErrorNote, Notice, Spinner } from "../../components/Feedback";
import { useApi } from "../../hooks/useApi";
import { api, getStoredUser } from "../../services/api";

const LABELS = {
    APPROVED: "Approve",
    REJECTED: "Reject",
    RECEIVED: "Mark received",
    COMPLETED: "Complete & refund",
    CANCELLED: "Cancel"
};

export default function SellerReturns() {
    const userId = getStoredUser()?.user_id;
    const { data, loading, error, reload } = useApi(`/api/seller/${userId}/returns`);
    const [notice, setNotice] = useState(null);
    const [busy, setBusy] = useState(false);

    async function change(id, status) {
        if (["REJECTED", "COMPLETED"].includes(status) && !window.confirm(`${LABELS[status]} this request?`)) return;
        setBusy(true);
        try {
            await api(`/api/seller/${userId}/returns/${id}`, { method: "PUT", body: { status } });
            setNotice({ type: "success", text: "Return request updated." });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-semibold">Returns & refunds</h1>
            <Notice notice={notice} />
            <ErrorNote message={error} onRetry={reload} />
            {loading ? (
                <Spinner label="Loading returns..." />
            ) : (data?.returns || []).length === 0 ? (
                <div className="rounded-sm bg-white"><EmptyState title="No return requests yet." /></div>
            ) : (
                data.returns.map((item) => (
                    <ReturnCard key={item.return_id} item={item} party={item.customer_name}>
                        {item.actions.filter((a) => LABELS[a]).map((status) => (
                            <button
                                key={status}
                                type="button"
                                disabled={busy}
                                onClick={() => change(item.return_id, status)}
                                className={`rounded px-4 py-2 text-sm disabled:opacity-60 ${
                                    ["APPROVED", "COMPLETED", "RECEIVED"].includes(status)
                                        ? "bg-[#EE4D2D] text-white hover:bg-[#d73211]"
                                        : "border border-gray-300 hover:bg-gray-50"
                                }`}
                            >
                                {LABELS[status]}
                            </button>
                        ))}
                    </ReturnCard>
                ))
            )}
        </div>
    );
}
