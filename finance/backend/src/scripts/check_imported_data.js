require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkData() {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('\n📊 Últimos registros importados:');
    console.log('==================================================');
    
    data.forEach((client, i) => {
      console.log(`${i+1}. ${client.first_name} ${client.last_name}`);
      console.log(`   Email: ${client.email}`);
      console.log(`   Tax ID: ${client.tax_id}`);
      console.log(`   Country: ${client.country}`);
      console.log(`   Status: ${client.status}`);
      if (client.notes) {
        console.log(`   Notes: ${client.notes.substring(0, 100)}...`);
      }
      console.log('');
    });
    
    console.log(`\n📈 Total de registros encontrados: ${data.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error.message);
  }
}

checkData();