const { supabaseAdmin } = require('../config/supabase');

class ClientRepository {
  /**
   * Obter lista de clientes com paginação e filtros
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista paginada de clientes
   */
  static async getClients(options) {
    const { page, limit, search, status, sortBy, sortOrder } = options;
    
    try {
      let query = supabaseAdmin
        .from('clients')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,tax_id.ilike.%${search}%`);
      }

      if (status) {
        query = query.eq('status', status);
      }

      // Aplicar ordenação
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar paginação
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        throw new Error('Erro ao buscar clientes');
      }

      const totalPages = Math.ceil(count / limit);

      return {
        clients: data || [],
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: count,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Erro no ClientRepository.getClients:', error);
      throw error;
    }
  }

  /**
   * Obter cliente por ID
   * @param {string} id - ID do cliente
   * @returns {Object|null} Dados do cliente
   */
  static async getClientById(id) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente não encontrado
        }
        console.error('Erro ao buscar cliente por ID:', error);
        throw new Error('Erro ao buscar cliente');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClientRepository.getClientById:', error);
      throw error;
    }
  }

  /**
   * Obter cliente por CPF/CNPJ
   * @param {string} taxId - CPF/CNPJ do cliente
   * @returns {Object|null} Dados do cliente
   */
  static async getClientByTaxId(taxId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('tax_id', taxId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente não encontrado
        }
        console.error('Erro ao buscar cliente por CPF/CNPJ:', error);
        throw new Error('Erro ao buscar cliente');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClientRepository.getClientByTaxId:', error);
      throw error;
    }
  }

  /**
   * Obter cliente por email
   * @param {string} email - Email do cliente
   * @returns {Object|null} Dados do cliente
   */
  static async getClientByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('email', email.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente não encontrado
        }
        console.error('Erro ao buscar cliente por email:', error);
        throw new Error('Erro ao buscar cliente');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClientRepository.getClientByEmail:', error);
      throw error;
    }
  }

  /**
   * Criar novo cliente
   * @param {Object} clientData - Dados do cliente
   * @returns {Object} Cliente criado
   */
  static async createClient(clientData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar cliente:', error);
        throw new Error('Erro ao criar cliente');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClientRepository.createClient:', error);
      throw error;
    }
  }

  /**
   * Atualizar cliente
   * @param {string} id - ID do cliente
   * @param {Object} updateData - Dados para atualização
   * @returns {Object|null} Cliente atualizado
   */
  static async updateClient(id, updateData) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Cliente não encontrado
        }
        console.error('Erro ao atualizar cliente:', error);
        throw new Error('Erro ao atualizar cliente');
      }

      return data;
    } catch (error) {
      console.error('Erro no ClientRepository.updateClient:', error);
      throw error;
    }
  }

  /**
   * Deletar cliente
   * @param {string} id - ID do cliente
   * @returns {boolean} Sucesso da operação
   */
  static async deleteClient(id) {
    try {
      const { error } = await supabaseAdmin
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar cliente:', error);
        throw new Error('Erro ao deletar cliente');
      }

      return true;
    } catch (error) {
      console.error('Erro no ClientRepository.deleteClient:', error);
      throw error;
    }
  }

  /**
   * Verificar se cliente possui contratos
   * @param {string} clientId - ID do cliente
   * @returns {boolean} Se possui contratos
   */
  static async clientHasContracts(clientId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('contracts')
        .select('id')
        .eq('client_id', clientId)
        .limit(1);

      if (error) {
        console.error('Erro ao verificar contratos do cliente:', error);
        throw new Error('Erro ao verificar contratos');
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Erro no ClientRepository.clientHasContracts:', error);
      throw error;
    }
  }

  /**
   * Verificar se cliente possui pagamentos
   * @param {string} clientId - ID do cliente
   * @returns {boolean} Se possui pagamentos
   */
  static async clientHasPayments(clientId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('payments')
        .select('id')
        .in('contract_id', 
          supabaseAdmin
            .from('contracts')
            .select('id')
            .eq('client_id', clientId)
        )
        .limit(1);

      if (error) {
        console.error('Erro ao verificar pagamentos do cliente:', error);
        throw new Error('Erro ao verificar pagamentos');
      }

      return (data || []).length > 0;
    } catch (error) {
      console.error('Erro no ClientRepository.clientHasPayments:', error);
      throw error;
    }
  }

  /**
   * Obter contratos do cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista paginada de contratos
   */
  static async getClientContracts(clientId, options) {
    const { page, limit, status } = options;
    
    try {
      let query = supabaseAdmin
        .from('contracts')
        .select('*', { count: 'exact' })
        .eq('client_id', clientId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar contratos do cliente:', error);
        throw new Error('Erro ao buscar contratos');
      }

      const totalPages = Math.ceil(count / limit);

      return {
        contracts: data || [],
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: count,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Erro no ClientRepository.getClientContracts:', error);
      throw error;
    }
  }

  /**
   * Obter pagamentos do cliente
   * @param {string} clientId - ID do cliente
   * @param {Object} options - Opções de busca
   * @returns {Object} Lista paginada de pagamentos
   */
  static async getClientPayments(clientId, options) {
    const { page, limit, status } = options;
    
    try {
      let query = supabaseAdmin
        .from('payments')
        .select(`
          *,
          contracts!inner (
            id,
            contract_number,
            client_id
          )
        `, { count: 'exact' })
        .eq('contracts.client_id', clientId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Erro ao buscar pagamentos do cliente:', error);
        throw new Error('Erro ao buscar pagamentos');
      }

      const totalPages = Math.ceil(count / limit);

      return {
        payments: data || [],
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: count,
          items_per_page: limit,
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Erro no ClientRepository.getClientPayments:', error);
      throw error;
    }
  }

  /**
   * Buscar clientes por termo
   * @param {string} query - Termo de busca
   * @param {number} limit - Limite de resultados
   * @returns {Array} Lista de clientes
   */
  static async searchClients(query, limit) {
    try {
      const { data, error } = await supabaseAdmin
        .from('clients')
        .select('id, name, email, tax_id, phone, status')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,tax_id.ilike.%${query}%`)
        .eq('status', 'active')
        .order('name')
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar clientes:', error);
        throw new Error('Erro ao buscar clientes');
      }

