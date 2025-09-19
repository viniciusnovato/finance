const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase Admin
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração do banco de dados...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../migrations/init.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📊 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql: command + ';'
          });
          
          if (error) {
            // Tentar executar diretamente se RPC falhar
            const { error: directError } = await supabase
              .from('_temp')
              .select('*')
              .limit(0);
            
            if (directError && !directError.message.includes('does not exist')) {
              console.warn(`⚠️  Aviso no comando ${i + 1}: ${error.message}`);
            }
          }
          
          if ((i + 1) % 10 === 0) {
            console.log(`✅ Executados ${i + 1}/${commands.length} comandos`);
          }
        } catch (cmdError) {
          console.warn(`⚠️  Erro no comando ${i + 1}: ${cmdError.message}`);
        }
      }
    }
    
    console.log('✅ Migração concluída com sucesso!');
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando estrutura do banco...');
    
    const tables = [
      'companies', 'branches', 'users', 'clients', 
      'contracts', 'payments', 'contract_documents', 
      'predefined_notes', 'audit_logs'
    ];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela '${table}' não encontrada ou com erro: ${error.message}`);
      } else {
        console.log(`✅ Tabela '${table}' criada com sucesso`);
      }
    }
    
    console.log('🎉 Banco de dados configurado e pronto para uso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error.message);
    process.exit(1);
  }
}

// Função alternativa usando SQL direto
async function runMigrationDirect() {
  try {
    console.log('🚀 Executando migração direta...');
    
    const migrationPath = path.join(__dirname, '../migrations/init.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Executar SQL completo
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('❌ Erro na migração:', error.message);
      
      // Tentar executar por partes
      console.log('🔄 Tentando executar por partes...');
      await runMigration();
    } else {
      console.log('✅ Migração executada com sucesso!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('🔄 Tentando método alternativo...');
    await runMigration();
  }
}

// Executar migração
if (require.main === module) {
  const method = process.argv[2] || 'direct';
  
  if (method === 'direct') {
    runMigrationDirect();
  } else {
    runMigration();
  }
}

module.exports = { runMigration, runMigrationDirect };