import 'package:flutter/material.dart';
import '../models/client.dart';

class QuickActionsMenu extends StatelessWidget {
  final List<Client> selectedClients;
  final VoidCallback? onBulkDelete;
  final VoidCallback? onBulkActivate;
  final VoidCallback? onBulkDeactivate;
  final VoidCallback? onExportSelected;
  final VoidCallback? onExportAll;
  final VoidCallback? onImportClients;

  const QuickActionsMenu({
    super.key,
    required this.selectedClients,
    this.onBulkDelete,
    this.onBulkActivate,
    this.onBulkDeactivate,
    this.onExportSelected,
    this.onExportAll,
    this.onImportClients,
  });

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert),
      tooltip: 'Ações Rápidas',
      onSelected: (value) => _handleAction(context, value),
      itemBuilder: (context) => [
        // Ações de seleção múltipla
        if (selectedClients.isNotEmpty) ...[
          PopupMenuItem(
            value: 'bulk_delete',
            child: Row(
              children: [
                Icon(Icons.delete_outline, color: Colors.red[600]),
                const SizedBox(width: 12),
                Text(
                  'Excluir Selecionados (${selectedClients.length})',
                  style: TextStyle(color: Colors.red[600]),
                ),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'bulk_activate',
            child: Row(
              children: [
                Icon(Icons.check_circle_outline, color: Colors.green[600]),
                const SizedBox(width: 12),
                Text('Ativar Selecionados (${selectedClients.length})'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'bulk_deactivate',
            child: Row(
              children: [
                Icon(Icons.cancel_outlined, color: Colors.orange[600]),
                const SizedBox(width: 12),
                Text('Desativar Selecionados (${selectedClients.length})'),
              ],
            ),
          ),
          PopupMenuItem(
            value: 'export_selected',
            child: Row(
              children: [
                Icon(Icons.file_download, color: Colors.blue[600]),
                const SizedBox(width: 12),
                Text('Exportar Selecionados (${selectedClients.length})'),
              ],
            ),
          ),
          const PopupMenuDivider(),
        ],

        // Ações gerais
        PopupMenuItem(
          value: 'export_all',
          child: Row(
            children: [
              Icon(Icons.download, color: Colors.blue[600]),
              const SizedBox(width: 12),
              const Text('Exportar Todos'),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'import',
          child: Row(
            children: [
              Icon(Icons.upload, color: Colors.green[600]),
              const SizedBox(width: 12),
              const Text('Importar Clientes'),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem(
          value: 'statistics',
          child: Row(
            children: [
              Icon(Icons.analytics, color: Colors.purple[600]),
              const SizedBox(width: 12),
              const Text('Estatísticas'),
            ],
          ),
        ),
        PopupMenuItem(
          value: 'backup',
          child: Row(
            children: [
              Icon(Icons.backup, color: Colors.teal[600]),
              const SizedBox(width: 12),
              const Text('Backup de Dados'),
            ],
          ),
        ),
      ],
    );
  }

  void _handleAction(BuildContext context, String action) {
    switch (action) {
      case 'bulk_delete':
        _showBulkDeleteConfirmation(context);
        break;
      case 'bulk_activate':
        onBulkActivate?.call();
        break;
      case 'bulk_deactivate':
        onBulkDeactivate?.call();
        break;
      case 'export_selected':
        onExportSelected?.call();
        break;
      case 'export_all':
        onExportAll?.call();
        break;
      case 'import':
        onImportClients?.call();
        break;
      case 'statistics':
        _showStatistics(context);
        break;
      case 'backup':
        _showBackupDialog(context);
        break;
    }
  }

  void _showBulkDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning, color: Colors.red[600]),
            const SizedBox(width: 12),
            const Text('Confirmar Exclusão'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Tem certeza que deseja excluir ${selectedClients.length} cliente(s) selecionado(s)?',
              style: const TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.red[600], size: 20),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Esta ação não pode ser desfeita.',
                      style: TextStyle(fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              onBulkDelete?.call();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red[600],
              foregroundColor: Colors.white,
            ),
            child: const Text('Excluir'),
          ),
        ],
      ),
    );
  }

  void _showStatistics(BuildContext context) {
    final activeClients = selectedClients.where((c) => c.isActive).length;
    final inactiveClients = selectedClients.length - activeClients;
    // Código de níveis de atenção removido

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.analytics, color: Colors.purple[600]),
            const SizedBox(width: 12),
            const Text('Estatísticas dos Clientes'),
          ],
        ),
        content: SizedBox(
          width: 400,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatItem('Total de Clientes', selectedClients.length.toString(), Icons.people),
              const SizedBox(height: 12),
              _buildStatItem('Clientes Ativos', activeClients.toString(), Icons.check_circle, Colors.green),
              const SizedBox(height: 12),
              _buildStatItem('Clientes Inativos', inactiveClients.toString(), Icons.cancel, Colors.red),
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 16),
              const Text(
                'Níveis de Atenção:',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Fechar'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, [Color? color]) {
    return Row(
      children: [
        Icon(icon, color: color ?? Colors.grey[600], size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Text(label, style: const TextStyle(fontSize: 14)),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: (color ?? Colors.grey[600])!.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: color ?? Colors.grey[600],
            ),
          ),
        ),
      ],
    );
  }



  void _showBackupDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.backup, color: Colors.teal[600]),
            const SizedBox(width: 12),
            const Text('Backup de Dados'),
          ],
        ),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Selecione o tipo de backup que deseja realizar:',
              style: TextStyle(fontSize: 16),
            ),
            SizedBox(height: 16),
            Text(
              '• Backup Completo: Todos os dados dos clientes\n'
              '• Backup Seletivo: Apenas clientes selecionados\n'
              '• Backup Incremental: Apenas alterações recentes',
              style: TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              // Implementar lógica de backup
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Backup iniciado com sucesso!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.teal[600],
              foregroundColor: Colors.white,
            ),
            child: const Text('Iniciar Backup'),
          ),
        ],
      ),
    );
  }
}

class QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final Color? color;
  final bool isSelected;

  const QuickActionButton({
    super.key,
    required this.icon,
    required this.label,
    required this.onPressed,
    this.color,
    this.isSelected = false,
  });

  @override
  Widget build(BuildContext context) {
    final buttonColor = color ?? Theme.of(context).primaryColor;
    
    return Material(
      color: isSelected ? buttonColor.withOpacity(0.1) : Colors.transparent,
      borderRadius: BorderRadius.circular(8),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isSelected ? buttonColor : Colors.grey[600],
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? buttonColor : Colors.grey[700],
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class BulkActionsBar extends StatelessWidget {
  final int selectedCount;
  final VoidCallback onClearSelection;
  final VoidCallback? onBulkDelete;
  final VoidCallback? onBulkActivate;
  final VoidCallback? onBulkDeactivate;
  final VoidCallback? onBulkExport;

  const BulkActionsBar({
    super.key,
    required this.selectedCount,
    required this.onClearSelection,
    this.onBulkDelete,
    this.onBulkActivate,
    this.onBulkDeactivate,
    this.onBulkExport,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).primaryColor.withOpacity(0.1),
        border: Border(
          bottom: BorderSide(color: Theme.of(context).primaryColor.withOpacity(0.2)),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.check_circle,
            color: Theme.of(context).primaryColor,
            size: 20,
          ),
          const SizedBox(width: 12),
          Text(
            '$selectedCount cliente(s) selecionado(s)',
            style: TextStyle(
              color: Theme.of(context).primaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          const Spacer(),
          
          // Ações rápidas
          IconButton(
            onPressed: onBulkActivate,
            icon: const Icon(Icons.check_circle_outline),
            tooltip: 'Ativar Selecionados',
            color: Colors.green[600],
          ),
          IconButton(
            onPressed: onBulkDeactivate,
            icon: const Icon(Icons.cancel_outlined),
            tooltip: 'Desativar Selecionados',
            color: Colors.orange[600],
          ),
          IconButton(
            onPressed: onBulkExport,
            icon: const Icon(Icons.file_download),
            tooltip: 'Exportar Selecionados',
            color: Colors.blue[600],
          ),
          IconButton(
            onPressed: onBulkDelete,
            icon: const Icon(Icons.delete_outline),
            tooltip: 'Excluir Selecionados',
            color: Colors.red[600],
          ),
          const SizedBox(width: 8),
          IconButton(
            onPressed: onClearSelection,
            icon: const Icon(Icons.close),
            tooltip: 'Limpar Seleção',
          ),
        ],
      ),
    );
  }
}