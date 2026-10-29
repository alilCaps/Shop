
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { MenuIcon } from "../icons";

export default function AdminLayout() {
  const location = useLocation();
  const [user, setUser] = useState(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let savedUser = null;

    try {
      const stored =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

      savedUser = stored ? JSON.parse(stored) : null;
    } catch {
      savedUser = null;
    }

    setUser(savedUser);
  }, []);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading admin panel...</p>
      </div>
    );
  }

  if (!user || user.role_name?.toLowerCase() !== "admin") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    "Administrator";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-3 sm:px-6 lg:px-8 lg:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 md:hidden"
            >
              <MenuIcon width={20} height={20} />
            </button>
            <div className="min-w-0">
            <p className="text-sm text-gray-500">Shopee / Administration</p>
            <h2 className="mt-1 text-lg font-semibold text-gray-800">
              Admin Panel
            </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-[#EE4D2D]">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {displayName}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
