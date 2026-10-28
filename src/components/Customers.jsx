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
  ChevronDown,
  Handshake,
  Car,
  PlusCircle,
  CheckCircle2,
  Printer,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { calculateCustomerTotalStats, calculateDealSalesOutstanding, calculateVehiclePurchaseOutstanding } from "../lib/outstandingCalculator";
import { generateCustomerReceiptPDF } from "../lib/receiptPdf";
import { hasModulePermission } from "../lib/permissions";
import CustomerFormModal from "./CustomerFormModal";

export default function Customers({
  currentUser,
  initialSearch,
  onUpdateCustomers,
  purchases = [],
  deals = [],
  payments = [],
  vouchers = [],
  businessProfile = {},
  onNavigate,
  onRefreshData
}) {
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
  const [detailTab, setDetailTab] = useState("sales");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptDeal, setReceiptDeal] = useState(null);
  const [receiptAmount, setReceiptAmount] = useState("");
  const [receiptMode, setReceiptMode] = useState("Cash");
  const [receiptRefNo, setReceiptRefNo] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split("T")[0]);
  const [receiptRemarks, setReceiptRemarks] = useState("");
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState("");
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
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setShowFormModal(true);
  };
  const handleOpenEditModal = (customer) => {
    setEditingCustomer(customer);
    setShowFormModal(true);
  };
  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    const cId = customer.id || customer.customer_id;
    const cName = (customer.customer_name || customer.name || "").trim().toLowerCase();
    const cMobile = (customer.mobile || customer.customer_mobile || "").trim();

    const custDeals = deals.filter((d) => {
      if (d.isDeleted) return false;
      const matchId = cId && (d.customerId === cId || d.customerId === customer.customer_id);
      const matchName = cName && d.customerName && d.customerName.trim().toLowerCase() === cName;
      const matchMobile = cMobile && ((d.customerMobile || d.mobile || "").trim() === cMobile);
      return Boolean(matchId || matchName || matchMobile);
    });

    const custPurchases = purchases.filter((v) => {
      if (v.isDeleted) return false;
      const isCustSourced = v.sellerType === "Customer" || v.purchase_type === "Customer";
      if (!isCustSourced) return false;
      const matchId = cId && (v.sellerId === cId || v.seller_id === cId || v.supplier_id === cId);
      const matchName = cName && ((v.sellerName && v.sellerName.trim().toLowerCase() === cName) || (v.customerName && v.customerName.trim().toLowerCase() === cName));
      const matchMobile = cMobile && ((v.sellerMobile || v.seller_mobile || v.mobile || "").trim() === cMobile);
      return Boolean(matchId || matchName || matchMobile);
    });

    if ((customer.customer_type === "Sell" || customer.requirement === "Sell") && custPurchases.length > 0 && custDeals.length === 0) {
      setDetailTab("purchases");
    } else {
      setDetailTab("sales");
    }
    setShowDetailModal(true);
  };

  const handleOpenReceiptModal = (deal, pendingBal) => {
    setReceiptDeal(deal);
    setReceiptAmount(pendingBal.toString());
    setReceiptMode("Cash");
    setReceiptRefNo(`RCP-${Date.now().toString().slice(-6)}`);
    setReceiptDate(new Date().toISOString().split("T")[0]);
    setReceiptRemarks(`Sales Balance Receipt for ${deal.vehicleName || deal.regNo}`);
    setReceiptSuccessMsg("");
    setShowReceiptModal(true);
  };

  const handleSaveReceipt = async (e) => {
    e.preventDefault();
    if (!receiptAmount || Number(receiptAmount) <= 0) {
      alert("Please enter a valid receipt amount");
      return;
    }
    setIsSavingReceipt(true);
    try {
      const payload = {
        partyType: "Customer",
        partyId: selectedCustomer?.id || selectedCustomer?.customer_id,
        partyName: selectedCustomer?.customer_name || selectedCustomer?.name,
        vehicleId: receiptDeal?.vehicleId,
        dealId: receiptDeal?.id,
        amountPaid: Number(receiptAmount),
        paymentMode: receiptMode,
        referenceNo: receiptRefNo,
        paymentDate: receiptDate,
        remarks: receiptRemarks,
        branch: selectedCustomer?.branch || currentUser?.branch || "Coimbatore"
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const dealStats = calculateDealSalesOutstanding(receiptDeal, payments, vouchers);
        const sellingPrice = dealStats.sellingPrice;
        const currentOutstanding = dealStats.outstanding;
        const newOutstanding = Math.max(0, currentOutstanding - Number(receiptAmount));

        const pdfData = {
          receiptNo: receiptRefNo,
          receiptTitle: "CUSTOMER SALES RECEIPT",
          date: receiptDate,
          customerName: selectedCustomer?.customer_name || selectedCustomer?.name,
          customerMobile: selectedCustomer?.customer_mobile || selectedCustomer?.mobile,
          vehicleName: receiptDeal?.vehicleName || receiptDeal?.regNo,
          regNo: receiptDeal?.regNo || "",
          sellingPrice: sellingPrice,
          advanceAmount: dealStats.advanceAmount,
          amountPaid: Number(receiptAmount),
          balanceAmount: newOutstanding,
          paymentMode: receiptMode,
          referenceNo: receiptRefNo,
          remarks: receiptRemarks,
          branch: selectedCustomer?.branch || currentUser?.branch || "Coimbatore"
        };

        try {
          generateCustomerReceiptPDF(pdfData, businessProfile);
        } catch (pdfErr) {
          console.warn("Receipt PDF generation warning:", pdfErr);
        }

        setReceiptSuccessMsg("Receipt recorded & PDF downloaded successfully!");
        if (onRefreshData) await onRefreshData();

        setTimeout(() => {
          setIsSavingReceipt(false);
          setShowReceiptModal(false);
          setReceiptDeal(null);
        }, 1200);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to save receipt entry");
        setIsSavingReceipt(false);
      }
    } catch (err) {
      console.error("Save receipt error:", err);
      alert("Network error saving receipt");
      setIsSavingReceipt(false);
    }
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
        {showDetailModal && selectedCustomer && (() => {
          const stats = calculateCustomerTotalStats(selectedCustomer, purchases, deals, payments, vouchers);
          const cId = selectedCustomer.id || selectedCustomer.customer_id;
          const cName = (selectedCustomer.customer_name || selectedCustomer.name || "").trim().toLowerCase();
          const cMobile = (selectedCustomer.mobile || selectedCustomer.customer_mobile || "").trim();

          const custDeals = deals.filter((d) => {
            if (d.isDeleted) return false;
            const matchId = cId && (d.customerId === cId || d.customerId === selectedCustomer.customer_id);
            const matchName = cName && d.customerName && d.customerName.trim().toLowerCase() === cName;
            const matchMobile = cMobile && ((d.customerMobile || d.mobile || "").trim() === cMobile);
            return Boolean(matchId || matchName || matchMobile);
          });

          const custPurchases = purchases.filter((v) => {
            if (v.isDeleted) return false;
            const isCustSourced = v.sellerType === "Customer" || v.purchase_type === "Customer";
            if (!isCustSourced) return false;
            const matchId = cId && (v.sellerId === cId || v.seller_id === cId || v.supplier_id === cId);
            const matchName = cName && ((v.sellerName && v.sellerName.trim().toLowerCase() === cName) || (v.customerName && v.customerName.trim().toLowerCase() === cName));
            const matchMobile = cMobile && ((v.sellerMobile || v.seller_mobile || v.mobile || "").trim() === cMobile);
            return Boolean(matchId || matchName || matchMobile);
          });

          const isAdvanceEntry = (item) => {
            if (!item) return false;
            if (item.isAdvance) return true;
            if (item.paymentType === "Advance Payment" || item.paymentType === "Sales Advance") return true;
            const ref = (item.referenceNo || item.id || "").toLowerCase();
            if (ref.includes("rec-adv") || ref.includes("vouch-s-")) return true;
            const narration = (item.narration || item.remarks || "").toLowerCase();
            if (narration.includes("advance") || narration.includes("booking advance")) return true;
            return false;
          };

          const salesPayments = payments.filter((pm) => {
            if (!pm || pm.isDeleted || isAdvanceEntry(pm)) return false;
            if (
              pm.partyType === "Supplier" ||
              pm.paymentType === "Supplier Payment" ||
              pm.paymentType === "Customer Purchase Payment" ||
              pm.paymentType === "Purchase Payment"
            ) return false;

            const matchParty =
              (selectedCustomer.id && pm.partyId === selectedCustomer.id) ||
              (selectedCustomer.customer_id && pm.partyId === selectedCustomer.customer_id) ||
              (pm.partyName && (pm.partyName === selectedCustomer.name || pm.partyName === selectedCustomer.customer_name));

            const matchDeal = custDeals.some((d) => (d.id && pm.dealId === d.id) || (d.vehicleId && pm.vehicleId === d.vehicleId));

            return Boolean(matchParty || matchDeal);
          });

          const purchasePayments = payments.filter((pm) => {
            if (!pm || pm.isDeleted || isAdvanceEntry(pm)) return false;
            const isPayout =
              pm.partyType === "Supplier" ||
              pm.paymentType === "Supplier Payment" ||
              pm.paymentType === "Customer Purchase Payment" ||
              pm.paymentType === "Purchase Payment";

            if (!isPayout) return false;

            const matchParty =
              (selectedCustomer.id && pm.partyId === selectedCustomer.id) ||
              (selectedCustomer.customer_id && pm.partyId === selectedCustomer.customer_id) ||
              (pm.partyName && (pm.partyName === selectedCustomer.name || pm.partyName === selectedCustomer.customer_name));

            const matchPurchase = custPurchases.some(
              (p) =>
                (p.purchase_id && (pm.purchaseId === p.purchase_id || pm.vehicleId === p.purchase_id)) ||
                (p.id && (pm.purchaseId === p.id || pm.vehicleId === p.id))
            );

            return Boolean(matchParty || matchPurchase);
          });

          const custPayments = [...salesPayments, ...purchasePayments];

          const salesBalance = stats.salesOutstanding;
          const purBalance = stats.purchaseOutstanding;
          const netOutstanding = stats.totalOutstanding;

          return (
            <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
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
                className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
                  {/* ID Header Profile Section */}
                  <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
                    {selectedCustomer.customer_photo ? (
                      <img
                        src={selectedCustomer.customer_photo}
                        alt={selectedCustomer.customer_name}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover border-2 border-brand-100 shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl">
                        {(selectedCustomer.customer_name || "C").charAt(0)}
                      </div>
                    )}
                    <div className="text-center sm:text-left space-y-2 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-xl font-bold text-slate-900">{selectedCustomer.customer_name}</h4>
                          <p className="text-xs text-slate-500 font-mono">Mobile: {selectedCustomer.customer_mobile}</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                            selectedCustomer.customer_type === "Buy" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                          )}>
                            {selectedCustomer.customer_type === "Buy" ? "Seeking to Buy (Buyer)" : "Seeking to Sell (Seller)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Context Dual Profile Tabs (Sales / Buyer vs Purchases / Seller) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailTab("sales")}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border outline-none",
                          detailTab === "sales"
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        <Handshake size={15} />
                        <span>Sales Deals (Buyer Context)</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                          detailTab === "sales" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        )}>
                          {custDeals.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailTab("purchases")}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border outline-none",
                          detailTab === "purchases"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                        )}
                      >
                        <Car size={15} />
                        <span>Sourced Purchases (Seller Context)</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                          detailTab === "purchases" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        )}>
                          {custPurchases.length}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          if (onNavigate) onNavigate("purchase", { initialCustomer: selectedCustomer });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-extrabold hover:bg-amber-100 transition-all"
                      >
                        <PlusCircle size={14} />
                        <span>New Purchase Entry</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          if (onNavigate) onNavigate("sales", { initialCustomer: selectedCustomer });
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-extrabold hover:bg-emerald-100 transition-all"
                      >
                        <PlusCircle size={14} />
                        <span>New Sales Deal</span>
                      </button>
                    </div>
                  </div>

                  {/* Customer Financial Metrics Box - STRICTLY ISOLATED BY ACTIVE TAB */}
                  {detailTab === "sales" ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Sales Value</span>
                        <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">₹{stats.salesTotal.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Deals Count: {stats.salesCount}</span>
                      </div>
                      <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Advance Received</span>
                        <p className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">₹{stats.salesAdvance.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">Sales Booking Advance</span>
                      </div>
                      <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/70">
                        <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Sales Payment Receipts</span>
                        <p className="text-base font-extrabold text-teal-900 font-mono mt-0.5">₹{stats.salesPaymentsRec.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-teal-700 font-medium block mt-0.5">Subsequent Receipts</span>
                      </div>
                      <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Remaining Sales Outstanding</span>
                        <p className="text-base font-black text-rose-900 font-mono mt-0.5">₹{stats.salesOutstanding.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
                          {stats.salesOutstanding === 0 ? "Fully Paid" : "Balance Due from Buyer"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Purchase Value</span>
                        <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">₹{stats.purchaseTotal.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Vehicles Supplied: {stats.purchaseCount}</span>
                      </div>
                      <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Advance Paid to Seller</span>
                        <p className="text-base font-extrabold text-amber-900 font-mono mt-0.5">₹{stats.purchaseAdvance.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-amber-700 font-medium block mt-0.5">Inward Purchase Advance</span>
                      </div>
                      <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/70">
                        <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Payment Entries</span>
                        <p className="text-base font-extrabold text-blue-900 font-mono mt-0.5">₹{stats.purchasePaymentsReceived.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-blue-700 font-medium block mt-0.5">Part & Full Payments Made</span>
                      </div>
                      <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200/80 col-span-2 sm:col-span-1">
                        <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">Remaining Purchase Outstanding</span>
                        <p className="text-base font-black text-purple-900 font-mono mt-0.5">₹{stats.purchaseOutstanding.toLocaleString("en-IN")}</p>
                        <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
                          {stats.purchaseOutstanding === 0 ? "Fully Paid" : "Balance Payable to Seller"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 1 CONTENT: SALES DEALS (BUYER CONTEXT) */}
                  {detailTab === "sales" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Handshake size={14} className="text-brand-600" />
                          Vehicle Sales Deals ({custDeals.length})
                        </h4>
                      </div>

                      {custDeals.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs shadow-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                              <tr>
                                <th className="py-2.5 px-3">Invoice No</th>
                                <th className="py-2.5 px-3">Vehicle</th>
                                <th className="py-2.5 px-3 text-right">Selling Price</th>
                                <th className="py-2.5 px-3 text-right">Advance Received</th>
                                <th className="py-2.5 px-3 text-right">Outstanding</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {custDeals.map((d) => {
                                const dealStats = calculateDealSalesOutstanding(d, payments, vouchers);
                                const total = dealStats.totalSaleValue;
                                const adv = dealStats.advanceAmount;
                                const bal = dealStats.outstanding;
                                return (
                                  <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{d.invoiceNo || d.id}</td>
                                    <td className="py-2.5 px-3 font-bold text-slate-800">{d.vehicleName || d.regNo}</td>
                                    <td className="py-2.5 px-3 font-mono text-right font-semibold text-slate-900">₹{total.toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3 font-mono text-right text-emerald-700 font-medium">₹{adv.toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-600">₹{bal.toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                        bal === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                      )}>
                                        {bal === 0 ? "Fully Paid" : "Pending"}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {bal > 0 ? (
                                        <button
                                          type="button"
                                          onClick={() => handleOpenReceiptModal(d, bal)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer outline-none"
                                        >
                                          <PlusCircle size={12} />
                                          <span>+ Add Receipt</span>
                                        </button>
                                      ) : (
                                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">Settled</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-xl">
                          <Handshake size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600">No Vehicle Sales Deals Found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">This customer has not purchased any vehicle from your showroom yet.</p>
                        </div>
                      )}

                      {/* Sales Payment Receipts Audit */}
                      {salesPayments.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Sales Payment Receipts Audit ({salesPayments.length})</h4>
                          <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                                <tr>
                                  <th className="py-2.5 px-3">Receipt No</th>
                                  <th className="py-2.5 px-3">Date</th>
                                  <th className="py-2.5 px-3">Vehicle</th>
                                  <th className="py-2.5 px-3 text-right">Amount Received</th>
                                  <th className="py-2.5 px-3">Mode</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {salesPayments.map((pm) => (
                                  <tr key={pm.id} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{pm.referenceNo || pm.id}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{pm.paymentDate}</td>
                                    <td className="py-2.5 px-3 text-slate-800 font-medium">{pm.regNo || pm.vehicleName || "General"}</td>
                                    <td className="py-2.5 px-3 font-mono text-right font-black text-emerald-600">₹{(Number(pm.amountPaid) || 0).toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-600">{pm.paymentMode}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2 CONTENT: SOURCED PURCHASES (SELLER CONTEXT) */}
                  {detailTab === "purchases" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Car size={14} className="text-purple-600" />
                          Customer Sourced Vehicle Purchases ({custPurchases.length})
                        </h4>
                      </div>

                      {custPurchases.length > 0 ? (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs shadow-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                              <tr>
                                <th className="py-2.5 px-3">Purchase ID</th>
                                <th className="py-2.5 px-3">Vehicle</th>
                                <th className="py-2.5 px-3">Reg No</th>
                                <th className="py-2.5 px-3 text-right">Purchase Price</th>
                                <th className="py-2.5 px-3 text-right">Advance Paid</th>
                                <th className="py-2.5 px-3 text-right">Outstanding</th>
                                <th className="py-2.5 px-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {custPurchases.map((p) => {
                                const purStats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
                                const total = purStats.purchasePrice;
                                const adv = purStats.advancePaid;
                                const bal = purStats.outstanding;
                                return (
                                  <tr key={p.id || p.purchase_id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-2.5 px-3 font-mono font-bold text-purple-600">{p.purchase_id || p.id}</td>
                                    <td className="py-2.5 px-3 font-bold text-slate-800">{p.brand} {p.name}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{p.reg_no || p.regNo || "N/A"}</td>
                                    <td className="py-2.5 px-3 font-mono text-right font-semibold text-slate-900">₹{total.toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3 font-mono text-right text-amber-700 font-medium">₹{adv.toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-600">₹{bal.toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                        bal === 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                                      )}>
                                        {bal === 0 ? "Fully Paid" : "Payable"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-xl">
                          <Car size={28} className="mx-auto text-slate-300 mb-2" />
                          <p className="text-xs font-bold text-slate-600">No Sourced Vehicle Purchases Found</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">This customer has not supplied or sold any pre-owned vehicles to your showroom.</p>
                        </div>
                      )}

                      {/* Purchase Payment Entries Audit */}
                      {purchasePayments.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Purchase Payment Entries Audit ({purchasePayments.length})</h4>
                          <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                                <tr>
                                  <th className="py-2.5 px-3">Ref / Voucher No</th>
                                  <th className="py-2.5 px-3">Date</th>
                                  <th className="py-2.5 px-3">Vehicle</th>
                                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                                  <th className="py-2.5 px-3">Mode</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {purchasePayments.map((pm) => (
                                  <tr key={pm.id} className="hover:bg-slate-50">
                                    <td className="py-2.5 px-3 font-mono font-bold text-purple-600">{pm.referenceNo || pm.id}</td>
                                    <td className="py-2.5 px-3 font-mono text-slate-600">{pm.paymentDate}</td>
                                    <td className="py-2.5 px-3 text-slate-800 font-medium">{pm.regNo || pm.vehicleName || "General"}</td>
                                    <td className="py-2.5 px-3 font-mono text-right font-black text-slate-900">₹{(Number(pm.amountPaid) || 0).toLocaleString("en-IN")}</td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-600">{pm.paymentMode}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Payment Entries */}
                  {custPayments.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment History Audit Entries</h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                            <tr>
                              <th className="py-2.5 px-3">Ref No</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Vehicle / Purpose</th>
                              <th className="py-2.5 px-3 text-right">Exact Paid</th>
                              <th className="py-2.5 px-3">Mode</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {custPayments.map((pm) => (
                              <tr key={pm.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{pm.referenceNo}</td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{pm.paymentDate}</td>
                                <td className="py-2.5 px-3 text-slate-800">{pm.regNo || pm.vehicleName || "General"}</td>
                                <td className="py-2.5 px-3 font-mono text-right font-black text-emerald-600">₹{(Number(pm.amountPaid) || 0).toLocaleString("en-IN")}</td>
                                <td className="py-2.5 px-3 font-semibold text-slate-600">{pm.paymentMode}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
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

                    <div className="bg-slate-50 p-3 rounded-xl space-y-1 sm:col-span-2">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Residential Address</p>
                      <p className="text-slate-700 font-medium">{selectedCustomer.address || "No physical address listed"}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDetailModal(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close Profile
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Add & Edit Customer Form Modals */}
      <CustomerFormModal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        editingCustomer={editingCustomer}
        currentUser={currentUser}
        onSuccess={() => {
          fetchCustomers();
          if (onRefreshData) onRefreshData();
        }}
      />

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

      {/* Quick Sales Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && receiptDeal && (
          <div className="fixed inset-0 z-[70] overflow-y-auto flex items-center justify-center p-3 my-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSavingReceipt && setShowReceiptModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10"
            >
              <div className="p-4 bg-emerald-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PlusCircle size={18} />
                  <h3 className="text-sm font-bold">Add Sales Receipt</h3>
                </div>
                <button
                  type="button"
                  disabled={isSavingReceipt}
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveReceipt} className="p-5 space-y-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Buyer Name:</span>
                    <span className="font-bold text-slate-900">{selectedCustomer?.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Vehicle:</span>
                    <span className="font-bold text-slate-900">{receiptDeal?.vehicleName || receiptDeal?.regNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Current Outstanding:</span>
                    <span className="font-bold text-rose-600 font-mono">₹{Number(receiptDeal?.outstanding || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {receiptSuccessMsg ? (
                  <div className="p-4 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{receiptSuccessMsg}</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Receipt Amount (₹) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        max={receiptDeal?.outstanding}
                        value={receiptAmount}
                        onChange={(e) => setReceiptAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Enter amount..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Payment Mode</label>
                        <select
                          value={receiptMode}
                          onChange={(e) => setReceiptMode(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="Cash">Cash</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="UPI / Online">UPI / Online</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Payment Date</label>
                        <input
                          type="date"
                          required
                          value={receiptDate}
                          onChange={(e) => setReceiptDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Receipt Ref No / Transaction ID</label>
                      <input
                        type="text"
                        value={receiptRefNo}
                        onChange={(e) => setReceiptRefNo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Remarks / Notes</label>
                      <input
                        type="text"
                        value={receiptRemarks}
                        onChange={(e) => setReceiptRemarks(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Optional remarks..."
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSavingReceipt}
                        onClick={() => setShowReceiptModal(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingReceipt}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isSavingReceipt ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Saving & Printing...</span>
                          </>
                        ) : (
                          <>
                            <Printer size={14} />
                            <span>Save & Print Receipt</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>;
}
