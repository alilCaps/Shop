import { Link } from "react-router-dom";
import CustomerLayout from "../../components/customer/CustomerLayout";
import StatusBadge from "../../components/StatusBadge";
import { EmptyState, ErrorNote, Spinner } from "../../components/Feedback";
import { useApi } from "../../hooks/useApi";
import { formatCurrency, formatDate, PAYMENT_METHOD_LABELS } from "../../utils/format";

function Payments({ user }) {
    const { data, loading, error, reload } = useApi(`/api/customer/${user.user_id}/payments`);
    const payments = data?.payments || [];

    const paid = payments
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum + Number(p.amount), 0);

    return (
        <div className="space-y-4 p-5">
            <ErrorNote message={error} onRetry={reload} />

            {loading ? (
                <Spinner />
            ) : payments.length === 0 ? (
                <EmptyState icon="💳" title="No payments yet." hint="Payments for your orders will be listed here." />
            ) : (
                <>
                    <p className="text-sm text-gray-600">
                        Total paid: <strong className="text-[#EE4D2D]">{formatCurrency(paid)}</strong>
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-150 text-left text-sm">
                            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="px-3 py-2">Order</th>
                                    <th className="px-3 py-2">Method</th>
                                    <th className="px-3 py-2">Reference</th>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                    <th className="px-3 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {payments.map((payment) => (
                                    <tr key={payment.payment_id}>
                                        <td className="px-3 py-3">
                                            <Link to="/customer/orders" className="text-[#EE4D2D] hover:underline">
                                                {payment.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-3 py-3">{PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}</td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{payment.transaction_reference || "—"}</td>
                                        <td className="px-3 py-3">{formatDate(payment.paid_at || payment.created_at)}</td>
                                        <td className="px-3 py-3 text-right">{formatCurrency(payment.amount)}</td>
                                        <td className="px-3 py-3"><StatusBadge status={payment.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

export default function CustomerPayments() {
    return (
        <CustomerLayout activeMenu="Payments" title="Payments" subtitle="Your payment history">
            {(user) => <Payments user={user} />}
        </CustomerLayout>
    );
}
