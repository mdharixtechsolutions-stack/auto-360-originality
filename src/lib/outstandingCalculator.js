/**
 * Single Source of Truth Business & Accounting Calculation Engine
 * Powering Dashboard, Reports, Customer Profile, Supplier Profile,
 * Outstanding Summary, Payment Screen, Vehicle Details, and Accounts.
 */

// 1. Calculate Single Vehicle Purchase Outstanding (Customer or Supplier)
export function calculateVehiclePurchaseOutstanding(purchase, payments = [], vouchers = []) {
  if (!purchase) return { purchasePrice: 0, advancePaid: 0, balanceAmount: 0, paymentReceived: 0, paidAmount: 0, totalPaidSoFar: 0, outstanding: 0, lastPaymentDate: "N/A", isFullyPaid: true, status: "Paid" };

  const purchasePrice = Number(purchase.purchasePrice || purchase.purchase_price) || 0;
  const advancePaid = Number(
    purchase.advance_price !== undefined && purchase.advance_price !== null && purchase.advance_price !== ""
      ? purchase.advance_price
      : (purchase.advancePaid !== undefined && purchase.advancePaid !== null && purchase.advancePaid !== ""
          ? purchase.advancePaid
          : (purchase.advance_amount !== undefined && purchase.advance_amount !== null && purchase.advance_amount !== ""
              ? purchase.advance_amount
              : (purchase.advanceAmount !== undefined && purchase.advanceAmount !== null && purchase.advanceAmount !== ""
                  ? purchase.advanceAmount
                  : 0)))
  ) || 0;

  const initialBalance = Math.max(0, purchasePrice - advancePaid);
  const isCustSourced = purchase.sellerType === "Customer" || purchase.purchase_type === "Customer";

  const isAdvanceEntry = (item) => {
    if (!item) return false;
    if (item.isAdvance) return true;
    if (item.paymentType === "Advance Payment" || item.paymentType === "Purchase Advance" || item.paymentType === "Supplier Advance") return true;
    const ref = (item.referenceNo || item.id || "").toLowerCase();
    if (ref.includes("pay-adv") || ref.includes("vouch-p-") || ref.includes("rec-adv")) return true;
    const narration = (item.narration || item.remarks || "").toLowerCase();
    if (narration.includes("advance") || narration.includes("booking advance")) return true;
    return false;
  };

  // Payments matching this vehicle purchase (STRICTLY ISOLATED BY SOURCE & VEHICLE ID)
  const pPayments = (payments || []).filter((pm) => {
    if (pm.isDeleted) return false;
    if (
      pm.partyType === "Loan" ||
      pm.paymentType === "Loan Payment" ||
      pm.partyType === "Binding Loan" ||
      pm.partyType === "Financier" ||
      pm.isLoan
    ) return false;

    // Filter out initial advance entry from subsequent payments
    if (isAdvanceEntry(pm)) return false;

    // Source isolation: Customer-sourced vs Supplier-sourced isolation
    if (isCustSourced) {
      if (pm.partyType === "Supplier" || pm.paymentType === "Supplier Payment") return false;
    } else {
      if (pm.partyType === "Customer" && pm.paymentType !== "Customer Purchase Payment" && pm.paymentType !== "Supplier Payment") return false;
    }

    const hasSpecificVehId = Boolean(pm.vehicleId || pm.purchaseId);
    if (hasSpecificVehId) {
      return (
        (purchase.purchase_id && (pm.vehicleId === purchase.purchase_id || pm.purchaseId === purchase.purchase_id)) ||
        (purchase.id && (pm.vehicleId === purchase.id || pm.purchaseId === purchase.id))
      );
    }

    const matchReg = purchase.reg_no && pm.regNo && pm.regNo.trim().toLowerCase() === purchase.reg_no.trim().toLowerCase();
    return Boolean(matchReg);
  });

  const pmPaid = pPayments.reduce((acc, pm) => acc + (Number(pm.amountPaid) || 0), 0);

  // Vouchers matching this vehicle
  const vPaid = (vouchers || [])
    .filter((v) => {
      if (v.isDeleted) return false;
      if (isAdvanceEntry(v)) return false;
      const isPaymentType = v.type === "Payment" || v.type === "Debit Note";
      const isAlreadyInPayments = pPayments.some(
        (pm) => pm.id === v.id || (v.narration && pm.referenceNo && v.narration.includes(pm.referenceNo))
      );
      const isAutoCreatedPurchase = v.narration && v.narration.toLowerCase().includes("auto-created purchase");
      const isExpenseOrLoanLedger = [
        "Vehicle Maintenance", "Fuel Expense", "Insurance Expense", "RTO / Registration Expense",
        "Direct Expenses", "Indirect Expenses", "Salaries Account", "Office Rent Account", "Marketing Expense",
        "Loans (Liability)", "Loan Account", "Vehicle Loan Account", "Loan Interest Expense", "Loan Processing Charges",
        "Purchase Accounts"
      ].includes(v.ledger) || (v.narration && v.narration.toLowerCase().includes("loan"));

      if (!isPaymentType || isAlreadyInPayments || isExpenseOrLoanLedger || isAutoCreatedPurchase) return false;

      const hasSpecificVehId = Boolean(v.vehicleId);
      if (hasSpecificVehId) {
        return (
          (purchase.purchase_id && v.vehicleId === purchase.purchase_id) ||
          (purchase.id && v.vehicleId === purchase.id)
        );
      }

      const matchReg = purchase.reg_no && v.regNo && v.regNo.trim().toLowerCase() === purchase.reg_no.trim().toLowerCase();
      return Boolean(matchReg);
    })
    .reduce((acc, v) => acc + (Number(v.amount) || 0), 0);

  const vCred = (vouchers || [])
    .filter((v) => {
      if (v.isDeleted) return false;
      const matchId =
        (purchase.purchase_id && v.vehicleId === purchase.purchase_id) ||
        (purchase.id && v.vehicleId === purchase.id);
      const matchReg = purchase.reg_no && v.regNo && v.regNo.trim().toLowerCase() === purchase.reg_no.trim().toLowerCase();
      return (matchId || matchReg) && v.type === "Credit Note";
    })
    .reduce((acc, v) => acc + (Number(v.amount) || 0), 0);

  const paymentReceived = Math.max(0, pmPaid + vPaid - vCred);
  const totalPaidSoFar = Math.min(purchasePrice, advancePaid + paymentReceived);
  const outstanding = Math.max(0, purchasePrice - totalPaidSoFar);

  let lastPaymentDate = "N/A";
  if (pPayments.length > 0) {
    const dates = pPayments.map((p) => p.paymentDate || p.date).filter(Boolean);
    if (dates.length > 0) {
      lastPaymentDate = dates.sort().reverse()[0];
    }
  }

  return {
    purchasePrice,
    advancePaid,
    balanceAmount: initialBalance,
    paymentReceived,
    paidAmount: totalPaidSoFar,
    totalPaidSoFar,
    outstanding,
    lastPaymentDate,
    isFullyPaid: outstanding === 0,
    status: outstanding === 0 ? "Paid" : (totalPaidSoFar > 0 ? "Partially Paid" : "Pending")
  };
}

