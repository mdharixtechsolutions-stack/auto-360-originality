import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, Handshake, Car, PlusCircle } from "lucide-react";
import { cn } from "../lib/utils";
import {
  calculateCustomerTotalStats,
  calculateDealSalesOutstanding,
  calculateVehiclePurchaseOutstanding
} from "../lib/outstandingCalculator";

export {
  calculateCustomerTotalStats,
  calculateDealSalesOutstanding,
  calculateVehiclePurchaseOutstanding
};

export default function CustomerProfileModal({
  selectedCustomer,
  showDetailModal,
  setShowDetailModal,
  deals = [],
  purchases = [],
  payments = [],
  vouchers = [],
  handleOpenReceiptModal
}) {
  const [detailTab, setDetailTab] = useState("sales");

  if (!showDetailModal || !selectedCustomer) return null;

  const stats = calculateCustomerTotalStats(selectedCustomer, purchases, deals, payments, vouchers);

  const custDeals = deals.filter(
    (d) =>
      !d.isDeleted &&
      (d.customerId === selectedCustomer.id ||
        d.customerId === selectedCustomer.customer_id ||
        d.customerName === selectedCustomer.customer_name ||
        d.customerName === selectedCustomer.name)
  );

  const custPurchases = purchases.filter(
    (v) =>
      !v.isDeleted &&
      (v.sellerType === "Customer" || v.purchase_type === "Customer") &&
      (v.sellerId === selectedCustomer.id ||
        v.seller_id === selectedCustomer.customer_id ||
        v.sellerName === selectedCustomer.customer_name ||
        v.sellerName === selectedCustomer.name)
  );

  const isAdvanceEntry = (item) => {
    if (!item) return false;
    if (item.isAdvance) return true;
    if (item.paymentType === "Advance Payment" || item.paymentType === "Sales Advance") return true;
    const ref = (item.referenceNo || item.id || "").toLowerCase();
    if (ref.includes("rec-adv") || ref.includes("vouch-s-")) return true;
    const narration = (item.narration || item.remarks || "").toLowerCase();
    if (narration.includes("advance") || narration.includes("booking advance")) return true;
    return false;
  };

  const salesPayments = payments.filter((pm) => {
    if (!pm || pm.isDeleted || isAdvanceEntry(pm)) return false;
    // Exclude any payments marked explicitly as Supplier or Purchase payments
    if (
      pm.partyType === "Supplier" ||
      pm.paymentType === "Supplier Payment" ||
      pm.paymentType === "Customer Purchase Payment" ||
      pm.paymentType === "Purchase Payment"
    ) return false;

    const matchParty =
      (selectedCustomer.id && pm.partyId === selectedCustomer.id) ||
      (selectedCustomer.customer_id && pm.partyId === selectedCustomer.customer_id) ||
      (pm.partyName && (pm.partyName === selectedCustomer.name || pm.partyName === selectedCustomer.customer_name));

    const matchDeal = custDeals.some((d) => (d.id && pm.dealId === d.id) || (d.vehicleId && pm.vehicleId === d.vehicleId));

    return Boolean(matchParty || matchDeal);
  });

  const purchasePayments = payments.filter((pm) => {
    if (!pm || pm.isDeleted || isAdvanceEntry(pm)) return false;
    // Must be a supplier or customer purchase payment
    const isPayout =
      pm.partyType === "Supplier" ||
      pm.paymentType === "Supplier Payment" ||
      pm.paymentType === "Customer Purchase Payment" ||
      pm.paymentType === "Purchase Payment";

    if (!isPayout) return false;

    const matchParty =
      (selectedCustomer.id && pm.partyId === selectedCustomer.id) ||
      (selectedCustomer.customer_id && pm.partyId === selectedCustomer.customer_id) ||
      (pm.partyName && (pm.partyName === selectedCustomer.name || pm.partyName === selectedCustomer.customer_name));

    const matchPurchase = custPurchases.some(
      (p) =>
        (p.purchase_id && (pm.purchaseId === p.purchase_id || pm.vehicleId === p.purchase_id)) ||
        (p.id && (pm.purchaseId === p.id || pm.vehicleId === p.id))
    );

    return Boolean(matchParty || matchPurchase);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-2 sm:p-4 my-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowDetailModal(false)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <User className="text-brand-600" size={20} />
              <h3 className="text-lg font-bold text-slate-900">
                Customer Profile #{selectedCustomer.customer_id || selectedCustomer.id}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* ID Header Profile Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
              {selectedCustomer.customer_photo ? (
                <img
                  src={selectedCustomer.customer_photo}
                  alt={selectedCustomer.customer_name || selectedCustomer.name}
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-2 border-brand-100 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-brand-50 border-2 border-brand-100 flex items-center justify-center text-brand-700 font-bold text-2xl">
                  {(selectedCustomer.customer_name || selectedCustomer.name || "C").charAt(0)}
                </div>
              )}
              <div className="text-center sm:text-left space-y-2 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xl font-bold text-slate-900">
                      {selectedCustomer.customer_name || selectedCustomer.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">
                      Mobile: {selectedCustomer.customer_mobile || selectedCustomer.mobile}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider",
                        selectedCustomer.customer_type === "Buy" || selectedCustomer.requirement === "Buy"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      )}
                    >
                      {selectedCustomer.customer_type === "Buy" || selectedCustomer.requirement === "Buy"
                        ? "Seeking to Buy (Buyer)"
                        : "Seeking to Sell (Seller)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Context Dual Profile Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setDetailTab("sales")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border outline-none",
                  detailTab === "sales"
                    ? "bg-brand-600 text-white border-brand-600 shadow-sm"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                )}
              >
                <Handshake size={15} />
                <span>Sales Deals (Buyer Context)</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    detailTab === "sales" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {custDeals.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDetailTab("purchases")}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border outline-none",
                  detailTab === "purchases"
                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                    : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                )}
              >
                <Car size={15} />
                <span>Sourced Purchases (Seller Context)</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-black",
                    detailTab === "purchases" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  )}
                >
                  {custPurchases.length}
                </span>
              </button>
            </div>

            {/* Customer Financial Metrics Box */}
            {detailTab === "sales" ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Sales Value
                  </span>
                  <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                    ₹{stats.salesTotal.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Deals Count: {stats.salesCount}
                  </span>
                </div>
                <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Advance Received
                  </span>
                  <p className="text-base font-extrabold text-emerald-900 font-mono mt-0.5">
                    ₹{stats.salesAdvance.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                    Booking Advance Amount
                  </span>
                </div>
                <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/70">
                  <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                    Subsequent Receipts
                  </span>
                  <p className="text-base font-extrabold text-teal-900 font-mono mt-0.5">
                    ₹{stats.salesPaymentsRec.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-teal-700 font-medium block mt-0.5">
                    Additional Receipts
                  </span>
                </div>
                <div className="bg-rose-50/80 p-3.5 rounded-xl border border-rose-200/80 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Remaining Sales Outstanding
                  </span>
                  <p className="text-base font-black text-rose-900 font-mono mt-0.5">
                    ₹{stats.salesOutstanding.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-rose-700 font-medium block mt-0.5">
                    {stats.salesOutstanding === 0 ? "Fully Paid" : "Balance Due from Buyer"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Purchase Value
                  </span>
                  <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                    ₹{stats.purchaseTotal.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    Vehicles Supplied: {stats.purchaseCount}
                  </span>
                </div>
                <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                    Advance Paid to Seller
                  </span>
                  <p className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
                    ₹{stats.purchaseAdvance.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-amber-700 font-medium block mt-0.5">
                    Inward Purchase Advance
                  </span>
                </div>
                <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/70">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    Subsequent Payments Made
                  </span>
                  <p className="text-base font-extrabold text-blue-900 font-mono mt-0.5">
                    ₹{stats.purchasePaymentsReceived.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-blue-700 font-medium block mt-0.5">
                    Additional Payments
                  </span>
                </div>
                <div className="bg-purple-50/80 p-3.5 rounded-xl border border-purple-200/80 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Remaining Purchase Outstanding
                  </span>
                  <p className="text-base font-black text-purple-900 font-mono mt-0.5">
                    ₹{stats.purchaseOutstanding.toLocaleString("en-IN")}
                  </p>
                  <span className="text-[10px] text-purple-700 font-medium block mt-0.5">
                    {stats.purchaseOutstanding === 0 ? "Fully Paid" : "Balance Payable to Seller"}
                  </span>
                </div>
              </div>
            )}

            {/* TAB 1 CONTENT: SALES DEALS (BUYER CONTEXT) */}
            {detailTab === "sales" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Handshake size={14} className="text-brand-600" />
                    Vehicle Sales Deals ({custDeals.length})
                  </h4>
                </div>

                {custDeals.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Invoice No</th>
                          <th className="py-2.5 px-3">Vehicle</th>
                          <th className="py-2.5 px-3 text-right">Selling Price</th>
                          <th className="py-2.5 px-3 text-right">Advance Received</th>
                          <th className="py-2.5 px-3 text-right">Outstanding</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {custDeals.map((d) => {
                          const dealStats = calculateDealSalesOutstanding(d, payments, vouchers);
                          const total = dealStats.totalSaleValue;
                          const adv = dealStats.advanceAmount;
                          const bal = dealStats.outstanding;
                          return (
                            <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                                {d.invoiceNo || d.id}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {d.vehicleName || d.regNo}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-semibold text-slate-900">
                                ₹{total.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right text-emerald-700 font-medium">
                                ₹{adv.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-600">
                                ₹{bal.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                    bal === 0
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  )}
                                >
                                  {bal === 0 ? "Fully Paid" : "Pending"}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {bal > 0 && handleOpenReceiptModal ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReceiptModal(d, bal)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-xs transition-all cursor-pointer outline-none"
                                  >
                                    <PlusCircle size={12} />
                                    <span>+ Add Receipt</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                                    Settled
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-xl">
                    <Handshake size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">No Vehicle Sales Deals Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This customer has not purchased any vehicle from your showroom yet.
                    </p>
                  </div>
                )}

                {/* Sales Payment Receipts Audit */}
                {salesPayments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Subsequent Sales Receipts Audit ({salesPayments.length})
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <tr>
                            <th className="py-2.5 px-3">Receipt No</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Vehicle</th>
                            <th className="py-2.5 px-3 text-right">Amount Received</th>
                            <th className="py-2.5 px-3">Mode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {salesPayments.map((pm) => (
                            <tr key={pm.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-indigo-600">
                                {pm.referenceNo || pm.id}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{pm.paymentDate}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium">
                                {pm.regNo || pm.vehicleName || "General"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-black text-emerald-600">
                                ₹{(Number(pm.amountPaid) || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-600">{pm.paymentMode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 CONTENT: SOURCED PURCHASES (SELLER CONTEXT) */}
            {detailTab === "purchases" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Car size={14} className="text-purple-600" />
                    Customer Sourced Vehicle Purchases ({custPurchases.length})
                  </h4>
                </div>

                {custPurchases.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Purchase ID</th>
                          <th className="py-2.5 px-3">Vehicle</th>
                          <th className="py-2.5 px-3">Reg No</th>
                          <th className="py-2.5 px-3 text-right">Purchase Price</th>
                          <th className="py-2.5 px-3 text-right">Advance Paid</th>
                          <th className="py-2.5 px-3 text-right">Outstanding</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {custPurchases.map((p) => {
                          const purStats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
                          const total = purStats.purchasePrice;
                          const adv = purStats.advancePaid;
                          const bal = purStats.outstanding;
                          return (
                            <tr key={p.id || p.purchase_id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-2.5 px-3 font-mono font-bold text-purple-600">
                                {p.purchase_id || p.id}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {p.brand} {p.name}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {p.reg_no || p.regNo || "N/A"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-semibold text-slate-900">
                                ₹{total.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right text-amber-700 font-medium">
                                ₹{adv.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-bold text-rose-600">
                                ₹{bal.toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                    bal === 0
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : "bg-purple-50 text-purple-700 border border-purple-200"
                                  )}
                                >
                                  {bal === 0 ? "Fully Paid" : "Payable"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-xl">
                    <Car size={28} className="mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-600">No Sourced Vehicle Purchases Found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This customer has not supplied or sold any pre-owned vehicles to your showroom.
                    </p>
                  </div>
                )}

                {/* Purchase Payment Entries Audit */}
                {purchasePayments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                      Subsequent Purchase Payments Audit ({purchasePayments.length})
                    </h4>
                    <div className="overflow-x-auto border border-slate-200 rounded-xl text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                          <tr>
                            <th className="py-2.5 px-3">Payment Ref</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Vehicle</th>
                            <th className="py-2.5 px-3 text-right">Amount Paid</th>
                            <th className="py-2.5 px-3">Mode</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {purchasePayments.map((pm) => (
                            <tr key={pm.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3 font-mono font-bold text-purple-600">
                                {pm.referenceNo || pm.id}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">{pm.paymentDate}</td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium">
                                {pm.regNo || pm.vehicleName || "General"}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-right font-black text-blue-600">
                                ₹{(Number(pm.amountPaid) || 0).toLocaleString("en-IN")}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-600">{pm.paymentMode}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
