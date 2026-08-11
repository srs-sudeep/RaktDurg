import 'dart:convert';
import 'package:sqflite/sqflite.dart';
import '../database.dart';

class ScreeningRecord {
  final String id;
  final String donorId;
  final String? campId;
  final String syncId;
  final String deviceId;
  final String screeningDatetime;
  final double? weightKg;
  final int? bpSystolic;
  final int? bpDiastolic;
  final int? pulseBpm;
  final double? temperatureCelsius;
  final double? hemoglobinGDl;
  final Map<String, dynamic> questionnaire;
  final String? eligibilityResult;
  final String? deferralReason;
  final bool capturedOffline;
  final String? syncedAt;
  final String createdAt;

  const ScreeningRecord({
    required this.id,
    required this.donorId,
    this.campId,
    required this.syncId,
    required this.deviceId,
    required this.screeningDatetime,
    this.weightKg,
    this.bpSystolic,
    this.bpDiastolic,
    this.pulseBpm,
    this.temperatureCelsius,
    this.hemoglobinGDl,
    this.questionnaire = const {},
    this.eligibilityResult,
    this.deferralReason,
    this.capturedOffline = true,
    this.syncedAt,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'donor_id': donorId,
        'camp_id': campId,
        'sync_id': syncId,
        'device_id': deviceId,
        'screening_datetime': screeningDatetime,
        'weight_kg': weightKg,
        'bp_systolic': bpSystolic,
        'bp_diastolic': bpDiastolic,
        'pulse_bpm': pulseBpm,
        'temperature_celsius': temperatureCelsius,
        'hemoglobin_g_dl': hemoglobinGDl,
        'questionnaire': jsonEncode(questionnaire),
        'eligibility_result': eligibilityResult,
        'deferral_reason': deferralReason,
        'captured_offline': capturedOffline ? 1 : 0,
        'synced_at': syncedAt,
        'created_at': createdAt,
      };

  factory ScreeningRecord.fromMap(Map<String, dynamic> map) => ScreeningRecord(
        id: map['id'] as String,
        donorId: map['donor_id'] as String,
        campId: map['camp_id'] as String?,
        syncId: map['sync_id'] as String,
        deviceId: map['device_id'] as String,
        screeningDatetime: map['screening_datetime'] as String,
        weightKg: (map['weight_kg'] as num?)?.toDouble(),
        bpSystolic: map['bp_systolic'] as int?,
        bpDiastolic: map['bp_diastolic'] as int?,
        pulseBpm: map['pulse_bpm'] as int?,
        temperatureCelsius: (map['temperature_celsius'] as num?)?.toDouble(),
        hemoglobinGDl: (map['hemoglobin_g_dl'] as num?)?.toDouble(),
        questionnaire: jsonDecode(map['questionnaire'] as String? ?? '{}') as Map<String, dynamic>,
        eligibilityResult: map['eligibility_result'] as String?,
        deferralReason: map['deferral_reason'] as String?,
        capturedOffline: (map['captured_offline'] as int) == 1,
        syncedAt: map['synced_at'] as String?,
        createdAt: map['created_at'] as String,
      );
}

class ScreeningDao {
  final _db = LocalDb.instance;

  Future<ScreeningRecord> insert(ScreeningRecord record) async {
    final db = await _db.db;
    await db.insert('screenings', record.toMap());
    return record;
  }

  Future<List<ScreeningRecord>> getPending() async {
    final db = await _db.db;
    final rows = await db.query(
      'screenings',
      where: 'synced_at IS NULL',
      orderBy: 'created_at ASC',
    );
    return rows.map(ScreeningRecord.fromMap).toList();
  }

  Future<void> markSynced(String syncId) async {
    final db = await _db.db;
    await db.update(
      'screenings',
      {'synced_at': DateTime.now().toUtc().toIso8601String()},
      where: 'sync_id = ?',
      whereArgs: [syncId],
    );
  }

  Future<int> pendingCount() async {
    final db = await _db.db;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as c FROM screenings WHERE synced_at IS NULL',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }
}
