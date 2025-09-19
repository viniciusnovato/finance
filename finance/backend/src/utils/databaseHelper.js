const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, DEFAULT_SORT_ORDER } = require('./constants');
const { ValidationHelper } = require('./validationHelper');

/**
 * Helper para operações comuns de banco de dados
 * Centraliza lógicas de paginação, ordenação e filtros
 */
class DatabaseHelper {
  /**
   * Processa parâmetros de paginação
   * @param {Object} query - Query parameters da requisição
   * @returns {Object} Parâmetros de paginação processados
   */
  static processPaginationParams(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(query.limit) || DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;

    return {
      page,
      limit,
      offset
    };
  }

  /**
   * Processa parâmetros de ordenação
   * @param {Object} query - Query parameters da requisição
   * @param {Array} allowedFields - Campos permitidos para ordenação
   * @param {string} defaultField - Campo padrão para ordenação
   * @returns {Object} Parâmetros de ordenação processados
   */
  static processSortParams(query, allowedFields = [], defaultField = 'id') {
    const sortBy = query.sortBy || defaultField;
    const sortOrder = (query.sortOrder || DEFAULT_SORT_ORDER).toUpperCase();

    // Valida campo de ordenação
    const validSortBy = allowedFields.includes(sortBy) ? sortBy : defaultField;
    
    // Valida ordem de ordenação
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder) ? sortOrder : 'ASC';

