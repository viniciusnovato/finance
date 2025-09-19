const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configurações
const BATCH_SIZE = 50; // Tamanho do lote para importação
const CSV_BASE_PATH = path.join(__dirname, '../../../importBD');

/**
 * Lê um arquivo CSV e retorna os dados
 */
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        if (!fs.existsSync(filePath)) {
            reject(new Error(`Arquivo não encontrado: ${filePath}`));
            return;
        }
        
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                console.log(`📄 Lidos ${results.length} registros de ${path.basename(filePath)}`);
                resolve(results);
            })
            .on('error', reject);
    });
}

/**
 * Mapeia dados do CSV de clientes para o formato do banco
 */
function mapClientData(csvRow) {
    return {
        id: csvRow.id,
        first_name: csvRow.first_name || '',
        last_name: csvRow.last_name || '',
        email: csvRow.email || null,
        phone: csvRow.phone || null,
        mobile: csvRow.mobile || null,
        tax_id: csvRow.tax_id || null,
        birth_date: csvRow.birth_date || null,
        address: csvRow.address || null,
        city: csvRow.city || null,
        state: csvRow.state || null,
        postal_code: csvRow.postal_code || null,
        country: csvRow.country || 'Portugal',
        status: csvRow.status || 'active',
        notes: csvRow.notes || null,
        external_id: csvRow.external_id || null,
        created_at: csvRow.created_at || new Date().toISOString(),
        updated_at: csvRow.updated_at || new Date().toISOString()
    };
}

/**
 * Mapeia dados do CSV de contratos para o formato do banco
 */
function mapContractData(csvRow) {
    return {
        id: csvRow.id,
        client_id: csvRow.client_id,
        contract_number: csvRow.contract_number,
        description: csvRow.description || '',
        value: parseFloat(csvRow.value) || 0,
        start_date: csvRow.start_date || null,
        end_date: csvRow.end_date || null,
        status: csvRow.status || 'Ativo',
        payment_frequency: csvRow.payment_frequency || 'monthly',
        notes: csvRow.notes || null,
        created_at: csvRow.created_at || new Date().toISOString(),
        updated_at: csvRow.updated_at || new Date().toISOString()
    };
}

/**
 * Mapeia dados do CSV de pagamentos para o formato do banco
 */
function mapPaymentData(csvRow) {
    return {
        id: csvRow.id,
        contract_id: csvRow.contract_id,
        amount: parseFloat(csvRow.amount) || 0,
        due_date: csvRow.due_date || null,
        paid_date: csvRow.paid_date || null,
        status: csvRow.status || 'pending',
        payment_method: csvRow.payment_method || null,
        notes: csvRow.notes || null,
        external_id: csvRow.external_id || null,
        created_at: csvRow.created_at || new Date().toISOString(),
        updated_at: csvRow.updated_at || new Date().toISOString()
    };
}

/**
 * Importa dados em lotes
 */
async function importInBatches(data, tableName, mapFunction) {
    console.log(`📥 Importando ${data.length} registros para ${tableName}...`);
    
    let imported = 0;
    let errors = 0;
    
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);
        const mappedBatch = batch.map(mapFunction);
        
        try {
            const { data: result, error } = await supabase
                .from(tableName)
                .insert(mappedBatch);
            
            if (error) {
                console.error(`❌ Erro no lote ${Math.floor(i/BATCH_SIZE) + 1}:`, error);
                errors += batch.length;
            } else {
                imported += batch.length;
                console.log(`✅ Lote ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(data.length/BATCH_SIZE)} importado: ${imported}/${data.length}`);
            }
        } catch (error) {
            console.error(`💥 Erro fatal no lote ${Math.floor(i/BATCH_SIZE) + 1}:`, error);
            errors += batch.length;
        }
        
        // Pequena pausa entre lotes para não sobrecarregar o banco
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return { imported, errors, total: data.length };
}

/**
 * Importa clientes
 */
async function importClients(testMode = false) {
    console.log('\n👥 === IMPORTAÇÃO DE CLIENTES ===');
    
    try {
        const csvPath = path.join(CSV_BASE_PATH, 'clients.csv');
        const clientsData = await readCSV(csvPath);
        
        // Se modo teste, usar apenas os primeiros 10 registros
        const dataToImport = testMode ? clientsData.slice(0, 10) : clientsData;
        
        console.log(`📊 Total de clientes a importar: ${dataToImport.length}`);
        
        const result = await importInBatches(dataToImport, 'clients', mapClientData);
        
        console.log(`\n📈 Resultado da importação de clientes:`);
        console.log(`   ✅ Importados: ${result.imported}`);
        console.log(`   ❌ Erros: ${result.errors}`);
        console.log(`   📊 Total: ${result.total}`);
        
        return result;
        
    } catch (error) {
        console.error('💥 Erro ao importar clientes:', error);
        throw error;
    }
}

