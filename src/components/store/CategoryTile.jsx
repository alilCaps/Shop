import { Link } from "react-router-dom";

export default function CategoryTile({ name, image }) {
    return (
        <Link
            to={`/search?category=${encodeURIComponent(name)}`}
            className="flex flex-col items-center gap-3 rounded-xl bg-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
            <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#fff1ed]">
                <img src={image} alt="" className="h-full w-full object-cover" />
            </span>
            <span className="text-xs font-medium text-gray-800">{name}</span>
        </Link>
    );
}
