export const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getStoredUser() {
    try {
        const raw =
            localStorage.getItem("user") || sessionStorage.getItem("user");

        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function getToken() {
    return getStoredUser()?.token || null;
}

export function authHeaders() {
    const token = getToken();

    return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearSession() {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
}

export function roleOf(user) {
    return String(user?.role_name || "").trim().toLowerCase();
}

export function isCustomer(user) {
    return ["customer", "buyer"].includes(roleOf(user));
}

// Where each kind of account lands after login.
export function homeFor(user) {
    switch (roleOf(user)) {
        case "admin":
            return "/admin/dashboard";
        case "seller":
            return "/seller/dashboard";
        case "customer":
        case "buyer":
            return "/customer/dashboard";
        default:
            return "/login";
    }
}

// fetch wrapper: JSON in/out, sends the login token, throws readable errors.
export async function api(path, { method = "GET", body, headers } = {}) {
    const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...authHeaders(),
            ...headers
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401 && getStoredUser()) {
            clearSession();
            window.location.assign("/login");
        }

        const error = new Error(data.message || "Request failed.");
        error.status = response.status;
        throw error;
    }

    return data;
}

export function notifyCartChanged() {
    window.dispatchEvent(new Event("cart:updated"));
}

// Uploaded pictures are stored as "/uploads/<file>" and served by the API.
export function assetUrl(path) {
    if (!path) return "";

    return path.startsWith("/uploads/") ? `${API_URL}${path}` : path;
}

const MAX_SIDE = 1280;
const MAX_BYTES = 5 * 1024 * 1024;

function readAsDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read that file."));
        reader.readAsDataURL(blob);
    });
}

// Shrinks big photos in the browser first so uploads stay fast.
async function shrink(file) {
    if (file.type === "image/gif") return file;

    const bitmap = await createImageBitmap(file).catch(() => null);

    if (!bitmap) throw new Error("That file is not a readable image.");

    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, 0.88));

    return blob || file;
}

// Uploads one image file and resolves with its stored path ("/uploads/...").
export async function uploadImage(file) {
    if (!file || !/^image\/(png|jpe?g|gif|webp)$/.test(file.type)) {
        throw new Error("Choose a PNG, JPG, GIF or WebP image.");
    }

    const blob = await shrink(file);

    if (blob.size > MAX_BYTES) {
        throw new Error("That image is too large (5 MB maximum).");
    }

    const { url } = await api("/api/uploads", {
        method: "POST",
        body: { data: await readAsDataUrl(blob) }
    });

    return url;
}
