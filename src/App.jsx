import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  Car,
  Handshake,
  CreditCard,
  TrendingDown,
  BarChart3,
  Settings,
  CalendarClock,
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  ChevronDown,
  FileText,
  Layers,
  MapPin,
  Shield,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "./lib/utils";
import { hasModulePermission } from "./lib/permissions";
import { useLanguage } from "./localization/LanguageContext";
import Dashboard from "./components/Dashboard";
import Customers from "./components/Customers";
import Purchase from "./components/Purchase";
import Sales from "./components/Sales";
import Expenses from "./components/Expenses";
import Accounts from "./components/Accounts";
import Reports from "./components/Reports";
import Staff from "./components/Staff";
import FollowUps from "./components/FollowUps";
import SettingsView from "./components/Settings";
import Login from "./components/Login";
import Binding from "./components/Binding";
import Masters from "./components/Masters";
import AdminConsole from "./components/AdminConsole";
import { Payments } from "./components/Payments";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import StockSearch from "./components/StockSearch";
import axios from "axios";
const LOGO_URL = "https://raw.githubusercontent.com/stackblitz/stackblitz-images/main/auto360-logo.png";

// Intercept all native fetch calls to securely inject role, branch and admin headers on client-side requests
const originalFetch = window.fetch;
try {
  Object.defineProperty(window, "fetch", {
    value: async function (url, options = {}) {
      let requestUrl = "";
      if (typeof url === "string") {
        requestUrl = url;
      } else if (url && typeof url === "object" && url.url) {
        requestUrl = url.url;
      }
      
      const isLocal = requestUrl && (
        !requestUrl.startsWith("http://") && !requestUrl.startsWith("https://") ||
        requestUrl.startsWith(window.location.origin) ||
        requestUrl.startsWith("/")
      );

      if (isLocal) {
        const currentUserStr = localStorage.getItem("currentUser");
        const adminToken = localStorage.getItem("adminToken") || "";
        const customHeaders = {
          ...(adminToken ? { "x-admin-token": adminToken } : {})
        };
        if (currentUserStr) {
          try {
            const user = JSON.parse(currentUserStr);
            customHeaders["x-user-id"] = user.id || "";
            customHeaders["x-user-role"] = user.role || "";
            customHeaders["x-user-branch"] = user.branch || "";
          } catch (e) {
            console.warn("Failed to parse currentUser for fetch interceptor Headers", e);
          }
        }
        if (options.headers) {
          if (options.headers instanceof Headers) {
            Object.keys(customHeaders).forEach((key) => {
              options.headers.set(key, customHeaders[key]);
            });
          } else if (Array.isArray(options.headers)) {
            Object.keys(customHeaders).forEach((key) => {
              options.headers.push([key, customHeaders[key]]);
            });
          } else {
            options.headers = {
              ...options.headers,
              ...customHeaders
            };
          }
        } else {
          options.headers = customHeaders;
        }
      }
      return originalFetch(url, options);
    },
    writable: true,
    configurable: true
  });
} catch (e) {
  console.warn("Could not redefine window.fetch with Object.defineProperty", e);
}
const initialVehicles = [];
const MOCK_USERS = [
  {
    id: "S-1",
    name: "John Super Admin",
    username: "admin",
    email: "john@auto360.com",
    mobile: "9876543210",
    role: "Super Admin",
    branch: "Coimbatore",
    isActive: true,
    loginTimeFrom: "00:00",
    loginTimeTo: "23:59",
    permissions: ["dashboard", "customers", "purchase", "binding", "sales", "expenses", "accounts", "followups", "reports", "users", "settings", "masters"],
    createdBy: "system",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isDeleted: false
  },
  {
    id: "S-2",
    name: "Sarah Branch Admin",
    username: "branchadmin",
    email: "sarah@auto360.com",
    mobile: "9876543211",
    role: "Branch Admin",
    branch: "Salem",
    isActive: true,
    loginTimeFrom: "00:00",
    loginTimeTo: "23:59",
    permissions: ["dashboard", "customers", "purchase", "binding", "sales", "expenses", "accounts", "followups", "reports", "masters"],
    createdBy: "system",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isDeleted: false
  },
  {
    id: "S-3",
    name: "Mike Manager",
    username: "manager",
    email: "mike@auto360.com",
    mobile: "9876543212",
    role: "Manager",
    branch: "Erode",
    isActive: true,
    loginTimeFrom: "09:00",
    loginTimeTo: "18:00",
    permissions: ["dashboard", "customers", "purchase", "binding", "sales", "followups", "reports"],
    createdBy: "system",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isDeleted: false
  },
  {
    id: "S-4",
    name: "Ravi Staff-Sales",
    username: "sales",
    email: "ravi@auto360.com",
    mobile: "9876543213",
    role: "Staff",
    branch: "Coimbatore",
    isActive: true,
    loginTimeFrom: "09:00",
    loginTimeTo: "18:00",
    permissions: ["dashboard", "customers", "followups", "sales"],
    createdBy: "system",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    isDeleted: false
  }
];
export default function App() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [navigationState, setNavigationState] = useState({});
  
  const [expandedMenus, setExpandedMenus] = useState({
    masters: false,
    accounts: false,
    reports: false,
    settings: false
  });
  const toggleMenu = (menuId) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };
  const [expandedMastersGroups, setExpandedMastersGroups] = useState({
    location: true,
    vehicle: true,
    business: true
  });
  const toggleMastersGroup = (groupId) => {
    setExpandedMastersGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  const mastersGroups = useMemo(() => [
    {
      id: "location",
      label: "Location Masters",
      icon: MapPin,
      items: [
        { id: "cities", label: "Cities", view: "masters", path: "/masters/cities", state: { mastersTab: "location", mastersSubTab: "cities" } },
        { id: "areas", label: "Areas", view: "masters", path: "/masters/areas", state: { mastersTab: "location", mastersSubTab: "areas" } },
        { id: "subareas", label: "Sub Areas", view: "masters", path: "/masters/sub-areas", state: { mastersTab: "location", mastersSubTab: "subareas" } },
        { id: "branches", label: "Branch Master", view: "masters", path: "/masters/branches", state: { mastersTab: "location", mastersSubTab: "branches" } }
      ]
    },
    {
      id: "vehicle",
      label: "Vehicle Masters",
      icon: Car,
      items: [
        { id: "brands", label: "Brands", view: "masters", path: "/masters/brands", state: { mastersTab: "vehicle", mastersSubTab: "brands" } },
        { id: "names", label: "Vehicle Models", view: "masters", path: "/masters/vehicle-names", state: { mastersTab: "vehicle", mastersSubTab: "names" } }
      ]
    },
    {
      id: "business",
      label: "Business Partners",
      icon: Users,
      items: [
        { id: "suppliers", label: "Suppliers Master", view: "masters", path: "/masters/suppliers", state: { mastersTab: "contacts", mastersSubTab: "suppliers" } }
      ]
    }
  ], []);
  const localizedMastersGroups = useMemo(() => {
    return mastersGroups.map(group => ({
      ...group,
      label: t(group.label),
      items: group.items.map(item => ({
        ...item,
        label: t(item.label)
      }))
    }));
  }, [mastersGroups, t]);
  const isSubItemActive = (parentId, subItem) => {
    if (parentId === "masters") {
      return location.pathname === subItem.path;
    }
    if (parentId === "accounts") {
      if (location.pathname !== "/accounts") return false;
      const currentTab = navigationState.accountsTab || "ledger";
      return currentTab === subItem.state?.accountsTab;
    }
    if (parentId === "reports") {
      if (location.pathname !== "/reports") return false;
      const currentType = navigationState.reportType || "sales";
      return currentType === subItem.state?.reportType;
    }
    if (parentId === "settings") {
      if (location.pathname !== "/settings") return false;
      const currentTab = navigationState.settingsTab || "general";
      return currentTab === subItem.state?.settingsTab;
    }
    return location.pathname === (subItem.path || `/${subItem.id}`);
  };
  const handleNavigate = (view, state) => {
    if (view === "dashboard") {
      navigate("/dashboard");
    } else if (view === "customers") {
      navigate("/customers");
    } else if (view === "followups") {
      navigate("/followups");
    } else if (view === "purchase") {
      navigate("/purchase");
    } else if (view === "stock_search") {
      navigate("/stock_search");
    } else if (view === "sales") {
      navigate("/sales");
    } else if (view === "expenses") {
      navigate("/expenses");
    } else if (view === "accounts") {
      navigate("/accounts");
    } else if (view === "reports") {
      navigate("/reports");
    } else if (view === "users") {
      navigate("/staff-users");
    } else if (view === "settings") {
      navigate("/settings");
    } else if (view === "masters") {
      if (state?.mastersSubTab === "brands") {
        navigate("/masters/brands");
      } else if (state?.mastersSubTab === "names") {
        navigate("/masters/vehicle-names");
      } else if (state?.mastersSubTab === "cities") {
        navigate("/masters/cities");
      } else if (state?.mastersSubTab === "areas") {
        navigate("/masters/areas");
      } else if (state?.mastersSubTab === "subareas") {
        navigate("/masters/sub-areas");
      } else if (state?.mastersSubTab === "branches") {
        navigate("/masters/branches");
      } else if (state?.mastersSubTab === "suppliers") {
        navigate("/masters/suppliers");
      } else {
        navigate("/masters/brands");
      }
    }
    setActiveView(view);
    if (state) {
      setNavigationState(state);
    } else {
      setNavigationState({});
    }
    if (isMobile) setIsSidebarOpen(false);
  };
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [brands, setBrands] = useState([
    { id: "b1", name: "Maruti Suzuki", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b2", name: "Hyundai", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b3", name: "Tata Motors", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b4", name: "TVS", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b5", name: "Honda", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b6", name: "Hero", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b7", name: "Bajaj", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b8", name: "Ather", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b9", name: "Piaggio", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b10", name: "Mahindra", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b11", name: "Toyota", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b12", name: "MG", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b13", name: "Ashok Leyland", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "b14", name: "Ola Electric", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ]);
  const [vehicleNames, setVehicleNames] = useState([
    { id: "vn1", brandId: "b1", name: "Swift", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn2", brandId: "b1", name: "Baleno", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn3", brandId: "b2", name: "Creta", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn4", brandId: "b4", name: "Radeon", vehicleType: "Two Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn5", brandId: "b5", name: "Shine 125", vehicleType: "Two Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn6", brandId: "b6", name: "Splendor Plus", vehicleType: "Two Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn7", brandId: "b7", name: "Pulsar 150", vehicleType: "Two Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn8", brandId: "b8", name: "450X", vehicleType: "Two Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn9", brandId: "b7", name: "RE Compact", vehicleType: "Three Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn10", brandId: "b9", name: "Ape Xtra LDX", vehicleType: "Three Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn11", brandId: "b10", name: "Treo Zor", vehicleType: "Three Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn12", brandId: "b3", name: "Nexon", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn13", brandId: "b11", name: "Fortuner", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn14", brandId: "b12", name: "Hector", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn15", brandId: "b13", name: "Dost+", vehicleType: "Commercial", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn16", brandId: "b3", name: "Ace Gold", vehicleType: "Commercial", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn17", brandId: "b10", name: "Bolero Pickup", vehicleType: "Commercial", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn18", brandId: "b14", name: "S1 Pro", vehicleType: "Two Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn19", brandId: "b3", name: "Nexon EV", vehicleType: "Four Wheeler", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() },
    { id: "vn20", brandId: "b10", name: "Treo Plus", vehicleType: "Commercial", isDeleted: false, createdBy: "Admin", createdAt: (/* @__PURE__ */ new Date()).toISOString() }
  ]);
  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [staff, setStaff] = useState(MOCK_USERS);
  const [branches, setBranches] = useState([]);
  const [businessProfile, setBusinessProfile] = useState({
    companyName: "",
    companyLogo: "",
    mobileNumber: "",
    email: "",
    website: "",
    gstNumber: "",
    address: "",
    termsAndConditions: "",
    authorizedSignature: ""
  });
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [expenses, setExpenses] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [voucherEntries, setVoucherEntries] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const saved = localStorage.getItem("isLoggedIn");
    const expiry = localStorage.getItem("sessionExpiry");
    if (saved === "true" && expiry && Date.now() < Number(expiry)) {
      localStorage.setItem("sessionExpiry", (Date.now() + 2 * 60 * 60 * 1000).toString());
      return true;
    }
    return false;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    const expiry = localStorage.getItem("sessionExpiry");
    if (saved && expiry && Date.now() < Number(expiry)) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        return null;
      }
    }
    return null;
  });
  const [loginError, setLoginError] = useState("");

  const [isSoftwareOwner, setIsSoftwareOwner] = useState(!!localStorage.getItem("adminToken"));
  const [showSecretAdminAuthModal, setShowSecretAdminAuthModal] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState({ status: "Active", licenseKey: "" });
  const [adminAuthCode, setAdminAuthCode] = useState("");
  const [adminAuthError, setAdminAuthError] = useState("");

  useEffect(() => {
    const fetchLicense = async () => {
      try {
        const res = await fetch("/api/admin/license");
        if (res.ok) {
          const data = await res.json();
          setLicenseInfo(data);
        }
      } catch (e) {
        console.warn("Failed to check license info on mount:", e);
      }
    };
    fetchLicense();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + Shift + A triggers the hidden Admin Authorization Dialog
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        setShowSecretAdminAuthModal(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ————— Global Search & Stock Alert States —————
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [globalSearchResults, setGlobalSearchResults] = useState(null);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);
  const [activeSearchTab, setActiveSearchTab] = useState("all");

  // Dynamic ERP Invoice / Receipt PDF Printer
  const handlePrintSearchResult = (type, item) => {
    const doc = new jsPDF();
    const profile = businessProfile || {};
    const companyName = profile.companyName || "Auto360 Auto Consultancy";
    const email = profile.email || "info@auto360.com";
    const phone = profile.mobile || "9876543210";
    const address = profile.address || "Coimbatore, Tamil Nadu, India";
    const gstNo = profile.gstNumber || "33AAAAA1111A1Z1";
    const website = profile.website || "www.auto360.com";
    const terms = profile.termsAndConditions || "Thank you for doing business with us! This is a system-generated statement.";

    // Header Panel
    doc.setFillColor(30, 41, 59); // Slate-850 dark theme
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(companyName, 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Professional ERP Automotive & Financial Desk", 15, 26);

    doc.setFontSize(8);
    doc.text(`GSTIN: ${gstNo} | Email: ${email}`, 195, 16, { align: "right" });
    doc.text(`Tel: ${phone} | Web: ${website}`, 195, 22, { align: "right" });
    doc.text(address, 195, 28, { align: "right" });

    // Title Section
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    const docTitle = type === "purchase" ? "VEHICLE PURCHASE RECEIPT" : type === "sales" ? "VEHICLE SALES INVOICE" : "LOAN DISBURSEMENT STATEMENT";
    doc.text(docTitle, 15, 50);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 54, 195, 54);

    // Primary Metadata Table
    const metadata = [];
    if (type === "purchase") {
      metadata.push(["Purchase ID", item.purchase_id || item.id || "N/A", "Purchase Price", "INR " + Number(item.purchase_price || item.amount || 0).toLocaleString("en-IN")]);
      metadata.push(["Vehicle Model", item.vehicleDetails || item.model_details || "N/A", "Reg No", item.reg_no || item.regNo || "N/A"]);
      metadata.push(["Supplier/Seller", item.seller_name || item.supplier || "N/A", "Mobile", item.seller_mobile || item.mobile || "N/A"]);
      metadata.push(["Odometer/Owner", `${item.km_driven || "N/A"} km / ${item.owner_details || "N/A"}`, "Branch", item.branch || "Coimbatore"]);
    } else if (type === "sales") {
      metadata.push(["Sales Deal ID", item.id || "N/A", "Selling Price", "INR " + Number(item.totalPrice || item.amount || 0).toLocaleString("en-IN")]);
      metadata.push(["Vehicle Model", item.vehicleName || item.vehicle || "N/A", "Reg No", item.regNo || "N/A"]);
      metadata.push(["Buyer/Customer", item.customerName || item.customer || "N/A", "Mobile", item.customerMobile || "N/A"]);
      metadata.push(["Sale Date", item.date || "N/A", "Branch", item.branch || "Coimbatore"]);
    } else {
      metadata.push(["Loan ID", item.id || "N/A", "Sanctioned Amount", "INR " + Number(item.takenAmount || item.loanAmount || 0).toLocaleString("en-IN")]);
      metadata.push(["Financier Bank", item.financeName || "N/A", "Outstanding Balance", "INR " + Number(item.dueAmount || item.balanceAmount || 0).toLocaleString("en-IN")]);
      metadata.push(["Customer Name", item.customerName || "N/A", "Reg No", item.regNo || "N/A"]);
      metadata.push(["Status", item.status || "Active", "Branch", item.branch || "Coimbatore"]);
    }

    autoTable(doc, {
      body: metadata,
      startY: 58,
      margin: { left: 15, right: 15 },
      theme: "plain",
      styles: { fontSize: 8.5, cellPadding: 3.5, lineColor: [241, 245, 249], lineWidth: 0.5 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: [100, 116, 139], width: 45 },
        1: { textColor: [30, 41, 59] },
        2: { fontStyle: "bold", textColor: [100, 116, 139], width: 45 },
        3: { textColor: [30, 41, 59], fontStyle: "bold" }
      }
    });

    const finalY = doc.previousAutoTable.finalY + 12;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Terms & Conditions", 15, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(terms, 15, finalY + 4, { maxWidth: 180 });

    const sigY = finalY + 24;
    // Add Signature image if uploaded
    if (profile.authorizedSignature) {
      try {
        doc.addImage(profile.authorizedSignature, "JPEG", 145, sigY, 40, 12);
      } catch (err) {
        doc.setFontSize(8);
        doc.text("-----------------------------", 145, sigY + 8);
      }
    } else {
      doc.setFontSize(8);
      doc.text("-----------------------------", 145, sigY + 8);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Authorized Signature", 145, sigY + 12);
    doc.text(companyName, 145, sigY + 16);

    doc.save(`${type}_receipt_${item.id || item.purchase_id || "document"}.pdf`);
  };

  // Debounced auto-search triggers
  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setGlobalSearchResults(null);
      setShowGlobalSearchResults(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingGlobal(true);
      try {
        const branchParam = selectedBranch === "all" ? "" : selectedBranch;
        const res = await fetch(`/api/search?q=${encodeURIComponent(globalSearchQuery)}&branch=${encodeURIComponent(branchParam)}&user_branch=${encodeURIComponent(currentUser?.branch || "")}`);
        if (res.ok) {
          const data = await res.json();
          setGlobalSearchResults(data);
          setShowGlobalSearchResults(true);
        }
      } catch (err) {
        console.warn("Global lookup query failed gracefully:", err);
      } finally {
        setIsSearchingGlobal(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [globalSearchQuery, selectedBranch, currentUser]);
  useEffect(() => {
    if (currentUser && currentUser.role !== "Super Admin") {
      setSelectedBranch(currentUser.branch || "Coimbatore");
    }
  }, [currentUser]);
  const branchFilteredVehicles = useMemo(() => {
    if (selectedBranch === "all") return vehicles;
    return vehicles.filter((v) => v.branch === selectedBranch);
  }, [vehicles, selectedBranch]);
  const branchFilteredDeals = useMemo(() => {
    if (selectedBranch === "all") return deals;
    return deals.filter((d) => d.branch === selectedBranch);
  }, [deals, selectedBranch]);
  const branchFilteredCustomers = useMemo(() => {
    if (selectedBranch === "all") return customers;
    return customers.filter((c) => c.branch === selectedBranch);
  }, [customers, selectedBranch]);
  const branchFilteredExpenses = useMemo(() => {
    if (selectedBranch === "all") return expenses;
    return expenses.filter((e) => e.branch === selectedBranch);
  }, [expenses, selectedBranch]);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Dynamically initialize current financial year keys in localStorage if missing or set to old stale values
    try {
      const fyFrom = localStorage.getItem("financialYearFrom");
      const fyTo = localStorage.getItem("financialYearTo");
      if (!fyFrom || !fyTo || (fyFrom === "2025-04-01" && fyTo === "2026-03-31")) {
        const now = new Date();
        const currentYear = now.getFullYear();
        let startYear = currentYear;
        if (now.getMonth() < 3) {
          startYear = currentYear - 1;
        }
        localStorage.setItem("financialYearFrom", `${startYear}-04-01`);
        localStorage.setItem("financialYearTo", `${startYear + 1}-03-31`);
      }
    } catch (err) {
      console.warn("localStorage init error:", err);
    }

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const titleName = businessProfile?.companyName || "Auto360 ERP";
    document.title = `${titleName} | Auto Consultancy & Billing`;
  }, [businessProfile]);

  const loadSyncData = useCallback(async () => {
    if (!isLoggedIn) return;
    const safeFetch = async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Expected JSON but received ${contentType || "none"}`);
      }
      return res.json();
    };
    try {
      try {
        const dataProfile = await safeFetch("/api/settings/profile");
        if (dataProfile) {
          setBusinessProfile(dataProfile);
        }
      } catch (err) {
        console.warn("[Sync Business Profile Failed]", err);
      }
      try {
        const dataBranches = await safeFetch("/api/branches");
        setBranches(dataBranches);
      } catch (err) {
        console.warn("[Sync Branches Failed]", err);
      }
      try {
        const dataCities = await safeFetch("/api/cities");
        setCities(dataCities);
      } catch (err) {
        console.warn("[Sync Cities Failed]", err);
      }
      try {
        const dataAreas = await safeFetch("/api/areas");
        setAreas(dataAreas);
      } catch (err) {
        console.warn("[Sync Areas Failed]", err);
      }
      try {
        const dataSub = await safeFetch("/api/subareas");
        setSubAreas(dataSub);
      } catch (err) {
        console.warn("[Sync Sub-areas Failed]", err);
      }
      try {
        const dataSuppliers = await safeFetch("/api/suppliers?limit=100");
        if (dataSuppliers?.data) {
          setSuppliers(dataSuppliers.data.map((item) => ({
            id: item.supplier_id,
            name: item.supplier_name,
            mobile: item.supplier_mobile,
            address: item.address,
            cityId: item.city_id,
            isDeleted: false,
            createdBy: "Admin",
            createdAt: item.created_at,
            branch: item.branch || "Coimbatore"
          })));
        }
      } catch (err) {
        console.warn("[Sync Suppliers Failed]", err);
      }
      try {
        const dataCustomers = await safeFetch("/api/customers?limit=100");
        if (dataCustomers?.data) {
          setCustomers(dataCustomers.data.map((item) => ({
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
      } catch (err) {
        console.warn("[Sync Customers Failed]", err);
      }
      try {
        const dataPurchases = await safeFetch("/api/purchases");
        const purchasesArray = Array.isArray(dataPurchases) ? dataPurchases : (dataPurchases?.data || []);
        setVehicles(purchasesArray.map((item) => {
          const purPrice = Number(item.purchase_price || item.purchasePrice) || 0;
          const advPrice = Number(
            item.advance_price !== undefined && item.advance_price !== null && item.advance_price !== ""
              ? item.advance_price
              : (item.advancePaid !== undefined && item.advancePaid !== null && item.advancePaid !== ""
                  ? item.advancePaid
                  : (item.advance_amount !== undefined && item.advance_amount !== null && item.advance_amount !== ""
                      ? item.advance_amount
                      : (item.advanceAmount !== undefined && item.advanceAmount !== null && item.advanceAmount !== ""
                          ? item.advanceAmount
                          : 0)))
          ) || 0;
          const balAmount = (item.balance_amount !== undefined && item.balance_amount !== null && item.balance_amount !== "")
            ? Number(item.balance_amount)
            : ((item.balanceAmount !== undefined && item.balanceAmount !== null && item.balanceAmount !== "")
                ? Number(item.balanceAmount)
                : Math.max(0, purPrice - advPrice));

          return {
            ...item,
            id: item.purchase_id || item.id,
            purchase_id: item.purchase_id || item.id,
            name: `${item.brand_id || ""} ${item.vehicle_name_id || ""}`.trim() || "Vehicle",
            brand: item.brand_id || "",
            model: item.model_details || "",
            year: Number(item.year) || 2024,
            fuelType: item.fuel_type || "Petrol",
            purchasePrice: purPrice,
            purchase_price: purPrice,
            advancePaid: advPrice,
            advance_price: advPrice,
            advance_amount: advPrice,
            advanceAmount: advPrice,
            paidAmount: advPrice,
            balance: balAmount,
            balance_amount: balAmount,
            balanceAmount: balAmount,
            ownerDetails: item.owner_details || "1st Owner",
            status: item.status || "Available",
            branch: item.branch || "Coimbatore",
            sellerName: item.seller_name || item.sellerName || "",
            seller_name: item.seller_name || item.sellerName || "",
            sellerMobile: item.seller_mobile || item.sellerMobile || "",
            seller_mobile: item.seller_mobile || item.sellerMobile || "",
            sellerType: item.purchase_type || item.sellerType || "Customer",
            purchase_type: item.purchase_type || item.sellerType || "Customer",
            sellerId: item.seller_id || item.sellerId || "",
            seller_id: item.seller_id || item.sellerId || "",
            vehicleType: item.vehicle_type || "Four Wheeler",
            regNo: item.reg_no || item.regNo || "",
            reg_no: item.reg_no || item.regNo || "",
            engineNo: item.engine_number || "",
            chassisNo: item.chassis_number || "",
            photos: item.vehicle_image ? [item.vehicle_image] : [],
            photo: item.vehicle_image || "",
            image: item.vehicle_image || "",
            vehicle_image: item.vehicle_image || "",
            purchaseDate: item.purchase_date || item.created_at || "",
            challan: { hasChallan: item.challan_pending === "Yes", amount: 0 },
            tyreStatus: item.tyre_status || "Good",
            insurance: { hasInsurance: item.insurance_active === "Yes" },
            rcType: item.rc_type || "Card",
            noc: { hasNoc: item.noc_available === "Yes" },
            totalExpenses: (Number(item.fuel_expense) || 0) + (Number(item.repair_expense) || 0) + (Number(item.service_expense) || 0) + (Number(item.insurance_expense) || 0) + (Number(item.rto_expense) || 0) + (Number(item.other_expense) || 0),
            consultancyFees: Number(item.consultancy_fees) || 0,
            expectedSellingPrice: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            expected_selling_price: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            salesPrice: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            sales_price: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            sellingPrice: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            selling_price: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            offerPrice: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            offer_price: Number(item.expected_selling_price || item.sales_price || item.salesPrice || item.expectedSellingPrice || item.offerPrice || item.offer_price || (Number(item.selling_price) > 0 ? item.selling_price : 0)) || 0,
            isDeleted: item.isDeleted || false,
            createdBy: "Admin",
            createdAt: item.created_at || new Date().toISOString()
          };
        }));
      } catch (err) {
        console.warn("[Sync Purchases Failed]", err);
      }
      try {
        const dataVouchers = await safeFetch("/api/vouchers");
        if (Array.isArray(dataVouchers)) {
          setVoucherEntries(dataVouchers);
        }
      } catch (err) {
        console.warn("[Sync Vouchers Failed]", err);
      }
      try {
        const dataLedgers = await safeFetch("/api/ledgers");
        if (Array.isArray(dataLedgers)) {
          setLedgers(dataLedgers);
        }
      } catch (err) {
        console.warn("[Sync Ledgers Failed]", err);
      }
      try {
        const dataExpenses = await safeFetch("/api/expenses");
        if (Array.isArray(dataExpenses)) {
          setExpenses(dataExpenses);
        }
      } catch (err) {
        console.warn("[Sync Expenses Failed]", err);
      }
      try {
        const dataDeals = await safeFetch("/api/deals");
        const dealsArray = Array.isArray(dataDeals) ? dataDeals : (dataDeals?.data || []);
        if (Array.isArray(dealsArray)) {
          setDeals(dealsArray);
        }
      } catch (err) {
        console.warn("[Sync Deals Failed]", err);
      }
      try {
        const dataStaff = await safeFetch("/api/staff");
        if (Array.isArray(dataStaff)) {
          setStaff(dataStaff);
        }
      } catch (err) {
        console.warn("[Sync Staff Users Failed]", err);
      }
      try {
        const dataPayments = await safeFetch("/api/payments");
        if (Array.isArray(dataPayments)) {
          setPayments(dataPayments);
        }
      } catch (err) {
        console.warn("[Sync Payments Failed]", err);
      }
    } catch (e) {
      console.error("[Auto360 Client Sync Error]", e);
    }
  }, [isLoggedIn]);

  const handleSavePayment = async (paymentData) => {
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData)
      });
      if (!res.ok) throw new Error("Failed to save payment");
      await loadSyncData();
      return true;
    } catch (err) {
      console.error("Error saving payment:", err);
      throw err;
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete payment");
      await loadSyncData();
    } catch (err) {
      console.error("Error deleting payment:", err);
    }
  };

  // Initial load and live real-time sync polling interval (every 4 seconds for ultra responsive live dashboards/states)
  useEffect(() => {
    if (isLoggedIn) {
      loadSyncData();
      const pollInterval = setInterval(() => {
        loadSyncData();
      }, 4000);
      window.refreshAuto360ERP = loadSyncData;
      return () => {
        clearInterval(pollInterval);
        delete window.refreshAuto360ERP;
      };
    }
  }, [isLoggedIn, loadSyncData]);
  const handleLogin = async (username, password, branch) => {
    try {
      const response = await axios.post("/api/login", { username, password, branch }, {
        headers: { "Content-Type": "application/json" }
      });
      
      const data = response.data;
      const user = data.user;
      setIsLoggedIn(true);
      setCurrentUser(user);
      setLoginError("");

      // Store state
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify(user));
      const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 hour session
      localStorage.setItem("sessionExpiry", expiry.toString());
      localStorage.setItem("sessionToken", data.token);

      // Log in server
      try {
        const todayStr = new Date().toISOString().split("T")[0];
        const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false });
        const browserInfo = navigator.userAgent;
        let detectedIp = "127.0.0.1";

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 1200);
          const ipRes = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
          clearTimeout(timeoutId);
          if (ipRes.ok) {
            const ipData = await ipRes.json();
            detectedIp = ipData.ip;
          }
        } catch (e) {
          console.warn("Using fallback local IP address mapping", e);
        }

        const res = await fetch("/api/login-reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            username: user.name,
            role: user.role,
            loginDate: todayStr,
            loginTime: timeStr,
            branch: branch || user.branch || "Headquarters",
            deviceInfo: browserInfo,
            ipAddress: detectedIp
          })
        });
        if (res.ok) {
          const report = await res.json();
          localStorage.setItem("currentLoginReportId", report.id);
        }
      } catch (err) {
        console.warn("Log in server background audit failed", err);
      }

      if (user.role === "Super Admin") {
        if (branch === "All Branches") {
          setSelectedBranch("all");
        } else {
          // Normalize selected branch string (e.g., Coimbatore Branch -> Coimbatore)
          const cleanBranch = (branch || "").toLowerCase().replace(/branch/gi, "").trim();
          if (cleanBranch.includes("coimbatore")) setSelectedBranch("Coimbatore");
          else if (cleanBranch.includes("erode")) setSelectedBranch("Erode");
          else if (cleanBranch.includes("salem")) setSelectedBranch("Salem");
          else setSelectedBranch(branch || "all");
        }
      } else {
        // Enforce their assigned branch in the frontend
        const cleanBranch = (user.branch || "").toLowerCase().replace(/branch/gi, "").trim();
        if (cleanBranch.includes("coimbatore")) setSelectedBranch("Coimbatore");
        else if (cleanBranch.includes("erode")) setSelectedBranch("Erode");
        else if (cleanBranch.includes("salem")) setSelectedBranch("Salem");
        else setSelectedBranch(user.branch || "Coimbatore");
      }

      if (user.permissions && user.permissions.length > 0) {
        setActiveView(user.permissions[0]);
      }
    } catch (err) {
      console.error("[Login API error]", err);
      if (err.response && err.response.data && err.response.data.error) {
        setLoginError(err.response.data.error);
      } else {
        setLoginError("Service unavailable. Please try again.");
      }
    }
  };

  const handleClientActivateLicense = async (key) => {
    try {
      const res = await fetch("/api/admin/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key })
      });
      if (res.ok) {
        const data = await res.json();
        setLicenseInfo(data);
        alert("License Activated Successfully! Welcome to AUTO360 ERP.");
      } else {
        const err = await res.json();
        alert(err.error || "Invalid License Key. Please try again.");
      }
    } catch (e) {
      alert("Network error activating license key");
    }
  };

  const handleAdminAuthorize = async () => {
    try {
      setAdminAuthError("");
      const res = await fetch("/api/admin/authorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: adminAuthCode })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("adminToken", data.token);
        setIsSoftwareOwner(true);
        setShowSecretAdminAuthModal(false);
        setAdminAuthCode("");
        setActiveView("admin_console");
        navigate("/admin-console");
      } else {
        const err = await res.json();
        setAdminAuthError(err.error || "Authorization failed");
      }
    } catch (e) {
      setAdminAuthError("Network authorization error");
    }
  };

  const renderSecretAdminAuthModal = () => {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white max-w-sm w-full rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="text-amber-500" size={18} />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Admin Authorization</h3>
            </div>
            <button
              onClick={() => {
                setShowSecretAdminAuthModal(false);
                setAdminAuthError("");
                setAdminAuthCode("");
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 leading-normal">
            Enter the private Software Administrator security code to enable central licensing controls and multi-company management tools.
          </p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase text-slate-400">Security Authorization Code</label>
            <input
              type="password"
              value={adminAuthCode}
              onChange={(e) => setAdminAuthCode(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-slate-950"
            />
            {adminAuthError && (
              <p className="text-[10px] text-rose-600 font-bold mt-1">{adminAuthError}</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setShowSecretAdminAuthModal(false);
                setAdminAuthError("");
                setAdminAuthCode("");
              }}
              className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAdminAuthorize}
              className="flex-1 py-2 bg-slate-950 hover:bg-slate-850 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md"
            >
              Authorize System
            </button>
          </div>
        </motion.div>
      </div>
    );
  };

  const handleLogout = async (isExpired = false) => {
    const reportId = localStorage.getItem("currentLoginReportId");
    if (reportId) {
      try {
        const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false });
        await fetch(`/api/login-reports/${reportId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            logoutTime: timeStr,
            status: isExpired ? "Session Expired" : "Logged Out"
          })
        });
      } catch (err) {
        console.warn("Log out server background audit failed", err);
      }
    }
    
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("sessionExpiry");
    localStorage.removeItem("currentLoginReportId");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveView("dashboard");
  };

  // Auto session duration timer verification
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const expiry = localStorage.getItem("sessionExpiry");
      if (expiry) {
        const timeLeft = Number(expiry) - Date.now();
        if (timeLeft <= 0) {
          handleLogout(true);
        } else if (timeLeft < 15 * 60 * 1000) {
          // extend session auto due to active focus
          localStorage.setItem("sessionExpiry", (Date.now() + 2 * 60 * 60 * 1000).toString());
        }
      }
    }, 15 * 1000); // 15 seconds
    return () => clearInterval(interval);
  }, [isLoggedIn]);
  const isSubItemPermitted = (sub) => {
    if (!currentUser) return false;
    const targetView = sub.view || sub.id;
    let permissionKey = targetView;
    if (targetView === "users") permissionKey = "users";
    if (targetView === "settings") permissionKey = "settings";
    if (!hasModulePermission(currentUser, permissionKey, "view")) {
      return false;
    }
    if (targetView === "reports" && sub.state?.reportType) {
      const rId = sub.state.reportType;
      const role = currentUser.role;
      if (role === "Manager") {
        const allowed = [
          "sales",
          "purchase",
          "customer",
          "expense",
          "inventory",
          "balance_pending",
          "customer_sales_outstanding",
          "customer_outstanding",
          "rc_pending",
          "insurance_pending",
          "area_stock"
        ];
        if (!allowed.includes(rId)) return false;
      } else if (role === "Staff" || role === "Sales") {
        const allowed = ["sales", "customer", "inventory", "balance_pending", "customer_sales_outstanding", "customer_outstanding"];
        if (!allowed.includes(rId)) return false;
      }
    }
    return true;
  };
  const hasPermission = (item) => {
    if (!currentUser) return false;
    if (item.view) {
      return hasModulePermission(currentUser, item.view, "view");
    }
    if (item.subItems) {
      return item.subItems.some(isSubItemPermitted);
    }
    return hasModulePermission(currentUser, item.id, "view");
  };
  const menuItems = useMemo(() => [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      view: "dashboard",
      path: "/dashboard"
    },
    {
      id: "masters",
      label: "Masters",
      icon: Layers,
      subItems: [
        { id: "brands", label: "Brands", view: "masters", path: "/masters/brands", state: { mastersTab: "vehicle", mastersSubTab: "brands" } },
        { id: "names", label: "Vehicle Names", view: "masters", path: "/masters/vehicle-names", state: { mastersTab: "vehicle", mastersSubTab: "names" } },
        { id: "cities", label: "Cities", view: "masters", path: "/masters/cities", state: { mastersTab: "location", mastersSubTab: "cities" } },
        { id: "areas", label: "Areas", view: "masters", path: "/masters/areas", state: { mastersTab: "location", mastersSubTab: "areas" } },
        { id: "subareas", label: "Sub Areas", view: "masters", path: "/masters/sub-areas", state: { mastersTab: "location", mastersSubTab: "subareas" } },
        { id: "branches", label: "Branch Master", view: "masters", path: "/masters/branches", state: { mastersTab: "location", mastersSubTab: "branches" } },
        { id: "suppliers", label: "Suppliers", view: "masters", path: "/masters/suppliers", state: { mastersTab: "contacts", mastersSubTab: "suppliers" } }
      ]
    },
    {
      id: "customers",
      label: "Customers",
      icon: Users,
      view: "customers",
      path: "/customers"
    },
    {
      id: "followups",
      label: "Follow-ups",
      icon: CalendarClock,
      view: "followups",
      path: "/followups"
    },
    {
      id: "purchase",
      label: "Purchase",
      icon: Car,
      view: "purchase",
      path: "/purchase"
    },
    {
      id: "stock_search",
      label: "Stock Search",
      icon: Search,
      view: "stock_search",
      path: "/stock_search"
    },
    {
      id: "binding",
      label: "Binding Loans",
      icon: CreditCard,
      view: "binding",
      path: "/binding"
    },
    {
      id: "sales",
      label: "Sales",
      icon: Handshake,
      view: "sales",
      path: "/sales"
    },
    {
      id: "payments",
      label: "Payments",
      icon: CreditCard,
      subItems: [
        { id: "customer_payments", label: "Customer Payments", view: "payments", path: "/payments/customer", state: { paymentsSubTab: "customer" } },
        { id: "supplier_payments", label: "Supplier Payments", view: "payments", path: "/payments/supplier", state: { paymentsSubTab: "supplier" } },
        { id: "sales_receipts", label: "Sales Receipts", view: "payments", path: "/payments/sales_receipts", state: { paymentsSubTab: "sales_receipts" } },
        { id: "payment_history", label: "Payment History", view: "payments", path: "/payments/history", state: { paymentsSubTab: "history" } },
        { id: "payment_reports", label: "Payment Reports", view: "payments", path: "/payments/reports", state: { paymentsSubTab: "reports" } },
        { id: "outstanding_summary", label: "Outstanding Summary", view: "payments", path: "/payments/summary", state: { paymentsSubTab: "summary" } }
      ]
    },
    {
      id: "expenses",
      label: "Expenses",
      icon: TrendingDown,
      view: "expenses",
      path: "/expenses"
    },
    {
      id: "accounts",
      label: "Accounts",
      icon: FileText,
      subItems: [
        { id: "ledger", label: "Ledger Master", view: "accounts", path: "/accounts", state: { accountsTab: "ledger" } },
        { id: "voucher", label: "Voucher Entry", view: "accounts", path: "/accounts", state: { accountsTab: "voucher" } },
        { id: "daybook", label: "Day Book", view: "accounts", path: "/accounts", state: { accountsTab: "daybook" } },
        { id: "trial", label: "Trial Balance", view: "accounts", path: "/accounts", state: { accountsTab: "trial" } },
        { id: "pl", label: "Profit & Loss", view: "accounts", path: "/accounts", state: { accountsTab: "pl" } },
        { id: "balance", label: "Balance Sheet", view: "accounts", path: "/accounts", state: { accountsTab: "balance" } }
      ]
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      subItems: [
        { id: "sales", label: "Sales Report", view: "reports", path: "/reports", state: { reportType: "sales" } },
        { id: "purchase", label: "Purchase Report", view: "reports", path: "/reports", state: { reportType: "purchase" } },
        { id: "customer_outstanding", label: "Customer Outstanding", view: "reports", path: "/reports", state: { reportType: "customer_outstanding" } },
        { id: "supplier_outstanding", label: "Supplier Outstanding", view: "reports", path: "/reports", state: { reportType: "supplier_outstanding" } },
        { id: "customer", label: "Customer Report", view: "reports", path: "/reports", state: { reportType: "customer" } },
        { id: "expense", label: "Expense Report", view: "reports", path: "/reports", state: { reportType: "expense" } },
        { id: "inventory", label: "Inventory Report", view: "reports", path: "/reports", state: { reportType: "inventory" } },
        { id: "customer_sales_outstanding", label: "Customer Sales Outstanding", view: "reports", path: "/reports", state: { reportType: "customer_sales_outstanding" } },
        { id: "rc_pending", label: "RC Pending", view: "reports", path: "/reports", state: { reportType: "rc_pending" } },
        { id: "insurance_pending", label: "Insurance Pending", view: "reports", path: "/reports", state: { reportType: "insurance_pending" } },
        { id: "binding_loan", label: "Binding Loan Report", view: "reports", path: "/reports", state: { reportType: "binding_loan" } },
        { id: "supplier", label: "Supplier Report", view: "reports", path: "/reports", state: { reportType: "supplier" } },
        { id: "area_stock", label: "Area Wise Stock", view: "reports", path: "/reports", state: { reportType: "area_stock" } },
        { id: "branch_stock", label: "Branch Wise Stock", view: "reports", path: "/reports", state: { reportType: "branch_stock" } },
        { id: "branch_sales", label: "Branch Wise Sales", view: "reports", path: "/reports", state: { reportType: "branch_sales" } },
        { id: "branch_purchase", label: "Branch Wise Purchase", view: "reports", path: "/reports", state: { reportType: "branch_purchase" } },
        { id: "login_report", label: "Login History Report", view: "reports", path: "/reports", state: { reportType: "login_report" } }
      ]
    },
    {
      id: "users",
      label: "Staff Users",
      icon: Users,
      view: "users",
      path: "/staff-users"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      subItems: [
        { id: "general", label: "General Settings", view: "settings", path: "/settings", state: { settingsTab: "general" } },
        { id: "profile", label: "Business Profile", view: "settings", path: "/settings", state: { settingsTab: "profile" } },
        { id: "financial-year", label: "Financial Year", view: "settings", path: "/settings", state: { settingsTab: "financial-year" } },
        { id: "security", label: "Security & Access", view: "settings", path: "/settings", state: { settingsTab: "security" } },
        { id: "notifications", label: "Notifications", view: "settings", path: "/settings", state: { settingsTab: "notifications" } },
        { id: "appearance", label: "Appearance", view: "settings", path: "/settings", state: { settingsTab: "appearance" } },
        { id: "backup", label: "Backup & Restore", view: "settings", path: "/settings", state: { settingsTab: "backup" } }
      ]
    },
    ...(isSoftwareOwner ? [{
      id: "admin_console",
      label: "Software Owner Console",
      icon: Shield,
      view: "admin_console",
      path: "/admin-console"
    }] : [])
  ].filter((item) => {
    if (item.id === "admin_console") return isSoftwareOwner;
    return hasPermission(item);
  }), [currentUser, isSoftwareOwner]);
  const localizedMenuItems = useMemo(() => {
    return menuItems.map(item => ({
      ...item,
      label: t(item.label),
      subItems: item.subItems ? item.subItems.map(sub => ({
        ...sub,
        label: t(sub.label)
      })) : undefined
    }));
  }, [menuItems, t]);
  useEffect(() => {
    if (!isLoggedIn || !currentUser) return;
    const path = location.pathname;
    const setSafeActiveView = (view, state) => {
      if (hasModulePermission(currentUser, view, "view")) {
        const isSameView = activeView === view;
        if (!isSameView) {
          setActiveView(view);
        }
        if (state) {
          const isSameState = navigationState.mastersTab === state.mastersTab && navigationState.mastersSubTab === state.mastersSubTab && navigationState.settingsTab === state.settingsTab && navigationState.accountsTab === state.accountsTab;
          if (!isSameState) {
            setNavigationState(state);
          }
        } else if (!isSameView && Object.keys(navigationState).length > 0) {
          setNavigationState({});
        }
      } else {
        navigate("/dashboard", { replace: true });
      }
    };
    if (path === "/" || path === "/dashboard" || path === "") {
      setSafeActiveView("dashboard");
    } else if (path === "/customers") {
      setSafeActiveView("customers");
    } else if (path === "/followups") {
      setSafeActiveView("followups");
    } else if (path === "/purchase") {
      setSafeActiveView("purchase");
    } else if (path === "/stock_search") {
      setSafeActiveView("stock_search");
    } else if (path === "/binding") {
      setSafeActiveView("binding");
    } else if (path === "/sales") {
      setSafeActiveView("sales");
    } else if (path.startsWith("/payments")) {
      if (path === "/payments/customer") setSafeActiveView("payments", { paymentsSubTab: "customer" });
      else if (path === "/payments/supplier") setSafeActiveView("payments", { paymentsSubTab: "supplier" });
      else if (path === "/payments/history") setSafeActiveView("payments", { paymentsSubTab: "history" });
      else if (path === "/payments/reports") setSafeActiveView("payments", { paymentsSubTab: "reports" });
      else if (path === "/payments/summary") setSafeActiveView("payments", { paymentsSubTab: "summary" });
      else setSafeActiveView("payments", { paymentsSubTab: "customer" });
    } else if (path === "/expenses") {
      setSafeActiveView("expenses");
    } else if (path === "/accounts") {
      setSafeActiveView("accounts");
    } else if (path === "/reports") {
      setSafeActiveView("reports");
    } else if (path === "/staff-users" || path === "/users") {
      setSafeActiveView("users");
    } else if (path === "/settings") {
      setSafeActiveView("settings");
    } else if (path.startsWith("/masters/")) {
      if (path === "/masters/brands") {
        setSafeActiveView("masters", { mastersTab: "vehicle", mastersSubTab: "brands" });
      } else if (path === "/masters/vehicle-names") {
        setSafeActiveView("masters", { mastersTab: "vehicle", mastersSubTab: "names" });
      } else if (path === "/masters/cities") {
        setSafeActiveView("masters", { mastersTab: "location", mastersSubTab: "cities" });
      } else if (path === "/masters/areas") {
        setSafeActiveView("masters", { mastersTab: "location", mastersSubTab: "areas" });
      } else if (path === "/masters/sub-areas") {
        setSafeActiveView("masters", { mastersTab: "location", mastersSubTab: "subareas" });
      } else if (path === "/masters/branches") {
        setSafeActiveView("masters", { mastersTab: "location", mastersSubTab: "branches" });
      } else if (path === "/masters/suppliers") {
        setSafeActiveView("masters", { mastersTab: "contacts", mastersSubTab: "suppliers" });
      } else {
        setSafeActiveView("masters", { mastersTab: "vehicle", mastersSubTab: "brands" });
      }
    }
  }, [location.pathname, isLoggedIn, currentUser, navigate]);
  useEffect(() => {
    if (activeView === "masters") {
      setExpandedMenus((prev) => ({ ...prev, masters: true }));
    } else if (activeView === "accounts") {
      setExpandedMenus((prev) => ({ ...prev, accounts: true }));
    } else if (activeView === "reports") {
      setExpandedMenus((prev) => ({ ...prev, reports: true }));
    } else if (activeView === "settings") {
      setExpandedMenus((prev) => ({ ...prev, settings: true }));
    }
  }, [activeView]);
  useEffect(() => {
    if (isLoggedIn && (location.pathname === "/" || location.pathname === "")) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoggedIn, location.pathname, navigate]);
  if (licenseInfo && licenseInfo.status === "Inactive" && !isSoftwareOwner) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center animate-pulse">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">ERP License Suspended</h1>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              This installation of <strong className="text-slate-800">AUTO360 ERP</strong> has been locked or deactivated. Please contact your system administrator at <strong className="text-slate-800">Harix Tech Solutions</strong> to receive a valid activation token.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
            <label className="text-[10px] font-extrabold uppercase text-slate-400 block">License Activation Token</label>
            <div className="flex gap-2">
              <input
                type="text"
                id="license-activation-input"
                placeholder="Enter Activation Key (A360-...)"
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-slate-950 uppercase outline-none"
              />
              <button
                onClick={() => {
                  const val = document.getElementById("license-activation-input")?.value;
                  if (val) handleClientActivateLicense(val);
                }}
                className="bg-slate-950 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-850 cursor-pointer transition-all"
              >
                Activate
              </button>
            </div>
          </div>

          <div className="pt-2 text-center border-t border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium">
              System Administrators: Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-250 text-[9px] font-bold">Ctrl + Shift + A</kbd> to open administrative override.
            </p>
          </div>
        </div>

        {/* Global Secret Admin Auth Modal */}
        {showSecretAdminAuthModal && renderSecretAdminAuthModal()}
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} error={loginError} businessProfile={businessProfile} />;
  }
  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard
          vehicles={branchFilteredVehicles}
          deals={branchFilteredDeals}
          payments={payments}
          customers={branchFilteredCustomers}
          ledgers={ledgers}
          onNavigate={handleNavigate}
          suppliers={suppliers}
          vouchers={voucherEntries}
          brands={brands}
          vehicleNames={vehicleNames}
        />;
      case "customers":
        return <Customers
          customers={branchFilteredCustomers}
          onUpdateCustomers={setCustomers}
          cities={cities}
          areas={areas}
          subAreas={subAreas}
          purchases={branchFilteredVehicles}
          deals={branchFilteredDeals}
          payments={payments}
          vouchers={voucherEntries}
          currentUser={currentUser}
          initialSearch={navigationState.search}
          businessProfile={businessProfile}
          onNavigate={handleNavigate}
          onRefreshData={loadSyncData}
        />;
      case "purchase":
        return <Purchase
          vehicles={branchFilteredVehicles}
          onUpdateVehicles={(newVehicles) => setVehicles(newVehicles)}
          brands={brands}
          vehicleNames={vehicleNames}
          cities={cities}
          areas={areas}
          subAreas={subAreas}
          customers={branchFilteredCustomers}
          suppliers={suppliers}
          onUpdateDeals={setDeals}
          onNavigate={handleNavigate}
          selectedBranch={selectedBranch}
          currentUser={currentUser}
          businessProfile={businessProfile}
          initialSearch={navigationState.search}
          onRefreshData={loadSyncData}
          payments={payments}
          vouchers={voucherEntries}
        />;
      case "stock_search":
        return <StockSearch
          vehicles={branchFilteredVehicles}
          brands={brands}
          vehicleNames={vehicleNames}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          businessProfile={businessProfile}
        />;
      case "binding":
        return <Binding
          vehicles={branchFilteredVehicles}
          onUpdateVehicle={(updatedVehicle) => {
            setVehicles((prev) => prev.map((v) => v.id === updatedVehicle.id ? updatedVehicle : v));
          }}
          initialPurchase={navigationState.loanPurchase}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          businessProfile={businessProfile}
          onRefreshData={loadSyncData}
        />;
      case "sales":
        return <Sales
          vehicles={branchFilteredVehicles}
          customers={branchFilteredCustomers}
          deals={branchFilteredDeals}
          payments={payments}
          vouchers={voucherEntries}
          onUpdateDeals={setDeals}
          onUpdateVehicles={setVehicles}
          onUpdateCustomers={setCustomers}
          onNavigate={handleNavigate}
          initialVehicle={navigationState.salesVehicle}
          currentUser={currentUser}
          businessProfile={businessProfile}
          initialSearch={navigationState.search}
          onRefreshData={loadSyncData}
        />;
      case "payments":
        return <Payments
          deals={branchFilteredDeals}
          vehicles={branchFilteredVehicles}
          customers={branchFilteredCustomers}
          suppliers={suppliers}
          vouchers={voucherEntries}
          payments={payments}
          onSavePayment={handleSavePayment}
          onDeletePayment={handleDeletePayment}
          currentBranch={currentUser?.branch || selectedBranch || "Coimbatore"}
          initialSubTab={navigationState.paymentsSubTab || "customer"}
          businessProfile={businessProfile}
          onRefreshData={loadSyncData}
        />;
      case "expenses":
        return <Expenses
          expenses={branchFilteredExpenses}
          onUpdateExpenses={setExpenses}
          onNavigate={handleNavigate}
          vehicles={branchFilteredVehicles}
          currentUser={currentUser}
          onRefreshData={loadSyncData}
        />;
      case "accounts":
        return <Accounts
          ledgers={ledgers}
          onUpdateLedgers={setLedgers}
          entries={voucherEntries}
          onUpdateEntries={setVoucherEntries}
          initialTab={navigationState.accountsTab}
          initialVoucherData={navigationState.voucherData}
          currentUser={currentUser}
          vehicles={vehicles}
          businessProfile={businessProfile}
          onRefreshData={loadSyncData}
        />;
      case "reports":
        return <Reports
          vehicles={branchFilteredVehicles}
          deals={branchFilteredDeals}
          brands={brands}
          customers={branchFilteredCustomers}
          expenses={branchFilteredExpenses}
          branches={branches}
          vouchers={voucherEntries}
          suppliers={suppliers}
          payments={payments}
          initialReport={navigationState.reportType}
          onNavigate={handleNavigate}
          currentUser={currentUser}
          selectedBranch={selectedBranch}
          businessProfile={businessProfile}
        />;
      case "users":
        return <Staff
          staff={staff}
          onUpdateStaff={setStaff}
          branches={branches}
          currentUser={currentUser}
        />;
      case "followups":
        return <FollowUps customers={branchFilteredCustomers} currentUser={currentUser} />;
      case "masters":
        return <Masters
          brands={brands}
          vehicleNames={vehicleNames}
          cities={cities}
          areas={areas}
          subAreas={subAreas}
          suppliers={suppliers}
          customers={customers}
          purchases={branchFilteredVehicles}
          payments={payments}
          vouchers={voucherEntries}
          onUpdateBrands={setBrands}
          onUpdateVehicleNames={setVehicleNames}
          onUpdateCities={setCities}
          onUpdateAreas={setAreas}
          onUpdateSubAreas={setSubAreas}
          onUpdateSuppliers={setSuppliers}
          onUpdateCustomers={setCustomers}
          initialTab={navigationState.mastersTab}
          initialSubTab={navigationState.mastersSubTab}
          currentUser={currentUser}
          isSoftwareOwner={isSoftwareOwner}
        />;
      case "admin_console":
        return <AdminConsole
          isSoftwareOwner={isSoftwareOwner}
          onDeactivateAdmin={() => {
            setIsSoftwareOwner(false);
            localStorage.removeItem("adminToken");
            setActiveView("dashboard");
            navigate("/dashboard");
          }}
        />;
      case "settings":
        return <SettingsView
          initialTab={navigationState.settingsTab}
          currentUser={currentUser}
          businessProfile={businessProfile}
          setBusinessProfile={setBusinessProfile}
          onRefreshData={loadSyncData}
        />;
      default:
        return <Dashboard
          vehicles={vehicles}
          deals={deals}
          payments={payments}
          customers={customers}
          ledgers={ledgers}
          onNavigate={handleNavigate}
          suppliers={suppliers}
          vouchers={voucherEntries}
        />;
    }
  };
  return <div key={language} className="h-screen w-screen flex bg-slate-50 relative overflow-hidden">
      {
    /* Mobile Blur Backdrop overlay */
  }
      <AnimatePresence>
        {isMobile && isSidebarOpen && <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.4 }}
    exit={{ opacity: 0 }}
    onClick={() => setIsSidebarOpen(false)}
    className="fixed inset-0 bg-slate-900 z-45 backdrop-blur-sm cursor-pointer"
  />}
      </AnimatePresence>

      {
    /* Sidebar */
  }
      <AnimatePresence initial={false}>
        {isSidebarOpen && <motion.aside
    initial={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
    animate={isMobile ? { x: 0 } : { width: 260, opacity: 1 }}
    exit={isMobile ? { x: -280 } : { width: 0, opacity: 0 }}
    transition={{ type: "spring", damping: 26, stiffness: 220 }}
    className={cn(
      "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col overflow-hidden",
      isMobile ? "w-[280px] shadow-2xl" : "relative"
    )}
  >
            <div className="p-6 flex items-center gap-3 animate-fade-in">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img
                  src={businessProfile.companyLogo || LOGO_URL}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-tight text-slate-900 leading-tight uppercase line-clamp-2">
                  {businessProfile.companyName || "AUTO360"}
                </span>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mt-0.5">
                  {businessProfile.companyName ? "Enterprise" : "Consultancy"}
                </span>
              </div>
              {isMobile && <button onClick={() => setIsSidebarOpen(false)} className="ml-auto p-2 text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>}
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              {localizedMenuItems.map((item) => {
    const hasSubItems = !!item.subItems;
    const isExpanded = !!expandedMenus[item.id];
    const isGroupActive = hasSubItems ? item.subItems?.some((s) => isSubItemActive(item.id, s)) : activeView === (item.view || item.id);
    return <div key={item.id} className="space-y-0.5">
                    <a
                      href={`#${item.path || ""}`}
                      onClick={(e) => {
                        if (e.metaKey || e.ctrlKey) return;
                        e.preventDefault();
                        if (hasSubItems) {
                          toggleMenu(item.id);
                          const isCurrentlyActive = item.subItems?.some((s) => isSubItemActive(item.id, s));
                          if (!isCurrentlyActive) {
                            const permittedSubs = item.subItems?.filter(isSubItemPermitted);
                            const firstSub = permittedSubs?.[0];
                            if (firstSub) {
                              const targetView = firstSub.view || firstSub.id;
                              handleNavigate(targetView, firstSub.state);
                            }
                          }
                        } else {
                          const targetView = item.view || item.id;
                          handleNavigate(targetView);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group text-left",
                        isGroupActive ? "bg-brand-50 text-brand-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      )}
                    >
                      <item.icon size={20} className={cn(
                        "transition-colors",
                        isGroupActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"
                      )} />
                      <span className="flex-1 font-semibold">{item.label}</span>
                      {hasSubItems ? <ChevronDown
                        size={16}
                        className={cn(
                          "text-slate-400 transition-transform duration-200",
                          isExpanded ? "" : "-rotate-90"
                        )}
                      /> : isGroupActive && <motion.div layoutId="active-pill" className="text-brand-600">
                               <ChevronRight size={16} />
                            </motion.div>}
                    </a>

                     {
      /* Submenu rendering */
    }
                     {hasSubItems && item.id === "masters" && <AnimatePresence initial={false}>
                         {isExpanded && <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden ml-[22px] border-l border-slate-200 pl-3 mt-1.5 space-y-2 mb-2"
    >
                             {localizedMastersGroups.map((group) => {
      const isGroupExpanded = !!expandedMastersGroups[group.id];
      const isAnyItemActive = group.items.some((sub) => isSubItemActive("masters", sub));
      const GroupIcon = group.icon;
      return <div key={group.id} className="space-y-1">
                                   {
        /* Folder/Group Header */
      }
                                   <button
        onClick={(e) => {
          e.stopPropagation();
          toggleMastersGroup(group.id);
        }}
        className={cn(
          "w-full flex items-center gap-2 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase text-left transition-all cursor-pointer outline-none select-none",
          isAnyItemActive ? "text-brand-600" : "text-slate-400 hover:text-slate-700"
        )}
      >
                                     <GroupIcon size={12} className={isAnyItemActive ? "text-brand-600 animate-pulse" : "text-slate-400"} />
                                     <span className="flex-1 font-bold">{group.label}</span>
                                     <ChevronDown
        size={12}
        className={cn(
          "text-slate-450 transition-transform duration-200 mr-1",
          isGroupExpanded ? "" : "-rotate-90"
        )}
      />
                                   </button>

                                   {
        /* Folder/Group Leaves */
      }
                                   <AnimatePresence initial={false}>
                                     {isGroupExpanded && <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="overflow-hidden ml-[11px] border-l border-slate-100 pl-3.5 space-y-1"
      >
                                         {group.items.map((sub) => {
        const isActive = isSubItemActive("masters", sub);
        return <a
          key={sub.id}
          href={`#${sub.path || ""}`}
          onClick={(e) => {
            if (e.metaKey || e.ctrlKey) return;
            e.preventDefault();
            handleNavigate(sub.view, sub.state);
          }}
          className={cn(
            "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 relative text-left cursor-pointer outline-none block",
            isActive ? "text-brand-600 bg-brand-50/50 font-bold" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
          )}
        >
                                               {isActive && <span className="absolute -left-[18px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-sm shadow-brand-200" />}
                                               {sub.label}
                                             </a>;
      })}
                                       </motion.div>}
                                   </AnimatePresence>
                                 </div>;
    })}
                           </motion.div>}
                       </AnimatePresence>}

                     {hasSubItems && item.id !== "masters" && <AnimatePresence initial={false}>
                         {isExpanded && <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="overflow-hidden ml-[26px] border-l border-slate-200 pl-4 mt-1 space-y-1 mb-2"
    >
                             {item.subItems?.filter(isSubItemPermitted).map((sub) => {
      const isActive = isSubItemActive(item.id, sub);
      return <a
        key={sub.id}
        href={`#${sub.path || ""}`}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey) return;
          e.preventDefault();
          const targetView = sub.view || sub.id;
          handleNavigate(targetView, sub.state);
        }}
        className={cn(
          "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative text-left cursor-pointer outline-none block",
          isActive ? "text-brand-600 bg-brand-50/50 font-bold" : "text-slate-400 hover:bg-slate-50 hover:text-slate-800"
        )}
      >
                                   {isActive && <span className="absolute -left-[19px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-sm shadow-brand-200" />}
                                   {sub.label}
                                 </a>;
    })}
                           </motion.div>}
                       </AnimatePresence>}
                  </div>;
  })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                  {currentUser?.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{currentUser?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.role}</p>
                </div>
                <button
    onClick={handleLogout}
    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
  >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </motion.aside>}
      </AnimatePresence>

      {
    /* Main Content */
  }
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {
    /* Header */
  }
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all cursor-pointer outline-none"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img 
                  src={businessProfile.companyLogo || LOGO_URL} 
                  alt="Company Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-slate-950 leading-none uppercase tracking-tight line-clamp-1">
                  {businessProfile.companyName || "AUTO360"}
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 leading-none">
                  {currentUser?.role === "Super Admin" ? (selectedBranch === "all" ? "All Branches" : `${selectedBranch} Branch`) : `${currentUser?.branch || "Coimbatore"} Branch`}
                </span>
              </div>
            </div>
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />
            <h1 className="text-sm font-bold text-slate-600 capitalize hidden sm:block">
              {activeView.replace("-", " ")}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="hidden md:flex items-center bg-slate-100 rounded-full px-3 py-1.5 border border-transparent focus-within:border-brand-500 focus-within:bg-white transition-all shadow-sm">
              <Search size={16} className={`${isSearchingGlobal ? "text-brand-500 animate-spin" : "text-slate-400"}`} />
              <input
                type="text"
                placeholder="Search Customer ID, Purchase ID, Sales ID, Loan ID, Supplier ID..."
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs w-64 lg:w-[480px] ml-2 outline-none"
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearchQuery("");
                    setGlobalSearchResults(null);
                    setShowGlobalSearchResults(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors ml-1 p-0.5 rounded-full hover:bg-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="h-8 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2">
              <div className="text-right sm:block">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 text-left sm:text-right">Active Branch</p>
                {currentUser?.role === "Super Admin" ? <select
    value={selectedBranch}
    onChange={(e) => setSelectedBranch(e.target.value)}
    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-850 outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer transition-all"
  >
                    <option value="all">All Branches</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Erode">Erode</option>
                    <option value="Salem">Salem</option>
                    {
    /* Fallback support for any dynamically created branches */
  }
                    {branches.filter((b) => b.name !== "Coimbatore" && b.name !== "Erode" && b.name !== "Salem").map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select> : <p className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">{currentUser?.branch || "Coimbatore"}</p>}
              </div>
            </div>
          </div>
        </header>

        {
    /* Content Area */
  }
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="w-full">
            {renderView()}
          </div>
        </main>

        {/* GLOBAL SEARCH RESULTS BACKDROP DIALOG (AUTO360 ERP STYLE) */}
        <AnimatePresence>
          {showGlobalSearchResults && globalSearchResults && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Backdrop Blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowGlobalSearchResults(false);
                  setGlobalSearchQuery("");
                  setGlobalSearchResults(null);
                }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />

              {/* Modal Body */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden text-left"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-brand-400">
                      <Search size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">Global Query Search</h3>
                      <p className="text-[10px] text-slate-300 font-mono">Found matching records for "{globalSearchQuery}"</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowGlobalSearchResults(false);
                      setGlobalSearchQuery("");
                      setGlobalSearchResults(null);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer font-bold"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Tabs Bar */}
                <div className="flex items-center gap-1.5 bg-slate-50 px-6 py-2.5 border-b border-slate-200 overflow-x-auto">
                  {[
                    { id: "all", label: "All Results", count: Object.values(globalSearchResults).reduce((acc, list) => acc + list.length, 0) },
                    { id: "customers", label: "Customers", count: globalSearchResults.customers.length },
                    { id: "purchases", label: "Purchases", count: globalSearchResults.purchases.length },
                    { id: "sales", label: "Sales Deals", count: globalSearchResults.sales.length },
                    { id: "loans", label: "Binding Loans", count: globalSearchResults.loans.length },
                    { id: "suppliers", label: "Suppliers", count: globalSearchResults.suppliers.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveSearchTab(tab.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer",
                        activeSearchTab === tab.id
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {tab.label}
                      <span className={cn(
                        "px-1.5 py-0.5 text-[9px] rounded-full font-bold",
                        activeSearchTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-705"
                      )}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Modal Scrolling Tables content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
                  {/* 1. CUSTOMERS COMPONENT */}
                  {(activeSearchTab === "all" || activeSearchTab === "customers") && globalSearchResults.customers.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-blue-850 tracking-wider">Customer Registry Matches</span>
                        <span className="text-[10px] font-semibold text-blue-600 font-mono">{globalSearchResults.customers.length} Rows</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-left">
                              <th className="p-3">Customer ID</th>
                              <th className="p-3">Full Name</th>
                              <th className="p-3">Contact Mobile</th>
                              <th className="p-3">City Location</th>
                              <th className="p-3 text-center">Purchases</th>
                              <th className="p-3 text-center">Deals Count</th>
                              <th className="p-3 text-right">Actions Desk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {globalSearchResults.customers.map((c) => (
                              <tr key={c.customer_id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-blue-600">{c.customer_id}</td>
                                <td className="p-3 font-semibold text-slate-800">{c.customer_name}</td>
                                <td className="p-3 font-mono">{c.customer_mobile}</td>
                                <td className="p-3 font-medium text-slate-600">{c.city}</td>
                                <td className="p-3 text-center font-bold">{c.purchase_count}</td>
                                <td className="p-3 text-center font-bold">{c.sales_count}</td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      handleNavigate("customers", { search: c.customer_id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide cursor-pointer shadow-xs"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleNavigate("customers", { search: c.customer_id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[10px] uppercase tracking-wide cursor-pointer border border-slate-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleNavigate("customers", { search: c.customer_id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[10px] cursor-pointer"
                                  >
                                    Open Module
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 2. PURCHASES COMPONENT */}
                  {(activeSearchTab === "all" || activeSearchTab === "purchases") && globalSearchResults.purchases.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-orange-850 tracking-wider">Inward Procurement Stock</span>
                        <span className="text-[10px] font-semibold text-orange-700 font-mono">{globalSearchResults.purchases.length} Rows</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-left">
                              <th className="p-3">Purchase ID</th>
                              <th className="p-3">Vehicle details</th>
                              <th className="p-3">Reg No</th>
                              <th className="p-3">Supplier Name</th>
                              <th className="p-3 text-right">Inward Price</th>
                              <th className="p-3 text-center">Yards Status</th>
                              <th className="p-3 text-right">Actions Desk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {globalSearchResults.purchases.map((p) => (
                              <tr key={p.purchase_id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-orange-600">{p.purchase_id}</td>
                                <td className="p-3 font-semibold text-slate-800">{p.vehicleDetails}</td>
                                <td className="p-3 font-mono text-slate-700">{p.reg_no}</td>
                                <td className="p-3 font-medium">{p.seller_name}</td>
                                <td className="p-3 text-right font-bold text-slate-900 font-mono">₹{(Number(p.purchase_price) || 0).toLocaleString("en-IN")}</td>
                                <td className="p-3 text-center">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                    p.status === "Available" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {p.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      handleNavigate("purchase", { search: p.purchase_id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide cursor-pointer shadow-xs"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleNavigate("purchase", { search: p.purchase_id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[10px] uppercase tracking-wide cursor-pointer border border-slate-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handlePrintSearchResult("purchase", p)}
                                    className="px-2.5 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 font-bold text-[10px] tracking-wide cursor-pointer border border-orange-100 flex inline-flex items-center gap-1 uppercase"
                                  >
                                    Print
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 3. SALES COMPONENT */}
                  {(activeSearchTab === "all" || activeSearchTab === "sales") && globalSearchResults.sales.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 bg-green-50 border-b border-green-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-green-800 tracking-wider">Outward Sales Ledger</span>
                        <span className="text-[10px] font-semibold text-green-600 font-mono">{globalSearchResults.sales.length} Rows</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-left">
                              <th className="p-3">Sales Deal ID</th>
                              <th className="p-3">Buyer Name</th>
                              <th className="p-3">Sold Vehicle</th>
                              <th className="p-3 text-right">Sold Amount</th>
                              <th className="p-3">Branch Office</th>
                              <th className="p-3 text-right">Actions Desk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {globalSearchResults.sales.map((s) => (
                              <tr key={s.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-green-600">{s.id}</td>
                                <td className="p-3 font-semibold text-slate-800">{s.customerName}</td>
                                <td className="p-3 font-medium text-slate-700">{s.vehicleName}</td>
                                <td className="p-3 text-right font-bold text-slate-900 font-mono">₹{(Number(s.totalPrice) || 0).toLocaleString("en-IN")}</td>
                                <td className="p-3 font-mono">{s.branch}</td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      handleNavigate("sales", { search: s.id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide cursor-pointer shadow-xs"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleNavigate("sales", { search: s.id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[10px] uppercase tracking-wide cursor-pointer border border-slate-200"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handlePrintSearchResult("sales", s)}
                                    className="px-2.5 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100 font-bold text-[10px] tracking-wide cursor-pointer border border-green-100 flex inline-flex items-center gap-1 uppercase"
                                  >
                                    Print
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 4. BINDING LOANS COMPONENT */}
                  {(activeSearchTab === "all" || activeSearchTab === "loans") && globalSearchResults.loans.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-purple-800 tracking-wider">Active Binding Loans</span>
                        <span className="text-[10px] font-semibold text-purple-600 font-mono">{globalSearchResults.loans.length} Rows</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-left">
                              <th className="p-3">Loan ID</th>
                              <th className="p-3">Customer Buyer</th>
                              <th className="p-3">Financier Bank</th>
                              <th className="p-3 text-right">Sanctioned</th>
                              <th className="p-3 text-right">Balance Due</th>
                              <th className="p-3 text-center">Status</th>
                              <th className="p-3 text-right">Actions Desk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {globalSearchResults.loans.map((l) => (
                              <tr key={l.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-purple-600">{l.id}</td>
                                <td className="p-3 font-semibold text-slate-800">{l.customerName}</td>
                                <td className="p-3 font-medium text-slate-600">{l.financeName}</td>
                                <td className="p-3 text-right font-mono text-slate-900">₹{(Number(l.takenAmount) || 0).toLocaleString("en-IN")}</td>
                                <td className="p-3 text-right font-mono font-bold text-rose-600 flex-none">₹{(Number(l.dueAmount) || 0).toLocaleString("en-IN")}</td>
                                <td className="p-3 text-center">
                                  <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                    l.status === "Active" ? "bg-purple-100 text-purple-800" : "bg-slate-100 text-slate-600"
                                  )}>
                                    {l.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      handleNavigate("binding", { search: l.id });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide cursor-pointer shadow-xs"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => handlePrintSearchResult("loan", l)}
                                    className="px-2.5 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[10px] tracking-wide cursor-pointer border border-purple-100 flex inline-flex items-center gap-1 uppercase"
                                  >
                                    Print
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 5. SUPPLIERS COMPONENT */}
                  {(activeSearchTab === "all" || activeSearchTab === "suppliers") && globalSearchResults.suppliers.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                      <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-indigo-850 tracking-wider">Automotive Suppliers</span>
                        <span className="text-[10px] font-semibold text-indigo-600 font-mono">{globalSearchResults.suppliers.length} Rows</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-left">
                              <th className="p-3">Supplier ID</th>
                              <th className="p-3">Vendor Name</th>
                              <th className="p-3">Mobile Contact</th>
                              <th className="p-3">City Location</th>
                              <th className="p-3 text-center">Vehicles Supplied</th>
                              <th className="p-3 text-right">Actions Desk</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {globalSearchResults.suppliers.map((s) => (
                              <tr key={s.supplier_id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono font-bold text-indigo-600">{s.supplier_id}</td>
                                <td className="p-3 font-semibold text-slate-800">{s.supplier_name}</td>
                                <td className="p-3 font-mono">{s.supplier_mobile}</td>
                                <td className="p-3 text-slate-600">{s.city}</td>
                                <td className="p-3 text-center font-bold">{s.vehicle_count} Vehicles</td>
                                <td className="p-3 text-right space-x-1.5">
                                  <button
                                    onClick={() => {
                                      handleNavigate("masters", { mastersTab: "business", mastersSubTab: "suppliers" });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wide cursor-pointer shadow-xs"
                                  >
                                    View
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleNavigate("masters", { mastersTab: "business", mastersSubTab: "suppliers" });
                                      setShowGlobalSearchResults(false);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold text-[10px] uppercase tracking-wide cursor-pointer border border-slate-200"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Empty State Check inside the active view */}
                  {Object.values(globalSearchResults).reduce((acc, l) => acc + l.length, 0) === 0 && (
                    <div className="py-16 text-center">
                      <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Search size={22} className="stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-bold text-slate-700">No matching records found.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Please check ID formats, name queries, or mobile suffixes.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Global Secret Admin Auth Modal */}
        {showSecretAdminAuthModal && renderSecretAdminAuthModal()}
      </div>
    </div>;
}
