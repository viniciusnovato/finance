import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/client.dart';
import '../utils/app_colors.dart';
import '../screens/client_form_screen.dart';

class ClientListWidget extends StatefulWidget {
  const ClientListWidget({super.key});

  @override
  State<ClientListWidget> createState() => _ClientListWidgetState();
}

class _ClientListWidgetState extends State<ClientListWidget> {
  final TextEditingController _searchController = TextEditingController();
  AttentionLevel? _selectedAttentionLevel;
  Timer? _debounceTimer;
  
  @override
  void dispose() {
    _debounceTimer?.cancel();
    _searchController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(builder: (context, provider, child) {
      return Column(
        children: [
          _buildSearchAndFilter(provider),
          Expanded(
            child: _buildClientList(provider),
          ),
        ],
      );
    });
  }
  
  Widget _buildSearchAndFilter(AppProvider provider) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Container(
      padding: const EdgeInsets.all(16),
      color: colorScheme.surfaceVariant.withOpacity(0.3),
      child: Column(
        children: [
          SearchBar(
            controller: _searchController,
            hintText: 'Buscar por nome ou email...',
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
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<AttentionLevel?>(
                  value: _selectedAttentionLevel,
                  decoration: InputDecoration(
                    labelText: 'Nível de Atenção',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                  items: [
                    const DropdownMenuItem<AttentionLevel?>(
                      value: null,
                      child: Text('Todos'),
                    ),
                    ...AttentionLevel.values.map(
                      (level) => DropdownMenuItem<AttentionLevel?>(
                        value: level,
                        child: Text(level.displayName),
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _selectedAttentionLevel = value;
                    });
                    _debounceTimer?.cancel();
                    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
                      _performSearch(provider);
                    });
                  },
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                onPressed: () {
                  // TODO: Implementar adição de novo cliente
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Funcionalidade em desenvolvimento'),
                    ),
                  );
                },
                icon: const Icon(Icons.add),
                label: const Text('Novo'),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildClientList(AppProvider provider) {
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
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => provider.loadClients(),
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      );
    }
    
    final clients = provider.clients;
    
    if (clients.isEmpty) {
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
            const Text(
              'Adicione um novo cliente para começar',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      );
    }
    
    return RefreshIndicator(
      onRefresh: () => provider.loadClients(),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: clients.length,
        separatorBuilder: (context, index) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final client = clients[index];
          return _buildClientCard(client);
        },
      ),
    );
  }
  
  Widget _buildClientCard(Client client) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: _getAttentionLevelColor(client.attentionLevel),
          child: Text(
            (client.firstName.isNotEmpty ? client.firstName[0] : '?').toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          '${client.firstName} ${client.lastName}',
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            if (client.email?.isNotEmpty == true)
              Row(
                children: [
                  const Icon(Icons.email, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      client.email!,
                      style: const TextStyle(fontSize: 12),
                    ),
                  ),
                ],
              ),
            if (client.phone?.isNotEmpty == true)
              Row(
                children: [
                  const Icon(Icons.phone, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    client.phone!,
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: _getAttentionLevelColor(client.attentionLevel).withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                client.attentionLevel.displayName,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: _getAttentionLevelColor(client.attentionLevel),
                ),
              ),
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            switch (value) {
              case 'edit':
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => ClientFormScreen(client: client),
                  ),
                ).then((_) {
                  // Recarregar lista após voltar do formulário
                  Provider.of<AppProvider>(context, listen: false).loadClients();
                });
                break;
              case 'delete':
                _showDeleteConfirmation(client);
                break;
            }
          },
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit, size: 16),
                  SizedBox(width: 8),
                  Text('Editar'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, size: 16, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Excluir', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
        ),
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => ClientFormScreen(client: client),
            ),
          ).then((_) {
            // Recarregar lista após voltar do formulário
            Provider.of<AppProvider>(context, listen: false).loadClients();
          });
        },
      ),
    );
  }
  
  Color _getAttentionLevelColor(AttentionLevel level) {
    switch (level) {
      case AttentionLevel.normal:
        return Colors.green;
      case AttentionLevel.risk:
        return Colors.orange;
      case AttentionLevel.lightDelay:
        return Colors.orange;
      case AttentionLevel.severeDelay:
        return Colors.red;
    }
  }
  
  void _performSearch(AppProvider provider) {
    provider.loadClients(
      search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      attentionLevel: _selectedAttentionLevel,
    );
  }
  
  void _showDeleteConfirmation(Client client) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmar Exclusão'),
        content: Text(
          'Tem certeza que deseja excluir o cliente ${client.firstName} ${client.lastName}?\n\n'
          'Esta ação não pode ser desfeita.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              Provider.of<AppProvider>(context, listen: false)
                  .deleteClient(client.id!);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }
}