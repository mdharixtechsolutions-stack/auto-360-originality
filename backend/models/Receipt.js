import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  receipt_id: { type: String, default: "" },
  party_type: { type: String, default: "Customer" },
  party_id: { type: String, default: "" },
  party_name: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  payment_mode: { type: String, default: "Cash" },
  reference_no: { type: String, default: "" },
  receipt_date: { type: String, default: "" },
  description: { type: String, default: "" },
  branch_id: { type: String, default: "BR001" },
  branch: { type: String, default: "Coimbatore" },
  createdBy: { type: String, default: "system" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Receipt = mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);
