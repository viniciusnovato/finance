#!/usr/bin/env node

/**
 * Script de teste para ler a planilha Excel
 */

const XLSX = require('xlsx');
const fs = require('fs');

function testExcelRead() {
    const excelFilePath = '/Users/insitutoareluna/Documents/finance/MACRO_PAGAMENTOS INSTITUTO ARELUNA - Editável (1).xlsm';
    
    console.log('=== Teste de Leitura da Planilha Excel ===');
    console.log(`Arquivo: ${excelFilePath}`);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(excelFilePath)) {
        console.error(`❌ Arquivo não encontrado: ${excelFilePath}`);
        return;
    }
    
    console.log('✅ Arquivo encontrado');
    
    try {
        // Ler o arquivo
        console.log('📖 Lendo arquivo...');
        const workbook = XLSX.readFile(excelFilePath);
        
        console.log('✅ Arquivo lido com sucesso');
        console.log(`📊 Abas encontradas: ${workbook.SheetNames.length}`);
        
        workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`\n--- Aba ${index + 1}: ${sheetName} ---`);
            
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
            
            console.log(`📝 Linhas de dados: ${jsonData.length}`);
            
            if (jsonData.length > 0) {
                console.log(`🔤 Colunas: ${Object.keys(jsonData[0]).join(', ')}`);
                
                // Mostrar primeira linha como exemplo
                console.log('\n📋 Primeira linha de dados:');
                console.log(JSON.stringify(jsonData[0], null, 2));
                
                // Mostrar estatísticas das colunas
                const columns = Object.keys(jsonData[0]);
                console.log('\n📈 Estatísticas das colunas:');
                columns.forEach(col => {
                    const nonEmptyValues = jsonData.filter(row => row[col] !== null && row[col] !== '').length;
                    const percentage = ((nonEmptyValues / jsonData.length) * 100).toFixed(1);
                    console.log(`  ${col}: ${nonEmptyValues}/${jsonData.length} (${percentage}%) valores preenchidos`);
                });
            } else {
                console.log('⚠️  Aba vazia');
            }
        });
        
        console.log('\n✅ Teste concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao ler arquivo:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Executar teste
testExcelRead();