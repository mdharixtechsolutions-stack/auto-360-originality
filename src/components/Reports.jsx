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
  AlertTriangle as Warning
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
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
  initialReport,
  onNavigate,
  currentUser,
  selectedBranch = "all"
}) {
  const [activeReport, setActiveReport] = useState(initialReport || "sales");
  
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

  const [selectedBranchFilter, setSelectedBranchFilter] = useState("all");
  const [selectedUserFilter, setSelectedUserFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");

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
  const [suppliers, setSuppliers] = useState([]);
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
      setSuppliers(mapped);
    }).catch((err) => {
      console.error(err);
      setSuppliers([]);
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
    { id: "sales", label: "Sales Report", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "purchase", label: "Purchase Report", icon: Car, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "customer", label: "Customer Report", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { id: "expense", label: "Expense Report", icon: IndianRupee, color: "text-rose-600", bg: "bg-rose-50" },
    { id: "inventory", label: "Inventory Report", icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
    { id: "balance_pending", label: "Balance Pending", icon: Clock, color: "font-bold text-red-600", bg: "bg-red-50" },
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
        "sales",
        "purchase",
        "customer",
        "expense",
        "inventory",
        "balance_pending",
        "rc_pending",
        "noc_pending",
        "insurance_pending",
        "low_stock",
        "area_stock"
      ].includes(opt.id);
    }
    if (role === "Staff" || role === "Sales") {
      return ["sales", "customer", "inventory", "balance_pending"].includes(opt.id);
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
      const branchName = v.branch || "Coimbatore";

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
      if (v.status === "Available") {
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
      if (v.status === "Available") {
        counts[area].available += 1;
      } else if (v.status === "Sold") {
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
    const yards = branches.length > 0 ? branches.map((b) => b.name) : ["Coimbatore", "Salem", "Erode", "Chennai"];
    yards.forEach((y) => {
      counts[y] = { total: 0, available: 0, sold: 0 };
    });
    vehicles.forEach((v) => {
      if (v.isDeleted) return;
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return;
      if (brandFilter !== "All" && v.brand !== brandFilter) return;
      const key = v.branch || "Coimbatore";
      if (!counts[key]) {
        counts[key] = { total: 0, available: 0, sold: 0 };
      }
      counts[key].total += 1;
      if (v.status === "Available") counts[key].available += 1;
      if (v.status === "Sold") counts[key].sold += 1;
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
      const key = d.branch || "Coimbatore";
      if (!counts[key]) counts[key] = { count: 0, amount: 0, profit: 0 };
      counts[key].count += 1;
      counts[key].amount += d.totalPrice || 0;
      const margin = d.totalPrice - (d.purchasePrice + (d.expenses || 0));
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
      const key = v.branch || "Coimbatore";
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
      case "sales":
        headers = ["Invoice No", "Date", "Customer", "Vehicle", "Amount", "Branch"];
        rows = getFilteredDeals().map((d) => [`INV-${d.id.substring(0, 6).toUpperCase()}`, d.date, d.customerName, d.vehicleName, d.totalPrice, d.branch || "Headquarters"]);
        break;
      case "purchase":
        headers = ["Purchase ID", "Date", "Supplier", "Vehicle", "Purchase Amount", "Branch"];
        rows = getFilteredPurchases().map((v) => [`PRC-${v.id.substring(0, 6).toUpperCase()}`, v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A", v.sellerName || "Direct Vendor", v.name, v.purchasePrice, v.branch || "Coimbatore"]);
        break;
      case "customer":
        headers = ["Customer ID", "Customer Name", "Mobile", "City", "Branch"];
        rows = getFilteredCustomers().map((c) => [c.id.substring(0, 6).toUpperCase(), c.name, c.mobile, c.address || "N/A", c.branch || "Coimbatore"]);
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
        rows = getFilteredPurchases().map((v) => [v.name, v.regNo, v.purchasePrice, v.totalExpenses || 0, v.status, v.branch || "Coimbatore"]);
        break;
      case "balance_pending":
        headers = ["Customer", "Vehicle", "Pending Amount", "Due Date", "Branch"];
        rows = getFilteredBalancePending().map((d) => [d.customerName, d.vehicleName, d.balanceAmount, d.date, d.branch || "Coimbatore"]);
        break;
      case "rc_pending":
        headers = ["Customer", "Vehicle", "Registration No", "RC Status", "Branch"];
        rows = getFilteredRCPending().map((v) => {
          const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
          return [matchedDeal?.customerName || "In Yard Stock", v.name, v.regNo, v.rcType || "Paper Pending", v.branch || "Coimbatore"];
        });
        break;
      case "insurance_pending":
        headers = ["Customer", "Vehicle", "Insurance Expiry", "Days Remaining", "Branch"];
        rows = getFilteredInsurancePending().map((v) => {
          const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
          return [matchedDeal?.customerName || "In Stock", v.name, "Expired/None", "0 Days", v.branch || "Coimbatore"];
        });
        break;
      case "low_stock":
        headers = ["Vehicle Type", "Brand", "Model", "Available Stock", "Total Stock", "Branch"];
        rows = getFilteredLowStock().map((l) => [l.vehicleType, l.brand, l.model, l.availStock, l.totalStock, l.branch]);
        break;
      case "noc_pending":
        headers = ["Seller/Customer", "Vehicle", "Registration No", "NOC Status", "Branch"];
        rows = getFilteredNOCPending().map((v) => [v.sellerName || "Direct Showroom", v.name, v.regNo || "N/A", "NOC PENDING", v.branch || "Coimbatore"]);
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
    link.setAttribute("download", `AUTO360_ERP_Report_${activeReport}_${dateRange.from}_to_${dateRange.to}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica");
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("AUTO360 ERP SOFTWARE STATEMENT", 14, 20);
      const rLabel = reportOptions.find((r) => r.id === activeReport)?.label.toUpperCase();
      doc.setFontSize(13);
      doc.setTextColor(79, 70, 229);
      doc.text(`REPORT CATEGORY: ${rLabel}`, 14, 28);
      doc.setFontSize(9);
      doc.setTextColor(115, 115, 115);
      doc.text(`Branch Scope: ${selectedBranchFilter === "all" ? "All Active Branches" : selectedBranchFilter.toUpperCase()}`, 14, 35);
      doc.text(`Timeline: ${dateRange.from} to ${dateRange.to}`, 14, 41);
      doc.text(`Generated By: ${currentUser?.name || "Administrator"} on ${(/* @__PURE__ */ new Date()).toLocaleString()}`, 14, 47);
      let headers = [];
      let rows = [];
      switch (activeReport) {
        case "sales":
          headers = ["Invoice No", "Date", "Customer Name", "Vehicle", "Amount", "Branch"];
          rows = getFilteredDeals().map((d) => [`INV-${d.id.substring(0, 6).toUpperCase()}`, d.date, d.customerName, d.vehicleName, `INR ${d.totalPrice.toLocaleString("en-IN")}`, d.branch || "Coimbatore"]);
          break;
        case "purchase":
          headers = ["Purchase ID", "Date", "Supplier", "Vehicle", "Amount", "Branch"];
          rows = getFilteredPurchases().map((v) => [`PRC-${v.id.substring(0, 6).toUpperCase()}`, v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A", v.sellerName || "Direct Vendor", v.name, `INR ${v.purchasePrice.toLocaleString("en-IN")}`, v.branch || "Salem"]);
          break;
        case "customer":
          headers = ["Customer ID", "Customer Name", "Mobile", "City", "Branch"];
          rows = getFilteredCustomers().map((c) => [c.id.substring(0, 6).toUpperCase(), c.name, c.mobile, c.address || "N/A", c.branch || "Salem"]);
          break;
        case "expense":
          headers = ["Date", "Vehicle Context", "Type", "Amount", "Branch"];
          rows = getFilteredExpenses().map((e) => {
            const subV = vehicles.find((v) => v.id === e.vehicleId);
            return [e.date, subV ? subV.name : "Business Operation", e.category, `INR ${e.amount.toLocaleString("en-IN")}`, subV?.branch || "Headquarters"];
          });
          break;
        case "inventory":
          headers = ["Vehicle", "Reg No", "Reg / Type", "Status", "Cost", "Branch"];
          rows = getFilteredPurchases().map((v) => [v.name, v.regNo, v.vehicleType, v.status, `INR ${v.purchasePrice.toLocaleString("en-IN")}`, v.branch || "Coimbatore"]);
          break;
        case "balance_pending":
          headers = ["Customer Name", "Vehicle Contract", "Pending Amount", "Due Date", "Branch"];
          rows = getFilteredBalancePending().map((d) => [d.customerName, d.vehicleName, `INR ${d.balanceAmount.toLocaleString("en-IN")}`, d.date, d.branch || "Salem"]);
          break;
        case "rc_pending":
          headers = ["Customer", "Purchased Vehicle", "Registration No", "RC Status", "Branch"];
          rows = getFilteredRCPending().map((v) => {
            const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
            return [matchedDeal?.customerName || "In Stock", v.name, v.regNo, v.rcType || "Paper", v.branch || "Coimbatore"];
          });
          break;
        case "insurance_pending":
          headers = ["Customer", "Vehicle", "Insurance Expiry", "Days Remaining", "Branch"];
          rows = getFilteredInsurancePending().map((v) => {
            const matchedDeal = deals.find((d) => d.vehicleId === v.id && d.type === "Sell");
            return [matchedDeal?.customerName || "In Yard", v.name, "Expired/None", "0 Days", v.branch || "Coimbatore"];
          });
          break;
        case "low_stock":
          headers = ["Vehicle Type", "Brand", "Model", "Available Stock", "Total Stock", "Branch"];
          rows = getFilteredLowStock().map((l) => [l.vehicleType, l.brand, l.model, String(l.availStock), String(l.totalStock), l.branch]);
          break;
        case "noc_pending":
          headers = ["Customer", "Vehicle", "Registration No", "NOC Status", "Branch"];
          rows = getFilteredNOCPending().map((v) => [v.sellerName || "Direct Showroom", v.name, v.regNo || "N/A", "NOC PENDING", v.branch || "Coimbatore"]);
          break;
        case "binding_loan":
          headers = ["Loan ID", "Customer name", "Vehicle details", "Lender Name", "Loan Amt", "Outstanding"];
          rows = getFilteredLoans().map((l) => [l.id, l.customerName || "Direct", l.vehicleDetails, l.financeName || "SFC", `INR ${l.takenAmount.toLocaleString("en-IN")}`, `INR ${l.dueAmount.toLocaleString("en-IN")}`]);
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
          rows = getFilteredSuppliers().map((s) => [s.id.substring(0, 6).toUpperCase(), s.name, s.mobile, s.city || "Tamil Nadu", s.branch || "Salem"]);
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
          rows = getBranchWiseSales().map((b) => [b.branch, b.count, `INR ${b.amount.toLocaleString("en-IN")}`, `INR ${b.profit.toLocaleString("en-IN")}`]);
          break;
        case "branch_purchase":
          headers = ["Branch Name", "Inbound procure count", "Total capital outlays"];
          rows = getBranchWisePurchase().map((b) => [b.branch, b.count, `INR ${b.amount.toLocaleString("en-IN")}`]);
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
      doc.save(`AUTO360_${activeReport}_Report_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf`);
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
        const availableCount = vehicles.filter((v) => v.status === "Available" && matchesBranch(v.branch)).length;
        const soldCount = vehicles.filter((v) => v.status === "Sold" && matchesBranch(v.branch)).length;
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
            <TrendingUp size={24} className="text-brand-600" /> Auto360 ERP Business Intelligence
          </h2>
          <p className="text-sm text-slate-500">Live dynamic workspace reporting, auditing & cross-branch ledger statements</p>
        </div>
        <div className="text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl uppercase tracking-widest self-start sm:self-center">
          ERP Live Mode
        </div>
      </div>

      {/* Place Filters at the top of the page */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm print:hidden text-left space-y-4">
        <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1">
          Report Parameters & Filters
        </h3>
        
        {/* Row 1: From Date | To Date | GO Button */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Date</label>
            <input
              type="date"
              value={localFrom}
              onChange={(e) => setLocalFrom(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Date</label>
            <input
              type="date"
              value={localTo}
              onChange={(e) => setLocalTo(e.target.value)}
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
                <option value="Coimbatore">Coimbatore</option>
                <option value="Salem">Salem</option>
                <option value="Erode">Erode</option>
                <option value="Chennai">Chennai</option>
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
                <td className="py-4 text-right font-bold text-emerald-600">₹{row.totalPrice.toLocaleString("en-IN")}</td>
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
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {vehicles.length > 0 ? vehicles.map((v) => <tr key={v.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-mono font-bold text-blue-600">PRC-{v.id.substring(0, 6).toUpperCase()}</td>
                <td className="py-4 font-medium">{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : "N/A"}</td>
                <td className="py-4 font-semibold text-slate-800">{v.sellerName || "Direct Owner Vendor"}</td>
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4 text-right font-bold text-blue-600">₹{v.purchasePrice.toLocaleString("en-IN")}</td>
                <td className="py-4 text-right"><span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded capitalize">{v.branch || "Headquarters"}</span></td>
              </tr>) : <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">No vehicles intake matching criteria</td></tr>}
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
                <td className="py-4 text-slate-600">{c.address || "Coimbatore"}</td>
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
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
            <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Branch</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {vehicles.length > 0 ? vehicles.map((v) => <tr key={v.id} className="hover:bg-slate-50 transition-colors text-slate-700 text-sm">
                <td className="py-4 font-bold text-slate-900">{v.name}</td>
                <td className="py-4 font-mono font-bold text-slate-600">{v.regNo || "N/A"}</td>
                <td className="py-4 text-right font-semibold">₹{v.purchasePrice.toLocaleString("en-IN")}</td>
                <td className="py-4 text-right text-rose-600 font-bold">₹{(v.totalExpenses || 0).toLocaleString("en-IN")}</td>
                <td className="py-4"><span className={cn(
    "px-2 py-0.5 rounded text-[10px] uppercase font-extrabold border",
    v.status === "Available" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
  )}>{v.status}</span></td>
                <td className="py-4 text-right font-medium text-slate-500 capitalize">{v.branch || "Headquarters"}</td>
              </tr>) : <tr><td colSpan={6} className="py-8 text-center text-slate-400 text-sm">Zero vehicles matching selection</td></tr>}
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
                <td className="py-4 text-right capitalize text-slate-500">{row.branch || "Coimbatore"}</td>
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
                <td className="py-4 text-right text-slate-500 capitalize">{v.branch || "Coimbatore"}</td>
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
                <td className="py-4 text-right text-slate-500 capitalize">{v.branch || "Coimbatore"}</td>
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
                <td className="py-4 text-right text-slate-500 capitalize">{v.branch || "Coimbatore"}</td>
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
