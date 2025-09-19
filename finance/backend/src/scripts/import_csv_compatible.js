const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usar service role para operações administrativas

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Função para truncar strings
 */
function truncate(str, maxLength) {
    if (!str) return str;
    return str.toString().substring(0, maxLength);
}

/**
 * Limpa todas as tabelas
 */
async function clearAllTables() {
    console.log('🧹 Limpando dados existentes...');
    
    try {
        // Limpar na ordem correta (respeitando foreign keys)
        await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Tabela payments limpa');
        
        await supabase.from('contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Tabela contracts limpa');
        
        await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        console.log('✅ Tabela clients limpa');
        
    } catch (error) {
        console.error('❌ Erro ao limpar tabelas:', error.message);
        throw error;
    }
}

/**
 * Lê arquivo CSV e retorna array de objetos
 */
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', reject);
    });
}

/**
 * Converte dados do CSV para formato compatível com a tabela clients
 */
function mapClientData(csvRow) {
    
    return {
        first_name: truncate(csvRow.first_name || csvRow.name?.split(' ')[0], 100) || 'Nome',
        last_name: truncate(csvRow.last_name || csvRow.name?.split(' ').slice(1).join(' '), 100) || 'não informado',
        email: truncate(csvRow.email, 255) || null,
        phone: truncate(csvRow.phone, 20) || null,
        mobile: truncate(csvRow.mobile, 20) || null,
        tax_id: truncate(csvRow.document || csvRow.tax_id, 50) || null
    };
}

/**
 * Converte dados do CSV para formato compatível com a tabela contracts
 */
function mapContractData(csvRow, clientsMap) {
    const clientId = clientsMap[csvRow.client_id];
    if (!clientId) {
        console.warn(`⚠️ Cliente não encontrado para contract_id: ${csvRow.id}`);
        return null;
    }
    
    return {
        client_id: clientId,
        contract_number: truncate(`CONT_${csvRow.id}`, 100) || csvRow.id,
        value: parseFloat(csvRow.total_amount) || parseFloat(csvRow.value) || 0,
        start_date: csvRow.start_date || csvRow.date || new Date().toISOString().split('T')[0]
    };
}

/**
 * Converte dados do CSV para formato compatível com a tabela payments
 */
function mapPaymentData(csvRow, contractsMap) {
    const contractId = contractsMap[csvRow.contract_id];
    if (!contractId) {
        console.warn(`⚠️ Contrato não encontrado para payment_id: ${csvRow.id}`);
        return null;
    }
    
    return {
        contract_id: contractId,
        amount: parseFloat(csvRow.amount) || 0,
        due_date: csvRow.due_date || new Date().toISOString().split('T')[0],
        paid_date: csvRow.paid_date || null,
        status: truncate(csvRow.status, 50) || 'pending',
        payment_method: truncate(csvRow.payment_method, 50) || 'bank_transfer',
        notes: csvRow.notes || null,
        external_id: truncate(csvRow.id, 50) || null
    };
}

/**
 * Importa clientes
 */
async function importClients(testMode = false) {
    console.log('👥 Importando clientes...');
    
    const csvPath = path.join(__dirname, '../../../importBD/clients.csv');
    const clientsData = await readCSV(csvPath);
    
    // Em modo teste, importar apenas os primeiros 5 registros
    const dataToImport = testMode ? clientsData.slice(0, 5) : clientsData;
    
    const mappedClients = dataToImport.map(mapClientData);
    
    const { data, error } = await supabase
        .from('clients')
        .insert(mappedClients)
        .select('id, external_id');
    
    if (error) {
        console.error('❌ Erro ao importar clientes:', error);
        throw error;
    }
    
    // Criar mapa de external_id -> id para usar nas próximas importações
    const clientsMap = {};
    
    // Buscar todos os clientes importados com seus external_ids
    const { data: allClients } = await supabase
        .from('clients')
        .select('id, external_id');
    
    // Criar mapa usando tanto external_id quanto o ID original do CSV
    dataToImport.forEach((csvRow, index) => {
        const client = allClients[index];
        if (client) {
            // Mapear pelo ID original do CSV
            clientsMap[csvRow.id] = client.id;
            // Mapear também pelo external_id se existir
            if (client.external_id) {
                clientsMap[client.external_id] = client.id;
            }
        }
    });
    
    console.log(`✅ ${data.length} clientes importados`);
    return clientsMap;
}

