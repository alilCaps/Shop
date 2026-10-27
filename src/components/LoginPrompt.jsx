import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { LockIcon } from "./icons";

// Modal shown when a guest tries to do something that needs an account.
export default function LoginPrompt({ open, onClose, message = "Please log in to continue." }) {
    const location = useLocation();

    useEffect(() => {
        if (!open) return undefined;

        const onKey = (event) => event.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const from = location.pathname + location.search;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-prompt-title"
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-xl"
            >
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1ed] text-[#EE4D2D]">
                    <LockIcon width={26} height={26} />
                </span>
                <h2 id="login-prompt-title" className="mt-3 text-lg font-semibold">
                    Log in to continue
                </h2>
                <p className="mt-2 text-sm text-gray-500">{message}</p>

                <div className="mt-6 flex flex-col gap-2">
                    <Link
                        to="/login"
                        state={{ from }}
                        className="rounded-md bg-[#EE4D2D] py-2.5 text-sm font-medium text-white hover:bg-[#d73211]"
                    >
                        Log in
                    </Link>
                    <Link
                        to="/signup"
                        className="rounded-md border border-gray-300 py-2.5 text-sm hover:bg-gray-50"
                    >
                        Create an account
                    </Link>
                    <button type="button" onClick={onClose} className="py-2 text-sm text-gray-500 hover:underline">
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
}
