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

// Função para converter valor monetário europeu para número
function parseEuroValue(value) {
  if (!value || value === '' || value === '#NAME?') return 0;
  // Remove espaços, €, e converte vírgula para ponto
  const cleanValue = String(value)
    .replace(/[€\s]/g, '')
    .replace(/\./g, '') // Remove pontos de milhares
    .replace(',', '.'); // Converte vírgula decimal para ponto
  
  const parsed = parseFloat(cleanValue);
  return isNaN(parsed) ? 0 : parsed;
}

// Função para converter data no formato DD-MM-YYYY
function parseDate(dateStr) {
  if (!dateStr || dateStr === '') return null;
  
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Se está no formato DD/MM/YYYY ou similar
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return null;
}

// Função para mapear dados do CSV para o formato do banco
function mapContractData(row) {
  const clientName = row['Nome']?.trim();
  const contractNumber = row['N']?.trim();
  const startDate = parseDate(row['Início']);
  const endDate = parseDate(row['Fim']);
  const totalValue = parseEuroValue(row['Total']);
  const entryValue = parseEuroValue(row[' Entrada ']);
  const installmentValue = parseEuroValue(row[' Valor de Parcela ']);
  const installmentCount = parseInt(row['Parc. (x)']) || 0;
  
  return {
    client_name: clientName,
    contract_number: contractNumber,
    start_date: startDate,
    end_date: endDate,
    total_value: totalValue,
    entry_value: entryValue,
    installment_value: installmentValue,
    installment_count: installmentCount,
    area: row['Área']?.trim() || 'ODONTOLOGIA',
    location: row['Local']?.trim() || 'INSTITUTO',
    method: row['Método']?.trim() || 'DD',
    status: 'active'
  };
}

// Função para importar contratos ativos
async function importContratosAtivos(filePath, limit = 5) {
  console.log(`🚀 Iniciando importação de contratos ativos (limite: ${limit})...`);
  
  const contracts = [];
  let processedCount = 0;
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        if (processedCount >= limit) return;
        
        try {
          const contractData = mapContractData(row);
          
          // Validar dados essenciais
          if (contractData.client_name && contractData.contract_number) {
            contracts.push(contractData);
            processedCount++;
            console.log(`📝 Processado: ${contractData.client_name} - Contrato ${contractData.contract_number}`);
          }
        } catch (error) {
          console.error(`❌ Erro ao processar linha:`, error.message);
        }
      })
      .on('end', async () => {
        console.log(`\n📊 Total de contratos processados: ${contracts.length}`);
        
        // Inserir no banco de dados
        let successCount = 0;
        let errorCount = 0;
        
        for (const contract of contracts) {
          try {
            // Primeiro, verificar se o cliente existe (buscar por first_name e last_name)
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
              // Separar nome em first_name e last_name
              const nameParts = contract.client_name.split(' ');
              const firstName = nameParts[0] || '';
              const lastName = nameParts.slice(1).join(' ') || '';
              
              // Criar cliente se não existir
              const { data: newClient, error: clientError } = await supabase
                .from('clients')
                .insert({
                  first_name: firstName,
                  last_name: lastName,
                  email: `${contract.client_name.toLowerCase().replace(/\s+/g, '.')}@temp.com`,
                  phone: '000000000',
                  country: 'Portugal',
                  status: 'active',
                  notes: `Área: ${contract.area}, Local: ${contract.location}`
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
            }
            
            // Vamos criar um contrato simplificado sem company_id e branch_id por enquanto
            // Primeiro, vamos verificar se a tabela contracts aceita inserção sem esses campos
            console.log(`🔄 Tentando inserir contrato ${contract.contract_number}...`);
            
            // Criar dados básicos do contrato
            const contractData = {
              client_id: clientId,
              contract_number: contract.contract_number,
              product_description: `${contract.area} - ${contract.location}`,
              total_amount: contract.total_value,
              down_payment: contract.entry_value || 0,
              financed_amount: contract.total_value - (contract.entry_value || 0),
              installments: contract.installment_count,
              installment_amount: contract.installment_value,
              start_date: contract.start_date,
              first_due_date: contract.start_date,
              status: 'active',
              payment_method: contract.method === 'DD' ? 'boleto' : 'cartao',
              notes: `Área: ${contract.area}, Local: ${contract.location}, Método: ${contract.method}`
            };
            
            console.log('📋 Dados do contrato:', JSON.stringify(contractData, null, 2));
            
            // Inserir contrato
            const { error: contractError } = await supabase
              .from('contracts')
              .insert(contractData);
            
            if (contractError) {
              console.error(`❌ Erro ao inserir contrato ${contract.contract_number}:`, contractError.message);
              errorCount++;
            } else {
              console.log(`✅ Contrato inserido: ${contract.contract_number}`);
              successCount++;
            }
            
          } catch (error) {
            console.error(`❌ Erro geral no contrato ${contract.contract_number}:`, error.message);
            errorCount++;
          }
        }
        
        console.log(`\n🎉 IMPORTAÇÃO CONCLUÍDA!`);
        console.log(`==================================================`);
        console.log(`✅ Contratos importados com sucesso: ${successCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`==================================================`);
        
        resolve({ success: successCount, errors: errorCount });
      })
      .on('error', (error) => {
        console.error('❌ Erro ao ler arquivo CSV:', error);
        reject(error);
      });
  });
}

// Função principal
async function main() {
  const csvPath = path.join(__dirname, '../../..', 'importBD', 'contratosAtivosFinal - Contratos Ativos.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ Arquivo CSV não encontrado:', csvPath);
    process.exit(1);
  }
  
  try {
    // Começar com apenas 3 registros para teste
    await importContratosAtivos(csvPath, 3);
  } catch (error) {
    console.error('❌ Erro na importação:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { importContratosAtivos, mapContractData };