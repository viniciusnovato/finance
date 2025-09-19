const ContractRepository = require('../repositories/ContractRepository');
const ClientRepository = require('../repositories/ClientRepository');
const { ValidationHelper } = require('../utils/validationHelper');
const { DatabaseHelper } = require('../utils/databaseHelper');
const { ErrorHandler } = require('../utils/errorHandler');
const { PaginationDefaults, SearchDefaults, ValidSortFields, ValidSortOrders } = require('../utils/constants');
const { calculatePaymentPercentage } = require('../utils/contractCalculations');
const { formatCurrency, formatDateForDisplay } = require('../utils/formatters');

/**
 * Service refatorado para gerenciamento de contratos
 * Aplica princípios de Clean Code: funções pequenas, responsabilidade única, nomes descritivos
 */
class ContractServiceRefactored {
  /**
   * Busca lista paginada de contratos com filtros
   * @param {Object} searchOptions - Opções de busca e paginação
   * @returns {Promise<Object>} Lista paginada de contratos
   */
  static async findContractsWithPagination(searchOptions) {
    const validatedOptions = ContractServiceRefactored._validateSearchOptions(searchOptions);
    
    try {
      const contractRepository = new ContractRepository();
      const contractsData = await contractRepository.findAll(
        validatedOptions.offset,
        validatedOptions.limit,
        validatedOptions.filters
      );
      return ContractServiceRefactored._formatContractsResponse(contractsData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca contrato específico por ID
   * @param {string} contractId - ID do contrato
   * @returns {Promise<Object|null>} Dados do contrato ou null se não encontrado
   */
  static async findContractById(contractId) {
    ContractServiceRefactored._validateContractId(contractId);
    
    try {
      const contract = await ContractRepository.getContractById(contractId);
      
      if (!contract) {
        return null;
      }
      
      // Enriquecer com estatísticas
      const contractWithStats = await ContractServiceRefactored._enrichContractWithStats(contract);
      return ContractServiceRefactored._formatSingleContract(contractWithStats);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar contrato', error);
    }
  }

  /**
   * Cria novo contrato no sistema
   * @param {Object} contractData - Dados do contrato
   * @returns {Promise<Object>} Contrato criado
   */
  static async createNewContract(contractData) {
    const processedData = await ContractServiceRefactored._processContractDataForCreation(contractData);
    
    await ContractServiceRefactored._validateClientExists(processedData.client_id);
    await ContractServiceRefactored._validateContractNumberUniqueness(processedData.contract_number);
    
    try {
      const newContract = await ContractRepository.createContract(processedData);
      return ContractServiceRefactored._formatSingleContract(newContract);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao criar contrato', error);
    }
  }

  /**
   * Atualiza dados de contrato existente
   * @param {string} contractId - ID do contrato
   * @param {Object} updateData - Dados para atualização
   * @returns {Promise<Object|null>} Contrato atualizado ou null se não encontrado
   */
  static async updateExistingContract(contractId, updateData) {
    ContractServiceRefactored._validateContractId(contractId);
    
    await ContractServiceRefactored._validateContractCanBeUpdated(contractId);
    
    const processedData = ContractServiceRefactored._processContractDataForUpdate(updateData);
    
    if (processedData.contract_number) {
      await ContractServiceRefactored._validateContractNumberUniquenessForUpdate(contractId, processedData.contract_number);
    }
    
    try {
      const updatedContract = await ContractRepository.updateContract(contractId, processedData);
      return updatedContract ? ContractServiceRefactored._formatSingleContract(updatedContract) : null;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao atualizar contrato', error);
    }
  }

  /**
   * Remove contrato do sistema
   * @param {string} contractId - ID do contrato
   * @returns {Promise<boolean>} True se removido com sucesso
   */
  static async removeContractById(contractId) {
    ContractServiceRefactored._validateContractId(contractId);
    
    await ContractServiceRefactored._validateContractCanBeDeleted(contractId);
    
    try {
      return await ContractRepository.deleteContract(contractId);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao remover contrato', error);
    }
  }

  /**
   * Busca pagamentos associados ao contrato
   * @param {string} contractId - ID do contrato
   * @param {Object} paginationOptions - Opções de paginação
   * @returns {Promise<Object>} Lista paginada de pagamentos
   */
  static async findContractPayments(contractId, paginationOptions) {
    ContractServiceRefactored._validateContractId(contractId);
    
    const validatedOptions = ContractServiceRefactored._validatePaginationOptions(paginationOptions);
    
    try {
      const paymentsData = await ContractRepository.getContractPayments(contractId, validatedOptions);
      return ContractServiceRefactored._formatPaymentsResponse(paymentsData);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar pagamentos do contrato', error);
    }
  }

  /**
   * Gera parcelas para o contrato
   * @param {string} contractId - ID do contrato
   * @param {Object} installmentData - Dados das parcelas
   * @returns {Promise<Array>} Lista de parcelas geradas
   */
  static async generateContractInstallments(contractId, installmentData) {
    ContractServiceRefactored._validateContractId(contractId);
    
    const processedInstallmentData = ContractServiceRefactored._processInstallmentData(installmentData);
    
    await ContractServiceRefactored._validateContractCanGenerateInstallments(contractId);
    
    try {
      const installments = await ContractRepository.generateInstallments(contractId, processedInstallmentData);
      return installments.map(installment => ContractServiceRefactored._formatInstallment(installment));
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao gerar parcelas', error);
    }
  }

  /**
   * Busca estatísticas do contrato
   * @param {string} contractId - ID do contrato
   * @returns {Promise<Object>} Estatísticas do contrato
   */
  static async getContractStatistics(contractId) {
    ContractServiceRefactored._validateContractId(contractId);
    
    try {
      const stats = await ContractRepository.getContractStats(contractId);
      return ContractServiceRefactored._formatContractStats(stats);
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar estatísticas do contrato', error);
    }
  }

  /**
   * Busca contratos por termo de pesquisa
   * @param {string} searchTerm - Termo de busca
   * @param {number} resultLimit - Limite de resultados
   * @returns {Promise<Array>} Lista de contratos encontrados
   */
  static async searchContractsByTerm(searchTerm, resultLimit = SearchDefaults.DEFAULT_SEARCH_LIMIT) {
    ContractServiceRefactored._validateSearchTerm(searchTerm);
    ContractServiceRefactored._validateSearchLimit(resultLimit);
    
    try {
      const contracts = await ContractRepository.searchContracts(searchTerm, resultLimit);
      return contracts.map(contract => ContractServiceRefactored._formatSingleContract(contract));
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao buscar contratos', error);
    }
  }

  /**
   * Atualiza status do contrato
   * @param {string} contractId - ID do contrato
   * @param {string} newStatus - Novo status
   * @returns {Promise<Object|null>} Contrato atualizado
   */
  static async updateContractStatus(contractId, newStatus) {
    ContractServiceRefactored._validateContractId(contractId);
    ContractServiceRefactored._validateContractStatus(newStatus);
    
    await ContractServiceRefactored._validateStatusTransition(contractId, newStatus);
    
    try {
      const updatedContract = await ContractRepository.updateContractStatus(contractId, newStatus);
      return updatedContract ? ContractServiceRefactored._formatSingleContract(updatedContract) : null;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao atualizar status do contrato', error);
    }
  }

  /**
   * Gera número único para o contrato
   * @returns {Promise<string>} Número do contrato gerado
   */
  static async generateUniqueContractNumber() {
    try {
      let contractNumber;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (!isUnique && attempts < maxAttempts) {
        contractNumber = ContractServiceRefactored._generateContractNumber();
        const existingContract = await ContractRepository.getContractByNumber(contractNumber);
        isUnique = !existingContract;
        attempts++;
      }
      
      if (!isUnique) {
        throw new Error('Não foi possível gerar número único para o contrato');
      }
      
      return contractNumber;
    } catch (error) {
      ErrorHandler.handleDatabaseError('Erro ao gerar número do contrato', error);
    }
  }

  // Métodos privados para validação
  static _validateContractId(contractId) {
    if (!ValidationHelper.isValidUUID(contractId) && !ValidationHelper.isValidNumber(contractId)) {
      throw new Error('ID do contrato inválido');
    }
  }

  static _validateContractStatus(status) {
    const validStatuses = ['ativo', 'inativo', 'cancelado', 'finalizado', 'suspenso'];
    if (!validStatuses.includes(status)) {
      throw new Error('Status do contrato inválido');
    }
  }

  static _validateSearchOptions(options) {
    const defaults = {
      page: PaginationDefaults.DEFAULT_PAGE,
      limit: PaginationDefaults.DEFAULT_LIMIT,
      sortBy: ValidSortFields.CONTRACT_DEFAULT,
      sortOrder: ValidSortOrders.DEFAULT
    };

    const validated = {
      ...defaults,
      ...options,
      page: Math.max(1, parseInt(options?.page) || defaults.page),
      limit: Math.min(100, Math.max(1, parseInt(options?.limit) || defaults.limit))
    };

    // Calcular offset e preparar filtros
    const offset = (validated.page - 1) * validated.limit;
    const filters = {};
    
    // Extrair filtros das opções
    if (options?.status) filters.status = options.status;
    if (options?.client_id) filters.client_id = options.client_id;
    if (options?.start_date) filters.start_date = options.start_date;
    if (options?.end_date) filters.end_date = options.end_date;

    return {
      ...validated,
      offset,
      filters
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

  // Métodos privados para processamento de dados
  static async _processContractDataForCreation(contractData) {
    const processedData = ContractServiceRefactored._sanitizeContractData(contractData);
    
    // Validações específicas para criação
    if (!processedData.client_id) {
      throw new Error('ID do cliente é obrigatório');
    }
    
    if (!processedData.total_amount || processedData.total_amount <= 0) {
      throw new Error('Valor total do contrato deve ser maior que zero');
    }
    
    if (!processedData.installments || processedData.installments <= 0) {
      throw new Error('Número de parcelas deve ser maior que zero');
    }
    
    if (!processedData.first_due_date) {
      throw new Error('Data do primeiro vencimento é obrigatória');
    }
    
    // Gerar número do contrato se não fornecido
    if (!processedData.contract_number) {
      processedData.contract_number = await ContractServiceRefactored.generateUniqueContractNumber();
    }
    
    // Definir valores padrão
    processedData.status = processedData.status || 'ativo';
    processedData.created_at = new Date();
    
    return processedData;
  }

  static _processContractDataForUpdate(updateData) {
    const processedData = ContractServiceRefactored._sanitizeContractData(updateData, true);
    
    // Validações específicas para atualização
    if (processedData.total_amount !== undefined && processedData.total_amount <= 0) {
      throw new Error('Valor total do contrato deve ser maior que zero');
    }
    
    if (processedData.installments !== undefined && processedData.installments <= 0) {
      throw new Error('Número de parcelas deve ser maior que zero');
    }
    
    processedData.updated_at = new Date();
    
    return processedData;
  }

  static _processInstallmentData(installmentData) {
    const processed = {
      installments: installmentData.installments,
      first_due_date: installmentData.first_due_date,
      payment_day: installmentData.payment_day || null,
      interest_rate: installmentData.interest_rate || 0
    };
    
    if (!processed.installments || processed.installments <= 0) {
      throw new Error('Número de parcelas deve ser maior que zero');
    }
    
    if (!processed.first_due_date) {
      throw new Error('Data do primeiro vencimento é obrigatória');
    }
    
    return processed;
  }

  static _sanitizeContractData(contractData, isUpdate = false) {
    const allowedFields = [
      'client_id', 'contract_number', 'total_amount', 'installments',
      'first_due_date', 'description', 'status', 'interest_rate',
      'payment_day', 'notes'
    ];
    
    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (contractData[field] !== undefined) {
        sanitized[field] = contractData[field];
      }
    });
    
    // Sanitizar strings
    ['contract_number', 'description', 'notes'].forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = ValidationHelper.sanitizeString(sanitized[field]);
      }
    });
    
    // Validar e converter números
    if (sanitized.total_amount) {
      sanitized.total_amount = parseFloat(sanitized.total_amount);
      if (isNaN(sanitized.total_amount)) {
        throw new Error('Valor total do contrato inválido');
      }
    }
    
    if (sanitized.installments) {
      sanitized.installments = parseInt(sanitized.installments);
      if (isNaN(sanitized.installments)) {
        throw new Error('Número de parcelas inválido');
      }
    }
    
    if (sanitized.interest_rate) {
      sanitized.interest_rate = parseFloat(sanitized.interest_rate);
      if (isNaN(sanitized.interest_rate)) {
        throw new Error('Taxa de juros inválida');
      }
    }
    
    if (sanitized.payment_day) {
      sanitized.payment_day = parseInt(sanitized.payment_day);
      if (isNaN(sanitized.payment_day) || sanitized.payment_day < 1 || sanitized.payment_day > 31) {
        throw new Error('Dia de pagamento deve estar entre 1 e 31');
      }
    }
    
    return sanitized;
  }

  static _generateContractNumber() {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `CT${timestamp.slice(-6)}${random}`;
  }

  // Métodos privados para validações assíncronas
  static async _validateClientExists(clientId) {
    try {
      const client = await ClientRepository.getClientById(clientId);
      if (!client) {
        throw new Error('Cliente não encontrado');
      }
    } catch (error) {
      throw new Error(`Erro ao validar cliente: ${error.message}`);
    }
  }

  static async _validateContractNumberUniqueness(contractNumber) {
    if (!contractNumber) return;
    
    try {
      const existingContract = await ContractRepository.getContractByNumber(contractNumber);
      if (existingContract) {
        throw new Error('Número do contrato já existe');
      }
    } catch (error) {
      throw new Error(`Erro ao validar número do contrato: ${error.message}`);
    }
  }

  static async _validateContractNumberUniquenessForUpdate(contractId, contractNumber) {
    try {
      const existingContract = await ContractRepository.getContractByNumber(contractNumber);
      if (existingContract && existingContract.id !== contractId) {
        throw new Error('Número do contrato já existe');
      }
    } catch (error) {
      throw new Error(`Erro ao validar número do contrato: ${error.message}`);
    }
  }

  static async _validateContractCanBeUpdated(contractId) {
    try {
      const contract = await ContractRepository.getContractById(contractId);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }
      
      if (contract.status === 'finalizado') {
        throw new Error('Não é possível alterar contrato finalizado');
      }
    } catch (error) {
      throw new Error(`Erro ao validar contrato: ${error.message}`);
    }
  }

  static async _validateContractCanBeDeleted(contractId) {
    try {
      const contract = await ContractRepository.getContractById(contractId);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }
      
      // Verificar se há pagamentos associados
      const paymentsCount = await ContractRepository.getContractPaymentsCount(contractId);
      if (paymentsCount > 0) {
        throw new Error('Não é possível excluir contrato com pagamentos associados');
      }
    } catch (error) {
      throw new Error(`Erro ao validar exclusão: ${error.message}`);
    }
  }

  static async _validateContractCanGenerateInstallments(contractId) {
    try {
      const contract = await ContractRepository.getContractById(contractId);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }
      
      if (contract.status !== 'ativo') {
        throw new Error('Só é possível gerar parcelas para contratos ativos');
      }
      
      // Verificar se já existem parcelas
      const existingInstallments = await ContractRepository.getContractPaymentsCount(contractId);
      if (existingInstallments > 0) {
        throw new Error('Contrato já possui parcelas geradas');
      }
    } catch (error) {
      throw new Error(`Erro ao validar geração de parcelas: ${error.message}`);
    }
  }

  static async _validateStatusTransition(contractId, newStatus) {
    try {
      const contract = await ContractRepository.getContractById(contractId);
      if (!contract) {
        throw new Error('Contrato não encontrado');
      }
      
      // Regras de transição de status
      const currentStatus = contract.status;
      const invalidTransitions = {
        'finalizado': ['ativo', 'suspenso'],
        'cancelado': ['ativo', 'suspenso', 'finalizado']
      };
      
      if (invalidTransitions[currentStatus]?.includes(newStatus)) {
        throw new Error(`Transição de status inválida: ${currentStatus} -> ${newStatus}`);
      }
    } catch (error) {
      throw new Error(`Erro ao validar transição de status: ${error.message}`);
    }
  }

  // Métodos privados para enriquecimento e formatação
  static async _enrichContractWithStats(contract) {
    try {
      const stats = await ContractServiceRefactored.getContractStatistics(contract.id);
      return { ...contract, stats };
    } catch (error) {
      // Se não conseguir buscar stats, retorna contrato sem elas
      console.warn('Erro ao buscar estatísticas do contrato:', error);
      return contract;
    }
  }

  static _formatContractsResponse(contractsData) {
    return {
      contracts: contractsData.contracts.map(contract => ContractServiceRefactored._formatSingleContract(contract)),
      pagination: contractsData.pagination
    };
  }

  static _formatSingleContract(contract) {
    return {
      ...contract,
      total_amount: parseFloat(contract.total_amount) || 0,
      first_due_date: formatDateForDisplay(contract.first_due_date),
      created_at: formatDateForDisplay(contract.created_at),
      updated_at: contract.updated_at ? formatDateForDisplay(contract.updated_at) : null
    };
  }

  static _formatPaymentsResponse(paymentsData) {
    return {
      payments: paymentsData.payments.map(payment => ({
        ...payment,
        amount: parseFloat(payment.amount) || 0,
        due_date: formatDateForDisplay(payment.due_date),
        payment_date: payment.payment_date ? formatDateForDisplay(payment.payment_date) : null
      })),
      pagination: paymentsData.pagination
    };
  }

  static _formatInstallment(installment) {
    return {
      ...installment,
      amount: parseFloat(installment.amount) || 0,
      due_date: formatDateForDisplay(installment.due_date)
    };
  }

  static _formatContractStats(stats) {
    return {
      ...stats,
      total_amount: formatCurrency(stats.total_amount),
      paid_amount: formatCurrency(stats.paid_amount),
      pending_amount: formatCurrency(stats.pending_amount),
      overdue_amount: formatCurrency(stats.overdue_amount)
    };
  }
}

module.exports = { ContractServiceRefactored };