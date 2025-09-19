import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../widgets/dashboard_card.dart';
import '../widgets/client_list_widget.dart';
import '../widgets/contract_list_widget.dart';
import '../widgets/payment_list_widget.dart';
import '../utils/app_colors.dart';
import '../models/payment.dart';
import 'clients_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  late Future<Map<String, dynamic>> _dashboardDataFuture;
  bool _isInitialized = false;
  
  @override
  void initState() {
    super.initState();
    print('🏠 [HOME] initState chamado');
    _loadInitialData();
  }
  
  void _loadInitialData() {
    if (_isInitialized) return;
    _isInitialized = true;
    
    final provider = Provider.of<AppProvider>(context, listen: false);
    
    try {
      print('🏠 [HOME] Iniciando carregamento de dados...');
      
      // Criar o Future para o dashboard APENAS UMA VEZ
      _dashboardDataFuture = provider.getDashboardData();
      
      print('🏠 [HOME] Dashboard future inicializado');
      
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
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Instituto Areluna - Gestão Financeira',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 2,
        actions: [
          Consumer<AppProvider>(
            builder: (context, appProvider, child) {
              return PopupMenuButton<String>(
                icon: CircleAvatar(
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: Text(
                    appProvider.currentUser?.email?.substring(0, 1).toUpperCase() ?? 'U',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                onSelected: (value) async {
                  if (value == 'logout') {
                    try {
                      await appProvider.logout();
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Erro ao fazer logout: ${e.toString()}'),
                            backgroundColor: Colors.red,
                          ),
                        );
                      }
                    }
                  }
                },
                itemBuilder: (BuildContext context) => [
                  PopupMenuItem<String>(
                    enabled: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          appProvider.currentUser?.email ?? 'Usuário',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Logado como administrador',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                        const Divider(),
                      ],
                    ),
                  ),
                  const PopupMenuItem<String>(
                    value: 'logout',
                    child: Row(
                      children: [
                        Icon(Icons.logout, color: Colors.red),
                        SizedBox(width: 8),
                        Text(
                          'Sair',
                          style: TextStyle(color: Colors.red),
                        ),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outlined),
            selectedIcon: Icon(Icons.people),
            label: 'Clientes',
          ),
          NavigationDestination(
            icon: Icon(Icons.description_outlined),
            selectedIcon: Icon(Icons.description),
            label: 'Contratos',
          ),
          NavigationDestination(
            icon: Icon(Icons.payment_outlined),
            selectedIcon: Icon(Icons.payment),
            label: 'Pagamentos',
          ),
        ],
      ),
    );
  }
  
  Widget _buildBody() {
    switch (_selectedIndex) {
      case 0:
        return _buildDashboard();
      case 1:
        return const ClientsScreen();
      case 2:
        return const ContractListWidget();
      case 3:
        return const PaymentListWidget();
      default:
        return _buildDashboard();
    }
  }
  
  Widget _buildDashboard() {
    return Consumer<AppProvider>(builder: (context, provider, child) {
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
                'Erro ao carregar dados',
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
      
      return RefreshIndicator(
        onRefresh: () async {
          setState(() {
            _isInitialized = false;
          });
          _loadInitialData();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Resumo Geral',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              _buildDashboardCards(provider),
              const SizedBox(height: 24),
              Text(
                'Ações Rápidas',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              _buildQuickActions(),
              const SizedBox(height: 24),
              Text(
                'Pagamentos em Atraso',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 16),
              _buildOverduePayments(provider),
            ],
          ),
        ),
      );
    });
  }
  
  Widget _buildDashboardCards(AppProvider provider) {
    print('🏠 [DASHBOARD] Construindo dashboard cards...');
    return FutureBuilder<Map<String, dynamic>>(
      future: _dashboardDataFuture,
      builder: (context, snapshot) {
        print('🏠 [DASHBOARD] FutureBuilder state: ${snapshot.connectionState}');
        if (snapshot.hasError) {
          print('❌ [DASHBOARD] FutureBuilder error: ${snapshot.error}');
        }
        if (snapshot.connectionState == ConnectionState.waiting) {
          print('⏳ [DASHBOARD] FutureBuilder aguardando...');
          return const Center(child: CircularProgressIndicator());
        }
        
        final data = snapshot.data ?? {};
        final totalClients = data['total_clients'] ?? 0;
        final activeContracts = data['active_contracts'] ?? 0;
        final overduePayments = data['overdue_payments'] ?? 0;
        final totalReceivable = (data['total_receivable'] ?? 0.0).toDouble();
        final paymentSummary = data['payment_summary'] ?? {};
        final averagePaymentPercentage = (paymentSummary['average_payment_percentage'] ?? 0.0).toDouble();
        
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1.8,
          children: [
            DashboardCard(
              title: 'Total de Clientes',
              value: totalClients.toString(),
              icon: Icons.people,
              color: AppColors.primary,
            ),
            DashboardCard(
              title: 'Contratos Ativos',
              value: activeContracts.toString(),
              icon: Icons.description,
              color: Colors.green,
            ),
            DashboardCard(
              title: 'Pagamentos em Atraso',
              value: overduePayments.toString(),
              icon: Icons.warning,
              color: Colors.orange,
            ),
            DashboardCard(
              title: 'Total a Receber',
              value: '€ ${totalReceivable.toStringAsFixed(2)}',
              icon: Icons.attach_money,
              color: Colors.blue,
            ),
            DashboardCard(
              title: 'Média de Pagamento',
              value: '${averagePaymentPercentage.toStringAsFixed(1)}%',
              icon: Icons.trending_up,
              color: Colors.purple,
            ),
            DashboardCard(
              title: 'Contratos Quitados',
              value: (paymentSummary['fully_paid_contracts'] ?? 0).toString(),
              icon: Icons.check_circle,
              color: Colors.green[700]!,
            ),
          ],
        );
      },
    );
  }
  
  Widget _buildQuickActions() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () {
              // TODO: Implementar navegação para novo cliente
            },
            icon: const Icon(Icons.person_add),
            label: const Text('Novo Cliente'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () {
              // TODO: Implementar navegação para novo contrato
            },
            icon: const Icon(Icons.add_box),
            label: const Text('Novo Contrato'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }
  
  Widget _buildOverduePayments(AppProvider provider) {
    final overduePayments = provider.getOverduePaymentsLocal();
    final pendingNotOverduePayments = provider.payments
        .where((payment) => 
            payment.status == PaymentStatus.pending && 
            !payment.isOverdue)
        .toList();
    
    return Column(
      children: [
        // Pagamentos em atraso
        if (overduePayments.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.green[200]!),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.check_circle,
                  color: Colors.green[600],
                  size: 32,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Parabéns! Não há pagamentos em atraso.',
                    style: TextStyle(
                      color: Colors.green[800],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.orange[200]!),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange[100],
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(8),
                      topRight: Radius.circular(8),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.warning,
                        color: Colors.orange[800],
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Pagamentos em Atraso (${overduePayments.length})',
                          style: TextStyle(
                            color: Colors.orange[800],
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: overduePayments.take(5).length,
                  itemBuilder: (context, index) {
                    final payment = overduePayments[index];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.red[100],
                        child: Icon(
                          Icons.schedule,
                          color: Colors.red[800],
                          size: 20,
                        ),
                      ),
                      title: Text(
                        'Parcela ${payment.installmentNumber}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      subtitle: Text(
                        'Vencimento: ${payment.dueDate.day}/${payment.dueDate.month}/${payment.dueDate.year}\n'
                        '${payment.daysOverdue} dias em atraso',
                      ),
                      trailing: Text(
                        '€ ${payment.amount.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                      ),
                      isThreeLine: true,
                    );
                  },
                ),
                if (overduePayments.length > 5)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: TextButton(
                      onPressed: () {
                        setState(() {
                          _selectedIndex = 3; // Navegar para aba de pagamentos
                        });
                      },
                      child: const Text('Ver todos os pagamentos em atraso'),
                    ),
                  ),
              ],
            ),
          ),
        
        // Espaçamento entre widgets
        if (pendingNotOverduePayments.isNotEmpty) const SizedBox(height: 16),
        
        // Pagamentos pendentes não vencidos
        if (pendingNotOverduePayments.isNotEmpty)
          Container(
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.blue[200]!),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.blue[100],
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(8),
                      topRight: Radius.circular(8),
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.schedule_outlined,
                        color: Colors.blue[800],
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Próximos Vencimentos (${pendingNotOverduePayments.length})',
                          style: TextStyle(
                            color: Colors.blue[800],
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: pendingNotOverduePayments.take(5).length,
                  itemBuilder: (context, index) {
                    final payment = pendingNotOverduePayments[index];
                    final daysUntilDue = payment.daysUntilDue;
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Colors.blue[100],
                        child: Icon(
                          Icons.access_time,
                          color: Colors.blue[800],
                          size: 20,
                        ),
                      ),
                      title: Text(
                        'Parcela ${payment.installmentNumber}',
                        style: const TextStyle(fontWeight: FontWeight.w500),
                      ),
                      subtitle: Text(
                        'Vencimento: ${payment.dueDate.day}/${payment.dueDate.month}/${payment.dueDate.year}\n'
                        '${daysUntilDue > 0 ? "Vence em $daysUntilDue dias" : "Vence hoje"}',
                      ),
                      trailing: Text(
                        '€ ${payment.amount.toStringAsFixed(2)}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[800],
                        ),
                      ),
                      isThreeLine: true,
                    );
                  },
                ),
                if (pendingNotOverduePayments.length > 5)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: TextButton(
                      onPressed: () {
                        setState(() {
                          _selectedIndex = 3; // Navegar para aba de pagamentos
                        });
                      },
                      child: const Text('Ver todos os próximos vencimentos'),
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}