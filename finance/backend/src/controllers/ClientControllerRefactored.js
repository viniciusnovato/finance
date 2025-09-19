const { ClientService } = require('../services/ClientService');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { HttpStatusCodes, ErrorCodes, SuccessMessages } = require('../utils/constants');
const { ResponseHelper } = require('../utils/responseHelper');

/**
 * Controller refatorado para gerenciamento de clientes
 * Segue princípios de Clean Code: funções pequenas, nomes claros, responsabilidade única
 */
class ClientControllerRefactored {
  /**
   * Lista clientes com paginação e filtros
   * @route GET /api/clients
   * @access Private
   */
  static getAllClients = asyncHandler(async (req, res) => {
    const queryParams = ClientControllerRefactored._extractQueryParams(req.query);
    
    try {
      const clientsData = await ClientService.getClients(queryParams);
      ResponseHelper.sendSuccess(res, clientsData);
    } catch (error) {
      ClientControllerRefactored._handleGetClientsError(res, error);
    }
  });

  /**
   * Busca cliente específico por ID
   * @route GET /api/clients/:id
   * @access Private
   */
  static getClientById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    if (!ClientControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do cliente inválido', 
        ErrorCodes.INVALID_CLIENT_ID
      );
    }

    try {
      const client = await ClientService.getClientById(id);
      
      if (!client) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Cliente não encontrado', 
          ErrorCodes.CLIENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, { client });
    } catch (error) {
      ClientControllerRefactored._handleGetClientError(res, error);
    }
  });

  /**
   * Cria novo cliente
   * @route POST /api/clients
   * @access Private
   */
  static createNewClient = asyncHandler(async (req, res) => {
    const clientData = req.body;

    try {
      const newClient = await ClientService.createClient(clientData);
      
      ResponseHelper.sendSuccess(res, 
        { 
          message: SuccessMessages.CLIENT_CREATED, 
          client: newClient 
        }, 
        HttpStatusCodes.CREATED
      );
    } catch (error) {
      ClientControllerRefactored._handleCreateClientError(res, error);
    }
  });

  /**
   * Atualiza dados do cliente
   * @route PUT /api/clients/:id
   * @access Private
   */
  static updateExistingClient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    if (!ClientControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do cliente inválido', 
        ErrorCodes.INVALID_CLIENT_ID
      );
    }

    try {
      const updatedClient = await ClientService.updateClient(id, updateData);
      
      if (!updatedClient) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Cliente não encontrado', 
          ErrorCodes.CLIENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, {
        message: SuccessMessages.CLIENT_UPDATED,
        client: updatedClient
      });
    } catch (error) {
      ClientControllerRefactored._handleUpdateClientError(res, error);
    }
  });

  /**
   * Remove cliente do sistema
   * @route DELETE /api/clients/:id
   * @access Private
   */
  static removeClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!ClientControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do cliente inválido', 
        ErrorCodes.INVALID_CLIENT_ID
      );
    }

    try {
      const wasDeleted = await ClientService.deleteClient(id);
      
      if (!wasDeleted) {
        return ResponseHelper.sendError(res, 
          HttpStatusCodes.NOT_FOUND, 
          'Cliente não encontrado', 
          ErrorCodes.CLIENT_NOT_FOUND
        );
      }

      ResponseHelper.sendSuccess(res, {
        message: SuccessMessages.CLIENT_DELETED
      });
    } catch (error) {
      ClientControllerRefactored._handleDeleteClientError(res, error);
    }
  });

  /**
   * Busca contratos do cliente
   * @route GET /api/clients/:id/contracts
   * @access Private
   */
  static getClientContracts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const paginationParams = ClientControllerRefactored._extractPaginationParams(req.query);

    if (!ClientControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do cliente inválido', 
        ErrorCodes.INVALID_CLIENT_ID
      );
    }

    try {
      const contractsData = await ClientService.getClientContracts(id, paginationParams);
      ResponseHelper.sendSuccess(res, contractsData);
    } catch (error) {
      ClientControllerRefactored._handleGetContractsError(res, error);
    }
  });

  /**
   * Busca pagamentos do cliente
   * @route GET /api/clients/:id/payments
   * @access Private
   */
  static getClientPayments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const paginationParams = ClientControllerRefactored._extractPaginationParams(req.query);

    if (!ClientControllerRefactored._isValidId(id)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'ID do cliente inválido', 
        ErrorCodes.INVALID_CLIENT_ID
      );
    }

    try {
      const paymentsData = await ClientService.getClientPayments(id, paginationParams);
      ResponseHelper.sendSuccess(res, paymentsData);
    } catch (error) {
      ClientControllerRefactored._handleGetPaymentsError(res, error);
    }
  });

  /**
   * Busca clientes por termo de pesquisa
   * @route GET /api/clients/search
   * @access Private
   */
  static searchClientsByTerm = asyncHandler(async (req, res) => {
    const { q: searchTerm, limit = 10 } = req.query;

    if (!ClientControllerRefactored._isValidSearchTerm(searchTerm)) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.BAD_REQUEST, 
        'Termo de busca deve ter pelo menos 2 caracteres', 
        ErrorCodes.INVALID_SEARCH_TERM
      );
    }

    try {
      const clients = await ClientService.searchClients(
        searchTerm.trim(), 
        parseInt(limit)
      );
      ResponseHelper.sendSuccess(res, { clients });
    } catch (error) {
      ClientControllerRefactored._handleSearchError(res, error);
    }
  });

  // Métodos privados para validação e extração de parâmetros
  static _extractQueryParams(query) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = query;

    return {
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      status,
      sortBy: sort_by,
      sortOrder: sort_order
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
    return id && id.trim().length > 0;
  }

  static _isValidSearchTerm(term) {
    return term && term.trim().length >= 2;
  }

  // Métodos privados para tratamento de erros específicos
  static _handleGetClientsError(res, error) {
    console.error('Erro ao buscar clientes:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENTS_FETCH_ERROR
    );
  }

  static _handleGetClientError(res, error) {
    console.error('Erro ao buscar cliente:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_FETCH_ERROR
    );
  }

  static _handleCreateClientError(res, error) {
    console.error('Erro ao criar cliente:', error);
    
    if (error.message.includes('já existe')) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.CONFLICT, 
        error.message, 
        ErrorCodes.CLIENT_ALREADY_EXISTS
      );
    }
    
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_CREATE_ERROR
    );
  }

  static _handleUpdateClientError(res, error) {
    console.error('Erro ao atualizar cliente:', error);
    
    if (error.message.includes('já existe')) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.CONFLICT, 
        error.message, 
        ErrorCodes.CLIENT_ALREADY_EXISTS
      );
    }
    
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_UPDATE_ERROR
    );
  }

  static _handleDeleteClientError(res, error) {
    console.error('Erro ao deletar cliente:', error);
    
    if (error.message.includes('possui contratos')) {
      return ResponseHelper.sendError(res, 
        HttpStatusCodes.CONFLICT, 
        error.message, 
        ErrorCodes.CLIENT_HAS_CONTRACTS
      );
    }
    
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_DELETE_ERROR
    );
  }

  static _handleGetContractsError(res, error) {
    console.error('Erro ao buscar contratos do cliente:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_CONTRACTS_FETCH_ERROR
    );
  }

  static _handleGetPaymentsError(res, error) {
    console.error('Erro ao buscar pagamentos do cliente:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_PAYMENTS_FETCH_ERROR
    );
  }

  static _handleSearchError(res, error) {
    console.error('Erro ao buscar clientes:', error);
    ResponseHelper.sendError(res, 
      HttpStatusCodes.INTERNAL_SERVER_ERROR, 
      'Erro interno do servidor', 
      ErrorCodes.CLIENT_SEARCH_ERROR
    );
  }
}

module.exports = { ClientControllerRefactored };