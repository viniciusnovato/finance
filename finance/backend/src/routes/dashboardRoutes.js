const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const { calculateAggregatePaymentStats } = require('../utils/contractCalculations');
const { getAllPayments, getAllContracts, getAllClients } = require('../utils/supabaseHelpers');

const router = express.Router();

// @desc    Obter estatísticas gerais do dashboard
// @route   GET /api/dashboard/stats
// @access  Public (temporário para desenvolvimento)
router.get('/stats', asyncHandler(async (req, res) => {
  const { period = '30' } = req.query;
  
  // Filtro por branch_id removido - tabela contracts não possui mais branch_id

  // Definir período
  const periodDays = parseInt(period);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);
  const startDateStr = startDate.toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  try {
    // Estatísticas de clientes - buscar todos os registros
    const clientsArray = await getAllClients(supabaseAdmin);
    const totalClients = clientsArray.length;
    const activeClients = clientsArray.filter(c => c.status === 'active').length;
    const newClientsThisPeriod = clientsArray.filter(c => c.created_at >= startDateStr).length;

    // Estatísticas de contratos - buscar todos os registros
    const contractsArray = await getAllContracts(supabaseAdmin);
    const totalContracts = contractsArray.length;
    
    // Buscar todos os pagamentos
    const allPayments = await getAllPayments(supabaseAdmin);
    
    // Associar pagamentos aos contratos
    const contractsWithPayments = contractsArray.map(contract => {
      const contractPayments = allPayments.filter(payment => payment.contract_id === contract.id);
      return { ...contract, payments: contractPayments };
    });
    const activeContracts = contractsWithPayments.filter(c => c.status === 'active').length;
    const pendingContracts = contractsWithPayments.filter(c => c.status === 'pending').length;
    const completedContracts = contractsWithPayments.filter(c => c.status === 'completed').length;
    const cancelledContracts = contractsWithPayments.filter(c => c.status === 'cancelled').length;
    const inactiveContracts = contractsWithPayments.filter(c => c.status === 'inactive').length;
    const newContractsThisPeriod = contractsWithPayments.filter(c => c.created_at >= startDateStr).length;
    const totalContractValue = contractsWithPayments.reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
    
    // Calcular estatísticas de pagamento agregadas
    const paymentStats = calculateAggregatePaymentStats(contractsWithPayments);

    // Estatísticas de pagamentos usando dados já carregados
    const totalPayments = allPayments.length;
    const paidPayments = allPayments.filter(p => p.status === 'paid').length;
    const pendingPayments = allPayments.filter(p => p.status === 'pending').length;
    const cancelledPayments = allPayments.filter(p => p.status === 'cancelled').length;
    const overduePayments = allPayments.filter(p => p.status === 'pending' && p.due_date < today).length;
    
    const totalPaymentValue = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paidValue = allPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingValue = allPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const overdueValue = allPayments.filter(p => p.status === 'pending' && p.due_date < today).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const revenueThisPeriod = allPayments.filter(p => p.status === 'paid' && p.paid_date >= startDateStr).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paymentsThisPeriod = allPayments.filter(p => p.status === 'paid' && p.paid_date >= startDateStr).length;

    // Calcular taxa de conversão
    const conversionRate = totalClients > 0 ? (totalContracts / totalClients * 100) : 0;
    const paymentRate = totalPayments > 0 ? (paidPayments / totalPayments * 100) : 0;

    const stats = {
      clients: {
        total: totalClients || 0,
        active: activeClients,
        inactive: (totalClients || 0) - activeClients,
        new_this_period: newClientsThisPeriod
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        pending: pendingContracts,
        completed: completedContracts,
        cancelled: cancelledContracts,
        inactive: inactiveContracts,
        new_this_period: newContractsThisPeriod,
        total_value: totalContractValue
      },
      payments: {
        total: totalPayments,
        paid: paidPayments,
        pending: pendingPayments,
        overdue: overduePayments,
        cancelled: cancelledPayments,
        paid_this_period: paymentsThisPeriod,
        total_value: totalPaymentValue,
        paid_value: paidValue,
        pending_value: pendingValue,
        overdue_value: overdueValue,
        revenue_this_period: revenueThisPeriod
      },
      metrics: {
        conversion_rate: Math.round(conversionRate * 100) / 100,
        payment_rate: Math.round(paymentRate * 100) / 100,
        average_contract_value: totalContracts > 0 ? Math.round((totalContractValue / totalContracts) * 100) / 100 : 0,
        average_payment_value: totalPayments > 0 ? Math.round((totalPaymentValue / totalPayments) * 100) / 100 : 0,
        average_percentage_paid: paymentStats.average_percentage_paid,
        payment_completion_rate: paymentStats.payment_completion_rate,
        contracts_with_down_payment: paymentStats.contracts_with_down_payment
      },
      payment_summary: {
        total_contract_value: totalPaymentValue, // Usar valor total dos pagamentos ao invés do campo 'value' dos contratos
        total_amount_paid: paidValue,
        total_amount_remaining: pendingValue, // Usar soma direta dos pagamentos pendentes
        fully_paid_contracts: paymentStats.fully_paid_contracts,
        partially_paid_contracts: totalContracts - paymentStats.fully_paid_contracts
      },
      period: {
        days: periodDays,
        start_date: startDateStr,
        end_date: today
      }
    };

    res.json({ stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'STATS_FETCH_ERROR'
    });
  }
}));

