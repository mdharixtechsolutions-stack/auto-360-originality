import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/deal_model.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/search_bar_widget.dart';

class SalesScreen extends StatefulWidget {
  const SalesScreen({super.key});

  @override
  State<SalesScreen> createState() => _SalesScreenState();
}

class _SalesScreenState extends State<SalesScreen> {
  final _searchController = TextEditingController();
  List<DealModel> _deals = [];
  List<DealModel> _filteredDeals = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchDeals();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchDeals() async {
    setState(() => _isLoading = true);
    final list = await ApiService().getDeals();
    if (mounted) {
      setState(() {
        _deals = list;
        _applySearch();
        _isLoading = false;
      });
    }
  }

  void _applySearch() {
    final q = _searchController.text.toLowerCase().trim();
    setState(() {
      _filteredDeals = _deals.where((d) {
        if (q.isEmpty) return true;
        return (d.customerName?.toLowerCase().contains(q) ?? false) ||
            (d.vehicleName?.toLowerCase().contains(q) ?? false) ||
            (d.regNo?.toLowerCase().contains(q) ?? false) ||
            d.id.toLowerCase().contains(q);
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Sales & Deals',
          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.w800),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchDeals,
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
                hintText: 'Search Buyer, Vehicle, Deal ID...',
                onChanged: (_) => _applySearch(),
                onClear: () => _applySearch(),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchDeals,
                color: AppTheme.primary,
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : _filteredDeals.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.handshake_outlined, size: 48, color: AppTheme.textMuted),
                                const SizedBox(height: 12),
                                Text(
                                  'No deals recorded yet',
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
                            itemCount: _filteredDeals.length,
                            itemBuilder: (context, index) {
                              final d = _filteredDeals[index];
                              return _buildDealItem(d);
                            },
                          ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDealItem(DealModel d) {
    final hasOutstanding = (d.balanceAmount ?? 0) > 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppTheme.cardBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                d.id,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.primary,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: (hasOutstanding ? AppTheme.orange : AppTheme.emerald).withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  hasOutstanding ? 'Outstanding' : 'Completed',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: hasOutstanding ? AppTheme.orange : AppTheme.emerald,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            d.customerName ?? 'Buyer',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Vehicle: ${d.vehicleName ?? 'Auto'} ${d.regNo != null ? '(${d.regNo})' : ''}',
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: AppTheme.surfaceVariant,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sale Price', style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted)),
                    Text(
                      Formatters.currency(d.saleAmount),
                      style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textPrimary),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      hasOutstanding ? 'Balance Due' : 'Status',
                      style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                    ),
                    Text(
                      hasOutstanding ? Formatters.currency(d.balanceAmount) : 'Paid in Full',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: hasOutstanding ? AppTheme.crimson : AppTheme.emerald,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
