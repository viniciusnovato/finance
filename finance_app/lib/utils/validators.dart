class Validators {
  static String? required(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Este campo é obrigatório';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Campo opcional
    }
    
    // RFC 5322 compliant email regex - more permissive and accurate
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9.!#$%&*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$'
    );
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Digite um email válido';
    }
    return null;
  }

  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Campo opcional
    }
    
    final phoneRegex = RegExp(r'^\d{10,11}$');
    if (!phoneRegex.hasMatch(value.replaceAll(RegExp(r'[^\d]'), ''))) {
      return 'Digite um telefone válido (10 ou 11 dígitos)';
    }
    return null;
  }

  static String? taxId(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Campo opcional
    }
    
    final cleanValue = value.trim();
    
    // Validação básica para NIF português (9 dígitos) ou documento internacional
    if (cleanValue.length < 3 || cleanValue.length > 20) {
      return 'Documento deve ter entre 3 e 20 caracteres';
    }
    
    // Verifica se contém apenas números e letras
    final validChars = RegExp(r'^[0-9A-Za-z]+$');
    if (!validChars.hasMatch(cleanValue)) {
      return 'Documento deve conter apenas números e letras';
    }
    
    return null;
  }

  static String? _validateCPF(String cpf) {
    // Verifica se todos os dígitos são iguais
    if (RegExp(r'^(\d)\1*$').hasMatch(cpf)) {
      return 'CPF inválido';
    }

    // Calcula o primeiro dígito verificador
    int sum = 0;
    for (int i = 0; i < 9; i++) {
      sum += int.parse(cpf[i]) * (10 - i);
    }
    int firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) firstDigit = 0;

    // Calcula o segundo dígito verificador
    sum = 0;
    for (int i = 0; i < 10; i++) {
      sum += int.parse(cpf[i]) * (11 - i);
    }
    int secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) secondDigit = 0;

    // Verifica se os dígitos calculados conferem com os informados
    if (int.parse(cpf[9]) != firstDigit || int.parse(cpf[10]) != secondDigit) {
      return 'CPF inválido';
    }

    return null;
  }

  static String? _validateCNPJ(String cnpj) {
    // Verifica se todos os dígitos são iguais
    if (RegExp(r'^(\d)\1*$').hasMatch(cnpj)) {
      return 'CNPJ inválido';
    }

    // Calcula o primeiro dígito verificador
    List<int> weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    int sum = 0;
    for (int i = 0; i < 12; i++) {
      sum += int.parse(cnpj[i]) * weights1[i];
    }
    int firstDigit = sum % 11;
    firstDigit = firstDigit < 2 ? 0 : 11 - firstDigit;

    // Calcula o segundo dígito verificador
    List<int> weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (int i = 0; i < 13; i++) {
      sum += int.parse(cnpj[i]) * weights2[i];
    }
    int secondDigit = sum % 11;
    secondDigit = secondDigit < 2 ? 0 : 11 - secondDigit;

    // Verifica se os dígitos calculados conferem com os informados
    if (int.parse(cnpj[12]) != firstDigit || int.parse(cnpj[13]) != secondDigit) {
      return 'CNPJ inválido';
    }

    return null;
  }

  static String? Function(String?) minLength(int minLength) {
    return (String? value) {
      if (value == null || value.trim().isEmpty) {
        return null; // Campo opcional
      }
      
      if (value.trim().length < minLength) {
        return 'Deve ter pelo menos $minLength caracteres';
      }
      return null;
    };
  }

  static String? Function(String?) maxLength(int maxLength) {
    return (String? value) {
      if (value == null || value.trim().isEmpty) {
        return null; // Campo opcional
      }
      
      if (value.trim().length > maxLength) {
        return 'Deve ter no máximo $maxLength caracteres';
      }
      return null;
    };
  }

  static String? numeric(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Campo opcional
    }
    
    if (double.tryParse(value.trim()) == null) {
      return 'Digite apenas números';
    }
    return null;
  }

  static String? positiveNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Campo opcional
    }
    
    final number = double.tryParse(value.trim());
    if (number == null) {
      return 'Digite um número válido';
    }
    
    if (number <= 0) {
      return 'Digite um número positivo';
    }
    
    return null;
  }
}