import React, { useRef, useState } from "react";
import {
  X,
  Share2,
  Download,
  Phone,
  Globe,
  MessageCircle,
  Car,
  MapPin,
  FileText,
  Star,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function SalesPosterModal({ vehicle, deal, businessProfile, isOpen, onClose }) {
  const posterRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  if (!isOpen || (!vehicle && !deal)) return null;

  const v = vehicle || {};
  const d = deal || {};

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Company Branding (Loaded dynamically from Company Settings / Business Profile)
  const companyName = businessProfile?.companyName || "AUTO360 AUTO CONSULTANCY";
  const companyTagline = businessProfile?.tagline || businessProfile?.subTitle || "CERTIFIED PRE-OWNED AUTOMOBILE SHOWROOM";
  const companyLogo = businessProfile?.companyLogo || "";
  const address = businessProfile?.address || "";
  const city = businessProfile?.city || "";
  const stateVal = businessProfile?.state || "";
  const pincode = businessProfile?.pincode || "";
  const fullAddress = [address, city, stateVal, pincode].filter(Boolean).join(", ") || "Main Road Showroom, Auto Hub City";
  const mobile = businessProfile?.mobileNumber || businessProfile?.phone || "+91 98765 43210";
  const whatsapp = businessProfile?.whatsAppNumber || mobile;
  const website = businessProfile?.website || "www.auto360erp.com";

  // 2. Vehicle Details (Loaded dynamically from Purchase Record / Inventory / Deal Entry)
  const brandName = v.brand || v.brand_id || "PREMIUM VEHICLE";
  const modelName = v.name || v.vehicleName || v.vehicle_name_id || d.vehicleName || "Pre-Owned Vehicle";
  const variant = v.variant || v.vehicle_variant || v.model_details || "";
  const regNo = v.regNo || v.reg_no || d.regNo || "TN-38-XX-0000";
  const mfgYear = v.year || v.manufacturingYear || v.mfg_year || "2022";
  const fuelType = v.fuelType || v.fuel_type || "Petrol";
  const transmission = v.transmission || "Manual";
  const rawKm = v.kmDriven || v.km_driven || v.kms_driven;
  const kmDriven = rawKm ? `${Number(rawKm).toLocaleString("en-IN")} KM` : "35,000 KM";
  const price = d.sellingPrice || v.expected_selling_price || v.sellingPrice || v.purchasePrice || 450000;
  const isNegotiable = v.isNegotiable || v.negotiable || "Slightly Negotiable";
  const financeAvailable = v.financeAvailable || v.finance_available || "Bank Finance Available";

  // 3. Single Vehicle Main Image (Front image preferred, or fallback to first available image)
  const mainVehicleImage =
    v.vehicle_images?.front?.trim() ||
    v.vehicle_image?.trim() ||
    v.vehicle_images?.back?.trim() ||
    v.vehicle_images?.left?.trim() ||
    v.vehicle_images?.right?.trim() ||
    v.vehicle_images?.interior?.trim() ||
    v.vehicle_images?.engine?.trim() ||
    v.vehicle_images?.meter?.trim() ||
    v.photos?.[0]?.trim() ||
    d.vehicle_image?.trim() ||
    "";

  // 4. Formatted WhatsApp Message
  const whatsappMsg = `🚗 *${companyName.toUpperCase()}*
*${brandName.toUpperCase()} ${modelName.toUpperCase()} ${variant ? `(${variant})` : ""}*

📋 *Vehicle Specifications:*
• Registration: ${regNo}
• Model Year: ${mfgYear}
• Fuel Type: ${fuelType}
• Transmission: ${transmission}
• KM Driven: ${kmDriven}

💰 *Offer Price:* ₹${Number(price).toLocaleString("en-IN")}/- (${isNegotiable})
🏦 *Finance:* ${financeAvailable}

📍 *Location:* ${fullAddress}
📞 *Call/WhatsApp:* ${whatsapp}
🌐 *Website:* ${website}`;

  // High DPI HTML-to-Canvas Capture (renders crisp 3x resolution)
  const capturePosterCanvas = async () => {
    if (!posterRef.current) return null;
    try {
      const canvas = await html2canvas(posterRef.current, {
        scale: 3, // Crisp 300 DPI equivalent
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc, element) => {
          try {
            const styleTags = clonedDoc.querySelectorAll("style");
            styleTags.forEach((s) => {
              if (s.textContent) {
                s.textContent = s.textContent
                  .replace(/oklch\([^)]*\)/gi, "#6366f1")
                  .replace(/oklab\([^)]*\)/gi, "#6366f1")
                  .replace(/color-mix\([^)]*\)/gi, "#6366f1")
                  .replace(/light-dark\([^)]*\)/gi, "#6366f1");
              }
            });

            if (element) {
              const allEls = element.querySelectorAll("*");
              allEls.forEach((el) => {
                if (el.style && el.style.cssText) {
                  el.style.cssText = el.style.cssText
                    .replace(/oklch\([^)]*\)/gi, "#6366f1")
                    .replace(/oklab\([^)]*\)/gi, "#6366f1")
                    .replace(/color-mix\([^)]*\)/gi, "#6366f1")
                    .replace(/light-dark\([^)]*\)/gi, "#6366f1");
                }
              });
            }
          } catch (e) {
            console.warn("onclone cleanup error", e);
          }
        }
      });
      return canvas;
    } catch (err) {
      console.error("Error capturing poster canvas", err);
      return null;
    }
  };

  // BUTTON FUNCTION 1: Share Poster (ONLY opens WhatsApp share, NO download)
  const handleSharePoster = async () => {
    setIsExporting(true);
    try {
      const encoded = encodeURIComponent(whatsappMsg);
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
      showToast("WhatsApp Share Opened!");
    } catch (err) {
      console.error("Error sharing poster:", err);
      showToast("Error opening WhatsApp");
    } finally {
      setIsExporting(false);
    }
  };

  // BUTTON FUNCTION 2: Save Poster (ONLY downloads Image PNG, NO WhatsApp, NO PDF)
  const handleSavePoster = async () => {
    setIsExporting(true);
    try {
      const canvas = await capturePosterCanvas();
      if (canvas) {
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `Showroom_Poster_${brandName}_${regNo.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
        link.href = dataUrl;
        link.click();
        showToast("Poster Image Downloaded!");
      } else {
        showToast("Failed to generate poster image");
      }
    } catch (e) {
      console.error(e);
      showToast("Error downloading image");
    } finally {
      setIsExporting(false);
    }
  };

  // BUTTON FUNCTION 3: Save PDF (ONLY downloads PDF document, NO PNG download, NO WhatsApp)
  const handleSavePDF = async () => {
    setIsExporting(true);
    try {
      const canvas = await capturePosterCanvas();
      if (!canvas) {
        showToast("Failed to render PDF poster");
        setIsExporting(false);
        return;
      }

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      const pdfWidth = 210; // A4 width mm
      const pdfHeight = 297; // A4 height mm

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight]
      });

      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      const fileName = `Showroom_Poster_${brandName}_${regNo.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      pdf.save(fileName);
      showToast("PDF Poster Downloaded!");
    } catch (e) {
      console.error("PDF export error", e);
      showToast("Error downloading PDF");
    } finally {
      setIsExporting(false);
    }
  };

  // Dynamic QR Code source for inquiry
  const upiId = businessProfile?.upiId;
  const qrCodeUrl = upiId
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${price}&cu=INR`)}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Inquiry for ${brandName} ${modelName} (${regNo})`)}`)}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 text-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-extrabold text-xs flex items-center gap-2 animate-bounce border border-emerald-400">
              <CheckCircle2 size={18} />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Modal Header */}
          <div className="p-4 bg-slate-800/90 border-b border-slate-700/70 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black shadow-md">
                <MessageCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                  Share Vehicle Poster
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold">Showroom Template</span>
                </h3>
                <p className="text-xs text-slate-400">
                  {brandName} {modelName} • Reg No: <span className="font-mono text-amber-400 font-bold">{regNo}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-700/60 hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body: Left (Poster Preview) & Right (3 Action Buttons) */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

            {/* LEFT SIDE: POSTER PREVIEW */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
              <div className="w-full max-w-[480px] bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-2xl flex justify-center">
                <div
                  ref={posterRef}
                  style={{
                    width: "450px",
                    minHeight: "620px"
                  }}
                  className="relative rounded-xl overflow-hidden shadow-2xl transition-all p-5 flex flex-col justify-between select-none bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white border border-slate-800"
                >
                  {/* Decorative Frame */}
                  <div className="absolute inset-2 pointer-events-none border border-amber-500/30 rounded-lg z-0 opacity-50" />

                  <div className="relative z-10 flex flex-col h-full justify-between space-y-3">

                    {/* 1. HEADER SECTION (Company Logo & Name) */}
                    <div className="pb-3 border-b border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {companyLogo ? (
                          <img src={companyLogo} alt={companyName} className="w-12 h-12 object-contain rounded-xl bg-white p-1 shadow-md border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 via-amber-500 to-rose-600 flex items-center justify-center font-black text-white text-xl shadow-md shrink-0">
                            360
                          </div>
                        )}
                        <div>
                          <h2 className="text-base font-black uppercase tracking-wider leading-tight text-white">
                            {companyName}
                          </h2>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-amber-400">
                            {companyTagline || "CERTIFIED PRE-OWNED AUTOMOBILE SHOWROOM"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-full tracking-wider border shadow-sm inline-block bg-amber-500/20 text-amber-300 border-amber-500/40">
                          FOR SALE
                        </span>
                      </div>
                    </div>

                    {/* 2. SINGLE MAIN VEHICLE IMAGE */}
                    <div className="relative my-1 rounded-xl overflow-hidden shadow-2xl border border-slate-700/60 bg-black h-60 flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

                      {mainVehicleImage ? (
                        <img
                          src={mainVehicleImage}
                          alt={`${brandName} ${modelName}`}
                          className="w-full h-full object-cover z-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900 z-0">
                          <Car size={56} className="mb-2 opacity-30 text-amber-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Vehicle Image</span>
                        </div>
                      )}

                      {/* License Plate IND Badge */}
                      <div className="absolute top-3 left-3 z-20 bg-slate-950/90 text-white font-mono font-black text-xs px-3 py-1 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-1.5 uppercase tracking-widest backdrop-blur-md">
                        <div className="w-2 h-2 rounded-full bg-blue-500 border border-white" />
                        <span>IND</span>
                        <span className="text-amber-400">{regNo}</span>
                      </div>

                      {/* Finance Badge */}
                      <div className="absolute bottom-3 right-3 z-20 bg-amber-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-lg uppercase tracking-wider shadow-2xl flex items-center gap-1 border border-amber-300">
                        <Sparkles size={11} />
                        <span>{financeAvailable}</span>
                      </div>
                    </div>

                    {/* 3. VEHICLE TITLE */}
                    <div className="my-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span>{brandName}</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">REG: {regNo}</span>
                      </div>
                      <h3 className="text-xl font-black tracking-tight leading-tight text-white mt-0.5">
                        {modelName} {variant && <span className="text-sm font-extrabold text-amber-400 ml-1">({variant})</span>}
                      </h3>
                    </div>

                    {/* 4. KEY SPECIFICATIONS GRID */}
                    <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl border border-slate-800 text-center my-1 shadow-sm bg-slate-900/90">
                      <div>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Model Year</span>
                        <span className="text-xs font-black text-white">{mfgYear}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Fuel Type</span>
                        <span className="text-xs font-black text-white">{fuelType}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Transmission</span>
                        <span className="text-xs font-black text-white">{transmission}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase block">KM Driven</span>
                        <span className="text-xs font-black text-white">{kmDriven}</span>
                      </div>
                    </div>

                    {/* 5. OFFER PRICE BANNER */}
                    <div className="p-3.5 rounded-xl text-white flex items-center justify-between shadow-2xl my-1.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 border border-white/20">
                      <div>
                        <span className="text-[8.5px] font-black uppercase tracking-widest text-white/90 block">SHOWROOM OFFER PRICE</span>
                        <span className="text-[9.5px] font-bold text-amber-200">{isNegotiable}</span>
                      </div>
                      <span className="text-2xl font-black font-mono tracking-tight drop-shadow-lg">
                        ₹{Number(price).toLocaleString("en-IN")}/-
                      </span>
                    </div>

                    {/* 6. FOOTER CONTACT DETAILS */}
                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-[9.5px] text-slate-400">
                      <div className="space-y-1 overflow-hidden">
                        <div className="flex items-center gap-3 font-extrabold text-white">
                          <div className="flex items-center gap-1 text-amber-400">
                            <Phone size={11} />
                            <span>{mobile}</span>
                          </div>
                          <div className="flex items-center gap-1 text-emerald-400">
                            <MessageCircle size={11} />
                            <span>WA: {whatsapp}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] text-slate-400 truncate">
                          <Globe size={10} className="shrink-0 text-indigo-400" />
                          <span className="truncate">{website}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-10 h-10 bg-white rounded-lg p-0.5 shadow-md flex items-center justify-center">
                          <img src={qrCodeUrl} alt="Scan QR" className="w-full h-full object-contain" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: EXACTLY THREE ACTION BUTTONS */}
            <div className="lg:col-span-5 space-y-4 w-full">
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700/80 space-y-4 shadow-xl">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                    <span>Export & Share Poster</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Choose an action to export or share this vehicle poster.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* BUTTON 1: SHARE POSTER */}
                  <button
                    onClick={handleSharePoster}
                    disabled={isExporting}
                    className="w-full py-4 px-5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] text-white font-black text-sm rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer border border-emerald-400/30 uppercase tracking-wider"
                  >
                    <MessageCircle size={20} className="fill-white/20 stroke-[2.5]" />
                    <span>{isExporting ? "Processing..." : "Share Poster"}</span>
                  </button>

                  {/* BUTTON 2: SAVE POSTER */}
                  <button
                    onClick={handleSavePoster}
                    disabled={isExporting}
                    className="w-full py-4 px-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-[0.99] text-white font-black text-sm rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-950/40 cursor-pointer border border-indigo-400/30 uppercase tracking-wider"
                  >
                    <Download size={20} />
                    <span>{isExporting ? "Processing..." : "Save Poster"}</span>
                  </button>

                  {/* BUTTON 3: SAVE PDF */}
                  <button
                    onClick={handleSavePDF}
                    disabled={isExporting}
                    className="w-full py-4 px-5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.99] text-white font-black text-sm rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-violet-950/40 cursor-pointer border border-violet-400/30 uppercase tracking-wider"
                  >
                    <FileText size={20} />
                    <span>{isExporting ? "Processing..." : "Save PDF"}</span>
                  </button>
                </div>
              </div>
            </div>

          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
