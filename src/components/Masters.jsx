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
  ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { hasModulePermission } from "../lib/permissions";
export default function Masters({
  brands,
  vehicleNames,
  cities: propCities,
  areas: propAreas,
  subAreas: propSubAreas,
  suppliers: propSuppliers,
  customers,
  onUpdateBrands,
  onUpdateVehicleNames,
  onUpdateCities,
  onUpdateAreas,
  onUpdateSubAreas,
  onUpdateSuppliers,
  onUpdateCustomers,
  initialTab,
  initialSubTab,
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
  const [brName, setBrName] = useState("");
  const [brMobile, setBrMobile] = useState("");
  const [brEmail, setBrEmail] = useState("");
  const [brAddress, setBrAddress] = useState("");
  const [brCity, setBrCity] = useState("");
  const [brArea, setBrArea] = useState("");
  const [brSubArea, setBrSubArea] = useState("");
  const [brStatus, setBrStatus] = useState("Active");
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
    fetchCitiesList();
  }, []);
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
    } catch (e) {
      setBrId("BR001");
    }
  };
  useEffect(() => {
    if (supCityId) {
      fetchAreasForSupplier(supCityId);
    } else {
      setAreasList([]);
      setSupAreaId("");
      setSupSubAreaId("");
    }
  }, [supCityId]);
  useEffect(() => {
    if (supAreaId) {
      fetchSubAreasForSupplier(supAreaId);
    } else {
      setSubAreasList([]);
      setSupSubAreaId("");
    }
  }, [supAreaId]);
  const safeFetchJson = async (url, options) => {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const contentType = res.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error(`Expected JSON response, but received: ${contentType || "none"}`);
    }
    return res.json();
  };
  const fetchCitiesList = async () => {
    try {
      const data = await safeFetchJson("/api/cities");
      setCitiesList(data);
    } catch (e) {
      console.warn("Error fetching cities graceful-catch:", e);
    }
  };
  const fetchAreasForSupplier = async (cityId) => {
    try {
      const data = await safeFetchJson(`/api/areas?cityId=${cityId}`);
      setAreasList(data);
    } catch (e) {
      console.warn("Error fetching areas graceful-catch:", e);
    }
  };
  const fetchSubAreasForSupplier = async (areaId) => {
    try {
      const data = await safeFetchJson(`/api/subareas?areaId=${areaId}`);
      setSubAreasList(data);
    } catch (e) {
      console.warn("Error fetching sub-areas graceful-catch:", e);
    }
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
      setBrMobile("");
      setBrEmail("");
      setBrAddress("");
      setBrCity("");
      setBrArea("");
      setBrSubArea("");
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
      if (item.city_id) {
        await fetchAreasForSupplier(item.city_id);
      }
      setSupAreaId(item.area_id || "");
      if (item.area_id) {
        await fetchSubAreasForSupplier(item.area_id);
      }
      setSupSubAreaId(item.sub_area_id || "");
      setSupAddress(item.address || "");
      setShowModal(true);
    } else if (activeSubTab === "branches") {
      setEditingItem(item);
      setFormErrors({});
      setGeneralError(null);
      setBrId(item.id);
      setBrName(item.name || "");
      setBrMobile(item.mobile || "");
      setBrEmail(item.email || "");
      setBrAddress(item.address || "");
      setBrCity(item.city || "");
      setBrArea(item.area || "");
      setBrSubArea(item.subArea || "");
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
        } else {
          if (activeSubTab === "brands") onUpdateBrands(brands.filter((b) => b.id !== id));
          if (activeSubTab === "names") onUpdateVehicleNames(vehicleNames.filter((vn) => vn.id !== id));
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
      if (!brMobile.trim()) errors.mobile = "Mobile Number is required";
      else if (!/^\d{10}$/.test(brMobile)) errors.mobile = "Mobile number must be exactly 10 digits";
      if (!brEmail.trim()) errors.email = "Email Address is required";
      if (!brAddress.trim()) errors.address = "Branch Address is required";
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      const payload = {
        name: brName,
        mobile: brMobile,
        email: brEmail,
        address: brAddress,
        city: brCity,
        area: brArea,
        subArea: brSubArea,
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
        if (editingItem) onUpdateBrands(brands.map((b) => b.id === editingItem.id ? newItem : b));
        else onUpdateBrands([...brands, newItem]);
      } else if (activeSubTab === "names") {
        if (editingItem) onUpdateVehicleNames(vehicleNames.map((vn) => vn.id === editingItem.id ? newItem : vn));
        else onUpdateVehicleNames([...vehicleNames, newItem]);
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
    return <tr key={s.supplier_id} className="hover:bg-slate-50/25 group transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{s.supplier_id}</td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900 leading-snug">{s.supplier_name}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Phone size={12} />
                                  <span>{s.supplier_mobile}</span>
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-xs text-slate-700 font-semibold">{city || "No city linked"}</p>
                                {s.address && <p className="text-[11px] text-slate-400 font-medium truncate max-w-[200px]">{s.address}</p>}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleOpenViewDetails(s)} className="p-2 text-slate-400 hover:text-brand-600 rounded-lg cursor-pointer outline-none" title="View details"><Eye size={15} /></button>
                                  {hasModulePermission(currentUser, "masters", "edit") && (
                                    <button onClick={() => handleEdit(s)} className="p-2 text-slate-400 hover:text-brand-600 rounded-lg cursor-pointer outline-none" title="Edit"><Edit2 size={15} /></button>
                                  )}
                                  {hasModulePermission(currentUser, "masters", "delete") && (
                                    <button onClick={() => handleDelete(s.supplier_id, s.supplier_name)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer outline-none" title="Delete"><Trash2 size={15} /></button>
                                  )}
                                </div>
                              </td>
                            </tr>;
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
                    {isSoftwareOwner && hasModulePermission(currentUser, "masters", "create") && (
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
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">ID</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Branch Name</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Contact Details</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Location Details</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase font-sans">Status</th>
                          <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase text-right font-sans">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dbBranches.filter((b) => {
    const s = branchSearch.toLowerCase();
    return b.id.toLowerCase().includes(s) || b.name.toLowerCase().includes(s) || (b.city || "").toLowerCase().includes(s) || (b.mobile || "").toLowerCase().includes(s) || (b.email || "").toLowerCase().includes(s) || (b.address || "").toLowerCase().includes(s);
  }).map((b) => <tr key={b.id} className="hover:bg-slate-50/25 group transition-colors">
                              <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{b.id}</td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-bold text-slate-900 leading-snug">{b.name}</p>
                                <p className="text-xs text-slate-450 mt-0.5 leading-normal">{b.address}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-xs text-slate-800 font-semibold">{b.mobile}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{b.email}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{b.city}</span>
                                {b.area && <span className="text-xs font-medium text-slate-500 ml-1.5">{b.area}</span>}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={cn(
    "text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full",
    b.status === "Active" ? "bg-emerald-550/10 text-emerald-600" : "bg-red-550/10 text-red-600"
  )}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isSoftwareOwner && hasModulePermission(currentUser, "masters", "edit") && (
                                    <button
                                      type="button"
                                      onClick={() => handleEdit(b)}
                                      className="p-1.5 text-slate-450 hover:bg-slate-100 hover:text-brand-650 rounded-lg transition-all cursor-pointer outline-none"
                                      title="Edit Branch"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                  )}
                                  {isSoftwareOwner && hasModulePermission(currentUser, "masters", "delete") && (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(b.id)}
                                      className="p-1.5 text-slate-450 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all cursor-pointer outline-none"
                                      title="Delete Branch"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>)}
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
      <AnimatePresence>
        {showViewModal && viewingSupplier && <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
    className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
  >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 text-slate-900">
                  <Users className="text-brand-600" size={18} />
                  <h3 className="font-bold text-base">Supplier Details - {viewingSupplier.supplier_id}</h3>
                </div>
                <button type="button" onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl space-y-3 text-sm">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supplier Name</label>
                    <p className="font-bold text-slate-900 text-lg">{viewingSupplier.supplier_name}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mobile Number</label>
                    <p className="font-bold text-slate-800 text-base flex items-center gap-1.5"><Phone size={13} className="text-slate-400" />{viewingSupplier.supplier_mobile}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">City</label>
                      <p className="font-bold text-slate-700 text-xs">{citiesList.find((c) => c.id === viewingSupplier.city_id)?.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Area</label>
                      <p className="font-bold text-slate-700 text-xs">{areasList.find((a) => a.id === viewingSupplier.area_id)?.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block">Sub Area</label>
                      <p className="font-bold text-slate-700 text-xs">{subAreasList.find((sa) => sa.id === viewingSupplier.sub_area_id)?.name || "N/A"}</p>
                    </div>
                  </div>
                  {viewingSupplier.address && <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Office Address</label>
                      <p className="text-slate-700 font-semibold text-xs whitespace-pre-wrap">{viewingSupplier.address}</p>
                    </div>}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button type="button" onClick={() => setShowViewModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer outline-none">Close Details</button>
              </div>
            </motion.div>
          </div>}
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
                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">Branch ID</label>
                      <input
    type="text"
    value={brId}
    disabled
    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 font-mono font-bold text-sm leading-5 rounded-xl cursor-not-allowed outline-none"
  />
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">Branch Name <span className="text-rose-500">*</span></label>
                      <input
    type="text"
    value={brName}
    onChange={(e) => setBrName(e.target.value)}
    placeholder="e.g. Coimbatore Main HQ"
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                      {formErrors.name && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.name}</p>}
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">10-Digit Mobile Phone <span className="text-rose-500">*</span></label>
                      <input
    type="tel"
    maxLength={10}
    value={brMobile}
    onChange={(e) => setBrMobile(e.target.value.replace(/\D/g, ""))}
    placeholder="e.g. 9840212345"
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                      {formErrors.mobile && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.mobile}</p>}
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                      <input
    type="email"
    value={brEmail}
    onChange={(e) => setBrEmail(e.target.value)}
    placeholder="e.g. coimbatore@auto360.com"
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
  />
                      {formErrors.email && <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.email}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-sans">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700">City</label>
                        <input
    type="text"
    value={brCity}
    onChange={(e) => setBrCity(e.target.value)}
    placeholder="Coimbatore"
    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs text-slate-800"
  />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 font-sans">Area</label>
                        <input
    type="text"
    value={brArea}
    onChange={(e) => setBrArea(e.target.value)}
    placeholder="Gandhipuram"
    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs text-slate-800"
  />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-700 font-sans">Sub Area</label>
                        <input
    type="text"
    value={brSubArea}
    onChange={(e) => setBrSubArea(e.target.value)}
    placeholder="Cross Cut Rd"
    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-xs text-slate-800"
  />
                      </div>
                    </div>
                    <div className="space-y-1 font-sans">
                      <label className="text-xs font-bold text-slate-700">Status</label>
                      <select
    value={brStatus}
    onChange={(e) => setBrStatus(e.target.value)}
    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-semibold"
  >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
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
    onChange={(e) => setSupCityId(e.target.value)}
    className="w-full px-3 py-1.5 bg-white border rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand-550 focus:border-brand-550"
  >
                          <option value="">-- Choose City --</option>
                          {citiesList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Dependent Area</label>
                        <select
    value={supAreaId}
    onChange={(e) => setSupAreaId(e.target.value)}
    disabled={!supCityId}
    className="w-full px-3 py-1.5 bg-white border rounded-xl text-xs outline-none disabled:bg-slate-100 disabled:text-slate-400"
  >
                          <option value="">-- Choose Area --</option>
                          {areasList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Dependent Sub Area</label>
                        <select
    value={supSubAreaId}
    onChange={(e) => setSupSubAreaId(e.target.value)}
    disabled={!supAreaId}
    className="w-full px-3 py-1.5 bg-white border rounded-xl text-xs outline-none disabled:bg-slate-100 disabled:text-slate-400"
  >
                          <option value="">-- Choose Sub Area --</option>
                          {subAreasList.map((sa) => <option key={sa.id} value={sa.id}>{sa.name}</option>)}
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
