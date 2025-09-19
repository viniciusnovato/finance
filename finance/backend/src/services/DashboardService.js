const { DashboardRepository } = require('../repositories/DashboardRepository');
const { calculateAggregatePaymentStats } = require('../utils/contractCalculations');

class DashboardService {
  /**
   * Obter estatísticas gerais do dashboard
   * @param {string} period - Período em dias
   * @returns {Object} Estatísticas do dashboard
   */
  static async getStats(period) {
    const periodDays = parseInt(period);
    const { startDate, today } = this._calculateDateRange(periodDays);

    // Buscar dados básicos
    const [clientsArray, contractsArray, allPayments] = await Promise.all([
      DashboardRepository.getAllClients(),
      DashboardRepository.getAllContracts(),
      DashboardRepository.getAllPayments()
    ]);

    // Processar dados
    const contractsWithPayments = this._associatePaymentsToContracts(contractsArray, allPayments);
    const paymentStats = calculateAggregatePaymentStats(contractsWithPayments);

    // Calcular estatísticas de clientes
    const clientStats = this._calculateClientStats(clientsArray, startDate);
    
    // Calcular estatísticas de contratos
    const contractStats = this._calculateContractStats(contractsWithPayments, startDate);
    
    // Calcular estatísticas de pagamentos
    const paymentStatsData = this._calculatePaymentStats(allPayments, startDate, today);
    
    // Calcular métricas
    const metrics = this._calculateMetrics(clientStats, contractStats, paymentStatsData, paymentStats);

    return {
      clients: clientStats,
      contracts: contractStats,
      payments: paymentStatsData,
      metrics,
      payment_summary: {
        total_contract_value: paymentStatsData.total_value,
        total_amount_paid: paymentStatsData.paid_value,
        total_amount_remaining: paymentStatsData.pending_value,
        fully_paid_contracts: paymentStats.fully_paid_contracts,
        partially_paid_contracts: contractStats.total - paymentStats.fully_paid_contracts
      },
      period: {
        days: periodDays,
        start_date: startDate,
        end_date: today
      }
    };
  }

  /**
   * Obter dados do gráfico de receita
   * @param {string} period - Período
   * @param {string} type - Tipo do gráfico (monthly, weekly)
   * @returns {Object} Dados do gráfico
   */
  static async getRevenueChart(period, type) {
    const periodNum = parseInt(period);
    const payments = await DashboardRepository.getPaymentsForChart(periodNum, type);
    
    return this._processRevenueChartData(payments, type);
  }

  /**
   * Obter dados do gráfico de pagamentos por status
   * @param {string} period - Período em dias
   * @returns {Object} Dados do gráfico
   */
  static async getPaymentsChart(period) {
    const periodDays = parseInt(period);
    const { startDate } = this._calculateDateRange(periodDays);
    
    const payments = await DashboardRepository.getPaymentsByPeriod(startDate);
    
    return this._processPaymentsChartData(payments);
  }

  /**
   * Obter atividades recentes
   * @param {string} limit - Limite de registros
   * @returns {Array} Lista de atividades
   */
  static async getRecentActivities(limit) {
    const limitNum = parseInt(limit);
    return await DashboardRepository.getRecentActivities(limitNum);
  }

  // Métodos privados auxiliares
  static _calculateDateRange(periodDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startDateStr = startDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    
    return { startDate: startDateStr, today };
  }

  static _associatePaymentsToContracts(contracts, payments) {
    return contracts.map(contract => {
      const contractPayments = payments.filter(payment => payment.contract_id === contract.id);
      return { ...contract, payments: contractPayments };
    });
  }

  static _calculateClientStats(clients, startDate) {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;
    const newClientsThisPeriod = clients.filter(c => c.created_at >= startDate).length;

    return {
      total: totalClients || 0,
      active: activeClients,
      inactive: (totalClients || 0) - activeClients,
      new_this_period: newClientsThisPeriod
    };
  }

