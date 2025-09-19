const { HttpStatusCodes, ErrorCodes } = require('./constants');
const { ResponseHelper } = require('./responseHelper');

/**
 * Classe para tratamento centralizado de erros
 * Padroniza respostas de erro e logging
 */
class ErrorHandler {
  /**
   * Trata erros de validação
   * @param {Response} res - Objeto de resposta Express
   * @param {string|Array} errors - Erros de validação
   * @param {string} message - Mensagem personalizada
   */
  static handleValidationError(res, errors, message = 'Dados inválidos') {
    console.error('Validation Error:', errors);
    
    const errorDetails = Array.isArray(errors) ? errors : [errors];
    
    return ResponseHelper.sendValidationError(res, errorDetails);
  }

  /**
   * Trata erros de banco de dados
   * @param {Response} res - Objeto de resposta Express
   * @param {Error} error - Erro do banco de dados
   * @param {string} operation - Operação que causou o erro
   */
  static handleDatabaseError(res, error, operation = 'operação de banco') {
    console.error(`Database Error during ${operation}:`, error);
    
    // Erros específicos do Sequelize/Prisma
    if (error.name === 'SequelizeUniqueConstraintError') {
      return ResponseHelper.sendConflict(res, 'Registro já existe');
    }
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return ResponseHelper.sendValidationError(res, ['Referência inválida']);
    }
    
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message);
      return ErrorHandler.handleValidationError(res, validationErrors);
    }
    
    // Erro genérico de banco
    return ResponseHelper.sendInternalError(res, 'Erro interno do servidor');
  }

  /**
   * Trata erros de autenticação
   * @param {Response} res - Objeto de resposta Express
   * @param {string} message - Mensagem de erro
   */
  static handleAuthenticationError(res, message = 'Credenciais inválidas') {
    console.error('Authentication Error:', message);
    return ResponseHelper.sendUnauthorized(res, message);
  }

  /**
   * Trata erros de autorização
   * @param {Response} res - Objeto de resposta Express
   * @param {string} message - Mensagem de erro
   */
  static handleAuthorizationError(res, message = 'Acesso negado') {
    console.error('Authorization Error:', message);
    return ResponseHelper.sendForbidden(res, message);
  }

  /**
   * Trata erros de recurso não encontrado
   * @param {Response} res - Objeto de resposta Express
   * @param {string} resource - Nome do recurso
   */
  static handleNotFoundError(res, resource = 'Recurso') {
    console.error(`Not Found Error: ${resource}`);
    return ResponseHelper.sendNotFound(res, resource);
  }

  /**
   * Trata erros de conflito
   * @param {Response} res - Objeto de resposta Express
   * @param {string} message - Mensagem de erro
   */
  static handleConflictError(res, message = 'Conflito de dados') {
    console.error('Conflict Error:', message);
    return ResponseHelper.sendConflict(res, message);
  }

  /**
   * Trata erros de rate limiting
   * @param {Response} res - Objeto de resposta Express
   * @param {string} message - Mensagem de erro
   */
  static handleRateLimitError(res, message = 'Muitas tentativas. Tente novamente mais tarde') {
    console.error('Rate Limit Error:', message);
    return ResponseHelper.tooManyRequests(res, message);
  }

  /**
   * Trata erros de arquivo/upload
   * @param {Response} res - Objeto de resposta Express
   * @param {Error} error - Erro de arquivo
   */
  static handleFileError(res, error) {
    console.error('File Error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return ResponseHelper.validationError(res, 'Arquivo muito grande');
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return ResponseHelper.validationError(res, 'Muitos arquivos');
    }
    
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return ResponseHelper.validationError(res, 'Tipo de arquivo não permitido');
    }
    
    return ResponseHelper.internalServerError(res, 'Erro no processamento do arquivo');
  }

  /**
   * Trata erros de rede/API externa
   * @param {Response} res - Objeto de resposta Express
   * @param {Error} error - Erro de rede
   * @param {string} service - Nome do serviço externo
   */
  static handleNetworkError(res, error, service = 'serviço externo') {
    console.error(`Network Error with ${service}:`, error);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return ResponseHelper.serviceUnavailable(res, `${service} indisponível`);
    }
    
    if (error.code === 'ETIMEDOUT') {
      return ResponseHelper.requestTimeout(res, `Timeout ao conectar com ${service}`);
    }
    
    return ResponseHelper.badGateway(res, `Erro de comunicação com ${service}`);
  }

  /**
   * Trata erros genéricos
   * @param {Response} res - Objeto de resposta Express
   * @param {Error} error - Erro genérico
   * @param {string} context - Contexto do erro
   */
  static handleGenericError(res, error, context = 'operação') {
    console.error(`Generic Error during ${context}:`, error);
    
    // Se for um erro conhecido, trata especificamente
    if (error.name === 'ValidationError') {
      return ErrorHandler.handleValidationError(res, [error.message]);
    }
    
    if (error.name === 'CastError') {
      return ResponseHelper.sendValidationError(res, ['Formato de dados inválido']);
    }
    
    if (error.name === 'JsonWebTokenError') {
      return ErrorHandler.handleAuthenticationError(res, 'Token inválido');
    }
    
    if (error.name === 'TokenExpiredError') {
      return ErrorHandler.handleAuthenticationError(res, 'Token expirado');
    }
    
    // Erro genérico
    return ResponseHelper.sendInternalError(res, 'Erro interno do servidor');
  }

  /**
   * Middleware de tratamento de erros para Express
   * @param {Error} error - Erro capturado
   * @param {Request} req - Objeto de requisição Express
   * @param {Response} res - Objeto de resposta Express
   * @param {Function} next - Próximo middleware
   */
  static expressErrorHandler(error, req, res, next) {
    // Log do erro completo para debugging
    console.error('Express Error Handler:', {
      error: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    });

    // Se a resposta já foi enviada, passa para o próximo handler
    if (res.headersSent) {
      return next(error);
    }

    // Trata o erro baseado no tipo
    return ErrorHandler.handleGenericError(res, error, `${req.method} ${req.url}`);
  }

  /**
   * Cria um erro customizado
   * @param {string} message - Mensagem do erro
   * @param {number} statusCode - Código de status HTTP
   * @param {string} code - Código interno do erro
   * @returns {Error} Erro customizado
   */
  static createError(message, statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR, code = ErrorCodes.INTERNAL_ERROR) {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }

  /**
   * Valida se um erro é operacional (esperado)
   * @param {Error} error - Erro a ser validado
   * @returns {boolean} True se for erro operacional
   */
  static isOperationalError(error) {
    if (error.statusCode) {
      return error.statusCode >= 400 && error.statusCode < 500;
    }
    
    const operationalErrors = [
      'ValidationError',
      'CastError',
      'JsonWebTokenError',
      'TokenExpiredError',
      'SequelizeValidationError',
      'SequelizeUniqueConstraintError'
    ];
    
    return operationalErrors.includes(error.name);
  }

  /**
   * Log estruturado de erro
   * @param {Error} error - Erro a ser logado
   * @param {Object} context - Contexto adicional
   */
  static logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode: error.statusCode,
      code: error.code,
      operational: ErrorHandler.isOperationalError(error),
      context
    };
    
    console.error('Structured Error Log:', JSON.stringify(errorLog, null, 2));
  }
}

module.exports = { ErrorHandler };