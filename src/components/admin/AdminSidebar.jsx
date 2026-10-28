
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "../Logo";
import {
  BellIcon,
  ChartIcon,
  ClipboardIcon,
  ClockIcon,
  GridIcon,
  LogoutIcon,
  PackageIcon,
  PesoIcon,
  RefreshIcon,
  SettingsIcon,
  StarIcon,
  StoreIcon,
  TagIcon,
  UserIcon,
  UsersIcon,
} from "../icons";

const menuGroups = [
  {
    title: "MAIN MENU",
    items: [
      { label: "Dashboard", path: "/admin/dashboard", icon: GridIcon },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Users", path: "/admin/users", icon: UsersIcon },
      { label: "Sellers", path: "/admin/sellers", icon: UserIcon },
      { label: "Shops", path: "/admin/shops", icon: StoreIcon },
      { label: "Categories", path: "/admin/categories", icon: TagIcon },
      { label: "Products", path: "/admin/products", icon: PackageIcon },
      { label: "Orders", path: "/admin/orders", icon: ClipboardIcon },
      { label: "Transactions", path: "/admin/transactions", icon: PesoIcon },
      { label: "Reviews", path: "/admin/reviews", icon: StarIcon },
      { label: "Returns", path: "/admin/returns", icon: RefreshIcon },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { label: "Reports", path: "/admin/reports", icon: ChartIcon },
      { label: "Notifications", path: "/admin/notifications", icon: BellIcon },
      { label: "Activity Logs", path: "/admin/activity-logs", icon: ClockIcon },
      { label: "Settings", path: "/admin/settings", icon: SettingsIcon },
      { label: "My Profile", path: "/admin/profile", icon: UserIcon },
    ],
  },
];

export default function AdminSidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col self-start bg-white text-gray-700 shadow-lg">
      <div className="flex h-20 shrink-0 items-center border-b border-gray-100 px-6">
        <Logo to="/admin/dashboard" className="w-28" label="ADMIN PANEL" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-2 px-3 text-xs font-semibold tracking-wider text-gray-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-orange-50 text-[#EE4D2D]"
                        : "text-gray-600 hover:bg-gray-50 hover:text-[#EE4D2D]"
                    }`
                  }
                >
                  <item.icon width={18} height={18} className="shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-100 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <LogoutIcon width={18} height={18} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
