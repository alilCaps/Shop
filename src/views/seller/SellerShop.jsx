import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../services/api";

const FIELDS = [
    ["shop_name", "Shop name", "text", true],
    ["contact_email", "Contact email", "email"],
    ["contact_phone", "Contact phone", "text"],
    ["shop_address", "Shop address", "text"],
    ["shop_logo", "Logo image URL", "url"]
];

export default function SellerShop() {
    const { user, shop, reloadShop } = useOutletContext();
    const [form, setForm] = useState({
        shop_name: shop?.shop_name ?? "",
        shop_description: shop?.shop_description ?? "",
        contact_email: shop?.contact_email ?? "",
        contact_phone: shop?.contact_phone ?? "",
        shop_address: shop?.shop_address ?? "",
        shop_logo: shop?.shop_logo ?? ""
    });
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);

    function change(event) {
        setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
        setNotice(null);
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setNotice(null);

        try {
            const result = await api(`/api/seller/${user.user_id}/shop`, {
                method: shop ? "PUT" : "POST",
                body: form
            });
            await reloadShop();
            setNotice({ type: "success", text: result.message });
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
                <h1 className="text-xl font-medium">{shop ? "My Shop" : "Create your shop"}</h1>
                {shop && <StatusBadge status={shop.status} />}
            </div>

            <form onSubmit={submit} className="max-w-2xl space-y-4 p-5">
                {notice && (
                    <p
                        role="alert"
                        className={`rounded px-4 py-3 text-sm ${
                            notice.type === "success"
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                        }`}
                    >
                        {notice.text}
                    </p>
                )}

                {FIELDS.map(([name, label, type, required]) => (
                    <label key={name} className="block text-sm">
                        <span className="mb-1 block text-gray-600">{label}</span>
                        <input
                            name={name}
                            type={type}
                            required={required}
                            value={form[name]}
                            onChange={change}
                            className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#EE4D2D]"
                        />
                    </label>
                ))}

                <label className="block text-sm">
                    <span className="mb-1 block text-gray-600">Description</span>
                    <textarea
                        name="shop_description"
                        rows={4}
                        value={form.shop_description}
                        onChange={change}
                        className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-[#EE4D2D]"
                    />
                </label>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-[#EE4D2D] px-8 py-2 text-sm text-white hover:bg-[#d73211] disabled:opacity-50"
                >
                    {saving ? "Saving..." : shop ? "Save changes" : "Create shop"}
                </button>
            </form>
        </div>
    );
}
