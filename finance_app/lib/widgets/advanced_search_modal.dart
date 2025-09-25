import 'package:flutter/material.dart';
import '../models/client.dart';

class AdvancedSearchModal extends StatefulWidget {
  final Function(AdvancedSearchCriteria) onSearch;
  final AdvancedSearchCriteria? initialCriteria;

  const AdvancedSearchModal({
    super.key,
    required this.onSearch,
    this.initialCriteria,
  });

  @override
  State<AdvancedSearchModal> createState() => _AdvancedSearchModalState();
}

class _AdvancedSearchModalState extends State<AdvancedSearchModal> {
  final _formKey = GlobalKey<FormState>();
  
  // Controllers
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _taxIdController = TextEditingController();
  final _cityController = TextEditingController();
  final _countryController = TextEditingController();
  
  // Filters
  bool? _isActive;
  DateTimeRange? _createdDateRange;
  DateTimeRange? _birthDateRange;

  @override
  void initState() {
    super.initState();
    _populateFields();
  }

  void _populateFields() {
    if (widget.initialCriteria != null) {
      final criteria = widget.initialCriteria!;
      _nameController.text = criteria.name ?? '';
      _emailController.text = criteria.email ?? '';
      _phoneController.text = criteria.phone ?? '';
      _taxIdController.text = criteria.taxId ?? '';
      _cityController.text = criteria.city ?? '';
      _countryController.text = criteria.country ?? '';
      _isActive = criteria.isActive;
      _createdDateRange = criteria.createdDateRange;
      _birthDateRange = criteria.birthDateRange;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _taxIdController.dispose();
    _cityController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        width: MediaQuery.of(context).size.width > 800 
            ? 800 
            : MediaQuery.of(context).size.width * 0.95,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Cabeçalho
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.search,
                    color: Colors.white,
                    size: 28,
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Text(
                      'Busca Avançada',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),

            // Conteúdo
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Informações Pessoais
                      _buildSectionTitle('Informações Pessoais', Icons.person),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _buildTextField(
                              controller: _nameController,
                              label: 'Nome',
                              hint: 'Digite o nome do cliente',
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildTextField(
                              controller: _taxIdController,
                              label: 'NIF/Documento de Identificação',
                              hint: 'Digite o documento',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      
                      // Data de Nascimento
                      _buildDateRangeField(
                        label: 'Período de Nascimento',
                        dateRange: _birthDateRange,
                        onChanged: (range) => setState(() => _birthDateRange = range),
                      ),
                      
                      const SizedBox(height: 24),

                      // Informações de Contato
                      _buildSectionTitle('Informações de Contato', Icons.contact_phone),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _buildTextField(
                              controller: _emailController,
                              label: 'Email',
                              hint: 'Digite o email',
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildTextField(
                              controller: _phoneController,
                              label: 'Telefone',
                              hint: 'Digite o telefone',
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 24),

                      // Localização
                      _buildSectionTitle('Localização', Icons.location_on),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: _buildTextField(
                              controller: _cityController,
                              label: 'Cidade',
                              hint: 'Digite a cidade',
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _buildTextField(
                              controller: _countryController,
                              label: 'País',
                              hint: 'Digite o país',
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 24),

                      // Status e Configurações
                      _buildSectionTitle('Status e Configurações', Icons.settings),
                      const SizedBox(height: 16),
                      
                      Row(
                        children: [
                          Expanded(
                            child: _buildDropdownField<bool>(
                              label: 'Status',
                              value: _isActive,
                              items: const [
                                DropdownMenuItem(value: true, child: Text('Ativo')),
                                DropdownMenuItem(value: false, child: Text('Inativo')),
                              ],
                              onChanged: (value) => setState(() => _isActive = value),
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Data de Criação
                      _buildDateRangeField(
                        label: 'Período de Criação',
                        dateRange: _createdDateRange,
                        onChanged: (range) => setState(() => _createdDateRange = range),
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // Botões de ação
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(16)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: _clearFilters,
                      icon: const Icon(Icons.clear_all),
                      label: const Text('Limpar Filtros'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _performSearch,
                      icon: const Icon(Icons.search),
                      label: const Text('Buscar'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Theme.of(context).primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Theme.of(context).primaryColor),
        ),
      ),
    );
  }

  Widget _buildDropdownField<T>({
    required String label,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Theme.of(context).primaryColor),
        ),
      ),
      items: items,
      onChanged: onChanged,
    );
  }

  Widget _buildDateRangeField({
    required String label,
    required DateTimeRange? dateRange,
    required ValueChanged<DateTimeRange?> onChanged,
  }) {
    return InkWell(
      onTap: () => _selectDateRange(dateRange, onChanged),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(Icons.date_range, color: Colors.grey[600]),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dateRange != null
                        ? '${_formatDate(dateRange.start)} - ${_formatDate(dateRange.end)}'
                        : 'Selecionar período',
                    style: TextStyle(
                      fontSize: 16,
                      color: dateRange != null ? Colors.black87 : Colors.grey[500],
                    ),
                  ),
                ],
              ),
            ),
            if (dateRange != null)
              IconButton(
                icon: const Icon(Icons.clear, size: 20),
                onPressed: () => onChanged(null),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _selectDateRange(DateTimeRange? currentRange, ValueChanged<DateTimeRange?> onChanged) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      initialDateRange: currentRange,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
              primary: Theme.of(context).primaryColor,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      onChanged(picked);
    }
  }

  void _clearFilters() {
    setState(() {
      _nameController.clear();
      _emailController.clear();
      _phoneController.clear();
      _taxIdController.clear();
      _cityController.clear();
      _countryController.clear();
      
      _isActive = null;
      _createdDateRange = null;
      _birthDateRange = null;
    });
  }

  void _performSearch() {
    final criteria = AdvancedSearchCriteria(
      name: _nameController.text.trim().isEmpty ? null : _nameController.text.trim(),
      email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
      phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
      taxId: _taxIdController.text.trim().isEmpty ? null : _taxIdController.text.trim(),
      city: _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
      country: _countryController.text.trim().isEmpty ? null : _countryController.text.trim(),
      isActive: _isActive,
      createdDateRange: _createdDateRange,
      birthDateRange: _birthDateRange,
    );

    widget.onSearch(criteria);
    Navigator.of(context).pop();
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }
}

class AdvancedSearchCriteria {
  final String? name;
  final String? email;
  final String? phone;
  final String? taxId;
  final String? city;
  final String? country;
  final bool? isActive;
  final DateTimeRange? createdDateRange;
  final DateTimeRange? birthDateRange;

  const AdvancedSearchCriteria({
    this.name,
    this.email,
    this.phone,
    this.taxId,
    this.city,
    this.country,
    this.isActive,
    this.createdDateRange,
    this.birthDateRange,
  });

  bool get isEmpty {
    return name == null &&
           email == null &&
           phone == null &&
           taxId == null &&
           city == null &&
           country == null &&
           isActive == null &&
           createdDateRange == null &&
           birthDateRange == null;
  }

  bool matches(Client client) {
    // Nome
    if (name != null && !client.fullName.toLowerCase().contains(name!.toLowerCase())) {
      return false;
    }

    // Email
    if (email != null && (client.email == null || !client.email!.toLowerCase().contains(email!.toLowerCase()))) {
      return false;
    }

    // Telefone
    if (phone != null) {
      final phoneMatch = (client.phone?.contains(phone!) == true) || 
                        (client.mobile?.contains(phone!) == true);
      if (!phoneMatch) return false;
    }

    // CPF/CNPJ
    if (taxId != null && (client.taxId == null || !client.taxId!.contains(taxId!))) {
      return false;
    }

    // Cidade
    if (city != null && (client.city == null || !client.city!.toLowerCase().contains(city!.toLowerCase()))) {
      return false;
    }

    // País
    if (country != null && !client.country.toLowerCase().contains(country!.toLowerCase())) {
      return false;
    }

    // Nível de atenção removido

    // Status ativo
    if (isActive != null && client.isActive != isActive) {
      return false;
    }

    // Data de criação
    if (createdDateRange != null) {
      final createdDate = DateTime(client.createdAt.year, client.createdAt.month, client.createdAt.day);
      final startDate = DateTime(createdDateRange!.start.year, createdDateRange!.start.month, createdDateRange!.start.day);
      final endDate = DateTime(createdDateRange!.end.year, createdDateRange!.end.month, createdDateRange!.end.day);
      
      if (createdDate.isBefore(startDate) || createdDate.isAfter(endDate)) {
        return false;
      }
    }

    // Data de nascimento
    if (birthDateRange != null && client.birthDate != null) {
      final birthDate = DateTime(client.birthDate!.year, client.birthDate!.month, client.birthDate!.day);
      final startDate = DateTime(birthDateRange!.start.year, birthDateRange!.start.month, birthDateRange!.start.day);
      final endDate = DateTime(birthDateRange!.end.year, birthDateRange!.end.month, birthDateRange!.end.day);
      
      if (birthDate.isBefore(startDate) || birthDate.isAfter(endDate)) {
        return false;
      }
    }

    return true;
  }
}