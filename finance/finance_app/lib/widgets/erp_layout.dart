import 'package:flutter/material.dart';
import '../utils/app_colors.dart';
import 'erp_sidebar.dart';
import 'erp_header.dart';

class ERPLayout extends StatelessWidget {
  final Widget child;
  final String title;
  final List<String> breadcrumbs;
  final int selectedIndex;
  final Function(int) onNavigationChanged;
  
  const ERPLayout({
    super.key,
    required this.child,
    required this.title,
    required this.selectedIndex,
    required this.onNavigationChanged,
    this.breadcrumbs = const [],
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;
    
    if (isMobile) {
      // Layout mobile com drawer
      return Scaffold(
        appBar: ERPHeader(
          title: title,
          breadcrumbs: breadcrumbs,
        ),
        drawer: Drawer(
          child: ERPSidebar(
            selectedIndex: selectedIndex,
            onItemSelected: (index) {
              Navigator.of(context).pop(); // Fecha o drawer
              onNavigationChanged(index);
            },
          ),
        ),
        body: Container(
          color: AppColors.background,
          child: child,
        ),
      );
    }
    
    // Layout desktop com sidebar fixa
    return Scaffold(
      body: Row(
        children: [
          // Sidebar fixa
          ERPSidebar(
            selectedIndex: selectedIndex,
            onItemSelected: onNavigationChanged,
          ),
          
          // Área principal
          Expanded(
            child: Column(
              children: [
                // Header
                ERPHeader(
                  title: title,
                  breadcrumbs: breadcrumbs,
                ),
                
                // Conteúdo
                Expanded(
                  child: Container(
                    color: AppColors.background,
                    child: child,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}