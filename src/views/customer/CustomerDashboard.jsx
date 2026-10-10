import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerSidebar from "./components/CustomerSidebar";

function CustomerDashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeMenu, setActiveMenu] = useState("Account overview");

    const [stats, setStats] = useState({
        to_receive: 0,
        to_review: 0,
        total_orders: 0
    });

    const [shippedOrder, setShippedOrder] = useState(null);
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            const storedUser =
                localStorage.getItem("user") ||
                sessionStorage.getItem("user");

            if (!storedUser) {
                navigate("/login");
                return;
            }

            let loggedInUser;

            try {
                loggedInUser = JSON.parse(storedUser);
            } catch (parseError) {
                console.error("Invalid user data:", parseError);

                localStorage.removeItem("user");
                sessionStorage.removeItem("user");

                navigate("/login");
                return;
            }

            if (!loggedInUser?.user_id) {
                console.error("No user ID found.");

                localStorage.removeItem("user");
                sessionStorage.removeItem("user");

                navigate("/login");
                return;
            }

            const userId = loggedInUser.user_id;

            try {
                const userResponse = await fetch(
                    `http://localhost:5000/users/${userId}`
                );

                if (!userResponse.ok) {
                    throw new Error(
                        "Unable to retrieve your account information."
                    );
                }

                const userData = await userResponse.json();

                if (!userData.user) {
                    throw new Error(
                        "User information was not returned by the server."
                    );
                }

                if (cancelled) return;

                setUser(userData.user);

                const requests = await Promise.allSettled([
                    fetch(
                        `http://localhost:5000/api/customer/${userId}/dashboard-stats`
                    ),
                    fetch(
                        `http://localhost:5000/api/customer/${userId}/orders/on-the-way`
                    ),
                    fetch(
                        `http://localhost:5000/api/customer/${userId}/orders`
                    )
                ]);

                if (cancelled) return;

                // Dashboard statistics
                const statsResult = requests[0];

                if (
                    statsResult.status === "fulfilled" &&
                    statsResult.value.ok
                ) {
                    const data = await statsResult.value.json();
                    const values = data.stats || data;

                    setStats({
                        to_receive: Number(values.to_receive ?? 0),
                        to_review: Number(values.to_review ?? 0),
                        total_orders: Number(values.total_orders ?? 0)
                    });
                } else {
                    console.error(
                        "Could not load dashboard statistics. Check server.js."
                    );
                }

                // Order on the way
                const shippedResult = requests[1];

                if (
                    shippedResult.status === "fulfilled" &&
                    shippedResult.value.ok
                ) {
                    const data = await shippedResult.value.json();
                    setShippedOrder(data.order ?? null);
                } else {
                    console.error(
                        "Could not load shipped orders. Check server.js."
                    );
                }

                // Recent orders
                const ordersResult = requests[2];

                if (
                    ordersResult.status === "fulfilled" &&
                    ordersResult.value.ok
                ) {
                    const data = await ordersResult.value.json();

                    setRecentOrders(
                        Array.isArray(data.orders) ? data.orders : []
                    );
                } else {
                    console.error(
                        "Could not load recent orders. Check server.js."
                    );
                }
            } catch (fetchError) {
                console.error("Dashboard error:", fetchError);

                if (!cancelled) {
                    setError(
                        "Unable to load your account information. Please check your server and try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    const menuItems = [
        { name: "Account overview", icon: "▦" },
        { name: "My profile", icon: "♙" },
        { name: "My orders", icon: "□" },
        { name: "Wishlist", icon: "♡" },
        { name: "Addresses", icon: "⌖" },
        { name: "Payments", icon: "▤" }
    ];

    const dashboardStats = [
        {
            number: stats.to_receive,
            label: "To Receive",
            icon: "□"
        },
        {
            number: stats.to_review,
            label: "To Review",
            icon: "☆"
        },
        {
            number: stats.total_orders,
            label: "Total Orders",
            icon: "▤"
        }
    ];

    const firstName =
        typeof user?.first_name === "string" &&
        user.first_name.trim() !== ""
            ? user.first_name.trim()
            : typeof user?.username === "string" &&
              user.username.trim() !== ""
                ? user.username.trim()
                : "Customer";

    const lastName =
        typeof user?.last_name === "string"
            ? user.last_name.trim()
            : "";

    const displayName = `${firstName} ${lastName}`.trim();

    const formatDate = (value) => {
        if (!value) return "Date unavailable";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    const formatAmount = (amount) => {
        const value = Number(amount);

        if (!Number.isFinite(value)) {
            return "₱0.00";
        }

        return value.toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP"
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-[#EE4D2D] text-2xl font-semibold">
                        Shopee
                    </div>
                    <p className="text-gray-500 text-sm mt-2">
                        Loading your account...
                    </p>
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md w-full">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Unable to load account
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        {error || "User information could not be found."}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-5 bg-[#EE4D2D] text-white px-6 py-2 rounded hover:bg-[#d73211] transition"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f5f5] text-gray-700">
            {/* TOP BAR */}
            <div className="bg-[#EE4D2D] text-white text-xs">
                <div className="max-w-300 mx-auto min-h-7.5 flex items-center justify-between px-4 gap-3">
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

            {/* HEADER */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-300 mx-auto min-h-17.5 flex items-center gap-7 px-4 py-3">
                    <Link
                        to="/"
                        className="flex items-center gap-2 shrink-0"
                    >
                        <div className="w-9 h-9 rounded-lg bg-[#EE4D2D] text-white flex items-center justify-center text-xl">
                            🛍
                        </div>

                        <span className="text-2xl font-semibold text-[#EE4D2D]">
                            Shopee
                        </span>
                    </Link>

                    <div className="flex-1 max-w-162.5">
                        <div className="h-10 bg-gray-100 rounded-md flex items-center overflow-hidden">
                            <input
                                type="text"
                                placeholder="Search for products, brands and shops"
                                className="flex-1 min-w-0 bg-transparent px-4 text-sm outline-none text-gray-700 placeholder-gray-400"
                            />

                            <button
                                type="button"
                                aria-label="Search"
                                className="w-12 h-8 mr-1 rounded-md bg-[#EE4D2D] text-white hover:bg-[#d73211]"
                            >
                                🔍
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:flex items-center gap-6 text-xs text-gray-600">
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
                    </div>
                </div>
            </header>

            {/* DASHBOARD */}
            <main className="max-w-300 mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[192px_1fr] gap-5">
                    {/* SIDEBAR */}
                    <CustomerSidebar
                        user={user}
                        displayName={displayName}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                        onLogout={handleLogout}
                    />

                    {/* MAIN CONTENT */}
                    <section className="min-w-0">
                        {/* WELCOME BANNER */}
                        <div className="bg-[#F4512B] rounded-lg px-6 py-5 text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h1 className="text-2xl font-semibold">
                                    Welcome, {firstName} 👋
                                </h1>

                                <p className="text-sm mt-2 text-orange-50">
                                    Here's an overview of your account and orders.
                                </p>
                            </div>

                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl opacity-80">
                                🛍️
                            </div>
                        </div>

                        {/* STATISTICS */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                            {dashboardStats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#fff1ed] text-[#EE4D2D] flex items-center justify-center text-lg shrink-0">
                                        {stat.icon}
                                    </div>

                                    <div>
                                        <p className="text-xl font-semibold text-gray-800">
                                            {stat.number}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {stat.label}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ORDER ON THE WAY */}
                        <div className="bg-white rounded-lg shadow-sm mt-4 p-5">
                            <h2 className="font-semibold text-base text-gray-800">
                                Order on the way
                            </h2>

                            {shippedOrder ? (
                                <div className="mt-4 border-t border-gray-100 pt-4">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                Order {shippedOrder.order_number}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Placed {formatDate(shippedOrder.placed_at)}
                                            </p>
                                        </div>

                                        <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full">
                                            {shippedOrder.status || "SHIPPED"}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                                        <div>
                                            <p className="text-xs text-gray-500">
                                                Order total
                                            </p>
                                            <p className="text-lg font-semibold text-[#EE4D2D]">
                                                {formatAmount(shippedOrder.total_amount)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setActiveMenu("My orders")}
                                            className="border border-[#EE4D2D] text-[#EE4D2D] px-4 py-2 rounded-md text-sm hover:bg-[#fff1ed]"
                                        >
                                            View order
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">📦</div>
                                    <p className="text-sm text-gray-600">
                                        No orders on the way.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Shipped orders will appear here.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* RECENT ORDERS */}
                        <div className="bg-white rounded-lg shadow-sm mt-4 p-5">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="font-semibold text-base text-gray-800">
                                    Recent orders
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setActiveMenu("My orders")}
                                    className="text-xs text-[#EE4D2D] hover:underline"
                                >
                                    View all
                                </button>
                            </div>

                            {recentOrders.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {recentOrders.map((order) => (
                                        <div
                                            key={order.order_id}
                                            className="py-4 first:pt-0 last:pb-0"
                                        >
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        Order {order.order_number}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDate(order.placed_at)}
                                                    </p>
                                                </div>

                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        {formatAmount(order.total_amount)}
                                                    </p>
                                                    <span className="text-xs text-gray-500">
                                                        {order.status || "Status unavailable"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-3">🛒</div>
                                    <p className="text-sm text-gray-600">
                                        You haven't placed any orders yet.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Your orders will appear here after checkout.
                                    </p>

                                    <Link
                                        to="/"
                                        className="inline-block mt-4 bg-[#EE4D2D] text-white px-5 py-2 rounded-md text-sm hover:bg-[#d73211]"
                                    >
                                        Start shopping
                                    </Link>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

export default CustomerDashboard;
