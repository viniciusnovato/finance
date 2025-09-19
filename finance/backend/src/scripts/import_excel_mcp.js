#!/usr/bin/env node

/**
 * Script para importar dados da planilha Excel do Instituto Areluna para o Supabase usando MCP
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Configurações
const EXCEL_FILE_PATH = path.join(__dirname, '../../../MACRO_PAGAMENTOS INSTITUTO pagina 1.xlsm');
const PROJECT_ID = 'sxbslulfitfsijqrzljd'; // ID do projeto Supabase

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
            phone: null,
            mobile: null,
            tax_id: null,
            birth_date: null,
            address: null,
            city: row.Cidade ? row.Cidade.toString().trim() : null,
            state: row.Estado ? row.Estado.toString().trim() : null,
            postal_code: null,
            country: 'Brasil',
            notes: null,
            status: 'active',
            external_id: `bd_${index + 1}`
        };
        
        clients.push(client);
    });
    
    console.log(`✅ Processados ${clients.length} clientes da aba "Banco de Dados"`);
    return clients;
}

/**
 * Processa dados de contratos da aba "Contratos Ativos"
 */
function processContractsFromAtivos(data, clientsMap) {
    console.log('📋 Processando dados de contratos da aba "Contratos Ativos"...');
    
    const contracts = [];
    
    data.forEach((row, index) => {
        if (!row.Nome || row.Nome.toString().trim() === '') {
            return;
        }
        
        const clientName = row.Nome.toString().trim();
        const clientId = clientsMap[clientName];
        
        if (!clientId) {
            console.warn(`⚠️ Cliente não encontrado: ${clientName}`);
            return;
        }
        
        // Processar valor do contrato
        let contractValue = 0;
        if (row['Valor do Contrato']) {
            const valueStr = row['Valor do Contrato'].toString().replace(/[^\d,.-]/g, '').replace(',', '.');
            contractValue = parseFloat(valueStr) || 0;
        }
        
        // Processar data de início
        let startDate = null;
        if (row['Data de Início']) {
            const dateValue = row['Data de Início'];
            if (dateValue instanceof Date) {
                startDate = dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                    startDate = parsedDate.toISOString().split('T')[0];
                }
            }
        }
        
        const contract = {
            client_id: clientId,
            contract_number: `CONT_${index + 1}`,
            description: row.Serviço ? row.Serviço.toString().trim() : 'Serviço não especificado',
            value: contractValue,
            start_date: startDate,
            end_date: null,
            status: 'active',
            payment_frequency: 'monthly',
            notes: null,
            external_id: `ca_${index + 1}`
        };
        
        contracts.push(contract);
    });
    
    console.log(`✅ Processados ${contracts.length} contratos da aba "Contratos Ativos"`);
    return contracts;
}

/**
 * Processa dados de pagamentos da aba "PAGAMENTOS PARCIAIS"
 */
function processPaymentsFromParciais(data, contractsMap) {
    console.log('📋 Processando dados de pagamentos da aba "PAGAMENTOS PARCIAIS"...');
    
    const payments = [];
    
    data.forEach((row, index) => {
        if (!row.Nome || row.Nome.toString().trim() === '') {
            return;
        }
        
        const clientName = row.Nome.toString().trim();
        const contractId = contractsMap[clientName];
        
        if (!contractId) {
            console.warn(`⚠️ Contrato não encontrado para cliente: ${clientName}`);
            return;
        }
        
        // Processar valor do pagamento
        let amount = 0;
        if (row['Valor Pago']) {
            const valueStr = row['Valor Pago'].toString().replace(/[^\d,.-]/g, '').replace(',', '.');
            amount = parseFloat(valueStr) || 0;
        }
        
        // Processar data de vencimento
        let dueDate = null;
        if (row['Data de Vencimento']) {
            const dateValue = row['Data de Vencimento'];
            if (dateValue instanceof Date) {
                dueDate = dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                    dueDate = parsedDate.toISOString().split('T')[0];
                }
            }
        }
        
        // Processar data de pagamento
        let paidDate = null;
        if (row['Data de Pagamento']) {
            const dateValue = row['Data de Pagamento'];
            if (dateValue instanceof Date) {
                paidDate = dateValue.toISOString().split('T')[0];
            } else if (typeof dateValue === 'string') {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                    paidDate = parsedDate.toISOString().split('T')[0];
                }
            }
        }
        
        const payment = {
            contract_id: contractId,
            amount: amount,
            due_date: dueDate,
            paid_date: paidDate,
            status: paidDate ? 'paid' : 'pending',
            payment_method: row['Método de Pagamento'] ? row['Método de Pagamento'].toString().trim() : null,
            notes: null,
            external_id: `pp_${index + 1}`
        };
        
        payments.push(payment);
    });
    
    console.log(`✅ Processados ${payments.length} pagamentos da aba "PAGAMENTOS PARCIAIS"`);
    return payments;
}

/**
 * Gera SQL para inserção em lote
 */
