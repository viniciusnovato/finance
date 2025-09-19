/**
 * Exemplo de uso das classes refatoradas seguindo Clean Code
 * Este arquivo demonstra como integrar todas as classes refatoradas
 */

const ClientControllerRefactored = require('../controllers/ClientControllerRefactored');
const ClientServiceRefactored = require('../services/ClientServiceRefactored');
const ClientRepositoryRefactored = require('../repositories/ClientRepositoryRefactored');
const ResponseHelper = require('../utils/responseHelper');
const ValidationHelper = require('../utils/validationHelper');
const ErrorHandler = require('../utils/errorHandler');
const DatabaseHelper = require('../utils/databaseHelper');
const { HttpStatusCodes, ErrorCodes, SuccessMessages } = require('../utils/constants');

/**
 * Exemplo de configuração das dependências
 */
class RefactoredExampleSetup {
  static setupDependencies() {
    // Instanciar repositório
    const clientRepository = new ClientRepositoryRefactored();
    
    // Instanciar serviço com repositório
    const clientService = new ClientServiceRefactored(clientRepository);
    
    // Instanciar controller com serviço
    const clientController = new ClientControllerRefactored(clientService);
    
    return {
      clientRepository,
      clientService,
      clientController
    };
  }

  /**
   * Exemplo de uso do controller refatorado
   */
  static async exampleControllerUsage(req, res) {
    try {
      const { clientController } = this.setupDependencies();
      
      // Exemplo de busca de clientes com paginação
      await clientController.getAllClients(req, res);
      
    } catch (error) {
      ErrorHandler.handleControllerError(error, res);
    }
  }

  /**
   * Exemplo de uso do service refatorado
   */
  static async exampleServiceUsage() {
    try {
      const { clientService } = this.setupDependencies();
      
      // Exemplo de busca com filtros
      const filters = {
        name: 'João',
        status: 'active',
        city: 'São Paulo'
      };
      
      const pagination = {
        page: 1,
        limit: 10
      };
      
      const sorting = {
        field: 'name',
        order: 'asc'
      };
      
      const result = await clientService.findClientsWithPagination(
        filters,
        pagination,
        sorting
      );
      
      console.log('Clientes encontrados:', result);
      
    } catch (error) {
      console.error('Erro no service:', error.message);
    }
  }

  /**
   * Exemplo de uso do repository refatorado
   */
  static async exampleRepositoryUsage() {
    try {
      const { clientRepository } = this.setupDependencies();
      
      // Exemplo de criação de cliente
      const clientData = {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        tax_id: '12345678901',
        type: 'individual',
        status: 'active'
      };
      
      const newClient = await clientRepository.createClient(clientData);
      console.log('Cliente criado:', newClient);
      
    } catch (error) {
      console.error('Erro no repository:', error.message);
    }
  }

  /**
   * Exemplo de uso dos helpers de validação
   */
  static exampleValidationUsage() {
    // Validação de email
    const email = 'teste@email.com';
    const isValidEmail = ValidationHelper.isValidEmail(email);
    console.log(`Email ${email} é válido:`, isValidEmail);
    
    // Validação de CPF
    const cpf = '12345678901';
    const isValidCPF = ValidationHelper.isValidCPF(cpf);
    console.log(`CPF ${cpf} é válido:`, isValidCPF);
    
    // Sanitização de string
    const dirtyString = '  João Silva  ';
    const cleanString = ValidationHelper.sanitizeString(dirtyString);
    console.log(`String limpa: '${cleanString}'`);
  }

  /**
   * Exemplo de uso do helper de resposta
   */
  static exampleResponseUsage(res) {
    // Resposta de sucesso
    const data = { id: 1, name: 'João Silva' };
    ResponseHelper.success(res, data, SuccessMessages.CLIENT_RETRIEVED);
    
    // Resposta de erro de validação
    const errors = [{ field: 'email', message: 'Email inválido' }];
    ResponseHelper.validationError(res, 'Dados inválidos', errors);
    
    // Resposta não encontrado
    ResponseHelper.notFound(res, 'Cliente não encontrado');
  }

  /**
   * Exemplo de uso do helper de banco de dados
   */
  static exampleDatabaseHelperUsage() {
    // Construção de query de paginação
    const pagination = { page: 2, limit: 15 };
    const paginationQuery = DatabaseHelper.buildPaginationQuery(pagination);
    console.log('Query de paginação:', paginationQuery);
    
    // Construção de filtros
    const filters = { name: 'João', status: 'active' };
    const allowedFilters = ['name', 'status', 'email'];
    const filterQuery = DatabaseHelper.buildFilterQuery(filters, allowedFilters);
    console.log('Query de filtros:', filterQuery);
    
    // Construção de ordenação
    const sorting = { field: 'name', order: 'desc' };
    const allowedSortFields = ['name', 'email', 'created_at'];
    const sortQuery = DatabaseHelper.buildSortQuery(sorting, allowedSortFields);
    console.log('Query de ordenação:', sortQuery);
  }

  /**
   * Exemplo completo de fluxo de criação de cliente
   */
  static async exampleCompleteFlow(req, res) {
    try {
      const { clientController } = this.setupDependencies();
      
      // Simular dados da requisição
      req.body = {
        name: 'Maria Santos',
        email: 'maria@email.com',
        phone: '11888888888',
        tax_id: '98765432100',
        type: 'individual',
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234-567'
        }
      };
      
      // Executar criação através do controller
      await clientController.createNewClient(req, res);
      
    } catch (error) {
      ErrorHandler.handleControllerError(error, res);
    }
  }
}

/**
 * Exemplo de middleware de tratamento de erros
 */
const errorMiddleware = (error, req, res, next) => {
  ErrorHandler.handleExpressError(error, req, res, next);
};

/**
 * Exemplo de configuração de rotas com as classes refatoradas
 */
function setupRefactoredRoutes(app) {
  const { clientController } = RefactoredExampleSetup.setupDependencies();
  
  // Rotas de clientes
  app.get('/api/clients', clientController.getAllClients.bind(clientController));
  app.get('/api/clients/:id', clientController.getClientById.bind(clientController));
  app.post('/api/clients', clientController.createNewClient.bind(clientController));
  app.put('/api/clients/:id', clientController.updateExistingClient.bind(clientController));
  app.delete('/api/clients/:id', clientController.removeClient.bind(clientController));
  app.get('/api/clients/search', clientController.searchClients.bind(clientController));
  
  // Middleware de tratamento de erros
  app.use(errorMiddleware);
}

module.exports = {
  RefactoredExampleSetup,
  setupRefactoredRoutes,
  errorMiddleware
};