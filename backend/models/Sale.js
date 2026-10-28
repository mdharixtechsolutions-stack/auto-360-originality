import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sale_id: { type: String, default: "" },
  invoice_no: { type: String, default: "" },
  purchase_id: { type: String, default: "" },
  reg_no: { type: String, default: "" },
  customer_id: { type: String, default: "" },
  customer_name: { type: String, default: "" },
  customer_mobile: { type: String, default: "" },
  sale_price: { type: Number, default: 0 },
  advance_amount: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  payment_mode: { type: String, default: "Cash" },
  sale_date: { type: String, default: "" },
  salesperson: { type: String, default: "" },
  branch_id: { type: String, default: "BR001" },
  branch: { type: String, default: "Tiruppur" },
  status: { type: String, default: "Completed" },
  notes: { type: String, default: "" },
  createdBy: { type: String, default: "system" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);
