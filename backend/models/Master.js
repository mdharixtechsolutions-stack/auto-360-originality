import mongoose from "mongoose";

const masterSchema = new mongoose.Schema({
  type: { type: String, required: true }, // city, area, subarea, vehicle, etc.
  id: { type: String, required: true },
  name: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Master = mongoose.models.Master || mongoose.model("Master", masterSchema);
