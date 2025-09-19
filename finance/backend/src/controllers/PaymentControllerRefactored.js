const { PaymentServiceRefactored } = require('../services/PaymentServiceRefactored');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { HttpStatusCodes, ErrorCodes, SuccessMessages } = require('../utils/constants');
const { ResponseHelper } = require('../utils/responseHelper');
const { ValidationHelper } = require('../utils/validationHelper');

/**
 * Controller refatorado para gerenciamento de pagamentos
 * Segue princípios de Clean Code: funções pequenas, nomes claros, responsabilidade única
 */
class PaymentControllerRefactored {
  /**
   * Lista pagamentos com paginação e filtros
   * @route GET /api/payments
   * @access Private
   */
  static getAllPayments = asyncHandler(async (req, res) => {
    const queryParams = PaymentControllerRefactored._extractQueryParams(req.query);
    
    try {
      const paymentsData = await PaymentServiceRefactored.findPaymentsWithPagination(
        queryParams.page,
        queryParams.limit,
        queryParams.filters
      );
      ResponseHelper.sendSuccess(res, paymentsData);
    } catch (error) {
      PaymentControllerRefactored._handleGetPaymentsError(res, error);
    }
  });

  /**
   * Busca pagamento específico por ID
   * @route GET /api/payments/:id
   * @access Private
   */
  static getPaymentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!PaymentControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do pagamento inválido', 
        ErrorCodes.INVALID_PAYMENT_ID
      );
    }

    try {
      const payment = await PaymentServiceRefactored.findPaymentById(id);
      
      if (!payment) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Pagamento não encontrado', 
          ErrorCodes.PAYMENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { payment });
    } catch (error) {
      PaymentControllerRefactored._handleGetPaymentError(res, error);
    }
  });

  /**
   * Cria novo pagamento
   * @route POST /api/payments
   * @access Private
   */
  static createNewPayment = asyncHandler(async (req, res) => {
    const paymentData = req.body;
    
    const validationErrors = PaymentControllerRefactored._validatePaymentData(paymentData);
    if (validationErrors.length > 0) {
      return ResponseHelper.sendValidationError(res, 
        'Dados do pagamento inválidos', 
        validationErrors
      );
    }

    try {
      const newPayment = await PaymentServiceRefactored.createNewPayment(paymentData);
      ResponseHelper.sendSuccess(res, { payment: newPayment }, SuccessMessages.PAYMENT_CREATED, HttpStatusCodes.CREATED);
    } catch (error) {
      PaymentControllerRefactored._handleCreatePaymentError(res, error);
    }
  });

  /**
   * Atualiza pagamento existente
   * @route PUT /api/payments/:id
   * @access Private
   */
  static updateExistingPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!PaymentControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do pagamento inválido', 
        ErrorCodes.INVALID_PAYMENT_ID
      );
    }

    const validationErrors = PaymentControllerRefactored._validateUpdateData(updateData);
    if (validationErrors.length > 0) {
      return ResponseHelper.sendValidationError(res, 
        'Dados de atualização inválidos', 
        validationErrors
      );
    }

    try {
      const updatedPayment = await PaymentServiceRefactored.updateExistingPayment(id, updateData);
      
      if (!updatedPayment) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Pagamento não encontrado', 
          ErrorCodes.PAYMENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { payment: updatedPayment }, SuccessMessages.PAYMENT_UPDATED);
    } catch (error) {
      PaymentControllerRefactored._handleUpdatePaymentError(res, error);
    }
  });

  /**
   * Remove pagamento do sistema
   * @route DELETE /api/payments/:id
   * @access Private
   */
  static removePayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!PaymentControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do pagamento inválido', 
        ErrorCodes.INVALID_PAYMENT_ID
      );
    }

    try {
      const wasDeleted = await PaymentServiceRefactored.removePayment(id);
      
      if (!wasDeleted) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Pagamento não encontrado', 
          ErrorCodes.PAYMENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, {
        message: SuccessMessages.PAYMENT_DELETED
      });
    } catch (error) {
      PaymentControllerRefactored._handleDeletePaymentError(res, error);
    }
  });

  /**
   * Atualiza status do pagamento
   * @route PATCH /api/payments/:id/status
   * @access Private
   */
  static updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!PaymentControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do pagamento inválido', 
        ErrorCodes.INVALID_PAYMENT_ID
      );
    }

    if (!PaymentControllerRefactored._isValidStatus(status)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'Status do pagamento inválido', 
        ErrorCodes.INVALID_PAYMENT_STATUS
      );
    }

    try {
      const updatedPayment = await PaymentServiceRefactored.updatePaymentStatus(id, status);
      
      if (!updatedPayment) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Pagamento não encontrado', 
          ErrorCodes.PAYMENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { payment: updatedPayment }, SuccessMessages.PAYMENT_STATUS_UPDATED);
    } catch (error) {
      PaymentControllerRefactored._handleUpdateStatusError(res, error);
    }
  });

  /**
   * Confirma pagamento
   * @route PATCH /api/payments/:id/confirm
   * @access Private
   */
  static confirmPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!PaymentControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do pagamento inválido', 
        ErrorCodes.INVALID_PAYMENT_ID
      );
    }

    try {
      const confirmedPayment = await PaymentServiceRefactored.confirmPayment(id);
      
      if (!confirmedPayment) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Pagamento não encontrado', 
          ErrorCodes.PAYMENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { payment: confirmedPayment }, SuccessMessages.PAYMENT_CONFIRMED);
    } catch (error) {
      PaymentControllerRefactored._handleConfirmPaymentError(res, error);
    }
  });

  /**
   * Busca pagamentos por termo
   * @route GET /api/payments/search
   * @access Private
   */
  static searchPaymentsByTerm = asyncHandler(async (req, res) => {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!PaymentControllerRefactored._isValidSearchTerm(searchTerm)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'Termo de busca deve ter pelo menos 2 caracteres', 
        ErrorCodes.INVALID_SEARCH_TERM
      );
    }

    try {
      const searchResults = await PaymentServiceRefactored.searchPaymentsByTerm(searchTerm, parseInt(limit));
      ResponseHelper.sendSuccess(res, searchResults);
    } catch (error) {
      PaymentControllerRefactored._handleSearchError(res, error);
    }
  });

  /**
   * Busca pagamentos em atraso
   * @route GET /api/payments/overdue
   * @access Private
   */
  static getOverduePayments = asyncHandler(async (req, res) => {
    const paginationParams = PaymentControllerRefactored._extractPaginationParams(req.query);

    try {
      const overduePayments = await PaymentServiceRefactored.getOverduePayments(paginationParams);
      ResponseHelper.sendSuccess(res, overduePayments);
    } catch (error) {
      PaymentControllerRefactored._handleGetOverdueError(res, error);
    }
  });

  /**
   * Busca pagamentos com vencimento hoje
   * @route GET /api/payments/due-today
   * @access Private
   */
  static getPaymentsDueToday = asyncHandler(async (req, res) => {
    try {
      const paymentsDueToday = await PaymentServiceRefactored.getPaymentsDueToday();
      ResponseHelper.sendSuccess(res, paymentsDueToday);
    } catch (error) {
      PaymentControllerRefactored._handleGetDueTodayError(res, error);
    }
  });

  /**
   * Busca estatísticas de pagamentos
   * @route GET /api/payments/stats
   * @access Private
   */
  static getPaymentStats = asyncHandler(async (req, res) => {
    try {
      const stats = await PaymentServiceRefactored.getPaymentStatistics();
      ResponseHelper.sendSuccess(res, stats);
    } catch (error) {
      PaymentControllerRefactored._handleGetStatsError(res, error);
    }
  });

  // Métodos privados para extração e validação de parâmetros
  static _extractQueryParams(query) {
    const { page = 1, limit = 10, ...filters } = query;
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      filters
    };
  }

  static _extractPaginationParams(query) {
    const { page = 1, limit = 10 } = query;
    return {
      page: parseInt(page),
      limit: parseInt(limit)
    };
  }

  static _isValidId(id) {
    return ValidationHelper.isValidUUID(id) || ValidationHelper.isValidNumber(id);
  }

  static _isValidStatus(status) {
    const validStatuses = ['pendente', 'pago', 'cancelado', 'em_atraso'];
    return validStatuses.includes(status);
  }

  static _isValidSearchTerm(term) {
    return ValidationHelper.isValidString(term) && term.length >= 2;
  }

  static _validatePaymentData(data) {
    const errors = [];

    if (!data.contract_id) {
      errors.push({ field: 'contract_id', message: 'ID do contrato é obrigatório' });
    }

    if (!data.amount || data.amount <= 0) {
      errors.push({ field: 'amount', message: 'Valor deve ser maior que zero' });
    }

    if (!data.due_date) {
      errors.push({ field: 'due_date', message: 'Data de vencimento é obrigatória' });
    }

    if (data.description && !ValidationHelper.isValidString(data.description)) {
      errors.push({ field: 'description', message: 'Descrição inválida' });
    }

    return errors;
  }

  static _validateUpdateData(data) {
    const errors = [];

    if (data.amount !== undefined && data.amount <= 0) {
      errors.push({ field: 'amount', message: 'Valor deve ser maior que zero' });
    }

    if (data.description && !ValidationHelper.isValidString(data.description)) {
      errors.push({ field: 'description', message: 'Descrição inválida' });
    }

    return errors;
  }

  // Métodos privados para tratamento de erros específicos
  static _handleGetPaymentsError(res, error) {
    console.error('Erro ao buscar pagamentos:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENTS_FETCH_ERROR
    );
  }

  static _handleGetPaymentError(res, error) {
    console.error('Erro ao buscar pagamento:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_FETCH_ERROR
    );
  }

  static _handleCreatePaymentError(res, error) {
    console.error('Erro ao criar pagamento:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_CREATE_ERROR
    );
  }

  static _handleUpdatePaymentError(res, error) {
    console.error('Erro ao atualizar pagamento:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_UPDATE_ERROR
    );
  }

  static _handleDeletePaymentError(res, error) {
    console.error('Erro ao deletar pagamento:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_DELETE_ERROR
    );
  }

  static _handleUpdateStatusError(res, error) {
    console.error('Erro ao atualizar status do pagamento:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_STATUS_UPDATE_ERROR
    );
  }

  static _handleConfirmPaymentError(res, error) {
    console.error('Erro ao confirmar pagamento:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_CONFIRM_ERROR
    );
  }

  static _handleSearchError(res, error) {
    console.error('Erro ao buscar pagamentos:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_SEARCH_ERROR
    );
  }

  static _handleGetOverdueError(res, error) {
    console.error('Erro ao buscar pagamentos em atraso:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.OVERDUE_PAYMENTS_FETCH_ERROR
    );
  }

  static _handleGetDueTodayError(res, error) {
    console.error('Erro ao buscar pagamentos com vencimento hoje:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.DUE_TODAY_PAYMENTS_FETCH_ERROR
    );
  }

  static _handleGetStatsError(res, error) {
    console.error('Erro ao buscar estatísticas de pagamentos:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.PAYMENT_STATS_FETCH_ERROR
    );
  }
}

module.exports = { PaymentControllerRefactored };