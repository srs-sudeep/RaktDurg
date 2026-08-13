import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key, this.message = 'Loading RaktDurg…'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.canvas,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.brand.withValues(alpha: 0.08),
                      ),
                    ),
                    SvgPicture.asset('assets/logo.svg', width: 88, height: 88),
                  ],
                ),
                const SizedBox(height: 24),
                const Text(
                  'RaktDurg',
                  style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.ink),
                ),
                const Text('District Blood Bank Platform', style: TextStyle(color: AppColors.muted)),
                const SizedBox(height: 12),
                const Text(
                  'By IBITF and IIT Bhilai',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.muted),
                  textAlign: TextAlign.center,
                ),
                const Text(
                  'Powered by Recogx Init',
                  style: TextStyle(fontSize: 11, color: AppColors.muted),
                ),
                const SizedBox(height: 28),
                const PartnerLogos(height: 36),
                const SizedBox(height: 36),
                const SizedBox(
                  width: 36,
                  height: 36,
                  child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.brand),
                ),
                const SizedBox(height: 16),
                Text(message, style: const TextStyle(color: AppColors.muted, fontSize: 14, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class PageLoader extends StatelessWidget {
  const PageLoader({super.key, this.label = 'Loading…'});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Stack(
            alignment: Alignment.center,
            children: [
              const SizedBox(
                width: 52,
                height: 52,
                child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.brand),
              ),
              SvgPicture.asset('assets/logo.svg', width: 24, height: 24),
            ],
          ),
          const SizedBox(height: 16),
          Text(label, style: const TextStyle(color: AppColors.muted, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class PartnerLogos extends StatelessWidget {
  const PartnerLogos({super.key, this.height = 44});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      alignment: WrapAlignment.center,
      crossAxisAlignment: WrapCrossAlignment.center,
      spacing: 16,
      runSpacing: 8,
      children: [
        SvgPicture.asset('assets/partners/iit_bhilai.svg', height: height * 0.9),
        Image.asset('assets/partners/ibitf.jpeg', height: height, fit: BoxFit.contain),
        Image.asset('assets/partners/recogx.webp', height: height * 0.75, fit: BoxFit.contain),
      ],
    );
  }
}
