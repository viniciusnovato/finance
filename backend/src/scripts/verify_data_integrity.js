require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Usar service_role key para ter permissões administrativas
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function verifyDataIntegrity() {
  console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE DOS DADOS');
  console.log('==================================================');
  
  try {
    // 1. Verificar contagem de registros
    console.log('\n📊 CONTAGEM DE REGISTROS:');
    
    const { count: clientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    console.log(`👥 Clientes: ${clientsCount}`);
    
    const { count: contractsCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });
    console.log(`📄 Contratos: ${contractsCount}`);
    
    const { count: paymentsCount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });
    console.log(`💰 Pagamentos: ${paymentsCount}`);
    
    // 2. Verificar integridade referencial
    console.log('\n🔗 INTEGRIDADE REFERENCIAL:');
    
    // Contratos sem clientes
    const { data: contractsWithoutClients } = await supabase
      .from('contracts')
      .select('id, client_id')
      .not('client_id', 'in', `(${await getClientIds()})`);
    
    if (contractsWithoutClients && contractsWithoutClients.length > 0) {
      console.log(`❌ ${contractsWithoutClients.length} contratos com client_id inválido`);
    } else {
      console.log('✅ Todos os contratos têm client_id válido');
    }
    
    // Pagamentos sem contratos
    const { data: paymentsWithoutContracts } = await supabase
      .from('payments')
      .select('id, contract_id')
      .not('contract_id', 'in', `(${await getContractIds()})`);
    
    if (paymentsWithoutContracts && paymentsWithoutContracts.length > 0) {
      console.log(`❌ ${paymentsWithoutContracts.length} pagamentos com contract_id inválido`);
    } else {
      console.log('✅ Todos os pagamentos têm contract_id válido');
    }
    
    // 3. Verificar dados obrigatórios
    console.log('\n📋 DADOS OBRIGATÓRIOS:');
    
    // Clientes sem nome
    const { count: clientsWithoutName } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .or('first_name.is.null,last_name.is.null');
    
    if (clientsWithoutName > 0) {
      console.log(`⚠️  ${clientsWithoutName} clientes sem nome completo`);
    } else {
      console.log('✅ Todos os clientes têm nome completo');
    }
    
    // Contratos sem valor
    const { count: contractsWithoutValue } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .is('value', null);
    
    if (contractsWithoutValue > 0) {
      console.log(`⚠️  ${contractsWithoutValue} contratos sem valor`);
    } else {
      console.log('✅ Todos os contratos têm valor definido');
    }
    
    // Pagamentos sem valor
    const { count: paymentsWithoutAmount } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .is('amount', null);
    
    if (paymentsWithoutAmount > 0) {
      console.log(`⚠️  ${paymentsWithoutAmount} pagamentos sem valor`);
    } else {
      console.log('✅ Todos os pagamentos têm valor definido');
    }
    
    // 4. Verificar duplicatas
    console.log('\n🔄 VERIFICAÇÃO DE DUPLICATAS:');
    
    // Clientes com mesmo email
    const { data: duplicateEmails } = await supabase
      .rpc('check_duplicate_emails');
    
    if (duplicateEmails && duplicateEmails.length > 0) {
      console.log(`⚠️  ${duplicateEmails.length} emails duplicados encontrados`);
    } else {
      console.log('✅ Nenhum email duplicado encontrado');
    }
    
    // 5. Resumo final
    console.log('\n📈 RESUMO FINAL:');
    console.log(`📊 Total de registros: ${clientsCount + contractsCount + paymentsCount}`);
    console.log(`👥 Clientes: ${clientsCount}`);
    console.log(`📄 Contratos: ${contractsCount}`);
    console.log(`💰 Pagamentos: ${paymentsCount}`);
    
    if (contractsCount > 0 && clientsCount > 0) {
      console.log(`📊 Média de contratos por cliente: ${(contractsCount / clientsCount).toFixed(2)}`);
    }
    
    if (paymentsCount > 0 && contractsCount > 0) {
      console.log(`📊 Média de pagamentos por contrato: ${(paymentsCount / contractsCount).toFixed(2)}`);
    }
    
    console.log('\n✅ VERIFICAÇÃO DE INTEGRIDADE CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

async function getClientIds() {
  const { data } = await supabase
    .from('clients')
    .select('id');
  return data ? data.map(c => `'${c.id}'`).join(',') : "''";
}

async function getContractIds() {
  const { data } = await supabase
    .from('contracts')
    .select('id');
  return data ? data.map(c => `'${c.id}'`).join(',') : "''";
}

verifyDataIntegrity().catch(console.error);