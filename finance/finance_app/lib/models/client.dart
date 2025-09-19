class Client {
  final String id;
  final String firstName;
  final String lastName;
  final String? email;
  final String? phone;
  final String? mobile;
  final String? taxId;
  final DateTime? birthDate;
  final String? address;
  final String? city;
  final String? postalCode;
  final String country;
  final AttentionLevel attentionLevel;
  final String? notes;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Client({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.email,
    this.phone,
    this.mobile,
    this.taxId,
    this.birthDate,
    this.address,
    this.city,
    this.postalCode,
    this.country = 'Portugal',
    this.attentionLevel = AttentionLevel.normal,
    this.notes,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  String get fullName => '$firstName $lastName';

  factory Client.fromJson(Map<String, dynamic> json) {
    return Client(
      id: json['id']?.toString() ?? '',
      firstName: json['first_name']?.toString() ?? '',
      lastName: json['last_name']?.toString() ?? '',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      mobile: json['mobile']?.toString(),
      taxId: json['tax_id']?.toString(),
      birthDate: json['birth_date'] != null 
          ? DateTime.parse(json['birth_date']) 
          : null,
      address: json['address']?.toString(),
      city: json['city']?.toString(),
      postalCode: json['postal_code']?.toString(),
      country: json['country']?.toString() ?? 'Portugal',
      attentionLevel: AttentionLevel.values.firstWhere(
        (e) => e.name == json['attention_level'],
        orElse: () => AttentionLevel.normal,
      ),
      notes: json['notes']?.toString(),
      isActive: json['is_active'] ?? true,
      createdAt: json['created_at'] != null ? DateTime.parse(json['created_at']) : DateTime.now(),
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'phone': phone,
      'mobile': mobile,
      'tax_id': taxId,
      'birth_date': birthDate?.toIso8601String().split('T')[0],
      'address': address,
      'city': city,
      'postal_code': postalCode,
      'country': country,
      'attention_level': attentionLevel.name,
      'notes': notes,
      'is_active': isActive,
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  Client copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? mobile,
    String? taxId,
    DateTime? birthDate,
    String? address,
    String? city,
    String? postalCode,
    String? country,
    AttentionLevel? attentionLevel,
    String? notes,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Client(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      mobile: mobile ?? this.mobile,
      taxId: taxId ?? this.taxId,
      birthDate: birthDate ?? this.birthDate,
      address: address ?? this.address,
      city: city ?? this.city,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
      attentionLevel: attentionLevel ?? this.attentionLevel,
      notes: notes ?? this.notes,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

enum AttentionLevel {
  normal,
  risk,
  lightDelay,
  severeDelay;

  String get displayName {
    switch (this) {
      case AttentionLevel.normal:
        return 'Normal';
      case AttentionLevel.risk:
        return 'Risco';
      case AttentionLevel.lightDelay:
        return 'Atraso Leve';
      case AttentionLevel.severeDelay:
        return 'Atraso Grave';
    }
  }

  String get name {
    switch (this) {
      case AttentionLevel.normal:
        return 'normal';
      case AttentionLevel.risk:
        return 'risk';
      case AttentionLevel.lightDelay:
        return 'light_delay';
      case AttentionLevel.severeDelay:
        return 'severe_delay';
    }
  }
}