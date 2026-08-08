import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  payment_id: { type: String, default: "" },
  type: { type: String, default: "Payment" },
  party_type: { type: String, default: "Supplier" },
  party_id: { type: String, default: "" },
  party_name: { type: String, default: "" },
  amount: { type: Number, default: 0 },
  payment_mode: { type: String, default: "Cash" },
  reference_no: { type: String, default: "" },
  payment_date: { type: String, default: "" },
  description: { type: String, default: "" },
  branch_id: { type: String, default: "BR001" },
  branch: { type: String, default: "Coimbatore" },
  createdBy: { type: String, default: "system" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
