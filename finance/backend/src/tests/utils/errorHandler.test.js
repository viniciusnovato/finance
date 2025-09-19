/**
 * Testes unitários para ErrorHandler
 * Testa o tratamento centralizado de erros
 */

const { ErrorHandler } = require('../../utils/errorHandler');
const { ResponseHelper } = require('../../utils/responseHelper');

// Mock do ResponseHelper
jest.mock('../../utils/responseHelper');

// Mock do objeto response do Express
const createMockResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  headersSent: false
});

// Mock do objeto request do Express
const createMockRequest = () => ({
  method: 'GET',
  url: '/api/test',
  ip: '127.0.0.1',
  headers: { 'user-agent': 'test-agent' }
});

describe('ErrorHandler', () => {
  let mockRes;
  let mockReq;
  let mockNext;
  let consoleErrorSpy;

  beforeEach(() => {
    mockRes = createMockResponse();
    mockReq = createMockRequest();
    mockNext = jest.fn();
    
    // Mock console.error para evitar logs durante os testes
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Limpar mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('handleValidationError', () => {
    test('should handle validation error with details', () => {
      const error = {
        name: 'ValidationError',
        message: 'Dados inválidos',
        details: [
          { field: 'email', message: 'Email inválido' },
          { field: 'phone', message: 'Telefone obrigatório' }
        ]
      };

      ErrorHandler.handleValidationError(mockRes, error.details, error.message);

      expect(ResponseHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        error.details
      );
    });

    test('should handle validation error without details', () => {
      const error = {
        name: 'ValidationError',
        message: 'Erro de validação'
      };

      ErrorHandler.handleValidationError(mockRes, [], error.message);

      expect(ResponseHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        []
      );
    });
  });

  describe('handleDatabaseError', () => {
    test('should handle unique constraint violation', () => {
      const error = {
        name: 'SequelizeUniqueConstraintError',
        message: 'Duplicate entry'
      };

      ErrorHandler.handleDatabaseError(mockRes, error);

      expect(ResponseHelper.sendConflict).toHaveBeenCalledWith(
        mockRes,
        'Registro já existe'
      );
    });

    test('should handle foreign key constraint violation', () => {
      const error = {
        name: 'SequelizeForeignKeyConstraintError',
        message: 'Foreign key violation'
      };

      ErrorHandler.handleDatabaseError(mockRes, error);

      expect(ResponseHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        ['Referência inválida']
      );
    });

    test('should handle not null constraint violation', () => {
      const error = {
        code: '23502', // PostgreSQL not null violation
        message: 'null value in column violates not-null constraint'
      };

      ErrorHandler.handleDatabaseError(mockRes, error);

      expect(ResponseHelper.sendInternalError).toHaveBeenCalledWith(
        mockRes,
        'Erro interno do servidor'
      );
    });

    test('should handle connection timeout', () => {
      const error = {
        code: 'ETIMEDOUT',
        message: 'Connection timeout'
      };

      ErrorHandler.handleDatabaseError(mockRes, error);

      expect(ResponseHelper.sendInternalError).toHaveBeenCalledWith(
        mockRes,
        'Erro interno do servidor'
      );
    });

    test('should handle generic database error', () => {
      const error = {
        message: 'Generic database error'
      };

      ErrorHandler.handleDatabaseError(mockRes, error);

      expect(ResponseHelper.sendInternalError).toHaveBeenCalledWith(
        mockRes,
        'Erro interno do servidor'
      );
    });
  });

  describe('handleAuthenticationError', () => {
    test('should handle authentication error', () => {
      const error = {
        name: 'AuthenticationError',
        message: 'Token inválido'
      };

      ErrorHandler.handleAuthenticationError(mockRes, error.message);

      expect(ResponseHelper.sendUnauthorized).toHaveBeenCalledWith(
        mockRes,
        'Token inválido'
      );
    });

    test('should use default message for authentication error', () => {
      const error = {
        name: 'AuthenticationError'
      };

      ErrorHandler.handleAuthenticationError(mockRes);

      expect(ResponseHelper.sendUnauthorized).toHaveBeenCalledWith(
        mockRes,
        'Credenciais inválidas'
      );
    });
  });

  describe('handleAuthorizationError', () => {
    test('should handle authorization error', () => {
      const error = {
        name: 'AuthorizationError',
        message: 'Acesso negado'
      };

      ErrorHandler.handleAuthorizationError(mockRes, error.message);

      expect(ResponseHelper.sendForbidden).toHaveBeenCalledWith(
        mockRes,
        'Acesso negado'
      );
    });

    test('should use default message for authorization error', () => {
      const error = {
        name: 'AuthorizationError'
      };

      ErrorHandler.handleAuthorizationError(mockRes);

      expect(ResponseHelper.sendForbidden).toHaveBeenCalledWith(
        mockRes,
        'Acesso negado'
      );
    });
  });

  describe('handleNotFoundError', () => {
    test('should handle not found error', () => {
      const error = {
        name: 'NotFoundError',
        message: 'Cliente não encontrado'
      };

      ErrorHandler.handleNotFoundError(mockRes, error.message);

      expect(ResponseHelper.sendNotFound).toHaveBeenCalledWith(
        mockRes,
        'Cliente não encontrado'
      );
    });

    test('should use default message for not found error', () => {
      const error = {
        name: 'NotFoundError'
      };

      ErrorHandler.handleNotFoundError(mockRes);

      expect(ResponseHelper.sendNotFound).toHaveBeenCalledWith(
        mockRes,
        'Recurso'
      );
    });
  });

  describe('handleNetworkError', () => {
    test('should handle connection refused error', () => {
      const error = {
        code: 'ECONNREFUSED',
        message: 'Connection refused'
      };

      ErrorHandler.handleNetworkError(mockRes, error);

      expect(ResponseHelper.serviceUnavailable).toHaveBeenCalledWith(
        mockRes,
        'serviço externo indisponível'
      );
    });

    test('should handle DNS lookup error', () => {
      const error = {
        code: 'ENOTFOUND',
        message: 'DNS lookup failed'
      };

      ErrorHandler.handleNetworkError(mockRes, error);

      expect(ResponseHelper.serviceUnavailable).toHaveBeenCalledWith(
        mockRes,
        'serviço externo indisponível'
      );
    });

    test('should handle generic network error', () => {
      const error = {
        message: 'Network error'
      };

      ErrorHandler.handleNetworkError(mockRes, error);

      expect(ResponseHelper.badGateway).toHaveBeenCalledWith(
        mockRes,
        'Erro de comunicação com serviço externo'
      );
    });
  });

  describe('handleGenericError', () => {
    test('should handle validation error in generic handler', () => {
      const error = {
        name: 'ValidationError',
        message: 'Dados inválidos'
      };

      ErrorHandler.handleGenericError(mockRes, error);

      expect(ResponseHelper.sendValidationError).toHaveBeenCalled();
    });

    test('should handle cast error in generic handler', () => {
      const error = {
        name: 'CastError',
        message: 'Formato inválido'
      };

      ErrorHandler.handleGenericError(mockRes, error);

      expect(ResponseHelper.sendValidationError).toHaveBeenCalledWith(
        mockRes,
        ['Formato de dados inválido']
      );
    });



    test('should handle generic error', () => {
      const error = new Error('Erro genérico');

      ErrorHandler.handleGenericError(mockRes, error);

      expect(ResponseHelper.sendInternalError).toHaveBeenCalled();
    });

    test('should log error details', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      ErrorHandler.handleGenericError(mockRes, error);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('expressErrorHandler', () => {
    test('should skip if headers already sent', () => {
      mockRes.headersSent = true;
      const error = new Error('Test error');

      ErrorHandler.expressErrorHandler(error, mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(ResponseHelper.sendInternalError).not.toHaveBeenCalled();
    });

    test('should handle validation error in Express middleware', () => {
      const error = {
        name: 'ValidationError',
        message: 'Validation failed'
      };

      ErrorHandler.expressErrorHandler(error, mockReq, mockRes, mockNext);

      expect(ResponseHelper.sendValidationError).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle authentication error in Express middleware', () => {
      const error = {
        name: 'JsonWebTokenError',
        message: 'Invalid token'
      };

      ErrorHandler.expressErrorHandler(error, mockReq, mockRes, mockNext);

      expect(ResponseHelper.sendUnauthorized).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle generic error in Express middleware', () => {
      const error = new Error('Generic error');

      ErrorHandler.expressErrorHandler(error, mockReq, mockRes, mockNext);

      expect(ResponseHelper.sendInternalError).toHaveBeenCalledWith(
        mockRes,
        'Erro interno do servidor'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should log request details with error', () => {
      const error = new Error('Test error');

      ErrorHandler.expressErrorHandler(error, mockReq, mockRes, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Express Error Handler:',
        expect.objectContaining({
          error: 'Test error',
          url: '/api/test',
          method: 'GET'
        })
      );
    });
  });

  describe('createError', () => {
    test('should create error with message and status code', () => {
      const error = ErrorHandler.createError('Test message', 400, 'TEST_ERROR');
      
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error).toBeInstanceOf(Error);
    });

    test('should create error with default values', () => {
      const error = ErrorHandler.createError('Test message');
      
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('isOperationalError', () => {
    test('should identify operational errors', () => {
      const operationalError = new Error('Validation failed');
      operationalError.name = 'ValidationError';
      
      const result = ErrorHandler.isOperationalError(operationalError);
      expect(result).toBe(true);
      
      // Test with status code
      const statusError = new Error('Bad request');
      statusError.statusCode = 400;
      
      const statusResult = ErrorHandler.isOperationalError(statusError);
      expect(statusResult).toBe(true);
    });

    test('should identify non-operational errors', () => {
      const nonOperationalErrors = [
        new Error('Generic error'),
        { name: 'SyntaxError' },
        { name: 'ReferenceError' },
        { message: 'Unknown error' }
      ];

      nonOperationalErrors.forEach(error => {
        expect(ErrorHandler.isOperationalError(error)).toBe(false);
      });
    });
  });
});