import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import '../models/dashboard_metrics.dart';
import '../models/vehicle_model.dart';
import '../models/customer_model.dart';
import '../models/deal_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  UserModel? _currentUser;
  String _activeBranch = 'Tiruppur';

  UserModel? get currentUser => _currentUser;
  String get activeBranch => _activeBranch;
  String? get token => _token;
  bool get isAuthenticated => _token != null && _currentUser != null;

  void setActiveBranch(String branch) {
    _activeBranch = branch;
  }

  Map<String, String> _headers() {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-user-branch': _activeBranch,
    };
    if (_token != null && _token!.isNotEmpty) {
      map['Authorization'] = 'Bearer $_token';
    }
    if (_currentUser != null) {
      map['x-user-id'] = _currentUser!.id;
      map['x-user-role'] = _currentUser!.role;
    }
    return map;
  }

  // Initialize from local storage on app launch
  Future<bool> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');
    _activeBranch = prefs.getString('active_branch') ?? 'Tiruppur';
    final userJson = prefs.getString('user_profile');

    if (_token != null && userJson != null) {
      try {
        _currentUser = UserModel.fromJson(jsonDecode(userJson));
        // Verify with server in background
        verifySession();
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  }

  // Login
  Future<Map<String, dynamic>> login(String username, String password, {String? branch}) async {
    try {
      final res = await http.post(
        Uri.parse(ApiConfig.login),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username.trim(),
          'password': password,
          'branch': branch ?? _activeBranch,
        }),
      ).timeout(ApiConfig.connectTimeout);

      final data = jsonDecode(res.body);

      if (res.statusCode == 200 && data['success'] == true) {
        _token = data['token'];
        _currentUser = UserModel.fromJson(data['user']);
        if (branch != null) _activeBranch = branch;

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token!);
        await prefs.setString('active_branch', _activeBranch);
        await prefs.setString('user_profile', jsonEncode(data['user']));

        return {'success': true, 'user': _currentUser};
      } else {
        return {
          'success': false,
          'error': data['error'] ?? 'Invalid username or password',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Connection failed. Please check internet connection: ${e.toString()}',
      };
    }
  }

  // Verify Session Token
  Future<bool> verifySession() async {
    if (_token == null) return false;
    try {
      final res = await http.get(
        Uri.parse(ApiConfig.verifySession),
        headers: _headers(),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['valid'] == true && data['user'] != null) {
          _currentUser = UserModel.fromJson(data['user']);
          return true;
        }
      }
      return false;
    } catch (_) {
      return true; // Keep cached session on transient network error
    }
  }

  // Get Branches List
  Future<List<Map<String, dynamic>>> getBranches() async {
    try {
      final res = await http.get(
        Uri.parse(ApiConfig.branches),
        headers: _headers(),
      ).timeout(ApiConfig.connectTimeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data is List) {
          return List<Map<String, dynamic>>.from(data);
        }
      }
    } catch (_) {}
    return [
      {'id': 'BR001', 'name': 'Tiruppur'},
      {'id': 'BR002', 'name': 'Coimbatore'},
    ];
  }

  // Get Dashboard Outstanding & Metrics
  Future<DashboardMetrics> getDashboardMetrics() async {
    try {
      final res = await http.get(
        Uri.parse(ApiConfig.dashboardOutstanding),
        headers: _headers(),
      ).timeout(ApiConfig.connectTimeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data is Map<String, dynamic>) {
          return DashboardMetrics.fromJson(data);
        }
      }
    } catch (_) {}
    return DashboardMetrics();
  }

  // Get Purchases / Vehicles
  Future<List<VehicleModel>> getPurchases({String? search}) async {
    try {
      String url = '${ApiConfig.purchases}?limit=50';
      if (search != null && search.isNotEmpty) {
        url += '&search=${Uri.encodeComponent(search)}';
      }
      final res = await http.get(
        Uri.parse(url),
        headers: _headers(),
      ).timeout(ApiConfig.receiveTimeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data is Map && data['data'] is List)
            ? data['data'] as List
            : (data is List ? data : []);

        return list.map((e) => VehicleModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  // Get Customers
  Future<List<CustomerModel>> getCustomers({String? search}) async {
    try {
      String url = '${ApiConfig.customers}?limit=50';
      if (search != null && search.isNotEmpty) {
        url += '&search=${Uri.encodeComponent(search)}';
      }
      final res = await http.get(
        Uri.parse(url),
        headers: _headers(),
      ).timeout(ApiConfig.receiveTimeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data is Map && data['data'] is List)
            ? data['data'] as List
            : (data is List ? data : []);

        return list.map((e) => CustomerModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  // Get Deals / Sales
  Future<List<DealModel>> getDeals({String? search}) async {
    try {
      String url = '${ApiConfig.deals}?limit=50';
      if (search != null && search.isNotEmpty) {
        url += '&search=${Uri.encodeComponent(search)}';
      }
      final res = await http.get(
        Uri.parse(url),
        headers: _headers(),
      ).timeout(ApiConfig.receiveTimeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data is Map && data['data'] is List)
            ? data['data'] as List
            : (data is List ? data : []);

        return list.map((e) => DealModel.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (_) {}
    return [];
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_profile');
  }
}
