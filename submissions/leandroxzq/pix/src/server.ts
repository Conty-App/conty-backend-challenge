import express from "express";
import dotenv from "dotenv/config";
import payoutRoutes from "./routes/payoutRoutes.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/payouts", payoutRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
