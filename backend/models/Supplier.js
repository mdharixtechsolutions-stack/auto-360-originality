import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  code: { type: String, default: "" },
  contactPerson: { type: String, default: "" },
  mobile: { type: String, default: "" },
  email: { type: String, default: "" },
  gstNo: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "Tamil Nadu" },
  pincode: { type: String, default: "" },
  status: { type: String, default: "Active" },
  openingBalance: { type: Number, default: 0 },
  balanceType: { type: String, default: "Credit" },
  branch: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Supplier = mongoose.models.Supplier || mongoose.model("Supplier", supplierSchema);
