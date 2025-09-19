require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function cleanDatabase() {
  console.log('🧹 LIMPANDO BANCO DE DADOS');
  console.log('==================================================');
  
  const tables = ['clients', 'contracts', 'payments', 'companies', 'branches', 'users'];
  
  for (const table of tables) {
    try {
      console.log(`🗑️  Limpando tabela '${table}'...`);
      
      const { error } = await supabase
        .from(table)
        .delete()
        .gte('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (error) {
        console.log(`❌ Erro ao limpar '${table}': ${error.message}`);
      } else {
        console.log(`✅ Tabela '${table}' limpa com sucesso`);
      }
    } catch (err) {
      console.log(`❌ Erro ao acessar tabela '${table}': ${err.message}`);
    }
  }
  
  console.log('\n🔍 Verificando limpeza...');
  
  // Verificar se as tabelas estão vazias
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`📊 Tabela '${table}': ${count} registros restantes`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar '${table}': ${err.message}`);
    }
  }
  
  console.log('\n✅ LIMPEZA CONCLUÍDA!');
}

cleanDatabase().catch(console.error);