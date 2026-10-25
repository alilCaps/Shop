import { useState } from "react";
import CustomerLayout from "../../components/customer/CustomerLayout";
import AddressForm, { addressLines } from "../../components/customer/AddressForm";
import { EmptyState, ErrorNote, Notice, Spinner } from "../../components/Feedback";
import { useApi } from "../../hooks/useApi";
import { api } from "../../services/api";

function Addresses({ user }) {
    const base = `/api/customer/${user.user_id}/addresses`;
    const { data, loading, error, reload } = useApi(base);
    const [editing, setEditing] = useState(null); // null | "new" | address
    const [notice, setNotice] = useState(null);

    async function save(payload) {
        if (editing === "new") {
            await api(base, { method: "POST", body: payload });
        } else {
            await api(`${base}/${editing.address_id}`, { method: "PUT", body: payload });
        }

        setEditing(null);
        setNotice({ type: "success", text: "Address saved." });
        reload();
    }

    async function act(request, success) {
        setNotice(null);

        try {
            await request();
            setNotice({ type: "success", text: success });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        }
    }

    const addresses = data?.addresses || [];

    return (
        <div className="space-y-4 p-5">
            <Notice notice={notice} />
            <ErrorNote message={error} onRetry={reload} />

            {editing ? (
                <div className="rounded border border-gray-200 p-5">
                    <h2 className="mb-4 font-medium">
                        {editing === "new" ? "New address" : "Edit address"}
                    </h2>
                    <AddressForm
                        initial={editing === "new" ? null : editing}
                        onSubmit={save}
                        onCancel={() => setEditing(null)}
                    />
                </div>
            ) : (
                <button
                    type="button"
                    onClick={() => {
                        setNotice(null);
                        setEditing("new");
                    }}
                    className="rounded bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]"
                >
                    + Add new address
                </button>
            )}

            {loading ? (
                <Spinner />
            ) : addresses.length === 0 && !editing ? (
                <EmptyState icon="📍" title="You don't have any addresses yet." hint="Add one to speed up checkout." />
            ) : (
                <ul className="divide-y divide-gray-100">
                    {addresses.map((address) => (
                        <li key={address.address_id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                            <div className="min-w-0 text-sm">
                                <p className="font-medium">
                                    {address.recipient_name}
                                    <span className="ml-3 font-normal text-gray-500">{address.phone}</span>
                                </p>
                                <p className="mt-1 text-gray-600">{addressLines(address)}</p>
                                <p className="mt-2 flex gap-2 text-xs">
                                    <span className="rounded border border-gray-300 px-2 py-0.5 text-gray-600">
                                        {address.address_type}
                                    </span>
                                    {Boolean(address.is_default) && (
                                        <span className="rounded border border-[#EE4D2D] px-2 py-0.5 text-[#EE4D2D]">
                                            Default
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 text-sm">
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setEditing(address)} className="text-blue-600 hover:underline">
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm("Delete this address?")) {
                                                act(() => api(`${base}/${address.address_id}`, { method: "DELETE" }), "Address deleted.");
                                            }
                                        }}
                                        className="text-red-600 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                                {!address.is_default && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            act(
                                                () => api(`${base}/${address.address_id}/default`, { method: "PUT", body: {} }),
                                                "Default address updated."
                                            )
                                        }
                                        className="rounded border border-gray-300 px-3 py-1 text-xs hover:bg-gray-50"
                                    >
                                        Set as default
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

export default function CustomerAddresses() {
    return (
        <CustomerLayout activeMenu="Addresses" title="My addresses" subtitle="Where should we deliver your orders?">
            {(user) => <Addresses user={user} />}
        </CustomerLayout>
    );
}
