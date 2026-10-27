import { useRef, useState } from "react";
import { assetUrl, uploadImage } from "../services/api";
import { ImageIcon, UserIcon, XIcon } from "./icons";

const ACCEPT = "image/png,image/jpeg,image/gif,image/webp";

// One picture (profile photo, shop logo). `value` is the stored path or "".
export function ImageUpload({ value, onChange, label = "Choose image", round = false, size = "h-28 w-28" }) {
    const input = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function pick(event) {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file) return;

        setBusy(true);
        setError("");

        try {
            onChange(await uploadImage(file));
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col items-center gap-3">
            <div
                className={`flex ${size} items-center justify-center overflow-hidden bg-gray-100 text-gray-400 ${
                    round ? "rounded-full" : "rounded-lg"
                }`}
            >
                {value ? (
                    <img src={assetUrl(value)} alt="Preview" className="h-full w-full object-cover" />
                ) : round ? (
                    <UserIcon width={44} height={44} />
                ) : (
                    <ImageIcon width={40} height={40} />
                )}
            </div>

            <input ref={input} type="file" accept={ACCEPT} onChange={pick} className="sr-only" aria-label={label} />

            <div className="flex flex-wrap justify-center gap-2 text-xs">
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => input.current?.click()}
                    className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-60"
                >
                    {busy ? "Uploading..." : value ? "Change" : label}
                </button>
                {value && !busy && (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="rounded border border-gray-300 px-3 py-1.5 text-gray-600 hover:bg-gray-50"
                    >
                        Remove
                    </button>
                )}
            </div>

            <p className="text-center text-[11px] text-gray-400">JPG, PNG, GIF or WebP · max 5 MB</p>
            {error && (
                <p role="alert" className="text-center text-xs text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
}

// Several pictures (products). The first one is the main picture.
export function ImageGalleryUpload({ values, onChange, max = 5 }) {
    const input = useRef(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function pick(event) {
        const files = [...(event.target.files || [])].slice(0, max - values.length);
        event.target.value = "";

        if (files.length === 0) return;

        setBusy(true);
        setError("");

        const added = [];

        for (const file of files) {
            try {
                added.push(await uploadImage(file));
            } catch (err) {
                setError(err.message);
            }
        }

        onChange([...values, ...added]);
        setBusy(false);
    }

    return (
        <div>
            <div className="flex flex-wrap gap-2">
                {values.map((url, index) => (
                    <div key={url} className="group relative h-20 w-20 overflow-hidden rounded border border-gray-200">
                        <img src={assetUrl(url)} alt={`Product picture ${index + 1}`} className="h-full w-full object-cover" />
                        {index === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-[#EE4D2D] text-center text-[10px] text-white">
                                Main
                            </span>
                        )}
                        <button
                            type="button"
                            aria-label="Remove picture"
                            onClick={() => onChange(values.filter((item) => item !== url))}
                            className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black"
                        >
                            <XIcon width={12} height={12} />
                        </button>
                    </div>
                ))}

                {values.length < max && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() => input.current?.click()}
                        className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded border border-dashed border-gray-300 text-xs text-gray-500 hover:border-[#EE4D2D] hover:text-[#EE4D2D] disabled:opacity-60"
                    >
                        <ImageIcon width={20} height={20} />
                        {busy ? "Uploading" : "Add"}
                    </button>
                )}
            </div>

            <input ref={input} type="file" accept={ACCEPT} multiple onChange={pick} className="sr-only" aria-label="Add product pictures" />
            <p className="mt-1 text-[11px] text-gray-400">
                Up to {max} pictures · the first is the main one · JPG, PNG, GIF or WebP, max 5 MB each
            </p>
            {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
