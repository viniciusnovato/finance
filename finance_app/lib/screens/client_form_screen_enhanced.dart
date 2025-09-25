import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../models/client.dart';
import '../utils/validators.dart';

class ClientFormScreenEnhanced extends StatefulWidget {
  final Client? client;

  const ClientFormScreenEnhanced({super.key, this.client});

  @override
  State<ClientFormScreenEnhanced> createState() => _ClientFormScreenEnhancedState();
}

class _ClientFormScreenEnhancedState extends State<ClientFormScreenEnhanced> {
  final _formKey = GlobalKey<FormState>();
  final _scrollController = ScrollController();
  
  // Controllers para os campos
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _taxIdController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _zipCodeController = TextEditingController();
  final _notesController = TextEditingController();

  // Estado do formulário
  DateTime? _birthDate;
  String _country = 'Portugal';
  AttentionLevel _attentionLevel = AttentionLevel.normal;
  bool _isActive = true;
  bool _isLoading = false;
  bool _hasUnsavedChanges = false;

  // Controle de seções expandidas
  bool _personalInfoExpanded = true;
  bool _contactInfoExpanded = true;
  bool _addressInfoExpanded = false;
  bool _additionalInfoExpanded = false;

  @override
  void initState() {
    super.initState();
    if (widget.client != null) {
      _populateFields();
    }
    _addListeners();
  }

  void _addListeners() {
    final controllers = [
      _firstNameController, _lastNameController, _emailController,
      _phoneController, _taxIdController, _addressController,
      _cityController, _stateController, _zipCodeController, _notesController
    ];
    
    for (final controller in controllers) {
      controller.addListener(() {
        if (!_hasUnsavedChanges) {
          setState(() {
            _hasUnsavedChanges = true;
          });
        }
      });
    }
  }

