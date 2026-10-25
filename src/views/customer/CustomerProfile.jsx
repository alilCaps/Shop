import { useState } from "react";
import CustomerLayout from "../../components/customer/CustomerLayout";
import { Notice } from "../../components/Feedback";
import { api, getStoredUser } from "../../services/api";

const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#EE4D2D]";

function ProfileForm({ user }) {
    const [form, setForm] = useState({
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        phone: user.phone ?? "",
        profile_image: user.profile_image ?? ""
    });
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null);
    const [imageBroken, setImageBroken] = useState(false);

    function change(event) {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
        if (name === "profile_image") setImageBroken(false);
        setNotice(null);
    }

    async function save(event) {
        event.preventDefault();

        const payload = Object.fromEntries(
            Object.entries(form).map(([key, value]) => [key, value.trim()])
        );

        if (!payload.first_name || !payload.last_name) {
            setNotice({ type: "error", text: "First and last name are required." });
            return;
        }

        if (payload.profile_image && !/^https?:\/\/\S+$/i.test(payload.profile_image)) {
            setNotice({
                type: "error",
                text: "Profile image must be a link starting with http:// or https://."
            });
            return;
        }

        setSaving(true);

        try {
            await api(`/users/${user.user_id}`, { method: "PUT", body: payload });

            // Keep the saved login in sync so the header shows the new name.
            const storage = localStorage.getItem("user") ? localStorage : sessionStorage;
            storage.setItem(
                "user",
                JSON.stringify({ ...getStoredUser(), ...payload })
            );

            setNotice({ type: "success", text: "Your profile has been updated." });
        } catch (err) {
            setNotice({ type: "error", text: err.message });
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={save} className="grid gap-8 p-5 md:grid-cols-[1fr_220px]">
            <div className="space-y-4">
                <Notice notice={notice} />

                <dl className="grid grid-cols-[110px_1fr] items-center gap-y-4 text-sm">
                    <dt className="text-gray-500">Username</dt>
                    <dd>{user.username}</dd>
                    <dt className="text-gray-500">Email</dt>
                    <dd>{user.email}</dd>

                    <dt><label htmlFor="first_name" className="text-gray-500">First name</label></dt>
                    <dd><input id="first_name" name="first_name" value={form.first_name} onChange={change} maxLength={100} className={inputClass} /></dd>

                    <dt><label htmlFor="last_name" className="text-gray-500">Last name</label></dt>
                    <dd><input id="last_name" name="last_name" value={form.last_name} onChange={change} maxLength={100} className={inputClass} /></dd>

                    <dt><label htmlFor="phone" className="text-gray-500">Phone</label></dt>
                    <dd><input id="phone" name="phone" value={form.phone} onChange={change} maxLength={30} className={inputClass} /></dd>

                    <dt><label htmlFor="profile_image" className="text-gray-500">Photo link</label></dt>
                    <dd><input id="profile_image" name="profile_image" value={form.profile_image} onChange={change} placeholder="https://..." className={inputClass} /></dd>
                </dl>

                <button
                    type="submit"
                    disabled={saving}
                    className="rounded bg-[#EE4D2D] px-8 py-2.5 text-sm text-white hover:bg-[#d73211] disabled:opacity-60"
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>

            <div className="flex flex-col items-center gap-3 border-gray-100 md:border-l">
                <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-5xl">
                    {form.profile_image && !imageBroken ? (
                        <img
                            src={form.profile_image}
                            alt="Profile preview"
                            onError={() => setImageBroken(true)}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        "👤"
                    )}
                </div>
                <p className="text-xs text-gray-400">Preview</p>
            </div>
        </form>
    );
}

export default function CustomerProfile() {
    return (
        <CustomerLayout
            activeMenu="My profile"
            title="My profile"
            subtitle="Manage and protect your account"
        >
            {(user) => <ProfileForm user={user} />}
        </CustomerLayout>
    );
}
