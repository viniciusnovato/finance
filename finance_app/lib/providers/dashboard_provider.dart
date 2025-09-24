import 'package:flutter/foundation.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/client.dart';
import '../models/contract.dart';
import '../models/payment.dart';
import '../services/api_service.dart';

class DashboardData {
  final int totalClients;
  final int totalContracts;
  final int totalPayments;
  final double totalReceivable;
  final double totalReceived;
  final double totalOverdue;
  final List<Payment> overduePayments;
  final List<Client> clientsNeedingAttention;
  final List<Contract> activeContracts;
  
  DashboardData({
    required this.totalClients,
    required this.totalContracts,
    required this.totalPayments,
    required this.totalReceivable,
    required this.totalReceived,
    required this.totalOverdue,
    required this.overduePayments,
    required this.clientsNeedingAttention,
    required this.activeContracts,
  });
}

class DashboardProvider with ChangeNotifier {
  // Estado dos dados
  DashboardData? _dashboardData;
  DateTime? _lastFetch;
  
  // Estado de carregamento
  bool _isLoading = false;
  String? _error;
  
  // Cache temporário (5 minutos)
  static const Duration _cacheTimeout = Duration(minutes: 5);
  
  // Getters
  DashboardData? get dashboardData => _dashboardData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get hasData => _dashboardData != null;
  
  // Verificar se o cache ainda é válido
  bool get _isCacheValid {
    if (_lastFetch == null) return false;
    return DateTime.now().difference(_lastFetch!) < _cacheTimeout;
  }
  
  // Carregar dados do dashboard
  Future<void> loadDashboardData({bool forceRefresh = false}) async {
    // Se tem cache válido e não é refresh forçado, retorna os dados em cache
    if (_isCacheValid && !forceRefresh && _dashboardData != null) {
      print('🔧 [DASHBOARD_PROVIDER] Usando dados em cache');
      return;
    }
    
    print('🔧 [DASHBOARD_PROVIDER] Iniciando carregamento de dados do dashboard...');
    _setLoading(true);
    
    try {
      // Tentar buscar dados via API backend primeiro
      await _fetchDashboardDataFromApi();
    } catch (e) {
      print('❌ [DASHBOARD_PROVIDER] Erro ao buscar dados via API: $e');
      // Fallback: buscar dados localmente
      try {
        await _fetchDashboardDataLocally();
      } catch (localError) {
        print('❌ [DASHBOARD_PROVIDER] Erro ao buscar dados localmente: $localError');
        _error = 'Erro ao carregar dados do dashboard: $localError';
      }
    } finally {
      _setLoading(false);
    }
  }
  
  // Buscar dados via API do backend
  Future<void> _fetchDashboardDataFromApi() async {
    print('🔧 [DASHBOARD_PROVIDER] Buscando dados via API backend...');
    
    const String baseUrl = 'http://127.0.0.1:3001/api';
    final headers = {'Content-Type': 'application/json'};
    
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/dashboard'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        
        _dashboardData = DashboardData(
          totalClients: data['totalClients'] ?? 0,
          totalContracts: data['totalContracts'] ?? 0,
          totalPayments: data['totalPayments'] ?? 0,
          totalReceivable: (data['totalReceivable'] ?? 0).toDouble(),
          totalReceived: (data['totalReceived'] ?? 0).toDouble(),
          totalOverdue: (data['totalOverdue'] ?? 0).toDouble(),
          overduePayments: (data['overduePayments'] as List? ?? [])
              .map((json) => Payment.fromJson(json))
              .toList(),
          clientsNeedingAttention: (data['clientsNeedingAttention'] as List? ?? [])
              .map((json) => Client.fromJson(json))
              .toList(),
          activeContracts: (data['activeContracts'] as List? ?? [])
              .map((json) => Contract.fromJson(json))
              .toList(),
        );
        
        _lastFetch = DateTime.now();
        _error = null;
        print('🔧 [DASHBOARD_PROVIDER] Dados carregados via API com sucesso');
      } else {
        throw Exception('Erro HTTP: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ [DASHBOARD_PROVIDER] Erro na requisição da API: $e');
      throw e;
    }
  }
  
  // Buscar dados localmente (fallback)
  Future<void> _fetchDashboardDataLocally() async {
    print('🔧 [DASHBOARD_PROVIDER] Buscando dados localmente (fallback)...');
    
    try {
      // Buscar dados básicos via ApiService
      final clients = await ApiService.getClients(limit: 1000);
      final contracts = await ApiService.getContracts(limit: 1000);
      final payments = await ApiService.getPayments(limit: 1000);
      
      // Calcular estatísticas
      final activeContracts = contracts.where((c) => c.status == ContractStatus.active).toList();
      final overduePayments = payments.where((p) => 
        p.dueDate.isBefore(DateTime.now()) && p.status == PaymentStatus.pending
      ).toList();
      final clientsNeedingAttention = clients.where((c) => 
        c.attentionLevel == AttentionLevel.risk || c.attentionLevel == AttentionLevel.severeDelay
      ).toList();
      
      final totalReceivable = payments
          .where((p) => p.status == PaymentStatus.pending)
          .fold(0.0, (sum, p) => sum + p.amount);
      final totalReceived = payments
          .where((p) => p.status == PaymentStatus.paid)
          .fold(0.0, (sum, p) => sum + p.amount);
      final totalOverdue = overduePayments
          .fold(0.0, (sum, p) => sum + p.amount);
      
      _dashboardData = DashboardData(
        totalClients: clients.length,
        totalContracts: contracts.length,
        totalPayments: payments.length,
        totalReceivable: totalReceivable,
        totalReceived: totalReceived,
        totalOverdue: totalOverdue,
        overduePayments: overduePayments,
        clientsNeedingAttention: clientsNeedingAttention,
        activeContracts: activeContracts,
      );
      
      _lastFetch = DateTime.now();
      _error = null;
      print('🔧 [DASHBOARD_PROVIDER] Dados carregados localmente com sucesso');
    } catch (e) {
      print('❌ [DASHBOARD_PROVIDER] Erro ao buscar dados localmente: $e');
      throw e;
    }
  }
  
  // Métodos de conveniência para acessar dados específicos
  List<Payment> getOverduePayments() {
    return _dashboardData?.overduePayments ?? [];
  }
  
  List<Client> getClientsNeedingAttention() {
    return _dashboardData?.clientsNeedingAttention ?? [];
  }
  
  List<Contract> getActiveContracts() {
    return _dashboardData?.activeContracts ?? [];
  }
  
  double getTotalReceivable() {
    return _dashboardData?.totalReceivable ?? 0.0;
  }
  
  double getTotalReceived() {
    return _dashboardData?.totalReceived ?? 0.0;
  }
  
  double getTotalOverdue() {
    return _dashboardData?.totalOverdue ?? 0.0;
  }
  
  // Métodos auxiliares
  void _setLoading(bool loading) {
    print('⏳ [DASHBOARD_STATE] Alterando estado de loading: $_isLoading -> $loading');
    _isLoading = loading;
    notifyListeners();
    print('🔔 [DASHBOARD_STATE] Listeners notificados');
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  void clearCache() {
    _dashboardData = null;
    _lastFetch = null;
    notifyListeners();
  }
  
  // Refresh manual dos dados
  Future<void> refresh() async {
    await loadDashboardData(forceRefresh: true);
  }
}