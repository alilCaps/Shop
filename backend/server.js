const express = require("express");
const cors = require("cors");

// Import API routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const customerRoutes = require("./routes/customerRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = 5000;

// Global middleware
app.use(cors());
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
app.use("/api/admin", adminRoutes);

// Handle unknown endpoints
app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found."
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});