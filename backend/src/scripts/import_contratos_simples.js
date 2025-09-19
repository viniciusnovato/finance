require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');

// Configurar cliente Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Função para limpar e converter dados
function cleanData(value, maxLength = null) {
  if (!value || value === '') return null;
  let cleaned = String(value).trim();
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
}

function parseMonetaryValue(value) {
  if (!value || value === '') return 0;
  return parseFloat(String(value).replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;
}

function parseDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  
  // Tentar diferentes formatos de data
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[0]) {
        // DD/MM/YYYY
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      } else {
        // YYYY-MM-DD
        return dateStr;
      }
    }
  }
  
  return null;
}

// Função para importar CSV
async function importCSV() {
  const csvPath = '/Users/insitutoareluna/Documents/finance/importBD/contratosAtivosFinal - Contratos Ativos.csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ Arquivo CSV não encontrado: ${csvPath}`);
    return;
  }

  const contracts = [];
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  const LIMIT = 1000; // Processar até 1000 contratos (ou todos se for menor)

  return new Promise((resolve) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (processedCount >= LIMIT) return;
        
        const contract = {
          client_name: cleanData(row['Nome'], 100),
          contract_number: cleanData(row['Contrato'], 50),
          start_date: parseDate(row['Início']),
          end_date: parseDate(row['Fim']),
          total_value: parseMonetaryValue(row['Total']),
          installment_value: parseMonetaryValue(row['Valor de Parcela']),
          area: cleanData(row['Área'] || 'N/A', 50),
          location: cleanData(row['Local'] || 'N/A', 50),
          method: cleanData(row['Método'] || 'N/A', 20)
        };
        
        // Validar dados essenciais
        if (contract.client_name && contract.contract_number && contract.total_value > 0) {
          contracts.push(contract);
          processedCount++;
          console.log(`📝 Processado: ${contract.client_name} - Contrato ${contract.contract_number}`);
        }
      })
      .on('end', async () => {
        console.log(`\n📊 Total de contratos processados: ${contracts.length}`);
        
        // Processar cada contrato
        for (const contract of contracts) {
          try {
            // Verificar se cliente já existe
            const nameParts = contract.client_name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            let { data: existingClient } = await supabase
              .from('clients')
              .select('id')
              .eq('first_name', firstName)
              .eq('last_name', lastName)
              .single();
            
            let clientId;
            if (!existingClient) {
              // Criar novo cliente
              const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert({
                  first_name: firstName,
                  last_name: lastName,
                  email: `${firstName.toLowerCase()}@exemplo.com`,
                  tax_id: `000${Math.random().toString().substr(2, 8)}`,
                  phone: '(00) 00000-0000',
                  country: 'Brasil',
                  status: 'active',
                  notes: `Cliente importado do contrato ${contract.contract_number}`
                })
                .select('id')
                .single();
              
              if (clientError) {
                console.error(`❌ Erro ao criar cliente ${contract.client_name}:`, clientError.message);
                errorCount++;
                continue;
              }
              
              clientId = newClient.id;
              console.log(`✅ Cliente criado: ${contract.client_name}`);
            } else {
              clientId = existingClient.id;
              console.log(`ℹ️  Cliente já existe: ${contract.client_name}`);
            }
            
            // Criar um registro simples na tabela clients como "contrato"
            // Já que a tabela contracts não existe, vamos usar a tabela clients para armazenar info do contrato
            const contractInfo = {
              first_name: `CONTRATO_${contract.contract_number}`,
              last_name: contract.client_name,
              email: `contrato${contract.contract_number}@exemplo.com`,
              tax_id: contract.contract_number,
              phone: contract.total_value.toString(),
              country: contract.area || 'N/A',
              status: 'active',
              notes: `Valor: R$ ${contract.total_value}, Parcela: R$ ${contract.installment_value}, Início: ${contract.start_date}, Local: ${contract.location}, Método: ${contract.method}`
            };
            
            const { error: contractError } = await supabase
              .from('clients')
              .insert(contractInfo);
            
            if (contractError) {
              console.error(`❌ Erro ao inserir contrato ${contract.contract_number}:`, contractError.message);
              errorCount++;
            } else {
              console.log(`✅ Contrato ${contract.contract_number} salvo como registro de cliente`);
              successCount++;
            }
            
          } catch (error) {
            console.error(`❌ Erro ao processar contrato ${contract.contract_number}:`, error.message);
            errorCount++;
          }
        }
        
        console.log('\n🎉 IMPORTAÇÃO CONCLUÍDA!');
        console.log('==================================================');
        console.log(`✅ Contratos importados com sucesso: ${successCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log('==================================================');
        
        resolve();
      });
  });
}

// Executar importação
if (require.main === module) {
  importCSV().catch(console.error);
}

module.exports = { importCSV };