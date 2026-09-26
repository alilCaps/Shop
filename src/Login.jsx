import logo from "./assets/logo/orange_logo.png";

function Login() {
    return (
        <div className="min-h-screen bg-[#f5f5f5]">

            {/* Top Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-5 flex items-center">
                    
                    {/* Shopee Logo */}
                    <div className="flex items-center gap-3">
                        <img src={logo}alt="Shopee Logo"className="w-35 h-auto object-contain"/>
                        <span className="text-2xl text-gray-600 ml-2"> Login</span>
                    </div>

                </div>
            </header>

            {/* Login Section */}
            <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">

                <div className="w-full max-w-md">

                    {/* Login Card */}
                    <div className="bg-white rounded-sm shadow-lg p-8">

                        {/* Title */}
                        <h1 className="text-2xl text-gray-800 text-center mb-7">Login</h1>

                        <form method="GET" action="" className="space-y-5">

                            {/* Username */}
                            <div>
                                <input type="text" id="username" name="username" placeholder="Username"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-sm text-sm text-gray-700
                                    placeholder-gray-400 focus:outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <input type="password" id="password" name="password" placeholder="Password"
                                    className="w-full h-12 px-4 border border-gray-300 rounded-sm text-sm text-gray-700
                                    placeholder-gray-400 focus:outline-none focus:border-[#EE4D2D] focus:ring-1 focus:ring-[#EE4D2D]"
                                />
                            </div>

                            {/* Options */}
                            <div className="flex items-center justify-between text-sm">

                                <label className="flex items-center gap-2 text-gray-500">
                                    <input type="checkbox"className="w-4 h-4 accent-[#EE4D2D]"/>Remember me </label>

                                <a href="#" className="text-[#EE4D2D] hover:underline">Forgot Password?</a>

                            </div>

                            {/* Login Button */}
                            <button type="submit" name="btnLogin" className="w-full h-12 bg-[#EE4D2D] 
                                hover:bg-[#d73211] text-white font-medium rounded-sm transition duration-200">
                                LOGIN
                            </button>

                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-4 my-7">

                            <div className="flex-1 h-px bg-gray-200"></div>
                            <span className="text-gray-400 text-sm">OR</span>
                            <div className="flex-1 h-px bg-gray-200"></div>
                            
                        </div>

                        {/* Social Login */}
                        <div className="grid grid-cols-2 gap-3">

                            <button
                                type="button" className="h-10 border border-gray-300 
                                rounded-sm text-sm text-gray-700
                                hover:bg-gray-50 transition"
                            >
                                Facebook
                            </button>

                            <button
                                type="button" className="h-10 border border-gray-300 
                                rounded-sm text-sm text-gray-700
                                hover:bg-gray-50 transition"
                            >
                                Google
                            </button>

                        </div>

                        {/* Sign Up */}
                        <div className="text-center mt-7 text-sm text-gray-500">
                            New to Shopee?{" "}
                            <a href="#" className="text-[#EE4D2D] hover:underline font-medium">
                                Sign Up
                            </a>
                        </div>

                    </div>

                </div>

            </main>
        </div>
    );
}

export default Login;