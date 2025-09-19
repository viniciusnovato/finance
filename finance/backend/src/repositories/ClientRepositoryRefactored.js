const { supabaseAdmin } = require('../config/supabase');
const { DatabaseHelper } = require('../utils/databaseHelper');
const { ValidationHelper } = require('../utils/validationHelper');
const { ErrorHandler } = require('../utils/errorHandler');
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../utils/constants');

/**
 * Repository refatorado para operações de clientes
 * Segue princípios de Clean Code e Single Responsibility
 */
class ClientRepositoryRefactored {
  // Campos permitidos para ordenação
  static SORTABLE_FIELDS = ['name', 'email', 'created_at', 'updated_at', 'status'];
  
  // Campos pesquisáveis
  static SEARCHABLE_FIELDS = ['name', 'email', 'tax_id'];
  
  // Campos retornados em buscas básicas
  static BASIC_FIELDS = 'id, name, email, tax_id, phone, status, created_at';
  
  // Campos completos
  static FULL_FIELDS = '*';

  /**
   * Busca clientes com paginação, filtros e ordenação
   * @param {Object} queryParams - Parâmetros da consulta
   * @returns {Promise<Object>} Lista paginada de clientes
   */
  static async findClientsWithPagination(queryParams) {
    try {
      const pagination = DatabaseHelper.processPaginationParams(queryParams);
      const sorting = DatabaseHelper.processSortParams(
        queryParams, 
        ClientRepositoryRefactored.SORTABLE_FIELDS, 
        'created_at'
      );
      
      let query = supabaseAdmin
        .from('clients')
        .select(ClientRepositoryRefactored.BASIC_FIELDS, { count: 'exact' });

      // Aplicar filtros
      query = ClientRepositoryRefactored._applyFilters(query, queryParams);
      
      // Aplicar ordenação
      query = query.order(sorting.sortBy, { ascending: sorting.sortOrder === 'ASC' });
      
      // Aplicar paginação
      query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('buscar clientes', error);
      }

      return DatabaseHelper.formatPaginatedResponse(data || [], pagination, count || 0);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'findClientsWithPagination', queryParams });
      throw error;
    }
  }

  /**
   * Busca cliente por ID
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object|null>} Dados do cliente ou null
   */
  static async findClientById(clientId) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);

      const { data, error } = await supabaseAdmin
        .from('clients')
        .select(ClientRepositoryRefactored.FULL_FIELDS)
        .eq('id', clientId)
        .single();

      if (error) {
        if (ClientRepositoryRefactored._isNotFoundError(error)) {
          return null;
        }
        throw ClientRepositoryRefactored._createDatabaseError('buscar cliente por ID', error);
      }

      return data;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'findClientById', clientId });
      throw error;
    }
  }

  /**
   * Busca cliente por documento (CPF/CNPJ)
   * @param {string} taxId - Documento do cliente
   * @returns {Promise<Object|null>} Dados do cliente ou null
   */
  static async findClientByTaxId(taxId) {
    try {
      const normalizedTaxId = ValidationHelper.normalizeDocument(taxId);
      
      if (!ValidationHelper.isValidDocument(normalizedTaxId)) {
        return null;
      }

      const { data, error } = await supabaseAdmin
        .from('clients')
        .select(ClientRepositoryRefactored.FULL_FIELDS)
        .eq('tax_id', normalizedTaxId)
        .single();

      if (error) {
        if (ClientRepositoryRefactored._isNotFoundError(error)) {
          return null;
        }
        throw ClientRepositoryRefactored._createDatabaseError('buscar cliente por documento', error);
      }

      return data;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'findClientByTaxId', taxId });
      throw error;
    }
  }

  /**
   * Busca cliente por email
   * @param {string} email - Email do cliente
   * @returns {Promise<Object|null>} Dados do cliente ou null
   */
  static async findClientByEmail(email) {
    try {
      if (!ValidationHelper.isValidEmail(email)) {
        return null;
      }

      const normalizedEmail = email.toLowerCase().trim();

      const { data, error } = await supabaseAdmin
        .from('clients')
        .select(ClientRepositoryRefactored.FULL_FIELDS)
        .eq('email', normalizedEmail)
        .single();

      if (error) {
        if (ClientRepositoryRefactored._isNotFoundError(error)) {
          return null;
        }
        throw ClientRepositoryRefactored._createDatabaseError('buscar cliente por email', error);
      }

      return data;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'findClientByEmail', email });
      throw error;
    }
  }

  /**
   * Cria novo cliente
   * @param {Object} clientData - Dados do cliente
   * @returns {Promise<Object>} Cliente criado
   */
  static async createClient(clientData) {
    try {
      const sanitizedData = ClientRepositoryRefactored._sanitizeClientData(clientData);
      const validationErrors = ClientRepositoryRefactored._validateClientData(sanitizedData);
      
      if (validationErrors.length > 0) {
        throw ErrorHandler.createError(
          `Dados inválidos: ${validationErrors.join(', ')}`,
          400
        );
      }

      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert([sanitizedData])
        .select(ClientRepositoryRefactored.FULL_FIELDS)
        .single();

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('criar cliente', error);
      }

      return data;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'createClient', clientData });
      throw error;
    }
  }

  /**
   * Atualiza cliente existente
   * @param {string} clientId - ID do cliente
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object|null>} Cliente atualizado ou null
   */
  static async updateClient(clientId, updateData) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);
      
      const sanitizedData = ClientRepositoryRefactored._sanitizeClientData(updateData, false);
      const validationErrors = ClientRepositoryRefactored._validateClientData(sanitizedData, false);
      
      if (validationErrors.length > 0) {
        throw ErrorHandler.createError(
          `Dados inválidos: ${validationErrors.join(', ')}`,
          400
        );
      }

      const { data, error } = await supabaseAdmin
        .from('clients')
        .update(sanitizedData)
        .eq('id', clientId)
        .select(ClientRepositoryRefactored.FULL_FIELDS)
        .single();

      if (error) {
        if (ClientRepositoryRefactored._isNotFoundError(error)) {
          return null;
        }
        throw ClientRepositoryRefactored._createDatabaseError('atualizar cliente', error);
      }

      return data;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'updateClient', clientId, updateData });
      throw error;
    }
  }

  /**
   * Remove cliente (soft delete)
   * @param {string} clientId - ID do cliente
   * @returns {Promise<boolean>} Sucesso da operação
   */
  static async deleteClient(clientId) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);

      // Verifica se cliente tem dependências
      const hasContracts = await ClientRepositoryRefactored.clientHasContracts(clientId);
      if (hasContracts) {
        throw ErrorHandler.createError(
          'Cliente não pode ser removido pois possui contratos',
          409
        );
      }

      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('remover cliente', error);
      }

      return true;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'deleteClient', clientId });
      throw error;
    }
  }

  /**
   * Verifica se cliente possui contratos
   * @param {string} clientId - ID do cliente
   * @returns {Promise<boolean>} Se possui contratos
   */
  static async clientHasContracts(clientId) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);

      const { data, error } = await supabaseAdmin
        .from('contracts')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('verificar contratos do cliente', error);
      }

      return (data || []).length > 0;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'clientHasContracts', clientId });
      throw error;
    }
  }

  /**
   * Verifica se cliente possui pagamentos
   * @param {string} clientId - ID do cliente
   * @returns {Promise<boolean>} Se possui pagamentos
   */
  static async clientHasPayments(clientId) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);

      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('id')
        .in('contract_id', 
          supabaseAdmin
            .from('contracts')
            .select('id')
            .eq('client_id', clientId)
        )
        .limit(1);

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('verificar pagamentos do cliente', error);
      }

      return (data || []).length > 0;
    } catch (error) {
      ErrorHandler.logError(error, { method: 'clientHasPayments', clientId });
      throw error;
    }
  }

  /**
   * Busca contratos do cliente com paginação
   * @param {string} clientId - ID do cliente
   * @param {Object} queryParams - Parâmetros da consulta
   * @returns {Promise<Object>} Lista paginada de contratos
   */
  static async findClientContracts(clientId, queryParams) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);
      
      const pagination = DatabaseHelper.processPaginationParams(queryParams);
      
      let query = supabaseAdmin
        .from('contracts')
        .select('*', { count: 'exact' })
        .eq('client_id', clientId);

      // Aplicar filtro de status se fornecido
      if (queryParams.status) {
        query = query.eq('status', queryParams.status);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('buscar contratos do cliente', error);
      }

      return DatabaseHelper.formatPaginatedResponse(data || [], pagination, count || 0);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'findClientContracts', clientId, queryParams });
      throw error;
    }
  }

  /**
   * Busca pagamentos do cliente com paginação
   * @param {string} clientId - ID do cliente
   * @param {Object} queryParams - Parâmetros da consulta
   * @returns {Promise<Object>} Lista paginada de pagamentos
   */
  static async findClientPayments(clientId, queryParams) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);
      
      const pagination = DatabaseHelper.processPaginationParams(queryParams);
      
      let query = supabaseAdmin
        .from('payments')
        .select(`
          *,
          contracts!inner (
            id,
            contract_number,
            client_id
          )
        `, { count: 'exact' })
        .eq('contracts.client_id', clientId);

      // Aplicar filtro de status se fornecido
      if (queryParams.status) {
        query = query.eq('status', queryParams.status);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(pagination.offset, pagination.offset + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('buscar pagamentos do cliente', error);
      }

      return DatabaseHelper.formatPaginatedResponse(data || [], pagination, count || 0);
    } catch (error) {
      ErrorHandler.logError(error, { method: 'findClientPayments', clientId, queryParams });
      throw error;
    }
  }

  /**
   * Busca clientes por termo de pesquisa
   * @param {string} searchTerm - Termo de busca
   * @param {number} limit - Limite de resultados
   * @returns {Promise<Array>} Lista de clientes
   */
  static async searchActiveClients(searchTerm, limit = 10) {
    try {
      if (!searchTerm || typeof searchTerm !== 'string') {
        return [];
      }

      const sanitizedTerm = ValidationHelper.sanitizeString(searchTerm);
      const limitValue = Math.min(limit, MAX_PAGE_SIZE);

      const { data, error } = await supabaseAdmin
        .from('clients')
        .select(ClientRepositoryRefactored.BASIC_FIELDS)
        .or(`name.ilike.%${sanitizedTerm}%,email.ilike.%${sanitizedTerm}%,tax_id.ilike.%${sanitizedTerm}%`)
        .eq('status', 'active')
        .order('name')
        .limit(limitValue);

      if (error) {
        throw ClientRepositoryRefactored._createDatabaseError('buscar clientes', error);
      }

      return data || [];
    } catch (error) {
      ErrorHandler.logError(error, { method: 'searchActiveClients', searchTerm, limit });
      throw error;
    }
  }

  /**
   * Obtém estatísticas do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Promise<Object>} Estatísticas do cliente
   */
  static async getClientStatistics(clientId) {
    try {
      ClientRepositoryRefactored._validateClientId(clientId);

      const [contractsStats, paymentsStats] = await Promise.all([
        ClientRepositoryRefactored._getContractsStatistics(clientId),
        ClientRepositoryRefactored._getPaymentsStatistics(clientId)
      ]);

      return {
        contracts: contractsStats,
        payments: paymentsStats
      };
    } catch (error) {
      ErrorHandler.logError(error, { method: 'getClientStatistics', clientId });
      throw error;
    }
  }

  // MÉTODOS PRIVADOS

  /**
   * Aplica filtros à consulta
   * @private
   */
  static _applyFilters(query, params) {
    // Filtro de busca
    if (params.search) {
      const searchTerm = ValidationHelper.sanitizeString(params.search);
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,tax_id.ilike.%${searchTerm}%`);
    }

    // Filtro de status
    if (params.status) {
      query = query.eq('status', params.status);
    }

    return query;
  }

  /**
   * Sanitiza dados do cliente
   * @private
   */
  static _sanitizeClientData(data, isCreate = true) {
    const allowedFields = isCreate 
      ? ['name', 'email', 'tax_id', 'phone', 'address', 'status']
      : ['name', 'email', 'phone', 'address', 'status'];

    const sanitized = DatabaseHelper.sanitizeFields(data, allowedFields);

    // Normaliza campos específicos
    if (sanitized.email) {
      sanitized.email = sanitized.email.toLowerCase().trim();
    }

    if (sanitized.tax_id) {
      sanitized.tax_id = ValidationHelper.normalizeDocument(sanitized.tax_id);
    }

    if (sanitized.phone) {
      sanitized.phone = ValidationHelper.normalizePhone(sanitized.phone);
    }

    return sanitized;
  }

  /**
   * Valida dados do cliente
   * @private
   */
  static _validateClientData(data, isCreate = true) {
    const errors = [];

    if (isCreate) {
      const requiredFields = ['name', 'email', 'tax_id'];
      errors.push(...DatabaseHelper.validateRequiredFields(data, requiredFields));
    }

    // Validações específicas
    if (data.email && !ValidationHelper.isValidEmail(data.email)) {
      errors.push('Email inválido');
    }

    if (data.tax_id && !ValidationHelper.isValidDocument(data.tax_id)) {
      errors.push('CPF/CNPJ inválido');
    }

    if (data.phone && !ValidationHelper.isValidPhone(data.phone)) {
      errors.push('Telefone inválido');
    }

    return errors;
  }

  /**
   * Valida ID do cliente
   * @private
   */
  static _validateClientId(clientId) {
    if (!clientId || typeof clientId !== 'string') {
      throw ErrorHandler.createError('ID do cliente é obrigatório', 400);
    }
  }

  /**
   * Verifica se é erro de "não encontrado"
   * @private
   */
  static _isNotFoundError(error) {
    return error.code === 'PGRST116';
  }

  /**
   * Cria erro de banco de dados
   * @private
   */
  static _createDatabaseError(operation, error) {
    return ErrorHandler.createError(
      `Erro ao ${operation}: ${error.message}`,
      500
    );
  }

  /**
   * Obtém estatísticas de contratos
   * @private
   */
  static async _getContractsStatistics(clientId) {
    const { data, error } = await supabaseAdmin
      .from('contracts')
      .select('id, value, status, created_at')
      .eq('client_id', clientId);

    if (error) {
      throw ClientRepositoryRefactored._createDatabaseError('buscar estatísticas de contratos', error);
    }

    const contracts = data || [];
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const totalValue = contracts.reduce((sum, c) => sum + parseFloat(c.value || 0), 0);

    return {
      total: totalContracts,
      active: activeContracts,
      total_value: totalValue
    };
  }

  /**
   * Obtém estatísticas de pagamentos
   * @private
   */
  static async _getPaymentsStatistics(clientId) {
    // Primeiro busca os contratos do cliente
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('client_id', clientId);

    if (contractsError) {
      throw ClientRepositoryRefactored._createDatabaseError('buscar contratos para estatísticas', contractsError);
    }

    const contractIds = (contracts || []).map(c => c.id);
    
    if (contractIds.length === 0) {
      return {
        total: 0,
        paid: 0,
        pending: 0,
        overdue: 0,
        total_paid: 0,
        total_pending: 0,
        payment_rate: 0
      };
    }

    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('payments')
      .select('amount, status, paid_date, due_date')
      .in('contract_id', contractIds);

    if (paymentsError) {
      throw ClientRepositoryRefactored._createDatabaseError('buscar pagamentos para estatísticas', paymentsError);
    }

    const paymentsData = payments || [];
    const totalPayments = paymentsData.length;
    const paidPayments = paymentsData.filter(p => p.status === 'paid').length;
    const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
    
    const today = new Date().toISOString().split('T')[0];
    const overduePayments = paymentsData.filter(p => 
      p.status === 'pending' && p.due_date < today
    ).length;
    
    const totalPaid = paymentsData
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    const totalPending = paymentsData
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    return {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      overdue: overduePayments,
      total_paid: totalPaid,
      total_pending: totalPending,
      payment_rate: totalPayments > 0 ? (paidPayments / totalPayments * 100) : 0
    };
  }
}

module.exports = { ClientRepositoryRefactored };