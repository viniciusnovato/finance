#!/usr/bin/env node

/**
 * Script para importar dados da planilha Excel do Instituto Areluna para o Supabase
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
    console.log('Por favor, configure o arquivo .env com as credenciais do Supabase');
    process.exit(1);
}

// Inicializar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Processa dados de clientes da aba "Banco de Dados"
 */
function processClientsFromBancoDados(data) {
    console.log('📋 Processando dados de clientes da aba "Banco de Dados"...');
    
    const clients = [];
    
    data.forEach((row, index) => {
        // Pular linhas vazias
        if (!row.Nome || row.Nome.toString().trim() === '') {
            return;
        }
        
        const fullName = row.Nome.toString().trim();
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        const client = {
            first_name: firstName,
            last_name: lastName,
            email: row['E-mail'] ? row['E-mail'].toString().trim() : null,
            phone: null, // Não disponível nesta aba
            mobile: null, // Não disponível nesta aba
            tax_id: null, // Não disponível nesta aba
            birth_date: null, // Não disponível nesta aba
            address: row.Morada ? row.Morada.toString().trim() : null,
            city: row.Cidade ? row.Cidade.toString().trim() : null,
            postal_code: row['Código postal'] ? row['Código postal'].toString().trim() : null,
            country: 'Portugal',
            attention_level: 'normal',
            notes: row.IBAN ? `IBAN: ${row.IBAN}` : null,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Validar email se fornecido
        if (client.email && !client.email.includes('@')) {
            client.email = null;
        }
        
        clients.push(client);
    });
    
    console.log(`✅ ${clients.length} clientes processados`);
    return clients;
}

/**
 * Processa dados de contratos da aba "Contratos Ativos"
 */
function processContractsFromAtivos(data, clientsMap) {
    console.log('📋 Processando dados de contratos da aba "Contratos Ativos"...');
    
    const contracts = [];
    
    data.forEach((row, index) => {
        // Verificar se há dados suficientes
        if (!row.Nome || row.Nome.toString().trim() === '') {
            return;
        }
        
        const clientName = row.Nome.toString().trim();
        let clientId = null;
        
        // Procurar cliente no mapeamento
        if (clientsMap[clientName]) {
            clientId = clientsMap[clientName];
        } else {
            // Tentar busca parcial
            const foundClient = Object.keys(clientsMap).find(name => 
                name.toLowerCase().includes(clientName.toLowerCase()) ||
                clientName.toLowerCase().includes(name.toLowerCase())
            );
            if (foundClient) {
                clientId = clientsMap[foundClient];
            }
        }
        
        if (!clientId) {
            console.warn(`⚠️  Cliente não encontrado para contrato: ${clientName}`);
            return;
        }
        
        const contract = {
            client_id: clientId,
            contract_number: row['Nº Contrato'] ? row['Nº Contrato'].toString().trim() : `CONT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(index + 1).padStart(3, '0')}`,
            description: row.Curso ? `Curso: ${row.Curso}` : 'Contrato de Serviços',
            total_amount: parseFloat(row['Valor Total'] || row['Valor'] || 0),
            start_date: row['Data Início'] || new Date().toISOString().split('T')[0],
            end_date: row['Data Fim'] || null,
            status: 'active',
            payment_frequency: 'monthly',
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Processar datas se estiverem no formato Excel
        if (typeof contract.start_date === 'number') {
            const excelDate = new Date((contract.start_date - 25569) * 86400 * 1000);
            if (!isNaN(excelDate.getTime())) {
                contract.start_date = excelDate.toISOString().split('T')[0];
            }
        }
        
        contracts.push(contract);
    });
    
    console.log(`✅ ${contracts.length} contratos processados`);
    return contracts;
}

/**
 * Processa dados de pagamentos da aba "PAGAMENTOS PARCIAIS"
 */
function processPaymentsFromParciais(data, contractsMap) {
    console.log('📋 Processando dados de pagamentos da aba "PAGAMENTOS PARCIAIS"...');
    
    const payments = [];
    
    data.forEach((row, index) => {
        // Verificar se há dados suficientes
        if (!row['Nº Contrato'] && !row.Nome) {
            return;
        }
        
        let contractId = null;
        const contractNumber = row['Nº Contrato'] ? row['Nº Contrato'].toString().trim() : null;
        
        if (contractNumber && contractsMap[contractNumber]) {
            contractId = contractsMap[contractNumber];
        }
        
        if (!contractId) {
            console.warn(`⚠️  Contrato não encontrado para pagamento: ${contractNumber || row.Nome}`);
            return;
        }
        
        const payment = {
            contract_id: contractId,
            amount: parseFloat(row.Valor || row['Valor Pago'] || 0),
            due_date: row['Data Vencimento'] || new Date().toISOString().split('T')[0],
            paid_date: row['Data Pagamento'] || null,
            status: row['Data Pagamento'] ? 'paid' : 'pending',
            payment_method: 'bank_transfer',
            notes: row.Observações || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Processar datas se estiverem no formato Excel
        ['due_date', 'paid_date'].forEach(dateField => {
            if (typeof payment[dateField] === 'number') {
                const excelDate = new Date((payment[dateField] - 25569) * 86400 * 1000);
                if (!isNaN(excelDate.getTime())) {
                    payment[dateField] = excelDate.toISOString().split('T')[0];
                }
            }
        });
        
        payments.push(payment);
    });
    
    console.log(`✅ ${payments.length} pagamentos processados`);
    return payments;
}

/**
 * Insere dados no Supabase
 */
async function insertDataToSupabase(tableName, data) {
    try {
        if (!data || data.length === 0) {
            console.log(`ℹ️  Nenhum dado para inserir na tabela ${tableName}`);
            return [];
        }
        
        console.log(`🚀 Inserindo ${data.length} registros na tabela ${tableName}...`);
        
        // Inserir em lotes de 50 para evitar timeouts
        const batchSize = 50;
        const insertedRecords = [];
        
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            
            console.log(`   📦 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(data.length / batchSize)}...`);
            
            const { data: result, error } = await supabase
                .from(tableName)
                .insert(batch)
                .select();
            
            if (error) {
                console.error(`❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error.message);
                
                // Tentar inserir registros individualmente para identificar problemas
                for (const record of batch) {
                    try {
                        const { data: singleResult, error: singleError } = await supabase
                            .from(tableName)
                            .insert([record])
                            .select();
                        
                        if (singleError) {
                            console.error(`❌ Erro no registro:`, singleError.message, record);
                        } else if (singleResult) {
                            insertedRecords.push(...singleResult);
                        }
                    } catch (singleErr) {
                        console.error(`❌ Erro crítico no registro:`, singleErr.message);
                    }
                }
                continue;
            }
            
            if (result) {
                insertedRecords.push(...result);
                console.log(`   ✅ ${result.length} registros inseridos`);
            }
        }
        
        console.log(`🎉 Total de ${insertedRecords.length} registros inseridos na tabela ${tableName}`);
        return insertedRecords;
        
    } catch (error) {
        console.error(`❌ Erro crítico ao inserir dados na tabela ${tableName}:`, error.message);
        return [];
    }
}

/**
 * Função principal
 */
async function main() {
    const excelFilePath = '/Users/pedro/Documents/finance/MACRO_PAGAMENTOS INSTITUTO ARELUNA - Editável (1).xlsm';
    
    console.log('🚀 === Iniciando Importação de Dados da Planilha Excel ===');
    console.log(`📁 Arquivo: ${excelFilePath}`);
    
    if (!fs.existsSync(excelFilePath)) {
        console.error(`❌ Arquivo não encontrado: ${excelFilePath}`);
        return;
    }
    
    try {
        // Ler planilha
        console.log('📖 Lendo arquivo Excel...');
        const workbook = XLSX.readFile(excelFilePath);
        console.log(`✅ Arquivo lido. Abas encontradas: ${workbook.SheetNames.length}`);
        console.log(`📊 Nomes das abas: ${workbook.SheetNames.join(', ')}`);
        
        // Mapear dados das abas principais
        const clientsMap = {};
        const contractsMap = {};
        
        // 1. Processar clientes da aba "Banco de Dados"
        if (workbook.SheetNames.includes('Banco de Dados')) {
            console.log('\n📊 === Processando Clientes ===');
            console.log('📋 Aba "Banco de Dados" encontrada');
            const bancoDadosSheet = workbook.Sheets['Banco de Dados'];
            const bancoDadosData = XLSX.utils.sheet_to_json(bancoDadosSheet, { defval: null });
            console.log(`📊 ${bancoDadosData.length} linhas encontradas na aba`);
            
            const clientsData = processClientsFromBancoDados(bancoDadosData);
            console.log('💾 Inserindo clientes no Supabase...');
            const insertedClients = await insertDataToSupabase('clients', clientsData);
            
            // Criar mapeamento de clientes
            insertedClients.forEach(client => {
                const fullName = `${client.first_name} ${client.last_name}`.trim();
                clientsMap[fullName] = client.id;
            });
            
            console.log(`🗂️  Clientes mapeados: ${Object.keys(clientsMap).length}`);
        } else {
            console.log('⚠️  Aba "Banco de Dados" não encontrada');
        }
        
        // 2. Processar contratos da aba "Contratos Ativos"
        if (workbook.SheetNames.includes('Contratos Ativos')) {
            console.log('\n📊 === Processando Contratos ===');
            console.log('📋 Aba "Contratos Ativos" encontrada');
            const contratosSheet = workbook.Sheets['Contratos Ativos'];
            const contratosData = XLSX.utils.sheet_to_json(contratosSheet, { defval: null });
            console.log(`📊 ${contratosData.length} linhas encontradas na aba`);
            
            const contractsData = processContractsFromAtivos(contratosData, clientsMap);
            console.log('💾 Inserindo contratos no Supabase...');
            const insertedContracts = await insertDataToSupabase('contracts', contractsData);
            
            // Criar mapeamento de contratos
            insertedContracts.forEach(contract => {
                contractsMap[contract.contract_number] = contract.id;
            });
            
            console.log(`🗂️  Contratos mapeados: ${Object.keys(contractsMap).length}`);
        } else {
            console.log('⚠️  Aba "Contratos Ativos" não encontrada');
        }
        
        // 3. Processar pagamentos da aba "PAGAMENTOS PARCIAIS"
        if (workbook.SheetNames.includes('PAGAMENTOS PARCIAIS')) {
            console.log('\n📊 === Processando Pagamentos ===');
            console.log('📋 Aba "PAGAMENTOS PARCIAIS" encontrada');
            const pagamentosSheet = workbook.Sheets['PAGAMENTOS PARCIAIS'];
            const pagamentosData = XLSX.utils.sheet_to_json(pagamentosSheet, { defval: null });
            console.log(`📊 ${pagamentosData.length} linhas encontradas na aba`);
            
            const paymentsData = processPaymentsFromParciais(pagamentosData, contractsMap);
            console.log('💾 Inserindo pagamentos no Supabase...');
            await insertDataToSupabase('payments', paymentsData);
        } else {
            console.log('⚠️  Aba "PAGAMENTOS PARCIAIS" não encontrada');
        }
        
        console.log('\n🎉 === Importação Concluída com Sucesso! ===');
        console.log(`👥 Clientes importados: ${Object.keys(clientsMap).length}`);
         console.log(`📄 Contratos importados: ${Object.keys(contractsMap).length}`);
         console.log('📊 Resumo do processamento completo');
         
         // Salvar mapeamentos para referência
        const mappings = {
            clients: clientsMap,
            contracts: contractsMap,
            importDate: new Date().toISOString()
        };
        
        fs.writeFileSync('/Users/pedro/Documents/finance/backend/import_mappings.json', JSON.stringify(mappings, null, 2));
        console.log('💾 Mapeamentos salvos em import_mappings.json');
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };