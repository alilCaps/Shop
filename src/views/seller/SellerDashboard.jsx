import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { api } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/format";

export default function SellerDashboard() {
    const { user, shop } = useOutletContext();
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!shop) return;

        api(`/api/seller/${user.user_id}/dashboard`)
            .then(setData)
            .catch((err) => setError(err.message));
    }, [user.user_id, shop]);

    if (!shop) {
        return (
            <div className="rounded-lg bg-white p-10 text-center shadow-sm">
                <p className="text-4xl">🏬</p>
                <h1 className="mt-3 text-lg font-medium">Open your shop</h1>
                <p className="mt-1 text-sm text-gray-500">
                    Create your shop to start selling on the marketplace.
                </p>
                <Link
                    to="/seller/shop"
                    className="mt-5 inline-block rounded bg-[#EE4D2D] px-6 py-2 text-sm text-white hover:bg-[#d73211]"
                >
                    Create shop
                </Link>
            </div>
        );
    }

    const s = data?.stats;
    const cards = s
        ? [
              ["Revenue", formatCurrency(s.revenue)],
              ["To pay", s.to_pay],
              ["To ship", s.to_ship],
              ["Shipped", s.shipped],
              ["Total orders", s.total_orders],
              ["Products", s.total_products],
              ["Active products", s.active_products],
              ["Low stock", s.low_stock]
          ]
        : [];

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-medium">Dashboard</h1>

            {shop.status === "PENDING" && (
                <p className="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    Your shop is waiting for admin approval. You can add products once it is active.
                </p>
            )}
            {shop.status !== "PENDING" && shop.status !== "ACTIVE" && (
                <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Your shop is {shop.status.toLowerCase()}. Contact support for help.
                </p>
            )}
            {error && (
                <p role="alert" className="rounded bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {!data && !error ? (
                <p className="py-10 text-center text-sm text-gray-500">Loading...</p>
            ) : (
                data && (
                    <>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            {cards.map(([label, value]) => (
                                <div key={label} className="rounded-lg bg-white p-4 shadow-sm">
                                    <p className="text-xs text-gray-500">{label}</p>
                                    <p className="mt-1 text-xl font-semibold text-[#EE4D2D]">
                                        {value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <section className="rounded-lg bg-white shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-100 p-4">
                                <h2 className="font-medium">Recent orders</h2>
                                <Link to="/seller/orders" className="text-xs text-[#EE4D2D] hover:underline">
                                    View all
                                </Link>
                            </div>

                            {data.recent_orders.length === 0 ? (
                                <p className="py-10 text-center text-sm text-gray-500">No orders yet.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-xs text-gray-500">
                                            <tr>
                                                <th className="px-4 py-2">Order</th>
                                                <th className="px-4 py-2">Customer</th>
                                                <th className="px-4 py-2">Date</th>
                                                <th className="px-4 py-2">Total</th>
                                                <th className="px-4 py-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {data.recent_orders.map((order) => (
                                                <tr key={order.order_id}>
                                                    <td className="px-4 py-3">{order.order_number}</td>
                                                    <td className="px-4 py-3">{order.customer_name || order.username}</td>
                                                    <td className="px-4 py-3">{formatDate(order.placed_at)}</td>
                                                    <td className="px-4 py-3">{formatCurrency(order.shop_total)}</td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={order.status} orderLabels />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )
            )}
        </div>
    );
}