/**
 * Importa contratos
 */
async function importContracts(testMode = false) {
    console.log('\n📄 === IMPORTAÇÃO DE CONTRATOS ===');
    
    try {
        const csvPath = path.join(CSV_BASE_PATH, 'contracts.csv');
        const contractsData = await readCSV(csvPath);
        
        // Se modo teste, usar apenas os primeiros 10 registros
        const dataToImport = testMode ? contractsData.slice(0, 10) : contractsData;
        
        console.log(`📊 Total de contratos a importar: ${dataToImport.length}`);
        
        const result = await importInBatches(dataToImport, 'contracts', mapContractData);
        
        console.log(`\n📈 Resultado da importação de contratos:`);
        console.log(`   ✅ Importados: ${result.imported}`);
        console.log(`   ❌ Erros: ${result.errors}`);
        console.log(`   📊 Total: ${result.total}`);
        
        return result;
        
    } catch (error) {
        console.error('💥 Erro ao importar contratos:', error);
        throw error;
    }
}

/**
 * Importa pagamentos
 */
async function importPayments(testMode = false) {
    console.log('\n💰 === IMPORTAÇÃO DE PAGAMENTOS ===');
    
    try {
        const csvPath = path.join(CSV_BASE_PATH, 'payments.csv');
        const paymentsData = await readCSV(csvPath);
        
        // Se modo teste, usar apenas os primeiros 20 registros
        const dataToImport = testMode ? paymentsData.slice(0, 20) : paymentsData;
        
        console.log(`📊 Total de pagamentos a importar: ${dataToImport.length}`);
        
        const result = await importInBatches(dataToImport, 'payments', mapPaymentData);
        
        console.log(`\n📈 Resultado da importação de pagamentos:`);
        console.log(`   ✅ Importados: ${result.imported}`);
        console.log(`   ❌ Erros: ${result.errors}`);
        console.log(`   📊 Total: ${result.total}`);
        
        return result;
        
    } catch (error) {
        console.error('💥 Erro ao importar pagamentos:', error);
        throw error;
    }
}

/**
 * Verifica integridade dos dados após importação
 */
async function verifyDataIntegrity() {
    console.log('\n🔍 === VERIFICAÇÃO DE INTEGRIDADE ===');
    
    try {
        // Contar registros em cada tabela
        const { count: clientsCount } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });
        
        const { count: contractsCount } = await supabase
            .from('contracts')
            .select('*', { count: 'exact', head: true });
        
        const { count: paymentsCount } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true });
        
        console.log(`📊 Registros no banco de dados:`);
        console.log(`   👥 Clientes: ${clientsCount || 0}`);
        console.log(`   📄 Contratos: ${contractsCount || 0}`);
        console.log(`   💰 Pagamentos: ${paymentsCount || 0}`);
        
        // Verificar integridade referencial
        const { data: orphanContracts } = await supabase
            .from('contracts')
            .select('id, client_id')
            .not('client_id', 'in', `(SELECT id FROM clients)`);
        
        const { data: orphanPayments } = await supabase
            .from('payments')
            .select('id, contract_id')
            .not('contract_id', 'in', `(SELECT id FROM contracts)`);
        
        if (orphanContracts && orphanContracts.length > 0) {
            console.log(`⚠️  Contratos órfãos (sem cliente): ${orphanContracts.length}`);
        }
        
        if (orphanPayments && orphanPayments.length > 0) {
            console.log(`⚠️  Pagamentos órfãos (sem contrato): ${orphanPayments.length}`);
        }
        
        if ((!orphanContracts || orphanContracts.length === 0) && 
            (!orphanPayments || orphanPayments.length === 0)) {
            console.log('✅ Integridade referencial verificada - todos os dados estão consistentes!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar integridade:', error);
    }
}

/**
 * Função principal - Teste com dados relacionados
 */
