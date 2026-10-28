import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  ChevronRight,
  Layers,
  Users,
  Download,
  AlertCircle,
  Eye,
  Phone,
  X,
  ChevronLeft,
  Building2,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { calculateSupplierTotalStats } from "../lib/outstandingCalculator";
import { hasModulePermission } from "../lib/permissions";
import { INDIAN_STATES } from "../data/indianStates";
export default function Masters({
  brands,
  vehicleNames,
  cities: propCities,
  areas: propAreas,
  subAreas: propSubAreas,
  suppliers: propSuppliers,
  customers,
  purchases = [],
  payments = [],
  vouchers = [],
  onUpdateBrands,
  onUpdateVehicleNames,
  onUpdateCities,
  onUpdateAreas,
  onUpdateSubAreas,
  onUpdateSuppliers,
  onUpdateCustomers,
  initialTab,
  initialSubTab,
  initialSearch,
  currentUser,
  isSoftwareOwner
}) {
  const [activeTab, setActiveTab] = useState(initialTab || "vehicle");
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "brands");
  const navigate = useNavigate();
  const handleSubTabClick = (subTab) => {
    setActiveSubTab(subTab);
    if (subTab === "brands") {
      setActiveTab("vehicle");
      navigate("/masters/brands");
    } else if (subTab === "names") {
      setActiveTab("vehicle");
      navigate("/masters/vehicle-names");
    } else if (subTab === "cities") {
      setActiveTab("location");
      navigate("/masters/cities");
    } else if (subTab === "areas") {
      setActiveTab("location");
      navigate("/masters/areas");
    } else if (subTab === "subareas") {
      setActiveTab("location");
      navigate("/masters/sub-areas");
    } else if (subTab === "suppliers") {
      setActiveTab("contacts");
      navigate("/masters/suppliers");
    }
  };
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    brandId: "",
    cityId: "",
    areaId: "",
    subAreaId: "",
    mobile: "",
    address: "",
    vehicleType: "Two Wheeler"
  });
  const [dbBranches, setDbBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchSearch, setBranchSearch] = useState("");
  const [brId, setBrId] = useState("");
  const [brCode, setBrCode] = useState("");
  const [brName, setBrName] = useState("");
  const [brPhone, setBrPhone] = useState("");
  const [brMobile, setBrMobile] = useState("");
  const [brEmail, setBrEmail] = useState("");
  const [brAddress, setBrAddress] = useState("");
  const [brCity, setBrCity] = useState("");
  const [brState, setBrState] = useState("");
  const [brPincode, setBrPincode] = useState("");
  const [brArea, setBrArea] = useState("");
  const [brSubArea, setBrSubArea] = useState("");
  const [brGstNo, setBrGstNo] = useState("");
  const [brManagerName, setBrManagerName] = useState("");
  const [brLogo, setBrLogo] = useState("");
  const [brStatus, setBrStatus] = useState("Active");
  const [isUploadingBrLogo, setIsUploadingBrLogo] = useState(false);
  const [showBranchViewModal, setShowBranchViewModal] = useState(false);
  const [viewingBranch, setViewingBranch] = useState(null);
  const [dbSuppliers, setDbSuppliers] = useState([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [supPage, setSupPage] = useState(1);
  const [supLimit, setSupLimit] = useState(10);
  const [supTotalCount, setSupTotalCount] = useState(0);
  const [supTotalPages, setSupTotalPages] = useState(1);
  const [supId, setSupId] = useState("");
  const [supName, setSupName] = useState("");
  const [supMobile, setSupMobile] = useState("");
  const [supCityId, setSupCityId] = useState("");
  const [supAreaId, setSupAreaId] = useState("");
  const [supSubAreaId, setSupSubAreaId] = useState("");
  const [supAddress, setSupAddress] = useState("");
  const [citiesList, setCitiesList] = useState([]);
  const [areasList, setAreasList] = useState([]);
  const [subAreasList, setSubAreasList] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  useEffect(() => {
    if (initialSearch !== undefined && initialSearch !== "") {
      setSupSearch(initialSearch);
      setSupPage(1);
    }
  }, [initialSearch]);
  useEffect(() => {
    fetchAllLocationData();
  }, [propCities, propAreas, propSubAreas]);

  const fetchAllLocationData = async () => {
    try {
      const [cData, aData, saData] = await Promise.all([
        safeFetchJson("/api/cities"),
        safeFetchJson("/api/areas"),
        safeFetchJson("/api/subareas")
      ]);
      setCitiesList(cData || []);
      setAreasList(aData || []);
      setSubAreasList(saData || []);
    } catch (e) {
      console.warn("Error fetching location data:", e);
    }
  };
  useEffect(() => {
    if (activeSubTab === "suppliers") {
      fetchSuppliers();
    }
  }, [activeSubTab, supSearch, supPage, supLimit]);
  useEffect(() => {
    if (activeSubTab === "branches") {
      fetchBranches();
    }
  }, [activeSubTab, branchSearch]);
  const fetchBranches = async () => {
    setBranchesLoading(true);
    try {
      const data = await safeFetchJson(`/api/branches`);
      setDbBranches(data);
    } catch (e) {
      console.warn("Error fetching branches graceful-catch:", e);
    } finally {
      setBranchesLoading(false);
    }
  };
  const fetchNextBranchId = async () => {
    try {
      const data = await safeFetchJson("/api/branches/nextId");
      setBrId(data.nextId);
      setBrCode(data.nextId);
    } catch (e) {
      setBrId("BR001");
      setBrCode("BR001");
    }
  };

  const handleBranchLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBrLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      if (data.filePath) {
        setBrLogo(data.filePath);
      }
    } catch (err) {
      console.error(err);
      setGeneralError("Failed to upload branch logo");
    } finally {
      setIsUploadingBrLogo(false);
    }
  };
  const safeFetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response, but received: ${contentType || "none"}`);
    }
    return res.json();
  };
  const fetchSuppliers = async () => {
    setSuppliersLoading(true);
    try {
      const query = `?search=${encodeURIComponent(supSearch)}&page=${supPage}&limit=${supLimit}`;
      const result = await safeFetchJson(`/api/suppliers${query}`);
      if (result && result.data && result.pagination) {
        setDbSuppliers(result.data);
        setSupTotalCount(result.pagination.totalCount);
        setSupTotalPages(result.pagination.totalPages);
      }
    } catch (e) {
      console.warn("Error loading suppliers graceful-catch:", e);
    } finally {
      setSuppliersLoading(false);
    }
  };
  const fetchNextSupplierId = async () => {
    try {
      const data = await safeFetchJson("/api/suppliers/nextId");
      setSupId(data.nextId);
    } catch (e) {
      setSupId("SUP001");
    }
  };
  const handleAdd = async () => {
    if (activeSubTab === "suppliers") {
      setFormErrors({});
      setGeneralError(null);
      await fetchNextSupplierId();
      setSupName("");
      setSupMobile("");
      setSupCityId("");
      setSupAreaId("");
      setSupSubAreaId("");
      setSupAddress("");
      setEditingItem(null);
      setShowModal(true);
    } else if (activeSubTab === "branches") {
      setFormErrors({});
      setGeneralError(null);
      await fetchNextBranchId();
      setBrName("");
      setBrPhone("");
      setBrMobile("");
      setBrEmail("");
      setBrAddress("");
      setBrCity("");
      setBrState("Tamil Nadu");
      setBrPincode("");
      setBrArea("");
      setBrSubArea("");
      setBrGstNo("");
      setBrManagerName("");
      setBrLogo("");
      setBrStatus("Active");
      setEditingItem(null);
      setShowModal(true);
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        brandId: "",
        cityId: "",
        areaId: "",
        subAreaId: "",
        mobile: "",
        address: "",
        vehicleType: "Two Wheeler"
      });
      setShowModal(true);
    }
  };
  const handleEdit = async (item) => {
    if (activeSubTab === "suppliers") {
      setEditingItem(item);
      setFormErrors({});
      setGeneralError(null);
      setSupId(item.supplier_id);
      setSupName(item.supplier_name);
      setSupMobile(item.supplier_mobile);
      setSupCityId(item.city_id || "");
      setSupAreaId(item.area_id || "");
      setSupSubAreaId(item.sub_area_id || "");
      setSupAddress(item.address || "");
      setShowModal(true);
    } else if (activeSubTab === "branches") {
      setEditingItem(item);
      setFormErrors({});
      setGeneralError(null);
      setBrId(item.id);
      setBrCode(item.code || item.id);
      setBrName(item.name || "");
      setBrPhone(item.phone || "");
      setBrMobile(item.mobile || "");
      setBrEmail(item.email || "");
      setBrAddress(item.address || "");
      setBrCity(item.city || "");
      setBrState(item.state || "Tamil Nadu");
      setBrPincode(item.pincode || "");
      setBrArea(item.area || "");
      setBrSubArea(item.subArea || "");
      setBrGstNo(item.gstNo || "");
      setBrManagerName(item.managerName || "");
      setBrLogo(item.logo || "");
      setBrStatus(item.status || "Active");
      setShowModal(true);
    } else {
      setEditingItem(item);
      setFormData({ ...item });
      setShowModal(true);
    }
  };
  const handleOpenViewDetails = (supplier) => {
    setViewingSupplier(supplier);
    setShowViewModal(true);
  };
  const handleDelete = (id, name) => {
    setDeleteConfirm({
      isOpen: true,
      message: "Are you sure you want to delete this record?",
      onConfirm: async () => {
        if (activeSubTab === "suppliers") {
          try {
            const res = await fetch(`/api/suppliers/${id}`, {
              method: "DELETE"
            });
            if (res.ok) {
              fetchSuppliers();
            }
          } catch (e) {
            console.error("Error deleting supplier", e);
          }
        } else if (activeSubTab === "branches") {
          try {
            const res = await fetch(`/api/branches/${id}`, {
              method: "DELETE"
            });
            if (res.ok) {
              fetchBranches();
            }
          } catch (e) {
            console.error("Error deleting branch", e);
          }
        } else if (activeSubTab === "cities") {
          try {
            await fetch(`/api/cities/${id}`, { method: "DELETE" });
            onUpdateCities(propCities.filter((c) => c.id !== id));
          } catch (e) {
            console.error("Error deleting city", e);
          }
        } else if (activeSubTab === "areas") {
          try {
            await fetch(`/api/areas/${id}`, { method: "DELETE" });
            onUpdateAreas(propAreas.filter((a) => a.id !== id));
          } catch (e) {
            console.error("Error deleting area", e);
          }
        } else if (activeSubTab === "subareas") {
          try {
            await fetch(`/api/subareas/${id}`, { method: "DELETE" });
            onUpdateSubAreas(propSubAreas.filter((sa) => sa.id !== id));
          } catch (e) {
            console.error("Error deleting subarea", e);
          }
        } else if (activeSubTab === "brands") {
          try {
            await fetch(`/api/brands/${id}`, { method: "DELETE" });
          } catch (e) {
            console.error("Error deleting brand", e);
          }
          onUpdateBrands(brands.filter((b) => b.id !== id));
        } else if (activeSubTab === "names") {
          try {
            await fetch(`/api/vehicle-names/${id}`, { method: "DELETE" });
          } catch (e) {
            console.error("Error deleting vehicle model", e);
          }
          onUpdateVehicleNames(vehicleNames.filter((vn) => vn.id !== id));
        } else {
          if (activeSubTab === "customers") onUpdateCustomers(customers.filter((c) => c.id !== id));
        }
      }
    });
  };
  const handleExportSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers/export");
      const data = await res.json();
      if (!res.ok) return;
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];
      for (const row of data) {
        const values = headers.map((header) => {
          const escaped = ("" + row[header]).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      }
      const csvContent = "\uFEFF" + csvRows.join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `suppliers_report_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Excel Export failed", e);
    }
  };
  const validateSupplierForm = () => {
    const errors = {};
    if (!supName.trim()) {
      errors.name = "Supplier Name is required";
    }
    if (!supMobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(supMobile)) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSave = async () => {
    if (activeSubTab === "suppliers") {
      if (!validateSupplierForm()) return;
      const payload = {
        name: supName,
        mobile: supMobile,
        city_id: supCityId,
        area_id: supAreaId,
        sub_area_id: supSubAreaId,
        address: supAddress
      };
      try {
        let res;
        if (editingItem) {
          res = await fetch(`/api/suppliers/${editingItem.supplier_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch("/api/suppliers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
        const data = await res.json();
        if (res.ok) {
          setShowModal(false);
          fetchSuppliers();
        } else {
          setGeneralError(data.error || "Server error saving supplier details");
        }
      } catch (e) {
        setGeneralError("Network error saving details");
      }
    } else if (activeSubTab === "branches") {
      const errors = {};
      if (!brName.trim()) errors.name = "Branch Name is required";
      if (!brCode.trim()) errors.code = "Branch Code is required";
      if (!brMobile.trim()) errors.mobile = "Mobile Number is required";
      else if (!/^\d{10}$/.test(brMobile)) errors.mobile = "Mobile number must be exactly 10 digits";
      if (!brEmail.trim()) errors.email = "Email Address is required";
      if (!brAddress.trim()) errors.address = "Branch Address is required";

      // Duplicate validations
      const currentEditingId = editingItem ? editingItem.id : null;
      const dupName = dbBranches.find(b => b.id !== currentEditingId && b.name.toLowerCase().trim() === brName.toLowerCase().trim());
      if (dupName) errors.name = "Duplicate Branch Name: Branch name already exists";

      const dupCode = dbBranches.find(b => b.id !== currentEditingId && ((b.code && b.code.toLowerCase().trim() === brCode.toLowerCase().trim()) || b.id.toLowerCase().trim() === brCode.toLowerCase().trim()));
      if (dupCode) errors.code = "Duplicate Branch Code: Branch code already exists";

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      const payload = {
        code: brCode,
        name: brName,
        phone: brPhone,
        mobile: brMobile,
        email: brEmail,
        address: brAddress,
        city: brCity,
        state: brState,
        pincode: brPincode,
        area: brArea,
        subArea: brSubArea,
        gstNo: brGstNo,
        managerName: brManagerName,
        logo: brLogo,
        status: brStatus
      };
      try {
        let res;
        if (editingItem) {
          res = await fetch(`/api/branches/${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch("/api/branches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
        const data = await res.json();
        if (res.ok) {
          setShowModal(false);
          fetchBranches();
        } else {
          setGeneralError(data.error || "Server error saving branch details");
        }
      } catch (e) {
        setGeneralError("Network error saving details");
      }
    } else if (activeSubTab === "cities") {
      if (!formData.name) return;
      try {
        let res;
        const payload = { name: formData.name };
        if (editingItem) {
          res = await fetch(`/api/cities/${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch("/api/cities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
        if (res.ok) {
          const savedItem = await res.json();
          if (editingItem) onUpdateCities(propCities.map((c) => c.id === editingItem.id ? savedItem : c));
          else onUpdateCities([...propCities, savedItem]);
          setShowModal(false);
        } else {
          const data = await res.json();
          setGeneralError(data.error || "Failed to save city");
        }
      } catch (err) {
        setGeneralError("Network error saving details");
      }
    } else if (activeSubTab === "areas") {
      if (!formData.name || !formData.cityId) return;
      try {
        let res;
        const payload = { name: formData.name, cityId: formData.cityId };
        if (editingItem) {
          res = await fetch(`/api/areas/${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch("/api/areas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
        if (res.ok) {
          const savedItem = await res.json();
          if (editingItem) onUpdateAreas(propAreas.map((a) => a.id === editingItem.id ? savedItem : a));
          else onUpdateAreas([...propAreas, savedItem]);
          setShowModal(false);
        } else {
          const data = await res.json();
          setGeneralError(data.error || "Failed to save area");
        }
      } catch (err) {
        setGeneralError("Network error saving details");
      }
    } else if (activeSubTab === "subareas") {
      if (!formData.name || !formData.areaId) return;
      try {
        let res;
        const payload = { name: formData.name, areaId: formData.areaId };
        if (editingItem) {
          res = await fetch(`/api/subareas/${editingItem.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        } else {
          res = await fetch("/api/subareas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
        }
        if (res.ok) {
          const savedItem = await res.json();
          if (editingItem) onUpdateSubAreas(propSubAreas.map((sa) => sa.id === editingItem.id ? savedItem : sa));
          else onUpdateSubAreas([...propSubAreas, savedItem]);
          setShowModal(false);
        } else {
          const data = await res.json();
          setGeneralError(data.error || "Failed to save subarea");
        }
      } catch (err) {
        setGeneralError("Network error saving details");
      }
    } else {
      if (!formData.name) return;
      const newItem = {
        id: editingItem?.id || Math.random().toString(36).substr(2, 9),
        ...formData,
        isDeleted: false,
        createdBy: "Admin",
        createdAt: editingItem?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
      };
      if (activeSubTab === "brands") {
        try {
          if (editingItem) {
            fetch(`/api/brands/${editingItem.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newItem)
            }).then(r => r.ok && r.json()).then(saved => {
              if (saved) onUpdateBrands(brands.map((b) => b.id === editingItem.id ? saved : b));
            }).catch(e => console.error(e));
            onUpdateBrands(brands.map((b) => b.id === editingItem.id ? newItem : b));
          } else {
            fetch("/api/brands", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newItem)
            }).then(r => r.ok && r.json()).then(saved => {
              if (saved) onUpdateBrands([...brands.filter(b => b.id !== newItem.id && b.id !== saved.id), saved]);
            }).catch(e => console.error(e));
            onUpdateBrands([...brands, newItem]);
          }
        } catch (e) {
          console.error("Error saving brand", e);
          if (editingItem) onUpdateBrands(brands.map((b) => b.id === editingItem.id ? newItem : b));
          else onUpdateBrands([...brands, newItem]);
        }
      } else if (activeSubTab === "names") {
        try {
          if (editingItem) {
            fetch(`/api/vehicle-names/${editingItem.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newItem)
            }).then(r => r.ok && r.json()).then(saved => {
              if (saved) onUpdateVehicleNames(vehicleNames.map((vn) => vn.id === editingItem.id ? saved : vn));
            }).catch(e => console.error(e));
            onUpdateVehicleNames(vehicleNames.map((vn) => vn.id === editingItem.id ? newItem : vn));
          } else {
            fetch("/api/vehicle-names", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newItem)
            }).then(r => r.ok && r.json()).then(saved => {
              if (saved) onUpdateVehicleNames([...vehicleNames.filter(vn => vn.id !== newItem.id && vn.id !== saved.id), saved]);
            }).catch(e => console.error(e));
            onUpdateVehicleNames([...vehicleNames, newItem]);
          }
        } catch (e) {
          console.error("Error saving vehicle model", e);
          if (editingItem) onUpdateVehicleNames(vehicleNames.map((vn) => vn.id === editingItem.id ? newItem : vn));
          else onUpdateVehicleNames([...vehicleNames, newItem]);
        }
      } else if (activeSubTab === "customers") {
        if (editingItem) onUpdateCustomers(customers.map((c) => c.id === editingItem.id ? newItem : c));
        else onUpdateCustomers([...customers, newItem]);
      }
      setShowModal(false);
    }
  };
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">Master Database</h2>
          <p className="text-sm text-slate-500 font-sans">Configure standard locations, agencies, vehicles, and business partners</p>
        </div>
      </div>

      <div className="w-full">
        {
    /* Dynamic content card */
  }
        <div className="w-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            {activeSubTab === "brands" && <MasterList
              title="Brand Master"
              items={brands}
              onAdd={handleAdd}
              canCreate={hasModulePermission(currentUser, "masters", "create")}
              renderItem={(item) => <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <div className="flex gap-2">
                                {hasModulePermission(currentUser, "masters", "edit") && (
                                  <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer outline-none"><Edit2 size={16} /></button>
                                )}
                                {hasModulePermission(currentUser, "masters", "delete") && (
                                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer outline-none"><Trash2 size={16} /></button>
                                )}
                              </div>
                            </div>}
            />}
            {activeSubTab === "names" && <MasterList
              title="Vehicle Name Master"
              items={vehicleNames}
              onAdd={handleAdd}
              canCreate={hasModulePermission(currentUser, "masters", "create")}
              renderItem={(item) => {
                const brand = brands.find((b) => b.id === item.brandId);
                return <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                <div>
                                  <span className="font-bold text-slate-900">{item.name}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{brand?.name || "Unknown Brand"}</p>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">{item.vehicleType || "Two Wheeler"}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  {hasModulePermission(currentUser, "masters", "edit") && (
                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer outline-none"><Edit2 size={16} /></button>
                                  )}
                                  {hasModulePermission(currentUser, "masters", "delete") && (
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer outline-none"><Trash2 size={16} /></button>
                                  )}
                                </div>
                              </div>;
              }}
            />}
            {activeSubTab === "cities" && <MasterList
              title="City Master"
              items={propCities}
              onAdd={handleAdd}
              canCreate={hasModulePermission(currentUser, "masters", "create")}
              renderItem={(item) => <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                              <span className="font-bold text-slate-900">{item.name}</span>
                              <div className="flex gap-2">
                                {hasModulePermission(currentUser, "masters", "edit") && (
                                  <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer outline-none"><Edit2 size={16} /></button>
                                )}
                                {hasModulePermission(currentUser, "masters", "delete") && (
                                  <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer outline-none"><Trash2 size={16} /></button>
                                )}
                              </div>
                            </div>}
            />}
            {activeSubTab === "areas" && <MasterList
              title="Area Master"
              items={propAreas}
              onAdd={handleAdd}
              canCreate={hasModulePermission(currentUser, "masters", "create")}
              renderItem={(item) => {
                const city = propCities.find((c) => c.id === item.cityId);
                return <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                <div>
                                  <span className="font-bold text-slate-900">{item.name}</span>
                                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{city?.name || "Unknown City"}</p>
                                </div>
                                <div className="flex gap-2">
                                  {hasModulePermission(currentUser, "masters", "edit") && (
                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer outline-none"><Edit2 size={16} /></button>
                                  )}
                                  {hasModulePermission(currentUser, "masters", "delete") && (
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer outline-none"><Trash2 size={16} /></button>
                                  )}
                                </div>
                              </div>;
              }}
            />}
            {activeSubTab === "subareas" && <MasterList
              title="Sub Area Master"
              items={propSubAreas}
              onAdd={handleAdd}
              canCreate={hasModulePermission(currentUser, "masters", "create")}
              renderItem={(item) => {
                const area = propAreas.find((a) => a.id === item.areaId);
                const city = propCities.find((c) => c.id === area?.cityId);
                return <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                                <div>
                                  <span className="font-bold text-slate-900">{item.name}</span>
                                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                                    {area?.name || "Unknown Area"} • {city?.name || "Unknown City"}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  {hasModulePermission(currentUser, "masters", "edit") && (
                                    <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-brand-600 transition-colors cursor-pointer outline-none"><Edit2 size={16} /></button>
                                  )}
                                  {hasModulePermission(currentUser, "masters", "delete") && (
                                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer outline-none"><Trash2 size={16} /></button>
                                  )}
                                </div>
                              </div>;
              }}
            />}

            {
    /* SUPPLIERS VIEW */
  }
            {activeSubTab === "suppliers" && <div className="flex flex-col h-full min-h-[500px]">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">Supplier Directory</h3>
                    <p className="text-xs text-slate-500">Manage auto vendors, dealer networks, and consultancy partners</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
    type="text"
    placeholder="Search ID, name, mobile, address..."
    value={supSearch}
    onChange={(e) => {
      setSupSearch(e.target.value);
      setSupPage(1);
    }}
    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-56"
  />
                    </div>
                    <button
    type="button"
    onClick={handleExportSuppliers}
    className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer outline-none"
  >
                      <Download size={14} />
                      Export
                    </button>
                    {hasModulePermission(currentUser, "masters", "create") && (
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 bg-brand-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 cursor-pointer outline-none shadow-md shadow-brand-100"
                      >
                        <Plus size={16} />
                        Add Supplier
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {suppliersLoading ? <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2" />
                      <p className="text-xs font-semibold">Loading suppliers...</p>
                    </div> : dbSuppliers.length > 0 ? <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200">
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">ID</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Supplier Contact</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase">Location details</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dbSuppliers.map((s) => {
                          const city = citiesList.find((c) => c.id === s.city_id)?.name || "";
                          const area = areasList.find((a) => a.id === s.area_id)?.name || "";
                          const subArea = subAreasList.find((sa) => sa.id === s.sub_area_id)?.name || "";
                          const locParts = [city, area, subArea].filter(Boolean);
                          const locText = locParts.length > 0 ? locParts.join(" • ") : "No location linked";
                          return (
                            <tr key={s.supplier_id} className="hover:bg-slate-50/25 group transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{s.supplier_id}</td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900 leading-snug">{s.supplier_name}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Phone size={12} />
                                  <span>{s.supplier_mobile}</span>
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-slate-700 font-bold">{locText}</p>
                                {s.address && <p className="text-[11px] text-slate-400 font-medium truncate max-w-[220px]">{s.address}</p>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button onClick={() => handleOpenViewDetails(s)} className="p-2 text-slate-500 hover:text-brand-600 bg-slate-100/60 hover:bg-brand-50 rounded-lg cursor-pointer transition-colors" title="View details"><Eye size={15} /></button>
                                  {hasModulePermission(currentUser, "masters", "edit") && (
                                    <button onClick={() => handleEdit(s)} className="p-2 text-slate-500 hover:text-brand-600 bg-slate-100/60 hover:bg-brand-50 rounded-lg cursor-pointer transition-colors" title="Edit"><Edit2 size={15} /></button>
                                  )}
                                  {hasModulePermission(currentUser, "masters", "delete") && (
                                    <button onClick={() => handleDelete(s.supplier_id, s.supplier_name)} className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer transition-colors" title="Delete"><Trash2 size={15} /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table> : <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Users size={48} className="mb-4 opacity-20" />
                      <p className="font-bold text-slate-600 text-sm">No suppliers cataloged</p>
                    </div>}
                </div>

                {
    /* Pagination footer */
  }
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Rows:</span>
                    <select
    value={supLimit}
    onChange={(e) => {
      setSupLimit(parseInt(e.target.value));
      setSupPage(1);
    }}
    className="px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs outline-none"
  >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                    <p className="text-xs text-slate-500 font-medium hidden sm:block">
                      Show {supTotalCount > 0 ? (supPage - 1) * supLimit + 1 : 0} to {Math.min(supPage * supLimit, supTotalCount)} of {supTotalCount} suppliers
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <button
    type="button"
    className="p-1 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer outline-none"
    onClick={() => setSupPage((p) => Math.max(p - 1, 1))}
    disabled={supPage === 1}
  >
                      <ChevronLeft size={15} />
                    </button>
                    <div className="flex items-center px-1 text-xs font-bold text-slate-600">
                      Page {supPage} of {supTotalPages}
                    </div>
                    <button
    type="button"
    className="p-1 border border-slate-200 bg-white text-slate-600 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer outline-none"
    onClick={() => setSupPage((p) => Math.min(p + 1, supTotalPages))}
    disabled={supPage === supTotalPages}
  >
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>}

            {
    /* BRANCHES VIEW */
  }
            {activeSubTab === "branches" && <div className="flex flex-col h-full min-h-[500px]">
                <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950 font-sans">Branch Directory</h3>
                    <p className="text-xs text-slate-500 font-sans">Manage corporate branches, regional showrooms, and service locations</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
    type="text"
    placeholder="Search branches..."
    value={branchSearch}
    onChange={(e) => setBranchSearch(e.target.value)}
    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-56"
  />
                    </div>
                    {(isSoftwareOwner || currentUser?.role === "Super Admin" || currentUser?.role === "Admin") && hasModulePermission(currentUser, "masters", "create") && (
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center gap-1.5 bg-brand-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-brand-700 cursor-pointer outline-none shadow-md shadow-brand-100"
                      >
                        <Plus size={16} />
                        Add Branch
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  {branchesLoading ? <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-2" />
                      <p className="text-xs font-semibold">Loading branches...</p>
                    </div> : dbBranches.length > 0 ? <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/75 border-b border-slate-200">
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Code</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Branch Name & Manager</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Contact Details</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Location & State</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Status</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-right font-sans">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dbBranches.filter((b) => {
                          const s = branchSearch.toLowerCase();
                          return (b.code || b.id).toLowerCase().includes(s) || 
                            b.name.toLowerCase().includes(s) || 
                            (b.managerName || "").toLowerCase().includes(s) || 
                            (b.city || "").toLowerCase().includes(s) || 
                            (b.state || "").toLowerCase().includes(s) || 
                            (b.mobile || "").toLowerCase().includes(s) || 
                            (b.email || "").toLowerCase().includes(s) || 
                            (b.address || "").toLowerCase().includes(s);
                        }).map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/25 group transition-colors">
                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">
                              <div className="flex items-center gap-2">
                                {b.logo ? (
                                  <img src={b.logo} alt="Logo" className="w-6 h-6 rounded object-cover border border-slate-200" />
                                ) : (
                                  <div className="w-6 h-6 rounded bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-[10px]">
                                    {b.name?.[0] || "B"}
                                  </div>
                                )}
                                <span>{b.code || b.id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-900 leading-snug">{b.name}</p>
                              {b.managerName && (
                                <p className="text-xs text-brand-700 font-medium mt-0.5">Mgr: {b.managerName}</p>
                              )}
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-normal truncate max-w-[200px]">{b.address}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className="text-xs text-slate-800 font-semibold">{b.mobile}</p>
                              {b.phone && <p className="text-[11px] text-slate-500">Ph: {b.phone}</p>}
                              <p className="text-xs text-slate-500 mt-0.5">{b.email}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{b.city || "N/A"}</span>
                                {b.state && <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">{b.state}</span>}
                              </div>
                              {b.pincode && <p className="text-[11px] text-slate-400 mt-1">PIN: {b.pincode}</p>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full",
                                b.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                              )}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => { setViewingBranch(b); setShowBranchViewModal(true); }}
                                  className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600 rounded-lg transition-all cursor-pointer outline-none"
                                  title="View Details"
                                >
                                  <Eye size={15} />
                                </button>
                                {isSoftwareOwner && hasModulePermission(currentUser, "masters", "edit") && (
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(b)}
                                    className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-650 rounded-lg transition-all cursor-pointer outline-none"
                                    title="Edit Branch"
                                  >
                                    <Edit2 size={15} />
                                  </button>
                                )}
                                {isSoftwareOwner && hasModulePermission(currentUser, "masters", "delete") && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(b.id, b.name)}
                                    className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all cursor-pointer outline-none"
                                    title="Delete Branch"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table> : <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Layers size={36} className="text-slate-300 stroke-[1.5] mb-2" />
                      <p className="text-xs font-semibold">No branches matching search</p>
                    </div>}
                </div>
              </div>}
          </div>
        </div>
      </div>

      {
    /* VIEW DETAILS DIALOG (SUPPLIER) */
  }
      {/* VIEW DETAILS DIALOG (SUPPLIER) */}
      <AnimatePresence>
        {showViewModal && viewingSupplier && (() => {
          const suppStats = calculateSupplierTotalStats(viewingSupplier, purchases, payments, vouchers);
          const suppPurchases = suppStats.supplierPurchases;
          const totalPurchaseVal = suppStats.totalPurchaseAmount;
          const totalAdvanceVal = suppStats.totalAdvancePaid;
          const totalPaymentEntriesVal = suppStats.totalPaymentReceived;
          const currentOutstanding = suppStats.totalOutstanding;

          const suppPayments = payments.filter((pm) => {
            if (!pm || pm.isDeleted) return false;
            
            // Must be an outbound supplier payout, NEVER a customer sales receipt or customer payment
            const isSupplierPayout =
              pm.partyType === "Supplier" ||
              pm.paymentType === "Supplier Payment" ||
              pm.paymentType === "Purchase Payment" ||
              pm.paymentType === "Supplier Advance";

            if (!isSupplierPayout) return false;

            const sId = viewingSupplier.id || viewingSupplier.supplier_id;
            const sName = (viewingSupplier.supplier_name || viewingSupplier.name || "").trim().toLowerCase();

            const matchParty =
              (sId && (pm.partyId === sId || pm.supplierId === sId)) ||
              (sName && pm.partyName && pm.partyName.trim().toLowerCase() === sName);

            const matchPurchase = suppPurchases.some(
              (p) =>
                (p.purchase_id && (pm.purchaseId === p.purchase_id || pm.vehicleId === p.purchase_id)) ||
                (p.id && (pm.purchaseId === p.id || pm.vehicleId === p.id))
            );

            return Boolean(matchParty || matchPurchase);
          });

          return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowViewModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <div className="flex items-center gap-2.5 text-slate-900">
                    <Users className="text-brand-600" size={20} />
                    <div>
                      <h3 className="font-bold text-base">Supplier Full Profile - {viewingSupplier.supplier_name}</h3>
                      <p className="text-xs text-slate-500 font-mono">ID: {viewingSupplier.supplier_id || viewingSupplier.id}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                  {/* Info Header */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Contact Mobile</span>
                      <p className="font-bold text-slate-900 text-sm flex items-center gap-1"><Phone size={12} /> {viewingSupplier.supplier_mobile || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">City / Location</span>
                      <p className="font-bold text-slate-800">{citiesList.find((c) => c.id === viewingSupplier.city_id)?.name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicles Supplied</span>
                      <p className="font-bold text-slate-800">{suppPurchases.length} Vehicles</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Office Address</span>
                      <p className="font-medium text-slate-700 truncate">{viewingSupplier.address || "N/A"}</p>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Total Purchase Value</span>
                      <p className="text-sm font-extrabold text-slate-900 font-mono">₹{totalPurchaseVal.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60">
                      <span className="text-[10px] font-bold text-amber-700 uppercase">Total Advance Paid</span>
                      <p className="text-sm font-extrabold text-amber-800 font-mono">₹{totalAdvanceVal.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200/60">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Payment Entries</span>
                      <p className="text-sm font-extrabold text-emerald-800 font-mono">₹{totalPaymentEntriesVal.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-200/60">
                      <span className="text-[10px] font-bold text-rose-700 uppercase">Remaining Outstanding</span>
                      <p className="text-sm font-black text-rose-800 font-mono">₹{currentOutstanding.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {/* Purchased Vehicles Table */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Supplied Vehicles & Purchase History</h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <tr>
                            <th className="py-2.5 px-3">Vehicle Details</th>
                            <th className="py-2.5 px-3">Reg No</th>
                            <th className="py-2.5 px-3 text-right">Purchase Price</th>
                            <th className="py-2.5 px-3 text-right">Advance Paid</th>
                            <th className="py-2.5 px-3 text-right">Payment Entries</th>
                            <th className="py-2.5 px-3 text-right">Outstanding</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {suppPurchases.length > 0 ? (
                            suppPurchases.map((p) => {
                              const tCost = p.stats ? p.stats.purchasePrice : (Number(p.purchasePrice || p.purchase_price) || 0);
                              const adv = p.stats ? p.stats.advancePaid : (Number(p.advance_price !== undefined && p.advance_price !== null && p.advance_price !== "" ? p.advance_price : (p.advancePaid !== undefined && p.advancePaid !== null && p.advancePaid !== "" ? p.advancePaid : 0)));
                              const pmPaid = p.stats ? p.stats.paymentReceived : 0;
                              const bal = p.stats ? p.stats.outstanding : Math.max(0, tCost - adv - pmPaid);
                              return (
                                <tr key={p.id || p.purchase_id} className="hover:bg-slate-50">
                                  <td className="py-2.5 px-3 font-bold text-slate-900">{p.brand} {p.name}</td>
                                  <td className="py-2.5 px-3 font-mono text-slate-600">{p.reg_no || p.regNo || "N/A"}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-semibold">₹{tCost.toLocaleString("en-IN")}</td>
                                  <td className="py-2.5 px-3 font-mono text-right text-amber-700">₹{adv.toLocaleString("en-IN")}</td>
                                  <td className="py-2.5 px-3 font-mono text-right text-emerald-700">₹{pmPaid.toLocaleString("en-IN")}</td>
                                  <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-600">₹{bal.toLocaleString("en-IN")}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-4 text-center text-slate-400">No purchase records found for this supplier.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Supplier Payment History */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Entries History</h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <tr>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Ref No</th>
                            <th className="py-2.5 px-3">Vehicle</th>
                            <th className="py-2.5 px-3 text-right">Exact Paid</th>
                            <th className="py-2.5 px-3">Mode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {suppPayments.length > 0 ? (
                            suppPayments.map((pm) => (
                              <tr key={pm.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 font-mono text-slate-600">{pm.paymentDate}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">{pm.referenceNo}</td>
                                <td className="py-2.5 px-3 text-slate-700">{pm.regNo || pm.vehicleName || "—"}</td>
                                <td className="py-2.5 px-3 font-mono text-right font-black text-emerald-600">₹{(Number(pm.amountPaid) || 0).toLocaleString("en-IN")}</td>
                                <td className="py-2.5 px-3 font-medium text-slate-600">{pm.paymentMode}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="py-4 text-center text-slate-400">No payment entries recorded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button type="button" onClick={() => setShowViewModal(false)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer">
                    Close Details
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* VIEW DETAILS DIALOG (BRANCH) */}
      <AnimatePresence>
        {showBranchViewModal && viewingBranch && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBranchViewModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5 text-slate-900">
                  <Building2 className="text-brand-600" size={20} />
                  <div>
                    <h3 className="font-bold text-base">{viewingBranch.name}</h3>
                    <p className="text-[11px] font-mono font-semibold text-slate-500">Code: {viewingBranch.code || viewingBranch.id}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowBranchViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    {viewingBranch.logo ? (
                      <img src={viewingBranch.logo} alt="Branch Logo" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg">
                        {viewingBranch.name?.[0] || "B"}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Manager Name</p>
                      <p className="text-sm font-extrabold text-slate-800">{viewingBranch.managerName || "Not Assigned"}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-1 rounded-full",
                    viewingBranch.status === "Active" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-rose-50 text-rose-600 border border-rose-200"
                  )}>
                    {viewingBranch.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Mobile Number</p>
                    <p className="font-bold text-slate-800">{viewingBranch.mobile || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Phone (Landline)</p>
                    <p className="font-bold text-slate-800">{viewingBranch.phone || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="font-bold text-slate-400 text-[10px] uppercase">Email Address</p>
                    <p className="font-bold text-slate-800 truncate">{viewingBranch.email || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <p className="font-bold text-slate-400 text-[10px] uppercase">GST Number</p>
                    <p className="font-mono font-bold text-slate-800">{viewingBranch.gstNo || "N/A"}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-slate-400 text-[10px] uppercase">Address & Location</p>
                  <p className="font-semibold text-slate-800">{viewingBranch.address || "N/A"}</p>
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                    <span className="font-bold text-slate-700">City: {viewingBranch.city || "N/A"}</span>
                    <span>•</span>
                    <span className="font-bold text-brand-600">State: {viewingBranch.state || "N/A"}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-slate-600">PIN: {viewingBranch.pincode || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button type="button" onClick={() => setShowBranchViewModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer outline-none">Close Details</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {
    /* ADD/EDIT MODAL (SUPPLIERS AND OTHERS) */
  }
      <AnimatePresence>
        {showModal && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={() => setShowModal(false)}
    className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
  />
            <motion.div
    initial={{ opacity: 0, scale: 0.95, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95, y: 20 }}
    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
  >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingItem ? "Edit" : "Add New"} {activeSubTab === "suppliers" ? "Supplier Partner" : activeSubTab === "branches" ? "Branch Office" : activeSubTab.slice(0, -1)}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Please enter physical verified billing metadata</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer outline-none">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {generalError && <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-750 font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle size={15} />
                    <span>{generalError}</span>
                  </div>}

                {
    /* Specific form details for Branches or Suppliers */
  }
                {activeSubTab === "branches" ? <>
                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Branch Code <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={brCode}
                          onChange={(e) => setBrCode(e.target.value.toUpperCase())}
                          placeholder="e.g. BR001 / CBE01"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-mono font-bold text-slate-800"
                        />
                        {formErrors.code && <p className="text-rose-600 text-[11px] font-semibold leading-tight mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.code}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Manager Name</label>
                        <input
                          type="text"
                          value={brManagerName}
                          onChange={(e) => setBrManagerName(e.target.value)}
                          placeholder="e.g. Rajesh Kumar"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">Branch Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        value={brName}
                        onChange={(e) => setBrName(e.target.value)}
                        placeholder="e.g. Coimbatore Main HQ"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold text-slate-800"
                      />
                      {formErrors.name && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.name}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">10-Digit Mobile Phone <span className="text-rose-500">*</span></label>
                        <input
                          type="tel"
                          maxLength={10}
                          value={brMobile}
                          onChange={(e) => setBrMobile(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 9840212345"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-semibold text-slate-800"
                        />
                        {formErrors.mobile && <p className="text-rose-600 text-[11px] font-semibold leading-tight mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.mobile}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Phone (Landline)</label>
                        <input
                          type="text"
                          value={brPhone}
                          onChange={(e) => setBrPhone(e.target.value)}
                          placeholder="e.g. 0422-2490000"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-semibold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                        <input
                          type="email"
                          value={brEmail}
                          onChange={(e) => setBrEmail(e.target.value)}
                          placeholder="e.g. branch@auto360.com"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-semibold text-slate-800"
                        />
                        {formErrors.email && <p className="text-rose-600 text-[11px] font-semibold leading-tight mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.email}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">GST Number</label>
                        <input
                          type="text"
                          maxLength={15}
                          value={brGstNo}
                          onChange={(e) => setBrGstNo(e.target.value.toUpperCase())}
                          placeholder="e.g. 33AAAAA0000A1Z5"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-mono font-bold text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">City</label>
                        <input
                          type="text"
                          value={brCity}
                          onChange={(e) => setBrCity(e.target.value)}
                          placeholder="Coimbatore"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">State</label>
                        <select
                          value={brState}
                          onChange={(e) => setBrState(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs font-semibold text-slate-800"
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map((s) => (
                            <option key={s.code} value={s.label}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Pincode</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={brPincode}
                          onChange={(e) => setBrPincode(e.target.value.replace(/\D/g, ""))}
                          placeholder="641012"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Status</label>
                        <select
                          value={brStatus}
                          onChange={(e) => setBrStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs text-slate-800 font-semibold"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Branch Logo</label>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                            <Upload size={14} />
                            {isUploadingBrLogo ? "Uploading..." : brLogo ? "Change Logo" : "Upload Logo"}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleBranchLogoUpload}
                              className="hidden"
                            />
                          </label>
                          {brLogo && (
                            <img src={brLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover border border-slate-300" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">Office Address <span className="text-rose-500">*</span></label>
                      <textarea
                        rows={2}
                        value={brAddress}
                        onChange={(e) => setBrAddress(e.target.value)}
                        placeholder="Complete street address..."
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
                      />
                      {formErrors.address && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.address}</p>}
                    </div>
                  </> : activeSubTab === "suppliers" ? <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Supplier ID</label>
                      <input
    type="text"
    value={supId}
    disabled
    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 font-mono font-bold text-sm leading-5 rounded-xl cursor-not-allowed outline-none"
  />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Supplier Name <span className="text-rose-500">*</span></label>
                      <input
    type="text"
    value={supName}
    onChange={(e) => setSupName(e.target.value)}
    placeholder="e.g. Venus Motors HQ"
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                      {formErrors.name && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.name}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">10-Digit Mobile Phone <span className="text-rose-500">*</span></label>
                      <input
    type="tel"
    maxLength={10}
    value={supMobile}
    onChange={(e) => setSupMobile(e.target.value.replace(/\D/g, ""))}
    placeholder="e.g. 9840212345"
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                      {formErrors.mobile && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.mobile}</p>}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Select City</label>
                        <select
                          value={supCityId}
                          onChange={(e) => {
                            setSupCityId(e.target.value);
                            setSupAreaId("");
                            setSupSubAreaId("");
                          }}
                          className="w-full px-3 py-1.5 bg-white border rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-550 focus:border-brand-550 font-bold"
                        >
                          <option value="">-- Choose City --</option>
                          {citiesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Dependent Area</label>
                        <select
                          value={supAreaId}
                          onChange={(e) => {
                            setSupAreaId(e.target.value);
                            setSupSubAreaId("");
                          }}
                          disabled={!supCityId}
                          className="w-full px-3 py-1.5 bg-white border rounded-xl text-xs outline-none disabled:bg-slate-100 disabled:text-slate-400 font-bold"
                        >
                          <option value="">-- Choose Area --</option>
                          {areasList.filter((a) => !supCityId || a.cityId === supCityId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Dependent Sub Area</label>
                        <select
                          value={supSubAreaId}
                          onChange={(e) => setSupSubAreaId(e.target.value)}
                          disabled={!supAreaId}
                          className="w-full px-3 py-1.5 bg-white border rounded-xl text-xs outline-none disabled:bg-slate-100 disabled:text-slate-400 font-bold"
                        >
                          <option value="">-- Choose Sub Area --</option>
                          {subAreasList.filter((sa) => !supAreaId || sa.areaId === supAreaId).map((sa) => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Office Address</label>
                      <textarea
    rows={2}
    value={supAddress}
    onChange={(e) => setSupAddress(e.target.value)}
    placeholder="street name, town office details..."
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
  />
                    </div>
                  </> : (
    /* Form fields for default other Masters lists */
    <>
                    {activeSubTab === "names" && <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Brand</label>
                          <select
      value={formData.brandId}
      onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    >
                            <option value="">Select Brand</option>
                            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Vehicle Type</label>
                          <select
      value={formData.vehicleType || "Two Wheeler"}
      onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    >
                            <option value="Two Wheeler">Two Wheeler</option>
                            <option value="Three Wheeler">Three Wheeler</option>
                            <option value="Four Wheeler">Four Wheeler</option>
                            <option value="Commercial">Commercial</option>
                          </select>
                        </div>
                      </>}
                    {activeSubTab === "areas" && <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">City</label>
                        <select
      value={formData.cityId}
      onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    >
                          <option value="">Select City</option>
                          {propCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>}
                    {activeSubTab === "subareas" && <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">Area</label>
                        <select
      value={formData.areaId}
      onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    >
                          <option value="">Select Area</option>
                          {propAreas.map((a) => <option key={a.id} value={a.id}>{a.name} ({propCities.find((c) => c.id === a.cityId)?.name})</option>)}
                        </select>
                      </div>}
                    {activeSubTab === "customers" && <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Mobile Number</label>
                          <input
      type="text"
      value={formData.mobile}
      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
      placeholder="Enter mobile number"
    />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">Address</label>
                          <textarea
      value={formData.address}
      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
      placeholder="Enter address"
    />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">City</label>
                            <select
      value={formData.cityId}
      onChange={(e) => setFormData({ ...formData, cityId: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    >
                              <option value="">Select City</option>
                              {propCities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-700">Area</label>
                            <select
      value={formData.areaId}
      onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
    >
                              <option value="">Select Area</option>
                              {propAreas.filter((a) => !formData.cityId || a.cityId === formData.cityId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </>}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Name</label>
                      <input
      type="text"
      value={formData.name}
      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm"
      placeholder="Enter name"
    />
                    </div>
                  </>
  )}
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2 text-xs font-bold text-slate-650 hover:bg-slate-200 rounded-xl transition-all cursor-pointer outline-none">
                  Cancel
                </button>
                <button
    onClick={handleSave}
    className="px-5 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 cursor-pointer outline-none"
  >
                  {editingItem ? "Save Updates" : "Add Item"}
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
function SubTabButton({ id, label, active, onClick, icon: Icon }) {
  return <button
    onClick={() => onClick(id)}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left outline-none cursor-pointer",
      active ? "bg-slate-100 text-brand-650 shadow-sm border border-slate-150" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
    )}
  >
      <Icon size={14} className={active ? "text-brand-600" : "text-slate-400"} />
      {label}
    </button>;
}
function MasterList({ title, items, onAdd, onEdit, onDelete, renderItem, canCreate = true }) {
  const [search, setSearch] = useState("");
  const filtered = items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="flex flex-col h-full min-h-[500px]">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-400">View and edit relational values</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
    type="text"
    placeholder="Search..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="pl-8 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-56"
  />
          </div>
          {canCreate && (
            <button
              onClick={onAdd}
              className="flex items-center gap-1.5 bg-brand-600 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-brand-700 transition-all cursor-pointer outline-none shadow-md shadow-brand-100"
            >
              <Plus size={14} />
              Add New
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filtered.length > 0 ? filtered.map((item) => <div key={item.id || item.supplier_id}>
              {renderItem(item)}
            </div>) : <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Layers size={48} className="mb-4 opacity-20" />
            <p className="font-medium text-xs">No records matching search found</p>
          </div>}
      </div>
    </div>;
}
