import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

const int _kVersion = 1;

class LocalDb {
  LocalDb._();
  static final LocalDb instance = LocalDb._();

  Database? _db;

  Future<Database> get db async {
    _db ??= await _open();
    return _db!;
  }

  Future<Database> _open() async {
    final path = join(await getDatabasesPath(), 'rakt_durg.db');
    return openDatabase(
      path,
      version: _kVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE screenings (
        id TEXT PRIMARY KEY,
        donor_id TEXT NOT NULL,
        camp_id TEXT,
        sync_id TEXT NOT NULL UNIQUE,
        device_id TEXT NOT NULL,
        screening_datetime TEXT NOT NULL,
        weight_kg REAL,
        bp_systolic INTEGER,
        bp_diastolic INTEGER,
        pulse_bpm INTEGER,
        temperature_celsius REAL,
        hemoglobin_g_dl REAL,
        questionnaire TEXT NOT NULL DEFAULT '{}',
        eligibility_result TEXT,
        deferral_reason TEXT,
        captured_offline INTEGER NOT NULL DEFAULT 1,
        synced_at TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE donations (
        id TEXT PRIMARY KEY,
        donor_id TEXT NOT NULL,
        sync_id TEXT NOT NULL UNIQUE,
        device_id TEXT NOT NULL,
        collection_datetime TEXT NOT NULL,
        donation_type TEXT NOT NULL DEFAULT 'whole_blood',
        volume_ml INTEGER,
        captured_offline INTEGER NOT NULL DEFAULT 1,
        synced_at TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('CREATE INDEX idx_screenings_sync_id ON screenings(sync_id)');
    await db.execute('CREATE INDEX idx_donations_sync_id ON donations(sync_id)');
    await db.execute('CREATE INDEX idx_screenings_synced ON screenings(synced_at)');
    await db.execute('CREATE INDEX idx_donations_synced ON donations(synced_at)');
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    // Future migrations go here
  }
}
