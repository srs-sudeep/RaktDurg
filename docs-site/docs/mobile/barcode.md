---
id: barcode
title: Barcode Scanning
---

# Barcode Scanning

## Scanning a Unit

The Flutter app uses `mobile_scanner` to scan QR codes and barcodes printed on blood unit bags:

```dart
// Using MobileScannerController
MobileScanner(
  controller: MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
  ),
  onDetect: (capture) {
    final barcode = capture.barcodes.first.rawValue;
    if (barcode != null) {
      _onBarcodeDetected(barcode);
    }
  },
)
```

## Barcode Validation (Dart)

The same Luhn mod-36 validation used on the server is implemented in Dart:

```dart
const _luhnCharset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

bool validateBarcode(String barcode) {
  if (barcode.length != 15) return false;
  if (!barcode.startsWith('RD')) return false;
  final payload = barcode.substring(0, 14);
  final expected = barcode[14];
  return _luhnCheckChar(payload) == expected;
}

String _luhnCheckChar(String payload) {
  int total = 0;
  for (int i = 0; i < payload.length; i++) {
    int n = _luhnCharset.indexOf(payload[payload.length - 1 - i]);
    if (i % 2 == 0) {
      n *= 2;
      if (n >= _luhnCharset.length) n -= _luhnCharset.length - 1;
    }
    total += n;
  }
  final checkIndex = (_luhnCharset.length - total % _luhnCharset.length) % _luhnCharset.length;
  return _luhnCharset[checkIndex];
}
```

## API Lookup After Scan

Once a barcode is validated, the app calls the server to look up the unit:

```dart
final response = await _apiClient.get('/units/scan/$barcode');
final unit = BloodUnit.fromJson(response.data);
```

## QR Code Generation

Blood unit barcodes can also be displayed as QR codes for easy scanning:

```dart
// qr_flutter
QrImageView(
  data: unit.barcode,
  version: QrVersions.auto,
  size: 200.0,
  errorCorrectionLevel: QrErrorCorrectLevel.M,
)
```

## Offline Barcode Assignment

At camp start (when connectivity is available), the app pre-allocates a range of barcodes from the server:

```
POST /barcodes/pre-allocate
{"facility_id": "uuid", "count": 50, "camp_id": null}

Response: {"allocation_id": "...", "sequence_start": 100, "sequence_end": 149, "barcodes": ["RDRKDURG000100…", "..."]}
```

The app stores this range in sqflite. During the camp, new units get barcodes from the local range — no network needed.
