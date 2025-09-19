const { createClient } = require('@supabase/supabase-js');
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

// Dados de exemplo
const sampleData = {
  companies: [
    {
      name: 'Financeira Exemplo Ltda',
      document: '12.345.678/0001-90',
      email: 'contato@financeira.com',
      phone: '(11) 3333-4444',
      address: 'Rua das Empresas, 123',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567'
    }
  ],
  
  branches: [
    {
      name: 'Filial Centro',
      code: 'CTR001',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01310-100',
      phone: '(11) 3333-4445',
      email: 'centro@financeira.com',
      manager_name: 'João Silva'
    },
    {
      name: 'Filial Norte',
      code: 'NRT001',
      address: 'Rua do Norte, 500',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '02345-678',
      phone: '(11) 3333-4446',
      email: 'norte@financeira.com',
      manager_name: 'Maria Santos'
    }
  ],
  
  clients: [
    {
      name: 'Carlos Eduardo Silva',
      document: '123.456.789-01',
      document_type: 'CPF',
      email: 'carlos@email.com',
      phone: '(11) 9999-1111',
      mobile: '(11) 9999-1111',
      birth_date: '1985-03-15',
      address: 'Rua das Flores, 456',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      occupation: 'Vendedor',
      monthly_income: 3500.00,
      marital_status: 'casado',
      spouse_name: 'Ana Silva',
      spouse_document: '987.654.321-09',
      spouse_phone: '(11) 9999-2222'
    },
    {
      name: 'Fernanda Costa',
      document: '987.654.321-09',
      document_type: 'CPF',
      email: 'fernanda@email.com',
      phone: '(11) 8888-3333',
      mobile: '(11) 8888-3333',
      birth_date: '1990-07-22',
      address: 'Av. das Américas, 789',
      neighborhood: 'Vila Nova',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '02345-678',
      occupation: 'Professora',
      monthly_income: 4200.00,
      marital_status: 'solteiro'
    },
    {
      name: 'Roberto Oliveira',
      document: '456.789.123-45',
      document_type: 'CPF',
      email: 'roberto@email.com',
      phone: '(11) 7777-4444',
      mobile: '(11) 7777-4444',
      birth_date: '1978-12-10',
      address: 'Rua do Comércio, 321',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01234-567',
      occupation: 'Comerciante',
      monthly_income: 5500.00,
      marital_status: 'divorciado'
    }
  ],
  
  predefinedNotes: [
    {
      category: 'client',
      title: 'Cliente Inadimplente',
      content: 'Cliente com histórico de atraso nos pagamentos. Requer acompanhamento especial.'
    },
    {
      category: 'client',
      title: 'Bom Pagador',
      content: 'Cliente pontual nos pagamentos. Perfil de baixo risco.'
    },
    {
      category: 'contract',
      title: 'Contrato Renegociado',
      content: 'Contrato passou por processo de renegociação de valores e prazos.'
    },
    {
      category: 'payment',
      title: 'Pagamento em Atraso',
      content: 'Parcela paga com atraso. Aplicada multa conforme contrato.'
    },
    {
      category: 'general',
      title: 'Contato Realizado',
      content: 'Contato telefônico realizado com sucesso.'
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando inserção de dados de exemplo...');
    
    // 1. Inserir empresa
    console.log('📊 Inserindo empresa...');
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .insert(sampleData.companies)
      .select();
    
    if (companyError) {
      console.error('❌ Erro ao inserir empresa:', companyError.message);
      return;
    }
    
    const companyId = companies[0].id;
    console.log(`✅ Empresa criada: ${companies[0].name}`);
    
    // 2. Inserir filiais
    console.log('🏢 Inserindo filiais...');
    const branchesWithCompany = sampleData.branches.map(branch => ({
      ...branch,
      company_id: companyId
    }));
    
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .insert(branchesWithCompany)
      .select();
    
    if (branchError) {
      console.error('❌ Erro ao inserir filiais:', branchError.message);
      return;
    }
    
    console.log(`✅ ${branches.length} filiais criadas`);
    
    // 3. Inserir clientes
    console.log('👥 Inserindo clientes...');
    const clientsWithRefs = sampleData.clients.map((client, index) => ({
      ...client,
      company_id: companyId,
      branch_id: branches[index % branches.length].id
    }));
    
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .insert(clientsWithRefs)
      .select();
    
    if (clientError) {
      console.error('❌ Erro ao inserir clientes:', clientError.message);
      return;
    }
    
    console.log(`✅ ${clients.length} clientes criados`);
    
    // 4. Inserir contratos de exemplo
    console.log('📋 Inserindo contratos...');
    const contracts = [
      {
        company_id: companyId,
        branch_id: branches[0].id,
        client_id: clients[0].id,
        contract_number: 'CTR-2024-001',
        product_description: 'Financiamento de Móveis - Sala de Estar Completa',
        total_amount: 5000.00,
        down_payment: 1500.00,
        financed_amount: 3500.00,
        installments: 12,
        installment_amount: 291.67,
        interest_rate: 0.0199,
        start_date: '2024-01-15',
        first_due_date: '2024-02-15',
        payment_method: 'boleto'
      },
      {
        company_id: companyId,
        branch_id: branches[1].id,
        client_id: clients[1].id,
        contract_number: 'CTR-2024-002',
        product_description: 'Financiamento de Eletrodomésticos',
        total_amount: 3000.00,
        down_payment: 900.00,
        financed_amount: 2100.00,
        installments: 10,
        installment_amount: 210.00,
        interest_rate: 0.0150,
        start_date: '2024-02-01',
        first_due_date: '2024-03-01',
        payment_method: 'cartao'
      }
    ];
    
    const { data: insertedContracts, error: contractError } = await supabase
      .from('contracts')
      .insert(contracts)
      .select();
    
    if (contractError) {
      console.error('❌ Erro ao inserir contratos:', contractError.message);
      return;
    }
    
    console.log(`✅ ${insertedContracts.length} contratos criados`);
    
    // 5. Gerar parcelas para os contratos
    console.log('💰 Gerando parcelas...');
    
    for (const contract of insertedContracts) {
      const payments = [];
      const startDate = new Date(contract.first_due_date);
      
      for (let i = 1; i <= contract.installments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(startDate.getMonth() + (i - 1));
        
        // Simular alguns pagamentos já realizados
        const isPaid = i <= 3; // Primeiras 3 parcelas pagas
        const isOverdue = i === 4 && Math.random() > 0.5; // 4ª parcela pode estar em atraso
        
        payments.push({
          company_id: contract.company_id,
          branch_id: contract.branch_id,
          contract_id: contract.id,
          client_id: contract.client_id,
          installment_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          amount: contract.installment_amount,
          paid_amount: isPaid ? contract.installment_amount : 0,
          payment_date: isPaid ? dueDate.toISOString().split('T')[0] : null,
          payment_method: isPaid ? contract.payment_method : null,
          status: isPaid ? 'paid' : (isOverdue ? 'overdue' : 'pending')
        });
      }
      
      const { error: paymentError } = await supabase
        .from('payments')
        .insert(payments);
      
      if (paymentError) {
        console.error(`❌ Erro ao inserir parcelas do contrato ${contract.contract_number}:`, paymentError.message);
      } else {
        console.log(`✅ ${payments.length} parcelas criadas para contrato ${contract.contract_number}`);
      }
    }
    
    // 6. Inserir notas predefinidas
    console.log('📝 Inserindo notas predefinidas...');
    const notesWithCompany = sampleData.predefinedNotes.map(note => ({
      ...note,
      company_id: companyId
    }));
    
    const { error: notesError } = await supabase
      .from('predefined_notes')
      .insert(notesWithCompany);
    
    if (notesError) {
      console.error('❌ Erro ao inserir notas:', notesError.message);
    } else {
      console.log(`✅ ${notesWithCompany.length} notas predefinidas criadas`);
    }
    
    console.log('🎉 Dados de exemplo inseridos com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`- 1 empresa: ${companies[0].name}`);
    console.log(`- ${branches.length} filiais`);
    console.log(`- ${clients.length} clientes`);
    console.log(`- ${insertedContracts.length} contratos`);
    console.log(`- ${notesWithCompany.length} notas predefinidas`);
    
  } catch (error) {
    console.error('❌ Erro durante a inserção de dados:', error.message);
    process.exit(1);
  }
}

// Função para limpar dados de exemplo
async function clearSampleData() {
  try {
    console.log('🧹 Limpando dados de exemplo...');
    
    const tables = ['payments', 'contracts', 'clients', 'predefined_notes', 'branches', 'companies'];
    
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      
      if (error) {
        console.warn(`⚠️  Aviso ao limpar tabela ${table}: ${error.message}`);
      } else {
        console.log(`✅ Tabela ${table} limpa`);
      }
    }
    
    console.log('✅ Dados de exemplo removidos!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar dados:', error.message);
  }
}

// Executar script
if (require.main === module) {
  const action = process.argv[2] || 'seed';
  
  if (action === 'clear') {
    clearSampleData();
  } else {
    seedDatabase();
  }
}

module.exports = { seedDatabase, clearSampleData };