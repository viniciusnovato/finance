require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const obj = {};
    headers.forEach((header, index) => {
      obj[header.trim()] = values[index] || null;
    });
    
    return obj;
  });
}

async function importContractsTest() {
  console.log('📥 IMPORTAÇÃO DE CONTRATOS (TESTE - 5 LINHAS)');
  console.log('==================================================');
  
  try {
    // Ler arquivo CSV
    const csvPath = path.join(__dirname, '../../../importBD/contracts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV
    const contracts = parseCSV(csvContent);
    console.log(`📊 Total de contratos no CSV: ${contracts.length}`);
    
    // Processar apenas os primeiros 5 para teste
    const testContracts = contracts.slice(0, 5);
    console.log(`🧪 Processando ${testContracts.length} contratos para teste`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const contract of testContracts) {
      try {
        // Verificar se o client_id existe
        const { data: clientExists } = await supabase
          .from('clients')
          .select('id')
          .eq('id', contract.client_id)
          .single();
        
        if (!clientExists) {
          console.log(`⚠️  Cliente ${contract.client_id} não encontrado para contrato ${contract.contract_number}`);
          errorCount++;
          continue;
        }
        
        // Preparar dados do contrato (criar IDs únicos)
        const uniqueContractNumber = `${contract.contract_number || 'CONTRACT'}_${contract.id.substring(0, 8)}`;
        const uniqueExternalId = `${contract.external_id || 'EXT'}_${contract.id.substring(0, 8)}`;
        
        const contractData = {
          id: contract.id,
          client_id: contract.client_id,
          contract_number: uniqueContractNumber.substring(0, 50),
          description: (contract.description || '').substring(0, 255),
          value: contract.value ? parseFloat(contract.value) : null,
          start_date: contract.start_date || null,
          end_date: contract.end_date || null,
          status: contract.status || 'active',
          payment_frequency: (contract.payment_frequency || '').substring(0, 20),
          notes: contract.notes || null,
          external_id: uniqueExternalId.substring(0, 50),
          created_at: contract.created_at || new Date().toISOString(),
          updated_at: contract.updated_at || new Date().toISOString()
        };
        
        // Inserir no Supabase
        const { error } = await supabase
          .from('contracts')
          .insert(contractData);
        
        if (error) {
          console.log(`❌ Erro ao inserir contrato ${contract.contract_number}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Contrato inserido: ${contract.contract_number} (Cliente: ${contract.client_id})`);
          successCount++;
        }
        
      } catch (err) {
        console.log(`❌ Erro ao processar contrato: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    // Verificar total na tabela
    const { count } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 Total de contratos na tabela: ${count}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

importContractsTest().catch(console.error);