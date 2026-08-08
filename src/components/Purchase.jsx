import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Car,
  IndianRupee,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  Handshake,
  Eye,
  Printer,
  Upload,
  FileDown,
  Percent,
  TrendingDown,
  Download,
  Share2,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Camera,
  ArrowRightLeft,
  Sparkles,
  ShieldCheck,
  Award,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasModulePermission } from "../lib/permissions";
import { getStateCode } from "../data/indianStates";
import SalesPosterModal from "./SalesPosterModal";
import { calculateVehiclePurchaseOutstanding } from "../lib/outstandingCalculator";

const STANDARD_TOP_FEATURES = [
  "Touch Screen Display",
  "Reverse Parking Camera",
  "ABS & EBD",
  "Dual Front Airbags",
  "Power Steering",
  "Power Windows",
  "Central Remote Locking",
  "Electric Sunroof",
  "Cruise Control",
  "Bluetooth & USB Connectivity",
  "Android Auto & Apple CarPlay",
  "Front Fog Lamps",
  "Automatic LED Headlamps",
  "Rear Parking Sensors",
  "Alloy Wheels",
  "GPS Navigation System",
  "Premium Audio System",
  "Leatherette Seat Covers",
  "Smart Keyless Push Start",
  "Automatic Climate Control"
];

const STANDARD_HIGHLIGHTS = [
  "Single Owner",
  "Accident Free",
  "Company Service",
  "Finance Available",
  "Insurance Valid",
  "RC Ready",
  "ABS",
  "Touch Screen",
  "Reverse Camera",
  "Power Steering",
  "Power Windows",
  "Central Locking"
];

