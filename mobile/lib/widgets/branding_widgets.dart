import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key, this.message = 'Loading RaktDurg…'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                SvgPicture.asset('assets/logo.svg', width: 96, height: 96),
                const SizedBox(height: 20),
                const Text(
                  'RaktDurg',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                ),
                const Text('District Blood Bank Platform', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 12),
                const Text(
                  'By IBITF and IIT Bhilai',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Colors.black54),
                  textAlign: TextAlign.center,
                ),
                const Text(
                  'Powered by Recogx Init',
                  style: TextStyle(fontSize: 11, color: Colors.grey),
                ),
                const SizedBox(height: 24),
                const PartnerLogos(height: 36),
                const SizedBox(height: 32),
                const SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFFDC2626)),
                ),
                const SizedBox(height: 12),
                Text(message, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class PageLoader extends StatelessWidget {
  const PageLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 40,
            height: 40,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFFDC2626)),
          ),
          SizedBox(height: 12),
          Text('Loading…', style: TextStyle(color: Colors.grey)),
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