  void _populateFields() {
    final client = widget.client!;
    _firstNameController.text = client.firstName;
    _lastNameController.text = client.lastName;
    _emailController.text = client.email ?? '';
    _phoneController.text = client.phone ?? '';
    _taxIdController.text = client.taxId ?? '';
    _addressController.text = client.address ?? '';
    _cityController.text = client.city ?? '';
    _stateController.text = client.state ?? '';
    _zipCodeController.text = client.postalCode ?? '';
    _notesController.text = client.notes ?? '';
    _birthDate = client.birthDate;
    _country = client.country;
    _attentionLevel = client.attentionLevel;
    _isActive = client.isActive;
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _taxIdController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _zipCodeController.dispose();
    _notesController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    if (!_hasUnsavedChanges) return true;
    
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Alterações não salvas'),
        content: const Text('Você tem alterações não salvas. Deseja sair sem salvar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Sair sem salvar'),
          ),
        ],
      ),
    );
    
    return result ?? false;
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: Colors.grey[50],
        appBar: AppBar(
          title: Text(
            widget.client == null ? 'Novo Cliente' : 'Editar Cliente',
            style: const TextStyle(fontWeight: FontWeight.bold),
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
            if (_hasUnsavedChanges)
              Container(
                margin: const EdgeInsets.only(right: 8),
                child: const Icon(
                  Icons.circle,
                  color: Colors.orange,
                  size: 12,
                ),
              ),
            TextButton(
              onPressed: _isLoading ? null : _saveClient,
              child: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Salvar'),
            ),
          ],
        ),
        body: Form(
          key: _formKey,
          child: SingleChildScrollView(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Informações Pessoais
                _buildExpandableSection(
                  title: 'Informações Pessoais',
                  icon: Icons.person,
                  isExpanded: _personalInfoExpanded,
                  onToggle: () => setState(() => _personalInfoExpanded = !_personalInfoExpanded),
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _firstNameController,
                            label: 'Nome *',
                            validator: Validators.required,
                            textCapitalization: TextCapitalization.words,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _lastNameController,
                            label: 'Sobrenome *',
                            validator: Validators.required,
                            textCapitalization: TextCapitalization.words,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _taxIdController,
                            label: 'NIF/Documento de Identificação',
                            validator: Validators.taxId,
                            inputFormatters: [
                              FilteringTextInputFormatter.allow(RegExp(r'[0-9A-Za-z]')),
                              LengthLimitingTextInputFormatter(20),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildDateField(),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Informações de Contato
                _buildExpandableSection(
                  title: 'Informações de Contato',
                  icon: Icons.contact_phone,
                  isExpanded: _contactInfoExpanded,
                  onToggle: () => setState(() => _contactInfoExpanded = !_contactInfoExpanded),
                  children: [
                    _buildTextField(
                      controller: _emailController,
                      label: 'Email',
                      validator: Validators.email,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _phoneController,
                      label: 'Telefone',
                      validator: Validators.phone,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [
                        FilteringTextInputFormatter.digitsOnly,
                        LengthLimitingTextInputFormatter(11),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Endereço
                _buildExpandableSection(
                  title: 'Endereço',
                  icon: Icons.location_on,
                  isExpanded: _addressInfoExpanded,
                  onToggle: () => setState(() => _addressInfoExpanded = !_addressInfoExpanded),
                  children: [
                    _buildTextField(
                      controller: _addressController,
                      label: 'Endereço',
                      textCapitalization: TextCapitalization.words,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: _buildTextField(
                            controller: _cityController,
                            label: 'Cidade',
                            textCapitalization: TextCapitalization.words,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildTextField(
                            controller: _stateController,
                            label: 'Estado',
                            textCapitalization: TextCapitalization.characters,
                            inputFormatters: [
                              LengthLimitingTextInputFormatter(2),
                              FilteringTextInputFormatter.allow(RegExp(r'[A-Za-z]')),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildTextField(
                            controller: _zipCodeController,
                            label: 'CEP',
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(8),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildCountryField(),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Informações Adicionais
                _buildExpandableSection(
                  title: 'Informações Adicionais',
                  icon: Icons.info,
                  isExpanded: _additionalInfoExpanded,
                  onToggle: () => setState(() => _additionalInfoExpanded = !_additionalInfoExpanded),
                  children: [
                    _buildAttentionLevelField(),
                    const SizedBox(height: 16),
                    _buildActiveStatusField(),
                    const SizedBox(height: 16),
                    _buildTextField(
                      controller: _notesController,
                      label: 'Observações',
                      maxLines: 4,
                      textCapitalization: TextCapitalization.sentences,
                    ),
                  ],
                ),

                const SizedBox(height: 32),

                // Botões de ação
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Cancelar'),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _saveClient,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Theme.of(context).primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : Text(widget.client == null ? 'Criar Cliente' : 'Salvar Alterações'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildExpandableSection({
    required String title,
    required IconData icon,
    required bool isExpanded,
    required VoidCallback onToggle,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: onToggle,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(icon, color: Theme.of(context).primaryColor),
                  const SizedBox(width: 12),
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey[600],
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: children,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    int maxLines = 1,
    TextCapitalization textCapitalization = TextCapitalization.none,
  }) {
    return TextFormField(
      controller: controller,
      validator: validator,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      maxLines: maxLines,
      textCapitalization: textCapitalization,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Theme.of(context).primaryColor),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.red),
        ),
        filled: true,
        fillColor: Colors.white,
      ),
    );
  }

  Widget _buildDateField() {
    return InkWell(
      onTap: _selectBirthDate,
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: 'Data de Nascimento',
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
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
          fillColor: Colors.white,
          suffixIcon: const Icon(Icons.calendar_today),
        ),
        child: Text(
          _birthDate != null
              ? '${_birthDate!.day.toString().padLeft(2, '0')}/${_birthDate!.month.toString().padLeft(2, '0')}/${_birthDate!.year}'
              : 'Selecionar data',
          style: TextStyle(
            color: _birthDate != null ? Colors.black87 : Colors.grey[600],
          ),
        ),
      ),
    );
  }

  Widget _buildCountryField() {
    return DropdownButtonFormField<String>(
      value: _country,
      decoration: InputDecoration(
        labelText: 'País',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
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
        fillColor: Colors.white,
      ),
      items: const [
        DropdownMenuItem(value: 'Portugal', child: Text('Portugal')),
        DropdownMenuItem(value: 'Brasil', child: Text('Brasil')),
        DropdownMenuItem(value: 'Argentina', child: Text('Argentina')),
        DropdownMenuItem(value: 'Chile', child: Text('Chile')),
        DropdownMenuItem(value: 'Uruguai', child: Text('Uruguai')),
        DropdownMenuItem(value: 'Paraguai', child: Text('Paraguai')),
        DropdownMenuItem(value: 'Outro', child: Text('Outro')),
      ],
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _country = value;
            _hasUnsavedChanges = true;
          });
        }
      },
    );
  }

  Widget _buildAttentionLevelField() {
    return DropdownButtonFormField<AttentionLevel>(
      value: _attentionLevel,
      decoration: InputDecoration(
        labelText: 'Nível de Atenção',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
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
        fillColor: Colors.white,
      ),
      items: AttentionLevel.values.map((level) {
        return DropdownMenuItem(
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
        );
      }).toList(),
      onChanged: (value) {
        if (value != null) {
          setState(() {
            _attentionLevel = value;
            _hasUnsavedChanges = true;
          });
        }
      },
    );
  }

  Widget _buildActiveStatusField() {
    return SwitchListTile(
      title: const Text('Cliente Ativo'),
      subtitle: Text(_isActive ? 'Cliente está ativo no sistema' : 'Cliente está inativo'),
      value: _isActive,
      onChanged: (value) {
        setState(() {
          _isActive = value;
          _hasUnsavedChanges = true;
        });
      },
      contentPadding: EdgeInsets.zero,
    );
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

  Future<void> _selectBirthDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _birthDate ?? DateTime.now().subtract(const Duration(days: 365 * 30)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
      locale: const Locale('pt', 'BR'),
    );

    if (date != null) {
      setState(() {
        _birthDate = date;
        _hasUnsavedChanges = true;
      });
    }
  }

  Future<void> _saveClient() async {
    if (!_formKey.currentState!.validate()) {
      // Scroll para o primeiro erro
      await Future.delayed(const Duration(milliseconds: 100));
      final renderBox = _formKey.currentContext?.findRenderObject() as RenderBox?;
      if (renderBox != null) {
        _scrollController.animateTo(
          0,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
        );
      }
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final client = Client(
        id: widget.client?.id ?? '',
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        mobile: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        taxId: _taxIdController.text.trim().isEmpty ? null : _taxIdController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        city: _cityController.text.trim().isEmpty ? null : _cityController.text.trim(),
        state: _stateController.text.trim().isEmpty ? null : _stateController.text.trim(),
        postalCode: _zipCodeController.text.trim().isEmpty ? null : _zipCodeController.text.trim(),
        country: _country,
        birthDate: _birthDate,
        attentionLevel: _attentionLevel,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        status: _isActive ? 'active' : 'inactive',
        isActive: _isActive,
        createdAt: widget.client?.createdAt ?? DateTime.now(),
        updatedAt: DateTime.now(),
      );

      if (widget.client == null) {
        await context.read<AppProvider>().createClient(client);
      } else {
        await context.read<AppProvider>().updateClient(client);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.client == null
                  ? 'Cliente criado com sucesso!'
                  : 'Cliente atualizado com sucesso!',
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao salvar cliente: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }
}