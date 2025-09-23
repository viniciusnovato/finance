/**
 * Utilitários para cálculos relacionados a contratos
 */

/**
 * Calcula a porcentagem paga de um contrato
 * @param {Object} contract - Objeto do contrato
 * @param {Array} payments - Array de pagamentos do contrato
 * @returns {Object} Objeto com informações de pagamento
 */
function calculatePaymentPercentage(contract, payments = []) {
  // Usar total_value conforme especificado nas instruções
  const totalAmount = parseFloat(contract.total_value || contract.value || contract.total_amount || 0);
  const downPayment = parseFloat(contract.down_payment || 0);
  const numberOfPayments = parseInt(contract.number_of_payments || 0);
  
  if (totalAmount === 0) {
    return {
      percentage_paid: 0,
      amount_paid: 0,
      amount_remaining: 0,
      payments_made: 0,
      payments_remaining: numberOfPayments,
      down_payment: downPayment,
      installment_amount: 0,
      is_fully_paid: false
    };
  }

  // Calcular valor das parcelas (total - entrada) / número de parcelas
  const installmentAmount = numberOfPayments > 0 ? (totalAmount - downPayment) / numberOfPayments : 0;
  
  // Implementar a fórmula correta conforme as instruções:
  // percentual pago = (Down Payment + Comp I + Comp II + Parcelas Pagas) / Valor Total * 100
  
  // 1. Down Payment já obtido do contrato
  
  // 2. Complementos I e II - buscar na tabela payments pelo campo notes
  const compI = payments
    .filter(p => p.notes === 'Comp I')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  const compII = payments
    .filter(p => p.notes === 'Comp II')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  // 3. Parcelas pagas - filtrar por status = 'paid' e payment_type = 'normalPayment'
  const normalPaymentsPaid = payments
    .filter(p => p.status === 'paid' && p.payment_type === 'normalPayment')
    .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  
  // 4. Calcular total pago conforme a fórmula
  const totalPaid = downPayment + compI + compII + normalPaymentsPaid;
  
  // 5. Calcular porcentagem com validações
  let percentagePaid = (totalPaid / totalAmount) * 100;
  
  // Limitar a 100% se o valor pago for maior que o total
  if (percentagePaid > 100) {
    percentagePaid = 100;
  }
  
  const amountRemaining = Math.max(0, totalAmount - totalPaid);
  const paidPayments = payments.filter(p => p.status === 'paid');
  const paymentsRemaining = Math.max(0, numberOfPayments - paidPayments.length);
  
  return {
    percentage_paid: Math.round(percentagePaid * 100) / 100, // 2 casas decimais
    amount_paid: Math.round(totalPaid * 100) / 100,
    amount_remaining: Math.round(amountRemaining * 100) / 100,
    payments_made: paidPayments.length,
    payments_remaining: paymentsRemaining,
    down_payment: downPayment,
    comp_i: Math.round(compI * 100) / 100,
    comp_ii: Math.round(compII * 100) / 100,
    normal_payments_paid: Math.round(normalPaymentsPaid * 100) / 100,
    installment_amount: Math.round(installmentAmount * 100) / 100,
    is_fully_paid: percentagePaid >= 100
  };
}

/**
 * Calcula estatísticas agregadas de pagamento para múltiplos contratos
 * @param {Array} contracts - Array de contratos com pagamentos
 * @returns {Object} Estatísticas agregadas
 */
function calculateAggregatePaymentStats(contracts) {
  if (!contracts || contracts.length === 0) {
    return {
      total_contracts: 0,
      total_value: 0,
      total_paid: 0,
      total_remaining: 0,
      average_percentage_paid: 0,
      fully_paid_contracts: 0,
      contracts_with_down_payment: 0
    };
  }

  let totalValue = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let fullyPaidCount = 0;
  let contractsWithDownPayment = 0;
  let totalPercentage = 0;

  contracts.forEach(contract => {
    const paymentInfo = calculatePaymentPercentage(contract, contract.payments || []);
    
    totalValue += parseFloat(contract.value || contract.total_amount || 0);
    totalPaid += paymentInfo.amount_paid;
    totalRemaining += paymentInfo.amount_remaining;
    totalPercentage += paymentInfo.percentage_paid;
    
    if (paymentInfo.is_fully_paid) {
      fullyPaidCount++;
    }
    
    if (parseFloat(contract.down_payment || 0) > 0) {
      contractsWithDownPayment++;
    }
  });

  return {
    total_contracts: contracts.length,
    total_value: Math.round(totalValue * 100) / 100,
    total_paid: Math.round(totalPaid * 100) / 100,
    total_remaining: Math.round(totalRemaining * 100) / 100,
    average_percentage_paid: Math.round(totalPercentage / contracts.length * 100) / 100,
    fully_paid_contracts: fullyPaidCount,
    contracts_with_down_payment: contractsWithDownPayment,
    payment_completion_rate: Math.round((fullyPaidCount / contracts.length) * 10000) / 100
  };
}

/**
 * Calcula o próximo vencimento de um contrato
 * @param {Object} contract - Objeto do contrato
 * @param {Array} payments - Array de pagamentos do contrato
 * @returns {Object|null} Informações do próximo pagamento ou null se não houver
 */
function getNextPaymentDue(contract, payments = []) {
  const pendingPayments = payments
    .filter(p => p.status === 'pending')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  
  if (pendingPayments.length === 0) {
    return null;
  }
  
  const nextPayment = pendingPayments[0];
  const today = new Date();
  const dueDate = new Date(nextPayment.due_date);
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  
  return {
    payment_id: nextPayment.id,
    due_date: nextPayment.due_date,
    amount: parseFloat(nextPayment.amount || 0),
    days_until_due: daysUntilDue,
    is_overdue: daysUntilDue < 0,
    days_overdue: daysUntilDue < 0 ? Math.abs(daysUntilDue) : 0
  };
}

module.exports = {
  calculatePaymentPercentage,
  calculateAggregatePaymentStats,
  getNextPaymentDue
};