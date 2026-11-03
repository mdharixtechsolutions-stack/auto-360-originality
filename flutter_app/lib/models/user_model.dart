class UserModel {
  final String id;
  final String name;
  final String username;
  final String? email;
  final String? mobile;
  final String role;
  final String branch;
  final String branchId;
  final List<String> permissions;

  UserModel({
    required this.id,
    required this.name,
    required this.username,
    this.email,
    this.mobile,
    required this.role,
    required this.branch,
    required this.branchId,
    required this.permissions,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    List<String> perms = [];
    if (json['permissions'] is List) {
      perms = (json['permissions'] as List).map((e) => e.toString()).toList();
    }
    return UserModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'User',
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString(),
      mobile: json['mobile']?.toString(),
      role: json['role']?.toString() ?? 'Staff',
      branch: json['branch']?.toString() ?? 'Tiruppur',
      branchId: json['branch_id']?.toString() ?? 'BR001',
      permissions: perms,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'username': username,
    'email': email,
    'mobile': mobile,
    'role': role,
    'branch': branch,
    'branch_id': branchId,
    'permissions': permissions,
  };
}
