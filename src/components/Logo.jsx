import { Link } from "react-router-dom";
import orangeLogo from "../assets/logo/orange_logo.png";
import whiteLogo from "../assets/logo/white_logo.png";

// The one Shopee logo used by the storefront, Seller Centre and Admin panel.
// `tone="light"` is for dark backgrounds.
export default function Logo({ to = "/", tone = "dark", className = "w-28", label }) {
    return (
        <Link to={to} className="flex items-center gap-3" aria-label="Shopee home">
            <img
                src={tone === "light" ? whiteLogo : orangeLogo}
                alt="Shopee"
                className={`${className} h-auto object-contain`}
            />
            {label && <span className="text-xs font-medium tracking-wider text-gray-500">{label}</span>}
        </Link>
    );
}
