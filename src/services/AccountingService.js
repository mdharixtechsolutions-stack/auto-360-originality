/**
 * Centralized Single Source of Truth Accounting Service
 *
 * All components across the application (Dashboard, Reports, Customer Profile,
 * Supplier Profile, Purchase, Sales, Accounts, Payments, Binding) must consume
 * financial calculations directly from this centralized service to guarantee
 * 100% synchronization and eliminate any local calculation discrepancies.
 */

import {
  calculateVehiclePurchaseOutstanding,
  calculateDealSalesOutstanding,
  calculateCustomerTotalStats,
  calculateSupplierTotalStats,
  calculateGlobalCustomerPurchaseStats,
  calculateGlobalSupplierPurchaseStats,
  calculateGlobalCustomerSalesStats,
} from "../lib/outstandingCalculator";

export const AccountingService = {
  // Individual & Profile Calculation Methods
  calculateVehiclePurchaseOutstanding,
  calculateDealSalesOutstanding,
  calculateCustomerTotalStats,
  calculateSupplierTotalStats,

  // Global Collection Stats Methods
  calculateGlobalCustomerPurchaseStats,
  calculateGlobalSupplierPurchaseStats,
  calculateGlobalCustomerSalesStats,

  /**
   * Consolidated Financial Summary Engine
   * Generates a single, synchronized snapshot for Dashboard, Reports, Accounts,
   * Trial Balance, Balance Sheet, and Profile pages.
   */
  calculateFinancialSummary({ vehicles = [], deals = [], payments = [], vouchers = [], loans = [], expenses = [] } = {}) {
    const customerSales = calculateGlobalCustomerSalesStats(deals, payments, vouchers);
    const customerPurchases = calculateGlobalCustomerPurchaseStats(vehicles, payments, vouchers);
    const supplierPurchases = calculateGlobalSupplierPurchaseStats(vehicles, payments, vouchers);

    const totalPurchaseAmount = supplierPurchases.totalAmount + customerPurchases.totalAmount;
    const totalSalesAmount = customerSales.totalAmount;

    const customerOutstandingTotal = customerSales.outstandingAmount + customerPurchases.outstandingAmount;
    const supplierOutstandingTotal = supplierPurchases.outstandingAmount;
    const grandTotalOutstanding = customerOutstandingTotal + supplierOutstandingTotal;

    // Active Loans Summary (Binding Loans)
    const activeLoansList = (loans || []).filter((l) => l.status === "Active" && !l.isDeleted);
    const totalLoanLiability = activeLoansList.reduce((sum, l) => sum + (Number(l.dueAmount) || 0), 0);

    // Cash and Bank Balances derived from Vouchers and Payments
    const validVouchers = (vouchers || []).filter((v) => !v.isDeleted);
    const validPayments = (payments || []).filter((p) => !p.isDeleted);

    let cashInHand = 0;
    let bankBalance = 0;

    validVouchers.forEach((v) => {
      const amt = Number(v.amount) || 0;
      const isCash = v.paymentMode === "Cash" || v.ledger === "Cash Account";
      if (v.type === "Receipt" || v.type === "Credit Note") {
        if (isCash) cashInHand += amt;
        else bankBalance += amt;
      } else if (v.type === "Payment" || v.type === "Debit Note") {
        if (isCash) cashInHand -= amt;
        else bankBalance -= amt;
      }
    });

    validPayments.forEach((p) => {
      const amt = Number(p.amountPaid) || 0;
      const isCash = p.paymentMode === "Cash";
      if (p.partyType === "Customer" || p.paymentType === "Customer Payment") {
        if (isCash) cashInHand += amt;
        else bankBalance += amt;
      } else if (p.partyType === "Supplier" || p.paymentType === "Supplier Payment") {
        if (isCash) cashInHand -= amt;
        else bankBalance -= amt;
      }
    });

    return {
      customerSales,
      customerPurchases,
      supplierPurchases,
      totalPurchaseAmount,
      totalSalesAmount,
      customerOutstandingTotal,
      supplierOutstandingTotal,
      grandTotalOutstanding,
      activeLoansCount: activeLoansList.length,
      totalLoanLiability,
      cashInHand,
      bankBalance,
      totalLiquidAssets: cashInHand + bankBalance,
    };
  },
};

export default AccountingService;
