import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/customer_model.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/safe_toast.dart';
import '../widgets/search_bar_widget.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _searchController = TextEditingController();
  List<CustomerModel> _customers = [];
  List<CustomerModel> _filteredCustomers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchCustomers() async {
    setState(() => _isLoading = true);
    final list = await ApiService().getCustomers();
    if (mounted) {
      setState(() {
        _customers = list;
        _applySearch();
        _isLoading = false;
      });
    }
  }

  void _applySearch() {
    final q = _searchController.text.toLowerCase().trim();
    setState(() {
      _filteredCustomers = _customers.where((c) {
        if (q.isEmpty) return true;
        return c.name.toLowerCase().contains(q) ||
            c.mobile.toLowerCase().contains(q) ||
            (c.preferredVehicle?.toLowerCase().contains(q) ?? false);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Customer Directory',
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchCustomers,
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              child: SearchBarWidget(
                controller: _searchController,
                hintText: 'Search by Customer Name or Mobile...',
                onChanged: (_) => _applySearch(),
                onClear: () => _applySearch(),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchCustomers,
                color: AppTheme.primary,
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _filteredCustomers.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.people_outline_rounded, size: 48, color: AppTheme.textMuted),
                                const SizedBox(height: 12),
                                Text(
                                  'No customers found',
                                  style: GoogleFonts.inter(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            itemCount: _filteredCustomers.length,
                            itemBuilder: (context, index) {
                              final c = _filteredCustomers[index];
                              return _buildCustomerItem(c);
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerItem(CustomerModel c) {
    final initial = c.name.isNotEmpty ? c.name[0].toUpperCase() : 'C';

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
          CircleAvatar(
            radius: 22,
            backgroundColor: AppTheme.primaryLight,
            child: Text(
              initial,
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppTheme.primary,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  c.name,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    const Icon(Icons.phone_outlined, size: 12, color: AppTheme.textMuted),
                    const SizedBox(width: 4),
                    Text(
                      c.mobile.isNotEmpty ? c.mobile : 'No Mobile',
                      style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
                if (c.preferredVehicle != null && c.preferredVehicle!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    'Interested: ${c.preferredVehicle}',
                    style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                  ),
                ],
              ],
            ),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.phone_rounded, color: AppTheme.primary, size: 20),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  SafeToast.show(context, 'Calling ${c.name}: ${c.mobile}', type: ToastType.info);
                },
              ),
              IconButton(
                icon: const Icon(Icons.chat_outlined, color: AppTheme.emerald, size: 20),
                onPressed: () {
                  HapticFeedback.lightImpact();
                  SafeToast.show(context, 'Opening WhatsApp chat with ${c.name}', type: ToastType.info);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
