import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  purchase_id: { type: String, default: "" },
  reg_no: { type: String, default: "" },
  state_code: { type: String, default: "TN" },
  vehicle_id: { type: String, default: "" },
  model: { type: String, default: "" },
  brand: { type: String, default: "" },
  variant: { type: String, default: "" },
  year: { type: String, default: "" },
  color: { type: String, default: "" },
  fuel_type: { type: String, default: "" },
  km_driven: { type: Number, default: 0 },
  chasis_no: { type: String, default: "" },
  engine_no: { type: String, default: "" },
  owner_type: { type: String, default: "1st Owner" },
  purchase_price: { type: Number, default: 0 },
  advance_price: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  purchase_date: { type: String, default: "" },
  supplier_id: { type: String, default: "" },
  supplier_name: { type: String, default: "" },
  branch_id: { type: String, default: "BR001" },
  branch: { type: String, default: "Coimbatore" },
  status: { type: String, default: "Available" },
  vehicle_image: { type: String, default: "" },
  vehicle_images: {
    front: { type: String, default: "" },
    back: { type: String, default: "" },
    left: { type: String, default: "" },
    right: { type: String, default: "" },
    interior: { type: String, default: "" },
    engine: { type: String, default: "" }
  },
  transfer_status: { type: String, enum: ["Yes", "No"], default: "No" },
  transfer_date: { type: String, default: "" },
  transfer_remarks: { type: String, default: "" },
  transferred_by: { type: String, default: "" },
  notes: { type: String, default: "" },
  documents: [{ type: String }],
  createdBy: { type: String, default: "system" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Purchase = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
