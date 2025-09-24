import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/payment.dart';

import '../utils/app_colors.dart';
import '../services/api_service.dart';

class PaymentListWidget extends StatefulWidget {
  final String? clientId;
  final String? contractId;
  final String? clientName;
  
  const PaymentListWidget({
    super.key,
    this.clientId,
    this.contractId,
    this.clientName,
  });

  @override
  State<PaymentListWidget> createState() => _PaymentListWidgetState();
}

class _PaymentListWidgetState extends State<PaymentListWidget> {
  PaymentStatus? _selectedStatus;
  String _selectedFilter = 'all'; // 'all', 'paid', 'unpaid', 'overdue', 'pending_not_overdue', 'down_payment'
  bool _showFilters = false;
  // Removido _showClientBadge local - agora usa o AppProvider
  DateTimeRange? _dateRange;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  
  // Variáveis de paginação
  int _currentPage = 1;
  int _totalPages = 1;
  int _totalItems = 0;
  final int _itemsPerPage = 20;



  @override
  void initState() {
    super.initState();
    // Carregar pagamentos quando o widget for inicializado
    WidgetsBinding.instance.addPostFrameCallback((_) {
      print('🔧 [WIDGET] initState - carregando pagamentos iniciais');
      debugPrint('🔧 [WIDGET] initState - carregando pagamentos iniciais');
      context.read<AppProvider>().loadPayments(
        clientId: widget.clientId,
        contractId: widget.contractId,
        startDate: _dateRange?.start,
        endDate: _dateRange?.end,
      );
    });
  }
  
