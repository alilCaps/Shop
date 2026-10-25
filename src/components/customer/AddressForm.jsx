import { useState } from "react";

const EMPTY = {
    recipient_name: "",
    phone: "",
    address_line: "",
    barangay: "",
    city: "",
    province: "",
    region: "",
    postal_code: "",
    address_type: "HOME",
    is_default: false
};

const FIELDS = [
    { name: "recipient_name", label: "Full name", required: true, span: 1 },
    { name: "phone", label: "Phone number", required: true, span: 1 },
    { name: "address_line", label: "Street, building, house no.", required: true, span: 2 },
    { name: "barangay", label: "Barangay", span: 1 },
    { name: "city", label: "City / Municipality", required: true, span: 1 },
    { name: "province", label: "Province", required: true, span: 1 },
    { name: "region", label: "Region", span: 1 },
    { name: "postal_code", label: "Postal code", span: 1 }
];

// Used by the Addresses page and by checkout. `onSubmit` receives the payload.
export default function AddressForm({
    initial,
    onSubmit,
    onCancel,
    submitLabel = "Save address"
}) {
    const [form, setForm] = useState({ ...EMPTY, ...(initial || {}) });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    function change(event) {
        const { name, value, type, checked } = event.target;
        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    async function submit(event) {
        event.preventDefault();

        const missing = FIELDS.find(
            (field) => field.required && !String(form[field.name] || "").trim()
        );

        if (missing) {
            setError(`${missing.label} is required.`);
            return;
        }

        setBusy(true);
        setError("");

        try {
            await onSubmit({
                ...form,
                address_id: undefined,
                user_id: undefined,
                created_at: undefined,
                updated_at: undefined,
                is_default: Boolean(form.is_default)
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            {error && (
                <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map((field) => (
                    <label
                        key={field.name}
                        className={`block text-xs text-gray-500 ${field.span === 2 ? "sm:col-span-2" : ""}`}
                    >
                        {field.label}
                        {field.required && <span className="text-red-500"> *</span>}
                        <input
                            name={field.name}
                            value={form[field.name] ?? ""}
                            onChange={change}
                            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-800 outline-none focus:border-[#EE4D2D]"
                        />
                    </label>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm">
                <fieldset className="flex items-center gap-3">
                    <legend className="sr-only">Address type</legend>
                    {["HOME", "WORK", "OTHER"].map((type) => (
                        <label key={type} className="flex items-center gap-1.5">
                            <input
                                type="radio"
                                name="address_type"
                                value={type}
                                checked={form.address_type === type}
                                onChange={change}
                                className="accent-[#EE4D2D]"
                            />
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                        </label>
                    ))}
                </fieldset>

                <label className="flex items-center gap-1.5">
                    <input
                        type="checkbox"
                        name="is_default"
                        checked={Boolean(form.is_default)}
                        onChange={change}
                        className="accent-[#EE4D2D]"
                    />
                    Set as default address
                </label>
            </div>

            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={busy}
                    className="rounded bg-[#EE4D2D] px-6 py-2 text-sm text-white hover:bg-[#d73211] disabled:opacity-60"
                >
                    {busy ? "Saving..." : submitLabel}
                </button>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded border border-gray-300 px-6 py-2 text-sm hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export function addressLines(address) {
    return [
        address.address_line,
        address.barangay,
        address.city,
        address.province,
        address.postal_code
    ]
        .filter(Boolean)
        .join(", ");
}
