import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Car, 
  Eye, 
  EyeOff, 
  Languages, 
  MapPin, 
  ChevronDown 
} from "lucide-react";
import showroomBg from "../assets/images/showroom_background_1781509637762.jpg";

export default function Login({ onLogin, error, businessProfile }) {
  const [email, setEmail] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [branches, setBranches] = useState([
    { id: "BR002", name: "Coimbatore" },
    { id: "BR001", name: "Tiruppur" }
  ]);
  const [selectedBranch, setSelectedBranch] = useState("Coimbatore");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  // Change Password Modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [cpUsername, setCpUsername] = useState("");
  const [cpCurrentPassword, setCpCurrentPassword] = useState("");
  const [cpNewPassword, setCpNewPassword] = useState("");
  const [cpConfirmPassword, setCpConfirmPassword] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");
  const [cpLoading, setCpLoading] = useState(false);

  const handleOpenChangePassword = () => {
    setCpUsername(email || "");
    setCpCurrentPassword("");
    setCpNewPassword("");
    setCpConfirmPassword("");
    setCpError("");
    setCpSuccess("");
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setCpError("");
    setCpSuccess("");
    if (!cpUsername.trim()) {
      setCpError("Username or email is required");
      return;
    }
    if (!cpCurrentPassword) {
      setCpError("Current password is required");
      return;
    }
    if (cpNewPassword.length < 6) {
      setCpError("New password must be at least 6 characters long");
      return;
    }
    if (cpNewPassword !== cpConfirmPassword) {
      setCpError("New password and confirm password do not match");
      return;
    }
    setCpLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cpUsername.trim(),
          currentPassword: cpCurrentPassword,
          newPassword: cpNewPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCpSuccess(data.message || "Password changed successfully!");
        setCpCurrentPassword("");
        setCpNewPassword("");
        setCpConfirmPassword("");
      } else {
        setCpError(data.error || "Failed to change password");
      }
    } catch (err) {
      setCpError("Network error. Please try again.");
    } finally {
      setCpLoading(false);
    }
  };

  useEffect(() => {
    // Fetch branches from server
    fetch("/api/branches")
      .then((res) => {
        if (!res.ok) throw new Error("Branch fetch failed");
        return res.json();
      })
      .then((data) => {
        let branchList = Array.isArray(data) && data.length > 0 ? data.filter((b) => !b.isDeleted) : [];
        const names = branchList.map((b) => b.name);
        if (!names.includes("Coimbatore")) {
          branchList = [{ id: "BR002", name: "Coimbatore" }, ...branchList];
        }
        if (!names.includes("Tiruppur")) {
          branchList.push({ id: "BR001", name: "Tiruppur" });
        }
        setBranches(branchList);
        setSelectedBranch(branchList.find((b) => b.name === "Coimbatore")?.name || branchList[0]?.name || "Coimbatore");
      })
      .catch((err) => {
        console.warn("Using default branch list:", err);
        setBranches([
          { id: "BR002", name: "Coimbatore" },
          { id: "BR001", name: "Tiruppur" }
        ]);
        setSelectedBranch("Coimbatore");
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin(email, password, selectedBranch);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-[#070b14] text-slate-100 font-sans select-none">
      {/* Full Background Showroom Image */}
      <img
        src={showroomBg}
        alt="Auto 360 Premium Showroom"
        className="absolute inset-0 w-full h-full object-cover object-center z-0 pointer-events-none"
      />

      {/* Atmospheric Vignette & Contrast Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/80 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

      {/* TOP HEADER: Language Pill on Right */}
      <header className="relative z-20 w-full px-6 sm:px-12 pt-6 flex justify-end items-center">
        <div className="relative flex items-center bg-[#070e20]/80 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg hover:border-white/20 transition-all">
          <Languages size={15} className="text-cyan-400 shrink-0 mr-1.5" />
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="bg-transparent outline-none cursor-pointer text-xs font-bold uppercase tracking-wider text-white appearance-none pr-5"
          >
            <option value="en" className="bg-[#0b1329] text-white">ENGLISH (US)</option>
            <option value="tm" className="bg-[#0b1329] text-white">தமிழ் (TAMIL)</option>
            <option value="hi" className="bg-[#0b1329] text-white">हिन्दी (HINDI)</option>
          </select>
          <ChevronDown size={14} className="text-slate-400 absolute right-3 pointer-events-none" />
        </div>
      </header>

      {/* MAIN VIEWPORT BODY: Left Branding & Right Login Card */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-between px-6 sm:px-12 lg:px-20 xl:px-28 py-8 w-full max-w-[1440px] mx-auto">
        
        {/* LEFT SIDE: Hero Branding */}
        <div className="w-full lg:w-1/2 space-y-4 mb-10 lg:mb-0 text-left">
          {/* Car Icon + AUTO 360 */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#07132e]/90 border-2 border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.55)] flex items-center justify-center shrink-0">
              <Car size={32} className="text-cyan-400" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white leading-none">
              AUTO<span className="text-[#00b4d8]">360</span>
            </h1>
          </div>

          {/* Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight pt-1">
            Auto Consultancy Software
          </h2>

          {/* Pill Badge */}
          <div className="pt-1">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#0a1838]/80 border border-blue-500/50 backdrop-blur-md text-xs font-bold tracking-widest text-cyan-300 uppercase shadow-md">
              {businessProfile?.companyName || "AUTO 360"}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: Floating Glass Login Card */}
        <div className="w-full lg:w-auto flex justify-center lg:justify-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-[420px] bg-[#0c162b]/90 backdrop-blur-2xl border border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] rounded-3xl p-8 sm:p-9 text-white relative"
          >
            {/* Top Company Emblem / Logo */}
            <div className="flex justify-center mb-5">
              {businessProfile?.companyLogo ? (
                <img
                  src={businessProfile.companyLogo}
                  alt="Company Logo"
                  className="h-10 sm:h-12 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-[1.5px] shadow-lg shadow-cyan-500/30">
                      <div className="w-full h-full bg-[#070e20] rounded-[10px] flex items-center justify-center">
                        <Car size={18} className="text-cyan-400" />
                      </div>
                    </div>
                    <span className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                      AUTO<span className="text-[#00b4d8]">360</span>
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    Auto Consultancy ERP
                  </span>
                </div>
              )}
            </div>

            {/* Welcome Greeting */}
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight text-center">
              WELCOME BACK
            </h3>
            <p className="text-xs text-slate-400 text-center mt-1 mb-6">
              Sign in to continue to your dashboard
            </p>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* USERNAME / EMAIL ADDRESS */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  USERNAME / EMAIL ADDRESS
                </label>
                <div className="bg-[#edf2f7] rounded-xl flex items-center px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-cyan-500">
                  <Mail size={16} className="text-slate-500 mr-3 shrink-0" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-transparent text-slate-900 font-semibold text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  PASSWORD
                </label>
                <div className="bg-[#edf2f7] rounded-xl flex items-center px-4 py-3 transition-all focus-within:ring-2 focus-within:ring-cyan-500">
                  <Lock size={16} className="text-slate-500 mr-3 shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent text-slate-900 font-semibold text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-500 hover:text-slate-700 cursor-pointer ml-2 outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* ASSIGNED BRANCH */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                  ASSIGNED BRANCH
                </label>
                <div className="bg-[#070e20] border border-slate-700/80 rounded-xl flex items-center px-4 py-3 relative">
                  <MapPin size={16} className="text-slate-400 mr-3 shrink-0" />
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full bg-transparent text-white font-medium text-sm outline-none appearance-none cursor-pointer pr-6"
                  >
                    {branches.map((b) => (
                      <option key={b.id || b.name} value={b.name} className="bg-[#0b1329] text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="text-slate-400 absolute right-4 pointer-events-none" />
                </div>
              </div>

              {/* Remember Me & Change Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                  />
                  <span className="text-slate-300 font-medium">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer outline-none"
                >
                  Change Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#0066ff] to-[#00b4d8] text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO PLATFORM</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </main>

      {/* BOTTOM FOOTER BAR */}
      <footer className="relative z-10 w-full px-6 sm:px-12 lg:px-20 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 border-t border-white/5 backdrop-blur-xs">
        <div>
          AUTO360 ERP Suite • Harix Tech Solutions
        </div>
        <div className="flex items-center gap-3">
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Security policies, cookie protocols and credentials storage are set in accordance with ISO 27001 standards."); }} className="hover:text-slate-300 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Access, licensing and operations of this platform are governed by the license agreement of AUTO 360."); }} className="hover:text-slate-300 transition-colors">Terms & Conditions</a>
        </div>
      </footer>

      {/* CHANGE PASSWORD MODAL */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b1329] border border-slate-700/60 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative text-slate-100"
            >
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                  <Lock size={22} />
                </div>
                <h3 className="text-xl font-bold text-white">Change Account Password</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Update your access credentials with bcrypt encryption & JWT authorization
                </p>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                {cpError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-xl">
                    {cpError}
                  </div>
                )}
                {cpSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-xl">
                    {cpSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Username / Email Address
                  </label>
                  <input
                    type="text"
                    required
                    value={cpUsername}
                    onChange={(e) => setCpUsername(e.target.value)}
                    placeholder="e.g. admin or john@auto360.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={cpCurrentPassword}
                    onChange={(e) => setCpCurrentPassword(e.target.value)}
                    placeholder="Enter existing password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    New Secure Password
                  </label>
                  <input
                    type="password"
                    required
                    value={cpNewPassword}
                    onChange={(e) => setCpNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={cpConfirmPassword}
                    onChange={(e) => setCpConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cpLoading}
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {cpLoading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
