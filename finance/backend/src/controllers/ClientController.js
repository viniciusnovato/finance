const { ClientService } = require('../services/ClientService');
const { asyncHandler } = require('../middleware/errorMiddleware');

class ClientController {
  /**
   * Listar todos os clientes com paginação e filtros
   * @route GET /api/clients
   * @access Private
   */
  static getClients = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    try {
      const result = await ClientService.getClients({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status,
        sortBy: sort_by,
        sortOrder: sort_order
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENTS_FETCH_ERROR'
      });
    }
  });

  /**
   * Obter cliente por ID
   * @route GET /api/clients/:id
   * @access Private
   */
  static getClientById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const client = await ClientService.getClientById(id);
      
      if (!client) {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      res.json({ client });
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_FETCH_ERROR'
      });
    }
  });

  /**
   * Criar novo cliente
   * @route POST /api/clients
   * @access Private
   */
  static createClient = asyncHandler(async (req, res) => {
    try {
      const clientData = req.body;
      const newClient = await ClientService.createClient(clientData);

      res.status(201).json({
        message: 'Cliente criado com sucesso',
        client: newClient
      });
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      
      if (error.message.includes('já existe')) {
        return res.status(409).json({
          error: error.message,
          code: 'CLIENT_ALREADY_EXISTS'
        });
      }
      
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_CREATE_ERROR'
      });
    }
  });

  /**
   * Atualizar cliente
   * @route PUT /api/clients/:id
   * @access Private
   */
  static updateClient = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    try {
      const updatedClient = await ClientService.updateClient(id, updateData);
      
      if (!updatedClient) {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      res.json({
        message: 'Cliente atualizado com sucesso',
        client: updatedClient
      });
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      
      if (error.message.includes('já existe')) {
        return res.status(409).json({
          error: error.message,
          code: 'CLIENT_ALREADY_EXISTS'
        });
      }
      
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_UPDATE_ERROR'
      });
    }
  });

  /**
   * Deletar cliente
   * @route DELETE /api/clients/:id
   * @access Private
   */
  static deleteClient = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
      const deleted = await ClientService.deleteClient(id);
      
      if (!deleted) {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND'
        });
      }

      res.json({
        message: 'Cliente deletado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao deletar cliente:', error);
      
      if (error.message.includes('possui contratos')) {
        return res.status(409).json({
          error: error.message,
          code: 'CLIENT_HAS_CONTRACTS'
        });
      }
      
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_DELETE_ERROR'
      });
    }
  });

  /**
   * Obter contratos do cliente
   * @route GET /api/clients/:id/contracts
   * @access Private
   */
  static getClientContracts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, status = '' } = req.query;

    try {
      const result = await ClientService.getClientContracts(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar contratos do cliente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_CONTRACTS_FETCH_ERROR'
      });
    }
  });

  /**
   * Obter pagamentos do cliente
   * @route GET /api/clients/:id/payments
   * @access Private
   */
  static getClientPayments = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 10, status = '' } = req.query;

    try {
      const result = await ClientService.getClientPayments(id, {
        page: parseInt(page),
        limit: parseInt(limit),
        status
      });

      res.json(result);
    } catch (error) {
      console.error('Erro ao buscar pagamentos do cliente:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_PAYMENTS_FETCH_ERROR'
      });
    }
  });

  /**
   * Buscar clientes por termo
   * @route GET /api/clients/search
   * @access Private
   */
  static searchClients = asyncHandler(async (req, res) => {
    const { q: query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Termo de busca deve ter pelo menos 2 caracteres',
        code: 'INVALID_SEARCH_TERM'
      });
    }

    try {
      const clients = await ClientService.searchClients(query.trim(), parseInt(limit));
      res.json({ clients });
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'CLIENT_SEARCH_ERROR'
      });
    }
  });
}

module.exports = { ClientController };