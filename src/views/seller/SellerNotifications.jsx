import NotificationList from "../../components/NotificationList";

export default function SellerNotifications() {
    return (
        <div className="rounded-lg bg-white shadow-sm">
            <h1 className="border-b border-gray-100 p-5 text-xl font-medium">Notifications</h1>
            <NotificationList ordersPath="/seller/orders" />
        </div>
    );
}
