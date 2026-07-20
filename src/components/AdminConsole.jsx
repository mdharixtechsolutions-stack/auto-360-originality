import { useState, useEffect } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Key,
  RefreshCw,
  Database,
  AlertTriangle,
  Building,
  CheckCircle,
  X,
  Lock,
  Unlock,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export default function AdminConsole({ isSoftwareOwner, onDeactivateAdmin }) {
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  
  const [licenseInfo, setLicenseInfo] = useState({ status: "Inactive", licenseKey: "" });
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState("");
  const [generationInput, setGenerationInput] = useState("");
  const [activationKey, setActivationKey] = useState("");

  const [dbStats, setDbStats] = useState({
    purchases: 0,
    deals: 0,
    customers: 0,
    suppliers: 0,
    cities: 0,
    branches: 0
  });
  const [dbActionLoading, setDbActionLoading] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-clear message after 4s
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  // Fetch all administrative data
  const fetchData = async () => {
    try {
      setCompaniesLoading(true);
      const resComp = await fetch("/api/admin/companies");
      if (resComp.ok) {
        const data = await resComp.ok ? await resComp.json() : [];
        setCompanies(data);
      }

      const resLic = await fetch("/api/admin/license");
      if (resLic.ok) {
        const data = await resLic.json();
        setLicenseInfo(data);
      }

      // Fetch basic db stats
      const resStats = await fetch("/api/branches");
      const resCities = await fetch("/api/cities");
      if (resStats.ok && resCities.ok) {
        const b = await resStats.json();
        const c = await resCities.json();
        setDbStats(prev => ({
          ...prev,
          branches: b.length,
          cities: c.length
        }));
      }
    } catch (e) {
      console.error("Error fetching admin console data:", e);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    if (isSoftwareOwner) {
      fetchData();
    }
  }, [isSoftwareOwner]);

  const handleAddCompany = async (e) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCompanyName.trim() })
      });
      if (res.ok) {
        setNewCompanyName("");
        setSuccessMessage("Company profile registered successfully!");
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to register company");
      }
    } catch (err) {
      setErrorMessage("Network error registering company");
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!window.confirm("Are you sure you want to delete this company? All branch mappings will remain isolated.")) return;
    try {
      const res = await fetch(`/api/admin/companies/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSuccessMessage("Company deleted successfully");
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Failed to delete company");
      }
    } catch (err) {
      setErrorMessage("Network error deleting company");
    }
  };

  const handleGenerateLicenseKey = () => {
    if (!generationInput.trim()) return;
    // Generate an encrypted-looking key dynamically for display
    const clean = generationInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const dateSalt = new Date().getUTCFullYear().toString();
    const hash = Array.from(clean + dateSalt)
      .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
      .toString(16)
      .toUpperCase();
    
    const formatted = `A360-${clean.slice(0, 4)}-${hash.slice(-4)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setGeneratedKey(formatted);
  };

  const handleActivateLicense = async () => {
    if (!activationKey.trim()) return;
    try {
      setLicenseLoading(true);
      const res = await fetch("/api/admin/license/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: activationKey.trim() })
      });
      if (res.ok) {
        setActivationKey("");
        setSuccessMessage("License key activated successfully!");
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Activation failed");
      }
    } catch (e) {
      setErrorMessage("Network failure activating license");
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleDeactivateLicense = async () => {
    try {
      setLicenseLoading(true);
      const res = await fetch("/api/admin/license/deactivate", {
        method: "POST"
      });
      if (res.ok) {
        setSuccessMessage("License deactivated successfully");
        fetchData();
      }
    } catch (e) {
      setErrorMessage("Failed to deactivate license");
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleResetLicense = async () => {
    if (!window.confirm("Are you sure you want to completely purge active license settings?")) return;
    try {
      setLicenseLoading(true);
      const res = await fetch("/api/admin/license/reset", {
        method: "POST"
      });
      if (res.ok) {
        setSuccessMessage("License purges completed successfully");
        fetchData();
      }
    } catch (e) {
      setErrorMessage("Failed to reset license");
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleImportDemoData = async () => {
    if (!window.confirm("Import Tamil Nadu Demo Locations & dummy records? This will enrich empty lists for testing.")) return;
    try {
      setDbActionLoading(true);
      const adminToken = localStorage.getItem("adminToken");
      const res = await fetch(`/api/seed?admin_token=${adminToken}`);
      if (res.ok) {
        setSuccessMessage("Demo locations and records successfully imported!");
        window.location.reload();
      } else {
        setErrorMessage("Seeding unauthorized or failed.");
      }
    } catch (e) {
      setErrorMessage("Error communicating with seeder");
    } finally {
      setDbActionLoading(false);
    }
  };

  const handleResetDb = async () => {
    if (resetConfirmation !== "RESET") {
      setErrorMessage("Please type 'RESET' exactly in the confirmation field");
      return;
    }
    try {
      setDbActionLoading(true);
      const res = await fetch("/api/clear-database", {
        method: "POST"
      });
      if (res.ok) {
        setResetConfirmation("");
        setSuccessMessage("Database reset. Clean state established!");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setErrorMessage("Purge command rejected by server security");
      }
    } catch (e) {
      setErrorMessage("Error purging database");
    } finally {
      setDbActionLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto max-h-screen">
      {/* Messages */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 border border-emerald-200/50 shadow-sm"
          >
            <CheckCircle className="text-emerald-600 flex-shrink-0" size={18} />
            <span className="text-xs font-bold">{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-rose-50 text-rose-800 p-4 rounded-2xl flex items-center gap-3 border border-rose-200/50 shadow-sm"
          >
            <AlertCircle className="text-rose-600 flex-shrink-0" size={18} />
            <span className="text-xs font-bold">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-950 text-amber-400 rounded-2xl shadow-inner">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-sans">Software Owner Console</h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5 font-medium">Harix Tech Solutions ERP Administration Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-extrabold bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-150/50">
            Super Admin Active
          </span>
          <button
            onClick={onDeactivateAdmin}
            className="text-xs font-bold text-slate-600 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl border border-slate-200 cursor-pointer transition-all"
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-slate-150">
        <button
          onClick={() => setActiveTab("companies")}
          className={cn(
            "pb-3 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all",
            activeTab === "companies" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Company Directory
        </button>
        <button
          onClick={() => setActiveTab("licensing")}
          className={cn(
            "pb-3 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all",
            activeTab === "licensing" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Licensing Control
        </button>
        <button
          onClick={() => setActiveTab("database")}
          className={cn(
            "pb-3 px-6 text-xs font-extrabold uppercase tracking-wider border-b-2 cursor-pointer transition-all",
            activeTab === "database" ? "border-slate-950 text-slate-950" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Core Operations
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "companies" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Card: Add Company */}
            <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Building size={16} className="text-slate-500" /> Register New Company
              </h2>
              <form onSubmit={handleAddCompany} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Company Name</label>
                  <input
                    type="text"
                    required
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Senthil Murugan Motors"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-950 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-950 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-850 cursor-pointer shadow-md transition-all"
                >
                  <Plus size={15} /> Add Company Profile
                </button>
              </form>
            </div>

            {/* Right Card: Registered Companies */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">Registered Corporate Clients ({companies.length})</h2>
              {companiesLoading ? (
                <div className="py-12 flex justify-center text-slate-400 text-xs font-semibold">Loading company registry...</div>
              ) : companies.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  No custom companies registered yet. Create one on the left.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-extrabold">
                        <th className="py-2.5">ID</th>
                        <th className="py-2.5">Company Name</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {companies.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/25">
                          <td className="py-3 font-mono font-bold text-slate-500">{c.id}</td>
                          <td className="py-3 font-bold text-slate-900">{c.name}</td>
                          <td className="py-3">
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteCompany(c.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-all"
                              title="Delete profile"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "licensing" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Generate License */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Key size={16} className="text-indigo-500" /> License Key Generator
                </h2>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Generate secure, production-ready, encrypted activation tokens for specific company profiles to activate licensing dynamically.
                </p>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-slate-400">Target Company Profile / Client ID</label>
                  <input
                    type="text"
                    value={generationInput}
                    onChange={(e) => setGenerationInput(e.target.value)}
                    placeholder="e.g. SenthilMuruganMotors"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-slate-950 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-3 mt-4">
                <button
                  onClick={handleGenerateLicenseKey}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-md transition-all"
                >
                  Generate License Key
                </button>
                {generatedKey && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-150/50 space-y-1.5">
                    <p className="text-[10px] font-extrabold uppercase text-indigo-400">Generated Encrypted Token</p>
                    <div className="flex items-center justify-between">
                      <code className="text-xs font-extrabold text-indigo-900 tracking-wider select-all">{generatedKey}</code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedKey);
                          setSuccessMessage("Key token copied to clipboard!");
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Activation Control & Status */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" /> Current License Status
              </h2>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-150">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400">License Authority</p>
                  <p className="text-sm font-extrabold text-slate-800 font-mono mt-0.5">
                    {licenseInfo.licenseKey || "No License Activated"}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 rounded-full border",
                  licenseInfo.status === "Active" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                )}>
                  {licenseInfo.status}
                </span>
              </div>

              {licenseInfo.status === "Active" ? (
                <div className="space-y-4 pt-2">
                  <div className="text-xs text-slate-500 space-y-1 font-sans">
                    <div className="flex justify-between">
                      <span>Activated On:</span>
                      <span className="font-bold text-slate-800">{licenseInfo.activatedAt ? new Date(licenseInfo.activatedAt).toLocaleString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validity Status:</span>
                      <span className="font-bold text-emerald-600">365 Days Left (Active)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={handleDeactivateLicense}
                      disabled={licenseLoading}
                      className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Deactivate License
                    </button>
                    <button
                      onClick={handleResetLicense}
                      disabled={licenseLoading}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Reset Purge
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500 font-sans">
                    To activate the client software, enter a generated license key token below.
                  </p>
                  <input
                    type="text"
                    value={activationKey}
                    onChange={(e) => setActivationKey(e.target.value)}
                    placeholder="Enter License Key"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold focus:ring-2 focus:ring-slate-950 outline-none uppercase"
                  />
                  <button
                    onClick={handleActivateLicense}
                    disabled={licenseLoading}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer shadow-md transition-all"
                  >
                    Activate License Key
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "database" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: Database Actions */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Database size={16} className="text-amber-500" /> Administrative Database Control
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                These sensitive operations modify the primary server-side JSON/FS datastore. They must be handled with extreme care.
              </p>

              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-250/50 space-y-3">
                <div className="flex gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0" size={18} />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Seeding / Live Testing Mode</h4>
                    <p className="text-[11px] text-amber-700 mt-1 font-sans leading-normal">
                      Import realistic location master hierarchies (districts, areas, sub-areas) and sample deal files for quick testing and quality assurance runs.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleImportDemoData}
                  disabled={dbActionLoading}
                  className="w-full bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-amber-700 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} className={cn(dbActionLoading && "animate-spin")} /> Import Tamil Nadu Demo Data
                </button>
              </div>
            </div>

            {/* Right Card: Dangerous Actions */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h2 className="text-sm font-extrabold text-rose-600 flex items-center gap-2">
                <AlertTriangle size={16} /> Danger Zone
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                A hard factory-reset removes all cities, areas, subareas, purchases, expenses, and deals from the live datastore. Branches and standard users will be preserved to prevent login locks.
              </p>

              <div className="p-4 border border-rose-200/60 bg-rose-50/50 rounded-2xl space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase text-rose-500 block">
                    Type "RESET" to confirm purging all data:
                  </label>
                  <input
                    type="text"
                    value={resetConfirmation}
                    onChange={(e) => setResetConfirmation(e.target.value)}
                    placeholder="Type RESET"
                    className="w-full px-4 py-2 bg-white border border-rose-200 text-rose-900 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <button
                  onClick={handleResetDb}
                  disabled={dbActionLoading || resetConfirmation !== "RESET"}
                  className="w-full bg-rose-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Clear & Hard Reset Database
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
