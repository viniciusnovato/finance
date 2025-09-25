const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateContract, validateContractUpdate } = require('../middleware/validationMiddleware');
const { calculatePaymentPercentage, getNextPaymentDue } = require('../utils/contractCalculations');

const router = express.Router();

// @desc    Listar todos os contratos
// @route   GET /api/contracts
// @access  Private
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, client_id, branch_id, start_date, end_date } = req.query;
  
  // Parse pagination parameters as integers
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const offset = (pageNum - 1) * limitNum;
  
  let query = supabaseAdmin
    .from('contracts')
    .select(`
      *,
      client:clients(id, first_name, last_name, email)
    `, { count: 'exact' });

  // Remover filtros de branch_id pois não existe na tabela contracts
  // if (req.user.role !== 'admin' && req.user.branch_id) {
  //   query = query.eq('branch_id', req.user.branch_id);
  // } else if (branch_id) {
  //   query = query.eq('branch_id', branch_id);
  // }

  // Filtro por cliente
  if (client_id) {
    query = query.eq('client_id', client_id);
  }

  // Filtro de busca
  if (search) {
    // Primeiro buscar clientes que correspondem ao termo
    const { data: matchingClients } = await supabaseAdmin
      .from('clients')
      .select('id')
      .or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,tax_id.ilike.%${search}%,phone.ilike.%${search}%,mobile.ilike.%${search}%`);
    
    const clientIds = matchingClients?.map(c => c.id) || [];
    
    // Criar condições de busca
    const searchConditions = [`contract_number.ilike.%${search}%`, `description.ilike.%${search}%`];
    
    if (clientIds.length > 0) {
      // Se encontrou clientes, adicionar condição de client_id usando OR corretamente
      searchConditions.push(`client_id.in.(${clientIds.join(',')})`);
    }
    
    query = query.or(searchConditions.join(','));
  }

  // Filtro de status
  if (status) {
    query = query.eq('status', status);
  }

  // Filtro de data
  if (start_date) {
    query = query.gte('created_at', start_date);
  }
  if (end_date) {
    query = query.lte('created_at', end_date);
  }

  // Ordenação e paginação
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1);

  const { data, error, count } = await query;

  if (error) {
    return res.status(400).json({
      error: 'Erro ao buscar contratos',
      code: 'CONTRACTS_FETCH_ERROR',
      details: error.message
    });
  }

  // Buscar pagamentos para cada contrato para calcular porcentagem paga
  const contractsWithPaymentInfo = await Promise.all(
    data.map(async (contract) => {
      const { data: payments } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('contract_id', contract.id);
      
      const paymentInfo = calculatePaymentPercentage(contract, payments || []);
      
      return {
        ...contract,
        payment_info: {
          percentage_paid: paymentInfo.percentage_paid,
          amount_paid: paymentInfo.amount_paid,
          amount_remaining: paymentInfo.amount_remaining,
          is_fully_paid: paymentInfo.is_fully_paid
        }
      };
    })
  );

  res.json({
    contracts: contractsWithPaymentInfo,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    }
  });
}));

// @desc    Obter contrato por ID
// @route   GET /api/contracts/:id
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .select(`
      *,
      client:clients(*),
      payments:payments(
        *
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Contrato não encontrado',
        code: 'CONTRACT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar contrato',
      code: 'CONTRACT_FETCH_ERROR',
      details: error.message
    });
  }

  // Remover verificação de branch_id pois não existe na tabela contracts
  // if (req.user.role !== 'admin' && req.user.branch_id && data.branch_id !== req.user.branch_id) {
  //   return res.status(403).json({
  //     error: 'Acesso negado a este contrato',
  //     code: 'ACCESS_DENIED'
  //   });
  // }

  // Calcular informações de pagamento
  const paymentInfo = calculatePaymentPercentage(data, data.payments || []);
  const nextPayment = getNextPaymentDue(data, data.payments || []);

  res.json({ 
    contract: {
      ...data,
      payment_info: paymentInfo,
      next_payment: nextPayment
    }
  });
}));

