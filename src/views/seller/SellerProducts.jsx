import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { ImageGalleryUpload } from "../../components/ImageUpload";
import { api } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { getProductImage } from "../../utils/productImages";

const STATUSES = ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "INACTIVE"];
const EMPTY = {
    product_name: "",
    category_id: "",
    base_price: "",
    stock: "0",
    status: "ACTIVE",
    brand: "",
    description: ""
};

export default function SellerProducts() {
    const { user, shop } = useOutletContext();
    const base = `/api/seller/${user.user_id}`;
    const active = shop?.status === "ACTIVE";

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState(null); // null | "new" | product
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [images, setImages] = useState([]);

    const load = useCallback(async () => {
        try {
            const [p, c] = await Promise.all([
                api(`${base}/products`),
                api("/api/categories")
            ]);
            setProducts(p.products);
            setCategories(c);
            setError("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [base]);

    useEffect(() => {
        load();
    }, [load]);

    function openForm(product) {
        setFormError("");
        setEditing(product || "new");
        setImages(product?.images || []);
        setForm(
            product
                ? {
                      product_name: product.product_name,
                      category_id: String(product.category_id),
                      base_price: String(product.base_price),
                      stock: String(product.stock),
                      status: product.status,
                      brand: product.brand ?? "",
                      description: product.description ?? ""
                  }
                : EMPTY
        );
    }

    function change(event) {
        setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    }

    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setFormError("");

        const body = {
            ...form,
            category_id: Number(form.category_id),
            base_price: Number(form.base_price),
            stock: Number(form.stock),
            images
        };

        try {
            if (editing === "new") {
                await api(`${base}/products`, { method: "POST", body });
            } else {
                await api(`${base}/products/${editing.product_id}`, {
                    method: "PUT",
                    body
                });
            }
            setEditing(null);
            await load();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function archive(product) {
        if (!window.confirm(`Archive "${product.product_name}"? It will be hidden from the store.`)) {
            return;
        }

        try {
            await api(`${base}/products/${product.product_id}`, { method: "DELETE" });
            await load();
        } catch (err) {
            setError(err.message);
        }
    }

    const input =
        "w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#EE4D2D]";

    return (
        <div className="rounded-lg bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
                <h1 className="text-xl font-medium">Products</h1>
                <button
                    type="button"
                    disabled={!active}
                    onClick={() => openForm(null)}
                    className="rounded bg-[#EE4D2D] px-5 py-2 text-sm text-white hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    + Add product
                </button>
            </div>

            {!active && (
                <p className="m-5 rounded border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
                    {shop
                        ? `Your shop is ${shop.status.toLowerCase()}. You can manage products once it is active.`
                        : "Create your shop first to add products."}
                </p>
            )}
            {error && (
                <p role="alert" className="m-5 rounded bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            {loading ? (
                <p className="py-16 text-center text-sm text-gray-500">Loading products...</p>
            ) : products.length === 0 ? (
                <p className="py-16 text-center text-sm text-gray-500">No products yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500">
                            <tr>
                                <th className="px-4 py-2">Product</th>
                                <th className="px-4 py-2">Category</th>
                                <th className="px-4 py-2">Price</th>
                                <th className="px-4 py-2">Stock</th>
                                <th className="px-4 py-2">Sold</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                                <tr key={product.product_id}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={getProductImage(product.product_name, product.image_url)}
                                                alt=""
                                                className="h-12 w-12 rounded border border-gray-100 object-cover"
                                            />
                                            <span className="line-clamp-2">{product.product_name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{product.category_name}</td>
                                    <td className="px-4 py-3">{formatCurrency(product.base_price)}</td>
                                    <td className={`px-4 py-3 ${Number(product.stock) <= 5 ? "text-red-600" : ""}`}>
                                        {Number(product.stock)}
                                    </td>
                                    <td className="px-4 py-3">{product.total_sold}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={product.status} />
                                    </td>
                                    <td className="space-x-3 whitespace-nowrap px-4 py-3 text-right">
                                        <button
                                            type="button"
                                            disabled={!active || product.status === "BANNED"}
                                            onClick={() => openForm(product)}
                                            className="text-[#EE4D2D] hover:underline disabled:opacity-40"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            disabled={product.status === "INACTIVE" || product.status === "BANNED"}
                                            onClick={() => archive(product)}
                                            className="text-gray-500 hover:text-red-600 disabled:opacity-40"
                                        >
                                            Archive
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <form
                        onSubmit={save}
                        className="max-h-full w-full max-w-lg space-y-3 overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
                    >
                        <h2 className="text-lg font-medium">
                            {editing === "new" ? "Add product" : "Edit product"}
                        </h2>

                        {formError && (
                            <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
                                {formError}
                            </p>
                        )}

                        <div>
                            <p className="mb-1 text-xs text-gray-500">Pictures</p>
                            <ImageGalleryUpload values={images} onChange={setImages} />
                        </div>

                        <input name="product_name" required placeholder="Product name" value={form.product_name} onChange={change} className={input} />

                        <div className="grid grid-cols-2 gap-3">
                            <select name="category_id" required value={form.category_id} onChange={change} className={input}>
                                <option value="">Category</option>
                                {categories.map((c) => (
                                    <option key={c.category_id} value={c.category_id}>
                                        {c.category_name}
                                    </option>
                                ))}
                            </select>
                            <select name="status" value={form.status} onChange={change} className={input}>
                                {STATUSES.map((s) => (
                                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                                ))}
                            </select>
                            <input name="base_price" type="number" min="0" step="0.01" required placeholder="Price (₱)" value={form.base_price} onChange={change} className={input} />
                            <input name="stock" type="number" min="0" step="1" required placeholder="Stock" value={form.stock} onChange={change} className={input} />
                        </div>

                        <input name="brand" placeholder="Brand (optional)" value={form.brand} onChange={change} className={input} />
                        <textarea name="description" rows={4} placeholder="Description" value={form.description} onChange={change} className={input} />

                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={() => setEditing(null)} className="rounded border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="rounded bg-[#EE4D2D] px-6 py-2 text-sm text-white hover:bg-[#d73211] disabled:opacity-50">
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
