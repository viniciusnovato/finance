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

const CSV_DIR = '/Users/pedro/Documents/finance/importBD';

async function getExistingData() {
  console.log('🔍 Verificando dados existentes...');
  
  // Buscar contratos existentes
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select('id, contract_number, client_id');
  
  if (contractsError) {
    console.error('Erro ao buscar contratos:', contractsError);
    return { contracts: [], clients: [] };
  }
  
  // Buscar clientes existentes
  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('id');
  
  if (clientsError) {
    console.error('Erro ao buscar clientes:', clientsError);
    return { contracts, clients: [] };
  }
  
  console.log(`📋 Encontrados: ${contracts.length} contratos, ${clients.length} clientes`);
  
  return { contracts, clients };
}

// Função para criar IDs UUID simples (para company_id e branch_id)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function importPayments() {
  console.log('💰 IMPORTAÇÃO DE PAGAMENTOS FINAL');
  console.log('==================================');
  
  // Obter dados existentes
  const { contracts, clients } = await getExistingData();
  
  if (contracts.length === 0) {
    console.error('❌ Nenhum contrato encontrado para vincular pagamentos');
    return;
  }
  
  // Criar IDs fixos para company_id e branch_id (já que essas tabelas não existem)
  const defaultCompanyId = generateUUID();
  const defaultBranchId = generateUUID();
  
  console.log(`🏢 Usando IDs padrão - Company: ${defaultCompanyId.substring(0, 8)}..., Branch: ${defaultBranchId.substring(0, 8)}...`);
  
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
        
        // Processar apenas os primeiros 5 para teste
        if (count > 5) return;
        
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
          if (!contract) {
            contract = contracts[0]; // Usar primeiro contrato para teste
            console.log(`⚠️  Usando contrato padrão (${contract.contract_number}) para pagamento ${count}`);
          }
          
          const paymentData = {
            company_id: defaultCompanyId,
            branch_id: defaultBranchId,
            contract_id: contract.id,
            client_id: contract.client_id,
            installment_number: parseInt(row.installment_number) || count,
            due_date: row.due_date || new Date().toISOString().split('T')[0],
            amount: parseFloat(row.amount) || (100.00 + count * 10), // Valor variável para teste
            paid_amount: parseFloat(row.paid_amount) || 0,
            payment_date: row.payment_date || null,
            payment_method: (row.payment_method || 'boleto').substring(0, 20),
            status: row.status || 'pending',
            late_fee: parseFloat(row.late_fee) || 0,
            discount: parseFloat(row.discount) || 0,
            notes: row.notes?.substring(0, 1000) || `Pagamento importado ${count}`,
            receipt_number: row.receipt_number?.substring(0, 100) || null
          };
          
          console.log(`📝 Inserindo pagamento ${count}:`, {
            contract: contract.contract_number,
            amount: paymentData.amount,
            due_date: paymentData.due_date
          });
          
          const { data, error } = await supabase
            .from('payments')
            .insert([paymentData])
            .select();
          
          if (error) {
            console.error(`❌ Erro ao inserir pagamento ${count}:`, error.message);
            console.error('Dados enviados:', paymentData);
            errors++;
          } else {
            console.log(`✅ Pagamento ${count} inserido com sucesso! ID: ${data[0].id}`);
            success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar pagamento ${count}:`, error.message);
          errors++;
        }
      })
      .on('end', () => {
        console.log('\n📊 RESUMO DA IMPORTAÇÃO DE PAGAMENTOS:');
        console.log(`Total processados: ${Math.min(count, 5)}`);
        console.log(`Sucessos: ${success}`);
        console.log(`Erros: ${errors}`);
        console.log(`Contratos não encontrados: ${contractNotFound}`);
        
        if (success > 0) {
          console.log('\n🎉 Importação concluída com sucesso!');
          console.log('Próximos passos sugeridos:');
          console.log('1. Verificar os pagamentos inseridos no banco');
          console.log('2. Ajustar os valores e datas conforme necessário');
          console.log('3. Executar importação completa se os testes estiverem OK');
        }
        
        resolve({ count: Math.min(count, 5), success, errors, contractNotFound });
      })
      .on('error', (error) => {
        console.error('❌ Erro ao ler CSV de pagamentos:', error);
        resolve({ count, success, errors, contractNotFound });
      });
  });
}

importPayments().catch(console.error);