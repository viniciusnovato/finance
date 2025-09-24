import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../models/client.dart';
import '../models/contract.dart';
import '../models/payment.dart';

class SupabaseService {
  static final SupabaseClient _client = SupabaseConfig.client;

  // =====================================================
  // CLIENTES
  // =====================================================

  static Future<List<Client>> getClients({
    int? limit,
    int? offset,
    String? searchTerm,
    AttentionLevel? attentionLevel,
  }) async {
    try {
      print('🔧 [SUPABASE] Iniciando consulta de clientes...');
      dynamic query = _client.from('clients').select();
      
      if (searchTerm != null && searchTerm.isNotEmpty) {
        query = query.or(
          'first_name.ilike.%$searchTerm%,last_name.ilike.%$searchTerm%,email.ilike.%$searchTerm%'
        );
      }
      
      if (attentionLevel != null) {
        query = query.eq('attention_level', attentionLevel.name);
      }
      
      if (limit != null) {
        query = query.limit(limit);
      }
      
      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 10) - 1);
      }
      
      print('🔧 [SUPABASE] Executando query...');
      final response = await query.order('created_at', ascending: false);
      print('🔧 [SUPABASE] Resposta recebida: ${response.length} registros');
      
      return (response as List)
          .map((json) => Client.fromJson(json))
          .toList();
    } catch (e) {
      print('❌ [SUPABASE] Erro na consulta: $e');
      throw Exception('Erro ao buscar clientes: $e');
    }
  }

  static Future<Client?> getClientById(String id) async {
    try {
      final response = await _client
          .from('clients')
          .select()
          .eq('id', id)
          .single();
      
      return Client.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  static Future<Client> createClient(Client client) async {
    try {
      final response = await _client
          .from('clients')
          .insert(client.toJson())
          .select()
          .single();
      
      return Client.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao criar cliente: $e');
    }
  }

  static Future<Client> updateClient(Client client) async {
    try {
      final response = await _client
          .from('clients')
          .update(client.toJson())
          .eq('id', client.id)
          .select()
          .single();
      
      return Client.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao atualizar cliente: $e');
    }
  }

  static Future<void> deleteClient(String id) async {
    try {
      await _client.from('clients').delete().eq('id', id);
    } catch (e) {
      throw Exception('Erro ao deletar cliente: $e');
    }
  }

  // =====================================================
  // CONTRATOS
  // =====================================================

  static Future<List<Contract>> getContracts({
    int? limit,
    int? offset,
    String? clientId,
    ContractStatus? status,
    String? searchTerm,
  }) async {
    try {
      print('🔍 [SUPABASE] Buscando contratos...');
      print('🔍 [SUPABASE] Parâmetros: clientId=$clientId, status=$status, searchTerm=$searchTerm, limit=$limit, offset=$offset');
      
      dynamic query = _client
          .from('contracts')
          .select('''
            *,
            clients!inner(first_name, last_name),
            payments(amount, status)
          ''');
      
      print('🔍 [SUPABASE] Query inicial criada');
      
      if (clientId != null) {
        query = query.eq('client_id', clientId);
      }
      
      if (status != null) {
        query = query.eq('status', status.name);
      }
      
      if (searchTerm != null && searchTerm.isNotEmpty) {
        // Buscar por número do contrato OU nome/sobrenome do cliente
        // Primeiro buscar clientes que correspondem ao termo
        final clientsResponse = await _client
            .from('clients')
            .select('id')
            .or('first_name.ilike.%$searchTerm%,last_name.ilike.%$searchTerm%');
        
        final matchingClientIds = (clientsResponse as List).map((c) => c['id']).toList();
        
        // Combinar busca por ID do contrato E por IDs de clientes encontrados
        if (matchingClientIds.isNotEmpty) {
          query = query.or('id.ilike.%$searchTerm%,client_id.in.(${matchingClientIds.join(',')})');
        } else {
          // Se não encontrou clientes, buscar apenas por ID do contrato
          query = query.ilike('id', '%$searchTerm%');
        }
      }
      
      if (limit != null) {
        query = query.limit(limit);
      }
      
      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 10) - 1);
      }
      
      print('🔍 [SUPABASE] Executando query final...');
      final response = await query.order('created_at', ascending: false);
      
      print('🔍 [SUPABASE] Resposta recebida: ${response.length} contratos');
      print('🔍 [SUPABASE] Dados: $response');
      
      return (response as List).map((json) {
        // Adicionar informações relacionadas
        json['client_name'] = '${json['clients']['first_name']} ${json['clients']['last_name']}';
        
        // Payments will be loaded separately when needed
        
        return Contract.fromJson(json);
      }).toList();
    } catch (e) {
      throw Exception('Erro ao buscar contratos: $e');
    }
  }

  static Future<Contract?> getContractById(String id) async {
    try {
      final response = await _client
          .from('contracts')
          .select('''
            *,
            clients!inner(first_name, last_name)
          ''')
          .eq('id', id)
          .single();
      
      // Adicionar informações relacionadas
      response['client_name'] = '${response['clients']['first_name']} ${response['clients']['last_name']}';
      
      return Contract.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  static Future<Contract> createContract(Contract contract) async {
    try {
      final response = await _client
          .from('contracts')
          .insert(contract.toJson())
          .select()
          .single();
      
      return Contract.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao criar contrato: $e');
    }
  }

  static Future<Contract> updateContract(Contract contract) async {
    try {
      final response = await _client
          .from('contracts')
          .update(contract.toJson())
          .eq('id', contract.id)
          .select()
          .single();
      
      return Contract.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao atualizar contrato: $e');
    }
  }

  // =====================================================
  // PAGAMENTOS
  // =====================================================

  static Future<List<Payment>> getPayments({
    int? limit,
    int? offset,
    String? contractId,
    PaymentStatus? status,
    bool? overdue,
  }) async {
    try {
      dynamic query = _client
          .from('payments')
          .select('''
            *,
            contracts!inner(
              id,
              clients!inner(first_name, last_name)
            )
          ''');
      
      if (contractId != null) {
        query = query.eq('contract_id', contractId);
      }
      
      if (status != null) {
        query = query.eq('status', status.name);
      }
      
      if (overdue == true) {
        query = query
            .eq('status', 'pending')
            .lt('due_date', DateTime.now().toIso8601String().split('T')[0]);
      }
      
      if (limit != null) {
        query = query.limit(limit);
      }
      
      if (offset != null) {
        query = query.range(offset, offset + (limit ?? 10) - 1);
      }
      
      final response = await query.order('due_date', ascending: true);
      
      return (response as List).map((json) {
        // Adicionar informações relacionadas
        final firstName = json['contracts']['clients']['first_name'] ?? '';
        final lastName = json['contracts']['clients']['last_name'] ?? '';
        json['client_name'] = '${firstName.trim()} ${lastName.trim()}'.trim();
        
        return Payment.fromJson(json);
      }).toList();
    } catch (e) {
      throw Exception('Erro ao buscar pagamentos: $e');
    }
  }

  static Future<Payment?> getPaymentById(String id) async {
    try {
      final response = await _client
          .from('payments')
          .select('''
            *,
            contracts!inner(
              id,
              clients!inner(first_name, last_name)
            )
          ''')
          .eq('id', id)
          .single();
      
      // Adicionar informações relacionadas
      final firstName = response['contracts']['clients']['first_name'] ?? '';
      final lastName = response['contracts']['clients']['last_name'] ?? '';
      response['client_name'] = '${firstName.trim()} ${lastName.trim()}'.trim();
      
      return Payment.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  static Future<Payment> updatePayment(Payment payment) async {
    try {
      final response = await _client
          .from('payments')
          .update(payment.toJson())
          .eq('id', payment.id)
          .select()
          .single();
      
      return Payment.fromJson(response);
    } catch (e) {
      throw Exception('Erro ao atualizar pagamento: $e');
    }
  }

  // =====================================================
  // RELATÓRIOS E DASHBOARDS
  // =====================================================

  static Future<List<Map<String, dynamic>>> getDefaultingClients() async {
    try {
      final response = await _client.rpc('get_defaulting_clients');
      return List<Map<String, dynamic>>.from(response);
    } catch (e) {
      throw Exception('Erro ao buscar clientes inadimplentes: $e');
    }
  }



  static Future<Map<String, dynamic>> getDashboardSummary() async {
    try {
      // Buscar dados do dashboard
      final activeContracts = await _client
          .from('contracts')
          .select('id')
          .eq('status', 'active')
          .count();
      
      final overduePayments = await _client
          .from('payments')
          .select('amount')
          .eq('status', 'overdue');
      
      final totalOverdue = (overduePayments as List)
          .fold<double>(0, (sum, payment) => sum + (payment['amount'] as num).toDouble());
      
      return {
        'active_contracts': activeContracts.count,
        'overdue_payments_count': overduePayments.length,
        'total_overdue_amount': totalOverdue,
      };
    } catch (e) {
      throw Exception('Erro ao buscar resumo do dashboard: $e');
    }
  }
}