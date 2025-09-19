/**
 * Testes unitários para ClientServiceRefactored
 * Testa a lógica de negócio do serviço de clientes
 */

const ClientServiceRefactored = require('../../services/ClientServiceRefactored');
const ValidationHelper = require('../../utils/validationHelper');
const ErrorHandler = require('../../utils/errorHandler');

// Mock das dependências
jest.mock('../../utils/validationHelper');
jest.mock('../../utils/errorHandler');

// Mock do repositório
const createMockRepository = () => ({
  findClientsWithPagination: jest.fn(),
  findClientById: jest.fn(),
  findClientByEmail: jest.fn(),
  findClientByTaxId: jest.fn(),
  createClient: jest.fn(),
  updateClient: jest.fn(),
  deleteClient: jest.fn(),
  searchClients: jest.fn(),
  getClientContracts: jest.fn(),
  getClientPayments: jest.fn(),
  getClientStats: jest.fn(),
  clientHasContracts: jest.fn(),
  clientHasPayments: jest.fn()
});

describe('ClientServiceRefactored', () => {
  let service;
  let mockRepository;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new ClientServiceRefactored(mockRepository);
    
    // Limpar mocks
    jest.clearAllMocks();
    
    // Configurar mocks padrão do ValidationHelper
    ValidationHelper.isValidEmail.mockReturnValue(true);
    ValidationHelper.isValidPhone.mockReturnValue(true);
    ValidationHelper.isValidCPF.mockReturnValue(true);
    ValidationHelper.isValidCNPJ.mockReturnValue(true);
    ValidationHelper.isValidString.mockReturnValue(true);
    ValidationHelper.sanitizeString.mockImplementation(str => str?.trim() || '');
    ValidationHelper.normalizePhone.mockImplementation(phone => phone?.replace(/\D/g, '') || '');
    ValidationHelper.normalizeTaxId.mockImplementation(taxId => taxId?.replace(/\D/g, '') || '');
    ValidationHelper.validateRequiredFields.mockReturnValue([]);
  });

  describe('constructor', () => {
    test('should throw error if repository is not provided', () => {
      expect(() => new ClientServiceRefactored()).toThrow('Repository é obrigatório');
    });

    test('should initialize with repository', () => {
      const service = new ClientServiceRefactored(mockRepository);
      expect(service.clientRepository).toBe(mockRepository);
    });
  });

  describe('findClientsWithPagination', () => {
    test('should return paginated clients successfully', async () => {
      const filters = { name: 'João', status: 'active' };
      const pagination = { page: 1, limit: 10 };
      const sorting = { field: 'name', order: 'asc' };
      
      const mockResult = {
        data: [{ id: 1, name: 'João Silva' }],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 }
      };
      
      mockRepository.findClientsWithPagination.mockResolvedValue(mockResult);
      
      const result = await service.findClientsWithPagination(filters, pagination, sorting);
      
      expect(mockRepository.findClientsWithPagination).toHaveBeenCalledWith(
        filters,
        pagination,
        sorting
      );
      expect(result).toEqual(mockResult);
    });

    test('should handle repository error', async () => {
      const error = new Error('Database error');
      mockRepository.findClientsWithPagination.mockRejectedValue(error);
      
      await expect(service.findClientsWithPagination({}, {}, {}))
        .rejects.toThrow('Erro ao buscar clientes');
    });

    test('should use default parameters when not provided', async () => {
      mockRepository.findClientsWithPagination.mockResolvedValue({ data: [], pagination: {} });
      
      await service.findClientsWithPagination();
      
      expect(mockRepository.findClientsWithPagination).toHaveBeenCalledWith(
        {},
        { page: 1, limit: 10 },
        { field: 'created_at', order: 'desc' }
      );
    });
  });

  describe('findClientById', () => {
    test('should return client when found', async () => {
      const clientId = '123';
      const mockClient = { id: clientId, name: 'João Silva' };
      
      mockRepository.findClientById.mockResolvedValue(mockClient);
      
      const result = await service.findClientById(clientId);
      
      expect(mockRepository.findClientById).toHaveBeenCalledWith(clientId);
      expect(result).toEqual(mockClient);
    });

    test('should throw error when client not found', async () => {
      const clientId = '123';
      mockRepository.findClientById.mockResolvedValue(null);
      
      await expect(service.findClientById(clientId))
        .rejects.toThrow('Cliente não encontrado');
    });

    test('should throw error for invalid ID', async () => {
      await expect(service.findClientById(''))
        .rejects.toThrow('ID do cliente é obrigatório');
      
      await expect(service.findClientById(null))
        .rejects.toThrow('ID do cliente é obrigatório');
    });
  });

  describe('createNewClient', () => {
    const validClientData = {
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      tax_id: '12345678901',
      type: 'individual'
    };

    test('should create client successfully', async () => {
      const mockCreatedClient = { id: '123', ...validClientData };
      
      mockRepository.findClientByEmail.mockResolvedValue(null);
      mockRepository.findClientByTaxId.mockResolvedValue(null);
      mockRepository.createClient.mockResolvedValue(mockCreatedClient);
      
      const result = await service.createNewClient(validClientData);
      
      expect(result).toEqual(mockCreatedClient);
      expect(mockRepository.createClient).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'João Silva',
          email: 'joao@email.com'
        })
      );
    });

    test('should throw error for invalid email', async () => {
      ValidationHelper.isValidEmail.mockReturnValue(false);
      
      await expect(service.createNewClient(validClientData))
        .rejects.toThrow('Email inválido');
    });

    test('should throw error for invalid phone', async () => {
      ValidationHelper.isValidPhone.mockReturnValue(false);
      
      await expect(service.createNewClient(validClientData))
        .rejects.toThrow('Telefone inválido');
    });

    test('should throw error for invalid CPF when type is individual', async () => {
      ValidationHelper.isValidCPF.mockReturnValue(false);
      
      await expect(service.createNewClient({ ...validClientData, type: 'individual' }))
        .rejects.toThrow('CPF inválido');
    });

    test('should throw error for invalid CNPJ when type is company', async () => {
      ValidationHelper.isValidCNPJ.mockReturnValue(false);
      
      await expect(service.createNewClient({ ...validClientData, type: 'company' }))
        .rejects.toThrow('CNPJ inválido');
    });

    test('should throw error when email already exists', async () => {
      mockRepository.findClientByEmail.mockResolvedValue({ id: '456' });
      
      await expect(service.createNewClient(validClientData))
        .rejects.toThrow('Email já está em uso');
    });

    test('should throw error when tax_id already exists', async () => {
      mockRepository.findClientByEmail.mockResolvedValue(null);
      mockRepository.findClientByTaxId.mockResolvedValue({ id: '456' });
      
      await expect(service.createNewClient(validClientData))
        .rejects.toThrow('CPF/CNPJ já está em uso');
    });

    test('should handle required fields validation', async () => {
      ValidationHelper.validateRequiredFields.mockReturnValue([
        { field: 'name', message: 'Nome é obrigatório' }
      ]);
      
      await expect(service.createNewClient({}))
        .rejects.toThrow('Dados obrigatórios não informados');
    });
  });

  describe('updateExistingClient', () => {
    const clientId = '123';
    const updateData = {
      name: 'João Santos',
      email: 'joao.santos@email.com'
    };

    test('should update client successfully', async () => {
      const existingClient = { id: clientId, name: 'João Silva', email: 'joao@email.com' };
      const updatedClient = { ...existingClient, ...updateData };
      
      mockRepository.findClientById.mockResolvedValue(existingClient);
      mockRepository.findClientByEmail.mockResolvedValue(null);
      mockRepository.updateClient.mockResolvedValue(updatedClient);
      
      const result = await service.updateExistingClient(clientId, updateData);
      
      expect(result).toEqual(updatedClient);
      expect(mockRepository.updateClient).toHaveBeenCalledWith(clientId, expect.any(Object));
    });

    test('should throw error when client not found', async () => {
      mockRepository.findClientById.mockResolvedValue(null);
      
      await expect(service.updateExistingClient(clientId, updateData))
        .rejects.toThrow('Cliente não encontrado');
    });

    test('should throw error when email is already in use by another client', async () => {
      const existingClient = { id: clientId, email: 'joao@email.com' };
      const anotherClient = { id: '456', email: 'joao.santos@email.com' };
      
      mockRepository.findClientById.mockResolvedValue(existingClient);
      mockRepository.findClientByEmail.mockResolvedValue(anotherClient);
      
      await expect(service.updateExistingClient(clientId, updateData))
        .rejects.toThrow('Email já está em uso por outro cliente');
    });

    test('should allow updating with same email', async () => {
      const existingClient = { id: clientId, email: 'joao@email.com' };
      const updatedClient = { ...existingClient, name: 'João Santos' };
      
      mockRepository.findClientById.mockResolvedValue(existingClient);
      mockRepository.findClientByEmail.mockResolvedValue(existingClient); // Mesmo cliente
      mockRepository.updateClient.mockResolvedValue(updatedClient);
      
      const result = await service.updateExistingClient(clientId, { 
        name: 'João Santos',
        email: 'joao@email.com' // Mesmo email
      });
      
      expect(result).toEqual(updatedClient);
    });
  });

  describe('removeClient', () => {
    const clientId = '123';

    test('should remove client successfully when no dependencies', async () => {
      mockRepository.findClientById.mockResolvedValue({ id: clientId });
      mockRepository.clientHasContracts.mockResolvedValue(false);
      mockRepository.clientHasPayments.mockResolvedValue(false);
      mockRepository.deleteClient.mockResolvedValue(true);
      
      const result = await service.removeClient(clientId);
      
      expect(result).toBe(true);
      expect(mockRepository.deleteClient).toHaveBeenCalledWith(clientId);
    });

    test('should throw error when client has contracts', async () => {
      mockRepository.findClientById.mockResolvedValue({ id: clientId });
      mockRepository.clientHasContracts.mockResolvedValue(true);
      
      await expect(service.removeClient(clientId))
        .rejects.toThrow('Não é possível excluir cliente com contratos ativos');
    });

    test('should throw error when client has payments', async () => {
      mockRepository.findClientById.mockResolvedValue({ id: clientId });
      mockRepository.clientHasContracts.mockResolvedValue(false);
      mockRepository.clientHasPayments.mockResolvedValue(true);
      
      await expect(service.removeClient(clientId))
        .rejects.toThrow('Não é possível excluir cliente com pagamentos registrados');
    });

    test('should throw error when client not found', async () => {
      mockRepository.findClientById.mockResolvedValue(null);
      
      await expect(service.removeClient(clientId))
        .rejects.toThrow('Cliente não encontrado');
    });
  });

  describe('searchClients', () => {
    test('should search clients successfully', async () => {
      const searchTerm = 'João';
      const mockResults = [{ id: '1', name: 'João Silva' }];
      
      mockRepository.searchClients.mockResolvedValue(mockResults);
      
      const result = await service.searchClients(searchTerm);
      
      expect(result).toEqual(mockResults);
      expect(mockRepository.searchClients).toHaveBeenCalledWith(searchTerm);
    });

    test('should throw error for empty search term', async () => {
      await expect(service.searchClients(''))
        .rejects.toThrow('Termo de busca é obrigatório');
    });

    test('should throw error for short search term', async () => {
      await expect(service.searchClients('Jo'))
        .rejects.toThrow('Termo de busca deve ter pelo menos 3 caracteres');
    });
  });

  describe('getClientContracts', () => {
    test('should get client contracts successfully', async () => {
      const clientId = '123';
      const mockContracts = [{ id: '1', client_id: clientId }];
      
      mockRepository.findClientById.mockResolvedValue({ id: clientId });
      mockRepository.getClientContracts.mockResolvedValue(mockContracts);
      
      const result = await service.getClientContracts(clientId);
      
      expect(result).toEqual(mockContracts);
      expect(mockRepository.getClientContracts).toHaveBeenCalledWith(clientId);
    });

    test('should throw error when client not found', async () => {
      mockRepository.findClientById.mockResolvedValue(null);
      
      await expect(service.getClientContracts('123'))
        .rejects.toThrow('Cliente não encontrado');
    });
  });

  describe('getClientPayments', () => {
    test('should get client payments successfully', async () => {
      const clientId = '123';
      const mockPayments = [{ id: '1', client_id: clientId }];
      
      mockRepository.findClientById.mockResolvedValue({ id: clientId });
      mockRepository.getClientPayments.mockResolvedValue(mockPayments);
      
      const result = await service.getClientPayments(clientId);
      
      expect(result).toEqual(mockPayments);
      expect(mockRepository.getClientPayments).toHaveBeenCalledWith(clientId);
    });
  });

  describe('getClientStatistics', () => {
    test('should get client statistics successfully', async () => {
      const clientId = '123';
      const mockStats = {
        totalContracts: 5,
        totalPayments: 10,
        totalAmount: 50000
      };
      
      mockRepository.findClientById.mockResolvedValue({ id: clientId });
      mockRepository.getClientStats.mockResolvedValue(mockStats);
      
      const result = await service.getClientStatistics(clientId);
      
      expect(result).toEqual(mockStats);
      expect(mockRepository.getClientStats).toHaveBeenCalledWith(clientId);
    });
  });

  describe('private methods', () => {
    describe('_validateClientData', () => {
      test('should validate individual client data', async () => {
        const clientData = {
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          tax_id: '12345678901',
          type: 'individual'
        };
        
        // Não deve lançar erro
        await expect(service._validateClientData(clientData)).resolves.not.toThrow();
        
        expect(ValidationHelper.isValidCPF).toHaveBeenCalledWith('12345678901');
      });

      test('should validate company client data', async () => {
        const clientData = {
          name: 'Empresa LTDA',
          email: 'contato@empresa.com',
          phone: '11999999999',
          tax_id: '12345678000195',
          type: 'company'
        };
        
        await expect(service._validateClientData(clientData)).resolves.not.toThrow();
        
        expect(ValidationHelper.isValidCNPJ).toHaveBeenCalledWith('12345678000195');
      });
    });
  });
});