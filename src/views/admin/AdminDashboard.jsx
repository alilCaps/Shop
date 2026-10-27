
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService.js";
import { formatCurrency } from "../../utils/format.js";
import { ArrowRight, ClipboardIcon, PackageIcon, PesoIcon, StoreIcon, TagIcon, UserIcon, UsersIcon } from "../../components/icons.jsx";

function StatCard({ title, value, icon, description, loading }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h3 className="mt-3 text-3xl font-bold text-gray-800">
            {loading ? "..." : value}
          </h3>
          <p className="mt-2 text-xs text-gray-400">{description}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-2xl text-[#EE4D2D]">
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminService.getOverview();
      setStats(result.data || {});
    } catch (err) {
      setError(
        err.message ||
          "Unable to load dashboard data. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const quickLinks = [
    {
      title: "Manage Users",
      description: "View customer and seller accounts.",
      path: "/admin/users",
      icon: <UsersIcon width={24} height={24} />,
    },
    {
      title: "Manage Products",
      description: "Review products listed on the platform.",
      path: "/admin/products",
      icon: <PackageIcon width={24} height={24} />,
    },
    {
      title: "Manage Categories",
      description: "Organize the store's product categories.",
      path: "/admin/categories",
      icon: <TagIcon width={24} height={24} />,
    },
    {
      title: "Manage Orders",
      description: "Review customer orders.",
      path: "/admin/orders",
      icon: <ClipboardIcon width={24} height={24} />,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your Shopee platform from one place.
          </p>
        </div>

        <button
          onClick={loadDashboard}
          disabled={loading}
          className="rounded-lg bg-[#EE4D2D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#d94325] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing..." : "↻ Refresh Data"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error}</p>
          <button
            onClick={loadDashboard}
            className="font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Users"
          value={Number(stats.users || 0).toLocaleString()}
          icon={<UsersIcon width={24} height={24} />}
          description="All registered accounts"
          loading={loading}
        />
        <StatCard
          title="Customers"
          value={Number(stats.customers || 0).toLocaleString()}
          icon={<UserIcon width={24} height={24} />}
          description="Accounts with the Customer role"
          loading={loading}
        />
        <StatCard
          title="Sellers"
          value={Number(stats.sellers || 0).toLocaleString()}
          icon={<StoreIcon width={24} height={24} />}
          description={`${Number(stats.pending_shops || 0)} shop(s) waiting for approval`}
          loading={loading}
        />
        <StatCard
          title="Products"
          value={Number(stats.products || 0).toLocaleString()}
          icon={<PackageIcon width={24} height={24} />}
          description={`${Number(stats.categories || 0)} categories`}
          loading={loading}
        />
        <StatCard
          title="Orders"
          value={Number(stats.orders || 0).toLocaleString()}
          icon={<ClipboardIcon width={24} height={24} />}
          description={`${Number(stats.to_ship || 0)} waiting to be shipped`}
          loading={loading}
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={<PesoIcon width={24} height={24} />}
          description="Paid, shipped and completed orders"
          loading={loading}
        />
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-800">
            Quick Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Open an admin section to manage your platform.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-2xl text-[#EE4D2D]">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-800 group-hover:text-[#EE4D2D]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {item.description}
                </p>
              </div>
              <ArrowRight width={18} height={18} className="text-gray-400 group-hover:text-[#EE4D2D]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
