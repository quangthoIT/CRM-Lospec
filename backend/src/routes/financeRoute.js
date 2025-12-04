import express from "express";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getFinanceSummary,
  getCashFlowChart,
} from "../controllers/financeController.js";
import { authMiddleware } from "../middleware/auth.js";
import { checkRole } from "../middleware/role.js";

const financeRouter = express.Router();

financeRouter.use(authMiddleware);

// --- Expenses Management ---
financeRouter.get("/expenses", getExpenses);
financeRouter.post("/expenses", checkRole(["admin", "manager"]), createExpense);
financeRouter.put(
  "/expenses/:id",
  checkRole(["admin", "manager"]),
  updateExpense
);
financeRouter.delete("/expenses/:id", checkRole(["admin"]), deleteExpense);

// --- Financial Reports ---
financeRouter.get(
  "/summary",
  checkRole(["admin", "manager"]),
  getFinanceSummary
);
financeRouter.get("/chart", checkRole(["admin", "manager"]), getCashFlowChart);

export default financeRouter;
