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

async function importClientsTest() {
  console.log('📥 IMPORTAÇÃO DE CLIENTES (TESTE - 5 LINHAS)');
  console.log('==================================================');
  
  try {
    // Ler arquivo CSV
    const csvPath = path.join(__dirname, '../../../importBD/clients.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV
    const clients = parseCSV(csvContent);
    console.log(`📊 Total de clientes no CSV: ${clients.length}`);
    
    // Processar apenas os primeiros 5 para teste
    const testClients = clients.slice(0, 5);
    console.log(`🧪 Processando ${testClients.length} clientes para teste`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const client of testClients) {
      try {
        // Preparar dados do cliente (truncar campos longos)
        const clientData = {
          id: client.id,
          first_name: (client.first_name || '').substring(0, 50),
          last_name: (client.last_name || '').substring(0, 50),
          email: client.email || null,
          phone: (client.phone || '').substring(0, 50),
          mobile: (client.mobile || '').substring(0, 50),
          tax_id: (client.tax_id || '').substring(0, 50),
          birth_date: client.birth_date || null,
          address: client.address || null,
          city: (client.city || '').substring(0, 100),
          state: (client.state || '').substring(0, 50),
          postal_code: (client.postal_code || '').substring(0, 20),
          country: (client.country || '').substring(0, 100),
          status: client.status || 'active',
          notes: client.notes || null,
          external_id: (client.external_id || '').substring(0, 50),
          created_at: client.created_at || new Date().toISOString(),
          updated_at: client.updated_at || new Date().toISOString()
        };
        
        // Inserir no Supabase
        const { error } = await supabase
          .from('clients')
          .insert(clientData);
        
        if (error) {
          console.log(`❌ Erro ao inserir cliente ${client.first_name} ${client.last_name}: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Cliente inserido: ${client.first_name} ${client.last_name}`);
          successCount++;
        }
        
      } catch (err) {
        console.log(`❌ Erro ao processar cliente: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    
    // Verificar total na tabela
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 Total de clientes na tabela: ${count}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

importClientsTest().catch(console.error);