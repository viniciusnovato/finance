require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('🔍 VERIFICANDO TABELAS EXISTENTES');
  console.log('==================================================');
  
  const tables = ['clients', 'contracts', 'payments', 'companies', 'branches', 'users'];
  const existingTables = [];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`✅ Tabela '${table}': ${count} registros`);
        existingTables.push({ name: table, count });
      }
    } catch (err) {
      console.log(`❌ Tabela '${table}': não existe ou inacessível`);
    }
  }
  
  console.log('\n📊 RESUMO:');
  console.log(`Total de tabelas encontradas: ${existingTables.length}`);
  
  return existingTables;
}

checkTables().catch(console.error);