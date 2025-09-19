const { ContractServiceRefactored } = require('../services/ContractServiceRefactored');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { HttpStatusCodes, ErrorCodes, SuccessMessages } = require('../utils/constants');
const { ResponseHelper } = require('../utils/responseHelper');
const { ValidationHelper } = require('../utils/validationHelper');

/**
 * Controller refatorado para gerenciamento de contratos
 * Segue princípios de Clean Code: funções pequenas, nomes claros, responsabilidade única
 */
class ContractControllerRefactored {
  /**
   * Lista contratos com paginação e filtros
   * @route GET /api/contracts
   * @access Private
   */
  static getAllContracts = asyncHandler(async (req, res) => {
    const queryParams = ContractControllerRefactored._extractQueryParams(req.query);
    
    try {
      const contractsData = await ContractServiceRefactored.findContractsWithPagination(queryParams);
      ResponseHelper.sendSuccess(res, contractsData);
    } catch (error) {
      ContractControllerRefactored._handleGetContractsError(res, error);
    }
  });

  /**
   * Busca contrato específico por ID
   * @route GET /api/contracts/:id
   * @access Private
   */
  static getContractById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    try {
      const contract = await ContractServiceRefactored.findContractById(id);
      
      if (!contract) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Contrato não encontrado', 
          ErrorCodes.CONTRACT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { contract });
    } catch (error) {
      ContractControllerRefactored._handleGetContractError(res, error);
    }
  });

  /**
   * Cria novo contrato
   * @route POST /api/contracts
   * @access Private
   */
  static createNewContract = asyncHandler(async (req, res) => {
    const contractData = req.body;
    
    const validationErrors = ContractControllerRefactored._validateContractData(contractData);
    if (validationErrors.length > 0) {
      return ResponseHelper.sendValidationError(res, 
        'Dados do contrato inválidos', 
        validationErrors
      );
    }

    try {
      const newContract = await ContractServiceRefactored.createNewContract(contractData);
      ResponseHelper.sendSuccess(res, { contract: newContract }, SuccessMessages.CONTRACT_CREATED, HttpStatusCodes.CREATED);
    } catch (error) {
      ContractControllerRefactored._handleCreateContractError(res, error);
    }
  });

  /**
   * Atualiza contrato existente
   * @route PUT /api/contracts/:id
   * @access Private
   */
  static updateExistingContract = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    const validationErrors = ContractControllerRefactored._validateUpdateData(updateData);
    if (validationErrors.length > 0) {
      return ResponseHelper.sendValidationError(res, 
        'Dados de atualização inválidos', 
        validationErrors
      );
    }

    try {
      const updatedContract = await ContractServiceRefactored.updateExistingContract(id, updateData);
      
      if (!updatedContract) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Contrato não encontrado', 
          ErrorCodes.CONTRACT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { contract: updatedContract }, SuccessMessages.CONTRACT_UPDATED);
    } catch (error) {
      ContractControllerRefactored._handleUpdateContractError(res, error);
    }
  });

  /**
   * Remove contrato do sistema
   * @route DELETE /api/contracts/:id
   * @access Private
   */
  static removeContract = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    try {
      const wasDeleted = await ContractServiceRefactored.removeContract(id);
      
      if (!wasDeleted) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Contrato não encontrado', 
          ErrorCodes.CONTRACT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, {
        message: SuccessMessages.CONTRACT_DELETED
      });
    } catch (error) {
      ContractControllerRefactored._handleDeleteContractError(res, error);
    }
  });

  /**
   * Busca pagamentos do contrato
   * @route GET /api/contracts/:id/payments
   * @access Private
   */
  static getContractPayments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const paginationParams = ContractControllerRefactored._extractPaginationParams(req.query);

    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    try {
      const paymentsData = await ContractServiceRefactored.getContractPayments(id, paginationParams);
      ResponseHelper.sendSuccess(res, paymentsData);
    } catch (error) {
      ContractControllerRefactored._handleGetPaymentsError(res, error);
    }
  });

  /**
   * Gera parcelas para o contrato
   * @route POST /api/contracts/:id/installments
   * @access Private
   */
  static generateInstallments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const installmentData = req.body;

    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    const validationErrors = ContractControllerRefactored._validateInstallmentData(installmentData);
    if (validationErrors.length > 0) {
      return ResponseHelper.sendValidationError(res, 
        'Dados das parcelas inválidos', 
        validationErrors
      );
    }

    try {
      const installments = await ContractServiceRefactored.generateContractInstallments(id, installmentData);
      ResponseHelper.sendSuccess(res, { installments }, SuccessMessages.INSTALLMENTS_GENERATED);
    } catch (error) {
      ContractControllerRefactored._handleGenerateInstallmentsError(res, error);
    }
  });

  /**
   * Busca estatísticas do contrato
   * @route GET /api/contracts/:id/stats
   * @access Private
   */
  static getContractStats = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    try {
      const stats = await ContractServiceRefactored.getContractStatistics(id);
      ResponseHelper.sendSuccess(res, stats);
    } catch (error) {
      ContractControllerRefactored._handleGetStatsError(res, error);
    }
  });

  /**
   * Busca contratos por termo
   * @route GET /api/contracts/search
   * @access Private
   */
  static searchContractsByTerm = asyncHandler(async (req, res) => {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!ContractControllerRefactored._isValidSearchTerm(searchTerm)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'Termo de busca deve ter pelo menos 2 caracteres', 
        ErrorCodes.INVALID_SEARCH_TERM
      );
    }

    try {
      const searchResults = await ContractServiceRefactored.searchContractsByTerm(searchTerm, parseInt(limit));
      ResponseHelper.sendSuccess(res, searchResults);
    } catch (error) {
      ContractControllerRefactored._handleSearchError(res, error);
    }
  });

  /**
   * Atualiza status do contrato
   * @route PATCH /api/contracts/:id/status
   * @access Private
   */
  static updateContractStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!ContractControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_ID
      );
    }

    if (!ContractControllerRefactored._isValidStatus(status)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'Status do contrato inválido', 
        ErrorCodes.INVALID_CONTRACT_STATUS
      );
    }

    try {
      const updatedContract = await ContractServiceRefactored.updateContractStatus(id, status);
      
      if (!updatedContract) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Contrato não encontrado', 
          ErrorCodes.CONTRACT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { contract: updatedContract }, SuccessMessages.CONTRACT_STATUS_UPDATED);
    } catch (error) {
      ContractControllerRefactored._handleUpdateStatusError(res, error);
    }
  });

  // Métodos privados para extração e validação de parâmetros
  static _extractQueryParams(query) {
    const { page = 1, limit = 10, ...filters } = query;
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      ...filters
    };
  }

  static _extractPaginationParams(query) {
    const { page = 1, limit = 10, status = '' } = query;
    return {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    };
  }

  static _isValidId(id) {
    return ValidationHelper.isValidUUID(id) || ValidationHelper.isValidNumber(id);
  }

  static _isValidStatus(status) {
    const validStatuses = ['ativo', 'inativo', 'cancelado', 'finalizado'];
    return validStatuses.includes(status);
  }

  static _isValidSearchTerm(term) {
    return ValidationHelper.isValidString(term) && term.length >= 2;
  }

  static _validateContractData(data) {
    const errors = [];

    if (!data.client_id) {
      errors.push({ field: 'client_id', message: 'ID do cliente é obrigatório' });
    }

    if (!data.contract_number) {
      errors.push({ field: 'contract_number', message: 'Número do contrato é obrigatório' });
    }

    if (!data.total_amount || data.total_amount <= 0) {
      errors.push({ field: 'total_amount', message: 'Valor total deve ser maior que zero' });
    }

    if (!data.start_date) {
      errors.push({ field: 'start_date', message: 'Data de início é obrigatória' });
    }

    if (data.description && !ValidationHelper.isValidString(data.description)) {
      errors.push({ field: 'description', message: 'Descrição inválida' });
    }

    return errors;
  }

  static _validateUpdateData(data) {
    const errors = [];

    if (data.total_amount !== undefined && data.total_amount <= 0) {
      errors.push({ field: 'total_amount', message: 'Valor total deve ser maior que zero' });
    }

    if (data.description && !ValidationHelper.isValidString(data.description)) {
      errors.push({ field: 'description', message: 'Descrição inválida' });
    }

    return errors;
  }

  static _validateInstallmentData(data) {
    const errors = [];

    if (!data.installments || data.installments <= 0) {
      errors.push({ field: 'installments', message: 'Número de parcelas deve ser maior que zero' });
    }

    if (!data.first_due_date) {
      errors.push({ field: 'first_due_date', message: 'Data do primeiro vencimento é obrigatória' });
    }

    return errors;
  }

  // Métodos privados para tratamento de erros específicos
  static _handleGetContractsError(res, error) {
    console.error('Erro ao buscar contratos:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACTS_FETCH_ERROR
    );
  }

  static _handleGetContractError(res, error) {
    console.error('Erro ao buscar contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_FETCH_ERROR
    );
  }

  static _handleCreateContractError(res, error) {
    console.error('Erro ao criar contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_CREATE_ERROR
    );
  }

  static _handleUpdateContractError(res, error) {
    console.error('Erro ao atualizar contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_UPDATE_ERROR
    );
  }

  static _handleDeleteContractError(res, error) {
    console.error('Erro ao deletar contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_DELETE_ERROR
    );
  }

  static _handleGetPaymentsError(res, error) {
    console.error('Erro ao buscar pagamentos do contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_PAYMENTS_FETCH_ERROR
    );
  }

  static _handleGenerateInstallmentsError(res, error) {
    console.error('Erro ao gerar parcelas:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.INSTALLMENTS_GENERATE_ERROR
    );
  }

  static _handleGetStatsError(res, error) {
    console.error('Erro ao buscar estatísticas do contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_STATS_FETCH_ERROR
    );
  }

  static _handleSearchError(res, error) {
    console.error('Erro ao buscar contratos:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_SEARCH_ERROR
    );
  }

  static _handleUpdateStatusError(res, error) {
    console.error('Erro ao atualizar status do contrato:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CONTRACT_STATUS_UPDATE_ERROR
    );
  }
}

module.exports = { ContractControllerRefactored };