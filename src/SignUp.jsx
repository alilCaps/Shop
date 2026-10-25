import logo from "./assets/logo/orange_logo.png";
import fb_icon from "./assets/icons/facebook_icon.png";
import g_icon from "./assets/icons/google_icon.png";

import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function SignUp() {

    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [accountType, setAccountType] = useState("customer");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSignup = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {

            const response = await fetch("http://localhost:5000/signup", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    phone: phone,
                    username: username,
                    email: email,
                    password: password,
                    account_type: accountType
                })
            });

            const data = await response.json();

            if (!response.ok) {

                setError(data.message || "Registration failed.");

                return;
            }

            setSuccess("Account created successfully!");

            // Clear form
            setPhone("");
            setUsername("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setAccountType("customer");

            // Go to login after successful signup
            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {

            console.error("SIGNUP ERROR:", error);

            setError("Unable to connect to the server.");

        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5]">

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


            {/* Main */}
            <main className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10">

                <div className="w-full max-w-md">

                    {/* Signup Card */}
                    <div className="bg-white rounded-sm shadow-lg px-8 py-7">

                        {/* Title */}
                        <h1 className="text-2xl text-gray-800 text-center mb-7">
                            Create Your Account
                        </h1>


                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-sm">
                                {error}
                            </div>
                        )}


                        {/* Success Message */}
                        {success && (
                            <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-sm">
                                {success}
                            </div>
                        )}


                        <form
                            onSubmit={handleSignup}
                            className="space-y-4"
                        >

                            {/* Phone Number */}
                            <div>

                                <label
                                    htmlFor="phone"
                                    className="block text-sm text-gray-600 mb-2"
                                >
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="Enter your phone number"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                    className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />

                            </div>


                            {/* Username */}
                            <div>

                                <label
                                    htmlFor="username"
                                    className="block text-sm text-gray-600 mb-2"
                                >
                                    Username
                                </label>

                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Create a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />

                            </div>


                            {/* Email */}
                            <div>

                                <label
                                    htmlFor="email"
                                    className="block text-sm text-gray-600 mb-2"
                                >
                                    Email
                                </label>

                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />

                            </div>


                            {/* Password */}
                            <div>

                                <label
                                    htmlFor="password"
                                    className="block text-sm text-gray-600 mb-2"
                                >
                                    Password
                                </label>

                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Create a password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />

                            </div>


                            {/* Confirm Password */}
                            <div>

                                <label
                                    htmlFor="confirmPassword"
                                    className="block text-sm text-gray-600 mb-2"
                                >
                                    Confirm Password
                                </label>

                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />

                            </div>


                            {/* Terms */}
                            <div className="flex items-start gap-2 pt-1">

                                <input type="checkbox" id="terms" name="terms" required className="w-4 h-4 mt-0.5 accent-[#EE4D2D]"/>
                                <label htmlFor="terms" className="text-xs text-gray-500 leading-5">
                                    I agree to Shopee's{" "}

                                    <a href="#" className="text-[#EE4D2D] hover:underline">
                                        Terms of Service
                                    </a>

                                    {" "}and{" "}

                                    <a href="#" className="text-[#EE4D2D] hover:underline">
                                        Privacy Policy
                                    </a>

                                </label>

                            </div>


                            {/* Account type */}
                            <fieldset className="mb-4 flex gap-6 text-sm text-gray-700">
                                <legend className="sr-only">Account type</legend>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value="customer"
                                        checked={accountType === "customer"}
                                        onChange={() => setAccountType("customer")}
                                        className="accent-[#EE4D2D]"
                                    />
                                    I want to shop
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="radio"
                                        name="accountType"
                                        value="seller"
                                        checked={accountType === "seller"}
                                        onChange={() => setAccountType("seller")}
                                        className="accent-[#EE4D2D]"
                                    />
                                    I want to sell
                                </label>
                            </fieldset>

                            {/* Sign Up Button */}
                            <button
                                type="submit"
                                name="btnSignUp"
                                className="w-full h-11 bg-[#EE4D2D]
                                hover:bg-[#d73211] text-white
                                font-medium rounded-sm
                                transition duration-200 mt-2"
                            >
                                SIGN UP
                            </button>

                        </form>


                        {/* Divider */}
                        <div className="flex items-center gap-4 my-6">

                            <div className="flex-1 h-px bg-gray-200"></div>

                            <span className="text-gray-400 text-sm">
                                OR
                            </span>

                            <div className="flex-1 h-px bg-gray-200"></div>

                        </div>


                        {/* Social Signup */}
                        <div className="grid grid-cols-2 gap-3">

                            <button type="button" className="w-full border border-gray-300 rounded py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition"
                            >
                                <img src={fb_icon} alt="Facebook" className="w-5 h-5 mr-2" />
                                <span className="text-gray-700">Facebook</span>
                            </button>

                            <button type="button" className="w-full border border-gray-300 rounded py-3 flex items-center justify-center gap-3 hover:bg-gray-50 transition"
                            >
                                <img src={g_icon} alt="Google" className="w-5 h-5 mr-2" />
                                <span className="text-gray-700">Google</span>
                            </button>

                        </div>


                        {/* Login */}
                        <div className="text-center mt-6 text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#EE4D2D] font-medium hover:underline">
                                Login
                            </Link>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
}

export default SignUp;