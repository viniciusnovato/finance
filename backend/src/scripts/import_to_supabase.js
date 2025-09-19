const fs = require('fs');
const path = require('path');

// Configurações
const PROJECT_ID = 'sxbslulfitfsijqrzljd';
const PROCESSED_DATA_PATH = path.join(__dirname, '../../processed_data.json');

// Função para executar SQL via MCP (simulação)
async function executeMCPSQL(query) {
    console.log('🔄 Executando SQL:', query.substring(0, 100) + '...');
    // Esta função seria chamada via MCP na prática
    return { success: true };
}

// Função para importar clientes
async function importClients(clients) {
    console.log(`📥 Importando ${clients.length} clientes...`);
    
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < clients.length; i += batchSize) {
        const batch = clients.slice(i, i + batchSize);
        
        const values = batch.map(client => {
            const firstName = client.first_name ? `'${client.first_name.replace(/'/g, "''")}'` : 'NULL';
            const lastName = client.last_name ? `'${client.last_name.replace(/'/g, "''")}'` : 'NULL';
            const email = client.email ? `'${client.email.replace(/'/g, "''")}'` : 'NULL';
            const phone = client.phone ? `'${client.phone.replace(/'/g, "''")}'` : 'NULL';
            const mobile = client.mobile ? `'${client.mobile.replace(/'/g, "''")}'` : 'NULL';
            const taxId = client.tax_id ? `'${client.tax_id.replace(/'/g, "''")}'` : 'NULL';
            const birthDate = client.birth_date ? `'${client.birth_date}'` : 'NULL';
            const address = client.address ? `'${client.address.replace(/'/g, "''")}'` : 'NULL';
            const city = client.city ? `'${client.city.replace(/'/g, "''")}'` : 'NULL';
            const state = client.state ? `'${client.state.replace(/'/g, "''")}'` : 'NULL';
            const postalCode = client.postal_code ? `'${client.postal_code.replace(/'/g, "''")}'` : 'NULL';
            const country = client.country ? `'${client.country.replace(/'/g, "''")}'` : 'NULL';
            const notes = client.notes ? `'${client.notes.replace(/'/g, "''")}'` : 'NULL';
            const status = client.status ? `'${client.status}'` : "'active'";
            const externalId = client.external_id ? `'${client.external_id}'` : 'NULL';
            
            return `(${firstName}, ${lastName}, ${email}, ${phone}, ${mobile}, ${taxId}, ${birthDate}, ${address}, ${city}, ${state}, ${postalCode}, ${country}, ${notes}, ${status}, ${externalId})`;
        }).join(',\n    ');
        
        const query = `
INSERT INTO clients (
    first_name, last_name, email, phone, mobile, tax_id, birth_date, 
    address, city, state, postal_code, country, notes, status, external_id
) VALUES 
    ${values}
ON CONFLICT (external_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    mobile = EXCLUDED.mobile,
    updated_at = NOW();`;
        
        await executeMCPSQL(query);
        imported += batch.length;
        console.log(`✅ Importados ${imported}/${clients.length} clientes`);
    }
    
    return imported;
}

