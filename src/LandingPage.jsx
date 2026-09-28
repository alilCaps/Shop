import logo from "./assets/logo/white_logo.png";
import { Link } from "react-router-dom";

import laptopComputers from "./assets/laptop-computers.jpg";
import makeupFragrances from "./assets/makeup-fragrances.jpg";
import homeLiving from "./assets/home-living.jpg";
import healthPersonalCare from "./assets/healthPersonalCare.jpg";
import sports from "./assets/sports.jpg";
import toys from "./assets/toys.jpg";
import groceries from "./assets/groceries.jpg";
import shoes from "./assets/shoes.jpg";
import bags from "./assets/bags.jpg";
import accessories from "./assets/accessories.jpg";

import rackOrganizer from "./assets/rack-organizer.jpg";
import tshirt from "./assets/t-shirt.jpg";
import earphones from "./assets/earphones.jpg";
import mattress from "./assets/mattress.jpg";
import eyeglasses from "./assets/eyeglasses.jpg";

import miniFan from "./assets/mini-fan.jpg";
import waterBottle from "./assets/water-bottle.jpg";
import deskLamp from "./assets/desk-lamp.jpg";
import backpack from "./assets/backpack.jpg";
import mouse from "./assets/wireless-mouse.jpg";

import mug from "./assets/ceramic-mug.jpg";
import phoneStand from "./assets/phone-stand.jpg";
import makeupOrganizer from "./assets/makeup-organizer.jpg";
import stringLights from "./assets/led-string-lights.jpg";
import storageBox from "./assets/foldable-storage-box.jpg";

function LandingPage() {
    const categories = [
        "Laptops & Computers",
        "Makeups & Fragrances",
        "Home & Living",
        "Health & Personal Care",
        "Sports & Outdoors",
        "Toys & Games",
        "Groceries",
        "Shoes",
        "Bags",
        "Accessories"
    ];

    const categoryImages = [
        laptopComputers,
        makeupFragrances,
        homeLiving,
        healthPersonalCare,
        sports,
        toys,
        groceries,
        shoes,
        bags,
        accessories
    ];

    const products = [
        {
            name: "Moving Rack Organizer",
            price: "₱299",
            sold: "1.2k sold",
            discount: "-50%",
            rating: "4.8",
            status: "SELLING FAST",
            image: rackOrganizer
        },
        {
            name: "Oversized Trend T-Shirt",
            price: "₱199",
            sold: "2.5k sold",
            discount: "-40%",
            rating: "4.7",
            status: "ONLY 5 LEFT",
            image: tshirt
        },
        {
            name: "Wireless Bluetooth Earphones",
            price: "₱399",
            sold: "3.1k sold",
            discount: "-60%",
            rating: "4.9",
            status: "ONLY 7 LEFT",
            image: earphones
        },
        {
            name: "Double Mattress Foam",
            price: "₱899",
            sold: "856 sold",
            discount: "-30%",
            rating: "4.8",
            status: "SELLING FAST",
            image: mattress
        },
        {
            name: "Eyeglasses With Graded Lens",
            price: "₱249",
            sold: "1.8k sold",
            discount: "-45%",
            rating: "4.6",
            status: "ONLY 6 LEFT",
            image: eyeglasses
        }
    ];
    

    const discoverProducts = [
    {
        name: "Portable Mini Fan",
        price: "₱149",
        sold: "2.8k sold",
        rating: "⭐ 4.8",
        image: miniFan
    },
    {
        name: "Stainless Steel Water Bottle",
        price: "₱299",
        sold: "1.6k sold",
        rating: "⭐ 4.6",
        image: waterBottle
    },
    {
        name: "LED Desk Lamp",
        price: "₱399",
        sold: "2.3k sold",
        rating: "⭐ 4.7",
        image: deskLamp
    },
    {
        name: "Laptop Backpack",
        price: "₱599",
        sold: "1.1k sold",
        rating: "⭐ 4.9",
        image: backpack
    },
    {
        name: "Wireless Mouse",
        price: "₱249",
        sold: "3.7k sold",
        rating: "⭐ 4.5",
        image: mouse
    },
    {
        name: "Cute Ceramic Mug",
        price: "₱129",
        sold: "2.1k sold",
        rating: "⭐ 4.8",
        image: mug
    },
    {
        name: "Phone Stand",
        price: "₱99",
        sold: "4.2k sold",
        rating: "⭐ 4.9",
        image: phoneStand
    },
    {
        name: "Makeup Organizer",
        price: "₱189",
        sold: "1.9k sold",
        rating: "⭐ 4.7",
        image: makeupOrganizer
    },
    {
        name: "LED String Lights",
        price: "₱159",
        sold: "2.6k sold",
        rating: "⭐ 4.6",
        image: stringLights
    },
    {
        name: "Foldable Storage Box",
        price: "₱219",
        sold: "1.4k sold",
        rating: "⭐ 4.8",
        image: storageBox
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
                            <li><Link to="/Signup" className="hover:opacity-70">Sign up</Link></li>
                            <li>|</li>
                            <li><Link to="/Login" className="hover:opacity-70">Login</Link></li>
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

                                <div className="w-12 h-12 flex items-center justify-center">
                                    <img src={categoryImages[index]} alt={category} className="w-12 h-12 object-contain"/>    
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
        <div
            key={index}
            className="bg-white p-3 hover:shadow-lg cursor-pointer"
        >

            {/* PRODUCT IMAGE */}
            <div className="h-40 relative bg-white flex items-center justify-center">

                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain"
                />

                {/* DISCOUNT */}
                <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-2 py-1">
                    {product.discount}
                </span>

            </div>


            {/* PRODUCT NAME */}
            <h3 className="text-sm text-gray-700 mt-2 line-clamp-2 h-10">
                {product.name}
            </h3>


            {/* PRICE */}
            <div className="mt-2 text-center">
                <span className="text-orange-500 text-xl font-medium">
                    {product.price}
                </span>
            </div>


            {/* RATING + SOLD */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>⭐ {product.rating}</span>
                <span>{product.sold}</span>
            </div>


            {/* SELLING STATUS */}
            <div className="mt-3 bg-orange-100 rounded-full overflow-hidden">
                <div className="bg-linear-to-r from-orange-500 to-orange-300 text-white text-xs text-center py-1 rounded-full">
                    🔥 {product.status}
                </div>
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
                        {discoverProducts.map((product, index) =>  (

                            <div
                                key={index}
                                className="bg-white hover:shadow-lg cursor-pointer"
                            >

                                {/* IMAGE */}
                                <div className="h-52 bg-white flex items-center justify-center">
                                    <img src={product.image} alt={product.name} className="h-full object-contain"/>
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

                                        <span>{product.rating}</span>

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

