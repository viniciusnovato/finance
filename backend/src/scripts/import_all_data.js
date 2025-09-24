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

async function importAllData() {
  console.log('🚀 IMPORTAÇÃO COMPLETA DE DADOS');
  console.log('==================================================');
  
  try {
    // 1. Limpar dados existentes
    console.log('\n🧹 Limpando dados existentes...');
    await cleanDatabase();
    
    // 2. Importar clientes
    console.log('\n👥 Importando clientes...');
    const clientsResult = await importClients();
    console.log(`✅ Clientes importados: ${clientsResult.success}`);
    console.log(`❌ Erros em clientes: ${clientsResult.errors}`);
    
    if (clientsResult.errors > 0) {
      console.log('⚠️  Há erros na importação de clientes. Continuando...');
    }
    
    // 3. Importar contratos
    console.log('\n📄 Importando contratos...');
    const contractsResult = await importContracts();
    console.log(`✅ Contratos importados: ${contractsResult.success}`);
    console.log(`❌ Erros em contratos: ${contractsResult.errors}`);
    
    if (contractsResult.errors > 0) {
      console.log('⚠️  Há erros na importação de contratos. Continuando...');
    }
    
    // 4. Importar pagamentos
    console.log('\n💰 Importando pagamentos...');
    const paymentsResult = await importPayments();
    console.log(`✅ Pagamentos importados: ${paymentsResult.success}`);
    console.log(`❌ Erros em pagamentos: ${paymentsResult.errors}`);
    
    // 5. Verificar integridade final
    console.log('\n🔍 Verificando integridade dos dados...');
    await verifyFinalIntegrity();
    
    // 6. Resumo final
    console.log('\n📊 RESUMO FINAL DA IMPORTAÇÃO:');
    console.log(`👥 Clientes: ${clientsResult.success} sucessos, ${clientsResult.errors} erros`);
    console.log(`📄 Contratos: ${contractsResult.success} sucessos, ${contractsResult.errors} erros`);
    console.log(`💰 Pagamentos: ${paymentsResult.success} sucessos, ${paymentsResult.errors} erros`);
    
    const totalSuccess = clientsResult.success + contractsResult.success + paymentsResult.success;
    const totalErrors = clientsResult.errors + contractsResult.errors + paymentsResult.errors;
    
    console.log(`\n🎯 TOTAL GERAL: ${totalSuccess} sucessos, ${totalErrors} erros`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 IMPORTAÇÃO COMPLETA REALIZADA COM SUCESSO!');
    } else {
      console.log('\n⚠️  IMPORTAÇÃO COMPLETA COM ALGUNS ERROS - VERIFIQUE OS LOGS ACIMA');
    }
    
  } catch (error) {
    console.error('❌ Erro na importação completa:', error.message);
  }
}

async function cleanDatabase() {
  // Limpar na ordem correta (dependências)
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log('✅ Banco de dados limpo');
}

