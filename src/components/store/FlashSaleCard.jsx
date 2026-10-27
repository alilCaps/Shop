import { Link } from "react-router-dom";
import { HeartIcon, StarIcon } from "../icons";
import { formatCurrency, formatSold } from "../../utils/format";
import { getProductImage } from "../../utils/productImages";

export default function FlashSaleCard({ product, wished, onWishlist }) {
    const stock = Number(product.stock || 0);
    const badge = stock > 0 && stock <= 7 ? `ONLY ${stock} LEFT` : "HOT";

    return (
        <div className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-lg">
            <Link to={`/product/${product.product_id}`} className="block">
                <div className="relative aspect-[1.35] bg-[#f6f1ec]">
                    <img
                        src={getProductImage(product.name, product.image_url)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-[#EE4D2D] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                        {badge}
                    </span>
                </div>

                <div className="p-3">
                    <h3 className="line-clamp-2 h-10 text-sm text-gray-800">{product.name}</h3>
                    <p className="mt-2 text-lg font-semibold text-[#EE4D2D]">{formatCurrency(product.price)}</p>
                    <div className="mt-1 flex justify-between text-xs text-gray-500">
                        <span>
                            <span className="inline-flex items-center gap-1"><StarIcon width={12} height={12} className="text-amber-500" /> {Number(product.rating || 0).toFixed(1)}</span>
                        </span>
                        <span>{formatSold(product.sold)} sold</span>
                    </div>
                </div>
            </Link>

            <button
                type="button"
                onClick={() => onWishlist(product)}
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wished}
                className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow ${
                    wished ? "text-[#EE4D2D]" : "text-gray-600 hover:text-[#EE4D2D]"
                }`}
            >
                <HeartIcon width={16} height={16} filled={wished} />
            </button>
        </div>
    );
}
