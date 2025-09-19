import 'package:flutter/foundation.dart';
import 'auth_provider.dart';
import 'client_provider.dart';
import 'contract_provider.dart';
import 'payment_provider.dart';
import 'dashboard_provider.dart';

/// Provider principal que coordena todos os outros providers
/// Segue o princípio da responsabilidade única delegando operações específicas
class AppProviderRefactored with ChangeNotifier {
  // Providers específicos
  late final AuthProvider _authProvider;
  late final ClientProvider _clientProvider;
  late final ContractProvider _contractProvider;
  late final PaymentProvider _paymentProvider;
  late final DashboardProvider _dashboardProvider;
  
  // Getters para acessar os providers
  AuthProvider get auth => _authProvider;
  ClientProvider get clients => _clientProvider;
  ContractProvider get contracts => _contractProvider;
  PaymentProvider get payments => _paymentProvider;
  DashboardProvider get dashboard => _dashboardProvider;
  
  // Estado geral da aplicação
  bool _isInitialized = false;
  String? _globalError;
  
  // Getters
  bool get isInitialized => _isInitialized;
  String? get globalError => _globalError;
  
  // Getters de conveniência que delegam para os providers específicos
  bool get isAuthenticated => _authProvider.isAuthenticated;
  bool get isLoading => _authProvider.isLoading || 
                       _clientProvider.isLoading || 
                       _contractProvider.isLoading || 
                       _paymentProvider.isLoading || 
                       _dashboardProvider.isLoading;
  
  // Construtor
  AppProviderRefactored() {
    _initializeProviders();
  }
  
  // Inicializar todos os providers
  void _initializeProviders() {
    print('🔧 [APP_PROVIDER] Inicializando providers...');
    
    // Criar instâncias dos providers
    _authProvider = AuthProvider();
    _clientProvider = ClientProvider();
    _contractProvider = ContractProvider();
    _paymentProvider = PaymentProvider();
    _dashboardProvider = DashboardProvider();
    
    // Escutar mudanças nos providers e repassar para os listeners
    _authProvider.addListener(_onProviderChanged);
    _clientProvider.addListener(_onProviderChanged);
    _contractProvider.addListener(_onProviderChanged);
    _paymentProvider.addListener(_onProviderChanged);
    _dashboardProvider.addListener(_onProviderChanged);
    
    // Escutar mudanças específicas de autenticação
    _authProvider.addListener(_onAuthChanged);
    
    _isInitialized = true;
    print('🔧 [APP_PROVIDER] Providers inicializados com sucesso');
  }
  
  // Callback quando qualquer provider muda
  void _onProviderChanged() {
    notifyListeners();
  }
  
  // Callback específico para mudanças de autenticação
  void _onAuthChanged() {
    if (!_authProvider.isAuthenticated) {
      // Limpar dados quando usuário faz logout
      _clearAllData();
    } else {
      // Carregar dados quando usuário faz login
      _loadInitialData();
    }
  }
  
  // Carregar dados iniciais após login
  Future<void> _loadInitialData() async {
    print('🔧 [APP_PROVIDER] Carregando dados iniciais...');
    try {
      // Carregar dados em paralelo para melhor performance
      await Future.wait([
        _clientProvider.loadClientsQuiet(),
        _contractProvider.loadContractsQuiet(),
        _paymentProvider.loadPaymentsQuiet(),
        _dashboardProvider.loadDashboardData(),
      ]);
      print('🔧 [APP_PROVIDER] Dados iniciais carregados com sucesso');
    } catch (e) {
      print('❌ [APP_PROVIDER] Erro ao carregar dados iniciais: $e');
      _globalError = 'Erro ao carregar dados iniciais: $e';
      notifyListeners();
    }
  }
  
  // Limpar todos os dados
  void _clearAllData() {
    print('🔧 [APP_PROVIDER] Limpando todos os dados...');
    _clientProvider.clearClients();
    _contractProvider.clearContracts();
    _paymentProvider.clearPayments();
    _dashboardProvider.clearCache();
    _globalError = null;
    print('🔧 [APP_PROVIDER] Dados limpos');
  }
  
  // Métodos de conveniência para operações comuns
  
  // Autenticação
  Future<void> login(String email, String password) async {
    await _authProvider.login(email, password);
  }
  
  Future<void> logout() async {
    await _authProvider.logout();
  }
  
  Future<void> register(String email, String password, {Map<String, dynamic>? userData}) async {
    await _authProvider.register(email, password, userData: userData);
  }
  
  // Refresh geral de dados
  Future<void> refreshAllData() async {
    print('🔧 [APP_PROVIDER] Atualizando todos os dados...');
    try {
      await Future.wait([
        _clientProvider.loadClients(),
        _contractProvider.loadContracts(),
        _paymentProvider.loadPayments(),
        _dashboardProvider.refresh(),
      ]);
      _globalError = null;
      print('🔧 [APP_PROVIDER] Todos os dados atualizados com sucesso');
    } catch (e) {
      print('❌ [APP_PROVIDER] Erro ao atualizar dados: $e');
      _globalError = 'Erro ao atualizar dados: $e';
    }
    notifyListeners();
  }
  
  // Limpar erros globais
  void clearGlobalError() {
    _globalError = null;
    notifyListeners();
  }
  
  // Limpar todos os erros
  void clearAllErrors() {
    _globalError = null;
    _authProvider.clearError();
    _clientProvider.clearError();
    _contractProvider.clearError();
    _paymentProvider.clearError();
    _dashboardProvider.clearError();
    notifyListeners();
  }
  
  @override
  void dispose() {
    // Remover listeners
    _authProvider.removeListener(_onProviderChanged);
    _clientProvider.removeListener(_onProviderChanged);
    _contractProvider.removeListener(_onProviderChanged);
    _paymentProvider.removeListener(_onProviderChanged);
    _dashboardProvider.removeListener(_onProviderChanged);
    _authProvider.removeListener(_onAuthChanged);
    
    // Dispose dos providers
    _authProvider.dispose();
    _clientProvider.dispose();
    _contractProvider.dispose();
    _paymentProvider.dispose();
    _dashboardProvider.dispose();
    
    super.dispose();
  }
}