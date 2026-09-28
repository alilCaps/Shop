import logo from "./assets/logo/orange_logo.png";
import fb_icon from "./assets/icons/facebook_icon.png";
import g_icon from "./assets/icons/google_icon.png";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Login() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            console.log("SERVER RESPONSE:", data);
            console.log("ROLE:", data.user?.role_name);

            if (!response.ok) {
                setError(data.message || "Login failed.");
                return;
            }

            if (!data.user) {
                setError("User information was not returned by the server.");
                return;
            }

            if (rememberMe) {
                localStorage.setItem("user", JSON.stringify(data.user));
            } else {
                sessionStorage.setItem("user", JSON.stringify(data.user));
            }

            const role = data.user.role_name?.trim().toLowerCase();

            console.log("USER ROLE:", role);

            
            if (role === "admin") {
                navigate("/views/admin/AdminDashboard");
            } else if (role === "seller") {
                navigate("/views/seller/SellerDashboard");
            } else if (role === "buyer" || role === "customer") {
                navigate("/views/customer/CustomerDashboard");
            } else {
                console.log("INVALID ROLE RECEIVED:", data.user.role_name);
                setError("Invalid user role: " + data.user.role_name);
            }
            


        } catch (error) {
            console.error("LOGIN ERROR:", error);
            setError("Unable to connect to the server.");
        }
    };

    const handleGoogleLogin = () => {
        console.log("Google Login clicked");
        setError("Google login is not configured yet.");
    };

    const handleFacebookLogin = () => {
        console.log("Facebook Login clicked");
        setError("Facebook login is not configured yet.");
    };

    return (
        <div className="min-h-screen bg-gray-100">

            {/* HEADER */}
            <header className="bg-white text-[#EE4D2D] border-b border-gray-300">

                <div className="max-w-7xl mx-auto px-6 py-3">

                    <div className="flex items-center justify-between">

                        {/* LOGO */}
                        <Link to="/" className="flex items-center">
                            <img src={logo} alt="Shopee" className="h-12 w-auto"/>
                        </Link>

                        {/* HEADER LINKS */}
                        <div className="flex items-center gap-6 text-sm">
                            <Link to="/" className="hover:opacity-80 transition">
                                Home
                            </Link>
                        </div>

                    </div>

                </div>

            </header>

            {/* LOGIN SECTION */}
            <main className="min-h-[calc(100vh-72px)] flex items-center justify-center px-4 py-10">

                <div className="w-full max-w-md">

                    {/* LOGIN CARD */}
                    <div className="bg-white rounded-lg shadow-md p-8">

                        {/* TITLE */}
                        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
                            Login
                        </h1>

                        {/* ERROR MESSAGE */}
                        {error && (
                            <div className="mb-4 bg-red-100 border border-red-300 text-red-600 px-4 py-3 rounded text-sm">
                                {error}
                            </div>
                        )}

                        {/* LOGIN FORM */}
                        <form onSubmit={handleLogin}>

                            {/* EMAIL */}
                            <div className="mb-4">

                                <label
                                    htmlFor="email"
                                    className="block text-sm text-gray-700 mb-2"
                                >
                                    Email
                                </label>

                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-[#EE4D2D]"
                                    required
                                />

                            </div>

                            {/* PASSWORD */}
                            <div className="mb-4">

                                <label
                                    htmlFor="password"
                                    className="block text-sm text-gray-700 mb-2"
                                >
                                    Password
                                </label>

                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-[#EE4D2D]"
                                    required
                                />

                            </div>

                            {/* REMEMBER ME / FORGOT PASSWORD */}
                            <div className="flex items-center justify-between mb-6">

                                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">

                                    <input
                                        type="checkbox"
                                        checked={rememberMe}
                                        onChange={(e) =>
                                            setRememberMe(e.target.checked)
                                        }
                                        className="accent-[#EE4D2D]"
                                    />

                                    Remember Me

                                </label>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm text-[#EE4D2D] hover:underline"
                                >
                                    Forgot Password?
                                </Link>

                            </div>

                            {/* LOGIN BUTTON */}
                            <button
                                type="submit"
                                className="w-full bg-[#EE4D2D] text-white py-3 rounded hover:bg-[#d73211] transition font-medium"
                            >
                                Login
                            </button>

                        </form>

                        {/* DIVIDER */}
                        <div className="flex items-center my-6">

                            <div className="flex-1 border-t border-gray-300"></div>

                            <span className="px-4 text-sm text-gray-400">
                                OR
                            </span>

                            <div className="flex-1 border-t border-gray-300"></div>

                        </div>

                        {/* GOOGLE LOGIN */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full border border-gray-300 rounded py-3 mb-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition"
                        >
                            <img src={g_icon} alt="Google" className="h-5 w-5" />

                            <span className="text-gray-700">
                                Login with Google
                            </span>
                        </button>

                        {/* FACEBOOK LOGIN */}
                        <button type="button" onClick={handleFacebookLogin} className="w-full border border-gray-300 rounded py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition"
                        >
                            <img src={fb_icon} alt="Facebook" className="h-8 w-8" />

                            <span className="text-gray-700">
                                Login with Facebook
                            </span>
                        </button>

                        {/* SIGN UP */}
                        <div className="text-center mt-6 text-sm text-gray-600">

                            Don't have an account?{" "}

                            <Link to="/signup" className="text-[#EE4D2D] hover:underline font-medium">
                                Sign Up
                            </Link>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default Login;
