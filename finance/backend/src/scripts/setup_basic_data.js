const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para criar dados básicos necessários
async function setupBasicData() {
  try {
    console.log('🏗️  Configurando dados básicos...');
    
    // 1. Criar empresa padrão
    console.log('📊 Criando empresa padrão...');
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Instituto Areluna',
        legal_name: 'Instituto Areluna Lda',
        tax_id: '123456789',
        email: 'contato@institutoareluna.com',
        phone: '+351 123 456 789',
        address: 'Rua Principal, 123',
        city: 'Lisboa',
        postal_code: '1000-001',
        country: 'Portugal'
      }, { onConflict: 'id' })
      .select();
    
    if (companyError) {
      console.error('❌ Erro ao criar empresa:', companyError.message);
      return false;
    }
    console.log('✅ Empresa criada com sucesso');
    
    // 2. Criar filial padrão
    console.log('🏢 Criando filial padrão...');
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        company_id: '00000000-0000-0000-0000-000000000001',
        name: 'Filial Principal',
        code: 'MAIN',
        email: 'principal@institutoareluna.com',
        phone: '+351 123 456 789',
        address: 'Rua Principal, 123',
        city: 'Lisboa',
        postal_code: '1000-001',
        manager_name: 'Administrador',
        is_active: true
      }, { onConflict: 'id' })
      .select();
    
    if (branchError) {
      console.error('❌ Erro ao criar filial:', branchError.message);
      return false;
    }
    console.log('✅ Filial criada com sucesso');
    
    // 3. Criar usuário administrador padrão
    console.log('👤 Criando usuário administrador...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        email: 'admin@institutoareluna.com',
        password_hash: '$2b$10$dummy.hash.for.import.user.only',
        first_name: 'Administrador',
        last_name: 'Sistema',
        role: 'admin',
        branch_id: '00000000-0000-0000-0000-000000000001',
        is_active: true
      }, { onConflict: 'id' })
      .select();
    
    if (userError) {
      console.error('❌ Erro ao criar usuário:', userError.message);
      return false;
    }
    console.log('✅ Usuário administrador criado com sucesso');
    
    console.log('\n🎉 Dados básicos configurados com sucesso!');
    console.log('==================================================');
    console.log('📊 Empresa ID: 00000000-0000-0000-0000-000000000001');
    console.log('🏢 Filial ID: 00000000-0000-0000-0000-000000000001');
    console.log('👤 Usuário ID: 00000000-0000-0000-0000-000000000001');
    console.log('==================================================');
    
    return true;
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupBasicData().then(success => {
    if (!success) {
      process.exit(1);
    }
  });
}

module.exports = { setupBasicData };