const { ClientRepository } = require('../repositories/ClientRepository');
const ValidationHelper = require('../utils/validationHelper');

class ClientService {
  /**
   * Obter lista de clientes com paginação e filtros
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista paginada de clientes
   */
  static async getClients(options) {
    const { page, limit, search, status, sortBy, sortOrder } = options;
    
    // Validar parâmetros
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Parâmetros de paginação inválidos');
    }

    const validSortFields = ['created_at', 'name', 'email', 'status'];
    if (!validSortFields.includes(sortBy)) {
      throw new Error('Campo de ordenação inválido');
    }

    const validSortOrders = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      throw new Error('Ordem de classificação inválida');
    }

    return await ClientRepository.getClients({
      page,
      limit,
      search: search.trim(),
      status,
      sortBy,
      sortOrder
    });
  }

  /**
   * Obter cliente por ID
   * @param {string} id - ID do cliente
   * @returns {Object|null} Dados do cliente
   */
  static async getClientById(id) {
    if (!id) {
      throw new Error('ID do cliente é obrigatório');
    }

    return await ClientRepository.getClientById(id);
  }

  /**
   * Criar novo cliente
   * @param {Object} clientData - Dados do cliente
   * @returns {Object} Cliente criado
   */
  static async createClient(clientData) {
    // Validação básica de dados obrigatórios
    if (!clientData.first_name || !clientData.last_name) {
      throw new Error('Nome e sobrenome são obrigatórios');
    }
    
    if (clientData.email && !ValidationHelper.isValidEmail(clientData.email)) {
      throw new Error('Email inválido');
    }

    // Verificar se já existe cliente com mesmo CPF/CNPJ
    if (clientData.tax_id) {
      const existingClient = await ClientRepository.getClientByTaxId(clientData.tax_id);
      if (existingClient) {
        throw new Error('Já existe um cliente com este CPF/CNPJ');
      }
    }

    // Verificar se já existe cliente com mesmo email
    if (clientData.email) {
      const existingClient = await ClientRepository.getClientByEmail(clientData.email);
      if (existingClient) {
        throw new Error('Já existe um cliente com este email');
      }
    }

    // Preparar dados para inserção
    const processedData = this._processClientData(clientData);
    
    return await ClientRepository.createClient(processedData);
  }

  /**
   * Atualizar cliente
   * @param {string} id - ID do cliente
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Cliente atualizado
   */
  static async updateClient(id, updateData) {
    if (!id) {
      throw new Error('ID do cliente é obrigatório');
    }

    // Validação básica de dados de atualização
    if (updateData.email && !ValidationHelper.isValidEmail(updateData.email)) {
      throw new Error('Email inválido');
    }

    // Verificar se o cliente existe
    const existingClient = await ClientRepository.getClientById(id);
    if (!existingClient) {
      return null;
    }

    // Verificar conflitos de CPF/CNPJ
    if (updateData.tax_id && updateData.tax_id !== existingClient.tax_id) {
      const clientWithSameTaxId = await ClientRepository.getClientByTaxId(updateData.tax_id);
      if (clientWithSameTaxId && clientWithSameTaxId.id !== id) {
        throw new Error('Já existe um cliente com este CPF/CNPJ');
      }
    }

    // Verificar conflitos de email
    if (updateData.email && updateData.email !== existingClient.email) {
      const clientWithSameEmail = await ClientRepository.getClientByEmail(updateData.email);
      if (clientWithSameEmail && clientWithSameEmail.id !== id) {
        throw new Error('Já existe um cliente com este email');
      }
    }

    // Preparar dados para atualização
    const processedData = this._processClientData(updateData, true);
    
    return await ClientRepository.updateClient(id, processedData);
  }

  /**
   * Deletar cliente
   * @param {string} id - ID do cliente
   * @returns {boolean} Sucesso da operação
   */
  static async deleteClient(id) {
    if (!id) {
      throw new Error('ID do cliente é obrigatório');
    }

    // Verificar se o cliente existe
    const existingClient = await ClientRepository.getClientById(id);
    if (!existingClient) {
      return false;
    }

    // Verificar se o cliente possui contratos
    const hasContracts = await ClientRepository.clientHasContracts(id);
    if (hasContracts) {
      throw new Error('Não é possível deletar cliente que possui contratos');
    }

    return await ClientRepository.deleteClient(id);
  }

  /**
   * Obter contratos do cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista paginada de contratos
   */
  static async getClientContracts(clientId, options) {
    if (!clientId) {
      throw new Error('ID do cliente é obrigatório');
    }

    const { page, limit, status } = options;
    
    // Validar parâmetros
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Parâmetros de paginação inválidos');
    }

    // Verificar se o cliente existe
    const client = await ClientRepository.getClientById(clientId);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    return await ClientRepository.getClientContracts(clientId, {
      page,
      limit,
      status
    });
  }

  /**
   * Obter pagamentos do cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista paginada de pagamentos
   */
  static async getClientPayments(clientId, options) {
    if (!clientId) {
      throw new Error('ID do cliente é obrigatório');
    }

    const { page, limit, status } = options;
    
    // Validar parâmetros
    if (page < 1 || limit < 1 || limit > 100) {
      throw new Error('Parâmetros de paginação inválidos');
    }

    // Verificar se o cliente existe
    const client = await ClientRepository.getClientById(clientId);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    return await ClientRepository.getClientPayments(clientId, {
      page,
      limit,
      status
    });
  }

  /**
   * Buscar clientes por termo
   * @param {string} query - Termo de busca
   * @param {number} limit - Limite de resultados
   * @returns {Array} Lista de clientes
   */
  static async searchClients(query, limit = 10) {
    if (!query || query.length < 2) {
      throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
    }

    if (limit < 1 || limit > 50) {
      throw new Error('Limite deve estar entre 1 e 50');
    }

    return await ClientRepository.searchClients(query, limit);
  }

  /**
   * Obter estatísticas do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Object} Estatísticas do cliente
   */
  static async getClientStats(clientId) {
    if (!clientId) {
      throw new Error('ID do cliente é obrigatório');
    }

    // Verificar se o cliente existe
    const client = await ClientRepository.getClientById(clientId);
    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    return await ClientRepository.getClientStats(clientId);
  }

  // Métodos privados auxiliares
  
  /**
   * Processar dados do cliente antes de salvar
   * @param {Object} clientData - Dados do cliente
   * @param {boolean} isUpdate - Se é uma atualização
   * @returns {Object} Dados processados
   */
  static _processClientData(clientData, isUpdate = false) {
    const processedData = { ...clientData };

    // Normalizar campos de texto
    if (processedData.name) {
      processedData.name = processedData.name.trim();
    }
    
    if (processedData.email) {
      processedData.email = processedData.email.toLowerCase().trim();
    }

    if (processedData.tax_id) {
      processedData.tax_id = processedData.tax_id.replace(/\D/g, ''); // Remove caracteres não numéricos
    }

    if (processedData.phone) {
      processedData.phone = processedData.phone.replace(/\D/g, ''); // Remove caracteres não numéricos
    }

    // Definir status padrão para novos clientes
    if (!isUpdate && !processedData.status) {
      processedData.status = 'active';
    }

    // Remover campos undefined ou null
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === undefined || processedData[key] === null) {
        delete processedData[key];
      }
    });

    return processedData;
  }

  /**
   * Validar se o cliente pode ser deletado
   * @param {string} clientId - ID do cliente
   * @returns {Object} Resultado da validação
   */
  static async validateClientDeletion(clientId) {
    const hasContracts = await ClientRepository.clientHasContracts(clientId);
    const hasPayments = await ClientRepository.clientHasPayments(clientId);

    return {
      canDelete: !hasContracts && !hasPayments,
      reasons: [
        ...(hasContracts ? ['Cliente possui contratos'] : []),
        ...(hasPayments ? ['Cliente possui pagamentos'] : [])
      ]
    };
  }
}

module.exports = { ClientService };