async function runTest() {
    console.log('🧪 === MODO TESTE - IMPORTAÇÃO PARCIAL ===\n');
    
    try {
        // Primeiro, vamos ler todos os dados para identificar as relações
        const clientsPath = path.join(CSV_BASE_PATH, 'clients.csv');
        const contractsPath = path.join(CSV_BASE_PATH, 'contracts.csv');
        const paymentsPath = path.join(CSV_BASE_PATH, 'payments.csv');
        
        const allClients = await readCSV(clientsPath);
        const allContracts = await readCSV(contractsPath);
        const allPayments = await readCSV(paymentsPath);
        
        // PROBLEMA IDENTIFICADO: Os IDs dos clientes e client_ids dos contratos são conjuntos diferentes
        // SOLUÇÃO: Importar subset de clientes primeiro, depois contratos que tenham clientes correspondentes
        
        // Pegar os primeiros 10 clientes
        const testClients = allClients.slice(0, 10);
        const availableClientIds = testClients.map(c => c.id);
        
        console.log(`🔍 Clientes selecionados:`, availableClientIds.slice(0, 3), '...');
        
        // Filtrar contratos que tenham client_ids correspondentes aos clientes importados
        const testContracts = allContracts.filter(contract => availableClientIds.includes(contract.client_id)).slice(0, 10);
        
        console.log(`🔍 Contratos encontrados:`, testContracts.length);
        
        // Pegar pagamentos relacionados aos contratos de teste
        const testContractIds = testContracts.map(c => c.id);
        const testPayments = allPayments.filter(payment => testContractIds.includes(payment.contract_id)).slice(0, 20);
        
        console.log(`📊 Dados de teste selecionados:`);
        console.log(`   👥 Clientes: ${testClients.length}`);
        console.log(`   📄 Contratos: ${testContracts.length}`);
        console.log(`   💰 Pagamentos: ${testPayments.length}\n`);
        
        // Importar dados de teste com relações corretas
        const clientsResult = await importInBatches(testClients, 'clients', mapClientData);
        const contractsResult = await importInBatches(testContracts, 'contracts', mapContractData);
        const paymentsResult = await importInBatches(testPayments, 'payments', mapPaymentData);
        
        await verifyDataIntegrity();
        
        console.log('\n🎯 === RESUMO DO TESTE ===');
        console.log(`👥 Clientes: ${clientsResult.imported}/${clientsResult.total}`);
        console.log(`📄 Contratos: ${contractsResult.imported}/${contractsResult.total}`);
        console.log(`💰 Pagamentos: ${paymentsResult.imported}/${paymentsResult.total}`);
        
        const totalImported = clientsResult.imported + contractsResult.imported + paymentsResult.imported;
        const totalErrors = clientsResult.errors + contractsResult.errors + paymentsResult.errors;
        
        if (totalErrors === 0) {
            console.log('✅ Teste concluído com sucesso! Pronto para importação completa.');
        } else {
            console.log(`⚠️  Teste concluído com ${totalErrors} erros. Verifique os logs acima.`);
        }
        
    } catch (error) {
        console.error('💥 Erro durante o teste:', error);
        throw error;
    }
}

/**
 * Função principal - Importação completa
 */
async function runFullImport() {
    console.log('🚀 === IMPORTAÇÃO COMPLETA ===\n');
    
    try {
        const clientsResult = await importClients(false);
        const contractsResult = await importContracts(false);
        const paymentsResult = await importPayments(false);
        
        await verifyDataIntegrity();
        
        console.log('\n🎯 === RESUMO DA IMPORTAÇÃO COMPLETA ===');
        console.log(`👥 Clientes: ${clientsResult.imported}/${clientsResult.total}`);
        console.log(`📄 Contratos: ${contractsResult.imported}/${contractsResult.total}`);
        console.log(`💰 Pagamentos: ${paymentsResult.imported}/${paymentsResult.total}`);
        
        const totalImported = clientsResult.imported + contractsResult.imported + paymentsResult.imported;
        const totalErrors = clientsResult.errors + contractsResult.errors + paymentsResult.errors;
        
        console.log(`\n📊 Total geral:`);
        console.log(`   ✅ Importados: ${totalImported}`);
        console.log(`   ❌ Erros: ${totalErrors}`);
        
        if (totalErrors === 0) {
            console.log('\n🎉 Importação completa realizada com sucesso!');
        } else {
            console.log(`\n⚠️  Importação concluída com ${totalErrors} erros. Verifique os logs acima.`);
        }
        
    } catch (error) {
        console.error('💥 Erro durante a importação completa:', error);
        throw error;
    }
}

// Executar baseado nos argumentos da linha de comando
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--test')) {
        runTest().catch(console.error);
    } else if (args.includes('--full')) {
        runFullImport().catch(console.error);
    } else {
        console.log('📋 Uso:');
        console.log('  node import_csv_final.js --test    # Importação de teste (poucos registros)');
        console.log('  node import_csv_final.js --full    # Importação completa');
    }
}

module.exports = {
    importClients,
    importContracts,
    importPayments,
    verifyDataIntegrity,
    runTest,
    runFullImport
};