const { supabaseAdmin } = require('../config/supabase');
const { getAllRecords, getAllPayments, getAllContracts, getAllClients } = require('../utils/supabaseHelpers');

class DashboardRepository {
  /**
   * Obter todos os clientes
   * @returns {Array} Lista de clientes
   */
  static async getAllClients() {
    return await getAllClients(supabaseAdmin);
  }

  /**
   * Obter todos os contratos
   * @returns {Array} Lista de contratos
   */
  static async getAllContracts() {
    return await getAllContracts(supabaseAdmin);
  }

  /**
   * Obter todos os pagamentos
   * @returns {Array} Lista de pagamentos
   */
  static async getAllPayments() {
    return await getAllPayments(supabaseAdmin);
  }

  /**
   * Obter pagamentos para gráfico de receita
   * @param {number} period - Período em meses ou semanas
   * @param {string} type - Tipo do período (monthly, weekly)
   * @returns {Array} Lista de pagamentos
   */
  static async getPaymentsForChart(period, type) {
    try {
      let startDate;
      const today = new Date();
      
      if (type === 'monthly') {
        startDate = new Date(today.getFullYear(), today.getMonth() - period, 1);
      } else {
        startDate = new Date(today.getTime() - (period * 7 * 24 * 60 * 60 * 1000));
      }
      
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('status', 'paid')
        .gte('paid_date', startDateStr)
        .order('paid_date', { ascending: true });

      if (error) {
        console.error('Erro ao buscar pagamentos para gráfico:', error);
        throw new Error('Erro ao buscar dados do gráfico');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no DashboardRepository.getPaymentsForChart:', error);
      throw error;
    }
  }

  /**
   * Obter pagamentos por período
   * @param {string} startDate - Data de início
   * @returns {Array} Lista de pagamentos
   */
  static async getPaymentsByPeriod(startDate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar pagamentos por período:', error);
        throw new Error('Erro ao buscar pagamentos');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no DashboardRepository.getPaymentsByPeriod:', error);
      throw error;
    }
  }

  /**
   * Obter atividades recentes
   * @param {number} limit - Limite de registros
   * @returns {Array} Lista de atividades
   */
  static async getRecentActivities(limit) {
    try {
      // Buscar pagamentos recentes
      const { data: recentPayments, error: paymentsError } = await supabaseAdmin
        .from('payments')
        .select(`
          id,
          amount,
          status,
          paid_date,
          created_at,
          contracts (
            id,
            clients (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 2));

      if (paymentsError) {
        console.error('Erro ao buscar pagamentos recentes:', paymentsError);
      }

      // Buscar contratos recentes
      const { data: recentContracts, error: contractsError } = await supabaseAdmin
        .from('contracts')
        .select(`
          id,
          value,
          status,
          created_at,
          clients (
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(Math.floor(limit / 2));

      if (contractsError) {
        console.error('Erro ao buscar contratos recentes:', contractsError);
      }

      // Combinar e formatar atividades
      const activities = [];

      // Adicionar pagamentos como atividades
      if (recentPayments) {
        recentPayments.forEach(payment => {
          activities.push({
            id: `payment_${payment.id}`,
            type: 'payment',
            title: `Pagamento ${payment.status === 'paid' ? 'realizado' : 'criado'}`,
            description: `R$ ${parseFloat(payment.amount || 0).toFixed(2)} - ${payment.contracts?.clients?.name || 'Cliente não identificado'}`,
            date: payment.paid_date || payment.created_at,
            status: payment.status,
            amount: payment.amount
          });
        });
      }

      // Adicionar contratos como atividades
      if (recentContracts) {
        recentContracts.forEach(contract => {
          activities.push({
            id: `contract_${contract.id}`,
            type: 'contract',
            title: 'Novo contrato criado',
            description: `R$ ${parseFloat(contract.value || 0).toFixed(2)} - ${contract.clients?.name || 'Cliente não identificado'}`,
            date: contract.created_at,
            status: contract.status,
            amount: contract.value
          });
        });
      }

      // Ordenar por data e limitar
      return activities
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, limit);

    } catch (error) {
      console.error('Erro no DashboardRepository.getRecentActivities:', error);
      return [];
    }
  }

  /**
   * Obter clientes por período
   * @param {string} startDate - Data de início
   * @returns {Array} Lista de clientes
   */
  static async getClientsByPeriod(startDate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar clientes por período:', error);
        throw new Error('Erro ao buscar clientes');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no DashboardRepository.getClientsByPeriod:', error);
      throw error;
    }
  }

  /**
   * Obter contratos por período
   * @param {string} startDate - Data de início
   * @returns {Array} Lista de contratos
   */
  static async getContractsByPeriod(startDate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contracts')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar contratos por período:', error);
        throw new Error('Erro ao buscar contratos');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no DashboardRepository.getContractsByPeriod:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de receita por período
   * @param {string} startDate - Data de início
   * @param {string} endDate - Data de fim
   * @returns {Object} Estatísticas de receita
   */
  static async getRevenueStatsByPeriod(startDate, endDate) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('amount, paid_date')
        .eq('status', 'paid')
        .gte('paid_date', startDate)
        .lte('paid_date', endDate);

      if (error) {
        console.error('Erro ao buscar estatísticas de receita:', error);
        throw new Error('Erro ao buscar estatísticas de receita');
      }

      const totalRevenue = (data || []).reduce((sum, payment) => {
        return sum + parseFloat(payment.amount || 0);
      }, 0);

      return {
        total_revenue: totalRevenue,
        payment_count: (data || []).length,
        average_payment: (data || []).length > 0 ? totalRevenue / (data || []).length : 0
      };
    } catch (error) {
      console.error('Erro no DashboardRepository.getRevenueStatsByPeriod:', error);
      throw error;
    }
  }
}

module.exports = { DashboardRepository };