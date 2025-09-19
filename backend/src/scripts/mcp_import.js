const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Configurações
const PROJECT_ID = 'sxbslulfitfsijqrzljd';
const PROCESSED_DATA_PATH = path.join(__dirname, '../../processed_data.json');

// Função para executar comando MCP
function executeMCP(toolName, args) {
    return new Promise((resolve, reject) => {
        const mcpArgs = [
            'run_mcp',
            '--server-name', 'mcp.config.usrlocalmcp.supabase-mcp-finance',
            '--tool-name', toolName,
            '--args', JSON.stringify(args)
        ];
        
        console.log(`🔄 Executando MCP: ${toolName}`);
        
        const child = spawn('trae', mcpArgs, { stdio: 'pipe' });
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`MCP failed with code ${code}: ${stderr}`));
            }
        });
    });
}

// Função para importar clientes em lotes
async function importClients(clients) {
    console.log(`📥 Importando ${clients.length} clientes...`);
    
    const batchSize = 10; // Lotes menores para evitar problemas
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
        
        try {
            console.log(`Executando SQL para lote ${Math.floor(i/batchSize) + 1}...`);
            console.log(query.substring(0, 200) + '...');
            
            // Executar via MCP do Supabase
            await executeMCP('execute_sql', {
                project_id: PROJECT_ID,
                query: query
            });
            
            imported += batch.length;
            console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} importado: ${imported}/${clients.length} clientes`);
            
            // Pequena pausa entre lotes
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
            throw error;
        }
    }
    
    return imported;
}

// Função para importar contratos
async function importContracts(contracts) {
    console.log(`📥 Importando ${contracts.length} contratos...`);
    
    const batchSize = 10;
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
        
        try {
            console.log(`Executando SQL para lote de contratos ${Math.floor(i/batchSize) + 1}...`);
            
            // Executar via MCP do Supabase
            await executeMCP('execute_sql', {
                project_id: PROJECT_ID,
                query: query
            });
            
            imported += batch.length;
            console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} importado: ${imported}/${contracts.length} contratos`);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            console.error(`❌ Erro no lote de contratos ${Math.floor(i/batchSize) + 1}:`, error.message);
            throw error;
        }
    }
    
    return imported;
}

// Função principal
async function main() {
    try {
        console.log('🚀 Iniciando importação completa para Supabase via MCP...');
        
        // Carregar dados processados
        if (!fs.existsSync(PROCESSED_DATA_PATH)) {
            throw new Error(`Arquivo de dados processados não encontrado: ${PROCESSED_DATA_PATH}`);
        }
        
        const data = JSON.parse(fs.readFileSync(PROCESSED_DATA_PATH, 'utf8'));
        
        console.log(`📊 Dados carregados:`);
        console.log(`   👥 Clientes: ${data.clients.length}`);
        console.log(`   📄 Contratos: ${data.contracts.length}`);
        console.log(`   💰 Pagamentos: ${data.payments.length}`);
        
        // Verificar estado atual
        console.log('\n🔍 Verificando estado atual do banco...');
        
        // Importar dados
        console.log('\n📥 Iniciando importação...');
        const clientsImported = await importClients(data.clients);
        const contractsImported = await importContracts(data.contracts);
        
        console.log('\n✅ Importação concluída!');
        console.log(`📊 Resumo:`);
        console.log(`   👥 Clientes importados: ${clientsImported}`);
        console.log(`   📄 Contratos importados: ${contractsImported}`);
        console.log(`   💰 Pagamentos: ${data.payments.length} (nenhum encontrado na planilha)`);
        
        console.log('\n💡 Próximos passos:');
        console.log('   - Verificar dados importados no Supabase');
        console.log('   - Processar aba de pagamentos se disponível');
        console.log('   - Configurar interface do usuário');
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main, importClients, importContracts };