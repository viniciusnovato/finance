import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/client.dart';
import '../providers/app_provider_refactored.dart';
import '../providers/client_provider.dart';
import '../utils/app_colors.dart';
import '../screens/client_form_screen.dart';

/// Exemplo de widget refatorado que usa os novos providers
/// Demonstra como acessar providers específicos através do AppProviderRefactored
/// ou diretamente através do MultiProvider
class ClientListWidgetRefactored extends StatefulWidget {
  const ClientListWidgetRefactored({super.key});

  @override
  State<ClientListWidgetRefactored> createState() => _ClientListWidgetRefactoredState();
}

class _ClientListWidgetRefactoredState extends State<ClientListWidgetRefactored> {
  final TextEditingController _searchController = TextEditingController();
  AttentionLevel? _selectedAttentionLevel;
  
  @override
  void initState() {
    super.initState();
    _loadClients();
  }
  
  Future<void> _loadClients() async {
    // Opção 1: Usando AppProviderRefactored (recomendado para transição)
    final appProvider = context.read<AppProviderRefactored>();
    await appProvider.clients.loadClients();
    
    // Opção 2: Usando provider específico diretamente (arquitetura final)
    // final clientProvider = context.read<ClientProvider>();
    // await clientProvider.loadClients();
  }
  
  Future<void> _refreshClients() async {
    final appProvider = context.read<AppProviderRefactored>();
    await appProvider.clients.loadClients(
      search: _searchController.text.isEmpty ? null : _searchController.text,
      attentionLevel: _selectedAttentionLevel,
    );
  }
  
  void _onSearchChanged() {
    // Implementar debounce para melhor performance
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _refreshClients();
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    // Opção 1: Usando AppProviderRefactored
    return Consumer<AppProviderRefactored>(
      builder: (context, appProvider, child) {
        final clientProvider = appProvider.clients;
        return _buildClientList(clientProvider);
      },
    );
    
    // Opção 2: Usando provider específico diretamente
    // return Consumer<ClientProvider>(
    //   builder: (context, clientProvider, child) {
    //     return _buildClientList(clientProvider);
    //   },
    // );
  }
  
  Widget _buildClientList(ClientProvider clientProvider) {
    return Column(
      children: [
        _buildSearchAndFilters(),
        const SizedBox(height: 16),
        Expanded(
          child: _buildContent(clientProvider),
        ),
      ],
    );
  }
  
  Widget _buildSearchAndFilters() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Campo de busca
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                labelText: 'Buscar clientes',
                hintText: 'Nome, email ou documento',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onChanged: (_) => _onSearchChanged(),
            ),
            const SizedBox(height: 16),
            
            // Filtro de nível de atenção
            Row(
              children: [
                const Text('Nível de Atenção: '),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<AttentionLevel?>(
                    value: _selectedAttentionLevel,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    items: [
                      const DropdownMenuItem<AttentionLevel?>(
                        value: null,
                        child: Text('Todos'),
                      ),
                      ...AttentionLevel.values.map((level) => DropdownMenuItem(
                        value: level,
                        child: Text(_getAttentionLevelText(level)),
                      )),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _selectedAttentionLevel = value;
                      });
                      _refreshClients();
                    },
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildContent(ClientProvider clientProvider) {
    if (clientProvider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }
    
    if (clientProvider.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Erro ao carregar clientes',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              clientProvider.error!,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _refreshClients,
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      );
    }
    
    final clients = clientProvider.clients;
    
    if (clients.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_outline,
              size: 64,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
            const SizedBox(height: 16),
            Text(
              'Nenhum cliente encontrado',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Tente ajustar os filtros ou adicionar um novo cliente',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => _navigateToClientForm(),
              icon: const Icon(Icons.add),
              label: const Text('Adicionar Cliente'),
            ),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: _refreshClients,
      child: ListView.builder(
        itemCount: clients.length,
        itemBuilder: (context, index) {
          final client = clients[index];
          return _buildClientCard(client);
        },
      ),
    );
  }
  
  Widget _buildClientCard(Client client) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getAttentionLevelColor(client.attentionLevel),
          child: Text(
            client.fullName.isNotEmpty ? client.fullName[0].toUpperCase() : '?',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
        title: Text(
          client.fullName,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (client.email?.isNotEmpty == true) Text(client.email!),
            if (client.phone?.isNotEmpty == true) Text(client.phone!),
            Text(
              'Nível: ${_getAttentionLevelText(client.attentionLevel)}',
              style: TextStyle(
                color: _getAttentionLevelColor(client.attentionLevel),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => _navigateToClientForm(client: client),
            ),
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: () => _confirmDeleteClient(client),
            ),
          ],
        ),
        onTap: () => _navigateToClientForm(client: client),
      ),
    );
  }
  
  String _getAttentionLevelText(AttentionLevel level) {
    switch (level) {
      case AttentionLevel.normal:
        return 'Normal';
      case AttentionLevel.risk:
        return 'Risco';
      case AttentionLevel.lightDelay:
        return 'Atraso Leve';
      case AttentionLevel.severeDelay:
        return 'Atraso Severo';
    }
  }
  
  Color _getAttentionLevelColor(AttentionLevel level) {
    switch (level) {
      case AttentionLevel.normal:
        return Colors.green;
      case AttentionLevel.risk:
        return Colors.orange;
      case AttentionLevel.lightDelay:
        return Colors.amber;
      case AttentionLevel.severeDelay:
        return Colors.red;
    }
  }
  
  void _navigateToClientForm({Client? client}) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ClientFormScreen(client: client),
      ),
    ).then((_) {
      // Recarregar lista após retornar do formulário
      _refreshClients();
    });
  }
  
  void _confirmDeleteClient(Client client) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text('Deseja realmente excluir o cliente "${client.fullName}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteClient(client);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
  
  Future<void> _deleteClient(Client client) async {
    try {
      final appProvider = context.read<AppProviderRefactored>();
      await appProvider.clients.deleteClient(client.id);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cliente excluído com sucesso'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao excluir cliente: $e'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}