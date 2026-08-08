import { useMemo, useState, useEffect } from "react";
import {
  Users,
  Car,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertCircle,
  Coins,
  Building,
  Wallet,
  Receipt,
  FileSpreadsheet,
  ArrowUpCircle,
  ArrowDownCircle,
  ShieldCheck,
  TrendingDown,
  X,
  SlidersHorizontal,
  Download,
  AlertCircle as AlertIcon, // alias to avoid conflicts
  ShieldAlert,
  FileClock,
  FileWarning
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { AccountingService } from "../services/AccountingService";

const StatCard = ({ title, value, icon: Icon, color, subValue, onClick, trend }) => {
  const t = window.t || ((k) => k);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.015 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border flex flex-col justify-between min-h-[112px] transition-all duration-300 overflow-hidden group shadow-sm hover:shadow-md",
        color,
        onClick && "cursor-pointer active:scale-98"
      )}
    >
      {/* Subtle specular background sheen and neon circles */}
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-black/5 blur-lg pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10 gap-1.5">
        <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center text-white">
          <Icon size={16} className="stroke-[2.5]" />
        </div>
        {trend && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-md border border-white/10 text-white flex items-center gap-0.5 tracking-wider uppercase shadow-sm shrink-0">
            {trend.type === "up" ? <ArrowUpRight size={8} /> : <TrendingDown size={8} />}
            {t(trend.value)}
          </span>
        )}
      </div>
      
      <div className="mt-3 relative z-10 text-left">
        <p className="text-[9px] font-bold text-white/85 uppercase tracking-widest leading-none mb-1">{t(title)}</p>
        <h3 className="text-xl font-extrabold text-white font-mono tracking-tight leading-none">
          {typeof value === 'string' && value.includes('Members') ? `${value.split(' ')[0]} ${t('Members', 'Members')}` :
           typeof value === 'string' && value.includes('Vehicles') ? `${value.split(' ')[0]} ${t('Vehicles', 'Vehicles')}` :
           typeof value === 'string' && value.includes('Models') ? `${value.split(' ')[0]} ${t('Models', 'Models')}` :
           value}
        </h3>
        {subValue && (
          <p className="text-[10px] text-white/70 mt-1 font-medium leading-none truncate">{t(subValue)}</p>
        )}
      </div>
    </motion.div>
  );
};

