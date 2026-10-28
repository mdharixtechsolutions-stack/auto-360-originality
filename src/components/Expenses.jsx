import { useState, useMemo } from "react";
import { Plus, Search, TrendingDown, IndianRupee, Tag, MoreVertical } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { hasModulePermission } from "../lib/permissions";
export default function Expenses({
  expenses = [],
  onUpdateExpenses,
  onNavigate,
  vehicles = [],
  currentUser,
  currentBranch,
  selectedBranch,
  onRefreshData
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    category: "Fuel",
    amount: "",
    description: "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    vehicleId: ""
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredExpenses = useMemo(
    () => (expenses || []).filter((e) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (e.description || "").toLowerCase().includes(q) || (e.id || "").toLowerCase().includes(q);
      const matchesCategory = activeCategory === "All" || (e.category || "").toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    }),
    [expenses, searchQuery, activeCategory]
  );

  const stats = useMemo(() => {
    const list = expenses || [];
    const currentList = activeCategory === "All"
      ? list
      : list.filter((e) => (e.category || "").toLowerCase() === activeCategory.toLowerCase());
    const total = currentList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const marketing = list.filter((e) => (e.category || "").toLowerCase() === "marketing").reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const salary = list.filter((e) => (e.category || "").toLowerCase() === "salary").reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const fuel = list.filter((e) => (e.category || "").toLowerCase() === "fuel").reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    return { total, marketing, salary, fuel, count: currentList.length, overallCount: list.length };
  }, [expenses, activeCategory]);

  const categories = ["All", "Fuel", "Salary", "Marketing", "Maintenance", "Rent", "Utilities", "Other"];

  const handleSaveExpense = async () => {
    if (!formData.amount || !formData.description) return;
    const branchToUse = currentBranch || selectedBranch || currentUser?.branch || "Coimbatore";
    const newExpense = {
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      date: formData.date,
      vehicleId: formData.vehicleId || "",
      staff: currentUser?.name || "Admin",
      branch: branchToUse
    };
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExpense)
      });
      if (res.ok) {
        const savedExpense = await res.json();
        if (onUpdateExpenses) onUpdateExpenses((prev) => [savedExpense, ...(prev || [])]);
      } else {
        const savedExpense = { id: `E-${2000 + (expenses || []).length + 1}`, ...newExpense };
        if (onUpdateExpenses) onUpdateExpenses((prev) => [savedExpense, ...(prev || [])]);
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
      const savedExpense = { id: `E-${2000 + (expenses || []).length + 1}`, ...newExpense };
      if (onUpdateExpenses) onUpdateExpenses((prev) => [savedExpense, ...(prev || [])]);
    }
    if (onRefreshData) onRefreshData();
    setSuccessMessage("Success: Business expense recorded successfully!");
    setTimeout(() => setSuccessMessage(""), 6000);
    setShowAddModal(false);
    setFormData({
      category: "Fuel",
      amount: "",
      description: "",
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      vehicleId: ""
    });
  };

  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Expenses</h2>
          <p className="text-sm text-slate-500">Track business costs and overheads</p>
        </div>
        {hasModulePermission(currentUser, "expenses", "create") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus size={20} />
            Add Expense
          </button>
        )}
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm">
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-800 font-extrabold text-sm ml-4">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Expenses</p>
            <p className="text-xl font-extrabold text-slate-900">₹{stats.total.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-50 text-brand-500">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Marketing</p>
            <p className="text-xl font-extrabold text-slate-900">₹{stats.marketing.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Salaries</p>
            <p className="text-xl font-extrabold text-slate-900">₹{stats.salary.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-50 text-slate-500">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transactions</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.count}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search expenses by description or ID..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
  />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
          {categories.map((cat) => <button
    key={cat}
    onClick={() => setActiveCategory(cat)}
    className={cn(
      "whitespace-nowrap px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
      activeCategory === cat ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
    )}
  >
              {cat}
            </button>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr role="presentation" className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Expense ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category & Description</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium text-sm">
                    No expense records found matching current category.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const linkedVehicle = vehicles.find((v) => v.id === expense.vehicleId);
                  return (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{expense.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                          {expense.category}
                        </span>
                        <p className="text-sm text-slate-600">{expense.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {linkedVehicle ? <div className="flex flex-col">
                          <span className="text-sm font-bold text-brand-600">{linkedVehicle.name}</span>
                          <span className="text-[10px] text-slate-500 uppercase font-bold">{linkedVehicle.regNo}</span>
                        </div> : <span className="text-xs text-slate-400 italic">Common Expense</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm font-bold text-rose-600">
                        <IndianRupee size={14} />
                        {expense.amount.toLocaleString("en-IN")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500">{expense.date}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Add Expense Modal */
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
    className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl p-8"
  >
              <h3 className="text-xl font-bold text-slate-900 mb-6">Add New Expense</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Category</label>
                  <select
    value={formData.category}
    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  >
                    <option>Fuel</option>
                    <option>Salary</option>
                    <option>Marketing</option>
                    <option>Maintenance</option>
                    <option>Rent</option>
                    <option>Utilities</option>
                    <option>Miscellaneous</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Link to Vehicle (Optional)</label>
                  <select
    value={formData.vehicleId}
    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  >
                    <option value="">None</option>
                    {vehicles.filter((v) => !v.isDeleted).map((v) => <option key={v.id} value={v.id}>{v.name} ({v.regNo})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Amount (₹)</label>
                  <input
    type="number"
    value={formData.amount}
    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="Enter amount"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Description</label>
                  <textarea
    rows={3}
    value={formData.description}
    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="Enter expense details"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Date</label>
                  <input
    type="date"
    value={formData.date}
    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button
    onClick={() => {
      handleSaveExpense();
      onNavigate("accounts", {
        accountsTab: "voucher",
        voucherData: {
          type: "Payment",
          ledger: formData.category === "Maintenance" ? "Vehicle Maintenance" : formData.category === "Marketing" ? "Marketing Expense" : formData.category === "Salary" ? "Salaries Account" : "Direct Expenses",
          amount: formData.amount,
          narration: formData.description,
          date: formData.date
        }
      });
    }}
    className="px-6 py-2.5 text-sm font-bold bg-brand-50 text-brand-600 border border-brand-200 rounded-xl hover:bg-brand-100 transition-all"
  >
                  Save & Manage in Accounts
                </button>
                <button
    onClick={handleSaveExpense}
    className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200"
  >
                  Save Expense
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>
    </div>;
}
