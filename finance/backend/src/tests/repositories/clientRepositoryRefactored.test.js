/**
 * Testes unitários para ClientRepositoryRefactored
 * Testa as operações de acesso a dados do repositório de clientes
 */

const ClientRepositoryRefactored = require('../../repositories/ClientRepositoryRefactored');
const DatabaseHelper = require('../../utils/databaseHelper');
const ValidationHelper = require('../../utils/validationHelper');
const ErrorHandler = require('../../utils/errorHandler');

// Mock das dependências
jest.mock('../../utils/databaseHelper');
jest.mock('../../utils/validationHelper');
jest.mock('../../utils/errorHandler');

// Mock do Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    count: jest.fn().mockReturnThis()
  }))
};

jest.mock('../../config/supabaseAdmin', () => mockSupabase);

describe('ClientRepositoryRefactored', () => {
  let repository;
  let mockQuery;

  beforeEach(() => {
    repository = new ClientRepositoryRefactored();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock query chain
    mockQuery = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      count: jest.fn().mockReturnThis()
    };
    
    mockSupabase.from.mockReturnValue(mockQuery);
    
    // Setup default mocks
    DatabaseHelper.buildPaginationQuery.mockReturnValue(mockQuery);
    DatabaseHelper.buildSortingQuery.mockReturnValue(mockQuery);
    DatabaseHelper.buildFilterQuery.mockReturnValue(mockQuery);
    DatabaseHelper.calculatePagination.mockReturnValue({
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
    
    ValidationHelper.isValidUUID.mockReturnValue(true);
    ValidationHelper.sanitizeString.mockImplementation(str => str?.trim() || '');
  });

  describe('findClientsWithPagination', () => {
    test('should return paginated clients successfully', async () => {
      const filters = { name: 'João', status: 'active' };
      const pagination = { page: 1, limit: 10 };
      const sorting = { field: 'name', order: 'asc' };
      
      const mockClients = [
        { id: '1', name: 'João Silva', email: 'joao@email.com' },
        { id: '2', name: 'João Santos', email: 'santos@email.com' }
      ];
      
      const mockCountResult = { count: 2 };
      
      // Mock para contagem
      const mockCountQuery = { ...mockQuery };
      mockCountQuery.single.mockResolvedValue({ data: mockCountResult, error: null });
      mockSupabase.from.mockReturnValueOnce(mockCountQuery);
      
      // Mock para dados
      mockQuery.single.mockResolvedValue({ data: mockClients, error: null });
      
      DatabaseHelper.calculatePagination.mockReturnValue({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
      
      const result = await repository.findClientsWithPagination(filters, pagination, sorting);
      
      expect(result).toEqual({
        data: mockClients,
        pagination: {
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      });
      
      expect(DatabaseHelper.buildFilterQuery).toHaveBeenCalledWith(expect.any(Object), filters);
      expect(DatabaseHelper.buildSortingQuery).toHaveBeenCalledWith(expect.any(Object), sorting);
      expect(DatabaseHelper.buildPaginationQuery).toHaveBeenCalledWith(expect.any(Object), pagination);
    });

    test('should handle database error', async () => {
      const error = { message: 'Database connection failed' };
      mockQuery.single.mockResolvedValue({ data: null, error });
      
      await expect(repository.findClientsWithPagination({}, {}, {}))
        .rejects.toThrow('Erro ao buscar clientes');
    });

    test('should use default parameters', async () => {
      mockQuery.single.mockResolvedValue({ data: [], error: null });
      
      await repository.findClientsWithPagination();
      
      expect(DatabaseHelper.buildFilterQuery).toHaveBeenCalledWith(expect.any(Object), {});
      expect(DatabaseHelper.buildSortingQuery).toHaveBeenCalledWith(
        expect.any(Object),
        { field: 'created_at', order: 'desc' }
      );
      expect(DatabaseHelper.buildPaginationQuery).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 1, limit: 10 }
      );
    });
  });

  describe('findClientById', () => {
    test('should return client when found', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = { id: clientId, name: 'João Silva' };
      
      mockQuery.single.mockResolvedValue({ data: mockClient, error: null });
      
      const result = await repository.findClientById(clientId);
      
      expect(result).toEqual(mockClient);
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', clientId);
    });

    test('should return null when client not found', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockQuery.single.mockResolvedValue({ data: null, error: null });
      
      const result = await repository.findClientById(clientId);
      
      expect(result).toBeNull();
    });

    test('should throw error for invalid UUID', async () => {
      ValidationHelper.isValidUUID.mockReturnValue(false);
      
      await expect(repository.findClientById('invalid-id'))
        .rejects.toThrow('ID do cliente deve ser um UUID válido');
    });

    test('should handle database error', async () => {
      const error = { message: 'Database error' };
      mockQuery.single.mockResolvedValue({ data: null, error });
      
      await expect(repository.findClientById('123e4567-e89b-12d3-a456-426614174000'))
        .rejects.toThrow('Erro ao buscar cliente por ID');
    });
  });

  describe('findClientByEmail', () => {
    test('should return client when found by email', async () => {
      const email = 'joao@email.com';
      const mockClient = { id: '1', email, name: 'João Silva' };
      
      mockQuery.single.mockResolvedValue({ data: mockClient, error: null });
      
      const result = await repository.findClientByEmail(email);
      
      expect(result).toEqual(mockClient);
      expect(mockQuery.eq).toHaveBeenCalledWith('email', email.toLowerCase());
    });

    test('should return null when client not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null });
      
      const result = await repository.findClientByEmail('notfound@email.com');
      
      expect(result).toBeNull();
    });

    test('should handle case insensitive search', async () => {
      const email = 'JOAO@EMAIL.COM';
      mockQuery.single.mockResolvedValue({ data: null, error: null });
      
      await repository.findClientByEmail(email);
      
      expect(mockQuery.eq).toHaveBeenCalledWith('email', 'joao@email.com');
    });
  });

  describe('findClientByTaxId', () => {
    test('should return client when found by tax_id', async () => {
      const taxId = '12345678901';
      const mockClient = { id: '1', tax_id: taxId, name: 'João Silva' };
      
      ValidationHelper.normalizeTaxId.mockReturnValue(taxId);
      mockQuery.single.mockResolvedValue({ data: mockClient, error: null });
      
      const result = await repository.findClientByTaxId(taxId);
      
      expect(result).toEqual(mockClient);
      expect(ValidationHelper.normalizeTaxId).toHaveBeenCalledWith(taxId);
      expect(mockQuery.eq).toHaveBeenCalledWith('tax_id', taxId);
    });

    test('should return null when client not found', async () => {
      ValidationHelper.normalizeTaxId.mockReturnValue('12345678901');
      mockQuery.single.mockResolvedValue({ data: null, error: null });
      
      const result = await repository.findClientByTaxId('12345678901');
      
      expect(result).toBeNull();
    });
  });

  describe('createClient', () => {
    test('should create client successfully', async () => {
      const clientData = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        tax_id: '12345678901',
        type: 'individual'
      };
      
      const mockCreatedClient = { id: '1', ...clientData, created_at: new Date() };
      
      ValidationHelper.sanitizeString.mockImplementation(str => str?.trim());
      mockQuery.single.mockResolvedValue({ data: mockCreatedClient, error: null });
      
      const result = await repository.createClient(clientData);
      
      expect(result).toEqual(mockCreatedClient);
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          tax_id: '12345678901',
          type: 'individual'
        })
      );
    });

    test('should handle database error during creation', async () => {
      const error = { message: 'Unique constraint violation' };
      mockQuery.single.mockResolvedValue({ data: null, error });
      
      await expect(repository.createClient({})).rejects.toThrow('Erro ao criar cliente');
    });

    test('should sanitize string fields', async () => {
      const clientData = {
        name: '  João Silva  ',
        email: '  joao@email.com  ',
        address: '  Rua das Flores, 123  '
      };
      
      ValidationHelper.sanitizeString.mockImplementation(str => str?.trim());
      mockQuery.single.mockResolvedValue({ data: { id: '1' }, error: null });
      
      await repository.createClient(clientData);
      
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  João Silva  ');
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  joao@email.com  ');
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  Rua das Flores, 123  ');
    });
  });

  describe('updateClient', () => {
    test('should update client successfully', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        name: 'João Santos',
        email: 'joao.santos@email.com'
      };
      
      const mockUpdatedClient = { id: clientId, ...updateData, updated_at: new Date() };
      
      ValidationHelper.sanitizeString.mockImplementation(str => str?.trim());
      mockQuery.single.mockResolvedValue({ data: mockUpdatedClient, error: null });
      
      const result = await repository.updateClient(clientId, updateData);
      
      expect(result).toEqual(mockUpdatedClient);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Santos',
          email: 'joao.santos@email.com',
          updated_at: expect.any(String)
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', clientId);
    });

    test('should throw error for invalid UUID', async () => {
      ValidationHelper.isValidUUID.mockReturnValue(false);
      
      await expect(repository.updateClient('invalid-id', {}))
        .rejects.toThrow('ID do cliente deve ser um UUID válido');
    });

    test('should handle database error during update', async () => {
      const error = { message: 'Update failed' };
      mockQuery.single.mockResolvedValue({ data: null, error });
      
      await expect(repository.updateClient('123e4567-e89b-12d3-a456-426614174000', {}))
        .rejects.toThrow('Erro ao atualizar cliente');
    });
  });

  describe('deleteClient', () => {
    test('should delete client successfully', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockQuery.single.mockResolvedValue({ data: { id: clientId }, error: null });
      
      const result = await repository.deleteClient(clientId);
      
      expect(result).toBe(true);
      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', clientId);
    });

    test('should return false when client not found', async () => {
      mockQuery.single.mockResolvedValue({ data: null, error: null });
      
      const result = await repository.deleteClient('123e4567-e89b-12d3-a456-426614174000');
      
      expect(result).toBe(false);
    });

    test('should throw error for invalid UUID', async () => {
      ValidationHelper.isValidUUID.mockReturnValue(false);
      
      await expect(repository.deleteClient('invalid-id'))
        .rejects.toThrow('ID do cliente deve ser um UUID válido');
    });
  });

  describe('searchClients', () => {
    test('should search clients by term', async () => {
      const searchTerm = 'João';
      const mockResults = [
        { id: '1', name: 'João Silva', email: 'joao@email.com' },
        { id: '2', name: 'João Santos', email: 'santos@email.com' }
      ];
      
      ValidationHelper.sanitizeString.mockReturnValue('João');
      mockQuery.single.mockResolvedValue({ data: mockResults, error: null });
      
      const result = await repository.searchClients(searchTerm);
      
      expect(result).toEqual(mockResults);
      expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith(searchTerm);
      expect(mockQuery.or).toHaveBeenCalledWith(
        `name.ilike.%João%,email.ilike.%João%,tax_id.ilike.%João%`
      );
    });

    test('should handle empty search results', async () => {
      ValidationHelper.sanitizeString.mockReturnValue('NotFound');
      mockQuery.single.mockResolvedValue({ data: [], error: null });
      
      const result = await repository.searchClients('NotFound');
      
      expect(result).toEqual([]);
    });
  });

  describe('getClientContracts', () => {
    test('should return client contracts', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      const mockContracts = [
        { id: '1', client_id: clientId, amount: 1000 },
        { id: '2', client_id: clientId, amount: 2000 }
      ];
      
      mockQuery.single.mockResolvedValue({ data: mockContracts, error: null });
      
      const result = await repository.getClientContracts(clientId);
      
      expect(result).toEqual(mockContracts);
      expect(mockSupabase.from).toHaveBeenCalledWith('contracts');
      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', clientId);
    });
  });

  describe('getClientPayments', () => {
    test('should return client payments', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      const mockPayments = [
        { id: '1', client_id: clientId, amount: 500 },
        { id: '2', client_id: clientId, amount: 750 }
      ];
      
      mockQuery.single.mockResolvedValue({ data: mockPayments, error: null });
      
      const result = await repository.getClientPayments(clientId);
      
      expect(result).toEqual(mockPayments);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', clientId);
    });
  });

  describe('getClientStats', () => {
    test('should return client statistics', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      const mockStats = {
        totalContracts: 5,
        totalPayments: 10,
        totalAmount: 50000
      };
      
      // Mock para contratos
      const mockContractsQuery = { ...mockQuery };
      mockContractsQuery.single.mockResolvedValue({ 
        data: [{ count: 5, total_amount: 30000 }], 
        error: null 
      });
      
      // Mock para pagamentos
      const mockPaymentsQuery = { ...mockQuery };
      mockPaymentsQuery.single.mockResolvedValue({ 
        data: [{ count: 10, total_amount: 20000 }], 
        error: null 
      });
      
      mockSupabase.from
        .mockReturnValueOnce(mockContractsQuery)
        .mockReturnValueOnce(mockPaymentsQuery);
      
      const result = await repository.getClientStats(clientId);
      
      expect(result).toEqual({
        totalContracts: 5,
        totalPayments: 10,
        totalContractAmount: 30000,
        totalPaymentAmount: 20000
      });
    });
  });

  describe('clientHasContracts', () => {
    test('should return true when client has contracts', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockQuery.single.mockResolvedValue({ data: { count: 3 }, error: null });
      
      const result = await repository.clientHasContracts(clientId);
      
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('contracts');
      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', clientId);
    });

    test('should return false when client has no contracts', async () => {
      mockQuery.single.mockResolvedValue({ data: { count: 0 }, error: null });
      
      const result = await repository.clientHasContracts('123e4567-e89b-12d3-a456-426614174000');
      
      expect(result).toBe(false);
    });
  });

  describe('clientHasPayments', () => {
    test('should return true when client has payments', async () => {
      const clientId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockQuery.single.mockResolvedValue({ data: { count: 5 }, error: null });
      
      const result = await repository.clientHasPayments(clientId);
      
      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('payments');
      expect(mockQuery.eq).toHaveBeenCalledWith('client_id', clientId);
    });

    test('should return false when client has no payments', async () => {
      mockQuery.single.mockResolvedValue({ data: { count: 0 }, error: null });
      
      const result = await repository.clientHasPayments('123e4567-e89b-12d3-a456-426614174000');
      
      expect(result).toBe(false);
    });
  });

  describe('private methods', () => {
    describe('_sanitizeClientData', () => {
      test('should sanitize all string fields', () => {
        const clientData = {
          name: '  João Silva  ',
          email: '  joao@email.com  ',
          address: '  Rua das Flores  ',
          phone: '11999999999',
          type: 'individual'
        };
        
        ValidationHelper.sanitizeString.mockImplementation(str => str?.trim());
        
        const result = repository._sanitizeClientData(clientData);
        
        expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  João Silva  ');
        expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  joao@email.com  ');
        expect(ValidationHelper.sanitizeString).toHaveBeenCalledWith('  Rua das Flores  ');
        
        expect(result).toEqual({
          name: 'João Silva',
          email: 'joao@email.com',
          address: 'Rua das Flores',
          phone: '11999999999',
          type: 'individual'
        });
      });
    });
  });
});