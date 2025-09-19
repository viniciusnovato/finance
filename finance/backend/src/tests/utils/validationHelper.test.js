/**
 * Testes unitários para ValidationHelper
 * Testa todas as validações e sanitizações implementadas
 */

const { ValidationHelper } = require('../../utils/validationHelper');

describe('ValidationHelper', () => {
  describe('isValidEmail', () => {
    test('should return true for valid emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(ValidationHelper.isValidEmail(email)).toBe(true);
      });
    });

    test('should return false for invalid emails', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(ValidationHelper.isValidEmail(email)).toBe(false);
      });
    });
  });

  describe('isValidPhone', () => {
    test('should return true for valid Brazilian phone numbers', () => {
      const validPhones = [
        '11999999999',
        '(11) 99999-9999',
        '+55 11 99999-9999',
        '11 99999-9999',
        '1133334444'
      ];

      validPhones.forEach(phone => {
        expect(ValidationHelper.isValidPhone(phone)).toBe(true);
      });
    });

    test('should return false for invalid phone numbers', () => {
      const invalidPhones = [
        '123',
        '11999999',
        'abc123456789',
        '',
        null,
        undefined
      ];

      invalidPhones.forEach(phone => {
        expect(ValidationHelper.isValidPhone(phone)).toBe(false);
      });
    });
  });

  describe('isValidCPF', () => {
    test('should return true for valid CPF', () => {
      const validCPFs = [
        '11144477735',
        '111.444.777-35',
        '12345678909'
      ];

      validCPFs.forEach(cpf => {
        expect(ValidationHelper.isValidCPF(cpf)).toBe(true);
      });
    });

    test('should return false for invalid CPF', () => {
      const invalidCPFs = [
        '11111111111', // Sequência repetida
        '123.456.789-00', // Dígitos verificadores incorretos
        '123456789', // Muito curto
        '12345678901234', // Muito longo
        'abc.def.ghi-jk', // Não numérico
        '',
        null,
        undefined
      ];

      invalidCPFs.forEach(cpf => {
        expect(ValidationHelper.isValidCPF(cpf)).toBe(false);
      });
    });
  });

  describe('isValidCNPJ', () => {
    test('should return true for valid CNPJ', () => {
      const validCNPJs = [
        '11222333000181',
        '11.222.333/0001-81'
      ];

      validCNPJs.forEach(cnpj => {
        expect(ValidationHelper.isValidCNPJ(cnpj)).toBe(true);
      });
    });

    test('should return false for invalid CNPJ', () => {
      const invalidCNPJs = [
        '11111111111111', // Sequência repetida
        '11.222.333/0001-00', // Dígitos verificadores incorretos
        '1122233300018', // Muito curto
        '112223330001811', // Muito longo
        'ab.cde.fgh/ijkl-mn', // Não numérico
        '',
        null,
        undefined
      ];

      invalidCNPJs.forEach(cnpj => {
        expect(ValidationHelper.isValidCNPJ(cnpj)).toBe(false);
      });
    });
  });

  describe('isValidDate', () => {
    test('should return true for valid dates', () => {
      const validDates = [
        '2023-12-25',
        '1990-01-01',
        '2000-02-29' // Ano bissexto
      ];

      validDates.forEach(date => {
        expect(ValidationHelper.isValidDate(date)).toBe(true);
      });
    });

    test('should return false for invalid dates', () => {
      const invalidDates = [
        '2023-13-01', // Mês inválido
        '2023-02-30', // Dia inválido
        '2021-02-29', // Não é ano bissexto
        '25/12/2023', // Formato incorreto
        'invalid-date',
        '',
        null,
        undefined
      ];

      invalidDates.forEach(date => {
        expect(ValidationHelper.isValidDate(date)).toBe(false);
      });
    });
  });

  describe('isValidMonetaryValue', () => {
    test('should return true for valid monetary values', () => {
      const validValues = [
        100.50,
        0,
        1000000,
        0.01,
        999999.99
      ];

      validValues.forEach(value => {
        expect(ValidationHelper.isValidMonetaryValue(value)).toBe(true);
      });
    });

    test('should return false for invalid monetary values', () => {
      const invalidValues = [
        -100, // Negativo
        'abc', // Não numérico
        null,
        undefined,
        NaN,
        Infinity
      ];

      invalidValues.forEach(value => {
        expect(ValidationHelper.isValidMonetaryValue(value)).toBe(false);
      });
    });
  });

  describe('isValidString', () => {
    test('should return true for valid strings', () => {
      const validStrings = [
        'João Silva',
        'Test',
        'A', // Mínimo 1 caractere
        'A'.repeat(255) // Máximo 255 caracteres
      ];

      validStrings.forEach(str => {
        expect(ValidationHelper.isValidString(str)).toBe(true);
      });
    });

    test('should return false for invalid strings', () => {
      const invalidStrings = [
        '', // Vazio
        '   ', // Apenas espaços
        'A'.repeat(256), // Muito longo
        null,
        undefined,
        123 // Não é string
      ];

      invalidStrings.forEach(str => {
        expect(ValidationHelper.isValidString(str)).toBe(false);
      });
    });

    test('should respect custom min and max length', () => {
      expect(ValidationHelper.isValidString('AB', 3, 10)).toBe(false); // Muito curto
      expect(ValidationHelper.isValidString('ABC', 3, 10)).toBe(true); // Válido
      expect(ValidationHelper.isValidString('A'.repeat(11), 3, 10)).toBe(false); // Muito longo
    });
  });

  describe('isValidUUID', () => {
    test('should return true for valid UUIDs', () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];

      validUUIDs.forEach(uuid => {
        expect(ValidationHelper.isValidUUID(uuid)).toBe(true);
      });
    });

    test('should return false for invalid UUIDs', () => {
      const invalidUUIDs = [
        '123e4567-e89b-12d3-a456', // Muito curto
        '123e4567-e89b-12d3-a456-426614174000-extra', // Muito longo
        'not-a-uuid',
        '',
        null,
        undefined
      ];

      invalidUUIDs.forEach(uuid => {
        expect(ValidationHelper.isValidUUID(uuid)).toBe(false);
      });
    });
  });

  describe('sanitizeString', () => {
    test('should trim whitespace and normalize', () => {
      expect(ValidationHelper.sanitizeString('  João Silva  ')).toBe('João Silva');
      expect(ValidationHelper.sanitizeString('\tTest\n')).toBe('Test');
    });

    test('should handle empty and null values', () => {
      expect(ValidationHelper.sanitizeString('')).toBe('');
      expect(ValidationHelper.sanitizeString(null)).toBe('');
      expect(ValidationHelper.sanitizeString(undefined)).toBe('');
    });

    test('should convert to string if needed', () => {
      expect(ValidationHelper.sanitizeString(123)).toBe('123');
    });
  });

  describe('normalizePhone', () => {
    test('should remove all non-numeric characters', () => {
      expect(ValidationHelper.normalizePhone('(11) 99999-9999')).toBe('11999999999');
      expect(ValidationHelper.normalizePhone('+55 11 99999-9999')).toBe('5511999999999');
      expect(ValidationHelper.normalizePhone('11 99999-9999')).toBe('11999999999');
    });

    test('should handle empty and null values', () => {
      expect(ValidationHelper.normalizePhone('')).toBe('');
      expect(ValidationHelper.normalizePhone(null)).toBe('');
      expect(ValidationHelper.normalizePhone(undefined)).toBe('');
    });
  });

  describe('normalizeTaxId', () => {
    test('should remove all non-numeric characters', () => {
      expect(ValidationHelper.normalizeTaxId('123.456.789-01')).toBe('12345678901');
      expect(ValidationHelper.normalizeTaxId('11.222.333/0001-81')).toBe('11222333000181');
    });

    test('should handle empty and null values', () => {
      expect(ValidationHelper.normalizeTaxId('')).toBe('');
      expect(ValidationHelper.normalizeTaxId(null)).toBe('');
      expect(ValidationHelper.normalizeTaxId(undefined)).toBe('');
    });
  });

  describe('validateRequiredFields', () => {
    test('should return empty array for valid object', () => {
      const data = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999'
      };
      const requiredFields = ['name', 'email', 'phone'];
      
      const errors = ValidationHelper.validateRequiredFields(data, requiredFields);
      expect(errors).toEqual([]);
    });

    test('should return errors for missing fields', () => {
      const data = {
        name: 'João Silva',
        email: '' // Campo vazio
        // phone ausente
      };
      const requiredFields = ['name', 'email', 'phone'];
      
      const errors = ValidationHelper.validateRequiredFields(data, requiredFields);
      expect(errors).toHaveLength(2);
      expect(errors).toContainEqual({ field: 'email', message: 'Campo obrigatório' });
      expect(errors).toContainEqual({ field: 'phone', message: 'Campo obrigatório' });
    });

    test('should handle null and undefined data', () => {
      const requiredFields = ['name', 'email'];
      
      expect(ValidationHelper.validateRequiredFields(null, requiredFields)).toHaveLength(2);
      expect(ValidationHelper.validateRequiredFields(undefined, requiredFields)).toHaveLength(2);
    });
  });
});