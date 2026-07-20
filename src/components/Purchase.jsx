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
  Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { hasModulePermission } from "../lib/permissions";

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
  initialSearch
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
          const mappedVehicles = result.data.map((p) => ({
            id: p.purchase_id,
            name: p.vehicle_name_id,
            brand: p.brand_id,
            model: p.model_details,
            year: p.year,
            fuelType: p.fuel_type,
            purchasePrice: p.purchase_price,
            ownerDetails: p.owner_details,
            status: p.status === "Available" ? "Available" : p.status === "Booked" ? "Reserved" : "Sold",
            vehicleType: p.vehicle_type,
            regNo: p.reg_no,
            photos: p.vehicle_image ? [p.vehicle_image] : [],
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
            balance: p.balance_amount,
            totalExpenses: (Number(p.fuel_expense) || 0) + (Number(p.repair_expense) || 0) + (Number(p.service_expense) || 0) + (Number(p.insurance_expense) || 0) + (Number(p.rto_expense) || 0) + (Number(p.other_expense) || 0),
            consultancyFees: p.consultancy_fees,
            cityId: p.seller_city_id,
            areaId: p.seller_area_id,
            subAreaId: p.seller_sub_area_id,
            sellerId: p.seller_id,
            sellerName: p.seller_name,
            isDeleted: p.isDeleted,
            createdBy: "Admin",
            createdAt: p.created_at
          }));
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
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedPurchase(null);
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
  const handleOpenEdit = (p) => {
    setIsEditMode(true);
    setSelectedPurchase(p);
    setFormState({ ...p });
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
    const mappedVehDoc = {
      id: p.purchase_id,
      name: `${p.brand_id} - ${p.vehicle_name_id}`,
      brand: p.brand_id,
      model: p.vehicle_name_id,
      year: p.year,
      fuelType: p.fuel_type,
      purchasePrice: p.purchase_price,
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
    const payload = {
      ...formState,
      balance_amount: balanceAmount
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
        ["Purchase Valuation Price", `INR ${p.purchase_price.toLocaleString("en-IN")}`],
        ["Advance Paid Amount", `INR ${p.advance_price.toLocaleString("en-IN")}`],
        ["Remaining Balance Amount Due", `INR ${p.balance_amount.toLocaleString("en-IN")}`],
        ["Consultancy Service Fees", `INR ${p.consultancy_fees.toLocaleString("en-IN")}`]
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
      doc.text(`Total Investment Balance: INR ${p.balance_amount.toLocaleString("en-IN")}`, 190, finalY, { align: "right" });

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
  const totalActiveBalance = purchases.reduce((acc, current) => acc + (Number(current.balance_amount) || 0), 0);
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
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totalStockValue.toLocaleString("en-IN")}</h3>
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
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">₹{totalActiveBalance.toLocaleString("en-IN")}</h3>
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
                            <p className="text-xs font-bold text-slate-800">₹{purchasePrice.toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expenses ({expenseCount})</p>
                            <p className="text-xs font-bold text-slate-800">₹{totalExpenses.toLocaleString("en-IN")}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Consultancy Fees</p>
                            <p className="text-xs font-bold text-slate-800">₹{consultancyFees.toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Cost</p>
                            <p className="text-xs font-extrabold text-indigo-700">₹{totalCost.toLocaleString("en-IN")}</p>
                          </div>
                          {expectedSellingPrice > 0 && (
                            <>
                              <div className="pt-1 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Offer Price</p>
                                <p className="text-xs font-bold text-slate-800">₹{expectedSellingPrice.toLocaleString("en-IN")}</p>
                              </div>
                              <div className="text-right pt-1 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Potential Profit</p>
                                <p className={cn(
                                  "text-xs font-extrabold",
                                  potentialProfit >= 0 ? "text-emerald-600" : "text-rose-500"
                                )}>
                                  ₹{potentialProfit.toLocaleString("en-IN")}
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
      /* 5. Vehicle Expense Route shortcut */
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
        {showViewModal && selectedPurchase && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                            <span>₹{totalExpenses.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-200 uppercase block">Total Net Cost</span>
                            <span className="text-yellow-200 font-extrabold">₹{totalCost.toLocaleString("en-IN")}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-indigo-200 uppercase block">Execution Date</span>
                            <span>{selectedPurchase.purchase_date || "N/A"}</span>
                          </div>
                          {expectedSellingPrice > 0 && (
                            <>
                              <div>
                                <span className="text-[10px] text-indigo-200 uppercase block">Offer Price</span>
                                <span className="text-indigo-100 font-bold">₹{expectedSellingPrice.toLocaleString("en-IN")}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-indigo-200 uppercase block">Potential Net Profit</span>
                                <span className={potentialProfit >= 0 ? "text-emerald-300 font-extrabold" : "text-rose-300 font-extrabold"}>
                                  ₹{potentialProfit.toLocaleString("en-IN")}
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
        {showAddEditModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                            <option value="">-- Choose Customer --</option>
                            {customers.filter((c) => !c.isDeleted).map((c) => <option key={c.id} value={c.id}>
                                {c.id} - {c.name}
                              </option>)}
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
                        <label className="text-xs font-extrabold text-slate-600 uppercase tracking-widest">Offer Price (₹)</label>
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
        {showLoanModal && activeLoanPurchase && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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

      {
    /* WhatsApp Share Card Modal (Requirement 11 - Vehicle Sharing) */
  }
      <AnimatePresence>
        {vehicleToShare && (() => {
    const totalExpenses = (Number(vehicleToShare.fuel_expense) || 0) + (Number(vehicleToShare.repair_expense) || 0) + (Number(vehicleToShare.service_expense) || 0) + (Number(vehicleToShare.insurance_expense) || 0) + (Number(vehicleToShare.rto_expense) || 0) + (Number(vehicleToShare.other_expense) || 0);
    const computedSellingPrice = (Number(vehicleToShare.purchase_price) || 0) + (Number(vehicleToShare.consultancy_fees) || 0) + totalExpenses;
    const expectedPrice = Number(vehicleToShare.expected_selling_price) || computedSellingPrice;

    const companyName = businessProfile?.companyName || "Auto360 Consultancy";
    const companyMobile = businessProfile?.mobileNumber || "N/A";
    const whatsappNum = businessProfile?.whatsAppNumber || "N/A";
    const companyAddress = businessProfile?.address ? `${businessProfile.address}, ${businessProfile.city || ""}, ${businessProfile.state || ""} - ${businessProfile.pincode || ""}` : "Coimbatore, Tamil Nadu";
    const companyWebsite = businessProfile?.website || "www.auto360.com";
    const gstText = businessProfile?.gstNumber ? `📄 *GST:* ${businessProfile.gstNumber}\n` : "";

    const whatsappMsg = `*VEHICLE QUOTATION - ${companyName.toUpperCase()}*
=========================================
📞 *Contact:* ${companyMobile}
💬 *WhatsApp:* ${whatsappNum}
🌐 *Website:* ${companyWebsite}
📍 *Address:* ${companyAddress}
${gstText}=========================================

🚗 *Vehicle details:*
*Brand:* ${vehicleToShare.brand_id}
*Model:* ${vehicleToShare.vehicle_name_id}
*Variant:* ${vehicleToShare.model_details || "N/A"}
*Year:* ${vehicleToShare.year}
*Fuel:* ${vehicleToShare.fuel_type}
*KM Driven:* ${vehicleToShare.kms_driven ? Number(vehicleToShare.kms_driven).toLocaleString("en-IN") : "45,000"} KM
*Reg Number:* ${vehicleToShare.reg_no || "N/A"}

💰 *Expected Offer Price:* ₹${expectedPrice.toLocaleString("en-IN")}

Generated via ${companyName}.`;

    // Canvas poster generation function
    const handleSaveAsImage = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      
      // Gradient background
      const grad = ctx.createLinearGradient(0, 0, 0, 1350);
      grad.addColorStop(0, "#0f172a");
      grad.addColorStop(1, "#1e293b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1000, 1350);

      // Gold border
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 4;
      ctx.strokeRect(30, 30, 940, 1290);

      // Company header
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px Helvetica";
      ctx.textAlign = "center";
      ctx.fillText(companyName.toUpperCase(), 500, 100);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 20px Helvetica";
      ctx.fillText("PREMIUM AUTOMOBILE FOR SALE", 500, 145);

      // Draw Hero Area
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(80, 180, 840, 420);

      const drawVehicleImage = () => {
        return new Promise((resolve) => {
          if (vehicleToShare.vehicle_image) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = vehicleToShare.vehicle_image;
            img.onload = () => {
              ctx.drawImage(img, 80, 180, 840, 420);
              resolve();
            };
            img.onerror = () => {
              drawCarPlaceholder();
              resolve();
            };
          } else {
            drawCarPlaceholder();
            resolve();
          }
        });
      };

      const drawCarPlaceholder = () => {
        ctx.fillStyle = "#334155";
        ctx.fillRect(80, 180, 840, 420);
        ctx.fillStyle = "#64748b";
        ctx.font = "110px Helvetica";
        ctx.fillText("🚗", 500, 390);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 24px Helvetica";
        ctx.fillText("Auto360 Premium Verified Vehicle", 500, 460);
      };

      await drawVehicleImage();

      // Brand and Model name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 46px Helvetica";
      ctx.textAlign = "center";
      ctx.fillText(`${vehicleToShare.brand_id} ${vehicleToShare.vehicle_name_id}`, 500, 665);

      // Price Tag
      ctx.fillStyle = "#facc15";
      ctx.font = "bold 52px Helvetica";
      ctx.fillText(`Expected Price: ₹${expectedPrice.toLocaleString("en-IN")}/-`, 500, 745);

      // Grid stats box
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(80, 790, 840, 240);

      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(500, 790);
      ctx.lineTo(500, 1030);
      ctx.moveTo(80, 910);
      ctx.lineTo(920, 910);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px Helvetica";
      
      // Stat 1: Year
      ctx.fillText("MANUFACTURING YEAR", 120, 830);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Helvetica";
      ctx.fillText(String(vehicleToShare.year), 120, 875);

      // Stat 2: Fuel
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px Helvetica";
      ctx.fillText("FUEL TYPE", 540, 830);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Helvetica";
      ctx.fillText(vehicleToShare.fuel_type, 540, 875);

      // Stat 3: KM driven
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px Helvetica";
      ctx.fillText("KM DRIVEN", 120, 950);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Helvetica";
      const kmsText = vehicleToShare.kms_driven ? `${Number(vehicleToShare.kms_driven).toLocaleString("en-IN")} KM` : "45,000 KM";
      ctx.fillText(kmsText, 120, 995);

      // Stat 4: Reg Number
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 18px Helvetica";
      ctx.fillText("REGISTRATION NUMBER", 540, 950);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px Helvetica font-mono";
      ctx.fillText(vehicleToShare.reg_no || "N/A", 540, 995);

      // Contact details row
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(80, 1060, 840, 215);

      ctx.textAlign = "left";
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 22px Helvetica";
      ctx.fillText(companyName, 120, 1105);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "18px Helvetica";
      ctx.fillText(`📞 Mobile: ${companyMobile}`, 120, 1145);
      ctx.fillText(`💬 WhatsApp: ${whatsappNum}`, 120, 1180);
      ctx.fillText(`🌐 Website: ${companyWebsite}`, 120, 1215);
      if (businessProfile?.gstNumber) {
        ctx.fillText(`📄 GST ID: ${businessProfile.gstNumber}`, 120, 1245);
      }

      // Draw UPI scan to pay QR
      const upiId = businessProfile?.upiId;
      if (upiId) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent('upi://pay?pa=' + upiId + '&pn=' + encodeURIComponent(companyName) + '&am=' + expectedPrice + '&cu=INR')}`;
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = qrUrl;
        await new Promise((resolve) => {
          qrImg.onload = () => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(720, 1080, 180, 180);
            ctx.drawImage(qrImg, 725, 1085, 170, 170);
            resolve();
          };
          qrImg.onerror = () => resolve();
        });
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Poster_${vehicleToShare.brand_id}_${vehicleToShare.vehicle_name_id}.png`;
      link.href = dataUrl;
      link.click();
    };

    // PDF poster generation function
    const handleSaveAsPDF = async () => {
      const doc = new jsPDF("p", "mm", "a4");
      
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(1);
      doc.rect(5, 5, 200, 287);

      // Dark header bar
      doc.setFillColor(15, 23, 42);
      doc.rect(6, 6, 198, 42, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("Helvetica", "bold");
      doc.text(companyName.toUpperCase(), 105, 20, { align: "center" });

      doc.setFontSize(11);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(56, 189, 248);
      doc.text("PREMIUM AUTOMOBILE FOR SALE", 105, 28, { align: "center" });

      if (companyWebsite) {
        doc.setFontSize(8.5);
        doc.setTextColor(148, 163, 184);
        doc.text(companyWebsite, 105, 34, { align: "center" });
      }

      let imgY = 54;
      let imgH = 80;

      const drawPDFImagePlaceholder = () => {
        doc.setFillColor(241, 245, 249);
        doc.rect(15, imgY, 180, imgH, "F");
        doc.setFontSize(14);
        doc.setTextColor(148, 163, 184);
        doc.setFont("Helvetica", "bold");
        doc.text("AUTO360", 105, imgY + (imgH / 2) - 2, { align: "center" });
        doc.setFontSize(9);
        doc.setFont("Helvetica", "normal");
        doc.text("Premium Automobile Advertisement", 105, imgY + (imgH / 2) + 6, { align: "center" });
      };

      if (vehicleToShare.vehicle_image) {
        try {
          const imgData = await loadImageBase64(vehicleToShare.vehicle_image);
          if (imgData) {
            doc.addImage(imgData, "JPEG", 15, imgY, 180, imgH);
          } else {
            drawPDFImagePlaceholder();
          }
        } catch (e) {
          drawPDFImagePlaceholder();
        }
      } else {
        drawPDFImagePlaceholder();
      }

      doc.setFontSize(18);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`${vehicleToShare.brand_id} ${vehicleToShare.vehicle_name_id}`, 15, imgY + imgH + 12);

      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129);
      doc.text(`Price: INR ${expectedPrice.toLocaleString("en-IN")}/-`, 195, imgY + imgH + 12, { align: "right" });

      // Grid Details
      const gridY = imgY + imgH + 20;
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.rect(15, gridY, 180, 48, "FD");

      doc.line(105, gridY, 105, gridY + 48);
      doc.line(15, gridY + 24, 195, gridY + 24);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      
      // Grid cells
      doc.text("MANUFACTURING YEAR", 20, gridY + 8);
      doc.setFontSize(13);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(String(vehicleToShare.year), 20, gridY + 16);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.text("FUEL TYPE", 110, gridY + 8);
      doc.setFontSize(13);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(vehicleToShare.fuel_type, 110, gridY + 16);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.text("KM DRIVEN", 20, gridY + 32);
      doc.setFontSize(13);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const kmsText = vehicleToShare.kms_driven ? `${Number(vehicleToShare.kms_driven).toLocaleString("en-IN")} KM` : "45,000 KM";
      doc.text(kmsText, 20, gridY + 40);

      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.text("REGISTRATION NUMBER", 110, gridY + 32);
      doc.setFontSize(13);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(vehicleToShare.reg_no || "N/A", 110, gridY + 40);

      // Contact details block
      const footY = gridY + 60;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, footY, 180, 42, "F");

      doc.setFontSize(11);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(companyName, 20, footY + 10);

      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`Phone Contact: ${companyMobile}`, 20, footY + 17);
      doc.text(`WhatsApp: ${whatsappNum}`, 20, footY + 23);
      doc.text(`Website URL: ${companyWebsite}`, 20, footY + 29);
      doc.text(`Address: ${companyAddress}`, 20, footY + 35);

      // UPI QR Code on PDF
      const upiId = businessProfile?.upiId;
      if (upiId) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent('upi://pay?pa=' + upiId + '&pn=' + encodeURIComponent(companyName) + '&am=' + expectedPrice + '&cu=INR')}`;
        try {
          const qrData = await loadImageBase64(qrUrl);
          if (qrData) {
            doc.addImage(qrData, "JPEG", 155, footY + 5, 32, 32);
          }
        } catch (e) {
          console.warn("QR load failed for PDF", e);
        }
      }

      doc.save(`Poster_${vehicleToShare.brand_id}_${vehicleToShare.vehicle_name_id}.pdf`);
    };

    const loadImageBase64 = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = () => resolve(null);
      });
    };

    const upiId = businessProfile?.upiId;
    const upiQrSrc = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('upi://pay?pa=' + upiId + '&pn=' + encodeURIComponent(companyName) + '&am=' + expectedPrice + '&cu=INR')}` : null;

    return <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setVehicleToShare(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 z-10 flex flex-col md:flex-row max-h-[90vh]"
              >
                {/* Left Side: Real-time visual poster preview */}
                <div className="flex-1 bg-slate-900 p-6 overflow-y-auto flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
                  <div className="w-full max-w-[360px] aspect-[10/14.5] bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-left text-white select-none">
                    {/* Header banner */}
                    <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] uppercase font-extrabold tracking-widest text-brand-400">{companyName}</p>
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">PREMIUM SELECTION</h5>
                      </div>
                      <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">FOR SALE</span>
                    </div>

                    {/* Hero Photo placeholder */}
                    <div className="h-44 bg-slate-900 relative flex items-center justify-center overflow-hidden border-b border-slate-800">
                      {vehicleToShare.vehicle_image ? (
                        <img
                          src={vehicleToShare.vehicle_image}
                          alt="Vehicle"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-slate-500 space-y-1">
                          <Car size={40} className="text-brand-500 stroke-[1.5]" />
                          <span className="text-xs">Auto360 Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Content body */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="font-extrabold text-white text-lg tracking-tight">{vehicleToShare.brand_id} {vehicleToShare.vehicle_name_id}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase">{vehicleToShare.model_details || "N/A"}</p>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Year</span>
                          <span className="font-bold text-slate-200">{vehicleToShare.year}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Fuel Type</span>
                          <span className="font-bold text-slate-200">{vehicleToShare.fuel_type}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">KM Driven</span>
                          <span className="font-bold text-slate-200">{vehicleToShare.kms_driven ? `${Number(vehicleToShare.kms_driven).toLocaleString("en-IN")} KM` : "45,000 KM"}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold uppercase block">Reg No</span>
                          <span className="font-bold text-slate-200 font-mono">{vehicleToShare.reg_no || "N/A"}</span>
                        </div>
                      </div>

                      {/* Price banner */}
                      <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-3 text-center">
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider block">EXPECTED OFFER PRICE</span>
                        <span className="text-xl font-black text-brand-400">₹{expectedPrice.toLocaleString("en-IN")}/-</span>
                      </div>

                      {/* Contact row and dynamic UPI QR */}
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[10px] text-slate-400">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-300">{companyName}</p>
                          <p>📞 {companyMobile}</p>
                          <p>🌐 {companyWebsite}</p>
                        </div>
                        {upiQrSrc && (
                          <div className="w-12 h-12 bg-white rounded p-0.5 flex items-center justify-center">
                            <img src={upiQrSrc} alt="UPI QR" className="w-full h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Options and buttons panel */}
                <div className="w-full md:w-[320px] p-6 flex flex-col justify-between max-h-[90vh]">
                  <div className="space-y-5 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">Share Vehicle</h4>
                        <p className="text-xs text-slate-500">Choose your preferred sharing mode</p>
                      </div>
                      <button onClick={() => setVehicleToShare(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={handleSaveAsImage}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all uppercase tracking-wider cursor-pointer border-0 outline-none"
                      >
                        <Download size={14} />
                        <span>Save Poster as Image</span>
                      </button>

                      <button
                        onClick={handleSaveAsPDF}
                        className="w-full px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-100 transition-all uppercase tracking-wider cursor-pointer border-0 outline-none"
                      >
                        <FileDown size={14} />
                        <span>Save as PDF Poster</span>
                      </button>

                      <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest">Or Share Direct</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                      </div>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMsg)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 transition-all uppercase tracking-wider text-center border-0 outline-none"
                      >
                        <Share2 size={14} />
                        <span>Direct WhatsApp Share</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 text-left mt-6">
                    <p className="font-bold text-slate-800 mb-1">💡 Pro-Tip</p>
                    <p className="leading-relaxed">All company details are dynamically populated from your <b>Company Master</b> settings for real-time brand professionalism.</p>
                  </div>
                </div>
              </motion.div>
            </div>;
  })()}
      </AnimatePresence>

    </div>;
}
