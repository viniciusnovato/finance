import 'package:flutter/material.dart';

class AppColors {
  // ERP Professional Primary Colors - Azul corporativo
  static const Color primary = Color(0xFF1976D2); // Azul profissional
  static const Color onPrimary = Color(0xFFFFFFFF);
  static const Color primaryContainer = Color(0xFFE3F2FD);
  static const Color onPrimaryContainer = Color(0xFF0D47A1);
  
  // ERP Secondary Colors - Cinza neutro
  static const Color secondary = Color(0xFF546E7A);
  static const Color onSecondary = Color(0xFFFFFFFF);
  static const Color secondaryContainer = Color(0xFFECEFF1);
  static const Color onSecondaryContainer = Color(0xFF263238);
  
  // ERP Tertiary Colors - Cinza azulado
  static const Color tertiary = Color(0xFF607D8B);
  static const Color onTertiary = Color(0xFFFFFFFF);
  static const Color tertiaryContainer = Color(0xFFE0F2F1);
  static const Color onTertiaryContainer = Color(0xFF37474F);
  
  // Material 3 Error Colors
  static const Color error = Color(0xFFBA1A1A);
  static const Color onError = Color(0xFFFFFFFF);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF410002);
  
  // ERP Surface Colors - Tons neutros
  static const Color surface = Color(0xFFFAFAFA);
  static const Color onSurface = Color(0xFF212121);
  static const Color surfaceVariant = Color(0xFFF5F5F5);
  static const Color onSurfaceVariant = Color(0xFF616161);
  
  // ERP Background Colors - Branco e cinza claro
  static const Color background = Color(0xFFFFFFFF);
  static const Color onBackground = Color(0xFF212121);
  
  // ERP Outline Colors - Cinza neutro
  static const Color outline = Color(0xFFBDBDBD);
  static const Color outlineVariant = Color(0xFFE0E0E0);
  
  // Cores de status ERP profissionais
  static const Color statusActive = Color(0xFF4CAF50);
  static const Color statusInactive = Color(0xFF9E9E9E);
  static const Color statusPending = Color(0xFFFF9800);
  static const Color statusOverdue = Color(0xFFF44336);
  static const Color statusPaid = Color(0xFF4CAF50);
  
  // Gradientes ERP profissionais
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFF1976D2), Color(0xFF42A5F5)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [Color(0xFF546E7A), Color(0xFF90A4AE)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Cores ERP específicas
  static const Color surfaceTint = Color(0xFF1976D2);
  static const Color shadow = Color(0xFF000000);
  static const Color scrim = Color(0xFF000000);
  static const Color inverseSurface = Color(0xFF303030);
  static const Color onInverseSurface = Color(0xFFF5F5F5);
  static const Color inversePrimary = Color(0xFF90CAF9);
  
  // Cores específicas para ERP
  static const Color sidebarBackground = Color(0xFF263238);
  static const Color sidebarText = Color(0xFFFFFFFF);
  static const Color sidebarTextSecondary = Color(0xFFB0BEC5);
  static const Color headerBackground = Color(0xFFFFFFFF);
  static const Color cardBackground = Color(0xFFFFFFFF);
  static const Color divider = Color(0xFFE0E0E0);
}