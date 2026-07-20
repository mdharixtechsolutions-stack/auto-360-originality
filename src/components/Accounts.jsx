import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Book, PieChart, BarChart3, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Download, ArrowLeft, Printer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasModulePermission } from "../lib/permissions";
export default function Accounts({
  ledgers,
  onUpdateLedgers,
  entries,
  onUpdateEntries,
  initialTab,
  initialVoucherData,
  currentUser,
  vehicles = []
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "ledger");
  const [selectedStatementLedger, setSelectedStatementLedger] = useState(null);
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    setSelectedStatementLedger(null);
  }, [initialTab]);

  useEffect(() => {
    setSelectedStatementLedger(null);
  }, [activeTab]);
  const [showAddLedger, setShowAddLedger] = useState(false);
  const [showAddVoucher, setShowAddVoucher] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [localFrom, setLocalFrom] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 3 ? currentYear - 1 : currentYear;
    return localStorage.getItem("financialYearFrom") || `${startYear}-04-01`;
  });
  const [localTo, setLocalTo] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 3 ? currentYear - 1 : currentYear;
    return localStorage.getItem("financialYearTo") || `${startYear + 1}-03-31`;
  });
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 3 ? currentYear - 1 : currentYear;
    return localStorage.getItem("financialYearFrom") || `${startYear}-04-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 3 ? currentYear - 1 : currentYear;
    return localStorage.getItem("financialYearTo") || `${startYear + 1}-03-31`;
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleReset = () => {
    setSearchQuery("");
    const now = new Date();
    const currentYear = now.getFullYear();
    const startYear = now.getMonth() < 3 ? currentYear - 1 : currentYear;
    const fyFrom = localStorage.getItem("financialYearFrom") || `${startYear}-04-01`;
    const fyTo = localStorage.getItem("financialYearTo") || `${startYear + 1}-03-31`;
    setLocalFrom(fyFrom);
    setLocalTo(fyTo);
    setFromDate(fyFrom);
    setToDate(fyTo);
  };
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    const reportTitle = `accounts_${activeTab}_report`;
    if (activeTab === "ledger") {
      headers = ["ID", "Ledger Name", "Group", "Balance", "Type"];
      rows = dynamicLedgers.map((l) => [l.id, l.name, l.group, l.balance, l.type]);
    } else if (activeTab === "daybook" || activeTab === "voucher") {
      headers = ["Voucher No", "Type", "Ledger", "Mode", "Amount", "Date"];
      rows = entries.map((e) => [e.id, e.type, e.ledger, e.mode, e.amount, e.date || ""]);
    } else if (activeTab === "trial") {
      headers = ["Particulars", "Debit (INR)", "Credit (INR)"];
      rows = dynamicLedgers.filter(l => l.dr > 0 || l.cr > 0).map(l => [
        l.name,
        l.dr > 0 ? l.dr.toString() : "0",
        l.cr > 0 ? l.cr.toString() : "0"
      ]);
    } else if (activeTab === "pl") {
      const purchaseCost = dynamicLedgers.find(l => l.name === "Purchase Accounts")?.dr || 0;
      const refurbishment = dynamicLedgers.find(l => l.name === "Vehicle Maintenance")?.dr || 0;
      const salaries = dynamicLedgers.find(l => l.name === "Salaries Account")?.dr || 0;
      const rent = dynamicLedgers.find(l => l.name === "Office Rent Account")?.dr || 0;
      const directExpenses = dynamicLedgers.find(l => l.name === "Direct Expenses")?.dr || 0;

      const salesRevenue = dynamicLedgers.find(l => l.name === "Sales Account")?.cr || 0;
      const consultancyFees = dynamicLedgers.filter(l => l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;
      const otherIncome = dynamicLedgers.filter(l => l.group === "Sales Accounts" && l.name !== "Sales Account" && !l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;

      const totalExpenses = purchaseCost + refurbishment + salaries + rent + directExpenses;
      const totalIncomes = salesRevenue + consultancyFees + otherIncome;
      const netProfit = totalIncomes - totalExpenses;

      headers = ["Particulars", "Debit Expenses", "Credit Incomes"];
      rows = [
        ["Purchase Cost (Automated purchases)", purchaseCost.toString(), "0"],
        ["Refurbishment (Vehicle Maintenance)", refurbishment.toString(), "0"],
        ["Staff Salaries", salaries.toString(), "0"],
        ["Office Rent & Direct Expenses", (rent + directExpenses).toString(), "0"],
        ["Sales Revenue (Automated deals)", "0", salesRevenue.toString()],
        ["Consultancy Fees", "0", consultancyFees.toString()],
        ["Other Income & Commissions", "0", otherIncome.toString()],
        ["Net Profit", (netProfit >= 0 ? netProfit.toString() : "0"), (netProfit < 0 ? Math.abs(netProfit).toString() : "0")]
      ];
    } else if (activeTab === "balance") {
      const purchaseCost = dynamicLedgers.find(l => l.name === "Purchase Accounts")?.dr || 0;
      const refurbishment = dynamicLedgers.find(l => l.name === "Vehicle Maintenance")?.dr || 0;
      const salaries = dynamicLedgers.find(l => l.name === "Salaries Account")?.dr || 0;
      const rent = dynamicLedgers.find(l => l.name === "Office Rent Account")?.dr || 0;
      const directExpenses = dynamicLedgers.find(l => l.name === "Direct Expenses")?.dr || 0;

      const salesRevenue = dynamicLedgers.find(l => l.name === "Sales Account")?.cr || 0;
      const consultancyFees = dynamicLedgers.filter(l => l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;
      const otherIncome = dynamicLedgers.filter(l => l.group === "Sales Accounts" && l.name !== "Sales Account" && !l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;

      const totalExpenses = purchaseCost + refurbishment + salaries + rent + directExpenses;
      const totalIncomes = salesRevenue + consultancyFees + otherIncome;
      const netProfit = totalIncomes - totalExpenses;

      const activeVehicles = Array.isArray(vehicles) ? vehicles : [];
      const closingStock = activeVehicles.filter(v => v.status === "Available" && !v.isDeleted).reduce((acc, v) => acc + (v.purchasePrice || v.purchase_price || 0), 0) || 0;
      const sundryDebtors = activeVehicles.filter(v => v.status === "Sold" && !v.isDeleted).reduce((acc, v) => acc + (Number(v.balance_amount) || 0), 0) || 0;

      const cashBalance = dynamicLedgers.find(l => l.name === "Cash in Hand")?.dr || 0;
      const bankBalance = dynamicLedgers.find(l => l.name === "Bank Accounts")?.dr || 0;
      const cashAndBank = cashBalance + bankBalance;
      const fixedAssets = 0;

      const capital = dynamicLedgers.find(l => l.name === "Capital Account")?.cr || 0;
      const creditors = dynamicLedgers.find(l => l.name === "Sundry Creditors")?.cr || 0;
      const loans = dynamicLedgers.find(l => l.name === "Loans (Liability)")?.cr || 0;
      const reservesAndSurplus = netProfit;

      headers = ["Particulars", "Liabilities", "Assets"];
      rows = [
        ["Capital Account (Owner's Equity)", capital.toString(), "0"],
        ["Loans (Liability)", loans.toString(), "0"],
        ["Sundry Creditors (Dues & Payables)", creditors.toString(), "0"],
        ["Reserves & Surplus (Net Profit)", reservesAndSurplus.toString(), "0"],
        ["Fixed Assets", "0", fixedAssets.toString()],
        ["Closing Stock (Available Vehicles)", "0", closingStock.toString()],
        ["Sundry Debtors (Deal Receivables)", "0", sundryDebtors.toString()],
        ["Cash & Bank Accounts", "0", cashAndBank.toString()]
      ];
    }
    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${("" + cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${reportTitle}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Auto360 Consultancy - Accounts: ${activeTab.toUpperCase()}`, 14, 20);
      doc.setFontSize(10);
      doc.text(`Report Period: ${fromDate || "All Time"} to ${toDate || "Present"}`, 14, 28);
      let headers = [];
      let rows = [];
      if (activeTab === "ledger") {
        headers = ["ID", "Ledger Name", "Group", "Balance", "Type"];
        rows = dynamicLedgers.map((l) => [l.id, l.name, l.group, `INR ${l.balance.toLocaleString("en-IN")}`, l.type]);
      } else if (activeTab === "daybook" || activeTab === "voucher") {
        headers = ["Voucher No", "Type", "Ledger", "Mode", "Amount"];
        rows = entries.map((e) => [e.id, e.type, e.ledger, e.mode, `INR ${Number(e.amount || 0).toLocaleString("en-IN")}`]);
      } else if (activeTab === "trial") {
        headers = ["Particulars", "Debit (INR)", "Credit (INR)"];
        const rowsTB = dynamicLedgers.filter(l => l.dr > 0 || l.cr > 0).map(l => [
          l.name,
          l.dr > 0 ? `INR ${l.dr.toLocaleString("en-IN")}` : "-",
          l.cr > 0 ? `INR ${l.cr.toLocaleString("en-IN")}` : "-"
        ]);
        const totalDr = dynamicLedgers.reduce((acc, l) => acc + l.dr, 0);
        const totalCr = dynamicLedgers.reduce((acc, l) => acc + l.cr, 0);
        rows = [
          ...rowsTB,
          ["Total", `INR ${totalDr.toLocaleString("en-IN")}`, `INR ${totalCr.toLocaleString("en-IN")}`]
        ];
      } else if (activeTab === "pl") {
        const purchaseCost = dynamicLedgers.find(l => l.name === "Purchase Accounts")?.dr || 0;
        const refurbishment = dynamicLedgers.find(l => l.name === "Vehicle Maintenance")?.dr || 0;
        const salaries = dynamicLedgers.find(l => l.name === "Salaries Account")?.dr || 0;
        const rent = dynamicLedgers.find(l => l.name === "Office Rent Account")?.dr || 0;
        const directExpenses = dynamicLedgers.find(l => l.name === "Direct Expenses")?.dr || 0;

        const salesRevenue = dynamicLedgers.find(l => l.name === "Sales Account")?.cr || 0;
        const consultancyFees = dynamicLedgers.filter(l => l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;
        const otherIncome = dynamicLedgers.filter(l => l.group === "Sales Accounts" && l.name !== "Sales Account" && !l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;

        const totalExpenses = purchaseCost + refurbishment + salaries + rent + directExpenses;
        const totalIncomes = salesRevenue + consultancyFees + otherIncome;
        const netProfit = totalIncomes - totalExpenses;

        headers = ["Category", "Particulars", "Amount"];
        rows = [
          ["Expense", "Purchase Cost (Automated purchases)", `INR ${purchaseCost.toLocaleString("en-IN")}`],
          ["Expense", "Refurbishment (Vehicle Maintenance)", `INR ${refurbishment.toLocaleString("en-IN")}`],
          ["Expense", "Staff Salaries", `INR ${salaries.toLocaleString("en-IN")}`],
          ["Expense", "Office Rent & Direct Expenses", `INR ${(rent + directExpenses).toLocaleString("en-IN")}`],
          ["Income", "Sales Revenue (Automated deals)", `INR ${salesRevenue.toLocaleString("en-IN")}`],
          ["Income", "Consultancy Fees", `INR ${consultancyFees.toLocaleString("en-IN")}`],
          ["Income", "Other Income & Commissions", `INR ${otherIncome.toLocaleString("en-IN")}`],
          ["Net Profit", netProfit >= 0 ? "Profit" : "Loss", `INR ${Math.abs(netProfit).toLocaleString("en-IN")}`]
        ];
      } else {
        const purchaseCost = dynamicLedgers.find(l => l.name === "Purchase Accounts")?.dr || 0;
        const refurbishment = dynamicLedgers.find(l => l.name === "Vehicle Maintenance")?.dr || 0;
        const salaries = dynamicLedgers.find(l => l.name === "Salaries Account")?.dr || 0;
        const rent = dynamicLedgers.find(l => l.name === "Office Rent Account")?.dr || 0;
        const directExpenses = dynamicLedgers.find(l => l.name === "Direct Expenses")?.dr || 0;

        const salesRevenue = dynamicLedgers.find(l => l.name === "Sales Account")?.cr || 0;
        const consultancyFees = dynamicLedgers.filter(l => l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;
        const otherIncome = dynamicLedgers.filter(l => l.group === "Sales Accounts" && l.name !== "Sales Account" && !l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;

        const totalExpenses = purchaseCost + refurbishment + salaries + rent + directExpenses;
        const totalIncomes = salesRevenue + consultancyFees + otherIncome;
        const netProfit = totalIncomes - totalExpenses;

        const activeVehicles = Array.isArray(vehicles) ? vehicles : [];
        const closingStock = activeVehicles.filter(v => v.status === "Available" && !v.isDeleted).reduce((acc, v) => acc + (v.purchasePrice || v.purchase_price || 0), 0) || 0;
        const sundryDebtors = activeVehicles.filter(v => v.status === "Sold" && !v.isDeleted).reduce((acc, v) => acc + (Number(v.balance_amount) || 0), 0) || 0;

        const cashBalance = dynamicLedgers.find(l => l.name === "Cash in Hand")?.dr || 0;
        const bankBalance = dynamicLedgers.find(l => l.name === "Bank Accounts")?.dr || 0;
        const cashAndBank = cashBalance + bankBalance;
        const fixedAssets = 0;

        const capital = dynamicLedgers.find(l => l.name === "Capital Account")?.cr || 0;
        const creditors = dynamicLedgers.find(l => l.name === "Sundry Creditors")?.cr || 0;
        const loans = dynamicLedgers.find(l => l.name === "Loans (Liability)")?.cr || 0;
        const reservesAndSurplus = netProfit;

        headers = ["Category", "Particulars", "Amount"];
        rows = [
          ["Liability", "Capital Account (Owner's Equity)", `INR ${capital.toLocaleString("en-IN")}`],
          ["Liability", "Loans (Liability)", `INR ${loans.toLocaleString("en-IN")}`],
          ["Liability", "Sundry Creditors (Dues & Payables)", `INR ${creditors.toLocaleString("en-IN")}`],
          ["Liability", "Reserves & Surplus (Net Profit)", `INR ${reservesAndSurplus.toLocaleString("en-IN")}`],
          ["Asset", "Fixed Assets", `INR ${fixedAssets.toLocaleString("en-IN")}`],
          ["Asset", "Closing Stock (Available Vehicles)", `INR ${closingStock.toLocaleString("en-IN")}`],
          ["Asset", "Sundry Debtors (Deal Receivables)", `INR ${sundryDebtors.toLocaleString("en-IN")}`],
          ["Asset", "Cash & Bank Accounts", `INR ${cashAndBank.toLocaleString("en-IN")}`]
        ];
      }
      autoTable(doc, {
        startY: 35,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }
      });
      doc.save(`accounts_${activeTab}_report.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    }
  };
  const handlePrint = () => {
    window.print();
  };
  const dynamicLedgers = useMemo(() => {
    return computeDynamicLedgers(ledgers, entries);
  }, [ledgers, entries]);

  const filteredLedgers = useMemo(() => dynamicLedgers.filter(
    (l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.group.toLowerCase().includes(searchQuery.toLowerCase())
  ), [dynamicLedgers, searchQuery]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const isWithinFrom = fromDate ? e.date >= fromDate : true;
      const isWithinTo = toDate ? e.date <= toDate : true;
      const matchesSearch = searchQuery ? e.ledger.toLowerCase().includes(searchQuery.toLowerCase()) || e.type.toLowerCase().includes(searchQuery.toLowerCase()) || e.id.toLowerCase().includes(searchQuery.toLowerCase()) : true;
      return isWithinFrom && isWithinTo && matchesSearch;
    });
  }, [entries, fromDate, toDate, searchQuery]);

  const stats = useMemo(() => ({
    totalDr: dynamicLedgers.filter((l) => l.type === "Dr").reduce((acc, l) => acc + l.balance, 0),
    totalCr: dynamicLedgers.filter((l) => l.type === "Cr").reduce((acc, l) => acc + l.balance, 0),
    count: dynamicLedgers.length
  }), [dynamicLedgers]);
  const handleAddLedger = (ledger) => {
    fetch("/api/ledgers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ledger)
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to save ledger");
      return res.json();
    })
    .then(newLedger => {
      onUpdateLedgers((prev) => [...prev, newLedger]);
      setShowAddLedger(false);
      alert("Ledger created successfully!");
    })
    .catch(err => {
      alert("Error adding ledger: " + err.message);
    });
  };
  const handlePostVoucher = (voucher) => {
    const payload = {
      date: voucher.date,
      type: voucher.type,
      debitAccount: voucher.ledger, // selected debitAccount passes in as voucher.ledger from VoucherEntry
      creditAccount: voucher.creditAccount || "Cash in Hand",
      amount: Number(voucher.amount),
      mode: voucher.mode || "Cash",
      narration: voucher.narration,
      vehicleId: voucher.vehicleId,
      vehicleName: voucher.vehicleName,
      regNo: voucher.regNo,
      branch: voucher.branch || currentUser?.branch || "Coimbatore"
    };

    fetch("/api/vouchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to post voucher");
      return res.json();
    })
    .then(newVoucher => {
      onUpdateEntries((prev) => [newVoucher, ...prev]);
      if (voucher.vehicleId) {
        fetch(`/api/purchases/${voucher.vehicleId}/add-expense`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            category: voucher.expenseCategory || "Other",
            amount: voucher.amount
          })
        }).then((res2) => {
          if (!res2.ok) {
            console.warn("[Add Linked Expense Failed]");
          } else {
            console.log("[Added Linked Expense Successfully]");
          }
        }).catch((err) => console.error("Error auto-syncing expense", err));
      }
      setShowAddVoucher(false);
      setActiveTab("daybook");
      alert("Voucher posted successfully!");
    })
    .catch(err => {
      alert("Error posting voucher: " + err.message);
    });
  };

  const handleEditVoucher = (id, updatedVoucher) => {
    const payload = {
      date: updatedVoucher.date,
      type: updatedVoucher.type,
      debitAccount: updatedVoucher.ledger, // matches field from VoucherEntry form submit
      creditAccount: updatedVoucher.creditAccount,
      amount: Number(updatedVoucher.amount),
      mode: updatedVoucher.mode,
      narration: updatedVoucher.narration,
      vehicleId: updatedVoucher.vehicleId,
      vehicleName: updatedVoucher.vehicleName,
      regNo: updatedVoucher.regNo,
      branch: updatedVoucher.branch || currentUser?.branch || "Coimbatore"
    };

    fetch(`/api/vouchers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to update voucher");
      return res.json();
    })
    .then(savedVoucher => {
      onUpdateEntries((prev) => prev.map(v => v.id === id ? savedVoucher : v));
      setEditingVoucher(null);
      alert("Voucher updated successfully!");
    })
    .catch(err => {
      alert("Error updating voucher: " + err.message);
    });
  };

  const handleDeleteVoucher = (id) => {
    if (!window.confirm("Are you sure you want to delete this voucher?")) return;
    
    fetch(`/api/vouchers/${id}`, {
      method: "DELETE"
    })
    .then(res => {
      if (!res.ok) throw new Error("Failed to delete voucher");
      onUpdateEntries((prev) => prev.filter(v => v.id !== id));
      alert("Voucher deleted successfully!");
    })
    .catch(err => {
      alert("Error deleting voucher: " + err.message);
    });
  };

  const tabs = [
    { id: "ledger", label: "Ledger Master", icon: Book },
    { id: "voucher", label: "Voucher Entry", icon: Plus },
    { id: "daybook", label: "Day Book", icon: Calendar },
    { id: "trial", label: "Trial Balance", icon: BarChart3 },
    { id: "pl", label: "Profit & Loss", icon: PieChart },
    { id: "balance", label: "Balance Sheet", icon: Wallet }
  ];
  return <div className="space-y-6">
      {
    /* Title Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Accounting Module</h2>
          <p className="text-sm text-slate-500">Manage ledger accounts, vouchers, journal logs, and financial statements</p>
        </div>
      </div>

      {
    /* Shared ERP Accounting Toolbar */
  }
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {
    /* Left search & dates */
  }
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
    type="text"
    placeholder={`Search in ${tabs.find((t) => t.id === activeTab)?.label || "Accounts"}...`}
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
  />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">From</span>
              <input
    type="date"
    value={localFrom}
    onChange={(e) => setLocalFrom(e.target.value)}
    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
  />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">To</span>
              <input
    type="date"
    value={localTo}
    onChange={(e) => setLocalTo(e.target.value)}
    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm font-medium"
  />
            </div>

            <button
              type="button"
              onClick={() => {
                setFromDate(localFrom);
                setToDate(localTo);
              }}
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer shadow-sm shadow-brand-100 uppercase"
            >
              GO
            </button>

            <button
    type="button"
    onClick={handleReset}
    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
  >
              Reset
            </button>
          </div>

          {
    /* Right actions */
  }
          <div className="flex flex-wrap items-center gap-2">
            <button
    type="button"
    onClick={handleRefresh}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl font-bold text-xs transition-all border border-brand-100 cursor-pointer outline-none"
    title="Refresh Data"
  >
              <svg className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Refresh</span>
            </button>

            <button
    type="button"
    onClick={handleExportCSV}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-all border border-emerald-100 cursor-pointer"
  >
              <Download size={14} />
              <span>Export CSV</span>
            </button>

            <button
    type="button"
    onClick={handleExportPDF}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all border border-indigo-100 cursor-pointer"
  >
              <Download size={14} />
              <span>Export PDF</span>
            </button>

            <button
    type="button"
    onClick={handlePrint}
    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs transition-all border border-amber-100 cursor-pointer"
  >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print</span>
            </button>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Debit (Dr)</p>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">₹{stats.totalDr.toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Credit (Cr)</p>
          <h3 className="text-xl font-extrabold text-rose-600 mt-1">₹{stats.totalCr.toLocaleString("en-IN")}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-brand-600">Total Ledgers</p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{stats.count}</h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px] relative">
        {isRefreshing && <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Syncing Ledger Data...</p>
            </div>
          </div>}

        {activeTab === "ledger" && (
          selectedStatementLedger ? (
            <LedgerStatementView
              ledger={selectedStatementLedger}
              entries={entries}
              fromDate={fromDate}
              toDate={toDate}
              onClose={() => setSelectedStatementLedger(null)}
            />
          ) : (
            <LedgerMaster
              ledgers={filteredLedgers}
              onAdd={() => setShowAddLedger(true)}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              canCreate={hasModulePermission(currentUser, "accounts", "create")}
              onViewStatement={(l) => setSelectedStatementLedger(l)}
            />
          )
        )}
        {activeTab === "voucher" && <VoucherEntry onPost={handlePostVoucher} ledgers={ledgers} initialData={initialVoucherData} canCreate={hasModulePermission(currentUser, "accounts", "create")} />}
        {activeTab === "daybook" && (
          <DayBook 
            entries={entries} 
            onEdit={setEditingVoucher} 
            onDelete={handleDeleteVoucher}
            canEdit={hasModulePermission(currentUser, "accounts", "edit")}
            canDelete={hasModulePermission(currentUser, "accounts", "delete")}
          />
        )}
        {activeTab === "trial" && <TrialBalance ledgers={ledgers} entries={entries} />}
        {activeTab === "pl" && <ProfitLoss ledgers={ledgers} entries={entries} />}
        {activeTab === "balance" && <BalanceSheet ledgers={ledgers} entries={entries} vehicles={vehicles} />}
      </div>

      {
    /* Add Ledger Modal */
  }
      <AnimatePresence>
        {showAddLedger && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddLedger(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Create New Ledger</h3>
              <form onSubmit={(e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    handleAddLedger({
      name: formData.get("name"),
      group: formData.get("group"),
      balance: Number(formData.get("balance")),
      type: formData.get("type")
    });
  }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Ledger Name</label>
                  <input name="name" required type="text" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" placeholder="e.g. Office Rent" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Group</label>
                  <select name="group" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500">
                    <option>Indirect Expenses</option>
                    <option>Direct Expenses</option>
                    <option>Sundry Debtors</option>
                    <option>Sundry Creditors</option>
                    <option>Bank Accounts</option>
                    <option>Cash-in-hand</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Opening Balance</label>
                    <input name="balance" type="number" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500" placeholder="0.00" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Type</label>
                    <select name="type" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="Dr">Debit (Dr)</option>
                      <option value="Cr">Credit (Cr)</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddLedger(false)} className="flex-1 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all">Create Ledger</button>
                </div>
              </form>
            </motion.div>
          </div>}
      </AnimatePresence>

      <AnimatePresence>
        {editingVoucher && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingVoucher(null)} className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
              <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Edit Voucher {editingVoucher.id}</h3>
                <button onClick={() => setEditingVoucher(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600 font-extrabold text-sm">✕</button>
              </div>
              <div className="overflow-y-auto flex-1 mt-4">
                <VoucherEntry 
                  onPost={(updated) => handleEditVoucher(editingVoucher.id, updated)} 
                  ledgers={ledgers} 
                  initialData={editingVoucher} 
                  canCreate={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>;
}
function LedgerMaster({ ledgers, onAdd, searchQuery, setSearchQuery, onViewStatement, canCreate = true }) {
  return <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900">Ledger Accounts</h3>
        <div className="flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
    type="text"
    placeholder="Search ledgers..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-sm"
  />
        </div>
        {canCreate && (
          <button
            onClick={onAdd}
            className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 cursor-pointer"
          >
            + New Ledger
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ledger Name</th>
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Group</th>
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Balance</th>
              <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {ledgers.map((l) => <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 font-bold text-slate-900">{l.name}</td>
                <td className="py-4 text-sm text-slate-500">{l.group}</td>
                <td className="py-4 text-right">
                  <span className={cn("font-bold", l.type === "Dr" ? "text-emerald-600" : "text-rose-600")}>
                    ₹{l.balance.toLocaleString("en-IN")} {l.type}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button onClick={() => onViewStatement && onViewStatement(l)} className="text-brand-600 font-bold text-xs hover:underline">View Statement</button>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
}
function VoucherEntry({ onPost, ledgers, initialData, canCreate = true }) {
  const [formData, setFormData] = useState({
    type: initialData?.type || "Payment",
    date: initialData?.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    debitAccount: initialData?.debitAccount || initialData?.ledger || "Vehicle Maintenance",
    creditAccount: initialData?.creditAccount || "Cash in Hand",
    amount: initialData?.amount || "",
    narration: initialData?.narration || ""
  });
  const [expenseCategory, setExpenseCategory] = useState("Other");
  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "Payment",
        date: initialData.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        debitAccount: initialData.debitAccount || initialData.ledger || "Vehicle Maintenance",
        creditAccount: initialData.creditAccount || "Cash in Hand",
        amount: initialData.amount || "",
        narration: initialData.narration || ""
      });
    }
  }, [initialData]);
  return <div className="p-6 w-full space-y-8 text-left">
      <div>
        <h3 className="text-xl font-bold text-slate-900">New Voucher Entry</h3>
        <p className="text-sm text-slate-500">Record a financial transaction in full-width responsive layout</p>
      </div>

      {initialData?.vehicleId && <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-left text-xs text-indigo-900 flex justify-between items-center">
          <div>
            <p className="font-extrabold uppercase text-indigo-700">Linked Vehicle Expense</p>
            <p className="font-semibold text-slate-700 mt-1">
              Vehicle Name: <b className="text-indigo-950">{initialData.vehicleName}</b> | 
              Reg No: <b className="text-indigo-950">{initialData.regNo}</b> |
              ID: <b className="text-indigo-950">{initialData.vehicleId}</b>
            </p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-200 text-indigo-800 rounded-lg font-bold">Auto-Linked</span>
        </div>}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Voucher Type</label>
            <select
              value={formData.type}
              onChange={(e) => {
                const val = e.target.value;
                let extra = {};
                if (val === "Receipt") {
                  extra = {
                    debitAccount: ledgers.some(l => l.name === "Cash in Hand") ? "Cash in Hand" : (ledgers[0]?.name || ""),
                    creditAccount: ledgers.some(l => l.name === "Capital Account") ? "Capital Account" : (ledgers[0]?.name || "")
                  };
                } else if (val === "Payment") {
                  extra = {
                    debitAccount: ledgers.some(l => l.name === "Vehicle Maintenance") ? "Vehicle Maintenance" : (ledgers[0]?.name || ""),
                    creditAccount: ledgers.some(l => l.name === "Cash in Hand") ? "Cash in Hand" : (ledgers[0]?.name || "")
                  };
                } else if (val === "Contra") {
                  extra = {
                    debitAccount: ledgers.some(l => l.name === "Bank Accounts") ? "Bank Accounts" : (ledgers.some(l => l.name === "HDFC Bank") ? "HDFC Bank" : (ledgers[0]?.name || "")),
                    creditAccount: ledgers.some(l => l.name === "Cash in Hand") ? "Cash in Hand" : (ledgers[0]?.name || "")
                  };
                } else if (val === "Journal") {
                  extra = {
                    debitAccount: ledgers.some(l => l.name === "Direct Expenses") ? "Direct Expenses" : (ledgers[0]?.name || ""),
                    creditAccount: ledgers.some(l => l.name === "Indirect Expenses") ? "Indirect Expenses" : (ledgers[0]?.name || "")
                  };
                }
                setFormData(prev => ({
                  ...prev,
                  type: val,
                  ...extra
                }));
              }}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none hover:border-slate-300"
            >
              <option>Payment</option>
              <option>Receipt</option>
              <option>Journal</option>
              <option>Contra</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
            <input
    type="date"
    value={formData.date}
    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  />
          </div>
        </div>

        {initialData?.vehicleId && formData.type === "Payment" && <div className="space-y-1.5 text-left p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <label className="text-xs font-bold text-slate-600 uppercase">Select Expense Allocation Type</label>
            <p className="text-[10px] text-slate-400 mb-1.5">Categorize this payment against the vehicle’s dynamic expenses</p>
            <select
    value={expenseCategory}
    onChange={(e) => setExpenseCategory(e.target.value)}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
  >
              <option value="Fuel">Fuel Expense</option>
              <option value="Repair">Repair Expense</option>
              <option value="Service">Service Expense</option>
              <option value="Insurance">Insurance Expense</option>
              <option value="RTO">RTO / Registration Expense</option>
              <option value="Other">Other Expense</option>
            </select>
          </div>}

        <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase">Debit Account (Dr)</label>
              <select
    value={formData.debitAccount}
    onChange={(e) => setFormData({ ...formData, debitAccount: e.target.value })}
    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
  >
                <option value="">Select Ledger...</option>
                {ledgers.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase">Credit Account (Cr)</label>
              <select
    value={formData.creditAccount}
    onChange={(e) => setFormData({ ...formData, creditAccount: e.target.value })}
    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-505 outline-none"
  >
                <option value="">Select Ledger...</option>
                {ledgers.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5 text-left md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Amount (₹)</label>
              <input
    type="number"
    value={formData.amount}
    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-bold"
    placeholder="0.00"
  />
            </div>
            <div className="space-y-1.5 text-left md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Narration</label>
              <textarea
    value={formData.narration}
    onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
    rows={2}
    placeholder="Enter transaction details..."
  />
            </div>
          </div>
        </div>

        {canCreate ? (
          <button
            onClick={() => {
              if (!formData.debitAccount || !formData.creditAccount || !formData.amount) {
                alert("Please fill all required voucher fields.");
                return;
              }
              onPost({
                date: formData.date,
                type: formData.type,
                ledger: formData.debitAccount,
                debitAccount: formData.debitAccount,
                creditAccount: formData.creditAccount,
                amount: Number(formData.amount),
                mode: formData.type === "Receipt" ? "Cash" : "Bank",
                // Dynamic mapping linking payload
                vehicleId: initialData?.vehicleId,
                expenseCategory,
                narration: formData.narration
              });
            }}
            className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 shadow-lg shadow-brand-100 transition-all cursor-pointer"
          >
            Post Voucher
          </button>
        ) : (
          <div className="p-4 bg-amber-50 text-amber-700 rounded-xl text-center text-xs font-bold border border-amber-200">
            You do not have permission to post new vouchers.
          </div>
        )}
      </div>
    </div>;
}
function DayBook({ entries = [], onEdit, onDelete, canEdit = true, canDelete = true }) {
  const [filterType, setFilterType] = useState("All");
  const [dateMode, setDateMode] = useState("Single"); // "Single", "Range", "All"
  const [selectedDate, setSelectedDate] = useState(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // first day of month
    return d.toISOString().split("T")[0];
  });
  const [toDate, setToDate] = useState(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [search, setSearch] = useState("");

  const filteredEntries = useMemo(() => {
    return [...entries]
      .filter((e) => {
        if (e.isDeleted) return false;

        // 1. Date filter
        if (dateMode === "Single") {
          if (!e.date || e.date.split("T")[0] !== selectedDate) return false;
        } else if (dateMode === "Range") {
          const dStr = e.date ? e.date.split("T")[0] : "";
          if (fromDate && dStr < fromDate) return false;
          if (toDate && dStr > toDate) return false;
        }
        
        // 2. Type filter
        if (filterType !== "All" && e.type !== filterType) return false;

        // 3. Search query
        if (search.trim()) {
          const query = search.toLowerCase();
          const id = (e.id || "").toLowerCase();
          const ledger = (e.ledger || "").toLowerCase();
          const drAcc = (e.debitAccount || "").toLowerCase();
          const crAcc = (e.creditAccount || "").toLowerCase();
          const narration = (e.narration || "").toLowerCase();
          const vehicle = (e.vehicleName || "").toLowerCase();
          const reg = (e.regNo || "").toLowerCase();
          const branch = (e.branch || "").toLowerCase();
          
          const matches = id.includes(query) || 
                          ledger.includes(query) || 
                          drAcc.includes(query) || 
                          crAcc.includes(query) || 
                          narration.includes(query) || 
                          vehicle.includes(query) || 
                          reg.includes(query) || 
                          branch.includes(query);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // descending date order
  }, [entries, dateMode, selectedDate, fromDate, toDate, filterType, search]);

  const formattedDateString = useMemo(() => {
    if (dateMode === "All") return "All Transaction Records";
    if (dateMode === "Range") return `${fromDate} to ${toDate}`;
    try {
      const d = new Date(selectedDate);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch (err) {
      return selectedDate;
    }
  }, [selectedDate, fromDate, toDate, dateMode]);

  return <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Day Book Transaction Ledger</h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">{formattedDateString} ({filteredEntries.length} items found)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 w-48 transition-all" 
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type Filter */}
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-bold text-slate-700"
          >
            <option value="All">All Types</option>
            <option value="Payment">Payment</option>
            <option value="Receipt">Receipt</option>
            <option value="Journal">Journal</option>
            <option value="Contra">Contra</option>
          </select>

          {/* Date Filter Modes */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            {["Single", "Range", "All"].map((mode) => (
              <button
                key={mode}
                onClick={() => setDateMode(mode)}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all",
                  dateMode === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Dynamic Date Inputs */}
          {dateMode === "Single" && (
            <input 
              type="date" 
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          )}

          {dateMode === "Range" && (
            <div className="flex items-center gap-1.5">
              <input 
                type="date" 
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)} 
              />
              <span className="text-xs text-slate-400 font-bold">to</span>
              <input 
                type="date" 
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-500 font-medium text-slate-700" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)} 
              />
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400">
              <th className="pb-3 text-xs font-bold uppercase tracking-wider pl-2">Voucher No / Date</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wider">Voucher Type</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wider">Dr Account</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wider">Cr Account</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wider">Particulars / Vehicle</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wider text-right pr-4">Amount (₹)</th>
              <th className="pb-3 text-xs font-bold uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 font-medium bg-slate-50/50 rounded-2xl">
                  No matching transaction entries found for the selected filters.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e) => {
                const isReceipt = e.type === "Receipt";
                const isPayment = e.type === "Payment";
                
                // Decode dr/cr accounts
                let dr = e.debitAccount;
                let cr = e.creditAccount;
                if (!dr || !cr) {
                  const mode = e.mode || "Cash";
                  const modeLedgerName = (mode === "Cash" || mode.toLowerCase() === "cash") ? "Cash in Hand" : "Bank Accounts";
                  const ledgerName = e.ledger || "Direct Expenses";
                  if (isReceipt) {
                    dr = modeLedgerName;
                    cr = ledgerName;
                  } else {
                    dr = ledgerName;
                    cr = modeLedgerName;
                  }
                }

                return (
                  <tr key={e.id} className="hover:bg-slate-50/70 transition-colors group">
                    <td className="py-3.5 pl-2">
                      <div className="font-bold text-slate-900">{e.id}</div>
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5">{e.date ? e.date.split("T")[0] : "N/A"}</div>
                    </td>
                    <td className="py-3.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide",
                        isReceipt ? "bg-emerald-100 text-emerald-800" : 
                        isPayment ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"
                      )}>
                        {e.type}
                      </span>
                    </td>
                    <td className="py-3.5 font-semibold text-slate-700">{dr}</td>
                    <td className="py-3.5 font-semibold text-slate-500">{cr}</td>
                    <td className="py-3.5 max-w-xs">
                      {e.narration && <div className="text-slate-600 line-clamp-1 italic">"{e.narration}"</div>}
                      {(e.vehicleName || e.regNo) && (
                        <div className="text-[10px] text-brand-600 font-bold mt-0.5 bg-brand-50 inline-block px-1.5 py-0.5 rounded-md">
                          🚗 {e.vehicleName || ""} {e.regNo ? `[${e.regNo}]` : ""}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 text-right font-bold text-slate-900 pr-4">
                      ₹{Number(e.amount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canEdit && (
                          <button 
                            onClick={() => onEdit(e)}
                            className="p-1.5 hover:bg-slate-200/60 text-slate-600 hover:text-slate-950 rounded-lg transition-colors"
                            title="Edit Voucher"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => onDelete(e.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-lg transition-colors"
                            title="Delete Voucher"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>;
}
function computeDynamicLedgers(ledgersList = [], entriesList = []) {
  const ledgerMap = {};
  
  const initialData = [
    { name: "Capital Account", group: "Capital Account", balance: 0, type: "Credit" },
    { name: "Purchase Accounts", group: "Direct Expenses", balance: 0, type: "Debit" },
    { name: "Sales Account", group: "Sales Accounts", balance: 0, type: "Credit" },
    { name: "Vehicle Maintenance", group: "Indirect Expenses", balance: 0, type: "Debit" },
    { name: "Direct Expenses", group: "Direct Expenses", balance: 0, type: "Debit" },
    { name: "Indirect Expenses", group: "Indirect Expenses", balance: 0, type: "Debit" },
    { name: "Salaries Account", group: "Indirect Expenses", balance: 0, type: "Debit" },
    { name: "Office Rent Account", group: "Indirect Expenses", balance: 0, type: "Debit" },
    { name: "Marketing Expense", group: "Indirect Expenses", balance: 0, type: "Debit" },
    { name: "Cash in Hand", group: "Cash-in-hand", balance: 0, type: "Debit" },
    { name: "Bank Accounts", group: "Bank Accounts", balance: 0, type: "Debit" },
    { name: "Sundry Debtors", group: "Current Assets", balance: 0, type: "Debit" },
    { name: "Sundry Creditors", group: "Current Liabilities", balance: 0, type: "Credit" },
    { name: "Loans (Liability)", group: "Loans (Liability)", balance: 0, type: "Credit" }
  ];

  initialData.forEach(l => {
    ledgerMap[l.name] = { ...l, debits: 0, credits: 0 };
  });

  ledgersList.forEach(l => {
    const normType = (l.type === "Dr" || l.type === "Debit") ? "Debit" : "Credit";
    if (!ledgerMap[l.name]) {
      ledgerMap[l.name] = {
        name: l.name,
        group: l.group || "Indirect Expenses",
        balance: Number(l.balance) || 0,
        type: normType,
        debits: 0,
        credits: 0
      };
    } else {
      ledgerMap[l.name].balance = Number(l.balance) || ledgerMap[l.name].balance;
      ledgerMap[l.name].type = normType;
    }
  });

  entriesList.forEach(item => {
    if (item.isDeleted) return;
    const amt = Number(item.amount) || 0;

    let drAcc = "";
    let crAcc = "";

    if (item.debitAccount && item.creditAccount) {
      drAcc = item.debitAccount;
      crAcc = item.creditAccount;
    } else {
      const mode = item.mode || "Cash";
      const modeLedgerName = (mode === "Cash" || mode.toLowerCase() === "cash") ? "Cash in Hand" : "Bank Accounts";
      const ledgerName = item.ledger || "Direct Expenses";

      if (item.type === "Receipt") {
        drAcc = modeLedgerName;
        crAcc = ledgerName;
      } else {
        drAcc = ledgerName;
        crAcc = modeLedgerName;
      }
    }

    // Process Debit Posting
    if (drAcc) {
      if (!ledgerMap[drAcc]) {
        let defaultGroup = "Indirect Expenses";
        if (drAcc.includes("Customer") || drAcc.includes("Debtors")) defaultGroup = "Current Assets";
        else if (drAcc.includes("Vendor") || drAcc.includes("Creditors") || drAcc.includes("Supplier")) defaultGroup = "Current Liabilities";
        
        ledgerMap[drAcc] = { name: drAcc, group: defaultGroup, balance: 0, type: "Debit", debits: 0, credits: 0 };
      }
      ledgerMap[drAcc].debits += amt;
    }

    // Process Credit Posting
    if (crAcc) {
      if (!ledgerMap[crAcc]) {
        let defaultGroup = "Sales Accounts";
        if (crAcc.includes("Customer") || crAcc.includes("Debtors")) defaultGroup = "Current Assets";
        else if (crAcc.includes("Vendor") || crAcc.includes("Creditors") || crAcc.includes("Supplier")) defaultGroup = "Current Liabilities";
        
        ledgerMap[crAcc] = { name: crAcc, group: defaultGroup, balance: 0, type: "Credit", debits: 0, credits: 0 };
      }
      ledgerMap[crAcc].credits += amt;
    }
  });

  return Object.values(ledgerMap).map(l => {
    let currentBalance = l.balance;
    if (l.type === "Debit") {
      currentBalance = currentBalance + l.debits - l.credits;
    } else {
      currentBalance = currentBalance + l.credits - l.debits;
    }
    
    let drFinal = 0;
    let crFinal = 0;
    
    if (currentBalance >= 0) {
      if (l.type === "Debit") drFinal = currentBalance;
      else crFinal = currentBalance;
    } else {
      if (l.type === "Debit") crFinal = Math.abs(currentBalance);
      else drFinal = Math.abs(currentBalance);
    }

    return {
      id: l.id || l.name,
      name: l.name,
      group: l.group,
      baseBalance: l.balance,
      debits: l.debits,
      credits: l.credits,
      dr: drFinal,
      cr: crFinal,
      netBalance: currentBalance,
      balance: Math.abs(currentBalance),
      type: currentBalance >= 0 ? (l.type === "Debit" ? "Dr" : "Cr") : (l.type === "Debit" ? "Cr" : "Dr")
    };
  });
}

function TrialBalance({ ledgers = [], entries = [] }) {
  const dynamicLedgers = computeDynamicLedgers(ledgers, entries);
  const totalDr = dynamicLedgers.reduce((acc, l) => acc + l.dr, 0);
  const totalCr = dynamicLedgers.reduce((acc, l) => acc + l.cr, 0);

  return <div className="p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-900">Trial Balance</h3>
      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-100/50">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Particulars</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Debit (₹)</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">Credit (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50">
            {dynamicLedgers.filter(l => l.dr > 0 || l.cr > 0).map((row, i) => <tr key={i}>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.name}</td>
                <td className="px-6 py-4 text-sm text-right text-slate-600">{row.dr > 0 ? row.dr.toLocaleString("en-IN") : "-"}</td>
                <td className="px-6 py-4 text-sm text-right text-slate-600">{row.cr > 0 ? row.cr.toLocaleString("en-IN") : "-"}</td>
              </tr>)}
          </tbody>
          <tfoot className="bg-slate-100/50 font-bold">
            <tr>
              <td className="px-6 py-4 text-slate-900 text-sm font-extrabold uppercase">Total</td>
              <td className="px-6 py-4 text-right text-brand-600 font-extrabold">₹{totalDr.toLocaleString("en-IN")}</td>
              <td className="px-6 py-4 text-right text-brand-600 font-extrabold">₹{totalCr.toLocaleString("en-IN")}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>;
}

function ProfitLoss({ ledgers = [], entries = [] }) {
  const dynamicLedgers = computeDynamicLedgers(ledgers, entries);

  const purchaseCost = dynamicLedgers.find(l => l.name === "Purchase Accounts")?.dr || 0;
  const refurbishment = dynamicLedgers.find(l => l.name === "Vehicle Maintenance")?.dr || 0;
  const salaries = dynamicLedgers.find(l => l.name === "Salaries Account")?.dr || 0;
  const rent = dynamicLedgers.find(l => l.name === "Office Rent Account")?.dr || 0;
  const directExpenses = dynamicLedgers.find(l => l.name === "Direct Expenses")?.dr || 0;

  const salesRevenue = dynamicLedgers.find(l => l.name === "Sales Account")?.cr || 0;
  const consultancyFees = dynamicLedgers.filter(l => l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;
  const otherIncome = dynamicLedgers.filter(l => l.group === "Sales Accounts" && l.name !== "Sales Account" && !l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;

  const totalExpenses = purchaseCost + refurbishment + salaries + rent + directExpenses;
  const totalIncomes = salesRevenue + consultancyFees + otherIncome;
  const netProfit = totalIncomes - totalExpenses;

  return <div className="p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Expenses</h4>
          <div className="space-y-2">
            {[
              { name: "Purchase Cost (Automated purchases)", amount: purchaseCost },
              { name: "Refurbishment (Vehicle Maintenance)", amount: refurbishment },
              { name: "Staff Salaries", amount: salaries },
              { name: "Office Rent & Direct Expenses", amount: rent + directExpenses }
            ].map((row, i) => <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700">{row.name}</span>
                <span className="text-sm font-bold text-rose-600">₹{row.amount.toLocaleString("en-IN")}</span>
              </div>)}
          </div>
        </div>
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Incomes</h4>
          <div className="space-y-2">
            {[
              { name: "Sales Revenue (Automated deals)", amount: salesRevenue },
              { name: "Consultancy Fees", amount: consultancyFees },
              { name: "Other Income & Commissions", amount: otherIncome }
            ].map((row, i) => <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700">{row.name}</span>
                <span className="text-sm font-bold text-emerald-600">₹{row.amount.toLocaleString("en-IN")}</span>
              </div>)}
          </div>
        </div>
      </div>
      <div className="mt-8 p-6 bg-brand-600 rounded-2xl text-white flex justify-between items-center">
        <div className="text-left">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Net Profit</p>
          <h4 className="text-3xl font-bold">₹{netProfit.toLocaleString("en-IN")}</h4>
        </div>
        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
          {netProfit >= 0 ? <ArrowUpRight size={32} /> : <ArrowDownRight size={32} />}
        </div>
      </div>
    </div>;
}

function BalanceSheet({ ledgers = [], entries = [], vehicles = [] }) {
  const dynamicLedgers = computeDynamicLedgers(ledgers, entries);

  const purchaseCost = dynamicLedgers.find(l => l.name === "Purchase Accounts")?.dr || 0;
  const refurbishment = dynamicLedgers.find(l => l.name === "Vehicle Maintenance")?.dr || 0;
  const salaries = dynamicLedgers.find(l => l.name === "Salaries Account")?.dr || 0;
  const rent = dynamicLedgers.find(l => l.name === "Office Rent Account")?.dr || 0;
  const directExpenses = dynamicLedgers.find(l => l.name === "Direct Expenses")?.dr || 0;

  const salesRevenue = dynamicLedgers.find(l => l.name === "Sales Account")?.cr || 0;
  const consultancyFees = dynamicLedgers.filter(l => l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;
  const otherIncome = dynamicLedgers.filter(l => l.group === "Sales Accounts" && l.name !== "Sales Account" && !l.name.toLowerCase().includes("consultancy")).reduce((acc, l) => acc + l.cr, 0) || 0;

  const totalExpenses = purchaseCost + refurbishment + salaries + rent + directExpenses;
  const totalIncomes = salesRevenue + consultancyFees + otherIncome;
  const netProfit = totalIncomes - totalExpenses;

  const activeVehicles = Array.isArray(vehicles) ? vehicles : [];
  const closingStock = activeVehicles.filter(v => v.status === "Available" && !v.isDeleted).reduce((acc, v) => acc + (v.purchasePrice || v.purchase_price || 0), 0) || 0;
  const sundryDebtors = activeVehicles.filter(v => v.status === "Sold" && !v.isDeleted).reduce((acc, v) => acc + (Number(v.balance_amount) || 0), 0) || 0;

  const cashBalance = dynamicLedgers.find(l => l.name === "Cash in Hand")?.dr || 0;
  const bankBalance = dynamicLedgers.find(l => l.name === "Bank Accounts")?.dr || 0;
  const cashAndBank = cashBalance + bankBalance;
  const fixedAssets = 0;

  const totalAssets = fixedAssets + closingStock + sundryDebtors + cashAndBank;

  const capital = dynamicLedgers.find(l => l.name === "Capital Account")?.cr || 0;
  const creditors = dynamicLedgers.find(l => l.name === "Sundry Creditors")?.cr || 0;
  const loans = dynamicLedgers.find(l => l.name === "Loans (Liability)")?.cr || 0;
  const reservesAndSurplus = netProfit;

  return <div className="p-6 space-y-6">
      <h3 className="text-lg font-bold text-slate-900">Balance Sheet</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Liabilities</h4>
          <div className="space-y-2">
            {[
              { name: "Capital Account (Owner's Equity)", amount: capital },
              { name: "Loans (Liability)", amount: loans },
              { name: "Sundry Creditors (Dues & Payables)", amount: creditors },
              { name: "Reserves & Surplus (Net Profit)", amount: reservesAndSurplus }
            ].map((row, i) => <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700">{row.name}</span>
                <span className="text-sm font-bold text-slate-900">₹{row.amount.toLocaleString("en-IN")}</span>
              </div>)}
          </div>
        </div>
        <div className="space-y-4 text-left">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Assets</h4>
          <div className="space-y-2">
            {[
              { name: "Fixed Assets", amount: fixedAssets },
              { name: "Closing Stock (Available Vehicles)", amount: closingStock },
              { name: "Sundry Debtors (Deal Receivables)", amount: sundryDebtors },
              { name: "Cash & Bank Accounts", amount: cashAndBank }
            ].map((row, i) => <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-700">{row.name}</span>
                <span className="text-sm font-bold text-slate-900">₹{row.amount.toLocaleString("en-IN")}</span>
              </div>)}
          </div>
        </div>
      </div>
      <div className="mt-8 flex justify-between p-6 border-t border-slate-200 font-bold text-lg">
        <span className="text-slate-900 font-extrabold uppercase">Total Balance Sheet Volume</span>
        <span className="text-brand-600 font-extrabold">₹{totalAssets.toLocaleString("en-IN")}</span>
      </div>
    </div>;
}

export function LedgerStatementView({ ledger, entries = [], onClose, fromDate, toDate }) {
  const ledgerName = ledger.name;
  
  // Decide if this ledger has Debit or Credit normal balance
  const isDebitLedger = ledger.group !== "Sales Accounts" && 
                        ledger.group !== "Loans (Liability)" && 
                        ledger.group !== "Capital Account" &&
                        !ledger.group.toLowerCase().includes("liability") &&
                        !ledger.group.toLowerCase().includes("income") &&
                        ledger.type !== "Credit" && ledger.type !== "Cr";

  const baseOpeningBalance = ledger.baseBalance || 0;
  const isCashOrBank = ledgerName === "Cash in Hand" || ledgerName === "Bank Accounts";

  const postings = [];

  // Sort and process vouchers
  const sortedEntries = [...entries]
    .filter(item => !item.isDeleted)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  sortedEntries.forEach(item => {
    const amt = Number(item.amount) || 0;

    let drAcc = "";
    let crAcc = "";

    if (item.debitAccount && item.creditAccount) {
      drAcc = item.debitAccount;
      crAcc = item.creditAccount;
    } else {
      const mode = item.mode || "Cash";
      const modeLedgerName = (mode === "Cash" || mode.toLowerCase() === "cash") ? "Cash in Hand" : "Bank Accounts";
      const ledgerName = item.ledger || "Direct Expenses";

      if (item.type === "Receipt") {
        drAcc = modeLedgerName;
        crAcc = ledgerName;
      } else {
        drAcc = ledgerName;
        crAcc = modeLedgerName;
      }
    }

    let debit = 0;
    let credit = 0;
    let match = false;
    let contraAccount = "";

    if (drAcc === ledgerName) {
      match = true;
      contraAccount = crAcc;
      debit = amt;
      credit = 0;
    } else if (crAcc === ledgerName) {
      match = true;
      contraAccount = drAcc;
      debit = 0;
      credit = amt;
    }

    if (match) {
      postings.push({
        date: item.date,
        voucherId: item.id || `V-${101}`,
        type: item.type,
        contraAccount: contraAccount,
        debit: debit,
        credit: credit,
        narration: item.narration || "",
        vehicleName: item.vehicleName || "N/A",
        regNo: item.regNo || "N/A",
        branch: item.branch || "Coimbatore"
      });
    }
  });

  // Filter postings based on dates
  const filteredPostings = postings.filter(p => {
    if (fromDate && p.date < fromDate) return false;
    if (toDate && p.date > toDate) return false;
    return true;
  });

  // Calculate opening balance before fromDate
  let openingBalance = baseOpeningBalance;
  if (fromDate) {
    postings.forEach(p => {
      if (p.date < fromDate) {
        if (isDebitLedger) {
          openingBalance += p.debit - p.credit;
        } else {
          openingBalance += p.credit - p.debit;
        }
      }
    });
  }

  // Generate running balance for filtered list
  let running = openingBalance;
  const rows = filteredPostings.map(p => {
    if (isDebitLedger) {
      running += p.debit - p.credit;
    } else {
      running += p.credit - p.debit;
    }
    return {
      ...p,
      runningBalance: running
    };
  });

  const closingBalance = running;

  const handleExportCSV = () => {
    const headers = ["Date", "Voucher No", "Particulars/Contra", "Voucher Type", "Debit (Dr)", "Credit (Cr)", "Running Balance", "Narration", "Branch"];
    const csvRows = [
      headers.join(","),
      `"", "Opening Balance", "", "", "", "", "${openingBalance}", "", ""`
    ];

    rows.forEach(r => {
      csvRows.push([
        `"${r.date}"`,
        `"${r.voucherId}"`,
        `"${r.contraAccount}"`,
        `"${r.type}"`,
        `"${r.debit}"`,
        `"${r.credit}"`,
        `"${r.runningBalance}"`,
        `"${r.narration.replace(/"/g, '""')}"`,
        `"${r.branch}"`
      ].join(","));
    });

    csvRows.push(`"", "Closing Balance", "", "", "", "", "${closingBalance}", "", ""`);

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Statement_${ledgerName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("LEDGER ACCOUNT STATEMENT", 14, 15);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Ledger Name: ${ledgerName}`, 14, 22);
      doc.text(`Group: ${ledger.group}`, 14, 27);
      doc.text(`Period: ${fromDate || "Beginning"} to ${toDate || "Present"}`, 14, 32);
      
      const tableHeaders = ["Date", "Voucher No", "Particulars", "Type", "Debit (Dr)", "Credit (Cr)", "Balance"];
      const tableRows = [
        ["", "Opening Balance", "", "", "", "", `₹${openingBalance.toLocaleString("en-IN")}`]
      ];

      rows.forEach(r => {
        tableRows.push([
          r.date,
          r.voucherId,
          r.contraAccount,
          r.type,
          r.debit > 0 ? `₹${r.debit.toLocaleString("en-IN")}` : "-",
          r.credit > 0 ? `₹${r.credit.toLocaleString("en-IN")}` : "-",
          `₹${r.runningBalance.toLocaleString("en-IN")}`
        ]);
      });

      tableRows.push(["", "Closing Balance", "", "", "", "", `₹${closingBalance.toLocaleString("en-IN")}`]);

      autoTable(doc, {
        startY: 37,
        head: [tableHeaders],
        body: tableRows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229] }
      });

      doc.save(`Statement_${ledgerName.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error(e);
      window.print();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer text-slate-600 hover:text-slate-900"
            title="Back to Ledgers"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-left">
            <h3 className="text-xl font-bold text-slate-900">Ledger Statement</h3>
            <p className="text-xs font-semibold text-brand-600 font-mono mt-0.5">{ledgerName} ({ledger.group})</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-all border border-emerald-100 cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition-all border border-indigo-100 cursor-pointer"
          >
            <Download size={14} />
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs transition-all border border-amber-100 cursor-pointer"
          >
            <Printer size={14} />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opening Balance</p>
          <h4 className="text-lg font-extrabold text-slate-700 mt-1">₹{openingBalance.toLocaleString("en-IN")} {isDebitLedger ? "Dr" : "Cr"}</h4>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Statement Period</p>
          <h4 className="text-sm font-extrabold text-slate-700 mt-1.5">{fromDate || "Beginning"} to {toDate || "Present"}</h4>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closing Balance</p>
          <h4 className={cn("text-lg font-extrabold mt-1", closingBalance >= 0 ? "text-emerald-600" : "text-rose-600")}>
            ₹{Math.abs(closingBalance).toLocaleString("en-IN")} {closingBalance >= 0 ? (isDebitLedger ? "Dr" : "Cr") : (isDebitLedger ? "Cr" : "Dr")}
          </h4>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Date</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Voucher No</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Particulars / Contra</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase">Type</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Debit (Dr)</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Credit (Cr)</th>
              <th className="p-3 text-xs font-bold text-slate-500 uppercase text-right">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="bg-amber-50/40">
              <td className="p-3 font-medium text-slate-500">-</td>
              <td className="p-3 font-mono font-bold text-slate-400">Opening</td>
              <td className="p-3 font-semibold text-slate-700">Opening Balance Forward</td>
              <td className="p-3 text-xs">-</td>
              <td className="p-3 text-right">-</td>
              <td className="p-3 text-right">-</td>
              <td className="p-3 text-right font-extrabold text-slate-800">₹{openingBalance.toLocaleString("en-IN")}</td>
            </tr>

            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                  No transactions recorded for this ledger in the selected period.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-slate-600 font-medium whitespace-nowrap">{row.date}</td>
                  <td className="p-3 font-mono text-xs font-extrabold text-slate-900">{row.voucherId}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-850">{row.contraAccount}</div>
                    {row.narration && (
                      <div className="text-xs text-slate-400 mt-0.5 italic">{row.narration}</div>
                    )}
                    {row.regNo && row.regNo !== "N/A" && (
                      <div className="mt-1">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded">
                          {row.vehicleName} ({row.regNo})
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide",
                      row.type === "Receipt" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    )}>
                      {row.type}
                    </span>
                  </td>
                  <td className="p-3 text-right text-emerald-600 font-bold">
                    {row.debit > 0 ? `₹${row.debit.toLocaleString("en-IN")}` : "-"}
                  </td>
                  <td className="p-3 text-right text-rose-600 font-bold">
                    {row.credit > 0 ? `₹${row.credit.toLocaleString("en-IN")}` : "-"}
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900">
                    ₹{row.runningBalance.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))
            )}

            <tr className="bg-slate-50 font-bold border-t border-slate-300">
              <td className="p-3">-</td>
              <td className="p-3 font-mono text-slate-500">Closing</td>
              <td className="p-3 text-slate-800 font-extrabold uppercase">Closing Balance</td>
              <td className="p-3">-</td>
              <td className="p-3 text-right">-</td>
              <td className="p-3 text-right">-</td>
              <td className="p-3 text-right font-extrabold text-brand-600">
                ₹{Math.abs(closingBalance).toLocaleString("en-IN")}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

