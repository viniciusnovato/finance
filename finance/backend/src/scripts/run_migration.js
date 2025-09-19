const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  try {
    console.log('🚀 Executando migração do banco de dados...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../migrations/init.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executando migração completa...');
    
    // Tentar executar a migração completa
    const { data, error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });
    
    if (error) {
      console.log('⚠️  Erro na migração via RPC:', error.message);
      console.log('💡 Tentando criar tabelas individualmente...');
      
      // Criar tabelas básicas manualmente
      await createBasicTables();
    } else {
      console.log('✅ Migração executada com sucesso!');
    }
    
    // Testar se conseguimos acessar as tabelas
    await testTables();
    
  } catch (error) {
    console.error('❌ Erro na migração:', error.message);
    console.log('💡 Tentando criar tabelas básicas...');
    await createBasicTables();
  }
}

async function createBasicTables() {
  const tables = [
    {
      name: 'companies',
      sql: `CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        document VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    },
    {
      name: 'branches',
      sql: `CREATE TABLE IF NOT EXISTS branches (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        phone VARCHAR(20),
        email VARCHAR(255),
        manager_name VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    },
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id UUID UNIQUE,
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        permissions JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    }
  ];
  
  for (const table of tables) {
    try {
      console.log(`📊 Criando tabela ${table.name}...`);
      const { error } = await supabase.rpc('exec_sql', { query: table.sql });
      if (error) {
        console.log(`⚠️  Erro ao criar ${table.name}:`, error.message);
      } else {
        console.log(`✅ Tabela ${table.name} criada!`);
      }
    } catch (err) {
      console.log(`⚠️  Erro ao criar ${table.name}:`, err.message);
    }
  }
}

async function testTables() {
  console.log('🔍 Testando acesso às tabelas...');
  
  const tables = ['companies', 'branches', 'users'];
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Tabela ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${tableName}: OK`);
      }
    } catch (err) {
      console.log(`❌ Tabela ${tableName}: ${err.message}`);
    }
  }
}

runMigration();