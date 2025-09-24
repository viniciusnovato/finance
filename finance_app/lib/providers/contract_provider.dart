import 'package:flutter/foundation.dart';
import '../models/contract.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';

class ContractProvider with ChangeNotifier {
  // Estado dos dados
  List<Contract> _contracts = [];
  
  // Estado de carregamento
  bool _isLoading = false;
  String? _error;
  
  // Getters
  List<Contract> get contracts => _contracts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Métodos para contratos
  Future<void> loadContracts({
    String? clientId,
    String? search,
    String? status,
  }) async {
    print('🔧 [CONTRACT_PROVIDER] Iniciando carregamento de contratos via API...');
    _setLoading(true);
    try {
      print('🔧 [CONTRACT_PROVIDER] Chamando ApiService.getContracts...');
      _contracts = await ApiService.getContracts(
        clientId: clientId,
        search: search,
        status: status,
        limit: 50,
      );
      print('🔧 [CONTRACT_PROVIDER] Contratos carregados via API: ${_contracts.length}');
      _error = null;
    } catch (e) {
      print('❌ [CONTRACT_PROVIDER] Erro ao carregar contratos via API: $e');
      _error = 'Erro ao carregar contratos: $e';
    } finally {
      print('🔧 [CONTRACT_PROVIDER] Finalizando carregamento de contratos...');
      _setLoading(false);
    }
  }

  // Versão silenciosa que não altera o estado de loading
  Future<void> loadContractsQuiet({
    String? clientId,
    String? search,
    String? status,
  }) async {
    print('🔧 [CONTRACT_PROVIDER] Carregamento silencioso de contratos...');
    try {
      _contracts = await ApiService.getContracts(
        clientId: clientId,
        search: search,
        status: status,
        limit: 50,
      );
      print('🔧 [CONTRACT_PROVIDER] Contratos carregados silenciosamente: ${_contracts.length}');
      _error = null;
      notifyListeners(); // Apenas notifica sem alterar loading
    } catch (e) {
      print('❌ [CONTRACT_PROVIDER] Erro no carregamento silencioso de contratos: $e');
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

  Future<void> deleteContract(String contractId) async {
    _setLoading(true);
    try {
      await ApiService.deleteContract(contractId);
      _contracts.removeWhere((c) => c.id == contractId);
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao deletar contrato: $e';
    } finally {
      _setLoading(false);
    }
  }
  
  // Filtros e buscas locais
  List<Contract> getActiveContracts() {
    return _contracts.where((contract) => contract.status == ContractStatus.active).toList();
  }
  
  List<Contract> getContractsByClient(String clientId) {
    return _contracts.where((contract) => contract.clientId == clientId).toList();
  }
  
  List<Contract> getContractsByStatus(ContractStatus status) {
    return _contracts.where((contract) => contract.status == status).toList();
  }
  
  Contract? getContractById(String id) {
    try {
      return _contracts.firstWhere((contract) => contract.id == id);
    } catch (e) {
      return null;
    }
  }
  
  List<Contract> searchContracts(String query) {
    if (query.isEmpty) return _contracts;
    
    final lowerQuery = query.toLowerCase();
    return _contracts.where((contract) {
      return contract.treatmentDescription.toLowerCase().contains(lowerQuery) ||
             (contract.notes?.toLowerCase().contains(lowerQuery) ?? false) ||
             contract.clientId.toLowerCase().contains(lowerQuery);
    }).toList();
  }
  
  // Cálculos e estatísticas
  double getTotalContractValue() {
    return _contracts.fold(0.0, (sum, contract) => sum + contract.totalAmount);
  }
  
  double getTotalActiveContractValue() {
    return getActiveContracts().fold(0.0, (sum, contract) => sum + contract.totalAmount);
  }
  
  int getContractCount() => _contracts.length;
  int getActiveContractCount() => getActiveContracts().length;
  
  // Métodos auxiliares
  void _setLoading(bool loading) {
    print('⏳ [CONTRACT_STATE] Alterando estado de loading: $_isLoading -> $loading');
    _isLoading = loading;
    notifyListeners();
    print('🔔 [CONTRACT_STATE] Listeners notificados');
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  void clearContracts() {
    _contracts.clear();
    notifyListeners();
  }
}