// @desc    Criar novo contrato
// @route   POST /api/contracts
// @access  Private
router.post('/', authenticateToken, validateContract, asyncHandler(async (req, res) => {
  const contractData = {
    ...req.body,
    created_by: req.user.id
  };

  // Remover lógica de branch_id pois não existe na tabela contracts
  // if (req.user.role !== 'admin' && req.user.branch_id) {
  //   contractData.branch_id = req.user.branch_id;
  // }

  // Gerar número do contrato se não fornecido
  if (!contractData.contract_number) {
    const year = new Date().getFullYear();
    const { data: lastContract } = await supabaseAdmin
      .from('contracts')
      .select('contract_number')
      .like('contract_number', `${year}%`)
      .order('contract_number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastContract && lastContract.contract_number) {
      const lastNumber = parseInt(lastContract.contract_number.split('-').pop());
      nextNumber = lastNumber + 1;
    }

    contractData.contract_number = `${year}-${String(nextNumber).padStart(4, '0')}`;
  }

  // Verificar se o cliente existe e está ativo
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .select('id, status')
    .eq('id', contractData.client_id)
    .single();

  if (clientError || !client) {
    return res.status(400).json({
      error: 'Cliente não encontrado',
      code: 'CLIENT_NOT_FOUND'
    });
  }

  if (client.status !== 'active') {
    return res.status(400).json({
      error: 'Cliente está inativo',
      code: 'CLIENT_INACTIVE'
    });
  }

  // Remover verificação de branch_id pois não existe na tabela contracts
  // if (client.branch_id !== contractData.branch_id) {
  //   return res.status(400).json({
  //     error: 'Cliente não pertence à filial especificada',
  //     code: 'CLIENT_BRANCH_MISMATCH'
  //   });
  // }

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .insert(contractData)
    .select(`
      *,
      client:clients(id, first_name, last_name, email)
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao criar contrato',
      code: 'CONTRACT_CREATE_ERROR',
      details: error.message
    });
  }

  res.status(201).json({
    message: 'Contrato criado com sucesso',
    contract: data
  });
}));

// @desc    Atualizar contrato
// @route   PUT /api/contracts/:id
// @access  Private
router.put('/:id', authenticateToken, validateContractUpdate, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = {
    ...req.body,
    updated_at: new Date().toISOString()
  };

  // Verificar se o contrato existe e se o usuário tem acesso
  const { data: existingContract, error: fetchError } = await supabaseAdmin
    .from('contracts')
    .select('id, branch_id, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Contrato não encontrado',
        code: 'CONTRACT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar contrato',
      code: 'CONTRACT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  if (req.user.role !== 'admin' && req.user.branch_id && existingContract.branch_id !== req.user.branch_id) {
    return res.status(403).json({
      error: 'Acesso negado a este contrato',
      code: 'ACCESS_DENIED'
    });
  }

  // Verificar se pode alterar contrato cancelado ou finalizado
  if (existingContract.status === 'cancelled' || existingContract.status === 'completed') {
    return res.status(400).json({
      error: 'Não é possível alterar contrato cancelado ou finalizado',
      code: 'CONTRACT_IMMUTABLE'
    });
  }

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      client:clients(id, first_name, last_name, tax_id),
      
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao atualizar contrato',
      code: 'CONTRACT_UPDATE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Contrato atualizado com sucesso',
    contract: data
  });
}));

// @desc    Alterar status do contrato
// @route   PATCH /api/contracts/:id/status
// @access  Private
router.patch('/:id/status', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Status inválido',
      code: 'INVALID_STATUS'
    });
  }

  // Verificar se o contrato existe e se o usuário tem acesso
  const { data: existingContract, error: fetchError } = await supabaseAdmin
    .from('contracts')
    .select('id, branch_id, status, value')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Contrato não encontrado',
        code: 'CONTRACT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar contrato',
      code: 'CONTRACT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  if (req.user.role !== 'admin' && req.user.branch_id && existingContract.branch_id !== req.user.branch_id) {
    return res.status(403).json({
      error: 'Acesso negado a este contrato',
      code: 'ACCESS_DENIED'
    });
  }

  // Validações de transição de status
  if (existingContract.status === 'cancelled' && status !== 'cancelled') {
    return res.status(400).json({
      error: 'Não é possível alterar status de contrato cancelado',
      code: 'INVALID_STATUS_TRANSITION'
    });
  }

  if (existingContract.status === 'completed' && status !== 'completed') {
    return res.status(400).json({
      error: 'Não é possível alterar status de contrato finalizado',
      code: 'INVALID_STATUS_TRANSITION'
    });
  }

  // Se está marcando como finalizado, verificar se todos os pagamentos foram feitos
  if (status === 'completed') {
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('amount, status')
      .eq('contract_id', id);

    const totalPaid = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    if (totalPaid < parseFloat(existingContract.value)) {
      return res.status(400).json({
        error: 'Não é possível finalizar contrato com pagamentos pendentes',
        code: 'PENDING_PAYMENTS'
      });
    }
  }

  const updateData = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === 'cancelled' && reason) {
    updateData.cancellation_reason = reason;
    updateData.cancelled_at = new Date().toISOString();
  }

  if (status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('contracts')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      client:clients(id, first_name, last_name, tax_id)
    `)
    .single();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao atualizar status do contrato',
      code: 'CONTRACT_STATUS_UPDATE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: `Contrato ${status === 'cancelled' ? 'cancelado' : status === 'completed' ? 'finalizado' : 'atualizado'} com sucesso`,
    contract: data
  });
}));