    return {
      sortBy: validSortBy,
      sortOrder: validSortOrder,
      orderClause: [[validSortBy, validSortOrder]]
    };
  }

  /**
   * Processa filtros de busca
   * @param {Object} query - Query parameters da requisição
   * @param {Array} searchableFields - Campos pesquisáveis
   * @returns {Object} Condições de busca processadas
   */
  static processSearchParams(query, searchableFields = []) {
    const search = query.search?.trim();
    
    if (!search || searchableFields.length === 0) {
      return { searchConditions: null };
    }

    // Cria condições OR para busca em múltiplos campos
    const searchConditions = {
      [Op.or]: searchableFields.map(field => ({
        [field]: {
          [Op.iLike]: `%${search}%`
        }
      }))
    };

    return { searchConditions, searchTerm: search };
  }

  /**
   * Processa filtros de data
   * @param {Object} query - Query parameters da requisição
   * @param {string} dateField - Campo de data para filtrar
   * @returns {Object} Condições de filtro de data
   */
  static processDateFilters(query, dateField = 'createdAt') {
    const dateConditions = {};
    
    if (query.startDate && ValidationHelper.isValidDate(query.startDate)) {
      dateConditions[Op.gte] = new Date(query.startDate);
    }
    
    if (query.endDate && ValidationHelper.isValidDate(query.endDate)) {
      const endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      dateConditions[Op.lte] = endDate;
    }

    return Object.keys(dateConditions).length > 0 
      ? { [dateField]: dateConditions }
      : {};
  }

  /**
   * Processa filtros de status
   * @param {Object} query - Query parameters da requisição
   * @param {Array} validStatuses - Status válidos
   * @returns {Object} Condições de filtro de status
   */
  static processStatusFilters(query, validStatuses = []) {
    const status = query.status;
    
    if (!status || !validStatuses.includes(status)) {
      return {};
    }

    return { status };
  }

  /**
   * Constrói condições WHERE completas
   * @param {Object} params - Parâmetros de filtro
   * @returns {Object} Condições WHERE do Sequelize
   */
  static buildWhereConditions(params) {
    const conditions = {};
    
    // Adiciona condições de busca
    if (params.searchConditions) {
      Object.assign(conditions, params.searchConditions);
    }
    
    // Adiciona filtros de data
    if (params.dateConditions) {
      Object.assign(conditions, params.dateConditions);
    }
    
    // Adiciona filtros de status
    if (params.statusConditions) {
      Object.assign(conditions, params.statusConditions);
    }
    
    // Adiciona filtros customizados
    if (params.customConditions) {
      Object.assign(conditions, params.customConditions);
    }

    return conditions;
  }

  /**
   * Calcula metadados de paginação
   * @param {number} totalCount - Total de registros
   * @param {number} page - Página atual
   * @param {number} limit - Limite por página
   * @returns {Object} Metadados de paginação
   */
  static calculatePaginationMeta(totalCount, page, limit) {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    
    return {
      currentPage: page,
      totalPages,
      totalCount,
      pageSize: limit,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    };
  }

  /**
   * Formata resposta paginada
   * @param {Array} data - Dados da consulta
   * @param {Object} pagination - Parâmetros de paginação
   * @param {number} totalCount - Total de registros
   * @returns {Object} Resposta formatada
   */
  static formatPaginatedResponse(data, pagination, totalCount) {
    const meta = DatabaseHelper.calculatePaginationMeta(
      totalCount,
      pagination.page,
      pagination.limit
    );

    return {
      data,
      meta,
      success: true
    };
  }

  /**
   * Sanitiza campos de entrada
   * @param {Object} data - Dados a serem sanitizados
   * @param {Array} allowedFields - Campos permitidos
   * @returns {Object} Dados sanitizados
   */
  static sanitizeFields(data, allowedFields) {
    const sanitized = {};
    
    allowedFields.forEach(field => {
      if (data.hasOwnProperty(field)) {
        const value = data[field];
        
        // Sanitiza strings
        if (typeof value === 'string') {
          sanitized[field] = ValidationHelper.sanitizeString(value);
        } else {
          sanitized[field] = value;
        }
      }
    });

    return sanitized;
  }

  /**
   * Valida campos obrigatórios
   * @param {Object} data - Dados a serem validados
   * @param {Array} requiredFields - Campos obrigatórios
   * @returns {Array} Lista de erros de validação
   */
  static validateRequiredFields(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!data.hasOwnProperty(field) || 
          data[field] === null || 
          data[field] === undefined || 
          (typeof data[field] === 'string' && data[field].trim() === '')) {
        errors.push(`Campo '${field}' é obrigatório`);
      }
    });

    return errors;
  }

  /**
   * Constrói opções de consulta do Sequelize
   * @param {Object} params - Parâmetros da consulta
   * @returns {Object} Opções do Sequelize
   */
  static buildQueryOptions(params) {
    const options = {};
    
    // Adiciona condições WHERE
    if (params.where) {
      options.where = params.where;
    }
    
    // Adiciona ordenação
    if (params.order) {
      options.order = params.order;
    }
    
    // Adiciona paginação
    if (params.limit) {
      options.limit = params.limit;
    }
    
    if (params.offset) {
      options.offset = params.offset;
    }
    
    // Adiciona includes
    if (params.include) {
      options.include = params.include;
    }
    
    // Adiciona atributos
    if (params.attributes) {
      options.attributes = params.attributes;
    }

    return options;
  }

  /**
   * Executa transação de banco de dados
   * @param {Function} callback - Função a ser executada na transação
   * @param {Object} sequelize - Instância do Sequelize
   * @returns {Promise} Resultado da transação
   */
  static async executeTransaction(callback, sequelize) {
    const transaction = await sequelize.transaction();
    
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Converte dados para formato de resposta
   * @param {Object|Array} data - Dados a serem convertidos
   * @param {Array} excludeFields - Campos a serem excluídos
   * @returns {Object|Array} Dados convertidos
   */
  static toResponseFormat(data, excludeFields = ['password', 'deletedAt']) {
    if (!data) return null;
    
    const convert = (item) => {
      if (!item) return null;
      
      const plain = item.toJSON ? item.toJSON() : item;
      
      excludeFields.forEach(field => {
        delete plain[field];
      });
      
      return plain;
    };
    
    return Array.isArray(data) 
      ? data.map(convert)
      : convert(data);
  }
}

// Importa operadores do Sequelize se disponível
try {
  const { Op } = require('sequelize');
  DatabaseHelper.Op = Op;
} catch (error) {
  // Fallback se Sequelize não estiver disponível
  DatabaseHelper.Op = {};
}

module.exports = { DatabaseHelper };