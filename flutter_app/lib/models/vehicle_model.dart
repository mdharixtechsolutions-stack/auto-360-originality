class VehicleModel {
  final String id;
  final String? purchaseId;
  final String? purchaseDate;
  final String? regNo;
  final String? brandId;
  final String? vehicleNameId;
  final String? vehicleType;
  final String? modelYear;
  final num? vehicleCost;
  final num? netPurchaseAmount;
  final String? sellerName;
  final String? sellerMobile;
  final String? rcStatus;
  final String? branch;
  final String status;

  VehicleModel({
    required this.id,
    this.purchaseId,
    this.purchaseDate,
    this.regNo,
    this.brandId,
    this.vehicleNameId,
    this.vehicleType,
    this.modelYear,
    this.vehicleCost,
    this.netPurchaseAmount,
    this.sellerName,
    this.sellerMobile,
    this.rcStatus,
    this.branch,
    this.status = 'In Stock',
  });

  String get displayName {
    final b = brandId ?? '';
    final n = vehicleNameId ?? '';
    if (b.isEmpty && n.isEmpty) return regNo ?? 'Vehicle';
    return '$b $n'.trim();
  }

  factory VehicleModel.fromJson(Map<String, dynamic> json) {
    num? parseNum(dynamic val) {
      if (val == null) return null;
      if (val is num) return val;
      return num.tryParse(val.toString());
    }

    return VehicleModel(
      id: json['id']?.toString() ?? json['purchase_id']?.toString() ?? '',
      purchaseId: json['purchase_id']?.toString(),
      purchaseDate: json['purchase_date']?.toString(),
      regNo: json['reg_no']?.toString() ?? json['registration_number']?.toString() ?? 'NEW',
      brandId: json['brand_id']?.toString() ?? json['brand']?.toString(),
      vehicleNameId: json['vehicle_name_id']?.toString() ?? json['vehicle_name']?.toString(),
      vehicleType: json['vehicle_type']?.toString(),
      modelYear: json['model_year']?.toString() ?? json['year']?.toString(),
      vehicleCost: parseNum(json['vehicle_cost']),
      netPurchaseAmount: parseNum(json['net_purchase_amount'] ?? json['total_amount']),
      sellerName: json['seller_name']?.toString() ?? json['supplier_name']?.toString(),
      sellerMobile: json['seller_mobile']?.toString(),
      rcStatus: json['rc_status']?.toString() ?? 'Pending',
      branch: json['branch']?.toString() ?? 'Tiruppur',
      status: json['status']?.toString() ?? 'In Stock',
    );
  }
}