// 2. Calculate Single Sales Deal Outstanding (Customer Deal)
export function calculateDealSalesOutstanding(deal, payments = [], vouchers = []) {
  if (!deal) return { sellingPrice: 0, consultancyFees: 0, totalSaleValue: 0, advanceAmount: 0, paymentReceived: 0, paidAmount: 0, totalReceived: 0, outstanding: 0, isFullyPaid: true };

  const sellingPrice = Number(deal.sellingPrice || deal.selling_price) || 0;
  const consultancyFees = Number(deal.consultancyFees || deal.consultancy_fees || deal.consultancyFee) || 0;
  // Total Sales Price / Total Value = Selling Price + Consultancy Fees
  const totalSaleValue = sellingPrice + consultancyFees;

  const advanceAmount = Number(
    deal.advanceAmount !== undefined && deal.advanceAmount !== null && deal.advanceAmount !== ""
      ? deal.advanceAmount
      : (deal.advance_amount !== undefined && deal.advance_amount !== null && deal.advance_amount !== ""
          ? deal.advance_amount
          : (deal.advance_price !== undefined && deal.advance_price !== null && deal.advance_price !== ""
              ? deal.advance_price
              : (deal.advancePaid !== undefined && deal.advancePaid !== null && deal.advancePaid !== ""
                  ? deal.advancePaid
                  : (deal.paidAmount || 0))))
  ) || 0;

  const settlementType = deal.settlementType || (deal.balanceAmount === 0 ? "Fully Paid" : "Customer Balance Pending");

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

  const dPayments = (payments || []).filter((pm) => {
    if (pm.isDeleted) return false;
    if (
      pm.partyType === "Supplier" ||
      pm.paymentType === "Supplier Payment" ||
      pm.paymentType === "Purchase Payment" ||
      pm.partyType === "Loan" ||
      pm.paymentType === "Loan Payment" ||
      pm.partyType === "Binding Loan" ||
      pm.partyType === "Financier" ||
      pm.isLoan
    ) return false;
    if (isAdvanceEntry(pm)) return false;
    const matchDeal = deal.id && pm.dealId === deal.id;
    const matchVeh = deal.vehicleId && pm.vehicleId === deal.vehicleId;
    return Boolean(matchDeal || matchVeh);
  });

  const pmRec = dPayments.reduce((acc, pm) => acc + (Number(pm.amountPaid) || 0), 0);

  const vRec = (vouchers || [])
    .filter((v) => {
      if (v.isDeleted) return false;
      if (isAdvanceEntry(v)) return false;
      const matchVeh = deal.vehicleId && v.vehicleId === deal.vehicleId;
      const matchNarration = deal.id && v.narration && v.narration.includes(deal.id);
      const isReceiptType = v.type === "Receipt" || v.type === "Credit Note";
      const isAlreadyInPayments = dPayments.some(
        (pm) => pm.id === v.id || (v.narration && pm.referenceNo && v.narration.includes(pm.referenceNo))
      );
      const isSalesOrCust = v.ledger === "Sales Account" || v.ledger === "Customer Accounts" || (v.ledger && v.ledger.toLowerCase().includes("customer"));
      const isLoanLedger = ["Loans (Liability)", "Loan Account", "Vehicle Loan Account"].includes(v.ledger) || (v.narration && v.narration.toLowerCase().includes("loan"));

      return (matchVeh || matchNarration) && isReceiptType && !isAlreadyInPayments && isSalesOrCust && !isLoanLedger;
    })
    .reduce((acc, v) => acc + (Number(v.amount) || 0), 0);

  const paymentReceived = pmRec + vRec;
  let totalReceived = advanceAmount + paymentReceived;
  let outstanding = Math.max(0, totalSaleValue - totalReceived);

  if (settlementType === "Finance Settlement") {
    totalReceived = totalSaleValue;
    outstanding = 0;
  }

  return {
    sellingPrice,
    consultancyFees,
    totalSaleValue,
    advanceAmount,
    paymentReceived,
    paidAmount: totalReceived,
    totalReceived,
    outstanding,
    isFullyPaid: outstanding === 0,
    status: outstanding === 0 ? "Fully Paid" : "Customer Balance Pending"
  };
}

