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

// Função para limpar e mapear dados
function cleanData(data, tableName) {
  const cleaned = {};
  
  // Função auxiliar para limitar string
  const limitString = (str, maxLength) => {
    if (!str) return null;
    return String(str).substring(0, maxLength);
  };
  
  // Função auxiliar para converter para número
  const toNumber = (value) => {
    if (!value || value === '') return null;
    const num = parseFloat(String(value).replace(',', '.'));
    return isNaN(num) ? null : num;
  };
  
  // Função auxiliar para converter data
  const toDate = (value) => {
    if (!value || value === '') return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
  };
  
  switch (tableName) {
    case 'clients':
      // Mapear campos do CSV para o schema da tabela clients
      cleaned.first_name = limitString(data.first_name || data.nome || data.name, 255);
      cleaned.last_name = limitString(data.last_name || data.sobrenome, 255);
      cleaned.tax_id = limitString(data.document || data.documento || data.tax_id || data.cpf || data.cnpj, 50);
      cleaned.email = limitString(data.email, 255);
      cleaned.phone = limitString(data.phone || data.telefone, 50);
      cleaned.mobile = limitString(data.mobile || data.celular, 50);
      cleaned.birth_date = toDate(data.birth_date || data.data_nascimento);
      cleaned.address = data.address || data.endereco;
      cleaned.city = limitString(data.city || data.cidade, 100);
      cleaned.postal_code = limitString(data.zip_code || data.postal_code || data.cep, 20);
      cleaned.country = limitString(data.country || data.pais, 100) || 'Portugal';
      cleaned.notes = data.notes || data.observacoes;
      break;
      
    case 'contracts':
        // Mapear campos do CSV para o schema da tabela contracts
        cleaned.client_id = data.client_id;
        cleaned.branch_id = data.branch_id || '00000000-0000-0000-0000-000000000001'; // Usar filial padrão
        cleaned.contract_number = limitString(data.contract_number || data.numero_contrato, 50);
        cleaned.treatment_description = data.description || data.product_description || data.descricao_produto || data.treatment_description || 'Tratamento não especificado';
        cleaned.total_amount = toNumber(data.value || data.total_amount || data.valor_total || data.financed_amount) || 0;
        cleaned.down_payment = toNumber(data.down_payment || data.entrada) || 0;
        cleaned.installments = parseInt(data.installments || data.parcelas) || 1;
        cleaned.installment_amount = toNumber(data.installment_amount || data.valor_parcela) || 0;
        cleaned.start_date = toDate(data.start_date || data.data_inicio);
        cleaned.end_date = toDate(data.end_date || data.data_fim);
        cleaned.status = data.status === 'inactive' ? 'closed' : (data.status || 'active');
        cleaned.created_by = data.created_by || '00000000-0000-0000-0000-000000000001'; // Usar usuário padrão
        cleaned.notes = data.notes || data.observacoes;
        // Garantir que down_payment seja pelo menos 30% do total_amount
        if (cleaned.total_amount > 0 && cleaned.down_payment < cleaned.total_amount * 0.30) {
          cleaned.down_payment = cleaned.total_amount * 0.30;
        }
        break;
      
    case 'payments':
       // Mapear campos do CSV para o schema da tabela payments
       cleaned.contract_id = data.contract_id;
       cleaned.installment_number = parseInt(data.installment_number || data.numero_parcela) || 1;
       cleaned.amount = toNumber(data.amount || data.valor) || 0;
       cleaned.due_date = toDate(data.due_date || data.data_vencimento);
       cleaned.paid_date = toDate(data.paid_date || data.data_pagamento);
       cleaned.status = data.status || 'pending';
       cleaned.payment_method = data.payment_method || data.metodo_pagamento || 'transfer';
       cleaned.reference_number = limitString(data.reference_number || data.numero_referencia, 100);
       cleaned.created_by = data.created_by || '00000000-0000-0000-0000-000000000001'; // Usar usuário padrão
       cleaned.notes = data.notes || data.observacoes;
       break;
  }
  
  // Remover campos undefined ou null vazios
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === undefined || cleaned[key] === '') {
      delete cleaned[key];
    }
  });
  
  return cleaned;
}

// Função para importar dados de um arquivo CSV
async function importCSV(filePath, tableName) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let imported = 0;
    
    console.log(`📂 Lendo arquivo: ${filePath}`);
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        const cleanedData = cleanData(data, tableName);
        if (Object.keys(cleanedData).length > 0) {
          results.push(cleanedData);
        }
      })
      .on('end', async () => {
        console.log(`📊 ${results.length} registros lidos do CSV`);
        
        if (results.length === 0) {
          console.log('⚠️  Nenhum registro válido encontrado');
          resolve({ imported: 0, errors: 0 });
          return;
        }
        
        // Determinar tamanho do lote baseado na tabela
        const batchSize = tableName === 'payments' ? 10 : 50;
        
        // Processar em lotes
        for (let i = 0; i < results.length; i += batchSize) {
          const batch = results.slice(i, i + batchSize);
          const batchNumber = Math.floor(i / batchSize) + 1;
          
          try {
            const { data, error } = await supabase
              .from(tableName)
              .insert(batch)
              .select();
            
            if (error) {
              console.log(`❌ Erro no lote ${batchNumber}: ${error.message}`);
              errors.push({ batch: batchNumber, error: error.message });
            } else {
              imported += data ? data.length : batch.length;
              console.log(`✅ Lote ${batchNumber}: ${batch.length} registros importados`);
            }
          } catch (err) {
            console.log(`❌ Erro no lote ${batchNumber}: ${err.message}`);
            errors.push({ batch: batchNumber, error: err.message });
          }
        }
        
        resolve({ imported, errors: errors.length });
      })
      .on('error', (error) => {
        console.error(`❌ Erro ao ler arquivo ${filePath}:`, error);
        reject(error);
      });
  });
}

// Função principal
async function main() {
  try {
    console.log('🚀 Iniciando importação dos dados CSV...');
    
    // Testar conexão
    console.log('🔗 Testando conexão com Supabase...');
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    if (error) {
      console.error('❌ Erro de conexão:', error.message);
      process.exit(1);
    }
    console.log('✅ Conexão estabelecida com sucesso!');
    
    const csvDir = path.join(__dirname, '../../../importBD');
    let totalImported = 0;
    let totalErrors = 0;
    
    // Arquivos CSV para importar (ordem importante devido às dependências)
    const csvFiles = [
      { file: 'clients.csv', table: 'clients' },
      { file: 'contracts.csv', table: 'contracts' },
      { file: 'payments.csv', table: 'payments' }
    ];
    
    for (const { file, table } of csvFiles) {
      const filePath = path.join(csvDir, file);
      
      if (fs.existsSync(filePath)) {
        console.log(`\n📋 Importando ${table}...`);
        const result = await importCSV(filePath, table);
        console.log(`📊 ${table}: ${result.imported} importados, ${result.errors} erros`);
        
        totalImported += result.imported;
        totalErrors += result.errors;
      } else {
        console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
      }
    }
    
    console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
    console.log('==================================================');
    console.log(`📊 Total de registros importados: ${totalImported}`);
    console.log(`❌ Total de erros: ${totalErrors}`);
    console.log('==================================================');
    
    if (totalErrors > 0) {
      console.log('⚠️  Alguns erros ocorreram durante a importação.');
      console.log('   Verifique os logs acima para mais detalhes.');
    }
    
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { importCSV, cleanData };