require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function investigateDifference() {
  try {
    console.log('🔍 Investigando diferença nos pagamentos...');
    
    // Consulta 1: Como o dashboard faz (sem limitação de registros)
    const { data: dashboardPayments, error: dashboardError } = await supabaseAdmin
      .from('payments')
      .select('id, status, amount, due_date, paid_date')
      .range(0, 50000);
    
    if (dashboardError) {
      console.error('Erro na consulta do dashboard:', dashboardError);
      return;
    }
    
    console.log('Pagamentos retornados pelo dashboard:', dashboardPayments?.length || 0);
    
    const dashboardPending = dashboardPayments?.filter(p => p.status === 'pending') || [];
    const dashboardPendingValue = dashboardPending.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    console.log('Pagamentos pendentes (dashboard):', dashboardPending.length);
    console.log('Valor pendente (dashboard):', dashboardPendingValue.toFixed(2));
    
    // Consulta 2: Direta como fiz antes (sem limitação de registros)
    const { data: directPayments, error: directError } = await supabaseAdmin
      .from('payments')
      .select('id, status, amount')
      .eq('status', 'pending')
      .range(0, 50000);
    
    if (directError) {
      console.error('Erro na consulta direta:', directError);
      return;
    }
    
    const directPendingValue = directPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    
    console.log('\nPagamentos pendentes (consulta direta):', directPayments?.length || 0);
    console.log('Valor pendente (consulta direta):', directPendingValue.toFixed(2));
    
    // Verificar se há algum filtro ou limitação
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('Erro ao contar total:', countError);
    } else {
      console.log('\nTotal de pagamentos na base:', totalCount);
    }
    
    // Verificar diferenças
    console.log('\n📊 Análise:');
    console.log('- Dashboard retorna:', dashboardPayments?.length || 0, 'pagamentos');
    console.log('- Total na base:', totalCount);
    console.log('- Diferença:', (totalCount || 0) - (dashboardPayments?.length || 0));
    
    if ((dashboardPayments?.length || 0) < (totalCount || 0)) {
      console.log('\n⚠️  O dashboard não está retornando todos os pagamentos!');
      console.log('Possível causa: limitação na consulta ou filtro não documentado.');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

investigateDifference();