  static _calculateContractStats(contracts, startDate) {
    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const pendingContracts = contracts.filter(c => c.status === 'pending').length;
    const completedContracts = contracts.filter(c => c.status === 'completed').length;
    const cancelledContracts = contracts.filter(c => c.status === 'cancelled').length;
    const inactiveContracts = contracts.filter(c => c.status === 'inactive').length;
    const newContractsThisPeriod = contracts.filter(c => c.created_at >= startDate).length;
    const totalContractValue = contracts.reduce((sum, c) => sum + parseFloat(c.value || 0), 0);

    return {
      total: totalContracts,
      active: activeContracts,
      pending: pendingContracts,
      completed: completedContracts,
      cancelled: cancelledContracts,
      inactive: inactiveContracts,
      new_this_period: newContractsThisPeriod,
      total_value: totalContractValue
    };
  }

  static _calculatePaymentStats(payments, startDate, today) {
    const totalPayments = payments.length;
    const paidPayments = payments.filter(p => p.status === 'paid').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const cancelledPayments = payments.filter(p => p.status === 'cancelled').length;
    const overduePayments = payments.filter(p => p.status === 'pending' && p.due_date < today).length;
    
    const totalPaymentValue = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paidValue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const pendingValue = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const overdueValue = payments.filter(p => p.status === 'pending' && p.due_date < today).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const revenueThisPeriod = payments.filter(p => p.status === 'paid' && p.paid_date >= startDate).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paymentsThisPeriod = payments.filter(p => p.status === 'paid' && p.paid_date >= startDate).length;

    return {
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
    };
  }

  static _calculateMetrics(clientStats, contractStats, paymentStats, aggregatePaymentStats) {
    const conversionRate = clientStats.total > 0 ? (contractStats.total / clientStats.total * 100) : 0;
    const paymentRate = paymentStats.total > 0 ? (paymentStats.paid / paymentStats.total * 100) : 0;

    return {
      conversion_rate: Math.round(conversionRate * 100) / 100,
      payment_rate: Math.round(paymentRate * 100) / 100,
      average_contract_value: contractStats.total > 0 ? Math.round((contractStats.total_value / contractStats.total) * 100) / 100 : 0,
      average_payment_value: paymentStats.total > 0 ? Math.round((paymentStats.total_value / paymentStats.total) * 100) / 100 : 0,
      average_percentage_paid: aggregatePaymentStats.average_percentage_paid,
      payment_completion_rate: aggregatePaymentStats.payment_completion_rate,
      contracts_with_down_payment: aggregatePaymentStats.contracts_with_down_payment
    };
  }

  static _processRevenueChartData(payments, type) {
    // Implementar lógica de processamento do gráfico de receita
    // Esta é uma implementação simplificada
    const groupedData = {};
    
    payments.forEach(payment => {
      const date = new Date(payment.payment_date);
      const key = type === 'monthly' 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      
      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += parseFloat(payment.amount || 0);
    });

    return {
      labels: Object.keys(groupedData),
      data: Object.values(groupedData)
    };
  }

  static _processPaymentsChartData(payments) {
    const statusCounts = {
      paid: 0,
      pending: 0,
      overdue: 0,
      cancelled: 0
    };

    const today = new Date().toISOString().split('T')[0];
    
    payments.forEach(payment => {
      if (payment.status === 'paid') {
        statusCounts.paid++;
      } else if (payment.status === 'pending') {
        if (payment.due_date < today) {
          statusCounts.overdue++;
        } else {
          statusCounts.pending++;
        }
      } else if (payment.status === 'cancelled') {
        statusCounts.cancelled++;
      }
    });

    return {
      labels: ['Pagos', 'Pendentes', 'Em Atraso', 'Cancelados'],
      data: [statusCounts.paid, statusCounts.pending, statusCounts.overdue, statusCounts.cancelled]
    };
  }
}

module.exports = { DashboardService };