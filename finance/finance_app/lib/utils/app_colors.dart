import 'package:flutter/material.dart';

class AppColors {
  // Material 3 Primary Colors - Verde moderno
  static const Color primary = Color(0xFF006A4E); // Verde escuro mais moderno
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFF7DF3C4);
  static const Color onPrimaryContainer = Color(0xFF002114);
  
  // Material 3 Secondary Colors - Azul complementar
  static const Color secondary = Color(0xFF4F6354);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFD1E8D5);
  static const Color onSecondaryContainer = Color(0xFF0D1F13);
  
  // Material 3 Tertiary Colors - Laranja de destaque
  static const Color tertiary = Color(0xFF3E6837);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFBFEFB1);
  static const Color onTertiaryContainer = Color(0xFF002200);
  
  // Material 3 Error Colors
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF410002);
  
  // Material 3 Surface Colors
  static const Color surface = Color(0xFFF7FBF7);
  static const Color onSurface = Color(0xFF181D19);
  static const Color surfaceVariant = Color(0xFFDCE5DC);
  static const Color onSurfaceVariant = Color(0xFF404943);
  
  // Material 3 Background Colors
  static const Color background = Color(0xFFF7FBF7);
  static const Color onBackground = Color(0xFF181D19);
  
  // Material 3 Outline Colors
  static const Color outline = Color(0xFF707973);
  static const Color outlineVariant = Color(0xFFC0C9C0);
  
  // Cores de status personalizadas
  static const Color statusActive = Color(0xFF006A4E);
  static const Color statusInactive = Color(0xFF707973);
  static const Color statusPending = Color(0xFFE65100);
  static const Color statusOverdue = Color(0xFFBA1A1A);
  static const Color statusPaid = Color(0xFF006A4E);
  
  // Gradientes Material 3
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF006A4E), Color(0xFF7DF3C4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [Color(0xFF4F6354), Color(0xFFD1E8D5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Cores de elevação Material 3
  static const Color surfaceTint = Color(0xFF006A4E);
  static const Color shadow = Color(0xFF000000);
  static const Color scrim = Color(0xFF000000);
  static const Color inverseSurface = Color(0xFF2D322E);
  static const Color onInverseSurface = Color(0xFFEEF2EE);
  static const Color inversePrimary = Color(0xFF60D6A9);
}