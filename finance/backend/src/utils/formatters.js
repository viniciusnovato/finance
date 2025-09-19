/**
 * Utilitários para formatação de dados
 */

/**
 * Formata uma data para o formato aceito pelo banco de dados
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data formatada no padrão ISO
 */
function formatDateForDB(date) {
  if (!date) return null;
  
  // Se já é uma string no formato ISO, retorna como está
  if (typeof date === 'string' && date.includes('T')) {
    return date;
  }
  
  // Converte para Date se necessário
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Verifica se a data é válida
  if (isNaN(dateObj.getTime())) {
    throw new Error('Data inválida fornecida para formatação');
  }
  
  return dateObj.toISOString();
}

/**
 * Formata uma data para exibição
 * @param {Date|string} date - Data a ser formatada
 * @param {string} locale - Locale para formatação (padrão: pt-BR)
 * @returns {string} Data formatada para exibição
 */
function formatDateForDisplay(date, locale = 'pt-BR') {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString(locale);
}

/**
 * Formata um valor monetário
 * @param {number} value - Valor a ser formatado
 * @param {string} currency - Moeda (padrão: BRL)
 * @param {string} locale - Locale para formatação (padrão: pt-BR)
 * @returns {string} Valor formatado
 */
function formatCurrency(value, currency = 'BRL', locale = 'pt-BR') {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(value);
}

/**
 * Formata um documento (CPF/CNPJ)
 * @param {string} document - Documento a ser formatado
 * @returns {string} Documento formatado
 */
function formatDocument(document) {
  if (!document) return '';
  
  const cleanDoc = document.replace(/\D/g, '');
  
  if (cleanDoc.length === 11) {
    // CPF: 000.000.000-00
    return cleanDoc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else if (cleanDoc.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleanDoc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return document;
}

/**
 * Formata um telefone
 * @param {string} phone - Telefone a ser formatado
 * @returns {string} Telefone formatado
 */
function formatPhone(phone) {
  if (!phone) return '';
  
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // Telefone fixo: (00) 0000-0000
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  } else if (cleanPhone.length === 11) {
    // Celular: (00) 00000-0000
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

module.exports = {
  formatDateForDB,
  formatDateForDisplay,
  formatCurrency,
  formatDocument,
  formatPhone
};