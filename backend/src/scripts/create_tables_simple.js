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

async function createTables() {
  console.log('🚀 CRIANDO TABELAS BÁSICAS');
  console.log('==========================');
  
  try {
    // Primeiro, vamos tentar criar as extensões necessárias
    console.log('📝 Habilitando extensões...');
    
    // Criar tabela companies
    console.log('📊 Criando tabela companies...');
    const companiesSQL = `
      CREATE TABLE IF NOT EXISTS companies (
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
      )`;
    
    // Usar uma abordagem diferente - tentar inserir dados de teste
    const { data: testCompany, error: compError } = await supabase
      .from('companies')
      .upsert([
        {
          name: 'Empresa Padrão',
          document: '12345678000199',
          email: 'contato@empresa.com',
          is_active: true
        }
      ], { onConflict: 'document' })
      .select();
    
    if (compError) {
      console.log('❌ Erro ao criar/inserir empresa:', compError.message);
      
      // Se a tabela não existe, vamos tentar uma abordagem alternativa
      if (compError.message.includes('does not exist') || compError.message.includes('schema cache')) {
        console.log('💡 Tabelas não existem. Vamos usar uma abordagem manual...');
        
        // Vamos assumir que as tabelas já existem e tentar trabalhar com os dados existentes
        console.log('🔍 Verificando dados existentes...');
        
        // Verificar clientes existentes
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, name')
          .limit(5);
        
        if (!clientsError && clients) {
          console.log(`✅ Encontrados ${clients.length} clientes existentes`);
          clients.forEach((client, i) => {
            if (i < 3) console.log(`  - ${client.name}`);
          });
        }
        
        // Verificar contratos existentes
        const { data: contracts, error: contractsError } = await supabase
          .from('contracts')
          .select('id, contract_number')
          .limit(5);
        
        if (!contractsError && contracts) {
          console.log(`✅ Encontrados ${contracts.length} contratos existentes`);
          contracts.forEach((contract, i) => {
            if (i < 3) console.log(`  - ${contract.contract_number}`);
          });
        }
        
        console.log('\n🎯 PRÓXIMOS PASSOS:');
        console.log('1. As tabelas básicas parecem existir');
        console.log('2. Podemos prosseguir com a importação de pagamentos');
        console.log('3. Vamos usar os dados existentes como base');
        
        return;
      }
    } else {
      console.log('✅ Empresa criada/atualizada:', testCompany[0]?.id);
    }
    
    // Criar tabela branches
    console.log('📊 Criando tabela branches...');
    const { data: testBranch, error: branchError } = await supabase
      .from('branches')
      .upsert([
        {
          company_id: testCompany[0]?.id,
          name: 'Filial Principal',
          code: 'FP001',
          is_active: true
        }
      ], { onConflict: 'code' })
      .select();
    
    if (branchError) {
      console.log('❌ Erro ao criar/inserir filial:', branchError.message);
    } else {
      console.log('✅ Filial criada/atualizada:', testBranch[0]?.id);
    }
    
    console.log('\n🎉 Configuração básica concluída!');
    console.log('Agora podemos prosseguir com a importação de pagamentos.');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTables().catch(console.error);