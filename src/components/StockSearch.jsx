import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  Car,
  Share2,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Fuel,
  Users,
  CheckCircle2,
  X,
  PlusCircle,
  Eye,
  Handshake,
  Tag,
  Sparkles,
  Smartphone,
  Sparkle
} from "lucide-react";
import SalesPosterModal from "./SalesPosterModal";

export default function StockSearch({
  vehicles = [],
  brands = [],
  vehicleNames = [],
  onNavigate,
  currentUser,
  businessProfile
}) {
  // --- Search Filters & Parameters states ---
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [brandFilter, setBrandFilter] = useState("All");
  const [modelQuery, setModelQuery] = useState("");
  const [pricePreset, setPricePreset] = useState("All"); // 'All', 'under_50k', '50k_100k', 'above_100k', 'custom'
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [fuelTypeFilter, setFuelTypeFilter] = useState("All");
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("All");
  const [rcStatusFilter, setRcStatusFilter] = useState("All");
  const [insuranceStatusFilter, setInsuranceStatusFilter] = useState("All");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- Detail dialog & Poster modal states ---
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [posterVehicle, setPosterVehicle] = useState(null);
  const [showPosterModal, setShowPosterModal] = useState(false);

  // --- Quick filter options ---
  const quickFilters = [
    { label: "Under ₹50,000", action: () => { setPricePreset("under_50k"); setVehicleTypeFilter("All"); setBrandFilter("All"); } },
    { label: "₹50k - ₹1.0 Lakh", action: () => { setPricePreset("50k_100k"); setVehicleTypeFilter("All"); setBrandFilter("All"); } },
    { label: "Above ₹1.0 Lakh", action: () => { setPricePreset("above_100k"); setVehicleTypeFilter("All"); setBrandFilter("All"); } },
    { label: "TVS Vehicles", action: () => { setBrandFilter("TVS"); setVehicleTypeFilter("All"); setPricePreset("All"); } },
    { label: "Honda Vehicles", action: () => { setBrandFilter("Honda"); setVehicleTypeFilter("All"); setPricePreset("All"); } },
    { label: "Two Wheeler Only", action: () => { setVehicleTypeFilter("Two Wheeler"); setBrandFilter("All"); setPricePreset("All"); } },
    { label: "Four Wheeler Only", action: () => { setVehicleTypeFilter("Four Wheeler"); setBrandFilter("All"); setPricePreset("All"); } }
  ];

  // --- Derive unique values for filter selects ---
  const yearsList = useMemo(() => {
    const list = new Set();
    vehicles.forEach(v => {
      if (v.year && !v.isDeleted) list.add(v.year.toString());
    });
    return Array.from(list).sort((a, b) => b - a);
  }, [vehicles]);

  const fuelTypesList = ["Petrol", "Diesel", "Electric", "CNG", "Hybrid"];
  const ownerTypesList = ["1st Owner", "2nd Owner", "3rd Owner", "4th Owner", "Other"];

  // --- Filter Logic ---
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      if (v.isDeleted) return false;

      // 1. Vehicle Type
      if (vehicleTypeFilter !== "All" && v.vehicleType !== vehicleTypeFilter) return false;

      // 2. Brand
      if (brandFilter !== "All") {
        const bName = v.brand || "";
        if (bName.toLowerCase() !== brandFilter.toLowerCase()) return false;
      }

      // 3. Model / ID / Reg No Query search
      if (modelQuery.trim()) {
        const query = modelQuery.toLowerCase().trim();
        const cleanQ = query.replace(/[^a-z0-9]/gi, "");
        const mName = (v.name || v.vehicle_name_id || "").toLowerCase();
        const mModel = (v.model || v.model_details || "").toLowerCase();
        const mReg = (v.regNo || v.reg_no || "").toLowerCase();
        const cleanReg = mReg.replace(/[^a-z0-9]/gi, "");
        const mId = (v.purchase_id || v.id || v.purchaseNo || "").toLowerCase();
        const cleanId = mId.replace(/[^a-z0-9]/gi, "");
        const mBrand = (v.brand || v.brand_id || "").toLowerCase();
        const fullText = `${mBrand} ${mName} ${mModel} ${mReg} ${mId} ${v.variant || ""} ${v.color || ""}`.toLowerCase();

        const words = query.split(/\s+/).filter(Boolean);
        const matches = 
          fullText.includes(query) ||
          (words.length > 1 && words.every((w) => fullText.includes(w))) ||
          mName.includes(query) || 
          mModel.includes(query) || 
          mReg.includes(query) || 
          mId.includes(query) ||
          mBrand.includes(query) ||
          (cleanQ && (cleanId.includes(cleanQ) || cleanReg.includes(cleanQ) || cleanQ.includes(cleanId)));

        if (!matches) return false;
      }

      // 4. Price & Range Checks
      const offerPrice = Number(
        v.expected_selling_price ||
        v.selling_price ||
        v.offerPrice ||
        v.offer_price ||
        v.sales_price ||
        (v.purchasePrice ? v.purchasePrice * 1.15 : (v.purchase_price ? v.purchase_price * 1.15 : 0))
      );
      if (pricePreset === "under_50k") {
        if (offerPrice >= 50000 && offerPrice > 0) return false;
      } else if (pricePreset === "50k_100k") {
        if (offerPrice < 50000 || offerPrice > 100000) return false;
      } else if (pricePreset === "above_100k") {
        if (offerPrice <= 100000) return false;
      } else if (pricePreset === "custom") {
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if (!isNaN(min) && offerPrice < min) return false;
        if (!isNaN(max) && offerPrice > max) return false;
      }

      // 5. Year
      if (yearFilter !== "All" && v.year?.toString() !== yearFilter) return false;

      // 6. Fuel Type
      if (fuelTypeFilter !== "All" && v.fuelType !== fuelTypeFilter) return false;

      // 7. Owner Type
      if (ownerTypeFilter !== "All" && v.ownerDetails !== ownerTypeFilter) return false;

      // 8. RC Status
      if (rcStatusFilter !== "All") {
        if (rcStatusFilter === "Card" && v.rcType !== "Card") return false;
        if (rcStatusFilter === "Paper" && v.rcType === "Card") return false;
      }

      // 9. Insurance Status
      if (insuranceStatusFilter !== "All") {
        const hasIns = v.insurance?.hasInsurance;
        if (insuranceStatusFilter === "Active" && !hasIns) return false;
        if (insuranceStatusFilter === "Expired" && hasIns) return false;
      }

      return true;
    });
  }, [
    vehicles,
    vehicleTypeFilter,
    brandFilter,
    modelQuery,
    pricePreset,
    minPrice,
    maxPrice,
    yearFilter,
    fuelTypeFilter,
    ownerTypeFilter,
    rcStatusFilter,
    insuranceStatusFilter
  ]);

  // --- Reset All Filters ---
  const handleReset = () => {
    setVehicleTypeFilter("All");
    setBrandFilter("All");
    setModelQuery("");
    setPricePreset("All");
    setMinPrice("");
    setMaxPrice("");
    setYearFilter("All");
    setFuelTypeFilter("All");
    setOwnerTypeFilter("All");
    setRcStatusFilter("All");
    setInsuranceStatusFilter("All");
  };

  // --- WhatsApp Sharing Msg Generator ---
  const handleWhatsAppShare = (v) => {
    const compName = businessProfile?.companyName || "AUTO 360 CONSULTANCY";
    const phone = businessProfile?.whatsappNumber || businessProfile?.mobileNumber || "";
    const offerPrice = Math.round(v.purchasePrice ? v.purchasePrice * 1.15 : 45000);
    const msg = `*${compName.toUpperCase()} - VEHICLE FOR SALE*
=========================================
🚙 *Vehicle:* ${v.brand || ""} ${v.name || ""} (${v.year || ""})
🎯 *Type:* ${v.vehicleType || "Two Wheeler"}
💰 *Offer Price:* ₹${offerPrice.toLocaleString("en-IN")}
⛽ *Fuel:* ${v.fuelType || "Petrol"}
👤 *Owner:* ${v.ownerDetails || "1st Owner"}
🔢 *Reg No:* ${v.regNo || "In Process"}
📄 *RC:* ${v.rcType === "Card" ? "Active Smart Card" : "Paper/Pending Transfer"}
🛡️ *Insurance:* ${v.insurance?.hasInsurance ? "Active & Current" : "Pending update"}
${phone ? `📞 *Contact Us:* ${phone}` : ""}
${businessProfile?.website ? `🌐 *Website:* ${businessProfile.website}` : ""}

_Interested? Book an appointment or call us for a live demo/test-drive!_`;

    const encodedMsg = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 text-left pb-12 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-950 flex items-center gap-2">
            <Car size={24} className="text-brand-600 animate-pulse" /> Advanced Stock Finder & Requirements Desk
          </h2>
          <p className="text-sm text-slate-500">
            Intelligent multi-criteria client matching engine for used vehicles, scooters & light cars.
          </p>
        </div>
        <button
          onClick={handleReset}
          className="self-start sm:self-center px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all"
        >
          Clear All Parameters
        </button>
      </div>

      {/* Quick Filters Cluster */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-wrap items-center gap-2.5">
        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles size={11} className="text-brand-500" /> Hot Shortcuts:
        </span>
        {quickFilters.map((q, idx) => (
          <button
            key={idx}
            onClick={q.action}
            className="px-3 py-1.5 bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 text-slate-700 hover:text-brand-700 text-xs font-bold rounded-lg transition-all shadow-xs cursor-pointer"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Main Filter Control Board */}
      <div className="bg-white border border-slate-200 shadow-xs rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
            Search Parameters Matrix
          </h3>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs font-extrabold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
          >
            <SlidersHorizontal size={12} />
            {showAdvanced ? "Collapse Extended Filters" : "Expand Extended Filters"}
          </button>
        </div>

        {/* Primary Row Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Sub-search or model search */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Model/Reg search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={modelQuery}
                onChange={(e) => setModelQuery(e.target.value)}
                placeholder="Enter model, specs or reg..."
                className="w-full pl-9 pr-3 h-10 bg-slate-50 border border-slate-200 focus:border-brand-500 focus:bg-white rounded-lg text-xs font-bold outline-none ring-offset-0 transition-all text-slate-800"
              />
            </div>
          </div>

          {/* Vehicle type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vehicle Type</label>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Wheelers</option>
              <option value="Two Wheeler">Two Wheeler Only</option>
              <option value="Three Wheeler">Three Wheeler</option>
              <option value="Four Wheeler">Four Wheeler Only</option>
              <option value="Commercial">Commercial Units</option>
            </select>
          </div>

          {/* Brand */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brand / Make</label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Price presets */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Price Category</label>
            <select
              value={pricePreset}
              onChange={(e) => setPricePreset(e.target.value)}
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="All">Any Price Ledger</option>
              <option value="under_50k">Under ₹50,000</option>
              <option value="50k_100k">₹50,000 - ₹1,00,000</option>
              <option value="above_100k">Above ₹1,00,000</option>
              <option value="custom">Custom Specified Range</option>
            </select>
          </div>
        </div>

        {/* Custom Price Range Row */}
        {pricePreset === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200/70 p-4 rounded-xl animate-dropdown">
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Minimum Selling Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min amount"
                  className="w-full pl-7 pr-3 h-10 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maximum Selling Price (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max amount"
                  className="w-full pl-7 pr-3 h-10 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* Extended Advanced Filters Cluster */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-3 border-t border-slate-100 animate-dropdown">
            {/* Year */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Year Registry</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Years</option>
                {yearsList.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>

            {/* Fuel Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fuel System</label>
              <select
                value={fuelTypeFilter}
                onChange={(e) => setFuelTypeFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All Fuel Systems</option>
                {fuelTypesList.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Owner Type */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Owner Serial</label>
              <select
                value={ownerTypeFilter}
                onChange={(e) => setOwnerTypeFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">Any Owner count</option>
                {ownerTypesList.map(owner => (
                  <option key={owner} value={owner}>{owner}</option>
                ))}
              </select>
            </div>

            {/* RC Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">RC Paperwork</label>
              <select
                value={rcStatusFilter}
                onChange={(e) => setRcStatusFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-250 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">All RC Documents</option>
                <option value="Card">Smart Card Done</option>
                <option value="Paper">Paper Pending/Other</option>
              </select>
            </div>

            {/* Insurance Status */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Insurance status</label>
              <select
                value={insuranceStatusFilter}
                onChange={(e) => setInsuranceStatusFilter(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="All">Any Coverage Status</option>
                <option value="Active">Currently Active</option>
                <option value="Expired">Expired / Needs Renew</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Results Header Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1 lg:block">
          Matches Located: <span className="text-slate-800 font-black">{filteredVehicles.length} Units</span>
        </p>
      </div>

      {/* Results Display - Grid cards styled beautifully */}
      {filteredVehicles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredVehicles.map((v) => {
            const offerPrice = Math.round(v.purchasePrice ? v.purchasePrice * 1.15 : 45000);
            return (
              <div
                key={v.id}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col justify-between group h-full"
              >
                {/* Visual Header / Brand Label banner */}
                <div className="relative h-40 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100 shrink-0">
                  {v.photos && v.photos.length > 0 ? (
                    <img
                      src={v.photos[0]}
                      alt={v.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-350">
                      <Car size={36} className="text-slate-300" />
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Photo pending</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-lg border shadow-sm ${
                      v.status === "Available"
                        ? "bg-emerald-500 text-white border-emerald-500"
                        : "bg-amber-400 text-slate-900 border-amber-400"
                    }`}>
                      {v.status || "Available"}
                    </span>
                  </div>

                  {/* Brand Tag overlay bottom left */}
                  <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10 text-[10px] font-black text-white uppercase tracking-wider">
                    {v.brand}
                  </div>
                </div>

                {/* Info block */}
                <div className="p-4 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <h4 className="font-extrabold text-slate-900 leading-tight tracking-tight text-sm line-clamp-1">
                      {v.name}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-widest mt-0.5 line-clamp-1">
                      {v.regNo || "REGISTRATION PENDING"}
                    </p>

                    {/* Metadata matrix */}
                    <div className="grid grid-cols-2 gap-2 mt-3.5 text-xs">
                      <div className="flex items-center gap-1 text-slate-600 font-semibold">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{v.year} Reg</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-semibold capitalize">
                        <Fuel size={12} className="text-slate-400" />
                        <span>{v.fuelType || "Petrol"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-semibold truncate">
                        <Users size={12} className="text-slate-400" />
                        <span>{v.ownerDetails || "1st Owner"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 font-semibold truncate">
                        <FileText size={12} className="text-slate-400" />
                        <span>RC: {v.rcType === "Card" ? "S-Card" : "Paper"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price marker */}
                  <div className="border-t border-slate-50 mt-4 pt-3.5 flex items-center justify-between select-none">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      Offer Price:
                    </span>
                    <span className="text-base font-extrabold text-brand-600">
                      ₹{offerPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Operations Desk (Actions) */}
                <div className="px-4 pb-4 border-t border-slate-100 pt-3 flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedVehicle(v)}
                    className="flex-1 h-8 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    title="View vehicle technical passport and status"
                  >
                    <Eye size={12} /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPosterVehicle(v);
                      setShowPosterModal(true);
                    }}
                    className="h-8 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center justify-center gap-1 text-xs font-bold cursor-pointer transition-all"
                    title="Generate professional vehicle sales poster"
                  >
                    <Sparkles size={12} className="text-indigo-600" /> Poster
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(v)}
                    className="h-8 w-8 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                    title="Prepare and share offer passport to WhatsApp"
                  >
                    <Share2 size={12} />
                  </button>
                  {v.status === "Available" && (
                    <button
                      type="button"
                      onClick={() => onNavigate("sales", { salesVehicle: v })}
                      className="flex-1 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                      title="Route to Sales Desk to finalize deal"
                    >
                      <Handshake size={12} /> Sales
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-3.5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <Search size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No Vehicles Matched Current Requirements</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Try adjusting your price brackets or toggling off the brand constraint filters to find nearby inventory.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-250 text-slate-700 text-xs font-bold rounded-xl transition-all"
          >
            Reset Matrix Filters
          </button>
        </div>
      )}

      {/* Detail Passports Dialog Overlay */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col justify-between text-left animate-dropdown">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div>
                <span className="text-[10px] font-black tracking-widest text-brand-400 uppercase font-mono">
                  AUTO 360 DIGITAL VEHICLE PASSPORT
                </span>
                <h3 className="text-base font-extrabold tracking-tight mt-0.5">
                  {selectedVehicle.brand} {selectedVehicle.name} ({selectedVehicle.year})
                </h3>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="p-1 px-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 max-h-[80vh]">
              {/* Media gallery center */}
              <div className="h-56 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 relative">
                {selectedVehicle.photos && selectedVehicle.photos.length > 0 ? (
                  <img
                    src={selectedVehicle.photos[0]}
                    className="w-full h-full object-cover"
                    alt="Vehicle details"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300">
                    <Car size={48} />
                    <span className="text-xs font-bold uppercase tracking-widest mt-1.5">Image pending</span>
                  </div>
                )}
                <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-700 font-mono text-xs font-extrabold text-brand-400 shadow-sm">
                  ₹{Math.round(selectedVehicle.purchasePrice ? selectedVehicle.purchasePrice * 1.15 : 45000).toLocaleString("en-IN")}
                </div>
              </div>

              {/* Status matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl flex flex-col text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">RC Status</span>
                  <span className="text-xs font-extrabold text-slate-700 mt-1 uppercase">
                    {selectedVehicle.rcType === "Card" ? "Smart Card Issued" : "Paper/Pending Transfer"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl flex flex-col text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">NOC status</span>
                  <span className="text-xs font-extrabold text-slate-700 mt-1 uppercase">
                    {selectedVehicle.noc?.hasNoc ? "Granted / Clear" : "Pending Upload"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl flex flex-col text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Insurance</span>
                  <span className="text-xs font-extrabold text-slate-700 mt-1 uppercase">
                    {selectedVehicle.insurance?.hasInsurance ? "Active & Protected" : "Needs Renewal"}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200/70 p-3 rounded-xl flex flex-col text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vehicle Status</span>
                  <span className={`text-xs font-extrabold mt-1 uppercase ${
                    selectedVehicle.status === "Available" ? "text-emerald-600" : "text-amber-500"
                  }`}>
                    {selectedVehicle.status || "Available"}
                  </span>
                </div>
              </div>

              {/* Detail list specs */}
              <div className="space-y-2 text-sm border-t border-slate-100 pt-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Specification Sheet</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Variant/Model:</span>
                    <span className="font-bold text-slate-800">{selectedVehicle.model || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Registration Number:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedVehicle.regNo || "N/A"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-55">
                    <span className="text-slate-500">Year of Manufacture:</span>
                    <span className="font-bold text-slate-800">{selectedVehicle.year}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Fuel Type:</span>
                    <span className="font-bold text-slate-800">{selectedVehicle.fuelType || "Petrol"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Owner Details:</span>
                    <span className="font-bold text-slate-800">{selectedVehicle.ownerDetails || "1st Owner"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Tyre Condition:</span>
                    <span className="font-bold text-slate-800">{selectedVehicle.tyreStatus || "Good"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Branch Location:</span>
                    <span className="font-bold text-slate-800 capitalize">{selectedVehicle.branch || "Tiruppur Headquarters"}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="text-slate-500">Challans Pending:</span>
                    <span className="font-bold text-slate-800">
                      {selectedVehicle.challan?.hasChallan ? `₹${selectedVehicle.challan.amount.toLocaleString("en-IN")}` : "No Pending Challans"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setPosterVehicle(selectedVehicle);
                  setShowPosterModal(true);
                }}
                className="px-4 py-2 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles size={14} className="text-indigo-600" /> Sales Poster
              </button>
              <button
                onClick={() => handleWhatsAppShare(selectedVehicle)}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 size={13} /> WhatsApp Share
              </button>
              {selectedVehicle.status === "Available" && (
                <button
                  onClick={() => {
                    const v = selectedVehicle;
                    setSelectedVehicle(null);
                    onNavigate("sales", { salesVehicle: v });
                  }}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow"
                >
                  <Handshake size={14} /> Sell Location Unit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SALES POSTER MODAL */}
      <SalesPosterModal
        vehicle={posterVehicle}
        businessProfile={businessProfile}
        isOpen={showPosterModal}
        onClose={() => {
          setShowPosterModal(false);
          setPosterVehicle(null);
        }}
      />
    </div>
  );
}
