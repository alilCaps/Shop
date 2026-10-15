
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../assets/logo/orange_logo.png";
import CustomerSidebar from "./components/CustomerSidebar";

const API_URL = "http://localhost:5000";

const ORDER_TABS = [
  { label: "All", value: "ALL" },
  { label: "To Pay", value: "PENDING_PAYMENT" },
  { label: "To Ship", value: "TO_SHIP" },
  { label: "To Receive", value: "SHIPPED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const STATUS_LABELS = {
  PENDING_PAYMENT: "To Pay",
  PAID: "To Ship",
  PROCESSING: "To Ship",
  SHIPPED: "To Receive",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const STATUS_COLORS = {
  PENDING_PAYMENT: "text-orange-600",
  PAID: "text-blue-600",
  PROCESSING: "text-blue-600",
  SHIPPED: "text-blue-600",
  DELIVERED: "text-green-600",
  COMPLETED: "text-green-600",
  CANCELLED: "text-red-600",
  REFUNDED: "text-purple-600",
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number(amount) || 0);
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function MyOrders() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeMenu, setActiveMenu] = useState("My orders");
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const storedUser =
          localStorage.getItem("user") ||
          sessionStorage.getItem("user");

        if (!storedUser) {
          navigate("/login", { replace: true });
          return;
        }

        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser?.user_id) {
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          navigate("/login", { replace: true });
          return;
        }

        if (isMounted) {
          setUser(parsedUser);
        }

        const response = await fetch(
          `${API_URL}/users/${parsedUser.user_id}`
        );

        if (!response.ok) {
          throw new Error("Unable to verify your customer account.");
        }

        const userData = await response.json();
        const verifiedUser = userData.user || userData;

        if (
          !verifiedUser ||
          String(verifiedUser.user_id) !== String(parsedUser.user_id)
        ) {
          throw new Error("Unable to verify your customer account.");
        }

        if (isMounted) {
          setUser(verifiedUser);
        }

        /*
          Frontend only for now:
          Order fetching will be connected after the backend route
          is confirmed. This prevents calling an endpoint that may
          not exist yet.
        */
        if (isMounted) {
          setOrders([]);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const status = String(order.status || "").toUpperCase();

      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "TO_SHIP" &&
          ["PAID", "PROCESSING"].includes(status)) ||
        status === activeTab;

      const matchesSearch =
        !searchTerm.trim() ||
        String(order.order_number || "")
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase()) ||
        (order.items || []).some((item) =>
          String(item.product_name || "")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
        );

      return matchesTab && matchesSearch;
    });
  }, [orders, activeTab, searchTerm]);

  const displayName = [
    user?.first_name,
    user?.last_name,
  ]
    .filter(Boolean)
    .join(" ") || user?.username || "Customer";

  function handleLogout() {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-gray-800">
      {/* Top Navigation */}
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
            <span>{displayName}</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex min-h-17.5 max-w-300 items-center gap-7 px-4 py-3">
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

          <div className="min-w-0 max-w-162.5 flex-1">
            <div className="flex h-10 items-center overflow-hidden rounded-md bg-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by order number or product"
                aria-label="Search orders"
                className="min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-gray-400"
              />

              <button
                type="button"
                aria-label="Search orders"
                className="mr-1 h-8 w-12 shrink-0 rounded-md bg-[#EE4D2D] text-white"
              >
                🔍
              </button>
            </div>
          </div>

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
            <Link
              to="/customer/wishlist"
              aria-label="Wishlist"
              className="text-xl"
            >
              ♡
            </Link>
            <Link
              to="/customer/cart"
              aria-label="Shopping cart"
              className="text-xl"
            >
              🛒
            </Link>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="mx-auto max-w-300 px-4 py-6">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[192px_minmax(0,1fr)]">
          <CustomerSidebar
            user={user}
            displayName={displayName}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            onLogout={handleLogout}
          />

          <section className="min-w-0 overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h1 className="text-xl font-medium">My Orders</h1>
              <p className="mt-1 text-sm text-gray-500">
                View and track your purchases.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="grid grid-cols-3 border-b border-gray-200 sm:grid-cols-6">
              {ORDER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={`border-b-2 px-2 py-4 text-sm transition-colors ${
                    activeTab === tab.value
                      ? "border-[#EE4D2D] text-[#EE4D2D]"
                      : "border-transparent text-gray-600 hover:text-[#EE4D2D]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Orders */}
            <div className="p-5">
              {loading ? (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-gray-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EE4D2D]" />
                  <p className="text-sm">Loading your orders...</p>
                </div>
              ) : error ? (
                <div className="flex min-h-60 flex-col items-center justify-center gap-3 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="rounded-md bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]"
                  >
                    Try Again
                  </button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
                    🛍️
                  </div>

                  <h2 className="text-base font-medium text-gray-700">
                    {searchTerm
                      ? "No matching orders found"
                      : activeTab === "ALL"
                        ? "You haven't placed any orders yet"
                        : "No orders in this category"}
                  </h2>

                  <p className="mt-2 max-w-sm text-sm text-gray-500">
                    {searchTerm
                      ? "Try another order number or product name."
                      : "When you buy something, your orders will appear here."}
                  </p>

                  {searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="mt-5 rounded-md border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50"
                    >
                      Clear Search
                    </button>
                  ) : (
                    <Link
                      to="/"
                      className="mt-5 rounded-md bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]"
                    >
                      Start Shopping
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredOrders.map((order) => (
                    <article
                      key={order.order_id}
                      className="overflow-hidden rounded-md border border-gray-200"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium">
                            Order #{order.order_number}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Placed on {formatDate(order.placed_at)}
                          </p>
                        </div>

                        <span
                          className={`font-medium ${
                            STATUS_COLORS[order.status] ||
                            "text-gray-600"
                          }`}
                        >
                          {STATUS_LABELS[order.status] ||
                            order.status ||
                            "Unknown status"}
                        </span>
                      </div>

                      <div className="divide-y divide-gray-100 px-4">
                        {(order.items || []).map((item) => (
                          <div
                            key={item.order_item_id}
                            className="flex items-start gap-3 py-4"
                          >
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100 text-2xl">
                              📦
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="wrap-break-word text-sm font-medium">
                                {item.product_name}
                              </p>

                              {item.variant_name && (
                                <p className="mt-1 text-xs text-gray-500">
                                  Variation: {item.variant_name}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-gray-500">
                                Quantity: {item.quantity}
                              </p>
                            </div>

                            <p className="shrink-0 text-sm">
                              {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-orange-50/50 px-4 py-4">
                        <p className="text-xs text-gray-500">
                          {order.items?.length || 0} product line(s)
                        </p>

                        <p className="text-sm">
                          Order Total:{" "}
                          <span className="text-lg font-medium text-[#EE4D2D]">
                            {formatCurrency(order.total_amount)}
                          </span>
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default MyOrders;
