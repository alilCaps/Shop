import { useState } from "react";
import CustomerLayout from "../../components/customer/CustomerLayout";
import ReturnCard from "../../components/ReturnCard";
import { EmptyState, ErrorNote, Notice, Spinner } from "../../components/Feedback";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api";

function Returns({ user }) {
    const { data, loading, error, reload } = useApi(`/api/customer/${user.user_id}/returns`);
    const [notice, setNotice] = useState(null);
    const [busy, setBusy] = useState(false);

    async function act(id, action, text) {
        if (action === "cancel" && !window.confirm("Cancel this return request?")) return;
        setBusy(true);
        try {
            await api(`/api/customer/${user.user_id}/returns/${id}/${action}`, { method: "POST", body: {} });
            setNotice({ type: "success", text });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        } finally {
            setBusy(false);
        }
    }

    const btn = "rounded border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-60";

    return (
        <div className="space-y-4 bg-[#F5F5F5] p-4">
            <p className="rounded bg-white px-4 py-3 text-sm text-gray-600">
                Items can be returned within {data?.window_days ?? 3} days after delivery. After that, returns are no longer accepted.
            </p>
            <Notice notice={notice} />
            <ErrorNote message={error} onRetry={reload} />
            {loading ? (
                <Spinner label="Loading your returns..." />
            ) : (data?.returns || []).length === 0 ? (
                <div className="rounded-sm bg-white">
                    <EmptyState title="No return requests." hint="Start a return from My orders after your order is delivered." />
                </div>
            ) : (
                data.returns.map((item) => (
                    <ReturnCard key={item.return_id} item={item} party={item.shop_name}>
                        {item.actions.includes("ITEM_SHIPPED") && (
                            <button type="button" disabled={busy} className={btn} onClick={() => act(item.return_id, "ship-back", "Marked as shipped back.")}>
                                I shipped it back
                            </button>
                        )}
                        {item.actions.includes("CANCELLED") && (
                            <button type="button" disabled={busy} className={btn} onClick={() => act(item.return_id, "cancel", "Request cancelled.")}>
                                Cancel request
                            </button>
                        )}
                    </ReturnCard>
                ))
            )}
        </div>
    );
}

export default function CustomerReturns() {
    return (
        <CustomerLayout activeMenu="Returns" title="Returns & refunds">
            {(user) => <Returns user={user} />}
        </CustomerLayout>
    );
}
