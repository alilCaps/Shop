import { Link } from "react-router-dom";

function FlashSaleCard({ product }) {
    return (
        <Link to={`/product/${product.product_id}`} className="block bg-white p-3 hover:shadow-lg">
            <div className="h-40 relative bg-white flex items-center justify-center">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain"
                />

                <span className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-2 py-1">
                    {product.discount}
                </span>
            </div>

            <h3 className="text-sm text-gray-700 mt-2 line-clamp-2 h-10">
                {product.name}
            </h3>

            <div className="mt-2 text-center">
                <span className="text-orange-500 text-xl font-medium">
                    {product.price}
                </span>
            </div>

            <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>⭐ {product.rating}</span>
                <span>{product.sold}</span>
            </div>

            <div className="mt-3 bg-orange-100 rounded-full overflow-hidden">
                <div className="bg-linear-to-r from-orange-500 to-orange-300 text-white text-xs text-center py-1 rounded-full">
                    🔥 {product.status}
                </div>
            </div>
        </Link>
    );
}

export default FlashSaleCard;