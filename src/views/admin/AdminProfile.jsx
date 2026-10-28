import { useEffect, useState } from "react";
import AdminPageHeader from "../../components/admin/AdminPageHeader.jsx";
import { ImageUpload } from "../../components/ImageUpload.jsx";
import { ErrorNote, Notice, Spinner } from "../../components/Feedback.jsx";
import { api } from "../../services/api.js";
import { formatDate } from "../../utils/format.js";

const input =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
const primary =
  "rounded-lg bg-[#EE4D2D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#d73211] disabled:opacity-60";

// Keeps the saved login in sync so the header shows the new name/photo.
function syncSession(profile) {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const raw = store.getItem("user");
      if (!raw) continue;
      store.setItem(
        "user",
        JSON.stringify({
          ...JSON.parse(raw),
          first_name: profile.first_name,
          last_name: profile.last_name,
          profile_image: profile.profile_image,
          phone: profile.phone,
        })
      );
    } catch {
      /* storage unavailable */
    }
  }
}

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "", confirm: "" });
  const [pwNotice, setPwNotice] = useState(null);
  const [pwBusy, setPwBusy] = useState(false);

  function fill(data) {
    setProfile(data);
    setForm({
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      phone: data.phone || "",
      profile_image: data.profile_image || "",
    });
  }

  async function load() {
    setError("");
    try {
      fill((await api("/api/admin/profile")).data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const result = await api("/api/admin/profile", { method: "PUT", body: form });
      fill(result.data);
      syncSession(result.data);
      setNotice({ type: "success", text: result.message });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    setPwNotice(null);

    if (pw.new_password !== pw.confirm) {
      return setPwNotice({ type: "error", text: "The new passwords do not match." });
    }

    setPwBusy(true);
    try {
      const result = await api("/api/admin/profile/password", {
        method: "PUT",
        body: { current_password: pw.current_password, new_password: pw.new_password },
      });
      setPw({ current_password: "", new_password: "", confirm: "" });
      setPwNotice({ type: "success", text: result.message });
    } catch (err) {
      setPwNotice({ type: "error", text: err.message });
    } finally {
      setPwBusy(false);
    }
  }

  if (error) return <ErrorNote message={error} onRetry={load} />;
  if (!form) return <Spinner label="Loading your profile..." />;

  const set = (key) => (event) => setForm({ ...form, [key]: event.target.value });

  return (
    <section>
      <AdminPageHeader title="My Profile" description="Update your account details and password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveProfile} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Account details</h2>
          <ImageUpload
            round
            value={form.profile_image}
            onChange={(path) => setForm({ ...form, profile_image: path })}
            label="Change photo"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input className={input} required maxLength={100} value={form.first_name} onChange={set("first_name")} />
            </Field>
            <Field label="Last name">
              <input className={input} required maxLength={100} value={form.last_name} onChange={set("last_name")} />
            </Field>
          </div>
          <Field label="Phone">
            <input className={input} maxLength={30} value={form.phone} onChange={set("phone")} />
          </Field>
          <dl className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <dt>Username</dt><dd>{profile.username}</dd>
            <dt>Email</dt><dd className="break-all">{profile.email}</dd>
            <dt>Role</dt><dd>{profile.role_name}</dd>
            <dt>Member since</dt><dd>{formatDate(profile.created_at)}</dd>
            <dt>Last login</dt><dd>{profile.last_login_at ? formatDate(profile.last_login_at) : "—"}</dd>
            <dt>Logged actions</dt><dd>{profile.activity_count}</dd>
          </dl>
          <Notice notice={notice} />
          <button type="submit" disabled={busy} className={primary}>
            {busy ? "Saving..." : "Save profile"}
          </button>
        </form>

        <form onSubmit={savePassword} className="space-y-4 self-start rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold">Change password</h2>
          <Field label="Current password">
            <input type="password" autoComplete="current-password" required className={input} value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} />
          </Field>
          <Field label="New password (8+ characters)">
            <input type="password" autoComplete="new-password" required minLength={8} className={input} value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" autoComplete="new-password" required className={input} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
          </Field>
          <Notice notice={pwNotice} />
          <button type="submit" disabled={pwBusy} className={primary}>
            {pwBusy ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </section>
  );
}
