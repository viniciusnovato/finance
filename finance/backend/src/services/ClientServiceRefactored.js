const { ClientRepository } = require('../repositories/ClientRepository');
const { ValidationHelper } = require('../utils/validationHelper');
const { PaginationDefaults, SearchDefaults, ValidSortFields, ValidSortOrders } = require('../utils/constants');

/**
 * Service refatorado para gerenciamento de clientes
 * Aplica princípios de Clean Code: funções pequenas, responsabilidade única, nomes descritivos
 */
class ClientServiceRefactored {
  /**
   * Busca lista paginada de clientes com filtros
   * @param {Object} searchOptions - Opções de busca e paginação
   * @returns {Promise<Object>} Lista paginada de clientes
   */
  static async findClientsWithPagination(searchOptions) {
    const validatedOptions = ClientServiceRefactored._validateSearchOptions(searchOptions);
    
    return await ClientRepository.getClients(validatedOptions);
  }

  /**
   * Busca cliente específico por ID
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object|null>} Dados do cliente ou null se não encontrado
   */
  static async findClientById(clientId) {
    ClientServiceRefactored._validateClientId(clientId);
    
    return await ClientRepository.getClientById(clientId);
  }

  /**
   * Cria novo cliente no sistema
   * @param {Object} clientData - Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  static async createNewClient(clientData) {
    const processedData = ClientServiceRefactored._processClientDataForCreation(clientData);
    
    await ClientServiceRefactored._validateClientUniqueness(processedData);
    
    return await ClientRepository.createClient(processedData);
  }

  /**
   * Atualiza dados de cliente existente
   * @param {string} clientId - ID do cliente
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object|null>} Cliente atualizado ou null se não encontrado
   */
  static async updateExistingClient(clientId, updateData) {
    ClientServiceRefactored._validateClientId(clientId);
    
    const processedData = ClientServiceRefactored._processClientDataForUpdate(updateData);
    
    if (ClientServiceRefactored._hasUniqueFieldsToUpdate(processedData)) {
      await ClientServiceRefactored._validateClientUniquenessForUpdate(clientId, processedData);
    }
    
    return await ClientRepository.updateClient(clientId, processedData);
  }

  /**
   * Remove cliente do sistema
   * @param {string} clientId - ID do cliente
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  static async removeClientById(clientId) {
    ClientServiceRefactored._validateClientId(clientId);
    
    await ClientServiceRefactored._validateClientCanBeDeleted(clientId);
    
    return await ClientRepository.deleteClient(clientId);
  }

  /**
   * Busca contratos associados ao cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de contratos
   */
  static async findClientContracts(clientId, paginationOptions) {
    ClientServiceRefactored._validateClientId(clientId);
    
    const validatedOptions = ClientServiceRefactored._validatePaginationOptions(paginationOptions);
    
    return await ClientRepository.getClientContracts(clientId, validatedOptions);
  }

  /**
   * Busca pagamentos associados ao cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos
   */
  static async findClientPayments(clientId, paginationOptions) {
    ClientServiceRefactored._validateClientId(clientId);
    
    const validatedOptions = ClientServiceRefactored._validatePaginationOptions(paginationOptions);
    
    return await ClientRepository.getClientPayments(clientId, validatedOptions);
  }

  /**
   * Busca clientes por termo de pesquisa
   * @param {string} searchTerm - Termo de busca
   * @param {number} resultLimit - Limite de resultados
   * @returns {Promise<Array>} Lista de clientes encontrados
   */
  static async searchClientsByTerm(searchTerm, resultLimit = SearchDefaults.DEFAULT_SEARCH_LIMIT) {
    ClientServiceRefactored._validateSearchTerm(searchTerm);
    ClientServiceRefactored._validateSearchLimit(resultLimit);
    
    const sanitizedTerm = searchTerm.trim();
    
    return await ClientRepository.searchClients(sanitizedTerm, resultLimit);
  }

  /**
   * Busca estatísticas do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Estatísticas do cliente
   */
  static async getClientStatistics(clientId) {
    ClientServiceRefactored._validateClientId(clientId);
    
    return await ClientRepository.getClientStats(clientId);
  }

  // Métodos privados de validação
  static _validateClientId(clientId) {
    if (!clientId || typeof clientId !== 'string' || clientId.trim().length === 0) {
      throw new Error('ID do cliente é obrigatório e deve ser uma string válida');
    }
  }

  static _validateSearchOptions(options) {
    const { page, limit, search, status, sortBy, sortOrder } = options;
    
    // Validar paginação
    if (page < 1 || limit < PaginationDefaults.MIN_LIMIT || limit > PaginationDefaults.MAX_LIMIT) {
      throw new Error('Parâmetros de paginação inválidos');
    }

    // Validar campo de ordenação
    if (!ValidSortFields.CLIENTS.includes(sortBy)) {
      throw new Error(`Campo de ordenação inválido. Campos válidos: ${ValidSortFields.CLIENTS.join(', ')}`);
    }

    // Validar ordem de classificação
    if (!ValidSortOrders.includes(sortOrder)) {
      throw new Error(`Ordem de classificação inválida. Ordens válidas: ${ValidSortOrders.join(', ')}`);
    }

    return {
      page,
      limit,
      search: search ? search.trim() : '',
      status,
      sortBy,
      sortOrder
    };
  }

  static _validatePaginationOptions(options) {
    const { page, limit, status } = options;
    
    if (page < 1 || limit < PaginationDefaults.MIN_LIMIT || limit > PaginationDefaults.MAX_LIMIT) {
      throw new Error('Parâmetros de paginação inválidos');
    }

    return { page, limit, status };
  }

  static _validateSearchTerm(searchTerm) {
    if (!searchTerm || typeof searchTerm !== 'string') {
      throw new Error('Termo de busca é obrigatório');
    }

    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm.length < SearchDefaults.MIN_SEARCH_LENGTH) {
      throw new Error(`Termo de busca deve ter pelo menos ${SearchDefaults.MIN_SEARCH_LENGTH} caracteres`);
    }

    if (trimmedTerm.length > SearchDefaults.MAX_SEARCH_LENGTH) {
      throw new Error(`Termo de busca deve ter no máximo ${SearchDefaults.MAX_SEARCH_LENGTH} caracteres`);
    }
  }

  static _validateSearchLimit(limit) {
    if (!Number.isInteger(limit) || limit < 1 || limit > PaginationDefaults.MAX_LIMIT) {
      throw new Error('Limite de busca inválido');
    }
  }

  // Métodos privados de processamento de dados
  static _processClientDataForCreation(clientData) {
    if (!clientData || typeof clientData !== 'object') {
      throw new Error('Dados do cliente são obrigatórios');
    }

    // Validar campos obrigatórios
    const requiredFields = ['name', 'email'];
    for (const field of requiredFields) {
      if (!clientData[field] || clientData[field].trim().length === 0) {
        throw new Error(`Campo '${field}' é obrigatório`);
      }
    }

    return ClientServiceRefactored._sanitizeClientData(clientData);
  }

  static _processClientDataForUpdate(updateData) {
    if (!updateData || typeof updateData !== 'object') {
      throw new Error('Dados de atualização são obrigatórios');
    }

    return ClientServiceRefactored._sanitizeClientData(updateData, true);
  }

  static _sanitizeClientData(clientData, isUpdate = false) {
    const sanitized = {};

    // Campos de texto que devem ser sanitizados
    const textFields = ['name', 'email', 'phone', 'address', 'notes'];
    
    for (const field of textFields) {
      if (clientData[field] !== undefined) {
        if (typeof clientData[field] === 'string') {
          const trimmed = clientData[field].trim();
          if (trimmed.length > 0 || isUpdate) {
            sanitized[field] = trimmed;
          }
        }
      }
    }

    // Validar email se fornecido
    if (sanitized.email && !ValidationHelper.isValidEmail(sanitized.email)) {
      throw new Error('Email inválido');
    }

    // Validar telefone se fornecido
    if (sanitized.phone && !ValidationHelper.isValidPhone(sanitized.phone)) {
      throw new Error('Telefone inválido');
    }

    // Campos que não precisam de sanitização especial
    const directFields = ['status', 'birth_date', 'document_number'];
    for (const field of directFields) {
      if (clientData[field] !== undefined) {
        sanitized[field] = clientData[field];
      }
    }

    return sanitized;
  }

  // Métodos privados de validação de negócio
  static async _validateClientUniqueness(clientData) {
    if (clientData.email) {
      const existingClient = await ClientRepository.findByEmail(clientData.email);
      if (existingClient) {
        throw new Error('Cliente com este email já existe');
      }
    }

    if (clientData.document_number) {
      const existingClient = await ClientRepository.findByDocument(clientData.document_number);
      if (existingClient) {
        throw new Error('Cliente com este documento já existe');
      }
    }
  }

  static async _validateClientUniquenessForUpdate(clientId, updateData) {
    if (updateData.email) {
      const existingClient = await ClientRepository.findByEmail(updateData.email);
      if (existingClient && existingClient.id !== clientId) {
        throw new Error('Cliente com este email já existe');
      }
    }

    if (updateData.document_number) {
      const existingClient = await ClientRepository.findByDocument(updateData.document_number);
      if (existingClient && existingClient.id !== clientId) {
        throw new Error('Cliente com este documento já existe');
      }
    }
  }

  static async _validateClientCanBeDeleted(clientId) {
    const hasActiveContracts = await ClientRepository.hasActiveContracts(clientId);
    if (hasActiveContracts) {
      throw new Error('Cliente possui contratos ativos e não pode ser removido');
    }
  }

  static _hasUniqueFieldsToUpdate(updateData) {
    return updateData.email || updateData.document_number;
  }
}

module.exports = { ClientServiceRefactored };