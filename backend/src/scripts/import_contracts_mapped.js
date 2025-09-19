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

async function createClientMapping() {
  console.log('🔍 Criando mapeamento de clientes...');
  
  // Buscar clientes do banco
  const { data: dbClients, error: dbError } = await supabase
    .from('clients')
    .select('id, first_name, last_name');
  
  if (dbError) {
    console.error('Erro ao buscar clientes do banco:', dbError);
    return new Map();
  }
  
  // Ler clientes do CSV original
  const csvClients = new Map();
  const clientsFile = path.join(CSV_DIR, 'clients.csv');
  
  return new Promise((resolve) => {
    fs.createReadStream(clientsFile)
      .pipe(csv())
      .on('data', (row) => {
        const key = `${row.first_name}_${row.last_name}`.toLowerCase().trim();
        csvClients.set(key, row.id);
      })
      .on('end', () => {
        // Criar mapeamento CSV ID -> DB ID
        const mapping = new Map();
        
        dbClients.forEach(dbClient => {
          const key = `${dbClient.first_name}_${dbClient.last_name}`.toLowerCase().trim();
          const csvId = csvClients.get(key);
          if (csvId) {
            mapping.set(csvId, dbClient.id);
          }
        });
        
        console.log(`📋 Mapeamento criado: ${mapping.size} clientes mapeados`);
        resolve(mapping);
      });
  });
}

async function importContracts() {
  console.log('📄 IMPORTAÇÃO DE CONTRATOS COM MAPEAMENTO');
  console.log('==================================================');
  
  // Criar mapeamento de clientes
  const clientMapping = await createClientMapping();
  
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
          // Mapear client_id do CSV para o ID do banco
          const dbClientId = clientMapping.get(row.client_id);
          
          if (!dbClientId) {
            if (count <= 10) {
              console.log(`⚠️  Cliente não mapeado para contrato ${count}: ${row.client_id}`);
            }
            clientNotFound++;
            return;
          }
          
          const contractData = {
            client_id: dbClientId,
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