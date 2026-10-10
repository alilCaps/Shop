
import { Link } from "react-router-dom";

function CustomerSidebar({
    user,
    displayName,
    activeMenu,
    setActiveMenu,
    onLogout
}) {
    const menuItems = [
        { name: "Account overview", icon: "▦", path: "/customer/customerDashboard" },
        { name: "My profile", icon: "♙", path: "/customer/profile" },
        { name: "My orders", icon: "□", path: "/customer/orders" },
        { name: "Wishlist", icon: "♡", path: "/customer/wishlist" },
        { name: "Addresses", icon: "⌖", path: "/customer/addresses" },
        { name: "Payments", icon: "▤", path: "/customer/payments" }
    ];

    return (
        <aside className="bg-white rounded-lg shadow-sm h-fit overflow-hidden">
            {/* PROFILE */}
            <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden shrink-0">
                        {user?.profile_image ? (
                            <img
                                src={user.profile_image}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            "👤"
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
                        <span className="w-5 text-center text-base">
                            {item.icon}
                        </span>

                        <span>{item.name}</span>
                    </Link>
                ))}

                {/* LOGOUT */}
                <button
                    type="button"
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left text-gray-700 hover:bg-gray-50"
                >
                    <span className="w-5 text-center">↪</span>
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    );
}

export default CustomerSidebar;
