import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

class ERPSidebar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemSelected;
  
  const ERPSidebar({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      color: AppColors.sidebarBackground,
      child: Column(
        children: [
          // Header da Sidebar
          Container(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.account_balance,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Instituto Areluna',
                  style: TextStyle(
                    color: AppColors.sidebarText,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Text(
                  'Gestão Financeira',
                  style: TextStyle(
                    color: AppColors.sidebarTextSecondary,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          
          const Divider(
            color: AppColors.sidebarTextSecondary,
            height: 1,
          ),
          
          // Menu Items
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _buildMenuSection('DASHBOARD', [
                  _MenuItem(
                    icon: Icons.dashboard,
                    title: 'Visão Geral',
                    index: 0,
                  ),
                ]),
                
                _buildMenuSection('GESTÃO', [
                  _MenuItem(
                    icon: Icons.people,
                    title: 'Clientes',
                    index: 1,
                  ),
                  _MenuItem(
                    icon: Icons.description,
                    title: 'Contratos',
                    index: 2,
                  ),
                  _MenuItem(
                    icon: Icons.payment,
                    title: 'Pagamentos',
                    index: 3,
                  ),
                ]),
                
                _buildMenuSection('RELATÓRIOS', [
                  _MenuItem(
                    icon: Icons.analytics,
                    title: 'Análises',
                    index: 4,
                  ),
                  _MenuItem(
                    icon: Icons.assessment,
                    title: 'Relatórios',
                    index: 5,
                  ),
                ]),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMenuSection(String title, List<_MenuItem> items) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
          child: Text(
            title,
            style: const TextStyle(
              color: AppColors.sidebarTextSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
              letterSpacing: 1.2,
            ),
          ),
        ),
        ...items.map((item) => _buildMenuItem(item)),
        const SizedBox(height: 8),
      ],
    );
  }
  
  Widget _buildMenuItem(_MenuItem item) {
    final isSelected = selectedIndex == item.index;
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onItemSelected(item.index),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.primary.withOpacity(0.1) : null,
              borderRadius: BorderRadius.circular(8),
              border: isSelected 
                ? Border.all(color: AppColors.primary.withOpacity(0.3))
                : null,
            ),
            child: Row(
              children: [
                Icon(
                  item.icon,
                  color: isSelected 
                    ? AppColors.primary 
                    : AppColors.sidebarTextSecondary,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  item.title,
                  style: TextStyle(
                    color: isSelected 
                      ? AppColors.sidebarText 
                      : AppColors.sidebarTextSecondary,
                    fontSize: 14,
                    fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MenuItem {
  final IconData icon;
  final String title;
  final int index;
  
  _MenuItem({
    required this.icon,
    required this.title,
    required this.index,
  });
}