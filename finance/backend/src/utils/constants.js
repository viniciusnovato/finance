/**
 * Constantes da aplicação para padronizar códigos de status, mensagens e códigos de erro
 * Facilita manutenção e evita magic numbers/strings
 */

// HTTP Status Codes padronizados
const HttpStatusCodes = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// Códigos de erro padronizados para facilitar tratamento no frontend
const ErrorCodes = {
  // Códigos gerais
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  FORBIDDEN: 'FORBIDDEN',
  FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Códigos específicos de clientes
  CLIENT_NOT_FOUND: 'CLIENT_NOT_FOUND',
  CLIENT_ALREADY_EXISTS: 'CLIENT_ALREADY_EXISTS',
  CLIENT_HAS_CONTRACTS: 'CLIENT_HAS_CONTRACTS',
  CLIENTS_FETCH_ERROR: 'CLIENTS_FETCH_ERROR',
  CLIENT_FETCH_ERROR: 'CLIENT_FETCH_ERROR',
  CLIENT_CREATE_ERROR: 'CLIENT_CREATE_ERROR',
  CLIENT_UPDATE_ERROR: 'CLIENT_UPDATE_ERROR',
  CLIENT_DELETE_ERROR: 'CLIENT_DELETE_ERROR',
  CLIENT_CONTRACTS_FETCH_ERROR: 'CLIENT_CONTRACTS_FETCH_ERROR',
  CLIENT_PAYMENTS_FETCH_ERROR: 'CLIENT_PAYMENTS_FETCH_ERROR',
  CLIENT_SEARCH_ERROR: 'CLIENT_SEARCH_ERROR',
  INVALID_CLIENT_ID: 'INVALID_CLIENT_ID',
  
  // Códigos específicos de contratos
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  CONTRACT_ALREADY_EXISTS: 'CONTRACT_ALREADY_EXISTS',
  CONTRACTS_FETCH_ERROR: 'CONTRACTS_FETCH_ERROR',
  CONTRACT_FETCH_ERROR: 'CONTRACT_FETCH_ERROR',
  CONTRACT_CREATE_ERROR: 'CONTRACT_CREATE_ERROR',
  CONTRACT_UPDATE_ERROR: 'CONTRACT_UPDATE_ERROR',
  CONTRACT_DELETE_ERROR: 'CONTRACT_DELETE_ERROR',
  INVALID_CONTRACT_ID: 'INVALID_CONTRACT_ID',
  
  // Códigos específicos de pagamentos
  PAYMENT_NOT_FOUND: 'PAYMENT_NOT_FOUND',
  PAYMENTS_FETCH_ERROR: 'PAYMENTS_FETCH_ERROR',
  PAYMENT_FETCH_ERROR: 'PAYMENT_FETCH_ERROR',
  PAYMENT_CREATE_ERROR: 'PAYMENT_CREATE_ERROR',
  PAYMENT_UPDATE_ERROR: 'PAYMENT_UPDATE_ERROR',
  PAYMENT_DELETE_ERROR: 'PAYMENT_DELETE_ERROR',
  INVALID_PAYMENT_ID: 'INVALID_PAYMENT_ID',
  
  // Códigos de busca e validação
  INVALID_SEARCH_TERM: 'INVALID_SEARCH_TERM',
  INVALID_PAGINATION_PARAMS: 'INVALID_PAGINATION_PARAMS',
  INVALID_SORT_PARAMS: 'INVALID_SORT_PARAMS',
  
  // Códigos de dashboard
  DASHBOARD_FETCH_ERROR: 'DASHBOARD_FETCH_ERROR'
};

// Mensagens de sucesso padronizadas
const SuccessMessages = {
  // Mensagens de clientes
  CLIENT_CREATED: 'Cliente criado com sucesso',
  CLIENT_UPDATED: 'Cliente atualizado com sucesso',
  CLIENT_DELETED: 'Cliente deletado com sucesso',
  
  // Mensagens de contratos
  CONTRACT_CREATED: 'Contrato criado com sucesso',
  CONTRACT_UPDATED: 'Contrato atualizado com sucesso',
  CONTRACT_DELETED: 'Contrato deletado com sucesso',
  
  // Mensagens de pagamentos
  PAYMENT_CREATED: 'Pagamento criado com sucesso',
  PAYMENT_UPDATED: 'Pagamento atualizado com sucesso',
  PAYMENT_DELETED: 'Pagamento deletado com sucesso',
  
  // Mensagens gerais
  OPERATION_SUCCESS: 'Operação realizada com sucesso',
  DATA_FETCHED: 'Dados recuperados com sucesso'
};

// Configurações de paginação
const PaginationDefaults = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1
};

// Configurações de busca
const SearchDefaults = {
  MIN_SEARCH_LENGTH: 2,
  MAX_SEARCH_LENGTH: 100,
  DEFAULT_SEARCH_LIMIT: 10
};

// Campos válidos para ordenação
const ValidSortFields = {
  CLIENTS: ['created_at', 'name', 'email', 'status', 'updated_at'],
  CONTRACTS: ['created_at', 'contract_number', 'status', 'start_date', 'end_date'],
  PAYMENTS: ['created_at', 'due_date', 'paid_date', 'amount', 'status']
};

// Ordens de classificação válidas
const ValidSortOrders = ['asc', 'desc'];

// Status válidos para diferentes entidades
const ValidStatuses = {
  CLIENTS: ['active', 'inactive', 'suspended'],
  CONTRACTS: ['active', 'completed', 'cancelled', 'suspended'],
  PAYMENTS: ['pending', 'paid', 'overdue', 'cancelled']
};

module.exports = {
  HttpStatusCodes,
  ErrorCodes,
  SuccessMessages,
  PaginationDefaults,
  SearchDefaults,
  ValidSortFields,
  ValidSortOrders,
  ValidStatuses
};