function generateBatchInsertSQL(tableName, data, batchSize = 100) {
    if (!data || data.length === 0) {
        return [];
    }
    
    const queries = [];
    const columns = Object.keys(data[0]);
    
    for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        const values = batch.map(row => {
            const rowValues = columns.map(col => {
                const value = row[col];
                if (value === null || value === undefined) {
                    return 'NULL';
                } else if (typeof value === 'string') {
                    return `'${value.replace(/'/g, "''")}'`;
                } else if (typeof value === 'number') {
                    return value.toString();
                } else if (typeof value === 'boolean') {
                    return value ? 'true' : 'false';
                } else {
                    return `'${value.toString().replace(/'/g, "''")}'`;
                }
            });
            return `(${rowValues.join(', ')})`;
        }).join(', ');
        
        const query = `INSERT INTO public.${tableName} (${columns.join(', ')}) VALUES ${values};`;
        queries.push(query);
    }
    
    return queries;
}

/**
 * Função principal
 */
async function main() {
    console.log('🚀 Iniciando importação de dados do Excel para Supabase usando MCP...');
    
    try {
        // Verificar se o arquivo Excel existe
        if (!fs.existsSync(EXCEL_FILE_PATH)) {
            throw new Error(`Arquivo Excel não encontrado: ${EXCEL_FILE_PATH}`);
        }
        
        console.log('📖 Carregando dados do Excel...');
        const workbook = XLSX.readFile(EXCEL_FILE_PATH);
        console.log('✅ Dados carregados com sucesso!');
        console.log('📊 Planilhas encontradas:', workbook.SheetNames);
        
        // Processar aba "Banco de Dados"
        console.log('\n📋 Processando aba "Banco de Dados"...');
        if (!workbook.Sheets['Banco de Dados']) {
            throw new Error('Aba "Banco de Dados" não encontrada');
        }
        
        const bancoDadosData = XLSX.utils.sheet_to_json(workbook.Sheets['Banco de Dados']);
        console.log(`📊 Linhas encontradas na aba "Banco de Dados": ${bancoDadosData.length}`);
        
        const clients = processClientsFromBancoDados(bancoDadosData);
        
        // Processar aba "Contratos Ativos"
        console.log('\n📋 Processando aba "Contratos Ativos"...');
        if (!workbook.Sheets['Contratos Ativos']) {
            throw new Error('Aba "Contratos Ativos" não encontrada');
        }
        
        const contratosAtivosData = XLSX.utils.sheet_to_json(workbook.Sheets['Contratos Ativos']);
        console.log(`📊 Linhas encontradas na aba "Contratos Ativos": ${contratosAtivosData.length}`);
        
        // Criar mapa de clientes para referência
        const clientsMap = {};
        clients.forEach((client, index) => {
            const fullName = `${client.first_name} ${client.last_name}`.trim();
            clientsMap[fullName] = `client_${index + 1}`; // Usaremos IDs temporários
        });
        
        const contracts = processContractsFromAtivos(contratosAtivosData, clientsMap);
        
        // Processar aba "PAGAMENTOS PARCIAIS"
        console.log('\n📋 Processando aba "PAGAMENTOS PARCIAIS"...');
        if (!workbook.Sheets['PAGAMENTOS PARCIAIS']) {
            throw new Error('Aba "PAGAMENTOS PARCIAIS" não encontrada');
        }
        
        const pagamentosParciais = XLSX.utils.sheet_to_json(workbook.Sheets['PAGAMENTOS PARCIAIS']);
        console.log(`📊 Linhas encontradas na aba "PAGAMENTOS PARCIAIS": ${pagamentosParciais.length}`);
        
        // Criar mapa de contratos para referência
        const contractsMap = {};
        contracts.forEach((contract, index) => {
            const clientFullName = Object.keys(clientsMap).find(name => clientsMap[name] === contract.client_id);
            if (clientFullName) {
                contractsMap[clientFullName] = `contract_${index + 1}`; // Usaremos IDs temporários
            }
        });
        
        const payments = processPaymentsFromParciais(pagamentosParciais, contractsMap);
        
        // Salvar dados processados para análise
        const processedData = {
            clients: clients,
            contracts: contracts,
            payments: payments,
            summary: {
                totalClients: clients.length,
                totalContracts: contracts.length,
                totalPayments: payments.length,
                processedAt: new Date().toISOString()
            }
        };
        
        const outputPath = path.join(__dirname, '../../processed_data.json');
        fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
        
        console.log('\n📊 Resumo dos dados processados:');
        console.log(`   👥 Clientes: ${clients.length}`);
        console.log(`   📄 Contratos: ${contracts.length}`);
        console.log(`   💰 Pagamentos: ${payments.length}`);
        console.log(`   📁 Dados salvos em: ${outputPath}`);
        
        console.log('\n✅ Processamento concluído! Os dados estão prontos para importação via MCP.');
        console.log('💡 Use as funções MCP do Supabase para inserir os dados no banco.');
        
        return processedData;
        
    } catch (error) {
        console.error('❌ Erro durante a importação:', error.message);
        throw error;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main };