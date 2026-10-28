import { useState, useEffect, useRef } from "react";
import { X, Upload, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function CustomerFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingCustomer = null,
  currentUser = null,
  defaultType = "Buy"
}) {
  const [formType, setFormType] = useState(defaultType);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formMobile, setFormMobile] = useState("");
  const [formSource, setFormSource] = useState("Walk In");
  const [formAadhaar, setFormAadhaar] = useState("");
  const [formPan, setFormPan] = useState("");
  const [formCityId, setFormCityId] = useState("");
  const [formAreaId, setFormAreaId] = useState("");
  const [formSubAreaId, setFormSubAreaId] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formStatus, setFormStatus] = useState("New Lead");
  const [formPreferredVehicle, setFormPreferredVehicle] = useState("");
  const [formRemarks, setFormRemarks] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [aadhaarPhotoUrl, setAadhaarPhotoUrl] = useState("");
  const [panPhotoUrl, setPanPhotoUrl] = useState("");
  const [uploadError, setUploadError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [cities, setCities] = useState([]);
  const [areas, setAreas] = useState([]);
  const [subAreas, setSubAreas] = useState([]);

  const photoInputRef = useRef(null);
  const aadhaarInputRef = useRef(null);
  const panInputRef = useRef(null);

  const safeFetchJson = async (url, options) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return [];
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn("safeFetchJson error:", e);
      return [];
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCities();
      if (editingCustomer) {
        setFormId(editingCustomer.customer_id || editingCustomer.id || "");
        setFormType(editingCustomer.customer_type || editingCustomer.type || defaultType);
        setFormName(editingCustomer.customer_name || editingCustomer.name || "");
        setFormMobile(editingCustomer.customer_mobile || editingCustomer.mobile || "");
        setFormSource(editingCustomer.source || "Walk In");
        setFormAadhaar(editingCustomer.aadhaar_number || "");
        setFormPan(editingCustomer.pan_number || "");
        setFormCityId(editingCustomer.city_id || "");
        setFormAreaId(editingCustomer.area_id || "");
        setFormSubAreaId(editingCustomer.sub_area_id || "");
        setFormAddress(editingCustomer.address || "");
        setFormStatus(editingCustomer.customer_status || editingCustomer.status || "New Lead");
        setFormPreferredVehicle(editingCustomer.preferred_vehicle || "");
        setFormRemarks(editingCustomer.remarks_notes || editingCustomer.remarks || "");
        setPhotoUrl(editingCustomer.customer_photo || "");
        setAadhaarPhotoUrl(editingCustomer.aadhaar_photo || "");
        setPanPhotoUrl(editingCustomer.pan_photo || "");
        if (editingCustomer.city_id) fetchAreasForCity(editingCustomer.city_id);
        if (editingCustomer.area_id) fetchSubAreasForArea(editingCustomer.area_id);
      } else {
        setFormType(defaultType);
        setFormName("");
        setFormMobile("");
        setFormSource("Walk In");
        setFormAadhaar("");
        setFormPan("");
        setFormCityId("");
        setFormAreaId("");
        setFormSubAreaId("");
        setFormAddress("");
        setFormStatus("New Lead");
        setFormPreferredVehicle("");
        setFormRemarks("");
        setPhotoUrl("");
        setAadhaarPhotoUrl("");
        setPanPhotoUrl("");
        fetchNextId();
      }
      setFormErrors({});
      setUploadError(null);
    }
  }, [isOpen, editingCustomer, defaultType]);

  useEffect(() => {
    if (formCityId) {
      fetchAreasForCity(formCityId);
    } else {
      setAreas([]);
      setFormAreaId("");
      setFormSubAreaId("");
    }
  }, [formCityId]);

  useEffect(() => {
    if (formAreaId) {
      fetchSubAreasForArea(formAreaId);
    } else {
      setSubAreas([]);
      setFormSubAreaId("");
    }
  }, [formAreaId]);

  const fetchNextId = async () => {
    try {
      const data = await safeFetchJson("/api/customers/nextId");
      setFormId(data?.nextId || "CUS001");
    } catch (e) {
      setFormId("CUS001");
    }
  };

  const fetchCities = async () => {
    try {
      const data = await safeFetchJson("/api/cities");
      setCities(data);
    } catch (e) {
      console.warn("Error fetching cities:", e);
    }
  };

  const fetchAreasForCity = async (cityId) => {
    try {
      const data = await safeFetchJson(`/api/areas?cityId=${cityId}`);
      setAreas(data);
    } catch (e) {
      console.warn("Error fetching areas:", e);
    }
  };

  const fetchSubAreasForArea = async (areaId) => {
    try {
      const data = await safeFetchJson(`/api/subareas?areaId=${areaId}`);
      setSubAreas(data);
    } catch (e) {
      console.warn("Error fetching subareas:", e);
    }
  };

  const handleFileUpload = async (type, file) => {
    setUploadError(null);
    if (!file) return;
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".png" && ext !== ".jpg" && ext !== ".jpeg") {
      setUploadError("Only PNG, JPG, and JPEG images are allowed");
      return;
    }
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("File size exceeds the 5MB limit");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (type === "photo") setPhotoUrl(data.filePath);
        if (type === "aadhaar") setAadhaarPhotoUrl(data.filePath);
        if (type === "pan") setPanPhotoUrl(data.filePath);
      } else {
        const text = await res.text();
        let errMsg = "Failed to upload photo";
        try {
          const parsed = JSON.parse(text);
          errMsg = parsed.error || errMsg;
        } catch (_) {}
        setUploadError(errMsg);
      }
    } catch (e) {
      setUploadError("Network error uploading file");
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formName.trim()) {
      errors.name = "Full Name is required";
    }
    if (!formMobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^\d{10}$/.test(formMobile)) {
      errors.mobile = "Mobile number must be exactly 10 digits";
    }
    if (formAadhaar.trim() && !/^\d{12}$/.test(formAadhaar)) {
      errors.aadhaar = "Aadhaar Number must be exactly 12 digits";
    }
    if (formPan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formPan.toUpperCase())) {
      errors.pan = "PAN format is invalid (e.g. ABCDE1234F)";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCustomer = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    const payload = {
      customer_type: formType,
      customer_name: formName,
      customer_mobile: formMobile,
      source: formSource,
      aadhaar_number: formAadhaar,
      pan_number: formPan,
      city_id: formCityId,
      area_id: formAreaId,
      sub_area_id: formSubAreaId,
      address: formAddress,
      customer_photo: photoUrl,
      aadhaar_photo: aadhaarPhotoUrl,
      pan_photo: panPhotoUrl,
      customer_status: formStatus,
      preferred_vehicle: formPreferredVehicle,
      remarks_notes: formRemarks,
      branch: currentUser?.branch || "Coimbatore"
    };

    try {
      let res;
      if (editingCustomer) {
        res = await fetch(`/api/customers/${editingCustomer.customer_id || editingCustomer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        const savedData = await res.json();
        if (onSuccess) {
          onSuccess(savedData);
        }
        onClose();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "Failed to save customer record");
      }
    } catch (e) {
      console.error("Save customer error:", e);
      alert("Network error saving customer record");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
        >
          <div className="p-6 border-b border-slate-100 bg-slate-50/75 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingCustomer ? "Edit Customer Settings" : "Register New Customer Lead"}
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-0.5">Please ensure values match verified IDs</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-bold rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Customer ID</label>
                <input
                  type="text"
                  value={formId}
                  disabled
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 text-slate-500 font-mono font-bold leading-5 rounded-xl cursor-not-allowed outline-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Customer Focus / Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                >
                  <option value="Buy">Seeking to Buy</option>
                  <option value="Sell">Seeking to Sell</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Anand Kumar"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
                />
                {formErrors.name && (
                  <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">10-Digit Mobile Phone <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  value={formMobile}
                  maxLength={10}
                  onChange={(e) => setFormMobile(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 9845012345"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
                />
                {formErrors.mobile && (
                  <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.mobile}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Lead Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
                >
                  <option value="New Lead">New Lead</option>
                  <option value="Follow Up">Follow Up</option>
                  <option value="Converted">Converted</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Acquisition Source</label>
                <select
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="Walk In">Walk In</option>
                  <option value="Referral">Referral</option>
                  <option value="Online">Online</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Aadhaar Card Number (12 Digits)</label>
                <input
                  type="text"
                  value={formAadhaar}
                  maxLength={12}
                  onChange={(e) => setFormAadhaar(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 560012349012"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-mono"
                />
                {formErrors.aadhaar && (
                  <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.aadhaar}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">PAN ID Number (Format: ABCDE1234F)</label>
                <input
                  type="text"
                  value={formPan}
                  maxLength={10}
                  onChange={(e) => setFormPan(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCDE1234F"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-mono"
                />
                {formErrors.pan && (
                  <p className="text-rose-600 text-xs font-semibold leading-relaxed mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {formErrors.pan}
                  </p>
                )}
              </div>
            </div>

            {/* Dependent Dropdowns */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Dependent Locations Master</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Select City</label>
                  <select
                    value={formCityId}
                    onChange={(e) => setFormCityId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Choose City --</option>
                    {cities.map((ci) => (
                      <option key={ci.id} value={ci.id}>{ci.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Dependent Area</label>
                  <select
                    value={formAreaId}
                    onChange={(e) => setFormAreaId(e.target.value)}
                    disabled={!formCityId}
                    className="w-full px-3 py-2 bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Select Area --</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Dependent Sub Area</label>
                  <select
                    value={formSubAreaId}
                    onChange={(e) => setFormSubAreaId(e.target.value)}
                    disabled={!formAreaId}
                    className="w-full px-3 py-2 bg-white border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">-- Select Sub Area --</option>
                    {subAreas.map((sa) => (
                      <option key={sa.id} value={sa.id}>{sa.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Preferred Vehicle / Models</label>
              <input
                type="text"
                value={formPreferredVehicle}
                onChange={(e) => setFormPreferredVehicle(e.target.value)}
                placeholder="e.g. Maruti Suzuki WagonR, Swift, Commercial Goods carrier"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Residential Address</label>
              <textarea
                rows={2}
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Enter permanent house street, locality etc..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Remarks / Follow-up Notes</label>
              <textarea
                rows={2}
                value={formRemarks}
                onChange={(e) => setFormRemarks(e.target.value)}
                placeholder="Enter any additional requirements, exchange details, notes..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-slate-800 font-sans"
              />
            </div>

            {/* Document & Image Attachments */}
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Verify Documents & Image Attachments (Max 5MB)</label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Customer Photo Upload Widget */}
                <div className="border border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 space-y-3 text-center transition-all">
                  <p className="text-xs font-bold text-slate-700">Customer Photo</p>
                  {photoUrl ? (
                    <div className="relative">
                      <img
                        src={photoUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-full object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl("")}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => photoInputRef.current?.click()}
                      className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer text-slate-500 transition-colors"
                    >
                      <Upload size={18} />
                    </div>
                  )}
                  {!photoUrl && <span className="text-[10px] text-slate-400">Click to upload avatar</span>}
                  <input
                    type="file"
                    ref={photoInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("photo", file);
                    }}
                  />
                </div>

                {/* Aadhaar Photo Upload Widget */}
                <div className="border border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 space-y-3 text-center transition-all">
                  <p className="text-xs font-bold text-slate-700">Aadhaar Card Image</p>
                  {aadhaarPhotoUrl ? (
                    <div className="relative">
                      <img
                        src={aadhaarPhotoUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-20 h-14 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setAadhaarPhotoUrl("")}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => aadhaarInputRef.current?.click()}
                      className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer text-slate-500 transition-colors"
                    >
                      <Upload size={18} />
                    </div>
                  )}
                  {!aadhaarPhotoUrl && <span className="text-[10px] text-slate-400">Click to upload card</span>}
                  <input
                    type="file"
                    ref={aadhaarInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("aadhaar", file);
                    }}
                  />
                </div>

                {/* PAN Photo Upload Widget */}
                <div className="border border-dashed border-slate-300 hover:border-brand-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 space-y-3 text-center transition-all">
                  <p className="text-xs font-bold text-slate-700">PAN Card Image</p>
                  {panPhotoUrl ? (
                    <div className="relative">
                      <img
                        src={panPhotoUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-20 h-14 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setPanPhotoUrl("")}
                        className="absolute -top-1 -right-1 bg-rose-600 text-white p-1 rounded-full shadow-lg cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => panInputRef.current?.click()}
                      className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer text-slate-500 transition-colors"
                    >
                      <Upload size={18} />
                    </div>
                  )}
                  {!panPhotoUrl && <span className="text-[10px] text-slate-400">Click to upload card</span>}
                  <input
                    type="file"
                    ref={panInputRef}
                    className="hidden"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload("pan", file);
                    }}
                  />
                </div>

              </div>
            </div>

          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomer}
              disabled={isSaving}
              className="px-6 py-2.5 text-sm font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-200 cursor-pointer outline-none flex items-center gap-2"
            >
              {isSaving && <Loader2 className="animate-spin" size={16} />}
              {editingCustomer ? "Update Profile" : "Save Customer Lead"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
