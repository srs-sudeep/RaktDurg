class EligibilityDecision {
  final String result; // eligible | temporarily_deferred | permanently_deferred
  final String? deferralReason;
  final DateTime? deferralUntil;

  const EligibilityDecision({
    required this.result,
    this.deferralReason,
    this.deferralUntil,
  });
}

class ScreeningInput {
  final int ageYears;
  final String sex;
  final double weightKg;
  final double hemoglobinGDl;
  final int bpSystolic;
  final int bpDiastolic;
  final int pulseBpm;
  final double temperatureCelsius;
  final bool hadRecentIllness;
  final bool hadRecentSurgery;
  final bool isPregnant;
  final bool hadTattooLast6m;
  final bool hadSti;
  final bool isOnMedication;
  final int? daysSinceLastDonation;

  const ScreeningInput({
    required this.ageYears,
    required this.sex,
    required this.weightKg,
    required this.hemoglobinGDl,
    required this.bpSystolic,
    required this.bpDiastolic,
    required this.pulseBpm,
    required this.temperatureCelsius,
    this.hadRecentIllness = false,
    this.hadRecentSurgery = false,
    this.isPregnant = false,
    this.hadTattooLast6m = false,
    this.hadSti = false,
    this.isOnMedication = false,
    this.daysSinceLastDonation,
  });
}

EligibilityDecision assessEligibility(ScreeningInput inp, {DateTime? today}) {
  final now = today ?? DateTime.now();

  EligibilityDecision temp(String reason, int days) => EligibilityDecision(
        result: 'temporarily_deferred',
        deferralReason: reason,
        deferralUntil: now.add(Duration(days: days)),
      );

  EligibilityDecision perm(String reason) => EligibilityDecision(
        result: 'permanently_deferred',
        deferralReason: reason,
      );

  if (inp.ageYears < 18) return perm('Age ${inp.ageYears} is below minimum of 18');
  if (inp.ageYears > 65) return perm('Age ${inp.ageYears} exceeds maximum of 65');
  if (inp.weightKg < 45) return temp('Weight ${inp.weightKg.toStringAsFixed(1)} kg below minimum 45 kg', 0);
  if (inp.hemoglobinGDl < 12.5) {
    return temp('Haemoglobin ${inp.hemoglobinGDl.toStringAsFixed(1)} g/dL below 12.5', 90);
  }
  if (inp.bpSystolic > 160 || inp.bpSystolic < 90) {
    return temp('Systolic BP ${inp.bpSystolic} out of range (90–160)', 7);
  }
  if (inp.bpDiastolic > 100 || inp.bpDiastolic < 50) {
    return temp('Diastolic BP ${inp.bpDiastolic} out of range (50–100)', 7);
  }
  if (inp.pulseBpm < 50 || inp.pulseBpm > 100) {
    return temp('Pulse ${inp.pulseBpm} out of range (50–100)', 7);
  }
  if (inp.temperatureCelsius > 37.5) {
    return temp('Temperature ${inp.temperatureCelsius.toStringAsFixed(1)} °C above 37.5', 14);
  }
  if (inp.isPregnant) return temp('Pregnancy or recent delivery/breastfeeding', 365);
  if (inp.hadRecentIllness) return temp('Recent illness in last 2 weeks', 14);
  if (inp.hadRecentSurgery) return temp('Surgery or dental procedure in last 6 months', 180);
  if (inp.hadTattooLast6m) return temp('Tattoo or body piercing in last 6 months', 180);
  if (inp.hadSti) return perm('History of sexually transmitted infection (STI)');
  if (inp.daysSinceLastDonation != null && inp.daysSinceLastDonation! < 90) {
    final left = 90 - inp.daysSinceLastDonation!;
    return temp(
      'Last donation was ${inp.daysSinceLastDonation} days ago (minimum 90 days required)',
      left,
    );
  }
  return const EligibilityDecision(result: 'eligible');
}

bool validateBarcode(String barcode) {
  if (barcode.length != 15) return false;
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  int charValue(String c) => alphabet.indexOf(c);
  final payload = barcode.substring(0, 14);
  final check = barcode.substring(14);
  var total = 0;
  final chars = payload.split('').reversed.toList();
  for (var i = 0; i < chars.length; i++) {
    var v = charValue(chars[i]);
    if (v < 0) return false;
    if (i % 2 == 0) {
      v *= 2;
      if (v > 35) v -= 35;
    }
    total += v;
  }
  final expected = alphabet[(36 - (total % 36)) % 36];
  return expected == check;
}
