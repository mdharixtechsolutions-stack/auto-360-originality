class CustomerModel {
  final String id;
  final String name;
  final String mobile;
  final String? customerType;
  final String? status;
  final String? address;
  final String? preferredVehicle;
  final num? outstanding;

  CustomerModel({
    required this.id,
    required this.name,
    required this.mobile,
    this.customerType,
    this.status,
    this.address,
    this.preferredVehicle,
    this.outstanding,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    num? parseNum(dynamic val) {
      if (val == null) return null;
      if (val is num) return val;
      return num.tryParse(val.toString());
    }

    return CustomerModel(
      id: json['customer_id']?.toString() ?? json['id']?.toString() ?? '',
      name: json['customer_name']?.toString() ?? json['name']?.toString() ?? 'Customer',
      mobile: json['customer_mobile']?.toString() ?? json['mobile']?.toString() ?? '',
      customerType: json['customer_type']?.toString() ?? 'Buyer',
      status: json['customer_status']?.toString() ?? json['status']?.toString() ?? 'Active',
      address: json['address']?.toString(),
      preferredVehicle: json['preferred_vehicle']?.toString(),
      outstanding: parseNum(json['outstanding'] ?? json['balance']),
    );
  }
}
