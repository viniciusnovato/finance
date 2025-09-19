require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');
const { calculateAggregatePaymentStats } = require('./src/utils/contractCalculations');

async function debugDashboard() {
  try {
    console.log('🔍 Debugando cálculo do dashboard...');
    
    // Buscar contratos com pagamentos (como no dashboard)
    const { data: contracts } = await supabaseAdmin
      .from('contracts')
      .select('id, status, value, down_payment, number_of_payments, created_at');
    
    console.log('Total de contratos encontrados:', contracts?.length || 0);
    
    // Buscar pagamentos para cada contrato
    const contractsWithPayments = await Promise.all(
      (contracts || []).map(async (contract) => {
        const { data: payments } = await supabaseAdmin
          .from('payments')
          .select('*')
          .eq('contract_id', contract.id);
        return { ...contract, payments: payments || [] };
      })
    );
    
    console.log('Contratos com pagamentos carregados:', contractsWithPayments.length);
    
    // Calcular estatísticas
    const paymentStats = calculateAggregatePaymentStats(contractsWithPayments);
    
    console.log('Estatísticas calculadas:');
    console.log('- Total de contratos:', paymentStats.total_contracts);
    console.log('- Valor total dos contratos:', paymentStats.total_value);
    console.log('- Total pago:', paymentStats.total_paid);
    console.log('- Total restante:', paymentStats.total_remaining);
    
    // Verificar alguns contratos individualmente
    console.log('\n🔍 Verificando contratos individuais:');
    let totalManual = 0;
    let contractsChecked = 0;
    
    for (const contract of contractsWithPayments.slice(0, 5)) {
      const contractValue = parseFloat(contract.value || 0);
      const downPayment = parseFloat(contract.down_payment || 0);
      const paidPayments = contract.payments.filter(p => p.status === 'paid');
      const paidAmount = paidPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const totalPaid = downPayment + paidAmount;
      const remaining = contractValue - totalPaid;
      
      console.log(`Contrato ${contract.id}:`);
      console.log(`  - Valor: ${contractValue}`);
      console.log(`  - Entrada: ${downPayment}`);
      console.log(`  - Parcelas pagas: ${paidAmount}`);
      console.log(`  - Total pago: ${totalPaid}`);
      console.log(`  - Restante: ${remaining}`);
      
      if (remaining > 0) {
        totalManual += remaining;
      }
      contractsChecked++;
    }
    
    console.log(`\nTotal manual (${contractsChecked} contratos): ${totalManual}`);
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

debugDashboard();