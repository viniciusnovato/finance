import 'package:flutter/foundation.dart';
import '../models/payment.dart';
import '../services/supabase_service.dart';
import '../services/api_service.dart';

class PaymentProvider with ChangeNotifier {
  // Estado dos dados
  List<Payment> _payments = [];
  
  // Estado de carregamento
  bool _isLoading = false;
  String? _error;
  
  // Getters
  List<Payment> get payments => _payments;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  // Métodos para pagamentos
  Future<void> loadPayments({
    String? contractId,
    String? clientId,
    String? search,
    String? status,
    String? paymentMethod,
    DateTime? startDate,
    DateTime? endDate,
    bool overdueOnly = false,
  }) async {
    print('🔧 [PAYMENT_PROVIDER] Iniciando carregamento de pagamentos via API...');
    _setLoading(true);
    try {
      print('🔧 [PAYMENT_PROVIDER] Chamando ApiService.getPayments...');
      _payments = await ApiService.getPayments(
        contractId: contractId,
        clientId: clientId,
        search: search,
        status: status,
        paymentMethod: paymentMethod,
        startDate: startDate,
        endDate: endDate,
        overdueOnly: overdueOnly,
        limit: 50,
      );
      print('🔧 [PAYMENT_PROVIDER] Pagamentos carregados via API: ${_payments.length}');
      _error = null;
    } catch (e) {
      print('❌ [PAYMENT_PROVIDER] Erro ao carregar pagamentos via API: $e');
      _error = 'Erro ao carregar pagamentos: $e';
    } finally {
      print('🔧 [PAYMENT_PROVIDER] Finalizando carregamento de pagamentos...');
      _setLoading(false);
    }
  }

  // Versão silenciosa que não altera o estado de loading
  Future<void> loadPaymentsQuiet({
    String? contractId,
    String? clientId,
    String? search,
    String? status,
    String? paymentMethod,
    DateTime? startDate,
    DateTime? endDate,
    bool overdueOnly = false,
  }) async {
    print('🔧 [PAYMENT_PROVIDER] Carregamento silencioso de pagamentos...');
    try {
      _payments = await ApiService.getPayments(
        contractId: contractId,
        clientId: clientId,
        search: search,
        status: status,
        paymentMethod: paymentMethod,
        startDate: startDate,
        endDate: endDate,
        overdueOnly: overdueOnly,
        limit: 50,
      );
      print('🔧 [PAYMENT_PROVIDER] Pagamentos carregados silenciosamente: ${_payments.length}');
      _error = null;
      notifyListeners(); // Apenas notifica sem alterar loading
    } catch (e) {
      print('❌ [PAYMENT_PROVIDER] Erro no carregamento silencioso de pagamentos: $e');
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

  Future<void> deletePayment(String paymentId) async {
    _setLoading(true);
    try {
      await ApiService.deletePayment(paymentId);
      _payments.removeWhere((p) => p.id == paymentId);
      _error = null;
      notifyListeners();
    } catch (e) {
      _error = 'Erro ao deletar pagamento: $e';
    } finally {
      _setLoading(false);
    }
  }
  
  // Filtros e buscas locais
  List<Payment> getOverduePayments() {
    final now = DateTime.now();
    return _payments.where((payment) => 
      payment.dueDate.isBefore(now) && 
      payment.status == PaymentStatus.pending
    ).toList();
  }
  
  List<Payment> getPaymentsByContract(String contractId) {
    return _payments.where((payment) => payment.contractId == contractId).toList();
  }
  
  // Método removido - Payment não tem clientId direto
  // Para buscar pagamentos por cliente, use getPaymentsByContract com os contratos do cliente
  
  List<Payment> getPaymentsByStatus(PaymentStatus status) {
    return _payments.where((payment) => payment.status == status).toList();
  }
  
  List<Payment> getPaymentsByDateRange(DateTime startDate, DateTime endDate) {
    return _payments.where((payment) => 
      payment.dueDate.isAfter(startDate.subtract(const Duration(days: 1))) &&
      payment.dueDate.isBefore(endDate.add(const Duration(days: 1)))
    ).toList();
  }
  
  Payment? getPaymentById(String id) {
    try {
      return _payments.firstWhere((payment) => payment.id == id);
    } catch (e) {
      return null;
    }
  }
  
  List<Payment> searchPayments(String query) {
    if (query.isEmpty) return _payments;
    
    final lowerQuery = query.toLowerCase();
    return _payments.where((payment) {
      return payment.contractId.toLowerCase().contains(lowerQuery) ||
             payment.amount.toString().contains(lowerQuery) ||
             (payment.notes?.toLowerCase().contains(lowerQuery) ?? false);
    }).toList();
  }
  
  // Cálculos e estatísticas
  double getTotalReceivable() {
    return _payments
        .where((payment) => payment.status == PaymentStatus.pending)
        .fold(0.0, (sum, payment) => sum + payment.amount);
  }
  
  double getTotalReceived() {
    return _payments
        .where((payment) => payment.status == PaymentStatus.paid)
        .fold(0.0, (sum, payment) => sum + payment.amount);
  }
  
  double getTotalOverdue() {
    return getOverduePayments()
        .fold(0.0, (sum, payment) => sum + payment.amount);
  }
  
  int getPaymentCount() => _payments.length;
  int getPendingPaymentCount() => getPaymentsByStatus(PaymentStatus.pending).length;
  int getPaidPaymentCount() => getPaymentsByStatus(PaymentStatus.paid).length;
  int getOverduePaymentCount() => getOverduePayments().length;
  
  // Métodos auxiliares
  void _setLoading(bool loading) {
    print('⏳ [PAYMENT_STATE] Alterando estado de loading: $_isLoading -> $loading');
    _isLoading = loading;
    notifyListeners();
    print('🔔 [PAYMENT_STATE] Listeners notificados');
  }
  
  void clearError() {
    _error = null;
    notifyListeners();
  }
  
  void clearPayments() {
    _payments.clear();
    notifyListeners();
  }
}