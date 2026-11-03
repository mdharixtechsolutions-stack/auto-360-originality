import 'package:flutter_test/flutter_test.dart';
import 'package:auto360_admin/main.dart';

void main() {
  testWidgets('Auto360App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const Auto360App());
    expect(find.byType(Auto360App), findsOneWidget);
  });
}