// 3. Customer Combined Profile Stats (Sales Deals + Customer Sourced Purchases)
export function calculateCustomerTotalStats(customer, purchases = [], deals = [], payments = [], vouchers = []) {
  if (!customer) return { salesOutstanding: 0, purchaseOutstanding: 0, totalOutstanding: 0, salesCount: 0, purchaseCount: 0 };

  const cId = customer.id || customer.customer_id;
  const cName = (customer.customer_name || customer.name || "").trim().toLowerCase();

  // Customer Sales Deals
  const customerDeals = (deals || []).filter((d) => {
    if (d.isDeleted || d.type !== "Sell") return false;
    const matchId = cId && (d.customerId === cId || d.customerId === customer.customer_id);
    const matchName = cName && d.customerName && d.customerName.trim().toLowerCase() === cName;
    return Boolean(matchId || matchName);
  });

  let salesTotal = 0;
  let salesAdvance = 0;
  let salesPaymentsRec = 0;
  let salesOutstanding = 0;

  customerDeals.forEach((d) => {
    const res = calculateDealSalesOutstanding(d, payments, vouchers);
    salesTotal += res.totalSaleValue;
    salesAdvance += res.advanceAmount;
    salesPaymentsRec += res.paymentReceived;
    salesOutstanding += res.outstanding;
  });

  // Customer Purchases (Vehicles sold by Customer to us)
  const customerPurchases = (purchases || []).filter((p) => {
    if (p.isDeleted) return false;
    const isCustSourced = p.sellerType === "Customer" || p.purchase_type === "Customer";
    if (!isCustSourced) return false;
    const matchId = cId && (p.sellerId === cId || p.seller_id === cId || p.supplier_id === cId);
    const matchName = cName && ((p.sellerName && p.sellerName.trim().toLowerCase() === cName) || (p.customerName && p.customerName.trim().toLowerCase() === cName));
    return Boolean(matchId || matchName);
  });

  let purchaseTotal = 0;
  let purchaseAdvance = 0;
  let purchasePaymentsReceived = 0;
  let purchaseOutstanding = 0;

  customerPurchases.forEach((p) => {
    const res = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
    purchaseTotal += res.purchasePrice;
    purchaseAdvance += res.advancePaid;
    purchasePaymentsReceived += res.paymentReceived;
    purchaseOutstanding += res.outstanding;
  });

  return {
    customer,
    salesTotal,
    salesAdvance,
    salesPaymentsRec,
    salesOutstanding,
    salesCount: customerDeals.length,
    purchaseTotal,
    purchaseAdvance,
    purchasePaymentsReceived,
    purchaseOutstanding,
    purchaseCount: customerPurchases.length,
    totalOutstanding: salesOutstanding + purchaseOutstanding
  };
}

