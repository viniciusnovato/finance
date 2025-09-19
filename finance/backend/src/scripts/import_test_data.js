const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Importar funções do script principal
const { cleanData } = require('./import_csv_data');

// Função para importar dados de um arquivo CSV (versão para teste)
async function importTestCSV(filePath, tableName) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let imported = 0;
    
    console.log(`📂 Lendo arquivo de teste: ${filePath}`);
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const cleanedData = cleanData(data, tableName);
        if (Object.keys(cleanedData).length > 0) {
          results.push(cleanedData);
        }
      })
      .on('end', async () => {
        console.log(`📊 ${results.length} registros lidos do CSV de teste`);
        
        if (results.length === 0) {
          console.log('⚠️  Nenhum registro válido encontrado');
          resolve({ imported: 0, errors: 0 });
          return;
        }
        
        try {
          const { data, error } = await supabase
            .from(tableName)
            .insert(results)
            .select();
          
          if (error) {
            console.log(`❌ Erro na importação: ${error.message}`);
            errors.push({ error: error.message });
          } else {
            imported = data ? data.length : results.length;
            console.log(`✅ ${imported} registros de teste importados com sucesso`);
          }
        } catch (err) {
          console.log(`❌ Erro na importação: ${err.message}`);
          errors.push({ error: err.message });
        }
        
        resolve({ imported, errors: errors.length });
      })
      .on('error', (error) => {
        console.error(`❌ Erro ao ler arquivo ${filePath}:`, error);
        reject(error);
      });
  });
}

// Função principal para teste
async function mainTest() {
  try {
    console.log('🧪 Iniciando importação de DADOS DE TESTE...');
    
    // Testar conexão
    console.log('🔗 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      process.exit(1);
    }
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const testDir = path.join(__dirname, '../../../importBD/test');
    let totalImported = 0;
    let totalErrors = 0;
    
    // Arquivos CSV de teste para importar (ordem importante devido às dependências)
    const testFiles = [
      { file: 'test_clients.csv', table: 'clients' },
      { file: 'test_contracts.csv', table: 'contracts' }
      // payments será importado apenas na versão completa
    ];
    
    for (const { file, table } of testFiles) {
      const filePath = path.join(testDir, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`\n📋 Importando ${table} (TESTE)...`);
        const result = await importTestCSV(filePath, table);
        console.log(`📊 ${table}: ${result.imported} importados, ${result.errors} erros`);
        
        totalImported += result.imported;
        totalErrors += result.errors;
      } else {
        console.log(`⚠️  Arquivo de teste não encontrado: ${filePath}`);
      }
    }
    
    console.log('\n🎉 IMPORTAÇÃO DE TESTE CONCLUÍDA!');
    console.log('==================================================');
    console.log(`📊 Total de registros de teste importados: ${totalImported}`);
    console.log(`❌ Total de erros: ${totalErrors}`);
    console.log('==================================================');
    
    if (totalErrors > 0) {
      console.log('⚠️  Alguns erros ocorreram durante a importação de teste.');
      console.log('   Verifique os logs acima para mais detalhes.');
    } else {
      console.log('✅ Teste bem-sucedido! Agora você pode executar a importação completa.');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  mainTest();
}

module.exports = { importTestCSV, mainTest };