  @override
  void didUpdateWidget(PaymentListWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Se o clientId ou contractId mudou (incluindo quando ficam null), recarregar pagamentos
    if (oldWidget.clientId != widget.clientId || oldWidget.contractId != widget.contractId) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<AppProvider>().loadPayments(
          clientId: widget.clientId,
          contractId: widget.contractId,
          startDate: _dateRange?.start,
          endDate: _dateRange?.end,
        );
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _buildHeader(),
        Expanded(
          child: Consumer<AppProvider>(
            builder: (context, provider, child) {
              return _buildPaymentList(provider);
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Column(
        children: [
          // Título e botões principais
          Row(
            children: [
              Expanded(
                child: Text(
                  'Pagamentos',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              IconButton(
                onPressed: () {
                  setState(() {
                    _showFilters = !_showFilters;
                  });
                },
                icon: Icon(
                  _showFilters ? Icons.filter_list_off : Icons.filter_list,
                  color: _showFilters ? AppColors.primary : Colors.grey,
                ),
                tooltip: 'Filtros Avançados',
              ),
              ElevatedButton.icon(
                onPressed: () {
                  _clearFilters();
                  context.read<AppProvider>().loadPayments(
                    startDate: _dateRange?.start,
                    endDate: _dateRange?.end,
                  );
                },
                icon: const Icon(Icons.refresh),
                label: const Text('Atualizar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Badge do cliente filtrado
          if (widget.clientId != null && widget.clientName != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 4,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Theme.of(context).primaryColor.withOpacity(0.3),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.filter_alt,
                    size: 16,
                    color: Theme.of(context).primaryColor,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Cliente: ${widget.clientName}',
                    style: TextStyle(
                      color: Theme.of(context).primaryColor,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 4),
                  InkWell(
                    onTap: () {
                      // Navegar de volta para pagamentos sem filtro e limpar completamente os filtros
                      final appProvider = context.read<AppProvider>();
                      appProvider.onNavigationRequested?.call(3, clientId: null, contractId: null); // Navegar para pagamentos sem filtro
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(2),
                      child: Icon(
                        Icons.close,
                        size: 16,
                        color: Theme.of(context).primaryColor,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],
          
          // Filtros rápidos por status de pagamento
          Consumer<AppProvider>(
            builder: (context, provider, child) {
              return _buildQuickFilters(provider);
            },
          ),
          
          // Filtros avançados (expansível)
          if (_showFilters) ...[
            const SizedBox(height: 16),
            Consumer<AppProvider>(
              builder: (context, provider, child) {
                return _buildAdvancedFilters(provider);
              },
            ),
          ],
        ],
      ),
    );
  }
  
  Widget _buildQuickFilters(AppProvider provider) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildFilterChip(
            'Todos',
            'all',
            Icons.list,
            Colors.blue,
            provider,
          ),
          const SizedBox(width: 8),
          _buildFilterChip(
            'Pagas',
            'paid',
            Icons.check_circle,
            Colors.green,
            provider,
          ),
          const SizedBox(width: 8),
          _buildFilterChip(
            'Não Pagas',
            'unpaid',
            Icons.pending,
            Colors.orange,
            provider,
          ),
          const SizedBox(width: 8),
          _buildFilterChip(
            'Em Atraso',
            'overdue',
            Icons.warning,
            Colors.red,
            provider,
          ),
          const SizedBox(width: 8),
          _buildFilterChip(
            'Entrada',
            'down_payment',
            Icons.account_balance_wallet,
            Colors.purple,
            provider,
          ),
        ],
      ),
    );
  }
  
  Widget _buildFilterChip(
    String label,
    String filterValue,
    IconData icon,
    Color color,
    AppProvider provider,
  ) {
    final isSelected = _selectedFilter == filterValue;
    
    return FilterChip(
      selected: isSelected,
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: isSelected ? Colors.white : color,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
      selectedColor: color,
      backgroundColor: color.withOpacity(0.1),
      checkmarkColor: Colors.white,
      onSelected: (selected) {
        print('🔧 [WIDGET] FilterChip clicado: $filterValue, selected: $selected');
        debugPrint('🔧 [WIDGET] FilterChip clicado: $filterValue, selected: $selected');
        setState(() {
          _selectedFilter = selected ? filterValue : 'all';
        });
        print('🔧 [WIDGET] _selectedFilter agora é: $_selectedFilter');
        debugPrint('🔧 [WIDGET] _selectedFilter agora é: $_selectedFilter');
        _applyFilters(provider);
      },
    );
  }
  
  Widget _buildAdvancedFilters(AppProvider provider) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Filtros Avançados',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            // Busca por texto
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Buscar por contrato ou cliente',
                hintText: 'Digite o número do contrato ou nome do paciente',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          setState(() {
                            _searchQuery = '';
                          });
                          _applyFilters(provider);
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
                _applyFilters(provider);
              },
            ),
            const SizedBox(height: 16),
            
            // Filtro por status detalhado
            DropdownButtonFormField<PaymentStatus?>(
              value: _selectedStatus,
              decoration: InputDecoration(
                labelText: 'Status Específico',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
              items: [
                const DropdownMenuItem<PaymentStatus?>(
                  value: null,
                  child: Text('Todos os Status'),
                ),
                ...PaymentStatus.values.map(
                  (status) => DropdownMenuItem<PaymentStatus?>(
                    value: status,
                    child: Row(
                      children: [
                        Icon(
                          _getStatusIcon(status),
                          size: 16,
                          color: _getStatusColor(status),
                        ),
                        const SizedBox(width: 8),
                        Text(status.displayName),
                      ],
                    ),
                  ),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedStatus = value;
                  _selectedFilter = 'all'; // Reset filter when status changes
                });
                _applyFilters(provider);
              },
            ),
            const SizedBox(height: 16),
            
            // Filtro por período
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _selectDateRange(provider),
                    icon: const Icon(Icons.date_range),
                    label: Text(
                      _dateRange != null
                          ? 'Período: ${_formatDate(_dateRange!.start)} - ${_formatDate(_dateRange!.end)}'
                          : 'Selecionar Período',
                    ),
                  ),
                ),
                if (_dateRange != null) ...[
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () {
                      setState(() {
                        _dateRange = null;
                      });
                      _applyFilters(provider);
                    },
                    icon: const Icon(Icons.clear),
                    tooltip: 'Limpar período',
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            
            // Botões de ação
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _clearFilters(),
                    child: const Text('Limpar Filtros'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _applyFilters(provider),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Aplicar'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPaymentList(AppProvider provider) {
    if (provider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
    
    if (provider.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              'Erro ao carregar pagamentos',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              provider.error!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => provider.loadPayments(
                clientId: widget.clientId,
                contractId: widget.contractId,
                startDate: _dateRange?.start,
                endDate: _dateRange?.end,
              ),
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      );
    }
    
    // Aplicar filtros localmente
    final filteredPayments = _getFilteredPayments(provider.payments);
    
    if (filteredPayments.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.payment_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              provider.payments.isEmpty 
                  ? 'Nenhum pagamento encontrado'
                  : 'Nenhum pagamento corresponde aos filtros',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              provider.payments.isEmpty
                  ? 'Os pagamentos aparecerão aqui quando houver contratos'
                  : 'Tente ajustar os filtros para ver mais resultados.',
              style: const TextStyle(color: Colors.grey),
            ),
            if (provider.payments.isNotEmpty) ...[
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () {
                  _clearFilters();
                  _applyFilters(provider);
                },
                child: const Text('Limpar Filtros'),
              ),
            ],
          ],
        ),
      );
    }
    