      return data || [];
    } catch (error) {
      console.error('Erro no ClientRepository.searchClients:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do cliente
   * @param {string} clientId - ID do cliente
   * @returns {Object} Estatísticas do cliente
   */
  static async getClientStats(clientId) {
    try {
      // Buscar contratos do cliente
      const { data: contracts, error: contractsError } = await supabaseAdmin
        .from('contracts')
        .select('id, value, status, created_at')
        .eq('client_id', clientId);

      if (contractsError) {
        console.error('Erro ao buscar contratos para estatísticas:', contractsError);
        throw new Error('Erro ao buscar estatísticas');
      }

      // Buscar pagamentos do cliente
      const contractIds = (contracts || []).map(c => c.id);
      let payments = [];
      
      if (contractIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabaseAdmin
          .from('payments')
          .select('amount, status, paid_date, due_date')
          .in('contract_id', contractIds);

        if (paymentsError) {
          console.error('Erro ao buscar pagamentos para estatísticas:', paymentsError);
          throw new Error('Erro ao buscar estatísticas');
        }

        payments = paymentsData || [];
      }

      // Calcular estatísticas
      const totalContracts = contracts.length;
      const activeContracts = contracts.filter(c => c.status === 'active').length;
      const totalContractValue = contracts.reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
      
      const totalPayments = payments.length;
      const paidPayments = payments.filter(p => p.status === 'paid').length;
      const pendingPayments = payments.filter(p => p.status === 'pending').length;
      const overduePayments = payments.filter(p => {
        return p.status === 'pending' && p.due_date < new Date().toISOString().split('T')[0];
      }).length;
      
      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      
      const totalPending = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      return {
        contracts: {
          total: totalContracts,
          active: activeContracts,
          total_value: totalContractValue
        },
        payments: {
          total: totalPayments,
          paid: paidPayments,
          pending: pendingPayments,
          overdue: overduePayments,
          total_paid: totalPaid,
          total_pending: totalPending,
          payment_rate: totalPayments > 0 ? (paidPayments / totalPayments * 100) : 0
        }
      };
    } catch (error) {
      console.error('Erro no ClientRepository.getClientStats:', error);
      throw error;
    }
  }
}

module.exports = { ClientRepository };