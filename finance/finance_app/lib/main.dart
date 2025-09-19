import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'providers/app_provider.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';
import 'screens/clients_screen.dart';
import 'utils/app_colors.dart';

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    print('🏠 [AUTH_WRAPPER] Build chamado - modo desenvolvimento, sempre mostrando HomeScreen');
    // Durante o desenvolvimento, sempre mostrar HomeScreen
    return const HomeScreen();
  }
}

void main() async {
  print('🚀 [MAIN] Iniciando aplicação...');
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
  print('🚀 [MAIN] Executando aplicação...');
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    print('📱 [APP] Build do MyApp chamado');
    return ChangeNotifierProvider(
      create: (context) {
        print('📱 [APP] Criando AppProvider...');
        final provider = AppProvider();
        print('📱 [APP] AppProvider criado com sucesso');
        return provider;
      },
      child: MaterialApp(
        title: 'Finance App',
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
          // Material 3 AppBar theme
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
            scrolledUnderElevation: 3,
          ),
          // Material 3 Card theme with updated elevation and shape
           cardTheme: CardThemeData(
             elevation: 1,
             shape: RoundedRectangleBorder(
               borderRadius: BorderRadius.circular(12),
             ),
             clipBehavior: Clip.antiAlias,
           ),
          // Material 3 Button themes
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              elevation: 1,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
          filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
          outlinedButtonTheme: OutlinedButtonThemeData(
            style: OutlinedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: 24,
                vertical: 12,
              ),
            ),
          ),
          // Material 3 Input decoration theme
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          // Material 3 Navigation themes
          navigationBarTheme: NavigationBarThemeData(
            height: 80,
            labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
            indicatorShape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
          ),
          // Material 3 FAB theme
          floatingActionButtonTheme: const FloatingActionButtonThemeData(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.all(Radius.circular(16)),
            ),
          ),
        ),
      home: const AuthWrapper(),
      ),
    );
  }
}
