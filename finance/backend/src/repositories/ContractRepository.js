const { supabaseAdmin } = require('../config/supabase');
const { formatDateForDB } = require('../utils/formatters');

class ContractRepository {
  constructor() {
    this.tableName = 'contracts';
    this.paymentsTable = 'payments';
    this.clientsTable = 'clients';
  }

  async findAll(offset = 0, limit = 10, filters = {}) {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          client:clients(id, first_name, last_name, email, tax_id)
        `, { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('end_date', filters.end_date);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        contracts: data || [],
        pagination: {
          total: count || 0,
          page: Math.floor(offset / limit) + 1,
          limit: limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(`Erro ao buscar contratos: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          client:clients(id, name, email, cpf_cnpj, phone)
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao buscar contrato por ID: ${error.message}`);
    }
  }

  async findByNumber(contractNumber) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('*')
        .eq('contract_number', contractNumber)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao buscar contrato por número: ${error.message}`);
    }
  }

  async create(contractData) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .insert([contractData])
        .select(`
          *,
          client:clients(id, name, email, cpf_cnpj)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao criar contrato: ${error.message}`);
    }
  }

  async update(id, contractData) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update(contractData)
        .eq('id', id)
        .select(`
          *,
          client:clients(id, name, email, cpf_cnpj)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar contrato: ${error.message}`);
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
      throw new Error(`Erro ao excluir contrato: ${error.message}`);
    }
  }

  async count(filters = {}) {
    try {
      let query = supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      // Aplicar filtros
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters.start_date) {
        query = query.gte('start_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('end_date', filters.end_date);
      }

      const { count, error } = await query;
      if (error) throw error;

      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar contratos: ${error.message}`);
    }
  }

  async checkClientExists(clientId) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.clientsTable)
        .select('id')
        .eq('id', clientId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      throw new Error(`Erro ao verificar cliente: ${error.message}`);
    }
  }

  async hasPayments(contractId) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.paymentsTable)
        .select('id')
        .eq('contract_id', contractId)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      throw new Error(`Erro ao verificar pagamentos: ${error.message}`);
    }
  }

  async getPayments(contractId, offset = 0, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.paymentsTable)
        .select('*')
        .eq('contract_id', contractId)
        .range(offset, offset + limit - 1)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar pagamentos do contrato: ${error.message}`);
    }
  }

  async countPayments(contractId) {
    try {
      const { count, error } = await supabaseAdmin
        .from(this.paymentsTable)
        .select('id', { count: 'exact', head: true })
        .eq('contract_id', contractId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar pagamentos do contrato: ${error.message}`);
    }
  }

  async createInstallments(contractId, installments) {
    try {
      const paymentsData = installments.map(installment => ({
        contract_id: contractId,
        amount: installment.amount,
        due_date: formatDateForDB(installment.due_date),
        status: 'pendente',
        installment_number: installment.number
      }));

      const { data, error } = await supabaseAdmin
        .from(this.paymentsTable)
        .insert(paymentsData)
        .select('*');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao criar parcelas: ${error.message}`);
    }
  }

  async getStats(contractId) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.paymentsTable)
        .select('amount, status')
        .eq('contract_id', contractId);

      if (error) throw error;

      const payments = data || [];
      const paidPayments = payments.filter(p => p.status === 'pago');
      const pendingPayments = payments.filter(p => p.status === 'pendente');

      return {
        paid_value: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
        payment_count: paidPayments.length,
        pending_payments: pendingPayments.length,
        total_payments: payments.length
      };
    } catch (error) {
      throw new Error(`Erro ao calcular estatísticas do contrato: ${error.message}`);
    }
  }

  async search(searchTerm, offset = 0, limit = 10) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select(`
          *,
          client:clients(id, name, email, cpf_cnpj)
        `)
        .or(`contract_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,clients.name.ilike.%${searchTerm}%`)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar contratos: ${error.message}`);
    }
  }

  async countSearch(searchTerm) {
    try {
      const { count, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id', { count: 'exact', head: true })
        .or(`contract_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,clients.name.ilike.%${searchTerm}%`);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      throw new Error(`Erro ao contar busca de contratos: ${error.message}`);
    }
  }

  async updateStatus(id, status) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(`
          *,
          client:clients(id, name, email, cpf_cnpj)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Erro ao atualizar status do contrato: ${error.message}`);
    }
  }

  // Métodos para estatísticas e relatórios
  async getContractsByPeriod(startDate, endDate) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('id, total_value, status, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar contratos por período: ${error.message}`);
    }
  }

  async getRevenueByPeriod(startDate, endDate) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.tableName)
        .select('total_value, created_at')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'ativo');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Erro ao buscar receita por período: ${error.message}`);
    }
  }
}

module.exports = ContractRepository;