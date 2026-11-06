const express = require("express");
const cors = require("cors");

// Import API routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminReturnRoutes = require("./routes/adminReturnRoutes");
const path = require("path");
const {
    ensureSecuritySchema,
    startSecurityCleanup
} = require("./utils/securitySchema");

const app = express();

app.disable("x-powered-by");
const PORT = process.env.PORT || 5000;

// Global middleware
// CORS_ORIGIN (comma-separated) limits which websites may call the API.
// When it is not set every origin is allowed (fine for local development).
app.use(
    cors(
        process.env.CORS_ORIGIN
            ? { origin: process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) }
            : undefined
    )
);

app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
});

// Image uploads use their own (larger) JSON parser, so mount them first.
app.use("/api/uploads", uploadRoutes);

// Uploaded images are public files.
app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"), {
        index: false,
        maxAge: "7d",
        setHeaders: (res) => res.setHeader("X-Content-Type-Options", "nosniff")
    })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
    res.status(200).send("Backend is running!");
});

// Register API routes
app.use("/", authRoutes);
app.use("/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/admin/returns", adminReturnRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/seller", sellerRoutes);
app.use("/api/notifications", notificationRoutes);

// Handle unknown endpoints
app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found."
    });
});

// Clean JSON errors (bad JSON body, oversized body, unexpected crash) instead
// of Express' default HTML page, which can expose file paths.
app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON in the request body." });
    }

    if (error.type === "entity.too.large") {
        return res.status(413).json({ message: "The request is too large." });
    }

    console.error("UNHANDLED ERROR:", error);

    return res.status(500).json({
        message: "Something went wrong. Please try again."
    });
});

process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED REJECTION:", reason);
});

if (!process.env.AUTH_SECRET) {
    console.warn(
        "AUTH_SECRET is not set in backend/.env: logins reset every time the server restarts."
    );
}

// Create the lockout / password-reset tables if needed, then start listening.
ensureSecuritySchema()
    .then(startSecurityCleanup)
    .catch((error) =>
        console.error(
            "SECURITY SCHEMA ERROR (run backend/migrations/005_security.sql by hand):",
            error.message
        )
    )
    .finally(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    });