    return Column(
      children: [
        // Contador de resultados e informações de paginação
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.blue.withOpacity(0.1),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _totalItems > 0 
                  ? 'Mostrando ${filteredPayments.length} de $_totalItems pagamentos'
                  : 'Mostrando ${filteredPayments.length} pagamentos',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.blue[700],
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (_totalPages > 1)
                Text(
                  'Página $_currentPage de $_totalPages',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.blue[700],
                    fontWeight: FontWeight.w500,
                  ),
                ),
            ],
          ),
        ),
        // Lista de pagamentos
        Expanded(
          child: RefreshIndicator(
            onRefresh: () async {
              _applyFilters(provider, resetPage: false);
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: filteredPayments.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final payment = filteredPayments[index];
                return _buildPaymentCard(payment, provider);
              },
            ),
          ),
        ),
        // Controles de paginação
        if (_totalPages > 1) _buildPaginationControls(provider),
      ],
    );
  }
  
  Widget _buildPaymentCard(Payment payment, AppProvider provider) {
    final isOverdue = payment.isOverdue;
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: isOverdue 
          ? const BorderSide(color: Colors.red, width: 1)
          : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Parcela ${payment.installmentNumber}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                          'Número do Contrato: ${payment.contractNumber ?? payment.contractId}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Colors.grey,
                          ),
                        ),
                        if (payment.clientName != null && payment.clientName!.isNotEmpty)
                          Text(
                            'Cliente: ${payment.clientName}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                            ),
                          ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(payment.status).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    payment.status.displayName,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(payment.status),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Valor: € ${payment.amount.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Vencimento: ${payment.dueDate.day}/${payment.dueDate.month}/${payment.dueDate.year}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isOverdue ? Colors.red : Colors.grey,
                    fontWeight: isOverdue ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ],
            ),
            if (payment.paidDate != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.check_circle, size: 16, color: Colors.green),
                  const SizedBox(width: 4),
                  Text(
                    'Pago em: ${payment.paidDate!.day}/${payment.paidDate!.month}/${payment.paidDate!.year}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.green,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ],
            if (isOverdue) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.warning, size: 16, color: Colors.red),
                    const SizedBox(width: 8),
                    Text(
                      '${payment.daysOverdue} dias em atraso',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.red,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            if (payment.paymentMethod != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.payment, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    'Método: ${payment.paymentMethod!.displayName}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ],
            if (payment.notes?.isNotEmpty == true) ...[
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.note, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      payment.notes!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (payment.status == PaymentStatus.pending) ...[
                  ElevatedButton.icon(
                    onPressed: () {
                      _markAsPaid(payment, provider);
                    },
                    icon: const Icon(Icons.check, size: 16),
                    label: const Text('Marcar como Pago'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                TextButton.icon(
                  onPressed: () {
                    // TODO: Implementar edição
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Funcionalidade em desenvolvimento'),
                      ),
                    );
                  },
                  icon: const Icon(Icons.edit, size: 16),
                  label: const Text('Editar'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Color _getStatusColor(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.pending:
        return Colors.orange;
      case PaymentStatus.paid:
        return Colors.green;
      case PaymentStatus.overdue:
        return Colors.red;
      case PaymentStatus.cancelled:
        return Colors.grey;
      case PaymentStatus.failed:
        return Colors.red;
    }
  }
  
  IconData _getStatusIcon(PaymentStatus status) {
    switch (status) {
      case PaymentStatus.pending:
        return Icons.pending;
      case PaymentStatus.paid:
        return Icons.check_circle;
      case PaymentStatus.overdue:
        return Icons.warning;
      case PaymentStatus.cancelled:
        return Icons.cancel;
      case PaymentStatus.failed:
        return Icons.error;
    }
  }
  
  void _clearFilters() {
    setState(() {
      _selectedStatus = null;
      _selectedFilter = 'all';
      _dateRange = null;
      _searchQuery = '';
      _searchController.clear();
      _currentPage = 1;
      _totalPages = 1;
      _totalItems = 0;
      
    });
  }
  
  void _applyFilters(AppProvider provider, {bool resetPage = true}) {
     // Resetar página quando aplicar novos filtros
     if (resetPage) {
       _currentPage = 1;
     }
     
     // Aplicar filtros baseados no estado atual
     PaymentStatus? statusFilter;
     bool? overdueFilter;
     
     print('🔧 [WIDGET] _applyFilters chamado com _selectedFilter: $_selectedFilter, página: $_currentPage');
     debugPrint('🔧 [WIDGET] _applyFilters chamado com _selectedFilter: $_selectedFilter, página: $_currentPage');
     
     // Converter filtro rápido para parâmetros específicos
     String? paymentTypeFilter;
     switch (_selectedFilter) {
       case 'paid':
         statusFilter = PaymentStatus.paid;
         break;
       case 'unpaid':
         statusFilter = PaymentStatus.pending;
         break;
       case 'overdue':
         // Para pagamentos em atraso, usar o parâmetro overdue da API
         overdueFilter = true;
         break;
       case 'down_payment':
         // Para entrada, usar o filtro de payment_type
         paymentTypeFilter = 'downPayment';
         break;
       default:
         statusFilter = _selectedStatus;
     }
     
     print('🔧 [WIDGET] statusFilter: ${statusFilter?.name}, overdueFilter: $overdueFilter, paymentTypeFilter: $paymentTypeFilter');
     debugPrint('🔧 [WIDGET] statusFilter: ${statusFilter?.name}, overdueFilter: $overdueFilter, paymentTypeFilter: $paymentTypeFilter');
     
     _loadPaymentsWithPagination(provider, statusFilter, overdueFilter, paymentTypeFilter);
     }
     
    // Método para carregar pagamentos com paginação
    Future<void> _loadPaymentsWithPagination(AppProvider provider, PaymentStatus? statusFilter, bool? overdueFilter, String? paymentTypeFilter) async {
      try {
        // Usar a busca de texto se houver
        String? searchTerm = _searchQuery.isNotEmpty ? _searchQuery : null;
        
        final result = await ApiService.getPayments(
          page: _currentPage,
          limit: _itemsPerPage,
          search: searchTerm,
          status: statusFilter?.name,
          paymentType: paymentTypeFilter,
          overdueOnly: overdueFilter ?? false,
          clientId: widget.clientId,
          contractId: widget.contractId,
          startDate: _dateRange?.start,
          endDate: _dateRange?.end,
        );
        
        final payments = result['payments'] as List<Payment>;
        final pagination = result['pagination'] as Map<String, dynamic>;
        
        // Usar informações de paginação da API
        setState(() {
          _totalPages = pagination['pages'] ?? 1;
          _totalItems = pagination['total'] ?? 0;
          
          print('🔧 [WIDGET] Paginação atualizada: página $_currentPage de $_totalPages, total: $_totalItems itens');
        });
        
        // Atualizar a lista no provider manualmente
        provider.updatePaymentsList(payments);
        
      } catch (e) {
        print('❌ [WIDGET] Erro ao carregar pagamentos paginados: $e');
      }
    }
     
    List<Payment> _getFilteredPayments(List<Payment> payments) {
     List<Payment> filtered = List.from(payments);
     
     // Apply special filters first (only for filters not handled by backend)
     switch (_selectedFilter) {
       case 'pending_not_overdue':
         filtered = filtered.where((payment) => 
           payment.status == PaymentStatus.pending && !payment.isOverdue
         ).toList();
         break;
       default:
         // 'all', 'overdue', 'down_payment' - handled by backend
         break;
     }
     
     // Apply status filter if set
     if (_selectedStatus != null) {
       filtered = filtered.where((payment) => payment.status == _selectedStatus).toList();
     }
     
     // Filtro por busca de texto (busca parcial sempre)
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((p) {
        // Sempre fazer busca parcial, nunca exata
        return (p.contractNumber?.toLowerCase().contains(query) ?? false) ||
               (p.clientName?.toLowerCase().contains(query) ?? false) ||
               p.contractId.toLowerCase().contains(query) ||
               p.installmentNumber.toString().contains(query) ||
               p.id.toLowerCase().contains(query) ||
               (p.notes?.toLowerCase().contains(query) ?? false);
      }).toList();
    }
     
     // Date range filter is now applied on the backend
     // No need for local date filtering
     
     return filtered;
    }
    
    // Widget para controles de paginação
    Widget _buildPaginationControls(AppProvider provider) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          border: Border(top: BorderSide(color: Colors.grey[300]!)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Botão página anterior
            ElevatedButton.icon(
              onPressed: _currentPage > 1 ? () {
                setState(() {
                  _currentPage--;
                });
                _applyFilters(provider, resetPage: false);
              } : null,
              icon: const Icon(Icons.chevron_left),
              label: const Text('Anterior'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[200],
                foregroundColor: Colors.black87,
              ),
            ),
            
            // Indicador de página atual
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                '$_currentPage / $_totalPages',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            
            // Botão próxima página
            ElevatedButton.icon(
              onPressed: _currentPage < _totalPages ? () {
                setState(() {
                  _currentPage++;
                });
                _applyFilters(provider, resetPage: false);
              } : null,
              icon: const Icon(Icons.chevron_right),
              label: const Text('Próxima'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.grey[200],
                foregroundColor: Colors.black87,
              ),
            ),
          ],
        ),
      );
    }
  
  Future<void> _selectDateRange(AppProvider provider) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 365)),
      initialDateRange: _dateRange,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: AppColors.primary,
            ),
          ),
          child: child!,
        );
      },
    );
    
    if (picked != null && picked != _dateRange) {
      setState(() {
        _dateRange = picked;
      });
      _applyFilters(provider);
    }
  }
  
  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
  
  void _markAsPaid(Payment payment, AppProvider provider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Pagamento'),
        content: Text(
          'Confirmar o pagamento da parcela ${payment.installmentNumber}?\n\n'
          'Valor: € ${payment.amount.toStringAsFixed(2)}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              
              final updatedPayment = payment.copyWith(
                status: PaymentStatus.paid,
                paidDate: DateTime.now(),
                paymentMethod: PaymentMethod.cash, // Default method
              );
              
              provider.updatePayment(updatedPayment);
              
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Pagamento registrado com sucesso!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}