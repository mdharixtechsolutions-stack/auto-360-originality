import React, { useState, useMemo, useEffect } from "react";
import { Plus, Search, User, Car, FileText, X, Trash2, Printer, Edit2, Eye, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasModulePermission } from "../lib/permissions";

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
  vehicles,
  customers,
  deals,
  onUpdateDeals,
  onUpdateVehicles,
  onUpdateCustomers,
  onNavigate,
  initialVehicle,
  currentUser,
  businessProfile,
  initialSearch
}) {
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);
  const [localFrom, setLocalFrom] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [localTo, setLocalTo] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const [fromDate, setFromDate] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [toDate, setToDate] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const handleEditDeal = (deal, e) => {
    e.stopPropagation();
    setEditingDeal(deal);
    const cust = customers.find((c) => c.id === deal.customerId) || { id: deal.customerId, name: deal.customerName, mobile: "" };
    const veh = vehicles.find((v) => v.id === deal.vehicleId) || { id: deal.vehicleId, name: deal.vehicleName, purchasePrice: deal.purchasePrice, totalExpenses: deal.expenses };
    setSelectedCustomer(cust);
    setSelectedVehicle(veh);
    setFormData({
      sellingPrice: deal.sellingPrice,
      advanceAmount: deal.advanceAmount,
      expenses: deal.expenses,
      consultancyFees: deal.consultancyFees || 0,
      aadhaarNumber: deal.aadhaarNumber || "",
      panNumber: deal.panNumber || "",
      date: deal.date
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
          onUpdateDeals((prev) => prev.filter((d) => d.id !== dealToDelete));
          const deal = deals.find((d) => d.id === dealToDelete);
          if (deal && deal.vehicleId) {
            onUpdateVehicles(vehicles.map(
              (v) => v.id === deal.vehicleId ? { ...v, status: "Available" } : v
            ));
          }
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
      setFormData((prev) => ({
        ...prev,
        sellingPrice: Number(initialVehicle.purchasePrice) || 0,
        expenses: Number(initialVehicle.totalExpenses) || 0,
        consultancyFees: Number(initialVehicle.consultancyFees) || 0,
        date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }));
      setShowCreateModal(true);
    }
  }, [initialVehicle]);
  const filteredDeals = useMemo(
    () => deals.filter((d) => {
      const matchesSearch = d.id.toLowerCase().includes(searchQuery.toLowerCase()) || d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || d.vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || activeTab === "completed" && d.status === "Completed" || activeTab === "pending" && d.status === "Pending";
      const isWithinFrom = fromDate ? d.date >= fromDate : true;
      const isWithinTo = toDate ? d.date <= toDate : true;
      return matchesSearch && matchesTab && isWithinFrom && isWithinTo;
    }),
    [deals, searchQuery, activeTab, fromDate, toDate]
  );
  const stats = useMemo(() => ({
    totalSales: deals.reduce((acc, d) => acc + d.sellingPrice, 0),
    collections: deals.reduce((acc, d) => acc + d.advanceAmount, 0),
    pending: deals.reduce((acc, d) => acc + d.balanceAmount, 0),
    count: deals.length
  }), [deals]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({
    sellingPrice: 0,
    advanceAmount: 0,
    expenses: 0,
    consultancyFees: 0,
    aadhaarNumber: "",
    panNumber: "",
    date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  });
  const [uploads, setUploads] = useState({
    photo: null,
    aadhaar: null,
    pan: null
  });
  const photoInputRef = React.useRef(null);
  const aadhaarInputRef = React.useRef(null);
  const panInputRef = React.useRef(null);
  const handleFileChange = (type, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploads((prev) => ({ ...prev, [type]: file.name }));
    }
  };
  const filteredCustomers = useMemo(() => customers.filter(
    (c) => !c.isDeleted && (c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.mobile.includes(customerSearch) || c.id && c.id.toLowerCase().includes(customerSearch.toLowerCase()))
  ), [customers, customerSearch]);
  const filteredVehicles = useMemo(() => vehicles.filter(
    (v) => v.status === "Available" && !v.isDeleted && (v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) || v.regNo.toLowerCase().includes(vehicleSearch.toLowerCase()))
  ), [vehicles, vehicleSearch]);
  const totalPrice = Number(formData.sellingPrice) + Number(formData.consultancyFees);
  const balanceAmount = totalPrice - Number(formData.advanceAmount);
  const purchasePrice = selectedVehicle ? Number(selectedVehicle.purchasePrice) || 0 : 0;
  const totalExpenses = selectedVehicle ? Number(selectedVehicle.totalExpenses) || 0 : 0;
  const consultancyFees = Number(formData.consultancyFees) || 0;
  const totalVehicleCost = purchasePrice + totalExpenses + consultancyFees;
  const handleQuickAddCustomer = async () => {
    if (!newCustomerName.trim() || !newCustomerMobile.trim()) {
      alert("Please enter Name and Mobile for quick customer creation");
      return;
    }
    const generatedId = `CUS-${Date.now().toString().slice(-4)}`;
    const newCust = {
      id: generatedId,
      name: newCustomerName.trim(),
      mobile: newCustomerMobile.trim(),
      city: newCustomerCity.trim() || "Default City",
      area: newCustomerArea.trim(),
      subArea: newCustomerSubArea.trim(),
      address: newCustomerAddress.trim(),
      isDeleted: false,
      createdBy: "Admin",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
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
        setSelectedCustomer(saved);
        setCustomerFlow("existing");
        setNewCustomerName("");
        setNewCustomerMobile("");
        setNewCustomerCity("");
        setNewCustomerArea("");
        setNewCustomerSubArea("");
        setNewCustomerAddress("");
      } else {
        if (onUpdateCustomers) {
          onUpdateCustomers((prev) => [...prev, newCust]);
        }
        setSelectedCustomer(newCust);
        setCustomerFlow("existing");
      }
    } catch {
      if (onUpdateCustomers) {
        onUpdateCustomers((prev) => [...prev, newCust]);
      }
      setSelectedCustomer(newCust);
      setCustomerFlow("existing");
    }
  };
  const handleSaveSale = async () => {
    if (!selectedCustomer || !selectedVehicle) return;
    if (editingDeal) {
      const updatedDeal = {
        ...editingDeal,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        sellingPrice: formData.sellingPrice,
        totalPrice,
        advanceAmount: formData.advanceAmount,
        balanceAmount,
        consultancyFees: Number(formData.consultancyFees) || 0,
        status: balanceAmount > 0 ? "Pending" : "Completed",
        date: formData.date,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        uploads: {
          photo: uploads.photo,
          aadhaar: uploads.aadhaar,
          pan: uploads.pan
        }
      };
      try {
        const res = await fetch(`/api/deals/${editingDeal.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDeal)
        });
        if (res.ok) {
          const saved = await res.json();
          onUpdateDeals((prev) => prev.map((d) => d.id === editingDeal.id ? saved : d));
          generateReceipt(saved);
        } else {
          const err = await res.json();
          alert("Failed to update sale record: " + (err.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Error updating sale", err);
        alert("Network error updating sale");
      }
      setEditingDeal(null);
    } else {
      const payload = {
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        type: "Sell",
        purchasePrice: selectedVehicle.purchasePrice,
        expenses: selectedVehicle.totalExpenses || 0,
        sellingPrice: formData.sellingPrice,
        totalPrice,
        advanceAmount: formData.advanceAmount,
        balanceAmount,
        consultancyFees: Number(formData.consultancyFees) || 0,
        commission: 0,
        assignedAgentId: "S-1",
        agent: "John Staff",
        status: balanceAmount > 0 ? "Pending" : "Completed",
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
      try {
        const res = await fetch("/api/deals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const savedDeal = await res.json();
          onUpdateDeals((prev) => [savedDeal, ...prev]);
          onUpdateVehicles(vehicles.map(
            (v) => v.id === selectedVehicle.id ? { ...v, status: "Sold" } : v
          ));
          generateReceipt(savedDeal);
        } else {
          const err = await res.json();
          alert("Failed to create sale record: " + (err.error || "Unknown error"));
        }
      } catch (err) {
        console.error("Error creating sale", err);
        alert("Network error saving sale");
      }
    }
    setShowCreateModal(false);
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
      date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setUploads({ photo: null, aadhaar: null, pan: null });
  };
  const generateReceipt = (deal) => {
    const doc = new jsPDF();

    const drawPDFContent = (logoImgData = null, signatureImgData = null) => {
      // 1. HEADER SECTION
      doc.setFont("Helvetica", "bold");
      if (logoImgData) {
        try {
          doc.addImage(logoImgData, "PNG", 20, 10, 18, 18);
        } catch (e) {
          console.error("Error adding logo image to PDF", e);
        }
      }

      const hasLogo = !!logoImgData;
      const textStartX = hasLogo ? 43 : 20;

      // Company Name
      const compName = businessProfile?.companyName || "AUTO360 AUTO CONSULTANCY";
      doc.setFontSize(16);
      doc.setTextColor(30, 41, 59);
      doc.text(compName.toUpperCase(), textStartX, 16);

      // Subtitle / Address info
      doc.setFontSize(7.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100);

      const subLines = [];
      if (businessProfile?.address) subLines.push(businessProfile.address);
      if (businessProfile?.mobileNumber) subLines.push(`Mob: ${businessProfile.mobileNumber}`);
      if (businessProfile?.email) subLines.push(`Email: ${businessProfile.email}`);
      if (businessProfile?.website) subLines.push(`Web: ${businessProfile.website}`);
      if (businessProfile?.gstNumber) subLines.push(`GSTIN: ${businessProfile.gstNumber}`);

      if (subLines.length === 0) {
        subLines.push("Premium Pre-owned Vehicles & Consultancy Services");
      }

      const addressLineText = subLines.join(" | ");
      const splitAddress = doc.splitTextToSize(addressLineText, 185 - textStartX);
      doc.text(splitAddress, textStartX, 22);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 31, 190, 31);

      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("SALES TRANSACTION RECEIPT", 20, 43);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Receipt ID: REC-${deal.id}`, 20, 50);
      doc.text(`Transaction Date: ${deal.date}`, 190, 50, { align: "right" });

      doc.setFontSize(10.5);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Customer Profile", 20, 62);
      doc.line(20, 65, 95, 65);
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Name: ${deal.customerName}`, 20, 71);

      doc.setFontSize(10.5);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Vehicle Overview", 115, 62);
      doc.line(115, 65, 190, 65);
      doc.setFontSize(9);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Vehicle: ${deal.vehicleName}`, 115, 71);

      const tableData = [
        ["Description Item Specification", "Charged Value (INR)"],
        ["Selling Valuation Quote", `INR ${deal.sellingPrice.toLocaleString("en-IN")}`],
        ["Authorized Expenses & RC Charges", `INR ${deal.expenses.toLocaleString("en-IN")}`],
        ["Transaction Valuation Total", `INR ${deal.totalPrice.toLocaleString("en-IN")}`],
        ["Advance Booking Paid Amount", `INR ${deal.advanceAmount.toLocaleString("en-IN")}`],
        ["Remaining Pending Due Amount", `INR ${deal.balanceAmount.toLocaleString("en-IN")}`]
      ];
      autoTable(doc, {
        startY: 82,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: "striped",
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 50, halign: "right" }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Grand Total: INR ${deal.totalPrice.toLocaleString("en-IN")}`, 190, finalY, { align: "right" });

      // Dynamic Terms and Conditions rendering block
      if (businessProfile?.termsAndConditions) {
        doc.setFontSize(7.5);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("TERMS & CONDITIONS", 20, finalY + 10);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(110);
        const termsLines = doc.splitTextToSize(businessProfile.termsAndConditions, 170);
        doc.text(termsLines, 20, finalY + 14);
      }

      // Dynamic authorized signature block
      const sigY = finalY + 40;
      doc.setDrawColor(226, 232, 240);
      if (signatureImgData) {
        try {
          doc.addImage(signatureImgData, "PNG", 140, sigY - 14, 32, 11);
        } catch (e) {
          console.error("Error adding signature image to PDF", e);
        }
      }
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Authorized Personnel Officer Signature`, 120, sigY);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120);
      doc.text(`Generated via ${businessProfile?.companyName || "Auto360 Consultancy"} Enterprise ERP`, 120, sigY + 4);

      doc.save(`Receipt_Sales_${deal.id}.pdf`);
    };

    // Async image loaders to fetch and paint dynamic images safely
    const logoUrl = businessProfile?.companyLogo;
    const sigUrl = businessProfile?.authorizedSignature;

    const loadImage = (url) => {
      return new Promise((resolve) => {
        if (!url) {
          resolve(null);
          return;
        }
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            try {
              resolve(canvas.toDataURL("image/png"));
            } catch (err) {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        };
        img.onerror = () => {
          resolve(null);
        };
        img.src = url;
      });
    };

    Promise.all([loadImage(logoUrl), loadImage(sigUrl)]).then(([logoData, sigData]) => {
      drawPDFContent(logoData, sigData);
    });
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Sales Management</h2>
          <p className="text-sm text-slate-500">Manage vehicle sales and customer receipts</p>
        </div>
        {hasModulePermission(currentUser, "sales", "create") && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus size={20} />
            Create Sale
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{stats.totalSales.toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-emerald-600">Collections</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{stats.collections.toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-amber-600">Pending Balance</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{stats.pending.toLocaleString("en-IN")}</h3>
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
              {filteredDeals.map((deal) => <tr
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
                    <p className="text-sm font-bold text-slate-900">₹{deal.sellingPrice.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Total: ₹{deal.totalPrice.toLocaleString("en-IN")}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
    "text-sm font-bold",
    deal.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600"
  )}>
                      ₹{deal.balanceAmount.toLocaleString("en-IN")}
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
                          generateReceipt(deal);
                        }}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-slate-200 outline-none"
                        title="Print Receipt"
                      >
                        <Printer size={12} className="text-slate-500" />
                        <span>Print</span>
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
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Sale Details Modal */
  }
      <AnimatePresence>
        {selectedDeal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                        <p className="text-sm font-bold text-slate-900">₹{selectedDeal.purchasePrice.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Expenses</p>
                        <p className="text-sm font-bold text-rose-600">₹{selectedDeal.expenses.toLocaleString("en-IN")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Selling Price</p>
                        <p className="text-sm font-bold text-emerald-600">₹{selectedDeal.sellingPrice.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500">Total Price</p>
                        <p className="text-lg font-bold text-slate-900">₹{selectedDeal.totalPrice.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500">Advance Paid</p>
                        <p className="text-lg font-bold text-brand-600">₹{selectedDeal.advanceAmount.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-500">Balance Amount</p>
                        <p className={cn("text-lg font-bold", selectedDeal.balanceAmount > 0 ? "text-rose-600" : "text-emerald-600")}>
                          ₹{selectedDeal.balanceAmount.toLocaleString("en-IN")}
                        </p>
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
        {showCreateModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">Create New Sale</h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X size={20} /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {
    /* Customer Search */
  }
                  <div className="space-y-2 relative md:col-span-1">
                    <label className="text-sm font-bold text-slate-700">Customer ID / Selection</label>
                    {selectedCustomer ? <div className="flex flex-col p-3 bg-brand-50 border border-brand-200 rounded-xl space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-brand-700">Customer ID: {selectedCustomer.id}</p>
                            <p className="text-sm font-bold text-slate-800">{selectedCustomer.name}</p>
                            <p className="text-xs text-slate-600">Mobile: {selectedCustomer.mobile}</p>
                          </div>
                          <button onClick={() => setSelectedCustomer(null)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="border-t border-brand-100 pt-1.5 space-y-1 text-xs text-slate-700">
                          <p><span className="font-bold text-slate-500">Address:</span> {selectedCustomer.address || "N/A"}</p>
                          <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] font-semibold text-slate-600">
                            <div><span className="text-slate-400">City:</span> {selectedCustomer.city || selectedCustomer.cityId || "N/A"}</div>
                            <div><span className="text-slate-400">Area:</span> {selectedCustomer.area || selectedCustomer.areaId || "N/A"}</div>
                            <div><span className="text-slate-400">Sub Area:</span> {selectedCustomer.subArea || selectedCustomer.subAreaId || "N/A"}</div>
                          </div>
                        </div>
                      </div> : <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Search customer ID, name, or phone..." />
                        </div>
                        {customerSearch && <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                            {filteredCustomers.map((c) => <button key={c.id} onClick={() => {
    setSelectedCustomer(c);
    setCustomerSearch("");
  }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0">
                                <p className="font-bold text-slate-900">ID: {c.id} - {c.name}</p>
                                <p className="text-xs text-slate-500">{c.mobile} • {c.address || c.city || "N/A"}</p>
                              </button>)}
                          </div>}
                      </>}
                  </div>

                  {
    /* Vehicle Search */
  }
                  <div className="space-y-2 relative md:col-span-1">
                    <label className="text-sm font-bold text-slate-700">Vehicle</label>
                    {selectedVehicle ? <div className="flex items-center justify-between p-3 bg-brand-50 border border-brand-200 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-brand-900">{selectedVehicle.name}</p>
                          <p className="text-[10px] text-brand-600">Purchase: ₹{selectedVehicle.purchasePrice.toLocaleString("en-IN")}</p>
                        </div>
                        <button onClick={() => setSelectedVehicle(null)} className="p-1 text-brand-400 hover:text-brand-600"><X size={14} /></button>
                      </div> : <>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input type="text" value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Search vehicle..." />
                        </div>
                        {vehicleSearch && <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto">
                            {filteredVehicles.map((v) => <button key={v.id} onClick={() => {
    setSelectedVehicle(v);
    setVehicleSearch("");
  }} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-0">
                                <p className="font-bold text-slate-900">{v.name}</p>
                                <p className="text-xs text-slate-500">{v.brand} • {v.year}</p>
                              </button>)}
                          </div>}
                      </>}
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
                    <input type="text" readOnly value={`\u20B9 ${totalPrice.toLocaleString("en-IN")}`} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-850 cursor-not-allowed outline-none focus:ring-0" />
                  </div>
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
                    <span className="font-bold text-slate-900">₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Balance Due:</span>
                    <span className="font-bold text-rose-600">₹{balanceAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Cancel</button>
                  <button
    onClick={handleSaveSale}
    className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200"
  >
                    Save & Print Receipt
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
    </div>;
}
