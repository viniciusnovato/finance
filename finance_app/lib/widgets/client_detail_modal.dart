import 'package:flutter/material.dart';
import '../models/client.dart';
import '../screens/client_form_screen_enhanced.dart';

class ClientDetailModal extends StatelessWidget {
  final Client client;

  const ClientDetailModal({super.key, required this.client});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        width: MediaQuery.of(context).size.width > 600 
            ? 600 
            : MediaQuery.of(context).size.width * 0.9,
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
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
                  CircleAvatar(
                    backgroundColor: Colors.white,
                    radius: 30,
                    child: Text(
                      client.fullName.isNotEmpty 
                          ? client.fullName.split(' ').map((n) => n.isNotEmpty ? n[0] : '').take(2).join().toUpperCase()
                          : '??',
                      style: TextStyle(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
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
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getAttentionLevelColor(client.attentionLevel),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(
                            client.attentionLevel.displayName,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status do Cliente
                    _buildStatusSection(),
                    
                    const SizedBox(height: 24),

                    // Informações Pessoais
                    _buildSection(
                      title: 'Informações Pessoais',
                      icon: Icons.person,
                      children: [
                        _buildInfoRow('Nome Completo', client.fullName),
                        if (client.taxId?.isNotEmpty == true)
                          _buildInfoRow('NIF/Documento', _formatTaxId(client.taxId!)),
                        if (client.birthDate != null)
                          _buildInfoRow('Data de Nascimento', _formatDate(client.birthDate!)),
                        _buildInfoRow('País', client.country),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Informações de Contato
                    _buildSection(
                      title: 'Informações de Contato',
                      icon: Icons.contact_phone,
                      children: [
                        if (client.email?.isNotEmpty == true)
                          _buildInfoRow('Email', client.email!, isEmail: true),
                        if (client.phone?.isNotEmpty == true)
                          _buildInfoRow('Telefone', _formatPhone(client.phone!), isPhone: true),
                        if (client.mobile?.isNotEmpty == true)
                          _buildInfoRow('Celular', _formatPhone(client.mobile!), isPhone: true),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Endereço
                    if (_hasAddressInfo()) ...[
                      _buildSection(
                        title: 'Endereço',
                        icon: Icons.location_on,
                        children: [
                          if (client.address?.isNotEmpty == true)
                            _buildInfoRow('Endereço', client.address!),
                          if (client.city?.isNotEmpty == true)
                            _buildInfoRow('Cidade', client.city!),
                          if (client.postalCode?.isNotEmpty == true)
                            _buildInfoRow('CEP', _formatPostalCode(client.postalCode!)),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Observações
                    if (client.notes?.isNotEmpty == true) ...[
                      _buildSection(
                        title: 'Observações',
                        icon: Icons.note,
                        children: [
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.grey[200]!),
                            ),
                            child: Text(
                              client.notes!,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Informações do Sistema
                    _buildSection(
                      title: 'Informações do Sistema',
                      icon: Icons.info,
                      children: [
                        _buildInfoRow('Criado em', _formatDateTime(client.createdAt)),
                        _buildInfoRow('Última atualização', _formatDateTime(client.updatedAt)),
                        _buildInfoRow('ID do Cliente', client.id),
                      ],
                    ),
                  ],
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
                      onPressed: () {
                        Navigator.of(context).pop();
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => ClientFormScreenEnhanced(client: client),
                          ),
                        );
                      },
                      icon: const Icon(Icons.edit),
                      label: const Text('Editar'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close),
                      label: const Text('Fechar'),
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

  Widget _buildStatusSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: client.isActive ? Colors.green[50] : Colors.red[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: client.isActive ? Colors.green[200]! : Colors.red[200]!,
        ),
      ),
      child: Row(
        children: [
          Icon(
            client.isActive ? Icons.check_circle : Icons.cancel,
            color: client.isActive ? Colors.green : Colors.red,
          ),
          const SizedBox(width: 12),
          Text(
            client.isActive ? 'Cliente Ativo' : 'Cliente Inativo',
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: client.isActive ? Colors.green[800] : Colors.red[800],
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: _getAttentionLevelColor(client.attentionLevel),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  client.attentionLevel.displayName,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
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
        ),
        const SizedBox(height: 16),
        ...children,
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, {bool isEmail = false, bool isPhone = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey[600],
              ),
            ),
          ),
          Expanded(
            child: SelectableText(
              value,
              style: const TextStyle(
                fontSize: 14,
                color: Colors.black87,
              ),
            ),
          ),
          if (isEmail) ...[
            const SizedBox(width: 8),
            Icon(Icons.email, size: 16, color: Colors.grey[500]),
          ],
          if (isPhone) ...[
            const SizedBox(width: 8),
            Icon(Icons.phone, size: 16, color: Colors.grey[500]),
          ],
        ],
      ),
    );
  }

  bool _hasAddressInfo() {
    return client.address?.isNotEmpty == true ||
           client.city?.isNotEmpty == true ||
           client.postalCode?.isNotEmpty == true;
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

  String _formatTaxId(String taxId) {
    final digits = taxId.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length == 11) {
      // CPF: 000.000.000-00
      return '${digits.substring(0, 3)}.${digits.substring(3, 6)}.${digits.substring(6, 9)}-${digits.substring(9)}';
    } else if (digits.length == 14) {
      // CNPJ: 00.000.000/0000-00
      return '${digits.substring(0, 2)}.${digits.substring(2, 5)}.${digits.substring(5, 8)}/${digits.substring(8, 12)}-${digits.substring(12)}';
    }
    return taxId;
  }

  String _formatPhone(String phone) {
    final digits = phone.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length == 10) {
      // Telefone fixo: (00) 0000-0000
      return '(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}';
    } else if (digits.length == 11) {
      // Celular: (00) 00000-0000
      return '(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}';
    }
    return phone;
  }

  String _formatPostalCode(String postalCode) {
    final digits = postalCode.replaceAll(RegExp(r'[^\d]'), '');
    if (digits.length == 8) {
      // CEP: 00000-000
      return '${digits.substring(0, 5)}-${digits.substring(5)}';
    }
    return postalCode;
  }

  String _formatDate(DateTime date) {
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  String _formatDateTime(DateTime dateTime) {
    return '${_formatDate(dateTime)} às ${dateTime.hour.toString().padLeft(2, '0')}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}