
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
      { key: "first_name", label: "First name", required: true, maxLength: 100 },
      { key: "last_name", label: "Last name", required: true, maxLength: 100 },
      { key: "phone", label: "Phone", maxLength: 30 },
      { key: "status", label: "Status", type: "select", required: true, options: ["ACTIVE","INACTIVE","SUSPENDED","BANNED"] },
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
      { key: "first_name", label: "First name", required: true, maxLength: 100 },
      { key: "last_name", label: "Last name", required: true, maxLength: 100 },
      { key: "phone", label: "Phone", maxLength: 30 },
      { key: "status", label: "Status", type: "select", required: true, options: ["ACTIVE","INACTIVE","SUSPENDED","BANNED"] },
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
      { key: "shop_name", label: "Shop name", required: true, maxLength: 150 },
      { key: "shop_description", label: "Description", type: "textarea" },
      { key: "contact_email", label: "Contact email", type: "email" },
      { key: "contact_phone", label: "Contact phone", maxLength: 30 },
      { key: "shop_address", label: "Address", type: "textarea" },
      { key: "status", label: "Status", type: "select", required: true, options: ["PENDING", "ACTIVE", "SUSPENDED", "CLOSED"] },
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
      { key: "category_name", label: "Category name", required: true, maxLength: 100 },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "parent_category_id",
        label: "Parent category",
        type: "select",
        numeric: true,
        emptyLabel: "None (top-level)",
        optionsFrom: { resource: "categories", valueKey: "category_id", labelKey: "category_name" },
      },
    ],
    editableFields: [
      { key: "category_name", label: "Category name", required: true, maxLength: 100 },
      { key: "description", label: "Description", type: "textarea" },
      {
        key: "parent_category_id",
        label: "Parent category",
        type: "select",
        numeric: true,
        emptyLabel: "None (top-level)",
        optionsFrom: { resource: "categories", valueKey: "category_id", labelKey: "category_name" },
      },
      { key: "status", label: "Status", type: "select", required: true, options: ["ACTIVE", "INACTIVE"] },
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
      { key: "product_name", label: "Product name", required: true, maxLength: 200 },
      { key: "brand", label: "Brand", maxLength: 100 },
      { key: "description", label: "Description", type: "textarea" },
      { key: "price", label: "Price", type: "number", min: 0, step: "0.01", required: true, apiKey: "base_price" },
      {
        key: "category_id",
        label: "Category",
        type: "select",
        numeric: true,
        required: true,
        optionsFrom: { resource: "categories", valueKey: "category_id", labelKey: "category_name" },
      },
      { key: "status", label: "Status", type: "select", required: true, options: ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "INACTIVE", "BANNED"] },
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
      {
        key: "status",
        label: "Order status",
        type: "select",
        required: true,
        hint: "Stock, payment and shipment records are kept in sync automatically.",
        options: ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REFUNDED"],
      },
    ],
  },

  transactions: {
    resource: "transactions",
    idKey: "payment_id",
    title: "Transactions",
    singularLabel: "Transaction",
    description: "Review available payment and transaction records.",
    showStatusFilter: true,
    columns: [
      { key: "payment_id", label: "Payment ID" },
      { key: "order_number", label: "Order" },
      { key: "customer_name", label: "Customer" },
      { key: "amount", label: "Amount" },
      { key: "payment_method", label: "Payment Method" },
      { key: "status", label: "Status", type: "status" },
    ],
    editableFields: [
      { key: "status", label: "Payment status", type: "select", required: true, options: ["PENDING", "PROCESSING", "PAID", "FAILED", "REFUNDED"] },
      { key: "payment_method", label: "Payment method", type: "select", required: true, options: ["CASH_ON_DELIVERY", "GCASH", "MAYA", "BANK_TRANSFER", "CREDIT_CARD", "DEBIT_CARD", "OTHER"] },
      { key: "transaction_reference", label: "Transaction reference", maxLength: 100 },
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
      { key: "status", label: "Visibility", type: "select", required: true, options: ["VISIBLE", "HIDDEN", "REMOVED"] },
    ],
  },

  returns: {
    resource: "returns",
    idKey: "return_id",
    title: "Returns & Refunds",
    singularLabel: "Return",
    description: "Customers can request returns within 3 days of delivery.",
    showStatusFilter: false,
    columns: [
      { key: "return_id", label: "ID" },
      { key: "order_number", label: "Order" },
      { key: "customer_name", label: "Customer" },
      { key: "shop_name", label: "Shop" },
      { key: "return_type", label: "Type" },
      { key: "refund_amount", label: "Refund" },
      { key: "status", label: "Status", type: "status" },
      { key: "requested_at", label: "Requested" },
    ],
    editableFields: [
      {
        key: "status",
        label: "Move request to",
        type: "select",
        required: true,
        hint: "Only valid next steps are listed.",
        options: (row) => row?.allowed_statuses || [],
      },
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
    editableFields: [
      { key: "is_read", label: "Read", type: "boolean" },
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
      { key: "setting_value", label: "Setting value", required: true, maxLength: 500 },
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
export const AdminReturns = createPage(pageConfigs.returns);
export const AdminNotifications = createPage(pageConfigs.notifications);
export const AdminActivityLogs = createPage(pageConfigs["activity-logs"]);
export const AdminSettings = createPage(pageConfigs.settings);
export const AdminProfile = createPage(pageConfigs.profile);