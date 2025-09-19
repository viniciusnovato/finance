const fs = require('fs');
const path = require('path');

// Configurações
const PROCESSED_DATA_PATH = path.join(__dirname, '../../processed_data.json');

// Função para criar SQL de importação de clientes
function createClientsBatchSQL(clients, batchSize = 50) {
    const batches = [];
    
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
            const country = client.country ? `'${client.country.replace(/'/g, "''")}'` : "'Brasil'";
            const notes = client.notes ? `'${client.notes.replace(/'/g, "''")}'` : 'NULL';
            const status = client.status ? `'${client.status}'` : "'active'";
            const externalId = client.external_id ? `'${client.external_id}'` : 'NULL';
            
            return `(${firstName}, ${lastName}, ${email}, ${phone}, ${mobile}, ${taxId}, ${birthDate}, ${address}, ${city}, ${state}, ${postalCode}, ${country}, ${notes}, ${status}, ${externalId})`;
        }).join(',\n    ');
        
        const query = `INSERT INTO clients (
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
        
        batches.push({
            batchNumber: Math.floor(i/batchSize) + 1,
            totalBatches: Math.ceil(clients.length/batchSize),
            count: batch.length,
            query: query
        });
    }
    
    return batches;
}

// Função para criar SQL de importação de contratos
function createContractsBatchSQL(contracts, batchSize = 50) {
    const batches = [];
    
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
            const clientExternalId = contract.client_external_id ? `'${contract.client_external_id}'` : 'NULL';
            
            return `(
        (SELECT id FROM clients WHERE external_id = ${clientExternalId} LIMIT 1),
        ${contractNumber}, ${description}, ${value}, ${startDate}, ${endDate}, 
        ${status}, ${paymentFrequency}, ${notes}, ${externalId}
    )`;
        }).join(',\n    ');
        
        const query = `INSERT INTO contracts (
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
        
        batches.push({
            batchNumber: Math.floor(i/batchSize) + 1,
            totalBatches: Math.ceil(contracts.length/batchSize),
            count: batch.length,
            query: query
        });
    }
    
    return batches;
}

async function main() {
    try {
        console.log('🚀 Gerando SQLs de importação...');
        
        // Carregar dados processados
        if (!fs.existsSync(PROCESSED_DATA_PATH)) {
            throw new Error(`Arquivo de dados processados não encontrado: ${PROCESSED_DATA_PATH}`);
        }
        
        const data = JSON.parse(fs.readFileSync(PROCESSED_DATA_PATH, 'utf8'));
        
        console.log(`📊 Dados carregados:`);
        console.log(`   👥 Clientes: ${data.clients.length}`);
        console.log(`   📄 Contratos: ${data.contracts.length}`);
        console.log(`   💰 Pagamentos: ${data.payments.length}`);
        
        // Gerar SQLs de clientes
        console.log('\n📝 Gerando SQLs de clientes...');
        const clientBatches = createClientsBatchSQL(data.clients, 50);
        
        // Salvar SQLs de clientes
        const clientsSQL = clientBatches.map((batch, index) => {
            return `-- Lote ${batch.batchNumber}/${batch.totalBatches} - ${batch.count} clientes\n${batch.query};\n`;
        }).join('\n');
        
        fs.writeFileSync(path.join(__dirname, '../../clients_import_full.sql'), clientsSQL);
        console.log(`✅ Arquivo clients_import_full.sql criado com ${clientBatches.length} lotes`);
        
        // Gerar SQLs de contratos
        console.log('\n📝 Gerando SQLs de contratos...');
        const contractBatches = createContractsBatchSQL(data.contracts, 50);
        
        // Salvar SQLs de contratos
        const contractsSQL = contractBatches.map((batch, index) => {
            return `-- Lote ${batch.batchNumber}/${batch.totalBatches} - ${batch.count} contratos\n${batch.query};\n`;
        }).join('\n');
        
        fs.writeFileSync(path.join(__dirname, '../../contracts_import_full.sql'), contractsSQL);
        console.log(`✅ Arquivo contracts_import_full.sql criado com ${contractBatches.length} lotes`);
        
        console.log('\n🎯 Próximos passos:');
        console.log('   1. Execute os SQLs via MCP do Supabase');
        console.log('   2. Primeiro importe todos os clientes');
        console.log('   3. Depois importe todos os contratos');
        console.log('   4. Verifique os dados importados');
        
        // Retornar informações dos lotes para execução manual
        return {
            clientBatches: clientBatches.length,
            contractBatches: contractBatches.length,
            totalClients: data.clients.length,
            totalContracts: data.contracts.length
        };
        
    } catch (error) {
        console.error('❌ Erro durante a geração:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main, createClientsBatchSQL, createContractsBatchSQL };