// Função para importar contratos
async function importContracts(contracts) {
    console.log(`📥 Importando ${contracts.length} contratos...`);
    
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < contracts.length; i += batchSize) {
        const batch = contracts.slice(i, i + batchSize);
        
        const values = batch.map(contract => {
            const contractNumber = contract.contract_number ? `'${contract.contract_number.replace(/'/g, "''")}'` : 'NULL';
            const description = contract.description ? `'${contract.description.replace(/'/g, "''")}'` : 'NULL';
            const value = contract.value || 0;
            const startDate = contract.start_date ? `'${contract.start_date}'` : 'NULL';
            const endDate = contract.end_date ? `'${contract.end_date}'` : 'NULL';
            const status = contract.status ? `'${contract.status}'` : "'active'";
            const paymentFrequency = contract.payment_frequency ? `'${contract.payment_frequency}'` : "'monthly'";
            const notes = contract.notes ? `'${contract.notes.replace(/'/g, "''")}'` : 'NULL';
            const externalId = contract.external_id ? `'${contract.external_id}'` : 'NULL';
            
            return `(
        (SELECT id FROM clients WHERE external_id = '${contract.client_external_id}' LIMIT 1),
        ${contractNumber}, ${description}, ${value}, ${startDate}, ${endDate}, 
        ${status}, ${paymentFrequency}, ${notes}, ${externalId}
    )`;
        }).join(',\n    ');
        
        const query = `
INSERT INTO contracts (
    client_id, contract_number, description, value, start_date, end_date,
    status, payment_frequency, notes, external_id
) VALUES 
    ${values}
ON CONFLICT (external_id) DO UPDATE SET
    description = EXCLUDED.description,
    value = EXCLUDED.value,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    status = EXCLUDED.status,
    updated_at = NOW();`;
        
        await executeMCPSQL(query);
        imported += batch.length;
        console.log(`✅ Importados ${imported}/${contracts.length} contratos`);
    }
    
    return imported;
}

// Função para importar pagamentos
async function importPayments(payments) {
    if (payments.length === 0) {
        console.log('⚠️ Nenhum pagamento para importar');
        return 0;
    }
    
    console.log(`📥 Importando ${payments.length} pagamentos...`);
    
    const batchSize = 50;
    let imported = 0;
    
    for (let i = 0; i < payments.length; i += batchSize) {
        const batch = payments.slice(i, i + batchSize);
        
        const values = batch.map(payment => {
            const amount = payment.amount || 0;
            const dueDate = payment.due_date ? `'${payment.due_date}'` : 'NULL';
            const paidDate = payment.paid_date ? `'${payment.paid_date}'` : 'NULL';
            const status = payment.status ? `'${payment.status}'` : "'pending'";
            const paymentMethod = payment.payment_method ? `'${payment.payment_method.replace(/'/g, "''")}'` : 'NULL';
            const notes = payment.notes ? `'${payment.notes.replace(/'/g, "''")}'` : 'NULL';
            const externalId = payment.external_id ? `'${payment.external_id}'` : 'NULL';
            
            return `(
        (SELECT id FROM contracts WHERE external_id = '${payment.contract_external_id}' LIMIT 1),
        ${amount}, ${dueDate}, ${paidDate}, ${status}, ${paymentMethod}, ${notes}, ${externalId}
    )`;
        }).join(',\n    ');
        
        const query = `
INSERT INTO payments (
    contract_id, amount, due_date, paid_date, status, payment_method, notes, external_id
) VALUES 
    ${values}
ON CONFLICT (external_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    due_date = EXCLUDED.due_date,
    paid_date = EXCLUDED.paid_date,
    status = EXCLUDED.status,
    updated_at = NOW();`;
        
        await executeMCPSQL(query);
        imported += batch.length;
        console.log(`✅ Importados ${imported}/${payments.length} pagamentos`);
    }
    
    return imported;
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando importação para Supabase...');
        
        // Carregar dados processados
        if (!fs.existsSync(PROCESSED_DATA_PATH)) {
            throw new Error(`Arquivo de dados processados não encontrado: ${PROCESSED_DATA_PATH}`);
        }
        
        const data = JSON.parse(fs.readFileSync(PROCESSED_DATA_PATH, 'utf8'));
        
        console.log(`📊 Dados carregados:`);
        console.log(`   👥 Clientes: ${data.clients.length}`);
        console.log(`   📄 Contratos: ${data.contracts.length}`);
        console.log(`   💰 Pagamentos: ${data.payments.length}`);
        
        // Importar dados
        const clientsImported = await importClients(data.clients);
        const contractsImported = await importContracts(data.contracts);
        const paymentsImported = await importPayments(data.payments);
        
        console.log('\n✅ Importação concluída!');
        console.log(`📊 Resumo:`);
        console.log(`   👥 Clientes importados: ${clientsImported}`);
        console.log(`   📄 Contratos importados: ${contractsImported}`);
        console.log(`   💰 Pagamentos importados: ${paymentsImported}`);
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, importClients, importContracts, importPayments };