// 4. Supplier Profile Stats (STRICTLY SUPPLIER SOURCED PURCHASES ONLY)
export function calculateSupplierTotalStats(supplier, purchases = [], payments = [], vouchers = []) {
  if (!supplier) return { totalPurchaseAmount: 0, totalAdvancePaid: 0, totalPaymentReceived: 0, totalOutstanding: 0, count: 0, supplierPurchases: [] };

  const sId = supplier.id || supplier.supplier_id;
  const sName = (supplier.supplier_name || supplier.name || "").trim().toLowerCase();

  // MUST EXCLUDE CUSTOMER SOURCED PURCHASES STRICTLY
  const supplierPurchases = (purchases || []).filter((p) => {
    if (p.isDeleted) return false;
    const isCustomerSourced = p.sellerType === "Customer" || p.purchase_type === "Customer";
    if (isCustomerSourced) return false; // STRICT RULE: Never include Customer Purchased Vehicles

    const matchId = sId && (p.supplier_id === sId || p.sellerId === sId);
    const matchName = sName && (
      (p.sellerName && p.sellerName.trim().toLowerCase() === sName) ||
      (p.supplierName && p.supplierName.trim().toLowerCase() === sName)
    );
    return Boolean(matchId || matchName);
  });

  let totalPurchaseAmount = 0;
  let totalAdvancePaid = 0;
  let totalPaymentReceived = 0;
  let totalOutstanding = 0;

  const itemsWithStats = supplierPurchases.map((p) => {
    const stats = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
    totalPurchaseAmount += stats.purchasePrice;
    totalAdvancePaid += stats.advancePaid;
    totalPaymentReceived += stats.paymentReceived;
    totalOutstanding += stats.outstanding;
    return {
      ...p,
      stats
    };
  });

  return {
    supplier,
    totalPurchaseAmount,
    totalAdvancePaid,
    totalPaymentReceived,
    totalOutstanding,
    count: supplierPurchases.length,
    supplierPurchases: itemsWithStats
  };
}

