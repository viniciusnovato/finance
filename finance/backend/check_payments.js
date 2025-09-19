require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function checkPayments() {
  try {
    console.log('🔍 Verificando pagamentos pendentes...');
    
    // Buscar amostra de pagamentos pendentes
    const { data: samplePayments, error: sampleError } = await supabaseAdmin
      .from('payments')
      .select('id, status, amount')
      .eq('status', 'pending')
      .limit(5);
    
    if (sampleError) {
      console.error('Erro ao buscar amostra:', sampleError);
      return;
    }
    
    console.log('Pagamentos pendentes (amostra):', samplePayments?.length || 0);
    if (samplePayments && samplePayments.length > 0) {
      console.log('Primeiro pagamento:', samplePayments[0]);
    }
    
    // Contar total de pagamentos pendentes
    const { count, error: countError } = await supabaseAdmin
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('status', 'pending');
    
    if (countError) {
      console.error('Erro ao contar:', countError);
      return;
    }
    
    console.log('Total de pagamentos pendentes:', count);
    
    // Somar valores dos pagamentos pendentes
    const { data: allPending, error: sumError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'pending');
    
    if (sumError) {
      console.error('Erro ao somar:', sumError);
      return;
    }
    
    const totalPendingValue = allPending?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    console.log('Valor total dos pagamentos pendentes:', totalPendingValue);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkPayments();