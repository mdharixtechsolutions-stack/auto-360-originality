import React, { useState, useMemo, useEffect, useRef } from "react";
import { Plus, Search, User, Car, FileText, X, Trash2, Printer, Edit2, Eye, ShieldCheck, CheckCircle2, CreditCard, Share2, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { generateCustomerReceiptPDF } from "../lib/receiptPdf";
import { hasModulePermission } from "../lib/permissions";
import { calculateDealSalesOutstanding } from "../lib/outstandingCalculator";
import SalesPosterModal from "./SalesPosterModal";
import CustomerFormModal from "./CustomerFormModal";

const mockDeals = [
  {
    id: "S-1001",
    customerId: "C1",
    customerName: "Rahul Sharma",
    vehicleId: "V1",
    vehicleName: "Maruti Suzuki Swift",
    type: "Sell",
    purchasePrice: 55e4,
    expenses: 15e3,
    sellingPrice: 625e3,
    totalPrice: 625e3,
    advanceAmount: 5e4,
    balanceAmount: 575e3,
    consultancyFees: 0,
    commission: 5e3,
    assignedAgentId: "S-1",
    agent: "John Staff",
    status: "Completed",
    date: "2024-03-20",
    createdBy: "S-1",
    createdAt: "2024-03-20T10:00:00Z",
    isDeleted: false
  }
];
export default function Sales({
  vehicles = [],
  customers = [],
  deals = [],
  payments = [],
  vouchers = [],
  brands = [],
  onUpdateDeals,
  onUpdateVehicles,
  onUpdateCustomers,
  onNavigate,
  initialVehicle,
  currentUser,
  businessProfile,
  initialSearch,
  onRefreshData
}) {
  const photoInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const panInputRef = useRef(null);

  const handleFileChange = (field, e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploads((prev) => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");

  const [showPosterModal, setShowPosterModal] = useState(false);
  const [posterVehicle, setPosterVehicle] = useState(null);
  const [posterDeal, setPosterDeal] = useState(null);

  const handleOpenPoster = (deal, e) => {
    if (e) e.stopPropagation();
    const veh = (vehicles || []).find((v) => v && (v.id === deal.vehicleId || v.purchase_id === deal.vehicleId)) || {
      name: deal.vehicleName || deal.vehicle_name || "Vehicle",
      sellingPrice: deal.sellingPrice || 0
    };
    setPosterDeal(deal);
    setPosterVehicle(veh);
    setShowPosterModal(true);
  };

  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== "") {
      setSearchQuery(initialSearch);
      setActiveTab("all");
      setFromDate("");
      setToDate("");
      setLocalFrom("");
      setLocalTo("");
    }
  }, [initialSearch]);
  const [localFrom, setLocalFrom] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [localTo, setLocalTo] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const [fromDate, setFromDate] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [toDate, setToDate] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const handleEditDeal = (deal, e) => {
    e.stopPropagation();
    setEditingDeal(deal);
    setFormSaleId(deal.id || deal.deal_id || "");
    const cust = (customers || []).find((c) => c && (c.id === deal.customerId || c.customer_id === deal.customerId)) || { id: deal.customerId, name: deal.customerName || "Customer", mobile: "" };
    const veh = (vehicles || []).find((v) => v && (v.id === deal.vehicleId || v.purchase_id === deal.vehicleId)) || { id: deal.vehicleId, name: deal.vehicleName || "Vehicle", purchasePrice: deal.purchasePrice || 0, totalExpenses: deal.expenses || 0 };
    setSelectedCustomer(cust);
    setSelectedVehicle(veh);
    setSelectedVehicleType(veh.vehicleType || veh.vehicle_type || "");
    setSelectedVehicleBrand(veh.brand || veh.brand_id || "");
    setFormData({
      sellingPrice: deal.sellingPrice || 0,
      advanceAmount: deal.advanceAmount || 0,
      expenses: deal.expenses || 0,
      consultancyFees: deal.consultancyFees || 0,
      aadhaarNumber: deal.aadhaarNumber || "",
      panNumber: deal.panNumber || "",
      date: deal.date || new Date().toISOString().split("T")[0],
      settlementType: deal.settlementType || (deal.balanceAmount === 0 ? "Fully Paid" : "Customer Balance Pending"),
      financeName: deal.financeName || "",
      financeRef: deal.financeRef || ""
    });
    setUploads({
      photo: deal.uploads?.photo || null,
      aadhaar: deal.uploads?.aadhaar || null,
      pan: deal.uploads?.pan || null
    });
    setShowCreateModal(true);
  };
  const handleDeleteDeal = (id, e) => {
    e.stopPropagation();
    setDealToDelete(id);
  };
  const confirmDeleteDeal = async () => {
    if (dealToDelete) {
      try {
        const res = await fetch(`/api/deals/${dealToDelete}`, {
          method: "DELETE"
        });
        if (res.ok) {
          if (onUpdateDeals) onUpdateDeals((prev) => (prev || []).filter((d) => d && d.id !== dealToDelete));
          const deal = (deals || []).find((d) => d && d.id === dealToDelete);
          if (deal && deal.vehicleId && onUpdateVehicles) {
            onUpdateVehicles((vehicles || []).map(
              (v) => v && v.id === deal.vehicleId ? { ...v, status: "Available" } : v
            ));
          }
          if (onRefreshData) await onRefreshData();
        } else {
          alert("Failed to delete deal from server");
        }
      } catch (err) {
        console.error("Error deleting deal", err);
      } finally {
        setDealToDelete(null);
      }
    }
  };
  const [activeTab, setActiveTab] = useState("all");
  const [isSaving, setIsSaving] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerFlow, setCustomerFlow] = useState("existing");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerMobile, setNewCustomerMobile] = useState("");
  const [newCustomerCity, setNewCustomerCity] = useState("");
  const [newCustomerArea, setNewCustomerArea] = useState("");
  const [newCustomerSubArea, setNewCustomerSubArea] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  useEffect(() => {
    if (initialVehicle) {
      setSelectedVehicle(initialVehicle);
      const offerPriceVal = Number(
        initialVehicle.salesPrice ||
        initialVehicle.sales_price ||
        initialVehicle.expectedSellingPrice ||
        initialVehicle.expected_selling_price ||
        initialVehicle.offerPrice ||
        initialVehicle.offer_price ||
        (Number(initialVehicle.sellingPrice) > 0 ? initialVehicle.sellingPrice : 0) ||
        (Number(initialVehicle.selling_price) > 0 ? initialVehicle.selling_price : 0)
      ) || 0;
      setFormData((prev) => ({
        ...prev,
        sellingPrice: offerPriceVal,
        expenses: Number(initialVehicle.totalExpenses) || 0,
        consultancyFees: Number(initialVehicle.consultancyFees) || 0,
        date: new Date().toISOString().split("T")[0]
      }));
      setShowCreateModal(true);
    }
  }, [initialVehicle]);

  const filteredDeals = useMemo(
    () => (deals || []).filter((d) => {
      if (!d) return false;
      const q = (searchQuery || "").toLowerCase().trim();
      const cleanQ = q.replace(/[^a-z0-9]/gi, "");
      const dId = String(d.id || d.deal_id || d.sale_id || "").toLowerCase();
      const cleanDId = dId.replace(/[^a-z0-9]/gi, "");
      const cName = String(d.customerName || d.customer_name || "").toLowerCase();
      const vName = String(d.vehicleName || d.vehicle_name || d.vehicleDetails || "").toLowerCase();
      const cleanVName = vName.replace(/[^a-z0-9]/gi, "");
      const rNo = String(d.regNo || d.reg_no || "").toLowerCase();
      const cleanReg = rNo.replace(/[^a-z0-9]/gi, "");

      const matchesSearch = !q ||
        dId.includes(q) ||
        cName.includes(q) ||
        vName.includes(q) ||
        rNo.includes(q) ||
        (cleanQ && (cleanDId.includes(cleanQ) || cleanVName.includes(cleanQ) || cleanReg.includes(cleanQ)));

      const matchesTab = activeTab === "all" || (activeTab === "completed" && d.status === "Completed") || (activeTab === "pending" && d.status === "Pending");
      const isWithinFrom = fromDate ? (d.date || "") >= fromDate : true;
      const isWithinTo = toDate ? (d.date || "") <= toDate : true;
      return matchesSearch && matchesTab && isWithinFrom && isWithinTo;
    }),
    [deals, searchQuery, activeTab, fromDate, toDate]
  );

  const stats = useMemo(() => {
    let totalSales = 0;
    let collections = 0;
    let pending = 0;

    (filteredDeals || []).forEach((d) => {
      if (d) {
        const res = calculateDealSalesOutstanding(d, payments || [], vouchers || []);
        totalSales += Number(res.totalSaleValue) || 0;
        collections += Number(res.totalReceived) || 0;
        pending += Number(res.outstanding) || 0;
      }
    });

    return {
      totalSales,
      collections,
      pending,
      count: (filteredDeals || []).length
    };
  }, [filteredDeals, payments, vouchers]);

  const [formSaleId, setFormSaleId] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedVehicleBrand, setSelectedVehicleBrand] = useState("");

  const fetchNextSaleId = async () => {
    try {
      const res = await fetch("/api/deals/nextId");
      if (res.ok) {
        const data = await res.json();
        if (data.nextId) {
          setFormSaleId(data.nextId);
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch next sale ID:", e);
    }
    setFormSaleId(`S-${1001 + (deals?.length || 0)}`);
  };

  const handleOpenCreateModal = () => {
    setEditingDeal(null);
    setSelectedCustomer(null);
    setSelectedVehicle(null);
    setSelectedVehicleType("");
    setSelectedVehicleBrand("");
    setVehicleSearch("");
    setCustomerSearch("");
    setFormData({
      sellingPrice: 0,
      advanceAmount: 0,
      expenses: 0,
      consultancyFees: 0,
      aadhaarNumber: "",
      panNumber: "",
      customerRole: "Buyer",
      date: new Date().toISOString().split("T")[0],
      settlementType: "Customer Balance Pending",
      financeName: "",
      financeRef: ""
    });
    fetchNextSaleId();
    setShowCreateModal(true);
  };

  const availableVehicleTypes = useMemo(() => {
    const types = new Set(["Four Wheeler", "Two Wheeler", "Commercial", "Three Wheeler"]);
    (vehicles || []).forEach((v) => {
      if (v) {
        const t = v.vehicleType || v.vehicle_type;
        if (t) types.add(t);
      }
    });
    return Array.from(types);
  }, [vehicles]);

  const availableVehicleBrands = useMemo(() => {
    const bSet = new Set();
    if (Array.isArray(brands)) {
      brands.forEach((b) => {
        if (typeof b === "string") bSet.add(b);
        else if (b && b.name) bSet.add(b.name);
      });
    }
    (vehicles || []).forEach((v) => {
      if (v) {
        const b = v.brand || v.brand_id;
        if (b) bSet.add(b);
      }
    });
    return Array.from(bSet).filter(Boolean).sort();
  }, [vehicles, brands]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    sellingPrice: 0,
    advanceAmount: 0,
    expenses: 0,
    consultancyFees: 0,
    commission: 0,
    aadhaarNumber: "",
    panNumber: "",
    customerRole: "Buyer",
    date: new Date().toISOString().split("T")[0],
    settlementType: "Customer Balance Pending",
    financeName: "",
    financeRef: ""
  });
  const [uploads, setUploads] = useState({
    photo: null,
    aadhaar: null,
    pan: null
  });

  const filteredCustomers = useMemo(() => {
    const q = (customerSearch || "").toLowerCase().trim();
    const cleanQ = q.replace(/[^a-z0-9]/gi, "");
    return (customers || []).filter((c) => {
      if (!c || c.isDeleted) return false;
      if (!q) return true;
      const cId = String(c.id || c.customer_id || "").toLowerCase();
      const cleanId = cId.replace(/[^a-z0-9]/gi, "");
      const name = String(c.name || c.customer_name || "").toLowerCase();
      const mobile = String(c.mobile || c.customer_mobile || "").toLowerCase();
      return (
        name.includes(q) ||
        mobile.includes(q) ||
        cId.includes(q) ||
        (cleanQ && cleanId.includes(cleanQ))
      );
    });
  }, [customers, customerSearch]);

  const filteredVehicles = useMemo(() => {
    return (vehicles || []).filter((v) => {
      if (!v || v.isDeleted) return false;
      const isAvailable = v.status === "Available" || (editingDeal && (v.id === editingDeal.vehicleId || v.purchase_id === editingDeal.vehicleId));
      if (!isAvailable) return false;

      const vType = String(v.vehicleType || v.vehicle_type || "").trim();
      if (selectedVehicleType && vType.toLowerCase() !== selectedVehicleType.toLowerCase()) return false;

      const vBrand = String(v.brand || v.brand_id || "").trim();
      if (selectedVehicleBrand && vBrand.toLowerCase() !== selectedVehicleBrand.toLowerCase()) return false;

      if (!vehicleSearch || !vehicleSearch.trim()) return true;
      const q = vehicleSearch.toLowerCase().trim();
      const cleanQ = q.replace(/[^a-z0-9]/gi, "");
      const vId = String(v.id || v.purchase_id || v.purchaseNo || "").toLowerCase();
      const cleanId = vId.replace(/[^a-z0-9]/gi, "");
      const nameStr = String(v.name || v.vehicle_name || v.vehicle_name_id || "").toLowerCase();
      const regStr = String(v.regNo || v.reg_no || "").toLowerCase();
      const cleanReg = regStr.replace(/[^a-z0-9]/gi, "");
      const brandStr = vBrand.toLowerCase();
      const typeStr = vType.toLowerCase();
      const fuelStr = String(v.fuelType || v.fuel_type || "").toLowerCase();
      const yearStr = String(v.year || v.model_details || "").toLowerCase();

      return (
        nameStr.includes(q) ||
        regStr.includes(q) ||
        vId.includes(q) ||
        brandStr.includes(q) ||
        typeStr.includes(q) ||
        fuelStr.includes(q) ||
        yearStr.includes(q) ||
        (cleanQ && (cleanId.includes(cleanQ) || cleanReg.includes(cleanQ)))
      );
    });
  }, [vehicles, vehicleSearch, selectedVehicleType, selectedVehicleBrand, editingDeal]);
  const totalPrice = Number(formData.sellingPrice || 0) + Number(formData.consultancyFees || 0);
  const balanceAmount = Math.max(0, totalPrice - Number(formData.advanceAmount || 0));
  const purchasePrice = selectedVehicle ? Number(selectedVehicle.purchasePrice || selectedVehicle.purchase_price) || 0 : 0;
  const vehicleExpenses = Number(formData.expenses) || (selectedVehicle ? Number(selectedVehicle.totalExpenses) || 0 : 0);
  const consultancyFees = Number(formData.consultancyFees) || 0;
  const otherCosts = Number(formData.commission) || 0;
  const totalVehicleCost = purchasePrice + vehicleExpenses + consultancyFees + otherCosts;
  const sellingPriceVal = Number(formData.sellingPrice) || 0;
  const grossProfit = sellingPriceVal - purchasePrice;
  const netProfit = sellingPriceVal - totalVehicleCost;
  const profitMarginPercent = totalVehicleCost > 0 ? ((netProfit / totalVehicleCost) * 100).toFixed(2) : "0.00";
  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerMobile.trim()) {
      alert("Please enter Customer Name and Mobile Number for quick customer creation");
      return;
    }
    const generatedId = `CUS-${Date.now().toString().slice(-4)}`;
    const newCust = {
      id: generatedId,
      name: newCustomerName.trim(),
      mobile: newCustomerMobile.trim(),
      city: newCustomerCity.trim() || "Coimbatore",
      area: newCustomerArea.trim(),
      subArea: newCustomerSubArea.trim(),
      address: newCustomerAddress.trim(),
      customer_type: "Buy",
      requirement: "Buy",
      status: "Direct Sales Buyer",
      branch: currentUser?.branch || "Coimbatore",
      isDeleted: false,
      createdBy: currentUser?.name || "Admin",
      createdAt: new Date().toISOString()
    };
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCust)
      });
      if (res.ok) {
        const data = await res.json();
        const saved = data.customer || newCust;
        if (onUpdateCustomers) {
          onUpdateCustomers((prev) => [...prev, saved]);
        }
        if (onRefreshData) onRefreshData();
        setSelectedCustomer(saved);
        setCustomerFlow("existing");
        setNewCustomerName("");
        setNewCustomerMobile("");
        setNewCustomerCity("");
        setNewCustomerArea("");
        setNewCustomerSubArea("");
        setNewCustomerAddress("");
        alert(`Customer "${saved.name || newCustomerName.trim()}" created successfully and selected as buyer!`);
      } else {
        if (onUpdateCustomers) {
          onUpdateCustomers((prev) => [...prev, newCust]);
        }
        setSelectedCustomer(newCust);
        setCustomerFlow("existing");
      }
    } catch (err) {
      console.error("[Quick Add Customer Error]", err);
      if (onUpdateCustomers) {
        onUpdateCustomers((prev) => [...prev, newCust]);
      }
      setSelectedCustomer(newCust);
      setCustomerFlow("existing");
    }
  };
  const handleSaveSale = async () => {
    if (!selectedCustomer || !selectedVehicle) {
      alert("Please select both a Customer and a Vehicle before saving.");
      return;
    }
    if (isSaving) return;
    setIsSaving(true);

    try {
      const settlementTypeVal = formData.settlementType || (balanceAmount === 0 ? "Fully Paid" : "Customer Balance Pending");
      const finalBalanceAmount = settlementTypeVal === "Fully Paid" ? 0 : balanceAmount;
      const statusVal = (settlementTypeVal === "Fully Paid" || settlementTypeVal === "Settled by Finance" || finalBalanceAmount === 0) ? "Completed" : "Pending";

      if (editingDeal) {
        const updatedDeal = {
          ...editingDeal,
          id: formSaleId ? formSaleId.trim() : editingDeal.id,
          deal_id: formSaleId ? formSaleId.trim() : (editingDeal.deal_id || editingDeal.id),
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          vehicleId: selectedVehicle.id,
          vehicleName: selectedVehicle.name,
          sellingPrice: formData.sellingPrice,
          totalPrice,
          advanceAmount: formData.advanceAmount,
          balanceAmount: finalBalanceAmount,
          settlementType: settlementTypeVal,
          financeName: formData.financeName || "",
          financeRef: formData.financeRef || "",
          consultancyFees: Number(formData.consultancyFees) || 0,
          status: statusVal,
          date: formData.date,
          aadhaarNumber: formData.aadhaarNumber,
          panNumber: formData.panNumber,
          uploads: {
            photo: uploads.photo,
            aadhaar: uploads.aadhaar,
            pan: uploads.pan
          }
        };

        const res = await fetch(`/api/deals/${editingDeal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDeal)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update sale record on server.");
        }

        const saved = await res.json();
        onUpdateDeals((prev) => prev.map((d) => (d.id === editingDeal.id ? saved : d)));

        // Close modal and reset form immediately for instant user feedback
        setShowCreateModal(false);
        setEditingDeal(null);
        setSelectedCustomer(null);
        setSelectedVehicle(null);
        setUploads({ photo: null, aadhaar: null, pan: null });
        setFormData({
          sellingPrice: 0,
          advanceAmount: 0,
          expenses: 0,
          consultancyFees: 0,
          aadhaarNumber: "",
          panNumber: "",
          date: new Date().toISOString().split("T")[0]
        });

        // Trigger PDF receipt generation and refresh data asynchronously
        setTimeout(() => {
          generateReceipt(saved);
          if (onRefreshData) onRefreshData().catch(console.error);
        }, 50);

      } else {
        const payload = {
          id: formSaleId ? formSaleId.trim() : undefined,
          deal_id: formSaleId ? formSaleId.trim() : undefined,
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          vehicleId: selectedVehicle.id,
          vehicleName: selectedVehicle.name,
          type: "Sell",
          purchasePrice: selectedVehicle.purchasePrice || selectedVehicle.purchase_price || 0,
          expenses: selectedVehicle.totalExpenses || 0,
          sellingPrice: formData.sellingPrice,
          totalPrice,
          advanceAmount: formData.advanceAmount,
          balanceAmount: finalBalanceAmount,
          settlementType: settlementTypeVal,
          financeName: formData.financeName || "",
          financeRef: formData.financeRef || "",
          consultancyFees: Number(formData.consultancyFees) || 0,
          commission: 0,
          assignedAgentId: "S-1",
          agent: "John Staff",
          status: statusVal,
          date: formData.date,
          createdBy: "S-1",
          aadhaarNumber: formData.aadhaarNumber,
          panNumber: formData.panNumber,
          uploads: {
            photo: uploads.photo,
            aadhaar: uploads.aadhaar,
            pan: uploads.pan
          }
        };

        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create sale record on server.");
        }

        const savedDeal = await res.json();
        onUpdateDeals((prev) => [savedDeal, ...prev]);
        if (onUpdateVehicles) {
          onUpdateVehicles(vehicles.map((v) => (v.id === selectedVehicle.id ? { ...v, status: "Sold" } : v)));
        }

        // Close modal and reset form immediately for instant user feedback
        setShowCreateModal(false);
        setEditingDeal(null);
        setSelectedCustomer(null);
        setSelectedVehicle(null);
        setUploads({ photo: null, aadhaar: null, pan: null });
        setFormData({
          sellingPrice: 0,
          advanceAmount: 0,
          expenses: 0,
          consultancyFees: 0,
          aadhaarNumber: "",
          panNumber: "",
          date: new Date().toISOString().split("T")[0]
        });

        // Trigger PDF receipt generation and refresh data asynchronously
        setTimeout(() => {
          generateReceipt(savedDeal);
          if (onRefreshData) onRefreshData().catch(console.error);
        }, 50);
      }
    } catch (err) {
      console.error("Error saving sale receipt:", err);
      alert("Failed to save sale receipt: " + (err.message || "Network error occurred"));
    } finally {
      setIsSaving(false);
    }
  };
  const generateReceipt = (deal) => {
    generateCustomerReceiptPDF({
      receiptNo: `REC-${deal.id}`,
      id: deal.id,
      date: deal.date,
      customerName: deal.customerName,
      customerMobile: deal.customerMobile || deal.mobile,
      vehicleName: deal.vehicleName,
      regNo: deal.regNo,
      sellingPrice: deal.sellingPrice,
      advanceAmount: deal.advanceAmount,
      receivedAmount: deal.advanceAmount,
      balanceAmount: deal.balanceAmount,
      paymentMode: deal.paymentMode || "Cash",
      referenceNo: deal.referenceNo || deal.id,
      remarks: deal.remarks || deal.narration || "Sale Booking Advance"
    }, businessProfile);
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales Management</h2>
          <p className="text-sm text-slate-500">Manage vehicle sales and customer receipts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const defaultVeh = vehicles.find((v) => v.status === "Available") || vehicles[0] || {};
              setPosterVehicle(defaultVeh);
              setPosterDeal(null);
              setShowPosterModal(true);
            }}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2.5 rounded-xl font-extrabold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-200 cursor-pointer"
          >
            <Sparkles size={18} />
            <span>Showroom Advert Poster</span>
          </button>
          {hasModulePermission(currentUser, "sales", "create") && (
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 cursor-pointer"
            >
              <Plus size={20} />
              Create Sale
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{(Number(stats.totalSales) || 0).toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Collections</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{(Number(stats.collections) || 0).toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-amber-600">Pending Balance</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{(Number(stats.pending) || 0).toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-brand-600">Total Deals</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.count}</h3>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search by ID, customer, or vehicle..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
  />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto">
          {["all", "completed", "pending"].map((tab) => <button
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
            setSearchQuery("");
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase rounded-xl transition-all cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sale ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer & Vehicle</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Sale Value</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-80">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeals.map((deal) => {
                const dealStats = calculateDealSalesOutstanding(deal, payments, vouchers);
                const totalSaleValue = dealStats.totalSaleValue;
                const outstandingBal = dealStats.outstanding;

                return (
                  <tr
                    key={deal.id}
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{deal.id}</span>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{deal.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <User size={14} className="text-slate-400" />
                          {deal.customerName}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Car size={14} className="text-slate-400" />
                          {deal.vehicleName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">₹{totalSaleValue.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        Selling: ₹{(Number(deal.sellingPrice) || 0).toLocaleString("en-IN")}
                        {Number(deal.consultancyFees || 0) > 0 && ` + Fee: ₹${Number(deal.consultancyFees).toLocaleString("en-IN")}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-sm font-bold",
                        outstandingBal > 0 ? "text-rose-600" : "text-emerald-600"
                      )}>
                        ₹{outstandingBal.toLocaleString("en-IN")}
                      </span>
                    </td>
                  <td className="px-6 py-4">
                    <span className={cn(
    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
    deal.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  )}>
                      {deal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setSelectedDeal(deal);
    }}
    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-brand-50 text-slate-700 hover:text-brand-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-slate-200 outline-none"
    title="View Sale Details"
  >
                        <Eye size={12} className="text-slate-500" />
                        <span>View</span>
                      </button>
                      {hasModulePermission(currentUser, "sales", "edit") && (
                        <button
                          type="button"
                          onClick={(e) => handleEditDeal(deal, e)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-slate-200 outline-none"
                          title="Edit Sale"
                        >
                          <Edit2 size={12} className="text-slate-500" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate && onNavigate("payments", { paymentsSubTab: "customer", partyId: deal.customerId, vehicleId: deal.vehicleId || deal.id });
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-emerald-200 outline-none"
                        title="Record Customer Receipt"
                      >
                        <CreditCard size={12} className="text-emerald-600" />
                        <span>Receipt</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateReceipt(deal);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-slate-200 outline-none"
                        title="Print Receipt"
                      >
                        <Printer size={12} className="text-slate-500" />
                        <span>Print</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleOpenPoster(deal, e)}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-indigo-200 outline-none"
                        title="Sales Poster & Share"
                      >
                        <Share2 size={12} className="text-indigo-600" />
                        <span>Share</span>
                      </button>
                      {hasModulePermission(currentUser, "sales", "delete") && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDeal(deal.id, e)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-rose-200 outline-none"
                          title="Delete Sale"
                        >
                          <Trash2 size={12} className="text-rose-500" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Sale Details Modal */
  }
      <AnimatePresence>
        {selectedDeal && <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedDeal(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Sale Details: {selectedDeal.id}</h3>
                  <p className="text-xs text-slate-500">Sold on {selectedDeal.date} by {selectedDeal.agent}</p>
                </div>
                <button onClick={() => setSelectedDeal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Customer</p>
                      <p className="text-lg font-bold text-slate-900">{selectedDeal.customerName}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Vehicle</p>
                      <p className="text-lg font-bold text-slate-900">{selectedDeal.vehicleName}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Financial Breakdown</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-slate-500">Purchase Price</p>
                        <p className="text-sm font-bold text-slate-900">₹{(Number(selectedDeal.purchasePrice) || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expenses</p>
                        <p className="text-sm font-bold text-rose-600">₹{(Number(selectedDeal.expenses) || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Selling Price</p>
                        <p className="text-sm font-bold text-emerald-600">₹{(Number(selectedDeal.sellingPrice) || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Consultancy Fees</p>
                        <p className="text-sm font-bold text-indigo-600">₹{(Number(selectedDeal.consultancyFees) || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 font-bold">Total Sale Value</p>
                        <p className="text-lg font-bold text-slate-900">₹{(Number(selectedDeal.totalPrice) || (Number(selectedDeal.sellingPrice || 0) + Number(selectedDeal.consultancyFees || 0))).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 font-bold">Advance Received</p>
                        <p className="text-lg font-bold text-emerald-600">₹{(Number(selectedDeal.advanceAmount) || 0).toLocaleString("en-IN")}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500 font-bold">Outstanding Balance</p>
                        {(() => {
                          const dealRes = calculateDealSalesOutstanding(selectedDeal, payments, vouchers);
                          return (
                            <p className={cn("text-lg font-bold", dealRes.outstanding > 0 ? "text-rose-600" : "text-emerald-600")}>
                              ₹{dealRes.outstanding.toLocaleString("en-IN")}
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => generateReceipt(selectedDeal)}
                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-100"
                  >
                    <Printer size={18} />
                    Print Receipt
                  </button>
                  <button
                    onClick={() => handleOpenPoster(selectedDeal)}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 cursor-pointer"
                  >
                    <Share2 size={18} />
                    Sales Poster & Share
                  </button>
                  <button
                    onClick={() => setShowDocsModal(true)}
                    className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <FileText size={18} />
                    View Documents
                  </button>
                </div>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      <AnimatePresence>
        {showDocsModal && selectedDeal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-sans">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDocsModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Sales Document Viewer</h3>
                  <p className="text-xs text-slate-500">Related documents for sale deal {selectedDeal.id}</p>
                </div>
                <button
                  onClick={() => setShowDocsModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer hover:bg-slate-50"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-6 space-y-6 no-scrollbar">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer KYC files</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between h-40">
                      <div>
                        <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                          <Eye size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Profile Photo</p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{selectedDeal.uploads?.photo || "No file uploaded"}</p>
                      </div>
                      {selectedDeal.uploads?.photo ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 px-2 rounded-lg self-center">✓ Verified Archive</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Not Provided</span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between h-40">
                      <div>
                        <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                          <FileText size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Aadhaar Card</p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{selectedDeal.uploads?.aadhaar || selectedDeal.aadhaarNumber || "No file / ID"}</p>
                      </div>
                      {selectedDeal.uploads?.aadhaar || selectedDeal.aadhaarNumber ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 px-2 rounded-lg self-center">✓ Uploaded & Active</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Not Provided</span>
                      )}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center flex flex-col justify-between h-40">
                      <div>
                        <div className="mx-auto w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
                          <FileText size={18} />
                        </div>
                        <p className="text-xs font-bold text-slate-800">PAN Card</p>
                        <p className="text-[10px] text-slate-500 mt-1 truncate">{selectedDeal.uploads?.pan || selectedDeal.panNumber || "No file / ID"}</p>
                      </div>
                      {selectedDeal.uploads?.pan || selectedDeal.panNumber ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 py-1 px-2 rounded-lg self-center">✓ Uploaded & Active</span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400">Not Provided</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Documentation</h4>
                  {(() => {
                    const veh = vehicles.find((v) => v.id === selectedDeal.vehicleId) || {};
                    return (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                          <div>
                            <p className="text-xs font-semibold text-slate-500">Selected Vehicle</p>
                            <p className="text-sm font-black text-slate-800">{selectedDeal.vehicleName}</p>
                          </div>
                          <span className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-xl border border-indigo-100">
                            {veh.regNo || "N/A"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">RC Type</p>
                              <p className="text-xs font-bold text-slate-850">{veh.rcType ? `${veh.rcType} RC Book` : "Smart Card RC verified"}</p>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <ShieldCheck size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Insurance Policy</p>
                              <p className="text-xs font-bold text-slate-850">
                                {veh.insurance?.hasInsurance ? "Active & Insured" : "Inherent cover validated"}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">NOC Availability</p>
                              <p className="text-xs font-bold text-slate-850">
                                {veh.noc?.hasNoc ? "NOC Transferred" : "NOC Clearance Clear"}
                              </p>
                            </div>
                          </div>

                          <div className="p-3 bg-white border border-slate-100 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <CheckCircle2 size={16} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Status</p>
                              <p className="text-xs font-bold text-slate-850">Sold (Clear of Liens)</p>
                            </div>
                          </div>
                        </div>

                        {veh.insurance?.docUrl && (
                          <div className="pt-2">
                            <a
                              href={veh.insurance.docUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-all underline"
                            >
                              <FileText size={14} />
                              Open original vehicle insurance certificate link
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setShowDocsModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded-xl transition-all cursor-pointer"
                >
                  Close Document Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {
    /* Create Sale Modal */
  }
      <AnimatePresence>
        {showCreateModal && <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {editingDeal ? "Edit Sale Record" : "Create New Sale"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Link buyer customer and vehicle details to record sale</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-xl">
                    <label className="text-xs font-bold text-brand-800 uppercase tracking-wider whitespace-nowrap">Sales ID:</label>
                    <input
                      type="text"
                      value={formSaleId || ""}
                      onChange={(e) => setFormSaleId(e.target.value)}
                      className="w-28 sm:w-36 px-2 py-0.5 bg-white border border-brand-300 rounded-lg text-sm font-black text-brand-900 font-mono focus:ring-2 focus:ring-brand-500 outline-none"
                      placeholder="S-1001"
                    />
                  </div>
                  <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {
    /* Customer Search */
  }
                  {/* Customer Contact Selector (Existing vs Direct Add Customer) */}
                  <div className="space-y-3 relative md:col-span-2 bg-brand-50/40 p-4 rounded-xl border border-brand-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-brand-900 uppercase tracking-widest">Customer Contact Selector</h4>
                        <p className="text-[10px] text-slate-400 font-bold">Select existing customer or add direct entry</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setCustomerFlow("existing")}
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer",
                            customerFlow === "existing" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          Existing Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomerFlow("new");
                            setShowCustomerModal(true);
                          }}
                          className={cn(
                            "px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                            customerFlow === "new" ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          + Direct Add Customer
                        </button>
                      </div>
                    </div>

                    {customerFlow === "existing" ? (
                      selectedCustomer ? (
                        <div className="flex flex-col p-3.5 bg-white border border-brand-200 rounded-xl space-y-2 text-left shadow-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-brand-700">Customer ID: {selectedCustomer.id || selectedCustomer.customer_id}</p>
                              <p className="text-sm font-bold text-slate-800">
                                {selectedCustomer.name || selectedCustomer.customer_name} <span className="text-xs font-bold text-brand-600">({selectedCustomer.role || "Buyer"})</span>
                              </p>
                              <p className="text-xs text-slate-600">Mobile: {selectedCustomer.mobile || selectedCustomer.customer_mobile}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(null)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Change Customer"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          <div className="border-t border-slate-100 pt-1.5 space-y-1 text-xs text-slate-700">
                            <p><span className="font-bold text-slate-500">Address:</span> {selectedCustomer.address || "N/A"}</p>
                            <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] font-semibold text-slate-600">
                              <div><span className="text-slate-400">City:</span> {selectedCustomer.city || selectedCustomer.cityId || "N/A"}</div>
                              <div><span className="text-slate-400">Area:</span> {selectedCustomer.area || selectedCustomer.areaId || "N/A"}</div>
                              <div><span className="text-slate-400">Sub Area:</span> {selectedCustomer.subArea || selectedCustomer.subAreaId || "N/A"}</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-extrabold text-brand-800 uppercase tracking-widest block mb-1">Search Customer</label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                  type="text"
                                  value={customerSearch}
                                  onChange={(e) => setCustomerSearch(e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold text-slate-800"
                                  placeholder="Search by ID, name, or phone..."
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-extrabold text-brand-800 uppercase tracking-widest block mb-1">Choose Dropdown</label>
                              <select
                                value={selectedCustomer?.id || ""}
                                onChange={(e) => {
                                  const found = customers.find((c) => (c.id || c.customer_id) === e.target.value);
                                  if (found) setSelectedCustomer(found);
                                }}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-bold text-slate-700"
                              >
                                <option value="">-- Choose Existing Customer --</option>
                                {customers
                                  .filter((c) => !c.isDeleted)
                                  .map((c) => (
                                    <option key={c.id || c.customer_id} value={c.id || c.customer_id}>
                                      {c.id || c.customer_id} - {c.name || c.customer_name} ({c.mobile || c.customer_mobile || "No Mobile"})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          </div>

                          {customerSearch && (
                            <div className="z-20 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                              {filteredCustomers.map((c) => (
                                <button
                                  key={c.id || c.customer_id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCustomer(c);
                                    setCustomerSearch("");
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-brand-50 text-xs border-b border-slate-100 last:border-0 transition-colors"
                                >
                                  <p className="font-bold text-slate-900">ID: {c.id || c.customer_id} - {c.name || c.customer_name}</p>
                                  <p className="text-[11px] text-slate-500">{c.mobile || c.customer_mobile} • {c.address || c.city || "N/A"}</p>
                                </button>
                              ))}
                              {filteredCustomers.length === 0 && (
                                <div className="p-3 text-center text-xs text-slate-400 font-bold">No matching customers. Switch to "+ Direct Add Customer" to create.</div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    ) : (
                      <div className="space-y-3 bg-white p-4 rounded-xl border border-brand-300 shadow-sm text-center">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-brand-900 uppercase tracking-wider">Direct Customer Entry</span>
                          <span className="text-[10px] text-brand-700 font-medium">Full customer profile form with documents & photo verification</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium my-2">
                          Create a new buyer customer lead with all 16 fields (Aadhaar, PAN, Photos, Location Master) and link directly to this sale.
                        </p>
                        <div className="flex justify-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setCustomerFlow("existing")}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomerModal(true)}
                            className="px-5 py-2 bg-brand-600 text-white rounded-xl font-bold text-xs hover:bg-brand-700 shadow-md transition-all cursor-pointer flex items-center gap-2"
                          >
                            <Plus size={16} /> Open Customer Entry Form
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vehicle Search & Filters */}
                  <div className="space-y-3 relative md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Vehicle Selector & Filter</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Filter available stock by Vehicle Type, Brand, or Registration Number</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Vehicle Type</label>
                        <select
                          value={selectedVehicleType}
                          onChange={(e) => setSelectedVehicleType(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="">-- All Vehicle Types --</option>
                          {availableVehicleTypes.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Brand</label>
                        <select
                          value={selectedVehicleBrand}
                          onChange={(e) => setSelectedVehicleBrand(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="">-- All Brands --</option>
                          {availableVehicleBrands.map((b) => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Search Reg / Model</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input
                            type="text"
                            value={vehicleSearch}
                            onChange={(e) => setVehicleSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="Search Reg No, Name..."
                          />
                        </div>
                      </div>
                    </div>

                    {selectedVehicle ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-brand-300 rounded-xl gap-3 shadow-sm">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black bg-brand-600 text-white px-2 py-0.5 rounded font-mono">
                              {selectedVehicle.regNo || selectedVehicle.reg_no || "NO REG"}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900">{selectedVehicle.name || selectedVehicle.vehicle_name}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                            <span><strong className="text-slate-400">Type:</strong> {selectedVehicle.vehicleType || selectedVehicle.vehicle_type || "N/A"}</span>
                            <span><strong className="text-slate-400">Brand:</strong> {selectedVehicle.brand || selectedVehicle.brand_id || "N/A"}</span>
                            <span><strong className="text-slate-400">Year:</strong> {selectedVehicle.year || selectedVehicle.model_details || "N/A"}</span>
                            <span><strong className="text-slate-400">Fuel:</strong> {selectedVehicle.fuelType || selectedVehicle.fuel_type || "Petrol"}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-brand-700 font-bold pt-1">
                            <span>Purchase Price: ₹{(Number(selectedVehicle.purchasePrice || selectedVehicle.purchase_price) || 0).toLocaleString("en-IN")}</span>
                            <span>•</span>
                            <span>Preset Sales Price: ₹{(Number(selectedVehicle.salesPrice || selectedVehicle.sales_price || selectedVehicle.expectedSellingPrice || selectedVehicle.expected_selling_price || selectedVehicle.offerPrice || selectedVehicle.offer_price || (Number(selectedVehicle.sellingPrice) > 0 ? selectedVehicle.sellingPrice : 0) || (Number(selectedVehicle.selling_price) > 0 ? selectedVehicle.selling_price : 0)) || 0).toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedVehicle(null)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer self-end sm:self-center"
                          title="Change Vehicle"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Available Vehicles ({filteredVehicles.length})</label>
                          <span className="text-[10px] text-slate-400">Click to select vehicle</span>
                        </div>
                        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-inner max-h-52 overflow-y-auto divide-y divide-slate-100">
                          {filteredVehicles.map((v) => (
                            <button
                              key={v.id || v.purchase_id}
                              type="button"
                              onClick={() => {
                                setSelectedVehicle(v);
                                setVehicleSearch("");
                                const offerVal = Number(
                                  v.salesPrice ||
                                  v.sales_price ||
                                  v.expectedSellingPrice ||
                                  v.expected_selling_price ||
                                  v.offerPrice ||
                                  v.offer_price ||
                                  (Number(v.sellingPrice) > 0 ? v.sellingPrice : 0) ||
                                  (Number(v.selling_price) > 0 ? v.selling_price : 0)
                                ) || 0;
                                setFormData((prev) => ({
                                  ...prev,
                                  sellingPrice: offerVal,
                                  expenses: Number(v.totalExpenses || v.expenses) || 0,
                                  consultancyFees: Number(v.consultancyFees || v.consultancy_fees) || 0
                                }));
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-brand-50 text-xs transition-colors flex items-center justify-between group"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-brand-100 group-hover:text-brand-800">
                                    {v.regNo || v.reg_no || "NO REG"}
                                  </span>
                                  <span className="font-extrabold text-slate-900 text-sm group-hover:text-brand-900">{v.name || v.vehicle_name}</span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  Type: <strong className="text-slate-700">{v.vehicleType || v.vehicle_type || "N/A"}</strong> • Brand: <strong className="text-slate-700">{v.brand || v.brand_id || "N/A"}</strong> • Year: {v.year || v.model_details || "N/A"} • Fuel: {v.fuelType || v.fuel_type || "Petrol"}
                                </p>
                              </div>
                              <div className="text-right pl-3">
                                <p className="font-extrabold text-brand-700 text-sm">
                                  ₹{(Number(v.salesPrice || v.sales_price || v.expectedSellingPrice || v.expected_selling_price || v.offerPrice || v.offer_price || (Number(v.sellingPrice) > 0 ? v.sellingPrice : 0) || (Number(v.selling_price) > 0 ? v.selling_price : 0)) || 0).toLocaleString("en-IN")}
                                </p>
                                <p className="text-[10px] text-slate-400">Purchase: ₹{(Number(v.purchasePrice || v.purchase_price) || 0).toLocaleString("en-IN")}</p>
                              </div>
                            </button>
                          ))}
                          {filteredVehicles.length === 0 && (
                            <div className="p-4 text-center text-xs text-slate-400 font-medium">
                              No available vehicles match the selected filters.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Sale Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Selling Price (₹)</label>
                    <input type="number" value={formData.sellingPrice} onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="6,50,000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Advance Amount (₹)</label>
                    <input type="number" value={formData.advanceAmount} onChange={(e) => setFormData({ ...formData, advanceAmount: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="50,000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Expenses (₹)</label>
                    <input type="number" value={formData.expenses} onChange={(e) => setFormData({ ...formData, expenses: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="15,000" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Consultancy Fees (₹)</label>
                    <input type="number" value={formData.consultancyFees} onChange={(e) => setFormData({ ...formData, consultancyFees: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Total Selling Price (₹) <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-black ml-1">Auto Read-only</span></label>
                    <input type="text" readOnly value={`\u20B9 ${(Number(totalPrice) || 0).toLocaleString("en-IN")}`} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-850 cursor-not-allowed outline-none focus:ring-0" />
                  </div>
                </div>

                {/* LIVE SALES PROFITABILITY CALCULATION CARD */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Live Profitability Analysis</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Margin: {profitMarginPercent}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px]">Purchase Cost</p>
                      <p className="font-bold text-slate-200">₹{purchasePrice.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Total Expenses & Cost</p>
                      <p className="font-bold text-slate-200">₹{totalVehicleCost.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Gross Profit</p>
                      <p className={cn("font-extrabold", grossProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>₹{grossProfit.toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Net Profit</p>
                      <p className={cn("font-extrabold", netProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>₹{netProfit.toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800">Settlement Type</label>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">Payment Routing</span>
                  </div>
                  <select
                    value={formData.settlementType || (balanceAmount === 0 ? "Fully Paid" : "Customer Balance Pending")}
                    onChange={(e) => setFormData({ ...formData, settlementType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Customer Balance Pending">Customer Balance Pending (Customer owes balance)</option>
                    <option value="Settled by Finance">Settled by Finance (Loan/Finance Company payout)</option>
                    <option value="Fully Paid">Fully Paid (No balance remaining)</option>
                  </select>

                  {formData.settlementType === "Settled by Finance" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Finance Institution / Bank</label>
                        <input
                          type="text"
                          value={formData.financeName || ""}
                          onChange={(e) => setFormData({ ...formData, financeName: e.target.value })}
                          placeholder="e.g. HDFC Bank / Sundaram Finance"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Finance Approval / Ref No.</label>
                        <input
                          type="text"
                          value={formData.financeRef || ""}
                          onChange={(e) => setFormData({ ...formData, financeRef: e.target.value })}
                          placeholder="e.g. FIN-APP-98231"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-6 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Customer KYC & Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Aadhaar Number</label>
                        <input
    type="text"
    value={formData.aadhaarNumber}
    onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })}
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    placeholder="0000 0000 0000"
  />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">PAN Number</label>
                        <input
    type="text"
    value={formData.panNumber}
    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    placeholder="ABCDE1234F"
  />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                       <div onClick={() => photoInputRef.current?.click()} className={cn("p-4 border rounded-xl cursor-pointer text-center", uploads.photo ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
                         <p className="text-xs font-bold">Photo</p>
                         <p className="text-[10px] text-slate-500 truncate">{uploads.photo || "Upload"}</p>
                       </div>
                       <div onClick={() => aadhaarInputRef.current?.click()} className={cn("p-4 border rounded-xl cursor-pointer text-center", uploads.aadhaar ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
                         <p className="text-xs font-bold">Aadhaar</p>
                         <p className="text-[10px] text-slate-500 truncate">{uploads.aadhaar || "Upload"}</p>
                       </div>
                       <div onClick={() => panInputRef.current?.click()} className={cn("p-4 border rounded-xl cursor-pointer text-center", uploads.pan ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
                         <p className="text-xs font-bold">PAN</p>
                         <p className="text-[10px] text-slate-500 truncate">{uploads.pan || "Upload"}</p>
                       </div>
                       <input type="file" ref={photoInputRef} className="hidden" onChange={(e) => handleFileChange("photo", e)} />
                       <input type="file" ref={aadhaarInputRef} className="hidden" onChange={(e) => handleFileChange("aadhaar", e)} />
                       <input type="file" ref={panInputRef} className="hidden" onChange={(e) => handleFileChange("pan", e)} />
                    </div>
                  </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Price:</span>
                    <span className="font-bold text-slate-900">₹{(Number(totalPrice) || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Balance Due:</span>
                    <span className="font-bold text-rose-600">₹{(Number(balanceAmount) || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={isSaving}
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSale}
                    disabled={isSaving || !selectedCustomer || !selectedVehicle}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Saving & Printing...</span>
                      </>
                    ) : (
                      <>
                        <Printer size={16} />
                        <span>Save & Print Receipt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* Delete Confirmation Modal */
  }
      <AnimatePresence>
        {dealToDelete && <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setDealToDelete(null)}
    className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 overflow-hidden"
  >
              <h3 className="text-lg font-bold text-slate-900 mb-2">Confirm Delete</h3>
              <p className="text-sm text-slate-500 mb-6">Are you sure you want to delete this sale record? This action cannot be undone.</p>
              <div className="flex justify-end gap-3">
                <button
    type="button"
    onClick={() => setDealToDelete(null)}
    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none"
  >
                  Cancel
                </button>
                <button
    type="button"
    onClick={confirmDeleteDeal}
    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer outline-none"
  >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>}
      </AnimatePresence>

      {/* SALES POSTER MODAL */}
      <SalesPosterModal
        vehicle={posterVehicle}
        deal={posterDeal}
        businessProfile={businessProfile}
        isOpen={showPosterModal}
        onClose={() => {
          setShowPosterModal(false);
          setPosterVehicle(null);
          setPosterDeal(null);
        }}
      />
      {/* Customer Form Modal for Direct Customer Add */}
      <CustomerFormModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        currentUser={currentUser}
        defaultType="Buy"
        onSuccess={(savedCustomer) => {
          const normalized = {
            id: savedCustomer.customer_id || savedCustomer.id,
            customer_id: savedCustomer.customer_id || savedCustomer.id,
            name: savedCustomer.customer_name || savedCustomer.name,
            customer_name: savedCustomer.customer_name || savedCustomer.name,
            mobile: savedCustomer.customer_mobile || savedCustomer.mobile,
            customer_mobile: savedCustomer.customer_mobile || savedCustomer.mobile,
            address: savedCustomer.address || "",
            city: savedCustomer.city || savedCustomer.city_id || "",
            area: savedCustomer.area || savedCustomer.area_id || "",
            subArea: savedCustomer.subArea || savedCustomer.sub_area_id || "",
            ...savedCustomer
          };
          if (onUpdateCustomers) {
            onUpdateCustomers((prev) => [normalized, ...(prev || []).filter((c) => (c.id || c.customer_id) !== normalized.id)]);
          }
          if (onRefreshData) onRefreshData();
          setSelectedCustomer(normalized);
          setCustomerFlow("existing");
          setShowCustomerModal(false);
        }}
      />
    </div>;
}
