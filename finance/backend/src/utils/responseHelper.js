const { HttpStatusCodes } = require('./constants');

/**
 * Helper para padronizar respostas da API
 * Centraliza a lógica de formatação de respostas de sucesso e erro
 */
class ResponseHelper {
  /**
   * Envia resposta de sucesso padronizada
   * @param {Object} res - Objeto de resposta do Express
   * @param {Object} data - Dados a serem enviados
   * @param {number} statusCode - Código de status HTTP (padrão: 200)
   */
  static sendSuccess(res, data = {}, statusCode = HttpStatusCodes.OK) {
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      ...data
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Envia resposta de erro padronizada
   * @param {Object} res - Objeto de resposta do Express
   * @param {number} statusCode - Código de status HTTP
   * @param {string} message - Mensagem de erro
   * @param {string} code - Código de erro específico
   * @param {Object} details - Detalhes adicionais do erro (opcional)
   */
  static sendError(res, statusCode, message, code, details = null) {
    const response = {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString()
      }
    };

    if (details) {
      response.error.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Envia resposta de validação com erros específicos
   * @param {Object} res - Objeto de resposta do Express
   * @param {Array} validationErrors - Array de erros de validação
   */
  static sendValidationError(res, validationErrors) {
    return ResponseHelper.sendError(
      res,
      HttpStatusCodes.UNPROCESSABLE_ENTITY,
      'Dados de entrada inválidos',
      'VALIDATION_ERROR',
      { validationErrors }
    );
  }

  /**
   * Envia resposta de dados paginados
   * @param {Object} res - Objeto de resposta do Express
   * @param {Array} data - Array de dados
   * @param {Object} pagination - Informações de paginação
   * @param {Object} meta - Metadados adicionais (opcional)
   */
  static sendPaginatedResponse(res, data, pagination, meta = {}) {
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      data,
      pagination: {
        currentPage: pagination.page,
        totalPages: pagination.totalPages,
        totalItems: pagination.totalItems,
        itemsPerPage: pagination.limit,
        hasNextPage: pagination.page < pagination.totalPages,
        hasPreviousPage: pagination.page > 1
      },
      ...meta
    };

    return res.status(HttpStatusCodes.OK).json(response);
  }

  /**
   * Envia resposta de recurso não encontrado
   * @param {Object} res - Objeto de resposta do Express
   * @param {string} resource - Nome do recurso não encontrado
   * @param {string} code - Código de erro específico
   */
  static sendNotFound(res, resource = 'Recurso', code = 'RESOURCE_NOT_FOUND') {
    return ResponseHelper.sendError(
      res,
      HttpStatusCodes.NOT_FOUND,
      `${resource} não encontrado`,
      code
    );
  }

  /**
   * Envia resposta de conflito (recurso já existe)
   * @param {Object} res - Objeto de resposta do Express
   * @param {string} resource - Nome do recurso em conflito
   * @param {string} code - Código de erro específico
   */
  static sendConflict(res, resource = 'Recurso', code = 'RESOURCE_CONFLICT') {
    return ResponseHelper.sendError(
      res,
      HttpStatusCodes.CONFLICT,
      `${resource} já existe`,
      code
    );
  }

  /**
   * Envia resposta de acesso não autorizado
   * @param {Object} res - Objeto de resposta do Express
   * @param {string} message - Mensagem personalizada (opcional)
   */
  static sendUnauthorized(res, message = 'Acesso não autorizado') {
    return ResponseHelper.sendError(
      res,
      HttpStatusCodes.UNAUTHORIZED,
      message,
      'UNAUTHORIZED_ACCESS'
    );
  }

  /**
   * Envia resposta de acesso proibido
   * @param {Object} res - Objeto de resposta do Express
   * @param {string} message - Mensagem personalizada (opcional)
   */
  static sendForbidden(res, message = 'Acesso proibido') {
    return ResponseHelper.sendError(
      res,
      HttpStatusCodes.FORBIDDEN,
      message,
      'FORBIDDEN_ACCESS'
    );
  }

  /**
   * Resposta de timeout de requisição (408)
   */
  static requestTimeout(res, message = 'Timeout da requisição') {
    return res.status(HttpStatusCodes.REQUEST_TIMEOUT).json({
      success: false,
      message,
      code: 'REQUEST_TIMEOUT',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de muitas requisições (429)
   */
  static tooManyRequests(res, message = 'Muitas requisições') {
    return res.status(HttpStatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message,
      code: 'TOO_MANY_REQUESTS',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de bad gateway (502)
   */
  static badGateway(res, message = 'Bad Gateway') {
    return res.status(HttpStatusCodes.BAD_GATEWAY).json({
      success: false,
      message,
      code: 'BAD_GATEWAY',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de serviço indisponível (503)
   */
  static serviceUnavailable(res, message = 'Serviço indisponível') {
    return res.status(HttpStatusCodes.SERVICE_UNAVAILABLE).json({
      success: false,
      message,
      code: 'SERVICE_UNAVAILABLE',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Envia resposta de erro interno do servidor
   * @param {Object} res - Objeto de resposta do Express
   * @param {string} message - Mensagem de erro (opcional)
   * @param {Object} details - Detalhes do erro (opcional)
   */
  static sendInternalError(res, message = 'Erro interno do servidor', details = null) {
    return ResponseHelper.sendError(
      res,
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
      message,
      'INTERNAL_SERVER_ERROR',
      details
    );
  }

  /**
   * Envia resposta de operação bem-sucedida sem conteúdo
   * @param {Object} res - Objeto de resposta do Express
   */
  static sendNoContent(res) {
    return res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  /**
   * Formata dados de paginação para resposta
   * @param {number} page - Página atual
   * @param {number} limit - Itens por página
   * @param {number} totalItems - Total de itens
   * @returns {Object} Objeto de paginação formatado
   */
  static formatPagination(page, limit, totalItems) {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    };
  }
}

module.exports = { ResponseHelper };