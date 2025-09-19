import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'providers/index.dart'; // Importa todos os providers
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/clients_screen.dart';
import 'utils/app_colors.dart';

/// Exemplo de main.dart refatorado usando a nova arquitetura de providers
/// Este arquivo demonstra como usar os providers separados com MultiProvider
/// 
/// Para usar esta versão refatorada:
/// 1. Renomeie main.dart para main_original.dart
/// 2. Renomeie este arquivo para main.dart
/// 3. Atualize as telas para usar os providers específicos

void main() async {
  print('🚀 [MAIN] Iniciando aplicação refatorada...');
  WidgetsFlutterBinding.ensureInitialized();
  
  print('🚀 [MAIN] Inicializando Supabase...');
  print('🚀 [MAIN] URL: ${SupabaseConfig.url}');
  print('🚀 [MAIN] Anon Key: ${SupabaseConfig.anonKey.substring(0, 20)}...');
  
  // Initialize Supabase
  await Supabase.initialize(
    url: SupabaseConfig.url,
    anonKey: SupabaseConfig.anonKey,
  );
  
  print('✅ [MAIN] Supabase inicializado com sucesso');
  print('🚀 [MAIN] Executando aplicação refatorada...');
  
  runApp(const MyAppRefactored());
}

class MyAppRefactored extends StatelessWidget {
  const MyAppRefactored({super.key});

  @override
  Widget build(BuildContext context) {
    print('📱 [APP] Build do MyAppRefactored chamado');
    
    // Opção 1: Usar o AppProviderRefactored (recomendado para transição gradual)
    return ChangeNotifierProvider(
      create: (context) {
        print('📱 [APP] Criando AppProviderRefactored...');
        final provider = AppProviderRefactored();
        print('📱 [APP] AppProviderRefactored criado com sucesso');
        return provider;
      },
      child: _buildMaterialApp(),
    );
    
    // Opção 2: Usar MultiProvider com providers separados (arquitetura final)
    // Descomente o código abaixo e comente o código acima para usar esta opção
    /*
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ClientProvider()),
        ChangeNotifierProvider(create: (_) => ContractProvider()),
        ChangeNotifierProvider(create: (_) => PaymentProvider()),
        ChangeNotifierProvider(create: (_) => DashboardProvider()),
      ],
      child: _buildMaterialApp(),
    );
    */
  }
  
  Widget _buildMaterialApp() {
    return MaterialApp(
      title: 'Finance App - Refatorado',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.light(
          primary: AppColors.primary,
          onPrimary: AppColors.onPrimary,
          primaryContainer: AppColors.primaryContainer,
          onPrimaryContainer: AppColors.onPrimaryContainer,
          secondary: AppColors.secondary,
          onSecondary: AppColors.onSecondary,
          secondaryContainer: AppColors.secondaryContainer,
          onSecondaryContainer: AppColors.onSecondaryContainer,
          tertiary: AppColors.tertiary,
          onTertiary: AppColors.onTertiary,
          tertiaryContainer: AppColors.tertiaryContainer,
          onTertiaryContainer: AppColors.onTertiaryContainer,
          error: AppColors.error,
          onError: AppColors.onError,
          errorContainer: AppColors.errorContainer,
          onErrorContainer: AppColors.onErrorContainer,
          surface: AppColors.surface,
          onSurface: AppColors.onSurface,
          surfaceVariant: AppColors.surfaceVariant,
          onSurfaceVariant: AppColors.onSurfaceVariant,
          background: AppColors.background,
          onBackground: AppColors.onBackground,
          outline: AppColors.outline,
          outlineVariant: AppColors.outlineVariant,
          surfaceTint: AppColors.surfaceTint,
          shadow: AppColors.shadow,
          scrim: AppColors.scrim,
          inverseSurface: AppColors.inverseSurface,
          onInverseSurface: AppColors.onInverseSurface,
          inversePrimary: AppColors.inversePrimary,
        ),
      ),
      home: const AuthWrapper(),
    );
  }
}

/// Widget que gerencia a navegação baseada no estado de autenticação
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    print('🔐 [AUTH_WRAPPER] Build chamado');
    
    // Usando AppProviderRefactored
    return Consumer<AppProviderRefactored>(
      builder: (context, appProvider, child) {
        print('🔐 [AUTH_WRAPPER] Estado de autenticação: ${appProvider.isAuthenticated}');
        
        if (!appProvider.isInitialized) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        if (appProvider.isAuthenticated) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
    
    // Para usar com MultiProvider, substitua o Consumer acima por:
    /*
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        print('🔐 [AUTH_WRAPPER] Estado de autenticação: ${authProvider.isAuthenticated}');
        
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }
        
        if (authProvider.isAuthenticated) {
          return const HomeScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
    */
  }
}