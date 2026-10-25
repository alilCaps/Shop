
import AdminResourcePage from "./AdminResourcePage.jsx";

const pageConfigs = {
  users: {
    resource: "users",
    idKey: "user_id",
    title: "User Management",
    singularLabel: "User",
    description: "View and manage customer and administrator accounts.",
    showStatusFilter: true,
    columns: [
      { key: "user_id", label: "ID" },
      { key: "full_name", label: "Full Name" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "role_name", label: "Role" },
      { key: "status", label: "Status", type: "status" },
    ],
    editableFields: [
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "status", label: "Status (Active or Inactive)" },
    ],
  },

  sellers: {
    resource: "sellers",
    idKey: "user_id",
    title: "Seller Management",
    singularLabel: "Seller",
    description: "Review seller accounts and account status.",
    showStatusFilter: true,
    columns: [
      { key: "user_id", label: "Seller ID" },
      { key: "full_name", label: "Seller Name" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "shop_name", label: "Shop" },
      { key: "status", label: "Status", type: "status" },
    ],
    editableFields: [
      { key: "status", label: "Status (Active or Inactive)" },
    ],
  },

  shops: {
    resource: "shops",
    idKey: "shop_id",
    title: "Shop Management",
    singularLabel: "Shop",
    description: "View shops registered by sellers.",
    showStatusFilter: true,
    columns: [
      { key: "shop_id", label: "Shop ID" },
      { key: "shop_name", label: "Shop Name" },
      { key: "seller_name", label: "Seller" },
      { key: "status", label: "Status", type: "status" },
    ],
    editableFields: [
      { key: "shop_name", label: "Shop name" },
      { key: "status", label: "Status" },
    ],
  },

  categories: {
    resource: "categories",
    idKey: "category_id",
    title: "Category Management",
    singularLabel: "Category",
    description: "Organize the categories used by products.",
    showStatusFilter: true,
    columns: [
      { key: "category_id", label: "ID" },
      { key: "category_name", label: "Category" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status", type: "status" },
    ],
    createFields: [
      { key: "category_name", label: "Category name", required: true },
      { key: "description", label: "Description" },
    ],
    editableFields: [
      { key: "category_name", label: "Category name" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
    ],
  },

  products: {
    resource: "products",
    idKey: "product_id",
    title: "Product Management",
    singularLabel: "Product",
    description: "Review products listed on the marketplace.",
    showStatusFilter: true,
    columns: [
      { key: "product_id", label: "Product ID" },
      { key: "product_name", label: "Product Name" },
      { key: "shop_name", label: "Shop" },
      { key: "price", label: "Price" },
      { key: "status", label: "Status", type: "status" },
    ],
    editableFields: [
      { key: "status", label: "Status" },
    ],
  },

  orders: {
    resource: "orders",
    idKey: "order_id",
    title: "Order Management",
    singularLabel: "Order",
    description: "Monitor marketplace orders and their progress.",
    showStatusFilter: true,
    columns: [
      { key: "order_number", label: "Order Number" },
      { key: "customer_name", label: "Customer" },
      { key: "item_count", label: "Items" },
      { key: "total_amount", label: "Total Amount" },
      { key: "status", label: "Order Status", type: "status" },
      { key: "placed_at", label: "Date Ordered" },
    ],
    editableFields: [
      { key: "status", label: "Order status (use a valid order status)" },
    ],
  },

  transactions: {
    resource: "transactions",
    idKey: "transaction_id",
    title: "Transactions",
    singularLabel: "Transaction",
    description: "Review available payment and transaction records.",
    showStatusFilter: true,
    columns: [
      { key: "transaction_id", label: "Transaction ID" },
      { key: "order_id", label: "Order ID" },
      { key: "amount", label: "Amount" },
      { key: "payment_method", label: "Payment Method" },
      { key: "status", label: "Status", type: "status" },
    ],
  },

  reviews: {
    resource: "reviews",
    idKey: "review_id",
    title: "Review Management",
    singularLabel: "Review",
    description: "Review customer feedback and moderate reviews when supported.",
    showStatusFilter: true,
    columns: [
      { key: "review_id", label: "Review ID" },
      { key: "customer_name", label: "Customer" },
      { key: "product_name", label: "Product" },
      { key: "rating", label: "Rating" },
      { key: "review_text", label: "Review" },
      { key: "status", label: "Status", type: "status" },
    ],
    editableFields: [
    {
      key: "status", label: "Status (VISIBLE, HIDDEN, or REMOVED)",
    },
    ],  
  },

  reports: {
    resource: "reports",
    idKey: "report_id",
    title: "Reports",
    singularLabel: "Report",
    description: "Review summaries generated from available marketplace data.",
    columns: [
      { key: "report_name", label: "Report" },
      { key: "total_records", label: "Records" },
      { key: "generated_at", label: "Generated At" },
    ],
  },

  notifications: {
    resource: "notifications",
    idKey: "notification_id",
    title: "Notifications",
    singularLabel: "Notification",
    description: "Review system notifications available to administrators.",
    showStatusFilter: true,
    columns: [
      { key: "notification_id", label: "ID" },
      { key: "user_name", label: "User" },
      { key: "title", label: "Title" },
      { key: "notification_type", label: "Type" },
      { key: "is_read", label: "Read" },
      { key: "created_at", label: "Created At" },
    ],
  },

  "activity-logs": {
    resource: "activity-logs",
    idKey: "audit_id",
    title: "Activity Logs",
    singularLabel: "Activity Log",
    description: "Review recorded administrative and system activities.",
    columns: [
      { key: "audit_id", label: "Audit ID" },
      { key: "user_name", label: "User" },
      { key: "action", label: "Action" },
      { key: "table_name", label: "Table" },
      { key: "record_id", label: "Record ID" },
      { key: "created_at", label: "Date" },
    ],
  },

  settings: {
    resource: "settings",
    idKey: "setting_id",
    title: "System Settings",
    singularLabel: "Setting",
    description: "View and manage supported system configuration options.",
    columns: [
      { key: "setting_id", label: "ID" },
      { key: "setting_name", label: "Setting" },
      { key: "setting_value", label: "Value" },
      { key: "updated_at", label: "Last Updated" },
    ],
    editableFields: [
      { key: "setting_value", label: "Setting value" },
    ],
  },

  profile: {
    resource: "profile",
    idKey: "user_id",
    title: "Admin Profile",
    singularLabel: "Profile",
    description: "View and update the administrator's account information.",
    columns: [
      { key: "user_id", label: "User ID" },
      { key: "full_name", label: "Full Name" },
      { key: "username", label: "Username" },
      { key: "email", label: "Email" },
      { key: "role_name", label: "Role" },
    ],
    editableFields: [
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "email", label: "Email" },
    ],
  },
};

function createPage(config) {
  return function AdminPage() {
    return <AdminResourcePage config={config} />;
  };
}

export const AdminUsers = createPage(pageConfigs.users);
export const AdminSellers = createPage(pageConfigs.sellers);
export const AdminShops = createPage(pageConfigs.shops);
export const AdminCategories = createPage(pageConfigs.categories);
export const AdminProducts = createPage(pageConfigs.products);
export const AdminOrders = createPage(pageConfigs.orders);
export const AdminTransactions = createPage(pageConfigs.transactions);
export const AdminReviews = createPage(pageConfigs.reviews);
export const AdminReports = createPage(pageConfigs.reports);
export const AdminNotifications = createPage(pageConfigs.notifications);
export const AdminActivityLogs = createPage(pageConfigs["activity-logs"]);
export const AdminSettings = createPage(pageConfigs.settings);
export const AdminProfile = createPage(pageConfigs.profile);