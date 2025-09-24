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

async function importSimple() {
  console.log('🚀 IMPORTAÇÃO SIMPLES DE DADOS');
  console.log('==================================================');
  
  try {
    // 1. Limpar dados existentes
    console.log('\n🧹 Limpando dados existentes...');
    await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Banco de dados limpo');
    
    // 2. Importar clientes (primeiros 10)
    console.log('\n👥 Importando primeiros 10 clientes...');
    const clientsFile = path.join(CSV_DIR, 'clients.csv');
    const clients = [];
    
    await new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream(clientsFile)
        .pipe(csv())
        .on('data', (row) => {
          if (count < 10) {
            clients.push(row);
            count++;
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Lidos ${clients.length} clientes do CSV`);
    
    let clientsSuccess = 0;
    let clientsErrors = 0;
    
    for (const row of clients) {
      try {
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
          clientsErrors++;
        } else {
          clientsSuccess++;
          console.log(`✅ Cliente inserido: ${clientData.first_name} ${clientData.last_name}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar cliente ${row.id}:`, error.message);
        clientsErrors++;
      }
    }
    
    console.log(`\n📊 Clientes: ${clientsSuccess} sucessos, ${clientsErrors} erros`);
    
    // 3. Verificar resultado
    const { count: finalClientsCount } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 RESULTADO FINAL:`);
    console.log(`👥 Clientes na tabela: ${finalClientsCount}`);
    
    if (finalClientsCount > 0) {
      console.log('\n🎉 IMPORTAÇÃO SIMPLES REALIZADA COM SUCESSO!');
    } else {
      console.log('\n❌ NENHUM CLIENTE FOI IMPORTADO - VERIFIQUE OS ERROS ACIMA');
    }
    
  } catch (error) {
    console.error('❌ Erro na importação simples:', error.message);
    console.error('Stack:', error.stack);
  }
}

importSimple().catch(console.error);