require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDefaultRecords() {
  console.log('🏢 Criando registros padrão...');
  
  try {
    // Criar empresa padrão
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Empresa Padrão',
        document: '00000000000100',
        document_type: 'CNPJ',
        email: 'contato@empresa.com',
        phone: '(11) 99999-9999'
      }, { onConflict: 'id' })
      .select();
    
    if (companyError) {
      console.error('❌ Erro ao criar empresa:', companyError.message);
    } else {
      console.log('✅ Empresa padrão criada');
    }
    
    // Criar filial padrão
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        company_id: '00000000-0000-0000-0000-000000000001',
        name: 'Filial Principal',
        address: 'Endereço da Filial Principal',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01000-000'
      }, { onConflict: 'id' })
      .select();
    
    if (branchError) {
      console.error('❌ Erro ao criar filial:', branchError.message);
    } else {
      console.log('✅ Filial padrão criada');
    }
    
    console.log('🎉 Registros padrão criados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createDefaultRecords();