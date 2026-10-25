import CustomerLayout from "../../components/customer/CustomerLayout";
import NotificationList from "../../components/NotificationList";

export default function CustomerNotifications() {
    return (
        <CustomerLayout activeMenu="Notifications" title="Notifications">
            {() => <NotificationList ordersPath="/customer/orders" />}
        </CustomerLayout>
    );
}
