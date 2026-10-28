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
    UserIcon
} from "../../../components/icons";

function CustomerSidebar({
    user,
    displayName,
    activeMenu,
    setActiveMenu,
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

    return (
        <aside className="box-border w-full min-w-0 self-start overflow-hidden rounded-lg bg-white shadow-sm lg:w-48 lg:min-w-48 lg:max-w-48">
            {/* PROFILE */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden shrink-0">
                        {user?.profile_image ? (
                            <img
                                src={assetUrl(user.profile_image)}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <UserIcon width={22} height={22} className="text-gray-500" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                            {displayName}
                        </h3>

                        <p className="text-xs text-gray-500">
                            Customer account
                        </p>
                    </div>
                </div>
            </div>

            {/* MENU */}
            <nav className="p-2">
                {menuItems.map((item) => (
                    <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setActiveMenu(item.name)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition ${
                            activeMenu === item.name
                                ? "bg-[#fff1ed] text-[#EE4D2D]"
                                : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                        <item.icon width={18} height={18} className="shrink-0" />

                        <span>{item.name}</span>
                    </Link>
                ))}

                {/* LOGOUT */}
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left text-gray-700 hover:bg-gray-50"
                >
                    <LogoutIcon width={18} height={18} className="shrink-0" />
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    );
}

export default CustomerSidebar;
