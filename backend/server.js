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

const app = express();
const PORT = process.env.PORT || 5000;

// Global middleware
app.use(cors());

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

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});