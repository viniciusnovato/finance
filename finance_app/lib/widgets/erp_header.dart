import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../utils/app_colors.dart';

class ERPHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final List<String> breadcrumbs;
  
  const ERPHeader({
    super.key,
    required this.title,
    this.breadcrumbs = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.headerBackground,
        border: Border(
          bottom: BorderSide(
            color: AppColors.divider,
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          child: Row(
            children: [
              // Breadcrumbs e Título
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (breadcrumbs.isNotEmpty) ...[
                      Row(
                        children: [
                          for (int i = 0; i < breadcrumbs.length; i++) ...[
                            Text(
                              breadcrumbs[i],
                              style: TextStyle(
                                color: AppColors.onSurfaceVariant,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (i < breadcrumbs.length - 1)
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 8),
                                child: Icon(
                                  Icons.chevron_right,
                                  size: 16,
                                  color: AppColors.onSurfaceVariant,
                                ),
                              ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                    ],
                    Text(
                      title,
                      style: const TextStyle(
                        color: AppColors.onSurface,
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Ações do Header
              Row(
                children: [
                  // Notificações
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(
                      Icons.notifications_outlined,
                      color: AppColors.onSurfaceVariant,
                    ),
                    tooltip: 'Notificações',
                  ),
                  
                  const SizedBox(width: 8),
                  
                  // Menu do Usuário
                  Consumer<AppProvider>(
                    builder: (context, appProvider, child) {
                      return PopupMenuButton<String>(
                        offset: const Offset(0, 50),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: AppColors.outline,
                              width: 1,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(
                                radius: 16,
                                backgroundColor: AppColors.primary,
                                child: Text(
                                  appProvider.currentUser?.email
                                      ?.substring(0, 1)
                                      .toUpperCase() ?? 'U',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Administrador',
                                    style: TextStyle(
                                      color: AppColors.onSurface,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Text(
                                    appProvider.currentUser?.email ?? 'usuário',
                                    style: TextStyle(
                                      color: AppColors.onSurfaceVariant,
                                      fontSize: 11,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                              const SizedBox(width: 4),
                              const Icon(
                                Icons.keyboard_arrow_down,
                                color: AppColors.onSurfaceVariant,
                                size: 20,
                              ),
                            ],
                          ),
                        ),
                        onSelected: (value) async {
                          if (value == 'logout') {
                            try {
                              await appProvider.logout();
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('Erro ao fazer logout: ${e.toString()}'),
                                    backgroundColor: AppColors.error,
                                  ),
                                );
                              }
                            }
                          }
                        },
                        itemBuilder: (BuildContext context) => [
                          PopupMenuItem<String>(
                            enabled: false,
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 8),
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
                                    'Administrador do Sistema',
                                    style: TextStyle(
                                      color: AppColors.onSurfaceVariant,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Divider(height: 1),
                                ],
                              ),
                            ),
                          ),
                          PopupMenuItem<String>(
                            value: 'profile',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.person_outline,
                                  color: AppColors.onSurfaceVariant,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                const Text('Perfil'),
                              ],
                            ),
                          ),
                          PopupMenuItem<String>(
                            value: 'settings',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.settings_outlined,
                                  color: AppColors.onSurfaceVariant,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                const Text('Configurações'),
                              ],
                            ),
                          ),
                          const PopupMenuDivider(),
                          PopupMenuItem<String>(
                            value: 'logout',
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.logout,
                                  color: AppColors.error,
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Sair',
                                  style: TextStyle(
                                    color: AppColors.error,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(80);
}