// @desc    Deletar contrato
// @route   DELETE /api/contracts/:id
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verificar se o contrato existe
  const { data: existingContract, error: fetchError } = await supabaseAdmin
    .from('contracts')
    .select('id, contract_number, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Contrato não encontrado',
        code: 'CONTRACT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar contrato',
      code: 'CONTRACT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar se não há pagamentos associados
  const { data: payments } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('contract_id', id)
    .limit(1);

  if (payments && payments.length > 0) {
    return res.status(400).json({
      error: 'Não é possível deletar contrato com pagamentos associados',
      code: 'CONTRACT_HAS_PAYMENTS'
    });
  }

  const { error } = await supabaseAdmin
    .from('contracts')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json({
      error: 'Erro ao deletar contrato',
      code: 'CONTRACT_DELETE_ERROR',
      details: error.message
    });
  }

  res.json({
    message: 'Contrato deletado com sucesso'
  });
}));

// @desc    Gerar parcelas do contrato
// @route   POST /api/contracts/:id/generate-installments
// @access  Private
router.post('/:id/generate-installments', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { installments_count, first_due_date, payment_method = 'boleto' } = req.body;

  if (!installments_count || installments_count < 1) {
    return res.status(400).json({
      error: 'Número de parcelas deve ser maior que zero',
      code: 'INVALID_INSTALLMENTS_COUNT'
    });
  }

  if (!first_due_date) {
    return res.status(400).json({
      error: 'Data de vencimento da primeira parcela é obrigatória',
      code: 'MISSING_FIRST_DUE_DATE'
    });
  }

  // Verificar se o contrato existe e se o usuário tem acesso
  const { data: contract, error: fetchError } = await supabaseAdmin
    .from('contracts')
    .select('id, branch_id, value, down_payment, status')
    .eq('id', id)
    .single();

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return res.status(404).json({
        error: 'Contrato não encontrado',
        code: 'CONTRACT_NOT_FOUND'
      });
    }
    return res.status(400).json({
      error: 'Erro ao buscar contrato',
      code: 'CONTRACT_FETCH_ERROR',
      details: fetchError.message
    });
  }

  // Verificar acesso à filial
  if (req.user.role !== 'admin' && req.user.branch_id && contract.branch_id !== req.user.branch_id) {
    return res.status(403).json({
      error: 'Acesso negado a este contrato',
      code: 'ACCESS_DENIED'
    });
  }

  if (contract.status !== 'pending' && contract.status !== 'active') {
    return res.status(400).json({
      error: 'Só é possível gerar parcelas para contratos pendentes ou ativos',
      code: 'INVALID_CONTRACT_STATUS'
    });
  }

  // Verificar se já existem pagamentos
  const { data: existingPayments } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('contract_id', id)
    .limit(1);

  if (existingPayments && existingPayments.length > 0) {
    return res.status(400).json({
      error: 'Contrato já possui pagamentos gerados',
      code: 'PAYMENTS_ALREADY_EXIST'
    });
  }

  // Calcular valor das parcelas
  const remainingAmount = parseFloat(contract.value) - parseFloat(contract.down_payment || 0);
  const installmentAmount = remainingAmount / installments_count;

  // Gerar parcelas
  const payments = [];
  const firstDueDate = new Date(first_due_date);

  for (let i = 0; i < installments_count; i++) {
    const dueDate = new Date(firstDueDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    payments.push({
      contract_id: id,
      installment_number: i + 1,
      amount: installmentAmount.toFixed(2),
      due_date: dueDate.toISOString().split('T')[0],
      payment_method,
      status: 'pending',
      created_by: req.user.id
    });
  }

  const { data, error } = await supabaseAdmin
    .from('payments')
    .insert(payments)
    .select();

  if (error) {
    return res.status(400).json({
      error: 'Erro ao gerar parcelas',
      code: 'INSTALLMENTS_GENERATION_ERROR',
      details: error.message
    });
  }

  res.status(201).json({
    message: 'Parcelas geradas com sucesso',
    payments: data,
    summary: {
      total_installments: installments_count,
      installment_amount: installmentAmount.toFixed(2),
      remaining_amount: remainingAmount.toFixed(2)
    }
  });
}));

module.exports = router;