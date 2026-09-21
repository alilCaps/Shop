import logo from "./assets/logo.png";

function LandingPage() {
    const categories = [
        "Electronics",
        "Fashion",
        "Home & Living",
        "Health & Beauty",
        "Sports & Outdoors",
        "Toys & Games",
        "Groceries",
        "Shoes",
        "Bags",
        "Accessories"
    ];

    const products = [
        {
            name: "Moving Rack Organizer",
            price: "₱299",
            sold: "1.2k sold",
            discount: "-50%"
        },
        {
            name: "Oversized Trend T-Shirt",
            price: "₱199",
            sold: "2.5k sold",
            discount: "-40%"
        },
        {
            name: "Wireless Bluetooth Earphones",
            price: "₱399",
            sold: "3.1k sold",
            discount: "-60%"
        },
        {
            name: "Double Mattress Foam",
            price: "₱899",
            sold: "856 sold",
            discount: "-30%"
        },
        {
            name: "Eyeglasses With Graded Lens",
            price: "₱249",
            sold: "1.8k sold",
            discount: "-45%"
        }
    ];

    return (
        <div className="parentContainer bg-gray-100 min-w-300">

            <div className="bg-orange-600 text-white">

                <div className="max-w-300 mx-auto flex justify-between items-center py-2">

                    {/* LEFT LINKS */}
                    <div>
                        <ol className="flex gap-5 list-none p-0 m-0 text-sm">
                            <li><a href="#" className="hover:opacity-70">Seller Center</a></li>
                            <li><a href="#" className="hover:opacity-70">Start Selling</a></li>
                            <li><a href="#" className="hover:opacity-70">Download</a></li>
                            <li><a href="#" className="hover:opacity-70">Follow us on</a></li>
                        </ol>
                    </div>

                    <div>
                        <ol className="flex gap-5 list-none p-0 m-0 text-sm">
                            <li><a href="#" className="hover:opacity-70">Notifications</a></li>
                            <li><a href="#" className="hover:opacity-70">Help</a></li>
                            <li><a href="#" className="hover:opacity-70">English</a></li>
                            <li><a href="#" className="hover:opacity-70">Sign up</a></li>
                            <li>|</li>
                            <li><a href="#" className="hover:opacity-70">Login</a></li>
                        </ol>
                    </div>

                </div>

                <div className="max-w-300 mx-auto grid grid-cols-[180px_1fr_100px] gap-6 items-center py-5">

                    {/* Logo */}
                    <div className="w-45 flex justify-center items-center">
                        <img src={logo} alt="Shopee Logo" className="w-35 h-auto object-contain"/>
                    </div>

                    {/* Seach */}
                    <div className="min-w-0">
                        <div className="h-12 rounded-sm bg-white flex items-center overflow-hidden">
                            <input type="text" placeholder="Search" className="flex-1 h-full px-4 text-gray-700 outline-none"/>
                            <button className="h-10 w-14 mr-1 bg-orange-500 text-white rounded-sm hover:bg-orange-600">🔍</button>
                        </div>


                        {/* Seach suggestions */}
                        <div className="overflow-hidden">
                            <ol className="flex flex-nowrap gap-6 list-none p-0 mt-2 text-xs text-white whitespace-nowrap">
                                <li><a href="#" className="hover:underline">Moving Rack Organizer</a></li>
                                <li><a href="#" className="hover:underline">Pants Oversize</a></li>
                                <li><a href="#" className="hover:underline">Trend T-Shirt</a></li>
                                <li><a href="#" className="hover:underline">Eyeglasses</a></li>
                                <li><a href="#" className="hover:underline">Double Mattress Foam</a></li>
                            </ol>
                        </div>
                    </div>


                    {/* Cart */}
                    <div className="flex items-center justify-center">
                        <a href="#" className="text-4xl hover:opacity-70">🛒</a>
                    </div>

                </div>

            </div>


            <main className="max-w-300 mx-auto py-6">

                <section className="grid grid-cols-[220px_1fr] gap-4">

                    {/* Category sidebar */}
                    <div className="bg-white rounded-sm shadow-sm">
                        
                        <div className="bg-orange-500 text-white px-4 py-3 font-semibold">
                            Categories
                        </div>

                        <ul className="list-none p-0 m-0">

                            {categories.map((category, index) => (
                                <li key={index}>
                                    <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500">{category}</a>
                                </li>
                            ))}
                        </ul>

                    </div>


                    {/* Banner */}
                    <div className="grid grid-cols-[2fr_1fr] gap-3">

                        <div className="h-82.5 bg-orange-500 rounded-sm flex flex-col justify-center px-10 text-white">

                            <p className="text-lg">SHOPEE SUPER SALE</p>
                            <h1 className="text-5xl font-bold mt-2">UP TO 70% OFF</h1>
                            <p className="text-xl mt-4">Big discounts on your favorite products</p>
                            <button className="mt-6 bg-white text-orange-500 w-40 py-3 rounded-sm font-semibold hover:bg-gray-100">SHOP NOW</button>

                        </div>


                        {/* Mini banner */}
                        <div className="grid grid-rows-2 gap-3">

                            <div className="bg-orange-400 rounded-sm flex flex-col justify-center px-6 text-white">
                                <p className="text-lg font-semibold">FREE SHIPPING</p>
                                <p className="mt-2">On selected products</p>
                            </div>


                            <div className="bg-orange-300 rounded-sm flex flex-col justify-center px-6 text-white">
                                <p className="text-lg font-semibold">DAILY DEALS</p>
                                <p className="mt-2">Grab them before they're gone!</p>
                            </div>

                        </div>

                    </div>

                </section>



                <section className="bg-white mt-6 rounded-sm">

                    <div className="px-6 py-4 border-b">
                        <h2 className="text-lg text-gray-700">SHOP BY CATEGORY</h2>
                    </div>


                    <div className="grid grid-cols-10">

                        {categories.map((category, index) => (

                            <a href="#" key={index} className="flex flex-col items-center justify-center py-6 border-r border-b hover:shadow-md">

                                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl">
                                    🛍️
                                </div>

                                <span className="text-xs text-center mt-3 px-2">{category}</span>

                            </a>
                        ))}

                    </div>

                </section>

                {/* Flash sale */}
                <section className="bg-white mt-6 rounded-sm">

                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-xl text-orange-500 font-semibold">FLASH SALE</h2>
                        <a href="#" className="text-sm text-orange-500 hover:underline">View All</a>
                    </div>


                    <div className="grid grid-cols-5">

                        {products.map((product, index) => (
                            <div key={index} className="border-r p-4 hover:shadow-lg cursor-pointer">

                                {/* PRODUCT IMAGE */}
                                <div className="h-44 bg-gray-100 flex items-center justify-center text-6xl">
                                    🛍️
                                </div>


                                {/* DISCOUNT */}
                                <div className="mt-3">
                                    <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1">
                                        {product.discount}
                                    </span>
                                </div>


                                {/* PRODUCT NAME */}
                                <h3 className="text-sm text-gray-700 mt-3 line-clamp-2">
                                    {product.name}
                                </h3>


                                {/* PRICE */}
                                <div className="mt-3 flex items-center justify-between">
                                    <span className="text-orange-500 text-lg">
                                        {product.price}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {product.sold}
                                    </span>
                                </div>

                            </div>
                        ))}
                    </div>

                </section>


                {/* Discover */}
                <section className="mt-6">

                    <div className="bg-white border-b-2 border-orange-500">
                        <h2 className="text-xl text-orange-500 px-6 py-4">DAILY DISCOVER</h2>
                    </div>


                    <div className="grid grid-cols-5 gap-3 mt-3">
                        {[
                            ...products,
                            ...products
                        ].map((product, index) => (

                            <div
                                key={index}
                                className="bg-white hover:shadow-lg cursor-pointer"
                            >

                                {/* IMAGE */}
                                <div className="h-52 bg-gray-100 flex items-center justify-center text-7xl">
                                    🛒
                                </div>

                                <div className="p-4">

                                    <h3 className="text-sm text-gray-700 h-10">
                                        {product.name}
                                    </h3>

                                    <div className="mt-4">

                                        <span className="text-orange-500 text-xl">
                                            {product.price}
                                        </span>

                                    </div>

                                    <div className="flex justify-between mt-2 text-xs text-gray-500">

                                        <span>⭐ 4.8</span>

                                        <span>
                                            {product.sold}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                </section>


            </main>

            {/* Footer */}
            <footer className="bg-white border-t mt-10">

                <div className="max-w-300 mx-auto grid grid-cols-4 gap-10 py-10">

                    <div>

                        <h3 className="font-semibold text-gray-700 mb-4">CUSTOMER SERVICE</h3>

                        <ul className="list-none p-0 text-sm text-gray-500 space-y-2">
                            <li><a href="#">Help Centre</a></li>
                            <li><a href="#">Payment Methods</a></li>
                            <li><a href="#">Shipping</a></li>
                            <li><a href="#">Return & Refund</a></li>
                        </ul>

                    </div>

                    <div>

                        <h3 className="font-semibold text-gray-700 mb-4">ABOUT SHOPEE</h3>

                        <ul className="list-none p-0 text-sm text-gray-500 space-y-2">
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Terms & Conditions</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                        </ul>

                    </div>


                    <div>

                        <h3 className="font-semibold text-gray-700 mb-4">PAYMENT</h3>
                        <p className="text-sm text-gray-500">Visa &nbsp; Mastercard &nbsp; GCash</p>
                        <p className="text-sm text-gray-500 mt-3">Cash on Delivery</p>

                    </div>


                    <div>

                        <h3 className="font-semibold text-gray-700 mb-4">FOLLOW US</h3>

                        <div className="flex gap-4 text-2xl">

                            <a href="#">📘</a>
                            <a href="#">📷</a>
                            <a href="#">🎵</a>
                            <a href="#">▶️</a>

                        </div>

                    </div>

                </div>


                <div className="border-t py-6">
                    <p className="text-center text-sm text-gray-500">© 2026 Shopee-Style Shopping Website. All Rights Reserved.</p>
                </div>

            </footer>

        </div>
    );
}

export default LandingPage;

