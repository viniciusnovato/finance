const { supabaseAdmin } = require('../config/supabase');

class PaymentRepository {
  constructor() {
    this.tableName = 'payments';
  }

  async findAll(offset = 0, limit = 10, filters = {}) {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              first_name,
              last_name,
              email
            )
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.contract_id) {
        query = query.eq('contract_id', filters.contract_id);
      }
      if (filters.payment_method) {
        query = query.eq('payment_method', filters.payment_method);
      }
      if (filters.start_date) {
        query = query.gte('due_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('due_date', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            total_amount,
            client:clients(
              id,
              name,
              email,
              phone
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao buscar pagamento: ${error.message}`);
    }
  }

  async create(paymentData) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert(paymentData)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao criar pagamento: ${error.message}`);
    }
  }

  async update(id, paymentData) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          ...paymentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar pagamento: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const { error } = await supabaseAdmin
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      throw new Error(`Erro ao excluir pagamento: ${error.message}`);
    }
  }

  async updateStatus(id, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar status do pagamento: ${error.message}`);
    }
  }

  async search(searchTerm, offset = 0, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `)
        .or(`
          contract.contract_number.ilike.%${searchTerm}%,
          contract.client.name.ilike.%${searchTerm}%,
          contract.client.email.ilike.%${searchTerm}%,
          payment_method.ilike.%${searchTerm}%,
          status.ilike.%${searchTerm}%
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos: ${error.message}`);
    }
  }

  async findOverdue(offset = 0, limit = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email,
              phone
            )
          )
        `)
        .lt('due_date', today)
        .neq('status', 'pago')
        .neq('status', 'cancelado')
        .range(offset, offset + limit - 1)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos em atraso: ${error.message}`);
    }
  }

  async findDueToday(offset = 0, limit = 10) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email,
              phone
            )
          )
        `)
        .eq('due_date', today)
        .neq('status', 'pago')
        .neq('status', 'cancelado')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos que vencem hoje: ${error.message}`);
    }
  }

  async findByContract(contractId, offset = 0, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `)
        .eq('contract_id', contractId)
        .range(offset, offset + limit - 1)
        .order('installment_number', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos do contrato: ${error.message}`);
    }
  }

  async findByClient(clientId, offset = 0, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts!inner(
            id,
            contract_number,
            client:clients!inner(
              id,
              name,
              email
            )
          )
        `)
        .eq('contract.client.id', clientId)
        .range(offset, offset + limit - 1)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos do cliente: ${error.message}`);
    }
  }

  async findForExport(filters = {}) {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.contract_id) {
        query = query.eq('contract_id', filters.contract_id);
      }
      if (filters.start_date) {
        query = query.gte('due_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('due_date', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos para exportação: ${error.message}`);
    }
  }

  async bulkUpdate(paymentIds, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .in('id', paymentIds)
        .select(`
          *,
          contract:contracts(
            id,
            contract_number,
            client:clients(
              id,
              name,
              email
            )
          )
        `);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao atualizar pagamentos em lote: ${error.message}`);
    }
  }

  // Métodos de contagem
  async count(filters = {}) {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.contract_id) {
        query = query.eq('contract_id', filters.contract_id);
      }
      if (filters.start_date) {
        query = query.gte('due_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('due_date', filters.end_date);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar pagamentos: ${error.message}`);
    }
  }

  async countSearch(searchTerm) {
    try {
      const { count, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .or(`
          contract.contract_number.ilike.%${searchTerm}%,
          contract.client.name.ilike.%${searchTerm}%,
          contract.client.email.ilike.%${searchTerm}%,
          payment_method.ilike.%${searchTerm}%,
          status.ilike.%${searchTerm}%
        `);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar resultados da busca: ${error.message}`);
    }
  }

  async countOverdue() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .lt('due_date', today)
        .neq('status', 'pago')
        .neq('status', 'cancelado');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar pagamentos em atraso: ${error.message}`);
    }
  }

  async countDueToday() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { count, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('due_date', today)
        .neq('status', 'pago')
        .neq('status', 'cancelado');

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar pagamentos que vencem hoje: ${error.message}`);
    }
  }

  async countByContract(contractId) {
    try {
      const { count, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('contract_id', contractId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar pagamentos do contrato: ${error.message}`);
    }
  }

  async countByClient(clientId) {
    try {
      const { count, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .eq('contract.client.id', clientId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar pagamentos do cliente: ${error.message}`);
    }
  }

  // Métodos de verificação
  async checkContractExists(contractId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contracts')
        .select('id')
        .eq('id', contractId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      throw new Error(`Erro ao verificar contrato: ${error.message}`);
    }
  }

  // Métodos de estatísticas
  async getStats(period = '30d') {
    try {
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabaseAdmin
        .rpc('get_payment_stats', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      if (error) throw error;
      return data || {};
    } catch (error) {
      // Fallback para cálculo manual se a função RPC não existir
      return await this.calculateStatsManually(period);
    }
  }

  async calculateStatsManually(period = '30d') {
    try {
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }

      const { data: allPayments, error } = await supabaseAdmin
        .from(this.tableName)
        .select('status, amount')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const stats = {
        total_payments: allPayments.length,
        paid_payments: 0,
        pending_payments: 0,
        overdue_payments: 0,
        total_amount: 0,
        paid_amount: 0,
        pending_amount: 0,
        overdue_amount: 0
      };

      allPayments.forEach(payment => {
        const amount = parseFloat(payment.amount) || 0;
        stats.total_amount += amount;

        switch (payment.status) {
          case 'pago':
            stats.paid_payments++;
            stats.paid_amount += amount;
            break;
          case 'pendente':
            stats.pending_payments++;
            stats.pending_amount += amount;
            break;
          case 'atrasado':
            stats.overdue_payments++;
            stats.overdue_amount += amount;
            break;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Erro ao calcular estatísticas: ${error.message}`);
    }
  }

  async getRevenueChart(period = '12m', groupBy = 'month') {
    try {
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '12m':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }

      const { data, error } = await supabaseAdmin
        .rpc('get_revenue_chart', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          group_by: groupBy
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Fallback para cálculo manual se a função RPC não existir
      return await this.calculateRevenueChartManually(period, groupBy);
    }
  }

  async calculateRevenueChartManually(period = '12m', groupBy = 'month') {
    try {
      let startDate;
      const endDate = new Date();
      
      switch (period) {
        case '7d':
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '12m':
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
      }

      const { data: payments, error } = await supabaseAdmin
        .from(this.tableName)
        .select('payment_date, amount')
        .eq('status', 'pago')
        .gte('payment_date', startDate.toISOString())
        .lte('payment_date', endDate.toISOString())
        .order('payment_date', { ascending: true });

      if (error) throw error;

      // Agrupar dados por período
      const groupedData = {};
      
      payments.forEach(payment => {
        if (!payment.payment_date) return;
        
        const date = new Date(payment.payment_date);
        let key;
        
        if (groupBy === 'day') {
          key = date.toISOString().split('T')[0];
        } else if (groupBy === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else {
          key = date.getFullYear().toString();
        }
        
        if (!groupedData[key]) {
          groupedData[key] = { period: key, amount: 0, count: 0 };
        }
        
        groupedData[key].amount += parseFloat(payment.amount) || 0;
        groupedData[key].count++;
      });

      return Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      throw new Error(`Erro ao calcular gráfico de receita: ${error.message}`);
    }
  }
}

module.exports = PaymentRepository;