import 'package:flutter/material.dart';
import '../utils/app_colors.dart';

class ERPDashboardCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final Color? iconColor;
  final VoidCallback? onTap;
  final String? trend;
  final bool isPositiveTrend;
  
  const ERPDashboardCard({
    super.key,
    required this.title,
    required this.value,
    required this.icon,
    this.subtitle,
    this.iconColor,
    this.onTap,
    this.trend,
    this.isPositiveTrend = true,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: AppColors.outline.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header com ícone e título
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (iconColor ?? AppColors.primary).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      icon,
                      color: iconColor ?? AppColors.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (onTap != null)
                    Icon(
                      Icons.arrow_forward_ios,
                      size: 16,
                      color: AppColors.onSurfaceVariant,
                    ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Valor principal
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: AppColors.onSurface,
                  fontWeight: FontWeight.bold,
                ),
              ),
              
              // Subtitle e trend
              if (subtitle != null || trend != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (subtitle != null)
                      Expanded(
                        child: Text(
                          subtitle!,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: AppColors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    if (trend != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isPositiveTrend 
                              ? AppColors.statusActive.withOpacity(0.1)
                              : AppColors.statusOverdue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isPositiveTrend 
                                  ? Icons.trending_up 
                                  : Icons.trending_down,
                              size: 14,
                              color: isPositiveTrend 
                                  ? AppColors.statusActive 
                                  : AppColors.statusOverdue,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              trend!,
                              style: TextStyle(
                                color: isPositiveTrend 
                                    ? AppColors.statusActive 
                                    : AppColors.statusOverdue,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
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
}

// Widget para métricas em grid
class ERPMetricsGrid extends StatelessWidget {
  final List<ERPDashboardCard> cards;
  final int crossAxisCount;
  
  const ERPMetricsGrid({
    super.key,
    required this.cards,
    this.crossAxisCount = 4,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    int columns = crossAxisCount;
    
    // Responsividade
    if (screenWidth < 600) {
      columns = 1;
    } else if (screenWidth < 900) {
      columns = 2;
    } else if (screenWidth < 1200) {
      columns = 3;
    }
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: columns,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.5,
      ),
      itemCount: cards.length,
      itemBuilder: (context, index) => cards[index],
    );
  }
}