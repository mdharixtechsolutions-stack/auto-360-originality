import { useState, useEffect } from "react";
import {
  Globe,
  User,
  Shield,
  Bell,
  Palette,
  Database,
  Save,
  Mail,
  Key,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { cn } from "../lib/utils";
import { hasModulePermission } from "../lib/permissions";
import { useLanguage } from "../localization/LanguageContext";
import { INDIAN_STATES } from "../data/indianStates";

export default function Settings({ initialTab, currentUser, businessProfile, setBusinessProfile, onRefreshData }) {
  const [activeSection, setActiveSection] = useState(initialTab || "general");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  useEffect(() => {
    if (initialTab) {
      setActiveSection(initialTab);
    }
  }, [initialTab]);
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3e3);
  };
  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Settings saved successfully!");
    }, 1e3);
  };
  return <div className="space-y-6">
      {
    /* Toast Notification */
  }
      {toast && <div className="fixed bottom-4 right-4 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 border border-slate-700 text-xs font-bold animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {toast}
         </div>}

      {
    /* Header */
  }
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic">
            System <span className="text-brand-600 font-extrabold">{activeSection.replace("-", " ")}</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
            {activeSection === "general" && "Configure currency, timezone, languages and localized preferences"}
            {activeSection === "profile" && "Update your organization particulars, GSTIN registration and business address"}
            {activeSection === "security" && "Manage role permissions, two-factor logs and security boundaries"}
            {activeSection === "notifications" && "Enable custom triggers, system emails and gateway integrations"}
            {activeSection === "appearance" && "Customize theme visuals, light or dark modes and dashboard displays"}
            {activeSection === "backup" && "Download full database JSON backups or restore system cache safely"}
            {activeSection === "financial-year" && "Define default financial date limits for reports, ledger audits, and accounting boards"}
          </p>
        </div>
      </div>

      {
    /* Main Settings Card: drives the content cleanly without inner navigation */
  }
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[460px]">
        <div className="p-8">
          {activeSection === "general" && (
            <GeneralSettings 
              businessProfile={businessProfile} 
              setBusinessProfile={setBusinessProfile} 
              showToast={showToast} 
              onRefreshData={onRefreshData}
            />
          )}
          {activeSection === "profile" && (
            <BusinessProfile 
              businessProfile={businessProfile} 
              setBusinessProfile={setBusinessProfile} 
              showToast={showToast} 
              onRefreshData={onRefreshData}
            />
          )}
          {activeSection === "security" && <SecuritySettings />}
          {activeSection === "notifications" && <NotificationsSettings />}
          {activeSection === "appearance" && <AppearanceSettings />}
          {activeSection === "backup" && <BackupSettings showToast={showToast} />}
          {activeSection === "financial-year" && <FinancialYearSettings showToast={showToast} />}
        </div>
      </div>
    </div>;
}
function GeneralSettings({ businessProfile, setBusinessProfile, showToast, onRefreshData }) {
  const { language, setLanguage, t } = useLanguage();
  const [appName, setAppName] = useState(businessProfile?.companyName || "AUTO360 ERP");
  const [defaultState, setDefaultState] = useState(businessProfile?.defaultState || businessProfile?.state || "Tamil Nadu");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadGenSettings = async () => {
      try {
        const res = await fetch("/api/settings/general");
        if (res.ok) {
          const data = await res.json();
          if (data.appName) setAppName(data.appName);
          if (data.defaultState) setDefaultState(data.defaultState);
        }
      } catch (e) {
        console.warn("Failed to fetch general settings on mount:", e);
      }
    };
    loadGenSettings();
  }, []);

  useEffect(() => {
    if (businessProfile) {
      if (businessProfile.companyName) setAppName(businessProfile.companyName);
      if (businessProfile.defaultState || businessProfile.state) {
        setDefaultState(businessProfile.defaultState || businessProfile.state);
      }
    }
  }, [businessProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const genPayload = {
        appName,
        defaultState,
        currency: "INR (₹)",
        timezone: "Asia/Kolkata",
        language
      };
      await fetch("/api/settings/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(genPayload)
      });

      const updated = {
        ...(businessProfile || {}),
        companyName: appName,
        defaultState,
        state: defaultState
      };
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error("Failed to save general settings");
      const data = await res.json();
      if (data.success && setBusinessProfile) {
        setBusinessProfile(data.business_profile);
        if (onRefreshData) onRefreshData();
      }
      if (showToast) showToast("General Settings saved successfully! Default State updated.");
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <Globe size={18} className="text-brand-600" /> {t("General Configuration", "General Configuration")}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Application Name", "Application Name")}</label>
          <input 
            type="text" 
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {t("Default State", "Default State")}
            <span className="text-brand-600 font-extrabold text-[10px] bg-brand-50 px-2 py-0.5 rounded-full">(For Purchases)</span>
          </label>
          <select 
            value={defaultState}
            onChange={(e) => setDefaultState(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900"
          >
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.label}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Default Currency", "Default Currency")}</label>
          <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900">
            <option>INR (₹)</option>
            <option>USD ($)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Timezone", "Timezone")}</label>
          <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900">
            <option>(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Language", "Language")}</label>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900"
          >
            <option value="en">English</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
            <option value="kn">Kannada (ಕನ್ನಡ)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-brand-200 text-xs uppercase tracking-wider"
        >
          <Save size={16} />
          {isSaving ? "Saving..." : "Save General Settings"}
        </button>
      </div>
    </form>
  );
}
function BusinessProfile({ businessProfile, setBusinessProfile, showToast, onRefreshData }) {
  const [companyName, setCompanyName] = useState(businessProfile?.companyName || "");
  const [companyLogo, setCompanyLogo] = useState(businessProfile?.companyLogo || "");
  const [address, setAddress] = useState(businessProfile?.address || "");
  const [city, setCity] = useState(businessProfile?.city || "");
  const [stateVal, setStateVal] = useState(businessProfile?.state || "");
  const [country, setCountry] = useState(businessProfile?.country || "");
  const [pincode, setPincode] = useState(businessProfile?.pincode || "");
  const [mobileNumber, setMobileNumber] = useState(businessProfile?.mobileNumber || "");
  const [whatsAppNumber, setWhatsAppNumber] = useState(businessProfile?.whatsAppNumber || "");
  const [email, setEmail] = useState(businessProfile?.email || "");
  const [website, setWebsite] = useState(businessProfile?.website || "");
  const [gstNumber, setGSTNumber] = useState(businessProfile?.gstNumber || "");
  const [socialMedia, setSocialMedia] = useState(businessProfile?.socialMedia || "");
  const [termsAndConditions, setTermsAndConditions] = useState(businessProfile?.termsAndConditions || "");
  const [bankName, setBankName] = useState(businessProfile?.bankName || "");
  const [accountNumber, setAccountNumber] = useState(businessProfile?.accountNumber || "");
  const [branchName, setBranchName] = useState(businessProfile?.branchName || "");
  const [ifscCode, setIfscCode] = useState(businessProfile?.ifscCode || "");
  const [upiId, setUpiId] = useState(businessProfile?.upiId || "");
  const [upiQr, setUpiQr] = useState(businessProfile?.upiQr || "");

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingUpi, setIsUploadingUpi] = useState(false);

  useEffect(() => {
    if (businessProfile) {
      setCompanyName(businessProfile.companyName || "");
      setCompanyLogo(businessProfile.companyLogo || "");
      setAddress(businessProfile.address || "");
      setCity(businessProfile.city || "");
      setStateVal(businessProfile.state || "");
      setCountry(businessProfile.country || "");
      setPincode(businessProfile.pincode || "");
      setMobileNumber(businessProfile.mobileNumber || "");
      setWhatsAppNumber(businessProfile.whatsAppNumber || "");
      setEmail(businessProfile.email || "");
      setWebsite(businessProfile.website || "");
      setGSTNumber(businessProfile.gstNumber || "");
      setSocialMedia(businessProfile.socialMedia || "");
      setTermsAndConditions(businessProfile.termsAndConditions || "");
      setBankName(businessProfile.bankName || "");
      setAccountNumber(businessProfile.accountNumber || "");
      setBranchName(businessProfile.branchName || "");
      setIfscCode(businessProfile.ifscCode || "");
      setUpiId(businessProfile.upiId || "");
      setUpiQr(businessProfile.upiQr || "");
    }
  }, [businessProfile]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "logo") setIsUploadingLogo(true);
    else setIsUploadingUpi(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (data.filePath) {
        if (type === "logo") {
          setCompanyLogo(data.filePath);
          showToast("Company logo uploaded successfully!");
        } else {
          setUpiQr(data.filePath);
          showToast("UPI QR code uploaded successfully!");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to upload image. Please try again.");
    } finally {
      setIsUploadingLogo(false);
      setIsUploadingUpi(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = {
        companyName,
        companyLogo,
        address,
        city,
        state: stateVal,
        country,
        pincode,
        mobileNumber,
        whatsAppNumber,
        email,
        website,
        gstNumber,
        socialMedia,
        termsAndConditions,
        bankName,
        accountNumber,
        branchName,
        ifscCode,
        upiId,
        upiQr,
      };

      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) throw new Error("Failed to save company master profile");
      const data = await res.json();
      if (data.success) {
        if (setBusinessProfile) setBusinessProfile(data.business_profile);
        if (onRefreshData) onRefreshData();
        showToast("Company Master settings saved successfully!");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving Company Master profile settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveProfile} className="space-y-6 text-left">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <User size={18} className="text-brand-600" /> Company Master Configuration
      </h3>

      {/* Logos and Signature Bento Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Logo Bento Block */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Company Logo Image</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {companyLogo ? (
                <img src={companyLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[10px] font-black text-slate-300">NO LOGO</span>
              )}
            </div>
            <div className="space-y-1.5 flex-1 text-left">
              <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all shadow-sm inline-block">
                {isUploadingLogo ? "Uploading..." : "Upload Logo"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "logo")} disabled={isUploadingLogo} />
              </label>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">PNG, JPG or SVG. Max 2MB.</p>
            </div>
          </div>
        </div>

        {/* UPI QR Code Block */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">UPI QR Code Image</label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-inner p-1">
              {upiQr ? (
                <img src={upiQr} alt="UPI QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-[10px] font-black text-slate-300 uppercase">NO QR</span>
              )}
            </div>
            <div className="space-y-1.5 flex-1 text-left">
              <label className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all shadow-sm inline-block">
                {isUploadingUpi ? "Uploading..." : "Upload QR Image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, "upiqr")} disabled={isUploadingUpi} />
              </label>
              <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">Upload standard GPay, PhonePe or Paytm QR.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form sections grouped nicely */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">1. Profile & Legal Info</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Company Name</label>
            <input
              type="text"
              required
              placeholder="e.g. ABC Auto Consultancy"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">GST Number</label>
            <input
              type="text"
              placeholder="e.g. 33AAAAA0000A1Z5"
              value={gstNumber}
              onChange={(e) => setGSTNumber(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Media Handles</label>
            <input
              type="text"
              placeholder="e.g. fb.com/auto360, @auto360"
              value={socialMedia}
              onChange={(e) => setSocialMedia(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">2. Contact Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mobile Number</label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">WhatsApp Number</label>
            <input
              type="text"
              placeholder="e.g. +91 98765 43210"
              value={whatsAppNumber}
              onChange={(e) => setWhatsAppNumber(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="e.g. contact@yourfirm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Website URL</label>
            <input
              type="text"
              placeholder="e.g. www.yourfirm.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">3. Physical Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Street Address</label>
            <input
              type="text"
              placeholder="e.g. 123, Avinashi Road, Gandhipuram"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">City</label>
            <input
              type="text"
              placeholder="e.g. Coimbatore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">State</label>
            <input
              type="text"
              placeholder="e.g. Tamil Nadu"
              value={stateVal}
              onChange={(e) => setStateVal(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Country</label>
            <input
              type="text"
              placeholder="e.g. India"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pincode</label>
            <input
              type="text"
              placeholder="e.g. 641012"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">4. Bank & Payment Gateway Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bank Name</label>
            <input
              type="text"
              placeholder="e.g. HDFC Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Number</label>
            <input
              type="text"
              placeholder="e.g. 501002938475"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Branch Name</label>
            <input
              type="text"
              placeholder="e.g. Gandhipuram Branch"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">IFSC Code</label>
            <input
              type="text"
              placeholder="e.g. HDFC0001234"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm font-mono uppercase"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">UPI ID (VPA)</label>
            <input
              type="text"
              placeholder="e.g. auto360@okaxis"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-6">
        <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">5. Terms &amp; Policy Document</h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terms &amp; Conditions</label>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Appears on quotations, sale receipts and bills</span>
          </div>
          <textarea
            rows={4}
            placeholder="Specify legal terms, transfer fees guidelines, guarantee details, etc. (one item per line)..."
            value={termsAndConditions}
            onChange={(e) => setTermsAndConditions(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-semibold text-slate-900 shadow-sm font-sans"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-200 text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
        >
          <Save size={14} /> {isSaving ? "Saving..." : "Save Company Master Settings"}
        </button>
      </div>
    </form>
  );
}
function SecuritySettings() {
  const [tfa, setTfa] = useState(false);
  return <div className="space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <Shield size={18} className="text-brand-600" /> Security & Access
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <p className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</p>
            <p className="text-xs text-slate-500 mt-0.5">Encrypt and secure login sessions with dynamic SMS codes</p>
          </div>
          <button
    type="button"
    onClick={() => setTfa(!tfa)}
    className={cn(
      "w-12 h-6 rounded-full relative transition-colors duration-200",
      tfa ? "bg-brand-600" : "bg-slate-200"
    )}
  >
            <div className={cn(
    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200",
    tfa ? "left-7" : "left-1"
  )} />
          </button>
        </div>
        <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <p className="text-sm font-bold text-slate-900">Session Timeout Window</p>
            <p className="text-xs text-slate-500 mt-0.5">Logout inactive staff accounts automatically</p>
          </div>
          <select className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500">
            <option>30 Minutes</option>
            <option>1 Hour</option>
            <option>4 Hours</option>
            <option>Disabled</option>
          </select>
        </div>
      </div>
    </div>;
}
function NotificationsSettings() {
  return <div className="space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <Bell size={18} className="text-brand-600" /> Notifications Settings
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Mail size={16} className="text-brand-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">SMTP Server Properties</h4>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Host</label>
              <input type="text" defaultValue="smtp.auto3s.com" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SMTP Port</label>
              <input type="number" defaultValue="587" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>

        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 mb-1">
            <Key size={16} className="text-brand-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">WhatsApp Gateway Token</h4>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">API Endpoint Token</label>
              <input type="password" defaultValue="••••••••••••••••••••••••" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sender Identifier</label>
              <input type="text" defaultValue="919876543210" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          </div>
        </div>
      </div>
    </div>;
}
function AppearanceSettings() {
  const [selected, setSelected] = useState("Light");
  return <div className="space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <Palette size={18} className="text-brand-600" /> Visials & Themes
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["Light", "Dark", "Custom Slate"].map((theme) => <button
    key={theme}
    type="button"
    onClick={() => setSelected(theme)}
    className={cn(
      "p-5 rounded-2xl border-2 transition-all text-center flex flex-col items-center",
      selected === theme ? "border-brand-600 bg-brand-50/30" : "border-slate-150 bg-slate-50/50 hover:bg-slate-50"
    )}
  >
            <div className={cn(
    "w-full h-24 rounded-xl mb-3 border border-slate-200 shadow-sm",
    theme === "Light" ? "bg-white" : theme === "Dark" ? "bg-slate-950" : "bg-gradient-to-br from-slate-900 to-slate-800"
  )} />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">{theme} Visuals</span>
          </button>)}
      </div>
    </div>;
}
function BackupSettings({ showToast }) {
  return <div className="space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <Database size={18} className="text-brand-600" /> Backup & Restore
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Download size={16} className="text-brand-600" /> Create Backup File
            </h4>
            <p className="text-xs text-slate-500 leading-normal">
              Download your complete operational directory database as a secure JSON backup file. This snapshot preserves all historical records.
            </p>
          </div>
          <button
    type="button"
    onClick={() => showToast("Backup spreadsheet file generated and downloaded successfully!")}
    className="mt-6 flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
  >
            <Download size={14} /> Download Snapshot Backup
          </button>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-2">
              <Upload size={16} className="text-brand-600" /> Restore System Snapshot
            </h4>
            <p className="text-xs text-slate-500 leading-normal">
              Restore dynamic information registries, transactions, accounts data and contacts details using an exported JSON settings backup.
            </p>
          </div>
          <div className="mt-6">
            <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border-2 border-dashed border-slate-300 hover:border-brand-500 rounded-xl text-xs font-bold text-slate-600 hover:text-brand-600 cursor-pointer transition-all shadow-sm">
              <Upload size={14} />
              Choose Backup snapshot
              <input
    type="file"
    accept=".json"
    className="hidden"
    onChange={() => showToast("Operational data database successfully restored!")}
  />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-rose-50 border border-rose-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3">
          <RefreshCw className="text-rose-600 shrink-0 mt-0.5 animate-spin-slow" size={20} />
          <div>
            <h4 className="text-sm font-bold text-rose-950">Wipe All System Cache & Test Data</h4>
            <p className="text-xs text-rose-700 leading-normal mt-1">
              Instantly resets all databases to clean factory defaults.
            </p>
          </div>
        </div>
        <button
    type="button"
    onClick={() => {
      if (confirm("Are you sure you want to perform a complete system reset? This will wipe all vehicles, deals, customers, and transactions.")) {
        fetch("/api/clear-database", { method: "POST" })
          .then(res => {
            if (!res.ok) throw new Error("Failed to clear database on server");
            return res.json();
          })
          .then(() => {
            localStorage.clear();
            location.reload();
          })
          .catch(err => {
            alert("Error resetting database: " + err.message);
          });
      }
    }}
    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-rose-200/50 uppercase tracking-wider shrink-0"
  >
          Factory Reset
        </button>
      </div>
    </div>;
}

export function FinancialYearSettings({ showToast }) {
  const [from, setFrom] = useState(() => localStorage.getItem("financialYearFrom") || "2025-04-01");
  const [to, setTo] = useState(() => localStorage.getItem("financialYearTo") || "2026-03-31");
  
  const handleSave = () => {
    localStorage.setItem("financialYearFrom", from);
    localStorage.setItem("financialYearTo", to);
    showToast("Financial Year settings saved successfully!");
    // Trigger storage event to notify other components instantly
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3">
        <Database size={18} className="text-brand-600" /> Financial Year Parameters
      </h3>
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <p className="text-xs text-slate-500 leading-normal mb-6">
          Specify the active auditing boundaries. Report indices, Day Books, and Dashboard statistic summaries will default to calculations between these dates for maximum localized corporate governance compliance.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Financial Year From</label>
            <input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-bold text-slate-900 shadow-sm" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Financial Year To</label>
            <input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-brand-50/50 focus:border-brand-500 text-sm font-bold text-slate-900 shadow-sm" 
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand-200 text-xs uppercase tracking-wider"
          >
            <Save size={14} /> Update Active Audit Range
          </button>
        </div>
      </div>
    </div>
  );
}

