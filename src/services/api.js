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
