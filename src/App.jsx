
import { Routes, Route, Navigate } from "react-router-dom";

import LandingPage from "./LandingPage.jsx";
import Login from "./Login.jsx";
import Signup from "./SignUp.jsx";

import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import SellerDashboard from "./views/seller/SellerDashboard.jsx";

import CustomerDashboard from "./views/customer/CustomerDashboard.jsx";
import CustomerProfile from "./views/customer/CustomerProfile.jsx";
import MyOrders from "./views/customer/CutomerOrder.jsx";

function App() {
    return (
        <Routes>
            {/* General pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Admin */}
            <Route path="/views/admin/AdminDashboard" element={<AdminDashboard />} />

            {/* Seller */}
            <Route path="/views/seller/SellerDashboard" element={<SellerDashboard />} />

            {/* Customer */}
            <Route path="/customer/dashboard" element={<CustomerDashboard />} />
            <Route path="/customer/profile" element={<CustomerProfile />} />
            <Route path="/customer/orders" element={<MyOrders />} />

            {/* Redirect old customer URLs */}
            <Route path="/views/customer/CustomerDashboard" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/customer/customerDashboard" element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="/customer/CustomerProfile" element={<Navigate to="/customer/profile" replace />} />
            <Route path="/views/customer/CustomerProfile" element={<Navigate to="/customer/profile" replace />} />
            <Route path="/views/customer/CustomerOrder" element={<Navigate to="/customer/orders" replace />} />
            <Route path="/customer/CustomerOrder" element={<Navigate to="/customer/orders" replace />} />

            {/* Unknown paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
