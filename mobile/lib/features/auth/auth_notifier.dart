import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../data/remote/api_client.dart';

const _storage = FlutterSecureStorage();

enum AuthStatus { loading, authenticated, unauthenticated }

class AuthState {
  final AuthStatus status;
  final String? userId;
  final String? role;
  final String? facilityId;
  final String? error;

  const AuthState({
    this.status = AuthStatus.loading,
    this.userId,
    this.role,
    this.facilityId,
    this.error,
  });

  AuthState copyWith({
    AuthStatus? status,
    String? userId,
    String? role,
    String? facilityId,
    String? error,
  }) =>
      AuthState(
        status: status ?? this.status,
        userId: userId ?? this.userId,
        role: role ?? this.role,
        facilityId: facilityId ?? this.facilityId,
        error: error ?? this.error,
      );

  bool get isAuthenticated => status == AuthStatus.authenticated;
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _rehydrate();
  }

  Future<void> _rehydrate() async {
    final token = await _storage.read(key: 'access_token');
    if (token == null) {
      state = state.copyWith(status: AuthStatus.unauthenticated);
      return;
    }
    try {
      final parts = token.split('.');
      if (parts.length < 2) throw Exception('invalid token');
      final payload = _decodeJwtPayload(parts[1]);
      state = AuthState(
        status: AuthStatus.authenticated,
        userId: payload['sub'] as String?,
        role: payload['role'] as String?,
        facilityId: payload['facility_id'] as String?,
      );
    } catch (_) {
      await _storage.deleteAll();
      state = state.copyWith(status: AuthStatus.unauthenticated);
    }
  }

  Future<void> login(String username, String password) async {
    state = state.copyWith(status: AuthStatus.loading, error: null);
    try {
      final data = await ApiClient.instance.login(username, password);
      await _storage.write(key: 'access_token', value: data['access_token'] as String);
      await _storage.write(key: 'refresh_token', value: data['refresh_token'] as String);
      await _rehydrate();
    } catch (_) {
      state = state.copyWith(
        status: AuthStatus.unauthenticated,
        error: 'Login failed. Check your credentials.',
      );
    }
  }

  Future<void> logout() async {
    final refresh = await _storage.read(key: 'refresh_token');
    if (refresh != null) {
      try {
        await ApiClient.instance.logout(refresh);
      } catch (_) {}
    }
    await _storage.deleteAll();
    state = const AuthState(status: AuthStatus.unauthenticated);
  }

  Map<String, dynamic> _decodeJwtPayload(String input) {
    // Base64url → base64
    var output = input.replaceAll('-', '+').replaceAll('_', '/');
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += '==';
        break;
      case 3:
        output += '=';
        break;
      default:
        throw Exception('Invalid base64url string');
    }
    final decoded = utf8.decode(base64Decode(output));
    return jsonDecode(decoded) as Map<String, dynamic>;
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (_) => AuthNotifier(),
);
