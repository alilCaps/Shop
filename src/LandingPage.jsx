import logo from "./assets/logo/white_logo.png";

import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CategoryCard from "./assets/cards/CategoryCards.jsx";
import FlashSaleCard from "./assets/cards/FlashSaleCards.jsx";
import DiscoverCard from "./assets/cards/DiscoverCards.jsx";

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
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const categoryImageMap = {
        "Laptops & Computers": laptopComputers,
        "Electronics": laptopComputers,
        "Makeups & Fragrances": makeupFragrances,
        "Home & Living": homeLiving,
        "Health & Personal Care": healthPersonalCare,
        "Health & Beauty": healthPersonalCare,
        "Sports & Outdoors": sports,
        "Toys & Games": toys,
        "Groceries": groceries,
        "Shoes": shoes,
        "Bags": bags,
        "Accessories": accessories
    };

    const productImageMap = {
        "Moving Rack Organizer": rackOrganizer,
        "Oversized Trend T-Shirt": tshirt,
        "Wireless Bluetooth Earphones": earphones,
        "Double Mattress Foam": mattress,
        "Eyeglasses With Graded Lens": eyeglasses,
        "Portable Mini Fan": miniFan,
        "Stainless Steel Water Bottle": waterBottle,
        "LED Desk Lamp": deskLamp,
        "Laptop Backpack": backpack,
        "Wireless Mouse": mouse,
        "Cute Ceramic Mug": mug,
        "Phone Stand": phoneStand,
        "Makeup Organizer": makeupOrganizer,
        "LED String Lights": stringLights,
        "Foldable Storage Box": storageBox
    };

    const featuredNames = [
        "Moving Rack Organizer",
        "Oversized Trend T-Shirt",
        "Wireless Bluetooth Earphones",
        "Double Mattress Foam",
        "Eyeglasses With Graded Lens"
    ];

    useEffect(() => {
        const loadLandingPageData = async () => {
            try {
                setLoading(true);
                setError("");

                const [categoryResponse, productResponse] =
                    await Promise.all([
                        fetch("http://localhost:5000/api/categories"),
                        fetch("http://localhost:5000/api/products")
                    ]);

                if (!categoryResponse.ok || !productResponse.ok) {
                    throw new Error("Unable to retrieve landing page data.");
                }

                const categoryData = await categoryResponse.json();
                const productData = await productResponse.json();

                setCategories(
                    categoryData.map((category) => category.category_name)
                );

                setAllProducts(
                    productData.map((product) => ({
                        ...product,
                        price: `₱${Number(product.price).toLocaleString("en-PH", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2
                        })}`,
                        sold: `${Number(product.sold).toLocaleString("en-PH")} sold`,
                        rating: Number(product.rating || 0).toFixed(1),
                        image: productImageMap[product.name] || accessories,
                        stock: Number(product.stock || 0)
                    }))
                );
            } catch (err) {
                console.error("LANDING PAGE ERROR:", err);
                setError(err.message || "Unable to load landing page data.");
            } finally {
                setLoading(false);
            }
        };

        loadLandingPageData();
    }, []);

    const categoryImages = categories.map(
        (category) => categoryImageMap[category] || accessories
    );

    const products = featuredNames
        .map((name) => allProducts.find((product) => product.name === name))
        .filter(Boolean)
        .map((product) => ({
            ...product,
            discount: "",
            status: product.stock > 0 && product.stock <= 7
                ? `ONLY ${product.stock} LEFT`
                : "SELLING FAST"
        }));

    const discoverProducts = allProducts.filter(
    (product) => !featuredNames.includes(product.name)
);

    return (
        <div className="parentContainer bg-gray-100 min-w-300">

            <div className="bg-orange-600 text-white">

                <div className="max-w-300 mx-auto flex justify-between items-center py-2">

                    {/* LEFT LINKS */}
                    <div>
                        <ol className="flex gap-5 list-none p-0 m-0 text-sm">
                            <li><Link to="/seller/dashboard" className="hover:opacity-70">Seller Center</Link></li>
                            <li><Link to="/signup" className="hover:opacity-70">Start Selling</Link></li>
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
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                const term = searchTerm.trim();
                                navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
                            }}
                            className="h-12 rounded-sm bg-white flex items-center overflow-hidden"
                        >
                            <input type="text" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search" aria-label="Search products" className="flex-1 h-full px-4 text-gray-700 outline-none"/>
                            <button type="submit" aria-label="Search" className="h-10 w-14 mr-1 bg-orange-500 text-white rounded-sm hover:bg-orange-600">🔍</button>
                        </form>


                        {/* Seach suggestions */}
                        <div className="overflow-hidden">
                            <ol className="flex flex-nowrap gap-6 list-none p-0 mt-2 text-xs text-white whitespace-nowrap">
                                <li><Link to="/search?q=Moving%20Rack%20Organizer" className="hover:underline">Moving Rack Organizer</Link></li>
                                <li><Link to="/search?q=Pants%20Oversize" className="hover:underline">Pants Oversize</Link></li>
                                <li><Link to="/search?q=Trend%20T-Shirt" className="hover:underline">Trend T-Shirt</Link></li>
                                <li><Link to="/search?q=Eyeglasses" className="hover:underline">Eyeglasses</Link></li>
                                <li><Link to="/search?q=Double%20Mattress%20Foam" className="hover:underline">Double Mattress Foam</Link></li>
                            </ol>
                        </div>
                    </div>


                    {/* Cart */}
                    <div className="flex items-center justify-center">
                        <Link to="/customer/cart" aria-label="Shopping cart" className="text-4xl hover:opacity-70">🛒</Link>
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
                                    <Link to={`/search?category=${encodeURIComponent(category)}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-500">{category}</Link>
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
                            <Link to="/search" className="mt-6 block bg-white text-orange-500 w-40 py-3 rounded-sm text-center font-semibold hover:bg-gray-100">SHOP NOW</Link>

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
                            <CategoryCard
                                key={index}
                                category={category}
                                image={categoryImages[index]}
                            />
                        ))}

                    </div>

                </section>

                {/* Flash sale */}
                <section className="bg-white mt-6 rounded-sm">

                    <div className="px-6 py-4 border-b flex justify-between items-center">
                        <h2 className="text-xl text-orange-500 font-semibold">FLASH SALE</h2>
                        <Link to="/search" className="text-sm text-orange-500 hover:underline">View All</Link>
                    </div>


                    <div className="grid grid-cols-5">
                        {products.map((product, index) => (
                            <FlashSaleCard
                                key={index}
                                product={product}
                            />
                        ))}
                    </div>  

                </section>


                {/* Discover */}
                <section className="mt-6">

                        <div className="bg-white border-b-2 border-orange-500">
                            <h2 className="text-xl text-orange-500 px-6 py-4">DAILY DISCOVER</h2>
                        </div>

                        <div className="grid grid-cols-5 gap-3 mt-3">
                            {discoverProducts.map((product, index) => (
                                <DiscoverCard
                                    key={index}
                                    product={product}
                                />
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

