import 'package:flutter/foundation.dart';
import '../models/client.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';

class ClientProvider with ChangeNotifier {
  // Estado dos dados
  List<Client> _clients = [];
  
  // Estado de carregamento
  bool _isLoading = false;
  String? _error;
  
  // Getters
  List<Client> get clients => _clients;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Métodos para clientes
  Future<void> loadClients({
    String? search,
    AttentionLevel? attentionLevel,
  }) async {
    print('🔧 [CLIENT_PROVIDER] Iniciando carregamento de clientes via API...');
    _setLoading(true);
    try {
      print('🔧 [CLIENT_PROVIDER] Chamando ApiService.getClients...');
      _clients = await ApiService.getClients(
        search: search,
        limit: 50,
      );
      print('🔧 [CLIENT_PROVIDER] Clientes carregados via API: ${_clients.length}');
      _error = null;
    } catch (e) {
      print('❌ [CLIENT_PROVIDER] Erro ao carregar clientes via API: $e');
      _error = 'Erro ao carregar clientes: $e';
    } finally {
      print('🔧 [CLIENT_PROVIDER] Finalizando carregamento de clientes...');
      _setLoading(false);
    }
  }

  // Versão silenciosa que não altera o estado de loading
  Future<void> loadClientsQuiet({
    String? search,
    AttentionLevel? attentionLevel,
  }) async {
    print('🔧 [CLIENT_PROVIDER] Carregamento silencioso de clientes...');
    try {
      _clients = await ApiService.getClients(
        search: search,
        limit: 50,
      );
      print('🔧 [CLIENT_PROVIDER] Clientes carregados silenciosamente: ${_clients.length}');
      _error = null;
      notifyListeners(); // Apenas notifica sem alterar loading
    } catch (e) {
      print('❌ [CLIENT_PROVIDER] Erro no carregamento silencioso de clientes: $e');
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
  
  // Filtros e buscas locais
  List<Client> getClientsByAttention(AttentionLevel level) {
    return _clients.where((client) => client.attentionLevel == level).toList();
  }
  
  Client? getClientById(String id) {
    try {
      return _clients.firstWhere((client) => client.id == id);
    } catch (e) {
      return null;
    }
  }
  
  List<Client> searchClients(String query) {
    if (query.isEmpty) return _clients;
    
    final lowerQuery = query.toLowerCase();
    return _clients.where((client) {
      return client.fullName.toLowerCase().contains(lowerQuery) ||
             (client.email?.toLowerCase().contains(lowerQuery) ?? false) ||
             (client.phone?.toLowerCase().contains(lowerQuery) ?? false) ||
             (client.taxId?.toLowerCase().contains(lowerQuery) ?? false);
    }).toList();
  }
  
  // Métodos auxiliares
  void _setLoading(bool loading) {
    print('⏳ [CLIENT_STATE] Alterando estado de loading: $_isLoading -> $loading');
    _isLoading = loading;
    notifyListeners();
    print('🔔 [CLIENT_STATE] Listeners notificados');
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  void clearClients() {
    _clients.clear();
    notifyListeners();
  }
}