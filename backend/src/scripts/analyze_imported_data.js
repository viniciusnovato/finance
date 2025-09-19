require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function analyzeData() {
  try {
    console.log('🔍 ANÁLISE DOS DADOS IMPORTADOS');
    console.log('==================================================\n');
    
    // Total de registros
    const { count: totalCount, error: totalError } = await supabase
      .from('clients')
      .select('id', { count: 'exact' });
    
    if (totalError) {
      console.error('❌ Erro ao contar total:', totalError);
      return;
    }
    
    console.log(`📊 Total de registros: ${totalCount}`);
    
    // Contar clientes reais (não começam com CONTRATO_)
    const { count: clientsCount, error: clientsError } = await supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .not('first_name', 'like', 'CONTRATO_%');
    
    if (clientsError) {
      console.error('❌ Erro ao contar clientes:', clientsError);
      return;
    }
    
    // Contar contratos (começam com CONTRATO_)
    const { count: contractsCount, error: contractsError } = await supabase
      .from('clients')
      .select('id', { count: 'exact' })
      .like('first_name', 'CONTRATO_%');
    
    if (contractsError) {
      console.error('❌ Erro ao contar contratos:', contractsError);
      return;
    }
    
    console.log(`👥 Clientes reais: ${clientsCount}`);
    console.log(`📋 Contratos: ${contractsCount}`);
    console.log(`🧮 Verificação: ${clientsCount + contractsCount} = ${totalCount} ✅\n`);
    
    // Análise por país/área
    const { data: countryData, error: countryError } = await supabase
      .from('clients')
      .select('country')
      .like('first_name', 'CONTRATO_%');
    
    if (countryError) {
      console.error('❌ Erro ao analisar áreas:', countryError);
      return;
    }
    
    const areaCount = {};
    countryData.forEach(item => {
      const area = item.country || 'N/A';
      areaCount[area] = (areaCount[area] || 0) + 1;
    });
    
    console.log('📈 DISTRIBUIÇÃO POR ÁREA:');
    Object.entries(areaCount)
      .sort(([,a], [,b]) => b - a)
      .forEach(([area, count]) => {
        console.log(`   ${area}: ${count} contratos`);
      });
    
    console.log('\n');
    
    // Análise de valores (usando campo phone que armazena o valor)
    const { data: valueData, error: valueError } = await supabase
      .from('clients')
      .select('phone, notes')
      .like('first_name', 'CONTRATO_%')
      .limit(5);
    
    if (valueError) {
      console.error('❌ Erro ao analisar valores:', valueError);
      return;
    }
    
    console.log('💰 EXEMPLOS DE VALORES DE CONTRATOS:');
    valueData.forEach((item, i) => {
      const valor = parseFloat(item.phone) || 0;
      const notesMatch = item.notes?.match(/Valor: R\$ ([\d.,]+)/);
      const valorFromNotes = notesMatch ? notesMatch[1] : 'N/A';
      console.log(`   ${i+1}. Valor: R$ ${valor.toFixed(2)} (Notes: R$ ${valorFromNotes})`);
    });
    
    console.log('\n');
    
    // Verificar integridade dos dados
    const { data: integrityData, error: integrityError } = await supabase
      .from('clients')
      .select('first_name, last_name, email, tax_id, notes')
      .like('first_name', 'CONTRATO_%')
      .is('notes', null);
    
    if (integrityError) {
      console.error('❌ Erro ao verificar integridade:', integrityError);
      return;
    }
    
    console.log('🔍 VERIFICAÇÃO DE INTEGRIDADE:');
    console.log(`   Contratos sem notes: ${integrityData.length}`);
    
    if (integrityData.length > 0) {
      console.log('   ⚠️  Alguns contratos podem estar com dados incompletos');
    } else {
      console.log('   ✅ Todos os contratos possuem informações completas');
    }
    
    console.log('\n==================================================');
    console.log('✅ ANÁLISE CONCLUÍDA!');
    
  } catch (error) {
    console.error('❌ Erro na análise:', error.message);
  }
}

analyzeData();