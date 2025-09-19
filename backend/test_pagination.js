require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function testPagination() {
  try {
    console.log('🔍 Testando paginação para acessar todos os dados...');
    
    let allPayments = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const start = page * pageSize;
      const end = start + pageSize - 1;
      
      console.log(`Buscando página ${page + 1} (registros ${start}-${end})...`);
      
      const { data: pageData, error } = await supabaseAdmin
        .from('payments')
        .select('id, status, amount')
        .range(start, end);
      
      if (error) {
        console.error('Erro na página', page + 1, ':', error);
        break;
      }
      
      if (!pageData || pageData.length === 0) {
        hasMore = false;
        console.log('Fim dos dados alcançado.');
      } else {
        allPayments = allPayments.concat(pageData);
        console.log(`Página ${page + 1}: ${pageData.length} registros`);
        
        if (pageData.length < pageSize) {
          hasMore = false;
          console.log('Última página alcançada.');
        }
      }
      
      page++;
      
      // Limite de segurança para evitar loop infinito
      if (page > 20) {
        console.log('Limite de páginas alcançado (20 páginas).');
        break;
      }
    }
    
    console.log('\n📊 Resultado final:');
    console.log('Total de pagamentos coletados:', allPayments.length);
    
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const pendingValue = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    console.log('Pagamentos pendentes:', pendingPayments.length);
    console.log('Valor total pendente:', pendingValue.toFixed(2));
    
    // Verificar se conseguimos todos os registros
    const { count: totalCount } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n🔍 Verificação:');
    console.log('Total na base:', totalCount);
    console.log('Total coletado:', allPayments.length);
    
    if (allPayments.length === totalCount) {
      console.log('✅ Todos os registros foram coletados!');
    } else {
      console.log('❌ Alguns registros não foram coletados.');
      console.log('Diferença:', totalCount - allPayments.length);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testPagination();