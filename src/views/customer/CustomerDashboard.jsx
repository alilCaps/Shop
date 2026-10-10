import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function CustomerDashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [activeMenu, setActiveMenu] = useState("Account overview");


    useEffect(() => {

        const storedUser =
            localStorage.getItem("user") ||
            sessionStorage.getItem("user");


        if (!storedUser) {

            navigate("/login");

            return;

        }


        let loggedInUser;


        try {

            loggedInUser = JSON.parse(storedUser);

        } catch (error) {

            console.error(
                "INVALID USER DATA:",
                error
            );


            localStorage.removeItem("user");
            sessionStorage.removeItem("user");


            navigate("/login");

            return;

        }


        if (!loggedInUser.user_id) {

            console.error(
                "NO USER ID FOUND"
            );


            localStorage.removeItem("user");
            sessionStorage.removeItem("user");


            navigate("/login");

            return;

        }


        console.log(
            "LOGGED-IN USER ID:",
            loggedInUser.user_id
        );


        fetch(
            `http://localhost:5000/users/${loggedInUser.user_id}`
        )
            .then((response) => {

                if (!response.ok) {

                    throw new Error(
                        "Unable to retrieve user information."
                    );

                }


                return response.json();

            })
            .then((data) => {

                console.log(
                    "CURRENT USER FROM DATABASE:",
                    data.user
                );


                if (!data.user) {

                    throw new Error(
                        "User information was not returned."
                    );

                }


                setUser(data.user);

            })
            .catch((error) => {

                console.error(
                    "USER FETCH ERROR:",
                    error
                );


                setError(
                    "Unable to load your account information."
                );

            })
            .finally(() => {

                setLoading(false);

            });

    }, [navigate]);


    const handleLogout = () => {

        localStorage.removeItem("user");
        sessionStorage.removeItem("user");

        navigate("/login");

    };


    const menuItems = [
        {
            name: "Account overview",
            icon: "▦"
        },
        {
            name: "My profile",
            icon: "♙"
        },
        {
            name: "My orders",
            icon: "□"
        },
        {
            name: "Wishlist",
            icon: "♡"
        },
        {
            name: "Addresses",
            icon: "⌖"
        },
        {
            name: "Payments",
            icon: "▤"
        }
    ];


    const stats = [
        {
            number: "2",
            label: "To Receive",
            icon: "□"
        },
        {
            number: "1",
            label: "To Review",
            icon: "☆"
        },
        {
            number: "3",
            label: "Vouchers",
            icon: "▱"
        },
        {
            number: "680",
            label: "Shopee Coins",
            icon: "◉"
        }
    ];


    const activities = [
        {
            icon: "♡",
            text: "Saved Minimal Desk Lamp",
            time: "2 hours ago"
        },
        {
            icon: "▱",
            text: "Voucher claimed: $5 OFF",
            time: "Yesterday"
        },
        {
            icon: "☆",
            text: "Reviewed CloudStep Sneakers",
            time: "24 Sep"
        }
    ];


    if (loading) {

        return (

            <div className="min-h-screen bg-gray-100 flex items-center justify-center">

                <div className="text-center">

                    <div className="text-[#EE4D2D] text-2xl font-semibold">
                        Shopee
                    </div>

                    <p className="text-gray-500 text-sm mt-2">
                        Loading your account...
                    </p>

                </div>

            </div>

        );

    }


    if (error || !user) {

        return (

            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

                <div className="bg-white rounded-lg shadow-md p-8 text-center max-w-md w-full">

                    <h2 className="text-xl font-semibold text-gray-800">
                        Unable to load account
                    </h2>

                    <p className="text-sm text-gray-500 mt-2">
                        {error || "User information could not be found."}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-5 bg-[#EE4D2D] text-white px-6 py-2 rounded hover:bg-[#d73211] transition"
                    >
                        Return to Login
                    </button>

                </div>

            </div>

        );

    }


    /*
        Allow incomplete user information.

        If first_name is NULL or empty:
        use username.

        If last_name is NULL or empty:
        use an empty string.

        If username is also unavailable:
        use "Customer".
    */

    const firstName =
        typeof user.first_name === "string" &&
        user.first_name.trim() !== ""
            ? user.first_name.trim()
            : typeof user.username === "string" &&
              user.username.trim() !== ""
                ? user.username.trim()
                : "Customer";


    const lastName =
        typeof user.last_name === "string"
            ? user.last_name.trim()
            : "";


    const displayName =
        `${firstName} ${lastName}`.trim();


    return (

        <div className="min-h-screen bg-[#f5f5f5] text-gray-700">


            {/* TOP ORANGE BAR */}

            <div className="bg-[#EE4D2D] text-white text-xs">

                <div className="max-w-[1200px] mx-auto h-[30px] flex items-center justify-between px-4">


                    <div className="flex items-center gap-2">

                        <span>
                            Seller Centre
                        </span>

                        <span className="opacity-60">
                            •
                        </span>

                        <span>
                            Download
                        </span>

                        <span className="opacity-60">
                            •
                        </span>

                        <span>
                            Follow us
                        </span>

                    </div>


                    <div className="flex items-center gap-4">

                        <span>
                            Notifications
                        </span>

                        <span>
                            Help
                        </span>

                        <span>
                            English
                        </span>

                        <span>
                            {displayName}
                        </span>

                    </div>


                </div>

            </div>


            {/* HEADER */}

            <header className="bg-white border-b border-gray-200">

                <div className="max-w-[1200px] mx-auto h-[70px] flex items-center gap-7 px-4">


                    {/* LOGO */}

                    <Link
                        to="/"
                        className="flex items-center gap-2 shrink-0"
                    >

                        <div className="w-9 h-9 rounded-lg bg-[#EE4D2D] text-white flex items-center justify-center text-xl">
                            🛍
                        </div>

                        <span className="text-2xl font-semibold text-[#EE4D2D]">
                            Shopee
                        </span>

                    </Link>


                    {/* SEARCH */}

                    <div className="flex-1 max-w-[650px]">

                        <div className="h-10 bg-gray-100 rounded-md flex items-center overflow-hidden">


                            <input
                                type="text"
                                placeholder="Search for products, brands and shops"
                                className="flex-1 bg-transparent px-4 text-sm outline-none text-gray-700 placeholder-gray-400"
                            />


                            <button
                                type="button"
                                className="w-12 h-8 mr-1 rounded-md bg-[#EE4D2D] text-white flex items-center justify-center hover:bg-[#d73211]"
                            >
                                🔍
                            </button>


                        </div>

                    </div>


                    {/* HEADER LINKS */}

                    <div className="hidden lg:flex items-center gap-6 text-xs text-gray-600">


                        <Link
                            to="/"
                            className="hover:text-[#EE4D2D]"
                        >
                            Categories
                        </Link>


                        <Link
                            to="/"
                            className="hover:text-[#EE4D2D]"
                        >
                            Flash Sale
                        </Link>


                        <Link
                            to="/"
                            className="hover:text-[#EE4D2D]"
                        >
                            Shopee Mall
                        </Link>


                        <button
                            type="button"
                            className="text-xl"
                        >
                            ♡
                        </button>


                        <button
                            type="button"
                            className="text-xl"
                        >
                            🛒
                        </button>


                    </div>


                </div>

            </header>


            {/* DASHBOARD */}

            <main className="max-w-[1200px] mx-auto px-4 py-6">


                <div className="grid grid-cols-1 lg:grid-cols-[192px_1fr] gap-5">


                    {/* SIDEBAR */}

                    <aside className="bg-white rounded-lg shadow-sm h-fit overflow-hidden">


                        {/* PROFILE */}

                        <div className="p-4 border-b border-gray-100">

                            <div className="flex items-center gap-3">


                                <div className="w-11 h-11 rounded-full bg-gray-200 flex items-center justify-center text-xl overflow-hidden">


                                    {user.profile_image ? (

                                        <img
                                            src={user.profile_image}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />

                                    ) : (

                                        "👤"

                                    )}


                                </div>


                                <div className="min-w-0">

                                    <h3 className="font-semibold text-sm truncate">

                                        {displayName}

                                    </h3>


                                    <p className="text-xs text-[#EE4D2D]">

                                        Silver member

                                    </p>


                                </div>


                            </div>

                        </div>


                        {/* MENU */}

                        <nav className="p-2">


                            {menuItems.map((item) => (

                                <button
                                    key={item.name}
                                    type="button"
                                    onClick={() =>
                                        setActiveMenu(item.name)
                                    }
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left transition ${
                                        activeMenu === item.name
                                            ? "bg-[#fff1ed] text-[#EE4D2D]"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >

                                    <span className="w-5 text-center text-base">

                                        {item.icon}

                                    </span>


                                    <span>

                                        {item.name}

                                    </span>


                                </button>

                            ))}


                            {/* LOGOUT */}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm text-left text-gray-700 hover:bg-gray-50"
                            >

                                <span className="w-5 text-center">
                                    ↪
                                </span>

                                <span>
                                    Logout
                                </span>

                            </button>


                        </nav>


                    </aside>


                    {/* MAIN CONTENT */}

                    <section className="min-w-0">


                        {/* WELCOME BANNER */}

                        <div className="bg-[#F4512B] rounded-lg px-6 py-5 text-white relative overflow-hidden">


                            <div className="relative z-10">


                                <h1 className="text-2xl font-semibold">

                                    Good afternoon, {firstName} 👋

                                </h1>


                                <p className="text-sm mt-2 text-orange-50">

                                    You have 2 orders on the way and 3 vouchers ready to use.

                                </p>


                                <p className="text-xs mt-2 font-medium">

                                    ♕ Silver Member · 320 coins to Gold

                                </p>


                            </div>


                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl opacity-80">

                                🛍️

                            </div>


                        </div>


                        {/* STATISTICS */}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">


                            {stats.map((stat) => (

                                <div
                                    key={stat.label}
                                    className="bg-white rounded-lg p-4 shadow-sm flex items-center gap-3"
                                >


                                    <div className="w-10 h-10 rounded-full bg-[#fff1ed] text-[#EE4D2D] flex items-center justify-center text-lg shrink-0">

                                        {stat.icon}

                                    </div>


                                    <div>

                                        <p className="text-xl font-semibold text-gray-800">

                                            {stat.number}

                                        </p>


                                        <p className="text-xs text-gray-500">

                                            {stat.label}

                                        </p>

                                    </div>


                                </div>

                            ))}


                        </div>


                        {/* ORDER ON THE WAY */}

                        <div className="bg-white rounded-lg shadow-sm mt-4 p-5">


                            <div className="flex items-start justify-between">


                                <div>

                                    <h2 className="font-semibold text-base text-gray-800">

                                        Order on the way

                                    </h2>


                                    <p className="text-xs text-gray-400 mt-1">

                                        Order SP-9041827 · Placed 27 Sep

                                    </p>

                                </div>


                                <span className="bg-blue-50 text-blue-500 text-xs px-3 py-1 rounded-full">

                                    Shipped

                                </span>


                            </div>


                            <div className="flex items-center gap-3 mt-5">


                                <div className="w-16 h-16 rounded-md bg-[#f1e6d5] flex items-center justify-center text-3xl shrink-0">

                                    🎧

                                </div>


                                <div className="flex-1 min-w-0">


                                    <h3 className="text-sm font-medium text-gray-800">

                                        AirLite Pro Earbuds + 3 more items

                                    </h3>


                                    <p className="text-xs text-gray-400 mt-1">

                                        Estimated delivery 30 Sep – 2 Oct

                                    </p>


                                    <div className="flex gap-1 mt-2">

                                        <div className="h-1 flex-1 bg-[#EE4D2D] rounded-full"></div>

                                        <div className="h-1 flex-1 bg-[#EE4D2D] rounded-full"></div>

                                        <div className="h-1 flex-1 bg-[#EE4D2D] rounded-full"></div>

                                        <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>

                                    </div>


                                </div>


                                <button
                                    type="button"
                                    className="hidden sm:block border border-[#EE4D2D] text-[#EE4D2D] px-4 py-2 rounded-md text-sm hover:bg-[#fff1ed]"
                                >

                                    Track package

                                </button>


                            </div>


                        </div>


                        {/* BOTTOM CONTENT */}

                        <div className="grid grid-cols-1 md:grid-cols-[1fr_275px] gap-4 mt-4">


                            {/* RECENT ACTIVITY */}

                            <div className="bg-white rounded-lg shadow-sm p-5">


                                <h2 className="font-semibold text-base text-gray-800 mb-4">

                                    Recent activity

                                </h2>


                                <div className="space-y-5">


                                    {activities.map((activity) => (

                                        <div
                                            key={activity.text}
                                            className="flex items-center gap-3"
                                        >


                                            <div className="w-7 h-7 rounded-full bg-[#fff1ed] text-[#EE4D2D] flex items-center justify-center text-sm">

                                                {activity.icon}

                                            </div>


                                            <p className="flex-1 text-xs text-gray-700">

                                                {activity.text}

                                            </p>


                                            <span className="text-[10px] text-gray-400">

                                                {activity.time}

                                            </span>


                                        </div>

                                    ))}


                                </div>


                            </div>


                            {/* PROMOTION */}

                            <div className="bg-[#17212B] rounded-lg p-5 text-white flex flex-col justify-between">


                                <div>

                                    <p className="text-[10px] uppercase font-semibold text-orange-300">

                                        For your next order

                                    </p>


                                    <h2 className="text-2xl font-bold mt-2">

                                        $5 OFF

                                    </h2>


                                    <p className="text-xs text-gray-400 mt-2">

                                        Min. spend $45 · Valid until 30 Sep

                                    </p>


                                </div>


                                <button
                                    type="button"
                                    className="bg-[#EE4D2D] text-white text-sm px-5 py-2 rounded-md w-fit mt-4 hover:bg-[#d73211]"
                                >

                                    Shop now

                                </button>


                            </div>


                        </div>


                    </section>


                </div>


            </main>


        </div>

    );

}


export default CustomerDashboard;