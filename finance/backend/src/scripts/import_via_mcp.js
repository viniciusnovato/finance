#!/usr/bin/env node

/**
 * Script para importar dados processados para o Supabase usando MCP
 */

const fs = require('fs');
const path = require('path');

// Configurações
const PROJECT_ID = 'sxbslulfitfsijqrzljd';
const PROCESSED_DATA_PATH = path.join(__dirname, '../../processed_data.json');
const BATCH_SIZE = 10; // Lotes pequenos para evitar timeouts

/**
 * Gera SQL para inserção em lote
 */
function generateClientInsertSQL(clients, startIndex = 0, batchSize = BATCH_SIZE) {
    const batch = clients.slice(startIndex, startIndex + batchSize);
    if (batch.length === 0) return null;
    
    const values = batch.map(client => {
        const firstName = client.first_name ? `'${client.first_name.replace(/'/g, "''")}'` : 'NULL';
        const lastName = client.last_name ? `'${client.last_name.replace(/'/g, "''")}'` : 'NULL';
        const email = client.email ? `'${client.email.replace(/'/g, "''")}'` : 'NULL';
        const city = client.city ? `'${client.city.replace(/'/g, "''")}'` : 'NULL';
        const country = client.country ? `'${client.country.replace(/'/g, "''")}'` : "'Portugal'";
        
        return `(${firstName}, ${lastName}, ${email}, ${city}, ${country}, true)`;
    }).join(', ');
    
    return `INSERT INTO public.clients (first_name, last_name, email, city, country, is_active) VALUES ${values} RETURNING id, first_name, last_name, email;`;
}

/**
 * Gera SQL para inserção de contratos
 */
function generateContractInsertSQL(contracts, clientsMap, startIndex = 0, batchSize = BATCH_SIZE) {
    const batch = contracts.slice(startIndex, startIndex + batchSize);
    if (batch.length === 0) return null;
    
    const values = batch.map(contract => {
        const clientId = clientsMap[contract.client_id];
        if (!clientId) return null;
        
        const contractNumber = `'${contract.contract_number.replace(/'/g, "''")}'`;
        const description = contract.description ? `'${contract.description.replace(/'/g, "''")}'` : 'NULL';
        const totalAmount = contract.value || 0;
        const startDate = contract.start_date ? `'${contract.start_date}'` : "'2024-01-01'";
        const status = "'active'";
        const paymentFrequency = "'monthly'";
        
        return `('${clientId}', ${contractNumber}, ${description}, ${totalAmount}, ${startDate}, ${status}, ${paymentFrequency})`;
    }).filter(v => v !== null).join(', ');
    
    if (!values) return null;
    
    return `INSERT INTO public.contracts (client_id, contract_number, description, total_amount, start_date, status, payment_frequency) VALUES ${values} RETURNING id, contract_number, client_id;`;
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 Iniciando importação via MCP...');
    
    try {
        // Carregar dados processados
        if (!fs.existsSync(PROCESSED_DATA_PATH)) {
            throw new Error(`Arquivo de dados processados não encontrado: ${PROCESSED_DATA_PATH}`);
        }
        
        const processedData = JSON.parse(fs.readFileSync(PROCESSED_DATA_PATH, 'utf8'));
        const { clients, contracts, payments } = processedData;
        
        console.log(`📊 Dados carregados:`);
        console.log(`   👥 Clientes: ${clients.length}`);
        console.log(`   📄 Contratos: ${contracts.length}`);
        console.log(`   💰 Pagamentos: ${payments.length}`);
        
        // Importar clientes em lotes
        console.log('\n📋 Importando clientes...');
        const clientsMap = {}; // Mapear external_id para UUID real
        let totalClientsImported = 0;
        
        for (let i = 0; i < clients.length; i += BATCH_SIZE) {
            const sql = generateClientInsertSQL(clients, i, BATCH_SIZE);
            if (!sql) continue;
            
            console.log(`   Lote ${Math.floor(i/BATCH_SIZE) + 1}: clientes ${i + 1} a ${Math.min(i + BATCH_SIZE, clients.length)}`);
            console.log(`   SQL: ${sql.substring(0, 100)}...`);
            
            // Aqui você executaria via MCP:
            // const result = await mcp_supabase_execute_sql(PROJECT_ID, sql);
            
            totalClientsImported += Math.min(BATCH_SIZE, clients.length - i);
        }
        
        console.log(`✅ ${totalClientsImported} clientes preparados para importação`);
        
        // Gerar exemplo de SQL para contratos
        console.log('\n📋 Preparando contratos...');
        let totalContractsReady = 0;
        
        for (let i = 0; i < Math.min(contracts.length, 20); i += BATCH_SIZE) {
            // Simular mapeamento de clientes (em produção, viria do resultado da importação)
            const mockClientsMap = {};
            clients.slice(0, 50).forEach((client, index) => {
                mockClientsMap[`client_${index + 1}`] = `uuid-${index + 1}`;
            });
            
            const sql = generateContractInsertSQL(contracts, mockClientsMap, i, BATCH_SIZE);
            if (!sql) continue;
            
            console.log(`   Lote ${Math.floor(i/BATCH_SIZE) + 1}: contratos ${i + 1} a ${Math.min(i + BATCH_SIZE, contracts.length)}`);
            console.log(`   SQL: ${sql.substring(0, 100)}...`);
            
            totalContractsReady += Math.min(BATCH_SIZE, contracts.length - i);
        }
        
        console.log(`✅ ${totalContractsReady} contratos preparados para importação`);
        
        // Salvar SQLs gerados para análise
        const sqlExamples = {
            clientExample: generateClientInsertSQL(clients, 0, 5),
            contractExample: generateContractInsertSQL(contracts, {'client_1': 'uuid-example'}, 0, 3),
            generatedAt: new Date().toISOString()
        };
        
        const sqlPath = path.join(__dirname, '../../import_sql_examples.json');
        fs.writeFileSync(sqlPath, JSON.stringify(sqlExamples, null, 2));
        
        console.log('\n📊 Resumo da preparação:');
        console.log(`   ✅ ${clients.length} clientes prontos para importação`);
        console.log(`   ✅ ${contracts.length} contratos prontos para importação`);
        console.log(`   📁 Exemplos de SQL salvos em: ${sqlPath}`);
        console.log('\n💡 Para executar a importação real, use as funções MCP do Supabase');
        console.log('   com os SQLs gerados em lotes pequenos.');
        
    } catch (error) {
        console.error('❌ Erro durante a preparação:', error.message);
        throw error;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };