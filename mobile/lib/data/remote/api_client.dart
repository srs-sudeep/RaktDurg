import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();

/// Production API host used by release builds when no `--dart-define=API_BASE_URL` is set.
const kProductionApiBaseUrl = 'http://8.231.102.114';

String resolveApiBaseUrl() {
  const fromDefine = String.fromEnvironment('API_BASE_URL');
  if (fromDefine.trim().isNotEmpty) return fromDefine.trim();
  // Debug/profile keep the Android emulator loopback; release hits production.
  if (kReleaseMode) return kProductionApiBaseUrl;
  return 'http://10.0.2.2:8000';
}

/// Human-readable message for login / network failures.
String describeApiError(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 401 || status == 403) {
      return 'Invalid username or password.';
    }
    if (status == 422) {
      return 'Invalid login request. Check username and password.';
    }
    if (error.type == DioExceptionType.connectionTimeout ||
        error.type == DioExceptionType.receiveTimeout ||
        error.type == DioExceptionType.sendTimeout) {
      return 'Server timed out. Check your connection and try again.';
    }
    if (error.type == DioExceptionType.connectionError) {
      return 'Cannot reach API (${ApiClient.instance.baseUrl}). Check network.';
    }
    if (status != null) {
      return 'Request failed ($status). Try again.';
    }
  }
  return 'Login failed. Check your credentials and network.';
}

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  late final Dio _dio = _buildDio();

  String get baseUrl => _dio.options.baseUrl;
  Dio get dio => _dio;

  Dio _buildDio() {
    final dio = Dio(BaseOptions(
      baseUrl: resolveApiBaseUrl(),
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 25),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await _storage.delete(key: 'access_token');
          await _storage.delete(key: 'refresh_token');
        }
        handler.next(error);
      },
    ));

    return dio;
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final resp = await _dio.post(
      '/auth/token',
      data: {'username': username, 'password': password},
    );
    return resp.data as Map<String, dynamic>;
  }

  Future<void> logout(String refreshToken) async {
    await _dio.post('/auth/logout', data: {'refresh_token': refreshToken});
  }

  Future<Map<String, dynamic>> syncBatch(List<Map<String, dynamic>> items) async {
    final resp = await _dio.post('/sync', data: {'items': items});
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> createDonor(Map<String, dynamic> payload) async {
    final resp = await _dio.post('/donors', data: payload);
    return resp.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> listDonors({String? search}) async {
    final resp = await _dio.get('/donors', queryParameters: {
      'page_size': 50,
      if (search != null && search.isNotEmpty) 'search': search,
    });
    return (resp.data as Map)['items'] as List<dynamic>? ?? [];
  }

  Future<Map<String, dynamic>> scanBarcode(String barcode) async {
    final resp = await _dio.get('/units/scan/$barcode');
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> preAllocateBarcodes({
    required String facilityId,
    required int count,
    String? campId,
  }) async {
    final resp = await _dio.post('/barcodes/pre-allocate', data: {
      'facility_id': facilityId,
      'count': count,
      if (campId != null) 'camp_id': campId,
    });
    return resp.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> listCamps() async {
    final resp = await _dio.get('/camps', queryParameters: {'page_size': 50});
    return (resp.data as Map)['items'] as List<dynamic>? ?? [];
  }

  Future<Map<String, dynamic>> getPublicStock(String facilityId) async {
    final resp = await _dio.get('/public/stock/$facilityId');
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCitizenStock() async {
    final resp = await _dio.get('/citizen/stock');
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getPublicDefaultFacility() async {
    final resp = await _dio.get('/public/facilities/default');
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCitizenProfile() async {
    final resp = await _dio.get('/citizen/profile');
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getCitizenWallet() async {
    final resp = await _dio.get('/citizen/wallet');
    return resp.data as Map<String, dynamic>;
  }

  Future<List<dynamic>> getCitizenDonations() async {
    final resp = await _dio.get('/citizen/donations');
    return resp.data as List<dynamic>? ?? [];
  }

  Future<List<dynamic>> getCitizenCertificates() async {
    final resp = await _dio.get('/citizen/certificates');
    return resp.data as List<dynamic>? ?? [];
  }

  Future<List<int>> downloadCitizenCertificatePdf(String certificateId) async {
    final resp = await _dio.get(
      '/citizen/certificates/$certificateId/pdf',
      options: Options(responseType: ResponseType.bytes),
    );
    return List<int>.from(resp.data as List<int>);
  }

  Future<List<dynamic>> getPublicCamps() async {
    final resp = await _dio.get('/public/camps');
    return resp.data as List<dynamic>? ?? [];
  }

  Future<List<dynamic>> getCitizenBookings() async {
    final resp = await _dio.get('/citizen/bookings');
    return resp.data as List<dynamic>? ?? [];
  }

  Future<Map<String, dynamic>> createCitizenBooking({
    required String campId,
    String? notes,
  }) async {
    final resp = await _dio.post('/citizen/bookings', data: {
      'camp_id': campId,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return resp.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> cancelCitizenBooking(String bookingId) async {
    final resp = await _dio.post('/citizen/bookings/$bookingId/cancel');
    return resp.data as Map<String, dynamic>;
  }
}
