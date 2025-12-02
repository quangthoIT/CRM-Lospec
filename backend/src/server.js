import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import supplierRouter from "./routes/supplierRoute.js";
import warehouseRouter from "./routes/warehouseRoute.js";

dotenv.config();
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running...");
});

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/suppliers", supplierRouter);
app.use("/api/warehouse", warehouseRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
