import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Upload,
  Eye,
  Download,
  AlertCircle,
  X,
  User,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { hasModulePermission } from "../lib/permissions";

export default function Customers({ currentUser, initialSearch, onUpdateCustomers }) {
  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);
  const [params, setParams] = useState({
    search: initialSearch || "",
    status: "",
    type: "",
    page: 1,
    limit: 10
  });

  useEffect(() => {
    if (initialSearch !== undefined) {
      setParams(p => ({ ...p, search: initialSearch }));
    }
  }, [initialSearch]);
  const [localFrom, setLocalFrom] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [localTo, setLocalTo] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const [fromDate, setFromDate] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [toDate, setToDate] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [formType, setFormType] = useState("Buy");
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formSource, setFormSource] = useState("Walk In");
  const [formAadhaar, setFormAadhaar] = useState("");
  const [formPan, setFormPan] = useState("");
  const [formCityId, setFormCityId] = useState("");
  const [formAreaId, setFormAreaId] = useState("");
  const [formSubAreaId, setFormSubAreaId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formStatus, setFormStatus] = useState("New Lead");
  const [formPreferredVehicle, setFormPreferredVehicle] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [aadhaarPhotoUrl, setAadhaarPhotoUrl] = useState("");
  const [panPhotoUrl, setPanPhotoUrl] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const photoInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const panInputRef = useRef(null);
  useEffect(() => {
    fetchCities();
  }, []);
  useEffect(() => {
    if (formCityId) {
      fetchAreasForCity(formCityId);
    } else {
      setAreas([]);
      setFormAreaId("");
      setFormSubAreaId("");
    }
  }, [formCityId]);
  useEffect(() => {
    if (formAreaId) {
      fetchSubAreasForArea(formAreaId);
    } else {
      setSubAreas([]);
      setFormSubAreaId("");
    }
  }, [formAreaId]);
  useEffect(() => {
    fetchCustomers();
  }, [params.search, params.status, params.type, params.page, params.limit, fromDate, toDate]);
  const safeFetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response, but received: ${contentType || "none"}`);
    }
    return res.json();
  };
  const fetchCities = async () => {
    try {
      const data = await safeFetchJson("/api/cities");
      setCities(data);
    } catch (e) {
      console.warn("Error fetching cities gracefully caught:", e);
    }
  };
  const fetchAreasForCity = async (cityId) => {
    try {
      const data = await safeFetchJson(`/api/areas?cityId=${cityId}`);
      setAreas(data);
    } catch (e) {
      console.warn("Error fetching areas gracefully caught:", e);
    }
  };
  const fetchSubAreasForArea = async (areaId) => {
    try {
      const data = await safeFetchJson(`/api/subareas?areaId=${areaId}`);
      setSubAreas(data);
    } catch (e) {
      console.warn("Error fetching subareas gracefully caught:", e);
    }
  };
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const fromQS = fromDate ? `&fromDate=${fromDate}` : "";
      const toQS = toDate ? `&toDate=${toDate}` : "";
      const queryStr = `?search=${encodeURIComponent(params.search)}&status=${params.status}&type=${params.type}&page=${params.page}&limit=${params.limit}${fromQS}${toQS}`;
      const result = await safeFetchJson(`/api/customers${queryStr}`);
      if (result && result.data && result.pagination) {
        setCustomers(result.data);
        setTotalCount(result.pagination.totalCount);
        setTotalPages(result.pagination.totalPages);
        
        if (onUpdateCustomers) {
          safeFetchJson("/api/customers?limit=150").then(dataCustomers => {
            if (dataCustomers && dataCustomers.data) {
              onUpdateCustomers(dataCustomers.data.map((item) => ({
                id: item.customer_id,
                name: item.customer_name,
                mobile: item.customer_mobile,
                address: item.address,
                requirement: item.customer_type,
                source: item.source,
                leadStatus: item.customer_status === "New Lead" ? "New" : item.customer_status === "Follow Up" ? "Follow-up" : item.customer_status === "Converted" ? "Converted" : "Closed",
                isDeleted: false,
                createdBy: "Admin",
                createdAt: item.created_at,
                branch: item.branch || "Coimbatore"
              })));
            }
          }).catch(err => console.warn("Failed sync to parent in Customers.jsx", err));
        }
      }
    } catch (e) {
      console.warn("Error fetching customers gracefully caught:", e);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchNextId = async () => {
    try {
      const data = await safeFetchJson("/api/customers/nextId");
      setFormId(data.nextId);
    } catch (e) {
      setFormId("CUS001");
    }
  };
  const handleOpenAddModal = async () => {
    setEditingCustomer(null);
    setFormErrors({});
    setUploadError(null);
    setFormType("Buy");
    await fetchNextId();
    setFormName("");
    setFormMobile("");
    setFormSource("Walk In");
    setFormAadhaar("");
    setFormPan("");
    setFormCityId("");
    setFormAreaId("");
    setFormSubAreaId("");
    setFormAddress("");
    setFormStatus("New Lead");
    setFormPreferredVehicle("");
    setFormRemarks("");
    setPhotoUrl("");
    setAadhaarPhotoUrl("");
    setPanPhotoUrl("");
    setShowFormModal(true);
  };
  const handleOpenEditModal = async (customer) => {
    setEditingCustomer(customer);
    setFormErrors({});
    setUploadError(null);
    setFormId(customer.customer_id);
    setFormType(customer.customer_type);
    setFormName(customer.customer_name);
    setFormMobile(customer.customer_mobile);
    setFormSource(customer.source);
    setFormAadhaar(customer.aadhaar_number || "");
    setFormPan(customer.pan_number || "");
    setFormCityId(customer.city_id || "");
    if (customer.city_id) {
      await fetchAreasForCity(customer.city_id);
    }
    setFormAreaId(customer.area_id || "");
    if (customer.area_id) {
      await fetchSubAreasForArea(customer.area_id);
    }
    setFormSubAreaId(customer.sub_area_id || "");
    setFormAddress(customer.address || "");
    setFormStatus(customer.customer_status);
    setFormPreferredVehicle(customer.preferred_vehicle || "");
    setFormRemarks(customer.remarks_notes || "");
    setPhotoUrl(customer.customer_photo || "");
    setAadhaarPhotoUrl(customer.aadhaar_photo || "");
    setPanPhotoUrl(customer.pan_photo || "");
    setShowFormModal(true);
  };
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };
  const handleFileUpload = async (type, file) => {
    setUploadError(null);
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      setUploadError("Only PNG, JPG, and JPEG images are allowed");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size exceeds the 5MB limit");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (type === "photo") setPhotoUrl(data.filePath);
        if (type === "aadhaar") setAadhaarPhotoUrl(data.filePath);
        if (type === "pan") setPanPhotoUrl(data.filePath);
      } else {
        const text = await res.text();
        let errMsg = "Failed to upload photo";
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.error || errMsg;
        } catch (_) {}
        setUploadError(errMsg);
      }
    } catch (e) {
      setUploadError("Network error uploading file");
    }
  };
  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) {
      errors.name = "Full Name is required";
    }
    if (!formMobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(formMobile)) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }
    if (formAadhaar.trim() && !/^\d{12}$/.test(formAadhaar)) {
      errors.aadhaar = "Aadhaar Number must be exactly 12 digits";
    }
    if (formPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formPan.toUpperCase())) {
      errors.pan = "PAN format is invalid (e.g. ABCDE1234F)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSaveCustomer = async () => {
    if (!validateForm()) return;
    const payload = {
      customer_type: formType,
      customer_name: formName,
      customer_mobile: formMobile,
      source: formSource,
      aadhaar_number: formAadhaar,
      pan_number: formPan,
      city_id: formCityId,
      area_id: formAreaId,
      sub_area_id: formSubAreaId,
      address: formAddress,
      customer_photo: photoUrl,
      aadhaar_photo: aadhaarPhotoUrl,
      pan_photo: panPhotoUrl,
      customer_status: formStatus,
      preferred_vehicle: formPreferredVehicle,
      remarks_notes: formRemarks,
      branch: currentUser?.branch || "Coimbatore"
    };
    try {
      let res;
      if (editingCustomer) {
        res = await fetch(`/api/customers/${editingCustomer.customer_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      const result = await res.json();
      if (res.ok) {
        setShowFormModal(false);
        fetchCustomers();
      } else {
        setUploadError(result.error || "Server error saving details");
      }
    } catch (e) {
      setUploadError("Network error saving customer");
    }
  };
  const handleDeleteCustomer = (id, name) => {
    setDeleteConfirm({
      isOpen: true,
      message: "Are you sure you want to delete this record?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/customers/${id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            fetchCustomers();
          }
        } catch (e) {
          console.error("Error deleting customer", e);
        }
      }
    });
  };
  const handleExportExcel = async () => {
    try {
      const res = await fetch("/api/customers/export");
      const data = await res.json();
      if (!res.ok) return;
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];
      for (const row of data) {
        const values = headers.map((header) => {
          const escaped = ("" + row[header]).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      }
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `customers_report_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export Excel failed", e);
    }
  };
  const handleSearchChange = (val) => {
    setParams((prev) => ({ ...prev, search: val, page: 1 }));
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Customers Directory</h2>
          <p className="text-sm text-slate-500 font-sans">Complete database tracking of buyers, sellers, lead progress, and document records</p>
        </div>
        <div className="flex items-center gap-2">
          <button
    type="button"
    onClick={handleExportExcel}
    className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm outline-none cursor-pointer"
  >
            <Download size={18} />
            Export Excel
          </button>
          {hasModulePermission(currentUser, "customers", "create") && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 text-sm cursor-pointer outline-none"
            >
              <Plus size={20} />
              Add Customer
            </button>
          )}
        </div>
      </div>

      {
    /* Advanced Filters Block */
  }
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search by ID, name, mobile, address, PAN, Aadhaar..."
    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm text-slate-800"
    value={params.search}
    onChange={(e) => handleSearchChange(e.target.value)}
  />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <select
    value={params.type}
    onChange={(e) => setParams((prev) => ({ ...prev, type: e.target.value, page: 1 }))}
    className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-brand-500"
  >
              <option value="">All Types (Buy/Sell)</option>
              <option value="Buy">Buy</option>
              <option value="Sell">Sell</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
    value={params.status}
    onChange={(e) => setParams((prev) => ({ ...prev, status: e.target.value, page: 1 }))}
    className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-brand-500"
  >
              <option value="">All Statuses</option>
              <option value="New Lead">New Lead</option>
              <option value="Follow Up">Follow Up</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center bg-white border border-slate-200 p-3 rounded-2xl gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">From</span>
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold font-mono focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">To</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold font-mono focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFromDate(localFrom);
            setToDate(localTo);
            setParams((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all font-mono cursor-pointer shadow-sm shadow-brand-100"
        >
          GO
        </button>
        <button
          type="button"
          onClick={() => {
            const fyFrom = localStorage.getItem("financialYearFrom") || "2025-04-01";
            const fyTo = localStorage.getItem("financialYearTo") || "2026-03-31";
            setLocalFrom(fyFrom);
            setLocalTo(fyTo);
            setFromDate(fyFrom);
            setToDate(fyTo);
            setParams({
              search: "",
              status: "",
              type: "",
              page: 1,
              limit: 10
            });
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase rounded-xl transition-all cursor-pointer"
        >
          Reset
        </button>
      </div>

      {
    /* Grid List Table */
  }
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="customers-list-container">
        <div className="overflow-x-auto">
          {isLoading ? <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2" />
              <p className="text-xs font-semibold">Loading customers database...</p>
            </div> : customers.length > 0 ? <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Info</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact & Location</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status & Vehicle</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => {
    const cityLabel = cities.find((ci) => ci.id === c.city_id)?.name || "";
    return <tr key={c.customer_id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                        {c.customer_id}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {c.customer_photo ? <img
      src={c.customer_photo}
      alt={c.customer_name}
      referrerPolicy="no-referrer"
      className="w-10 h-10 rounded-full object-cover border border-slate-200"
    /> : <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold uppercase text-sm">
                              {c.customer_name.charAt(0)}
                            </div>}
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-snug">{c.customer_name}</p>
                            <span className={cn(
      "inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
      c.customer_type === "Buy" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
    )}>
                              {c.customer_type === "Buy" ? "Buyer" : "Seller"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-slate-700 font-medium text-xs">
                            <Phone size={13} className="text-slate-400" />
                            <span>{c.customer_mobile}</span>
                          </div>
                          {cityLabel && <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin size={13} className="text-slate-400" />
                              <span className="truncate">{cityLabel}</span>
                            </div>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold leading-5",
      c.customer_status === "New Lead" ? "bg-blue-50 text-blue-700 border border-blue-100" : c.customer_status === "Follow Up" ? "bg-amber-50 text-amber-700 border border-amber-100" : c.customer_status === "Converted" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-slate-100 text-slate-700 border border-slate-200"
    )}>
                            {c.customer_status}
                          </span>
                          {c.preferred_vehicle && <p className="text-xs text-slate-600 font-medium truncate max-w-[150px]">
                              Req: <span className="font-semibold text-slate-850">{c.preferred_vehicle}</span>
                            </p>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
      type="button"
      onClick={() => handleViewDetails(c)}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-slate-200 outline-none"
      title="View Profile Details"
    >
                            <Eye size={13} className="text-slate-500" />
                            <span>View</span>
                          </button>
                          {hasModulePermission(currentUser, "customers", "edit") && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(c)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-slate-200 outline-none"
                              title="Edit Details"
                            >
                              <Edit2 size={13} className="text-slate-500" />
                              <span>Edit</span>
                            </button>
                          )}
                          {hasModulePermission(currentUser, "customers", "delete") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.customer_id, c.customer_name)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-rose-200 outline-none"
                              title="Delete Customer"
                            >
                              <Trash2 size={13} className="text-rose-500" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>;
  })}
              </tbody>
            </table> : <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <User size={48} className="mb-4 opacity-20" />
              <p className="font-bold text-slate-600 text-sm">No customers matched your search</p>
              <p className="text-xs text-slate-400">Try adjusting your filters or keywords</p>
            </div>}
        </div>

        {
    /* Dynamic Pagination Controls */
  }
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Rows per page:</span>
            <select
    value={params.limit}
    onChange={(e) => setParams((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
    className="px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500"
  >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <p className="text-xs text-slate-500 font-medium">
              Showing {totalCount > 0 ? (params.page - 1) * params.limit + 1 : 0} to {Math.min(params.page * params.limit, totalCount)} of {totalCount} entries
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
    type="button"
    className="p-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
    onClick={() => setParams((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
    disabled={params.page === 1}
  >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center px-2 text-xs font-bold text-slate-600">
              Page {params.page} of {totalPages}
            </div>
            <button
    type="button"
    className="p-1.5 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
    onClick={() => setParams((prev) => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
    disabled={params.page === totalPages}
  >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {
    /* Profile Detail Modals */
  }
      <AnimatePresence>
        {showDetailModal && selectedCustomer && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowDetailModal(false)}
    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 15 }}
    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
  >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <User className="text-brand-600" size={20} />
                  <h3 className="text-lg font-bold text-slate-900">Customer Profile #{selectedCustomer.customer_id}</h3>
                </div>
                <button type="button" onClick={() => setShowDetailModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {
    /* ID Header Profile Section */
  }
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
                  {selectedCustomer.customer_photo ? <img
    src={selectedCustomer.customer_photo}
    alt={selectedCustomer.customer_name}
    referrerPolicy="no-referrer"
    className="w-24 h-24 rounded-full object-cover border-2 border-brand-100 shadow-md"
  /> : <div className="w-24 h-24 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-700 font-bold text-3xl">
                      {selectedCustomer.customer_name.charAt(0)}
                    </div>}
                  <div className="text-center sm:text-left space-y-2">
                    <h4 className="text-xl font-bold text-slate-900">{selectedCustomer.customer_name}</h4>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className={cn(
    "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
    selectedCustomer.customer_type === "Buy" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
  )}>
                        {selectedCustomer.customer_type === "Buy" ? "Seeking to Buy" : "Seeking to Sell"}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                        Lead: {selectedCustomer.customer_status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                        {selectedCustomer.source}
                      </span>
                    </div>
                  </div>
                </div>

                {
    /* Info Grid */
  }
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mobile Number</p>
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Phone size={14} className="text-slate-400" />
                      <span>{selectedCustomer.customer_mobile}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar ID Number</p>
                    <p className="font-bold text-slate-800 font-mono">
                      {selectedCustomer.aadhaar_number ? selectedCustomer.aadhaar_number.replace(/(\d{4})/g, "$1 ").trim() : "Not provided"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PAN ID Number</p>
                    <p className="font-bold text-slate-800 font-mono">
                      {selectedCustomer.pan_number || "Not provided"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Location details</p>
                    <p className="font-semibold text-slate-800">
                      {cities.find((ci) => ci.id === selectedCustomer.city_id)?.name || "Unknown City"}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1 sm:col-span-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</p>
                    <p className="text-slate-700 font-medium">{selectedCustomer.address || "No physical address listed"}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1 sm:col-span-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Preferred Vehicle / Requirements</p>
                    <p className="text-slate-800 font-bold">{selectedCustomer.preferred_vehicle || "No specific preferences specified"}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl space-y-1 sm:col-span-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lead Remarks / Executive Notes</p>
                    <p className="text-slate-600 italic whitespace-pre-wrap">{selectedCustomer.remarks_notes || "No remarks recorded"}</p>
                  </div>
                </div>

                {
    /* Uploaded Documents Preview Section */
  }
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">Verified Photographs & Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-slate-150 p-3 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center space-y-2 text-center">
                      <p className="text-xs font-bold text-slate-600">Aadhaar Document Photo</p>
                      {selectedCustomer.aadhaar_photo ? <div className="relative group">
                          <img
    src={selectedCustomer.aadhaar_photo}
    alt="Aadhaar"
    referrerPolicy="no-referrer"
    className="h-32 w-auto max-w-full rounded-lg object-contain border bg-white"
  />
                          <a
    href={selectedCustomer.aadhaar_photo}
    target="_blank"
    rel="noreferrer"
    className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  >
                            <span className="text-white text-xs font-bold">Open Fullscreen</span>
                          </a>
                        </div> : <p className="text-xs text-slate-400 italic py-6">No Aadhaar Photo</p>}
                    </div>
                    <div className="border border-slate-150 p-3 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center space-y-2 text-center">
                      <p className="text-xs font-bold text-slate-600">PAN Document Photo</p>
                      {selectedCustomer.pan_photo ? <div className="relative group">
                          <img
    src={selectedCustomer.pan_photo}
    alt="PAN"
    referrerPolicy="no-referrer"
    className="h-32 w-auto max-w-full rounded-lg object-contain border bg-white"
  />
                          <a
    href={selectedCustomer.pan_photo}
    target="_blank"
    rel="noreferrer"
    className="absolute inset-0 bg-slate-900/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
  >
                            <span className="text-white text-xs font-bold">Open Fullscreen</span>
                          </a>
                        </div> : <p className="text-xs text-slate-400 italic py-6">No PAN Photo</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
    type="button"
    onClick={() => setShowDetailModal(false)}
    className="bg-slate-100 hover:bg-slate-200 text-slate-705 px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none"
  >
                  Close Profile
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* Add & Edit Customer Form Modals */
  }
      <AnimatePresence>
        {showFormModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowFormModal(false)}
    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 15 }}
    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
  >
              <div className="p-6 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingCustomer ? "Edit Customer Settings" : "Register New Customer Lead"}
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">Please ensure values match verified IDs</p>
                </div>
                <button type="button" onClick={() => setShowFormModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {uploadError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} />
                    <span>{uploadError}</span>
                  </div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Customer ID</label>
                    <input
    type="text"
    value={formId}
    disabled
    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 font-mono font-bold leading-5 rounded-xl cursor-not-allowed outline-none text-sm"
  />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Customer Focus / Type</label>
                    <select
    value={formType}
    onChange={(e) => setFormType(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
  >
                      <option value="Buy">Seeking to Buy</option>
                      <option value="Sell">Seeking to Sell</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                    <input
    type="text"
    value={formName}
    onChange={(e) => setFormName(e.target.value)}
    placeholder="e.g. Anand Kumar"
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                    {formErrors.name && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.name}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">10-Digit Mobile Phone <span className="text-rose-500">*</span></label>
                    <input
    type="tel"
    value={formMobile}
    maxLength={10}
    onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ""))}
    placeholder="e.g. 9845012345"
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
  />
                    {formErrors.mobile && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.mobile}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Lead Status</label>
                    <select
    value={formStatus}
    onChange={(e) => setFormStatus(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
  >
                      <option value="New Lead">New Lead</option>
                      <option value="Follow Up">Follow Up</option>
                      <option value="Converted">Converted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Acquisition Source</label>
                    <select
    value={formSource}
    onChange={(e) => setFormSource(e.target.value)}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
  >
                      <option value="Walk In">Walk In</option>
                      <option value="Referral">Referral</option>
                      <option value="Online">Online</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Aadhaar Card Number (12 Digits)</label>
                    <input
    type="text"
    value={formAadhaar}
    maxLength={12}
    onChange={(e) => setFormAadhaar(e.target.value.replace(/\D/g, ""))}
    placeholder="e.g. 560012349012"
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-mono"
  />
                    {formErrors.aadhaar && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.aadhaar}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">PAN ID Number (Format: ABCDE1234F)</label>
                    <input
    type="text"
    value={formPan}
    maxLength={10}
    onChange={(e) => setFormPan(e.target.value.toUpperCase())}
    placeholder="e.g. ABCDE1234F"
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-mono"
  />
                    {formErrors.pan && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.pan}</p>}
                  </div>
                </div>

                {
    /* Dependent Dropdowns */
  }
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Dependent Locations Master</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Select City</label>
                      <select
    value={formCityId}
    onChange={(e) => setFormCityId(e.target.value)}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
  >
                        <option value="">-- Choose City --</option>
                        {cities.map((ci) => <option key={ci.id} value={ci.id}>{ci.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Dependent Area</label>
                      <select
    value={formAreaId}
    onChange={(e) => setFormAreaId(e.target.value)}
    disabled={!formCityId}
    className="w-full px-3 py-2 bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
  >
                        <option value="">-- Select Area --</option>
                        {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600">Dependent Sub Area</label>
                      <select
    value={formSubAreaId}
    onChange={(e) => setFormSubAreaId(e.target.value)}
    disabled={!formAreaId}
    className="w-full px-3 py-2 bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
  >
                        <option value="">-- Select Sub Area --</option>
                        {subAreas.map((sa) => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Preferred Vehicle / Models</label>
                  <input
    type="text"
    value={formPreferredVehicle}
    onChange={(e) => setFormPreferredVehicle(e.target.value)}
    placeholder="e.g. Maruti Suzuki WagonR, Swift, Commercial Goods carrier"
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Residential Address</label>
                  <textarea
    rows={2}
    value={formAddress}
    onChange={(e) => setFormAddress(e.target.value)}
    placeholder="Enter permanent house street, locality etc..."
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Remarks / Follow-up Notes</label>
                  <textarea
    rows={2}
    value={formRemarks}
    onChange={(e) => setFormRemarks(e.target.value)}
    placeholder="Enter any additional requirements, exchange details, notes..."
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
  />
                </div>

                {
    /* Drag / Click Image Upload section */
  }
                <div className="space-y-3">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Verify Documents & Image Attachments (Max 5MB)</label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {
    /* Customer Photo Upload Widget */
  }
                    <div className="border border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 space-y-3 text-center transition-all">
                      <p className="text-xs font-bold text-slate-700">Customer Photo</p>
                      {photoUrl ? <div className="relative">
                          <img
    src={photoUrl}
    alt="Preview"
    referrerPolicy="no-referrer"
    className="w-20 h-20 rounded-full object-cover border"
  />
                          <button
    type="button"
    onClick={() => setPhotoUrl("")}
    className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer"
  >
                            <X size={10} />
                          </button>
                        </div> : <div
    onClick={() => photoInputRef.current?.click()}
    className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer text-slate-500 transition-colors"
  >
                          <Upload size={18} />
                        </div>}
                      {!photoUrl && <span className="text-[10px] text-slate-400">Click to upload avatar</span>}
                      <input
    type="file"
    ref={photoInputRef}
    className="hidden"
    accept=".png,.jpg,.jpeg"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload("photo", file);
    }}
  />
                    </div>

                    {
    /* Aadhaar Photo Upload Widget */
  }
                    <div className="border border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 space-y-3 text-center transition-all">
                      <p className="text-xs font-bold text-slate-700">Aadhaar Card Image</p>
                      {aadhaarPhotoUrl ? <div className="relative">
                          <img
    src={aadhaarPhotoUrl}
    alt="Preview"
    referrerPolicy="no-referrer"
    className="w-20 h-14 rounded-lg object-cover border"
  />
                          <button
    type="button"
    onClick={() => setAadhaarPhotoUrl("")}
    className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer"
  >
                            <X size={10} />
                          </button>
                        </div> : <div
    onClick={() => aadhaarInputRef.current?.click()}
    className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer text-slate-500 transition-colors"
  >
                          <Upload size={18} />
                        </div>}
                      {!aadhaarPhotoUrl && <span className="text-[10px] text-slate-400">Click to upload card</span>}
                      <input
    type="file"
    ref={aadhaarInputRef}
    className="hidden"
    accept=".png,.jpg,.jpeg"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload("aadhaar", file);
    }}
  />
                    </div>

                    {
    /* PAN Photo Upload Widget */
  }
                    <div className="border border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 space-y-3 text-center transition-all">
                      <p className="text-xs font-bold text-slate-700">PAN Card Image</p>
                      {panPhotoUrl ? <div className="relative">
                          <img
    src={panPhotoUrl}
    alt="Preview"
    referrerPolicy="no-referrer"
    className="w-20 h-14 rounded-lg object-cover border"
  />
                          <button
    type="button"
    onClick={() => setPanPhotoUrl("")}
    className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer"
  >
                            <X size={10} />
                          </button>
                        </div> : <div
    onClick={() => panInputRef.current?.click()}
    className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer text-slate-500 transition-colors"
  >
                          <Upload size={18} />
                        </div>}
                      {!panPhotoUrl && <span className="text-[10px] text-slate-400">Click to upload card</span>}
                      <input
    type="file"
    ref={panInputRef}
    className="hidden"
    accept=".png,.jpg,.jpeg"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload("pan", file);
    }}
  />
                    </div>

                  </div>
                </div>

              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
    type="button"
    onClick={() => setShowFormModal(false)}
    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer outline-none"
  >
                  Cancel
                </button>
                <button
    type="button"
    onClick={handleSaveCustomer}
    className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 cursor-pointer outline-none"
  >
                  {editingCustomer ? "Update Profile" : "Save Lead"}
                </button>
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
