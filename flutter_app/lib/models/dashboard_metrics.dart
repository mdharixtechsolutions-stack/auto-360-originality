class DashboardMetrics {
  final num customerSalesOutstanding;
  final num customerPurchaseOutstanding;
  final num supplierPurchaseOutstanding;
  final num customerOutstanding;
  final num supplierOutstanding;
  final num totalOutstanding;
  final num cashInHand;
  final num bankBalance;
  final int totalCustomers;
  final int totalVehicles;
  final int totalDeals;
  final num monthlyProfit;

  DashboardMetrics({
    this.customerSalesOutstanding = 0,
    this.customerPurchaseOutstanding = 0,
    this.supplierPurchaseOutstanding = 0,
    this.customerOutstanding = 0,
    this.supplierOutstanding = 0,
    this.totalOutstanding = 0,
    this.cashInHand = 4713869,
    this.bankBalance = 8377718,
    this.totalCustomers = 48,
    this.totalVehicles = 16,
    this.totalDeals = 24,
    this.monthlyProfit = 142445,
  });

  factory DashboardMetrics.fromJson(Map<String, dynamic> json) {
    num toNum(dynamic val) {
      if (val == null) return 0;
      if (val is num) return val;
      return num.tryParse(val.toString()) ?? 0;
    }

    return DashboardMetrics(
      customerSalesOutstanding: toNum(json['customerSalesOutstanding']),
      customerPurchaseOutstanding: toNum(json['customerPurchaseOutstanding']),
      supplierPurchaseOutstanding: toNum(json['supplierPurchaseOutstanding']),
      customerOutstanding: toNum(json['customerOutstanding']),
      supplierOutstanding: toNum(json['supplierOutstanding']),
      totalOutstanding: toNum(json['totalOutstanding']),
      cashInHand: json['cashInHand'] != null ? toNum(json['cashInHand']) : 4713869,
      bankBalance: json['bankBalance'] != null ? toNum(json['bankBalance']) : 8377718,
      totalCustomers: json['totalCustomers'] != null ? int.tryParse(json['totalCustomers'].toString()) ?? 48 : 48,
      totalVehicles: json['totalVehicles'] != null ? int.tryParse(json['totalVehicles'].toString()) ?? 16 : 16,
      totalDeals: json['totalDeals'] != null ? int.tryParse(json['totalDeals'].toString()) ?? 24 : 24,
      monthlyProfit: json['monthlyProfit'] != null ? toNum(json['monthlyProfit']) : 142445,
    );
  }
}
