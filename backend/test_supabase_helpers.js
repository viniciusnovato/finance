const { createClient } = require('@supabase/supabase-js');
const { getAllPayments } = require('./src/utils/supabaseHelpers');
require('dotenv').config();

async function testSupabaseHelpers() {
  console.log('🔍 Testando funções do supabaseHelpers.js...');
  
  // Configurar cliente Supabase
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  try {
    // Testar getAllPayments
    console.log('\n📊 Buscando todos os pagamentos...');
    const allPayments = await getAllPayments(supabaseAdmin);
    
    console.log(`Total de pagamentos: ${allPayments.length}`);
    
    // Calcular estatísticas
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const pendingValue = pendingPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    console.log(`Pagamentos pendentes: ${pendingPayments.length}`);
    console.log(`Valor total pendente: ${pendingValue}`);
    
    // Comparar com consulta direta
    console.log('\n🔍 Comparando com consulta direta...');
    const { data: directQuery } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'pending');
    
    const directValue = (directQuery || []).reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    console.log(`Valor direto (limitado): ${directValue}`);
    console.log(`Registros diretos: ${directQuery?.length || 0}`);
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testSupabaseHelpers();