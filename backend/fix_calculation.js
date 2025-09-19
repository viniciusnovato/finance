require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function analyzeCorrectCalculation() {
  try {
    console.log('🔍 Analisando cálculo correto...');
    
    // Método 1: Somar todos os pagamentos pendentes diretamente
    const { data: pendingPayments, error: pendingError } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('status', 'pending');
    
    if (pendingError) {
      console.error('Erro ao buscar pagamentos pendentes:', pendingError);
      return;
    }
    
    const totalPendingDirect = pendingPayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;
    console.log('Método 1 - Soma direta dos pagamentos pendentes:', totalPendingDirect.toFixed(2));
    
    // Método 2: Por contrato - somar valor total de cada contrato e subtrair o que foi pago
    const { data: contracts } = await supabaseAdmin
      .from('contracts')
      .select('id');
    
    let totalByContract = 0;
    let contractsProcessed = 0;
    
    for (const contract of contracts || []) {
      // Buscar todos os pagamentos do contrato
      const { data: allPayments } = await supabaseAdmin
        .from('payments')
        .select('amount, status')
        .eq('contract_id', contract.id);
      
      if (allPayments && allPayments.length > 0) {
        const totalContractValue = allPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const paidAmount = allPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const remainingAmount = totalContractValue - paidAmount;
        
        if (remainingAmount > 0) {
          totalByContract += remainingAmount;
        }
        
        contractsProcessed++;
        if (contractsProcessed <= 3) {
          console.log(`Contrato ${contract.id}:`);
          console.log(`  - Valor total: ${totalContractValue.toFixed(2)}`);
          console.log(`  - Pago: ${paidAmount.toFixed(2)}`);
          console.log(`  - Restante: ${remainingAmount.toFixed(2)}`);
        }
      }
    }
    
    console.log(`\nMétodo 2 - Por contrato (${contractsProcessed} contratos):`, totalByContract.toFixed(2));
    
    // Verificar se os dois métodos dão o mesmo resultado
    const difference = Math.abs(totalPendingDirect - totalByContract);
    console.log('\nDiferença entre métodos:', difference.toFixed(2));
    
    if (difference < 0.01) {
      console.log('✅ Os dois métodos são consistentes!');
      console.log('\n🎯 VALOR CORRETO A RECEBER:', totalPendingDirect.toFixed(2));
    } else {
      console.log('❌ Há inconsistência entre os métodos');
    }
    
    // Verificar o que o dashboard atual está retornando
    console.log('\n📊 Comparação com dashboard atual:');
    console.log('- Dashboard atual: 23130.64');
    console.log('- Valor correto:', totalPendingDirect.toFixed(2));
    console.log('- Diferença:', (totalPendingDirect - 23130.64).toFixed(2));
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

analyzeCorrectCalculation();