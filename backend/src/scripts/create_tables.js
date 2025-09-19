const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTables() {
  console.log('🚀 Criando tabelas básicas...');
  
  try {
    // Primeiro, vamos tentar criar uma tabela simples para testar
    console.log('📊 Testando conexão...');
    
    // Tentar acessar uma tabela existente ou criar uma de teste
    const { data: testData, error: testError } = await supabase
      .from('test_table')
      .select('*')
      .limit(1);
    
    if (testError && testError.message.includes('does not exist')) {
      console.log('✅ Conexão OK - tabelas não existem ainda');
    } else if (testError) {
      console.log('⚠️  Erro de conexão:', testError.message);
      return;
    }
    
    // Vamos usar uma abordagem diferente - criar dados diretamente
    console.log('💡 Tentando abordagem alternativa...');
    
    // Verificar se já existem dados nas tabelas
    const tables = ['companies', 'branches', 'users', 'clients', 'contracts', 'payments'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (error) {
          console.log(`❌ Tabela ${tableName} não existe: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${tableName} já existe`);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar ${tableName}: ${err.message}`);
      }
    }
    
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('Como as tabelas não foram criadas automaticamente, você precisa:');
    console.log('1. Abrir o Supabase Dashboard');
    console.log('2. Ir para SQL Editor');
    console.log('3. Executar o conteúdo do arquivo: src/migrations/init.sql');
    console.log('4. Depois executar novamente este script para testar');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTables();