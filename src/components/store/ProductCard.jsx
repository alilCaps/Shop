import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/format";
import { getProductImage } from "../../utils/productImages";

export default function ProductCard({ product, footer }) {
    const id = product.product_id;
    const name = product.name || product.product_name;
    const stock = product.stock;

    return (
        <div className="flex flex-col overflow-hidden rounded-sm bg-white shadow-sm transition hover:shadow-lg">
            <Link to={`/product/${id}`} className="block">
                <div className="flex h-48 items-center justify-center bg-white">
                    <img
                        src={getProductImage(name, product.image_url)}
                        alt={name}
                        className="h-full w-full object-contain"
                    />
                </div>

                <div className="p-3">
                    <h3 className="line-clamp-2 h-10 text-sm text-gray-700">
                        {name}
                    </h3>

                    <p className="mt-3 text-lg text-[#EE4D2D]">
                        {formatCurrency(product.price)}
                    </p>

                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>⭐ {Number(product.rating || 0).toFixed(1)}</span>
                        <span>
                            {Number(product.sold || 0).toLocaleString("en-PH")} sold
                        </span>
                    </div>

                    {stock === 0 && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                            Out of stock
                        </p>
                    )}
                </div>
            </Link>

            {footer && <div className="mt-auto border-t border-gray-100 p-3">{footer}</div>}
        </div>
    );
}
