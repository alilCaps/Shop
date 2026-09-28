import { Routes, Route } from "react-router-dom";

import LandingPage from "./LandingPage.jsx";
import Login from "./Login.jsx";
import Signup from "./SignUp.jsx";

import AdminDashboard from "./views/admin/AdminDashboard.jsx";
import SellerDashboard from "./views/seller/SellerDashboard.jsx";
import CustomerDashboard from "./views/customer/CustomerDashboard.jsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/views/admin/AdminDashboard" element={<AdminDashboard />} />
            <Route path="/views/seller/SellerDashboard" element={<SellerDashboard />} />
            <Route path="/views/customer/CustomerDashboard" element={<CustomerDashboard />} />

        </Routes>
    );
}

export default App;
