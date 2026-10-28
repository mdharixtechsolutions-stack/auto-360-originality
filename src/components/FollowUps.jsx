import { useState, useMemo } from "react";
import { Plus, Calendar, User, Clock, CheckCircle2, AlertCircle, Phone, MessageSquare, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { hasModulePermission } from "../lib/permissions";
const getInitialMockFollowUps = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split("T")[0];

  return [
    {
      id: "F-1",
      customer: "Amit Kumar",
      notes: "Interested in Tata Nexon, requested test drive",
      nextDate: nextWeekStr,
      staff: "Sarah Sales",
      status: "Pending"
    },
    {
      id: "F-2",
      customer: "Suresh Raina",
      notes: "Negotiating price for BMW X5",
      nextDate: todayStr,
      staff: "John Admin",
      status: "Today"
    }
  ];
};

export default function FollowUps({ customers = [], currentUser, initialFollowUpCustomer }) {
  const [followUps, setFollowUps] = useState(getInitialMockFollowUps);
  const [showAddModal, setShowAddModal] = useState(Boolean(initialFollowUpCustomer));

  const todayStr = useMemo(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [formData, setFormData] = useState({
    customerId: initialFollowUpCustomer?.id || "",
    customerName: initialFollowUpCustomer?.name || initialFollowUpCustomer?.customer_name || "",
    nextDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    staff: currentUser?.name || "John Admin",
    notes: ""
  });
  const [customerSearch, setCustomerSearch] = useState(initialFollowUpCustomer?.name || "");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredCustomers = useMemo(() => {
    const q = (customerSearch || "").toLowerCase();
    const list = (customers || []).filter((c) => !c.isDeleted);
    if (!q) return list;
    return list.filter(
      (c) =>
        (c.name || c.customer_name || "").toLowerCase().includes(q) ||
        (c.mobile || c.customer_mobile || "").includes(q)
    );
  }, [customers, customerSearch]);

  const filteredFollowUps = useMemo(
    () => followUps.filter((f) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || (f.customer || "").toLowerCase().includes(q) || (f.notes || "").toLowerCase().includes(q) || (f.staff || "").toLowerCase().includes(q);

      const isToday = f.status === "Today" || f.nextDate === todayStr;
      // Strict upcoming: next date must be in the future, and status not completed
      const isUpcoming = (f.status === "Pending" || f.status === "Upcoming") && f.nextDate > todayStr;
      const isCompleted = f.status === "Completed";

      let matchesTab = true;
      if (activeTab === "today") {
        matchesTab = isToday;
      } else if (activeTab === "upcoming") {
        matchesTab = isUpcoming;
      } else if (activeTab === "completed") {
        matchesTab = isCompleted;
      }

      return matchesSearch && matchesTab;
    }),
    [followUps, searchQuery, activeTab, todayStr]
  );

  const stats = useMemo(() => ({
    today: followUps.filter((f) => f.status === "Today" || f.nextDate === todayStr).length,
    upcoming: followUps.filter((f) => (f.status === "Pending" || f.status === "Upcoming") && f.nextDate > todayStr).length,
    completed: followUps.filter((f) => f.status === "Completed").length
  }), [followUps, todayStr]);
  const handleSchedule = () => {
    if (!formData.customerName || !formData.notes) return;
    const newFollowUp = {
      id: `F-${followUps.length + 1}`,
      customer: formData.customerName,
      notes: formData.notes,
      nextDate: formData.nextDate,
      staff: formData.staff,
      status: "Pending"
    };
    setFollowUps((prev) => [newFollowUp, ...prev]);
    setShowAddModal(false);
    setFormData({
      customerId: "",
      customerName: "",
      nextDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      staff: "John Admin",
      notes: ""
    });
    setCustomerSearch("");
  };
  const handleComplete = (id) => {
    setFollowUps((prev) => prev.map((f) => f.id === id ? { ...f, status: "Completed" } : f));
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Follow-ups</h2>
          <p className="text-sm text-slate-500">Manage lead interactions and reminders</p>
        </div>
        {hasModulePermission(currentUser, "followups", "create") && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus size={20} />
            New Follow-up
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-500">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Today</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.today}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-50 text-brand-500">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Upcoming</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.upcoming}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-500">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.completed}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search by customer, notes, or staff..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
  />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto">
          {["all", "today", "upcoming", "completed"].map((tab) => <button
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

      <div className="space-y-4">
        {filteredFollowUps.map((item) => <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center gap-6 hover:shadow-md transition-shadow">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className={cn(
    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
    item.status === "Today" ? "bg-rose-100 text-rose-700" : item.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-brand-100 text-brand-700"
  )}>
                  {item.status}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{item.customer}</h3>
              </div>
              <p className="text-sm text-slate-600 flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400" />
                {item.notes}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Date</p>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Calendar size={16} className="text-brand-600" />
                  {item.nextDate}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned To</p>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <User size={16} className="text-slate-400" />
                  {item.staff}
                </div>
              </div>
              <div className="flex gap-2">
                {item.status !== "Completed" && hasModulePermission(currentUser, "followups", "edit") && (
                  <button
                    onClick={() => handleComplete(item.id)}
                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                    title="Mark Complete"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                <button className="p-2 text-brand-600 hover:bg-brand-50 rounded-xl transition-colors" title="WhatsApp Reminder">
                  <Phone size={20} />
                </button>
              </div>
            </div>
          </div>)}
      </div>

      {
    /* New Follow-up Modal */
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
              <h3 className="text-xl font-bold text-slate-900 mb-6">Schedule New Follow-up</h3>
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="text-sm font-bold text-slate-700">Customer</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
    type="text"
    value={customerSearch || formData.customerName}
    onChange={(e) => {
      setCustomerSearch(e.target.value);
      setShowCustomerDropdown(true);
      if (!e.target.value) {
        setFormData((prev) => ({ ...prev, customerId: "", customerName: "" }));
      }
    }}
    onFocus={() => setShowCustomerDropdown(true)}
    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="Search customer..."
  />
                    {showCustomerDropdown && customerSearch && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, customerId: c.id, customerName: c.name || c.customer_name }));
                                setCustomerSearch(c.name || c.customer_name);
                                setShowCustomerDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0"
                            >
                              <p className="font-bold text-slate-900">{c.name || c.customer_name}</p>
                              <p className="text-xs text-slate-500">{c.mobile || c.customer_mobile || "Customer"}</p>
                            </button>
                          ))
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, customerId: "CUST-DIRECT", customerName: customerSearch }));
                              setShowCustomerDropdown(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-brand-50 text-xs font-bold text-brand-700"
                          >
                            Select "{customerSearch}" as customer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Next Follow-up Date</label>
                  <input
    type="date"
    value={formData.nextDate}
    onChange={(e) => setFormData({ ...formData, nextDate: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Assigned Staff</label>
                  <select
    value={formData.staff}
    onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  >
                    <option>John Admin</option>
                    <option>Sarah Sales</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Notes / Requirement</label>
                  <textarea
    rows={3}
    value={formData.notes}
    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="Enter follow-up notes"
  />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShowAddModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                <button
    onClick={handleSchedule}
    className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200"
  >
                  Schedule
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>
    </div>;
}
