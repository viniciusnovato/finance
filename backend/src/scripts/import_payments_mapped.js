require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

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

const CSV_DIR = '/Users/insitutoareluna/Documents/finance/importBD';

async function getExistingData() {
  console.log('🔍 Buscando dados existentes...');
  
  // Buscar contratos existentes (sem company_id e branch_id)
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select('id, contract_number, client_id');
  
  if (contractsError) {
    console.error('Erro ao buscar contratos:', contractsError);
    return { contracts: [], clients: [], companies: [], branches: [] };
  }
  
  // Buscar clientes existentes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id, name');
  
  if (clientsError) {
    console.error('Erro ao buscar clientes:', clientsError);
    return { contracts, clients: [], companies: [], branches: [] };
  }
  
  // Buscar empresas e filiais para usar como padrão
  const { data: companies } = await supabase.from('companies').select('id').limit(1);
  const { data: branches } = await supabase.from('branches').select('id').limit(1);
  
  console.log(`📋 Encontrados: ${contracts.length} contratos, ${clients.length} clientes`);
  console.log(`🏢 Empresas: ${companies?.length || 0}, Filiais: ${branches?.length || 0}`);
  
  return { contracts, clients, companies: companies || [], branches: branches || [] };
}

async function importPayments() {
  console.log('💰 IMPORTAÇÃO DE PAGAMENTOS CORRIGIDA');
  console.log('=========================================');
  
  // Obter dados existentes
  const { contracts, clients, companies, branches } = await getExistingData();
  
  if (contracts.length === 0) {
    console.error('❌ Nenhum contrato encontrado para vincular pagamentos');
    return;
  }
  
  if (companies.length === 0 || branches.length === 0) {
    console.error('❌ Empresa ou filial não encontrada. Criando dados padrão...');
    
    // Criar empresa padrão se não existir
    let companyId = companies[0]?.id;
    if (!companyId) {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert([{ name: 'Empresa Padrão', cnpj: '00000000000100' }])
        .select()
        .single();
      
      if (companyError) {
        console.error('Erro ao criar empresa:', companyError);
        return;
      }
      companyId = newCompany.id;
      console.log('✅ Empresa padrão criada');
    }
    
    // Criar filial padrão se não existir
    let branchId = branches[0]?.id;
    if (!branchId) {
      const { data: newBranch, error: branchError } = await supabase
        .from('branches')
        .insert([{ 
          company_id: companyId,
          name: 'Filial Principal', 
          address: 'Endereço Padrão'
        }])
        .select()
        .single();
      
      if (branchError) {
        console.error('Erro ao criar filial:', branchError);
        return;
      }
      branchId = newBranch.id;
      console.log('✅ Filial padrão criada');
    }
    
    companies[0] = { id: companyId };
    branches[0] = { id: branchId };
  }
  
  // Criar mapeamento de contratos por número
  const contractMap = new Map();
  contracts.forEach(contract => {
    contractMap.set(contract.contract_number, contract);
  });
  
  let count = 0;
  let success = 0;
  let errors = 0;
  let contractNotFound = 0;
  
  const paymentsFile = path.join(CSV_DIR, 'payments.csv');
  
  if (!fs.existsSync(paymentsFile)) {
    console.error('❌ Arquivo payments.csv não encontrado em:', paymentsFile);
    return;
  }
  
  return new Promise((resolve) => {
    fs.createReadStream(paymentsFile)
      .pipe(csv())
      .on('data', async (row) => {
        count++;
        
        // Processar apenas os primeiros 10 para teste
        if (count > 10) return;
        
        try {
          // Tentar encontrar contrato correspondente
          let contract = null;
          
          // Primeiro, tentar por contract_number
          if (row.contract_number) {
            contract = contractMap.get(row.contract_number);
          }
          
          // Se não encontrou, tentar por contract_id (assumindo que é o número)
          if (!contract && row.contract_id) {
            contract = contractMap.get(row.contract_id);
          }
          
          // Se ainda não encontrou, usar o primeiro contrato disponível para teste
          if (!contract && count <= 3) {
            contract = contracts[0]; // Usar primeiro contrato para teste
            console.log(`⚠️  Usando contrato padrão para pagamento ${count}`);
          }
          
          if (!contract) {
            console.log(`⚠️  Contrato não encontrado para pagamento ${count}: ${row.contract_number || row.contract_id}`);
            contractNotFound++;
            return;
          }
          
          const paymentData = {
            company_id: companies[0].id,
            branch_id: branches[0].id,
            contract_id: contract.id,
            client_id: contract.client_id,
            installment_number: parseInt(row.installment_number) || count,
            due_date: row.due_date || new Date().toISOString().split('T')[0],
            amount: parseFloat(row.amount) || 100.00,
            paid_amount: parseFloat(row.paid_amount) || 0,
            payment_date: row.payment_date || null,
            payment_method: (row.payment_method || 'boleto').substring(0, 20),
            status: row.status || 'pending',
            late_fee: parseFloat(row.late_fee) || 0,
            discount: parseFloat(row.discount) || 0,
            notes: row.notes?.substring(0, 1000) || null,
            receipt_number: row.receipt_number?.substring(0, 100) || null
          };
          
          const { data, error } = await supabase
            .from('payments')
            .insert([paymentData])
            .select();
          
          if (error) {
            console.error(`❌ Erro ao inserir pagamento ${count}:`, error.message);
            errors++;
          } else {
            console.log(`✅ Pagamento ${count} inserido: R$ ${paymentData.amount} - Contrato: ${contract.contract_number}`);
            success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar pagamento ${count}:`, error.message);
          errors++;
        }
      })
      .on('end', () => {
        console.log('\n📊 RESUMO DA IMPORTAÇÃO DE PAGAMENTOS:');
        console.log(`Total processados: ${Math.min(count, 10)}`);
        console.log(`Sucessos: ${success}`);
        console.log(`Erros: ${errors}`);
        console.log(`Contratos não encontrados: ${contractNotFound}`);
        resolve({ count: Math.min(count, 10), success, errors, contractNotFound });
      })
      .on('error', (error) => {
        console.error('❌ Erro ao ler CSV de pagamentos:', error);
        resolve({ count, success, errors, contractNotFound });
      });
  });
}

importPayments().catch(console.error);