import { useState, useMemo } from "react";
import { Plus, Shield, Mail, Phone, MoreVertical, UserX, Clock, FileText, Search, AlertCircle, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { hasModulePermission } from "../lib/permissions";

const PERMISSION_MODULES = [
  { id: "dashboard", label: "Dashboard" },
  { id: "customers", label: "Customers" },
  { id: "followups", label: "Follow Ups" },
  { id: "purchase", label: "Purchase" },
  { id: "sales", label: "Sales" },
  { id: "binding", label: "Binding Loans" },
  { id: "expenses", label: "Expenses" },
  { id: "accounts", label: "Accounts" },
  { id: "reports", label: "Reports" },
  { id: "users", label: "Staff Users" },
  { id: "settings", label: "Settings" },
  { id: "masters", label: "Masters" }
];

export default function Staff({ staff, onUpdateStaff, branches = [], currentUser }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editingStaff, setEditingStaff] = useState(null);
  const [detailedPermissions, setDetailedPermissions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const filteredStaff = useMemo(
    () => staff.filter((member) => {
      if (member.isDeleted) return false;
      const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || member.username.toLowerCase().includes(searchQuery.toLowerCase()) || member.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || activeTab === "active" && member.isActive || activeTab === "inactive" && !member.isActive;
      return matchesSearch && matchesTab;
    }),
    [staff, searchQuery, activeTab]
  );
  const stats = useMemo(() => ({
    total: staff.filter((s) => !s.isDeleted).length,
    active: staff.filter((s) => s.isActive && !s.isDeleted).length,
    inactive: staff.filter((s) => !s.isActive && !s.isDeleted).length,
    admins: staff.filter((s) => s.role === "Admin" && !s.isDeleted).length
  }), [staff]);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    mobile: "",
    role: "Sales",
    branch: "Tiruppur",
    loginFrom: "09:00",
    loginTo: "18:00",
    password: ""
  });
  const handleEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      name: member.name,
      username: member.username,
      email: member.email,
      mobile: member.mobile,
      role: member.role,
      branch: member.branch,
      loginFrom: member.loginFrom || member.loginTimeFrom || "09:00",
      loginTo: member.loginTo || member.loginTimeTo || "18:00",
      password: member.password || ""
    });

    let matrix = member.detailedPermissions || [];
    if (matrix.length === 0) {
      // Fallback fallback to legacy flat permissions list
      const flatList = member.permissions || [];
      matrix = PERMISSION_MODULES.map(m => {
        const isPermitted = flatList.includes(m.id);
        return {
          module_name: m.id,
          can_view: isPermitted,
          can_create: isPermitted,
          can_edit: isPermitted,
          can_delete: false
        };
      });
    } else {
      // Ensure all 12 modules exist inside the local matrix
      const modulesPresent = matrix.map(p => p.module_name);
      PERMISSION_MODULES.forEach(m => {
        if (!modulesPresent.includes(m.id)) {
          matrix.push({
            module_name: m.id,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false
          });
        }
      });
    }
    setDetailedPermissions(matrix);
    setShowAddModal(true);
  };
  const handleSaveStaff = async () => {
    try {
      const payload = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        branch: formData.branch,
        loginTimeFrom: formData.loginFrom,
        loginTimeTo: formData.loginTo,
        password: formData.password || "password",
        detailedPermissions: detailedPermissions,
        isActive: true
      };

      if (editingStaff) {
        const res = await fetch(`/api/staff/${editingStaff.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            isActive: editingStaff.isActive
          })
        });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Failed to update staff.");
          return;
        }
        const updated = await res.json();
        onUpdateStaff((prev) => prev.map((s) => s.id === editingStaff.id ? updated : s));
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json();
          alert(errData.error || "Failed to add staff.");
          return;
        }
        const created = await res.json();
        onUpdateStaff((prev) => [created, ...prev]);
      }

      setShowAddModal(false);
      setEditingStaff(null);
      setFormData({
        name: "",
        username: "",
        email: "",
        mobile: "",
        role: "Sales",
        branch: branches && branches.length > 0 ? branches[0].name : "Tiruppur",
        loginFrom: "09:00",
        loginTo: "18:00",
        password: ""
      });
      setDetailedPermissions([]);
    } catch (e) {
      console.error(e);
      alert("Error saving staff user details");
    }
  };
  const toggleStaffStatus = async (id) => {
    const target = staff.find((s) => s.id === id);
    if (!target) return;
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !target.isActive })
      });
      if (res.ok) {
        const updated = await res.json();
        onUpdateStaff((prev) => prev.map((s) => s.id === id ? updated : s));
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleDeleteStaff = async (id) => {
    if (id === "S-1" || id === "1" || id === "U1") {
      alert("Cannot delete the primary admin account.");
      return;
    }
    setDeleteConfirm({
      isOpen: true,
      message: "Are you sure you want to delete this record?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
          if (res.ok) {
            onUpdateStaff((prev) => prev.map((s) => s.id === id ? { ...s, isDeleted: true } : s));
          } else {
            alert("Error deleting staff");
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
  };
  const generateSalarySlip = (member) => {
    const doc = new jsPDF();
    const date = (/* @__PURE__ */ new Date()).toLocaleDateString();
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("AUTO CONSULTANCY", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("123, Auto Plaza, Main Road, Chennai - 600001", 105, 28, { align: "center" });
    doc.text("GST: 22AAAAA0000A1Z5 | Phone: +91 98765 43210", 105, 34, { align: "center" });
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 40, 190, 40);
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text("SALARY SLIP", 105, 50, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Employee Name: ${member.name}`, 20, 65);
    doc.text(`Employee ID: ${member.id}`, 20, 72);
    doc.text(`Designation: ${member.role}`, 20, 79);
    doc.text(`Branch: ${member.branch}`, 20, 86);
    doc.text(`Date: ${date}`, 140, 65);
    doc.text(`Month: ${(/* @__PURE__ */ new Date()).toLocaleString("default", { month: "long", year: "numeric" })}`, 140, 72);
    autoTable(doc, {
      startY: 95,
      head: [["Description", "Earnings (INR)", "Deductions (INR)"]],
      body: [
        ["Basic Salary", "25,000.00", "0.00"],
        ["HRA", "5,000.00", "0.00"],
        ["Conveyance", "2,000.00", "0.00"],
        ["Professional Tax", "0.00", "200.00"],
        ["PF Contribution", "0.00", "1,800.00"],
        ["TDS", "0.00", "0.00"]
      ],
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255] }
      // brand-600
    });
    const finalY = doc.lastAutoTable.finalY || 150;
    doc.setFontSize(11);
    doc.text("Total Earnings: INR 32,000.00", 120, finalY + 15);
    doc.text("Total Deductions: INR 2,000.00", 120, finalY + 22);
    doc.setFontSize(12);
    doc.setTextColor(79, 70, 229);
    doc.text("NET SALARY: INR 30,000.00", 120, finalY + 32);
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text("This is a computer generated document and does not require a signature.", 105, 280, { align: "center" });
    doc.save(`Salary_Slip_${member.name.replace(" ", "_")}_${date}.pdf`);
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Staff Management</h2>
          <p className="text-sm text-slate-500">Manage user roles, attendance, and system access</p>
        </div>
        {hasModulePermission(currentUser, "users", "create") && (
          <button
            onClick={() => {
              setEditingStaff(null);
              setFormData({
                name: "",
                username: "",
                email: "",
                mobile: "",
                role: "Sales",
                branch: branches && branches.length > 0 ? branches[0].name : "Tiruppur",
                loginFrom: "09:00",
                loginTo: "18:00",
                password: ""
              });
              setDetailedPermissions(PERMISSION_MODULES.map(m => ({
                module_name: m.id,
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false
              })));
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 cursor-pointer"
          >
            <Plus size={20} />
            Add Staff
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Staff</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.total}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Active</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.active}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-rose-600">Inactive</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.inactive}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-brand-600">Admins</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.admins}</h3>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search staff by name, username, or role..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
  />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto">
          {["all", "active", "inactive"].map((tab) => <button
    key={tab}
    onClick={() => setActiveTab(tab)}
    className={cn(
      "flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
      activeTab === tab ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
    )}
  >
              {tab}
            </button>)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => <div key={member.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-xl">
                {member.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex gap-2">
                <button
    onClick={() => toggleStaffStatus(member.id)}
    className={cn(
      "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors",
      member.isActive ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
    )}
    title="Toggle Status"
  >
                  {member.isActive ? "Active" : "Inactive"}
                </button>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{member.name}</h3>
                <p className="text-xs text-slate-400 font-medium">@{member.username}</p>
                <div className="flex items-center gap-1.5 text-brand-600 mt-1">
                  <Shield size={14} />
                  <span className="text-xs font-bold uppercase tracking-wider">{member.role}</span>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  {member.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  {member.mobile}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock size={16} className="text-slate-400" />
                  {member.loginFrom} - {member.loginTo}
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-2">
                {hasModulePermission(currentUser, "users", "edit") && (
                  <button
                    onClick={() => handleEdit(member)}
                    className="flex-1 py-2 text-xs font-bold text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedStaff(member);
                    setShowAttendanceModal(true);
                  }}
                  className="px-3 py-2 text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                  title="Attendance"
                >
                  <Clock size={18} />
                </button>
                <button
                  onClick={() => generateSalarySlip(member)}
                  className="px-3 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                  title="Salary Slip"
                >
                  <FileText size={18} />
                </button>
                {hasModulePermission(currentUser, "users", "delete") && (
                  <button
                    onClick={() => handleDeleteStaff(member.id)}
                    className="px-3 py-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <UserX size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>)}
      </div>

      {
    /* Add Staff Modal */
  }
      <AnimatePresence>
        {showAddModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowAddModal(false)}
    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]"
  >
              <h3 className="text-xl font-bold text-slate-900 mb-6">
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Full Name</label>
                  <input
    type="text"
    value={formData.name}
    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="Enter name"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Username</label>
                  <input
    type="text"
    value={formData.username}
    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="john_doe"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Email Address</label>
                  <input
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="staff@auto360.com"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Mobile Number</label>
                  <input
    type="tel"
    value={formData.mobile}
    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="9876543210"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Role</label>
                  <select
    value={formData.role}
    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  >
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Sales</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Assigned Branch</label>
                  <select
    value={formData.branch}
    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none animate-none"
  >
                    {branches && branches.length > 0 ? (
                      branches.map((b) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))
                    ) : (
                      <>
                        <option>Tiruppur</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Login Time (From)</label>
                  <input
    type="time"
    value={formData.loginFrom}
    onChange={(e) => setFormData({ ...formData, loginFrom: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Login Time (To)</label>
                  <input
    type="time"
    value={formData.loginTo}
    onChange={(e) => setFormData({ ...formData, loginTo: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700">Password</label>
                  <input
    type="password"
    title="Password"
    value={formData.password}
    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="••••••••"
  />
                </div>

                {
    /* Advanced Grular Permissions Section */
  }
                <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex sm:items-center justify-between flex-col sm:flex-row gap-2">
                    <div>
                      <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <ShieldAlert size={16} className="text-brand-600" />
                        Module-Wise Action Permissions Matrix
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">Define granular access rules for viewing, inserting, modifying and removing data records.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const allViewOn = detailedPermissions.every(p => p.can_view);
                        setDetailedPermissions(prev => prev.map(p => ({
                          ...p,
                          can_view: !allViewOn,
                          can_create: !allViewOn ? p.can_create : false,
                          can_edit: !allViewOn ? p.can_edit : false,
                          can_delete: !allViewOn ? p.can_delete : false
                        })));
                      }}
                      className="text-xs font-black text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer outline-none"
                    >
                      {detailedPermissions.every(p => p.can_view) ? "Revoke All Views" : "Authorize All Views"}
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
                          <tr>
                            <th className="py-3 px-4 font-bold text-slate-600">Module Name</th>
                            <th className="py-3 px-4 text-center font-bold text-slate-600 w-20">View</th>
                            <th className="py-3 px-4 text-center font-bold text-slate-600 w-20">Create</th>
                            <th className="py-3 px-4 text-center font-bold text-slate-600 w-20">Edit</th>
                            <th className="py-3 px-4 text-center font-bold text-slate-600 w-20">Delete</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailedPermissions.map((perm, index) => {
                            const moduleLabel = PERMISSION_MODULES.find(m => m.id === perm.module_name)?.label || perm.module_name;
                            
                            // Specific restriction helpers: Dashboard, Reports, and Settings don't have some standard CRUD actions
                            const hasCreate = !["dashboard", "reports", "settings"].includes(perm.module_name);
                            const hasEdit = !["dashboard", "reports"].includes(perm.module_name);
                            const hasDelete = !["dashboard", "reports", "settings"].includes(perm.module_name);

                            return (
                              <tr key={perm.module_name} className="hover:bg-slate-50/40 transition-colors">
                                <td className="py-3 px-4 font-bold text-slate-800 text-xs capitalize">{moduleLabel}</td>
                                
                                {/* View Access Checkbox */}
                                <td className="py-2.5 px-4 text-center">
                                  <div className="flex justify-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.can_view}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setDetailedPermissions(prev => prev.map((p, i) => i === index ? {
                                          ...p,
                                          can_view: checked,
                                          can_create: checked ? p.can_create : false,
                                          can_edit: checked ? p.can_edit : false,
                                          can_delete: checked ? p.can_delete : false
                                        } : p));
                                      }}
                                      className="w-4.5 h-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                                    />
                                  </div>
                                </td>

                                {/* Create Access Checkbox */}
                                <td className="py-2.5 px-4 text-center">
                                  {hasCreate ? (
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        checked={perm.can_create}
                                        disabled={!perm.can_view}
                                        onChange={(e) => {
                                          setDetailedPermissions(prev => prev.map((p, i) => i === index ? {
                                            ...p,
                                            can_create: e.target.checked
                                          } : p));
                                        }}
                                        className="w-4.5 h-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs font-semibold">-</span>
                                  )}
                                </td>

                                {/* Edit Access Checkbox */}
                                <td className="py-2.5 px-4 text-center">
                                  {hasEdit ? (
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        checked={perm.can_edit}
                                        disabled={!perm.can_view}
                                        onChange={(e) => {
                                          setDetailedPermissions(prev => prev.map((p, i) => i === index ? {
                                            ...p,
                                            can_edit: e.target.checked
                                          } : p));
                                        }}
                                        className="w-4.5 h-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs font-semibold">-</span>
                                  )}
                                </td>

                                {/* Delete Access Checkbox */}
                                <td className="py-2.5 px-4 text-center">
                                  {hasDelete ? (
                                    <div className="flex justify-center">
                                      <input
                                        type="checkbox"
                                        checked={perm.can_delete}
                                        disabled={!perm.can_view}
                                        onChange={(e) => {
                                          setDetailedPermissions(prev => prev.map((p, i) => i === index ? {
                                            ...p,
                                            can_delete: e.target.checked
                                          } : p));
                                        }}
                                        className="w-4.5 h-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 text-xs font-semibold">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
    onClick={() => {
      setShowAddModal(false);
      setEditingStaff(null);
    }}
    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
  >
                  Cancel
                </button>
                <button
    onClick={handleSaveStaff}
    className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200"
  >
                  {editingStaff ? "Update Staff" : "Save Staff"}
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* Attendance Modal */
  }
      <AnimatePresence>
        {showAttendanceModal && selectedStaff && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowAttendanceModal(false)}
    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8"
  >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Staff Attendance</h3>
              <p className="text-sm text-slate-500 mb-6">Marking attendance for {selectedStaff.name}</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button className="p-4 rounded-xl border-2 border-emerald-100 bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors">
                    Present
                  </button>
                  <button className="p-4 rounded-xl border-2 border-rose-100 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition-colors">
                    Absent
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Notes (Optional)</label>
                  <textarea className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" rows={2} placeholder="Late entry, half day, etc." />
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowAttendanceModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Close</button>
                <button onClick={() => setShowAttendanceModal(false)} className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200">Save Record</button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* Global Delete Confirmation Dialog Box */
  }
      <AnimatePresence>
        {deleteConfirm && <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setDeleteConfirm(null)}
    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 15 }}
    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 text-left border border-slate-100"
  >
              <div className="flex items-center gap-3 text-red-600 mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={24} />
                <h3 className="text-lg font-extrabold text-slate-800">Confirm Delete</h3>
              </div>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                {deleteConfirm.message || "Are you sure you want to delete this record?"}
              </p>
              <div className="flex gap-3 justify-end">
                <button
    type="button"
    onClick={() => setDeleteConfirm(null)}
    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all uppercase tracking-wider"
  >
                  Cancel
                </button>
                <button
    type="button"
    onClick={() => {
      deleteConfirm.onConfirm();
      setDeleteConfirm(null);
    }}
    className="px-5 py-2.5 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all uppercase tracking-wider"
  >
                  Yes Delete
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

    </div>;
}
