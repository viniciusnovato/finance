/**
 * Testes unitários para DatabaseHelper
 * Testa as operações auxiliares de banco de dados
 */

const { DatabaseHelper } = require('../../utils/databaseHelper');
const { ValidationHelper } = require('../../utils/validationHelper');

// Mock do ValidationHelper
jest.mock('../../utils/validationHelper');

// Mock de query do Supabase
const createMockQuery = () => ({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  gt: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lt: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  like: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  and: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  count: jest.fn().mockReturnThis()
});

describe('DatabaseHelper', () => {
  let mockQuery;

  beforeEach(() => {
    mockQuery = createMockQuery();
    jest.clearAllMocks();
    
    // Setup default mocks
    ValidationHelper.sanitizeString.mockImplementation(str => str?.trim() || '');
    ValidationHelper.isValidString.mockReturnValue(true);
  });

  describe('buildFilterQuery', () => {
    test('should apply simple equality filters', () => {
      const filters = {
        name: 'João Silva',
        status: 'active',
        type: 'individual'
      };
      
      const result = DatabaseHelper.buildFilterQuery(mockQuery, filters);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'João Silva');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'individual');
      expect(result).toBe(mockQuery);
    });

    test('should handle empty filters', () => {
      const result = DatabaseHelper.buildFilterQuery(mockQuery, {});
      
      expect(mockQuery.eq).not.toHaveBeenCalled();
      expect(result).toBe(mockQuery);
    });

    test('should handle null and undefined filters', () => {
      const filters = {
        name: 'João',
        email: null,
        phone: undefined,
        status: ''
      };
      
      const result = DatabaseHelper.buildFilterQuery(mockQuery, filters);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('name', 'João');
      expect(mockQuery.eq).not.toHaveBeenCalledWith('email', null);
      expect(mockQuery.eq).not.toHaveBeenCalledWith('phone', undefined);
      expect(mockQuery.eq).not.toHaveBeenCalledWith('status', '');
      expect(result).toBe(mockQuery);
    });

    test('should handle range filters', () => {
      const filters = {
        'amount_gte': 1000,
        'amount_lte': 5000,
        'created_at_gt': '2023-01-01',
        'updated_at_lt': '2023-12-31'
      };
      
      const result = DatabaseHelper.buildFilterQuery(mockQuery, filters);
      
      expect(mockQuery.gte).toHaveBeenCalledWith('amount', 1000);
      expect(mockQuery.lte).toHaveBeenCalledWith('amount', 5000);
      expect(mockQuery.gt).toHaveBeenCalledWith('created_at', '2023-01-01');
      expect(mockQuery.lt).toHaveBeenCalledWith('updated_at', '2023-12-31');
      expect(result).toBe(mockQuery);
    });

    test('should handle like filters', () => {
      const filters = {
        'name_like': '%João%',
        'email_ilike': '%@gmail.com%'
      };
      
      const result = DatabaseHelper.buildFilterQuery(mockQuery, filters);
      
      expect(mockQuery.like).toHaveBeenCalledWith('name', '%João%');
      expect(mockQuery.ilike).toHaveBeenCalledWith('email', '%@gmail.com%');
      expect(result).toBe(mockQuery);
    });

    test('should handle in filters', () => {
      const filters = {
        'status_in': ['active', 'pending', 'completed']
      };
      
      const result = DatabaseHelper.buildFilterQuery(mockQuery, filters);
      
      expect(mockQuery.in).toHaveBeenCalledWith('status', ['active', 'pending', 'completed']);
      expect(result).toBe(mockQuery);
    });

    test('should handle not equal filters', () => {
      const filters = {
        'status_neq': 'deleted'
      };
      
      const result = DatabaseHelper.buildFilterQuery(mockQuery, filters);
      
      expect(mockQuery.neq).toHaveBeenCalledWith('status', 'deleted');
      expect(result).toBe(mockQuery);
    });
  });

  describe('buildSortingQuery', () => {
    test('should apply ascending sort', () => {
      const sorting = { field: 'name', order: 'asc' };
      
      const result = DatabaseHelper.buildSortingQuery(mockQuery, sorting);
      
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toBe(mockQuery);
    });

    test('should apply descending sort', () => {
      const sorting = { field: 'created_at', order: 'desc' };
      
      const result = DatabaseHelper.buildSortingQuery(mockQuery, sorting);
      
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(mockQuery);
    });

    test('should use default sorting when not provided', () => {
      const result = DatabaseHelper.buildSortingQuery(mockQuery);
      
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(mockQuery);
    });

    test('should handle empty sorting object', () => {
      const result = DatabaseHelper.buildSortingQuery(mockQuery, {});
      
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(mockQuery);
    });

    test('should normalize sort order case', () => {
      const sorting = { field: 'name', order: 'ASC' };
      
      const result = DatabaseHelper.buildSortingQuery(mockQuery, sorting);
      
      expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      expect(result).toBe(mockQuery);
    });

    test('should handle multiple sort fields', () => {
      const sorting = [
        { field: 'status', order: 'asc' },
        { field: 'created_at', order: 'desc' }
      ];
      
      const result = DatabaseHelper.buildSortingQuery(mockQuery, sorting);
      
      expect(mockQuery.order).toHaveBeenCalledWith('status', { ascending: true });
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toBe(mockQuery);
    });
  });

  describe('buildPaginationQuery', () => {
    test('should apply pagination with valid parameters', () => {
      const pagination = { page: 2, limit: 20 };
      
      const result = DatabaseHelper.buildPaginationQuery(mockQuery, pagination);
      
      // page 2, limit 20 = range(20, 39)
      expect(mockQuery.range).toHaveBeenCalledWith(20, 39);
      expect(result).toBe(mockQuery);
    });

    test('should use default pagination when not provided', () => {
      const result = DatabaseHelper.buildPaginationQuery(mockQuery);
      
      // page 1, limit 10 = range(0, 9)
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toBe(mockQuery);
    });

    test('should handle first page correctly', () => {
      const pagination = { page: 1, limit: 10 };
      
      const result = DatabaseHelper.buildPaginationQuery(mockQuery, pagination);
      
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toBe(mockQuery);
    });

    test('should handle large page numbers', () => {
      const pagination = { page: 100, limit: 50 };
      
      const result = DatabaseHelper.buildPaginationQuery(mockQuery, pagination);
      
      // page 100, limit 50 = range(4950, 4999)
      expect(mockQuery.range).toHaveBeenCalledWith(4950, 4999);
      expect(result).toBe(mockQuery);
    });

    test('should handle invalid page numbers', () => {
      const pagination = { page: 0, limit: 10 };
      
      const result = DatabaseHelper.buildPaginationQuery(mockQuery, pagination);
      
      // Should default to page 1
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toBe(mockQuery);
    });

    test('should handle invalid limit', () => {
      const pagination = { page: 1, limit: 0 };
      
      const result = DatabaseHelper.buildPaginationQuery(mockQuery, pagination);
      
      // Should default to limit 10
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toBe(mockQuery);
    });
  });

  describe('calculatePagination', () => {
    test('should calculate pagination correctly', () => {
      const total = 95;
      const page = 2;
      const limit = 10;
      
      const result = DatabaseHelper.calculatePagination(total, page, limit);
      
      expect(result).toEqual({
        page: 2,
        limit: 10,
        total: 95,
        totalPages: 10,
        hasNext: true,
        hasPrev: true
      });
    });

    test('should handle first page', () => {
      const total = 25;
      const page = 1;
      const limit = 10;
      
      const result = DatabaseHelper.calculatePagination(total, page, limit);
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: true,
        hasPrev: false
      });
    });

    test('should handle last page', () => {
      const total = 25;
      const page = 3;
      const limit = 10;
      
      const result = DatabaseHelper.calculatePagination(total, page, limit);
      
      expect(result).toEqual({
        page: 3,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNext: false,
        hasPrev: true
      });
    });

    test('should handle single page', () => {
      const total = 5;
      const page = 1;
      const limit = 10;
      
      const result = DatabaseHelper.calculatePagination(total, page, limit);
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 5,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    test('should handle empty results', () => {
      const total = 0;
      const page = 1;
      const limit = 10;
      
      const result = DatabaseHelper.calculatePagination(total, page, limit);
      
      expect(result).toEqual({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      });
    });

    test('should handle exact division', () => {
      const total = 100;
      const page = 5;
      const limit = 20;
      
      const result = DatabaseHelper.calculatePagination(total, page, limit);
      
      expect(result).toEqual({
        page: 5,
        limit: 20,
        total: 100,
        totalPages: 5,
        hasNext: false,
        hasPrev: true
      });
    });
  });

  describe('validateAndSanitizeData', () => {
    test('should validate and sanitize data successfully', () => {
      const data = {
        name: '  João Silva  ',
        email: '  joao@email.com  ',
        age: 30,
        active: true
      };
      
      const requiredFields = ['name', 'email'];
      
      ValidationHelper.validateRequiredFields.mockReturnValue([]);
      ValidationHelper.sanitizeString.mockImplementation(str => str?.trim());
      
      const result = DatabaseHelper.validateAndSanitizeData(data, requiredFields);
      
      expect(ValidationHelper.validateRequiredFields).toHaveBeenCalledWith(data, requiredFields);
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  João Silva  ');
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  joao@email.com  ');
      
      expect(result).toEqual({
        name: 'João Silva',
        email: 'joao@email.com',
        age: 30,
        active: true
      });
    });

    test('should throw error for missing required fields', () => {
      const data = { name: 'João' };
      const requiredFields = ['name', 'email'];
      
      ValidationHelper.validateRequiredFields.mockReturnValue([
        { field: 'email', message: 'Email é obrigatório' }
      ]);
      
      expect(() => {
        DatabaseHelper.validateAndSanitizeData(data, requiredFields);
      }).toThrow('Dados obrigatórios não informados: email');
    });

    test('should handle data without string fields', () => {
      const data = {
        age: 30,
        active: true,
        score: 95.5
      };
      
      ValidationHelper.validateRequiredFields.mockReturnValue([]);
      
      const result = DatabaseHelper.validateAndSanitizeData(data, []);
      
      expect(ValidationHelper.sanitizeString).not.toHaveBeenCalled();
      expect(result).toEqual(data);
    });

    test('should handle empty data', () => {
      ValidationHelper.validateRequiredFields.mockReturnValue([]);
      
      const result = DatabaseHelper.validateAndSanitizeData({}, []);
      
      expect(result).toEqual({});
    });
  });

  describe('executeTransaction', () => {
    test('should execute transaction successfully', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }] }),
        release: jest.fn()
      };
      
      const mockPool = {
        connect: jest.fn().mockResolvedValue(mockClient)
      };
      
      const transactionFn = jest.fn().mockResolvedValue({ success: true });
      
      const result = await DatabaseHelper.executeTransaction(mockPool, transactionFn);
      
      expect(mockPool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(transactionFn).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    test('should rollback transaction on error', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce() // BEGIN
          .mockResolvedValueOnce(), // ROLLBACK
        release: jest.fn()
      };
      
      const mockPool = {
        connect: jest.fn().mockResolvedValue(mockClient)
      };
      
      const error = new Error('Transaction failed');
      const transactionFn = jest.fn().mockRejectedValue(error);
      
      await expect(DatabaseHelper.executeTransaction(mockPool, transactionFn))
        .rejects.toThrow('Transaction failed');
      
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(transactionFn).toHaveBeenCalledWith(mockClient);
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    test('should release client even if rollback fails', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce() // BEGIN
          .mockRejectedValueOnce(new Error('Rollback failed')), // ROLLBACK
        release: jest.fn()
      };
      
      const mockPool = {
        connect: jest.fn().mockResolvedValue(mockClient)
      };
      
      const transactionFn = jest.fn().mockRejectedValue(new Error('Transaction failed'));
      
      await expect(DatabaseHelper.executeTransaction(mockPool, transactionFn))
        .rejects.toThrow('Transaction failed');
      
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('buildSearchQuery', () => {
    test('should build search query for multiple fields', () => {
      const searchTerm = 'João';
      const searchFields = ['name', 'email', 'tax_id'];
      
      ValidationHelper.sanitizeString.mockReturnValue('João');
      
      const result = DatabaseHelper.buildSearchQuery(mockQuery, searchTerm, searchFields);
      
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith(searchTerm);
      expect(mockQuery.or).toHaveBeenCalledWith(
        'name.ilike.%João%,email.ilike.%João%,tax_id.ilike.%João%'
      );
      expect(result).toBe(mockQuery);
    });

    test('should handle single search field', () => {
      const searchTerm = 'Silva';
      const searchFields = ['name'];
      
      ValidationHelper.sanitizeString.mockReturnValue('Silva');
      
      const result = DatabaseHelper.buildSearchQuery(mockQuery, searchTerm, searchFields);
      
      expect(mockQuery.or).toHaveBeenCalledWith('name.ilike.%Silva%');
      expect(result).toBe(mockQuery);
    });

    test('should handle empty search term', () => {
      ValidationHelper.sanitizeString.mockReturnValue('');
      
      const result = DatabaseHelper.buildSearchQuery(mockQuery, '', ['name']);
      
      expect(mockQuery.or).not.toHaveBeenCalled();
      expect(result).toBe(mockQuery);
    });

    test('should handle empty search fields', () => {
      ValidationHelper.sanitizeString.mockReturnValue('João');
      
      const result = DatabaseHelper.buildSearchQuery(mockQuery, 'João', []);
      
      expect(mockQuery.or).not.toHaveBeenCalled();
      expect(result).toBe(mockQuery);
    });
  });

  describe('formatDatabaseError', () => {
    test('should format unique constraint violation', () => {
      const error = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "clients_email_key"',
        detail: 'Key (email)=(joao@email.com) already exists.'
      };
      
      const result = DatabaseHelper.formatDatabaseError(error);
      
      expect(result).toEqual({
        type: 'UNIQUE_VIOLATION',
        message: 'Registro duplicado: email já existe',
        field: 'email',
        originalError: error
      });
    });

    test('should format foreign key violation', () => {
      const error = {
        code: '23503',
        message: 'insert or update on table "payments" violates foreign key constraint',
        detail: 'Key (client_id)=(123) is not present in table "clients".'
      };
      
      const result = DatabaseHelper.formatDatabaseError(error);
      
      expect(result).toEqual({
        type: 'FOREIGN_KEY_VIOLATION',
        message: 'Referência inválida: client_id não existe',
        field: 'client_id',
        originalError: error
      });
    });

    test('should format not null violation', () => {
      const error = {
        code: '23502',
        message: 'null value in column "name" violates not-null constraint',
        column: 'name'
      };
      
      const result = DatabaseHelper.formatDatabaseError(error);
      
      expect(result).toEqual({
        type: 'NOT_NULL_VIOLATION',
        message: 'Campo obrigatório: name não pode ser nulo',
        field: 'name',
        originalError: error
      });
    });

    test('should format generic database error', () => {
      const error = {
        code: '42000',
        message: 'syntax error at or near "SELCT"'
      };
      
      const result = DatabaseHelper.formatDatabaseError(error);
      
      expect(result).toEqual({
        type: 'DATABASE_ERROR',
        message: 'Erro no banco de dados: syntax error at or near "SELCT"',
        originalError: error
      });
    });

    test('should handle error without code', () => {
      const error = {
        message: 'Connection timeout'
      };
      
      const result = DatabaseHelper.formatDatabaseError(error);
      
      expect(result).toEqual({
        type: 'DATABASE_ERROR',
        message: 'Erro no banco de dados: Connection timeout',
        originalError: error
      });
    });
  });
});