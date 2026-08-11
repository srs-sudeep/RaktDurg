import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  late final Dio _dio = _buildDio();

  Dio _buildDio() {
    final dio = Dio(BaseOptions(
      baseUrl: const String.fromEnvironment(
        'API_BASE_URL',
        defaultValue: 'http://10.0.2.2:8000',
      ),
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 20),
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

  Dio get dio => _dio;
}
