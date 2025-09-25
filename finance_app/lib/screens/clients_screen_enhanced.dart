import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/client.dart';
import '../screens/client_form_screen_enhanced.dart';
import '../widgets/client_detail_modal.dart';
import '../widgets/delete_confirmation_dialog.dart';
import '../widgets/advanced_search_modal.dart';
import '../widgets/quick_actions_menu.dart';
import '../utils/app_colors.dart';

class ClientsScreenEnhanced extends StatefulWidget {
  const ClientsScreenEnhanced({super.key});

  @override
  State<ClientsScreenEnhanced> createState() => _ClientsScreenEnhancedState();
}

class _ClientsScreenEnhancedState extends State<ClientsScreenEnhanced> {
  final TextEditingController _searchController = TextEditingController();
  AttentionLevel? _selectedAttentionLevel;
  String _sortBy = 'name'; // name, created_at, attention_level
  bool _sortAscending = true;
  bool _showFilters = false;
  int _currentPage = 1;
  final int _itemsPerPage = 20;
  
  // Novas funcionalidades
  AdvancedSearchCriteria? _advancedSearchCriteria;
  final Set<String> _selectedClientIds = <String>{};
  bool _isSelectionMode = false;

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
    final query = _searchController.text.trim();
    context.read<AppProvider>().loadClients(
      search: query.isEmpty ? null : query,
      attentionLevel: _selectedAttentionLevel,
    );
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _selectedAttentionLevel = null;
      _sortBy = 'name';
      _sortAscending = true;
      _currentPage = 1;
    });
    context.read<AppProvider>().loadClients();
  }

  void _toggleSort(String field) {
    setState(() {
      if (_sortBy == field) {
        _sortAscending = !_sortAscending;
      } else {
        _sortBy = field;
        _sortAscending = true;
      }
    });
  }

  List<Client> _getSortedAndFilteredClients(List<Client> clients) {
    var filteredClients = clients.where((client) {
      // Busca básica
      final searchQuery = _searchController.text.toLowerCase();
      final matchesSearch = searchQuery.isEmpty ||
          client.fullName.toLowerCase().contains(searchQuery) ||
          (client.email?.toLowerCase().contains(searchQuery) ?? false) ||
          (client.phone?.contains(searchQuery) ?? false) ||
          (client.taxId?.contains(searchQuery) ?? false);

      final matchesAttention = _selectedAttentionLevel == null ||
          client.attentionLevel == _selectedAttentionLevel;

      // Busca avançada
      final matchesAdvanced = _advancedSearchCriteria == null ||
          _advancedSearchCriteria!.matches(client);

      return matchesSearch && matchesAttention && matchesAdvanced;
    }).toList();

    // Ordenação
    filteredClients.sort((a, b) {
      int comparison = 0;
      switch (_sortBy) {
        case 'name':
          comparison = a.fullName.compareTo(b.fullName);
          break;
        case 'created_at':
          comparison = a.createdAt.compareTo(b.createdAt);
          break;
        case 'attention_level':
          comparison = a.attentionLevel.index.compareTo(b.attentionLevel.index);
          break;
      }
      return _sortAscending ? comparison : -comparison;
    });

    return filteredClients;
  }

  List<Client> _getPaginatedClients(List<Client> clients) {
    final startIndex = (_currentPage - 1) * _itemsPerPage;
    final endIndex = startIndex + _itemsPerPage;
    return clients.sublist(
      startIndex,
      endIndex > clients.length ? clients.length : endIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Gestão de Clientes',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(
            height: 1,
            color: Colors.grey[200],
          ),
        ),
        actions: [
          // Botão de busca avançada
          IconButton(
            icon: Icon(
              _advancedSearchCriteria != null ? Icons.search : Icons.search_outlined,
              color: _advancedSearchCriteria != null ? Theme.of(context).primaryColor : null,
            ),
            onPressed: _showAdvancedSearch,
            tooltip: 'Busca Avançada',
          ),
          // Botão de seleção múltipla
          IconButton(
            icon: Icon(
              _isSelectionMode ? Icons.checklist : Icons.checklist_outlined,
              color: _isSelectionMode ? Theme.of(context).primaryColor : null,
            ),
            onPressed: _toggleSelectionMode,
            tooltip: 'Seleção Múltipla',
          ),
          IconButton(
            icon: Icon(_showFilters ? Icons.filter_list : Icons.filter_list_outlined),
            onPressed: () {
              setState(() {
                _showFilters = !_showFilters;
              });
            },
            tooltip: 'Filtros',
          ),
          // Menu de ações rápidas
          Consumer<AppProvider>(
            builder: (context, provider, child) {
              final selectedClients = provider.clients
                  .where((client) => _selectedClientIds.contains(client.id))
                  .toList();
              
              return QuickActionsMenu(
                selectedClients: selectedClients,
                onBulkDelete: _bulkDeleteClients,
                onBulkActivate: _bulkActivateClients,
                onBulkDeactivate: _bulkDeactivateClients,
                onExportSelected: _exportSelectedClients,
                onExportAll: _exportAllClients,
                onImportClients: _importClients,
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<AppProvider>().loadClients(),
            tooltip: 'Atualizar',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Barra de busca sempre visível
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Buscar por nome, email, telefone ou documento...',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _searchController.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                _performSearch();
                              },
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide(color: Theme.of(context).primaryColor),
                      ),
                      filled: true,
                      fillColor: Colors.grey[50],
                    ),
                    onChanged: (_) => _performSearch(),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton.icon(
                  onPressed: () => _navigateToClientForm(),
                  icon: const Icon(Icons.add),
                  label: const Text('Novo Cliente'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Filtros avançados (expansível)
          if (_showFilters) _buildAdvancedFilters(),

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
                  return _buildErrorState(provider.error!);
                }

                final allClients = _getSortedAndFilteredClients(provider.clients);
                final paginatedClients = _getPaginatedClients(allClients);

                if (allClients.isEmpty) {
                  return _buildEmptyState();
                }

                return Column(
                  children: [
                    // Cabeçalho com estatísticas e ordenação
                    _buildListHeader(allClients.length),
                    
                    // Lista de clientes
                    Expanded(
                      child: RefreshIndicator(
                        onRefresh: () => provider.loadClients(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: paginatedClients.length,
                          itemBuilder: (context, index) {
                            return _buildClientCard(paginatedClients[index]);
                          },
                        ),
                      ),
                    ),

                    // Paginação
                    if (allClients.length > _itemsPerPage)
                      _buildPagination(allClients.length),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdvancedFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.tune, size: 20),
              const SizedBox(width: 8),
              const Text(
                'Filtros Avançados',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              TextButton(
                onPressed: _clearFilters,
                child: const Text('Limpar Filtros'),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Nível de Atenção'),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<AttentionLevel?>(
                      value: _selectedAttentionLevel,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: [
                        const DropdownMenuItem<AttentionLevel?>(
                          value: null,
                          child: Text('Todos os níveis'),
                        ),
                        ...AttentionLevel.values.map((level) => DropdownMenuItem(
                          value: level,
                          child: Row(
                            children: [
                              Container(
                                width: 12,
                                height: 12,
                                decoration: BoxDecoration(
                                  color: _getAttentionLevelColor(level),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(level.displayName),
                            ],
                          ),
                        )),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _selectedAttentionLevel = value;
                        });
                        _performSearch();
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Ordenar por'),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      value: _sortBy,
                      decoration: InputDecoration(
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'name', child: Text('Nome')),
                        DropdownMenuItem(value: 'created_at', child: Text('Data de Criação')),
                        DropdownMenuItem(value: 'attention_level', child: Text('Nível de Atenção')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          _toggleSort(value);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildListHeader(int totalCount) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      color: Colors.white,
      child: Row(
        children: [
          Text(
            '$totalCount cliente${totalCount != 1 ? 's' : ''} encontrado${totalCount != 1 ? 's' : ''}',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          const Spacer(),
          Row(
            children: [
              const Text('Ordenar: '),
              InkWell(
                onTap: () => _toggleSort(_sortBy),
                child: Row(
                  children: [
                    Text(
                      _sortBy == 'name' ? 'Nome' :
                      _sortBy == 'created_at' ? 'Data' : 'Nível',
                      style: TextStyle(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Icon(
                      _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
                      size: 16,
                      color: Theme.of(context).primaryColor,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildClientCard(Client client) {
    final isSelected = _selectedClientIds.contains(client.id);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: _isSelectionMode && isSelected 
            ? BorderSide(color: Theme.of(context).primaryColor, width: 2)
            : BorderSide.none,
      ),
      child: InkWell(
        onTap: () {
          if (_isSelectionMode) {
            _toggleClientSelection(client.id);
          } else {
            _showClientDetails(client);
          }
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (_isSelectionMode) ...[
                    Checkbox(
                      value: isSelected,
                      onChanged: (value) => _toggleClientSelection(client.id),
                      activeColor: Theme.of(context).primaryColor,
                    ),
                    const SizedBox(width: 8),
                  ],
                  CircleAvatar(
                    backgroundColor: _getAttentionLevelColor(client.attentionLevel),
                    radius: 24,
                    child: Text(
                      client.fullName.isNotEmpty 
                          ? client.fullName.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase()
                          : '??',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          client.fullName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getAttentionLevelColor(client.attentionLevel).withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _getAttentionLevelColor(client.attentionLevel).withOpacity(0.3),
                            ),
                          ),
                          child: Text(
                            client.attentionLevel.displayName,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: _getAttentionLevelColor(client.attentionLevel),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  PopupMenuButton<String>(
                    onSelected: (value) => _handleClientAction(value, client),
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'view',
                        child: Row(
                          children: [
                            Icon(Icons.visibility, size: 18),
                            SizedBox(width: 8),
                            Text('Visualizar'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 8),
                            Text('Editar'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Excluir', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (client.email?.isNotEmpty == true) ...[
                    const Icon(Icons.email, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        client.email!,
                        style: const TextStyle(fontSize: 14, color: Colors.grey),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                  if (client.phone?.isNotEmpty == true) ...[
                    if (client.email?.isNotEmpty == true) const SizedBox(width: 16),
                    const Icon(Icons.phone, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      client.phone!,
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ],
              ),
              if (client.city?.isNotEmpty == true) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      client.city!,
                      style: const TextStyle(fontSize: 14, color: Colors.grey),
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

  Widget _buildPagination(int totalItems) {
    final totalPages = (totalItems / _itemsPerPage).ceil();
    
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            onPressed: _currentPage > 1 ? () {
              setState(() {
                _currentPage--;
              });
            } : null,
            icon: const Icon(Icons.chevron_left),
          ),
          ...List.generate(
            totalPages > 5 ? 5 : totalPages,
            (index) {
              int pageNumber;
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else {
                if (_currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (_currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = _currentPage - 2 + index;
                }
              }
              
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _currentPage = pageNumber;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: _currentPage == pageNumber 
                          ? Theme.of(context).primaryColor 
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: _currentPage == pageNumber 
                            ? Theme.of(context).primaryColor 
                            : Colors.grey[300]!,
                      ),
                    ),
                    child: Text(
                      pageNumber.toString(),
                      style: TextStyle(
                        color: _currentPage == pageNumber ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          IconButton(
            onPressed: _currentPage < totalPages ? () {
              setState(() {
                _currentPage++;
              });
            } : null,
            icon: const Icon(Icons.chevron_right),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String error) {
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
            error,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => context.read<AppProvider>().loadClients(),
            child: const Text('Tentar Novamente'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
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
            'Adicione um novo cliente ou ajuste os filtros de pesquisa',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => _navigateToClientForm(),
            icon: const Icon(Icons.add),
            label: const Text('Adicionar Cliente'),
          ),
        ],
      ),
    );
  }

  // Métodos para busca avançada e ações rápidas
  void _showAdvancedSearch() {
    // Funcionalidade temporariamente desativada
    // O ícone permanece visível mas não executa nenhuma ação
    return;
  }

  void _toggleSelectionMode() {
    setState(() {
      _isSelectionMode = !_isSelectionMode;
      if (!_isSelectionMode) {
        _selectedClientIds.clear();
      }
    });
  }

  void _toggleClientSelection(String clientId) {
    setState(() {
      if (_selectedClientIds.contains(clientId)) {
        _selectedClientIds.remove(clientId);
      } else {
        _selectedClientIds.add(clientId);
      }
    });
  }

  void _bulkDeleteClients() async {
    if (_selectedClientIds.isEmpty) return;

    bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => DeleteConfirmationDialog(
        title: 'Excluir Clientes',
        message: 'Tem certeza que deseja excluir ${_selectedClientIds.length} cliente(s) selecionado(s)? Esta ação não pode ser desfeita.',
        itemName: '${_selectedClientIds.length} cliente(s)',
        onConfirm: () => Navigator.of(context).pop(true),
        onCancel: () => Navigator.of(context).pop(false),
      ),
    );

    if (confirmed == true) {
      try {
        final provider = context.read<AppProvider>();
        for (final clientId in _selectedClientIds) {
          await provider.deleteClient(clientId);
        }
        
        setState(() {
          _selectedClientIds.clear();
          _isSelectionMode = false;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Clientes excluídos com sucesso'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao excluir clientes: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  void _bulkActivateClients() async {
    if (_selectedClientIds.isEmpty) return;

    try {
      final provider = context.read<AppProvider>();
      for (final clientId in _selectedClientIds) {
        final client = provider.clients.firstWhere((c) => c.id == clientId);
        final updatedClient = client.copyWith(isActive: true);
        await provider.updateClient(updatedClient);
      }

      setState(() {
        _selectedClientIds.clear();
        _isSelectionMode = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Clientes ativados com sucesso'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao ativar clientes: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _bulkDeactivateClients() async {
    if (_selectedClientIds.isEmpty) return;

    try {
      final provider = context.read<AppProvider>();
      for (final clientId in _selectedClientIds) {
        final client = provider.clients.firstWhere((c) => c.id == clientId);
        final updatedClient = client.copyWith(isActive: false);
        await provider.updateClient(updatedClient);
      }

      setState(() {
        _selectedClientIds.clear();
        _isSelectionMode = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Clientes desativados com sucesso'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao desativar clientes: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _exportSelectedClients() {
    if (_selectedClientIds.isEmpty) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exportando ${_selectedClientIds.length} cliente(s)...'),
        backgroundColor: Colors.blue,
      ),
    );
    
    // TODO: Implementar exportação real
  }

  void _exportAllClients() {
    final provider = context.read<AppProvider>();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Exportando ${provider.clients.length} cliente(s)...'),
        backgroundColor: Colors.blue,
      ),
    );
    
    // TODO: Implementar exportação real
  }

  void _importClients() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Funcionalidade de importação em desenvolvimento...'),
        backgroundColor: Colors.orange,
      ),
    );
    
    // TODO: Implementar importação real
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

  void _navigateToClientForm({Client? client}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ClientFormScreenEnhanced(client: client),
      ),
    );

    if (result == true) {
      context.read<AppProvider>().loadClients();
    }
  }

  void _showClientDetails(Client client) {
    showDialog(
      context: context,
      builder: (context) => ClientDetailModal(client: client),
    );
  }

  void _handleClientAction(String action, Client client) {
    switch (action) {
      case 'view':
        _showClientDetails(client);
        break;
      case 'edit':
        _editClient(client);
        break;
      case 'delete':
        _showDeleteConfirmation(client);
        break;
    }
  }

  void _editClient(Client client) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ClientFormScreenEnhanced(client: client),
      ),
    );

    if (result == true) {
      context.read<AppProvider>().loadClients();
    }
  }

  void _showDeleteConfirmation(Client client) async {
    bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => DeleteConfirmationDialog(
        title: 'Excluir Cliente',
        message: 'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
        itemName: client.fullName,
        onConfirm: () => Navigator.of(context).pop(true),
        onCancel: () => Navigator.of(context).pop(false),
      ),
    );

    if (confirmed == true) {
      try {
        await context.read<AppProvider>().deleteClient(client.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Cliente "${client.fullName}" excluído com sucesso'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao excluir cliente: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }
}