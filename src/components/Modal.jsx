import { useEffect, useId } from "react";
import { XIcon } from "./icons";

// Accessible dialog used for forms and confirmations (customer, seller, admin).
export default function Modal({ title, onClose, children, footer, size = "md" }) {
    const titleId = useId();
    const width = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size] || "max-w-lg";

    useEffect(() => {
        function onKey(event) {
            if (event.key === "Escape") onClose();
        }

        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={`flex max-h-[90vh] w-full ${width} flex-col rounded-md bg-white shadow-xl`}
            >
                <header className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 id={titleId} className="text-lg font-semibold text-gray-800">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                    >
                        <XIcon width={18} height={18} />
                    </button>
                </header>
                <div className="overflow-y-auto px-5 py-4">{children}</div>
                {footer && (
                    <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
                        {footer}
                    </footer>
                )}
            </div>
        </div>
    );
}
