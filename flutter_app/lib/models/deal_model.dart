class DealModel {
  final String id;
  final String? dealDate;
  final String? customerName;
  final String? customerMobile;
  final String? vehicleName;
  final String? regNo;
  final num? saleAmount;
  final num? receivedAmount;
  final num? balanceAmount;
  final String status;
  final String? branch;

  DealModel({
    required this.id,
    this.dealDate,
    this.customerName,
    this.customerMobile,
    this.vehicleName,
    this.regNo,
    this.saleAmount,
    this.receivedAmount,
    this.balanceAmount,
    this.status = 'Completed',
    this.branch,
  });

  factory DealModel.fromJson(Map<String, dynamic> json) {
    num? parseNum(dynamic val) {
      if (val == null) return null;
      if (val is num) return val;
      return num.tryParse(val.toString());
    }

    return DealModel(
      id: json['deal_id']?.toString() ?? json['id']?.toString() ?? '',
      dealDate: json['deal_date']?.toString() ?? json['date']?.toString(),
      customerName: json['customer_name']?.toString() ?? json['buyer_name']?.toString() ?? 'Buyer',
      customerMobile: json['customer_mobile']?.toString(),
      vehicleName: json['vehicle_name']?.toString() ?? json['vehicle_name_id']?.toString() ?? 'Vehicle',
      regNo: json['reg_no']?.toString(),
      saleAmount: parseNum(json['sale_amount'] ?? json['total_amount']),
      receivedAmount: parseNum(json['received_amount'] ?? json['advance_amount']),
      balanceAmount: parseNum(json['balance_amount'] ?? json['outstanding_amount']),
      status: json['status']?.toString() ?? 'Completed',
      branch: json['branch']?.toString() ?? 'Tiruppur',
    );
  }
}
