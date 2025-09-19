require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

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

async function cleanDatabaseAdmin() {
  console.log('🧹 LIMPANDO BANCO DE DADOS (MODO ADMIN)');
  console.log('==================================================');
  
  const tables = ['clients', 'contracts', 'payments'];
  
  for (const table of tables) {
    try {
      console.log(`🗑️  Limpando tabela '${table}'...`);
      
      // Primeiro, contar registros
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      console.log(`   📊 Registros antes: ${beforeCount}`);
      
      // Deletar todos os registros
      const { error } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null);
      
      if (error) {
        console.log(`❌ Erro ao limpar '${table}': ${error.message}`);
      } else {
        // Verificar após limpeza
        const { count: afterCount } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        console.log(`   📊 Registros depois: ${afterCount}`);
        console.log(`✅ Tabela '${table}' limpa com sucesso`);
      }
    } catch (err) {
      console.log(`❌ Erro ao acessar tabela '${table}': ${err.message}`);
    }
  }
  
  console.log('\n✅ LIMPEZA ADMINISTRATIVA CONCLUÍDA!');
}

cleanDatabaseAdmin().catch(console.error);