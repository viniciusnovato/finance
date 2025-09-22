const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateClient, validateClientUpdate } = require('../middleware/validationMiddleware');

const router = express.Router();

// @desc    Listar todos os clientes
// @route   GET /api/clients
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  
  // Parse pagination parameters as integers
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  
  let query = supabaseAdmin
    .from('clients')
    .select(`
      *,
      contracts:contracts(count)
    `, { count: 'exact' });

  // Remover filtros de filial - tabela branches não existe mais

  // Filtro de busca
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,tax_id.ilike.%${search}%,phone.ilike.%${search}%,mobile.ilike.%${search}%`);
  }

  // Filtro de status
  if (status) {
    query = query.eq('status', status);
  }

  // Ordenação e paginação
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({
      error: 'Erro ao buscar clientes',
      code: 'CLIENTS_FETCH_ERROR',
      details: error.message
    });
  }

  res.json({
    clients: data,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    }
  });
}));

// @desc    Obter cliente por ID
// @route   GET /api/clients/:id
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = supabaseAdmin
    .from('clients')
    .select(`
      *,
      contracts:contracts(
        id,
        contract_number,
        total_amount,
        status,
        created_at,
        payments:payments(count)
      )
    `)
    .eq('id', id)
    .single();

  const { data, error } = await query;

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar cliente',
      code: 'CLIENT_FETCH_ERROR',
      details: error.message
    });
  }

  // Remover verificação de acesso à filial - tabela branches não existe mais

  res.json({ client: data });
}));

// @desc    Criar novo cliente
// @route   POST /api/clients
// @access  Private
router.post('/', authenticateToken, validateClient, asyncHandler(async (req, res) => {
  const clientData = {
    ...req.body,
    created_by: req.user.id
  };

  // Se o usuário não for admin, usar sua filial
  if (req.user.role !== 'admin' && req.user.branch_id) {
    clientData.branch_id = req.user.branch_id;
  }

  // Verificar se já existe cliente com o mesmo documento na filial
  const { data: existingClient } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('document', clientData.document)
    .eq('branch_id', clientData.branch_id)
    .single();

  if (existingClient) {
    return res.status(400).json({
      error: 'Já existe um cliente com este documento nesta filial',
      code: 'DUPLICATE_DOCUMENT'
    });
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert(clientData)
    .select(`
      *
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao criar cliente',
      code: 'CLIENT_CREATE_ERROR',
      details: error.message
    });
  }

  res.status(201).json({
    message: 'Cliente criado com sucesso',
    client: data
  });
}));

// @desc    Atualizar cliente
// @route   PUT /api/clients/:id
// @access  Private
router.put('/:id', authenticateToken, validateClientUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // Verificar se o cliente existe
  const { data: existingClient, error: fetchError } = await supabaseAdmin
    .from('clients')
    .select('id')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar cliente',
      code: 'CLIENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Remover verificação de acesso à filial - tabela branches não existe mais

  // Se está alterando o documento, verificar duplicatas
  if (updateData.document) {
    const { data: duplicateClient } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('document', updateData.document)
      .neq('id', id)
      .single();

    if (duplicateClient) {
      return res.status(400).json({
        error: 'Já existe um cliente com este documento',
        code: 'DUPLICATE_DOCUMENT'
      });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select(`
      *
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao atualizar cliente',
      code: 'CLIENT_UPDATE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Cliente atualizado com sucesso',
    client: data
  });
}));

// @desc    Desativar/Ativar cliente
// @route   PATCH /api/clients/:id/status
// @access  Private
router.patch('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({
      error: 'Status deve ser um valor booleano',
      code: 'INVALID_STATUS'
    });
  }

  // Verificar se o cliente existe e se o usuário tem acesso
  const { data: existingClient, error: fetchError } = await supabaseAdmin
    .from('clients')
    .select('id, branch_id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar cliente',
      code: 'CLIENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  if (req.user.role !== 'admin' && req.user.branch_id && existingClient.branch_id !== req.user.branch_id) {
    return res.status(403).json({
      error: 'Acesso negado a este cliente',
      code: 'ACCESS_DENIED'
    });
  }

  // Se está desativando, verificar se não há contratos ativos
  if (!is_active) {
    const { data: activeContracts } = await supabaseAdmin
      .from('contracts')
      .select('id')
      .eq('client_id', id)
      .in('status', ['active', 'pending'])
      .limit(1);

    if (activeContracts && activeContracts.length > 0) {
      return res.status(400).json({
        error: 'Não é possível desativar cliente com contratos ativos',
        code: 'CLIENT_HAS_ACTIVE_CONTRACTS'
      });
    }
  }

  const { data, error } = await supabaseAdmin
    .from('clients')
    .update({
      is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao atualizar status do cliente',
      code: 'CLIENT_STATUS_UPDATE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: `Cliente ${is_active ? 'ativado' : 'desativado'} com sucesso`,
    client: data
  });
}));

// @desc    Deletar cliente
// @route   DELETE /api/clients/:id
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar se o cliente existe
  const { data: existingClient, error: fetchError } = await supabaseAdmin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Cliente não encontrado',
        code: 'CLIENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar cliente',
      code: 'CLIENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar se não há contratos associados
  const { data: contracts } = await supabaseAdmin
    .from('contracts')
    .select('id')
    .eq('client_id', id)
    .limit(1);

  if (contracts && contracts.length > 0) {
    return res.status(400).json({
      error: 'Não é possível deletar cliente com contratos associados',
      code: 'CLIENT_HAS_CONTRACTS'
    });
  }

  const { error } = await supabaseAdmin
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({
      error: 'Erro ao deletar cliente',
      code: 'CLIENT_DELETE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Cliente deletado com sucesso'
  });
}));

// @desc    Buscar clientes por documento
// @route   GET /api/clients/search/document/:document
// @access  Private
router.get('/search/document/:document', authenticateToken, asyncHandler(async (req, res) => {
  const { document } = req.params;

  let query = supabaseAdmin
    .from('clients')
    .select('*')
    .eq('document', document);

  // Remover filtros de filial - tabela branches não existe mais

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      error: 'Erro ao buscar cliente por documento',
      code: 'CLIENT_SEARCH_ERROR',
      details: error.message
    });
  }

  res.json({ clients: data });
}));

module.exports = router;