import { useEffect } from "react";
import { Link } from "react-router-dom";
import { assetUrl } from "../../../services/api";
import {
    BellIcon,
    CreditCardIcon,
    GridIcon,
    HeartIcon,
    LogoutIcon,
    MapPinIcon,
    PackageIcon,
    RefreshIcon,
    StoreIcon,
    UserIcon,
    XIcon
} from "../../../components/icons";

function CustomerSidebar({
    user,
    displayName,
    activeMenu,
    open,
    onClose,
    onLogout
}) {
    const menuItems = [
        { name: "Shop", icon: StoreIcon, path: "/search" },
        { name: "Account overview", icon: GridIcon, path: "/customer/dashboard" },
        { name: "My profile", icon: UserIcon, path: "/customer/profile" },
        { name: "My orders", icon: PackageIcon, path: "/customer/orders" },
        { name: "Returns", icon: RefreshIcon, path: "/customer/returns" },
        { name: "Notifications", icon: BellIcon, path: "/customer/notifications" },
        { name: "Wishlist", icon: HeartIcon, path: "/customer/wishlist" },
        { name: "Addresses", icon: MapPinIcon, path: "/customer/addresses" },
        { name: "Payments", icon: CreditCardIcon, path: "/customer/payments" }
    ];

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => {
            if (event.key === "Escape") onClose();
        };

        document.addEventListener("keydown", onKey);

        return () => document.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-40 bg-black/40"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                aria-label="Account menu"
                aria-hidden={!open}
                className={`fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-200 ${
                    open ? "translate-x-0" : "-translate-x-full invisible"
                }`}
            >
                {/* PROFILE */}
                <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                        {user?.profile_image ? (
                            <img
                                src={assetUrl(user.profile_image)}
                                alt="Profile"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <UserIcon width={22} height={22} className="text-gray-500" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold">{displayName}</h3>
                        <p className="text-xs text-gray-500">Customer account</p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close menu"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                        <XIcon width={18} height={18} />
                    </button>
                </div>

                {/* MENU */}
                <nav className="flex-1 p-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={onClose}
                            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm transition ${
                                activeMenu === item.name
                                    ? "bg-[#fff1ed] text-[#EE4D2D]"
                                    : "text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            <item.icon width={18} height={18} className="shrink-0" />
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-gray-100 p-2">
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                        <LogoutIcon width={18} height={18} className="shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

export default CustomerSidebar;