// 5. Global Customer Purchase Stats (All Customer Purchases across System)
export function calculateGlobalCustomerPurchaseStats(vehicles = [], payments = [], vouchers = []) {
  const customerPurchases = (vehicles || []).filter(
    (v) => !v.isDeleted && (v.sellerType === "Customer" || v.purchase_type === "Customer")
  );

  let totalAmount = 0;
  let advancePaid = 0;
  let paymentsReceived = 0;
  let outstandingAmount = 0;
  let pendingCount = 0;

  customerPurchases.forEach((p) => {
    const res = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
    totalAmount += res.purchasePrice;
    advancePaid += res.advancePaid;
    paymentsReceived += res.paymentReceived;
    outstandingAmount += res.outstanding;
    if (res.outstanding > 0) pendingCount++;
  });

  return {
    totalAmount,
    advancePaid,
    paymentsReceived,
    paidAmount: advancePaid + paymentsReceived,
    outstandingAmount,
    count: pendingCount,
    total: outstandingAmount
  };
}

// 6. Global Supplier Purchase Stats (All Supplier Purchases across System)
export function calculateGlobalSupplierPurchaseStats(vehicles = [], payments = [], vouchers = []) {
  const supplierPurchases = (vehicles || []).filter(
    (v) => !v.isDeleted && v.sellerType !== "Customer" && v.purchase_type !== "Customer"
  );

  let totalAmount = 0;
  let advancePaid = 0;
  let paymentsReceived = 0;
  let outstandingAmount = 0;
  let pendingCount = 0;

  supplierPurchases.forEach((p) => {
    const res = calculateVehiclePurchaseOutstanding(p, payments, vouchers);
    totalAmount += res.purchasePrice;
    advancePaid += res.advancePaid;
    paymentsReceived += res.paymentReceived;
    outstandingAmount += res.outstanding;
    if (res.outstanding > 0) pendingCount++;
  });

  return {
    totalAmount,
    advancePaid,
    paymentsReceived,
    paidAmount: advancePaid + paymentsReceived,
    outstandingAmount,
    count: pendingCount,
    total: outstandingAmount
  };
}

// 7. Global Customer Sales Deals Stats
export function calculateGlobalCustomerSalesStats(deals = [], payments = [], vouchers = []) {
  const salesDeals = (deals || []).filter((d) => !d.isDeleted && d.type === "Sell");

  let totalAmount = 0;
  let receivedAmount = 0;
  let outstandingAmount = 0;
  let pendingCount = 0;

  salesDeals.forEach((d) => {
    const res = calculateDealSalesOutstanding(d, payments, vouchers);
    totalAmount += res.totalSaleValue;
    receivedAmount += res.totalReceived;
    outstandingAmount += res.outstanding;
    if (res.outstanding > 0) pendingCount++;
  });

  return {
    totalAmount,
    receivedAmount,
    outstandingAmount,
    count: pendingCount,
    total: outstandingAmount
  };
}

export const AccountingService = {
  calculateVehiclePurchaseOutstanding,
  calculateDealSalesOutstanding,
  calculateCustomerTotalStats,
  calculateSupplierTotalStats,
  calculateGlobalCustomerPurchaseStats,
  calculateGlobalSupplierPurchaseStats,
  calculateGlobalCustomerSalesStats
};

export default AccountingService;
