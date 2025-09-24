class Payment {
  final String id;
  final String contractId;
  final String? contractNumber;
  final String? clientName;
  final int _installmentNumber;
  final double amount;
  final DateTime dueDate;
  final DateTime? paidDate;
  final PaymentMethod? paymentMethod;
  final PaymentStatus status;
  final String? referenceNumber;
  final String? receiptPath;
  final String? notes;
  final String? validatedBy;
  final DateTime? validatedAt;
  final PaymentType? paymentType;
  final String createdBy;
  final DateTime createdAt;
  final DateTime updatedAt;

  int get installmentNumber {
    // Extrair número da parcela do campo notes temporariamente
    if (notes != null && notes!.trim().isNotEmpty) {
      // Primeiro, tentar o padrão [Parcela X]
      if (notes!.contains('[Parcela ')) {
        final match = RegExp(r'\[Parcela (\d+)\]').firstMatch(notes!);
        if (match != null) {
          return int.tryParse(match.group(1)!) ?? _installmentNumber;
        }
      }
      // Se não encontrou o padrão, tentar converter o notes diretamente para número
      final directNumber = int.tryParse(notes!.trim());
      if (directNumber != null) {
        return directNumber;
      }
    }
    return _installmentNumber;
  }

  Payment({
    required this.id,
    required this.contractId,
    this.contractNumber,
    this.clientName,
    required int installmentNumber,
    required this.amount,
    required this.dueDate,
    this.paidDate,
    this.paymentMethod,
    required this.status,
    this.referenceNumber,
    this.receiptPath,
    this.notes,
    this.validatedBy,
    this.validatedAt,
    this.paymentType,
    required this.createdBy,
    required this.createdAt,
    required this.updatedAt,

  }) : _installmentNumber = installmentNumber;

  bool get isOverdue => status == PaymentStatus.pending && 
      DateTime.now().isAfter(dueDate);
  
  int get daysOverdue => isOverdue 
      ? DateTime.now().difference(dueDate).inDays 
      : 0;
  
  bool get isPaid => status == PaymentStatus.paid;
  bool get isValidated => validatedBy != null && validatedAt != null;
  
  int get daysUntilDue => dueDate.difference(DateTime.now()).inDays;

  static DateTime _parseDate(String dateStr) {
    print('🔧 [PAYMENT_PARSE] Tentando fazer parse da data: "$dateStr"');
    try {
      // Tenta primeiro o formato ISO (YYYY-MM-DD)
      final result = DateTime.parse(dateStr);
      print('✅ [PAYMENT_PARSE] Sucesso com formato ISO: $result');
      return result;
    } catch (e) {
      print('⚠️ [PAYMENT_PARSE] Falhou formato ISO, tentando brasileiro: $e');
      try {
        // Se falhar, tenta o formato brasileiro (DD/MM/YYYY)
        final parts = dateStr.split('/');
        if (parts.length == 3) {
          final day = int.parse(parts[0]);
          final month = int.parse(parts[1]);
          final year = int.parse(parts[2]);
          final result = DateTime(year, month, day);
          print('✅ [PAYMENT_PARSE] Sucesso com formato brasileiro: $result');
          return result;
        } else {
          print('❌ [PAYMENT_PARSE] Formato brasileiro inválido - partes: $parts');
        }
      } catch (e2) {
        // Se ambos falharem, retorna data atual
        print('❌ [PAYMENT_PARSE] Erro ao fazer parse da data: "$dateStr" - $e2');
      }
    }
    final fallback = DateTime.now();
    print('🔄 [PAYMENT_PARSE] Usando data atual como fallback: $fallback');
    return fallback;
  }

  factory Payment.fromJson(Map<String, dynamic> json) {
    // Extrair dados do contrato e cliente se disponíveis
    String? contractNumber;
    String? clientName;
    
    if (json['contract'] != null) {
      contractNumber = json['contract']['contract_number'];
      if (json['contract']['client'] != null) {
        final client = json['contract']['client'];
        final firstName = client['first_name'] ?? '';
        final lastName = client['last_name'] ?? '';
        clientName = '${firstName.trim()} ${lastName.trim()}'.trim();
        if (clientName!.isEmpty) clientName = null;
      }
    }
    
    return Payment(
      id: json['id'],
      contractId: json['contract_id'],
      contractNumber: contractNumber,
      clientName: clientName,
      installmentNumber: json['installment_number'] ?? 1,
      amount: (json['amount'] as num).toDouble(),
      dueDate: _parseDate(json['due_date']),
      paidDate: json['paid_date'] != null 
          ? _parseDate(json['paid_date']) 
          : null,
      paymentMethod: json['payment_method'] != null
          ? PaymentMethod.values.firstWhere(
              (e) => e.name == json['payment_method'],
              orElse: () => PaymentMethod.cash,
            )
          : null,
      status: PaymentStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => PaymentStatus.pending,
      ),
      referenceNumber: json['reference_number'],
      receiptPath: json['receipt_path'],
      notes: json['notes'],
      validatedBy: json['validated_by'],
      validatedAt: json['validated_at'] != null 
          ? _parseDate(json['validated_at']) 
          : null,
      paymentType: json['payment_type'] != null
          ? PaymentType.values.firstWhere(
              (e) => e.name == json['payment_type'],
              orElse: () => PaymentType.installment,
            )
          : null,
      createdBy: json['created_by'] ?? 'system',
      createdAt: json['created_at'] != null ? _parseDate(json['created_at']) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? _parseDate(json['updated_at']) : DateTime.now(),

    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'contract_id': contractId,
      'installment_number': installmentNumber,
      'amount': amount,
      'due_date': dueDate.toIso8601String().split('T')[0],
      'paid_date': paidDate?.toIso8601String().split('T')[0],
      'payment_method': paymentMethod?.name,
      'status': status.name,
      'reference_number': referenceNumber,
      'receipt_path': receiptPath,
      'notes': notes,
      'validated_by': validatedBy,
      'validated_at': validatedAt?.toIso8601String(),
      'payment_type': paymentType?.name,
      'created_by': createdBy,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Payment copyWith({
    String? id,
    String? contractId,
    String? contractNumber,
    String? clientName,
    int? installmentNumber,
    double? amount,
    DateTime? dueDate,
    DateTime? paidDate,
    PaymentMethod? paymentMethod,
    PaymentStatus? status,
    String? referenceNumber,
    String? receiptPath,
    String? notes,
    String? validatedBy,
    DateTime? validatedAt,
    PaymentType? paymentType,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,

  }) {
    return Payment(
      id: id ?? this.id,
      contractId: contractId ?? this.contractId,
      contractNumber: contractNumber ?? this.contractNumber,
      clientName: clientName ?? this.clientName,
      installmentNumber: installmentNumber ?? this.installmentNumber,
      amount: amount ?? this.amount,
      dueDate: dueDate ?? this.dueDate,
      paidDate: paidDate ?? this.paidDate,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      status: status ?? this.status,
      referenceNumber: referenceNumber ?? this.referenceNumber,
      receiptPath: receiptPath ?? this.receiptPath,
      notes: notes ?? this.notes,
      validatedBy: validatedBy ?? this.validatedBy,
      validatedAt: validatedAt ?? this.validatedAt,
      paymentType: paymentType ?? this.paymentType,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,

    );
  }
}

enum PaymentStatus {
  pending,
  paid,
  overdue,
  failed,
  cancelled;

  String get displayName {
    switch (this) {
      case PaymentStatus.pending:
        return 'Pendente';
      case PaymentStatus.paid:
        return 'Pago';
      case PaymentStatus.overdue:
        return 'Em Atraso';
      case PaymentStatus.failed:
        return 'Falhou';
      case PaymentStatus.cancelled:
        return 'Cancelado';
    }
  }

  String get name {
    switch (this) {
      case PaymentStatus.pending:
        return 'pending';
      case PaymentStatus.paid:
        return 'paid';
      case PaymentStatus.overdue:
        return 'overdue';
      case PaymentStatus.failed:
        return 'failed';
      case PaymentStatus.cancelled:
        return 'cancelled';
    }
  }
}

enum PaymentMethod {
  mbway,
  cash,
  transfer,
  sepa,
  creditCard,
  directDebit,
  paymentOrder;

  String get displayName {
    switch (this) {
      case PaymentMethod.mbway:
        return 'MBWay';
      case PaymentMethod.cash:
        return 'Numerário';
      case PaymentMethod.transfer:
        return 'Transferência';
      case PaymentMethod.sepa:
        return 'SEPA';
      case PaymentMethod.creditCard:
        return 'Cartão de Crédito';
      case PaymentMethod.directDebit:
        return 'Débito Direto';
      case PaymentMethod.paymentOrder:
        return 'Ordem de Pagamento';
    }
  }

  String get name {
    switch (this) {
      case PaymentMethod.mbway:
        return 'mbway';
      case PaymentMethod.cash:
        return 'cash';
      case PaymentMethod.transfer:
        return 'transfer';
      case PaymentMethod.sepa:
        return 'sepa';
      case PaymentMethod.creditCard:
        return 'credit_card';
      case PaymentMethod.directDebit:
        return 'direct_debit';
      case PaymentMethod.paymentOrder:
        return 'payment_order';
    }
  }
}

enum PaymentType {
  downPayment,
  installment,
  finalPayment,
  penalty,
  adjustment;

  String get displayName {
    switch (this) {
      case PaymentType.downPayment:
        return 'Entrada';
      case PaymentType.installment:
        return 'Prestação';
      case PaymentType.finalPayment:
        return 'Pagamento Final';
      case PaymentType.penalty:
        return 'Multa';
      case PaymentType.adjustment:
        return 'Ajuste';
    }
  }

  String get name {
    switch (this) {
      case PaymentType.downPayment:
        return 'downPayment';
      case PaymentType.installment:
        return 'installment';
      case PaymentType.finalPayment:
        return 'finalPayment';
      case PaymentType.penalty:
        return 'penalty';
      case PaymentType.adjustment:
        return 'adjustment';
    }
  }
}