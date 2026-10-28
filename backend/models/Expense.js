import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  expense_id: { type: String, default: "" },
  expense_head: { type: String, default: "" },
  category: { type: String, default: "General" },
  amount: { type: Number, default: 0 },
  payment_mode: { type: String, default: "Cash" },
  reference_no: { type: String, default: "" },
  expense_date: { type: String, default: "" },
  description: { type: String, default: "" },
  branch_id: { type: String, default: "BR001" },
  branch: { type: String, default: "Tiruppur" },
  createdBy: { type: String, default: "system" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
