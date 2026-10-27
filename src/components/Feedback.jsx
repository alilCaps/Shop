import { PackageIcon } from "./icons";

// Small shared pieces for loading / error / empty states.
export function Spinner({ label = "Loading..." }) {
    return (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-gray-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#EE4D2D]" />
            {label}
        </div>
    );
}

export function ErrorNote({ message, onRetry }) {
    if (!message) return null;

    return (
        <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
            <span>{message}</span>
            {onRetry && (
                <button type="button" onClick={onRetry} className="font-medium underline">
                    Try again
                </button>
            )}
        </div>
    );
}

export function Notice({ notice }) {
    if (!notice) return null;

    const styles =
        notice.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-700";

    return (
        <p role="status" className={`rounded border px-4 py-3 text-sm ${styles}`}>
            {notice.text}
        </p>
    );
}

export function EmptyState({ icon, title, hint, children }) {
    return (
        <div className="px-4 py-14 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1ed] text-[#EE4D2D]">
                {typeof icon === "string" ? (
                    <span className="text-3xl" aria-hidden="true">{icon}</span>
                ) : (
                    icon || <PackageIcon width={30} height={30} />
                )}
            </div>
            <p className="mt-3 text-sm text-gray-700">{title}</p>
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
            {children && <div className="mt-5">{children}</div>}
        </div>
    );
}
