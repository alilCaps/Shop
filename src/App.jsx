
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./LandingPage.jsx";
import Login from "./Login.jsx";
import Signup from "./SignUp.jsx";

import ProductSearch from "./views/store/ProductSearch.jsx";
import ProductDetail from "./views/store/ProductDetail.jsx";
import Cart from "./views/store/Cart.jsx";
import Checkout from "./views/store/Checkout.jsx";

import SellerLayout from "./components/seller/SellerLayout.jsx";
import SellerDashboard from "./views/seller/SellerDashboard.jsx";
import SellerShop from "./views/seller/SellerShop.jsx";
import SellerProducts from "./views/seller/SellerProducts.jsx";
import SellerOrders from "./views/seller/SellerOrders.jsx";
import SellerNotifications from "./views/seller/SellerNotifications.jsx";

import CustomerDashboard from "./views/customer/CustomerDashboard.jsx";
import CustomerProfile from "./views/customer/CustomerProfile.jsx";
import MyOrders from "./views/customer/CustomerOrders.jsx";
import CustomerWishlist from "./views/customer/CustomerWishlist.jsx";
import CustomerAddresses from "./views/customer/CustomerAddresses.jsx";
import CustomerPayments from "./views/customer/CustomerPayments.jsx";
import CustomerNotifications from "./views/customer/CustomerNotifications.jsx";

import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboard from "./views/admin/AdminDashboard.jsx";

import {
  AdminUsers,
  AdminSellers,
  AdminShops,
  AdminCategories,
  AdminProducts,
  AdminOrders,
  AdminTransactions,
  AdminReviews,
  AdminReports,
  AdminNotifications,
  AdminActivityLogs,
  AdminSettings,
  AdminProfile,
} from "./views/admin/AdminPages.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Storefront */}
      <Route path="/search" element={<ProductSearch />} />
      <Route path="/product/:productId" element={<ProductDetail />} />

      {/* Seller Centre */}
      <Route path="/seller" element={<SellerLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<SellerDashboard />} />
        <Route path="shop" element={<SellerShop />} />
        <Route path="products" element={<SellerProducts />} />
        <Route path="orders" element={<SellerOrders />} />
        <Route path="notifications" element={<SellerNotifications />} />
      </Route>
      <Route
        path="/views/seller/SellerDashboard"
        element={<Navigate to="/seller/dashboard" replace />}
      />

      {/* Customer */}
      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/customer/profile" element={<CustomerProfile />} />
      <Route path="/customer/orders" element={<MyOrders />} />
      <Route path="/customer/wishlist" element={<CustomerWishlist />} />
      <Route path="/customer/addresses" element={<CustomerAddresses />} />
      <Route path="/customer/payments" element={<CustomerPayments />} />
      <Route path="/customer/notifications" element={<CustomerNotifications />} />
      <Route path="/customer/cart" element={<Cart />} />
      <Route path="/customer/checkout" element={<Checkout />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="sellers" element={<AdminSellers />} />
        <Route path="shops" element={<AdminShops />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="notifications" element={<AdminNotifications />} />
        <Route path="activity-logs" element={<AdminActivityLogs />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* Compatibility with the previous admin URL */}
      <Route
        path="/views/admin/AdminDashboard"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      {/* Legacy customer URLs */}
      <Route
        path="/views/customer/CustomerDashboard"
        element={<Navigate to="/customer/dashboard" replace />}
      />
      <Route
        path="/customer/customerDashboard"
        element={<Navigate to="/customer/dashboard" replace />}
      />
      <Route
        path="/customer/CustomerProfile"
        element={<Navigate to="/customer/profile" replace />}
      />
      <Route
        path="/views/customer/CustomerProfile"
        element={<Navigate to="/customer/profile" replace />}
      />
      <Route
        path="/views/customer/CustomerOrder"
        element={<Navigate to="/customer/orders" replace />}
      />
      <Route
        path="/customer/CustomerOrder"
        element={<Navigate to="/customer/orders" replace />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
