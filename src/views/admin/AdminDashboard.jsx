
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = "http://localhost:5000";

function getList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

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
  const [stats, setStats] = useState({
    users: 0,
    customers: 0,
    sellers: 0,
    products: 0,
    categories: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const endpoints = [
        { key: "users", url: `${API}/users` },
        { key: "products", url: `${API}/api/products` },
        { key: "categories", url: `${API}/api/categories` },
      ];

      const results = await Promise.all(
        endpoints.map(async ({ key, url }) => {
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(
              `Could not load ${key}. Server returned ${response.status}.`
            );
          }

          return { key, data: await response.json() };
        })
      );

      const data = Object.fromEntries(
        results.map(({ key, data }) => [key, data])
      );

      const users = getList(data.users, "users");
      const products = getList(data.products, "products");
      const categories = getList(data.categories, "categories");

      setStats({
        users: users.length,
        customers: users.filter(
          (user) => user.role_name?.toLowerCase() === "customer"
        ).length,
        sellers: users.filter(
          (user) => user.role_name?.toLowerCase() === "seller"
        ).length,
        products: products.length,
        categories: categories.length,
      });
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
      icon: "♙",
    },
    {
      title: "Manage Products",
      description: "Review products listed on the platform.",
      path: "/admin/products",
      icon: "□",
    },
    {
      title: "Manage Categories",
      description: "Organize the store's product categories.",
      path: "/admin/categories",
      icon: "▤",
    },
    {
      title: "Manage Orders",
      description: "Review customer orders.",
      path: "/admin/orders",
      icon: "▣",
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
          value={stats.users.toLocaleString()}
          icon="♙"
          description="All returned user records"
          loading={loading}
        />
        <StatCard
          title="Customers"
          value={stats.customers.toLocaleString()}
          icon="♧"
          description="Accounts with the Customer role"
          loading={loading}
        />
        <StatCard
          title="Sellers"
          value={stats.sellers.toLocaleString()}
          icon="⌂"
          description="Accounts with the Seller role"
          loading={loading}
        />
        <StatCard
          title="Products"
          value={stats.products.toLocaleString()}
          icon="□"
          description="Products returned by the API"
          loading={loading}
        />
        <StatCard
          title="Categories"
          value={stats.categories.toLocaleString()}
          icon="▤"
          description="Categories returned by the API"
          loading={loading}
        />
        <StatCard
          title="Orders & Revenue"
          value="Not connected"
          icon="₱"
          description="Requires an admin statistics API"
          loading={false}
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
              <span className="text-gray-400 group-hover:text-[#EE4D2D]">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-orange-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-800">Dashboard data status</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          User, product, and category counts come from your existing backend
          APIs. Order statistics, sales totals, and revenue are not displayed
          because the current backend does not provide a dedicated admin
          statistics endpoint for them yet.
        </p>
      </section>
    </div>
  );
}
