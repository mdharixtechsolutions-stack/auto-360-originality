import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // 'business_profile', 'general_settings', 'license'
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema);
