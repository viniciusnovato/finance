const fs = require('fs');
const path = require('path');

// Carregar dados processados
const PROCESSED_DATA_PATH = path.join(__dirname, '../../processed_data.json');
const data = JSON.parse(fs.readFileSync(PROCESSED_DATA_PATH, 'utf8'));

console.log('🚀 Gerando SQL para importação em lote...');
console.log(`📊 Dados: ${data.clients.length} clientes, ${data.contracts.length} contratos, ${data.payments.length} pagamentos`);

// Gerar SQL para clientes
function generateClientsSQL() {
    if (data.clients.length === 0) return '';
    
    const values = data.clients.map(client => {
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
        const country = client.country ? `'${client.country.replace(/'/g, "''")}'` : "'Brasil'";
        const notes = client.notes ? `'${client.notes.replace(/'/g, "''")}'` : 'NULL';
        const status = client.status ? `'${client.status}'` : "'active'";
        const externalId = client.external_id ? `'${client.external_id}'` : 'NULL';
        
        return `(${firstName}, ${lastName}, ${email}, ${phone}, ${mobile}, ${taxId}, ${birthDate}, ${address}, ${city}, ${state}, ${postalCode}, ${country}, ${notes}, ${status}, ${externalId})`;
    }).join(',\n    ');
    
    return `INSERT INTO clients (
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
}

// Gerar SQL para contratos
function generateContractsSQL() {
    if (data.contracts.length === 0) return '';
    
    const values = data.contracts.map(contract => {
        const contractNumber = contract.contract_number ? `'${contract.contract_number.replace(/'/g, "''")}'` : 'NULL';
        const description = contract.description ? `'${contract.description.replace(/'/g, "''")}'` : 'NULL';
        const value = contract.value || 0;
        const startDate = contract.start_date ? `'${contract.start_date}'` : 'NULL';
        const endDate = contract.end_date ? `'${contract.end_date}'` : 'NULL';
        const status = contract.status ? `'${contract.status}'` : "'active'";
        const paymentFrequency = contract.payment_frequency ? `'${contract.payment_frequency}'` : "'monthly'";
        const notes = contract.notes ? `'${contract.notes.replace(/'/g, "''")}'` : 'NULL';
        const externalId = contract.external_id ? `'${contract.external_id}'` : 'NULL';
        const clientExternalId = contract.client_external_id ? `'${contract.client_external_id}'` : 'NULL';
        
        return `(
        (SELECT id FROM clients WHERE external_id = ${clientExternalId} LIMIT 1),
        ${contractNumber}, ${description}, ${value}, ${startDate}, ${endDate}, 
        ${status}, ${paymentFrequency}, ${notes}, ${externalId}
    )`;
    }).join(',\n    ');
    
    return `INSERT INTO contracts (
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
}

// Gerar SQL para pagamentos
function generatePaymentsSQL() {
    if (data.payments.length === 0) return '';
    
    const values = data.payments.map(payment => {
        const amount = payment.amount || 0;
        const dueDate = payment.due_date ? `'${payment.due_date}'` : 'NULL';
        const paidDate = payment.paid_date ? `'${payment.paid_date}'` : 'NULL';
        const status = payment.status ? `'${payment.status}'` : "'pending'";
        const paymentMethod = payment.payment_method ? `'${payment.payment_method.replace(/'/g, "''")}'` : 'NULL';
        const notes = payment.notes ? `'${payment.notes.replace(/'/g, "''")}'` : 'NULL';
        const externalId = payment.external_id ? `'${payment.external_id}'` : 'NULL';
        const contractExternalId = payment.contract_external_id ? `'${payment.contract_external_id}'` : 'NULL';
        
        return `(
        (SELECT id FROM contracts WHERE external_id = ${contractExternalId} LIMIT 1),
        ${amount}, ${dueDate}, ${paidDate}, ${status}, ${paymentMethod}, ${notes}, ${externalId}
    )`;
    }).join(',\n    ');
    
    return `INSERT INTO payments (
    contract_id, amount, due_date, paid_date, status, payment_method, notes, external_id
) VALUES 
    ${values}
ON CONFLICT (external_id) DO UPDATE SET
    amount = EXCLUDED.amount,
    due_date = EXCLUDED.due_date,
    paid_date = EXCLUDED.paid_date,
    status = EXCLUDED.status,
    updated_at = NOW();`;
}

// Gerar todos os SQLs
const clientsSQL = generateClientsSQL();
const contractsSQL = generateContractsSQL();
const paymentsSQL = generatePaymentsSQL();

// Salvar SQLs em arquivos
if (clientsSQL) {
    fs.writeFileSync(path.join(__dirname, 'clients_import.sql'), clientsSQL);
    console.log('✅ SQL de clientes gerado: clients_import.sql');
}

if (contractsSQL) {
    fs.writeFileSync(path.join(__dirname, 'contracts_import.sql'), contractsSQL);
    console.log('✅ SQL de contratos gerado: contracts_import.sql');
}

if (paymentsSQL) {
    fs.writeFileSync(path.join(__dirname, 'payments_import.sql'), paymentsSQL);
    console.log('✅ SQL de pagamentos gerado: payments_import.sql');
} else {
    console.log('⚠️ Nenhum pagamento para importar');
}

console.log('\n🎉 Arquivos SQL gerados com sucesso!');
console.log('💡 Use as funções MCP do Supabase para executar os SQLs na ordem: clientes → contratos → pagamentos');