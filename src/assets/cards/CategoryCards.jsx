function CategoryCard({ category, image }) {
    return (
        <a
            href="#"
            className="flex flex-col items-center justify-center py-6 border-r border-b hover:shadow-md"
        >
            <div className="w-12 h-12 flex items-center justify-center">
                <img
                    src={image}
                    alt={category}
                    className="w-12 h-12 object-contain"
                />
            </div>

            <span className="text-xs text-center mt-3 px-2">
                {category}
            </span>
        </a>
    );
}

export default CategoryCard;
