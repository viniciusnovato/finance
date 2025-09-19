require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function testFullData() {
  try {
    console.log('🔍 Testando acesso completo aos dados...');
    
    // Teste 1: Contar total de pagamentos
    const { count: totalCount, error: countError } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Erro ao contar:', countError);
      return;
    }
    
    console.log('Total de pagamentos na base:', totalCount);
    
    // Teste 2: Buscar todos os pagamentos com range
    const { data: allPayments, error: allError } = await supabaseAdmin
      .from('payments')
      .select('id, status, amount')
      .range(0, 50000);
    
    if (allError) {
      console.error('Erro ao buscar todos:', allError);
      return;
    }
    
    console.log('Pagamentos retornados com range:', allPayments?.length || 0);
    
    // Teste 3: Pagamentos pendentes
    const pendingPayments = allPayments?.filter(p => p.status === 'pending') || [];
    const pendingValue = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    console.log('Pagamentos pendentes:', pendingPayments.length);
    console.log('Valor total pendente:', pendingValue.toFixed(2));
    
    // Teste 4: Comparar com consulta direta de pendentes
    const { data: directPending, error: directError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'pending')
      .range(0, 50000);
    
    if (directError) {
      console.error('Erro na consulta direta:', directError);
      return;
    }
    
    const directValue = directPending?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    
    console.log('\n📊 Comparação:');
    console.log('- Pendentes (filtro após busca):', pendingPayments.length, '- Valor:', pendingValue.toFixed(2));
    console.log('- Pendentes (consulta direta):', directPending?.length || 0, '- Valor:', directValue.toFixed(2));
    
    if (Math.abs(pendingValue - directValue) < 0.01) {
      console.log('✅ Valores consistentes!');
    } else {
      console.log('❌ Valores inconsistentes!');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testFullData();