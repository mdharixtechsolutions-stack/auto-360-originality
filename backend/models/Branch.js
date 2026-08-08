import mongoose from "mongoose";

const branchSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobile: { type: String, default: "" },
  email: { type: String, default: "" },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  area: { type: String, default: "" },
  subArea: { type: String, default: "" },
  status: { type: String, default: "Active" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Branch = mongoose.models.Branch || mongoose.model("Branch", branchSchema);
