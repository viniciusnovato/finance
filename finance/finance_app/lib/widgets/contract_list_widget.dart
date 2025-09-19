import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/contract.dart';
import '../providers/app_provider.dart';
import '../utils/app_colors.dart';
import '../screens/contract_form_screen.dart';
import '../screens/payment_form_screen.dart';

class ContractListWidget extends StatefulWidget {
  const ContractListWidget({super.key});

  @override
  State<ContractListWidget> createState() => _ContractListWidgetState();
}

class _ContractListWidgetState extends State<ContractListWidget> {
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;
  
  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (context, provider, child) {
      return Column(
        children: [
          _buildSearchAndHeader(provider),
          Expanded(
            child: _buildContractList(provider),
          ),
        ],
      );
    });
  }
  
  Widget _buildSearchAndHeader(AppProvider provider) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.all(16),
      color: colorScheme.surfaceVariant.withOpacity(0.3),
      child: Column(
        children: [
          // Barra de busca
          SearchBar(
            controller: _searchController,
            hintText: 'Buscar por número do contrato ou nome do paciente...',
            leading: const Icon(Icons.search),
            trailing: _searchController.text.isNotEmpty
                ? [IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      _performSearch(provider);
                    },
                  )]
                : null,
            onChanged: (value) {
              setState(() {});
              _debounceTimer?.cancel();
              _debounceTimer = Timer(const Duration(milliseconds: 500), () {
                _performSearch(provider);
              });
            },
          ),
          const SizedBox(height: 12),
          // Header com título e botão
          Row(
            children: [
              Expanded(
                child: Text(
                  'Contratos',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              ElevatedButton.icon(
                onPressed: () async {
                  await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) => const ContractFormScreen(),
                    ),
                  );
                  // Recarregar contratos após criar/editar
                  if (context.mounted) {
                    context.read<AppProvider>().loadContracts();
                  }
                },
                icon: const Icon(Icons.add),
                label: const Text('Novo Contrato'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildContractList(AppProvider provider) {
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
              'Erro ao carregar contratos',
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
              onPressed: () => provider.loadContracts(),
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      );
    }
    
    final contracts = provider.contracts;
    
    if (contracts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.description_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum contrato encontrado',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text(
              'Adicione um novo contrato para começar',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: () => provider.loadContracts(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: contracts.length,
        separatorBuilder: (context, index) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final contract = contracts[index];
          return _buildContractCard(contract);
        },
      ),
    );
  }
  
  Widget _buildContractCard(Contract contract) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    contract.contractNumber != null 
                        ? 'Contrato: ${contract.contractNumber}'
                        : 'Contrato: ${contract.id.substring(0, 8)}...',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(contract.status).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    contract.status.displayName,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: _getStatusColor(contract.status),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.person, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  contract.client != null 
                      ? 'Paciente: ${contract.client!.fullName}'
                      : 'Cliente ID: ${contract.clientId}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 4),
            if (contract.treatmentDescription != null && contract.treatmentDescription!.isNotEmpty) ...[
              Row(
                children: [
                  const Icon(Icons.medical_services, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Tratamento: ${contract.treatmentDescription}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            // Período do Contrato - Destacado
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.date_range, size: 18, color: Colors.blue.shade700),
                      const SizedBox(width: 6),
                      Text(
                        'Período do Contrato',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.blue.shade700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Row(
                          children: [
                            Icon(Icons.play_arrow, size: 16, color: Colors.green.shade600),
                            const SizedBox(width: 4),
                            Text(
                              'Início:',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: Colors.green.shade700,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              contract.startDate != null 
                                ? '${contract.startDate!.day.toString().padLeft(2, '0')}/${contract.startDate!.month.toString().padLeft(2, '0')}/${contract.startDate!.year}'
                                : 'Não definido',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: contract.startDate != null ? Colors.green.shade800 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Row(
                          children: [
                            Icon(Icons.stop, size: 16, color: Colors.red.shade600),
                            const SizedBox(width: 4),
                            Text(
                              'Fim:',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                color: Colors.red.shade700,
                              ),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              contract.endDate != null 
                                ? '${contract.endDate!.day.toString().padLeft(2, '0')}/${contract.endDate!.month.toString().padLeft(2, '0')}/${contract.endDate!.year}'
                                : 'Não definido',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: contract.endDate != null ? Colors.red.shade800 : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  // Mostrar duração do contrato se ambas as datas estiverem definidas
                  if (contract.startDate != null && contract.endDate != null) ...[
                     const SizedBox(height: 6),
                     Row(
                       children: [
                         Icon(Icons.schedule, size: 16, color: Colors.blue.shade600),
                         const SizedBox(width: 4),
                         Text(
                           'Duração:',
                           style: TextStyle(
                             fontSize: 12,
                             fontWeight: FontWeight.w500,
                             color: Colors.blue.shade700,
                           ),
                         ),
                         const SizedBox(width: 4),
                         Text(
                           '${contract.endDate!.difference(contract.startDate!).inDays} dias',
                           style: TextStyle(
                             fontSize: 12,
                             fontWeight: FontWeight.w600,
                             color: Colors.blue.shade800,
                           ),
                         ),
                       ],
                     ),
                   ]
                ],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Valor Total: € ${contract.totalAmount.toStringAsFixed(2)}',
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
                const Icon(Icons.payment, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Parcelas: ${contract.installments}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.trending_up, size: 16, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                  'Status: ${contract.status.displayName}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
            const SizedBox(height: 4),

            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: 0.0,
              backgroundColor: Colors.grey[300],
              valueColor: AlwaysStoppedAnimation<Color>(
                _getStatusColor(contract.status),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => PaymentFormScreen(
                          contractId: contract.id,
                        ),
                      ),
                    );
                    // Recarregar dados após retornar
                    if (context.mounted) {
                      await context.read<AppProvider>().loadPaymentsQuiet();
                    }
                  },
                  icon: const Icon(Icons.payment, size: 16),
                  label: const Text('Pagamentos'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => ContractFormScreen(contract: contract),
                      ),
                    );
                    // Recarregar contratos após editar
                    if (context.mounted) {
                      context.read<AppProvider>().loadContracts();
                    }
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
  
  void _performSearch(AppProvider provider) {
    provider.loadContracts(
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
    );
  }

  Color _getStatusColor(ContractStatus status) {
    switch (status) {
      case ContractStatus.draft:
        return Colors.grey;
      case ContractStatus.validated:
        return Colors.blue;
      case ContractStatus.active:
        return Colors.green;
      case ContractStatus.defaulting:
        return Colors.orange;
      case ContractStatus.paidOff:
        return Colors.green;
      case ContractStatus.closed:
        return Colors.red;
    }
  }
}