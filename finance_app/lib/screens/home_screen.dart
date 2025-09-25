import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/client_list_widget.dart';
import '../widgets/contract_list_widget.dart';
import '../widgets/payment_list_widget.dart';
import '../widgets/dashboard_card.dart';
import '../widgets/erp_dashboard_card.dart';
import '../widgets/erp_layout.dart';
import '../utils/app_colors.dart';
import '../services/api_service.dart';
import '../models/payment.dart';
import 'clients_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  Future<Map<String, dynamic>>? _dashboardDataFuture;
  bool _isInitialized = false;
  String? _selectedClientId; // Para filtrar contratos por cliente
  String? _selectedContractId; // Para filtrar pagamentos por contrato
  
  @override
  void initState() {
    super.initState();
    print('🏠 [HOME] initState chamado');
    _setupNavigationCallback();
    _loadInitialData();
  }
  
  void _setupNavigationCallback() {
    final appProvider = Provider.of<AppProvider>(context, listen: false);
    appProvider.onNavigationRequested = (int tabIndex, {String? clientId, String? contractId}) {
      setState(() {
        _selectedIndex = tabIndex;
        // Atualizar os filtros locais com os valores recebidos (incluindo null para limpar)
        _selectedClientId = clientId;
        _selectedContractId = contractId;
      });
      
      // Sempre recarregar dados quando os filtros mudarem, independente da aba
      WidgetsBinding.instance.addPostFrameCallback((_) {
        // Se navegando para contratos ou se os filtros mudaram
        if (tabIndex == 2) {
          appProvider.loadContracts(clientId: clientId);
        }
        
        // Se navegando para pagamentos ou se os filtros mudaram
        if (tabIndex == 3) {
          appProvider.loadPayments(clientId: clientId, contractId: contractId);
        }
        
        // CORREÇÃO: Se estamos removendo filtros de uma aba, 
        // precisamos também atualizar os dados das outras abas para manter sincronização
        if (clientId == null || contractId == null) {
          // Recarregar contratos se os filtros foram limpos
          appProvider.loadContracts(clientId: clientId);
          // Recarregar pagamentos se os filtros foram limpos
          appProvider.loadPayments(clientId: clientId, contractId: contractId);
        }
      });
    };
  }
  
  void _loadInitialData() {
    if (_isInitialized) return;
    _isInitialized = true;
    
    final provider = Provider.of<AppProvider>(context, listen: false);
    
    try {
      print('🏠 [HOME] Iniciando carregamento de dados...');
      
      print('🏠 [HOME] Preparando carregamento do dashboard');
      
      // Carregar dados em background sem alterar o estado de loading
      // para evitar rebuild durante build
      _loadDataInBackground(provider);
      
      print('🏠 [HOME] Carregamento iniciado em background!');
    } catch (e) {
      print('❌ [HOME] Erro no carregamento de dados: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar dados: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
  
  Future<void> _loadDataInBackground(AppProvider provider) async {
    // Aguardar um frame para evitar setState durante build
    await Future.delayed(Duration(milliseconds: 500));
    
    try {
      print('🏠 [HOME] Carregando dados em background (sem alterar loading state)...');
      
      // Carregar dados sem alterar o estado de loading para evitar rebuild
      await provider.loadClientsQuiet();
      print('🏠 [HOME] Clientes carregados silenciosamente');
      
      await provider.loadContractsQuiet();
      print('🏠 [HOME] Contratos carregados silenciosamente');
      
      await provider.loadPaymentsQuiet();
      print('🏠 [HOME] Pagamentos carregados silenciosamente');
      
      print('🏠 [HOME] Todos os dados carregados com sucesso!');
    } catch (e) {
      print('❌ [HOME] Erro no carregamento em background: $e');
    }
  }
  
  Widget _buildFallbackCards(AppProvider appProvider) {
    return ERPMetricsGrid(
      cards: [
        ERPDashboardCard(
          title: 'Total de Clientes',
          value: '${appProvider.clients.length}',
          subtitle: 'Clientes cadastrados',
          icon: Icons.people_outline,
          iconColor: AppColors.primary,
          onTap: () {
            setState(() {
              _selectedIndex = 1;
            });
          },
        ),
        ERPDashboardCard(
          title: 'Contratos Ativos',
          value: '${appProvider.contracts.length}',
          subtitle: 'Contratos em vigência',
          icon: Icons.description_outlined,
          iconColor: AppColors.secondary,
          onTap: () {
            setState(() {
              _selectedIndex = 2;
            });
          },
        ),
        ERPDashboardCard(
          title: 'Pagamentos Pendentes',
          value: '${appProvider.payments.where((p) => p.status == PaymentStatus.pending).length}',
          subtitle: 'Aguardando pagamento',
          icon: Icons.schedule_outlined,
          iconColor: AppColors.statusPending,
          onTap: () {
            setState(() {
              _selectedIndex = 3;
            });
          },
        ),
        ERPDashboardCard(
          title: 'Pagamentos em Atraso',
          value: '${appProvider.payments.where((p) => p.status == PaymentStatus.overdue).length}',
          subtitle: 'Requer atenção',
          icon: Icons.warning_outlined,
          iconColor: AppColors.statusOverdue,
          onTap: () {
            setState(() {
              _selectedIndex = 3;
            });
          },
        ),
      ],
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return ERPLayout(
      title: _getPageTitle(),
      breadcrumbs: _getBreadcrumbs(),
      selectedIndex: _selectedIndex,
      onNavigationChanged: (index) {
        setState(() {
          _selectedIndex = index;
          // Limpar filtros ao trocar de aba
          _selectedClientId = null;
          _selectedContractId = null;
        });
      },
      child: _buildBody(),
    );
  }
  
  String _getPageTitle() {
    switch (_selectedIndex) {
      case 0:
        return 'Dashboard';
      case 1:
        return 'Clientes';
      case 2:
        return 'Contratos';
      case 3:
        return 'Pagamentos';
      default:
        return 'Dashboard';
    }
  }
  
  List<String> _getBreadcrumbs() {
    switch (_selectedIndex) {
      case 0:
        return ['Home', 'Dashboard'];
      case 1:
        return ['Home', 'Gestão', 'Clientes'];
      case 2:
        return ['Home', 'Gestão', 'Contratos'];
      case 3:
        return ['Home', 'Gestão', 'Pagamentos'];
      default:
        return ['Home'];
    }
  }
  
  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboard();
      case 1:
        return const ClientsScreen();
      case 2:
        return ContractListWidget(
          clientId: _selectedClientId,
          clientName: _selectedClientId != null ? _getClientName(_selectedClientId!) : null,
        );
      case 3:
        return PaymentListWidget(
          clientId: _selectedClientId,
          contractId: _selectedContractId,
          clientName: _selectedClientId != null ? _getClientName(_selectedClientId!) : null,
        );
      default:
        return _buildDashboard();
    }
  }
  
  String? _getClientName(String clientId) {
    final provider = Provider.of<AppProvider>(context, listen: false);
    final client = provider.clients.where((c) => c.id == clientId).firstOrNull;
    return client != null ? '${client.firstName} ${client.lastName}' : null;
  }
  
  Widget _buildDashboard() {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        if (appProvider.isLoading) {
          return const Center(
            child: CircularProgressIndicator(),
          );
        }

        if (appProvider.error != null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: AppColors.statusOverdue,
                ),
                const SizedBox(height: 16),
                Text(
                  'Erro ao carregar dados',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 8),
                Text(
                  appProvider.error!,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    setState(() {
                      _isInitialized = false;
                    });
                    _loadInitialData();
                  },
                  child: const Text('Tentar Novamente'),
                ),
              ],
            ),
          );
        }

        return SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Métricas principais com dados da API
              FutureBuilder<Map<String, dynamic>>(
                future: appProvider.getDashboardData(),
                builder: (context, snapshot) {
                  print('🏠 [DASHBOARD] FutureBuilder state: ${snapshot.connectionState}');
                  if (snapshot.hasError) {
                    print('❌ [DASHBOARD] FutureBuilder error: ${snapshot.error}');
                    // Fallback para dados locais em caso de erro
                    return _buildFallbackCards(appProvider);
                  }
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    print('⏳ [DASHBOARD] FutureBuilder aguardando...');
                    return const Center(
                      child: Padding(
                        padding: EdgeInsets.all(50),
                        child: CircularProgressIndicator(),
                      ),
                    );
                  }
                  
                  final data = snapshot.data ?? {};
                  print('📊 [DASHBOARD] Dados recebidos: $data');
                  print('📊 [DASHBOARD] total_clients: ${data['total_clients']}');
                  print('📊 [DASHBOARD] active_contracts: ${data['active_contracts']}');
                  print('📊 [DASHBOARD] overdue_payments: ${data['overdue_payments']}');
                  
                  return ERPMetricsGrid(
                    cards: [
                      ERPDashboardCard(
                        title: 'Total de Clientes',
                        value: '${data['total_clients'] ?? 0}',
                        subtitle: 'Clientes cadastrados',
                        icon: Icons.people_outline,
                        iconColor: AppColors.primary,
                        trend: '+12%',
                        isPositiveTrend: true,
                        onTap: () {
                          setState(() {
                            _selectedIndex = 1;
                          });
                        },
                      ),
                      ERPDashboardCard(
                        title: 'Contratos Ativos',
                        value: '${data['active_contracts'] ?? 0}',
                        subtitle: 'Contratos em vigência',
                        icon: Icons.description_outlined,
                        iconColor: AppColors.secondary,
                        trend: '+5%',
                        isPositiveTrend: true,
                        onTap: () {
                          setState(() {
                            _selectedIndex = 2;
                          });
                        },
                      ),
                      ERPDashboardCard(
                        title: 'Pagamentos Pendentes',
                        value: '${(data['payments'] ?? {})['pending'] ?? appProvider.payments.where((p) => p.status == PaymentStatus.pending).length}',
                        subtitle: 'Aguardando pagamento',
                        icon: Icons.schedule_outlined,
                        iconColor: AppColors.statusPending,
                        onTap: () {
                          setState(() {
                            _selectedIndex = 3;
                          });
                        },
                      ),
                      ERPDashboardCard(
                        title: 'Pagamentos em Atraso',
                        value: '${data['overdue_payments'] ?? 0}',
                        subtitle: 'Requer atenção',
                        icon: Icons.warning_outlined,
                        iconColor: AppColors.statusOverdue,
                        trend: '-8%',
                        isPositiveTrend: false,
                        onTap: () {
                          setState(() {
                            _selectedIndex = 3;
                          });
                        },
                      ),
                    ],
                  );
                },
              ),
              
              const SizedBox(height: 32),
              
              // Ações Rápidas
              Card(
                elevation: 1,
                color: AppColors.surface,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ações Rápidas',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(context, '/client-form');
                            },
                            icon: const Icon(Icons.person_add_outlined),
                            label: const Text('Novo Cliente'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(context, '/contract-form');
                            },
                            icon: const Icon(Icons.add_circle_outline),
                            label: const Text('Novo Contrato'),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                            ),
                          ),
                          OutlinedButton.icon(
                            onPressed: () {
                              setState(() {
                                _selectedIndex = 3;
                              });
                            },
                            icon: const Icon(Icons.payment_outlined),
                            label: const Text('Ver Pagamentos'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Pagamentos em Atraso
              if (appProvider.payments.where((p) => p.status == PaymentStatus.overdue).isNotEmpty)
                Card(
                  elevation: 1,
                  color: AppColors.surface,
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Icon(
                              Icons.warning_outlined,
                              color: AppColors.statusOverdue,
                              size: 24,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Pagamentos em Atraso',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: AppColors.onSurface,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildOverduePayments(appProvider),
                      ],
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildOverduePayments(AppProvider provider) {
    final overduePayments = provider.getOverduePaymentsLocal();
    
    if (overduePayments.isEmpty) {
      return const Text('Nenhum pagamento em atraso.');
    }
    
    return Column(
      children: overduePayments.take(5).map((payment) {
        return ListTile(
          leading: Icon(
            Icons.warning,
            color: AppColors.statusOverdue,
          ),
          title: Text('Pagamento #${payment.id}'),
          subtitle: Text('Vencimento: ${payment.dueDate.day}/${payment.dueDate.month}/${payment.dueDate.year}'),
          trailing: Text(
            'R\$ ${payment.amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: AppColors.statusOverdue,
              fontWeight: FontWeight.bold,
            ),
          ),
        );
      }).toList(),
    );
  }
}