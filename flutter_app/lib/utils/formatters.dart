import 'package:intl/intl.dart';

class Formatters {
  static final NumberFormat _inrFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static final DateFormat _dateFormat = DateFormat('dd MMM yyyy');
  static final DateFormat _timeFormat = DateFormat('hh:mm a');

  static String currency(num? amount) {
    if (amount == null) return '₹0';
    return _inrFormat.format(amount).replaceAll('₹', '₹ ');
  }

  static String compactCurrency(num? amount) {
    if (amount == null || amount == 0) return '₹0';
    final abs = amount.abs();
    if (abs >= 10000000) {
      return '₹${(amount / 10000000).toStringAsFixed(2)} Cr';
    } else if (abs >= 100000) {
      return '₹${(amount / 100000).toStringAsFixed(2)} L';
    } else if (abs >= 1000) {
      return '₹${(amount / 1000).toStringAsFixed(1)} k';
    }
    return currency(amount);
  }

  static String date(dynamic dateInput) {
    if (dateInput == null) return '-';
    try {
      if (dateInput is DateTime) {
        return _dateFormat.format(dateInput);
      }
      final parsed = DateTime.parse(dateInput.toString());
      return _dateFormat.format(parsed);
    } catch (_) {
      return dateInput.toString();
    }
  }

  static String time(dynamic dateInput) {
    if (dateInput == null) return '-';
    try {
      if (dateInput is DateTime) {
        return _timeFormat.format(dateInput);
      }
      final parsed = DateTime.parse(dateInput.toString());
      return _timeFormat.format(parsed);
    } catch (_) {
      return '';
    }
  }
}
