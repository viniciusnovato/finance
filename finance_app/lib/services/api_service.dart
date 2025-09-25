import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/supabase_config.dart';
import '../models/client.dart';
import '../models/contract.dart';
import '../models/payment.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3000/api';
  
  // Headers padrão (sem autenticação para desenvolvimento)
  static Future<Map<String, String>> _getHeaders() async {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  // Tratamento de erros da API
  static void _handleApiError(http.Response response) {
    if (response.statusCode >= 400) {
      final errorData = json.decode(response.body);
      print('❌ [API_SERVICE] Erro ${response.statusCode}: ${response.body}');
      throw Exception(errorData['error'] ?? 'Erro na API');
    }
  }
  
  // =====================================================
  // CLIENTES
  // =====================================================
  
  static Future<List<Client>> getClients({
    int page = 1,
    int limit = 10,
    String? search,
    String? status,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null) 'status': status,
        // Removed branch_id filter as branches table was removed
      };
      
      final uri = Uri.parse('$baseUrl/clients').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return (data['clients'] as List)
          .map((json) => Client.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Erro ao buscar clientes: $e');
    }
  }
  
  static Future<Client> getClient(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/clients/$id'),
        headers: headers,
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Client.fromJson(data['client']);
    } catch (e) {
      throw Exception('Erro ao buscar cliente: $e');
    }
  }
  
  static Future<Client> createClient(Map<String, dynamic> clientData) async {
    try {
      print('🔧 [API_SERVICE] Iniciando criação de cliente...');
      print('🔧 [API_SERVICE] Dados do cliente: ${json.encode(clientData)}');
      
      final headers = await _getHeaders();
      print('🔧 [API_SERVICE] Headers: $headers');
      print('🔧 [API_SERVICE] URL: $baseUrl/clients');
      
      final response = await http.post(
        Uri.parse('$baseUrl/clients'),
        headers: headers,
        body: json.encode(clientData),
      );
      
      print('🔧 [API_SERVICE] Status da resposta: ${response.statusCode}');
      print('🔧 [API_SERVICE] Corpo da resposta: ${response.body}');
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      print('🔧 [API_SERVICE] Dados decodificados: $data');
      
      final client = Client.fromJson(data['client']);
      print('✅ [API_SERVICE] Cliente criado com sucesso: ${client.id}');
      
      return client;
    } catch (e) {
      print('❌ [API_SERVICE] Erro ao criar cliente: $e');
      throw Exception('Erro ao criar cliente: $e');
    }
  }
  
  static Future<Client> updateClient(String id, Map<String, dynamic> clientData) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl/clients/$id'),
        headers: headers,
        body: json.encode(clientData),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Client.fromJson(data['client']);
    } catch (e) {
      throw Exception('Erro ao atualizar cliente: $e');
    }
  }
  
  static Future<void> deleteClient(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/clients/$id'),
        headers: headers,
      );
      
      _handleApiError(response);
    } catch (e) {
      throw Exception('Erro ao deletar cliente: $e');
    }
  }
  
  // =====================================================
  // CONTRATOS
  // =====================================================
  
  static Future<List<Contract>> getContracts({
    int page = 1,
    int limit = 10,
    String? search,
    String? status,
    String? clientId,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null) 'status': status,
        if (clientId != null) 'client_id': clientId,
      };
      
      final uri = Uri.parse('$baseUrl/contracts').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return (data['contracts'] as List)
          .map((json) => Contract.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Erro ao buscar contratos: $e');
    }
  }
  
  static Future<Contract> getContract(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/contracts/$id'),
        headers: headers,
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Contract.fromJson(data['contract']);
    } catch (e) {
      throw Exception('Erro ao buscar contrato: $e');
    }
  }
  
  static Future<Contract> createContract(Map<String, dynamic> contractData) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/contracts'),
        headers: headers,
        body: json.encode(contractData),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Contract.fromJson(data['contract']);
    } catch (e) {
      throw Exception('Erro ao criar contrato: $e');
    }
  }
  
  static Future<Contract> updateContract(String id, Map<String, dynamic> contractData) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl/contracts/$id'),
        headers: headers,
        body: json.encode(contractData),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Contract.fromJson(data['contract']);
    } catch (e) {
      throw Exception('Erro ao atualizar contrato: $e');
    }
  }
  
  static Future<void> deleteContract(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/contracts/$id'),
        headers: headers,
      );
      
      _handleApiError(response);
    } catch (e) {
      throw Exception('Erro ao deletar contrato: $e');
    }
  }
  
  // =====================================================
  // PAGAMENTOS
  // =====================================================
  
  static Future<Map<String, dynamic>> getPayments({
    int page = 1,
    int limit = 10,
    String? search,
    String? status,
    String? contractId,
    String? clientId,
    String? paymentMethod,
    String? paymentType,
    DateTime? startDate,
    DateTime? endDate,
    bool overdueOnly = false,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (status != null) 'status': status,
        if (contractId != null) 'contract_id': contractId,
        if (clientId != null) 'client_id': clientId,
        if (paymentMethod != null) 'payment_method': paymentMethod,
        if (paymentType != null) 'payment_type': paymentType,
        if (startDate != null) 'start_date': startDate.toIso8601String(),
        if (endDate != null) 'end_date': endDate.toIso8601String(),
        if (overdueOnly) 'overdue_only': 'true',
      };
      
      final uri = Uri.parse('$baseUrl/payments').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      final payments = (data['payments'] as List)
          .map((json) => Payment.fromJson(json))
          .toList();
      
      return {
        'payments': payments,
        'pagination': data['pagination'],
      };
    } catch (e) {
      throw Exception('Erro ao buscar pagamentos: $e');
    }
  }
  
  // Legacy method for backward compatibility
  static Future<List<Payment>> getPaymentsList({
    int page = 1,
    int limit = 10,
    String? search,
    String? status,
    String? contractId,
    String? clientId,
    String? paymentMethod,
    DateTime? startDate,
    DateTime? endDate,
    bool overdueOnly = false,
  }) async {
    final result = await getPayments(
      page: page,
      limit: limit,
      search: search,
      status: status,
      contractId: contractId,
      clientId: clientId,
      paymentMethod: paymentMethod,
      startDate: startDate,
      endDate: endDate,
      overdueOnly: overdueOnly,
    );
    return result['payments'] as List<Payment>;
  }
  
  static Future<Payment> getPayment(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/payments/$id'),
        headers: headers,
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Payment.fromJson(data['payment']);
    } catch (e) {
      throw Exception('Erro ao buscar pagamento: $e');
    }
  }
  
  static Future<Payment> createPayment(Map<String, dynamic> paymentData) async {
    try {
      final headers = await _getHeaders();
      final response = await http.post(
        Uri.parse('$baseUrl/payments'),
        headers: headers,
        body: json.encode(paymentData),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Payment.fromJson(data['payment']);
    } catch (e) {
      throw Exception('Erro ao criar pagamento: $e');
    }
  }
  
  static Future<Payment> updatePayment(String id, Map<String, dynamic> paymentData) async {
    try {
      final headers = await _getHeaders();
      final response = await http.put(
        Uri.parse('$baseUrl/payments/$id'),
        headers: headers,
        body: json.encode(paymentData),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Payment.fromJson(data['payment']);
    } catch (e) {
      throw Exception('Erro ao atualizar pagamento: $e');
    }
  }
  
  static Future<Payment> markPaymentAsPaid(String id, {
    DateTime? paidDate,
    String? paymentMethod,
    String? referenceNumber,
    String? notes,
  }) async {
    try {
      final headers = await _getHeaders();
      final paymentData = {
        if (paidDate != null) 'paid_date': paidDate.toIso8601String(),
        if (paymentMethod != null) 'payment_method': paymentMethod,
        if (referenceNumber != null) 'reference_number': referenceNumber,
        if (notes != null) 'notes': notes,
      };
      
      final response = await http.patch(
        Uri.parse('$baseUrl/payments/$id/pay'),
        headers: headers,
        body: json.encode(paymentData),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Payment.fromJson(data['payment']);
    } catch (e) {
      throw Exception('Erro ao marcar pagamento como pago: $e');
    }
  }
  
  static Future<Payment> cancelPayment(String id, String reason) async {
    try {
      final headers = await _getHeaders();
      final response = await http.patch(
        Uri.parse('$baseUrl/payments/$id/cancel'),
        headers: headers,
        body: json.encode({'reason': reason}),
      );
      
      _handleApiError(response);
      
      final data = json.decode(response.body);
      return Payment.fromJson(data['payment']);
    } catch (e) {
      throw Exception('Erro ao cancelar pagamento: $e');
    }
  }
  
  static Future<void> deletePayment(String id) async {
    try {
      final headers = await _getHeaders();
      final response = await http.delete(
        Uri.parse('$baseUrl/payments/$id'),
        headers: headers,
      );
      
      _handleApiError(response);
    } catch (e) {
      throw Exception('Erro ao deletar pagamento: $e');
    }
  }
  
  // =====================================================
  // RELATÓRIOS
  // =====================================================
  
  static Future<Map<String, dynamic>> getPaymentsSummary({
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      final headers = await _getHeaders();
      final queryParams = {
        if (startDate != null) 'start_date': startDate.toIso8601String(),
        if (endDate != null) 'end_date': endDate.toIso8601String(),
      };
      
      final uri = Uri.parse('$baseUrl/payments/reports/summary').replace(queryParameters: queryParams);
      final response = await http.get(uri, headers: headers);
      
      _handleApiError(response);
      
      return json.decode(response.body);
    } catch (e) {
      throw Exception('Erro ao buscar resumo de pagamentos: $e');
    }
  }
}