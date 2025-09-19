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

async function testImportClients() {
  console.log('🔍 TESTE DE IMPORTAÇÃO DE CLIENTES');
  console.log('==================================================');
  
  let count = 0;
  let success = 0;
  let errors = 0;
  
  const clientsFile = path.join(CSV_DIR, 'clients.csv');
  
  return new Promise((resolve) => {
    fs.createReadStream(clientsFile)
      .pipe(csv())
      .on('data', async (row) => {
        count++;
        
        // Processar apenas os primeiros 20 registros para debug
        if (count > 20) return;
        
        console.log(`\n📋 Processando cliente ${count}:`);
        console.log('Raw data:', JSON.stringify(row, null, 2));
        
        try {
          // Preparar dados únicos
          const email = row.email || `cliente${count}@example.com`;
          const uniqueEmail = `${email.substring(0, 40)}_${row.id?.substring(0, 8) || count}@${email.split('@')[1] || 'example.com'}`.substring(0, 100);
          
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
          
          console.log('Prepared data:', JSON.stringify(clientData, null, 2));
          
          const { data, error } = await supabase
            .from('clients')
            .insert([clientData])
            .select();
          
          if (error) {
            console.error(`❌ Erro ao inserir cliente ${count}:`, error);
            errors++;
          } else {
            console.log(`✅ Cliente ${count} inserido com sucesso:`, data);
            success++;
          }
        } catch (error) {
          console.error(`❌ Erro ao processar cliente ${count}:`, error);
          errors++;
        }
      })
      .on('end', () => {
        console.log('\n📊 RESUMO:');
        console.log(`Total processados: ${count}`);
        console.log(`Sucessos: ${success}`);
        console.log(`Erros: ${errors}`);
        resolve({ count, success, errors });
      })
      .on('error', (error) => {
        console.error('❌ Erro ao ler CSV:', error);
        resolve({ count, success, errors });
      });
  });
}

testImportClients().catch(console.error);