/**
 * Importa contratos
 */
async function importContracts(clientsMap, testMode = false) {
    console.log('📋 Importando contratos...');
    
    const csvPath = path.join(__dirname, '../../../importBD/contracts.csv');
    const contractsData = await readCSV(csvPath);
    
    // Em modo teste, importar apenas os primeiros 5 registros
    const dataToImport = testMode ? contractsData.slice(0, 5) : contractsData;
    
    const mappedContracts = dataToImport
        .map(row => mapContractData(row, clientsMap))
        .filter(contract => contract !== null);
    
    if (mappedContracts.length === 0) {
        console.log('⚠️ Nenhum contrato válido para importar');
        return {};
    }
    
    const { data, error } = await supabase
        .from('contracts')
        .insert(mappedContracts)
        .select('id, external_id');
    
    if (error) {
        console.error('❌ Erro ao importar contratos:', error);
        throw error;
    }
    
    // Criar mapa de external_id -> id para usar na importação de pagamentos
    const contractsMap = {};
    
    // Buscar todos os contratos importados
    const { data: allContracts } = await supabase
        .from('contracts')
        .select('id, external_id');
    
    // Criar mapa usando tanto external_id quanto o ID original do CSV
    dataToImport.forEach((csvRow, index) => {
        const contract = allContracts[index];
        if (contract) {
            // Mapear pelo ID original do CSV
            contractsMap[csvRow.id] = contract.id;
            // Mapear também pelo external_id se existir
            if (contract.external_id) {
                contractsMap[contract.external_id] = contract.id;
            }
        }
    });
    
    console.log(`✅ ${data.length} contratos importados`);
    return contractsMap;
}

/**
 * Importa pagamentos
 */
async function importPayments(contractsMap, testMode = false) {
    console.log('💰 Importando pagamentos...');
    
    const csvPath = path.join(__dirname, '../../../importBD/payments.csv');
    const paymentsData = await readCSV(csvPath);
    
    // Em modo teste, importar apenas os primeiros 10 registros
    const dataToImport = testMode ? paymentsData.slice(0, 10) : paymentsData;
    
    const mappedPayments = dataToImport
        .map(row => mapPaymentData(row, contractsMap))
        .filter(payment => payment !== null);
    
    if (mappedPayments.length === 0) {
        console.log('⚠️ Nenhum pagamento válido para importar');
        return;
    }
    
    const { data, error } = await supabase
        .from('payments')
        .insert(mappedPayments);
    
    if (error) {
        console.error('❌ Erro ao importar pagamentos:', error);
        throw error;
    }
    
    console.log(`✅ ${data ? data.length : mappedPayments.length} pagamentos importados`);
}

/**
 * Função principal
 */
async function main() {
    const testMode = process.argv.includes('--test');
    
    console.log('🚀 Iniciando importação de dados CSV');
    console.log(`📊 Modo: ${testMode ? 'TESTE (poucos registros)' : 'COMPLETO'}`);
    
    try {
        // Limpar dados existentes
        await clearAllTables();
        
        // Importar na ordem correta (respeitando foreign keys)
        const clientsMap = await importClients(testMode);
        const contractsMap = await importContracts(clientsMap, testMode);
        await importPayments(contractsMap, testMode);
        
        console.log('\n🎉 Importação concluída com sucesso!');
        
        // Mostrar estatísticas
        const { data: clientsCount } = await supabase.from('clients').select('id', { count: 'exact' });
        const { data: contractsCount } = await supabase.from('contracts').select('id', { count: 'exact' });
        const { data: paymentsCount } = await supabase.from('payments').select('id', { count: 'exact' });
        
        console.log('\n📊 Estatísticas finais:');
        console.log(`   Clientes: ${clientsCount?.length || 0}`);
        console.log(`   Contratos: ${contractsCount?.length || 0}`);
        console.log(`   Pagamentos: ${paymentsCount?.length || 0}`);
        
    } catch (error) {
        console.error('💥 Erro durante a importação:', error.message);
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { main, importClients, importContracts, importPayments };