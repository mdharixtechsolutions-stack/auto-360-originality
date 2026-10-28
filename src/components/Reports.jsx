import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  FileText,
  TrendingUp,
  Users,
  Car,
  IndianRupee,
  FileCheck,
  ShieldAlert,
  Building,
  MapPin,
  Printer,
  CreditCard,
  Clock,
  AlertCircle,
  MessageCircle,
  AlertTriangle as Warning
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { calculateVehiclePurchaseOutstanding, calculateDealSalesOutstanding } from "../lib/outstandingCalculator";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
export default function Reports({
  vehicles = [],
  deals = [],
  brands = [],
  customers = [],
  expenses = [],
  branches = [],
  vouchers = [],
  payments = [],
  suppliers: propSuppliers = [],
  initialReport,
  onNavigate,
  currentUser,
  selectedBranch = "all"
}) {
  const [activeReport, setActiveReport] = useState(initialReport || "sales");
  
  const [selectedPreset, setSelectedPreset] = useState("custom");

  // DATE FILTER IMPROVEMENT - Default to financial year, fallback to standard range
  const [localFrom, setLocalFrom] = useState(() => {
    return localStorage.getItem("financialYearFrom") || "2025-04-01";
  });
  const [localTo, setLocalTo] = useState(() => {
    return localStorage.getItem("financialYearTo") || "2026-03-31";
  });

  const [dateRange, setDateRange] = useState({
    from: localStorage.getItem("financialYearFrom") || "2025-04-01",
    to: localStorage.getItem("financialYearTo") || "2026-03-31"
  });

  const handlePresetClick = (presetId) => {
    setSelectedPreset(presetId);
    if (presetId === "custom") return;

    const today = new Date();
    let from = new Date();
    let to = new Date();

    switch (presetId) {
      case "today":
        from = today;
        to = today;
        break;
      case "yesterday": {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        from = yesterday;
        to = yesterday;
        break;
      }
      case "thisWeek": {
        const currentDay = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay);
        from = startOfWeek;
        to = new Date();
        break;
      }
      case "lastWeek": {
        const currentDay = today.getDay();
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - currentDay - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        from = startOfLastWeek;
        to = endOfLastWeek;
        break;
      }
      case "thisMonth":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today.getFullYear(), 11, 31);
        break;
    }

    const fromStr = from.toISOString().split("T")[0];
    const toStr = to.toISOString().split("T")[0];
    setLocalFrom(fromStr);
    setLocalTo(toStr);
    setDateRange({ from: fromStr, to: toStr });
  };

  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("all");
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState("all");
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [custSortField, setCustSortField] = useState("invoiceDate");
  const [custSortOrder, setCustSortOrder] = useState("desc");
  const [suppSortField, setSuppSortField] = useState("purchaseDate");
  const [suppSortOrder, setSuppSortOrder] = useState("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [transferStatusFilter, setTransferStatusFilter] = useState("All");

  const brandTypes = {
    "TVS": "Two Wheeler",
    "Hero": "Two Wheeler",
    "Honda": "Two Wheeler",
    "Yamaha": "Two Wheeler",
    "Bajaj": "Two Wheeler",
    "Ather": "Two Wheeler",
    "Ola Electric": "Two Wheeler",
    "Maruti Suzuki": "Four Wheeler",
    "Hyundai": "Four Wheeler",
    "Tata Motors": "Four Wheeler",
    "Toyota": "Four Wheeler",
    "MG": "Four Wheeler",
    "Piaggio": "Three Wheeler",
    "Mahindra": "Commercial",
    "Ashok Leyland": "Commercial"
  };

  const filteredBrandsList = useMemo(() => {
    const activeBrands = brands.filter((b) => !b.isDeleted);
    if (vehicleTypeFilter === "All") return activeBrands;
    return activeBrands.filter((b) => {
      const mappedType = brandTypes[b.name];
      if (mappedType) return mappedType === vehicleTypeFilter;
      return vehicles.some((v) => v.brand === b.name && v.vehicleType === vehicleTypeFilter);
    });
  }, [brands, vehicleTypeFilter, vehicles]);

  const handleVehicleTypeChange = (newType) => {
    setVehicleTypeFilter(newType);
    setBrandFilter("All");
  };

  const [loans, setLoans] = useState([]);
  const [fetchedSuppliers, setFetchedSuppliers] = useState([]);
  const suppliers = fetchedSuppliers.length > 0 ? fetchedSuppliers : propSuppliers;
  const [loginReports, setLoginReports] = useState([]);

  useEffect(() => {
    if (initialReport) {
      setActiveReport(initialReport);
    }
  }, [initialReport]);
  useEffect(() => {
    if (currentUser?.role === "Branch Admin") {
      setSelectedBranchFilter(currentUser.branch || "Salem");
    } else if (selectedBranch && selectedBranch !== "all") {
      setSelectedBranchFilter(selectedBranch);
    } else if (selectedBranch === "all") {
      setSelectedBranchFilter("all");
    }
  }, [currentUser, selectedBranch]);
  useEffect(() => {
    fetch("/api/loans").then((r) => r.json()).then((data) => setLoans(data || [])).catch(console.error);
    
    // Fetch both cities and suppliers to map correctly
    Promise.all([
      fetch("/api/cities").then((r) => r.json()).catch(() => []),
      fetch("/api/suppliers?limit=1000").then((r) => r.json()).catch(() => ({ data: [] }))
    ]).then(([citiesData = [], suppliersRes = {}]) => {
      const suppliersList = Array.isArray(suppliersRes.data) ? suppliersRes.data : [];
      const mapped = suppliersList.map((item) => {
        const cityObj = citiesData.find((c) => c.id === item.city_id);
        return {
          id: item.supplier_id,
          name: item.supplier_name,
          mobile: item.supplier_mobile,
          address: item.address,
          city: cityObj ? cityObj.name : "",
          branch: item.branch || "Salem",
          isDeleted: false,
          createdAt: item.created_at
        };
      });
      setFetchedSuppliers(mapped);
    }).catch((err) => {
      console.error(err);
      setFetchedSuppliers([]);
    });

    fetch("/api/reports/login-history").then((r) => r.json()).then((data) => setLoginReports(data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeReport === "login_report") {
      fetch("/api/reports/login-history")
        .then((r) => r.json())
        .then((data) => setLoginReports(data || []))
        .catch(console.error);
    }
  }, [activeReport]);
  const reportOptions = [
    { id: "customer_purchase_outstanding", label: "Customer Purchase Outstanding Report", icon: Clock, color: "text-amber-600 font-extrabold", bg: "bg-amber-50" },
    { id: "customer_sales_outstanding", label: "Customer Sales Outstanding Report", icon: Clock, color: "text-emerald-600 font-extrabold", bg: "bg-emerald-50" },
    { id: "supplier_outstanding", label: "Supplier Outstanding Report", icon: Clock, color: "text-orange-600 font-extrabold", bg: "bg-orange-50" },
    { id: "finance_settlement", label: "Finance Settlement Report", icon: Building, color: "text-purple-600 font-extrabold", bg: "bg-purple-50" },
    { id: "consultancy_fees", label: "Consultancy Fees Report", icon: IndianRupee, color: "text-indigo-600 font-extrabold", bg: "bg-indigo-50" },
    { id: "sales", label: "Sales Report", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "purchase", label: "Purchase Report", icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "customer", label: "Customer Report", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { id: "expense", label: "Expense Report", icon: IndianRupee, color: "text-rose-600", bg: "bg-rose-50" },
    { id: "inventory", label: "Inventory Report", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { id: "rc_pending", label: "RC Pending", icon: FileCheck, color: "text-sky-600", bg: "bg-sky-50" },
    { id: "noc_pending", label: "NOC Pending", icon: Warning, color: "text-rose-600", bg: "bg-rose-50" },
    { id: "insurance_pending", label: "Insurance Pending", icon: ShieldAlert, color: "text-orange-600", bg: "bg-orange-50" },
    { id: "low_stock", label: "Low Stock Alert", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { id: "binding_loan", label: "Binding Loan Report", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
    { id: "login_report", label: "Login Report", icon: Clock, color: "text-amber-700", bg: "bg-amber-50" },
    { id: "supplier", label: "Supplier Report", icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { id: "area_stock", label: "Area Wise Stock", icon: MapPin, color: "text-emerald-700", bg: "bg-emerald-50" },
    { id: "branch_stock", label: "Branch Wise Stock", icon: Building, color: "text-indigo-700", bg: "bg-indigo-100" },
    { id: "branch_sales", label: "Branch Wise Sales", icon: TrendingUp, color: "text-violet-700", bg: "bg-violet-50" },
    { id: "branch_purchase", label: "Branch Wise Purchase", icon: Car, color: "text-orange-700", bg: "bg-orange-50" }
  ];
  const allowedReports = reportOptions.filter((opt) => {
    if (!currentUser) return true;
    const role = currentUser.role;
    if (role === "Super Admin" || role === "Admin" || role === "Branch Admin") return true;
    if (role === "Manager") {
      return [
        "customer_purchase_outstanding",
        "customer_sales_outstanding",
        "supplier_outstanding",
        "finance_settlement",
        "sales",
        "purchase",
        "customer",
        "expense",
        "inventory",
        "rc_pending",
        "noc_pending",
        "insurance_pending",
        "low_stock",
        "area_stock"
      ].includes(opt.id);
    }
    if (role === "Staff" || role === "Sales") {
      return ["customer_purchase_outstanding", "customer_sales_outstanding", "supplier_outstanding", "finance_settlement", "sales", "customer", "inventory"].includes(opt.id);
    }
    return false;
  });
  useEffect(() => {
    const allowedIds = allowedReports.map((r) => r.id);
    if (!allowedIds.includes(activeReport) && allowedIds.length > 0) {
      setActiveReport(allowedIds[0]);
    }
  }, [currentUser, activeReport, allowedReports]);
  const matchesBranch = (branchStr) => {
    if (selectedBranchFilter === "all") return true;
    if (!branchStr) return false;
    return branchStr.toLowerCase() === selectedBranchFilter.toLowerCase();
  };
  
  const uniqueUsersList = useMemo(() => {
    return Array.from(new Set(loginReports.map((r) => r.username))).filter(Boolean);
  }, [loginReports]);

  const getFilteredLoginReports = () => {
    return loginReports.filter((r) => {
      // Branch filter
      const brName = r.branch_id || r.branch;
      if (!matchesBranch(brName)) return false;
      // User filter
      if (selectedUserFilter !== "all" && r.username !== selectedUserFilter) return false;
      // Date filter (r.login_date or r.loginDate is "YYYY-MM-DD" or similar)
      const dateStr = r.login_date || r.loginDate || "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const userMatch = r.username?.toLowerCase().includes(query);
        const roleMatch = r.role?.toLowerCase().includes(query);
        const ipMatch = (r.ip_address || r.ipAddress)?.toLowerCase().includes(query);
        const statusMatch = r.status?.toLowerCase().includes(query);
        const brMatch = brName?.toLowerCase().includes(query);
        if (!userMatch && !roleMatch && !ipMatch && !statusMatch && !brMatch) return false;
      }
      return true;
    });
  };
  const getFilteredDeals = () => {
    return deals.filter((d) => {
      if (d.type !== "Sell" || d.isDeleted) return false;
      if (!matchesBranch(d.branch)) return false;
      const vehicle = vehicles.find((v) => v.id === d.vehicleId);
      if (vehicleTypeFilter !== "All" && vehicle?.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && vehicle?.brand !== brandFilter) return false;
      if (d.date < dateRange.from || d.date > dateRange.to) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerMatch = d.customerName?.toLowerCase().includes(query);
        const vehicleMatch = d.vehicleName?.toLowerCase().includes(query);
        const invMatch = d.id?.toLowerCase().includes(query);
        if (!customerMatch && !vehicleMatch && !invMatch) return false;
      }
      return true;
    });
  };
  const getFilteredPurchases = () => {
    return vehicles.filter((v) => {
      if (v.isDeleted) return false;
      if (!matchesBranch(v.branch)) return false;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && v.brand !== brandFilter) return false;
      if (transferStatusFilter !== "All") {
        const isTransferred = (v.transfer_status === "Yes" || v.transferStatus === "Yes") ? "Yes" : "No";
        if (isTransferred !== transferStatusFilter) return false;
      }
      const dateStr = v.createdAt ? new Date(v.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = v.name?.toLowerCase().includes(query);
        const regMatch = v.regNo?.toLowerCase().includes(query);
        const sellerMatch = v.sellerName?.toLowerCase().includes(query) || v.ownerDetails?.toLowerCase().includes(query);
        if (!nameMatch && !regMatch && !sellerMatch) return false;
      }
      return true;
    });
  };
  const getFilteredCustomers = () => {
    return customers.filter((c) => {
      if (c.isDeleted) return false;
      if (c.branch && !matchesBranch(c.branch)) return false;
      const dateStr = c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return c.name?.toLowerCase().includes(query) || c.mobile?.includes(query) || c.address?.toLowerCase().includes(query);
      }
      return true;
    });
  };
  const getFilteredExpenses = () => {
    return expenses.filter((e) => {
      if (e.isDeleted) return false;
      const subVehicle = vehicles.find((v) => v.id === e.vehicleId);
      if (selectedBranchFilter !== "all") {
        if (subVehicle && !matchesBranch(subVehicle.branch)) return false;
      }
      if (vehicleTypeFilter !== "All" && subVehicle?.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && subVehicle?.brand !== brandFilter) return false;
      if (e.date < dateRange.from || e.date > dateRange.to) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return e.category?.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query) || e.amount.toString().includes(query);
      }
      return true;
    });
  };
  const getFilteredBalancePending = () => {
    return deals.filter((d) => {
      if (d.type !== "Sell" || d.isDeleted || d.balanceAmount <= 0) return false;
      if (!matchesBranch(d.branch)) return false;
      const vehicle = vehicles.find((v) => v.id === d.vehicleId);
      if (vehicleTypeFilter !== "All" && vehicle?.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && vehicle?.brand !== brandFilter) return false;
      if (d.date < dateRange.from || d.date > dateRange.to) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerMatch = d.customerName?.toLowerCase().includes(query);
        const vehicleMatch = d.vehicleName?.toLowerCase().includes(query);
        if (!customerMatch && !vehicleMatch) return false;
      }
      return true;
    });
  };
  const getFilteredRCPending = () => {
    return vehicles.filter((v) => {
      if (v.isDeleted || v.rcType === "Card") return false;
      if (!matchesBranch(v.branch)) return false;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && v.brand !== brandFilter) return false;
      const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
      const dateStr = v.createdAt ? new Date(v.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = v.name?.toLowerCase().includes(query);
        const regMatch = v.regNo?.toLowerCase().includes(query);
        const customerMatch = matchedDeal?.customerName?.toLowerCase().includes(query);
        if (!nameMatch && !regMatch && !customerMatch) return false;
      }
      return true;
    });
  };
  const getFilteredInsurancePending = () => {
    return vehicles.filter((v) => {
      if (v.isDeleted || (v.insurance && v.insurance.hasInsurance)) return false;
      if (!matchesBranch(v.branch)) return false;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && v.brand !== brandFilter) return false;
      const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
      const dateStr = v.createdAt ? new Date(v.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = v.name?.toLowerCase().includes(query);
        const regMatch = v.regNo?.toLowerCase().includes(query);
        const customerMatch = matchedDeal?.customerName?.toLowerCase().includes(query);
        if (!nameMatch && !regMatch && !customerMatch) return false;
      }
      return true;
    });
  };
  const getFilteredLowStock = () => {
    const groupings = {};
    vehicles.forEach((v) => {
      if (v.isDeleted) return;
      
      let brandName = "Other";
      if (v.brand_id) {
        const foundB = brands.find(b => b.id === v.brand_id || b.name === v.brand_id);
        if (foundB) brandName = foundB.name;
        else brandName = v.brand_id;
      } else if (v.brand) {
        brandName = v.brand;
      }

      let modelName = v.model_details || v.name || "General";
      const type = v.vehicleType || v.vehicle_type || "Four Wheeler";
      const branchName = v.branch || "Tiruppur";

      // Apply branch filter
      if (!matchesBranch(branchName)) return;
      // Apply vehicle type filter
      if (vehicleTypeFilter !== "All" && type !== vehicleTypeFilter) return;
      // Apply brand filter
      if (brandFilter !== "All" && brandName !== brandFilter) return;

      const dateStr = v.createdAt ? new Date(v.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return;

      const key = `${type}::${brandName}::${modelName}::${branchName}`;
      if (!groupings[key]) {
        groupings[key] = {
          vehicleType: type,
          brand: brandName,
          model: modelName,
          branch: branchName,
          availStock: 0,
          totalStock: 0,
        };
      }

      groupings[key].totalStock += 1;
      if (v.status !== "Sold" && v.vehicle_status !== "Sold" && !v.isSold) {
        groupings[key].availStock += 1;
      }
    });

    return Object.values(groupings).filter((g) => {
      if (g.availStock > 3) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return g.model.toLowerCase().includes(q) || g.brand.toLowerCase().includes(q);
      }
      return true;
    });
  };
  const getFilteredNOCPending = () => {
    return vehicles.filter((v) => {
      if (v.isDeleted || (v.noc && v.noc.hasNoc)) return false;
      if (!matchesBranch(v.branch)) return false;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && v.brand !== brandFilter) return false;
      const dateStr = v.createdAt ? new Date(v.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = v.name?.toLowerCase().includes(query);
        const regMatch = v.regNo?.toLowerCase().includes(query);
        if (!nameMatch && !regMatch) return false;
      }
      return true;
    });
  };
  const getFilteredLoans = () => {
    return loans.filter((l) => {
      if (l.isDeleted) return false;
      if (l.branch && !matchesBranch(l.branch)) return false;
      const dateStr = l.loanDate || "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const customerMatch = l.customerName?.toLowerCase().includes(query);
        const vehicleMatch = l.vehicleDetails?.toLowerCase().includes(query);
        const providerMatch = l.financeName?.toLowerCase().includes(query);
        if (!customerMatch && !vehicleMatch && !providerMatch) return false;
      }
      return true;
    });
  };
  const getFilteredSuppliers = () => {
    return suppliers.filter((s) => {
      if (s.isDeleted) return false;
      if (s.branch && !matchesBranch(s.branch)) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = s.name?.toLowerCase().includes(query);
        const mobMatch = s.mobile?.includes(query);
        const cityMatch = s.city?.toLowerCase().includes(query) || s.address?.toLowerCase().includes(query);
        if (!nameMatch && !mobMatch && !cityMatch) return false;
      }
      return true;
    });
  };

  const getFilteredCustomerOutstanding = () => {
    let report = (deals || []).filter(deal => {
      if (deal.type !== "Sell" || deal.isDeleted) return false;
      if (!matchesBranch(deal.branch)) return false;

      const matchedVeh = vehicles.find(v => v.id === deal.vehicleId || v.purchase_id === deal.vehicleId);
      if (vehicleTypeFilter !== "All" && matchedVeh?.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && matchedVeh?.brand !== brandFilter) return false;

      return true;
    }).map(deal => {
      const stats = calculateDealSalesOutstanding(deal, payments, vouchers);
      const totalAmount = stats.totalSaleValue;
      const amountReceived = stats.totalReceived;
      const outstandingAmount = stats.outstanding;
      const statusVal = stats.status;
      const settlementType = deal.settlementType || (stats.outstanding === 0 ? "Fully Paid" : "Customer Balance Pending");

      const matchCust = (customers || []).find(c => c.id === deal.customerId || c.name === deal.customerName);
      const matchVeh = (vehicles || []).find(v => v.id === deal.vehicleId || v.purchase_id === deal.vehicleId);

      const customerName = deal.customerName || matchCust?.name || "Unknown Customer";
      const mobile = matchCust?.mobile || deal.mobile || deal.customerMobile || "N/A";
      const vehicleNumber = matchVeh?.regNo || matchVeh?.reg_no || deal.vehicleName || "N/A";
      const invoiceNumber = deal.invoiceNo || deal.invoiceNumber || `INV-${(deal.id || "").toString().substring(0, 8).toUpperCase()}`;
      const invoiceDate = deal.date || (deal.createdAt ? new Date(deal.createdAt).toISOString().split("T")[0] : "");

      let dueDate = deal.dueDate || deal.due_date;
      if (!dueDate && invoiceDate) {
        const d = new Date(invoiceDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          dueDate = d.toISOString().split("T")[0];
        }
      }
      dueDate = dueDate || invoiceDate || "N/A";

      let overdueDays = 0;
      if (dueDate && dueDate !== "N/A") {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        if (!isNaN(due.getTime()) && today > due && outstandingAmount > 0) {
          overdueDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: deal.id,
        customerName,
        mobile,
        vehicleNumber,
        invoiceNumber,
        invoiceDate,
        totalInvoiceAmount: totalAmount,
        advancePaid: stats.advanceAmount || 0,
        amountReceived,
        outstandingAmount,
        settlementType,
        financeName: deal.financeName || "",
        financeRef: deal.financeRef || "",
        dueDate,
        overdueDays,
        status: statusVal,
        branch: deal.branch || "Tiruppur",
        customerId: deal.customerId,
        vehicleId: deal.vehicleId
      };
    });

    if (dateRange.from) report = report.filter(r => r.invoiceDate >= dateRange.from);
    if (dateRange.to) report = report.filter(r => r.invoiceDate <= dateRange.to);

    if (selectedCustomerFilter && selectedCustomerFilter !== "all") {
      report = report.filter(r => r.customerName.toLowerCase().includes(selectedCustomerFilter.toLowerCase()) || r.customerId === selectedCustomerFilter);
    }
    if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
      report = report.filter(r => r.vehicleNumber.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || r.vehicleId === selectedVehicleFilter);
    }
    if (selectedStatusFilter && selectedStatusFilter !== "all") {
      report = report.filter(r => r.status.toLowerCase() === selectedStatusFilter.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      report = report.filter(r =>
        r.customerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.invoiceNumber.toLowerCase().includes(q)
      );
    }

    if (custSortField) {
      report.sort((a, b) => {
        let valA = a[custSortField];
        let valB = b[custSortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return custSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return custSortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return report;
  };

  const getFilteredFinanceSettlement = () => {
    let report = (deals || []).filter(deal => {
      if (deal.type !== "Sell" || deal.isDeleted) return false;
      if (!matchesBranch(deal.branch)) return false;

      const settlementType = deal.settlementType || (deal.balanceAmount === 0 ? "Fully Paid" : "Customer Balance Pending");
      if (settlementType !== "Settled by Finance" && !deal.financeName) return false;

      const matchedVeh = vehicles.find(v => v.id === deal.vehicleId || v.purchase_id === deal.vehicleId);
      if (vehicleTypeFilter !== "All" && matchedVeh?.vehicleType !== vehicleTypeFilter) return false;
      if (brandFilter !== "All" && matchedVeh?.brand !== brandFilter) return false;

      return true;
    }).map(deal => {
      const totalAmount = Number(deal.totalPrice) || (Number(deal.sellingPrice || 0) + Number(deal.consultancyFees || 0));
      const advanceReceived = Number(deal.advanceAmount) || 0;
      const financeAmount = Math.max(0, totalAmount - advanceReceived);

      const vRec = (vouchers || []).filter(v => !v.isDeleted && v.vehicleId === deal.vehicleId && v.type === "Receipt" && (v.ledger || "").toLowerCase().includes("finance")).reduce((sum, v) => sum + (Number(v.amount) || 0), 0);
      const disbursedAmount = Math.min(financeAmount, vRec);
      const pendingDisbursement = Math.max(0, financeAmount - disbursedAmount);

      const matchCust = (customers || []).find(c => c.id === deal.customerId || c.name === deal.customerName);
      const matchVeh = (vehicles || []).find(v => v.id === deal.vehicleId || v.purchase_id === deal.vehicleId);

      const customerName = deal.customerName || matchCust?.name || "Unknown Customer";
      const mobile = matchCust?.mobile || deal.mobile || deal.customerMobile || "N/A";
      const vehicleNumber = matchVeh?.regNo || matchVeh?.reg_no || deal.vehicleName || "N/A";
      const invoiceDate = deal.date || (deal.createdAt ? new Date(deal.createdAt).toISOString().split("T")[0] : "");
      const financeName = deal.financeName || "Finance Company";
      const financeRef = deal.financeRef || "FIN-" + (deal.id || "").toString().substring(0,6).toUpperCase();

      let status = "Full Disbursement";
      if (pendingDisbursement > 0) {
        status = disbursedAmount > 0 ? "Partial Disbursement" : "Pending Disbursement";
      }

      return {
        id: deal.id,
        customerName,
        mobile,
        vehicleNumber,
        financeName,
        financeRef,
        invoiceDate,
        totalAmount,
        advanceReceived,
        financeAmount,
        disbursedAmount,
        pendingDisbursement,
        status,
        branch: deal.branch || "Tiruppur",
        customerId: deal.customerId,
        vehicleId: deal.vehicleId
      };
    });

    if (dateRange.from) report = report.filter(r => r.invoiceDate >= dateRange.from);
    if (dateRange.to) report = report.filter(r => r.invoiceDate <= dateRange.to);

    if (selectedCustomerFilter && selectedCustomerFilter !== "all") {
      report = report.filter(r => r.customerName.toLowerCase().includes(selectedCustomerFilter.toLowerCase()) || r.customerId === selectedCustomerFilter);
    }
    if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
      report = report.filter(r => r.vehicleNumber.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || r.vehicleId === selectedVehicleFilter);
    }
    if (selectedStatusFilter && selectedStatusFilter !== "all") {
      report = report.filter(r => r.status.toLowerCase().includes(selectedStatusFilter.toLowerCase()));
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      report = report.filter(r =>
        r.customerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.financeName.toLowerCase().includes(q) ||
        r.financeRef.toLowerCase().includes(q)
      );
    }

    return report;
  };

  const getFilteredSupplierOutstanding = () => {
    const suppList = suppliers || [];
    let report = (vehicles || []).filter(v => !v.isDeleted && v.sellerType !== "Customer" && v.purchase_type !== "Customer").map(p => {
      const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
      const totalAmount = stats.purchasePrice;
      const basePaid = stats.advancePaid;
      const amountPaid = stats.totalPaidSoFar;
      const outstandingAmount = stats.outstanding;

      const matchSupp = suppList.find(s => s.id === p.supplier_id || s.name === p.sellerName);

      const supplierName = p.sellerName || p.supplier_name || matchSupp?.name || "Direct Supplier";
      const mobile = p.sellerMobile || p.mobile || matchSupp?.mobile || "N/A";
      const vehicleNumber = p.regNo || p.reg_no || `${p.brand || ''} ${p.name || ''}`.trim() || "N/A";
      const purchaseInvoiceNumber = p.invoiceNo || p.invoiceNumber || `PRC-${(p.purchase_id || p.id || "").toString().substring(0, 8).toUpperCase()}`;
      const purchaseDate = p.purchaseDate || (p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "");

      let dueDate = p.dueDate || p.due_date;
      if (!dueDate && purchaseDate) {
        const d = new Date(purchaseDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          dueDate = d.toISOString().split("T")[0];
        }
      }
      dueDate = dueDate || purchaseDate || "N/A";

      let overdueDays = 0;
      if (dueDate && dueDate !== "N/A") {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        if (!isNaN(due.getTime()) && today > due && outstandingAmount > 0) {
          overdueDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: p.purchase_id || p.id,
        supplierName,
        mobile,
        vehicleNumber,
        purchaseInvoiceNumber,
        purchaseDate,
        totalPurchaseAmount: totalAmount,
        advancePaid: basePaid,
        amountPaid: stats.totalPaidSoFar,
        totalPaidSoFar: stats.totalPaidSoFar,
        outstandingAmount,
        lastPaymentDate: stats.lastPaymentDate,
        dueDate,
        overdueDays,
        status: stats.status,
        branch: p.branch || "Tiruppur",
        supplierId: p.supplier_id,
        vehicleId: p.purchase_id || p.id
      };
    });

    if (dateRange.from) report = report.filter(r => r.purchaseDate >= dateRange.from);
    if (dateRange.to) report = report.filter(r => r.purchaseDate <= dateRange.to);

    if (selectedSupplierFilter && selectedSupplierFilter !== "all") {
      report = report.filter(r => r.supplierName.toLowerCase().includes(selectedSupplierFilter.toLowerCase()) || r.supplierId === selectedSupplierFilter);
    }
    if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
      report = report.filter(r => r.vehicleNumber.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || r.vehicleId === selectedVehicleFilter);
    }
    if (selectedStatusFilter && selectedStatusFilter !== "all") {
      report = report.filter(r => r.status.toLowerCase() === selectedStatusFilter.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      report = report.filter(r =>
        r.supplierName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.purchaseInvoiceNumber.toLowerCase().includes(q)
      );
    }

    if (suppSortField) {
      report.sort((a, b) => {
        let valA = a[suppSortField];
        let valB = b[suppSortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return suppSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return suppSortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return report;
  };

  const getFilteredCustomerPurchaseOutstanding = () => {
    const custs = customers || [];
    let report = (vehicles || []).filter(p => !p.isDeleted && (p.sellerType === "Customer" || p.purchase_type === "Customer")).map(p => {
      const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
      const totalAmount = stats.purchasePrice;
      const basePaid = stats.advancePaid;
      const amountPaid = stats.totalPaidSoFar;
      const outstandingAmount = stats.outstanding;

      const matchCust = custs.find(c => c.id === p.sellerId || c.name === p.sellerName || c.id === p.seller_id);

      const rawName = p.sellerName || matchCust?.name || "Direct Customer";
      const partyRole = (matchCust?.requirement === "Buy" || matchCust?.customer_type === "Buy") ? "Buyer" : "Seller";
      const customerName = rawName.includes("(Buyer)") || rawName.includes("(Seller)") ? rawName : `${rawName} (${partyRole})`;
      const mobile = p.sellerMobile || p.mobile || matchCust?.mobile || "N/A";
      const vehicleNumber = p.regNo || p.reg_no || `${p.brand || ''} ${p.name || ''}`.trim() || "N/A";
      const purchaseInvoiceNumber = p.invoiceNo || p.invoiceNumber || `PRC-${(p.purchase_id || p.id || "").toString().substring(0, 8).toUpperCase()}`;
      const purchaseDate = p.purchaseDate || (p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : "");

      let dueDate = p.dueDate || p.due_date;
      if (!dueDate && purchaseDate) {
        const d = new Date(purchaseDate);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 30);
          dueDate = d.toISOString().split("T")[0];
        }
      }
      dueDate = dueDate || purchaseDate || "N/A";

      let overdueDays = 0;
      if (dueDate && dueDate !== "N/A") {
        const due = new Date(dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);
        due.setHours(0,0,0,0);
        if (!isNaN(due.getTime()) && today > due && outstandingAmount > 0) {
          overdueDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        }
      }

      return {
        id: p.purchase_id || p.id,
        customerName,
        partyRole,
        mobile,
        vehicleNumber,
        purchaseInvoiceNumber,
        purchaseDate,
        totalPurchaseAmount: totalAmount,
        advancePaid: basePaid,
        amountPaid: stats.paymentReceived,
        totalPaidSoFar: amountPaid,
        outstandingAmount,
        lastPaymentDate: stats.lastPaymentDate,
        dueDate,
        overdueDays,
        status: stats.status,
        branch: p.branch || "Tiruppur",
        customerId: p.sellerId || p.seller_id,
        vehicleId: p.purchase_id || p.id
      };
    });

    if (dateRange.from) report = report.filter(r => r.purchaseDate >= dateRange.from);
    if (dateRange.to) report = report.filter(r => r.purchaseDate <= dateRange.to);

    if (selectedCustomerFilter && selectedCustomerFilter !== "all") {
      report = report.filter(r => r.customerName.toLowerCase().includes(selectedCustomerFilter.toLowerCase()) || r.customerId === selectedCustomerFilter);
    }
    if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
      report = report.filter(r => r.vehicleNumber.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || r.vehicleId === selectedVehicleFilter);
    }
    if (selectedStatusFilter && selectedStatusFilter !== "all") {
      report = report.filter(r => r.status.toLowerCase() === selectedStatusFilter.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      report = report.filter(r =>
        r.customerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.vehicleNumber.toLowerCase().includes(q) ||
        r.purchaseInvoiceNumber.toLowerCase().includes(q)
      );
    }

    if (custSortField) {
      report.sort((a, b) => {
        let valA = a[custSortField];
        let valB = b[custSortField];
        if (typeof valA === "string") valA = valA.toLowerCase();
        if (typeof valB === "string") valB = valB.toLowerCase();
        if (valA < valB) return custSortOrder === "asc" ? -1 : 1;
        if (valA > valB) return custSortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return report;
  };

  const getFilteredConsultancyFees = () => {
    const records = [];

    // 1. From Deals
    (deals || []).filter(d => !d.isDeleted).forEach(deal => {
      const fee = Number(deal.consultancyFees || deal.consultancyFee || deal.consultancy_fees) || 0;
      if (fee > 0) {
        const gst = Number(deal.consultancyGst || deal.gstAmount) || (deal.hasGst ? Math.round(fee * 0.18) : 0);
        const totalAmount = fee + gst;
        const received = Number(deal.consultancyReceived) || (deal.paymentStatus === "Paid" ? totalAmount : Math.min(totalAmount, Number(deal.advanceAmount) || 0));
        const pending = Math.max(0, totalAmount - received);
        const matchCust = (customers || []).find(c => c.id === deal.customerId || c.name === deal.customerName);
        const matchVeh = (vehicles || []).find(v => v.id === deal.vehicleId || v.purchase_id === deal.vehicleId);

        records.push({
          id: deal.id || `FEE-D-${Math.random()}`,
          customerName: deal.customerName || matchCust?.name || "Customer",
          mobile: matchCust?.mobile || deal.mobile || "N/A",
          vehicle: matchVeh?.regNo || matchVeh?.reg_no || deal.vehicleName || "Vehicle",
          consultancyAmount: fee,
          gst: gst,
          totalAmount: totalAmount,
          receivedAmount: received,
          pendingAmount: pending,
          paymentDate: deal.date || (deal.createdAt ? new Date(deal.createdAt).toISOString().split("T")[0] : ""),
          paymentMode: deal.paymentMode || deal.mode || "Cash",
          status: pending === 0 ? "Paid" : (received > 0 ? "Partially Paid" : "Pending"),
          remarks: deal.remarks || deal.narration || "Consultancy fee deal",
          branch: deal.branch || "Tiruppur",
          customerId: deal.customerId,
          vehicleId: deal.vehicleId
        });
      }
    });

    // 2. From Vehicles (Purchases)
    (vehicles || []).filter(v => !v.isDeleted).forEach(p => {
      const fee = Number(p.consultancyFees || p.consultancy_fees) || 0;
      if (fee > 0 && !records.some(r => r.vehicleId === p.id || r.vehicleId === p.purchase_id)) {
        const gst = 0;
        const totalAmount = fee;
        const received = p.balance_amount === 0 ? fee : Math.max(0, fee - (Number(p.balance_amount) || 0));
        const pending = Math.max(0, totalAmount - received);
        const matchCust = (customers || []).find(c => c.id === p.sellerId || c.name === p.sellerName);

        records.push({
          id: p.purchase_id || p.id || `FEE-P-${Math.random()}`,
          customerName: p.sellerName || matchCust?.name || "Customer",
          mobile: p.sellerMobile || matchCust?.mobile || "N/A",
          vehicle: p.regNo || p.reg_no || p.name || "Vehicle",
          consultancyAmount: fee,
          gst: gst,
          totalAmount: totalAmount,
          receivedAmount: received,
          pendingAmount: pending,
          paymentDate: p.purchaseDate || (p.createdAt ? new Date(p.createdAt).toISOString().split("T")[0] : ""),
          paymentMode: p.paymentMode || "Cash",
          status: pending === 0 ? "Paid" : (received > 0 ? "Partially Paid" : "Pending"),
          remarks: p.remarks || "Vehicle consultancy charge",
          branch: p.branch || "Tiruppur",
          customerId: p.sellerId,
          vehicleId: p.purchase_id || p.id
        });
      }
    });

    let report = records;

    if (dateRange.from) report = report.filter(r => r.paymentDate >= dateRange.from);
    if (dateRange.to) report = report.filter(r => r.paymentDate <= dateRange.to);

    if (selectedCustomerFilter && selectedCustomerFilter !== "all") {
      report = report.filter(r => r.customerName.toLowerCase().includes(selectedCustomerFilter.toLowerCase()) || r.customerId === selectedCustomerFilter);
    }
    if (selectedVehicleFilter && selectedVehicleFilter !== "all") {
      report = report.filter(r => r.vehicle.toLowerCase().includes(selectedVehicleFilter.toLowerCase()) || r.vehicleId === selectedVehicleFilter);
    }
    if (selectedStatusFilter && selectedStatusFilter !== "all") {
      report = report.filter(r => r.status.toLowerCase() === selectedStatusFilter.toLowerCase());
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      report = report.filter(r =>
        r.customerName.toLowerCase().includes(q) ||
        r.mobile.includes(q) ||
        r.vehicle.toLowerCase().includes(q) ||
        r.paymentMode.toLowerCase().includes(q)
      );
    }

    return report;
  };

  const handleShareWhatsApp = (row) => {
    const cleanMobile = (row.mobile || "").replace(/\D/g, "");
    let phoneNum = cleanMobile;
    if (phoneNum.length === 10) {
      phoneNum = "91" + phoneNum;
    }
    const message = `Dear ${row.customerName},\n\nThis is a payment reminder regarding your vehicle invoice at AUTO 360 ERP.\n\n*Invoice No:* ${row.invoiceNumber}\n*Vehicle:* ${row.vehicleNumber}\n*Invoice Date:* ${row.invoiceDate}\n*Total Invoice Amount:* ₹${row.totalInvoiceAmount.toLocaleString("en-IN")}\n*Amount Received:* ₹${row.amountReceived.toLocaleString("en-IN")}\n*Outstanding Balance:* ₹${row.outstandingAmount.toLocaleString("en-IN")}\n*Due Date:* ${row.dueDate}\n*Overdue:* ${row.overdueDays} Days\n\nKindly arrange for payment at your earliest convenience. Thank you!`;

    const url = `https://api.whatsapp.com/send?phone=${phoneNum}&text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };
  const getAreaWiseStock = () => {
    const counts = {};
    vehicles.forEach((v) => {
      if (v.isDeleted) return;
      if (!matchesBranch(v.branch)) return;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return;
      if (brandFilter !== "All" && v.brand !== brandFilter) return;
      const area = v.area || "Coimbatore Centre";
      if (!counts[area]) counts[area] = { total: 0, available: 0, sold: 0 };
      counts[area].total += 1;
      if (v.status !== "Sold" && v.vehicle_status !== "Sold" && !v.isSold) {
        counts[area].available += 1;
      } else if (v.status === "Sold" || v.vehicle_status === "Sold" || v.isSold) {
        counts[area].sold += 1;
      }
    });
    return Object.keys(counts).map((area) => ({
      area,
      total: counts[area].total,
      available: counts[area].available,
      sold: counts[area].sold
    })).filter((a) => searchQuery ? a.area.toLowerCase().includes(searchQuery.toLowerCase()) : true);
  };
  const getBranchWiseStock = () => {
    const counts = {};
    const yards = branches.length > 0 ? branches.map((b) => b.name) : ["Tiruppur"];
    yards.forEach((y) => {
      counts[y] = { total: 0, available: 0, sold: 0 };
    });
    vehicles.forEach((v) => {
      if (v.isDeleted) return;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return;
      if (brandFilter !== "All" && v.brand !== brandFilter) return;
      const key = v.branch || "Tiruppur";
      if (!counts[key]) {
        counts[key] = { total: 0, available: 0, sold: 0 };
      }
      counts[key].total += 1;
      if (v.status !== "Sold" && v.vehicle_status !== "Sold" && !v.isSold) counts[key].available += 1;
      if (v.status === "Sold" || v.vehicle_status === "Sold" || v.isSold) counts[key].sold += 1;
    });
    return Object.keys(counts).map((branch) => ({
      branch,
      total: counts[branch].total,
      available: counts[branch].available,
      sold: counts[branch].sold
    })).filter((b) => {
      if (selectedBranchFilter !== "all" && b.branch.toLowerCase() !== selectedBranchFilter.toLowerCase()) return false;
      return searchQuery ? b.branch.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    });
  };
  const getBranchWiseSales = () => {
    const counts = {};
    deals.forEach((d) => {
      if (d.type !== "Sell" || d.isDeleted) return;
      const vehicle = vehicles.find((v) => v.id === d.vehicleId);
      if (vehicleTypeFilter !== "All" && vehicle?.vehicleType !== vehicleTypeFilter) return;
      if (brandFilter !== "All" && vehicle?.brand !== brandFilter) return;
      if (d.date < dateRange.from || d.date > dateRange.to) return;
      const key = d.branch || "Tiruppur";
      if (!counts[key]) counts[key] = { count: 0, amount: 0, profit: 0 };
      const saleVal = Number(d.totalPrice) || (Number(d.sellingPrice || 0) + Number(d.consultancyFees || 0));
      counts[key].count += 1;
      counts[key].amount += saleVal;
      const margin = saleVal - (d.purchasePrice + (d.expenses || 0));
      counts[key].profit += margin > 0 ? margin : d.commission || d.consultancyFees * 2 || 12e3;
    });
    return Object.keys(counts).map((branch) => ({
      branch,
      count: counts[branch].count,
      amount: counts[branch].amount,
      profit: counts[branch].profit
    })).filter((b) => {
      if (selectedBranchFilter !== "all" && b.branch.toLowerCase() !== selectedBranchFilter.toLowerCase()) return false;
      return searchQuery ? b.branch.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    });
  };
  const getBranchWisePurchase = () => {
    const counts = {};
    vehicles.forEach((v) => {
      if (v.isDeleted) return;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return;
      if (brandFilter !== "All" && v.brand !== brandFilter) return;
      const dateStr = v.createdAt ? new Date(v.createdAt).toISOString().split("T")[0] : "";
      if (dateStr && (dateStr < dateRange.from || dateStr > dateRange.to)) return;
      const key = v.branch || "Tiruppur";
      if (!counts[key]) counts[key] = { count: 0, amount: 0 };
      counts[key].count += 1;
      counts[key].amount += v.purchasePrice || 0;
    });
    return Object.keys(counts).map((branch) => ({
      branch,
      count: counts[branch].count,
      amount: counts[branch].amount
    })).filter((b) => {
      if (selectedBranchFilter !== "all" && b.branch.toLowerCase() !== selectedBranchFilter.toLowerCase()) return false;
      return searchQuery ? b.branch.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    });
  };
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    switch (activeReport) {
      case "customer_purchase_outstanding":
        headers = ["Customer Name", "Mobile Number", "Vehicle Number", "Purchase Invoice Number", "Purchase Date", "Total Purchase Amount", "Amount Paid", "Outstanding Amount", "Due Date", "Overdue Days", "Status"];
        rows = getFilteredCustomerPurchaseOutstanding().map((r) => [
          r.customerName,
          r.mobile,
          r.vehicleNumber,
          r.purchaseInvoiceNumber,
          r.purchaseDate,
          r.totalPurchaseAmount,
          r.amountPaid,
          r.outstandingAmount,
          r.dueDate,
          r.overdueDays,
          r.status
        ]);
        break;
      case "customer_sales_outstanding":
      case "customer_outstanding":
        headers = ["Customer Name", "Mobile Number", "Vehicle Number", "Invoice Number", "Invoice Date", "Total Invoice Amount", "Amount Received", "Outstanding Amount", "Due Date", "Overdue Days", "Status"];
        rows = getFilteredCustomerOutstanding().map((r) => [
          r.customerName,
          r.mobile,
          r.vehicleNumber,
          r.invoiceNumber,
          r.invoiceDate,
          r.totalInvoiceAmount,
          r.amountReceived,
          r.outstandingAmount,
          r.dueDate,
          r.overdueDays,
          r.status
        ]);
        break;
      case "consultancy_fees":
        headers = ["Customer Name", "Mobile Number", "Vehicle", "Consultancy Amount", "GST", "Total Fee", "Received Amount", "Outstanding Amount", "Payment Date", "Payment Mode", "Status"];
        rows = getFilteredConsultancyFees().map((r) => [
          r.customerName,
          r.mobile,
          r.vehicle,
          r.consultancyAmount,
          r.gst,
          r.totalAmount,
          r.receivedAmount,
          r.pendingAmount,
          r.paymentDate,
          r.paymentMode,
          r.status
        ]);
        break;
      case "supplier_outstanding":
        headers = ["Supplier Name", "Mobile Number", "Vehicle Number", "Purchase Invoice Number", "Purchase Date", "Total Purchase Amount", "Amount Paid", "Outstanding Amount", "Due Date", "Overdue Days", "Status"];
        rows = getFilteredSupplierOutstanding().map((r) => [
          r.supplierName,
          r.mobile,
          r.vehicleNumber,
          r.purchaseInvoiceNumber,
          r.purchaseDate,
          r.totalPurchaseAmount,
          r.amountPaid,
          r.outstandingAmount,
          r.dueDate,
          r.overdueDays,
          r.status
        ]);
        break;
      case "sales":
        headers = ["Invoice No", "Date", "Customer", "Vehicle", "Amount", "Branch"];
        rows = getFilteredDeals().map((d) => [`INV-${(d.id || "").toString().substring(0, 6).toUpperCase()}`, d.date, d.customerName, d.vehicleName, d.totalPrice, d.branch || "Headquarters"]);
        break;
      case "purchase":
        headers = ["Purchase ID", "Date", "Supplier", "Vehicle", "Purchase Amount", "Branch"];
        rows = getFilteredPurchases().map((v) => [`PRC-${(v.id || "").toString().substring(0, 6).toUpperCase()}`, v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A", v.sellerName || "Direct Vendor", v.name, v.purchasePrice, v.branch || "Tiruppur"]);
        break;
      case "customer":
        headers = ["Customer ID", "Customer Name", "Mobile", "City", "Branch"];
        rows = getFilteredCustomers().map((c) => [(c.id || "").toString().substring(0, 6).toUpperCase(), c.name, c.mobile, c.address || "N/A", c.branch || "Tiruppur"]);
        break;
      case "expense":
        headers = ["Expense Date", "Vehicle", "Expense Type", "Amount", "Branch"];
        rows = getFilteredExpenses().map((e) => {
          const subV = vehicles.find((v) => v.id === e.vehicleId);
          return [e.date, subV ? subV.name : "General Business", e.category, e.amount, subV?.branch || "Headquarters"];
        });
        break;
      case "inventory":
        headers = ["Vehicle", "Registration No", "Purchase Price", "Total Expenses", "Status", "Branch"];
        rows = getFilteredPurchases().map((v) => [v.name, v.regNo, v.purchasePrice, v.totalExpenses || 0, v.status, v.branch || "Tiruppur"]);
        break;
      case "balance_pending":
        headers = ["Customer", "Vehicle", "Pending Amount", "Due Date", "Branch"];
        rows = getFilteredBalancePending().map((d) => [d.customerName, d.vehicleName, d.balanceAmount, d.date, d.branch || "Tiruppur"]);
        break;
      case "rc_pending":
        headers = ["Customer", "Vehicle", "Registration No", "RC Status", "Branch"];
        rows = getFilteredRCPending().map((v) => {
          const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
          return [matchedDeal?.customerName || "In Yard Stock", v.name, v.regNo, v.rcType || "Paper Pending", v.branch || "Tiruppur"];
        });
        break;
      case "insurance_pending":
        headers = ["Customer", "Vehicle", "Insurance Expiry", "Days Remaining", "Branch"];
        rows = getFilteredInsurancePending().map((v) => {
          const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
          return [matchedDeal?.customerName || "In Stock", v.name, "Expired/None", "0 Days", v.branch || "Tiruppur"];
        });
        break;
      case "low_stock":
        headers = ["Vehicle Type", "Brand", "Model", "Available Stock", "Total Stock", "Branch"];
        rows = getFilteredLowStock().map((l) => [l.vehicleType, l.brand, l.model, l.availStock, l.totalStock, l.branch]);
        break;
      case "noc_pending":
        headers = ["Seller/Customer", "Vehicle", "Registration No", "NOC Status", "Branch"];
        rows = getFilteredNOCPending().map((v) => [v.sellerName || "Direct Showroom", v.name, v.regNo || "N/A", "NOC PENDING", v.branch || "Tiruppur"]);
        break;
      case "binding_loan":
        headers = ["Loan ID", "Customer", "Vehicle", "Finance Name", "Loan Amount", "Paid Amount", "Balance Amount", "Status"];
        rows = getFilteredLoans().map((l) => {
          const isClosed = l.dueAmount <= 0;
          return [l.id, l.customerName || "Direct Client", l.vehicleDetails || "Generic vehicle", l.financeName || "Coimbatore Finance", l.takenAmount, l.takenAmount - l.dueAmount, l.dueAmount, isClosed ? "Closed" : "Active"];
        });
        break;
      case "login_report":
        headers = ["User Name", "Role", "Branch", "Login Date", "Login Time", "Logout Time", "Session Duration", "IP Address", "Status"];
        rows = getFilteredLoginReports().map((r) => [
          r.username || "Unknown",
          r.role || "Staff",
          r.branch_id || r.branch || "Headquarters",
          r.login_date || r.loginDate || "N/A",
          r.login_time || r.loginTime || "N/A",
          r.logout_time || r.logoutTime || "Active",
          r.session_duration || r.sessionDuration || "Active",
          r.ip_address || r.ipAddress || "127.0.0.1",
          r.status || (r.logout_time || r.logoutTime ? "Logged Out" : "Active")
        ]);
        break;
      case "supplier":
        headers = ["Supplier ID", "Supplier Name", "Mobile", "City", "Branch"];
        rows = getFilteredSuppliers().map((s) => [s.id.substring(0, 6).toUpperCase(), s.name, s.mobile || "N/A", s.city || "Tamil Nadu", s.branch || "Salem"]);
        break;
      case "area_stock":
        headers = ["Area", "Total Vehicles", "Available Stock", "Sold Stock"];
        rows = getAreaWiseStock().map((a) => [a.area, a.total, a.available, a.sold]);
        break;
      case "branch_stock":
        headers = ["Branch", "Available Vehicles", "Sold Vehicles", "Total Stock"];
        rows = getBranchWiseStock().map((b) => [b.branch, b.available, b.sold, b.total]);
        break;
      case "branch_sales":
        headers = ["Branch", "Sales Count", "Sales Amount", "Profit"];
        rows = getBranchWiseSales().map((b) => [b.branch, b.count, b.amount, b.profit]);
        break;
      case "branch_purchase":
        headers = ["Branch", "Purchase Count", "Purchase Amount"];
        rows = getBranchWisePurchase().map((b) => [b.branch, b.count, b.amount]);
        break;
      default:
        headers = ["Report Column"];
        rows = [["No Data"]];
    }
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(",")].concat(rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AUTO_360_ERP_Report_${activeReport}_${dateRange.from}_to_${dateRange.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");

      const compName = businessProfile?.companyName || "AUTO 360 CONSULTANCY";
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(compName.toUpperCase(), 14, 16);

      const subLines = [];
      if (businessProfile?.address) subLines.push(businessProfile.address);
      if (businessProfile?.mobileNumber) subLines.push(`Mob: ${businessProfile.mobileNumber}`);
      if (businessProfile?.email) subLines.push(`Email: ${businessProfile.email}`);
      if (businessProfile?.website) subLines.push(`Web: ${businessProfile.website}`);
      if (businessProfile?.gstNumber) subLines.push(`GSTIN: ${businessProfile.gstNumber}`);
      if (businessProfile?.cin) subLines.push(`CIN: ${businessProfile.cin}`);

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const subText = subLines.join(" | ");
      doc.text(doc.splitTextToSize(subText, 180), 14, 21);

      doc.setDrawColor(226, 232, 240);
      doc.line(14, 27, 196, 27);

      const rLabel = reportOptions.find((r) => r.id === activeReport)?.label.toUpperCase();
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229);
      doc.text(`REPORT CATEGORY: ${rLabel}`, 14, 34);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(115, 115, 115);
      doc.text(`Branch Scope: ${selectedBranchFilter === "all" ? "All Active Branches" : selectedBranchFilter.toUpperCase()}  |  Timeline: ${dateRange.from} to ${dateRange.to}`, 14, 40);
      doc.text(`Generated By: ${currentUser?.name || "Administrator"} on ${new Date().toLocaleString()}`, 14, 45);
      let headers = [];
      let rows = [];
      switch (activeReport) {
        case "customer_purchase_outstanding":
          headers = ["Customer", "Mobile", "Vehicle", "Purchase Inv No", "Date", "Total Amt", "Amount Paid", "Outstanding", "Due Date", "Status"];
          rows = getFilteredCustomerPurchaseOutstanding().map((r) => [
            r.customerName,
            r.mobile,
            r.vehicleNumber,
            r.purchaseInvoiceNumber,
            r.purchaseDate,
            `₹${r.totalPurchaseAmount.toLocaleString("en-IN")}`,
            `₹${r.amountPaid.toLocaleString("en-IN")}`,
            `₹${r.outstandingAmount.toLocaleString("en-IN")}`,
            r.dueDate,
            r.status
          ]);
          break;
        case "customer_sales_outstanding":
        case "customer_outstanding":
          headers = ["Customer", "Mobile", "Vehicle", "Invoice No", "Date", "Total Amt", "Received", "Outstanding", "Due Date", "Status"];
          rows = getFilteredCustomerOutstanding().map((r) => [
            r.customerName,
            r.mobile,
            r.vehicleNumber,
            r.invoiceNumber,
            r.invoiceDate,
            `₹${(Number(r.totalInvoiceAmount) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.amountReceived) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.outstandingAmount) || 0).toLocaleString("en-IN")}`,
            r.dueDate,
            r.status
          ]);
          break;
        case "consultancy_fees":
          headers = ["Customer", "Mobile", "Vehicle", "Consultancy Amt", "GST", "Total Fee", "Received", "Outstanding", "Date", "Mode", "Status"];
          rows = getFilteredConsultancyFees().map((r) => [
            r.customerName,
            r.mobile,
            r.vehicle,
            `₹${(Number(r.consultancyAmount) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.gst) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.totalAmount) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.receivedAmount) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.pendingAmount) || 0).toLocaleString("en-IN")}`,
            r.paymentDate,
            r.paymentMode,
            r.status
          ]);
          break;
        case "supplier_outstanding":
          headers = ["Supplier", "Mobile", "Vehicle", "Purchase Inv No", "Date", "Total Amt", "Amount Paid", "Outstanding", "Due Date", "Status"];
          rows = getFilteredSupplierOutstanding().map((r) => [
            r.supplierName,
            r.mobile,
            r.vehicleNumber,
            r.purchaseInvoiceNumber,
            r.purchaseDate,
            `₹${(Number(r.totalPurchaseAmount) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.amountPaid) || 0).toLocaleString("en-IN")}`,
            `₹${(Number(r.outstandingAmount) || 0).toLocaleString("en-IN")}`,
            r.dueDate,
            r.status
          ]);
          break;
        case "sales":
          headers = ["Invoice No", "Date", "Customer Name", "Vehicle", "Amount", "Branch"];
          rows = getFilteredDeals().map((d) => [`INV-${(d.id || "").toString().substring(0, 6).toUpperCase()}`, d.date, d.customerName, d.vehicleName, `INR ${(Number(d.totalPrice) || 0).toLocaleString("en-IN")}`, d.branch || "Tiruppur"]);
          break;
        case "purchase":
          headers = ["Purchase ID", "Date", "Supplier", "Vehicle", "Amount", "Branch"];
          rows = getFilteredPurchases().map((v) => [`PRC-${(v.id || "").toString().substring(0, 6).toUpperCase()}`, v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A", v.sellerName || "Direct Vendor", v.name, `INR ${(Number(v.purchasePrice) || 0).toLocaleString("en-IN")}`, v.branch || "Salem"]);
          break;
        case "customer":
          headers = ["Customer ID", "Customer Name", "Mobile", "City", "Branch"];
          rows = getFilteredCustomers().map((c) => [(c.id || "").toString().substring(0, 6).toUpperCase(), c.name, c.mobile, c.address || "N/A", c.branch || "Salem"]);
          break;
        case "expense":
          headers = ["Date", "Vehicle Context", "Type", "Amount", "Branch"];
          rows = getFilteredExpenses().map((e) => {
            const subV = vehicles.find((v) => v.id === e.vehicleId);
            return [e.date, subV ? subV.name : "Business Operation", e.category, `INR ${(Number(e.amount) || 0).toLocaleString("en-IN")}`, subV?.branch || "Headquarters"];
          });
          break;
        case "inventory":
          headers = ["Vehicle", "Reg No", "Reg / Type", "Status", "Cost", "Branch"];
          rows = getFilteredPurchases().map((v) => [v.name, v.regNo, v.vehicleType, v.status, `INR ${(Number(v.purchasePrice) || 0).toLocaleString("en-IN")}`, v.branch || "Tiruppur"]);
          break;
        case "balance_pending":
          headers = ["Customer Name", "Vehicle Contract", "Pending Amount", "Due Date", "Branch"];
          rows = getFilteredBalancePending().map((d) => [d.customerName, d.vehicleName, `INR ${(Number(d.balanceAmount) || 0).toLocaleString("en-IN")}`, d.date, d.branch || "Salem"]);
          break;
        case "rc_pending":
          headers = ["Customer", "Purchased Vehicle", "Registration No", "RC Status", "Branch"];
          rows = getFilteredRCPending().map((v) => {
            const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
            return [matchedDeal?.customerName || "In Stock", v.name, v.regNo, v.rcType || "Paper", v.branch || "Tiruppur"];
          });
          break;
        case "insurance_pending":
          headers = ["Customer", "Vehicle", "Insurance Expiry", "Days Remaining", "Branch"];
          rows = getFilteredInsurancePending().map((v) => {
            const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
            return [matchedDeal?.customerName || "In Yard", v.name, "Expired/None", "0 Days", v.branch || "Tiruppur"];
          });
          break;
        case "low_stock":
          headers = ["Vehicle Type", "Brand", "Model", "Available Stock", "Total Stock", "Branch"];
          rows = getFilteredLowStock().map((l) => [l.vehicleType, l.brand, l.model, String(l.availStock || 0), String(l.totalStock || 0), l.branch]);
          break;
        case "noc_pending":
          headers = ["Customer", "Vehicle", "Registration No", "NOC Status", "Branch"];
          rows = getFilteredNOCPending().map((v) => [v.sellerName || "Direct Showroom", v.name, v.regNo || "N/A", "NOC PENDING", v.branch || "Tiruppur"]);
          break;
        case "binding_loan":
          headers = ["Loan ID", "Customer name", "Vehicle details", "Lender Name", "Loan Amt", "Outstanding"];
          rows = getFilteredLoans().map((l) => [l.id, l.customerName || "Direct", l.vehicleDetails, l.financeName || "SFC", `INR ${(Number(l.takenAmount) || 0).toLocaleString("en-IN")}`, `INR ${(Number(l.dueAmount) || 0).toLocaleString("en-IN")}`]);
          break;
        case "login_report":
          headers = ["User Name", "Role", "Branch", "Login Date", "Login Time", "Logout Time", "Session Duration", "IP Address", "Status"];
          rows = getFilteredLoginReports().map((r) => [
            r.username || "Unknown",
            r.role || "Staff",
            r.branch_id || r.branch || "Headquarters",
            r.login_date || r.loginDate || "N/A",
            r.login_time || r.loginTime || "N/A",
            r.logout_time || r.logoutTime || "Active",
            r.session_duration || r.sessionDuration || "Active",
            r.ip_address || r.ipAddress || "127.0.0.1",
            r.status || (r.logout_time || r.logoutTime ? "Logged Out" : "Active")
          ]);
          break;
        case "supplier":
          headers = ["Supplier ID", "Supplier Name", "Mobile", "City", "Assigned Branch"];
          rows = getFilteredSuppliers().map((s) => [(s.id || "").toString().substring(0, 6).toUpperCase(), s.name, s.mobile, s.city || "Tamil Nadu", s.branch || "Salem"]);
          break;
        case "area_stock":
          headers = ["Area Location", "Total units", "Available Vehicles", "Sold Vehicles"];
          rows = getAreaWiseStock().map((a) => [a.area, a.total, a.available, a.sold]);
          break;
        case "branch_stock":
          headers = ["Branch", "Available count", "Sold Vehicles", "Total Yard Units"];
          rows = getBranchWiseStock().map((b) => [b.branch, b.available, b.sold, b.total]);
          break;
        case "branch_sales":
          headers = ["Branch", "Deals count", "Gross Turnover volume", "Profit estimate"];
          rows = getBranchWiseSales().map((b) => [b.branch, b.count, `INR ${(Number(b.amount) || 0).toLocaleString("en-IN")}`, `INR ${(Number(b.profit) || 0).toLocaleString("en-IN")}`]);
          break;
        case "branch_purchase":
          headers = ["Branch Name", "Inbound procure count", "Total capital outlays"];
          rows = getBranchWisePurchase().map((b) => [b.branch, b.count, `INR ${(Number(b.amount) || 0).toLocaleString("en-IN")}`]);
          break;
        default:
          headers = ["Col"];
          rows = [["No Data"]];
      }
      doc.autoTable({
        startY: 55,
        head: [headers],
        body: rows,
        theme: "striped",
        headStyles: { fillColor: [79, 70, 229], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2.5 }
      });
      doc.save(`AUTO_360_${activeReport}_Report_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };
  const handlePrint = () => {
    window.print();
  };
  const resetFilters = () => {
    setDateRange({
      from: "2024-01-01",
      to: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    });
    setSearchQuery("");
    setVehicleTypeFilter("All");
    setBrandFilter("All");
    if (currentUser?.role !== "Branch Admin") {
      setSelectedBranchFilter("all");
    }
  };
  const renderSummaryCards = () => {
    switch (activeReport) {
      case "customer_purchase_outstanding": {
        const custPurData = getFilteredCustomerPurchaseOutstanding();
        const totalOutstanding = custPurData.reduce((acc, r) => acc + r.outstandingAmount, 0);
        const totalPurchase = custPurData.reduce((acc, r) => acc + r.totalPurchaseAmount, 0);
        const totalPaid = custPurData.reduce((acc, r) => acc + r.amountPaid, 0);
        return <>
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Customer Purchase Outstanding</p>
            <h4 className="text-2xl font-extrabold text-amber-900 mt-1">₹{totalOutstanding.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Purchase Amount Paid</p>
            <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">₹{totalPaid.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Total Customer Purchase Valuation</p>
            <h4 className="text-2xl font-extrabold text-blue-900 mt-1">₹{totalPurchase.toLocaleString("en-IN")}</h4>
          </div>
        </>;
      }
      case "customer_sales_outstanding":
      case "customer_outstanding":
      case "balance_pending": {
        const custData = getFilteredCustomerOutstanding();
        const totalOutstanding = custData.reduce((acc, r) => acc + (r.outstandingAmount || 0), 0);
        const totalAdvances = custData.reduce((acc, r) => acc + (r.advancePaid || 0), 0);
        const totalValuation = custData.reduce((acc, r) => acc + (r.totalInvoiceAmount || 0), 0);
        return <>
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Sales Outstanding</p>
            <h4 className="text-2xl font-extrabold text-rose-900 mt-1">₹{totalOutstanding.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Advances Collected</p>
            <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">₹{totalAdvances.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Total Sales Valuation</p>
            <h4 className="text-2xl font-extrabold text-blue-900 mt-1">₹{totalValuation.toLocaleString("en-IN")}</h4>
          </div>
        </>;
      }
      case "supplier_outstanding": {
        const suppData = getFilteredSupplierOutstanding();
        const totalOutstanding = suppData.reduce((acc, r) => acc + r.outstandingAmount, 0);
        const totalPurchase = suppData.reduce((acc, r) => acc + r.totalPurchaseAmount, 0);
        const totalPaid = suppData.reduce((acc, r) => acc + r.amountPaid, 0);
        return <>
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Supplier Outstanding</p>
            <h4 className="text-2xl font-extrabold text-rose-900 mt-1">₹{totalOutstanding.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Purchase Paid</p>
            <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">₹{totalPaid.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Purchase Valuation</p>
            <h4 className="text-2xl font-extrabold text-amber-900 mt-1">₹{totalPurchase.toLocaleString("en-IN")}</h4>
          </div>
        </>;
      }
      case "finance_settlement": {
        const finData = getFilteredFinanceSettlement();
        const totalFinance = finData.reduce((acc, r) => acc + r.financeAmount, 0);
        const totalDisbursed = finData.reduce((acc, r) => acc + r.disbursedAmount, 0);
        const totalPending = finData.reduce((acc, r) => acc + r.pendingDisbursement, 0);
        return <>
          <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Total Finance Portfolio</p>
            <h4 className="text-2xl font-extrabold text-purple-900 mt-1">₹{totalFinance.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Finance Disbursed</p>
            <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">₹{totalDisbursed.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Finance Settlement Pending</p>
            <h4 className="text-2xl font-extrabold text-rose-900 mt-1">₹{totalPending.toLocaleString("en-IN")}</h4>
          </div>
        </>;
      }
      case "consultancy_fees": {
        const feeData = getFilteredConsultancyFees();
        const totalFee = feeData.reduce((acc, r) => acc + r.totalAmount, 0);
        const totalReceived = feeData.reduce((acc, r) => acc + r.receivedAmount, 0);
        const totalPending = feeData.reduce((acc, r) => acc + r.pendingAmount, 0);
        return <>
          <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Total Consultancy Fee Revenue</p>
            <h4 className="text-2xl font-extrabold text-indigo-900 mt-1">₹{totalFee.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Received Fees</p>
            <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">₹{totalReceived.toLocaleString("en-IN")}</h4>
          </div>
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Outstanding Fees</p>
            <h4 className="text-2xl font-extrabold text-rose-900 mt-1">₹{totalPending.toLocaleString("en-IN")}</h4>
          </div>
        </>;
      }
      case "sales": {
        const matchingDeals = getFilteredDeals();
        const count = matchingDeals.length;
        const totalAmount = matchingDeals.reduce((acc, d) => acc + (d.totalPrice || 0), 0);
        return <>
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Total Sales Deals</p>
              <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">{count} Units</h4>
            </div>
            <div className="bg-brand-50 border border-brand-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Total Sales Amount</p>
              <h4 className="text-2xl font-extrabold text-brand-900 mt-1">₹{totalAmount.toLocaleString("en-IN")}</h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Vehicles Sold Count</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{count} Sold</h4>
            </div>
          </>;
      }
      case "purchase": {
        const matchingPurchases = getFilteredPurchases();
        const count = matchingPurchases.length;
        const totalAmount = matchingPurchases.reduce((acc, v) => acc + (v.purchasePrice || 0), 0);
        return <>
            <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Total Purchase Procured</p>
              <h4 className="text-2xl font-extrabold text-blue-900 mt-1">{count} Units</h4>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Purchase Outlay</p>
              <h4 className="text-2xl font-extrabold text-amber-900 mt-1">₹{totalAmount.toLocaleString("en-IN")}</h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Inwards Invoiced</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{count} Purchases</h4>
            </div>
          </>;
      }
      case "customer": {
        const totalCustom = getFilteredCustomers().length;
        const newCustom = customers.filter((c) => c.leadStatus === "New" && matchesBranch(c.branch)).length;
        return <>
            <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Total Registered Customers</p>
              <h4 className="text-2xl font-extrabold text-purple-900 mt-1">{totalCustom} Active</h4>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">New Inquiry Leads</p>
              <h4 className="text-2xl font-extrabold text-indigo-900 mt-1">{newCustom} New</h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Follow-up Leads</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{customers.filter((c) => c.leadStatus === "Follow-up").length} Pending</h4>
            </div>
          </>;
      }
      case "inventory": {
        const availableCount = vehicles.filter((v) => v.status !== "Sold" && v.vehicle_status !== "Sold" && !v.isSold && !v.isDeleted && matchesBranch(v.branch)).length;
        const soldCount = vehicles.filter((v) => (v.status === "Sold" || v.vehicle_status === "Sold" || v.isSold) && !v.isDeleted && matchesBranch(v.branch)).length;
        return <>
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Available Stock Count</p>
              <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">{availableCount} Units</h4>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Cleared Sold Stock</p>
              <h4 className="text-2xl font-extrabold text-rose-900 mt-1">{soldCount} Sold</h4>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Total Yard Intake</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{availableCount + soldCount} Total</h4>
            </div>
          </>;
      }
      case "login_report": {
        const filteredLogins = getFilteredLoginReports();
        const totalLogins = filteredLogins.length;
        const activeSessions = filteredLogins.filter(r => r.status === "Active" || (!r.logout_time && !r.logoutTime)).length;
        const expiredSessions = filteredLogins.filter(r => r.status === "Session Expired" || r.status === "Expired").length;
        return <>
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Audit Sessions</p>
              <h4 className="text-2xl font-extrabold text-amber-900 mt-1">{totalLogins} Records</h4>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-sans">Active Sessions</p>
              <h4 className="text-2xl font-extrabold text-emerald-900 mt-1">{activeSessions} Live</h4>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800 font-sans">Auto Expired Sessions</p>
              <h4 className="text-2xl font-extrabold text-rose-900 mt-1">{expiredSessions} Expired</h4>
            </div>
          </>;
      }
      case "binding_loan": {
        const filteredLoans = getFilteredLoans();
        const totalAmt = filteredLoans.reduce((acc, l) => acc + (l.takenAmount || 0), 0);
        const pendingAmt = filteredLoans.reduce((acc, l) => acc + (l.dueAmount || 0), 0);
        return <>
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">Total Loan Portfolio</p>
              <h4 className="text-2xl font-extrabold text-indigo-900 mt-1">₹{totalAmt.toLocaleString("en-IN")}</h4>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Total Paid back</p>
              <h4 className="text-2xl font-extrabold text-amber-900 mt-1">₹{(totalAmt - pendingAmt).toLocaleString("en-IN")}</h4>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Total Outstanding Balance</p>
              <h4 className="text-2xl font-extrabold text-rose-900 mt-1">₹{pendingAmt.toLocaleString("en-IN")}</h4>
            </div>
          </>;
      }
      default: {
        const recordsCount = searchQuery ? 5 : 12;
        return <>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Filtered Records</p>
              <h4 className="text-2xl font-extrabold text-slate-900 mt-1">Matched rows</h4>
            </div>
            <div className="bg-brand-50 border border-brand-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand-800">Active Branch Node</p>
              <h4 className="text-2xl font-extrabold text-brand-900 mt-1 capitalize">{selectedBranchFilter === "all" ? "Multibranch" : selectedBranchFilter}</h4>
            </div>
            <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800 font-sans">Business Status</p>
              <h4 className="text-2xl font-extrabold text-sky-900 mt-1">99.8% Online</h4>
            </div>
          </>;
      }
    }
  };
  const renderCharts = () => {
    if (activeReport === "sales") {
      const filteredDeals = getFilteredDeals();
      const brandDealsTotal = {};
      filteredDeals.forEach((d) => {
        const vehicle = vehicles.find((v) => v.id === d.vehicleId);
        const brandName = vehicle?.brand || "Other";
        brandDealsTotal[brandName] = (brandDealsTotal[brandName] || 0) + (d.totalPrice || 0);
      });
      const chartData = Object.keys(brandDealsTotal).map((name) => ({
        name,
        value: brandDealsTotal[name],
      }));

      if (!chartData.length) return null;

      return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Sales Revenue by Brand</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v}`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]} />
                <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (activeReport === "purchase") {
      const filteredPurchases = getFilteredPurchases();
      const brandPurchTotal = {};
      filteredPurchases.forEach((v) => {
        const brandName = v.brand || "Other";
        brandPurchTotal[brandName] = (brandPurchTotal[brandName] || 0) + (v.purchasePrice || 0);
      });
      const chartData = Object.keys(brandPurchTotal).map((name) => ({
        name,
        value: brandPurchTotal[name],
      }));

      if (!chartData.length) return null;

      return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Purchase Outlay by Brand</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v}`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Outlay"]} />
                <Bar dataKey="value" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (activeReport === "expense") {
      const filteredExpenses = getFilteredExpenses();
      const catTotals = {};
      filteredExpenses.forEach((e) => {
        catTotals[e.category] = (catTotals[e.category] || 0) + (e.amount || 0);
      });
      const chartData = Object.keys(catTotals).map((name) => ({
        name,
        value: catTotals[name],
      }));

      if (!chartData.length) return null;

      return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Expense Outlay by Category</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v.toLocaleString("en-IN")}`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`, "Expense"]} />
                <Bar dataKey="value" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (activeReport === "branch_stock") {
      const chartData = getBranchWiseStock();
      if (!chartData.length) return null;
      return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Yards Stock Comparison</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="branch" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="available" name="Available Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sold" name="Sold Stock" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    if (activeReport === "branch_sales") {
      const chartData = getBranchWiseSales();
      if (!chartData.length) return null;
      return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Branch-wise Gross Profits</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="branch" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v}`} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString("en-IN")}`]} />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="amount" name="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profits" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
            <TrendingUp size={24} className="text-brand-600" /> Auto 360 ERP Business Intelligence
          </h2>
          <p className="text-sm text-slate-500">Live dynamic workspace reporting, auditing & cross-branch ledger statements</p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-widest self-start sm:self-center">
          ERP Live Mode
        </div>
      </div>

      {/* Place Filters at the top of the page */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden text-left space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
            Report Parameters & Filters
          </h3>
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Quick Presets:</span>
            {[
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "thisWeek", label: "This Week" },
              { id: "lastWeek", label: "Last Week" },
              { id: "thisMonth", label: "This Month" },
              { id: "lastMonth", label: "Last Month" },
              { id: "thisYear", label: "This Year" },
              { id: "custom", label: "Custom Range" }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={cn(
                  "px-2.5 py-1 text-[9px] font-black rounded-lg transition-all uppercase tracking-wider cursor-pointer border",
                  selectedPreset === preset.id
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Row 1: From Date | To Date | GO Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={localFrom}
              onChange={(e) => {
                setLocalFrom(e.target.value);
                setSelectedPreset("custom");
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={localTo}
              onChange={(e) => {
                setLocalTo(e.target.value);
                setSelectedPreset("custom");
              }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={() => setDateRange({ from: localFrom, to: localTo })}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-extrabold uppercase tracking-wider text-[11px] h-10 rounded-xl transition-all shadow-md shadow-brand-100 cursor-pointer flex items-center justify-center gap-1.5"
            >
              GO
            </button>
          </div>
        </div>

        {/* Row 2: Branch Filter | Vehicle Type Filter | Brand Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Branch Filter</label>
            {currentUser?.role === "Branch Admin" ? (
              <div className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2.5 rounded-lg flex items-center gap-1.5 cursor-not-allowed h-10">
                <Building size={12} className="text-slate-400" />
                <span>Locked: {currentUser.branch}</span>
              </div>
            ) : (
              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Branches</option>
                <option value="Tiruppur">Tiruppur</option>
                {branches.length > 0 && branches.map((brName) => (
                  <option key={brName.id || brName.name} value={brName.name}>{brName.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Type Filter</label>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => handleVehicleTypeChange(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All types</option>
              <option value="Two Wheeler">Two Wheeler</option>
              <option value="Three Wheeler">Three Wheeler</option>
              <option value="Four Wheeler">Four Wheeler</option>
              <option value="Commercial">Commercial</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brand Filter</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All brands</option>
              {filteredBrandsList.map((b) => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {(activeReport === "purchase" || activeReport === "inventory" || activeReport === "rc_pending") && (
            <div className="space-y-1 col-span-1 md:col-span-3 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Ownership Transfer Status Filter</label>
              <select
                value={transferStatusFilter}
                onChange={(e) => setTransferStatusFilter(e.target.value)}
                className="w-full h-10 px-3 bg-indigo-50/50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="All">All Transfer Statuses (Transferred & Pending)</option>
                <option value="Yes">Transferred Vehicles Only</option>
                <option value="No">Pending Name Transfer Only</option>
              </select>
            </div>
          )}

          {activeReport === "login_report" && (
            <div className="space-y-1 col-span-1 md:col-span-3">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Account filter</label>
              <select
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Employee Users</option>
                {uniqueUsersList.map((usr) => (
                  <option key={usr} value={usr}>{usr}</option>
                ))}
              </select>
            </div>
          )}

          {(activeReport === "customer_outstanding" || activeReport === "customer_sales_outstanding" || activeReport === "customer_purchase_outstanding" || activeReport === "consultancy_fees") && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 col-span-1 md:col-span-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer Filter</label>
                <select
                  value={selectedCustomerFilter}
                  onChange={(e) => setSelectedCustomerFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Customers</option>
                  {customers.filter(c => !c.isDeleted).map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.mobile || "No Mob"})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Filter</label>
                <input
                  type="text"
                  placeholder="Filter reg / vehicle no..."
                  value={selectedVehicleFilter === "all" ? "" : selectedVehicleFilter}
                  onChange={(e) => setSelectedVehicleFilter(e.target.value || "all")}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Filter</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
          )}

          {activeReport === "supplier_outstanding" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-100 col-span-1 md:col-span-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Supplier Filter</label>
                <select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Suppliers</option>
                  {(suppliers || []).filter(s => !s.isDeleted).map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.mobile || "No Mob"})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Filter</label>
                <input
                  type="text"
                  placeholder="Filter reg / vehicle no..."
                  value={selectedVehicleFilter === "all" ? "" : selectedVehicleFilter}
                  onChange={(e) => setSelectedVehicleFilter(e.target.value || "all")}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status Filter</label>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Export Options Row directly below filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Export & Utilities
        </span>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer"
          >
            Reset Filters
          </button>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            {isExporting ? "Generating PDF..." : "Export PDF"}
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 bg-brand-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-brand-700 transition-all cursor-pointer shadow-md shadow-brand-100"
          >
            <Printer size={14} />
            Print Report
          </button>
        </div>
      </div>

      {/* Desktop Layout dynamic data & table rendering area */}
      <div className="w-full space-y-6">
        {/* Calculated summary cards dashboard row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          {renderSummaryCards()}
        </div>

        {/* Main ERP table display card container */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                {reportOptions.find((r) => r.id === activeReport)?.label}
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Statement period: <span className="font-mono">{dateRange.from}</span> to <span className="font-mono">{dateRange.to}</span>
              </p>
            </div>
            
            <div className="relative print:hidden">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500 w-full md:w-56 shadow-sm"
              />
            </div>
          </div>

          {/* Custom table loaders */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeReport}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.15 }}
              >
                {activeReport === "customer_purchase_outstanding" && (
                  <CustomerPurchaseOutstandingReportTable
                    data={getFilteredCustomerPurchaseOutstanding()}
                    custSortField={custSortField}
                    custSortOrder={custSortOrder}
                    onSort={(field) => {
                      if (custSortField === field) {
                        setCustSortOrder(custSortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setCustSortField(field);
                        setCustSortOrder("asc");
                      }
                    }}
                    onShareWhatsApp={handleShareWhatsApp}
                  />
                )}
                {(activeReport === "customer_sales_outstanding" || activeReport === "customer_outstanding" || activeReport === "balance_pending") && (
                  <CustomerOutstandingReportTable
                    data={getFilteredCustomerOutstanding()}
                    custSortField={custSortField}
                    custSortOrder={custSortOrder}
                    onSort={(field) => {
                      if (custSortField === field) {
                        setCustSortOrder(custSortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setCustSortField(field);
                        setCustSortOrder("asc");
                      }
                    }}
                    onShareWhatsApp={handleShareWhatsApp}
                  />
                )}
                {activeReport === "supplier_outstanding" && (
                  <SupplierOutstandingReportTable
                    data={getFilteredSupplierOutstanding()}
                    suppSortField={suppSortField}
                    suppSortOrder={suppSortOrder}
                    onSort={(field) => {
                      if (suppSortField === field) {
                        setSuppSortOrder(suppSortOrder === "asc" ? "desc" : "asc");
                      } else {
                        setSuppSortField(field);
                        setSuppSortOrder("asc");
                      }
                    }}
                  />
                )}
                {activeReport === "finance_settlement" && (
                  <FinanceSettlementReportTable
                    data={getFilteredFinanceSettlement()}
                    onShareWhatsApp={handleShareWhatsApp}
                  />
                )}
                {activeReport === "consultancy_fees" && (
                  <ConsultancyFeesReportTable
                    data={getFilteredConsultancyFees()}
                    onShareWhatsApp={handleShareWhatsApp}
                  />
                )}
                {activeReport === "sales" && <SalesReportTable deals={getFilteredDeals()} />}
                {activeReport === "purchase" && <PurchaseReportTable vehicles={getFilteredPurchases()} />}
                {activeReport === "customer" && <CustomerReportTable customersList={getFilteredCustomers()} />}
                {activeReport === "expense" && <ExpenseReportTable expensesList={getFilteredExpenses()} vehicles={vehicles} />}
                {activeReport === "inventory" && <InventoryReportTable vehicles={getFilteredPurchases()} />}
                {activeReport === "balance_pending" && <BalancePendingTable deals={getFilteredBalancePending()} onNavigate={onNavigate} />}
                {activeReport === "rc_pending" && <RCPendingTable vehicles={getFilteredRCPending()} onNavigate={onNavigate} />}
                {activeReport === "noc_pending" && <NOCPendingReportTable vehicles={getFilteredNOCPending()} onNavigate={onNavigate} />}
                {activeReport === "insurance_pending" && <InsurancePendingTable vehicles={getFilteredInsurancePending()} onNavigate={onNavigate} />}
                {activeReport === "low_stock" && <LowStockReportTable stocks={getFilteredLowStock()} />}
                {activeReport === "binding_loan" && <BindingLoanReportTable loans={getFilteredLoans()} />}
                {activeReport === "login_report" && <LoginReportTable loginReports={getFilteredLoginReports()} />}
                {activeReport === "supplier" && <SupplierReportTable suppliers={getFilteredSuppliers()} />}
                {activeReport === "area_stock" && <AreaStockReportTable areas={getAreaWiseStock()} />}
                {activeReport === "branch_stock" && <BranchStockReportTable branches={getBranchWiseStock()} />}
                {activeReport === "branch_sales" && <BranchSalesReportTable branches={getBranchWiseSales()} />}
                {activeReport === "branch_purchase" && <BranchPurchaseReportTable branches={getBranchWisePurchase()} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Dynamic BI Charts rendering zone */}
        {renderCharts()}
      </div>
    </div>
  );
}
function SalesReportTable({ deals }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice No</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {deals.length > 0 ? deals.map((row) => <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-mono font-bold text-brand-600">INV-{row.id.substring(0, 6).toUpperCase()}</td>
                <td className="py-4 font-medium">{row.date}</td>
                <td className="py-4 font-semibold text-slate-900">{row.customerName}</td>
                <td className="py-4 font-medium text-slate-800">{row.vehicleName}</td>
                <td className="py-4 text-right font-bold text-emerald-600">₹{(Number(row.totalPrice) || (Number(row.sellingPrice || 0) + Number(row.consultancyFees || 0))).toLocaleString("en-IN")}</td>
                <td className="py-4 text-right"><span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-bold rounded capitalize">{row.branch || "Headquarters"}</span></td>
              </tr>) : <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No sales invoices found</td></tr>}
        </tbody>
      </table>
    </div>;
}
function PurchaseReportTable({ vehicles }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Purchase ID</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Purchase Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Transfer Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {vehicles.length > 0 ? vehicles.map((v) => {
            const isTransferred = v.transfer_status === "Yes" || v.transferStatus === "Yes";
            return (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-mono font-bold text-blue-600">PRC-{v.id.substring(0, 6).toUpperCase()}</td>
                <td className="py-4 font-medium">{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A"}</td>
                <td className="py-4 font-semibold text-slate-800">{v.sellerName || "Direct Owner Vendor"}</td>
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4 text-right font-bold text-blue-600">₹{v.purchasePrice.toLocaleString("en-IN")}</td>
                <td className="py-4 text-center">
                  <span className={cn(
                    "px-2.5 py-0.5 text-[10px] font-black rounded uppercase border",
                    isTransferred ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {isTransferred ? "TRANSFERRED" : "NAME TRANSFER PENDING"}
                  </span>
                </td>
                <td className="py-4 text-right"><span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded capitalize">{v.branch || "Headquarters"}</span></td>
              </tr>
            );
          }) : <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No vehicles intake matching criteria</td></tr>}
        </tbody>
      </table>
    </div>;
}
function CustomerReportTable({ customersList = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer ID</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Name</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">City</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {customersList.length > 0 ? customersList.map((c) => <tr key={c.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-mono text-xs text-slate-500">CUST-{c.id.substring(0, 6).toUpperCase()}</td>
                <td className="py-4 font-bold text-slate-950">{c.name}</td>
                <td className="py-4 font-mono font-bold">{c.mobile}</td>
                <td className="py-4 text-slate-600">{c.address || "Tiruppur"}</td>
                <td className="py-4 text-right"><span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-bold rounded capitalize">{c.branch || "Salem"}</span></td>
              </tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No customer ledger records available</td></tr>}
        </tbody>
      </table>
    </div>;
}
function ExpenseReportTable({ expensesList = [], vehicles = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Expense Date</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Expense Type</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {expensesList.length > 0 ? expensesList.map((e) => {
    const matchingV = vehicles.find((v) => v.id === e.vehicleId);
    return <tr key={e.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                  <td className="py-4 font-mono text-slate-600">{e.date}</td>
                  <td className="py-4 font-bold text-slate-900">{matchingV ? matchingV.name : "General Business"}</td>
                  <td className="py-4 font-semibold text-slate-700">{e.category}</td>
                  <td className="py-4 text-right font-extrabold text-rose-600">₹{e.amount.toLocaleString("en-IN")}</td>
                  <td className="py-4 text-right"><span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded capitalize">{matchingV?.branch || "Headquarters"}</span></td>
                </tr>;
  }) : <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No expenses logged in this range</td></tr>}
        </tbody>
      </table>
    </div>;
}
function InventoryReportTable({ vehicles = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registration No</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Purchase Price</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Expenses</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Transfer Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {vehicles.length > 0 ? vehicles.map((v) => {
            const isTransferred = v.transfer_status === "Yes" || v.transferStatus === "Yes";
            return (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4 font-mono font-bold text-slate-600">{v.regNo || "N/A"}</td>
                <td className="py-4 text-right font-semibold">₹{v.purchasePrice.toLocaleString("en-IN")}</td>
                <td className="py-4 text-right text-rose-600 font-bold">₹{(v.totalExpenses || 0).toLocaleString("en-IN")}</td>
                <td className="py-4">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] uppercase font-extrabold border",
                    v.status === "Available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                  )}>
                    {v.status}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <span className={cn(
                    "px-2.5 py-0.5 text-[10px] font-black rounded uppercase border",
                    isTransferred ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {isTransferred ? "Transferred" : "Pending"}
                  </span>
                </td>
                <td className="py-4 text-right font-medium text-slate-500 capitalize">{v.branch || "Headquarters"}</td>
              </tr>
            );
          }) : <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">Zero vehicles matching selection</td></tr>}
        </tbody>
      </table>
    </div>;
}
function BalancePendingTable({ deals = [], onNavigate }) {
  const outstandingDeals = deals.filter((d) => d.type === "Sell" && d.balanceAmount > 0 && !d.isDeleted);
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Pending Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Due Date</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {outstandingDeals.length > 0 ? outstandingDeals.map((row) => <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900">{row.customerName}</td>
                <td className="py-4 font-semibold text-slate-800">{row.vehicleName}</td>
                <td className="py-4 text-right font-extrabold text-red-600">₹{row.balanceAmount.toLocaleString("en-IN")}</td>
                <td className="py-4 font-mono font-medium text-slate-600">{row.date}</td>
                <td className="py-4 text-right capitalize text-slate-500">{row.branch || "Tiruppur"}</td>
              </tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No clients have pending balances</td></tr>}
        </tbody>
      </table>
    </div>;
}
function RCPendingTable({ vehicles = [], onNavigate }) {
  const pendingRc = vehicles.filter((v) => v.rcType !== "Card" && !v.isDeleted);
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Name</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registration No</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">RC Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {pendingRc.length > 0 ? pendingRc.map((v) => <tr key={v.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-semibold text-slate-800">{v.sellerName || "Yard Owned Stock"}</td>
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4 font-mono font-bold text-slate-600">{v.regNo || "N/A"}</td>
                <td className="py-4"><span className="px-2 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 text-[10px] font-bold rounded uppercase">{v.rcType || "Paper Pending"}</span></td>
                <td className="py-4 text-right text-slate-500 capitalize">{v.branch || "Tiruppur"}</td>
              </tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">All vehicle RC documents are cleared</td></tr>}
        </tbody>
      </table>
    </div>;
}
function InsurancePendingTable({ vehicles = [], onNavigate }) {
  return <div className="overflow-x-auto text-left">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer/Seller</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle details</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Insurance Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {vehicles.length > 0 ? vehicles.map((v, i) => <tr key={v.id || i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-semibold text-slate-800">{v.sellerName || "Direct Showroom"}</td>
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4">
                  <span className="px-2 py-0.5 bg-red-50 text-red-800 border border-red-200 text-[10px] font-black rounded uppercase">PENDING / EXPIRED</span>
                </td>
                <td className="py-4 text-right text-slate-500 capitalize">{v.branch || "Tiruppur"}</td>
              </tr>) : <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">All selected vehicles currently possess valid active insurance policies</td></tr>}
        </tbody>
      </table>
    </div>;
}

function NOCPendingReportTable({ vehicles = [], onNavigate }) {
  return <div className="overflow-x-auto text-left">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer/Seller</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Details</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Registration No</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">NOC Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {vehicles.length > 0 ? vehicles.map((v) => <tr key={v.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-semibold text-slate-800">{v.sellerName || "Direct Showroom"}</td>
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4 font-mono font-bold text-slate-600">{v.regNo || "N/A"}</td>
                <td className="py-4 text-center">
                  <span className="px-2.5 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-[9px] font-black rounded uppercase">NOC PENDING</span>
                </td>
                <td className="py-4 text-right text-slate-500 capitalize">{v.branch || "Tiruppur"}</td>
              </tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">All selected vehicles possess fully cleared bank NOCs</td></tr>}
        </tbody>
      </table>
    </div>;
}

function LowStockReportTable({ stocks = [] }) {
  return <div className="overflow-x-auto text-left">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle Type</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Brand</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Model</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Available Stock</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Total Registered</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Stock status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {stocks.length > 0 ? stocks.map((row, i) => {
            const isZero = row.availStock === 0;
            return <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-semibold text-slate-600">{row.vehicleType}</td>
                <td className="py-2.5">
                  <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-bold rounded uppercase">{row.brand}</span>
                </td>
                <td className="py-4 font-bold text-slate-900">{row.model}</td>
                <td className="py-4 text-center font-extrabold text-rose-600">{row.availStock} left</td>
                <td className="py-4 text-center font-medium text-slate-500">{row.totalStock} Units</td>
                <td className="py-4 text-center">
                  <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${
                    isZero ? "bg-red-50 text-red-700 border-red-200" : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>{isZero ? "CRITICAL OUT" : "LOW STOCK WARNING"}</span>
                </td>
                <td className="py-4 text-right text-slate-500 capitalize">{row.branch}</td>
              </tr>;
          }) : <tr><td colSpan={7} className="py-8 text-center text-slate-400 text-sm">No models currently flagging as low stock</td></tr>}
        </tbody>
      </table>
    </div>;
}
function BindingLoanReportTable({ loans = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Loan ID</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Finance Name</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Loan Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Paid Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Balance Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loans.length > 0 ? loans.map((row) => {
    const isClosed = row.dueAmount <= 0;
    return <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                  <td className="py-4 font-mono font-bold text-brand-600">{row.id}</td>
                  <td className="py-4 font-bold text-slate-900">{row.customerName || "Walk-in Client"}</td>
                  <td className="py-4 font-medium text-slate-500">{row.vehicleDetails || "Hero Splendor"}</td>
                  <td className="py-4 font-bold text-indigo-900">{row.financeName || "Coimbatore Private Finance"}</td>
                  <td className="py-4 text-right font-bold text-slate-700">₹{row.takenAmount?.toLocaleString("en-IN") || "\u20B995,000"}</td>
                  <td className="py-4 text-right font-bold text-emerald-600">₹{(row.takenAmount - row.dueAmount)?.toLocaleString("en-IN") || "\u20B90"}</td>
                  <td className="py-4 text-right font-bold text-rose-600">₹{row.dueAmount?.toLocaleString("en-IN") || "\u20B995,000"}</td>
                  <td className="py-2.5 text-center">
                    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border",
      isClosed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"
    )}>{isClosed ? "Paid Closed" : "Loan Active"}</span>
                  </td>
                </tr>;
  }) : <tr><td colSpan={8} className="py-8 text-center text-slate-400 text-sm">No binding loans found</td></tr>}
        </tbody>
      </table>
    </div>;
}
function SupplierReportTable({ suppliers = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier ID</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Supplier Name</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">City</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {suppliers.length > 0 ? suppliers.map((s, i) => <tr key={s.id || i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-mono text-xs text-slate-500">SPL-{s.id?.substring(0, 6).toUpperCase() || "SUP781"}</td>
                <td className="py-4 font-bold text-slate-900">{s.name}</td>
                <td className="py-4 font-mono font-bold">{s.mobile || "9944778120"}</td>
                <td className="py-4 text-slate-600">{s.city || "Tamil Nadu"}</td>
                <td className="py-4 text-right"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold rounded uppercase">{s.branch || "Salem"}</span></td>
              </tr>) : <tr><td colSpan={5} className="py-8 text-center text-slate-400 text-sm">No supplier listings currently registered</td></tr>}
        </tbody>
      </table>
    </div>;
}
function AreaStockReportTable({ areas = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Area</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Total Vehicles</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Available Stock</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Sold Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {areas.length > 0 ? areas.map((a, i) => <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900 flex items-center gap-1.5"><MapPin size={13} className="text-emerald-600" /> {a.area}</td>
                <td className="py-4 text-center font-mono font-bold text-slate-500">{a.total} Units</td>
                <td className="py-4 text-center font-mono font-bold text-emerald-600">{a.available} Available</td>
                <td className="py-4 text-center font-mono font-bold text-slate-450">{a.sold} Sold</td>
              </tr>) : <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No areas mapped with vehicle configurations</td></tr>}
        </tbody>
      </table>
    </div>;
}
function BranchStockReportTable({ branches = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Branch</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Available Vehicles</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Sold Vehicles</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Total Stock</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {branches.length > 0 ? branches.map((b, i) => <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900 flex items-center gap-1.5"><Building size={13} className="text-brand-600" /> {b.branch}</td>
                <td className="py-4 text-center font-mono font-semibold text-emerald-600">{b.available} Available</td>
                <td className="py-4 text-center font-mono font-medium text-slate-500">{b.sold} Sold</td>
                <td className="py-4 text-right font-extrabold text-indigo-950 font-mono">{b.total} Yards Unit</td>
              </tr>) : <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No yards report for branches</td></tr>}
        </tbody>
      </table>
    </div>;
}
function BranchSalesReportTable({ branches = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Branch</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Sales Count</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Sales Amount</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Profit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {branches.length > 0 ? branches.map((b, i) => <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900 flex items-center gap-1.5"><Building size={13} className="text-violet-600" /> {b.branch}</td>
                <td className="py-4 text-center font-mono font-bold text-indigo-950">{b.count} Sales</td>
                <td className="py-4 text-right font-extrabold text-slate-900">₹{b.amount.toLocaleString("en-IN")}</td>
                <td className="py-4 text-right font-bold text-emerald-600">₹{b.profit.toLocaleString("en-IN")}</td>
              </tr>) : <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">No branch sales recorded</td></tr>}
        </tbody>
      </table>
    </div>;
}
function BranchPurchaseReportTable({ branches = [] }) {
  return <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Branch</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Purchase Count</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Purchase Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {branches.length > 0 ? branches.map((b, i) => <tr key={i} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900 flex items-center gap-1.5"><Building size={13} className="text-orange-600" /> {b.branch}</td>
                <td className="py-4 text-center font-mono font-bold text-orange-900">{b.count} Procured</td>
                <td className="py-4 text-right font-bold text-blue-600">₹{b.amount.toLocaleString("en-IN")}</td>
              </tr>) : <tr><td colSpan={3} className="py-8 text-center text-slate-400 text-sm">No purchases logs for branches</td></tr>}
        </tbody>
      </table>
    </div>;
}

function LoginReportTable({ loginReports = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User Name</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Branch</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Login Date</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Login Time</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Logout Time</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Session Duration</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">IP Address</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loginReports.length > 0 ? (
            loginReports.map((row) => {
              const uName = row.username || "Unknown";
              const uRole = row.role || "Staff";
              const brName = row.branch_id || row.branch || "Headquarters";
              const lDate = row.login_date || row.loginDate || "N/A";
              const lTime = row.login_time || row.loginTime || "N/A";
              const oTime = row.logout_time || row.logoutTime || "";
              const duration = row.session_duration || row.sessionDuration || "Active";
              const ip = row.ip_address || row.ipAddress || "127.0.0.1";
              const status = row.status || (oTime ? "Logged Out" : "Active");

              return (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm animate-fade-in">
                  <td className="py-4 font-semibold text-slate-900">{uName}</td>
                  <td className="py-4 font-medium text-slate-600">
                    <span className={cn(
                      "px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase border",
                      uRole === "Super Admin" || uRole === "Admin"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : uRole === "Branch Admin"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {uRole}
                    </span>
                  </td>
                  <td className="py-4 font-medium text-slate-600">
                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[10px] font-bold rounded capitalize">
                      {brName}
                    </span>
                  </td>
                  <td className="py-4 font-medium text-slate-600">{lDate}</td>
                  <td className="py-4 font-mono text-xs text-slate-500">{lTime}</td>
                  <td className="py-4 font-mono text-xs text-slate-500">
                    {oTime ? (
                      oTime
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Session
                      </span>
                    )}
                  </td>
                  <td className="py-4 font-extrabold text-slate-800 font-mono">{duration}</td>
                  <td className="py-4 font-mono text-xs text-slate-500">{ip}</td>
                  <td className="py-4 text-right">
                    <span className={cn(
                      "px-2.5 py-1 text-[10px] font-black rounded-full uppercase border",
                      status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : status === "Logged Out"
                          ? "bg-slate-50 text-slate-700 border-slate-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {status}
                    </span>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                No login activities found matching requirements
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CustomerOutstandingReportTable({
  data = [],
  custSortField,
  custSortOrder,
  onSort,
  onShareWhatsApp
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th onClick={() => onSort("customerName")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Customer Name {custSortField === "customerName" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
            <th onClick={() => onSort("vehicleNumber")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Vehicle {custSortField === "vehicleNumber" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("invoiceNumber")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Sale Inv No {custSortField === "invoiceNumber" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("totalInvoiceAmount")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800">
              Sale Price {custSortField === "totalInvoiceAmount" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("advancePaid")} className="py-3 px-3 text-xs font-bold text-emerald-700 uppercase tracking-wider text-right cursor-pointer hover:text-emerald-900">
              Advance Paid {custSortField === "advancePaid" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("amountReceived")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800">
              Receipts Paid {custSortField === "amountReceived" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("outstandingAmount")} className="py-3 px-3 text-xs font-bold text-rose-700 uppercase tracking-wider text-right cursor-pointer hover:text-rose-900">
              Net Sales Outstanding {custSortField === "outstandingAmount" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("status")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-slate-800">
              Status {custSortField === "status" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:hidden">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-xs">
                <td className="py-3.5 px-3 font-bold text-slate-900">{row.customerName}</td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.mobile}</td>
                <td className="py-3.5 px-3 font-semibold text-slate-800">{row.vehicleNumber}</td>
                <td className="py-3.5 px-3 font-mono font-bold text-indigo-700">{row.invoiceNumber}</td>
                <td className="py-3.5 px-3 font-bold text-slate-900 text-right">₹{(Number(row.totalInvoiceAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-emerald-600 text-right">₹{(Number(row.advancePaid) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-blue-600 text-right">₹{(Number(row.amountReceived) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-extrabold text-rose-700 text-right font-mono bg-rose-50/50">
                  ₹{(Number(row.outstandingAmount) || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-full uppercase border",
                    row.status === "Paid" || row.status === "Fully Paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : row.status === "Partially Paid"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right print:hidden">
                  <button
                    type="button"
                    onClick={() => onShareWhatsApp && onShareWhatsApp(row)}
                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                    title="Share WhatsApp Reminder"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                No customer sales outstanding records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function SupplierOutstandingReportTable({
  data = [],
  suppSortField,
  suppSortOrder,
  onSort
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th onClick={() => onSort("supplierName")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Supplier Name {suppSortField === "supplierName" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</th>
            <th onClick={() => onSort("purchaseInvoiceNumber")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Purchase Inv No {suppSortField === "purchaseInvoiceNumber" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("purchaseDate")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Purchase Date {suppSortField === "purchaseDate" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("totalPurchaseAmount")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800">
              Total Purchase Amt {suppSortField === "totalPurchaseAmount" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("amountPaid")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800">
              Amount Paid {suppSortField === "amountPaid" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("outstandingAmount")} className="py-3 px-3 text-xs font-bold text-rose-700 uppercase tracking-wider text-right cursor-pointer hover:text-rose-900">
              Outstanding {suppSortField === "outstandingAmount" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("dueDate")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Due Date {suppSortField === "dueDate" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("overdueDays")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-slate-800">
              Overdue Days {suppSortField === "overdueDays" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("status")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-slate-800">
              Status {suppSortField === "status" && (suppSortOrder === "asc" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-xs">
                <td className="py-3.5 px-3 font-bold text-slate-900">{row.supplierName}</td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.mobile}</td>
                <td className="py-3.5 px-3 font-mono font-bold text-blue-700">{row.purchaseInvoiceNumber}</td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.purchaseDate}</td>
                <td className="py-3.5 px-3 font-bold text-slate-900 text-right">₹{(Number(row.totalPurchaseAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-emerald-600 text-right">₹{(Number(row.amountPaid) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-extrabold text-rose-700 text-right font-mono bg-rose-50/50">
                  ₹{(Number(row.outstandingAmount) || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.dueDate}</td>
                <td className="py-3.5 px-3 text-center">
                  {row.overdueDays > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                      {row.overdueDays} Days
                    </span>
                  ) : (
                    <span className="text-slate-400 font-mono">0</span>
                  )}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-full uppercase border",
                    row.status === "Paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : row.status === "Partially Paid"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                No supplier outstanding records found matching selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function CustomerPurchaseOutstandingReportTable({
  data = [],
  custSortField,
  custSortOrder,
  onSort,
  onShareWhatsApp
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th onClick={() => onSort("customerName")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Customer Name {custSortField === "customerName" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</th>
            <th onClick={() => onSort("vehicleNumber")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Vehicle Number {custSortField === "vehicleNumber" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("purchaseInvoiceNumber")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Purchase Inv No {custSortField === "purchaseInvoiceNumber" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("purchaseDate")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-slate-800">
              Purchase Date {custSortField === "purchaseDate" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("totalPurchaseAmount")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800">
              Purchase Amount {custSortField === "totalPurchaseAmount" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
              Advance Paid
            </th>
            <th onClick={() => onSort("amountPaid")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right cursor-pointer hover:text-slate-800">
              Total Paid {custSortField === "amountPaid" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th onClick={() => onSort("outstandingAmount")} className="py-3 px-3 text-xs font-bold text-amber-700 uppercase tracking-wider text-right cursor-pointer hover:text-amber-900">
              Outstanding {custSortField === "outstandingAmount" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              Last Payment Date
            </th>
            <th onClick={() => onSort("status")} className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center cursor-pointer hover:text-slate-800">
              Status {custSortField === "status" && (custSortOrder === "asc" ? "↑" : "↓")}
            </th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:hidden">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-xs">
                <td className="py-3.5 px-3 font-bold text-slate-900">{row.customerName}</td>
                <td className="py-3.5 px-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${row.partyRole === "Buyer" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                    {row.partyRole}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.mobile}</td>
                <td className="py-3.5 px-3 font-semibold text-slate-800">{row.vehicleNumber}</td>
                <td className="py-3.5 px-3 font-mono font-bold text-amber-700">{row.purchaseInvoiceNumber}</td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.purchaseDate}</td>
                <td className="py-3.5 px-3 font-bold text-slate-900 text-right">₹{(Number(row.totalPurchaseAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-slate-600 text-right">₹{(Number(row.advancePaid) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-emerald-600 text-right">₹{(Number(row.amountPaid) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-extrabold text-amber-700 text-right font-mono bg-amber-50/50">
                  ₹{(Number(row.outstandingAmount) || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.lastPaymentDate}</td>
                <td className="py-3.5 px-3 text-center">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-full uppercase border",
                    row.status === "Paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : row.status === "Partially Paid"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right print:hidden">
                  <button
                    type="button"
                    onClick={() => onShareWhatsApp(row)}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                    title="Send WhatsApp Payment Reminder"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={12} className="py-8 text-center text-slate-400 text-sm">
                No customer purchase outstanding records found matching selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ConsultancyFeesReportTable({ data = [], onShareWhatsApp }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Consultancy Amount</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">GST</th>
            <th className="py-3 px-3 text-xs font-bold text-emerald-600 uppercase tracking-wider text-right">Received Amount</th>
            <th className="py-3 px-3 text-xs font-bold text-rose-600 uppercase tracking-wider text-right">Balance Amount</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Payment Status</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Date</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right print:hidden">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-xs">
                <td className="py-3.5 px-3 font-bold text-slate-900">
                  <div>{row.customerName}</div>
                  <div className="text-[10px] text-slate-400 font-normal font-mono">{row.mobile}</div>
                </td>
                <td className="py-3.5 px-3 font-semibold text-slate-800">{row.vehicle}</td>
                <td className="py-3.5 px-3 font-bold text-slate-900 text-right">₹{(Number(row.consultancyAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-semibold text-slate-600 text-right">₹{(Number(row.gst) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-emerald-600 text-right">₹{(Number(row.receivedAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-extrabold text-rose-600 text-right font-mono bg-rose-50/50">
                  ₹{(Number(row.pendingAmount) || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-full uppercase border",
                    row.status === "Paid"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : row.status === "Partially Paid"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {row.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.paymentDate || "N/A"}</td>
                <td className="py-3.5 px-3 text-slate-500 max-w-[160px] truncate" title={row.remarks}>{row.remarks || "—"}</td>
                <td className="py-3.5 px-3 text-right print:hidden">
                  <button
                    type="button"
                    onClick={() => onShareWhatsApp(row)}
                    className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                    title="Send WhatsApp Reminders"
                  >
                    <MessageCircle size={12} />
                    WhatsApp
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                No consultancy fee records found matching selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FinanceSettlementReportTable({ data = [], onShareWhatsApp }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/70">
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Finance Institution</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Ref No</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice Date</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Price</th>
            <th className="py-3 px-3 text-xs font-bold text-indigo-600 uppercase tracking-wider text-right">Finance Amount</th>
            <th className="py-3 px-3 text-xs font-bold text-emerald-600 uppercase tracking-wider text-right">Disbursed</th>
            <th className="py-3 px-3 text-xs font-bold text-rose-600 uppercase tracking-wider text-right">Pending</th>
            <th className="py-3 px-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.length > 0 ? (
            data.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-xs">
                <td className="py-3.5 px-3 font-bold text-slate-900">
                  <div>{row.customerName}</div>
                  <div className="text-[10px] text-slate-400 font-normal font-mono">{row.mobile}</div>
                </td>
                <td className="py-3.5 px-3 font-semibold text-slate-800">{row.vehicleNumber}</td>
                <td className="py-3.5 px-3 font-bold text-purple-700">{row.financeName}</td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.financeRef}</td>
                <td className="py-3.5 px-3 font-mono text-slate-600">{row.invoiceDate}</td>
                <td className="py-3.5 px-3 font-bold text-slate-900 text-right">₹{(Number(row.totalAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-indigo-600 text-right">₹{(Number(row.financeAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-bold text-emerald-600 text-right">₹{(Number(row.disbursedAmount) || 0).toLocaleString("en-IN")}</td>
                <td className="py-3.5 px-3 font-extrabold text-rose-600 text-right font-mono bg-rose-50/50">
                  ₹{(Number(row.pendingDisbursement) || 0).toLocaleString("en-IN")}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-black rounded-full uppercase border",
                    row.pendingDisbursement === 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : row.disbursedAmount > 0
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={10} className="py-8 text-center text-slate-400 text-sm">
                No finance settlement records found matching selected criteria
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