// @desc    Obter gráfico de receita por período
// @route   GET /api/dashboard/revenue-chart
// @access  Private
router.get('/revenue-chart', authenticateToken, asyncHandler(async (req, res) => {
  const { period = '12', type = 'monthly' } = req.query;
  
  // Filtro por branch_id removido - tabela contracts não possui mais branch_id

  try {
    let paymentsQuery = supabaseAdmin
      .from('payments')
      .select(`
        amount,
        payment_date,
        status,
        contract:contracts!inner(id)
      `)
      .eq('status', 'paid')
      .not('payment_date', 'is', null);
    
    // Filtro por branch_id removido - tabela contracts não possui mais branch_id

    // Definir período baseado no tipo
    const periodNum = parseInt(period);
    const endDate = new Date();
    const startDate = new Date();
    
    if (type === 'daily') {
      startDate.setDate(startDate.getDate() - periodNum);
    } else if (type === 'weekly') {
      startDate.setDate(startDate.getDate() - (periodNum * 7));
    } else { // monthly
      startDate.setMonth(startDate.getMonth() - periodNum);
    }

    paymentsQuery = paymentsQuery
      .gte('payment_date', startDate.toISOString().split('T')[0])
      .lte('payment_date', endDate.toISOString().split('T')[0])
      .order('payment_date', { ascending: true });

    const { data: payments } = await paymentsQuery;

    // Agrupar dados por período
    const chartData = [];
    const groupedData = {};

    payments.forEach(payment => {
      const date = new Date(payment.payment_date);
      let key;
      
      if (type === 'daily') {
        key = date.toISOString().split('T')[0];
      } else if (type === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else { // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          revenue: 0,
          count: 0
        };
      }
      
      groupedData[key].revenue += parseFloat(payment.amount);
      groupedData[key].count += 1;
    });

    // Preencher períodos sem dados
    const current = new Date(startDate);
    while (current <= endDate) {
      let key;
      
      if (type === 'daily') {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (type === 'weekly') {
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        key = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7);
      } else { // monthly
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          period: key,
          revenue: 0,
          count: 0
        };
      }
    }

    // Converter para array e ordenar
    const sortedData = Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));

    res.json({
      chart_data: sortedData,
      summary: {
        total_revenue: sortedData.reduce((sum, item) => sum + item.revenue, 0),
        total_payments: sortedData.reduce((sum, item) => sum + item.count, 0),
        period_type: type,
        periods: periodNum
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'CHART_FETCH_ERROR'
    });
  }
}));

// @desc    Obter lista de pagamentos vencidos
// @route   GET /api/dashboard/overdue-payments
// @access  Private
router.get('/overdue-payments', authenticateToken, asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;
  
  let query = supabaseAdmin
    .from('payments')
    .select(`
      id,
      installment_number,
      amount,
      due_date,
      status,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, tax_id, phone)
      )
    `)
    .eq('status', 'pending')
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true })
    .limit(parseInt(limit));

  // Filtrar por filial se o usuário não for admin
  // Filtro por branch_id removido - tabela contracts não possui mais branch_id

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      error: 'Erro ao buscar pagamentos vencidos',
      code: 'OVERDUE_PAYMENTS_FETCH_ERROR',
      details: error.message
    });
  }

  // Calcular dias de atraso
  const today = new Date();
  const overduePayments = data.map(payment => {
    const dueDate = new Date(payment.due_date);
    const daysDiff = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    
    return {
      ...payment,
      days_overdue: daysDiff
    };
  });

  res.json({
    overdue_payments: overduePayments,
    summary: {
      total_count: overduePayments.length,
      total_amount: overduePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    }
  });
}));

// @desc    Obter próximos vencimentos
// @route   GET /api/dashboard/upcoming-payments
// @access  Private
router.get('/upcoming-payments', authenticateToken, asyncHandler(async (req, res) => {
  const { days = 7, limit = 10 } = req.query;
  
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(days));
  const futureDateStr = futureDate.toISOString().split('T')[0];
  
  let query = supabaseAdmin
    .from('payments')
    .select(`
      id,
      installment_number,
      amount,
      due_date,
      status,
      contract:contracts(
        id,
        contract_number,
        client:clients(id, first_name, last_name, tax_id, phone)
      )
    `)
    .eq('status', 'pending')
    .gte('due_date', today)
    .lte('due_date', futureDateStr)
    .order('due_date', { ascending: true })
    .limit(parseInt(limit));

  // Filtrar por filial se o usuário não for admin
  // Filtro por branch_id removido - tabela contracts não possui mais branch_id

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      error: 'Erro ao buscar próximos vencimentos',
      code: 'UPCOMING_PAYMENTS_FETCH_ERROR',
      details: error.message
    });
  }

  // Calcular dias até vencimento
  const todayDate = new Date();
  const upcomingPayments = data.map(payment => {
    const dueDate = new Date(payment.due_date);
    const daysDiff = Math.floor((dueDate - todayDate) / (1000 * 60 * 60 * 24));
    
    return {
      ...payment,
      days_until_due: daysDiff
    };
  });

  res.json({
    upcoming_payments: upcomingPayments,
    summary: {
      total_count: upcomingPayments.length,
      total_amount: upcomingPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
      period_days: parseInt(days)
    }
  });
}));

// @desc    Obter resumo por filial - REMOVIDO
// @route   GET /api/dashboard/branch-summary
// @access  Private
// Funcionalidade removida pois a tabela 'branches' não existe mais
router.get('/branch-summary', authenticateToken, asyncHandler(async (req, res) => {
  res.status(404).json({
    error: 'Funcionalidade não disponível',
    code: 'FEATURE_REMOVED',
    message: 'O resumo por filial foi removido do sistema'
  });
}));

module.exports = router;