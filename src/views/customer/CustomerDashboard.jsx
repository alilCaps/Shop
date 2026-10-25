import { Link } from "react-router-dom";
import CustomerLayout from "../../components/customer/CustomerLayout";
import StatusBadge from "../../components/StatusBadge";
import { ErrorNote, EmptyState, Spinner } from "../../components/Feedback";
import { useApi } from "../../hooks/useApi";
import { formatCurrency, formatDate } from "../../utils/format";

function Overview({ user }) {
    const base = `/api/customer/${user.user_id}`;
    const stats = useApi(`${base}/dashboard-stats`);
    const onTheWay = useApi(`${base}/orders/on-the-way`);
    const orders = useApi(`${base}/orders`);

    const firstName = user.first_name?.trim() || user.username || "there";
    const values = stats.data?.stats || stats.data || {};
    const recent = orders.data?.orders || [];
    const shipped = onTheWay.data?.order || null;

    const cards = [
        { label: "To Receive", value: values.to_receive, to: "/customer/orders?tab=SHIPPED", icon: "🚚" },
        { label: "To Review", value: values.to_review, to: "/customer/orders?tab=DELIVERED", icon: "☆" },
        { label: "Total Orders", value: values.total_orders, to: "/customer/orders", icon: "▤" }
    ];

    return (
        <div className="space-y-5 p-5">
            <div className="relative overflow-hidden rounded-lg bg-[#F4512B] px-6 py-5 text-white">
                <h2 className="text-2xl font-semibold">Welcome, {firstName} 👋</h2>
                <p className="mt-2 text-sm text-orange-50">
                    Here's an overview of your account and orders.
                </p>
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl opacity-80">
                    🛍️
                </span>
            </div>

            <ErrorNote message={stats.error || orders.error} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {cards.map((card) => (
                    <Link
                        key={card.label}
                        to={card.to}
                        className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 transition hover:border-orange-200 hover:shadow-sm"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff1ed] text-lg text-[#EE4D2D]">
                            {card.icon}
                        </span>
                        <span>
                            <span className="block text-xl font-semibold">
                                {stats.loading ? "…" : Number(card.value || 0)}
                            </span>
                            <span className="text-xs text-gray-500">{card.label}</span>
                        </span>
                    </Link>
                ))}
            </div>

            <section className="rounded-lg border border-gray-100 p-5">
                <h2 className="text-base font-semibold">Order on the way</h2>

                {onTheWay.loading ? (
                    <Spinner />
                ) : shipped ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <div>
                            <p className="text-sm font-medium">Order {shipped.order_number}</p>
                            <p className="mt-1 text-xs text-gray-400">
                                Placed {formatDate(shipped.placed_at)}
                            </p>
                        </div>
                        <p className="text-lg font-semibold text-[#EE4D2D]">
                            {formatCurrency(shipped.total_amount)}
                        </p>
                        <Link
                            to="/customer/orders?tab=SHIPPED"
                            className="rounded-md border border-[#EE4D2D] px-4 py-2 text-sm text-[#EE4D2D] hover:bg-[#fff1ed]"
                        >
                            View order
                        </Link>
                    </div>
                ) : (
                    <EmptyState title="No orders on the way." hint="Shipped orders will appear here." />
                )}
            </section>

            <section className="rounded-lg border border-gray-100 p-5">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-semibold">Recent orders</h2>
                    <Link to="/customer/orders" className="text-xs text-[#EE4D2D] hover:underline">
                        View all
                    </Link>
                </div>

                {orders.loading ? (
                    <Spinner />
                ) : recent.length === 0 ? (
                    <EmptyState title="You haven't placed any orders yet." hint="Your orders will appear here after checkout.">
                        <Link to="/search" className="rounded-md bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211]">
                            Start shopping
                        </Link>
                    </EmptyState>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {recent.map((order) => (
                            <li key={order.order_id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                                <div>
                                    <p className="text-sm font-medium">Order {order.order_number}</p>
                                    <p className="mt-1 text-xs text-gray-400">{formatDate(order.placed_at)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <StatusBadge status={order.status} orderLabels />
                                    <span className="text-sm font-semibold">
                                        {formatCurrency(order.total_amount)}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default function CustomerDashboard() {
    return (
        <CustomerLayout activeMenu="Account overview" title="Account overview">
            {(user) => <Overview user={user} />}
        </CustomerLayout>
    );
}