export default function PurchasesListAndForm({
  vehicles,
  onUpdateVehicles,
  brands,
  vehicleNames,
  cities,
  areas,
  subAreas,
  customers,
  suppliers,
  onUpdateDeals,
  onNavigate,
  selectedBranch = "all",
  currentUser,
  businessProfile,
  initialSearch,
  payments = [],
  vouchers = []
}) {
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
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
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [uploadMetadata, setUploadMetadata] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [activeLoanPurchase, setActiveLoanPurchase] = useState(null);
  const [loanState, setLoanState] = useState({
    loan_amount: 0,
    loan_finance_company: "",
    loan_emi_amount: 0,
    loan_emi_date: "",
    loan_status: "Pending"
  });
  const [vehicleToShare, setVehicleToShare] = useState(null);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [formState, setFormState] = useState({
    purchase_id: "",
    purchase_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    purchase_type: "Customer",
    seller_id: "",
    seller_name: "",
    seller_mobile: "",
    seller_city_id: "",
    seller_area_id: "",
    seller_sub_area_id: "",
    seller_address: "",
    vehicle_type: "Four Wheeler",
    brand_id: "",
    vehicle_name_id: "",
    reg_no: "",
    model_details: "",
    year: (/* @__PURE__ */ new Date()).getFullYear(),
    fuel_type: "Petrol",
    kms_driven: "",
    tyre_status: "Good",
    rc_type: "Smart Card",
    owner_details: "1st Owner",
    engine_number: "",
    chassis_number: "",
    challan_pending: "No",
    noc_available: "No",
    insurance_active: "No",
    vehicle_image: "",
    vehicle_images: {
      front: "",
      back: "",
      left: "",
      right: "",
      interior: "",
      engine: "",
      meter: ""
    },
    top_features: [],
    vehicle_highlights: [],
    transfer_status: "No",
    transfer_date: "",
    transfer_remarks: "",
    transferred_by: "",
    rc_upload: "",
    noc_upload: "",
    insurance_doc: "",
    purchase_price: 0,
    advance_price: 0,
    balance_amount: 0,
    consultancy_fees: 0,
    expected_selling_price: 0,
    payment_mode: "Cash",
    status: "Available"
  });
  const availableBrands = useMemo(() => {
    if (!formState.vehicle_type) return brands;
    const modelsOfType = vehicleNames.filter((vn) => vn.vehicleType === formState.vehicle_type && !vn.isDeleted);
    const brandIdsOfType = new Set(modelsOfType.map((m) => m.brandId));
    return brands.filter((b) => brandIdsOfType.has(b.id) || modelsOfType.some((m) => m.brandId === b.name));
  }, [brands, vehicleNames, formState.vehicle_type]);
  const availableModels = useMemo(() => {
    let filtered = vehicleNames.filter((vn) => !vn.isDeleted);
    if (formState.vehicle_type) {
      filtered = filtered.filter((vn) => vn.vehicleType === formState.vehicle_type);
    }
    if (formState.brand_id) {
      const targetBrand = brands.find((b) => b.name === formState.brand_id || b.id === formState.brand_id);
      if (targetBrand) {
        filtered = filtered.filter((vn) => vn.brandId === targetBrand.id || vn.brandId === targetBrand.name);
      }
    }
    return filtered;
  }, [vehicleNames, brands, formState.vehicle_type, formState.brand_id]);
  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const typeQS = typeFilter !== "all" ? `&type=${typeFilter}` : "";
      const statusQS = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const branchQS = selectedBranch !== "all" ? `&branch=${selectedBranch}` : "";
      const fromQS = fromDate ? `&fromDate=${fromDate}` : "";
      const toQS = toDate ? `&toDate=${toDate}` : "";
      const res = await fetch(`/api/purchases?page=${page}&limit=${limit}&search=${encodeURIComponent(searchQuery)}${typeQS}${statusQS}${branchQS}${fromQS}${toQS}`);
      if (res.ok) {
        const result = await res.json();
        setPurchases(result.data || []);
        setTotalPages(result.pagination?.totalPages || 1);
        setTotalCount(result.pagination?.totalCount || 0);
        if (result.data) {
          const mappedVehicles = result.data.map((p) => {
            const purPrice = Number(p.purchase_price || p.purchasePrice) || 0;
            const advPrice = Number(
              p.advance_price !== undefined && p.advance_price !== null && p.advance_price !== ""
                ? p.advance_price
                : (p.advancePaid !== undefined && p.advancePaid !== null && p.advancePaid !== ""
                    ? p.advancePaid
                    : (p.advance_amount !== undefined && p.advance_amount !== null && p.advance_amount !== ""
                        ? p.advance_amount
                        : (p.advanceAmount !== undefined && p.advanceAmount !== null && p.advanceAmount !== ""
                            ? p.advanceAmount
                            : 0)))
            ) || 0;
            const balAmount = (p.balance_amount !== undefined && p.balance_amount !== null && p.balance_amount !== "")
              ? Number(p.balance_amount)
              : ((p.balanceAmount !== undefined && p.balanceAmount !== null && p.balanceAmount !== "")
                  ? Number(p.balanceAmount)
                  : Math.max(0, purPrice - advPrice));

            return {
              ...p,
              id: p.purchase_id || p.id,
              purchase_id: p.purchase_id || p.id,
              name: p.vehicle_name_id,
              brand: p.brand_id,
              model: p.model_details,
              year: p.year,
              fuelType: p.fuel_type,
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
              sellerType: p.purchase_type || p.sellerType || "Customer",
              purchase_type: p.purchase_type || p.sellerType || "Customer",
              sellerId: p.seller_id || p.sellerId || "",
              seller_id: p.seller_id || p.sellerId || "",
              sellerName: p.seller_name || p.sellerName || "",
              seller_name: p.seller_name || p.sellerName || "",
              sellerMobile: p.seller_mobile || p.sellerMobile || "",
              seller_mobile: p.seller_mobile || p.sellerMobile || "",
              ownerDetails: p.owner_details,
              status: p.status === "Available" ? "Available" : p.status === "Booked" ? "Reserved" : "Sold",
              vehicleType: p.vehicle_type,
              regNo: p.reg_no || p.regNo || "",
              reg_no: p.reg_no || p.regNo || "",
              vehicle_image: p.vehicle_image || p.vehicle_images?.front || "",
              vehicle_images: p.vehicle_images || { front: p.vehicle_image || "", back: "", left: "", right: "", interior: "", engine: "" },
              photos: p.vehicle_image ? [p.vehicle_image] : (p.vehicle_images?.front ? [p.vehicle_images.front] : []),
              transfer_status: p.transfer_status || "No",
              transferStatus: p.transfer_status || "No",
              transfer_date: p.transfer_date || "",
              transfer_remarks: p.transfer_remarks || "",
              transferred_by: p.transferred_by || "",
              challan: {
                hasChallan: p.challan_pending === "Yes",
                amount: p.challan_pending === "Yes" ? 500 : 0
              },
              tyreStatus: p.tyre_status || "Good",
              insurance: {
                hasInsurance: p.insurance_active === "Yes",
                docUrl: p.insurance_doc
              },
              rcType: p.rc_type === "Smart Card" ? "Card" : "Paper",
              noc: {
                hasNoc: p.noc_available === "Yes"
              },
              totalExpenses: (Number(p.fuel_expense) || 0) + (Number(p.repair_expense) || 0) + (Number(p.service_expense) || 0) + (Number(p.insurance_expense) || 0) + (Number(p.rto_expense) || 0) + (Number(p.other_expense) || 0),
              consultancyFees: p.consultancy_fees,
              cityId: p.seller_city_id,
              areaId: p.seller_area_id,
              subAreaId: p.seller_sub_area_id,
              isDeleted: p.isDeleted,
              createdBy: "Admin",
              createdAt: p.created_at
            };
          });
          onUpdateVehicles(mappedVehicles);
        }
      }
    } catch (e) {
      console.error("Error fetching purchases", e);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchPurchases();
  }, [page, searchQuery, typeFilter, statusFilter, selectedBranch, fromDate, toDate]);
  const fetchNextPurchaseId = async () => {
    try {
      const res = await fetch("/api/purchases/nextId");
      if (res.ok) {
        const data = await res.json();
        setFormState((prev) => ({
          ...prev,
          purchase_id: data.nextId
        }));
      }
    } catch (e) {
      console.error("Error fetching next purchase ID", e);
    }
  };
  const handleSellerChange = async (sellerId) => {
    if (!sellerId) {
      setFormState((prev) => ({
        ...prev,
        seller_id: "",
        seller_name: "",
        seller_mobile: "",
        seller_city_id: "",
        seller_area_id: "",
        seller_sub_area_id: "",
        seller_address: ""
      }));
      return;
    }
    const type = formState.purchase_type;
    const url = type === "Customer" ? `/api/customers/fetch/${sellerId}` : `/api/suppliers/fetch/${sellerId}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const sellerData = await res.json();
        setFormState((prev) => ({
          ...prev,
          seller_id: sellerId,
          seller_name: sellerData.customer_name || sellerData.supplier_name || "",
          seller_mobile: sellerData.customer_mobile || sellerData.supplier_mobile || "",
          seller_city_id: sellerData.city_id || "",
          seller_area_id: sellerData.area_id || "",
          seller_sub_area_id: sellerData.sub_area_id || "",
          seller_address: sellerData.address || ""
        }));
      }
    } catch (e) {
      console.error("Error loading seller auto fetch details", e);
    }
  };
  const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.8) => {
    return new Promise((resolve) => {
      if (!file || !file.type || !file.type.startsWith("image/")) {
        resolve(file);
        return;
      }
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, "image/jpeg", quality);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
    });
  };

  const processCategoryUpload = async (file, categoryKey) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
      alert("Unsupported file format! Please upload a JPG, JPEG, PNG, or WEBP image.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Image is too large! Maximum allowed size is 10MB.");
      return;
    }

    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
    const progressKey = `category_${categoryKey}`;
    
    setUploadMetadata((prev) => ({
      ...prev,
      [progressKey]: { name: file.name, size: sizeStr }
    }));

    setUploadProgress((prev) => ({
      ...prev,
      [progressKey]: 15
    }));

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const curr = prev[progressKey] || 15;
        if (curr >= 90) return prev;
        return { ...prev, [progressKey]: curr + 15 };
      });
    }, 120);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressed);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      clearInterval(progressInterval);

      if (res.ok) {
        setUploadProgress((prev) => ({
          ...prev,
          [progressKey]: 100
        }));
        const data = await res.json();
        
        setFormState((prev) => {
          const updatedImages = {
            ...(prev.vehicle_images || { front: "", back: "", left: "", right: "", interior: "", engine: "" }),
            [categoryKey]: data.filePath
          };
          const primaryImage = updatedImages.front || updatedImages.back || updatedImages.left || updatedImages.right || updatedImages.interior || updatedImages.engine || prev.vehicle_image;
          return {
            ...prev,
            vehicle_images: updatedImages,
            vehicle_image: primaryImage
          };
        });

        setTimeout(() => {
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[progressKey];
            return next;
          });
        }, 800);
      } else {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[progressKey];
          return next;
        });
        alert("Failed to upload image. Please try again.");
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[progressKey];
        return next;
      });
      console.error("Error uploading category image", err);
      alert("Error uploading category image.");
    }
  };

  const handleCategoryFileUpload = (e, categoryKey) => {
    const file = e.target.files?.[0];
    if (file) {
      processCategoryUpload(file, categoryKey);
    }
  };

  const handleMultiCategoryUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const categories = ["front", "back", "left", "right", "interior", "engine"];
    const currentImages = formState.vehicle_images || {};

    const emptyCategories = categories.filter((c) => !currentImages[c]);
    const targetCategories = emptyCategories.length > 0 ? emptyCategories : categories;

    files.forEach((file, index) => {
      const cat = targetCategories[index % targetCategories.length];
      if (cat) {
        processCategoryUpload(file, cat);
      }
    });
  };

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict format validation
    const ext = file.name.split('.').pop().toLowerCase();
    const isImageField = fieldName === "vehicle_image";
    
    if (isImageField) {
      if (!["jpg", "jpeg", "png"].includes(ext)) {
        alert("Invalid file format! Primary vehicle image must be a JPG, JPEG, or PNG.");
        return;
      }
    } else {
      if (!["jpg", "jpeg", "png", "pdf"].includes(ext)) {
        alert("Invalid file format! Documents must be a JPG, JPEG, PNG, or PDF file.");
        return;
      }
    }

    // Max size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("File is too large! Maximum limit is 10MB");
      return;
    }

    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
    setUploadMetadata((prev) => ({
      ...prev,
      [fieldName]: { name: file.name, size: sizeStr }
    }));

    // Initialize progress tracking animated states
    setUploadProgress((prev) => ({
      ...prev,
      [fieldName]: 10
    }));

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const curr = prev[fieldName] || 10;
        if (curr >= 90) return prev;
        return { ...prev, [fieldName]: curr + 15 };
      });
    }, 120);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      clearInterval(progressInterval);

      if (res.ok) {
        setUploadProgress((prev) => ({
          ...prev,
          [fieldName]: 100
        }));
        const data = await res.json();
        setFormState((prev) => ({
          ...prev,
          [fieldName]: data.filePath
        }));
        
        // Let the 100% state shine, then clean it from the view
        setTimeout(() => {
          setUploadProgress((prev) => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
        }, 800);
      } else {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[fieldName];
          return next;
        });
        const text = await res.text();
        let errMsg = "Unknown error";
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.error || errMsg;
        } catch (_) {}
        alert("Upload error: " + errMsg);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
      console.error("Error uploading document", err);
      alert("Failed to upload document");
    }
  };
  const purchasePrice = Number(formState.purchase_price) || 0;
  const advancePrice = Number(formState.advance_price) || 0;
  const balanceAmount = purchasePrice - advancePrice;
  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      balance_amount: balanceAmount
    }));
  }, [purchasePrice, advancePrice]);
  const handleOpenAdd = async () => {
    setIsEditMode(false);
    setSelectedPurchase(null);
    let currentState = businessProfile?.defaultState || businessProfile?.state || "Tamil Nadu";
    try {
      const res = await fetch("/api/settings/general");
      if (res.ok) {
        const genData = await res.json();
        if (genData?.defaultState) {
          currentState = genData.defaultState;
        }
      }
    } catch (err) {
      console.warn("Could not fetch latest settings/general:", err);
    }
    const stateCode = getStateCode(currentState);
    const initialRegNo = stateCode ? `${stateCode} ` : "";
    setFormState({
      purchase_id: "",
      purchase_date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      purchase_type: "Customer",
      seller_id: "",
      seller_name: "",
      seller_mobile: "",
      seller_city_id: "",
      seller_area_id: "",
      seller_sub_area_id: "",
      seller_address: "",
      vehicle_type: "Four Wheeler",
      brand_id: "",
      vehicle_name_id: "",
      reg_no: initialRegNo,
      model_details: "",
      year: (/* @__PURE__ */ new Date()).getFullYear(),
      fuel_type: "Petrol",
      kms_driven: "",
      tyre_status: "Good",
      rc_type: "Smart Card",
      owner_details: "1st Owner",
      engine_number: "",
      chassis_number: "",
      challan_pending: "No",
      noc_available: "No",
      insurance_active: "No",
      vehicle_image: "",
      vehicle_images: {
        front: "",
        back: "",
        left: "",
        right: "",
        interior: "",
        engine: "",
        meter: ""
      },
      top_features: [],
      vehicle_highlights: [],
      transfer_status: "No",
      transfer_date: "",
      transfer_remarks: "",
      transferred_by: "",
      rc_upload: "",
      noc_upload: "",
      insurance_doc: "",
      purchase_price: 0,
      advance_price: 0,
      balance_amount: 0,
      consultancy_fees: 0,
      expected_selling_price: 0,
      payment_mode: "Cash",
      status: "Available"
    });
    fetchNextPurchaseId();
    setShowAddEditModal(true);
  };

  const handleAddCustomFeature = () => {
    if (!customFeatureInput.trim()) return;
    const feat = customFeatureInput.trim();
    const current = formState.top_features || [];
    if (!current.includes(feat)) {
      setFormState((prev) => ({ ...prev, top_features: [...current, feat] }));
    }
    setCustomFeatureInput("");
  };

  const handleOpenEdit = (p) => {
    setIsEditMode(true);
    setSelectedPurchase(p);
    const existingImages = p.vehicle_images || {
      front: p.vehicle_image || "",
      back: "",
      left: "",
      right: "",
      interior: "",
      engine: "",
      meter: ""
    };
    setFormState({
      ...p,
      vehicle_images: existingImages,
      top_features: p.top_features || p.topFeatures || [],
      vehicle_highlights: p.vehicle_highlights || p.vehicleHighlights || [],
      transfer_status: p.transfer_status || p.transferStatus || "No",
      transfer_date: p.transfer_date || "",
      transfer_remarks: p.transfer_remarks || "",
      transferred_by: p.transferred_by || ""
    });
    setShowAddEditModal(true);
  };
  const handleOpenLoanModal = (p) => {
    setActiveLoanPurchase(p);
    setLoanState({
      loan_amount: Number(p.loan_amount) || 0,
      loan_finance_company: p.loan_finance_company || "",
      loan_emi_amount: Number(p.loan_emi_amount) || 0,
      loan_emi_date: p.loan_emi_date || "",
      loan_status: p.loan_status || "Active"
    });
    setShowLoanModal(true);
  };
  const handleSaveLoan = async (e) => {
    e.preventDefault();
    if (!activeLoanPurchase) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/purchases/${activeLoanPurchase.purchase_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...activeLoanPurchase,
          ...loanState
        })
      });
      if (res.ok) {
        setShowLoanModal(false);
        setSuccessToast("Loan details updated successfully!");
        setTimeout(() => setSuccessToast(null), 3e3);
        fetchPurchases();
      } else {
        const err = await res.json();
        alert("Failed to save loan details: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving loan details", err);
      alert("Failed to save loan info");
    } finally {
      setIsSaving(false);
    }
  };
  const handleExpenseIconClick = (p) => {
    onNavigate("accounts", {
      accountsTab: "voucher",
      voucherData: {
        vehicleId: p.purchase_id,
        regNo: p.reg_no,
        vehicleName: `${p.brand_id} - ${p.vehicle_name_id}`
      }
    });
  };
  const handleSalesIconClick = (p) => {
    const presetSalesPrice = Number(p.expected_selling_price || p.sales_price || p.salesPrice || p.expectedSellingPrice || p.offerPrice || p.offer_price) || 0;
    const mappedVehDoc = {
      id: p.purchase_id,
      name: `${p.brand_id} - ${p.vehicle_name_id}`,
      brand: p.brand_id,
      model: p.vehicle_name_id,
      year: p.year,
      fuelType: p.fuel_type,
      purchasePrice: Number(p.purchase_price) || 0,
      purchase_price: Number(p.purchase_price) || 0,
      salesPrice: presetSalesPrice,
      sales_price: presetSalesPrice,
      sellingPrice: presetSalesPrice,
      selling_price: presetSalesPrice,
      expectedSellingPrice: presetSalesPrice,
      expected_selling_price: presetSalesPrice,
      offerPrice: presetSalesPrice,
      offer_price: presetSalesPrice,
      ownerDetails: p.owner_details,
      status: p.status,
      vehicleType: p.vehicle_type,
      regNo: p.reg_no,
      photos: p.vehicle_image ? [p.vehicle_image] : [],
      challan: { hasChallan: p.challan_pending === "Yes", amount: 0 },
      tyreStatus: p.tyre_status || "Good",
      insurance: { hasInsurance: p.insurance_active === "Yes" },
      rcType: p.rc_type === "Smart Card" ? "Card" : "Paper",
      noc: { hasNoc: p.noc_available === "Yes" },
      balance: p.balance_amount,
      totalExpenses: (Number(p.fuel_expense) || 0) + (Number(p.repair_expense) || 0) + (Number(p.service_expense) || 0) + (Number(p.insurance_expense) || 0) + (Number(p.rto_expense) || 0) + (Number(p.other_expense) || 0),
      consultancyFees: p.consultancy_fees,
      isDeleted: false,
      createdBy: "Admin",
      createdAt: p.created_at
    };
    onNavigate("sales", { salesVehicle: mappedVehDoc });
  };
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formState.seller_id) {
      alert("Please select a valid Customer/Supplier ID");
      return;
    }
    if (!formState.brand_id) {
      alert("Please select vehicle brand");
      return;
    }
    if (!formState.vehicle_name_id) {
      alert("Please select vehicle name (model)");
      return;
    }
    if (!formState.reg_no) {
      alert("Please enter a registration number");
      return;
    }
    const salesPriceVal = Number(formState.expected_selling_price) || 0;
    const payload = {
      ...formState,
      balance_amount: balanceAmount,
      selling_price: salesPriceVal,
      expected_selling_price: salesPriceVal,
      offerPrice: salesPriceVal,
      offer_price: salesPriceVal,
      sales_price: salesPriceVal
    };
    setIsSaving(true);
    try {
      const url = isEditMode ? `/api/purchases/${selectedPurchase?.purchase_id}` : "/api/purchases";
      const method = isEditMode ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddEditModal(false);
        setSuccessToast(isEditMode ? "Purchase record updated successfully!" : "New purchase record created successfully!");
        setTimeout(() => setSuccessToast(null), 3e3);
        fetchPurchases();
      } else {
        const err = await res.json();
        alert("Error saving purchase: " + (err.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error saving purchase info", err);
      alert("Failed to save purchase record due to dynamic communication error");
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeletePurchase = (purchaseId) => {
    setDeleteConfirm({
      isOpen: true,
      message: "Are you sure you want to delete this record?",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/purchases/${purchaseId}`, {
            method: "DELETE"
          });
          if (res.ok) {
            fetchPurchases();
          } else {
            alert("Failed to delete purchase record");
          }
        } catch (e) {
          console.error("Delete database transmission failure", e);
        }
      }
    });
  };
  const handlePrintReceipt = (p) => {
    const doc = new jsPDF();
    const dateStr = new Date(p.purchase_date).toLocaleDateString();

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
      if (businessProfile?.cin) subLines.push(`CIN: ${businessProfile.cin}`);

      if (subLines.length === 0) {
        subLines.push("Automotive Consultancy \u2022 Quality Pre-Owned Vehicle Stock Receipts");
      }

      const addressLineText = subLines.join(" | ");
      const splitAddress = doc.splitTextToSize(addressLineText, 185 - textStartX);
      doc.text(splitAddress, textStartX, 22);

      doc.setDrawColor(226, 232, 240);
      doc.line(20, 31, 190, 31);

      // Invoice info block
      doc.setFontSize(9.5);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(51, 65, 85);
      doc.text(`Purchase Track ID: ${p.purchase_id}`, 20, 39);
      doc.setFont("Helvetica", "normal");
      doc.text(`Transaction Type: Purchase via ${p.purchase_type}`, 20, 45);

      doc.setFont("Helvetica", "bold");
      doc.text(`Purchase Date: ${dateStr}`, 190, 39, { align: "right" });
      doc.setFont("Helvetica", "normal");
      doc.text(`Status of Stock: ${p.status}`, 190, 45, { align: "right" });

      // Seller Information Details
      doc.setFontSize(10.5);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Seller Information Details", 20, 57);
      doc.setLineWidth(0.5);
      doc.line(20, 60, 95, 60);

      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Seller ID: ${p.seller_id}`, 20, 66);
      doc.text(`Seller Name: ${p.seller_name}`, 20, 71);
      doc.text(`Mobile Number: ${p.seller_mobile}`, 20, 76);
      const cityText = cities.find((c) => c.id === p.seller_city_id)?.name || p.seller_city_id || "N/A";
      const areaText = areas.find((a) => a.id === p.seller_area_id)?.name || p.seller_area_id || "N/A";
      const subAreaText = subAreas.find((sa) => sa.id === p.seller_sub_area_id)?.name || p.seller_sub_area_id || "N/A";
      doc.text(`Location: ${cityText}, ${areaText}`, 20, 81);
      doc.text(`Sub area: ${subAreaText}`, 20, 86);
      doc.text(`Address: ${p.seller_address || "N/A"}`, 20, 91);

      // Vehicle Overview
      doc.setFontSize(10.5);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Vehicle Overview", 115, 57);
      doc.line(115, 60, 190, 60);

      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Vehicle Type: ${p.vehicle_type}`, 115, 66);
      doc.text(`Brand Name: ${p.brand_id}`, 115, 71);
      doc.text(`Model (Name): ${p.vehicle_name_id}`, 115, 76);
      doc.text(`Registration No: ${p.reg_no}`, 115, 81);
      doc.text(`Fuel / Year: ${p.fuel_type} / ${p.year}`, 115, 86);
      doc.text(`RC Type: ${p.rc_type}`, 115, 91);
      doc.text(`Chassis: ${p.chassis_number || "N/A"}`, 115, 96);

      const tableData = [
        ["Section Item Description", "Value Amount (INR)"],
        ["Purchase Valuation Price", `INR ${(Number(p?.purchase_price) || 0).toLocaleString("en-IN")}`],
        ["Advance Paid Amount", `INR ${(Number(p?.advance_price) || 0).toLocaleString("en-IN")}`],
        ["Remaining Balance Amount Due", `INR ${(Number(p?.balance_amount) || 0).toLocaleString("en-IN")}`],
        ["Consultancy Service Fees", `INR ${(Number(p?.consultancy_fees) || 0).toLocaleString("en-IN")}`]
      ];
      autoTable(doc, {
        startY: 104,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: "grid",
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: {
          0: { cellWidth: 120 },
          1: { cellWidth: 50, halign: "right" }
        }
      });

      const finalY = doc.lastAutoTable.finalY + 12;
      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(`Total Investment Balance: INR ${(Number(p?.balance_amount) || 0).toLocaleString("en-IN")}`, 190, finalY, { align: "right" });

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

      doc.save(`Invoice_Purchase_${p.purchase_id}.pdf`);
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
  const totalStockValue = purchases.reduce((acc, current) => acc + (Number(current.purchase_price) || 0), 0);
  const totalActiveBalance = useMemo(() => {
    return purchases.reduce((acc, current) => {
      if (current.isDeleted) return acc;
      const stats = calculateVehiclePurchaseOutstanding(current, payments, vouchers);
      return acc + stats.outstanding;
    }, 0);
  }, [purchases, payments, vouchers]);
  return <div className="space-y-6">
      {
    /* Title & Header Section  */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Inventory Records</h2>
          <p className="text-sm text-slate-500">Track professional vehicle acquisition with Dynamic CRM flow</p>
        </div>
        {hasModulePermission(currentUser, "purchase", "create") && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
            id="add-purchase-btn"
          >
            <Plus size={18} />
            Add Purchase Vehicle
          </button>
        )}
      </div>

      {
    /* Numerical Quick Cards */
  }
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acquisition Assets</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{(Number(totalStockValue) || 0).toLocaleString("en-IN")}</h3>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl">
            <Car size={22} />
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-emerald-600">Available Stock</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {purchases.filter((p) => p.status === "Available").length} Units
            </h3>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-amber-600">Outstanding Balance</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{(Number(totalActiveBalance) || 0).toLocaleString("en-IN")}</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
            <IndianRupee size={22} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-rose-500">Transaction Actions</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{totalCount} Total</h3>
          </div>
          <div className="bg-rose-50 text-rose-600 p-2.5 rounded-xl">
            <Handshake size={22} />
          </div>
        </div>
      </div>

      {
    /* Search & Dynamic Filter Controls */
  }
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
    type="text"
    placeholder="Search Purchases by ID, Registration No, Brand, Seller Name..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm font-medium"
  />
        </div>

        {
    /* Dynamic type filters */
  }
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
          {["all", "Customer", "Supplier"].map((type) => <button
    key={type}
    onClick={() => {
      setTypeFilter(type);
      setPage(1);
    }}
    className={cn(
      "px-5 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all whitespace-nowrap",
      typeFilter === type ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
    )}
  >
              {type === "all" ? "All Roles" : `${type} Sourced`}
            </button>)}
        </div>

        {
    /* Dynamic status filters */
  }
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 w-full md:w-auto overflow-x-auto no-scrollbar">
          {["all", "Available", "Booked", "Sold"].map((status) => <button
    key={status}
    onClick={() => {
      setStatusFilter(status);
      setPage(1);
    }}
    className={cn(
      "px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-widest transition-all whitespace-nowrap",
      statusFilter === status ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
    )}
  >
              {status}
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
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">To</span>
          <input
            type="date"
            value={localTo}
            onChange={(e) => setLocalTo(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold font-mono focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            setFromDate(localFrom);
            setToDate(localTo);
            setPage(1);
          }}
          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-xl transition-all font-mono cursor-pointer shadow-sm shadow-indigo-100"
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
            setPage(1);
          }}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold uppercase rounded-xl transition-all cursor-pointer"
        >
          Reset
        </button>
      </div>

      {
    /* Main Database Card/Grid Output */
  }
      {isLoading ? <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-2xl">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-500 mt-4">Connecting to core database server...</p>
        </div> : purchases.length === 0 ? <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <div className="text-slate-400 mb-3 flex justify-center"><AlertCircle size={44} /></div>
          <h3 className="text-lg font-bold text-slate-700">No Purchase Records Found</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">Please add a purchase entry or clear your current filtering attributes.</p>
        </div> : <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {purchases.map((p) => {
    const statusColors = {
      "available": "bg-emerald-50 text-emerald-700 border-emerald-200",
      "booked": "bg-amber-50 text-amber-700 border-amber-200",
      "sold": "bg-slate-100 text-slate-700 border-slate-200",
      "loan active": "bg-indigo-50 text-indigo-700 border-indigo-200",
      "binding loan closed": "bg-teal-50 text-teal-700 border-teal-200",
      "expense pending": "bg-rose-50 text-rose-700 border-rose-200"
    };
    const normalizedStatus = (p.status || "Available").toLowerCase();
    const badgeStyle = statusColors[normalizedStatus] || "bg-slate-50 text-slate-600 border-slate-200";
    return <div key={p.purchase_id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group relative">
                  {
      /* Status Badge */
    }
                  <span className={cn(
      "absolute top-3 right-3 z-10 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg border shadow-sm tracking-wider",
      badgeStyle
    )}>
                    {p.status || "Available"}
                  </span>

                  {
      /* Image banner fallback */
    }
                  <div className="relative h-44 bg-slate-900 overflow-hidden shrink-0">
                    {p.vehicle_image ? <img
      src={p.vehicle_image}
      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
      alt={p.vehicle_name_id}
      referrerPolicy="no-referrer"
    /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100 border-b border-slate-200">
                        <span className="font-extrabold text-xs uppercase tracking-widest text-slate-400">No Image Preview</span>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">{p.brand_id} {p.vehicle_name_id}</span>
                      </div>}
                  </div>

                  {
      /* Card Content */
    }
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      {
      /* Registration No Badge */
    }
                      <span className="inline-block font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-extrabold uppercase tracking-wide mb-2">
                        {p.reg_no || "No Reg No"}
                      </span>

                      {
      /* Title */
    }
                      <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {p.brand_id} {p.vehicle_name_id}
                      </h4>

                      {
      /* Sub-specification metadata info */
    }
                      <div className="flex gap-2 text-xs text-slate-400 mt-1 capitalize font-bold">
                        <span>{p.year}</span>
                        <span>•</span>
                        <span>{p.fuel_type}</span>
                        <span>•</span>
                        <span>{p.vehicle_type}</span>
                      </div>

                      {
      /* Buyer detail / Source indicator */
    }
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Source:</span>
                        <span className={cn(
      "px-2 py-0.5 rounded-lg text-[10px] uppercase font-bold",
      p.purchase_type === "Customer" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
    )}>
                          {p.purchase_type} ({p.seller_name})
                        </span>
                      </div>
                    </div>

                    {
      /* Financial Data block */
                    }
                    {(() => {
                      const totalExpenses = (Number(p.fuel_expense) || 0) + (Number(p.repair_expense) || 0) + (Number(p.service_expense) || 0) + (Number(p.insurance_expense) || 0) + (Number(p.rto_expense) || 0) + (Number(p.other_expense) || 0);
                      let expenseCount = 0;
                      if (Number(p.fuel_expense) > 0) expenseCount++;
                      if (Number(p.repair_expense) > 0) expenseCount++;
                      if (Number(p.service_expense) > 0) expenseCount++;
                      if (Number(p.insurance_expense) > 0) expenseCount++;
                      if (Number(p.rto_expense) > 0) expenseCount++;
                      if (Number(p.other_expense) > 0) expenseCount++;
                      
                      const consultancyFees = Number(p.consultancy_fees) || 0;
                      const purchasePrice = Number(p.purchase_price) || 0;
                      const totalCost = purchasePrice + totalExpenses + consultancyFees;
                      const expectedSellingPrice = Number(p.expected_selling_price) || 0;
                      const potentialProfit = expectedSellingPrice > 0 ? (expectedSellingPrice - totalCost) : 0;
                      return (
                        <div className="mt-4 pt-3 border-t border-slate-100/80 grid grid-cols-2 gap-x-4 gap-y-2.5">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Purchase Price</p>
                            <p className="text-xs font-bold text-slate-800">₹{(Number(purchasePrice) || 0).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expenses ({expenseCount})</p>
                            <p className="text-xs font-bold text-slate-800">₹{(Number(totalExpenses) || 0).toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Consultancy Fees</p>
                            <p className="text-xs font-bold text-slate-800">₹{(Number(consultancyFees) || 0).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Cost</p>
                            <p className="text-xs font-extrabold text-indigo-700">₹{(Number(totalCost) || 0).toLocaleString("en-IN")}</p>
                          </div>
                          {expectedSellingPrice > 0 && (
                            <>
                              <div className="pt-1 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Offer Price</p>
                                <p className="text-xs font-bold text-slate-800">₹{(Number(expectedSellingPrice) || 0).toLocaleString("en-IN")}</p>
                              </div>
                              <div className="text-right pt-1 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Potential Profit</p>
                                <p className={cn(
                                  "text-xs font-extrabold",
                                  potentialProfit >= 0 ? "text-emerald-600" : "text-rose-500"
                                )}>
                                  ₹{(Number(potentialProfit) || 0).toLocaleString("en-IN")}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {
      /* Action Items Footer Bar */
    }
                    <div className="mt-5 pt-3 border-t border-slate-100 flex justify-between items-center gap-1.5 overflow-x-auto no-scrollbar">
                      {
      /* 1. View Detail Modal */
    }
                      <button
      onClick={() => {
        setSelectedPurchase(p);
        setShowViewModal(true);
      }}
      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
      title="View Complete Report"
    >
                        <Eye size={15} />
                      </button>

                      {
      /* 2. Edit Action */
    }
                      {hasModulePermission(currentUser, "purchase", "edit") && (
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit Record"
                        >
                          <Edit2 size={15} />
                        </button>
                      )}

                      {
      /* 3. Print Certificate */
    }
                      <button
      onClick={() => handlePrintReceipt(p)}
      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-lg transition-all"
      title="Print PDF Invoice"
    >
                        <Printer size={15} />
                      </button>

                      {
      /* WhatsApp Share Button */
    }
                      <button
      onClick={() => setVehicleToShare(p)}
      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all flex items-center justify-center cursor-pointer"
      title="Share on WhatsApp Quote"
    >
                        <svg className="w-4 h-4 fill-current text-slate-500 hover:text-emerald-600" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-2.02 0-3.659 1.635-3.659 3.659 0 2.020 1.638 3.656 3.659 3.656 2.024 0 3.659-1.636 3.659-3.656 0-2.024-1.635-3.659-3.659-3.659zM21.99 12c0-5.514-4.477-9.99-9.99-9.99S2.01 6.486 2.01 12c0 2.164.697 4.159 1.879 5.807L2.04 22l4.316-1.802A9.924 9.924 0 0012 21.99c5.513 0 9.99-4.476 9.99-9.99zM12 20.301c-1.677 0-3.239-.462-4.582-1.258l-.328-.194-2.541.106.108-2.434-.21-.35c-.886-1.472-1.353-3.155-1.353-4.908.002-4.977 4.053-9.028 9.034-9.028 4.978 0 9.028 4.053 9.028 9.032-.002 4.978-4.053 9.03-9.032 9.03z" />
                        </svg>
                      </button>

                      {
      /* 4. Sales Icon click redirect */
    }
                      {p.status !== "Sold" ? <button
      onClick={() => handleSalesIconClick(p)}
      className="p-1.5 text-slate-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-all"
      title="Navigate to Sales"
    >
                          <Handshake size={15} />
                        </button> : <span className="p-1.5 text-slate-300 cursor-not-allowed" title="Vehicle Sold">
                          <Handshake size={15} />
                        </span>}

                      {
      /* 5. Payment Button */
    }
                      <button
                        onClick={() => onNavigate && onNavigate("payments", { paymentsSubTab: p.sellerType === "Customer" ? "customer" : "supplier", partyId: p.sellerId || p.supplier_id, vehicleId: p.purchase_id || p.id })}
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Record Payment / Receipt for Purchase"
                      >
                        <CreditCard size={15} />
                      </button>

                      {
      /* 6. Vehicle Expense Route shortcut */
    }
                      <button
      onClick={() => handleExpenseIconClick(p)}
      className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
      title="Manage Vehicle Expenses / Vouchers"
    >
                        <TrendingDown size={15} />
                      </button>

                      {
      /* 6. Binding Loan Route shortcut */
    }
                      <button
      onClick={() => onNavigate && onNavigate("binding", { loanPurchase: p })}
      className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
      title="Navigate to Bindings / Loans"
    >
                        <Percent size={15} />
                      </button>

                      {
      /* 7. Delete Record */
    }
                      {hasModulePermission(currentUser, "purchase", "delete") && (
                        <button
                          onClick={() => handleDeletePurchase(p.purchase_id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete Record"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>;
  })}
          </div>

          {
    /* Simple Pagination Footer */
  }
          {totalPages > 1 && <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <p>Showing Page {page} of {totalPages} ({totalCount} entries)</p>
              <div className="flex gap-2">
                <button
    disabled={page === 1}
    onClick={() => setPage((p) => Math.max(p - 1, 1))}
    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 transition-all font-semibold"
  >
                  Previous
                </button>
                <button
    disabled={page === totalPages}
    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg disabled:opacity-40 transition-all font-semibold"
  >
                  Next
                </button>
              </div>
            </div>}
        </div>}

      {
    /* VIEW DETAILS DRAWER / MODAL  - Exactly one view page */
  }
      <AnimatePresence>
        {showViewModal && selectedPurchase && <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowViewModal(false)}
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 15 }}
    className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10 border border-slate-100"
  >
              {
    /* Header */
  }
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded text-xs uppercase font-extrabold tracking-widest">
                      {selectedPurchase.purchase_id}
                    </span>
                    <span className={cn(
    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
    selectedPurchase.status === "Available" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
  )}>
                      {selectedPurchase.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Acquisition Details View</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Primary system overview for purchase transaction ID {selectedPurchase.purchase_id}</p>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                  <X size={20} />
                </button>
              </div>

              {
    /* View Scroll container */
  }
              <div className="p-6 overflow-y-auto space-y-6">
                
                {
    /* 2 Grid Columns */
  }
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {
    /* Left Column: Specs and Upload */
  }
                  <div className="space-y-4">
                    {
    /* Primary Image Preview */
  }
                    <div className="aspect-video bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative">
                      {selectedPurchase.vehicle_image ? <img
    src={selectedPurchase.vehicle_image}
    alt="Acquired Vehicle Spec"
    className="w-full h-full object-cover"
    referrerPolicy="no-referrer"
  /> : <div className="text-center text-slate-400 p-6 flex flex-col items-center">
                          <Car size={44} className="mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No Vehicle Image Uploaded</p>
                        </div>}
                    </div>

                    {
    /* Meta SPEC Block */
  }
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Acquired Identity Spec</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Brand Name</p>
                          <p className="text-slate-800 font-semibold">{selectedPurchase.brand_id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Model (Name)</p>
                          <p className="text-slate-800 font-semibold">{selectedPurchase.vehicle_name_id}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Registration Number</p>
                          <p className="text-slate-800 font-mono font-bold uppercase">{selectedPurchase.reg_no}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Vehicle Type</p>
                          <p className="text-slate-800 font-semibold">{selectedPurchase.vehicle_type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Model details / Variant</p>
                          <p className="text-slate-800 font-semibold">{selectedPurchase.model_details || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Acquisition Fuel / Year</p>
                          <p className="text-slate-800 font-semibold">{selectedPurchase.fuel_type} • Year {selectedPurchase.year}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {
    /* Right Column: Seller & Compliance Info */
  }
                  <div className="space-y-4">
                    {
    /* Seller parameters */
  }
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest">{selectedPurchase.purchase_type} Sourced Profile</h4>
                        <span className="text-[10px] font-mono text-slate-400 font-extrabold">{selectedPurchase.seller_id}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-2.5 text-xs font-medium text-slate-500 mt-2">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Full Name</p>
                          <p className="text-slate-800 font-bold">{selectedPurchase.seller_name}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Mobile Line</p>
                          <p className="text-slate-800 font-bold">{selectedPurchase.seller_mobile}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Registered Address</p>
                          <p className="text-slate-800">{selectedPurchase.seller_address || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">City Profile</p>
                          <p className="text-slate-800 font-semibold">
                            {cities.find((c) => c.id === selectedPurchase.seller_city_id)?.name || selectedPurchase.seller_city_id || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Area Sub-zone</p>
                          <p className="text-slate-800 font-semibold">
                            {areas.find((a) => a.id === selectedPurchase.seller_area_id)?.name || selectedPurchase.seller_area_id || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {
    /* Administrative Specifications */
  }
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Administrative Compliance Specs</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={cn(
    "w-2.5 h-2.5 rounded-full",
    selectedPurchase.challan_pending === "Yes" ? "bg-rose-500" : "bg-emerald-500"
  )} />
                          <span className="font-semibold text-slate-600">Challan Pending: <b className="text-slate-800">{selectedPurchase.challan_pending}</b></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
    "w-2.5 h-2.5 rounded-full",
    selectedPurchase.noc_available === "Yes" ? "bg-emerald-500" : "bg-amber-400"
  )} />
                          <span className="font-semibold text-slate-600">NOC Available: <b className="text-slate-800">{selectedPurchase.noc_available}</b></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
    "w-2.5 h-2.5 rounded-full",
    selectedPurchase.insurance_active === "Yes" ? "bg-emerald-500" : "bg-amber-400"
  )} />
                          <span className="font-semibold text-slate-600">Insurance Active: <b className="text-slate-800">{selectedPurchase.insurance_active}</b></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                          <span className="font-semibold text-slate-600">Owner Category: <b className="text-slate-800">{selectedPurchase.owner_details}</b></span>
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Engine number</p>
                            <p className="font-mono text-xs text-slate-700">{selectedPurchase.engine_number || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase font-bold">Chassis number</p>
                            <p className="font-mono text-xs text-slate-700">{selectedPurchase.chassis_number || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VEHICLE IMAGES GALLERY (Front, Back, Left, Right, Interior, Engine, Meter) */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Camera size={14} className="text-indigo-600" />
                      <span>Vehicle Images Gallery</span>
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      Uploaded Vehicle Photos
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {[
                      { key: "front", label: "Front" },
                      { key: "back", label: "Back" },
                      { key: "left", label: "Left" },
                      { key: "right", label: "Right" },
                      { key: "interior", label: "Interior" },
                      { key: "engine", label: "Engine" },
                      { key: "meter", label: "Meter" }
                    ].map((cat) => {
                      const imgUrl = selectedPurchase.vehicle_images?.[cat.key] || (cat.key === "front" ? selectedPurchase.vehicle_image : "");
                      return (
                        <div key={cat.key} className="bg-white border border-slate-200 rounded-xl p-2 text-center flex flex-col justify-between h-[110px] overflow-hidden group shadow-sm">
                          <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1 truncate">{cat.label}</span>
                          {imgUrl ? (
                            <a href={imgUrl} target="_blank" rel="noreferrer" className="block relative h-16 w-full rounded-lg overflow-hidden border border-slate-100 group-hover:opacity-90 transition-all">
                              <img src={imgUrl} alt={cat.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </a>
                          ) : (
                            <div className="h-16 w-full rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                              <Car size={20} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* TOP FEATURES & VEHICLE HIGHLIGHTS BADGES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* TOP FEATURES */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles size={14} className="text-indigo-600" />
                      <span>Top Features</span>
                    </h4>
                    {selectedPurchase.top_features && selectedPurchase.top_features.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedPurchase.top_features.map((feat, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={12} className="text-indigo-600" />
                            <span>{feat}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No top features selected</p>
                    )}
                  </div>

                  {/* VEHICLE HIGHLIGHTS */}
                  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <span>Vehicle Highlights</span>
                    </h4>
                    {selectedPurchase.vehicle_highlights && selectedPurchase.vehicle_highlights.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedPurchase.vehicle_highlights.map((hl, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-100 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{hl}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {["Single Owner", "Insurance Valid", "Accident Free", "Finance Available", "RC Ready"].map((hl, idx) => (
                          <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-lg border border-emerald-100 flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>{hl}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {
    /* exactly 4 Document attachment view widgets */
  }
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Document Storage Archiving (Exactly 4 Elements)</h4>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                    {
    /* Element 1: Vehicle Image */
  }
                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex flex-col justify-between h-[120px]">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Vehicle Image</p>
                        <p className="text-[9px] text-indigo-600 mt-1 truncate">
                          {selectedPurchase.vehicle_image ? "Acquisition Photo" : "Pending upload"}
                        </p>
                      </div>
                      {selectedPurchase.vehicle_image ? <a
    href={selectedPurchase.vehicle_image}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-1.5 text-indigo-600 font-bold hover:underline py-1"
  >
                          <FileDown size={14} /> Download File
                        </a> : <span className="text-[10px] text-slate-400">Unavailable</span>}
                    </div>

                    {
    /* Element 2: RC Document */
  }
                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex flex-col justify-between h-[120px]">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">RC Document Copy</p>
                        <p className="text-[9px] text-indigo-600 mt-1 truncate">
                          {selectedPurchase.rc_upload ? "Registry Copy" : "Pending upload"}
                        </p>
                      </div>
                      {selectedPurchase.rc_upload ? <a
    href={selectedPurchase.rc_upload}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-1.5 text-indigo-600 font-bold hover:underline py-1"
  >
                          <FileDown size={14} /> Download File
                        </a> : <span className="text-[10px] text-slate-400">Unavailable</span>}
                    </div>

                    {
    /* Element 3: NOC Certificate */
  }
                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex flex-col justify-between h-[120px]">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">NOC / Bank Loan</p>
                        <p className="text-[9px] text-indigo-600 mt-1 truncate">
                          {selectedPurchase.noc_upload ? "Lien Clear Certificate" : "Pending upload"}
                        </p>
                      </div>
                      {selectedPurchase.noc_upload ? <a
    href={selectedPurchase.noc_upload}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-1.5 text-indigo-600 font-bold hover:underline py-1"
  >
                          <FileDown size={14} /> Download File
                        </a> : <span className="text-[10px] text-slate-400">Unavailable</span>}
                    </div>

                    {
    /* Element 4: Insurance Document */
  }
                    <div className="bg-white border border-slate-200 p-2.5 rounded-xl flex flex-col justify-between h-[120px]">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Insurance Copy</p>
                        <p className="text-[9px] text-indigo-600 mt-1 truncate">
                          {selectedPurchase.insurance_doc ? "Insurance Policy PDF" : "Pending upload"}
                        </p>
                      </div>
                      {selectedPurchase.insurance_doc ? <a
    href={selectedPurchase.insurance_doc}
    target="_blank"
    rel="noreferrer"
    className="flex items-center gap-1.5 text-indigo-600 font-bold hover:underline py-1"
  >
                          <FileDown size={14} /> Download File
                        </a> : <span className="text-[10px] text-slate-400">Unavailable</span>}
                    </div>
                  </div>
                </div>

                {
    /* Bottom Financial summary section */
  }
                <div className="bg-indigo-600 text-white p-5 rounded-2xl flex flex-col sm:flex-row justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-indigo-200 block">Total Purchase Settlement</span>
                    <h2 className="text-2xl font-extrabold mt-0.5">₹{(Number(selectedPurchase.purchase_price) || 0).toLocaleString("en-IN")}</h2>
                    <p className="text-xs text-indigo-200 mt-1">Payment Settle Mode: <b className="capitalize text-white">{selectedPurchase.payment_mode || "Cash"}</b></p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5 text-sm font-semibold">
                    <div>
                      <span className="text-[10px] text-indigo-200 uppercase block">Advance Deposited</span>
                      <span>₹{(Number(selectedPurchase.advance_price) || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-200 uppercase block">Balance Remaining</span>
                      <span className="text-rose-200">₹{(Number(selectedPurchase.balance_amount) || 0).toLocaleString("en-IN")}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-200 uppercase block">Consultant Officer Fees</span>
                      <span>₹{(Number(selectedPurchase.consultancy_fees) || 0).toLocaleString("en-IN")}</span>
                    </div>
                    {(() => {
                      const totalExpenses = (Number(selectedPurchase.fuel_expense) || 0) + (Number(selectedPurchase.repair_expense) || 0) + (Number(selectedPurchase.service_expense) || 0) + (Number(selectedPurchase.insurance_expense) || 0) + (Number(selectedPurchase.rto_expense) || 0) + (Number(selectedPurchase.other_expense) || 0);
                      const purchasePrice = Number(selectedPurchase.purchase_price) || 0;
                      const totalCost = purchasePrice + totalExpenses + (Number(selectedPurchase.consultancy_fees) || 0);
                      const expectedSellingPrice = Number(selectedPurchase.expected_selling_price) || 0;
                      const potentialProfit = expectedSellingPrice > 0 ? (expectedSellingPrice - totalCost) : 0;
                      return (
                        <>
                          <div>
                            <span className="text-[10px] text-indigo-200 uppercase block">Total Vehicle Expenses</span>
                            <span>₹{(Number(totalExpenses) || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-200 uppercase block">Total Net Cost</span>
                            <span className="text-yellow-200 font-extrabold">₹{(Number(totalCost) || 0).toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-200 uppercase block">Execution Date</span>
                            <span>{selectedPurchase.purchase_date || "N/A"}</span>
                          </div>
                          {expectedSellingPrice > 0 && (
                            <>
                              <div>
                                <span className="text-[10px] text-indigo-200 uppercase block">Offer Price</span>
                                <span className="text-indigo-100 font-bold">₹{(Number(expectedSellingPrice) || 0).toLocaleString("en-IN")}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-indigo-200 uppercase block">Potential Net Profit</span>
                                <span className={potentialProfit >= 0 ? "text-emerald-300 font-extrabold" : "text-rose-300 font-extrabold"}>
                                  ₹{(Number(potentialProfit) || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

              </div>

              {
    /* View Footer with NO DUPLICATES */
  }
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
    onClick={() => handlePrintReceipt(selectedPurchase)}
    className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-bold transition-all text-sm"
  >
                  <Printer size={16} /> Print Receipt
                </button>
                <button
    onClick={() => setShowViewModal(false)}
    className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-sm"
  >
                  Close View
                </button>
              </div>

            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* ADD / EDIT TRANSACTION FORM OVERLAY */
  }
      <AnimatePresence>
        {showAddEditModal && <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowAddEditModal(false)}
    className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 15 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 15 }}
    className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col z-10 border border-slate-100"
  >
              <form onSubmit={handleSavePurchase} className="flex flex-col h-full overflow-hidden">
                {
    /* Header */
  }
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 bg-white z-10">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {isEditMode ? "Modify Purchase Information" : "Add New Purchase Record"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Primary system interface for dynamic vehicle sourcing acquisition</p>
                  </div>
                  <button type="button" onClick={() => setShowAddEditModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all">
                    <X size={20} />
                  </button>
                </div>

                {
    /* Form Inputs scroll containers  */
  }
                <div className="p-6 overflow-y-auto space-y-6">
                  
                  {
    /* Row 1: Purchase ID, Date, Sourcing Type */
  }
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Purchase ID</label>
                      <input
    type="text"
    value={formState.purchase_id}
    readOnly
    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold text-indigo-700 cursor-not-allowed text-sm"
    placeholder="PUR001"
  />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Purchase Date</label>
                      <input
    type="date"
    required
    value={formState.purchase_date}
    onChange={(e) => setFormState((prev) => ({ ...prev, purchase_date: e.target.value }))}
    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-semibold text-sm"
  />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Purchase Type Role</label>
                      <select
    value={formState.purchase_type}
    onChange={(e) => {
      const typeVal = e.target.value;
      setFormState((prev) => ({
        ...prev,
        purchase_type: typeVal,
        seller_id: "",
        seller_name: "",
        seller_mobile: "",
        seller_city_id: "",
        seller_area_id: "",
        seller_sub_area_id: "",
        seller_address: ""
      }));
    }}
    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
  >
                        <option value="Customer">Customer Sourced</option>
                        <option value="Supplier">Supplier Sourced</option>
                      </select>
                    </div>
                  </div>

                  {
    /* Dynamic Seller Selection Box depending on Sourcing type */
  }
                  <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/50 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-widest">Dynamic Sourced Contact Selector</h4>
                      <p className="text-[10px] text-slate-400 font-bold">Auto loads address information automatically on select</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {formState.purchase_type === "Customer" ? <div className="space-y-1">
                          <label className="text-xs font-extrabold text-amber-800 uppercase tracking-widest">Customer ID Dropdown</label>
                          <select
    required
    value={formState.seller_id}
    onChange={(e) => handleSellerChange(e.target.value)}
    className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
  >
                            <option value="">-- Choose Customer (Seller) --</option>
                            {customers
                              .filter((c) => !c.isDeleted && ((c.customer_type === "Sell" || c.requirement === "Sell" || (c.customer_type !== "Buy" && c.requirement !== "Buy")) || c.id === formState.seller_id))
                              .map((c) => {
                                const roleSuffix = (c.name || "").includes("(Seller)") ? "" : " (Seller)";
                                return (
                                  <option key={c.id} value={c.id}>
                                    {c.id} - {c.name}{roleSuffix}
                                  </option>
                                );
                              })}
                          </select>
                        </div> : <div className="space-y-1">
                          <label className="text-xs font-extrabold text-amber-800 uppercase tracking-widest">Supplier ID Dropdown</label>
                          <select
    required
    value={formState.seller_id}
    onChange={(e) => handleSellerChange(e.target.value)}
    className="w-full px-4 py-2.5 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
  >
                            <option value="">-- Choose Supplier --</option>
                            {suppliers.filter((s) => !s.isDeleted).map((s) => <option key={s.id} value={s.id}>
                                {s.id} - {s.name}
                              </option>)}
                          </select>
                        </div>}

                      {
    /* Display Read Only Fields loaded dynamically */
  }
                      <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 sm:col-span-1 self-center bg-white p-3 rounded-xl border border-amber-100">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Name</span>
                          <span className="text-slate-800 font-bold block truncate">{formState.seller_name || "Loading..."}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold">Mobile Line</span>
                          <span className="text-slate-800 font-bold block">{formState.seller_mobile || "Loading..."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">City Profile</span>
                        <input
    type="text"
    readOnly
    value={cities.find((c) => c.id === formState.seller_city_id)?.name || ""}
    className="w-full px-3 py-1.5 bg-slate-100 border border-amber-100 rounded-lg text-slate-500 outline-none"
  />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Area Sub-zone</span>
                        <input
    type="text"
    readOnly
    value={areas.find((a) => a.id === formState.seller_area_id)?.name || ""}
    className="w-full px-3 py-1.5 bg-slate-100 border border-amber-100 rounded-lg text-slate-500 outline-none"
  />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Sub Area Local</span>
                        <input
    type="text"
    readOnly
    value={subAreas.find((sa) => sa.id === formState.seller_sub_area_id)?.name || ""}
    className="w-full px-3 py-1.5 bg-slate-100 border border-amber-100 rounded-lg text-slate-500 outline-none"
  />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold">Seller Address</span>
                        <input
    type="text"
    readOnly
    value={formState.seller_address || ""}
    className="w-full px-3 py-1.5 bg-slate-100 border border-amber-100 rounded-lg text-slate-500 outline-none"
  />
                      </div>
                    </div>
                  </div>

                  {
    /* Vehicle Details specs */
  }
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">General Vehicle Specifications</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Vehicle Type</label>
                        <select
    value={formState.vehicle_type}
    onChange={(e) => setFormState((prev) => ({ ...prev, vehicle_type: e.target.value, brand_id: "", vehicle_name_id: "" }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
  >
                          <option value="Two Wheeler">Two Wheeler</option>
                          <option value="Three Wheeler">Three Wheeler</option>
                          <option value="Four Wheeler">Four Wheeler</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Brand Name</label>
                        <select
    required
    value={formState.brand_id}
    onChange={(e) => setFormState((prev) => ({ ...prev, brand_id: e.target.value, vehicle_name_id: "" }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  >
                          <option value="">-- Choose Brand --</option>
                          {availableBrands.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Vehicle Name Model</label>
                        <select
    required
    value={formState.vehicle_name_id}
    onChange={(e) => setFormState((prev) => ({ ...prev, vehicle_name_id: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  >
                          <option value="">-- Choose Model --</option>
                          {availableModels.map((vn) => <option key={vn.id} value={vn.name}>{vn.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Registration Number</label>
                        <input
    type="text"
    required
    placeholder="TN-01-AB-1234"
    value={formState.reg_no}
    onChange={(e) => setFormState((prev) => ({ ...prev, reg_no: e.target.value.toUpperCase() }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono font-bold uppercase"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Model variant Details</label>
                        <input
    type="text"
    placeholder="Variant e.g. LXI / VXI"
    value={formState.model_details}
    onChange={(e) => setFormState((prev) => ({ ...prev, model_details: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Year Manufacturer</label>
                        <input
    type="number"
    required
    value={formState.year}
    onChange={(e) => setFormState((prev) => ({ ...prev, year: Number(e.target.value) }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">KMs Driven (KM)</label>
                        <input
                          type="number"
                          placeholder="e.g. 45000"
                          value={formState.kms_driven || ""}
                          onChange={(e) => setFormState((prev) => ({ ...prev, kms_driven: e.target.value }))}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Fuel Type Dropdown</label>
                        <select
    value={formState.fuel_type}
    onChange={(e) => setFormState((prev) => ({ ...prev, fuel_type: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
  >
                          <option value="Petrol">Petrol</option>
                          <option value="Diesel">Diesel</option>
                          <option value="CNG">CNG</option>
                          <option value="Electric">Electric</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Tyre Status</label>
                        <input
    type="text"
    placeholder="e.g. 80% thread left"
    value={formState.tyre_status}
    onChange={(e) => setFormState((prev) => ({ ...prev, tyre_status: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">RC Type Dropdown</label>
                        <select
    value={formState.rc_type}
    onChange={(e) => setFormState((prev) => ({ ...prev, rc_type: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  >
                          <option value="Smart Card">Smart Card</option>
                          <option value="Paper RC">Paper RC</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Owner Details Dropdown</label>
                        <select
    value={formState.owner_details}
    onChange={(e) => setFormState((prev) => ({ ...prev, owner_details: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
  >
                          <option value="1st Owner">1st Owner</option>
                          <option value="2nd Owner">2nd Owner</option>
                          <option value="3rd Owner">3rd Owner</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Engine Number</label>
                        <input
    type="text"
    placeholder="Engine Spec code"
    value={formState.engine_number}
    onChange={(e) => setFormState((prev) => ({ ...prev, engine_number: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold font-mono"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Chassis Number</label>
                        <input
    type="text"
    placeholder="Chassis spec code"
    value={formState.chassis_number}
    onChange={(e) => setFormState((prev) => ({ ...prev, chassis_number: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold font-mono"
  />
                      </div>
                    </div>
                  </div>

                  {
    /* Compliance Verification attributes */
  }
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Acquisition Compliance Statuses</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Challan Pending?</label>
                        <select
    value={formState.challan_pending}
    onChange={(e) => setFormState((prev) => ({ ...prev, challan_pending: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
  >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      {formState.challan_pending === "Yes" && (
                        <div className="space-y-1 animate-fadeIn">
                          <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Challan Amount (₹)</label>
                          <input
                            type="number"
                            value={formState.challan_amount || ""}
                            onChange={(e) => setFormState((prev) => ({ ...prev, challan_amount: Number(e.target.value) || 0 }))}
                            className="w-full px-4 py-2 bg-white border border-rose-200 focus:border-indigo-500 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-rose-700"
                            placeholder="0"
                          />
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">NOC Available?</label>
                        <select
    value={formState.noc_available}
    onChange={(e) => setFormState((prev) => ({ ...prev, noc_available: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
  >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Insurance Active?</label>
                        <select
                          value={formState.insurance_active}
                          onChange={(e) => setFormState((prev) => ({ ...prev, insurance_active: e.target.value }))}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* OWNERSHIP TRANSFER STATUS SECTION */}
                  <div className="space-y-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ArrowRightLeft className="text-indigo-600" size={18} />
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Ownership Transfer Status</h4>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border",
                        formState.transfer_status === "Yes" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-amber-100 text-amber-800 border-amber-300"
                      )}>
                        {formState.transfer_status === "Yes" ? "Transferred" : "Pending Transfer"}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Transfer Status</label>
                        <select
                          value={formState.transfer_status}
                          onChange={(e) => setFormState((prev) => ({
                            ...prev,
                            transfer_status: e.target.value,
                            transfer_date: e.target.value === "Yes" && !prev.transfer_date ? new Date().toISOString().split("T")[0] : prev.transfer_date
                          }))}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                        >
                          <option value="No">No (Pending)</option>
                          <option value="Yes">Yes (Transferred)</option>
                        </select>
                      </div>

                      {formState.transfer_status === "Yes" && (
                        <>
                          <div className="space-y-1 animate-fadeIn">
                            <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Transfer Date</label>
                            <input
                              type="date"
                              value={formState.transfer_date || ""}
                              onChange={(e) => setFormState((prev) => ({ ...prev, transfer_date: e.target.value }))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono font-bold"
                            />
                          </div>

                          <div className="space-y-1 animate-fadeIn">
                            <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Transferred By</label>
                            <input
                              type="text"
                              placeholder="RTO Agent / Staff Name"
                              value={formState.transferred_by || ""}
                              onChange={(e) => setFormState((prev) => ({ ...prev, transferred_by: e.target.value }))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                            />
                          </div>

                          <div className="space-y-1 animate-fadeIn">
                            <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Transfer Remarks</label>
                            <input
                              type="text"
                              placeholder="Name transfer notes or application no."
                              value={formState.transfer_remarks || ""}
                              onChange={(e) => setFormState((prev) => ({ ...prev, transfer_remarks: e.target.value }))}
                              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CATEGORY-WISE VEHICLE IMAGE MANAGEMENT */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Vehicle Image Management</h4>
                        <p className="text-[11px] text-slate-400">Upload high-resolution category photos (Front, Back, Sides, Interior, Engine)</p>
                      </div>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition-all border border-indigo-200 shrink-0">
                        <Upload size={14} />
                        <span>Multi-Image Batch Upload</span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleMultiCategoryUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: "front", title: "Front View", desc: "Main visual poster image" },
                        { key: "back", title: "Back View", desc: "Rear registration & lights view" },
                        { key: "left", title: "Left Side View", desc: "Full left profile view" },
                        { key: "right", title: "Right Side View", desc: "Full right profile view" },
                        { key: "interior", title: "Interior View", desc: "Dashboard & seating view" },
                        { key: "engine", title: "Engine View", desc: "Engine bay / mechanical view" },
                        { key: "meter", title: "Meter View", desc: "Odometer & cluster view" },
                      ].map((cat) => {
                        const imgUrl = formState.vehicle_images?.[cat.key];
                        const progressKey = `category_${cat.key}`;
                        const progress = uploadProgress[progressKey];

                        return (
                          <div
                            key={cat.key}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const file = e.dataTransfer.files?.[0];
                              if (file) processCategoryUpload(file, cat.key);
                            }}
                            className="border border-slate-200 p-3.5 rounded-2xl bg-white shadow-sm flex flex-col justify-between space-y-2 hover:border-indigo-300 transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-extrabold text-slate-800 block">{cat.title}</span>
                                <span className="text-[10px] text-slate-400 block">{cat.desc}</span>
                              </div>
                              {imgUrl && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" title="Uploaded" />
                              )}
                            </div>

                            {progress !== undefined ? (
                              <div className="p-3 border border-indigo-100 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center space-y-1.5 h-[120px]">
                                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Compressing & Uploading {progress}%</span>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            ) : imgUrl ? (
                              <div className="relative h-[120px] bg-slate-900 rounded-xl overflow-hidden group shadow-inner">
                                <img
                                  src={imgUrl}
                                  alt={cat.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                  <button
                                    type="button"
                                    onClick={() => window.open(imgUrl, "_blank")}
                                    className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-lg text-xs font-bold shadow transition-all"
                                    title="Expand Image"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <label
                                    className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer"
                                    title="Replace Image"
                                  >
                                    <Edit2 size={14} />
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/jpg,image/png,image/webp"
                                      onChange={(e) => handleCategoryFileUpload(e, cat.key)}
                                      className="hidden"
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setFormState((prev) => {
                                      const nextImgs = { ...(prev.vehicle_images || {}), [cat.key]: "" };
                                      const primary = nextImgs.front || nextImgs.back || nextImgs.left || nextImgs.right || nextImgs.interior || nextImgs.engine || "";
                                      return { ...prev, vehicle_images: nextImgs, vehicle_image: primary };
                                    })}
                                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow transition-all"
                                    title="Remove Image"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="border border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-3 text-center flex flex-col items-center justify-center h-[120px] bg-slate-50/50 hover:bg-indigo-50/20 transition-all group">
                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 uppercase mb-2">Drag & Drop Image Here</p>
                                <div className="flex items-center gap-2">
                                  <label className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-extrabold cursor-pointer transition-all shadow-sm flex items-center gap-1">
                                    <Upload size={12} />
                                    <span>Browse</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/jpg,image/png,image/webp"
                                      onChange={(e) => handleCategoryFileUpload(e, cat.key)}
                                      className="hidden"
                                    />
                                  </label>
                                  <label className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-extrabold cursor-pointer transition-all shadow-sm flex items-center gap-1">
                                    <Camera size={12} />
                                    <span>Camera</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      capture="environment"
                                      onChange={(e) => handleCategoryFileUpload(e, cat.key)}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* TOP FEATURES SELECTION FOR SALES POSTER & ADVERTISEMENTS */}
                  <div className="space-y-4 border border-indigo-100 bg-indigo-50/20 p-5 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-indigo-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Top Vehicle Features (Showroom Poster Highlights)</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">Select key features to feature prominently on the Sales Poster & digital catalog</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                          {(formState.top_features || []).length} Selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, top_features: [...STANDARD_TOP_FEATURES] }))}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, top_features: [] }))}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Standard Features Checkbox Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {STANDARD_TOP_FEATURES.map((feat) => {
                        const isChecked = (formState.top_features || []).includes(feat);
                        return (
                          <label
                            key={feat}
                            className={cn(
                              "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium cursor-pointer transition-all select-none",
                              isChecked
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormState((prev) => {
                                  const list = prev.top_features || [];
                                  if (list.includes(feat)) {
                                    return { ...prev, top_features: list.filter((f) => f !== feat) };
                                  } else {
                                    return { ...prev, top_features: [...list, feat] };
                                  }
                                });
                              }}
                              className="hidden"
                            />
                            <div className={cn(
                              "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all",
                              isChecked ? "bg-white border-white text-indigo-600" : "border-slate-300 bg-slate-50"
                            )}>
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="truncate">{feat}</span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Custom Feature Add Input */}
                    <div className="pt-2 border-t border-indigo-100 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add custom feature (e.g. Ventilated Seats, 360 Camera)..."
                        value={customFeatureInput}
                        onChange={(e) => setCustomFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomFeature();
                          }
                        }}
                        className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomFeature}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Add Feature</span>
                      </button>
                    </div>

                    {/* Additional/Custom Selected Features Tags */}
                    {(formState.top_features || []).filter((f) => !STANDARD_TOP_FEATURES.includes(f)).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        <span className="text-[11px] font-bold text-slate-500 self-center mr-1">Custom:</span>
                        {(formState.top_features || []).filter((f) => !STANDARD_TOP_FEATURES.includes(f)).map((customFeat) => (
                          <span
                            key={customFeat}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold"
                          >
                            {customFeat}
                            <button
                              type="button"
                              onClick={() => {
                                setFormState((prev) => ({
                                  ...prev,
                                  top_features: (prev.top_features || []).filter((f) => f !== customFeat)
                                }));
                              }}
                              className="hover:text-rose-600 ml-0.5 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* VEHICLE HIGHLIGHTS SELECTION FOR SHOWROOM POSTER */}
                  <div className="space-y-4 border border-amber-200 bg-amber-50/30 p-5 rounded-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Award size={16} className="text-amber-600" />
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Vehicle Commercial Highlights</h4>
                        </div>
                        <p className="text-[11px] text-slate-500">Select key commercial badges for the showroom advertisement poster & WhatsApp catalog</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold">
                          {(formState.vehicle_highlights || []).length} Selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, vehicle_highlights: [...STANDARD_HIGHLIGHTS] }))}
                          className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-200 text-amber-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormState((prev) => ({ ...prev, vehicle_highlights: [] }))}
                          className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Standard Highlights Checkbox Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {STANDARD_HIGHLIGHTS.map((hl) => {
                        const isChecked = (formState.vehicle_highlights || []).includes(hl);
                        return (
                          <label
                            key={hl}
                            className={cn(
                              "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition-all select-none",
                              isChecked
                                ? "bg-amber-500 text-slate-950 border-amber-500 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50"
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormState((prev) => {
                                  const list = prev.vehicle_highlights || [];
                                  if (list.includes(hl)) {
                                    return { ...prev, vehicle_highlights: list.filter((h) => h !== hl) };
                                  } else {
                                    return { ...prev, vehicle_highlights: [...list, hl] };
                                  }
                                });
                              }}
                              className="hidden"
                            />
                            <div className={cn(
                              "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all",
                              isChecked ? "bg-slate-950 border-slate-950 text-amber-400" : "border-slate-300 bg-slate-50"
                            )}>
                              {isChecked && <Check size={12} strokeWidth={3} />}
                            </div>
                            <span className="truncate">{hl}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {
    /* exactly 4 upload fields displaying drag-and-drop / select status */
  }
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Acquisition Documents (Exactly 4 Sourcing Uploads, Max 10MB JPG/PNG/PDF)</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      
                      {
    /* Upload 1: Vehicle Image */
  }
                      <div className="border border-slate-200 p-4 rounded-xl space-y-2 flex flex-col justify-between bg-white shadow-sm h-[184px]">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Vehicle Image</p>
                          <p className="text-[10px] text-slate-400">Primary visual photo</p>
                        </div>
                        {uploadProgress.vehicle_image !== undefined ? (
                          <div className="mt-2 text-center p-3 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center space-y-1.5 h-[100px]">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Uploading... {uploadProgress.vehicle_image}%</span>
                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-1 transition-all duration-150" style={{ width: `${uploadProgress.vehicle_image}%` }} />
                            </div>
                          </div>
                        ) : formState.vehicle_image ? <div className="space-y-2 mt-1.5 text-left h-[100px] flex flex-col justify-between">
                            <div className="relative h-[64px] bg-slate-50 rounded-lg border overflow-hidden group shadow-sm flex items-center justify-center">
                              {formState.vehicle_image.toLowerCase().endsWith(".pdf") ? <FileText className="text-red-500" size={32} /> : <img src={formState.vehicle_image} className="w-full h-full object-cover" alt="Vehicle" />}
                              <button
    type="button"
    onClick={() => setFormState((prev) => ({ ...prev, vehicle_image: "" }))}
    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full transition-all hover:bg-rose-700 shadow"
  >
                                <X size={8} />
                              </button>
                            </div>
                            <button
    type="button"
    onClick={() => window.open(formState.vehicle_image, "_blank")}
    className="w-full text-center text-[10px] text-indigo-600 font-extrabold hover:underline block"
  >
                              Expand Document
                            </button>
                          </div> : <label className="mt-2 text-center border border-dashed border-slate-300 hover:border-indigo-500 py-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 group transition-all h-[100px]">
                            <Upload size={14} className="group-hover:text-indigo-600" />
                            <span className="text-[10px] font-bold mt-1 uppercase text-slate-500">Upload File</span>
                            <input
    type="file"
    accept=".jpeg,.jpg,.png"
    onChange={(e) => handleFileUpload(e, "vehicle_image")}
    className="hidden"
  />
                          </label>}
                      </div>

                      {
    /* Upload 2: RC Upload */
  }
                      <div className="border border-slate-200 p-4 rounded-xl space-y-2 flex flex-col justify-between bg-white shadow-sm h-[184px]">
                        <div>
                          <p className="text-xs font-bold text-slate-700">RC Upload</p>
                          <p className="text-[10px] text-slate-400">Registration Certificate</p>
                        </div>
                        {uploadProgress.rc_upload !== undefined ? (
                          <div className="mt-2 text-center p-3 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center space-y-1.5 h-[100px]">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Uploading... {uploadProgress.rc_upload}%</span>
                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-1 transition-all duration-150" style={{ width: `${uploadProgress.rc_upload}%` }} />
                            </div>
                          </div>
                        ) : formState.rc_upload ? <div className="mt-1.5 space-y-2 text-left h-[100px] flex flex-col justify-between">
                            <div className="relative h-[64px] bg-slate-50 rounded-lg border overflow-hidden group shadow-sm flex items-center justify-center">
                              {formState.rc_upload.toLowerCase().endsWith(".pdf") ? <FileText className="text-red-500" size={32} /> : <img src={formState.rc_upload} className="w-full h-full object-cover" alt="RC" />}
                              <button
    type="button"
    onClick={() => setFormState((prev) => ({ ...prev, rc_upload: "" }))}
    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full transition-all hover:bg-rose-700 shadow"
  >
                                <X size={8} />
                              </button>
                            </div>
                            <button
    type="button"
    onClick={() => window.open(formState.rc_upload, "_blank")}
    className="w-full text-center text-[10px] text-indigo-600 font-extrabold hover:underline block"
  >
                              Expand Document
                            </button>
                          </div> : <label className="mt-2 text-center border border-dashed border-slate-300 hover:border-indigo-500 py-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 group transition-all h-[100px]">
                            <Upload size={14} className="group-hover:text-indigo-600" />
                            <span className="text-[10px] font-bold mt-1 uppercase text-slate-500">Upload File</span>
                            <input
    type="file"
    accept=".jpeg,.jpg,.png,.pdf"
    onChange={(e) => handleFileUpload(e, "rc_upload")}
    className="hidden"
  />
                          </label>}
                      </div>

                      {
    /* Upload 3: NOC Upload */
  }
                      <div className="border border-slate-200 p-4 rounded-xl space-y-2 flex flex-col justify-between bg-white shadow-sm h-[184px]">
                        <div>
                          <p className="text-xs font-bold text-slate-700">NOC Upload</p>
                          <p className="text-[10px] text-slate-400">Lien clear certificate</p>
                        </div>
                        {uploadProgress.noc_upload !== undefined ? (
                          <div className="mt-2 text-center p-3 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center space-y-1.5 h-[100px]">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Uploading... {uploadProgress.noc_upload}%</span>
                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-1 transition-all duration-150" style={{ width: `${uploadProgress.noc_upload}%` }} />
                            </div>
                          </div>
                        ) : formState.noc_upload ? <div className="mt-1.5 space-y-2 text-left h-[100px] flex flex-col justify-between">
                            <div className="relative h-[64px] bg-slate-50 rounded-lg border overflow-hidden group shadow-sm flex items-center justify-center">
                              {formState.noc_upload.toLowerCase().endsWith(".pdf") ? <FileText className="text-red-500" size={32} /> : <img src={formState.noc_upload} className="w-full h-full object-cover" alt="NOC" />}
                              <button
    type="button"
    onClick={() => setFormState((prev) => ({ ...prev, noc_upload: "" }))}
    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full transition-all hover:bg-rose-700 shadow"
  >
                                <X size={8} />
                              </button>
                            </div>
                            <button
    type="button"
    onClick={() => window.open(formState.noc_upload, "_blank")}
    className="w-full text-center text-[10px] text-indigo-600 font-extrabold hover:underline block"
  >
                              Expand Document
                            </button>
                          </div> : <label className="mt-2 text-center border border-dashed border-slate-300 hover:border-indigo-500 py-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 group transition-all h-[100px]">
                            <Upload size={14} className="group-hover:text-indigo-600" />
                            <span className="text-[10px] font-bold mt-1 uppercase text-slate-500">Upload File</span>
                            <input
    type="file"
    accept=".jpeg,.jpg,.png,.pdf"
    onChange={(e) => handleFileUpload(e, "noc_upload")}
    className="hidden"
  />
                          </label>}
                      </div>

                      {
    /* Upload 4: Insurance Document Upload */
  }
                      <div className="border border-slate-200 p-4 rounded-xl space-y-2 flex flex-col justify-between bg-white shadow-sm h-[184px]">
                        <div>
                          <p className="text-xs font-bold text-slate-700">Insurance Doc</p>
                          <p className="text-[10px] text-slate-400">Insurance active policy</p>
                        </div>
                        {uploadProgress.insurance_doc !== undefined ? (
                          <div className="mt-2 text-center p-3 border border-indigo-100 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center space-y-1.5 h-[100px]">
                            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">Uploading... {uploadProgress.insurance_doc}%</span>
                            <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-1 transition-all duration-150" style={{ width: `${uploadProgress.insurance_doc}%` }} />
                            </div>
                          </div>
                        ) : formState.insurance_doc ? <div className="mt-1.5 space-y-2 text-left h-[100px] flex flex-col justify-between">
                            <div className="relative h-[64px] bg-slate-50 rounded-lg border overflow-hidden group shadow-sm flex items-center justify-center">
                              {formState.insurance_doc.toLowerCase().endsWith(".pdf") ? <FileText className="text-red-500" size={32} /> : <img src={formState.insurance_doc} className="w-full h-full object-cover" alt="Insurance" />}
                              <button
    type="button"
    onClick={() => setFormState((prev) => ({ ...prev, insurance_doc: "" }))}
    className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full transition-all hover:bg-rose-700 shadow"
  >
                                <X size={8} />
                              </button>
                            </div>
                            <button
    type="button"
    onClick={() => window.open(formState.insurance_doc, "_blank")}
    className="w-full text-center text-[10px] text-indigo-600 font-extrabold hover:underline block"
  >
                              Expand Document
                            </button>
                          </div> : <label className="mt-2 text-center border border-dashed border-slate-300 hover:border-indigo-500 py-3 rounded-lg flex flex-col items-center justify-center cursor-pointer text-slate-400 group transition-all h-[100px]">
                            <Upload size={14} className="group-hover:text-indigo-600" />
                            <span className="text-[10px] font-bold mt-1 uppercase text-slate-500">Upload File</span>
                            <input
    type="file"
    accept=".jpeg,.jpg,.png,.pdf"
    onChange={(e) => handleFileUpload(e, "insurance_doc")}
    className="hidden"
  />
                          </label>}
                      </div>

                    </div>
                  </div>

                  {
    /* Purchase Transaction details */
  }
                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Financial Acquisitions details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Purchase Price (₹)</label>
                        <input
    type="number"
    required
    value={formState.purchase_price || ""}
    onChange={(e) => setFormState((prev) => ({ ...prev, purchase_price: Number(e.target.value) }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800 animate-transition"
    placeholder="0"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Advance Price (₹)</label>
                        <input
    type="number"
    value={formState.advance_price || ""}
    onChange={(e) => setFormState((prev) => ({ ...prev, advance_price: Number(e.target.value) }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800 animate-transition"
    placeholder="0"
  />
                      </div>

                      {
    /* Auto calculated section */
  }
                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Balance Amount (₹)</label>
                        <input
    type="number"
    readOnly
    value={balanceAmount}
    className="w-full px-4 py-2 bg-indigo-50 border border-slate-200 rounded-xl outline-none text-sm font-extrabold text-indigo-700 cursor-not-allowed"
    placeholder="0"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Consultancy Fees (₹)</label>
                        <input
    type="number"
    value={formState.consultancy_fees || ""}
    onChange={(e) => setFormState((prev) => ({ ...prev, consultancy_fees: Number(e.target.value) }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800"
    placeholder="0"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Sales Price (₹)</label>
                        <input
    type="number"
    value={formState.expected_selling_price || ""}
    onChange={(e) => setFormState((prev) => ({ ...prev, expected_selling_price: Number(e.target.value) }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800"
    placeholder="0"
  />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Payment Mode</label>
                        <select
    value={formState.payment_mode}
    onChange={(e) => setFormState((prev) => ({ ...prev, payment_mode: e.target.value }))}
    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
  >
                          <option value="Cash">Cash Settlement</option>
                          <option value="Bank">Bank Deposit Transfer</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {
    /* Stock Availability status */
  }
                  <div className="space-y-1 pt-2">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Vehicle Sourced Status</label>
                    <select
    value={formState.status}
    onChange={(e) => setFormState((prev) => ({ ...prev, status: e.target.value }))}
    className="w-full sm:w-[220px] px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-700"
  >
                      <option value="Available">Available for Sale</option>
                      <option value="Booked">Reserved Booked</option>
                      <option value="Sold">Completed Sold</option>
                    </select>
                  </div>

                </div>

                {
    /* Form CTA Actions */
  }
                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0">
                  <button
    type="button"
    onClick={() => setShowAddEditModal(false)}
    disabled={isSaving}
    className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-sm disabled:opacity-50"
  >
                    Cancel
                  </button>
                  <button
    type="submit"
    disabled={isSaving}
    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-sm shadow-md active:scale-95 flex items-center gap-2 select-none disabled:opacity-75"
  >
                    {isSaving ? <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </> : isEditMode ? "Save Changes" : "Confirm Purchase"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* Vehicle Loan Management Modal */
  }
      <AnimatePresence>
        {showLoanModal && activeLoanPurchase && <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowLoanModal(false)}
    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
  >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Vehicle Loan Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Link and track finance records for {activeLoanPurchase.brand_id} {activeLoanPurchase.vehicle_name_id}</p>
                </div>
                <button
    onClick={() => setShowLoanModal(false)}
    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
  >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveLoan} className="p-6 space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Registration Number</label>
                  <input
    type="text"
    readOnly
    value={activeLoanPurchase.reg_no}
    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold text-slate-500 cursor-not-allowed"
  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Loan Amount (₹)</label>
                    <input
    type="number"
    required
    value={loanState.loan_amount || ""}
    onChange={(e) => setLoanState((prev) => ({ ...prev, loan_amount: Number(e.target.value) }))}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
    placeholder="0.00"
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Finance Company</label>
                    <input
    type="text"
    required
    value={loanState.loan_finance_company}
    onChange={(e) => setLoanState((prev) => ({ ...prev, loan_finance_company: e.target.value }))}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
    placeholder="e.g. HDFC Bank, Cholamandalam"
  />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">EMI Amount (₹)</label>
                    <input
    type="number"
    required
    value={loanState.loan_emi_amount || ""}
    onChange={(e) => setLoanState((prev) => ({ ...prev, loan_emi_amount: Number(e.target.value) }))}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-bold"
    placeholder="0.00"
  />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">EMI Date / Day</label>
                    <input
    type="text"
    required
    value={loanState.loan_emi_date}
    onChange={(e) => setLoanState((prev) => ({ ...prev, loan_emi_date: e.target.value }))}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500"
    placeholder="e.g. 5th of every month"
  />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase">Loan Status</label>
                  <select
    value={loanState.loan_status}
    onChange={(e) => setLoanState((prev) => ({ ...prev, loan_status: e.target.value }))}
    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-sm font-semibold"
  >
                    <option value="Active">Active Loan</option>
                    <option value="Closed">Closed / Settled</option>
                    <option value="Pending Approval">Pending Approval / Hold</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
    type="button"
    onClick={() => setShowLoanModal(false)}
    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all"
  >
                    Cancel
                  </button>
                  <button
    type="submit"
    disabled={isSaving}
    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg shadow-amber-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
  >
                    {isSaving ? <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Saving...
                      </> : "Save Loan details"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>}
      </AnimatePresence>

      {
    /* Toast Notification Banner */
  }
      <AnimatePresence>
        {successToast && <motion.div
    initial={{ opacity: 0, y: 50, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 20, scale: 0.9 }}
    className="fixed bottom-6 right-6 z-[100] bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 font-semibold text-sm"
  >
            <CheckCircle2 size={18} />
            {successToast}
          </motion.div>}
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

      {/* SALES POSTER & COMMERCIAL ADVERTISEMENT MODAL */}
      <SalesPosterModal
        vehicle={vehicleToShare}
        businessProfile={businessProfile}
        isOpen={!!vehicleToShare}
        onClose={() => setVehicleToShare(null)}
      />

    </div>;
}
