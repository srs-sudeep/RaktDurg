import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';
import '../../core/eligibility.dart';
import '../../data/local/dao/screening_dao.dart';

const _uuid = Uuid();

class ScreeningFormScreen extends ConsumerStatefulWidget {
  final String donorId;
  final String deviceId;
  final String? campId;

  const ScreeningFormScreen({
    super.key,
    required this.donorId,
    required this.deviceId,
    this.campId,
  });

  @override
  ConsumerState<ScreeningFormScreen> createState() => _ScreeningFormState();
}

class _ScreeningFormState extends ConsumerState<ScreeningFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _dao = ScreeningDao();

  // Vitals
  final _weightCtrl = TextEditingController();
  final _hbCtrl = TextEditingController();
  final _bpSysCtrl = TextEditingController();
  final _bpDiaCtrl = TextEditingController();
  final _pulseCtrl = TextEditingController();
  final _tempCtrl = TextEditingController();

  // Questionnaire
  bool _recentIllness = false;
  bool _recentSurgery = false;
  bool _isPregnant = false;
  bool _tattooLast6m = false;
  bool _hadSti = false;
  bool _onMedication = false;

  bool _submitting = false;

  @override
  void dispose() {
    for (final c in [_weightCtrl, _hbCtrl, _bpSysCtrl, _bpDiaCtrl, _pulseCtrl, _tempCtrl]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    try {
      final syncId = _uuid.v4();
      final now = DateTime.now().toUtc().toIso8601String();
      final decision = assessEligibility(ScreeningInput(
        ageYears: 30,
        sex: 'M',
        weightKg: double.parse(_weightCtrl.text),
        hemoglobinGDl: double.parse(_hbCtrl.text),
        bpSystolic: int.parse(_bpSysCtrl.text),
        bpDiastolic: int.parse(_bpDiaCtrl.text),
        pulseBpm: int.parse(_pulseCtrl.text),
        temperatureCelsius: double.parse(_tempCtrl.text),
        hadRecentIllness: _recentIllness,
        hadRecentSurgery: _recentSurgery,
        isPregnant: _isPregnant,
        hadTattooLast6m: _tattooLast6m,
        hadSti: _hadSti,
        isOnMedication: _onMedication,
      ));
      final record = ScreeningRecord(
        id: _uuid.v4(),
        donorId: widget.donorId,
        campId: widget.campId,
        syncId: syncId,
        deviceId: widget.deviceId,
        screeningDatetime: now,
        weightKg: double.tryParse(_weightCtrl.text),
        hemoglobinGDl: double.tryParse(_hbCtrl.text),
        bpSystolic: int.tryParse(_bpSysCtrl.text),
        bpDiastolic: int.tryParse(_bpDiaCtrl.text),
        pulseBpm: int.tryParse(_pulseCtrl.text),
        temperatureCelsius: double.tryParse(_tempCtrl.text),
        questionnaire: {
          'had_recent_illness': _recentIllness,
          'had_recent_surgery': _recentSurgery,
          'is_pregnant': _isPregnant,
          'had_tattoo_last_6m': _tattooLast6m,
          'had_sti': _hadSti,
          'is_on_medication': _onMedication,
        },
        eligibilityResult: decision.result,
        deferralReason: decision.deferralReason,
        capturedOffline: true,
        createdAt: now,
      );

      await _dao.insert(record);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Saved offline — ${decision.result}')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      setState(() => _submitting = false);
    }
  }

  Widget _vitalField(String label, TextEditingController ctrl, String hint, {bool isDecimal = false}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: isDecimal
          ? const TextInputType.numberWithOptions(decimal: true)
          : TextInputType.number,
      decoration: InputDecoration(labelText: label, hintText: hint),
      validator: (v) {
        if (v == null || v.isEmpty) return 'Required';
        final n = isDecimal ? double.tryParse(v) : int.tryParse(v);
        if (n == null) return 'Enter a valid number';
        return null;
      },
    );
  }

  Widget _checkbox(String label, bool value, ValueChanged<bool?> onChanged) {
    return CheckboxListTile(
      title: Text(label, style: const TextStyle(fontSize: 14)),
      value: value,
      onChanged: onChanged,
      dense: true,
      controlAffinity: ListTileControlAffinity.leading,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Donor Screening'),
        backgroundColor: const Color(0xFFDC2626),
        foregroundColor: Colors.white,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.orange.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.orange.shade200),
              ),
              child: const Row(
                children: [
                  Icon(Icons.wifi_off, color: Colors.orange, size: 16),
                  SizedBox(width: 8),
                  Text(
                    'Offline mode — data saved locally',
                    style: TextStyle(color: Colors.orange, fontSize: 13),
                  ),
                ],
              ),
            ),

            // Vitals section
            const Text('Vitals', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            _vitalField('Weight (kg)', _weightCtrl, '65.0', isDecimal: true),
            const SizedBox(height: 8),
            _vitalField('Haemoglobin (g/dL)', _hbCtrl, '14.0', isDecimal: true),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _vitalField('BP Systolic', _bpSysCtrl, '120')),
                const SizedBox(width: 12),
                Expanded(child: _vitalField('BP Diastolic', _bpDiaCtrl, '80')),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(child: _vitalField('Pulse (bpm)', _pulseCtrl, '72')),
                const SizedBox(width: 12),
                Expanded(child: _vitalField('Temp (°C)', _tempCtrl, '36.8', isDecimal: true)),
              ],
            ),
            const SizedBox(height: 20),

            // Questionnaire
            const Text('Questionnaire', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            _checkbox('Recent illness in last 2 weeks', _recentIllness, (v) => setState(() => _recentIllness = v!)),
            _checkbox('Surgery or dental procedure in last 6 months', _recentSurgery, (v) => setState(() => _recentSurgery = v!)),
            _checkbox('Currently pregnant or recently delivered', _isPregnant, (v) => setState(() => _isPregnant = v!)),
            _checkbox('Tattoo or piercing in last 6 months', _tattooLast6m, (v) => setState(() => _tattooLast6m = v!)),
            _checkbox('History of sexually transmitted infection (STI)', _hadSti, (v) => setState(() => _hadSti = v!)),
            _checkbox('Currently on long-term medication', _onMedication, (v) => setState(() => _onMedication = v!)),

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _submitting ? null : _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: _submitting
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text('Save Screening', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
