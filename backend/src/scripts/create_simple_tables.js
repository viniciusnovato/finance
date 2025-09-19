require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSimpleTables() {
  console.log('🏗️  Criando tabelas simplificadas...');
  
  const queries = [
    // Criar tabela de empresas simples
    `CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      document VARCHAR(20) NOT NULL UNIQUE,
      document_type VARCHAR(10) NOT NULL DEFAULT 'CNPJ',
      email VARCHAR(255),
      phone VARCHAR(20),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Criar tabela de filiais simples
    `CREATE TABLE IF NOT EXISTS branches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      address TEXT,
      city VARCHAR(100),
      state VARCHAR(2),
      zip_code VARCHAR(10),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Inserir empresa padrão
    `INSERT INTO companies (id, name, document, email, phone) 
     VALUES ('00000000-0000-0000-0000-000000000001', 'Empresa Padrão', '00000000000100', 'contato@empresa.com', '(11) 99999-9999')
     ON CONFLICT (id) DO NOTHING;`,
    
    // Inserir filial padrão
    `INSERT INTO branches (id, company_id, name, address, city, state, zip_code) 
     VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Filial Principal', 'Endereço Principal', 'São Paulo', 'SP', '01000-000')
     ON CONFLICT (id) DO NOTHING;`
  ];
  
  for (let i = 0; i < queries.length; i++) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: queries[i] });
      if (error) {
        console.error(`❌ Erro no comando ${i + 1}:`, error.message);
      } else {
        console.log(`✅ Comando ${i + 1} executado com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro no comando ${i + 1}:`, err.message);
    }
  }
  
  console.log('🎉 Tabelas criadas!');
}

createSimpleTables();