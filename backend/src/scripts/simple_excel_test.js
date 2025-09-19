const XLSX = require('xlsx');
const fs = require('fs');

console.log('Iniciando teste...');

try {
    const filePath = '/Users/insitutoareluna/Documents/finance/MACRO_PAGAMENTOS INSTITUTO ARELUNA - Editável (1).xlsm';
    console.log('Lendo arquivo:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    console.log('Abas:', workbook.SheetNames);
    
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet);
    
    console.log('Linhas na primeira aba:', data.length);
    if (data.length > 0) {
        console.log('Colunas:', Object.keys(data[0]));
        console.log('Primeira linha:', JSON.stringify(data[0], null, 2));
    }
    
    // Salvar resultado em arquivo
    const result = {
        sheets: workbook.SheetNames,
        firstSheetData: data.slice(0, 5), // Primeiras 5 linhas
        totalRows: data.length
    };
    
    fs.writeFileSync('/Users/insitutoareluna/Documents/finance/backend/excel_test_result.json', JSON.stringify(result, null, 2));
    console.log('Resultado salvo em excel_test_result.json');
    
} catch (error) {
    console.error('Erro:', error.message);
    fs.writeFileSync('/Users/insitutoareluna/Documents/finance/backend/excel_test_error.txt', error.stack);
}