import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Car, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles, 
  Languages,
  Clock,
  Briefcase,
  TrendingUp,
  Coins,
  Users,
  Globe,
  Layers,
  Shield,
  MapPin,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { cn } from "../lib/utils";

export default function Login({ onLogin, error, businessProfile }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCookieBlocked, setIsCookieBlocked] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  
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

  // Floating particles
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate static floating particles
    const generatedParticles = Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10,
    }));
    setParticles(generatedParticles);

    // Fetch branches
    fetch("/api/branches")
      .then((res) => {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("HTML response received instead of JSON (likely iframe cookie block)");
        }
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setBranches(data || []);
        if (data && data.length > 0) {
          setSelectedBranch(data[0].name);
        }
      })
      .catch((err) => {
        console.error("Error loading login branches", err);
        setBranches([
          { id: "BR001", name: "Coimbatore HQ" },
          { id: "BR002", name: "Chennai Elite" },
          { id: "BR003", name: "Erode Premium" },
          { id: "BR004", name: "Salem Prime" }
        ]);
        setSelectedBranch("Coimbatore HQ");
        setIsCookieBlocked(true);
      });
  }, []);

  const handleMouseMove = (e) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX - clientWidth / 2) / 35;
    const y = (e.clientY - clientHeight / 2) / 35;
    setParallax({ x, y });
  };

  const handleMouseLeave = () => {
    setParallax({ x: 0, y: 0 });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLogin(email, password, selectedBranch);
      setIsLoading(false);
    }, 1200);
  };

  const featureCards = [
    { name: "Customer Management", desc: "CRM & Lead Follow-ups", icon: Users, color: "from-blue-500 to-indigo-500" },
    { name: "Vehicle Management", desc: "Digital Cars & Bikes Registry", icon: Car, color: "from-cyan-500 to-blue-500" },
    { name: "Purchase Management", desc: "Seller Evaluation & Costing", icon: Briefcase, color: "from-amber-500 to-orange-500" },
    { name: "Sales & Commissions", desc: "Digital Agreements & Finance", icon: Coins, color: "from-emerald-500 to-teal-500" },
    { name: "Double-Entry Accounts", desc: "Real-time Ledgers & Daybooks", icon: Layers, color: "from-purple-500 to-pink-500" },
    { name: "Advanced Reports", desc: "Instant P&L & Balance Sheet", icon: TrendingUp, color: "from-indigo-500 to-purple-500" },
    { name: "Multi Language Support", desc: "Localize regional entries", icon: Globe, color: "from-rose-500 to-orange-500" },
    { name: "Dashboard Analytics", desc: "Instant Profit & Revenue Flow", icon: Shield, color: "from-teal-500 to-cyan-500" },
  ];

  return (
    <div className="min-h-screen w-full relative flex items-stretch justify-center overflow-hidden bg-[#02040a] text-slate-100 font-sans select-none">
      
      {/* CSS Keyframes for High-End Glass & Shimmer Effects */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes sweep {
          0% { transform: translateX(-150%) rotate(30deg); }
          100% { transform: translateX(250%) rotate(30deg); }
        }
        @keyframes particleUp {
          0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
        }
        .animate-float-slow {
          animation: float 8s infinite ease-in-out;
        }
        .animate-float-medium {
          animation: float 5s infinite ease-in-out;
        }
        .animate-sweep {
          animation: sweep 7s infinite ease-in-out;
        }
        .animate-particle {
          animation: particleUp linear infinite;
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .glass-panel-heavy {
          background: rgba(4, 8, 20, 0.55);
          backdrop-filter: blur(35px);
          -webkit-backdrop-filter: blur(35px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .glass-glow:focus-within {
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.3);
          border-color: rgba(59, 130, 246, 0.45);
        }
        .text-glow {
          text-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
        }
        .button-glow:hover {
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.45);
        }
      `}</style>

      {/* BACKGROUND FLOATING PARTICLES */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-blue-400 rounded-full opacity-30 animate-particle"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* SPLIT-SCREEN LAYOUT */}
      
      {/* 1. LEFT SIDE (60%): Showroom environment and feature grids */}
      <div 
        className="hidden lg:flex lg:w-[58%] xl:w-[62%] relative flex-col justify-between p-12 overflow-hidden border-r border-white/5 bg-[#030712]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* PARALLAX LEVEL 1: Deep Luxury Showroom Background Image */}
        <div 
          className="absolute inset-0 z-0 transition-transform duration-500 ease-out"
          style={{
            transform: `translate3d(${parallax.x * 0.4}px, ${parallax.y * 0.4}px, 0) scale(1.06)`,
          }}
        >
          {/* Extremely high-end auto consultancy showroom with modern glass reflections, cars, and premium lighting */}
          <img
            src="https://images.unsplash.com/photo-1562591176-a29e41492719?q=80&w=2000&auto=format&fit=crop"
            alt="AUTO360 Premium Showroom"
            className="w-full h-full object-cover filter brightness-[0.24] contrast-[1.12]"
            referrerPolicy="no-referrer"
          />
          {/* Rich gradients to paint the royal blue + orange atmosphere with glass reflection feel */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#02040a] via-[#050b1d]/90 to-blue-950/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#02040a]/40 via-transparent to-[#02040a]" />
          
          {/* LED Spotlighting overlay effects */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-500/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-12 right-1/4 w-[400px] h-[250px] bg-cyan-400/5 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[150px]" />
        </div>

        {/* TOP HEADER: Branding & System Status */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-xl shadow-blue-500/20">
              <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                <Car className="text-blue-400 fill-blue-400/10" size={22} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
                  AUTO<span className="text-blue-500 text-glow">360</span>
                </h1>
                <span className="text-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 font-bold px-2 py-0.5 rounded-full leading-none">
                  ERP
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Enterprise Suite</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-3.5 py-2 rounded-full text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-semibold tracking-wide">Showroom Hub: Connected</span>
          </div>
        </div>

        {/* CENTER CONTENT: Slogans, Features Grid & Showroom Deal Room */}
        <div className="relative z-10 my-auto grid grid-cols-1 xl:grid-cols-12 gap-10 items-center max-w-6xl mx-auto w-full py-8">
          
          {/* Text Slogan & Feature Cards Grid */}
          <div className="xl:col-span-7 space-y-7">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-500/12 to-cyan-500/12 border border-blue-500/25 rounded-full text-xs text-blue-300 font-extrabold tracking-wide uppercase"
            >
              <Sparkles size={13} className="text-cyan-400 animate-pulse" />
              <span>Commercial Grade Automotive Architecture</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-4"
            >
              <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-none">
                AUTO<span className="text-blue-500">360</span>
                <span className="block text-2xl xl:text-3xl font-bold text-slate-200 tracking-normal mt-2">
                  Auto Consultancy ERP Software
                </span>
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                Manage your entire Auto Consultancy Business from one intelligent platform. Seamlessly connect your physical showroom flooring, buyer lead pipelines, supplier purchase records, double-entry ledgers, and live transaction analytics.
              </p>
            </motion.div>

            {/* Feature Cards Grid (8 sleek transparent glass boxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3">
              {featureCards.map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 + idx * 0.05 }}
                  className="group flex gap-3.5 p-3.5 rounded-2xl glass-panel hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${feat.color} bg-opacity-10 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform`}>
                    <feat.icon className="text-white" size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 group-hover:text-blue-400 transition-colors">
                      <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                      {feat.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 group-hover:text-slate-300 transition-colors leading-normal">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* PARALLAX LEVEL 2: Interactive Deal Room Card & Consultant Visualization */}
          <div 
            className="xl:col-span-5 flex justify-center transition-transform duration-500 ease-out"
            style={{
              transform: `translate3d(${parallax.x * -0.6}px, ${parallax.y * -0.6}px, 0)`,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full max-w-sm glass-panel-heavy rounded-[32px] p-6 shadow-2xl relative overflow-hidden group hover:border-blue-500/30 transition-all border border-white/10"
            >
              {/* Gloss Reflection Sweep across the glass card */}
              <div className="absolute inset-y-0 -left-full w-2/3 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 animate-sweep pointer-events-none" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                  <Clock size={12} className="text-blue-400" />
                  Premium Showroom Live Desk
                </span>
                <span className="px-2.5 py-0.5 bg-blue-500/12 text-blue-400 text-[9px] font-black uppercase rounded-full border border-blue-500/20">
                  Negotiation Stage
                </span>
              </div>

              {/* Showroom visual context with 1 consultant, 1 customer smiling and finalizing deal */}
              <div className="space-y-4">
                
                {/* Visual Representation Cover */}
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] border border-white/5 bg-[#010204]">
                  <img
                    src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1200&auto=format&fit=crop"
                    alt="Professionals Negotiating Auto Deal"
                    className="w-full h-full object-cover opacity-60 filter brightness-90 group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040814] via-transparent to-transparent" />
                  
                  {/* Absolute layout badge overlay */}
                  <div className="absolute top-2.5 left-2.5 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[9px] text-white font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Live Deal Room #28</span>
                  </div>

                  {/* Showroom reflection floor simulation */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block leading-none">Deal Valuation</span>
                      <h4 className="text-xs font-black text-white mt-1">Mercedes-Benz G-Class AMG</h4>
                    </div>
                    <span className="text-xs font-black text-blue-400 text-glow">₹2.45 Cr</span>
                  </div>
                </div>

                {/* Consultant & Customer Dialogue Block */}
                <div className="bg-slate-950/60 rounded-2xl p-3.5 border border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-black text-xs text-white">
                        RK
                      </div>
                      <div>
                        <h5 className="text-[10px] text-slate-400 font-bold leading-none">Consultant</h5>
                        <p className="text-xs font-black text-slate-100 mt-0.5">Rajesh K. (Senior)</p>
                      </div>
                    </div>
                    <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">Smiling</span>
                  </div>

                  <div className="border-t border-white/5 pt-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-black text-xs text-white">
                        AV
                      </div>
                      <div>
                        <h5 className="text-[10px] text-slate-400 font-bold leading-none">Premium Customer</h5>
                        <p className="text-xs font-black text-slate-100 mt-0.5">Amit Verma (VIP)</p>
                      </div>
                    </div>
                    <span className="text-blue-400 text-[10px] font-bold">Approved Offer</span>
                  </div>
                </div>

                {/* Bottom Stats Grid */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-[#030611] rounded-xl p-2.5 border border-white/5">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Offer Accepted</p>
                    <p className="font-black text-slate-200 mt-0.5">₹2,42,00,000</p>
                  </div>
                  <div className="bg-[#030611] rounded-xl p-2.5 border border-white/5">
                    <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Token Received</p>
                    <p className="font-black text-emerald-400 mt-0.5">₹5,00,000</p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </div>

        {/* LEFT SIDE FOOTER */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/5 pt-4">
          <p>Powered by Harix Tech Solutions • Multi-Branch Ledger Control Enabled</p>
          <div className="flex gap-4">
            <span>ISO 27001 Certified</span>
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT SIDE (40%): Elegant Glassmorphism Floating Login Card */}
      <div className="w-full lg:w-[42%] xl:w-[38%] flex flex-col justify-between p-6 sm:p-10 md:p-12 relative bg-gradient-to-br from-[#020409] via-[#050b1d] to-[#010204]">
        
        {/* Dynamic Background Glowing Atmosphere (Orange, Cyan, Indigo) */}
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-blue-600/12 rounded-full blur-[110px] pointer-events-none z-0" />
        <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] bg-orange-500/5 rounded-full blur-[130px] pointer-events-none z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none z-0" />

        {/* TOP PANEL: Logo and Multi Language Toggle */}
        <div className="relative z-10 flex items-center justify-between lg:justify-end">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/15">
              <Car className="text-white fill-white/10" size={20} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white leading-none">
                AUTO<span className="text-blue-500 text-glow">360</span>
              </h1>
              <p className="text-[8px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">ERP Suite</p>
            </div>
          </div>

          {/* Luxury Language Picker */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-2xl text-xs text-slate-300 backdrop-blur-xl hover:border-white/20 transition-all">
            <Languages size={14} className="text-blue-400" />
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-transparent outline-none cursor-pointer text-[11px] font-bold uppercase tracking-wider text-slate-200"
            >
              <option value="en" className="bg-[#02040a] text-white">English (US)</option>
              <option value="tm" className="bg-[#02040a] text-white">தமிழ் (Tamil)</option>
              <option value="hn" className="bg-[#02040a] text-white">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>

        {/* MAIN PORTAL GLASS CARD */}
        <div className="relative z-10 my-auto w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="glass-panel-heavy rounded-[32px] p-6 sm:p-8 md:p-10 shadow-2xl shadow-black/80 overflow-hidden relative border border-white/10"
          >
            {/* Gloss Header highlight strip */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

            {/* Logo / Greeting Block */}
            <div className="text-center mb-8">
              {businessProfile?.companyLogo ? (
                <div className="w-16 h-16 mx-auto bg-white border border-white/10 rounded-2xl flex items-center justify-center shadow-xl mb-4 overflow-hidden p-1">
                  <img
                    src={businessProfile.companyLogo}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 mx-auto bg-gradient-to-tr from-blue-600 via-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-4 border border-white/10">
                  <Car className="text-white fill-white/10" size={26} />
                </div>
              )}
              
              <h2 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
                {businessProfile?.companyName ? businessProfile.companyName : "Welcome Back"}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">
                Sign in to continue to your dashboard
              </p>
            </div>

            {/* Browser Iframe Cookie Info Alert */}
            {isCookieBlocked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs rounded-2xl space-y-1"
              >
                <p className="font-extrabold uppercase tracking-wider text-[9px] text-amber-400 flex items-center gap-1.5">
                  <span>⚠️</span> PREVIEW COOKIE BLOCK DETECTED
                </p>
                <p className="leading-relaxed opacity-95 text-[11px]">
                  Your browser restricts secure authentication cookies inside embed layouts. 
                </p>
                <p className="font-bold text-amber-200 text-[11px]">
                  Please click the <span className="underline">"Open App"</span> arrow at the top right to log in inside a secure full-size browser window.
                </p>
              </motion.div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Dynamic Error Status */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold rounded-2xl flex items-center gap-2.5"
                  >
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Username / Email Address Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  Username / Email Address
                </label>
                <div className="relative glass-glow rounded-2xl border border-white/5 bg-[#03050c]/60 transition-all">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-transparent outline-none text-sm font-semibold text-white placeholder:text-slate-600 rounded-2xl"
                    placeholder="admin or name@company.com"
                  />
                </div>
              </div>

              {/* Password Input with eye toggling */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  Password
                </label>
                <div className="relative glass-glow rounded-2xl border border-white/5 bg-[#03050c]/60 transition-all">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3.5 bg-transparent outline-none text-sm font-semibold text-white placeholder:text-slate-600 rounded-2xl"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer outline-none"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Office Branch Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">
                  Assigned Branch
                </label>
                <div className="relative glass-glow rounded-2xl border border-white/5 bg-[#03050c]/60 transition-all">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <MapPin size={16} className="text-slate-400" />
                  </div>
                  <select
                    required
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 bg-transparent outline-none text-sm font-semibold text-white appearance-none cursor-pointer rounded-2xl relative"
                  >
                    <option value="" disabled className="bg-[#02040a] text-white">Select Branch Office</option>
                    <option value="All Branches" className="bg-[#02040a] text-white">All Branches (HQ Super Admin)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.name} className="bg-[#02040a] text-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 z-10">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Remember me and forgot options */}
              <div className="flex items-center justify-between pt-1 pb-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-white/10 bg-slate-950 text-blue-500 focus:ring-blue-500/30 cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                    Remember Me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenChangePassword}
                  className="text-[11px] font-extrabold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer outline-none"
                >
                  Change Password?
                </button>
              </div>

              {/* Premium Gradient Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full py-4 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-[0.995] transition-all flex items-center justify-center gap-2.5 outline-none cursor-pointer border-t border-white/15 disabled:opacity-60 group button-glow"
                )}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Authenticating JWT Token...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* BOTTOM BRAND FOOTER INFORMATION */}
        <div className="relative z-10 pt-6 text-center text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-md mx-auto w-full border-t border-white/5">
          <div>
            <span>Version 5.1.0-Enterprise</span>
            <span className="mx-2">•</span>
            <span>© Harix Tech Solutions</span>
          </div>
          <div className="space-x-3.5">
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Security policies, cookie protocols and credentials storage are set in accordance with ISO 27001 standards."); }} className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); alert("Access, licensing and operations of this platform are governed by the license agreement of AUTO360."); }} className="hover:text-slate-300 transition-colors">Terms & Conditions</a>
          </div>
        </div>

      </div>

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
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
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
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    New Password (Min 6 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={cpNewPassword}
                    onChange={(e) => setCpNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
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
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowChangePasswordModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={cpLoading}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {cpLoading ? "Updating Password..." : "Update Password"}
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
