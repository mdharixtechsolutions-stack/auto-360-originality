import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/dashboard_metrics.dart';
import '../models/vehicle_model.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/safe_toast.dart';
import '../widgets/search_bar_widget.dart';
import '../widgets/stat_card.dart';

class DashboardScreen extends StatefulWidget {
  final Function(int)? onNavigateTab;

  const DashboardScreen({super.key, this.onNavigateTab});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _searchController = TextEditingController();
  DashboardMetrics _metrics = DashboardMetrics();
  List<VehicleModel> _recentVehicles = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);

    final metrics = await ApiService().getDashboardMetrics();
    final vehicles = await ApiService().getPurchases();

    if (mounted) {
      setState(() {
        _metrics = metrics;
        _recentVehicles = vehicles.take(5).toList();
        _isLoading = false;
      });
    }
  }

  void _showBranchPicker() async {
    final branches = await ApiService().getBranches();
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Switch Active Branch',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 16),
              ...branches.map((b) {
                final name = b['name']?.toString() ?? 'Branch';
                final isSelected = ApiService().activeBranch == name;
                return ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.primary : AppTheme.surfaceVariant,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      Icons.storefront_rounded,
                      color: isSelected ? Colors.white : AppTheme.textSecondary,
                      size: 20,
                    ),
                  ),
                  title: Text(
                    '$name Branch',
                    style: GoogleFonts.inter(
                      fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                      color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                    ),
                  ),
                  trailing: isSelected ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary) : null,
                  onTap: () {
                    ApiService().setActiveBranch(name);
                    Navigator.pop(ctx);
                    SafeToast.show(context, 'Switched to $name Branch', type: ToastType.info);
                    _loadDashboardData();
                  },
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ApiService().currentUser;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _loadDashboardData,
          color: AppTheme.primary,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Header: User Greeting & Branch Pill
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                'AUTO 360',
                                style: GoogleFonts.inter(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  color: AppTheme.darkNavy,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppTheme.emerald,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            user?.name ?? 'Admin Portal',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Branch Selector Pill
                    GestureDetector(
                      onTap: _showBranchPicker,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppTheme.cardBorder),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.storefront_rounded, size: 14, color: AppTheme.primary),
                            const SizedBox(width: 6),
                            Text(
                              ApiService().activeBranch,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(width: 4),
                            const Icon(Icons.arrow_drop_down_rounded, size: 18, color: AppTheme.textMuted),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Global Search Bar
                SearchBarWidget(
                  controller: _searchController,
                  hintText: 'Search Vehicles, Deals, Invoices...',
                  onChanged: (val) {
                    setState(() {});
                  },
                ),

                const SizedBox(height: 18),

                // Quick Action Shortcuts Bar
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildQuickAction(
                        label: 'Vehicles',
                        icon: Icons.directions_car_rounded,
                        color: AppTheme.primary,
                        onTap: () => widget.onNavigateTab?.call(1),
                      ),
                      const SizedBox(width: 10),
                      _buildQuickAction(
                        label: 'Customers',
                        icon: Icons.people_alt_rounded,
                        color: AppTheme.emerald,
                        onTap: () => widget.onNavigateTab?.call(2),
                      ),
                      const SizedBox(width: 10),
                      _buildQuickAction(
                        label: 'Sales Deals',
                        icon: Icons.handshake_rounded,
                        color: AppTheme.orange,
                        onTap: () => widget.onNavigateTab?.call(3),
                      ),
                      const SizedBox(width: 10),
                      _buildQuickAction(
                        label: 'All Menus',
                        icon: Icons.grid_view_rounded,
                        color: AppTheme.purple,
                        onTap: () => widget.onNavigateTab?.call(4),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Section Title: Executive Analytics
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Executive Analytics',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    if (_isLoading)
                      const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                  ],
                ),

                const SizedBox(height: 12),

                // Primary Outstanding Cards Grid (2 Column)
                GridView.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.05,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    StatCard(
                      title: 'Customer Purchase Outstanding',
                      value: Formatters.compactCurrency(_metrics.customerPurchaseOutstanding),
                      badgeText: 'Active',
                      footerLeft: 'Total: ${Formatters.compactCurrency(2058279)}',
                      icon: Icons.assignment_outlined,
                      gradient: AppTheme.orangeGradient,
                      onTap: () => widget.onNavigateTab?.call(1),
                    ),
                    StatCard(
                      title: 'Customer Sales Outstanding',
                      value: Formatters.compactCurrency(_metrics.customerSalesOutstanding),
                      badgeText: 'Pending',
                      footerLeft: 'Due: ${Formatters.compactCurrency(40000)}',
                      icon: Icons.trending_up_rounded,
                      gradient: AppTheme.emeraldGradient,
                      onTap: () => widget.onNavigateTab?.call(3),
                    ),
                    StatCard(
                      title: 'Supplier Outstanding',
                      value: Formatters.compactCurrency(_metrics.supplierOutstanding),
                      badgeText: 'Payable',
                      footerLeft: 'Paid: ${Formatters.compactCurrency(291563)}',
                      icon: Icons.arrow_downward_rounded,
                      gradient: AppTheme.crimsonGradient,
                      onTap: () => widget.onNavigateTab?.call(1),
                    ),
                    StatCard(
                      title: 'Total Customers',
                      value: '${_metrics.totalCustomers} Members',
                      badgeText: 'Active',
                      footerLeft: 'CRM Enrolled',
                      icon: Icons.groups_rounded,
                      gradient: AppTheme.blueGradient,
                      onTap: () => widget.onNavigateTab?.call(2),
                    ),
                  ],
                ),

                const SizedBox(height: 12),

                // Secondary Finance Cards (Cash in Hand & Bank Balance)
                Row(
                  children: [
                    Expanded(
                      child: StatCard(
                        title: 'Cash In Hand',
                        value: Formatters.compactCurrency(_metrics.cashInHand),
                        badgeText: 'Verified',
                        footerLeft: 'Register Balance',
                        icon: Icons.account_balance_wallet_rounded,
                        gradient: AppTheme.tealGradient,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: StatCard(
                        title: 'Bank Balance',
                        value: Formatters.compactCurrency(_metrics.bankBalance),
                        badgeText: 'Live Sync',
                        footerLeft: 'Reconciled',
                        icon: Icons.account_balance_rounded,
                        gradient: AppTheme.purpleGradient,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Recent Vehicles / Inward Stock Preview
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Recent Vehicle Inward',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    TextButton(
                      onPressed: () => widget.onNavigateTab?.call(1),
                      child: Text(
                        'View All',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.primary,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                if (_recentVehicles.isEmpty && !_isLoading)
                  Container(
                    padding: const EdgeInsets.all(24),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Text(
                      'No vehicles inward recorded yet',
                      style: GoogleFonts.inter(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  )
                else
                  ..._recentVehicles.map((v) => _buildVehicleCard(v)),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickAction({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        onTap();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.cardBorder),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVehicleCard(VehicleModel v) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.primaryLight,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.directions_car_rounded, color: AppTheme.primary, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  v.displayName,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Text(
                      v.regNo ?? 'TN REG',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.primary,
                      ),
                    ),
                    if (v.sellerName != null) ...[
                      const SizedBox(width: 6),
                      Text(
                        '• ${v.sellerName}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                Formatters.currency(v.netPurchaseAmount ?? v.vehicleCost),
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.emerald.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  v.status,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.emerald,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
