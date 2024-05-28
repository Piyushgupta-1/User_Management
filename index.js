const express = require("express");
const app = express();
const db = require("./db");

// for user route
const userRoute = require("./routes/userRoutes");
app.use("/", userRoute);

// For admin route
const adminRoute = require("./routes/adminRoute");
app.use("/admin", adminRoute);

app.listen(8000, () => {
    console.log("listening on port 8000");
});