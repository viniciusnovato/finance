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

async function getExistingClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('id');
  
  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return new Set();
  }
  
  return new Set(data.map(client => client.id));
}

async function importContracts() {
  console.log('📄 IMPORTAÇÃO DE CONTRATOS');
  console.log('==================================================');
  
  // Buscar clientes existentes
  const existingClients = await getExistingClients();
  console.log(`📋 Clientes existentes: ${existingClients.size}`);
  
  let count = 0;
  let success = 0;
  let errors = 0;
  let clientNotFound = 0;
  
  const contractsFile = path.join(CSV_DIR, 'contracts.csv');
  
  return new Promise((resolve) => {
    fs.createReadStream(contractsFile)
      .pipe(csv())
      .on('data', async (row) => {
        count++;
        
        try {
          // Verificar se o cliente existe
          if (!existingClients.has(row.client_id)) {
            console.log(`⚠️  Cliente não encontrado para contrato ${count}: ${row.client_id}`);
            clientNotFound++;
            return;
          }
          
          const contractData = {
            client_id: row.client_id,
            contract_number: row.contract_number?.substring(0, 100) || `CONTRACT_${count}`,
            description: row.description?.substring(0, 500) || null,
            value: parseFloat(row.value) || 0,
            start_date: row.start_date || null,
            end_date: row.end_date || null,
            status: row.status || 'active',
            payment_frequency: row.payment_frequency || 'monthly',
            notes: row.notes?.substring(0, 1000) || null
          };
          
          const { data, error } = await supabase
            .from('contracts')
            .insert([contractData])
            .select();
          
          if (error) {
            console.error(`❌ Erro ao inserir contrato ${count}:`, error.message);
            errors++;
          } else {
            if (count <= 5) {
              console.log(`✅ Contrato ${count} inserido:`, data[0].id);
            }
            success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar contrato ${count}:`, error.message);
          errors++;
        }
      })
      .on('end', () => {
        console.log('\n📊 RESUMO DA IMPORTAÇÃO DE CONTRATOS:');
        console.log(`Total processados: ${count}`);
        console.log(`Sucessos: ${success}`);
        console.log(`Erros: ${errors}`);
        console.log(`Clientes não encontrados: ${clientNotFound}`);
        resolve({ count, success, errors, clientNotFound });
      })
      .on('error', (error) => {
        console.error('❌ Erro ao ler CSV de contratos:', error);
        resolve({ count, success, errors, clientNotFound });
      });
  });
}

importContracts().catch(console.error);