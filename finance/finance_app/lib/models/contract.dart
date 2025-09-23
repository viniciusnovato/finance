import 'client.dart';

class Contract {
  final String id;
  final String? contractNumber;
  final String clientId;
  final Client? client;
  final String treatmentDescription;
  final double totalAmount;
  final double downPayment;
  final int installments;
  final double installmentAmount;
  final ContractStatus status;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? legalValidationDate;
  final String? legalValidatedBy;
  final String? notes;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;
  final PaymentInfo? paymentInfo;

  const Contract({
    required this.id,
    this.contractNumber,
    required this.clientId,
    this.client,
    required this.treatmentDescription,
    required this.totalAmount,
    required this.downPayment,
    required this.installments,
    required this.installmentAmount,
    required this.status,
    this.startDate,
    this.endDate,
    this.legalValidationDate,
    this.legalValidatedBy,
    this.notes,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,
    this.paymentInfo,
  });

  // Getters para cálculos básicos
  bool get isOverdue => status == ContractStatus.defaulting;
  bool get isCompleted => status == ContractStatus.paidOff;

  bool get isDownPaymentValid => downPayment >= (totalAmount * 0.30);
  bool get isInstallmentsValid => installments >= 1 && installments <= 24;

  static DateTime _parseDate(String dateStr) {
    try {
      // Tenta primeiro o formato ISO (YYYY-MM-DD)
      return DateTime.parse(dateStr);
    } catch (e) {
      try {
        // Se falhar, tenta o formato brasileiro (DD/MM/YYYY)
        final parts = dateStr.split('/');
        if (parts.length == 3) {
          final day = int.parse(parts[0]);
          final month = int.parse(parts[1]);
          final year = int.parse(parts[2]);
          return DateTime(year, month, day);
        }
      } catch (e2) {
        // Se ambos falharem, retorna data atual
        print('Erro ao fazer parse da data: $dateStr - $e2');
      }
    }
    return DateTime.now();
  }

  factory Contract.fromJson(Map<String, dynamic> json) {
    return Contract(
      id: json['id']?.toString() ?? '',
      contractNumber: json['contract_number']?.toString() ?? json['id']?.toString()?.substring(0, 8) ?? 'N/A',
      clientId: json['client_id']?.toString() ?? '',
      client: json['client'] != null ? Client.fromJson(json['client']) : null,
      treatmentDescription: json['description']?.toString() ?? json['treatment_description']?.toString() ?? '',
      totalAmount: (json['value'] ?? json['total_amount'] ?? 0).toDouble(),
      downPayment: (json['down_payment'] ?? 0).toDouble(),
      installments: json['number_of_payments'] ?? 1,
      installmentAmount: (json['value'] ?? json['total_amount'] ?? 0).toDouble(),
      status: _parseStatus(json['status']?.toString() ?? 'active'),
      startDate: json['start_date'] != null ? DateTime.parse(json['start_date']) : null,
      endDate: json['end_date'] != null ? DateTime.parse(json['end_date']) : null,
      legalValidationDate: json['legal_validation_date'] != null 
          ? DateTime.parse(json['legal_validation_date']) 
          : null,
      legalValidatedBy: json['legal_validated_by']?.toString(),
      notes: json['notes']?.toString() ?? '',
      createdBy: json['created_by']?.toString() ?? 'system',
      createdAt: json['created_at'] != null ? _parseDate(json['created_at']) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? _parseDate(json['updated_at']) : DateTime.now(),
      paymentInfo: json['payment_info'] != null ? PaymentInfo.fromJson(json['payment_info']) : null,
    );
  }

  static ContractStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return ContractStatus.active;
      case 'completed':
        return ContractStatus.paidOff;
      case 'cancelled':
        return ContractStatus.closed;
      case 'closed':
        return ContractStatus.closed;
      case 'defaulting':
        return ContractStatus.defaulting;
      default:
        return ContractStatus.active;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contract_number': contractNumber,
      'client_id': clientId,
      'treatment_description': treatmentDescription,
      'total_amount': totalAmount,
      'down_payment': downPayment,
      'installments': installments,
      'installment_amount': installmentAmount,
      'status': status.name,
      'start_date': startDate?.toIso8601String().split('T')[0],
      'end_date': endDate?.toIso8601String().split('T')[0],
      'legal_validation_date': legalValidationDate?.toIso8601String(),
      'legal_validated_by': legalValidatedBy,
      'notes': notes,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Contract copyWith({
    String? id,

    String? clientId,

    String? treatmentDescription,
    double? totalAmount,
    double? downPayment,
    int? installments,
    double? installmentAmount,
    ContractStatus? status,
    DateTime? startDate,
    DateTime? endDate,
    DateTime? legalValidationDate,
    String? legalValidatedBy,
    String? notes,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Contract(
      id: id ?? this.id,

      clientId: clientId ?? this.clientId,

      treatmentDescription: treatmentDescription ?? this.treatmentDescription,
      totalAmount: totalAmount ?? this.totalAmount,
      downPayment: downPayment ?? this.downPayment,
      installments: installments ?? this.installments,
      installmentAmount: installmentAmount ?? this.installmentAmount,
      status: status ?? this.status,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      legalValidationDate: legalValidationDate ?? this.legalValidationDate,
      legalValidatedBy: legalValidatedBy ?? this.legalValidatedBy,
      notes: notes ?? this.notes,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

enum ContractStatus {
  draft,
  validated,
  active,
  defaulting,
  paidOff,
  closed;

  String get displayName {
    switch (this) {
      case ContractStatus.draft:
        return 'Rascunho';
      case ContractStatus.validated:
        return 'Validado';
      case ContractStatus.active:
        return 'Ativo';
      case ContractStatus.defaulting:
        return 'Inadimplente';
      case ContractStatus.paidOff:
        return 'Quitado';
      case ContractStatus.closed:
        return 'Encerrado';
    }
  }

  String get name {
    switch (this) {
      case ContractStatus.draft:
        return 'draft';
      case ContractStatus.validated:
        return 'validated';
      case ContractStatus.active:
        return 'active';
      case ContractStatus.defaulting:
        return 'defaulting';
      case ContractStatus.paidOff:
        return 'paid_off';
      case ContractStatus.closed:
        return 'closed';
    }
  }
}

class PaymentInfo {
  final double percentagePaid;
  final double totalPaid;
  final double remainingAmount;
  final int paidInstallments;
  final int totalInstallments;

  const PaymentInfo({
    required this.percentagePaid,
    required this.totalPaid,
    required this.remainingAmount,
    required this.paidInstallments,
    required this.totalInstallments,
  });

  factory PaymentInfo.fromJson(Map<String, dynamic> json) {
    return PaymentInfo(
      percentagePaid: (json['percentage_paid'] ?? 0).toDouble(),
      totalPaid: (json['amount_paid'] ?? json['total_paid'] ?? 0).toDouble(),
      remainingAmount: (json['amount_remaining'] ?? json['remaining_amount'] ?? 0).toDouble(),
      paidInstallments: json['paid_installments'] ?? 0,
      totalInstallments: json['total_installments'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'percentage_paid': percentagePaid,
      'total_paid': totalPaid,
      'remaining_amount': remainingAmount,
      'paid_installments': paidInstallments,
      'total_installments': totalInstallments,
    };
  }
}