import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, default: "" },
  mobile: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "Tamil Nadu" },
  pincode: { type: String, default: "" },
  gstNo: { type: String, default: "" },
  openingBalance: { type: Number, default: 0 },
  balanceType: { type: String, default: "Debit" },
  status: { type: String, default: "Active" },
  branch: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Customer = mongoose.models.Customer || mongoose.model("Customer", customerSchema);