const OutstandingStatCard = ({ title, totalAmount = 0, paidAmount = 0, receivedAmount = 0, outstandingAmount = 0, count = 0, icon: Icon, color, onClick, isSales = false }) => {
  const t = window.t || ((k) => k);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.015 }}
      onClick={onClick}
      className={cn(
        "relative p-4 rounded-xl border flex flex-col justify-between transition-all duration-300 overflow-hidden group shadow-sm hover:shadow-md cursor-pointer active:scale-98",
        color
      )}
    >
      <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-black/5 blur-lg pointer-events-none" />
      
      <div className="flex justify-between items-start relative z-10 gap-1.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center text-white">
            <Icon size={16} className="stroke-[2.5]" />
          </div>
          <p className="text-[10px] font-extrabold text-white uppercase tracking-wider">{t(title)}</p>
        </div>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/10 text-white flex items-center gap-1 shadow-sm shrink-0">
          {count} Pending
        </span>
      </div>

      <div className="mt-3 relative z-10 text-left">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-[9px] font-bold text-white/80 uppercase">Outstanding</span>
          <h3 className="text-xl font-black text-white font-mono tracking-tight">
            ₹{(Number(outstandingAmount) || 0).toLocaleString("en-IN")}
          </h3>
        </div>

        <div className="mt-2 pt-2 border-t border-white/20 grid grid-cols-2 gap-2 text-[10px] text-white/90 font-medium">
          <div>
            <span className="text-[9px] text-white/70 block uppercase font-bold">Total</span>
            <span className="font-mono font-extrabold">₹{(Number(totalAmount) || 0).toLocaleString("en-IN")}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] text-white/70 block uppercase font-bold">{isSales ? "Received" : "Paid"}</span>
            <span className="font-mono font-extrabold">₹{(Number(isSales ? receivedAmount : paidAmount) || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function Dashboard({ 
  vehicles = [], 
  deals = [], 
  payments = [], 
  customers = [], 
  ledgers = [], 
  onNavigate,
  suppliers = [],
  vouchers = [],
  brands = [],
  vehicleNames = []
}) {
  const [expenses, setExpenses] = useState([]);
  const [loans, setLoans] = useState([]);
  const [logins, setLogins] = useState([]);
  const [chartMode, setChartMode] = useState("sales"); // 'sales' | 'purchases' | 'expenses' | 'profit_trend'

  // ————— Stock Alert System States —————
  const [showStockAlertModal, setShowStockAlertModal] = useState(false);
  const [stockBranchFilter, setStockBranchFilter] = useState("all");
  const [stockTypeFilter, setStockTypeFilter] = useState("all");
  const [stockBrandFilter, setStockBrandFilter] = useState("all");

  // ————— Stock Alert System Calculations —————
  const stockReports = useMemo(() => {
    const groupings = {};

    vehicles.filter(v => !v.isDeleted).forEach(v => {
      let brandName = "Other";
      if (v.brand_id) {
        const foundB = brands.find(b => b.id === v.brand_id || b.name === v.brand_id);
        if (foundB) brandName = foundB.name;
        else brandName = v.brand_id;
      }

      let modelName = "General";
      if (v.vehicle_name_id) {
        const foundN = vehicleNames.find(n => n.id === v.vehicle_name_id || n.name === v.vehicle_name_id);
        if (foundN) modelName = foundN.name;
        else modelName = v.vehicle_name_id;
      } else if (v.model_details) {
        modelName = v.model_details;
      } else if (v.name) {
        modelName = v.name;
      }

      const type = v.vehicle_type || "Four Wheeler";
      const branchName = v.branch || "Coimbatore";
      const status = v.status || "Available";

      const key = `${type}::${brandName}::${modelName}::${branchName}`;

      if (!groupings[key]) {
        groupings[key] = {
          vehicleType: type,
          brand: brandName,
          model: modelName,
          branch: branchName,
          availStock: 0,
          totalStock: 0,
          regNoList: []
        };
      }

      groupings[key].totalStock += 1;
      if (status !== "Sold" && v.vehicle_status !== "Sold" && !v.isSold) {
        groupings[key].availStock += 1;
        if (v.regNo || v.reg_no) {
          groupings[key].regNoList.push(v.regNo || v.reg_no);
        }
      }
    });

    // Populate zero available stock defaults for any missing definitions
    vehicleNames.forEach(vn => {
      const bFound = brands.find(b => b.id === vn.brandId);
      const bName = bFound ? bFound.name : "Other";
      ["Coimbatore", "Erode", "Salem", "all"].forEach(br => {
        const key = `Four Wheeler::${bName}::${vn.name}::${br}`;
        if (!groupings[key]) {
          groupings[key] = {
            vehicleType: "Four Wheeler",
            brand: bName,
            model: vn.name,
            branch: br,
            availStock: 0,
            totalStock: 0,
            regNoList: []
          };
        }
      });
    });

    return Object.values(groupings);
  }, [vehicles, brands, vehicleNames]);

  const filteredStockReports = useMemo(() => {
    return stockReports.filter(p => {
      const matchBranch = stockBranchFilter === "all" || p.branch.toLowerCase() === stockBranchFilter.toLowerCase();
      const matchType = stockTypeFilter === "all" || p.vehicleType.toLowerCase() === stockTypeFilter.toLowerCase();
      const matchBrand = stockBrandFilter === "all" || p.brand.toLowerCase() === stockBrandFilter.toLowerCase();
      return matchBranch && matchType && matchBrand;
    });
  }, [stockReports, stockBranchFilter, stockTypeFilter, stockBrandFilter]);

  const lowStockThresholdCount = useMemo(() => {
    const globalGroupings = {};
    vehicles.filter(v => !v.isDeleted).forEach(v => {
      let brandName = "Other";
      if (v.brand_id) {
        const foundB = brands.find(b => b.id === v.brand_id || b.name === v.brand_id);
        if (foundB) brandName = foundB.name;
        else brandName = v.brand_id;
      }
      let modelName = v.model_details || v.name || "General";
      if (v.vehicle_name_id) {
        const foundN = vehicleNames.find(n => n.id === v.vehicle_name_id || n.name === v.vehicle_name_id);
        if (foundN) modelName = foundN.name;
      }
      const type = v.vehicle_type || "Four Wheeler";
      const key = `${type}::${brandName}::${modelName}`;
      if (!globalGroupings[key]) {
        globalGroupings[key] = { availStock: 0 };
      }
      if (v.status === "Available") globalGroupings[key].availStock += 1;
    });

    return Object.values(globalGroupings).filter(g => g.availStock <= 3).length;
  }, [vehicles, brands, vehicleNames]);

  const lowestStockDetails = useMemo(() => {
    const groupings = {};
    vehicles.filter(v => !v.isDeleted).forEach(v => {
      let brandName = "Other";
      if (v.brand_id) {
        const foundB = brands.find(b => b.id === v.brand_id || b.name === v.brand_id);
        if (foundB) brandName = foundB.name;
        else brandName = v.brand_id;
      } else if (v.brand) {
        brandName = v.brand;
      }
      let modelName = v.model_details || v.name || "General";
      if (v.vehicle_name_id) {
        const foundN = vehicleNames.find(n => n.id === v.vehicle_name_id || n.name === v.vehicle_name_id);
        if (foundN) modelName = foundN.name;
      }
      const type = v.vehicle_type || v.vehicleType || "Four Wheeler";
      const key = `${type}::${brandName}::${modelName}`;
      if (!groupings[key]) {
        groupings[key] = { type, brand: brandName, model: modelName, availStock: 0 };
      }
      if (v.status === "Available") groupings[key].availStock += 1;
    });

    const items = Object.values(groupings).filter(g => g.availStock <= 3).sort((a,b) => a.availStock - b.availStock);
    return items[0] || null;
  }, [vehicles, brands, vehicleNames]);

  const rcPendingCount = useMemo(() => {
    return vehicles.filter(v => !v.isDeleted && v.rcType !== "Card").length;
  }, [vehicles]);

  const nocPendingCount = useMemo(() => {
    return vehicles.filter(v => !v.isDeleted && (!v.noc || !v.noc.hasNoc)).length;
  }, [vehicles]);

  const insurancePendingCount = useMemo(() => {
    return vehicles.filter(v => !v.isDeleted && (!v.insurance || !v.insurance.hasInsurance)).length;
  }, [vehicles]);

  useEffect(() => {
    fetch("/api/expenses")
      .then((r) => r.json())
      .then((data) => setExpenses(data || []))
      .catch(console.error);
    fetch("/api/loans")
      .then((r) => r.json())
      .then((data) => setLoans(data || []))
      .catch(console.error);
    fetch("/api/login-reports")
      .then((r) => r.json())
      .then((data) => setLogins(data || []))
      .catch(console.error);
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const currentMonthStr = today.substring(0, 7);

  // Advanced Ledger & Voucher state aggregations
  const voucherStats = useMemo(() => {
    const ledgerMap = {};
    const initialLedgers = [
      { name: "Purchase Accounts", group: "Purchase Accounts", balance: 0, type: "Debit" },
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

    initialLedgers.forEach(l => {
      ledgerMap[l.name] = { ...l, debits: 0, credits: 0 };
    });

    // Merge in the real ledgers to preserve base/opening balances in dashboard
    (ledgers || []).forEach(l => {
      const normType = (l.type === "Dr" || l.type === "Debit" || l.type === "debit") ? "Debit" : "Credit";
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
        ledgerMap[l.name].balance = Number(l.balance) || 0;
        ledgerMap[l.name].type = normType;
      }
    });

    const entriesList = vouchers || [];
    let cashReceipts = 0;
    let bankReceipts = 0;

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

      // Track cash vs bank receipts for dashboard metrics
      if (item.type === "Receipt") {
        if (item.mode === "Cash" || (item.mode && item.mode.toLowerCase() === "cash")) {
          cashReceipts += amt;
        } else {
          bankReceipts += amt;
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

    // Compute updated balances
    const dynamicLedgers = Object.values(ledgerMap).map(l => {
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
        name: l.name,
        group: l.group,
        dr: drFinal,
        cr: crFinal,
        netBalance: currentBalance
      };
    });

    let cashInHandVal = 0;
    let bankBalanceVal = 0;

    dynamicLedgers.forEach(l => {
      const g = (l.group || "").toLowerCase();
      const n = (l.name || "").toLowerCase();
      if (n === "cash in hand" || g === "cash-in-hand" || g === "cash") {
        cashInHandVal += (l.netBalance || 0);
      }
      if (n === "bank accounts" || n === "hdfc bank" || g === "bank accounts" || g === "bank") {
        bankBalanceVal += (l.netBalance || 0);
      }
    });

    // Monthly Profit calculated direct from active month vouchers
    const currentMonthEntries = entriesList.filter(item => item.date && item.date.startsWith(currentMonthStr));
    
    let mPurchaseCost = 0;
    let mRefurbishment = 0;
    let mSalaries = 0;
    let mRent = 0;
    let mDirectExpenses = 0;
    let mSalesRevenue = 0;
    let mConsultancyFees = 0;
    let mOtherIncome = 0;

    currentMonthEntries.forEach(item => {
      const amt = Number(item.amount) || 0;
      const ledgerName = item.ledger;

      if (item.type === "Receipt") {
        if (ledgerName === "Sales Account") mSalesRevenue += amt;
        else if (ledgerName.toLowerCase().includes("consultancy")) mConsultancyFees += amt;
        else mOtherIncome += amt;
      } else if (item.type === "Payment") {
        if (ledgerName === "Purchase Accounts") mPurchaseCost += amt;
        else if (ledgerName === "Vehicle Maintenance") mRefurbishment += amt;
        else if (ledgerName === "Salaries Account") mSalaries += amt;
        else if (ledgerName === "Office Rent Account") mRent += amt;
        else if (ledgerName === "Direct Expenses") mDirectExpenses += amt;
      }
    });

    // Handle fresh setup where no current month vouchers exist yet
    if (currentMonthEntries.length === 0) {
       mPurchaseCost = vehicles.filter((v) => !v.isDeleted && v.createdAt && v.createdAt.startsWith(currentMonthStr)).reduce((acc, v) => acc + (v.purchasePrice || v.purchase_price || 0), 0);
       mSalesRevenue = deals.filter((d) => !d.isDeleted && d.date && d.date.startsWith(currentMonthStr)).reduce((acc, d) => acc + (Number(d.totalPrice) || (Number(d.sellingPrice || 0) + Number(d.consultancyFees || 0))), 0);
       mRefurbishment = expenses.filter((e) => !e.isDeleted && e.date && e.date.startsWith(currentMonthStr)).reduce((acc, e) => acc + (e.amount || 0), 0);
    }

    const mTotalExpenses = mPurchaseCost + mRefurbishment + mSalaries + mRent + mDirectExpenses;
    const mTotalIncomes = mSalesRevenue + mConsultancyFees + mOtherIncome;
    const netProfitVal = mTotalIncomes - mTotalExpenses;

    return {
      cashInHand: cashInHandVal,
      bankBalance: bankBalanceVal,
      totalCashReceipts: cashReceipts,
      totalBankReceipts: bankReceipts,
      netProfit: netProfitVal
    };
  }, [vouchers, vehicles, deals, expenses, currentMonthStr, ledgers]);

  // Operational metrics
  const availableCount = vehicles.filter((v) => v.status === "Available" && !v.isDeleted).length;
  const soldCount = vehicles.filter((v) => v.status === "Sold" && !v.isDeleted).length;

  // Outstandings & Pending Balances
  const customerSalesStats = useMemo(() => {
    return AccountingService.calculateGlobalCustomerSalesStats(deals, payments, vouchers);
  }, [deals, payments, vouchers]);

  const customerPurchaseStats = useMemo(() => {
    return AccountingService.calculateGlobalCustomerPurchaseStats(vehicles, payments, vouchers);
  }, [vehicles, payments, vouchers]);

  const supplierPurchaseStats = useMemo(() => {
    return AccountingService.calculateGlobalSupplierPurchaseStats(vehicles, payments, vouchers);
  }, [vehicles, payments, vouchers]);

  const totalPurchaseAmount = supplierPurchaseStats.totalAmount + customerPurchaseStats.totalAmount;
  const totalSalesAmount = customerSalesStats.totalAmount;

  const customerOutstandingTotal = customerSalesStats.total + customerPurchaseStats.total;
  const supplierOutstandingTotal = supplierPurchaseStats.total;

  const salesPendingAmount = customerSalesStats.outstandingAmount;
  const purchasePendingAmount = supplierPurchaseStats.outstandingAmount + customerPurchaseStats.outstandingAmount;

  const activeLoans = loans.filter((l) => l.status === "Active" && !l.isDeleted);
  const totalPendingLoanAmount = activeLoans.reduce((acc, l) => acc + (l.pendingAmount || l.balanceAmount || l.dueAmount || 0), 0);

  // Chart Data preparation
  const chartData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        name: `${monthNames[d.getMonth()]} ${String(d.getFullYear()).substring(2)}`,
        sales: 0,
        purchases: 0,
        expenses: 0,
        profit: 0
      });
    }

    deals.filter((d) => !d.isDeleted && d.date).forEach((d) => {
      const key = d.date.substring(0, 7);
      const match = months.find((m) => m.key === key);
      if (match) {
        match.sales += (Number(d.totalPrice) || (Number(d.sellingPrice || 0) + Number(d.consultancyFees || 0)));
      }
    });

    vehicles.filter((v) => !v.isDeleted && v.createdAt).forEach((v) => {
      const key = v.createdAt.substring(0, 7);
      const match = months.find((m) => m.key === key);
      if (match) {
        match.purchases += (v.purchasePrice || v.purchase_price || 0);
      }
    });

    expenses.filter((e) => !e.isDeleted && e.date).forEach((e) => {
      const key = e.date.substring(0, 7);
      const match = months.find((m) => m.key === key);
      if (match) {
        match.expenses += (e.amount || 0);
      }
    });

    months.forEach((m) => {
      const curMonthDeals = deals.filter((d) => !d.isDeleted && d.date && d.date.startsWith(m.key));
      const costOfSold = curMonthDeals.reduce((acc, d) => acc + (d.purchasePrice || 0), 0);
      m.profit = m.sales - costOfSold - m.expenses;
    });

    return months;
  }, [deals, vehicles, expenses]);

  const activeChartValue = useMemo(() => {
    switch (chartMode) {
      case "purchases": return "purchases";
      case "expenses": return "expenses";
      case "profit_trend": return "profit";
      default: return "sales";
    }
  }, [chartMode]);

  const activeChartLabel = useMemo(() => {
    switch (chartMode) {
      case "purchases": return "Purchases Volume";
      case "expenses": return "Operating Expenses";
      case "profit_trend": return "Net Operational Profit";
      default: return "Sales Gross Volume";
    }
  }, [chartMode]);

  const recentActivity = useMemo(() => {
    const activities = [];

    customers.forEach((c) => {
      activities.push({
        id: `cust-${c.id}`,
        title: "New Customer Registered",
        user: c.createdBy || "Admin",
        desc: `Customer ${c.name} registered matching ${c.vehicleInterest || "stock inventory"}`,
        time: c.createdAt ? new Date(c.createdAt).toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A",
        dateLabel: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "Just Now",
        icon: Users,
        color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        timestamp: new Date(c.createdAt || "").getTime()
      });
    });

    vehicles.forEach((v) => {
      activities.push({
        id: `purchase-${v.id}`,
        title: "Vehicle Sourced Inward",
        user: v.createdBy || "Procurement",
        desc: `Procured ${v.brand_id} ${v.vehicle_name_id || v.name} (${v.regNo || v.reg_no || "Direct Inward"}) for ₹${(v.purchasePrice || v.purchase_price || 0).toLocaleString("en-IN")}`,
        time: v.createdAt ? new Date(v.createdAt).toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A",
        dateLabel: v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "Just Now",
        icon: Car,
        color: "text-amber-600 bg-amber-50 border-amber-100",
        timestamp: new Date(v.createdAt || "").getTime()
      });
    });

    deals.filter((d) => d.type === "Sell").forEach((d) => {
      activities.push({
        id: `sale-${d.id}`,
        title: "Vehicle Deal Sold",
        user: d.createdBy || "Sales Rep",
        desc: `Sold ${d.vehicleName || d.vehicle_name} to ${d.customerName || d.customer_name} for ₹${(d.sellingPrice || d.selling_price || 0).toLocaleString("en-IN")}`,
        time: d.createdAt ? new Date(d.createdAt).toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A",
        dateLabel: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "Just Now",
        icon: Car,
        color: "text-emerald-600 bg-emerald-50 border-emerald-100",
        timestamp: new Date(d.createdAt || d.date || "").getTime()
      });
    });

    expenses.forEach((e) => {
      const matchVeh = vehicles.find((v) => v.id === e.vehicleId);
      activities.push({
        id: `expense-${e.id}`,
        title: "Operational Expense Logged",
        user: e.createdBy || "Finance Desk",
        desc: `Logged ${e.category} refurbishment cost ₹${Number(e.amount || 0).toLocaleString("en-IN")} for ${matchVeh ? matchVeh.name : "Office Admin"}`,
        time: e.createdAt ? new Date(e.createdAt).toLocaleString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A",
        dateLabel: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : "Just Now",
        icon: Receipt,
        color: "text-rose-600 bg-rose-50 border-rose-100",
        timestamp: new Date(e.createdAt || e.date || "").getTime()
      });
    });

    return activities
      .filter((a) => !isNaN(a.timestamp))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [customers, vehicles, deals, expenses]);

  return (
    <div className="space-y-5 animate-fade-in text-left">
      
      {/* COMPACT BUSINESS OPERATIONS & FINANCIAL DESK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <OutstandingStatCard
          title="Customer Purchase Outstanding"
          totalAmount={customerPurchaseStats.totalAmount}
          paidAmount={customerPurchaseStats.paidAmount}
          outstandingAmount={customerPurchaseStats.outstandingAmount}
          count={customerPurchaseStats.count}
          icon={Receipt}
          color="bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 text-white border-amber-500/20 shadow-sm"
          onClick={() => onNavigate("reports", { reportType: "customer_purchase_outstanding" })}
        />
        <OutstandingStatCard
          title="Customer Sales Outstanding"
          totalAmount={customerSalesStats.totalAmount}
          receivedAmount={customerSalesStats.receivedAmount}
          outstandingAmount={customerSalesStats.outstandingAmount}
          count={customerSalesStats.count}
          icon={TrendingUp}
          color="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white border-emerald-500/20 shadow-sm"
          onClick={() => onNavigate("reports", { reportType: "customer_sales_outstanding" })}
          isSales={true}
        />
        <OutstandingStatCard
          title="Supplier Outstanding"
          totalAmount={supplierPurchaseStats.totalAmount}
          paidAmount={supplierPurchaseStats.paidAmount}
          outstandingAmount={supplierPurchaseStats.outstandingAmount}
          count={supplierPurchaseStats.count}
          icon={ArrowDownCircle}
          color="bg-gradient-to-br from-rose-600 via-red-600 to-pink-700 text-white border-rose-500/20 shadow-sm"
          onClick={() => onNavigate("reports", { reportType: "supplier_outstanding" })}
        />
        <StatCard
          title="Total Customers"
          value={`${customers.filter(c => !c.isDeleted).length} Members`}
          icon={Users}
          color="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white border-blue-500/20 shadow-sm"
          subValue="Active customer accounts"
          onClick={() => onNavigate("customers")}
        />
        <StatCard
          title="Total Purchase Amount"
          value={`₹${(Number(totalPurchaseAmount) || 0).toLocaleString("en-IN")}`}
          icon={ArrowUpCircle}
          color="bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white border-orange-500/20 shadow-sm"
          subValue="Inward procure valuation"
          onClick={() => onNavigate("purchase")}
        />
        <StatCard
          title="Total Sales Amount"
          value={`₹${(Number(totalSalesAmount) || 0).toLocaleString("en-IN")}`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-green-500 via-emerald-600 to-green-700 text-white border-green-500/20 shadow-sm"
          subValue="Gross outward ledger sales"
          onClick={() => onNavigate("sales")}
        />
        <StatCard
          title="Cash In Hand"
          value={`₹${(Number(voucherStats?.cashInHand) || 0).toLocaleString("en-IN")}`}
          icon={Wallet}
          color="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white border-emerald-500/20 shadow-sm"
          subValue="Register register balances"
          trend={{ type: "up", value: "Verified" }}
          onClick={() => onNavigate("accounts")}
        />
        <StatCard
          title="Bank Balance"
          value={`₹${(Number(voucherStats?.bankBalance) || 0).toLocaleString("en-IN")}`}
          icon={Building}
          color="bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 text-white border-indigo-600/20 shadow-sm"
          subValue="Reconciled active accounts"
          trend={{ type: "up", value: "Active Sync" }}
          onClick={() => onNavigate("accounts")}
        />
        <StatCard
          title="Purchase Pending"
          value={`₹${(Number(purchasePendingAmount) || 0).toLocaleString("en-IN")}`}
          icon={ArrowDownCircle}
          color="bg-gradient-to-br from-red-500 via-rose-600 to-red-700 text-white border-red-500/20 shadow-sm"
          subValue="Unpaid vendor outstandings"
          onClick={() => onNavigate("purchase")}
        />
        <StatCard
          title="Sales Pending"
          value={`₹${(Number(salesPendingAmount) || 0).toLocaleString("en-IN")}`}
          icon={Receipt}
          color="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white border-amber-500/20 shadow-sm"
          subValue="Buyer pending collections"
          onClick={() => onNavigate("sales")}
        />
        <StatCard
          title="Loan Pending"
          value={`₹${(Number(totalPendingLoanAmount) || 0).toLocaleString("en-IN")}`}
          icon={FileSpreadsheet}
          color="bg-gradient-to-br from-purple-500 via-purple-600 to-fuchsia-700 text-white border-purple-500/20 shadow-sm"
          subValue="Credit desk outstanding"
          onClick={() => onNavigate("binding")}
        />
        <StatCard
          title="Monthly Profit"
          value={`₹${(Number(voucherStats?.netProfit) || 0).toLocaleString("en-IN")}`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-teal-500 via-cyan-600 to-teal-700 text-white border-teal-500/20 shadow-sm"
          subValue="Current month net index"
          trend={{ type: (voucherStats?.netProfit || 0) >= 0 ? "up" : "down", value: (voucherStats?.netProfit || 0) >= 0 ? "Green Zone" : "Alert" }}
          onClick={() => onNavigate("accounts")}
        />
        <StatCard
          title="Low Stock Alert"
          value={`${lowStockThresholdCount} Models`}
          icon={AlertCircle}
          color="bg-gradient-to-br from-rose-500 via-red-600 to-pink-700 text-white border-red-500/20 shadow-sm"
          subValue={lowestStockDetails ? `${lowestStockDetails.type}: ${lowestStockDetails.brand} ${lowestStockDetails.model} (${lowestStockDetails.availStock} left)` : "All models possess sufficient stock"}
          onClick={() => onNavigate("reports", { reportType: "low_stock" })}
          trend={{ type: "down", value: lowStockThresholdCount > 0 ? "Action Required" : "Secure" }}
        />
        <StatCard
          title="RC Pending"
          value={`${rcPendingCount} Vehicles`}
          icon={FileClock}
          color="bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 text-white border-sky-500/25 shadow-sm"
          subValue="Awaiting smart card registration transfer"
          onClick={() => onNavigate("reports", { reportType: "rc_pending" })}
          trend={{ type: "down", value: rcPendingCount > 0 ? "Registration Pending" : "Up to Date" }}
        />
        <StatCard
          title="NOC Pending"
          value={`${nocPendingCount} Vehicles`}
          icon={FileWarning}
          color="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white border-orange-500/20 shadow-sm"
          subValue="Bank lien clear certificate awaiting upload"
          onClick={() => onNavigate("reports", { reportType: "noc_pending" })}
          trend={{ type: "down", value: nocPendingCount > 0 ? "Clearance Pending" : "Clear" }}
        />
        <StatCard
          title="Insurance Pending"
          value={`${insurancePendingCount} Vehicles`}
          icon={ShieldAlert}
          color="bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 text-white border-purple-500/20 shadow-sm"
          subValue="Vehicle insurance policy renewal outstanding"
          onClick={() => onNavigate("reports", { reportType: "insurance_pending" })}
          trend={{ type: "down", value: insurancePendingCount > 0 ? "Renewal Required" : "Protected" }}
        />
      </div>

      {/* CHARTS GRAPH & LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Graph Display */}
        <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <div className="text-left">
              <h3 className="text-sm font-extrabold text-slate-950">Dynamic Automotive Analytics</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consolidated metrics trend</p>
            </div>
            
            {/* Elegant Mode Switches */}
            <div className="flex flex-wrap gap-0.5 bg-slate-50 border border-slate-200 p-0.5 rounded-lg self-start sm:self-center">
              {[
                { id: "sales", label: "Gross Sales" },
                { id: "purchases", label: "Sourcing Cost" },
                { id: "expenses", label: "Expenses" },
                { id: "profit_trend", label: "Profitability" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartMode(tab.id)}
                  type="button"
                  className={cn(
                    "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer",
                    chartMode === tab.id
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200/40"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartMode === "profit_trend" ? "#10b981" : chartMode === "expenses" ? "#ef4444" : "#4f46e5"} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={chartMode === "profit_trend" ? "#10b981" : chartMode === "expenses" ? "#ef4444" : "#4f46e5"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 9, fontWeight: 800 }} dy={5} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#64748b", fontSize: 9, fontWeight: 800 }} 
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => [`₹${(value || 0).toLocaleString("en-IN")}`, activeChartLabel]}
                  contentStyle={{ backgroundColor: "#0f172a", color: "#fff", borderRadius: "8px", border: "0", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.15)", fontSize: "10px", fontWeight: "bold" }}
                />
                <Area 
                  type="monotone" 
                  dataKey={activeChartValue} 
                  stroke={chartMode === "profit_trend" ? "#10b981" : chartMode === "expenses" ? "#ef4444" : "#4f46e5"} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
 
        {/* Recent Operations log */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-950 mb-3.5 text-left">Recent Systems Log</h3>
            <div className="space-y-2.5 max-h-[175px] overflow-y-auto pr-1">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex gap-2.5 text-left border-b border-dashed border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className={cn("mt-0.5 p-1.5 rounded bg-opacity-15 h-fit border shadow-xxs", item.color)}>
                    <item.icon size={11} className="stroke-[2.5]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[10px] font-extrabold text-slate-800 leading-tight truncate">{item.title}</p>
                      <span className="text-[8px] font-bold text-slate-400 shrink-0 font-mono tracking-tighter">{item.time}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 mt-0.5 leading-tight break-words">{item.desc}</p>
                    <p className="text-[8px] mt-0.5 font-mono font-extrabold text-slate-400 flex items-center justify-between">
                      <span>Log Desk: {item.user}</span>
                      <span className="bg-slate-50 border border-slate-100 px-1 py-0.2 rounded text-slate-500 leading-none">{item.dateLabel}</span>
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-8">No system activity log entries registered today</p>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={() => onNavigate("reports")}
            className="w-full mt-3 py-2 text-[9px] font-black uppercase tracking-widest text-indigo-700 hover:bg-slate-50 rounded-lg transition-all border border-slate-200 cursor-pointer"
          >
            Audit System Logs
          </button>
        </div>
      </div>

      {/* STOCK ALERT DETAILS SCREEN POPUP */}
      {showStockAlertModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            onClick={() => setShowStockAlertModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
          />

          {/* Modal Container */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden text-left font-sans">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between border-b border-rose-950">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-rose-300">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Stock Alert Desk & Inventory Report</h3>
                  <p className="text-[10px] text-rose-200 font-semibold uppercase tracking-wider">Automotive ERP Real-Time Auditing</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStockAlertModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-rose-200 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter Section */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-wrap items-center gap-3.5">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
                  <SlidersHorizontal size={13} />
                  <span>Filters:</span>
                </div>

                {/* Branch Choice Filter */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-slate-400 mb-1 leading-none">Branch</span>
                  <select
                    value={stockBranchFilter}
                    onChange={(e) => setStockBranchFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="all">All Branches</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Erode">Erode</option>
                    <option value="Salem">Salem</option>
                  </select>
                </div>

                {/* Vehicle Type Choice */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-slate-400 mb-1 leading-none">Vehicle Type</span>
                  <select
                    value={stockTypeFilter}
                    onChange={(e) => setStockTypeFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    <option value="Four Wheeler">Four Wheeler</option>
                    <option value="Two Wheeler">Two Wheeler</option>
                  </select>
                </div>

                {/* Brand Name choice filter */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase text-slate-400 mb-1 leading-none">Brand Name</span>
                  <select
                    value={stockBrandFilter}
                    onChange={(e) => setStockBrandFilter(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                  >
                    <option value="all">All Brands</option>
                    {Array.from(new Set(stockReports.map(r => r.brand))).filter(b => b && b !== "Other").map(bName => (
                      <option key={bName} value={bName}>{bName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* CSV Export Button & Status */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const csvRows = [];
                    csvRows.push(["Vehicle Type", "Brand", "Model", "Branch", "Current Stock", "Status"].join(","));
                    filteredStockReports.forEach(r => {
                      const statusText = r.availStock === 0 ? "Out of Stock" : r.availStock <= 3 ? "Low Stock Warning" : "Sufficient";
                      csvRows.push([
                        `"${r.vehicleType}"`,
                        `"${r.brand}"`,
                        `"${r.model}"`,
                        `"${r.branch}"`,
                        r.availStock,
                        `"${statusText}"`
                      ].join(","));
                    });
                    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `stock_alert_report_${new Date().toISOString().split("T")[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Scrolling Stock table */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/45">
              <div className="bg-white rounded-xl border border-slate-250 overflow-hidden shadow-xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-left">
                      <th className="p-3.5">Vehicle Type</th>
                      <th className="p-3.5">Brand</th>
                      <th className="p-3.5">Model / Make Details</th>
                      <th className="p-3.5">Branch Office</th>
                      <th className="p-3.5 text-center">Current Stock</th>
                      <th className="p-3.5">Status Alert State</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStockReports.map((item, idx) => {
                      const isLow = item.availStock <= 3;
                      const isOut = item.availStock === 0;

                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-semibold text-slate-500">{item.vehicleType}</td>
                          <td className="p-3.5 font-bold text-slate-900">{item.brand}</td>
                          <td className="p-3.5 font-semibold text-slate-700">{item.model}</td>
                          <td className="p-3.5 font-mono text-slate-500">{item.branch}</td>
                          <td className="p-3.5 text-center">
                            <span className={cn(
                              "font-bold font-mono text-sm",
                              isLow ? "text-rose-600" : "text-emerald-600"
                            )}>
                              {item.availStock} Available
                            </span>
                          </td>
                          <td className="p-3.5">
                            {isOut ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                Out of Stock
                              </span>
                            ) : isLow ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-850 border border-amber-200">
                                Low Stock Warning
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Sufficient
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setShowStockAlertModal(false);
                                onNavigate("purchase", { search: item.model });
                              }}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] tracking-wide rounded uppercase cursor-pointer"
                            >
                              Source Stock
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredStockReports.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-16 text-slate-400">
                          <AlertCircle size={24} className="mx-auto mb-2 text-slate-350 stroke-[1.5]" />
                          <p className="font-bold text-slate-700 text-sm">No inventory records match filters</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Adjust branch or type choices to look for stock alerts.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span>Auto360 Fleet Stock Auditor Desk © 2026</span>
              <span className="font-mono bg-white border px-2.5 py-0.5 rounded text-[10.5px] font-bold text-slate-500">Live Engine Connected</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
