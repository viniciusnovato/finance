/**
 * Testes unitários para ResponseHelper
 * Testa todas as respostas HTTP padronizadas
 */

const { ResponseHelper } = require('../../utils/responseHelper');
const { HttpStatusCodes } = require('../../utils/constants');

// Mock do objeto response do Express
const createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    statusCode: null,
    jsonData: null
  };
  
  // Capturar os dados enviados
  res.status.mockImplementation((code) => {
    res.statusCode = code;
    return res;
  });
  
  res.json.mockImplementation((data) => {
    res.jsonData = data;
    return res;
  });
  
  return res;
};

describe('ResponseHelper', () => {
  let mockRes;

  beforeEach(() => {
    mockRes = createMockResponse();
  });

  describe('sendSuccess', () => {
    test('should send success response with data', () => {
      const data = { id: 1, name: 'Test' };
      
      ResponseHelper.sendSuccess(mockRes, data);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        id: 1,
        name: 'Test'
      });
    });

    test('should use custom status code when provided', () => {
      const data = { id: 1 };
      
      ResponseHelper.sendSuccess(mockRes, data, HttpStatusCodes.CREATED);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.CREATED);
    });

    test('should handle empty data', () => {
      ResponseHelper.sendSuccess(mockRes);
      
      expect(mockRes.jsonData.success).toBe(true);
      expect(mockRes.jsonData.timestamp).toBeDefined();
    });
  });

  describe('sendError', () => {
    test('should send error response', () => {
      const statusCode = HttpStatusCodes.BAD_REQUEST;
      const message = 'Erro de validação';
      const code = 'VALIDATION_ERROR';
      
      ResponseHelper.sendError(mockRes, statusCode, message, code);
      
      expect(mockRes.status).toHaveBeenCalledWith(statusCode);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message,
          code,
          timestamp: expect.any(String)
        }
      });
    });

    test('should include details when provided', () => {
      const details = { field: 'email', issue: 'invalid format' };
      
      ResponseHelper.sendError(mockRes, HttpStatusCodes.BAD_REQUEST, 'Error', 'CODE', details);
      
      expect(mockRes.jsonData.error.details).toEqual(details);
    });
  });

  describe('sendValidationError', () => {
    test('should send validation error response', () => {
      const validationErrors = [
        { field: 'email', message: 'Email inválido' },
        { field: 'name', message: 'Nome obrigatório' }
      ];
      
      ResponseHelper.sendValidationError(mockRes, validationErrors);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.UNPROCESSABLE_ENTITY);
      expect(mockRes.jsonData.error.code).toBe('VALIDATION_ERROR');
      expect(mockRes.jsonData.error.details.validationErrors).toEqual(validationErrors);
    });
  });

  describe('sendPaginatedResponse', () => {
    test('should send paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        totalPages: 5,
        totalItems: 50,
        limit: 10
      };
      
      ResponseHelper.sendPaginatedResponse(mockRes, data, pagination);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.OK);
      expect(mockRes.jsonData.data).toEqual(data);
      expect(mockRes.jsonData.pagination).toEqual({
        currentPage: 1,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPreviousPage: false
      });
    });
  });

  describe('sendNotFound', () => {
    test('should send not found response', () => {
      ResponseHelper.sendNotFound(mockRes, 'Cliente');
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.NOT_FOUND);
      expect(mockRes.jsonData.error.message).toBe('Cliente não encontrado');
    });
  });

  describe('sendConflict', () => {
    test('should send conflict response', () => {
      ResponseHelper.sendConflict(mockRes, 'Email');
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.CONFLICT);
      expect(mockRes.jsonData.error.message).toBe('Email já existe');
    });
  });

  describe('sendUnauthorized', () => {
    test('should send unauthorized response', () => {
      ResponseHelper.sendUnauthorized(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.UNAUTHORIZED);
      expect(mockRes.jsonData.error.message).toBe('Acesso não autorizado');
    });
  });

  describe('sendForbidden', () => {
    test('should send forbidden response', () => {
      ResponseHelper.sendForbidden(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.FORBIDDEN);
      expect(mockRes.jsonData.error.message).toBe('Acesso proibido');
    });
  });

  describe('sendInternalError', () => {
    test('should send internal error response', () => {
      ResponseHelper.sendInternalError(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.INTERNAL_SERVER_ERROR);
      expect(mockRes.jsonData.error.message).toBe('Erro interno do servidor');
    });
  });

  describe('sendNoContent', () => {
    test('should send no content response', () => {
      ResponseHelper.sendNoContent(mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatusCodes.NO_CONTENT);
    });
  });

  describe('formatPagination', () => {
    test('should format pagination correctly', () => {
      const result = ResponseHelper.formatPagination(2, 10, 25);
      
      expect(result).toEqual({
        page: 2,
        limit: 10,
        totalItems: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true
      });
    });

    test('should handle first page correctly', () => {
      const result = ResponseHelper.formatPagination(1, 10, 25);
      
      expect(result.hasPreviousPage).toBe(false);
      expect(result.hasNextPage).toBe(true);
    });

    test('should handle last page correctly', () => {
      const result = ResponseHelper.formatPagination(3, 10, 25);
      
      expect(result.hasPreviousPage).toBe(true);
      expect(result.hasNextPage).toBe(false);
    });
  });
});