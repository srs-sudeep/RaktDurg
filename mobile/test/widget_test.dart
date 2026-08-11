import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rakt_durg_mobile/main.dart';

void main() {
  testWidgets('app boots', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: RaktDurgApp()));
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.byType(RaktDurgApp), findsOneWidget);
  });
}
