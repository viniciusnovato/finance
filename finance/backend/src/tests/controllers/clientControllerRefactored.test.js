/**
 * Testes unitários para ClientControllerRefactored
 * Testa as operações de controle HTTP do controlador de clientes
 */

const ClientControllerRefactored = require('../../controllers/ClientControllerRefactored');
const ResponseHelper = require('../../utils/responseHelper');
const ErrorHandler = require('../../utils/errorHandler');

// Mock das dependências
jest.mock('../../utils/responseHelper');
jest.mock('../../utils/errorHandler');

// Mock do serviço
const createMockService = () => ({
  findClientsWithPagination: jest.fn(),
  findClientById: jest.fn(),
  createNewClient: jest.fn(),
  updateExistingClient: jest.fn(),
  removeClient: jest.fn(),
  searchClients: jest.fn(),
  getClientContracts: jest.fn(),
  getClientPayments: jest.fn(),
  getClientStatistics: jest.fn()
});

// Mock do request e response
const createMockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  ...overrides
});

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
  };
  return res;
};

const createMockNext = () => jest.fn();

describe('ClientControllerRefactored', () => {
  let controller;
  let mockService;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockService = createMockService();
    controller = new ClientControllerRefactored(mockService);
    mockReq = createMockReq();
    mockRes = createMockRes();
    mockNext = createMockNext();
    
    // Limpar mocks
    jest.clearAllMocks();
    
    // Configurar mocks padrão do ResponseHelper
    ResponseHelper.success.mockReturnValue({ status: 200, data: {} });
    ResponseHelper.created.mockReturnValue({ status: 201, data: {} });
    ResponseHelper.noContent.mockReturnValue({ status: 204 });
    ResponseHelper.error.mockReturnValue({ status: 500, error: 'Internal Server Error' });
    ResponseHelper.badRequest.mockReturnValue({ status: 400, error: 'Bad Request' });
    ResponseHelper.notFound.mockReturnValue({ status: 404, error: 'Not Found' });
    ResponseHelper.paginated.mockReturnValue({ status: 200, data: [], pagination: {} });
  });

  describe('constructor', () => {
    test('should throw error if service is not provided', () => {
      expect(() => new ClientControllerRefactored()).toThrow('Service é obrigatório');
    });

    test('should initialize with service', () => {
      const controller = new ClientControllerRefactored(mockService);
      expect(controller.clientService).toBe(mockService);
    });
  });

  describe('getClients', () => {
    test('should return paginated clients successfully', async () => {
      const mockResult = {
        data: [{ id: '1', name: 'João Silva' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };
      
      mockReq.query = {
        page: '1',
        limit: '10',
        name: 'João',
        status: 'active',
        sortBy: 'name',
        sortOrder: 'asc'
      };
      
      mockService.findClientsWithPagination.mockResolvedValue(mockResult);
      
      await controller.getClients(mockReq, mockRes, mockNext);
      
      expect(mockService.findClientsWithPagination).toHaveBeenCalledWith(
        { name: 'João', status: 'active' },
        { page: 1, limit: 10 },
        { field: 'name', order: 'asc' }
      );
      
      expect(ResponseHelper.paginated).toHaveBeenCalledWith(
        mockResult.data,
        mockResult.pagination,
        'Clientes encontrados com sucesso'
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    test('should handle service error', async () => {
      const error = new Error('Service error');
      mockService.findClientsWithPagination.mockRejectedValue(error);
      
      await controller.getClients(mockReq, mockRes, mockNext);
      
      expect(ErrorHandler.handleControllerError).toHaveBeenCalledWith(
        error,
        mockReq,
        mockRes,
        mockNext
      );
    });

    test('should use default query parameters', async () => {
      mockService.findClientsWithPagination.mockResolvedValue({ data: [], pagination: {} });
      
      await controller.getClients(mockReq, mockRes, mockNext);
      
      expect(mockService.findClientsWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 },
        { field: 'created_at', order: 'desc' }
      );
    });

    test('should parse numeric query parameters correctly', async () => {
      mockReq.query = { page: '2', limit: '20' };
      mockService.findClientsWithPagination.mockResolvedValue({ data: [], pagination: {} });
      
      await controller.getClients(mockReq, mockRes, mockNext);
      
      expect(mockService.findClientsWithPagination).toHaveBeenCalledWith(
        {},
        { page: 2, limit: 20 },
        { field: 'created_at', order: 'desc' }
      );
    });
  });

  describe('getClientById', () => {
    test('should return client when found', async () => {
      const clientId = '123';
      const mockClient = { id: clientId, name: 'João Silva' };
      
      mockReq.params = { id: clientId };
      mockService.findClientById.mockResolvedValue(mockClient);
      
      await controller.getClientById(mockReq, mockRes, mockNext);
      
      expect(mockService.findClientById).toHaveBeenCalledWith(clientId);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockClient,
        'Cliente encontrado com sucesso'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle client not found', async () => {
      const error = new Error('Cliente não encontrado');
      mockService.findClientById.mockRejectedValue(error);
      
      await controller.getClientById(mockReq, mockRes, mockNext);
      
      expect(ErrorHandler.handleControllerError).toHaveBeenCalledWith(
        error,
        mockReq,
        mockRes,
        mockNext
      );
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
      
      const mockCreatedClient = { id: '123', ...clientData };
      
      mockReq.body = clientData;
      mockService.createNewClient.mockResolvedValue(mockCreatedClient);
      
      await controller.createClient(mockReq, mockRes, mockNext);
      
      expect(mockService.createNewClient).toHaveBeenCalledWith(clientData);
      expect(ResponseHelper.created).toHaveBeenCalledWith(
        mockCreatedClient,
        'Cliente criado com sucesso'
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    test('should handle validation error', async () => {
      const error = new Error('Email inválido');
      mockService.createNewClient.mockRejectedValue(error);
      
      await controller.createClient(mockReq, mockRes, mockNext);
      
      expect(ErrorHandler.handleControllerError).toHaveBeenCalledWith(
        error,
        mockReq,
        mockRes,
        mockNext
      );
    });

    test('should handle empty request body', async () => {
      mockReq.body = {};
      
      await controller.createClient(mockReq, mockRes, mockNext);
      
      expect(mockService.createNewClient).toHaveBeenCalledWith({});
    });
  });

  describe('updateClient', () => {
    test('should update client successfully', async () => {
      const clientId = '123';
      const updateData = {
        name: 'João Santos',
        email: 'joao.santos@email.com'
      };
      
      const mockUpdatedClient = { id: clientId, ...updateData };
      
      mockReq.params = { id: clientId };
      mockReq.body = updateData;
      mockService.updateExistingClient.mockResolvedValue(mockUpdatedClient);
      
      await controller.updateClient(mockReq, mockRes, mockNext);
      
      expect(mockService.updateExistingClient).toHaveBeenCalledWith(clientId, updateData);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockUpdatedClient,
        'Cliente atualizado com sucesso'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle client not found during update', async () => {
      const error = new Error('Cliente não encontrado');
      mockService.updateExistingClient.mockRejectedValue(error);
      
      await controller.updateClient(mockReq, mockRes, mockNext);
      
      expect(ErrorHandler.handleControllerError).toHaveBeenCalledWith(
        error,
        mockReq,
        mockRes,
        mockNext
      );
    });
  });

  describe('deleteClient', () => {
    test('should delete client successfully', async () => {
      const clientId = '123';
      
      mockReq.params = { id: clientId };
      mockService.removeClient.mockResolvedValue(true);
      
      await controller.deleteClient(mockReq, mockRes, mockNext);
      
      expect(mockService.removeClient).toHaveBeenCalledWith(clientId);
      expect(ResponseHelper.noContent).toHaveBeenCalledWith('Cliente excluído com sucesso');
      expect(mockRes.status).toHaveBeenCalledWith(204);
    });

    test('should handle client with dependencies', async () => {
      const error = new Error('Não é possível excluir cliente com contratos ativos');
      mockService.removeClient.mockRejectedValue(error);
      
      await controller.deleteClient(mockReq, mockRes, mockNext);
      
      expect(ErrorHandler.handleControllerError).toHaveBeenCalledWith(
        error,
        mockReq,
        mockRes,
        mockNext
      );
    });
  });

  describe('searchClients', () => {
    test('should search clients successfully', async () => {
      const searchTerm = 'João';
      const mockResults = [{ id: '1', name: 'João Silva' }];
      
      mockReq.query = { q: searchTerm };
      mockService.searchClients.mockResolvedValue(mockResults);
      
      await controller.searchClients(mockReq, mockRes, mockNext);
      
      expect(mockService.searchClients).toHaveBeenCalledWith(searchTerm);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResults,
        'Busca realizada com sucesso'
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    test('should handle missing search term', async () => {
      mockReq.query = {};
      
      await controller.searchClients(mockReq, mockRes, mockNext);
      
      expect(ResponseHelper.badRequest).toHaveBeenCalledWith(
        'Parâmetro de busca (q) é obrigatório'
      );
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('should handle empty search term', async () => {
      mockReq.query = { q: '' };
      
      await controller.searchClients(mockReq, mockRes, mockNext);
      
      expect(ResponseHelper.badRequest).toHaveBeenCalledWith(
        'Parâmetro de busca (q) é obrigatório'
      );
    });
  });

  describe('getClientContracts', () => {
    test('should return client contracts successfully', async () => {
      const clientId = '123';
      const mockContracts = [{ id: '1', client_id: clientId }];
      
      mockReq.params = { id: clientId };
      mockService.getClientContracts.mockResolvedValue(mockContracts);
      
      await controller.getClientContracts(mockReq, mockRes, mockNext);
      
      expect(mockService.getClientContracts).toHaveBeenCalledWith(clientId);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockContracts,
        'Contratos do cliente encontrados com sucesso'
      );
    });

    test('should handle client not found', async () => {
      const error = new Error('Cliente não encontrado');
      mockService.getClientContracts.mockRejectedValue(error);
      
      await controller.getClientContracts(mockReq, mockRes, mockNext);
      
      expect(ErrorHandler.handleControllerError).toHaveBeenCalledWith(
        error,
        mockReq,
        mockRes,
        mockNext
      );
    });
  });

  describe('getClientPayments', () => {
    test('should return client payments successfully', async () => {
      const clientId = '123';
      const mockPayments = [{ id: '1', client_id: clientId }];
      
      mockReq.params = { id: clientId };
      mockService.getClientPayments.mockResolvedValue(mockPayments);
      
      await controller.getClientPayments(mockReq, mockRes, mockNext);
      
      expect(mockService.getClientPayments).toHaveBeenCalledWith(clientId);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockPayments,
        'Pagamentos do cliente encontrados com sucesso'
      );
    });
  });

  describe('getClientStatistics', () => {
    test('should return client statistics successfully', async () => {
      const clientId = '123';
      const mockStats = {
        totalContracts: 5,
        totalPayments: 10,
        totalAmount: 50000
      };
      
      mockReq.params = { id: clientId };
      mockService.getClientStatistics.mockResolvedValue(mockStats);
      
      await controller.getClientStatistics(mockReq, mockRes, mockNext);
      
      expect(mockService.getClientStatistics).toHaveBeenCalledWith(clientId);
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockStats,
        'Estatísticas do cliente encontradas com sucesso'
      );
    });
  });

  describe('private methods', () => {
    describe('_extractFilters', () => {
      test('should extract valid filters from query', () => {
        const query = {
          name: 'João',
          email: 'joao@email.com',
          status: 'active',
          type: 'individual',
          page: '1', // Should be ignored
          limit: '10', // Should be ignored
          sortBy: 'name', // Should be ignored
          sortOrder: 'asc' // Should be ignored
        };
        
        const filters = controller._extractFilters(query);
        
        expect(filters).toEqual({
          name: 'João',
          email: 'joao@email.com',
          status: 'active',
          type: 'individual'
        });
      });

      test('should return empty object for empty query', () => {
        const filters = controller._extractFilters({});
        expect(filters).toEqual({});
      });

      test('should ignore undefined and null values', () => {
        const query = {
          name: 'João',
          email: undefined,
          status: null,
          type: ''
        };
        
        const filters = controller._extractFilters(query);
        
        expect(filters).toEqual({
          name: 'João'
        });
      });
    });

    describe('_extractPagination', () => {
      test('should extract pagination with valid values', () => {
        const query = { page: '2', limit: '20' };
        
        const pagination = controller._extractPagination(query);
        
        expect(pagination).toEqual({
          page: 2,
          limit: 20
        });
      });

      test('should use default values for invalid input', () => {
        const query = { page: 'invalid', limit: 'invalid' };
        
        const pagination = controller._extractPagination(query);
        
        expect(pagination).toEqual({
          page: 1,
          limit: 10
        });
      });

      test('should use default values for empty query', () => {
        const pagination = controller._extractPagination({});
        
        expect(pagination).toEqual({
          page: 1,
          limit: 10
        });
      });
    });

    describe('_extractSorting', () => {
      test('should extract sorting with valid values', () => {
        const query = { sortBy: 'name', sortOrder: 'asc' };
        
        const sorting = controller._extractSorting(query);
        
        expect(sorting).toEqual({
          field: 'name',
          order: 'asc'
        });
      });

      test('should use default values for empty query', () => {
        const sorting = controller._extractSorting({});
        
        expect(sorting).toEqual({
          field: 'created_at',
          order: 'desc'
        });
      });

      test('should normalize sort order', () => {
        const query = { sortBy: 'name', sortOrder: 'DESC' };
        
        const sorting = controller._extractSorting(query);
        
        expect(sorting).toEqual({
          field: 'name',
          order: 'desc'
        });
      });
    });
  });
});