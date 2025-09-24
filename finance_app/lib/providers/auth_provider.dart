import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';

class AuthProvider with ChangeNotifier {
  // Estado de autenticação
  User? _currentUser;
  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _error;
  
  // Getters
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Construtor
  AuthProvider() {
    _initializeAuth();
  }
  
  // Inicializar estado de autenticação
  void _initializeAuth() {
    print('🔧 [AUTH_PROVIDER] Inicializando autenticação...');
    _currentUser = SupabaseConfig.client.auth.currentUser;
    _isAuthenticated = _currentUser != null;
    print('🔧 [AUTH_PROVIDER] Usuário atual: ${_currentUser?.email}');
    print('🔧 [AUTH_PROVIDER] Está autenticado: $_isAuthenticated');
    
    // Escutar mudanças no estado de autenticação
    SupabaseConfig.client.auth.onAuthStateChange.listen((data) {
      print('🔧 [AUTH_PROVIDER] Mudança no estado de autenticação detectada');
      print('🔧 [AUTH_PROVIDER] Sessão: ${data.session != null}');
      print('🔧 [AUTH_PROVIDER] Usuário: ${data.session?.user?.email}');
      _currentUser = data.session?.user;
      _isAuthenticated = _currentUser != null;
      print('🔧 [AUTH_PROVIDER] Novo estado de autenticação: $_isAuthenticated');
      notifyListeners();
    });
  }
  
  // Métodos de autenticação
  Future<void> login(String email, String password) async {
    print('🔐 [LOGIN] Iniciando processo de login para: $email');
    _setLoading(true);
    try {
      print('🔐 [LOGIN] Fazendo login direto no Supabase...');
      
      // Fazer login diretamente no Supabase
      final response = await SupabaseConfig.client.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      print('🔐 [LOGIN] Resposta do Supabase: ${response.session != null}');
      
      if (response.session != null && response.user != null) {
        print('🔐 [LOGIN] Sessão criada com sucesso');
        print('🔐 [LOGIN] Dados do usuário: ${response.user!.email}');
        
        _currentUser = response.user;
        _isAuthenticated = true;
        _error = null;
        
        print('🔐 [LOGIN] Usuário autenticado com sucesso: ${_currentUser?.email}');
        print('🔐 [LOGIN] Estado de autenticação: $_isAuthenticated');
        
        print('🔐 [LOGIN] Login concluído com sucesso!');
      } else {
        print('❌ [LOGIN] Sessão ou usuário não encontrado na resposta');
        throw Exception('Falha no login');
      }
    } catch (e) {
      print('❌ [LOGIN] Erro durante o login: ${e.toString()}');
      _error = 'Erro no login: ${e.toString()}';
      throw e;
    } finally {
      print('🔐 [LOGIN] Finalizando processo de login (loading: false)');
      _setLoading(false);
    }
  }
  
  Future<void> logout() async {
    _setLoading(true);
    try {
      await SupabaseConfig.client.auth.signOut();
      _currentUser = null;
      _isAuthenticated = false;
      _error = null;
    } catch (e) {
      _error = 'Erro no logout: ${e.toString()}';
      throw e;
    } finally {
      _setLoading(false);
    }
  }
  
  Future<void> register(String email, String password, {Map<String, dynamic>? userData}) async {
    _setLoading(true);
    try {
      final response = await SupabaseConfig.client.auth.signUp(
        email: email,
        password: password,
        data: userData,
      );
      
      if (response.user != null) {
        _currentUser = response.user;
        _isAuthenticated = true;
        _error = null;
      } else {
        throw Exception('Falha no registro');
      }
    } catch (e) {
      _error = 'Erro no registro: ${e.toString()}';
      throw e;
    } finally {
      _setLoading(false);
    }
  }
  
  // Métodos auxiliares
  void _setLoading(bool loading) {
    print('⏳ [AUTH_STATE] Alterando estado de loading: $_isLoading -> $loading');
    _isLoading = loading;
    notifyListeners();
    print('🔔 [AUTH_STATE] Listeners notificados');
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
}