const PaymentRepository = require('../repositories/PaymentRepository');
const paymentRepository = new PaymentRepository();
const { ValidationHelper } = require('../utils/validationHelper');
const { DatabaseHelper } = require('../utils/databaseHelper');
const { ErrorHandler } = require('../utils/errorHandler');
const { PaginationDefaults, SearchDefaults, ValidSortFields, ValidSortOrders } = require('../utils/constants');
const { formatCurrency, formatDateForDisplay } = require('../utils/formatters');
const { calculateOverdueDays, calculateInterest } = require('../utils/calculations');

/**
 * Service refatorado para gerenciamento de pagamentos
 * Aplica princípios de Clean Code: funções pequenas, responsabilidade única, nomes descritivos
 */
class PaymentServiceRefactored {
  /**
   * Busca lista paginada de pagamentos com filtros
   * @param {Object} searchOptions - Opções de busca e paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos
   */
  static async findPaymentsWithPagination(searchOptions) {
    const validatedOptions = PaymentServiceRefactored._validateSearchOptions(searchOptions);
    
    try {
      const { page, limit, ...filters } = validatedOptions;
      const offset = (page - 1) * limit;
      const payments = await paymentRepository.findAll(offset, limit, filters);
      
      // Structure the data as expected by _formatPaymentsResponse
      const paymentsData = {
        payments: payments,
        pagination: {
          current_page: page,
          items_per_page: limit,
          total_items: payments.length,
          total_pages: Math.ceil(payments.length / limit)
        }
      };
      
      return PaymentServiceRefactored._formatPaymentsResponse(paymentsData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca pagamento específico por ID
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<Object|null>} Dados do pagamento ou null se não encontrado
   */
  static async findPaymentById(paymentId) {
    PaymentServiceRefactored._validatePaymentId(paymentId);
    
    try {
      const payment = await PaymentRepository.getPaymentById(paymentId);
      return payment ? PaymentServiceRefactored._formatSinglePayment(payment) : null;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamento', error);
    }
  }

  /**
   * Cria novo pagamento no sistema
   * @param {Object} paymentData - Dados do pagamento
   * @returns {Promise<Object>} Pagamento criado
   */
  static async createNewPayment(paymentData) {
    const processedData = PaymentServiceRefactored._processPaymentDataForCreation(paymentData);
    
    await PaymentServiceRefactored._validateContractExists(processedData.contract_id);
    
    try {
      const newPayment = await PaymentRepository.createPayment(processedData);
      return PaymentServiceRefactored._formatSinglePayment(newPayment);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao criar pagamento', error);
    }
  }

  /**
   * Atualiza dados de pagamento existente
   * @param {string} paymentId - ID do pagamento
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object|null>} Pagamento atualizado ou null se não encontrado
   */
  static async updateExistingPayment(paymentId, updateData) {
    PaymentServiceRefactored._validatePaymentId(paymentId);
    
    await PaymentServiceRefactored._validatePaymentCanBeUpdated(paymentId);
    
    const processedData = PaymentServiceRefactored._processPaymentDataForUpdate(updateData);
    
    try {
      const updatedPayment = await PaymentRepository.updatePayment(paymentId, processedData);
      return updatedPayment ? PaymentServiceRefactored._formatSinglePayment(updatedPayment) : null;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao atualizar pagamento', error);
    }
  }

  /**
   * Remove pagamento do sistema
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  static async removePaymentById(paymentId) {
    PaymentServiceRefactored._validatePaymentId(paymentId);
    
    await PaymentServiceRefactored._validatePaymentCanBeDeleted(paymentId);
    
    try {
      return await PaymentRepository.deletePayment(paymentId);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao remover pagamento', error);
    }
  }

  /**
   * Atualiza status do pagamento
   * @param {string} paymentId - ID do pagamento
   * @param {string} newStatus - Novo status
   * @returns {Promise<Object|null>} Pagamento atualizado
   */
  static async updatePaymentStatus(paymentId, newStatus) {
    PaymentServiceRefactored._validatePaymentId(paymentId);
    PaymentServiceRefactored._validatePaymentStatus(newStatus);
    
    await PaymentServiceRefactored._validateStatusTransition(paymentId, newStatus);
    
    try {
      const updatedPayment = await PaymentRepository.updatePaymentStatus(paymentId, newStatus);
      return updatedPayment ? PaymentServiceRefactored._formatSinglePayment(updatedPayment) : null;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao atualizar status do pagamento', error);
    }
  }

  /**
   * Confirma pagamento com dados de confirmação
   * @param {string} paymentId - ID do pagamento
   * @param {Object} confirmationData - Dados de confirmação
   * @returns {Promise<Object|null>} Pagamento confirmado
   */
  static async confirmPayment(paymentId, confirmationData) {
    PaymentServiceRefactored._validatePaymentId(paymentId);
    
    const processedConfirmation = PaymentServiceRefactored._processConfirmationData(confirmationData);
    
    await PaymentServiceRefactored._validatePaymentCanBeConfirmed(paymentId);
    
    try {
      const confirmedPayment = await PaymentRepository.confirmPayment(paymentId, processedConfirmation);
      return confirmedPayment ? PaymentServiceRefactored._formatSinglePayment(confirmedPayment) : null;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao confirmar pagamento', error);
    }
  }

  /**
   * Busca pagamentos por termo de pesquisa
   * @param {string} searchTerm - Termo de busca
   * @param {number} resultLimit - Limite de resultados
   * @returns {Promise<Array>} Lista de pagamentos encontrados
   */
  static async searchPaymentsByTerm(searchTerm, resultLimit = SearchDefaults.DEFAULT_SEARCH_LIMIT) {
    PaymentServiceRefactored._validateSearchTerm(searchTerm);
    PaymentServiceRefactored._validateSearchLimit(resultLimit);
    
    try {
      const payments = await PaymentRepository.searchPayments(searchTerm, resultLimit);
      return payments.map(payment => PaymentServiceRefactored._formatSinglePayment(payment));
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamentos', error);
    }
  }

  /**
   * Busca pagamentos em atraso
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos em atraso
   */
  static async findOverduePayments(paginationOptions) {
    const validatedOptions = PaymentServiceRefactored._validatePaginationOptions(paginationOptions);
    
    try {
      const overdueData = await PaymentRepository.getOverduePayments(validatedOptions);
      return PaymentServiceRefactored._formatPaymentsResponse(overdueData);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamentos em atraso', error);
    }
  }

  /**
   * Busca pagamentos com vencimento hoje
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos com vencimento hoje
   */
  static async findPaymentsDueToday(paginationOptions) {
    const validatedOptions = PaymentServiceRefactored._validatePaginationOptions(paginationOptions);
    
    try {
      const dueTodayData = await PaymentRepository.getPaymentsDueToday(validatedOptions);
      return PaymentServiceRefactored._formatPaymentsResponse(dueTodayData);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamentos com vencimento hoje', error);
    }
  }

  /**
   * Busca estatísticas de pagamentos
   * @param {string} period - Período para estatísticas
   * @returns {Promise<Object>} Estatísticas de pagamentos
   */
  static async getPaymentStatistics(period = '30d') {
    PaymentServiceRefactored._validateStatisticsPeriod(period);
    
    try {
      return await PaymentRepository.getPaymentStats(period);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar estatísticas de pagamentos', error);
    }
  }

  /**
   * Busca pagamentos por contrato
   * @param {string} contractId - ID do contrato
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos do contrato
   */
  static async findPaymentsByContract(contractId, paginationOptions) {
    PaymentServiceRefactored._validateContractId(contractId);
    
    const validatedOptions = PaymentServiceRefactored._validatePaginationOptions(paginationOptions);
    
    try {
      const contractPayments = await PaymentRepository.getPaymentsByContract(contractId, validatedOptions);
      return PaymentServiceRefactored._formatPaymentsResponse(contractPayments);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamentos do contrato', error);
    }
  }

  /**
   * Busca pagamentos por cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos do cliente
   */
  static async findPaymentsByClient(clientId, paginationOptions) {
    PaymentServiceRefactored._validateClientId(clientId);
    
    const validatedOptions = PaymentServiceRefactored._validatePaginationOptions(paginationOptions);
    
    try {
      const clientPayments = await PaymentRepository.getPaymentsByClient(clientId, validatedOptions);
      return PaymentServiceRefactored._formatPaymentsResponse(clientPayments);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamentos do cliente', error);
    }
  }

  /**
   * Gera recibo de pagamento
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<Object>} Dados do recibo
   */
  static async generatePaymentReceipt(paymentId) {
    PaymentServiceRefactored._validatePaymentId(paymentId);
    
    try {
      const receiptData = await PaymentRepository.getPaymentReceiptData(paymentId);
      
      if (!receiptData) {
        throw new Error('Pagamento não encontrado para geração de recibo');
      }
      
      return PaymentServiceRefactored._formatReceiptData(receiptData);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao gerar recibo', error);
    }
  }

  // Métodos privados para validação
  static _validatePaymentId(paymentId) {
    if (!ValidationHelper.isValidUUID(paymentId) && !ValidationHelper.isValidNumber(paymentId)) {
      throw new Error('ID do pagamento inválido');
    }
  }

  static _validateContractId(contractId) {
    if (!ValidationHelper.isValidUUID(contractId) && !ValidationHelper.isValidNumber(contractId)) {
      throw new Error('ID do contrato inválido');
    }
  }

  static _validateClientId(clientId) {
    if (!ValidationHelper.isValidUUID(clientId) && !ValidationHelper.isValidNumber(clientId)) {
      throw new Error('ID do cliente inválido');
    }
  }

  static _validatePaymentStatus(status) {
    const validStatuses = ['pendente', 'pago', 'cancelado', 'em_atraso', 'parcial'];
    if (!validStatuses.includes(status)) {
      throw new Error('Status de pagamento inválido');
    }
  }

  static _validateSearchOptions(options) {
    const defaults = {
      page: PaginationDefaults.DEFAULT_PAGE,
      limit: PaginationDefaults.DEFAULT_LIMIT,
      sortBy: ValidSortFields.PAYMENT_DEFAULT,
      sortOrder: ValidSortOrders.DEFAULT
    };

    return {
      ...defaults,
      ...options,
      page: Math.max(1, parseInt(options.page) || defaults.page),
      limit: Math.min(100, Math.max(1, parseInt(options.limit) || defaults.limit))
    };
  }

  static _validatePaginationOptions(options) {
    const { page = 1, limit = 10, ...filters } = options || {};
    return {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(100, Math.max(1, parseInt(limit))),
      ...filters
    };
  }

  static _validateSearchTerm(searchTerm) {
    if (!ValidationHelper.isValidString(searchTerm)) {
      throw new Error('Termo de busca deve ser uma string válida');
    }
    
    if (searchTerm.length < 2) {
      throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
    }
    
    if (searchTerm.length > 100) {
      throw new Error('Termo de busca muito longo');
    }
  }

  static _validateSearchLimit(limit) {
    const numLimit = parseInt(limit);
    if (isNaN(numLimit) || numLimit < 1 || numLimit > SearchDefaults.MAX_SEARCH_LIMIT) {
      throw new Error(`Limite deve estar entre 1 e ${SearchDefaults.MAX_SEARCH_LIMIT}`);
    }
  }

  static _validateStatisticsPeriod(period) {
    const validPeriods = ['7d', '30d', '90d', '1y'];
    if (!validPeriods.includes(period)) {
      throw new Error('Período de estatísticas inválido');
    }
  }

  // Métodos privados para processamento de dados
  static _processPaymentDataForCreation(paymentData) {
    const processedData = PaymentServiceRefactored._sanitizePaymentData(paymentData);
    
    // Validações específicas para criação
    if (!processedData.contract_id) {
      throw new Error('ID do contrato é obrigatório');
    }
    
    if (!processedData.amount || processedData.amount <= 0) {
      throw new Error('Valor do pagamento deve ser maior que zero');
    }
    
    if (!processedData.due_date) {
      throw new Error('Data de vencimento é obrigatória');
    }
    
    // Definir valores padrão
    processedData.status = processedData.status || 'pendente';
    processedData.created_at = new Date();
    
    return processedData;
  }

  static _processPaymentDataForUpdate(updateData) {
    const processedData = PaymentServiceRefactored._sanitizePaymentData(updateData, true);
    
    // Validações específicas para atualização
    if (processedData.amount !== undefined && processedData.amount <= 0) {
      throw new Error('Valor do pagamento deve ser maior que zero');
    }
    
    processedData.updated_at = new Date();
    
    return processedData;
  }

  static _processConfirmationData(confirmationData) {
    const processed = {
      payment_date: confirmationData.payment_date || new Date(),
      payment_method: confirmationData.payment_method,
      transaction_id: confirmationData.transaction_id,
      notes: confirmationData.notes
    };
    
    if (!processed.payment_method) {
      throw new Error('Método de pagamento é obrigatório para confirmação');
    }
    
    return processed;
  }

  static _sanitizePaymentData(paymentData, isUpdate = false) {
    const allowedFields = [
      'contract_id', 'amount', 'due_date', 'description', 'status',
      'payment_method', 'transaction_id', 'notes', 'installment_number'
    ];
    
    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (paymentData[field] !== undefined) {
        sanitized[field] = paymentData[field];
      }
    });
    
    // Sanitizar strings
    ['description', 'payment_method', 'transaction_id', 'notes'].forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = ValidationHelper.sanitizeString(sanitized[field]);
      }
    });
    
    // Validar e converter números
    if (sanitized.amount) {
      sanitized.amount = parseFloat(sanitized.amount);
      if (isNaN(sanitized.amount)) {
        throw new Error('Valor do pagamento inválido');
      }
    }
    
    if (sanitized.installment_number) {
      sanitized.installment_number = parseInt(sanitized.installment_number);
      if (isNaN(sanitized.installment_number)) {
        throw new Error('Número da parcela inválido');
      }
    }
    
    return sanitized;
  }

  // Métodos privados para validações assíncronas
  static async _validateContractExists(contractId) {
    try {
      const contractExists = await PaymentRepository.checkContractExists(contractId);
      if (!contractExists) {
        throw new Error('Contrato não encontrado');
      }
    } catch (error) {
      throw new Error(`Erro ao validar contrato: ${error.message}`);
    }
  }

  static async _validatePaymentCanBeUpdated(paymentId) {
    try {
      const payment = await PaymentRepository.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }
      
      if (payment.status === 'pago') {
        throw new Error('Não é possível alterar pagamento já realizado');
      }
    } catch (error) {
      throw new Error(`Erro ao validar pagamento: ${error.message}`);
    }
  }

  static async _validatePaymentCanBeDeleted(paymentId) {
    try {
      const payment = await PaymentRepository.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }
      
      if (payment.status === 'pago') {
        throw new Error('Não é possível excluir pagamento já realizado');
      }
    } catch (error) {
      throw new Error(`Erro ao validar exclusão: ${error.message}`);
    }
  }

  static async _validateStatusTransition(paymentId, newStatus) {
    try {
      const payment = await PaymentRepository.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }
      
      // Regras de transição de status
      const currentStatus = payment.status;
      const invalidTransitions = {
        'pago': ['pendente', 'em_atraso'],
        'cancelado': ['pago', 'pendente', 'em_atraso']
      };
      
      if (invalidTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Transição de status inválida: ${currentStatus} -> ${newStatus}`);
      }
    } catch (error) {
      throw new Error(`Erro ao validar transição de status: ${error.message}`);
    }
  }

  static async _validatePaymentCanBeConfirmed(paymentId) {
    try {
      const payment = await PaymentRepository.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Pagamento não encontrado');
      }
      
      if (payment.status === 'pago') {
        throw new Error('Pagamento já foi confirmado');
      }
      
      if (payment.status === 'cancelado') {
        throw new Error('Não é possível confirmar pagamento cancelado');
      }
    } catch (error) {
      throw new Error(`Erro ao validar confirmação: ${error.message}`);
    }
  }

  // Métodos privados para formatação
  static _formatPaymentsResponse(paymentsData) {
    return {
      payments: paymentsData.payments.map(payment => PaymentServiceRefactored._formatSinglePayment(payment)),
      pagination: paymentsData.pagination
    };
  }

  static _formatSinglePayment(payment) {
    return {
      ...payment,
      amount: parseFloat(payment.amount) || 0,
      due_date: formatDateForDisplay(payment.due_date),
      payment_date: payment.payment_date ? formatDateForDisplay(payment.payment_date) : null,
      overdue_days: payment.due_date ? calculateOverdueDays(payment.due_date) : 0,
      interest_amount: payment.amount && payment.due_date ? calculateInterest(payment.amount, payment.due_date) : 0
    };
  }

  static _formatReceiptData(receiptData) {
    return {
      ...receiptData,
      amount: formatCurrency(receiptData.amount),
      payment_date: formatDateForDisplay(receiptData.payment_date),
      generated_at: formatDateForDisplay(new Date())
    };
  }
}

module.exports = { PaymentServiceRefactored };