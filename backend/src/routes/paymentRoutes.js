const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateToken, requireRole, requireBranchAccess } = require('../middleware/authMiddleware');
const { validatePayment, validatePaymentUpdate } = require('../middleware/validationMiddleware');

const router = express.Router();

// @desc    Listar todos os pagamentos
// @route   GET /api/payments
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    status, 
    contract_id, 
    client_id, 
    payment_method,
    start_date, 
    end_date,
    overdue_only = false
  } = req.query;
  const offset = (page - 1) * limit;
  
  let query = supabaseAdmin
    .from('payments')
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, email)
      )
    `, { count: 'exact' });

  // Filtro por filial removido - tabela contracts não possui mais branch_id
  // A lógica de filtragem por filial foi removida do sistema

  // Filtro por contrato
  if (contract_id) {
    query = query.eq('contract_id', contract_id);
  }

  // Filtro por cliente
  if (client_id) {
    query = query.eq('contract.client_id', client_id);
  }

  // Filtro de status
  if (status) {
    query = query.eq('status', status);
  }

  // Filtro de método de pagamento
  if (payment_method) {
    query = query.eq('payment_method', payment_method);
  }

  // Filtro de data de vencimento
  if (start_date) {
    query = query.gte('due_date', start_date);
  }
  if (end_date) {
    query = query.lte('due_date', end_date);
  }

  // Filtro de vencidos
  if (overdue_only === 'true') {
    const today = new Date().toISOString().split('T')[0];
    query = query.lt('due_date', today).eq('status', 'pending');
  }

  // Filtro de busca
  if (search) {
    query = query.or(`contract.contract_number.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  // Ordenação e paginação
  query = query
    .order('due_date', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({
      error: 'Erro ao buscar pagamentos',
      code: 'PAYMENTS_FETCH_ERROR',
      details: error.message
    });
  }

  res.json({
    payments: data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

// @desc    Obter pagamento por ID
// @route   GET /api/payments/:id
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select(`
      *,
      contract:contracts(
        *,
        client:clients(*)
      ),

    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar pagamento',
      code: 'PAYMENT_FETCH_ERROR',
      details: error.message
    });
  }

  // Verificar acesso à filial
  // Verificação de branch_id removida - tabela contracts não possui mais branch_id

  res.json({ payment: data });
}));

// @desc    Criar novo pagamento
// @route   POST /api/payments
// @access  Private
router.post('/', authenticateToken, validatePayment, asyncHandler(async (req, res) => {
  const paymentData = {
    ...req.body,
    created_by: req.user.id
  };

  // Verificar se o contrato existe e está ativo
  const { data: contract, error: contractError } = await supabaseAdmin
    .from('contracts')
    .select('id, status, value')
    .eq('id', paymentData.contract_id)
    .single();

  if (contractError || !contract) {
    return res.status(400).json({
      error: 'Contrato não encontrado',
      code: 'CONTRACT_NOT_FOUND'
    });
  }

  if (contract.status !== 'active' && contract.status !== 'pending') {
    return res.status(400).json({
      error: 'Contrato deve estar ativo ou pendente',
      code: 'INVALID_CONTRACT_STATUS'
    });
  }

  // Verificar acesso à filial
  // Verificação de branch_id removida - tabela contracts não possui mais branch_id

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert(paymentData)
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, tax_id)
      ),
      
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao criar pagamento',
      code: 'PAYMENT_CREATE_ERROR',
      details: error.message
    });
  }

  res.status(201).json({
    message: 'Pagamento criado com sucesso',
    payment: data
  });
}));

// @desc    Atualizar pagamento
// @route   PUT /api/payments/:id
// @access  Private
router.put('/:id', authenticateToken, validatePaymentUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // Verificar se o pagamento existe e se o usuário tem acesso
  const { data: existingPayment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select(`
      id, 
      status,
      contract:contracts(id, status)
    `)
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar pagamento',
      code: 'PAYMENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  // Verificação de branch_id removida - tabela contracts não possui mais branch_id

  // Verificar se pode alterar pagamento pago
  if (existingPayment.status === 'paid' && updateData.status !== 'paid') {
    return res.status(400).json({
      error: 'Não é possível alterar pagamento já realizado',
      code: 'PAYMENT_ALREADY_PAID'
    });
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, tax_id)
      ),
      
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao atualizar pagamento',
      code: 'PAYMENT_UPDATE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Pagamento atualizado com sucesso',
    payment: data
  });
}));

// @desc    Marcar pagamento como pago
// @route   PATCH /api/payments/:id/pay
// @access  Private
router.patch('/:id/pay', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { payment_date, amount_paid, notes, payment_method } = req.body;

  if (!payment_date) {
    return res.status(400).json({
      error: 'Data de pagamento é obrigatória',
      code: 'MISSING_PAYMENT_DATE'
    });
  }

  // Verificar se o pagamento existe e se o usuário tem acesso
  const { data: existingPayment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select(`
      id, 
      status,
      amount,
      contract:contracts(id, status)
    `)
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar pagamento',
      code: 'PAYMENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  // Verificação de branch_id removida - tabela contracts não possui mais branch_id

  if (existingPayment.status === 'paid') {
    return res.status(400).json({
      error: 'Pagamento já foi realizado',
      code: 'PAYMENT_ALREADY_PAID'
    });
  }

  const updateData = {
    status: 'paid',
    payment_date,
    amount_paid: amount_paid || existingPayment.amount,
    updated_at: new Date().toISOString()
  };

  if (notes) updateData.notes = notes;
  if (payment_method) updateData.payment_method = payment_method;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, tax_id)
      )
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao marcar pagamento como pago',
      code: 'PAYMENT_PAY_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Pagamento marcado como pago com sucesso',
    payment: data
  });
}));

// @desc    Cancelar pagamento
// @route   PATCH /api/payments/:id/cancel
// @access  Private
router.patch('/:id/cancel', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Verificar se o pagamento existe e se o usuário tem acesso
  const { data: existingPayment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select(`
      id, 
      status,
      contract:contracts(id, status)
    `)
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar pagamento',
      code: 'PAYMENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  // Verificação de branch_id removida - tabela contracts não possui mais branch_id

  if (existingPayment.status === 'cancelled') {
    return res.status(400).json({
      error: 'Pagamento já foi cancelado',
      code: 'PAYMENT_ALREADY_CANCELLED'
    });
  }

  const updateData = {
    status: 'cancelled',
    updated_at: new Date().toISOString()
  };

  if (reason) updateData.notes = reason;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, tax_id)
      )
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao cancelar pagamento',
      code: 'PAYMENT_CANCEL_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Pagamento cancelado com sucesso',
    payment: data
  });
}));

// @desc    Deletar pagamento
// @route   DELETE /api/payments/:id
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar se o pagamento existe
  const { data: existingPayment, error: fetchError } = await supabaseAdmin
    .from('payments')
    .select('id, status, installment_number')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Pagamento não encontrado',
        code: 'PAYMENT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar pagamento',
      code: 'PAYMENT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  if (existingPayment.status === 'paid') {
    return res.status(400).json({
      error: 'Não é possível deletar pagamento já realizado',
      code: 'PAYMENT_ALREADY_PAID'
    });
  }

  const { error } = await supabaseAdmin
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({
      error: 'Erro ao deletar pagamento',
      code: 'PAYMENT_DELETE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Pagamento deletado com sucesso'
  });
}));

// @desc    Obter relatório de pagamentos
// @route   GET /api/payments/reports/summary
// @access  Private
router.get('/reports/summary', authenticateToken, asyncHandler(async (req, res) => {
  const { start_date, end_date } = req.query;
  
  let baseQuery = supabaseAdmin.from('payments');
  
  // Filtrar por filial se o usuário não for admin
  // Filtro por branch_id removido - tabela contracts não possui mais branch_id

  // Filtros de data
  if (start_date) {
    baseQuery = baseQuery.gte('due_date', start_date);
  }
  if (end_date) {
    baseQuery = baseQuery.lte('due_date', end_date);
  }

  // Buscar dados para o relatório
  const { data: payments, error } = await baseQuery
    .select(`
      id,
      amount,
      status,
      due_date,
      payment_date,
      contract:contracts(
        id, contract_number
      )
    `);

  if (error) {
    return res.status(400).json({
      error: 'Erro ao gerar relatório',
      code: 'REPORT_GENERATION_ERROR',
      details: error.message
    });
  }

  // Calcular estatísticas
  const today = new Date().toISOString().split('T')[0];
  
  const summary = {
    total_payments: payments.length,
    total_amount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
    paid_count: payments.filter(p => p.status === 'paid').length,
    paid_amount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    pending_count: payments.filter(p => p.status === 'pending').length,
    pending_amount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0),
    overdue_count: payments.filter(p => p.status === 'pending' && p.due_date < today).length,
    overdue_amount: payments.filter(p => p.status === 'pending' && p.due_date < today).reduce((sum, p) => sum + parseFloat(p.amount), 0),
    cancelled_count: payments.filter(p => p.status === 'cancelled').length,
    cancelled_amount: payments.filter(p => p.status === 'cancelled').reduce((sum, p) => sum + parseFloat(p.amount), 0)
  };

  res.json({ summary });
}));

module.exports = router;