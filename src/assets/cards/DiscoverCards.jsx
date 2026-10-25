import { Link } from "react-router-dom";

function DiscoverCard({ product }) {
    return (
        <Link to={`/product/${product.product_id}`} className="block bg-white hover:shadow-lg">
            <div className="h-52 bg-white flex items-center justify-center">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full object-contain"
                />
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
        </Link>
    );
}

export default DiscoverCard;