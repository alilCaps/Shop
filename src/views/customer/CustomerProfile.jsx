
import logo from "../../assets/logo/orange_logo.png";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerSidebar from "./components/CustomerSidebar";

const API_URL = "http://localhost:5000";

function CustomerProfile() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        profile_image: ""
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeMenu, setActiveMenu] = useState("My profile");

    useEffect(() => {
        let cancelled = false;

        async function loadProfile() {
            const storedUser =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user");

            if (!storedUser) {
                navigate("/login", { replace: true });
                return;
            }

            let loggedInUser;

            try {
                loggedInUser = JSON.parse(storedUser);
            } catch {
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                navigate("/login", { replace: true });
                return;
            }

            if (!loggedInUser?.user_id) {
                localStorage.removeItem("user");
                sessionStorage.removeItem("user");
                navigate("/login", { replace: true });
                return;
            }

            try {
                const response = await fetch(
                    `${API_URL}/users/${loggedInUser.user_id}`
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to retrieve your profile. Please try again."
                    );
                }

                const data = await response.json();

                if (!data.user) {
                    throw new Error(
                        "User information was not returned by the server."
                    );
                }

                if (cancelled) return;

                const profile = data.user;

                setUser(profile);

                setFormData({
                    first_name: profile.first_name ?? "",
                    last_name: profile.last_name ?? "",
                    phone: profile.phone ?? "",
                    profile_image: profile.profile_image ?? ""
                });
            } catch (loadError) {
                if (!cancelled) {
                    setError(
                        loadError.message ||
                        "An error occurred while loading your profile."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProfile();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));

        if (name === "profile_image") {
            setImageError(false);
        }

        setError("");
        setSuccess("");
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (!user?.user_id) {
            setError("Your account could not be identified.");
            return;
        }

        const firstName = formData.first_name.trim();
        const lastName = formData.last_name.trim();
        const phone = formData.phone.trim();
        const profileImage = formData.profile_image.trim();

        if (firstName.length > 100 || lastName.length > 100) {
            setError(
                "First name and last name must not exceed 100 characters."
            );
            return;
        }

        if (phone.length > 30) {
            setError("Phone number must not exceed 30 characters.");
            return;
        }

        if (profileImage.length > 2048) {
            setError("The profile image URL is too long.");
            return;
        }

        if (
            profileImage &&
            !/^https?:\/\/\S+$/i.test(profileImage)
        ) {
            setError(
                "Please enter a valid image URL beginning with http:// or https://."
            );
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_URL}/users/${user.user_id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        first_name: firstName,
                        last_name: lastName,
                        phone,
                        profile_image: profileImage
                    })
                }
            );

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                if (
                    response.status === 404 ||
                    response.status === 405
                ) {
                    throw new Error(
                        "The profile update API is not available yet. Please configure the PUT route in server.js."
                    );
                }

                throw new Error(
                    data.message || "Unable to save your profile."
                );
            }

            const updatedUser = {
                ...user,
                ...(data.user || {}),
                first_name: firstName,
                last_name: lastName,
                phone,
                profile_image: profileImage
            };

            setUser(updatedUser);

            setFormData({
                first_name: firstName,
                last_name: lastName,
                phone,
                profile_image: profileImage
            });

            const storage = localStorage.getItem("user")
                ? localStorage
                : sessionStorage;

            const storedUser = JSON.parse(
                storage.getItem("user") || "{}"
            );

            storage.setItem(
                "user",
                JSON.stringify({
                    ...storedUser,
                    first_name: firstName,
                    last_name: lastName,
                    phone,
                    profile_image: profileImage
                })
            );

            setSuccess("Your profile has been updated successfully.");
        } catch (saveError) {
            setError(
                saveError.message ||
                "An error occurred while saving your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        navigate("/login", { replace: true });
    };

    const displayName =
        [user?.first_name, user?.last_name]
            .filter(
                (name) =>
                    typeof name === "string" && name.trim()
            )
            .join(" ") ||
        user?.username ||
        "Customer";

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="flex w-45 items-center justify-center">
                        <img
                            src={logo}
                            alt="Shopee Logo"
                            className="h-auto w-35 object-contain"
                        />
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                        Loading your profile...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-sm">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Unable to Load Profile
                    </h2>

                    <p className="mt-3 text-sm text-gray-500">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-5 rounded-md bg-[#EE4D2D] px-5 py-2 text-white transition hover:bg-[#d73211]"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] text-gray-700">
            
            {/* ORANGE TOP NAVIGATION BAR */}
            <div className="bg-[#EE4D2D] text-white text-xs">
                <div className="mx-auto flex min-h-7.5 max-w-300 items-center justify-between gap-3 px-4">
                    <div className="flex items-center gap-2">
                        <span>Seller Centre</span>
                        <span className="opacity-60">•</span>
                        <span>Download</span>
                        <span className="opacity-60">•</span>
                        <span>Follow us</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <span>Notifications</span>
                        <span>Help</span>
                        <span>English</span>
                        <span>{displayName || "Customer"}</span>
                    </div>
                </div>
            </div>

            {/* WHITE SHOPEE HEADER */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex min-h-17.5 max-w-300 items-center gap-7 px-4 py-3">

                    {/* SHOPEE LOGO */}
                    <Link
                        to="/"
                        className="flex w-45 shrink-0 items-center justify-center"
                    >
                        <img
                            src={logo}
                            alt="Shopee Logo"
                            className="h-auto w-35 object-contain"
                        />
                    </Link>

                    {/* SEARCH BAR */}
                    <div className="min-w-0 max-w-162.5 flex-1">
                        <div className="flex h-10 items-center overflow-hidden rounded-md bg-gray-100">
                            <input
                                type="text"
                                placeholder="Search for products, brands and shops"
                                className="min-w-0 flex-1 bg-transparent px-4 text-sm text-gray-700 outline-none placeholder:text-gray-400"
                            />

                            <button
                                type="button"
                                aria-label="Search"
                                className="mr-1 h-8 w-12 shrink-0 rounded-md bg-[#EE4D2D] text-white hover:bg-[#d73211]"
                            >
                                🔍
                            </button>
                        </div>
                    </div>

                    {/* HEADER LINKS */}
                    <nav className="hidden shrink-0 items-center gap-6 text-xs text-gray-600 lg:flex">
                        <Link to="/" className="hover:text-[#EE4D2D]">
                            Categories
                        </Link>

                        <Link to="/" className="hover:text-[#EE4D2D]">
                            Flash Sale
                        </Link>

                        <Link to="/" className="hover:text-[#EE4D2D]">
                            Shopee Mall
                        </Link>

                        <button
                            type="button"
                            aria-label="Wishlist"
                            className="text-xl"
                        >
                            ♡
                        </button>

                        <button
                            type="button"
                            aria-label="Shopping cart"
                            className="text-xl"
                        >
                            🛒
                        </button>
                    </nav>
                </div>
            </header>



            {/* PROFILE PAGE */}
            <main className="mx-auto max-w-300 px-4 py-6">
                <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[192px_minmax(0,1fr)]">

                    {/* CUSTOMER SIDEBAR */}
                    <CustomerSidebar
                        user={user}
                        displayName={displayName}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onLogout={handleLogout}
                    />

                    {/* PROFILE CONTENT */}
                    <section className="min-w-0 overflow-hidden rounded-lg bg-white shadow-sm">

                        {/* SECTION HEADER */}
                        <div className="border-b border-gray-100 p-5 sm:p-7">
                            <h1 className="text-xl font-semibold text-gray-800">
                                My Profile
                            </h1>

                            <p className="mt-1 text-sm text-gray-500">
                                Manage your personal information and account details.
                            </p>
                        </div>

                        <form onSubmit={handleSave}>
                            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px]">

                                {/* PROFILE FIELDS */}
                                <div className="space-y-5 p-5 sm:p-7">

                                    {/* USERNAME */}
                                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                                        <label
                                            htmlFor="username"
                                            className="text-sm text-gray-500 sm:text-right"
                                        >
                                            Username
                                        </label>

                                        <input
                                            id="username"
                                            value={user?.username ?? ""}
                                            readOnly
                                            className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
                                        />
                                    </div>

                                    {/* EMAIL */}
                                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                                        <label
                                            htmlFor="email"
                                            className="text-sm text-gray-500 sm:text-right"
                                        >
                                            Email
                                        </label>

                                        <input
                                            id="email"
                                            type="email"
                                            value={user?.email ?? ""}
                                            readOnly
                                            className="w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500"
                                        />
                                    </div>

                                    {/* FIRST NAME */}
                                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                                        <label
                                            htmlFor="first_name"
                                            className="text-sm text-gray-500 sm:text-right"
                                        >
                                            First name
                                        </label>

                                        <input
                                            id="first_name"
                                            name="first_name"
                                            type="text"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            maxLength={100}
                                            autoComplete="given-name"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                            placeholder="Enter your first name"
                                        />
                                    </div>

                                    {/* LAST NAME */}
                                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                                        <label
                                            htmlFor="last_name"
                                            className="text-sm text-gray-500 sm:text-right"
                                        >
                                            Last name
                                        </label>

                                        <input
                                            id="last_name"
                                            name="last_name"
                                            type="text"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            maxLength={100}
                                            autoComplete="family-name"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                            placeholder="Enter your last name"
                                        />
                                    </div>

                                    {/* PHONE */}
                                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                                        <label
                                            htmlFor="phone"
                                            className="text-sm text-gray-500 sm:text-right"
                                        >
                                            Phone number
                                        </label>

                                        <input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            maxLength={30}
                                            autoComplete="tel"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                            placeholder="Enter your phone number"
                                        />
                                    </div>

                                    {/* PROFILE IMAGE URL */}
                                    <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-5">
                                        <label
                                            htmlFor="profile_image"
                                            className="text-sm text-gray-500 sm:text-right"
                                        >
                                            Profile image URL
                                        </label>

                                        <input
                                            id="profile_image"
                                            name="profile_image"
                                            type="url"
                                            value={formData.profile_image}
                                            onChange={handleChange}
                                            maxLength={2048}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                            placeholder="https://example.com/image.jpg"
                                        />
                                    </div>

                                    {/* ERROR MESSAGE */}
                                    {error && (
                                        <div
                                            role="alert"
                                            className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:ml-35"
                                        >
                                            {error}
                                        </div>
                                    )}

                                    {/* SUCCESS MESSAGE */}
                                    {success && (
                                        <div
                                            role="status"
                                            className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700 sm:ml-35"
                                        >
                                            {success}
                                        </div>
                                    )}

                                    {/* SAVE BUTTON */}
                                    <div className="sm:ml-35">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="rounded-md bg-[#EE4D2D] px-7 py-2.5 text-sm font-medium text-white transition hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {saving
                                                ? "Saving..."
                                                : "Save Changes"}
                                        </button>
                                    </div>
                                </div>

                                {/* PROFILE IMAGE PREVIEW */}
                                <div className="flex flex-col items-center justify-center gap-4 border-t border-gray-100 p-6 md:border-l md:border-t-0">
                                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
                                        {formData.profile_image.trim() &&
                                        !imageError ? (
                                            <img
                                                src={formData.profile_image.trim()}
                                                alt="Profile preview"
                                                className="h-full w-full object-cover"
                                                onError={() => {
                                                    setImageError(true);
                                                }}
                                            />
                                        ) : (
                                            <span className="text-5xl text-gray-400">
                                                👤
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-center text-xs text-gray-500">
                                        Profile picture preview
                                    </p>

                                    <p className="text-center text-xs text-gray-400">
                                        Enter an image URL to preview your picture.
                                    </p>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default CustomerProfile;
