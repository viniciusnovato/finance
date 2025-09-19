require('dotenv').config();
const { supabaseAdmin } = require('./src/config/supabase');

async function checkContracts() {
  try {
    console.log('🔍 Verificando estrutura dos contratos...');
    
    // Buscar alguns contratos para ver a estrutura
    const { data: contracts, error } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Erro ao buscar contratos:', error);
      return;
    }
    
    console.log('Contratos encontrados:', contracts?.length || 0);
    
    if (contracts && contracts.length > 0) {
      console.log('\nPrimeiro contrato (estrutura completa):');
      console.log(JSON.stringify(contracts[0], null, 2));
      
      console.log('\nCampos disponíveis no primeiro contrato:');
      Object.keys(contracts[0]).forEach(key => {
        console.log(`- ${key}: ${contracts[0][key]} (tipo: ${typeof contracts[0][key]})`);
      });
    }
    
    // Verificar se há contratos com valor > 0
    const { data: contractsWithValue, error: valueError } = await supabaseAdmin
      .from('contracts')
      .select('id, value, total_amount')
      .or('value.gt.0,total_amount.gt.0')
      .limit(10);
    
    if (valueError) {
      console.error('Erro ao buscar contratos com valor:', valueError);
    } else {
      console.log('\nContratos com valor > 0:', contractsWithValue?.length || 0);
      if (contractsWithValue && contractsWithValue.length > 0) {
        console.log('Exemplo:', contractsWithValue[0]);
      }
    }
    
    // Contar total de contratos
    const { count, error: countError } = await supabaseAdmin
      .from('contracts')
      .select('*', { count: 'exact' });
    
    if (countError) {
      console.error('Erro ao contar contratos:', countError);
    } else {
      console.log('\nTotal de contratos na base:', count);
    }
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

checkContracts();