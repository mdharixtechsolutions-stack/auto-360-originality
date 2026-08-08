import React, { useState, useMemo, useEffect } from "react";
import {
  CreditCard,
  PlusCircle,
  History,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  DollarSign,
  User,
  Truck,
  FileText,
  Upload,
  Printer,
  Download,
  Share2,
  Trash2,
  Paperclip,
  Check,
  Building2,
  Tag
} from "lucide-react";

import {
  calculateVehiclePurchaseOutstanding,
  calculateDealSalesOutstanding,
  calculateCustomerTotalStats,
  calculateSupplierTotalStats
} from "../lib/outstandingCalculator";
import { generateCustomerReceiptPDF } from "../lib/receiptPdf";

export function Payments({
  deals = [],
  vehicles = [],
  customers = [],
  suppliers = [],
  vouchers = [],
  payments = [],
  onSavePayment,
  onDeletePayment,
  currentBranch = "Coimbatore",
  initialSubTab = "customer",
  businessProfile = {}
}) {
  const [activeTab, setActiveTab] = useState(initialSubTab || "customer"); // "customer", "supplier", "history", "reports", "summary"

  // Form State
  const [partyType, setPartyType] = useState("Customer"); // "Customer" or "Supplier"
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [remarks, setRemarks] = useState("");
  const [attachment, setAttachment] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Search & Filter State for History/Reports
  const [historySearch, setHistorySearch] = useState("");
  const [historyPartyFilter, setHistoryPartyFilter] = useState("all");
  const [historyModeFilter, setHistoryModeFilter] = useState("all");
  const [historyTypeFilter, setHistoryTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (initialSubTab) {
      setActiveTab(initialSubTab);
      if (initialSubTab === "customer") setPartyType("Customer");
      if (initialSubTab === "supplier") setPartyType("Supplier");
    }
  }, [initialSubTab]);

  // 1. BUYERS for Sales Receipts tab: ONLY Buyers with active sales deal outstanding (> 0). REMOVE Sellers completely.
  const customersForSalesReceipts = useMemo(() => {
    return customers
      .filter((c) => !c.isDeleted)
      .map((c) => {
        const stats = calculateCustomerTotalStats(c, vehicles, deals, payments, vouchers);
        const salesBal = stats.salesOutstanding;
        if (salesBal <= 0) return null;

        // If customer is strictly a seller (customer_type === "Sell" or requirement === "Sell") and has 0 sales deals, skip them
        if ((c.customer_type === "Sell" || c.requirement === "Sell") && stats.salesCount === 0) return null;

        let rawName = c.name || "Customer";
        rawName = rawName.replace(/\s*\((Buyer|Seller)\)\s*/gi, "").trim();
        const displayName = `${rawName} (Buyer)`;

        return {
          ...c,
          displayName,
          salesOutstanding: salesBal,
          totalOutstanding: salesBal
        };
      })
      .filter(Boolean);
  }, [customers, deals, vehicles, payments, vouchers]);

  // 2. SELLERS for Customer Payments tab: ONLY Sellers who sold vehicles to us with unpaid purchase balance (> 0).
  const customersForCustomerPayments = useMemo(() => {
    return customers
      .filter((c) => !c.isDeleted)
      .map((c) => {
        const stats = calculateCustomerTotalStats(c, vehicles, deals, payments, vouchers);
        const purBal = stats.purchaseOutstanding;
        if (purBal <= 0) return null;

        let rawName = c.name || "Customer";
        rawName = rawName.replace(/\s*\((Buyer|Seller)\)\s*/gi, "").trim();
        const displayName = `${rawName} (Seller)`;

        return {
          ...c,
          displayName,
          purchaseOutstanding: purBal,
          totalOutstanding: purBal
        };
      })
      .filter(Boolean);
  }, [customers, deals, vehicles, payments, vouchers]);

  // 3. SUPPLIERS for Supplier Payments tab: ONLY Suppliers with pending purchase balance (> 0).
  const suppliersWithOutstanding = useMemo(() => {
    return suppliers
      .filter((s) => !s.isDeleted)
      .map((s) => {
        const stats = calculateSupplierTotalStats(s, vehicles, payments, vouchers);
        const purBal = stats.totalOutstanding;
        if (purBal <= 0) return null;

        return {
          ...s,
          displayName: s.name || s.supplier_name || "Supplier",
          purchaseOutstanding: purBal,
          totalOutstanding: purBal
        };
      })
      .filter(Boolean);
  }, [suppliers, vehicles, payments, vouchers]);

  // Quick preset party/vehicle if tab changes or party selects
  const handlePartyChange = (partyId) => {
    setSelectedPartyId(partyId);
    setSelectedVehicleId("");
    setAmountPaid("");
  };

  // Find vehicles with balance for selected party with tab context isolation
  const partyVehicles = useMemo(() => {
    if (!selectedPartyId) return [];

    if (activeTab === "sales_receipts") {
      const customerDeals = deals.filter(
        (d) => !d.isDeleted && (d.customerId === selectedPartyId || d.customerName === selectedPartyId)
      );
      const items = [];
      customerDeals.forEach((d) => {
        const stats = calculateDealSalesOutstanding(d, payments, vouchers);
        const bal = stats.outstanding;
        const total = stats.totalSaleValue || stats.sellingPrice;
        if (bal > 0) {
          const veh = vehicles.find((v) => v.id === d.vehicleId || v.purchase_id === d.vehicleId);
          items.push({
            id: d.vehicleId || d.id,
            dealId: d.id,
            purchaseId: "",
            label: `${veh?.brand || d.brand || ""} ${veh?.vehicle_name || d.vehicleName || "Vehicle"} (Reg: ${veh?.reg_no || d.regNo || "N/A"}) - Sales Bal: ₹${bal.toLocaleString("en-IN")}`,
            balance: bal,
            totalPrice: total,
            regNo: veh?.reg_no || d.regNo || ""
          });
        }
      });
      return items;
    } else if (activeTab === "customer") {
      const customerPurchases = vehicles.filter(
        (v) =>
          !v.isDeleted &&
          (v.sellerType === "Customer" || v.purchase_type === "Customer") &&
          (v.sellerId === selectedPartyId || v.sellerName === selectedPartyId || v.seller_id === selectedPartyId)
      );
      const items = [];
      customerPurchases.forEach((p) => {
        const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
        const bal = stats.outstanding;
        const total = stats.purchasePrice;
        if (bal > 0) {
          items.push({
            id: p.purchase_id || p.id,
            dealId: "",
            purchaseId: p.purchase_id || p.id,
            label: `${p.brand || ""} ${p.vehicle_name || p.name || "Vehicle"} (Reg: ${p.reg_no || p.regNo || "N/A"}) - Purchase Bal: ₹${bal.toLocaleString("en-IN")}`,
            balance: bal,
            totalPrice: total,
            regNo: p.reg_no || p.regNo || ""
          });
        }
      });
      return items;
    } else {
      // Supplier tab
      const supplierPurchases = vehicles.filter(
        (v) =>
          !v.isDeleted &&
          v.sellerType !== "Customer" &&
          v.purchase_type !== "Customer" &&
          (v.supplier_id === selectedPartyId || v.sellerId === selectedPartyId || v.sellerName === selectedPartyId)
      );
      const items = [];
      supplierPurchases.forEach((p) => {
        const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
        const bal = stats.outstanding;
        const total = stats.purchasePrice;
        if (bal > 0) {
          items.push({
            id: p.purchase_id || p.id,
            dealId: "",
            purchaseId: p.purchase_id || p.id,
            label: `${p.brand || ""} ${p.vehicle_name || p.name || "Vehicle"} (Reg: ${p.reg_no || p.regNo || "N/A"}) - Purchase Bal: ₹${bal.toLocaleString("en-IN")}`,
            balance: bal,
            totalPrice: total,
            regNo: p.reg_no || p.regNo || ""
          });
        }
      });
      return items;
    }
  }, [selectedPartyId, activeTab, deals, vehicles, payments, vouchers]);

  // Selected vehicle detail
  const selectedVehicleObj = useMemo(() => {
    if (!selectedVehicleId) return null;
    return partyVehicles.find((v) => v.id === selectedVehicleId) || null;
  }, [selectedVehicleId, partyVehicles]);

  // Auto file upload handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.filePath) {
        setAttachment(data.filePath);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPartyId || !amountPaid || Number(amountPaid) <= 0) {
      alert("Please select a party and enter a valid payment amount.");
      return;
    }

    setIsSubmitting(true);
    try {
      const isSalesReceipt = activeTab === "sales_receipts";
      const isCustomerPayment = activeTab === "customer";
      const isSupplierPayment = activeTab === "supplier";

      const partyObj = isSalesReceipt
        ? customersForSalesReceipts.find((c) => c.id === selectedPartyId || c.name === selectedPartyId)
        : (isCustomerPayment
            ? customersForCustomerPayments.find((c) => c.id === selectedPartyId || c.name === selectedPartyId)
            : suppliersWithOutstanding.find((s) => s.id === selectedPartyId || s.name === selectedPartyId));

      let paymentType = "Customer Payment";
      if (isSalesReceipt) paymentType = "Sales Receipt";
      else if (isCustomerPayment) paymentType = "Customer Purchase Payment";
      else if (isSupplierPayment) paymentType = "Supplier Payment";

      const payload = {
        paymentDate,
        paymentType,
        partyType: isSupplierPayment ? "Supplier" : "Customer",
        partyId: selectedPartyId,
        partyName: partyObj?.name || partyObj?.displayName || selectedPartyId,
        vehicleId: selectedVehicleId || selectedVehicleObj?.id || "",
        vehicleName: selectedVehicleObj?.label || "",
        regNo: selectedVehicleObj?.regNo || "",
        dealId: selectedVehicleObj?.dealId || "",
        purchaseId: selectedVehicleObj?.purchaseId || "",
        referenceNo: referenceNo || `${isSalesReceipt ? 'SR' : 'REF'}-${Math.floor(100000 + Math.random() * 900000)}`,
        paymentMode,
        amountPaid: Number(amountPaid),
        remarks,
        attachment,
        branch: currentBranch
      };

      await onSavePayment(payload);

      if (typeof onRefreshData === "function") {
        await onRefreshData();
      }

      if (isSalesReceipt || isCustomerPayment) {
        const matchingDeal = deals.find((d) => (d.vehicleId && d.vehicleId === payload.vehicleId) || d.id === payload.dealId || d.customerId === payload.partyId);
        generateCustomerReceiptPDF({
          receiptTitle: isSalesReceipt ? "OFFICIAL SALES PAYMENT RECEIPT" : "CUSTOMER TRANSACTION RECEIPT",
          receiptNo: `REC-${payload.referenceNo}`,
          date: payload.paymentDate,
          customerName: payload.partyName,
          customerMobile: partyObj?.mobile || partyObj?.phone || "-",
          vehicleName: payload.vehicleName || "-",
          regNo: payload.regNo || "-",
          sellingPrice: matchingDeal ? (matchingDeal.sellingPrice || matchingDeal.totalPrice) : payload.amountPaid,
          advanceAmount: matchingDeal ? matchingDeal.advanceAmount : 0,
          receivedAmount: payload.amountPaid,
          balanceAmount: matchingDeal ? Math.max(0, (matchingDeal.balanceAmount || 0) - payload.amountPaid) : 0,
          paymentMode: payload.paymentMode,
          referenceNo: payload.referenceNo,
          remarks: payload.remarks || "Balance Settlement"
        }, businessProfile);
      }

      setSuccessMessage(
        isSalesReceipt
          ? "Sales Receipt generated successfully, posted to Sales Account Ledger, and customer sales outstanding balance reduced!"
          : (isCustomerPayment
              ? "Customer Purchase Payment recorded successfully, receipt generated, and customer purchase outstanding balance reduced!"
              : "Supplier Payment recorded successfully and accounting vouchers updated!")
      );
      setAmountPaid("");
      setReferenceNo("");
      setRemarks("");
      setAttachment("");
      setSelectedVehicleId("");
      setSelectedPartyId("");

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      alert("Error saving payment: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Payments History
  const filteredHistory = useMemo(() => {
    let list = [...payments];

    if (activeTab === "customer") {
      list = list.filter((p) => {
        if (!p || p.isDeleted) return false;
        if (p.paymentType === "Sales Receipt" || p.paymentType === "Sales Advance") return false;
        if (
          p.paymentType === "Customer Purchase Payment" ||
          p.paymentType === "Purchase Payment" ||
          p.paymentType === "Customer Payout" ||
          p.paymentType === "Seller Payout" ||
          p.paymentType === "customer_payment" ||
          p.paymentType === "seller_payout" ||
          p.type === "customer_payment" ||
          p.type === "seller_payout"
        ) return true;

        if (p.purchaseId && p.partyType !== "Supplier") return true;

        if (p.partyType === "Customer") {
          return !p.dealId;
        }

        return false;
      });
    } else if (activeTab === "supplier") {
      list = list.filter((p) => {
        if (!p || p.isDeleted) return false;
        return p.partyType === "Supplier" || p.paymentType === "Supplier Payment" || p.paymentType === "Supplier Advance";
      });
    } else if (activeTab === "sales_receipts") {
      list = list.filter((p) => {
        if (!p || p.isDeleted) return false;
        if (
          p.paymentType === "Customer Purchase Payment" ||
          p.paymentType === "Purchase Payment" ||
          p.paymentType === "Supplier Payment" ||
          p.paymentType === "Customer Payout" ||
          p.paymentType === "Seller Payout" ||
          p.paymentType === "customer_payment" ||
          p.paymentType === "seller_payout" ||
          p.type === "customer_payment" ||
          p.type === "seller_payout" ||
          Boolean(p.purchaseId)
        ) return false;

        if (
          p.paymentType === "Sales Receipt" ||
          p.paymentType === "Sales Advance" ||
          p.type === "sales_receipt" ||
          p.type === "buyer_collection"
        ) return true;

        if (p.partyType === "Customer" && Boolean(p.dealId)) return true;

        return false;
      });
    }

    if (historyTypeFilter !== "all") {
      list = list.filter((p) => p.paymentType === historyTypeFilter);
    }
    if (historyModeFilter !== "all") {
      list = list.filter((p) => p.paymentMode === historyModeFilter);
    }
    if (dateFrom) {
      list = list.filter((p) => p.paymentDate >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((p) => p.paymentDate <= dateTo);
    }
    if (historySearch) {
      const q = historySearch.toLowerCase();
      list = list.filter(
        (p) =>
          (p.partyName || "").toLowerCase().includes(q) ||
          (p.referenceNo || "").toLowerCase().includes(q) ||
          (p.vehicleName || "").toLowerCase().includes(q) ||
          (p.regNo || "").toLowerCase().includes(q) ||
          (p.remarks || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
  }, [payments, activeTab, historyTypeFilter, historyModeFilter, dateFrom, dateTo, historySearch]);

  // Total Metrics
  const totalReceived = useMemo(() => {
    return payments
      .filter((p) => p.partyType === "Customer")
      .reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  }, [payments]);

  const totalPaidToSuppliers = useMemo(() => {
    return payments
      .filter((p) => p.partyType === "Supplier")
      .reduce((sum, p) => sum + (Number(p.amountPaid) || 0), 0);
  }, [payments]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30 mb-2">
              <CreditCard size={14} /> Real-Time Accounting Flow
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Payment Management</h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Record Customer Receipts & Supplier Payments. Real-time automatic updates to Purchase/Sales Outstanding, Accounts, Ledgers, Cash & Bank Books.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/60 text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Received</div>
              <div className="text-lg font-black text-emerald-400">₹{totalReceived.toLocaleString("en-IN")}</div>
            </div>
            <div className="bg-slate-800/80 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/60 text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Supplier Paid</div>
              <div className="text-lg font-black text-rose-400">₹{totalPaidToSuppliers.toLocaleString("en-IN")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS NOTIFICATION */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-3 text-sm font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="text-emerald-600" size={20} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* SUB-NAVIGATION TAB BAR */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => { setActiveTab("customer"); setPartyType("Customer"); setSelectedPartyId(""); setSelectedVehicleId(""); setAmountPaid(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "customer"
              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Customer Payments
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("supplier"); setPartyType("Supplier"); setSelectedPartyId(""); setSelectedVehicleId(""); setAmountPaid(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "supplier"
              ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Supplier Payments
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("sales_receipts"); setPartyType("Customer"); setSelectedPartyId(""); setSelectedVehicleId(""); setAmountPaid(""); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sales_receipts"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Sales Receipts
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "history"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Payment History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "reports"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Payment Reports
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "summary"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Outstanding Summary
        </button>
      </div>

      {/* TAB CONTENTS */}
      {(activeTab === "customer" || activeTab === "supplier" || activeTab === "sales_receipts") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PlusCircle size={18} className={activeTab === "sales_receipts" ? "text-indigo-600" : (partyType === "Customer" ? "text-emerald-600" : "text-rose-600")} />
                {activeTab === "sales_receipts" ? "Generate Sales Payment Receipt" : (partyType === "Customer" ? "Record Customer Receipt" : "Record Supplier Payment")}
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {currentBranch} Branch
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select {activeTab === "sales_receipts" ? "Buyer Customer" : (activeTab === "customer" ? "Seller Customer" : "Supplier")} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedPartyId}
                  onChange={(e) => handlePartyChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  required
                >
                  <option value="">
                    {activeTab === "sales_receipts"
                      ? "-- Choose Buyer Customer (Sales Outstanding) --"
                      : (activeTab === "customer"
                          ? "-- Choose Seller Customer (Purchase Outstanding) --"
                          : "-- Choose Supplier (Pending Purchase Balance) --")}
                  </option>
                  {activeTab === "sales_receipts"
                    ? customersForSalesReceipts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.displayName} - Sales Bal: ₹{c.salesOutstanding.toLocaleString("en-IN")}
                        </option>
                      ))
                    : (activeTab === "customer"
                        ? customersForCustomerPayments.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.displayName} - Purchase Bal: ₹{c.purchaseOutstanding.toLocaleString("en-IN")}
                            </option>
                          ))
                        : suppliersWithOutstanding.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.displayName} - Pending Bal: ₹{s.totalOutstanding.toLocaleString("en-IN")}
                            </option>
                          ))
                      )}
                </select>
              </div>

              {selectedPartyId && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Vehicle / Deal (Outstanding)
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => {
                      setSelectedVehicleId(e.target.value);
                      const matched = partyVehicles.find((v) => v.id === e.target.value);
                      if (matched) setAmountPaid(matched.balance.toString());
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  >
                    <option value="">-- General Payment / Unallocated --</option>
                    {partyVehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedVehicleObj && (
                <div className="p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between text-indigo-900 font-bold">
                    <span>Outstanding Balance:</span>
                    <span className="font-mono text-indigo-700">₹{selectedVehicleObj.balance.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Total Deal/Cost:</span>
                    <span>₹{selectedVehicleObj.totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Payment Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="UPI">GPay / PhonePe / UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT / RTGS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reference / Cheque / UTR No.</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="e.g. UTR-9823019238"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Narration</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Received partial advance via GPay"
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Attach Receipt / Slip (Optional)</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/30 px-3 py-2 rounded-xl text-xs text-slate-600 font-semibold cursor-pointer transition-all">
                    <Upload size={14} />
                    {isUploading ? "Uploading..." : attachment ? "File Attached ✓" : "Upload File"}
                    <input type="file" onChange={handleFileUpload} className="hidden" accept="image/*,.pdf" />
                  </label>
                  {attachment && (
                    <a
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      View
                    </a>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl text-xs font-black text-white shadow-md transition-all cursor-pointer ${
                  partyType === "Customer"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                }`}
              >
                {isSubmitting
                  ? "Saving Payment & Updating Ledgers..."
                  : `Save ${partyType === "Customer" ? "Receipt" : "Payment"}`}
              </button>
            </form>
          </div>

          {/* Payment Records Table for Selected Mode */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <History size={18} className="text-indigo-600" />
                {activeTab === "sales_receipts"
                  ? "Recent Sales Receipts"
                  : (activeTab === "customer"
                      ? "Recent Customer Payouts"
                      : "Recent Supplier Payments")}
              </h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search payments..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Party Name</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Ref No</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-medium text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{p.partyName}</td>
                        <td className="py-3 px-3 font-medium text-slate-600">{p.regNo || p.vehicleName || "—"}</td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">{p.referenceNo}</td>
                        <td
                          className={`py-3 px-3 font-black text-right font-mono ${
                            activeTab === "sales_receipts" ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          ₹{(Number(p.amountPaid) || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{p.paymentMode}</td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onDeletePayment && onDeletePayment(p.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Payment"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No recent {activeTab === "sales_receipts" ? "sales receipts" : (activeTab === "customer" ? "customer payouts" : "supplier payments")} recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY & REPORTS TABS */}
      {(activeTab === "history" || activeTab === "reports") && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {activeTab === "history" ? "Complete Payment History Audit Trail" : "Comprehensive Payment & Voucher Reports"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter by date, mode, party type or search reference numbers</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Printer size={14} /> Print Report
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
              <select
                value={historyModeFilter}
                onChange={(e) => setHistoryModeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
              >
                <option value="all">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Cheque">Cheque</option>
                <option value="NEFT">NEFT / RTGS</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Party Type</label>
              <select
                value={historyTypeFilter}
                onChange={(e) => setHistoryTypeFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-semibold"
              >
                <option value="all">All Types</option>
                <option value="Customer Payment">Customer Payment</option>
                <option value="Supplier Payment">Supplier Payment</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Search Keyword</label>
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Name, Ref No..."
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Full Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Ref ID</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Party Name</th>
                  <th className="py-3 px-3">Vehicle</th>
                  <th className="py-3 px-3 text-right">Exact Paid</th>
                  <th className="py-3 px-3 text-right">Outstanding Before</th>
                  <th className="py-3 px-3 text-right">Outstanding After</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Mode</th>
                  <th className="py-3 px-3">Created By</th>
                  <th className="py-3 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((p) => {
                    const amt = Number(p.amountPaid) || 0;
                    let totalCost = 0;
                    let basePaid = 0;
                    let prevPayments = 0;

                    if (p.dealId || (p.vehicleId && p.partyType === "Customer" && p.paymentType !== "Customer Purchase Payment")) {
                      const d = deals.find(dl => dl.id === p.dealId || dl.vehicleId === p.vehicleId);
                      if (d) {
                        totalCost = Number(d.sellingPrice || d.totalPrice) || 0;
                        basePaid = Number(d.advanceAmount) || 0;
                        prevPayments = payments
                          .filter(pm => !pm.isDeleted && (pm.dealId === d.id || pm.vehicleId === d.vehicleId) && (pm.paymentDate < p.paymentDate || (pm.paymentDate === p.paymentDate && pm.id < p.id)))
                          .reduce((sum, pm) => sum + (Number(pm.amountPaid) || 0), 0);
                      }
                    } else if (p.purchaseId || p.vehicleId) {
                      const v = vehicles.find(vh => vh.purchase_id === (p.purchaseId || p.vehicleId) || vh.id === (p.purchaseId || p.vehicleId));
                      if (v) {
                        totalCost = Number(v.purchasePrice || v.purchase_price) || 0;
                        basePaid = Number(v.advance_price !== undefined && v.advance_price !== null && v.advance_price !== "" ? v.advance_price : (v.advancePaid !== undefined && v.advancePaid !== null && v.advancePaid !== "" ? v.advancePaid : (v.advance_amount !== undefined && v.advance_amount !== null && v.advance_amount !== "" ? v.advance_amount : (v.advanceAmount !== undefined && v.advanceAmount !== null && v.advanceAmount !== "" ? v.advanceAmount : 0)))) || 0;
                        prevPayments = payments
                          .filter(pm => !pm.isDeleted && (pm.vehicleId === v.purchase_id || pm.vehicleId === v.id || pm.purchaseId === v.purchase_id || pm.purchaseId === v.id) && (pm.paymentDate < p.paymentDate || (pm.paymentDate === p.paymentDate && pm.id < p.id)))
                          .reduce((sum, pm) => sum + (Number(pm.amountPaid) || 0), 0);
                      }
                    }

                    const outBefore = totalCost > 0 ? Math.max(0, totalCost - basePaid - prevPayments) : (Number(p.outstandingBefore) || amt);
                    const outAfter = Math.max(0, outBefore - amt);

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-indigo-700">{p.referenceNo}</td>
                        <td className="py-3 px-3 font-mono text-slate-600">{p.paymentDate}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{p.partyName}</td>
                        <td className="py-3 px-3 font-medium text-slate-600">{p.regNo || p.vehicleName || "—"}</td>
                        <td className="py-3 px-3 font-black text-right font-mono text-emerald-600">
                          ₹{amt.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 font-mono text-right text-slate-600">
                          ₹{outBefore.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 font-mono text-right font-bold text-rose-600">
                          ₹{outAfter.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700">{p.branch || "Coimbatore"}</td>
                        <td className="py-3 px-3 font-semibold text-slate-700">{p.paymentMode}</td>
                        <td className="py-3 px-3 text-slate-500 font-medium">{p.createdBy || "Staff"}</td>
                        <td className="py-3 px-3 text-center">
                          {p.partyType === "Customer" && (
                            <button
                              type="button"
                              onClick={() => {
                                const matchingDeal = deals.find((d) => (d.vehicleId && d.vehicleId === p.vehicleId) || d.customerId === p.partyId);
                                generateCustomerReceiptPDF({
                                  receiptNo: `REC-${p.referenceNo || p.id}`,
                                  date: p.paymentDate,
                                  customerName: p.partyName,
                                  customerMobile: "-",
                                  vehicleName: p.vehicleName || "—",
                                  regNo: p.regNo || "—",
                                  sellingPrice: matchingDeal ? matchingDeal.sellingPrice : amt,
                                  advanceAmount: matchingDeal ? matchingDeal.advanceAmount : 0,
                                  receivedAmount: amt,
                                  balanceAmount: outAfter,
                                  paymentMode: p.paymentMode || "Cash",
                                  referenceNo: p.referenceNo,
                                  remarks: p.remarks || "Customer Receipt"
                                }, businessProfile);
                              }}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 transition-all font-bold cursor-pointer inline-flex items-center gap-1"
                              title="Print / Download PDF Receipt"
                            >
                              <Printer size={13} />
                              <span className="text-[11px]">Print</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 text-sm">
                      No payment records match your selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OUTSTANDING SUMMARY TAB */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Purchases Balance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={18} className="text-emerald-600" /> Customer Purchase Outstanding
            </h3>
            <div className="space-y-3">
              {vehicles
                .filter((p) => !p.isDeleted && (p.sellerType === "Customer" || p.purchase_type === "Customer"))
                .map((p) => {
                  const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
                  const total = stats.purchasePrice;
                  const bal = stats.outstanding;
                  if (bal <= 0) return null;
                  return (
                    <div
                      key={p.id || p.purchase_id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{p.sellerName || p.seller_name || "Customer"}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Reg: {p.reg_no || p.regNo || "N/A"} ({p.brand || ""} {p.name || ""})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-rose-600 font-mono">₹{bal.toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-slate-400">Total: ₹{total.toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Supplier Purchases Balance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck size={18} className="text-rose-600" /> Supplier Purchase Outstanding
            </h3>
            <div className="space-y-3">
              {vehicles
                .filter((p) => !p.isDeleted && p.sellerType !== "Customer" && p.purchase_type !== "Customer")
                .map((p) => {
                  const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
                  const total = stats.purchasePrice;
                  const bal = stats.outstanding;
                  if (bal <= 0) return null;
                  return (
                    <div
                      key={p.id || p.purchase_id}
                      className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{p.sellerName || p.seller_name || "Supplier"}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Reg: {p.reg_no || p.regNo || "N/A"} ({p.brand || ""} {p.name || ""})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-rose-600 font-mono">₹{bal.toLocaleString("en-IN")}</div>
                        <div className="text-[10px] text-slate-400">Total: ₹{total.toLocaleString("en-IN")}</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
