/**
 * Configuração inicial para os testes Jest
 * Define mocks globais, configurações e utilitários de teste
 */

// Mock do console para testes mais limpos
global.console = {
  ...console,
  // Desabilita logs durante os testes, exceto erros
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Mantém erros visíveis
};

// Mock do processo para variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.PORT = '3001';

// Mock global do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
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
    })),
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      getSession: jest.fn()
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        list: jest.fn()
      }))
    }
  }))
}));

// Utilitários de teste globais
global.testUtils = {
  // Cria um mock de request do Express
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),

  // Cria um mock de response do Express
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      locals: {}
    };
    return res;
  },

  // Cria um mock de next function
  createMockNext: () => jest.fn(),

  // Dados de teste padrão
  mockClientData: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    tax_id: '123.456.789-00',
    type: 'individual',
    status: 'active',
    address: {
      street: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567'
    },
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  },

  mockContractData: {
    id: '456e7890-e89b-12d3-a456-426614174001',
    client_id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Contrato de Prestação de Serviços',
    description: 'Desenvolvimento de sistema web',
    value: 10000.00,
    status: 'active',
    start_date: '2023-01-01',
    end_date: '2023-12-31',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  },

  mockPaymentData: {
    id: '789e0123-e89b-12d3-a456-426614174002',
    contract_id: '456e7890-e89b-12d3-a456-426614174001',
    client_id: '123e4567-e89b-12d3-a456-426614174000',
    amount: 1000.00,
    due_date: '2023-02-01',
    paid_date: null,
    status: 'pending',
    description: 'Parcela 1/10',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-01-01T00:00:00.000Z'
  },

  // Helpers para validação
  expectValidationError: (result, field, message) => {
    expect(result).toHaveProperty('errors');
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        field,
        message: expect.stringContaining(message)
      })
    );
  },

  expectSuccessResponse: (response, data = null) => {
    expect(response.status).toHaveBeenCalledWith(200);
    if (data) {
      expect(response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data
        })
      );
    }
  },

  expectErrorResponse: (response, status, message) => {
    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: expect.stringContaining(message)
        })
      })
    );
  },

  // Helper para aguardar promises
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper para criar dados aleatórios
  generateRandomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },

  generateRandomEmail: () => {
    const username = global.testUtils.generateRandomString(8);
    const domain = global.testUtils.generateRandomString(5);
    return `${username}@${domain}.com`;
  },

  generateRandomCPF: () => {
    // Gera um CPF válido para testes
    const digits = [];
    for (let i = 0; i < 9; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    
    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    digits.push(((sum * 10) % 11) % 10);
    
    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += digits[i] * (11 - i);
    }
    digits.push(((sum * 10) % 11) % 10);
    
    return digits.join('').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
};

// Configurações de timeout para testes assíncronos
jest.setTimeout(10000);

// Limpa todos os mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

// Configuração para capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Mock de Date para testes determinísticos
const mockDate = new Date('2023-01-01T00:00:00.000Z');
global.Date = class extends Date {
  constructor(...args) {
    if (args.length === 0) {
      return mockDate;
    }
    return new Date(...args);
  }
  
  static now() {
    return mockDate.getTime();
  }
};

// Exporta utilitários para uso nos testes
module.exports = {
  testUtils: global.testUtils
};