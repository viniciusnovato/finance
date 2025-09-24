import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/client.dart';
import '../models/contract.dart';
import '../models/payment.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';
import '../config/supabase_config.dart';

class AppProvider with ChangeNotifier {
  
  // Estado dos dados
  List<Client> _clients = [];
  List<Contract> _contracts = [];
  List<Payment> _payments = [];
  
  // Estado de carregamento
  bool _isLoading = false;
  String? _error;
  
  // Estado de autenticação
  User? _currentUser;
  bool _isAuthenticated = false;
  
  // Getters
  List<Client> get clients => _clients;
  List<Contract> get contracts => _contracts;
  List<Payment> get payments => _payments;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Getters de autenticação
  User? get currentUser => _currentUser;
  bool get isAuthenticated => _isAuthenticated;
  
  // Construtor
  AppProvider() {
    _initializeAuth();
  }
  
  // Inicializar estado de autenticação
  void _initializeAuth() {
    print('🔧 [PROVIDER] Inicializando autenticação...');
    _currentUser = SupabaseConfig.client.auth.currentUser;
    _isAuthenticated = _currentUser != null;
    print('🔧 [PROVIDER] Usuário atual: ${_currentUser?.email}');
    print('🔧 [PROVIDER] Está autenticado: $_isAuthenticated');
    
    // Escutar mudanças no estado de autenticação
    SupabaseConfig.client.auth.onAuthStateChange.listen((data) {
      print('🔧 [PROVIDER] Mudança no estado de autenticação detectada');
      print('🔧 [PROVIDER] Sessão: ${data.session != null}');
      print('🔧 [PROVIDER] Usuário: ${data.session?.user?.email}');
      _currentUser = data.session?.user;
      _isAuthenticated = _currentUser != null;
      print('🔧 [PROVIDER] Novo estado de autenticação: $_isAuthenticated');
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
  
  // Método removido - agora usando login direto no Supabase
  
  Future<void> logout() async {
    _setLoading(true);
    try {
      await SupabaseConfig.client.auth.signOut();
      _currentUser = null;
      _isAuthenticated = false;
      
      // Limpar dados locais
      _clients.clear();
      _contracts.clear();
      _payments.clear();
      
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
  
  // Métodos para clientes
  Future<void> loadClients({
    String? search,
    AttentionLevel? attentionLevel,
  }) async {
    print('🔧 [PROVIDER] Iniciando carregamento de clientes via API...');
    _setLoading(true);
    try {
      print('🔧 [PROVIDER] Chamando ApiService.getClients...');
       _clients = await ApiService.getClients(
         search: search,
         limit: 50,
       );
      print('🔧 [PROVIDER] Clientes carregados via API: ${_clients.length}');
      _error = null;
    } catch (e) {
      print('❌ [PROVIDER] Erro ao carregar clientes via API: $e');
      _error = 'Erro ao carregar clientes: $e';
    } finally {
      print('🔧 [PROVIDER] Finalizando carregamento de clientes...');
      _setLoading(false);
    }
  }

  // Versão silenciosa que não altera o estado de loading
  Future<void> loadClientsQuiet({
    String? search,
    AttentionLevel? attentionLevel,
  }) async {
    print('🔧 [PROVIDER] Carregamento silencioso de clientes...');
    try {
      _clients = await ApiService.getClients(
        search: search,
        limit: 50,
      );
      print('🔧 [PROVIDER] Clientes carregados silenciosamente: ${_clients.length}');
      _error = null;
      notifyListeners(); // Apenas notifica sem alterar loading
    } catch (e) {
      print('❌ [PROVIDER] Erro no carregamento silencioso de clientes: $e');
    }
  }

  Future<void> createClient(Client client) async {
    _setLoading(true);
    try {
      final newClient = await SupabaseService.createClient(client);
      _clients.add(newClient);
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao criar cliente: $e';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateClient(Client client) async {
    _setLoading(true);
    try {
      final updatedClient = await SupabaseService.updateClient(client);
      final index = _clients.indexWhere((c) => c.id == client.id);
      if (index != -1) {
        _clients[index] = updatedClient;
      }
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao atualizar cliente: $e';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> deleteClient(String clientId) async {
    _setLoading(true);
    try {
      await SupabaseService.deleteClient(clientId);
      _clients.removeWhere((c) => c.id == clientId);
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao deletar cliente: $e';
    } finally {
      _setLoading(false);
    }
  }
  
  // Métodos para contratos
  Future<void> loadContracts({
    String? clientId,
    String? search,
  }) async {
    _setLoading(true);
    try {
      print('🔧 [PROVIDER] Chamando ApiService.getContracts...');
      _contracts = await ApiService.getContracts(
        search: search,
        limit: 50,
      );
      print('🔧 [PROVIDER] Contratos carregados via API: ${_contracts.length}');
      _error = null;
    } catch (e) {
      print('❌ [PROVIDER] Erro ao carregar contratos via API: $e');
      _error = 'Erro ao carregar contratos: $e';
    } finally {
      _setLoading(false);
    }
  }

  // Versão silenciosa que não altera o estado de loading
  Future<void> loadContractsQuiet({
    String? clientId,
    String? search,
  }) async {
    print('🔧 [PROVIDER] Carregamento silencioso de contratos...');
    try {
      _contracts = await ApiService.getContracts(
        search: search,
        limit: 50,
      );
      print('🔧 [PROVIDER] Contratos carregados silenciosamente: ${_contracts.length}');
      _error = null;
      notifyListeners(); // Apenas notifica sem alterar loading
    } catch (e) {
      print('❌ [PROVIDER] Erro no carregamento silencioso de contratos: $e');
    }
  }

  Future<void> createContract(Contract contract) async {
    _setLoading(true);
    try {
      final newContract = await SupabaseService.createContract(contract);
      _contracts.add(newContract);
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao criar contrato: $e';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> updateContract(Contract contract) async {
    _setLoading(true);
    try {
      final updatedContract = await SupabaseService.updateContract(contract);
      final index = _contracts.indexWhere((c) => c.id == contract.id);
      if (index != -1) {
        _contracts[index] = updatedContract;
      }
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao atualizar contrato: $e';
    } finally {
      _setLoading(false);
    }
  }
  
  // Métodos para pagamentos
  Future<void> loadPayments({
    String? contractId,
    PaymentStatus? status,
    bool? overdue,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    _setLoading(true);
    try {
      print('🔧 [PROVIDER] Chamando ApiService.getPayments...');
      print('🔧 [PROVIDER] Parâmetros: contractId=$contractId, status=${status?.name}, overdue=$overdue, startDate=$startDate, endDate=$endDate');
      _payments = await ApiService.getPaymentsList(
        search: null,
        limit: 200,
        contractId: contractId,
        status: status?.name,
        overdueOnly: overdue ?? false,
        startDate: startDate,
        endDate: endDate,
      );
      print('🔧 [PROVIDER] Pagamentos carregados via API: ${_payments.length}');
      _error = null;
    } catch (e) {
      print('❌ [PROVIDER] Erro ao carregar pagamentos via API: $e');
      _error = 'Erro ao carregar pagamentos: $e';
    } finally {
      _setLoading(false);
    }
  }

  // Método para atualizar a lista de pagamentos diretamente
  void updatePaymentsList(List<Payment> payments) {
    _payments = payments;
    _error = null;
    notifyListeners();
  }

  // Versão silenciosa que não altera o estado de loading
  Future<void> loadPaymentsQuiet({
    String? contractId,
    PaymentStatus? status,
    bool? overdue,
  }) async {
    print('🔧 [PROVIDER] Carregamento silencioso de pagamentos...');
    try {
      _payments = await ApiService.getPaymentsList(
        search: null,
        limit: 200,
        contractId: contractId,
        status: status?.name,
        overdueOnly: overdue ?? false,
      );
      print('🔧 [PROVIDER] Pagamentos carregados silenciosamente: ${_payments.length}');
      _error = null;
      notifyListeners(); // Apenas notifica sem alterar loading
    } catch (e) {
      print('❌ [PROVIDER] Erro no carregamento silencioso de pagamentos: $e');
    }
  }

  Future<void> updatePayment(Payment payment) async {
    _setLoading(true);
    try {
      final updatedPayment = await SupabaseService.updatePayment(payment);
      final index = _payments.indexWhere((p) => p.id == payment.id);
      if (index != -1) {
        _payments[index] = updatedPayment;
      }
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao atualizar pagamento: $e';
    } finally {
      _setLoading(false);
    }
  }
  
  // Cache para dados do dashboard
  Map<String, dynamic>? _dashboardCache;
  DateTime? _dashboardCacheTime;
  Future<Map<String, dynamic>>? _dashboardFuture;
  
  // Métodos de relatório
  Future<Map<String, dynamic>> getDashboardData() async {
    print('📊 [DASHBOARD] === MÉTODO getDashboardData CHAMADO ===');
    print('📊 [DASHBOARD] Iniciando carregamento de dados do dashboard...');
    
    // TEMPORÁRIO: Sempre fazer nova requisição para debug
    print('📊 [DASHBOARD] Fazendo requisição direta (sem cache)');
    return await _fetchDashboardData();
  }
  
  Future<Map<String, dynamic>> _fetchDashboardData() async {
    try {
      print('📊 [DASHBOARD] === INICIANDO NOVA REQUISIÇÃO ===');
      print('📊 [DASHBOARD] Fazendo requisição para /api/dashboard/stats...');
      print('📊 [DASHBOARD] URL: http://localhost:3001/api/dashboard/stats');
      print('📊 [DASHBOARD] Timestamp: ${DateTime.now()}');
      
      // Buscar dados do dashboard da API com timeout maior
      final response = await http.get(
        Uri.parse('http://localhost:3001/api/dashboard/stats'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(Duration(seconds: 30));
      
      print('📊 [DASHBOARD] Resposta recebida com status: ${response.statusCode}');
      print('📊 [DASHBOARD] Tamanho da resposta: ${response.body.length} bytes');
      
      if (response.statusCode == 200) {
        print('📊 [DASHBOARD] Processando resposta da API...');
        final responseData = json.decode(response.body);
        final stats = responseData['stats'] ?? {};
        print('📊 [DASHBOARD] Stats recebidos com sucesso');
        
        // Mapear dados da API para o formato esperado pelo frontend
        final data = {
          'total_clients': stats['clients']?['total'] ?? 0,
          'active_contracts': stats['contracts']?['active'] ?? 0,
          'overdue_payments': stats['payments']?['overdue'] ?? 0,
          'payments': {
            'pending': stats['payments']?['pending'] ?? 0,
            'paid': stats['payments']?['paid'] ?? 0,
            'overdue': stats['payments']?['overdue'] ?? 0,
            'total': stats['payments']?['total'] ?? 0,
          },
          'total_receivable': stats['payment_summary']?['total_amount_remaining'] ?? 0.0,
          'total_received': stats['payment_summary']?['total_amount_paid'] ?? 0.0,
          'payment_summary': {
            'average_payment_percentage': stats['metrics']?['average_percentage_paid'] ?? 0.0,
            'fully_paid_contracts': stats['payment_summary']?['fully_paid_contracts'] ?? 0,
          },
        };
        
        print('📊 [DASHBOARD] Dados processados com sucesso');
        _error = null;
        return data;
      } else {
        print('❌ [DASHBOARD] Erro na resposta da API: ${response.statusCode}');
        throw Exception('Erro ao buscar estatísticas do dashboard');
      }
    } catch (e) {
      print('❌ [DASHBOARD] Erro capturado: $e');
      print('❌ [DASHBOARD] Tipo do erro: ${e.runtimeType}');
      if (e.toString().contains('TimeoutException')) {
        print('❌ [DASHBOARD] Timeout na requisição - servidor pode estar sobrecarregado');
        _error = 'Timeout na conexão com o servidor. Tente novamente.';
      } else if (e.toString().contains('SocketException')) {
        print('❌ [DASHBOARD] Erro de conexão - servidor pode estar offline');
        _error = 'Erro de conexão. Verifique se o servidor está rodando.';
      } else {
        print('❌ [DASHBOARD] Erro desconhecido: $e');
        _error = 'Erro ao carregar dados do dashboard: $e';
      }
      
      // Fallback para dados locais
      print('📊 [DASHBOARD] Usando dados locais como fallback...');
      final totalClients = _clients.length;
      final activeContracts = getActiveContracts().length;
      final overduePayments = getOverduePaymentsLocal().length;
      final totalReceivable = getTotalReceivable();
      final totalReceived = getTotalReceived();
      
      final fallbackData = {
        'total_clients': totalClients,
        'active_contracts': activeContracts,
        'overdue_payments': overduePayments,
        'total_receivable': totalReceivable,
        'total_received': totalReceived,
        'payment_summary': {
          'average_payment_percentage': 0.0,
          'fully_paid_contracts': 0,
        },
      };
      print('📊 [DASHBOARD] Dados locais: $fallbackData');
      return fallbackData;
    }
  }
  
  Future<List<Payment>> getOverduePayments() async {
    _setLoading(true);
    try {
      // Carregar todos os pagamentos e filtrar os em atraso
      await loadPayments();
      final overduePayments = getOverduePaymentsLocal();
      _error = null;
      return overduePayments;
    } catch (e) {
      _error = 'Erro ao carregar pagamentos em atraso: $e';
      return [];
    } finally {
      _setLoading(false);
    }
  }
  
  // Métodos auxiliares
  void _setLoading(bool loading) {
    print('⏳ [STATE] Alterando estado de loading: $_isLoading -> $loading');
    _isLoading = loading;
    notifyListeners();
    print('🔔 [STATE] Listeners notificados');
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  // Filtros e buscas locais
  List<Client> getClientsByAttention(AttentionLevel level) {
    return _clients.where((client) => client.attentionLevel == level).toList();
  }
  
  List<Contract> getActiveContracts() {
    return _contracts.where((contract) => contract.status == ContractStatus.active).toList();
  }
  
  List<Payment> getOverduePaymentsLocal() {
    return _payments.where((payment) => payment.isOverdue).toList();
  }
  
  double getTotalReceivable() {
    // Calcular o total a receber baseado nos contratos e pagamentos
    double totalReceivable = 0.0;
    
    for (final contract in _contracts) {
      // Valor total do contrato
      final contractValue = contract.totalAmount;
      
      // Entrada já paga
      final downPayment = contract.downPayment;
      
      // Parcelas pagas para este contrato
      final paidPayments = _payments
          .where((payment) => 
              payment.contractId == contract.id && 
              payment.status == PaymentStatus.paid)
          .fold(0.0, (sum, payment) => sum + payment.amount);
      
      // Total pago = entrada + parcelas pagas
      final totalPaid = downPayment + paidPayments;
      
      // Valor restante a receber = valor total - total pago
      final remainingAmount = contractValue - totalPaid;
      
      // Adicionar apenas se ainda há valor a receber
      if (remainingAmount > 0) {
        totalReceivable += remainingAmount;
      }
    }
    
    return totalReceivable;
  }
  
  double getTotalReceived() {
    return _payments
        .where((payment) => payment.status == PaymentStatus.paid)
        .fold(0.0, (sum, payment) => sum + payment.amount);
  }
}