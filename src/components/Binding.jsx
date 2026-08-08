import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  IndianRupee,
  Clock,
  AlertCircle,
  X,
  Eye,
  Printer,
  Trash2,
  Receipt,
  ArrowUpRight,
  ArrowDownLeft,
  Building,
  Car
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasModulePermission } from "../lib/permissions";
export default function Binding({ vehicles, onUpdateVehicle, initialPurchase, onNavigate, currentUser, selectedBranch, businessProfile, onRefreshData }) {
  const [loans, setLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [localFrom, setLocalFrom] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [localTo, setLocalTo] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const [fromDate, setFromDate] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [toDate, setToDate] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [detailsTab, setDetailsTab] = useState("details");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    loanType: "Vehicle Loan",
    purchaseId: "",
    customerName: "",
    mobileNumber: "",
    loanDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    financeName: "",
    bindingAmount: "",
    takenAmount: "",
    dueAmount: "",
    monthlyPayAmount: "",
    paymentMode: "Cash"
  });
  const [receiptForm, setReceiptForm] = useState({
    receiptDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    amountPaid: "",
    paymentMode: "Cash",
    referenceNumber: "",
    remarks: ""
  });
  const fetchLoans = async () => {
    try {
      const res = await fetch("/api/loans");
      if (res.ok) {
        const data = await res.json();
        setAllLoans(data);
      }
    } catch (e) {
      console.error("Error fetching loans:", e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchLoans();
  }, []);
  useEffect(() => {
    if (selectedBranch && selectedBranch !== "all") {
      setLoans(allLoans.filter((l) => l.branch === selectedBranch));
    } else {
      setLoans(allLoans);
    }
  }, [allLoans, selectedBranch]);
  useEffect(() => {
    if (initialPurchase) {
      setFormData((prev) => ({
        ...prev,
        loanType: "Vehicle Loan",
        purchaseId: initialPurchase.purchase_id || initialPurchase.id || "",
        financeName: initialPurchase.binding?.financierName || "",
        bindingAmount: String(initialPurchase.binding?.bindingAmount || ""),
        takenAmount: String(initialPurchase.binding?.takenAmount || ""),
        dueAmount: String(initialPurchase.binding?.dueAmount || ""),
        monthlyPayAmount: String(initialPurchase.binding?.dueAmount ? Math.round(Number(initialPurchase.binding.dueAmount) / 12) : "")
      }));
      setShowAddModal(true);
    }
  }, [initialPurchase]);
  const activeVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status === "Available" && !v.isDeleted);
  }, [vehicles]);
  const selectedVehicleDetails = useMemo(() => {
    if (formData.loanType === "Vehicle Loan" && formData.purchaseId) {
      return vehicles.find((v) => v.id === formData.purchaseId);
    }
    return null;
  }, [formData.purchaseId, formData.loanType, vehicles]);
  useEffect(() => {
    if (formData.loanType === "Vehicle Loan" && formData.purchaseId) {
      const v = vehicles.find((item) => item.id === formData.purchaseId);
      if (v) {
        setFormData((prev) => ({
          ...prev,
          customerName: v.ownerDetails || "Vehicle Loan Customer",
          mobileNumber: ""
        }));
      }
    }
  }, [formData.purchaseId, formData.loanType, vehicles]);
  const stats = useMemo(() => {
    const active = loans.filter((l) => !l.isDeleted);
    const totalBinding = active.reduce((sum, l) => sum + Number(l.bindingAmount), 0);
    const totalTaken = active.reduce((sum, l) => sum + Number(l.takenAmount), 0);
    const totalDue = active.reduce((sum, l) => sum + Number(l.dueAmount), 0);
    const totalPaid = totalTaken - totalDue;
    return {
      totalBinding,
      totalTaken,
      totalDue,
      totalPaid,
      count: active.length
    };
  }, [loans]);
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const matchesSearch = (l.customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.regNo || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.financeName || "").toLowerCase().includes(searchQuery.toLowerCase()) || (l.vehicleDetails || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || activeTab === "vehicle" && l.loanType === "Vehicle Loan" || activeTab === "direct" && l.loanType === "Direct Loan";
      const isWithinFrom = fromDate ? l.loanDate >= fromDate : true;
      const isWithinTo = toDate ? l.loanDate <= toDate : true;
      return matchesSearch && matchesTab && isWithinFrom && isWithinTo;
    });
  }, [loans, searchQuery, activeTab, fromDate, toDate]);
  const handleSaveLoan = async (e) => {
    e.preventDefault();
    if (formData.loanType === "Vehicle Loan" && !formData.purchaseId) {
      alert("Please select a vehicle");
      return;
    }
    if (formData.loanType === "Direct Loan" && !formData.customerName) {
      alert("Customer name is required");
      return;
    }
    let resolvedVehicleDetails = "";
    let resolvedRegNo = "";
    if (formData.loanType === "Vehicle Loan") {
      const v = vehicles.find((item) => item.id === formData.purchaseId);
      if (v) {
        resolvedVehicleDetails = v.name;
        resolvedRegNo = v.regNo;
      }
    }
    const payload = {
      ...formData,
      vehicleDetails: resolvedVehicleDetails,
      regNo: resolvedRegNo,
      dueAmount: formData.dueAmount || formData.takenAmount,
      branch: currentUser?.branch || "Coimbatore"
    };
    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const newLoan = await res.json();
        setAllLoans((prev) => [newLoan, ...prev]);
        setLoans((prev) => [newLoan, ...prev]);
        setShowAddModal(false);
        if (formData.loanType === "Vehicle Loan" && formData.purchaseId) {
          const matchingV = vehicles.find((item) => item.id === formData.purchaseId);
          if (matchingV) {
            onUpdateVehicle({
              ...matchingV,
              status: "Loan Active"
            });
          }
        }
        if (onRefreshData) {
          await onRefreshData();
        }
        setFormData({
          loanType: "Vehicle Loan",
          purchaseId: "",
          customerName: "",
          mobileNumber: "",
          loanDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          financeName: "",
          bindingAmount: "",
          takenAmount: "",
          dueAmount: "",
          monthlyPayAmount: "",
          paymentMode: "Cash"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleAddReceipt = async (e) => {
    e.preventDefault();
    if (!selectedLoan) return;
    if (!receiptForm.amountPaid) {
      alert("Please enter amount paid");
      return;
    }
    try {
      const res = await fetch(`/api/loans/${selectedLoan.id}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receiptForm)
      });
      if (res.ok) {
        const data = await res.json();
        setAllLoans((prev) => prev.map((l) => l.id === selectedLoan.id ? data.loan : l));
        setLoans((prev) => prev.map((l) => l.id === selectedLoan.id ? data.loan : l));
        setSelectedLoan(data.loan);
        setReceiptForm({
          receiptDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          amountPaid: "",
          paymentMode: "Cash",
          referenceNumber: "",
          remarks: ""
        });
        if (onRefreshData) {
          await onRefreshData();
        } else {
          fetch("/api/vouchers").then((res2) => res2.json()).then(() => console.log("Automatic receipts & vouchers consolidated successfully."));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleDeleteLoan = (id) => {
    setDeleteConfirm({
      isOpen: true,
      message: "Are you sure you want to delete this record?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/loans/${id}`, { method: "DELETE" });
          if (res.ok) {
            setLoans((prev) => prev.filter((l) => l.id !== id));
            if (selectedLoan?.id === id) {
              setShowLoanDetailsModal(false);
              setSelectedLoan(null);
            }
            if (onRefreshData) {
              await onRefreshData();
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };
  const generateLoanPDF = (loan) => {
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
        subLines.push("Premium Auto Finance & Consultancy Services | Loan Summary Certificate");
      }

      const addressLineText = subLines.join(" | ");
      const splitAddress = doc.splitTextToSize(addressLineText, 185 - textStartX);
      doc.text(splitAddress, textStartX, 22);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 31, 190, 31);

      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("LOAN TRANSACTION CERTIFICATE", 20, 43);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Certificate No: CERT-${loan.id}`, 20, 49);
      doc.text(`Date of Issue: ${new Date().toLocaleDateString()}`, 190, 49, { align: "right" });

      const infoRows = [
        ["Loan ID", loan.id],
        ["Loan Classification", loan.loanType],
        ["Finance Provider", loan.financeName || "Direct"],
        ["Borrower Name", loan.customerName || "N/A"],
        ["Mobile Number", loan.mobileNumber || "N/A"],
        ["Date of Loan Disbursal", loan.loanDate],
        ["Payment Method", loan.paymentMode]
      ];
      if (loan.loanType === "Vehicle Loan") {
        infoRows.push(["Collateral Vehicle", loan.vehicleDetails || "N/A"]);
        infoRows.push(["Registration Number", loan.regNo || "N/A"]);
      }
      autoTable(doc, {
        startY: 55,
        head: [["Parameter", "Certified Value"]],
        body: infoRows,
        theme: "grid",
        headStyles: { fillColor: [51, 65, 85] }
      });

      const financeY = doc.lastAutoTable.finalY + 12;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("FINANCIAL BREAKDOWN", 20, financeY);
      const totalPaid = (Number(loan?.takenAmount) || 0) - (Number(loan?.dueAmount) || 0);
      const financeRows = [
        ["Binding / Asset Valuation", `INR ${(Number(loan?.bindingAmount) || 0).toLocaleString("en-IN")}`],
        ["Loan Amount Taken", `INR ${(Number(loan?.takenAmount) || 0).toLocaleString("en-IN")}`],
        ["Total Cumulative Paid Amount", `INR ${(Number(totalPaid) || 0).toLocaleString("en-IN")}`],
        ["Current Outstanding Balance Due", `INR ${(Number(loan?.dueAmount) || 0).toLocaleString("en-IN")}`],
        ["Estimated Monthly EMI Payment", `INR ${(Number(loan?.monthlyPayAmount) || 0).toLocaleString("en-IN")}`]
      ];
      autoTable(doc, {
        startY: financeY + 4,
        head: [["Financial Attribute", "Amount (INR)"]],
        body: financeRows,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] }
      });

      let nextY = doc.lastAutoTable.finalY + 12;

      if (loan.receipts && loan.receipts.length > 0) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59);
        doc.text("RECEIPT TRANSACTION HISTORY", 20, nextY);
        const receiptRows = loan.receipts.map((r) => [
          r.id,
          r.receiptDate,
          `INR ${Number(r.amountPaid || 0).toLocaleString("en-IN")}`,
          r.paymentMode,
          r.referenceNumber || "N/A",
          r.remarks || ""
        ]);
        autoTable(doc, {
          startY: nextY + 4,
          head: [["Receipt ID", "Paid Date", "Amount", "Mode", "Ref No", "Remarks"]],
          body: receiptRows,
          theme: "grid",
          headStyles: { fillColor: [15, 23, 42] }
        });
        nextY = doc.lastAutoTable.finalY + 12;
      }

      // Dynamic Terms and Conditions rendering block
      if (businessProfile?.termsAndConditions) {
        doc.setFontSize(7.5);
        doc.setFont("Helvetica", "bold");
        doc.setTextColor(51, 65, 85);
        doc.text("TERMS & CONDITIONS", 20, nextY);
        doc.setFont("Helvetica", "normal");
        doc.setTextColor(110);
        const termsLines = doc.splitTextToSize(businessProfile.termsAndConditions, 170);
        doc.text(termsLines, 20, nextY + 4);
        nextY += 4 + termsLines.length * 4;
      }

      // Dynamic authorized signature block
      const sigY = Math.max(nextY + 15, 255);
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

      doc.save(`LOAN_RECEIPT_SUMMARY_${loan.id}.pdf`);
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
      {
    /* Header section */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building className="text-brand-600" size={24} />
            Binding Loan Master
          </h2>
          <p className="text-sm text-slate-500">Manage financier bindings, vehicle loans, direct loans and receipts</p>
        </div>
        {hasModulePermission(currentUser, "binding", "create") && (
          <button
            onClick={() => {
              setShowAddModal(true);
              setFormData({
                loanType: "Vehicle Loan",
                purchaseId: "",
                customerName: "",
                mobileNumber: "",
                loanDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                financeName: "",
                bindingAmount: "",
                takenAmount: "",
                dueAmount: "",
                monthlyPayAmount: "",
                paymentMode: "Cash"
              });
            }}
            className="flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200"
          >
            <Plus size={20} />
            Create New Loan / Binding
          </button>
        )}
      </div>

      {
    /* Stats display banner */
  }
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Valuation</p>
            <p className="text-xl font-extrabold text-slate-900">₹{(Number(stats?.totalBinding) || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-50 text-brand-600">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Disbursed (Taken)</p>
            <p className="text-xl font-extrabold text-slate-900">₹{(Number(stats?.totalTaken) || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowDownLeft size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Principal</p>
            <p className="text-xl font-extrabold text-emerald-700">₹{(Number(stats?.totalPaid) || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outstanding Balance</p>
            <p className="text-xl font-extrabold text-rose-600">₹{(Number(stats?.totalDue) || 0).toLocaleString("en-IN")}</p>
          </div>
        </div>
      </div>

      {
    /* Query filters and Tab Switcher */
  }
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search loans, financier, client, collateral details..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
  />
        </div>
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto">
          {[
    { id: "all", label: "All Bindings/Loans" },
    { id: "vehicle", label: "Vehicle Loans" },
    { id: "direct", label: "Direct Client Loans" }
  ].map((tab) => <button
    key={tab.id}
    onClick={() => setActiveTab(tab.id)}
    className={cn(
      "whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
      activeTab === tab.id ? "bg-brand-600 text-white shadow-md font-extrabold" : "text-slate-500 hover:bg-slate-50"
    )}
  >
              {tab.label}
            </button>)}
        </div>
      </div>

      <div className="flex flex-wrap items-center bg-white border border-slate-200 p-3 rounded-2xl gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">From</span>
          <input
            type="date"
            value={localFrom}
            onChange={(e) => setLocalFrom(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold font-mono focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">To</span>
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

      {
    /* Table List of Records */
  }
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-extrabold">
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Borrower Name</th>
                <th className="px-6 py-4">Classification</th>
                <th className="px-6 py-4">Collateral Vehicle</th>
                <th className="px-6 py-4">Finance Source</th>
                <th className="px-6 py-4 text-right">Taken Amount</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4 text-center">Receipts Count</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-extrabold">
                    No active loan bindings matched your search filters.
                  </td>
                </tr> : filteredLoans.map((l) => {
    const paidPct = Math.round((Number(l.takenAmount) - Number(l.dueAmount)) / Number(l.takenAmount) * 100) || 0;
    return <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded">
                          {l.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{l.customerName || "N/A"}</span>
                          <span className="text-xs text-slate-500">{l.mobileNumber || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
      "px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg tracking-wider",
      l.loanType === "Vehicle Loan" ? "bg-blue-50 text-blue-600 border border-blue-200" : "bg-purple-50 text-purple-600 border border-purple-200"
    )}>
                          {l.loanType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {l.loanType === "Vehicle Loan" ? <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{l.vehicleDetails || "Generic Vehicle"}</span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-extrabold tracking-tight">{l.regNo || "N/A"}</span>
                          </div> : <span className="text-xs text-slate-400 italic">None (Direct Client)</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                        {l.financeName || <span className="text-slate-400 italic">Self Disbursed</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                        ₹{(Number(l?.takenAmount) || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-rose-600">₹{(Number(l?.dueAmount) || 0).toLocaleString("en-IN")}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{paidPct}% Paid</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-extrabold rounded-full">
                          {(l.receipts || []).length}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
      onClick={() => {
        setSelectedLoan(l);
        setDetailsTab("details");
        setShowLoanDetailsModal(true);
      }}
      className="p-1 px-2 bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors pointer-events-auto cursor-pointer"
    >
                            <Eye size={13} />
                            View
                          </button>
                          <button
      onClick={() => {
        setSelectedLoan(l);
        setDetailsTab("receipts");
        setShowLoanDetailsModal(true);
      }}
      className="p-1 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors pointer-events-auto cursor-pointer"
      title="Add Receipt"
    >
                            <Receipt size={13} />
                            Receipt
                          </button>
                          <button
      onClick={() => generateLoanPDF(l)}
      className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors cursor-pointer"
      title="Print PDF Certificate"
    >
                            <Printer size={13} />
                          </button>
                          {hasModulePermission(currentUser, "binding", "delete") && (
                            <button
                              onClick={() => handleDeleteLoan(l.id)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>;
  })}
            </tbody>
          </table>
        </div>
      </div>

      {
    /* Add New Loan Modal */
  }
      <AnimatePresence>
        {showAddModal && <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowAddModal(false)}
    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
  >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">New Loan / Binding Registration</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Fill out attributes to establish a direct or vehicle-backed loan</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveLoan} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Loan Type Selection</label>
                    <select
    value={formData.loanType}
    onChange={(e) => setFormData({ ...formData, loanType: e.target.value, purchaseId: "" })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
  >
                      <option value="Vehicle Loan">Vehicle Loan (Auto Collateral Backed)</option>
                      <option value="Direct Loan">Direct Loan (Customer Private Loan)</option>
                    </select>
                  </div>

                  {formData.loanType === "Vehicle Loan" ? (
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase">Collateral Vehicle Lookup</label>
                      <select
                        value={formData.purchaseId}
                        onChange={(e) => setFormData((prev) => ({ ...prev, purchaseId: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
                        required
                      >
                        <option value="">Select available vehicle...</option>
                        {activeVehicles.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.name} ({v.regNo || "No Reg"}) - Cost: ₹{(v.purchasePrice || 0).toLocaleString("en-IN")}
                          </option>
                        ))}
                      </select>

                      {/* Premium Pre-filled Vehicle Details Card */}
                      {selectedVehicleDetails && (
                        <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-xl p-2 h-28 overflow-hidden shadow-sm relative group">
                            {selectedVehicleDetails.photo || selectedVehicleDetails.vehicle_image || selectedVehicleDetails.image || (selectedVehicleDetails.photos && selectedVehicleDetails.photos[0]) ? (
                              <img 
                                src={selectedVehicleDetails.photo || selectedVehicleDetails.vehicle_image || selectedVehicleDetails.image || (selectedVehicleDetails.photos && selectedVehicleDetails.photos[0])} 
                                alt={selectedVehicleDetails.name} 
                                className="object-cover w-full h-full rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center text-slate-400 py-4">
                                <Car size={28} className="opacity-30 mb-1" />
                                <span className="text-[10px] font-extrabold uppercase tracking-wider">No Photo</span>
                              </div>
                            )}
                          </div>
                          <div className="sm:col-span-2 grid grid-cols-2 gap-x-4 gap-y-2.5 text-left">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Vehicle Number</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{selectedVehicleDetails.regNo || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Brand / Model</span>
                              <span className="text-xs font-bold text-slate-800">{selectedVehicleDetails.brand || "N/A"} / {selectedVehicleDetails.model || selectedVehicleDetails.name || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Engine Number</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{selectedVehicleDetails.engineNo || selectedVehicleDetails.engineNumber || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Chassis Number</span>
                              <span className="text-xs font-mono font-bold text-slate-800">{selectedVehicleDetails.chassisNo || selectedVehicleDetails.chassisNumber || "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Purchase Date</span>
                              <span className="text-xs font-bold text-slate-800">{selectedVehicleDetails.purchaseDate || selectedVehicleDetails.createdAt ? new Date(selectedVehicleDetails.purchaseDate || selectedVehicleDetails.createdAt).toLocaleDateString("en-IN") : "N/A"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold uppercase block leading-none">Purchase Price</span>
                              <span className="text-xs font-bold text-emerald-600">₹{(selectedVehicleDetails.purchasePrice || 0).toLocaleString("en-IN")}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Borrower Customer Name</label>
                        <input
                          type="text"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="e.g. Rahul Sharma"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 uppercase">Mobile Number</label>
                        <input
                          type="text"
                          value={formData.mobileNumber}
                          onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                          placeholder="9876543210"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Binding / Disbursal Date</label>
                    <input
    type="date"
    value={formData.loanDate}
    onChange={(e) => setFormData({ ...formData, loanDate: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Finance Provider / Company Name</label>
                    <input
    type="text"
    value={formData.financeName}
    onChange={(e) => setFormData({ ...formData, financeName: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="e.g. HDFC, Chola, Sundaram Finance"
  />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Asset Binding Amount (Valuation)</label>
                    <input
    type="number"
    value={formData.bindingAmount}
    onChange={(e) => setFormData({ ...formData, bindingAmount: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="INR 5,50,000"
  />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Principal Loan Disbursed (Taken Amount)</label>
                    <input
    type="number"
    value={formData.takenAmount}
    onChange={(e) => setFormData({ ...formData, takenAmount: e.target.value, dueAmount: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="INR 5,00,000"
    required
  />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Monthly EMI Repayment Pay Amount</label>
                    <input
    type="number"
    value={formData.monthlyPayAmount}
    onChange={(e) => setFormData({ ...formData, monthlyPayAmount: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="INR 12,500"
  />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase">Repayment Method Mode</label>
                    <select
    value={formData.paymentMode}
    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500"
  >
                      <option value="Cash">Cash in Hand</option>
                      <option value="Bank">Bank Account Transfer</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
    type="button"
    onClick={() => setShowAddModal(false)}
    className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
  >
                    Cancel
                  </button>
                  <button
    type="submit"
    className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all font-sans"
  >
                    Register Loan & Binding
                  </button>
                </div>
              </form>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* View Loan Details & Receipts Tabbed Modal */
  }
      <AnimatePresence>
        {showLoanDetailsModal && selectedLoan && <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => {
      setShowLoanDetailsModal(false);
      setSelectedLoan(null);
    }}
    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 max-h-[92vh] overflow-y-auto"
  >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="text-brand-600" size={24} />
                    Loan Binding Statement [ {selectedLoan.id} ]
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Manage collateralized principal balances, history and payment receipts</p>
                </div>
                <button
    onClick={() => {
      setShowLoanDetailsModal(false);
      setSelectedLoan(null);
    }}
    className="p-2 text-slate-400 hover:text-slate-600"
  >
                  <X size={20} />
                </button>
              </div>

              {
    /* Tab Switcher */
  }
              <div className="flex border-b border-slate-200 mb-6 font-semibold">
                <button
    onClick={() => setDetailsTab("details")}
    className={cn(
      "px-6 py-2.5 text-sm transition-all border-b-2",
      detailsTab === "details" ? "border-brand-600 text-brand-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-700"
    )}
  >
                  Core Loan Details
                </button>
                <button
    onClick={() => setDetailsTab("receipts")}
    className={cn(
      "px-6 py-2.5 text-sm transition-all border-b-2 flex items-center gap-2",
      detailsTab === "receipts" ? "border-brand-600 text-brand-600 font-extrabold" : "border-transparent text-slate-500 hover:text-slate-700"
    )}
  >
                  Payment Receipts Tab
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {(selectedLoan.receipts || []).length}
                  </span>
                </button>
              </div>

              {detailsTab === "details" ? <div className="space-y-6">
                  {
    /* Info table display */
  }
                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Loan Category Classification</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLoan.loanType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Borrower Name</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLoan.customerName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLoan.mobileNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Finance Provider Name</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLoan.financeName || "Direct"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Binding Assets Valuation</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">₹{(Number(selectedLoan?.bindingAmount) || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Principal Taken Amount</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">₹{(Number(selectedLoan?.takenAmount) || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Estimated Monthly repays EMI</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">₹{(Number(selectedLoan?.monthlyPayAmount) || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Disbursed Date</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{selectedLoan.loanDate}</p>
                    </div>

                    {selectedLoan.loanType === "Vehicle Loan" && <div className="col-span-2 border-t border-slate-200/60 pt-4 mt-2">
                        <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">Secured Collateralized Vehicle Assets Details</p>
                        <div className="grid grid-cols-2 gap-6 mt-1">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Vehicle Engine Brand</p>
                            <p className="text-xs font-bold text-indigo-950 mt-0.5">{selectedLoan.vehicleDetails || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Registration Number</p>
                            <p className="text-xs font-mono font-bold text-indigo-950 mt-0.5 uppercase tracking-wide">{selectedLoan.regNo || "N/A"}</p>
                          </div>
                        </div>
                      </div>}
                  </div>

                  <div className="flex gap-4 p-5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 justify-between items-center text-left">
                    <div>
                      <p className="font-extrabold uppercase text-blue-800 tracking-wider">Outstanding Security Summary</p>
                      <p className="text-slate-600 mt-1">
                        Out of <b>₹{(Number(selectedLoan?.takenAmount) || 0).toLocaleString("en-IN")}</b> principal, 
                        the user has currently repaid a total of <b>₹{((Number(selectedLoan?.takenAmount) || 0) - (Number(selectedLoan?.dueAmount) || 0)).toLocaleString("en-IN")}</b>.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Current Outstanding Balance Due</p>
                      <p className="text-base font-extrabold text-blue-950">₹{(Number(selectedLoan?.dueAmount) || 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                </div> : <div className="space-y-6">
                  {
    /* Receipts Summary Stats */
  }
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Loan Amount</p>
                      <p className="text-base font-extrabold text-slate-900 mt-1">₹{(Number(selectedLoan?.takenAmount) || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paid Amount</p>
                      <p className="text-base font-extrabold text-emerald-600 mt-1">₹{(selectedLoan?.receipts || []).reduce((sum, r) => sum + Number(r.amountPaid || 0), 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Pending Amount</p>
                      <p className="text-base font-extrabold text-rose-600 mt-1">₹{(Number(selectedLoan?.dueAmount) || 0).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Next Due Date</p>
                      <p className="text-sm font-extrabold text-blue-900 mt-1 font-mono">{(() => {
    if (!selectedLoan.loanDate) return "N/A";
    try {
      const d = new Date(selectedLoan.loanDate);
      if (isNaN(d.getTime())) return "N/A";
      const today = /* @__PURE__ */ new Date();
      let month = today.getMonth();
      let year = today.getFullYear();
      if (today.getDate() > d.getDate()) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      const targetDate = Math.min(d.getDate(), new Date(year, month + 1, 0).getDate());
      const nextDue = new Date(year, month, targetDate);
      return nextDue.toISOString().split("T")[0];
    } catch (e) {
      return "N/A";
    }
  })()}</p>
                    </div>
                  </div>

                  {
    /* Receipts module entry */
  }
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {
    /* Add new receipt form */
  }
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-left">
                      <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5 uppercase tracking-wide text-brand-700">
                        <Plus size={16} />
                        Record Repayment Receipt
                      </h4>
                      <form onSubmit={handleAddReceipt} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Repayment Date</label>
                          <input
    type="date"
    value={receiptForm.receiptDate}
    onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
    required
  />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">repaid Amount (INR)</label>
                          <input
    type="number"
    value={receiptForm.amountPaid}
    onChange={(e) => setReceiptForm({ ...receiptForm, amountPaid: e.target.value })}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none font-bold"
    placeholder="e.g. 5000"
    required
  />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Payment Method</label>
                          <select
    value={receiptForm.paymentMode}
    onChange={(e) => setReceiptForm({ ...receiptForm, paymentMode: e.target.value })}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none"
  >
                            <option value="Cash">Cash payment</option>
                            <option value="Bank">Bank Deposit</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Reference / Transaction Number (Optional)</label>
                          <input
    type="text"
    value={receiptForm.referenceNumber}
    onChange={(e) => setReceiptForm({ ...receiptForm, referenceNumber: e.target.value })}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="IMPS / TXN ID etc."
  />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks / Notes</label>
                          <input
    type="text"
    value={receiptForm.remarks}
    onChange={(e) => setReceiptForm({ ...receiptForm, remarks: e.target.value })}
    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-500 outline-none"
    placeholder="Month of March pay etc."
  />
                        </div>

                        <button
    type="submit"
    className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-md shadow-brand-100 transition-all uppercase tracking-wider"
  >
                          Submit Receipt Record
                        </button>
                      </form>
                    </div>

                    {
    /* Receipts History List */
  }
                    <div className="flex flex-col text-left space-y-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide text-indigo-700">
                        <Clock size={16} />
                        Payment Receipts History logs
                      </h4>

                      <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 max-h-[400px]">
                        {!selectedLoan.receipts || selectedLoan.receipts.length === 0 ? <div className="p-12 text-center text-slate-400 text-xs italic">
                            No ledger receipts recorded for this loan yet.
                          </div> : selectedLoan.receipts.map((rec) => <div key={rec.id} className="p-4 hover:bg-slate-50/70 transition-colors text-xs space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800 text-[11px] font-mono">{rec.id}</span>
                                <span className="font-extrabold text-emerald-600">₹{(Number(rec?.amountPaid) || 0).toLocaleString("en-IN")}</span>
                              </div>
                              <div className="flex justify-between text-slate-500">
                                <span className="font-medium">Paid: {rec.receiptDate}</span>
                                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase text-[9px]">{rec.paymentMode}</span>
                              </div>
                              {rec.referenceNumber && <p className="text-[10px] text-slate-500">Ref: <span className="font-mono text-slate-700 font-bold">{rec.referenceNumber}</span></p>}
                              {rec.remarks && <p className="text-[10px] text-slate-400 italic font-medium">Remarks: "{rec.remarks}"</p>}
                            </div>)}
                      </div>
                    </div>
                  </div>
                </div>}

              <div className="mt-8 flex justify-between gap-3 pt-4 border-t border-slate-100">
                <button
    onClick={() => generateLoanPDF(selectedLoan)}
    className="px-5 py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center gap-1.5 transition-colors"
  >
                  <Printer size={15} />
                  Print Complete Loan summary Certificate
                </button>
                <button
    onClick={() => {
      setShowLoanDetailsModal(false);
      setSelectedLoan(null);
    }}
    className="px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg transition-colors"
  >
                  Close Statement
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
function setFormState(cb) {
}
