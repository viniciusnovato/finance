/**
 * Utilitários para trabalhar com Supabase e contornar limitações de paginação
 */

/**
 * Busca todos os registros de uma tabela usando paginação automática
 * @param {Object} supabase - Cliente Supabase
 * @param {string} table - Nome da tabela
 * @param {string} select - Campos a selecionar
 * @param {Object} filters - Filtros a aplicar (opcional)
 * @returns {Promise<Array>} Array com todos os registros
 */
async function getAllRecords(supabase, table, select = '*', filters = {}) {
  let allRecords = [];
  let page = 0;
  const pageSize = 1000; // Limite máximo do Supabase
  let hasMore = true;
  
  while (hasMore) {
    const start = page * pageSize;
    const end = start + pageSize - 1;
    
    let query = supabase
      .from(table)
      .select(select)
      .range(start, end);
    
    // Aplicar filtros se fornecidos
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'eq') {
        Object.entries(value).forEach(([field, fieldValue]) => {
          query = query.eq(field, fieldValue);
        });
      } else if (key === 'in') {
        Object.entries(value).forEach(([field, fieldValue]) => {
          query = query.in(field, fieldValue);
        });
      } else if (key === 'gte') {
        Object.entries(value).forEach(([field, fieldValue]) => {
          query = query.gte(field, fieldValue);
        });
      } else if (key === 'lte') {
        Object.entries(value).forEach(([field, fieldValue]) => {
          query = query.lte(field, fieldValue);
        });
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      hasMore = false;
    } else {
      allRecords = allRecords.concat(data);
      
      if (data.length < pageSize) {
        hasMore = false;
      }
    }
    
    page++;
    
    // Limite de segurança para evitar loop infinito
    if (page > 50) {
      console.warn(`Limite de páginas alcançado (50 páginas) para tabela ${table}`);
      break;
    }
  }
  
  return allRecords;
}

/**
 * Busca todos os pagamentos com filtros específicos
 * @param {Object} supabase - Cliente Supabase
 * @param {Object} filters - Filtros a aplicar
 * @returns {Promise<Array>} Array com todos os pagamentos
 */
async function getAllPayments(supabase, filters = {}) {
  return getAllRecords(supabase, 'payments', 'id, contract_id, amount, status, due_date, paid_date, created_at', filters);
}

/**
 * Busca todos os contratos com filtros específicos
 * @param {Object} supabase - Cliente Supabase
 * @param {Object} filters - Filtros a aplicar
 * @returns {Promise<Array>} Array com todos os contratos
 */
async function getAllContracts(supabase, filters = {}) {
  return getAllRecords(supabase, 'contracts', 'id, status, value, down_payment, number_of_payments, created_at', filters);
}

/**
 * Busca todos os clientes com filtros específicos
 * @param {Object} supabase - Cliente Supabase
 * @param {Object} filters - Filtros a aplicar
 * @returns {Promise<Array>} Array com todos os clientes
 */
async function getAllClients(supabase, filters = {}) {
  return getAllRecords(supabase, 'clients', 'id, first_name, last_name, email, phone, status, created_at', filters);
}

module.exports = {
  getAllRecords,
  getAllPayments,
  getAllContracts,
  getAllClients
};