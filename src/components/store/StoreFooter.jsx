import { Link } from "react-router-dom";
import Logo from "../Logo";

export default function StoreFooter() {
    return (
        <footer className="mt-10 bg-[#161a26] text-gray-300">
            <div className="mx-auto flex max-w-300 flex-wrap items-center justify-between gap-6 px-4 py-8">
                <div>
                    <Logo tone="light" className="w-28" />
                    <p className="mt-3 text-xs text-gray-500">© 2026 Shopee. All rights reserved.</p>
                </div>

                <nav className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
                    <Link to="/customer/orders" className="hover:text-white">Customer Service</Link>
                    <Link to="/search" className="hover:text-white">About Shopee</Link>
                    <Link to="/customer/payments" className="hover:text-white">Payment Methods</Link>
                    <Link to="/signup" className="hover:text-white">Start Selling</Link>
                </nav>
            </div>
        </footer>
    );
}
