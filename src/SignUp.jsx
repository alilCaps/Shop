import logo from "./assets/logo/orange_logo.png";
import { Link } from "react-router-dom";

function SignUp() {
    return (
        <div className="min-h-screen bg-[#f5f5f5]">

            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center">

                    <Link to="/LandingPage" className="flex items-center gap-3">
                        <img src={logo}alt="Shopee Logo"className="w-35 h-auto object-contain"/>
                        <span className="text-2xl text-gray-600 ml-3">Sign Up</span>
                    </Link>

                </div>
            </header>


            {/* Main */}
            <main className="min-h-[calc(100vh-81px)] flex items-center justify-center px-4 py-10">

                <div className="w-full max-w-md">

                    {/* Signup Card */}
                    <div className="bg-white rounded-sm shadow-lg px-8 py-7">

                        {/* Title */}
                        <h1 className="text-2xl text-gray-800 text-center mb-7">Create Your Account</h1>
                        
                        <form method="POST" action="" className="space-y-4">

                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" className="block text-sm text-gray-600 mb-2">Phone Number</label>

                                <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                            </div>


                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm text-gray-600 mb-2">
                                    Username
                                </label>

                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Create a username"
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
                                <label htmlFor="email" className="block text-sm text-gray-600 mb-2">
                                    Email
                                </label>

                                <input type="email" id="email" name="email" placeholder="Enter your email" required className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                            </div>


                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm text-gray-600 mb-2">
                                    Password
                                </label>

                                <input type="password" id="password" name="password" placeholder="Create a password" required className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                            </div>


                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm text-gray-600 mb-2"
                                >
                                    Confirm Password
                                </label>

                                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" required className="w-full h-11 px-4 border border-gray-300
                                    rounded-sm text-sm text-gray-700
                                    placeholder-gray-400
                                    focus:outline-none
                                    focus:border-[#EE4D2D]
                                    focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                            </div>


                            {/* Terms */}
                            <div className="flex items-start gap-2 pt-1">

                                <input type="checkbox" id="terms" name="terms" required className="w-4 h-4 mt-0.5 accent-[#EE4D2D]"
                                />

                                <label htmlFor="terms" className="text-xs text-gray-500 leading-5">
                                    I agree to Shopee's{" "}
                                    <a href="#" className="text-[#EE4D2D] hover:underline">Terms of Service</a>
                                    {" "}and{" "}
                                    <a href="#" className="text-[#EE4D2D] hover:underline">
                                        Privacy Policy
                                    </a>
                                </label>

                            </div>


                            {/* Sign Up Button */}
                            <button type="submit" name="btnSignUp" className="w-full h-11 bg-[#EE4D2D]
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
                            <span className="text-gray-400 text-sm">OR</span>
                            <div className="flex-1 h-px bg-gray-200"></div>

                        </div>


                        {/* Social Signup */}
                        <div className="grid grid-cols-2 gap-3">

                            <button
                                type="button"
                                className="h-10 border border-gray-300
                                rounded-sm text-sm text-gray-700
                                hover:bg-gray-50 transition"
                            >
                                Facebook
                            </button>

                            <button
                                type="button"
                                className="h-10 border border-gray-300
                                rounded-sm text-sm text-gray-700
                                hover:bg-gray-50 transition"
                            >
                                Google
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