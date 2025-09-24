// Barrel file para facilitar importações dos providers
// Permite importar todos os providers com uma única linha:
// import 'package:finance_app/providers/index.dart';

export 'auth_provider.dart';
export 'client_provider.dart';
export 'contract_provider.dart';
export 'payment_provider.dart';
export 'dashboard_provider.dart';
export 'app_provider_refactored.dart';

// Re-export do provider original para compatibilidade
export 'app_provider.dart';