import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  group: { type: String, default: "General" },
  balance: { type: Number, default: 0 },
  type: { type: String, default: "Debit" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const Ledger = mongoose.models.Ledger || mongoose.model("Ledger", ledgerSchema);