async function importClients() {
  return new Promise((resolve) => {
    const results = { success: 0, errors: 0 };
    const clientsFile = path.join(CSV_DIR, 'clients.csv');
    
    fs.createReadStream(clientsFile)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          // Preparar dados únicos
          const uniqueEmail = `${row.email.substring(0, 40)}_${row.id.substring(0, 8)}@${row.email.split('@')[1] || 'example.com'}`.substring(0, 100);
          const uniqueExternalId = `CLI_${row.id.substring(0, 46)}`.substring(0, 50);
          
          const clientData = {
            first_name: row.first_name?.substring(0, 255) || 'Nome',
            last_name: row.last_name?.substring(0, 255) || 'Sobrenome',
            email: uniqueEmail,
            phone: row.phone?.substring(0, 50) || null,
            mobile: row.mobile?.substring(0, 50) || null,
            tax_id: row.tax_id?.substring(0, 50) || null,
            birth_date: row.birth_date || null,
            address: row.address || null,
            city: row.city?.substring(0, 100) || null,
            postal_code: row.postal_code?.substring(0, 20) || null,
            country: row.country?.substring(0, 100) || 'Portugal',
            notes: row.notes || null
          };
          
          const { error } = await supabase
            .from('clients')
            .insert([clientData]);
          
          if (error) {
            console.error(`❌ Erro ao inserir cliente ${row.id}:`, error.message);
            results.errors++;
          } else {
            results.success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar cliente ${row.id}:`, error.message);
          results.errors++;
        }
      })
      .on('end', () => {
        resolve(results);
      });
  });
}

async function importContracts() {
  return new Promise((resolve) => {
    const results = { success: 0, errors: 0 };
    const contractsFile = path.join(CSV_DIR, 'contracts.csv');
    
    fs.createReadStream(contractsFile)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          // Verificar se o cliente existe
          const clientExternalId = `CLI_${row.client_id.substring(0, 46)}`.substring(0, 50);
          const { data: clientData } = await supabase
            .from('clients')
            .select('id')
            .eq('external_id', clientExternalId)
            .single();
          
          if (!clientData) {
            console.error(`❌ Cliente não encontrado para contrato ${row.id}`);
            results.errors++;
            return;
          }
          
          // Preparar dados únicos
          const uniqueContractNumber = `${row.contract_number}_${row.id.substring(0, 8)}`.substring(0, 50);
          const uniqueExternalId = `CON_${row.id.substring(0, 46)}`.substring(0, 50);
          
          const contractData = {
            client_id: clientData.id,
            contract_number: uniqueContractNumber,
            description: row.description?.substring(0, 255) || null,
            value: parseFloat(row.value) || 0,
            start_date: row.start_date || null,
            end_date: row.end_date || null,
            status: row.status || 'active',
            payment_frequency: row.payment_frequency || 'monthly',
            notes: row.notes || null,
            external_id: uniqueExternalId
          };
          
          const { error } = await supabase
            .from('contracts')
            .insert([contractData]);
          
          if (error) {
            console.error(`❌ Erro ao inserir contrato ${row.id}:`, error.message);
            results.errors++;
          } else {
            results.success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar contrato ${row.id}:`, error.message);
          results.errors++;
        }
      })
      .on('end', () => {
        resolve(results);
      });
  });
}

async function importPayments() {
  return new Promise((resolve) => {
    const results = { success: 0, errors: 0 };
    const paymentsFile = path.join(CSV_DIR, 'payments.csv');
    
    fs.createReadStream(paymentsFile)
      .pipe(csv())
      .on('data', async (row) => {
        try {
          // Verificar se o contrato existe
          const contractExternalId = `CON_${row.contract_id.substring(0, 46)}`.substring(0, 50);
          const { data: contractData } = await supabase
            .from('contracts')
            .select('id')
            .eq('external_id', contractExternalId)
            .single();
          
          if (!contractData) {
            console.error(`❌ Contrato não encontrado para pagamento ${row.id}`);
            results.errors++;
            return;
          }
          
          // Preparar dados únicos
          const uniqueExternalId = `PAY_${row.id.substring(0, 46)}`.substring(0, 50);
          
          const paymentData = {
            contract_id: contractData.id,
            installment_number: parseInt(row.installment_number) || 1,
            amount: parseFloat(row.amount) || 0,
            due_date: row.due_date || null,
            paid_date: row.paid_date || null,
            payment_method: row.payment_method?.substring(0, 50) || 'other',
            status: row.status || 'pending',
            reference_number: row.reference_number?.substring(0, 100) || null,
            receipt_path: row.receipt_path?.substring(0, 500) || null,
            notes: row.notes || null,
            external_id: uniqueExternalId
          };
          
          const { error } = await supabase
            .from('payments')
            .insert([paymentData]);
          
          if (error) {
            console.error(`❌ Erro ao inserir pagamento ${row.id}:`, error.message);
            results.errors++;
          } else {
            results.success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar pagamento ${row.id}:`, error.message);
          results.errors++;
        }
      })
      .on('end', () => {
        resolve(results);
      });
  });
}

async function verifyFinalIntegrity() {
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });
  
  const { count: contractsCount } = await supabase
    .from('contracts')
    .select('*', { count: 'exact', head: true });
  
  const { count: paymentsCount } = await supabase
    .from('payments')
    .select('*', { count: 'exact', head: true });
  
  console.log(`📊 Registros finais: ${clientsCount} clientes, ${contractsCount} contratos, ${paymentsCount} pagamentos`);
}

importAllData().catch(console.error);