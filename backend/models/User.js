import mongoose from "mongoose";

const userPermissionSchema = new mongoose.Schema({
  id: String,
  module_name: { type: String, required: true },
  can_view: { type: Boolean, default: true },
  can_create: { type: Boolean, default: false },
  can_edit: { type: Boolean, default: false },
  can_delete: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, default: "" },
  mobile: { type: String, default: "" },
  role: { type: String, required: true, default: "Staff" },
  branch: { type: String, default: "Coimbatore" },
  branch_id: { type: String, default: "BR001" },
  isActive: { type: Boolean, default: true },
  loginTimeFrom: { type: String, default: "00:00" },
  loginTimeTo: { type: String, default: "23:59" },
  permissions: [{ type: String }],
  modulePermissions: [userPermissionSchema],
  password: { type: String, required: true },
  createdBy: { type: String, default: "system" },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
