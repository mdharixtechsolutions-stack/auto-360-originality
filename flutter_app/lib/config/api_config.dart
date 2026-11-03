class ApiConfig {
  // Production server URL for Auto 360
  static const String baseUrl = 'https://auto360.harixtechsolutions.com/api';
  
  // Timeout settings for smooth responsiveness
  static const Duration connectTimeout = Duration(seconds: 12);
  static const Duration receiveTimeout = Duration(seconds: 15);

  // Endpoints
  static const String login = '$baseUrl/login';
  static const String verifySession = '$baseUrl/auth/verify';
  static const String branches = '$baseUrl/branches';
  static const String dashboardOutstanding = '$baseUrl/dashboard/outstanding';
  static const String purchases = '$baseUrl/purchases';
  static const String customers = '$baseUrl/customers';
  static const String deals = '$baseUrl/deals';
  static const String expenses = '$baseUrl/expenses';
  static const String search = '$baseUrl/search';
  static const String businessProfile = '$baseUrl/settings/profile';
}
