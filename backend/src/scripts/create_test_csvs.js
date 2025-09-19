const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Função para criar versões de teste dos CSVs
async function createTestCSVs() {
  const csvDir = path.join(__dirname, '../../../importBD');
  const testDir = path.join(csvDir, 'test');
  
  // Criar diretório de teste se não existir
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  
  // Configurações para cada arquivo
  const configs = [
    { file: 'clients.csv', testLines: 10 },
    { file: 'contracts.csv', testLines: 15 },
    // payments não será copiado conforme solicitado
  ];
  
  for (const config of configs) {
    const inputPath = path.join(csvDir, config.file);
    const outputPath = path.join(testDir, `test_${config.file}`);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Arquivo não encontrado: ${inputPath}`);
      continue;
    }
    
    console.log(`📂 Processando ${config.file}...`);
    
    const records = [];
    let headers = [];
    let isFirstRow = true;
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(inputPath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers = headerList;
        })
        .on('data', (data) => {
          if (records.length < config.testLines) {
            records.push(data);
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', reject);
    });
    
    // Escrever arquivo de teste
    if (records.length > 0 && headers.length > 0) {
      const csvWriter = createCsvWriter({
        path: outputPath,
        header: headers.map(h => ({ id: h, title: h }))
      });
      
      await csvWriter.writeRecords(records);
      console.log(`✅ Criado ${outputPath} com ${records.length} registros`);
    }
  }
  
  console.log('\n🎉 Arquivos de teste criados com sucesso!');
  console.log('📁 Localização:', testDir);
}

// Executar se chamado diretamente
if (require.main === module) {
  createTestCSVs().catch(console.error);
}

module.exports = { createTestCSVs };