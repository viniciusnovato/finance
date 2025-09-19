/**
 * Utilitários para cálculos financeiros
 */

/**
 * Calcula o número de dias em atraso
 * @param {Date|string} dueDate - Data de vencimento
 * @param {Date|string} currentDate - Data atual (opcional, padrão: hoje)
 * @returns {number} Número de dias em atraso (0 se não estiver em atraso)
 */
function calculateOverdueDays(dueDate, currentDate = new Date()) {
  if (!dueDate) return 0;
  
  const due = new Date(dueDate);
  const current = new Date(currentDate);
  
  // Remove as horas para comparar apenas as datas
  due.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = current.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
}

/**
 * Calcula juros sobre um valor
 * @param {number} principal - Valor principal
 * @param {number} rate - Taxa de juros (em decimal, ex: 0.02 para 2%)
 * @param {number} days - Número de dias
 * @returns {number} Valor dos juros
 */
function calculateInterest(principal, rate, days) {
  if (!principal || !rate || !days || days <= 0) {
    return 0;
  }
  
  // Juros simples: Principal * Taxa * (Dias / 30)
  // Assumindo taxa mensal
  return principal * rate * (days / 30);
}

/**
 * Calcula juros compostos
 * @param {number} principal - Valor principal
 * @param {number} rate - Taxa de juros (em decimal, ex: 0.02 para 2%)
 * @param {number} periods - Número de períodos
 * @returns {number} Valor final com juros compostos
 */
function calculateCompoundInterest(principal, rate, periods) {
  if (!principal || !rate || !periods || periods <= 0) {
    return principal || 0;
  }
  
  return principal * Math.pow(1 + rate, periods);
}

/**
 * Calcula multa por atraso
 * @param {number} amount - Valor do pagamento
 * @param {number} fineRate - Taxa de multa (em decimal, ex: 0.02 para 2%)
 * @returns {number} Valor da multa
 */
function calculateLateFee(amount, fineRate = 0.02) {
  if (!amount || !fineRate) {
    return 0;
  }
  
  return amount * fineRate;
}

/**
 * Calcula o valor total com juros e multa
 * @param {number} originalAmount - Valor original
 * @param {number} overdueDays - Dias em atraso
 * @param {number} interestRate - Taxa de juros mensal (decimal)
 * @param {number} fineRate - Taxa de multa (decimal)
 * @returns {Object} Objeto com detalhes do cálculo
 */
function calculateTotalWithPenalties(originalAmount, overdueDays, interestRate = 0.01, fineRate = 0.02) {
  if (!originalAmount || overdueDays <= 0) {
    return {
      originalAmount,
      interest: 0,
      lateFee: 0,
      totalAmount: originalAmount,
      overdueDays: 0
    };
  }
  
  const interest = calculateInterest(originalAmount, interestRate, overdueDays);
  const lateFee = calculateLateFee(originalAmount, fineRate);
  const totalAmount = originalAmount + interest + lateFee;
  
  return {
    originalAmount,
    interest,
    lateFee,
    totalAmount,
    overdueDays
  };
}

/**
 * Calcula desconto por pagamento antecipado
 * @param {number} amount - Valor do pagamento
 * @param {number} discountRate - Taxa de desconto (decimal)
 * @param {number} daysEarly - Dias de antecipação
 * @returns {number} Valor do desconto
 */
function calculateEarlyPaymentDiscount(amount, discountRate = 0.005, daysEarly = 0) {
  if (!amount || !discountRate || daysEarly <= 0) {
    return 0;
  }
  
  // Desconto proporcional aos dias de antecipação
  return amount * discountRate * (daysEarly / 30);
}

module.exports = {
  calculateOverdueDays,
  calculateInterest,
  calculateCompoundInterest,
  calculateLateFee,
  calculateTotalWithPenalties,
  calculateEarlyPaymentDiscount
};