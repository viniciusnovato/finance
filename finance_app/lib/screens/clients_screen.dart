import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/client.dart';
import 'client_form_screen.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  final TextEditingController _searchController = TextEditingController();
  AttentionLevel? _selectedStatus;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().loadClients();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _performSearch() {
    final provider = context.read<AppProvider>();
    provider.loadClients(
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      attentionLevel: _selectedStatus,
    );
  }

  void _clearSearch() {
    _searchController.clear();
    setState(() {
      _selectedStatus = null;
    });
    context.read<AppProvider>().loadClients();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clientes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const ClientFormScreen(),
                ),
              ).then((_) {
                // Recarregar lista após voltar do formulário
                context.read<AppProvider>().loadClients();
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Barra de pesquisa e filtros
          Container(
            padding: const EdgeInsets.all(16.0),
            color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: SearchBar(
                        controller: _searchController,
                        hintText: 'Pesquisar clientes...',
                        leading: const Icon(Icons.search),
                        trailing: _searchController.text.isNotEmpty
                            ? [IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: _clearSearch,
                              )]
                            : null,
                        onSubmitted: (_) => _performSearch(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: _performSearch,
                      child: const Text('Buscar'),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<AttentionLevel>(
                        value: _selectedStatus,
                        decoration: InputDecoration(
                          labelText: 'Nível de Atenção',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 12,
                          ),
                        ),
                        items: [
                          const DropdownMenuItem<AttentionLevel>(
                            value: null,
                            child: Text('Todos'),
                          ),
                          ...AttentionLevel.values.map(
                            (level) => DropdownMenuItem<AttentionLevel>(
                              value: level,
                              child: Text(level.displayName),
                            ),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _selectedStatus = value;
                          });
                          _performSearch();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: _clearSearch,
                      child: const Text('Limpar'),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Lista de clientes
          Expanded(
            child: Consumer<AppProvider>(
              builder: (context, provider, child) {
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
                          'Erro ao carregar clientes',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          provider.error!,
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => provider.loadClients(),
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  );
                }

                if (provider.clients.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.people_outline,
                          size: 64,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Nenhum cliente encontrado',
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Adicione um novo cliente ou ajuste os filtros de pesquisa',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => provider.loadClients(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.clients.length,
                    itemBuilder: (context, index) {
                      final client = provider.clients[index];
                      return ClientCard(
                        client: client,
                        onTap: () {
                          // TODO: Navegar para detalhes do cliente
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Cliente: ${client.firstName} ${client.lastName}'),
                            ),
                          );
                        },
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class ClientCard extends StatelessWidget {
  final Client client;
  final VoidCallback? onTap;

  const ClientCard({
    super.key,
    required this.client,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Theme.of(context).primaryColor,
                    child: Text(
                      '${client.firstName.isNotEmpty ? client.firstName[0] : '?'}${client.lastName.isNotEmpty ? client.lastName[0] : '?'}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${client.firstName} ${client.lastName}',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        if (client.email != null && client.email!.isNotEmpty)
                          Text(
                            client.email!,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: client.isActive ? Colors.green[100] : Colors.red[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      client.isActive ? 'Ativo' : 'Inativo',
                      style: TextStyle(
                        color: client.isActive ? Colors.green[800] : Colors.red[800],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              if (client.phone != null && client.phone!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.phone,
                      size: 16,
                      color: Colors.grey[600],
                    ),
                    const SizedBox(width: 4),
                    Text(
                      client.phone!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
              if (client.attentionLevel != AttentionLevel.normal) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.warning,
                      size: 16,
                      color: _getAttentionLevelColor(client.attentionLevel),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _getAttentionLevelText(client.attentionLevel),
                      style: TextStyle(
                        color: _getAttentionLevelColor(client.attentionLevel),
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getAttentionLevelColor(AttentionLevel level) {
    switch (level) {
      case AttentionLevel.risk:
        return Colors.red;
      case AttentionLevel.lightDelay:
        return Colors.orange;
      case AttentionLevel.severeDelay:
        return Colors.red[800]!;
      default:
        return Colors.grey;
    }
  }

  String _getAttentionLevelText(AttentionLevel level) {
    return level.displayName;
  }
}