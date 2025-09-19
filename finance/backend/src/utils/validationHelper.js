/**
 * Helper para validações comuns da aplicação
 * Centraliza lógicas de validação para reutilização e consistência
 */
class ValidationHelper {
  /**
   * Valida formato de email
   * @param {string} email - Email a ser validado
   * @returns {boolean} True se válido
   */
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Valida formato de telefone brasileiro
   * @param {string} phone - Telefone a ser validado
   * @returns {boolean} True se válido
   */
  static isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Valida telefone brasileiro (10 ou 11 dígitos)
    return cleanPhone.length === 10 || cleanPhone.length === 11;
  }

  /**
   * Valida CPF brasileiro
   * @param {string} cpf - CPF a ser validado
   * @returns {boolean} True se válido
   */
  static isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false;

    return true;
  }

  /**
   * Valida CNPJ brasileiro
   * @param {string} cnpj - CNPJ a ser validado
   * @returns {boolean} True se válido
   */
  static isValidCNPJ(cnpj) {
    if (!cnpj || typeof cnpj !== 'string') {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replace(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
      return false;
    }

    // Validação do primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleanCNPJ.charAt(12))) return false;

    // Validação do segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleanCNPJ.charAt(13))) return false;

    return true;
  }

  /**
   * Valida documento (CPF ou CNPJ)
   * @param {string} document - Documento a ser validado
   * @returns {boolean} True se válido
   */
  static isValidDocument(document) {
    if (!document || typeof document !== 'string') {
      return false;
    }

    const cleanDocument = document.replace(/\D/g, '');
    
    if (cleanDocument.length === 11) {
      return ValidationHelper.isValidCPF(document);
    } else if (cleanDocument.length === 14) {
      return ValidationHelper.isValidCNPJ(document);
    }

    return false;
  }

  /**
   * Valida formato de data (YYYY-MM-DD)
   * @param {string} date - Data a ser validada
   * @returns {boolean} True se válido
   */
  static isValidDate(date) {
    if (!date || typeof date !== 'string') {
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return false;
    }

    const parsedDate = new Date(date);
    return parsedDate instanceof Date && !isNaN(parsedDate);
  }

  /**
   * Valida se uma data está no futuro
   * @param {string} date - Data a ser validada
   * @returns {boolean} True se for data futura
   */
  static isFutureDate(date) {
    if (!ValidationHelper.isValidDate(date)) {
      return false;
    }

    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate > today;
  }

  /**
   * Valida se uma data está no passado
   * @param {string} date - Data a ser validada
   * @returns {boolean} True se for data passada
   */
  static isPastDate(date) {
    if (!ValidationHelper.isValidDate(date)) {
      return false;
    }

    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return inputDate < today;
  }

  /**
   * Valida valor monetário
   * @param {number|string} amount - Valor a ser validado
   * @returns {boolean} True se válido
   */
  static isValidAmount(amount) {
    if (amount === null || amount === undefined) {
      return false;
    }

    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return !isNaN(numericAmount) && isFinite(numericAmount) && numericAmount >= 0;
  }

  /**
   * Valida se string não está vazia após trim
   * @param {string} str - String a ser validada
   * @returns {boolean} True se não vazia
   */
  static isNonEmptyString(str) {
    return typeof str === 'string' && str.trim().length > 0;
  }

  /**
   * Valida comprimento mínimo de string
   * @param {string} str - String a ser validada
   * @param {number} minLength - Comprimento mínimo
   * @returns {boolean} True se atende ao comprimento mínimo
   */
  static hasMinLength(str, minLength) {
    return typeof str === 'string' && str.trim().length >= minLength;
  }

  /**
   * Valida comprimento máximo de string
   * @param {string} str - String a ser validada
   * @param {number} maxLength - Comprimento máximo
   * @returns {boolean} True se não excede o comprimento máximo
   */
  static hasMaxLength(str, maxLength) {
    return typeof str === 'string' && str.trim().length <= maxLength;
  }

  /**
   * Valida se valor está dentro de um range
   * @param {number} value - Valor a ser validado
   * @param {number} min - Valor mínimo
   * @param {number} max - Valor máximo
   * @returns {boolean} True se está no range
   */
  static isInRange(value, min, max) {
    return typeof value === 'number' && value >= min && value <= max;
  }

  /**
   * Valida UUID v4
   * @param {string} uuid - UUID a ser validado
   * @returns {boolean} True se válido
   */
  static isValidUUID(uuid) {
    if (!uuid || typeof uuid !== 'string') {
      return false;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitiza string removendo caracteres especiais
   * @param {string} str - String a ser sanitizada
   * @returns {string} String sanitizada
   */
  static sanitizeString(str) {
    if (typeof str !== 'string') {
      return '';
    }

    return str.trim().replace(/[<>"'&]/g, '');
  }

  /**
   * Normaliza telefone removendo caracteres especiais
   * @param {string} phone - Telefone a ser normalizado
   * @returns {string} Telefone normalizado
   */
  static normalizePhone(phone) {
    if (typeof phone !== 'string') {
      return '';
    }

    return phone.replace(/\D/g, '');
  }

  /**
   * Normaliza documento removendo caracteres especiais
   * @param {string} document - Documento a ser normalizado
   * @returns {string} Documento normalizado
   */
  static normalizeDocument(document) {
    if (typeof document !== 'string') {
      return '';
    }

    return document.replace(/\D/g, '');
  }
}

module.exports = { ValidationHelper };